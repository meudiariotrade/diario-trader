const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const acorn = require('acorn');
const {IDBFactory} = require('fake-indexeddb');

function functions(file, names) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = acorn.parse(source, {ecmaVersion: 'latest'});
  return names.map(name => {
    const node = ast.body.find(n => n.type === 'FunctionDeclaration' && n.id.name === name);
    assert.ok(node, name);
    return source.slice(node.start, node.end);
  }).join('\n');
}
const runtime = functions('src/domains/core/02-estado-e-persistencia.js', ['persistNow', 'localSaveFailed']) + '\n' +
  functions('src/domains/core/06-risco-e-tecnico.js', ['pfTrade', 'pfJaTem', 'profitImporta']);
const row = (extra = {}) => ({id:'row-1',id_externo:'external-1',ativo:'WINZ26',lado:'C',
  preco_entrada:130000,preco_saida:130100,qtd:2,abertura:'2026-11-17T13:00:00Z',
  fechamento:'2026-11-17T13:05:00Z',custos:1,...extra});
const read = db => new Promise((resolve,reject) => {
  const tx = db.transaction('kv','readonly'), request = tx.objectStore('kv').get('s');
  tx.oncomplete = () => resolve(request.result);
  tx.onabort = () => reject(tx.error);
});
async function app(rows = [row()], options = {}) {
  const db = await new Promise((resolve,reject) => {
    const request = new IDBFactory().open('test',1);
    request.onupgradeneeded = () => request.result.createObjectStore('kv');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const patches = [], messages = [];
  let id = 0;
  const c = {
    S:{uid:'user-a',trades:[]},SESS:{uid:'user-a'},db,
    PFX:{busy:0,off:0,n:0},LOCAL_SAVE:{revision:0,committed:0,pending:false,error:''},
    st:null,tab:'inicio',window:{},cfg:()=>({}),render(){},svUi(){},limiteConfere(){},
    uid:()=>`local-${++id}`,pvDe:()=>0.2,brLocal:d=>new Date(d).toISOString().slice(0,16),
    FUT:/^WIN/,OPT:/^never$/,ls:{set(){}},clearTimeout(){},setTimeout(){},
    toast:message=>messages.push(message),
    save(){ c.LOCAL_SAVE.revision++; c.LOCAL_SAVE.pending=true; },
    async rq(url, init) {
      if (!init) {
        if (options.beforeResponse) options.beforeResponse(c);
        return {json:async()=>rows};
      }
      // A confirmação remota só pode ocorrer após uma transação local concluída.
      const committed = await read(db);
      assert.ok(committed, 'não confirme operações antes de gravar o diário');
      patches.push({url,committed});
      if (options.patchError) throw new Error('Rede indisponível');
      return {};
    },
  };
  c.window.toast = c.toast;
  vm.createContext(c); vm.runInContext(runtime,c);
  return {c,db,patches,messages};
}

test('Profit confirma somente depois do commit e repetir não duplica',async()=>{
  const {c,db,patches}=await app();
  await c.profitImporta(true);
  assert.equal(patches.length,1);
  assert.equal(patches[0].committed.trades.length,1);
  assert.equal(patches[0].committed.trades[0].ext,'profit:external-1');
  await c.profitImporta(true);
  assert.equal(c.S.trades.length,1);
  assert.equal(patches.length,2);
  assert.equal(c.PFX.err,''); db.close();
});
test('falta de espaço não confirma; retomar salva a mesma operação uma única vez',async()=>{
  const {c,db,patches,messages}=await app();
  c.db={transaction(){throw Object.assign(new Error('quota'),{name:'QuotaExceededError'});}};
  await c.profitImporta(true);
  assert.equal(patches.length,0);
  assert.match(c.PFX.err,/continua pendente/);
  assert.equal(c.S.trades.length,1);
  assert.ok(!messages.some(m=>/importada\(s\) do Profit/.test(m)));
  c.db=db; await c.profitImporta(true);
  assert.equal(c.S.trades.length,1);
  assert.equal(patches.length,1);
  assert.equal((await read(db)).trades.length,1); db.close();
});
test('transação abortada não resolve como salva nem confirma no servidor',async()=>{
  const {c,db,patches}=await app();
  c.db={transaction(...args){const tx=db.transaction(...args);tx.abort();return tx;}};
  await c.profitImporta(true);
  assert.equal(patches.length,0);
  assert.match(c.PFX.err,/continua pendente/);
  assert.equal(await read(db),undefined); db.close();
});
test('trocar de conta durante a consulta não importa na sessão nova',async()=>{
  const {c,db,patches}=await app([row()],{beforeResponse(c){c.SESS={uid:'user-b'};c.S={uid:'user-b',trades:[]};}});
  await c.profitImporta(true);
  assert.equal(c.S.trades.length,0);
  assert.equal(patches.length,0);
  assert.match(c.PFX.err,/mudou/); assert.equal(c.PFX.busy,0); db.close();
});
test('linhas inválidas ficam pendentes e somente a linha válida é confirmada',async()=>{
  const bad=[row({id:'bad-price',preco_entrada:null}),row({id:'bad-qty',qtd:0}),
    row({id:'bad-date',abertura:'invalid'}),row({id:'bad-side',lado:'X'})];
  const {c,db,patches}=await app([...bad,row()]);
  await c.profitImporta(true);
  assert.equal(c.S.trades.length,1);
  assert.equal(patches.length,1);
  assert.match(patches[0].url,/id=in\.\(row-1\)/);
  assert.match(c.PFX.err,/4 operação/); db.close();
});
test('falha na confirmação remota mantém cópia local e permite retomar',async()=>{
  const options={patchError:true};
  const {c,db,patches}=await app([row()],options);
  await c.profitImporta(true);
  assert.equal((await read(db)).trades.length,1);
  assert.match(c.PFX.err,/Rede indisponível/);
  options.patchError=false; await c.profitImporta(true);
  assert.equal(c.S.trades.length,1);
  assert.equal(patches.length,2); assert.equal(c.PFX.err,''); db.close();
});
test('trade manual próximo com preço diferente não é descartado como duplicado',async()=>{
  const {c,db}=await app();
  const manual=c.pfTrade(row()); manual.id='manual';manual.orig='manual';manual.entry='129990';delete manual.ext;
  c.S.trades.push(manual); await c.profitImporta(true);
  assert.equal(c.S.trades.length,2); db.close();
});
test('cópia manual com mesmos preços, lado, quantidade e minuto não duplica',async()=>{
  const {c,db,patches}=await app();
  const manual=c.pfTrade(row()); manual.id='manual';manual.orig='manual';delete manual.ext;
  c.S.trades.push(manual); await c.profitImporta(true);
  assert.equal(c.S.trades.length,1); assert.equal(patches.length,1); db.close();
});

const csvRuntime = functions('src/domains/core/02-estado-e-persistencia.js', ['impBuild']);
for (const [ativo,pv] of [['WINZ26',0.2],['WDOZ26',10],['DOLZ26',50],['INDZ26',1]]) {
  test(`CSV e ponte usam o mesmo valor por ponto em ${ativo}, incluindo venda e custos`,async()=>{
    for (const side of ['C','V']) {
      const {c,db}=await app();
      Object.assign(c,{
        IM:{cfg:{cost:1},orders:[],trs:[{a:ativo,side,t0:new Date('2026-11-17T13:00:00Z'),t1:new Date('2026-11-17T13:01:00Z'),op:[[5000,2]],cl:[[5001,2]]}]},
        sum:a=>a.reduce((n,x)=>n+x,0),impEp:()=>5000,impKind:()=> 'D',impStop:()=>4900,
        hs:()=> 'id',isoL:d=>d.toISOString().slice(0,16),pvDe:a=>a.startsWith('DOL')?50:a.startsWith('WDO')?10:a.startsWith('WIN')?0.2:1,
      });
      vm.runInContext(csvRuntime,c);
      const fromCsv=c.impBuild()[0],fromBridge=c.pfTrade(row({ativo,lado:side,preco_entrada:5000,preco_saida:5001}));
      assert.equal(fromCsv.t.pv,pv);
      assert.equal(Number(fromBridge.pv),pv);
      assert.equal(fromCsv.pl, (side==='C'?1:-1)*2*pv-2);
      db.close();
    }
  });
}
