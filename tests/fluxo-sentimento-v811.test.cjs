const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const sandbox={Intl,Date,Set,Map,Object,Number,String,Math,Array,JSON};vm.createContext(sandbox);
for(const f of ['sessoes-mercado','interpretacao-sessao'])vm.runInContext(fs.readFileSync('src/shared/'+f+'.js','utf8'),sandbox);
const S=sandbox.DiarioSessoes,I=sandbox.DiarioInterpretacao;
function dias(n,from='2026-11-19'){const out=[];let d=from;while(out.length<n){out.push(d);d=S.adjacent('B3',d,-1);}return out;}
test('fluxo × índice: saídas com índice em alta = divergência; mesmas datas exigidas',()=>{
  const ds=dias(22);
  const rows=ds.slice(0,21).map(d=>({d,est:-300}));
  const closes=ds.map((d,i)=>({d,c:120000*(1+0.002*(ds.length-i))}));
  const r=JSON.parse(JSON.stringify(I.flowDivergence(rows,closes,'BOVA11')));
  assert.equal(r.classification,'divergencia');
  assert.equal(r.windows.map(w=>w.k).join(','),'5,10,20');
  assert.ok(r.windows[2].ret>0&&r.windows[2].flow<0);
  assert.match(r.text,/apesar das saídas/);
  assert.match(r.text,/não indica direção futura/);
});
test('fluxo × índice: mesmo sentido = convergência; sem datas casadas = amostra insuficiente',()=>{
  const ds=dias(22);
  const rows=ds.slice(0,21).map(d=>({d,est:400}));
  const closes=ds.map((d,i)=>({d,c:120000*(1+0.003*(ds.length-i))}));
  assert.equal(I.flowDivergence(rows,closes).classification,'convergencia');
  const deslocado=closes.map(x=>({d:S.adjacent('B3',x.d,-1)||x.d,c:x.c}));
  assert.equal(I.flowDivergence(rows.slice(0,3),deslocado).classification,'amostra_insuficiente');
});
test('fluxo × índice: variação pequena não vira divergência',()=>{
  const ds=dias(22);
  const rows=ds.slice(0,21).map(d=>({d,est:-300}));
  const closes=ds.map((d)=>({d,c:120000}));
  assert.equal(I.flowDivergence(rows,closes).classification,'neutro');
});
test('sentimento: aceleração usa só leituras consecutivas da mesma metodologia',()=>{
  const m='b3:metodo';
  const r=I.sentiment({date:'2026-11-19',value:18},[{date:'2026-11-18',value:13,method:m},{date:'2026-11-17',value:12,method:m}],m);
  assert.equal(r.daily,5);assert.equal(r.accel,4);assert.match(r.accelText,/ganhou ritmo/);
  const s=I.sentiment({date:'2026-11-19',value:18},[{date:'2026-11-18',value:13,method:m},{date:'2026-11-17',value:12,method:'outra'}],m);
  assert.equal(s.accel,null);assert.match(s.accelText,/não calculável/);
});
test('curadoria: loterias, horóscopo, publieditorial e esporte fora; mercado fica',()=>{
  for(const t of ['Resultado da Mega-Sena de hoje','Lotofácil 3250: confira','Horóscopo do dia','Conteúdo patrocinado: invista já','Brasileirão: resultado da rodada'])assert.equal(I.isNoise(t),true,t);
  for(const t of ['Petrobras anuncia dividendos','Copom mantém Selic','Vale publica fato relevante','Minério de ferro sobe na China'])assert.equal(I.isNoise(t),false,t);
});
