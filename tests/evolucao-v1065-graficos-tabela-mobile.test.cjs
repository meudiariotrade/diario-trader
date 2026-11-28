const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const G=require('../src/analysis/livermore-graficos.js');

function read(p){return fs.readFileSync(p,'utf8');}

function makeDowntrendSeries(n=300){
 const out=[];
 const start=Date.UTC(2025,0,2);
 let price=82;
 for(let i=0;i<n;i++){
  const t=start+i*86400000;
  // Ondas descendentes realistas com repiques (semelhante a VALE3)
  const wave=Math.sin(i/9)*2.8;
  const drift=-0.085*i;
  const c=Math.max(20,82+drift+wave);
  const o=i===0?price:out[i-1].c;
  const h=Math.max(o,c)+1.1;
  const l=Math.min(o,c)-1.1;
  const v=1200000+(i%7)*150000;
  out.push({t,o:Number(o.toFixed(2)),h:Number(h.toFixed(2)),l:Number(l.toFixed(2)),c:Number(c.toFixed(2)),v});
  price=c;
 }
 return out;
}

test('v1065: index.html carrega tecnico-engine.js antes de livermore-graficos.js',()=>{
 const html=read('src/index.html');
 const idxEng=html.indexOf('tecnico-engine.js?v=__APP_VERSION__');
 const idxLiv=html.indexOf('livermore-graficos.js?v=__APP_VERSION__');
 assert.ok(idxEng>0,'tecnico-engine.js deve estar em src/index.html');
 assert.ok(idxLiv>idxEng,'tecnico-engine.js deve carregar antes de livermore-graficos.js');
});

test('v1065: 4 graficos do Livermore funcionam completos em tendencia de baixa (300 barras)',()=>{
 const candles=makeDowntrendSeries(300);
 const bundle=G.renderAll({ticker:'VALE3',candles,tf:'1d',theme:'dark'});
 const [c1,c2,c3,c4]=bundle.charts;
 assert.ok(!/sem MM20|sem MM200|MM50 em N\/D|IFR14 em N\/D/.test(c1.reading),'Grafico 01 nao deve mostrar N/D nas medias/IFR');
 assert.ok(bundle.analysis.fib?.retracement,'Retracao de Fibonacci deve estar ancorada na tendencia de baixa');
 assert.ok(!/Ainda não há perna macro confirmada/.test(c2.reading),'Grafico 02 deve ler a retracao ancorada');
 assert.ok(bundle.analysis.structure?.dow?.primaryTrend!=='indefinida','Dow deve classificar tendencia');
 assert.ok(!/pivô de reversão está em N\/D/.test(c4.reading),'Grafico 04 deve ter pivo de reversao valido');
 const frac=bundle.synthesis.fractality;
 assert.equal(frac.diario?.available,true);
 assert.equal(frac.semanal?.available,true);
 assert.equal(frac.mensal?.available,true);
 const closeFmt=bundle.synthesis.price.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
 assert.ok(!bundle.synthesis.cenarios.comprador.gatilho.includes('acima de '+closeFmt+' '),'Gatilho comprador nao pode ser igual ao proprio fechamento');
 assert.ok(!bundle.synthesis.cenarios.vendedor.gatilho.includes('abaixo de '+closeFmt+' '),'Gatilho vendedor nao pode ser igual ao proprio fechamento');
 assert.ok(!/MM20 em N\/D|MM50 em N\/D|MM200 em N\/D|IFR14 em N\/D/.test(bundle.synthesis.fechamento));
});

test('v1065: fallback funciona mesmo com historico curto (120 barras < 210)',()=>{
 const candles=makeDowntrendSeries(120);
 const bundle=G.renderAll({ticker:'VALE3',candles,tf:'1d',theme:'dark'});
 const [c1,c2]=bundle.charts;
 assert.ok(!/sem MM20\b|MM50 em N\/D|IFR14 em N\/D/.test(c1.reading),'MM20, MM50 e IFR14 devem existir com 120 barras');
 assert.ok(bundle.analysis.fib?.retracement,'Retracao deve existir com 120 barras');
 assert.ok(!/Ainda não há perna macro confirmada/.test(c2.reading));
 assert.equal(bundle.synthesis.fractality.diario?.available,true);
 assert.equal(bundle.synthesis.fractality.semanal?.available,true);
 assert.equal(bundle.synthesis.fractality.mensal?.available,true);
});

test('v1065: Base fundamentalista nao quebra VALOR/numeros, oculta Amostra setorial vazia e limpa jargao',()=>{
 const layers=read('src/domains/layers/01-navegacao-e-fluxos.js');
 const start=layers.indexOf('function fundamentosAureaV1014(E)');
 const end=layers.indexOf('function debateAureaV1013(E)',start);
 const fn=layers.slice(start,end);
 assert.match(fn,/const temAmostra=/,'Deve verificar se existe amostra setorial');
 assert.match(fn,/white-space:nowrap">Valor<\/th>/,'Cabecalho Valor nao pode quebrar linha');
 assert.match(fn,/white-space:nowrap;font-variant-numeric:tabular-nums/,'Celulas numericas nao podem quebrar linha');
 assert.ok(!/referência do provedor/.test(fn),'Nao deve exibir referencia do provedor');
 assert.ok(!/não certifica os indicadores acima/.test(fn),'Nao deve exibir disclaimer burocratico na linha CVM');
 assert.ok(!/insumos diretos, não certificados/.test(fn),'Nao deve exibir jargao burocratico no valuation');
});

test('v1067: 4 graficos do Livermore abrem ampliados ao clicar/tocar com zoom e navegacao (sem inline onclick)',()=>{
 const src=read('src/analysis/livermore-graficos.js');
 assert.match(src,/data-liv-zoom="1"/);
 assert.match(src,/data-liv-zoom-btn="1"/);
 assert.match(src,/id='liv-lightbox'/);
 assert.match(src,/data-liv-lb-act="in"/);
 assert.match(src,/data-liv-lb-act="next"/);
 assert.ok(!/onclick=/i.test(src),'Nao pode usar inline onclick (CSP)');
});
