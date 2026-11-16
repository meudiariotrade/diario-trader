const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {JSDOM}=require("jsdom");
const src=fs.readFileSync(path.resolve(__dirname,"../src/domains/layers/03-apresentacao.js"),"utf8");
const marker="/* v598 — Calculadora de tamanho de posição";
assert.ok(src.includes(marker),"calculadora localizada");
function setup(){
 const dom=new JSDOM('<div id="app"></div>',{url:"https://test.local",runScripts:"dangerously"});
 const w=dom.window;
 w.TRM={EXT:{CALC:{}}};
 w.DiarioRisco={hoje:()=>({disponivel:1000,limite:2000})};
 w.eval(src.slice(src.indexOf(marker)));
 return w;
}
test("v672: WIN comprado 2R/3R, lote e lucro em R$",()=>{
 const w=setup(),r=w.CalcPosicao.tamanho672({ativo:"WIN",lado:"C",risco:1000,modo:"preco",entrada:130000,stop:129900});
 assert.equal(r.qtd,50);assert.equal(r.dist,100);assert.equal(r.alvo2.preco,130200);
 assert.equal(r.alvo2.lucro,2000);assert.equal(r.alvo3.preco,130300);assert.equal(r.alvo3.lucro,3000);
 w.close();
});
test("v672: WDO vendido, alvos abaixo da entrada",()=>{
 const w=setup(),r=w.CalcPosicao.tamanho672({ativo:"WDO",lado:"V",risco:1000,modo:"preco",entrada:5500,stop:5505});
 assert.equal(r.qtd,20);assert.equal(r.alvo2.preco,5490);assert.equal(r.alvo2.lucro,2000);
 assert.equal(r.alvo3.preco,5485);assert.equal(r.alvo3.lucro,3000);assert.equal(r.ladoInvalido,false);
 w.close();
});
test("v672: Modo Direto em pontos/R$ e ações",()=>{
 const w=setup();
 const a=w.CalcPosicao.tamanho672({ativo:"WIN",risco:500,modo:"direto",stopDireto:75,unidade:"pontos",entrada:130000});
 assert.equal(a.qtd,33);assert.equal(a.alvo2.lucro,990);
 const b=w.CalcPosicao.tamanho672({ativo:"WDO",risco:1000,modo:"direto",stopDireto:50,unidade:"reais",entrada:5500});
 assert.equal(b.qtd,20);assert.equal(b.dist,5);
 const c=w.CalcPosicao.tamanho672({ativo:"ACAO",risco:200,modo:"preco",entrada:25,stop:24});
 assert.equal(c.qtd,200);assert.equal(c.alvo3.preco,28);assert.equal(c.alvo3.lucro,600);
 w.close();
});
test("v672: parcial comprada WIN mantém médio contábil e calcula risco zero",()=>{
 const w=setup(),r=w.CalcPosicao.parcial672({ativo:"WIN",lado:"C",total:10,entrada:130000,parcial:4,saida:130200});
 assert.equal(r.realizado,160);assert.equal(r.restante,6);assert.equal(r.medioOriginal,130000);
 assert.ok(Math.abs(r.medioAjustado-129866.666666667)<1e-4);assert.equal(r.executavel,129870);
 w.close();
});
test("v672: parcial vendida WDO, fechamento total e validação de quantidade",()=>{
 const w=setup(),r=w.CalcPosicao.parcial672({ativo:"WDO",lado:"V",total:10,entrada:5500,parcial:4,saida:5490});
 assert.equal(r.realizado,400);assert.equal(r.restante,6);
 assert.ok(Math.abs(r.riscoZero-5506.666666667)<1e-4);assert.equal(r.executavel,5506.5);
 const all=w.CalcPosicao.parcial672({ativo:"ACAO",lado:"C",total:50,entrada:20,parcial:50,saida:22});
 assert.equal(all.realizado,100);assert.equal(all.restante,0);assert.equal(all.riscoZero,null);
 assert.match(w.CalcPosicao.parcial672({ativo:"WIN",lado:"C",total:2,entrada:10,parcial:3,saida:15}).erro,/parcial deve/);
 w.close();
});
test("v672: abas internas e modos só em Operações, Terminal preservado",()=>{
 const w=setup(),novo=w.CalcPosicao.html("operacoes"),antigo=w.CalcPosicao.html("terminal");
 assert.match(novo,/data-c672-tab="parcial"/);assert.match(novo,/data-c672-tab="tamanho"/);
 assert.ok(!antigo.includes("v672-tabs"));
 const root=w.document.getElementById("app");root.innerHTML=novo;
 const f=root.querySelector("form");
 root.querySelector('[data-c672-tab="parcial"]').click();
 assert.equal(root.querySelector('[data-c672-pane="parcial"]').hidden,false);
 assert.equal(root.querySelector('[data-c672-pane="tamanho"]').hidden,true);
 root.querySelector('[data-c672-tab="tamanho"]').click();
 root.querySelector('[data-c672-modo="direto"]').click();
 assert.equal(f.dataset.c672Modo,"direto");
 assert.equal(root.querySelector('[data-c672-field="direto"]').hidden,false);
 assert.equal(root.querySelector('[data-c672-field="preco"]').hidden,true);
 w.close();
});
