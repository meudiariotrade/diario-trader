'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const plus=fs.readFileSync('src/analysis/analises-plus.js','utf8');
const bridge=fs.readFileSync('profit-cotacoes-v552.js','utf8');
const market=fs.readFileSync('src/domains/core/13-diagnostico-e-relatorios.js','utf8');
const quoteStart=plus.indexOf('function ponteCache('),quoteEnd=plus.indexOf('function rotacaoArquivo(',quoteStart);
assert.ok(quoteStart>=0&&quoteEnd>quoteStart,'funções de preço Research disponíveis');
const quoteCode=plus.slice(quoteStart,quoteEnd);
const N=x=>x==null||x===''?null:Number.isFinite(Number(x))?Number(x):null;
function setup(timestamp='2026-11-23T14:00:00Z'){
 const time=Date.parse(timestamp);
 class Clock extends Date{
  constructor(...a){super(...(a.length?a:[time]))}
  static now(){return time}
 }
 const row={ticker:'PETR4',raw:{preco_referencia:39.73},preco:39.73};
 const c={Date:Clock,Intl,N,CQ:{owner:'u1',pf:{},saved:{}},
  SESS:{uid:'u1'},st:{rows:{rows:[row]},X:null}};
 vm.createContext(c);
 vm.runInContext(quoteCode,c);
 const apply=()=>vm.runInContext('aplicaProfit()',c);
 return {c,row,apply,time};
}
test('v946: durante pregão Profit é prioritário só com horário efetivo recente',()=>{
 const {c,row,apply,time}=setup();
 const em=new Date(time-45000).toISOString();
 c.CQ.pf.PETR4={px:41.3,d1:-0.6,em};
 apply();
 assert.equal(row.preco,41.3);assert.equal(row.profit,1);
 assert.equal(row.precoFonte,'Profit');assert.equal(c.st.nProfit,1);
 c.CQ.pf={};apply();
 assert.equal(row.preco,39.73,'preço antigo do Profit não permanece preso no Research');
 assert.equal(row.profit,0);assert.equal(row.precoFonte,'Screener');
});
test('v946: fechamento Profit continua útil com FECHADO, nunca rotulado ao vivo',()=>{
 const {c,row,apply,time}=setup('2026-11-24T02:10:00Z');
 const em='2026-11-23T21:05:45Z';
 c.CQ.saved.PETR4={px:41.30,d1:-1.2,em};
 apply();
 assert.equal(row.preco,41.3);assert.equal(row.profit,0);
 assert.equal(row.profitFechado,1);
 assert.equal(row.precoFonte,'Profit · FECHADO');
 assert.equal(row.precoEm,em);assert.equal(c.st.nProfitFechado,1);
 c.CQ.saved.PETR4={px:30,em:new Date(time-9*86400000).toISOString()};
 apply();assert.equal(row.preco,39.73,'não sobrepor snapshot com negócio muito antigo');
});
test('v946: troca de usuário não reutiliza cotações privadas',()=>{
 const {c,row,apply,time}=setup();
 c.CQ.owner='outra-conta';c.CQ.saved.PETR4={px:999,em:new Date(time-30000).toISOString()};
 apply();assert.equal(row.preco,39.73);
 assert.equal(row.profitFechado,0);
});
test('v946: snapshot público é revalidado em Cloudflare e não consulta Supabase',async()=>{
 const start=plus.indexOf('const URL_SCREENER_BR=');
 const end=plus.indexOf('async function carregar(force)',start);
 assert.ok(start>=0&&end>start);
 const code=plus.slice(start,end);
 const calls=[],rows=Array.from({length:159},(_,i)=>({ticker:'BR'+i,preco_referencia:40}));
 const context={Date,AbortSignal,fetch:async(url,options)=>{
  calls.push({url,options});
  return {ok:true,json:async()=>({ok:true,market:'BR',universe_complete:true,
   pipeline_origin:'github-actions-public',last_update:'2026-11-24T00:06:41Z',
   universe_rows:rows})};
 }};
 vm.createContext(context);
 vm.runInContext(code,context);
 const r=await vm.runInContext('screenerCloudflare()',context);
 assert.equal(r.rows.length,159);
 assert.equal(calls.length,1);
 assert.match(calls[0].url,/diario-screeners-quant.*\/v1\/screeners\?market=BR&snapshot=1&universe=1&v=/);
 assert.equal(calls[0].options.cache,'no-store');
 assert.equal(calls[0].options.credentials,'omit');
 assert.equal(calls[0].options.headers,undefined);
});
test('v946: usuário atualiza preços sem polling Supabase e mantém botão Profit',()=>{
 assert.match(plus,/data-ap-profit-refresh/);
 assert.match(plus,/cqPonte\(true\)/);
 assert.match(plus,/diario:profit-cotacoes/);
 assert.match(plus,/cqPonte\(\)/);
 assert.match(bridge,/doc\.dispatchEvent\(new root\.CustomEvent\('diario:profit-cotacoes'/);
 assert.doesNotMatch(plus,/setInterval\([^]*?cqPonte/);
 assert.match(market,/fechado:true, live:false/);
 assert.match(plus,/Profit · FECHADO/);
});
test('v946: atualização do Screener Cloudflare vem depois da publicação GitHub',()=>{
 const conf=JSON.parse(fs.readFileSync('cloudflare/diario-screeners/wrangler.jsonc','utf8'));
 const code=fs.readFileSync('cloudflare/diario-screeners/snapshot-cache-v896.mjs','utf8');
 assert.deepEqual(conf.triggers.crons,['15 1,13 * * *']);
 assert.match(code,/export const SCREENER_CRON='15 1,13 \* \* \*'/);
 const gh=fs.readFileSync('.github/workflows/screeners-publicos-v897.yml','utf8');
 assert.match(gh,/cron: '25 0,12 \* \* 1-5'/);
});
