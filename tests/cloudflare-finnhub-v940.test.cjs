'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const mod=()=>import('../cloudflare/diario-noticias/finnhub-v940.mjs');
const now=Date.parse('2026-11-23T23:00:00.000Z');
test('v940: Finnhub na Cloudflare usa somente cabeçalho privado, sem chave na URL nem KV',async()=>{
 const {buscarFinnhubV940}=await mod(),urls=[],headers=[];
 const mocked=async (url,init)=>{
  urls.push(String(url));headers.push(init.headers);
  return new Response(JSON.stringify([{headline:'Fed mantém Selic e Powell comenta juros',url:'https://www.reuters.com/markets/fed/',datetime:(now-120000)/1000},{headline:'Horóscopo desta semana',url:'https://site.example/horoscope',datetime:(now-120000)/1000}]),{status:200,headers:{'Content-Type':'application/json'}});
 };
 const chave='chave-ficticia-privada-para-teste';
 const r=await buscarFinnhubV940(mocked,chave,()=> 'politica_economica',now);
 assert.deepEqual(r.fontesOk,['Finnhub general','Finnhub forex','Finnhub crypto']);
 assert.equal(r.itens.length,3);
 assert.ok(urls.every(u=>u.startsWith('https://finnhub.io/api/v1/news?category=')&&!u.includes(chave)));
 assert.ok(headers.every(h=>h['X-Finnhub-Token']===chave));
 assert.equal(JSON.stringify(r).includes(chave),false);
 assert.ok(r.itens.every(x=>x.t.includes('Fed')&&x.l.startsWith('https://')));
});
test('v940: conteúdo falso, HTTP inválido e ausência de chave são tratados sem publicar notícias',async()=>{
 const {buscarFinnhubV940}=await mod();
 const r=await buscarFinnhubV940(async()=>new Response(JSON.stringify([{headline:'Bolsa sobe hoje',url:'javascript:alert(1)',datetime:now/1000}]),{status:200}), 'token-de-teste-comprido',()=> 'acoes',now);
 assert.equal(r.itens.length,0);
 assert.equal(r.fontesOk.length,3);
 const sem=await buscarFinnhubV940(async()=>{throw Error('não buscar')},'',()=>'',now);
 assert.deepEqual(sem.itens,[]);
});
test('v940: falha de Finnhub não apaga cache RSS e X existente nem replica chamadas de KV',async()=>{
 const {mesclarFinnhubV940}=await mod();
 const anterior={atualizadoEm:'2026-11-23T23:00:00Z',fontesOk:['InfoMoney'],fontesIndisponiveis:[],itens:[{t:'Fed anuncia juros',d:'2026-11-23T22:58:00Z',fonte:'InfoMoney'}]};
 assert.strictEqual(mesclarFinnhubV940(anterior,{fontesOk:[],itens:[]}),anterior);
 const extra={itens:[{t:'Fed anuncia juros',d:'2026-11-23T22:58:00Z',fonte:'Finnhub general'}, {t:'OPEP e petróleo se reúnem',d:'2026-11-23T22:59:00Z',fonte:'Finnhub general'}],fontesOk:['Finnhub general'],fontesIndisponiveis:['Finnhub crypto']};
 const result=mesclarFinnhubV940(anterior,extra);
 assert.equal(result.itens.length,2);
 assert.equal(result.itens[0].fonte,'Finnhub general');
 assert.deepEqual(result.fontesOk,['InfoMoney','Finnhub general']);
 assert.equal(result.atualizadoEm,anterior.atualizadoEm);
 const compiled=fs.readFileSync('cloudflare/diario-noticias/producao-snapshot-v894.mjs','utf8');
 assert.match(compiled,/await Ss\(fetch,e\.scheduledTime,a\);if\(t\.FINNHUB_API_KEY\)/);
 assert.equal((compiled.match(/NEWS_CACHE\.put\(yt/g)||[]).length,1,'um único write KV por ciclo');
});
test('v940: notificador Supabase usa RSS X/Finnhub apenas como reserva se não vier no Cloudflare',async()=>{
 const {coletarNoticias}=await import('../supabase/functions/notificar/noticias-urgentes.ts');
 const calls=[];const agora=new Date('2026-11-23T23:10:00Z');
 const input={atualizadoEm:'2026-11-23T23:10:00Z',desatualizado:false, fontesOk:['X · @FirstSquawk','Finnhub general'],itens:[
  {t:'Powell e Fed sinalizam risco aos juros',l:'https://x.com/FirstSquawk/status/2222',d:'2026-11-23T23:09:00Z',fonte:'X · @FirstSquawk'},
  {t:'Fed anuncia revisão no mercado de ações',l:'https://www.reuters.com/finance/',d:'2026-11-23T23:09:00Z',fonte:'Finnhub general'}
 ]};
 const mocked=async url=>{
  calls.push(String(url));
  if(String(url).includes('diario-trader.lucianosilva43567.workers.dev'))return {ok:true,json:async()=>input};
  return {ok:false,status:503,json:async()=>[]};
 };
 const r=await coletarNoticias('chave-ficticia',agora,mocked,'leve');
 assert.ok(r.noticias.length>=1);
 assert.equal(calls.some(u=>u.includes('FirstSquawk')&&!u.includes('workers.dev')),false);
 assert.equal(calls.some(u=>u.includes('finnhub.io/api/v1/news?category=general')),false);
 assert.ok(calls.some(u=>u.includes('DeItaone')),'perfil não coberto ainda possui fallback');
});
