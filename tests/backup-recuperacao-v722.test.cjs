const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const {IDBFactory}=require('fake-indexeddb');
const source=fs.readFileSync('src/domains/core/01-runtime-estilos.js','utf8');
const marker='(function (w) {\n      "use strict";\n      const f = (t) => JSON.parse(JSON.stringify(t))';
const start=source.indexOf(marker), end=source.indexOf('})(typeof window > "u" ? globalThis : window)',start);
assert.ok(start>=0 && end>start);
const runtime=source.slice(start,end)+'})(globalThis);';
class Reader {
  readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result=`data:${blob.type};base64,${Buffer.from(b).toString('base64')}`;this.onload();},()=>this.onerror());}
}
async function app() {
  const db=await new Promise(resolve=>{
    const r=new IDBFactory().open('backup',1);
    r.onupgradeneeded=()=>{r.result.createObjectStore('kv');r.result.createObjectStore('img');};
    r.onsuccess=()=>resolve(r.result);
  });
  const exports=[],messages=[];
  const c={S:{uid:'owner',trades:[],days:{},cart:{lanc:[]}},SESS:{uid:'owner'},db,crypto:webcrypto,
    TextEncoder,Blob,FileReader:Reader,atob,st:null,M:{},LOCAL_SAVE:{pending:false},
    diarioDaysCanonical:()=>c.S.days,loc:()=> '2026-11-17',save(){},clearTimeout(){},
    async saveFile(name,text){exports.push(JSON.parse(text));},toast:m=>messages.push(m),alert:m=>messages.push(m),
  };
  c.window=c; vm.createContext(c);vm.runInContext(runtime,c);
  const put=(store,value,key)=>new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value,key);
    tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
  });
  const read=(store,key)=>new Promise(resolve=>{const tx=db.transaction(store);const r=tx.objectStore(store).get(key);tx.oncomplete=()=>resolve(r.result);});
  const file=value=>({size:Buffer.byteLength(JSON.stringify(value)),text:async()=>JSON.stringify(value)});
  return {c,db,exports,messages,put,read,file};
}
test('exportar e restaurar diário, operações, carteira e fotos em aparelho limpo',async()=>{
  const a=await app();
  a.c.S.trades=[{id:'trade',u:1,pin:'photo',entry:100,exit:110}];
  a.c.S.days={'2026-11-17':{plano:'seguir o plano'}};
  a.c.S.cart.lanc=[{id:'mov',u:1,valor:200}];
  await a.put('img',new Blob(['foto'],{type:'image/png'}),'photo');
  await a.c.TraderBackup.exportBackup();assert.equal(a.exports.length,1);
  const b=await app();
  const result=await b.c.TraderBackup.restoreBackup(b.file(a.exports[0]));
  assert.match(result,/Backup restaurado/);
  assert.equal(b.c.S.trades[0].entry,100);
  assert.equal(b.c.S.days['2026-11-17'].plano,'seguir o plano');
  assert.equal(b.c.S.cart.lanc[0].valor,200);
  assert.equal(await (await b.read('img','photo')).text(),'foto');
  assert.equal((await b.read('kv','s')).trades.length,1);
  // Repetição mescla os mesmos identificadores, sem duplicar.
  await b.c.TraderBackup.restoreBackup(b.file(a.exports[0]));
  assert.equal(b.c.S.trades.length,1);assert.equal(b.c.S.cart.lanc.length,1);
  a.db.close();b.db.close();
});
test('corrupção de conteúdo com checksum não modifica os registros existentes',async()=>{
  const a=await app();a.c.S.trades=[{id:'trade',u:1,entry:100}];
  await a.c.TraderBackup.exportBackup();
  a.exports[0].S.trades[0].entry=999;
  const before=JSON.stringify(a.c.S);
  const result=await a.c.TraderBackup.restoreBackup(a.file(a.exports[0]));
  assert.match(result,/integridade falhou/);assert.equal(JSON.stringify(a.c.S),before);a.db.close();
});
test('exportação sem foto referenciada falha sem produzir backup incompleto',async()=>{
  const a=await app();a.c.S.trades=[{id:'trade',pin:'missing'}];
  await a.c.TraderBackup.exportBackup();
  assert.equal(a.exports.length,0);assert.match(a.messages[0],/Anexo não encontrado/);a.db.close();
});
test('restauração sem anexo ou com JSON inválido preserva os dados locais',async()=>{
  const a=await app();const before=JSON.stringify(a.c.S);
  let result=await a.c.TraderBackup.restoreBackup(a.file({v:1,S:{trades:[{id:'trade',pin:'missing'}]}}));
  assert.match(result,/anexo ausente/);assert.equal(JSON.stringify(a.c.S),before);
  result=await a.c.TraderBackup.restoreBackup({size:1,text:async()=>'{'});
  assert.match(result,/JSON inválido/);assert.equal(JSON.stringify(a.c.S),before);a.db.close();
});
test('falha ao gravar restauração não aplica estado parcial em memória',async()=>{
  const a=await app(),before=JSON.stringify(a.c.S);
  a.c.db={transaction(...args){if(args[1]==='readwrite')throw new Error('Sem espaço');return a.db.transaction(...args);}};
  const result=await a.c.TraderBackup.restoreBackup(a.file({v:1,S:{trades:[{id:'trade',u:1}]}}));
  assert.match(result,/Backup não restaurado/);assert.equal(JSON.stringify(a.c.S),before);
  assert.equal(await a.read('kv','s'),undefined);a.db.close();
});
