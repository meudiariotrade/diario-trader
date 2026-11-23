const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const src = fs.readFileSync('src/domains/layers/01-navegacao-e-fluxos.js', 'utf8');
const start = src.lastIndexOf('(function (s)', src.indexOf('const l = "revista-tecnica'));
const endMarker = '})(typeof window > "u" ? globalThis : window)';
const end = src.indexOf(endMarker, start) + endMarker.length;
const ctx = { window: {} };
vm.runInNewContext(src.slice(start, end), ctx);
const model = ctx.window.RevistaModel;
function barras(precos) {
  return precos.map((p,i) => [1609459200 + i*86400, p, p+.3, p-.3, p, 100]);
}
test('direção, consolidação, pavio fora da faixa e histórico curto', () => {
  const valores = Array.from({length:60}, (_,i)=>90+i*.4);
  assert.equal(model.estrutura(barras(valores)).tendencia,'alta');
  assert.equal(model.estrutura(barras(valores.reverse())).tendencia,'baixa');
  const faixa = barras(Array.from({length:60},(_,i)=>[99,100,101,100][i%4]));
  faixa.at(-1)[2]=103;
  assert.equal(model.estrutura(faixa).tendencia,'lateral');
  assert.equal(model.estrutura(faixa.slice(0,8)).tendencia,'histórico insuficiente');
});
test('médias de semanas usam o último fechamento de cada semana e respeitam o corte', () => {
  const serie=barras(Array.from({length:1500},(_,i)=>70+i*.02+Math.sin(i*.7)));
  const corte=model.date(serie.at(-8)[0]);
  const estudo=model.study({ticker:'TEST',bars:serie},corte);
  assert.equal(estudo.asOf,corte);
  for (const n of [20,50,200]) {
    const ultimos = estudo.weeks.slice(-n);
    assert.equal(ultimos.length,n);
    assert.equal(estudo['w'+n],ultimos.reduce((s,b)=>s+b[4],0)/n);
  }
  assert.equal(model.study({bars:serie.slice(-50)},corte).w200,null);
});
test('retrospectiva avalia ordem temporal, invalidação e prazo', () => {
  const anterior={from:'2026-11-16',to:'2026-11-20',planos:[{ticker:'TEST',sinal:1,gatilho:10,alvo:14,invalidacao:6,confirmacoes:1}]};
  function resultado(closes,highs=[]) {
    const bars=closes.map((p,i)=>[Date.UTC(2026,10,16+i)/1000,p,highs[i]??p,p,p,0]);
    return model.conferirSemana(anterior,{window:{from:'2026-11-23'},studies:[{ticker:'TEST',bars}]})[0];
  }
  assert.equal(resultado([10,9,9]).situacao,'Sem acionamento');
  assert.equal(resultado([11,12],[15,13]).objetivo,false);
  assert.equal(resultado([11,12],[12,14]).objetivo,true);
  assert.equal(resultado([11,9]).situacao,'Falhou após acionamento');
  assert.equal(resultado([11,5]).situacao,'Invalidado');
  assert.equal(resultado([11,12]).situacao,'Confirmado em novo fechamento');
  assert.equal(resultado([]).situacao,'Sem dados');
  anterior.planos[0].confirmacoes=2;
  assert.equal(resultado([11,9]).acionado,false);
  assert.equal(resultado([11,12]).acionado,true);
});
