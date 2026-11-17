const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
globalThis.Deno={env:{get:()=>''},serve:()=>{}};
const noticias=import('../supabase/functions/noticias/index.ts');
test('v729: filtros contemplam petróleo, minério, ações e política econômica',()=>{
 const s=fs.readFileSync('src/domains/core/04-analises-e-estudos.js','utf8');
 for(const tema of ['petroleo','minerio','acoes','politica','prioritaria'])assert.ok(s.includes('["'+tema+'",'));
 assert.ok(s.includes('mkFinnhubNoticias("general")'));
 assert.match(s,/Date\.now\(\)-MKT\.ts<12e4/);
 assert.match(s,/tab === "mercado" && MKT\.tab === "nt" && !document\.hidden/);
});
test('v729: servidor valida origem das URLs e data do RSS',async()=>{
 const {parsePortal}=await noticias;
 const agora=Date.parse('2026-11-17T15:00:00Z');
 const rss='<rss><item><title>Oil market reacts to new OPEC supply cut</title><link>https://www.cnbc.com/2026/11/17/oil-news.html</link><pubDate>Tue, 17 Nov 2026 14:58:00 GMT</pubDate></item>'+
 '<item><title>Unsafe link to fake news article</title><link>https://evil.example/abc</link><pubDate>Tue, 17 Nov 2026 14:58:00 GMT</pubDate></item></rss>';
 const rows=parsePortal(rss,'CNBC','cnbc.com',agora);
 assert.equal(rows.length,1);
 assert.equal(rows[0].a,'CNBC');
});
test('v729: cron reutiliza nome existente, sem religar pipeline de Jornal',()=>{
 const s=fs.readFileSync('supabase/migrations/20261117131000_monitor_noticias_prioritarias_v729.sql','utf8');
 assert.match(s,/noticias-urgentes-leve-v727/);
 assert.match(s,/\*\/2 \* \* \* \*/);
 assert.match(s,/then 2\s*else 10/);
 assert.doesNotMatch(s,/"acao":"tick"/);
});
