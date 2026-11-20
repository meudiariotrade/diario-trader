const test=require('node:test');
const assert=require('node:assert/strict');
const modulePromise=import('../cloudflare/diario-noticias/eventos.mjs');
const day=Date.parse('2026-11-19T14:00:00Z');
const noticia=(titulo,link,fonte='InfoMoney')=>({t:titulo,l:'https://www.infomoney.com.br/'+link,fonte,d:new Date(day).toISOString(),tema:'petroleo'});
test('mesmo acontecimento em duas fontes vira um evento, preservando fontes verificáveis',async()=>{
  const {agruparEventos}=await modulePromise;
  const a=noticia('Brent sobe após decisão da OPEP sobre oferta','a');
  const b={...noticia('Brent sobe após decisão da OPEP sobre oferta','b','Money Times')};
  const e=agruparEventos([a,b],[],day);
  assert.equal(e.length,1);
  assert.equal(e[0].quantidadeFontes,2);
  assert.ok(e[0].tickers.includes('PETR4'));
  assert.ok(e[0].relacoes.hipoteses.includes('WIN'));
  assert.match(e[0].nota,/hipóteses/);
});
test('duas manchetes de fatos distintos não se tornam causalidade inventada',async()=>{
  const {agruparEventos}=await modulePromise;
  const v=agruparEventos([noticia('Brent sobe após decisão da OPEP sobre oferta','a'),noticia('Petrobras divulga lucro e balanço trimestral','c')],[],day);
  assert.equal(v.length,2);
});
test('histórico de 48h é acumulado sem duplicar e IDs seguem estáveis',async()=>{
  const {agruparEventos}=await modulePromise;
  const a=noticia('Brent sobe após decisão da OPEP sobre oferta','a');
  const initial=agruparEventos([a],[],day);
  const updated=agruparEventos([a],initial,day+120000);
  assert.equal(initial[0].id,updated[0].id);
  assert.equal(updated[0].fontes.length,1);
});
test('vínculo direto e indireto é distinguido e não depende de dados privados',async()=>{
  const {tickersAfetados}=await modulePromise;
  const one=tickersAfetados('Petrobras PETR4 comunica fato relevante','acoes');
  assert.ok(one.diretos.includes('PETR4'));
  const two=tickersAfetados('CPI e inflação nos EUA','politica_economica');
  assert.ok(two.hipoteses.includes('WDO'));
  assert.equal(two.diretos.length,0);
});
