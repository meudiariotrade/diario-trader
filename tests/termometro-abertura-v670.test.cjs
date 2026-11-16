const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {JSDOM}=require("jsdom");
const code=fs.readFileSync(path.resolve(__dirname,"../src/market/termometro-abertura-v670.js"),"utf8");
function page(){
 const dom=new JSDOM('<div id="app"><div class="dt393-page dt393-home"><section class="dt393-summary"></section></div></div>',{url:"https://example.test/",runScripts:"dangerously",pretendToBeVisual:true});
 const w=dom.window;
 w.tab="home";
 w.MKT={tab:"cq"};
 w.eval(code);
 return w;
}
test("v670: pesos calculados exatamente sem arredondamento intermediário",()=>{
 const w=page();
 const x=w.TermometroAbertura670.calcular({ewz:1.2,spf:.8,wti:-.4,dxy:.4,zar:.8,mxn:.2,winBase:130000,wdoBase:5400});
 assert.ok(Math.abs(x.winPct-.82)<1e-10);
 assert.ok(Math.abs(x.wdoPct-.115)<1e-10);
 assert.ok(Math.abs(x.winProjetado-131066)<1e-8);
 assert.ok(Math.abs(x.winDelta-1066)<1e-8);
 assert.ok(Math.abs(x.wdoProjetado-5406.21)<1e-8);
 w.close();
});
test("v670: não projeta WIN ou WDO sem os proxies ou fechamentos obrigatórios",()=>{
 const w=page(), f=w.TermometroAbertura670.calcular({ewz:1.2,spf:.8,wti:-.4,dxy:.4,zar:.8,mxn:null,winBase:130000,wdoBase:5400});
 assert.ok(Math.abs(f.winPct-.82)<1e-10);
 assert.equal(f.wdoPct,null);
 assert.equal(f.wdoProjetado,null);
 const empty=w.TermometroAbertura670.calcular({ewz:null,spf:.8,wti:-.4,dxy:.4,zar:.8,mxn:.2,winBase:130000,wdoBase:5400});
 assert.equal(empty.winProjetado,null);
 assert.equal(empty.wdoProjetado,null);
 w.close();
});
test("v670: lê USD/MXN e USD/ZAR da cesta carregada; não confunde S&P à vista com futuro",()=>{
 const w=page();
 w.M606={ts:Date.now(),v:{em:new Date().toISOString(),terminal:[{k:"WTI",d1:-.4},{k:"DXY",d1:.4}],emergentes:{itens:[{k:"USD/MXN",d1:.2},{k:"USD/ZAR",d1:.8}]}}};
 w.CQ={d:{idx:{itens:[{c:"S&P 500",s:"SP:SPX",d1:4}]}},ts:{idx:Date.now()}};
 const x=w.TermometroAbertura670.capturar();
 assert.equal(x.spf,null);
 assert.equal(x.wti,-.4);
 assert.equal(x.dxy,.4);
 assert.equal(x.zar,.8);
 assert.equal(x.mxn,.2);
 w.close();
});
test("v670: monta somente uma instância na aba ativa sem modificar as demais telas",()=>{
 const w=page();
 w.TermometroAbertura670.montar();
 w.TermometroAbertura670.montar();
 assert.equal(w.document.querySelectorAll("#app .dt670-opening").length,1);
 assert.equal(w.document.querySelector(".dt393-summary").nextElementSibling.className,"dt670-opening");
 assert.match(w.document.querySelector(".dt670-opening").textContent,/Dados insuficientes/);
 w.tab="conta";w.document.getElementById("app").innerHTML='<div class="conta">Conta intacta</div>';
 w.TermometroAbertura670.montar();
 assert.equal(w.document.querySelectorAll(".dt670-opening").length,0);
 w.close();
});
test("v670: abertura é inserida no topo de Mercado e do Meu dia",()=>{
 const w=page();
 w.tab="mercado";w.document.getElementById("app").innerHTML='<div class="dt395-native-mercado"><div class="m403-section-header">Mercado</div><section>Conteúdo existente</section></div>';
 w.TermometroAbertura670.montar();
 assert.equal(w.document.querySelector(".m403-section-header").nextElementSibling.className,"dt670-opening");
 w.tab="dia";w.document.getElementById("app").innerHTML='<div class="dt393-page dt393-day"><section>Plano existente</section></div>';
 w.TermometroAbertura670.montar();
 assert.equal(w.document.querySelector(".dt393-day").firstElementChild.className,"dt670-opening");
 w.close();
});
