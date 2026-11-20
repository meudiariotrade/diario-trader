const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/domains/layers/03-apresentacao.js','utf8');
const a=source.indexOf('    function v810Operacoes(dia,fechadas) {');
const z=source.indexOf('    function Ft() {',a);
assert.ok(a>0&&z>a,'Resumo v810 localizado nas fontes atuais');
function render(trades,date='2026-11-19'){
 const context={
   ct:()=>trades,
   Jt:()=>trades.filter(t=>t.open),
   nt:t=>String(t.dtx||t.dt||'').slice(0,10),
   Gt:t=>Boolean(t.open),
   isOpen:t=>Boolean(t.open),
   R:t=>t.pnl??null,
   f:(cb,fallback)=>{try{return cb();}catch{return fallback;}},
   lt:(list,fn)=>list.reduce((sum,t)=>sum+(fn(t)||0),0),
   j:n=>'R$ '+Number(n).toLocaleString('pt-BR',{minimumFractionDigits:2}),
   L:n=>n>0?'positivo':n<0?'negativo':'',
   _: (n,d=2)=>Number(n).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}),
   b:x=>String(x||''),
   p:()=>'',Number,String,Date
 };
 const fn=vm.runInNewContext(source.slice(a,z)+'\nv810Operacoes',context);
 return fn(date,[]);
}
test('v810: operação aberta do dia anterior não vira resultado realizado nem desaparece',()=>{
 const result=render([
   {id:'a',ativo:'WINZ26',dt:'2026-11-18',open:true,exit:'',pnl:5000},
   {id:'c',ativo:'PETR4',dt:'2026-11-19',open:false,exit:21,pnl:200},
   {id:'i',ativo:'VALE3',dt:'2026-11-19',open:false,exit:25,pnl:null}
 ]);
 assert.match(result,/Encerradas<\/small><strong>2/);
 assert.match(result,/Abertas agora<\/small><strong>1/);
 assert.match(result,/Dados insuficientes/);
 assert.match(result,/Sem resultado realizado/);
 assert.doesNotMatch(result,/R\$ 5\.000/);
 assert.match(result,/PETR4/);
 assert.match(result,/VALE3/);
 assert.match(result,/WINZ26/);
});
test('v810: taxa de acerto é por trade fechado válido; nenhum preço ou capital inventado',()=>{
 const result=render([
   {id:'c1',ativo:'PETR4',dt:'2026-11-19',open:false,exit:40,pnl:240},
   {id:'c2',ativo:'VALE3',dt:'2026-11-19',open:false,exit:30,pnl:-100}
 ]);
 assert.match(result,/Resultado realizado<\/small><strong class="positivo">R\$ 140,00/);
 assert.match(result,/Taxa de acerto<\/small><strong>50,0%/);
 assert.match(result,/Encerradas<\/small><strong>2/);
 assert.match(result,/Abertas agora<\/small><strong>0/);
 assert.doesNotMatch(result,/Dados insuficientes/);
});
