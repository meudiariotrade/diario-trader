const test=require('node:test'),assert=require('node:assert/strict');
const mod=import('../cloudflare/diario-noticias/index.mjs'),dados=import('../cloudflare/diario-noticias/dados-publicos.mjs');
function yahoo(n=420,start=100){const t=[],c=[],h=[],l=[];for(let i=0;i<n;i++){t.push(1700000000+i*86400);const v=start*(1+0.001*i+0.02*Math.sin(i/9));c.push(v);h.push(v*1.01);l.push(v*.99);}
  return {chart:{result:[{timestamp:t,indicators:{quote:[{close:c,high:h,low:l}]}}]}};}
function fakeFetch(log){return async(url)=>{log.push(String(url));const u=String(url);
  const ok=b=>({ok:true,status:200,json:async()=>b});
  if(u.includes('economic-calendar.tradingview.com'))return ok({result:[
    {id:1,country:'BR',title:'IPCA Inflation Index',date:'2026-11-24T12:00:00Z',importance:1,actual:0.3,forecast:0.2,previous:0.1,unit:'%'},
    {id:2,country:'US',title:'Michigan Consumer Sentiment',date:'2026-11-25T15:00:00Z',importance:0},
    {id:3,country:'MX',title:'Fora da lista',date:'2026-11-25T15:00:00Z',importance:1}]});
  if(u.includes('query1.finance.yahoo.com'))return ok(yahoo());
  if(u.includes('cnn.io'))return ok({fear_and_greed:{score:18.4,previous_close:13,previous_1_week:20,timestamp:'2026-11-20T21:00:00Z'},fear_and_greed_historical:{data:[]}});
  if(u.includes('alternative.me'))return ok({data:[{value:'40',timestamp:'1763600000'},{value:'35',timestamp:'1763513600'}]});
  return {ok:false,status:404,json:async()=>({})};};}
test('agenda da borda: mesmo filtro de países e tradução das Edge Functions',async()=>{
  const {coletarAgenda}=await dados,log=[];
  const a=await coletarAgenda(fakeFetch(log),Date.parse('2026-11-23T13:00:00Z'),0);
  assert.ok(a.eventos.some(e=>e.t==='IPCA'&&e.p==='BR'&&e.atual==='0,3%'));
  assert.ok(a.eventos.some(e=>/Michigan/.test(e.t)));
  assert.ok(!a.eventos.some(e=>e.p==='MX'));
  assert.equal(a.fonte,'TradingView');
});
test('sentimento da borda: B3 calculado, EUA da CNN, cripto do alternative.me',async()=>{
  const {coletarSentimento}=await dados,log=[];
  const s=await coletarSentimento(fakeFetch(log),Date.parse('2026-11-20T21:00:00Z'));
  assert.ok(Number.isFinite(s.b3.valor)&&s.b3.valor>=0&&s.b3.valor<=100);
  assert.equal(s.eua.fonte,'CNN Fear & Greed');assert.equal(s.eua.valor,18);
  assert.equal(s.cripto.valor,40);
});
test('cron: coleta uma vez e serve todos pelas rotas públicas, sem Supabase',async()=>{
  const {default:worker}=await mod,map=new Map(),log=[];
  const env={NEWS_CACHE:{get:async(k,t)=>{const v=map.get(k);return t==='json'&&v?JSON.parse(v):v??null;},put:async(k,v)=>map.set(k,v)},ALLOWED_ORIGIN:'https://meudiariotrade.github.io'};
  const antigo=global.fetch;global.fetch=fakeFetch(log);const tarefas=[];
  try{await worker.scheduled({scheduledTime:Date.parse('2026-11-23T13:30:00Z')},env,{waitUntil:p=>tarefas.push(p)});await Promise.all(tarefas);}
  finally{global.fetch=antigo;}
  assert.ok(!log.some(u=>/supabase/.test(u)),'nenhuma chamada ao Supabase');
  const r=await worker.fetch(new Request('https://x.workers.dev/v1/agenda?semana=0'),env);assert.equal(r.status,200);
  const a=await r.json();assert.ok(a.eventos.length>=2);assert.equal(a.desatualizado,false);
  const s=await worker.fetch(new Request('https://x.workers.dev/v1/sentimento'),env);assert.equal(s.status,200);assert.ok((await s.json()).eua);
});
test('frequência da coleta: 30 min em horário útil, espaçada fora dele',async()=>{
  const {agendaAgora,sentimentoAgora}=await dados;
  assert.equal(agendaAgora(new Date('2026-11-23T13:30:00Z')),true);
  assert.equal(agendaAgora(new Date('2026-11-23T13:32:00Z')),false);
  assert.equal(sentimentoAgora(new Date('2026-11-21T13:30:00Z')),false,'sábado: só a cada 6 h');
  assert.equal(sentimentoAgora(new Date('2026-11-21T15:00:00Z')),true);
});
