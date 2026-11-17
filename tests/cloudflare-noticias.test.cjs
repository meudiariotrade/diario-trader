const test = require('node:test');
const assert = require('node:assert/strict');
const mod = import('../cloudflare/diario-noticias/index.mjs');
const agora=Date.parse('2026-11-17T14:00:00Z');
const xml='<rss><channel><item><title>Brent avanca apos decisao da OPEP</title><link>https://www.infomoney.com.br/mercados/petroleo/</link><pubDate>Tue, 17 Nov 2026 13:58:00 GMT</pubDate></item><item><title>Noticia externa redirecionada</title><link>https://ataque.example.net/</link><pubDate>Tue, 17 Nov 2026 13:58:00 GMT</pubDate></item></channel></rss>';
test('classifica petroleo, minerio, acoes e politica economica',async()=>{
  const {tema}=await mod;
  assert.equal(tema('Brent sobe 2%'),'petroleo');
  assert.equal(tema('Minério de ferro em alta'),'minerio');
  assert.equal(tema('Congresso aprova tarifa'),'politica_economica');
  assert.equal(tema('Ações na bolsa'),'acoes');
  assert.equal(tema('Vendas de brinquedos'),'');
});
test('ignora URL externa ao domínio da fonte',async()=>{
  const {lerRSS}=await mod;
  const a=lerRSS(xml,{nome:'InfoMoney',host:'infomoney.com.br'},agora);
  assert.equal(a.length,1);assert.equal(a[0].tema,'petroleo');
});
test('agenda considera hora civil de Brasilia',async()=>{
  const {deveColetar}=await mod;
  assert.equal(deveColetar(new Date('2026-11-17T14:02:00Z')),true);
  assert.equal(deveColetar(new Date('2026-11-17T22:02:00Z')),false);
  assert.equal(deveColetar(new Date('2026-11-17T22:10:00Z')),true);
});
test('feeds todos fora do ar nao apagam ultimo cache',async()=>{
  const {default:worker}=await mod;
  const map=new Map([['diario:noticias:v1','{"atualizadoEm":"2026-11-17T14:00:00Z","itens":[]}']]);
  const cache={get:async k=>map.get(k),put:async(k,v)=>map.set(k,v)};
  const antigo=global.fetch;global.fetch=async()=>{throw Error('feed offline');};
  try{
    let tarefa;
    await worker.scheduled({scheduledTime:agora},{NEWS_CACHE:cache},{waitUntil:p=>{tarefa=p;}});
    await tarefa;
    assert.equal(map.get('diario:noticias:v1'),'{"atualizadoEm":"2026-11-17T14:00:00Z","itens":[]}');
  }finally{global.fetch=antigo;}
});
test('retorna JSON com CORS somente na origem autorizada',async()=>{
  const {default:worker}=await mod;
  const env={NEWS_CACHE:{get:async()=>JSON.stringify({atualizadoEm:'2026-11-17T14:00:00Z',itens:[]})},ALLOWED_ORIGIN:'https://meudiariotrade.github.io'};
  const bom=await worker.fetch(new Request('https://worker.test/v1/noticias',{headers:{origin:env.ALLOWED_ORIGIN}}),env);
  assert.equal(bom.status,200);
  assert.equal(bom.headers.get('access-control-allow-origin'),env.ALLOWED_ORIGIN);
  const ruim=await worker.fetch(new Request('https://worker.test/v1/noticias',{headers:{origin:'https://malicioso.example'}}),env);
  assert.equal(ruim.headers.get('access-control-allow-origin'),null);
});
test('publica manchetes filtradas sem importar materia completa',async()=>{
  const {coletarNoticias}=await mod;
  const p=await coletarNoticias(async()=>({ok:true,text:async()=>xml}),agora);
  assert.deepEqual(p.fontesIndisponiveis,[]);
  assert.equal(p.itens.length,1);
  assert.equal(p.itens[0].fonte,'InfoMoney');
});