const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const an=fs.readFileSync('src/analysis/analises.js','utf8'),ap=fs.readFileSync('src/analysis/analises-plus.js','utf8'),ia=fs.readFileSync('src/intelligence/etapa1.js','utf8'),tech=fs.readFileSync('src/analysis/tecnico-ui.js','utf8');
test('v952: cache IA por conta e mercado, ficha EUA em USD e lacunas preservadas',()=>{
 const c={owner:()=> 'conta-A',Date,fmt:(n)=>String(n),E:String,sessionStorage:{getItem:()=>null},w:{DiarioScreenersInteligencia:{diagnostics:()=>({score:null,parts:[]})}},medianasMercado:()=>null};
 vm.runInNewContext(an.slice(an.indexOf('const iaChave='),an.indexOf('async function explicarIA'))+'\n'+an.slice(an.indexOf('function tecnicoFicha('),an.indexOf('/* v852: riscos com'))+'\nthis.key=iaChave;',c);
 assert.notEqual(c.key('AAPL','us'),c.key('AAPL','br'));const key=c.key('AAPL','us');c.owner=()=> 'conta-B';assert.notEqual(key,c.key('AAPL','us'));
 const facts=c.fatosFicha950('AAPL','us',{data:{last_update:'2026-11-23'}},{ticker:'AAPL',preco_referencia:200,roe:null});assert.match(facts,/200 USD/);assert.match(facts,/2026-11-23/);assert.match(facts,/Nota sem dado/);
 const html=c.tecnicoFicha({ticker:'AAPL',preco_referencia:200,dist_mm200_pct:10,rsi_14:null,momentum_12_1:null},'us');assert.match(html,/US\$/);assert.doesNotMatch(html,/RSI 0/);
});
test('v952: abrir diretamente mantém ficha durante novas entradas e limpa ao trocar seção',()=>{
 const c={st:{rows:{},fiis:{rows:[]},_abrindo:0},carregar:()=>Promise.resolve(),render:()=>{},w:{},d:{},teses:()=>[]};
 vm.runInNewContext(ap.slice(ap.indexOf('function enter(tab){'),ap.indexOf('// Preserva o foco'))+'\n'+ap.slice(ap.indexOf('function abrir(tk)'),ap.indexOf('const salvaF='))+'\n'+ap.slice(ap.indexOf('function prepararBusca949'),ap.indexOf('w.DiarioAnalisesPlus={')),c);
 assert.equal(c.prepararBusca949('acao','PETR4'),true);c.enter('rankpro');c.enter('rankpro');assert.equal(c.st.tk,'PETR4');c.enter('radar');assert.equal(c.st.tk,'');
});
test('v952: contexto inclui só percentuais e indicadores macro existentes',()=>{
 const c={w:{pfCalc:()=>({v:10000,pos:[{tk:'AAPL',cl:'acao_ext',v:2000},{tk:'HGLG11',cl:'fii',v:1000}]}),DiarioMacroFiscal:()=>({brasil:{selic_meta:{valor:null},ipca_12m:{valor:null}}})}};
 vm.runInNewContext(ia.slice(ia.indexOf('function contextoPessoalIA950'),ia.indexOf('w.DiarioConselhoIA =')),c);
 const ctx=c.contextoPessoalIA950('ATIVO: AAPL (EUA)');assert.match(ctx,/AAPL 20\.0%/);assert.match(ctx,/FIIs 10\.0%/);assert.doesNotMatch(ctx,/10000|2000|HGLG11|Selic 0/);
 assert.match(an,/data-scr-conselho="munger"/);assert.match(tech,/data-tech-conselho="munger"/);assert.match(ia,/data-f950="saida"/);
});