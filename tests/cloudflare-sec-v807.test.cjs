const test=require('node:test');
const assert=require('node:assert/strict');
const mod=import('../cloudflare/diario-noticias/index.mjs');
const when=Date.parse('2026-11-19T15:00:00Z');
const atom='<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>8-K - Example Corporation (CIK 123)</title><link href="https://www.sec.gov/Archives/edgar/data/123/filing"/><updated>2026-11-19T14:59:00Z</updated></entry><entry><title>8-K malicious redirect</title><link href="https://attacker.example/path"/><updated>2026-11-19T14:59:00Z</updated></entry></feed>';
test('SEC Atom: documento datado com URL estritamente oficial',async()=>{
 const {lerSECAtom}=await mod;const rows=lerSECAtom(atom,{nome:'SEC EDGAR',host:'sec.gov'},when);
 assert.equal(rows.length,1); assert.equal(rows[0].fonte,'SEC');
 assert.equal(rows[0].tema,'acoes');assert.match(rows[0].l,/^https:\/\/www\.sec\.gov\//);
});
test('SEC Atom: ignora feed velho ou futuro',async()=>{
 const {lerSECAtom}=await mod;
 assert.equal(lerSECAtom(atom,{host:'sec.gov'},when+26*3600000).length,0);
 assert.equal(lerSECAtom(atom,{host:'sec.gov'},when-3600000).length,0);
});
test('API timeline mantém origens seguras e formato simples',async()=>{
 const {default:worker}=await mod;
 const cache={get:async()=>JSON.stringify({atualizadoEm:new Date(when).toISOString(),eventos:[{id:'evt-demo',titulo:'8-K',fontes:[]}],itens:[]})};
 const res=await worker.fetch(new Request('https://worker.example/v2/eventos',{headers:{origin:'https://meudiariotrade.github.io'}}),{NEWS_CACHE:cache,ALLOWED_ORIGIN:'https://meudiariotrade.github.io'});
 assert.equal(res.status,200);const json=await res.json();assert.equal(json.eventos[0].id,'evt-demo');
});
