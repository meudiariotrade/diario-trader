const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const core = fs.readFileSync("src/domains/core/05-mercado-e-noticias.js","utf8");
const ops = fs.readFileSync("src/domains/core/09-operacoes-e-estudos.js","utf8");
const rot = fs.readFileSync("src/domains/core/16-rotina-e-disciplina.js","utf8");
const entry = fs.readFileSync("src/domains/core/03-render-e-operacoes.js","utf8");
const view = fs.readFileSync("src/domains/layers/03-apresentacao.js","utf8");
function block(source,from,to) {
  const a=source.indexOf(from),b=source.indexOf(to,a);
  assert.ok(a>=0&&b>a,"funções encontradas: "+from);
  return source.slice(a,b);
}
const engine=vm.runInNewContext(block(core,"function numN(e) {","function diasMais(e, t) {")+
  "\n({ numN, precoManual789, calc })");
test("v789: WIN manual interpreta milhar, não decimal; nunca arredonda tick",()=>{
  assert.equal(engine.precoManual789("168.880","WINZ26").numero,168880);
  assert.equal(engine.precoManual789("168,880","WINZ26").numero,168880);
  assert.equal(engine.precoManual789("168881","WINZ26").ok,false);
  assert.equal(engine.precoManual789("168,881","WINZ26").ok,false);
  assert.equal(engine.precoManual789("168,807","WINZ26").ok,false);
  assert.equal(engine.precoManual789("0,2","WINZ26").ok,false);
});
test("v789: WIN comprado 3 contratos, risco e resultado utilizam pontos reais",()=>{
  const t={ativo:"WINZ26",side:"C",entry:"168880",stop:"168805",exit:"169055",qty:3,pv:0.2,cost:0};
  const c=engine.calc(t);
  assert.ok(Math.abs(c.risk-45)<1e-8);
  assert.ok(Math.abs(c.pl-105)<1e-8);
  assert.ok(Math.abs(c.r-105/45)<1e-9);
  const invalido=engine.calc({...t,entry:"168,881"});
  assert.equal(invalido.invalidPrice,true);assert.equal(invalido.pl,null);
});
test("v789: WDO usa tick 0,5, aceita decimal claro e rejeita ambiguidade",()=>{
  assert.equal(engine.precoManual789("5.500,5","WDOZ26").numero,5500.5);
  assert.equal(engine.precoManual789("5500.5","WDOZ26").numero,5500.5);
  assert.equal(engine.precoManual789("5,500","WDOZ26").ok,false);
  assert.equal(engine.precoManual789("5500,25","WDOZ26").ok,false);
});
test("v789: sugestão de contratos respeita risco real de 1%",()=>{
  const js=block(ops,"function qtdSugerida(e) {","function qtdHtml(e) {");
  const context={numN:engine.numN,precoManual789:engine.precoManual789,capRef:()=>3000,gv:()=>1,Math,Number,String};
  const fn=vm.runInNewContext(js+"\nqtdSugerida",context);
  const base={tipo:"D",ativo:"WINZ26",entry:"168880",stop:"168805",pv:0.2};
  assert.equal(fn(base).q,2);
  assert.ok(fn({...base,entry:"168,881"}).invalido);
});
test("v789: preparo exige campos concretos, não apenas checks antigos",()=>{
  const fn=vm.runInNewContext(block(rot,"function preparacaoPendente789(d) {","function planoPreparacao789(e) {")+"\npreparacaoPendente789");
  const good={estado:4,metaDia:300,maxP:150,pl2:{max:3,mods:["dt"]},cl:{p_stop:true}};
  assert.equal(fn(good).length,0);
  assert.ok(fn({...good,metaDia:""}).includes("meta do dia (R$)"));
  assert.ok(fn({...good,pl2:{max:3,mods:[]}}).includes("foco operacional"));
});
test("v789: pós-pregão reabre após novo trade ou pendência",()=>{
  const post=vm.runInNewContext(block(rot,"function gateEstado158(hour) {","function gateManhaHtml(e) {")+"\ngateEstado158",
    {S:{days:{"2026-11-19":{posop:1000}}},GATE_D:()=> "2026-11-19",
     gateHoje:()=> [{u:1500,dt:"2026-11-19T09:30",entry:168880,stop:168805,exit:169055,pin:"img1",pout:"img2",rules:"s"}],
     numN:engine.numN,calc:engine.calc,Number,String,Date});
  assert.equal(post(18).tipo,"tarde");
  assert.equal(post(18).falta.length,0);
});
test("v789: captura manual e exportação não dão como comprovado o que não foi avaliado",()=>{
  assert.match(entry,/emo: "",\s*rules: ""/);
  assert.match(entry,/data-a="savetrade"/);
  assert.match(rot,/xlsAba\("Revisao por trade", checklistTradeLinhas789\(\)\)/);
  assert.match(rot,/arquivo não verificado/);
  assert.match(view,/planoIntegrado789\(t, e\)/);
  assert.match(view,/data-v789-action="complete"/);
});
