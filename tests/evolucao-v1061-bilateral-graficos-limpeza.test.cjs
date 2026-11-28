'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../src/analysis/tecnico-engine.js');
const G=require('../src/analysis/livermore-graficos.js');
const read=p=>fs.readFileSync(p,'utf8');

function buildRegimeSeries(regime,len=320){
 const out=[];
 for(let i=0;i<len;i++){
  let c;
  if(regime==='alta') c=32+i*0.18+Math.sin(i/8)*2.9;
  else if(regime==='baixa') c=115-i*0.18+Math.sin(i/8)*2.9;
  else c=50+Math.sin(i/9)*3.2; // lateralização em faixa ~46,8 a ~53,2
  const o=c+(regime==='baixa'?0.25:-0.25);
  const h=Math.max(o,c)+1.2;
  const l=Math.min(o,c)-1.2;
  const v=regime==='baixa'?180000+(i%5)*12000:160000+(i%7)*10000;
  out.push({t:Date.UTC(2024,0,1+i),o,h,l,c,v});
 }
 return out;
}

test('v1061 Validação 1: simulação em Alta, Baixa e Lateralização com cenários bilaterais, Fibo e OBV rigoroso',()=>{
 for(const [regime,tk] of [['alta','VALE3'],['baixa','PETR4'],['lateral','ITUB4']]){
  const candles=buildRegimeSeries(regime,340);
  const bundle=G.renderAll({ticker:tk,candles,tf:'1d',dir:regime==='baixa'?-1:1});
  assert.equal(bundle.charts.length,4,'deve gerar os 4 gráficos oficiais em '+regime);
  const syn=bundle.synthesis;
  assert.ok(syn.cenarios.comprador&&syn.cenarios.neutro&&syn.cenarios.vendedor,'cenários bilaterais + neutro obrigatórios em '+regime);
  assert.ok(syn.cenarios.comprador.gatilho.length>15);
  assert.ok(syn.cenarios.vendedor.gatilho.length>15);
  assert.ok(syn.cenarios.comprador.invalidacao.length>10);
  assert.ok(syn.cenarios.vendedor.invalidacao.length>10);
  assert.match(syn.fechamento,/lado comprador/i);
  assert.match(syn.fechamento,/lado vendedor/i);
  assert.match(syn.obvResumo,/sem equivaler isoladamente a prova de fluxo institucional|confirmação do preço/i);

  const html=G.renderHtmlPanel({ticker:tk,candles,tf:'1d',theme:'dark',dir:regime==='baixa'?-1:1});
  assert.match(html,/Múltiplos Tempos Gráficos/);
  assert.match(html,/Mapa de Confluências/);
  assert.match(html,/Cenários Condicionais/);
  assert.match(html,/Fechamento Consolidado/);
  assert.doesNotMatch(html,/\sonclick=/i);
  assert.doesNotMatch(html,/\b(Yahoo|TradingView|Brapi|Finnhub|Binance|Cloudflare|Twelve Data|Profit|Gemini|Groq|Mistral|OpenRouter|OHLC|OHLCV|SHA-256|calculado no aparelho)\b/i);
 }
 // Verifica direção Dow específica em alta e baixa
 const up=E.one(buildRegimeSeries('alta',340),1,{tf:'1d'});
 const dn=E.one(buildRegimeSeries('baixa',340),-1,{tf:'1d'});
 assert.equal(up.structure.dow.primaryTrend,'alta');
 assert.equal(dn.structure.dow.primaryTrend,'baixa');
 assert.ok(up.metrics.sma20>up.metrics.sma200);
 assert.ok(dn.metrics.sma20<dn.metrics.sma200);
});

test('v1061 Validação 2: Raio-X removido da UI (cálculos preservados internamente), 4 gráficos automáticos no Modo Completo e limpeza de Fontes/Bastidores',()=>{
 const nav=read('src/domains/layers/01-navegacao-e-fluxos.js');
 assert.match(nav,/function graficosAutomaticosLivermoreV1061/);
 assert.match(nav,/if\(modo!=="completo"\)return "";/);
 assert.doesNotMatch(nav,/Raio-x de '/);
 assert.doesNotMatch(nav,/calculado no aparelho<\/summary>/);
 assert.doesNotMatch(nav,/Fontes citadas na resposta/);
 assert.doesNotMatch(nav,/conteúdo gerado por IA/);
 assert.doesNotMatch(nav,/Modelo inicial:/);

 const uiAurea=read('src/shared/ui-aurea.js');
 assert.doesNotMatch(uiAurea,/textContent\s*=\s*'Fontes \(/);
 assert.doesNotMatch(uiAurea,/<summary>Bastidores da análise<\/summary>/);

 const core=read('src/domains/core/07-conta-e-integracoes.js');
 assert.match(core,/d\._candles=v\.candles/);
 assert.doesNotMatch(core,/DOSSIÊ TÉCNICO CALCULADO NO APARELHO/);
 assert.doesNotMatch(core,/papel: "Técnico · Opções · Fear-Setting"/);
 assert.doesNotMatch(core,/papel: "Crítico de Teses · Fear-Setting"/);
});

test('v1061 Validação 3: visão bilateral, OBV sem afirmar fluxo institucional e sem Fear-Setting forçado na Cloudflare',()=>{
 const qual=read('cloudflare/diario-screeners/aurea-qualidade-v1048.mjs');
 assert.match(qual,/VISÃO OPERACIONAL BILATERAL OBRIGATÓRIA/);
 assert.match(qual,/sem nunca tratar o OBV isoladamente como comprovação de fluxo institucional/);
 assert.match(qual,/Não insira metodologias opcionais como Fear-Setting/);

 const res=read('cloudflare/diario-screeners/aurea-resumao-v904.mjs');
 assert.match(res,/Faça leitura própria bilateral \(compradora, vendedora e neutra\)/);
 assert.match(res,/Não insira Fear-Setting a menos que o usuário solicite explicitamente/);

 const deb=read('cloudflare/diario-screeners/aurea-debate-v1013.mjs');
 assert.match(deb,/leitura bilateral \(cenário comprador, vendedor e neutro\)/);
 assert.match(deb,/gatilhos compradores e vendedores/);
});
