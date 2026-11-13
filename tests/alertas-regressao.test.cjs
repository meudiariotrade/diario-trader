const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const acorn=require('acorn');
const {JSDOM}=require('jsdom');
function layer(file,marker){const source=fs.readFileSync(file,'utf8');const node=acorn.parse(source,{ecmaVersion:'latest'}).body.find(n=>n.type==='TryStatement'&&source.slice(n.start,n.end).includes(marker));assert.ok(node,marker);return source.slice(node.start,node.end)}
function app(){return new JSDOM('<div id="dt393-global-head"><h1 class="dt393-title">Mercado</h1></div><div id="app"><div class="dt395-native-mercado"><section class="m355-settings-head">Alertas</section></div></div>',{url:'https://app.test/',runScripts:'dangerously',pretendToBeVisual:true})}
test('Alertas: renderização direta e restaurada nunca redireciona para outra aba',async()=>{
 const dom=app(),w=dom.window,intervals=[];let renders=0;
 try{Object.assign(w,{tab:'mercado',MKT:{tab:'al'},S:{ax:{}},ls:{set(){}},render0(){},render(){renders++},toast(){},setInterval(fn,ms){intervals.push({fn,ms});return intervals.length},clearInterval(){}});
 w.localStorage.setItem('v512-mkt-ant',JSON.stringify('cq'));
 w.eval(layer('src/domains/layers/04-design-e-navegacao.js','m.DIARIO_V512 ='));
 intervals.find(x=>x.ms===700).fn();
 await new Promise(r=>setTimeout(r,130));
 assert.equal(w.MKT.tab,'al');assert.equal(renders,0);
 assert.equal(w.document.querySelector('.dt393-title').textContent,'Configurações');
 // Atualizações de tela e saída/retorno também não dependem de um clique anterior.
 w.tab='home';w.render0();await new Promise(r=>setTimeout(r,130));
 w.tab='mercado';w.MKT.tab='al';w.render0();await new Promise(r=>setTimeout(r,130));
 assert.equal(w.MKT.tab,'al');assert.equal(renders,0);
 }finally{dom.window.close()}
});
test('Alertas: cabeçalho de Mercado não é montado em Configurações',()=>{
 const dom=app(),w=dom.window;let decorate;
 try{Object.assign(w,{tab:'mercado',MKT:{tab:'al'},TraderUI:{onRender(name,fn){decorate=fn}}});
 w.eval(layer('src/domains/layers/02-carteira-e-terminal.js','"mercado-v403"'));
 decorate();
 assert.equal(w.document.querySelector('.m403-primary-tabs'),null);
 // A mesma função ainda monta o menu completo ao navegar para uma aba de Mercado.
 w.MKT.tab='ag';decorate();assert.ok(w.document.querySelector('[data-navroute="mercado:ag"]'));
 w.MKT.tab='al';decorate();assert.equal(w.document.querySelector('.m403-section-header'),null);
 }finally{dom.window.close()}
});
