const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const worker=import('../cloudflare/diario-noticias/index.mjs');
test('Worker publica snapshot só com cotações verificadas, sem Supabase',async()=>{
  const {coletarMercado}=await worker;
  const agora=Date.parse('2026-11-24T09:44:00Z'), ts=agora/1000;
  const r=await coletarMercado(async(url,init)=>({
    ok:true,json:async()=>({data:[
      {s:'SP:SPX',d:[6900,0.6]},{s:'AMEX:EWZ',d:[35.7,1.3]},
      {s:'NYSE:PBR',d:[13.1,-0.2]},{s:'CME_MINI:ES1!',d:[6930,0.2]},
      {s:'ICEEUR:BRNF2027',d:[73.2,0.8,73.2-73.2/1.008,ts,'delayed_streaming_900']},{s:'TVC:DXY',d:[99.5,-0.3]},
      {s:'NYSE:VALE',d:[-1,1]},{s:'INVALID:TEST',d:[12,2]}
    ]})
  }),agora);
  assert.equal(r.total,6);
  assert.equal(r.adrs.length,1);
  assert.equal(r.mercados.grupos.find(x=>x.g==='Commodities').itens[0].n,'Petróleo Brent');
  assert.equal(r.mercados.grupos.find(x=>x.g==='Commodities').itens[0].simboloFonte,'ICEEUR:BRNF2027');
  assert.equal(r.mercados.grupos.find(x=>x.g==='Commodities').itens[0].priceAt,new Date(agora).toISOString());
  assert.equal(r.fonte,'TradingView (atrasado)');
});
test('Mercado roda só em janelas abertas e não coleta todo minuto',async()=>{
 const {coletarMercadoAgora}=await worker;
 assert.equal(coletarMercadoAgora(new Date('2026-11-17T09:50:00Z')),true);
 assert.equal(coletarMercadoAgora(new Date('2026-11-17T09:51:00Z')),false);
 assert.equal(coletarMercadoAgora(new Date('2026-11-15T14:00:00Z')),false);
});
test('Sem dados reais, não grava inventados',async()=>{
 const {coletarMercado}=await worker;
 await assert.rejects(coletarMercado(async()=>({ok:true,json:async()=>({data:[]})}),Date.now()));
});
test('Payload desatualizado é rejeitado, mas notícias existentes continuam independentes',async()=>{
 const {default:app}=await worker;
 const old={atualizadoEm:new Date(Date.now()-3600000).toISOString(),fonte:'TradingView (atrasado)',mercados:{grupos:[]},adrs:[]};
 const env={NEWS_CACHE:{get:async k=>k==='diario:mercado:v1'?JSON.stringify(old):null},ALLOWED_ORIGIN:'https://meudiariotrade.github.io'};
 const r=await app.fetch(new Request('https://local.example/v1/mercado'),env);
 assert.equal(r.status,503);
 assert.equal((await r.json()).erro,'cotacoes_desatualizadas');
});
test('Todas as rotas externas continuam estritamente GET',async()=>{
 const {default:app}=await worker;const env={NEWS_CACHE:{get:async()=>null}};
 const r=await app.fetch(new Request('https://local.example/v1/panorama',{method:'POST'}),env);
 assert.equal(r.status,405);
});
test('Código do cron de Panorama não reinicia chamadas macro pesadas',()=>{
 const s=fs.readFileSync('supabase/functions/rotina-cron/index.ts','utf8');
 const seg=s.slice(s.indexOf('export async function matinalLeve'),s.indexOf('let wp: any'));
 assert.match(seg,/v1\/panorama/);
 assert.match(seg,/panorama_fotos/);
 assert.doesNotMatch(seg,/chama\('macro'/);
 assert.match(s,/jornal_agendado/);
});
test('Segurança das filas e emails',()=>{
 const aula=fs.readFileSync('supabase/functions/aulas/index.ts','utf8');
 const resumo=fs.readFileSync('supabase/functions/resumo/index.ts','utf8');
 const email=fs.readFileSync('supabase/functions/email-semana/index.ts','utf8');
 const insider=fs.readFileSync('supabase/functions/insiders/index.ts','utf8');
 assert.match(aula,/if \(!\(await autorizaFila\(req\)\)\)/);
 assert.match(aula,/waitUntil\(job\)/);
 assert.match(email,/if\(!job\)return new Response/);
 assert.match(email,/resendConfigurado/);
 assert.match(resumo,/await autorizaJobLeve\(req\)/);
 assert.match(insider,/autorizaAtualizacao\(req\)/);
});
