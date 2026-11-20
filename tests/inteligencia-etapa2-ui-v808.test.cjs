const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const model=fs.readFileSync('src/shared/inteligencia-etapa2-dados.js','utf8');
const ui=fs.readFileSync('src/intelligence/etapa2.js','utf8');
function mock(){
 const dom=new JSDOM('<!doctype html><html><body><div id="app"><section class="dt393-native"><div class="card">Painel original</div></section></div></body></html>',{url:'https://meudiariotrade.github.io/diario-trader',runScripts:'outside-only'});
 const w=dom.window,hooks=new Map();
 w.TraderUI={onRender:(id,fn)=>hooks.set(id,fn)};
 w.tab='ops';
 w.S={trades:[{id:'1',ativo:'PETR4',tipo:'D',side:'C',entry:10,exit:11,stop:9,qty:10,dt:'2026-11-18T10:00',dtx:'2026-11-18T11:00',rules:'s',setup:'Breakout'}],cart:{lanc:[]}};
 w.isOpen=t=>!t.exit;w.cBRL=()=>({pl:100});w.calc=()=>({r:1});
 w.carSnap=()=>({BR:{pos:[{tk:'PETR4',v:100,cl:'AC'}]},US:{pos:[]}});
 w.fetch=async()=>({ok:true,json:async()=>({eventos:[],desatualizado:false})});
 w.eval(model);w.eval(ui);
 const draw=hooks.get('inteligencia-integrada-v808');
 assert.equal(typeof draw,'function');
 return {w,draw,dom};
}
test('v808: Auditoria n=1 usa trades sem mutar a operação original',()=>{
 const {w,draw,dom}=mock();const before=JSON.stringify(w.S.trades);
 draw();draw();
 const el=w.document.querySelector('[data-intel-etapa2]');
 assert.ok(el);assert.match(el.textContent,/n = 1 operações fechadas/);
 assert.equal(w.document.querySelectorAll('[data-intel-etapa2]').length,1);
 assert.equal(JSON.stringify(w.S.trades),before);
 dom.window.close();
});
test('v808: monta e desmonta somente nas telas existentes',()=>{
 const {w,draw,dom}=mock();draw();
 w.tab='carteiras';draw();assert.match(w.document.querySelector('[data-intel-etapa2]').textContent,/Radar de risco/);
 w.tab='analises';draw();assert.equal(w.document.querySelector('[data-intel-etapa2]'),null);assert.equal(typeof w.DiarioInteligenciaEtapa2.fundamental,'function');
 w.tab='home';draw();assert.equal(w.document.querySelectorAll('[data-intel-etapa2]').length,0);
 dom.window.close();
});
test('v808: Estudos só injeta conteúdo no laboratório eco, sem menu novo',()=>{
 const {w,draw,dom}=mock();
 w.tab='estudos';w.ESV='liv';draw();assert.equal(w.document.querySelectorAll('[data-intel-etapa2]').length,0);
 w.ESV='eco';draw();assert.match(w.document.querySelector('[data-intel-etapa2]').textContent,/Estudos/);
 assert.equal(w.document.querySelectorAll('nav [data-dt393-route]').length,0);
 dom.window.close();
});
test('v808: sem polling ou consulta direta ao Supabase, HTML e Worker cacheados',()=>{
 const h=fs.readFileSync('src/index.html','utf8');
 const sw=fs.readFileSync('src/service-worker.js','utf8');
 assert.match(h,/src\/shared\/inteligencia-etapa2-dados\.js/);
 assert.match(h,/src\/intelligence\/etapa2\.js/);
 assert.match(sw,/src\/intelligence\/etapa2\.js/);
 assert.doesNotMatch(ui,/setInterval\s*\(/);
 assert.doesNotMatch(ui,/\/rest\/v1\//);
 assert.equal(JSON.parse(fs.readFileSync('release.config.json','utf8')).version>=808,true);
});
