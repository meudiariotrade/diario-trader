const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),mod=require('node:module');
test('v846: entidades HTML de manchetes (inclusive duplas) viram texto',async()=>{
 const ts=fs.readFileSync('supabase/functions/_shared/entidades.ts','utf8');
 const js=mod.stripTypeScriptTypes?mod.stripTypeScriptTypes(ts):ts.replace(/: Record<string, string>/,'').replace(/\(s: string\): string/,'(s)').replace(/\(m, n: string\)/,'(m, n)');
 const {decodeEntidades}=await import('data:text/javascript,'+encodeURIComponent(js));
 assert.equal(decodeEntidades('Trump dá &#8216;rasteira&#8217; em agro &amp;#8216;x&amp;#8217;'),'Trump dá ‘rasteira’ em agro ‘x’');
 for(const f of ['supabase/functions/daily-panorama/fds.ts','supabase/functions/movimentos/index.ts','supabase/functions/analise/index.ts'])assert.match(fs.readFileSync(f,'utf8'),/decodeEntidades\(/);
});
test('v846: perfis do X lidos na Cloudflare, só com link do próprio perfil',async()=>{
 const m=await import('../cloudflare/diario-noticias/index.mjs');
 assert.ok(m.X_PERFIS.length>=8);assert.ok(m.X_PERFIS.includes('FirstSquawk'));
 const agora=Date.now(),pd=new Date(agora-600000).toUTCString();
 const xml='<rss><item><title>FED&#8217;S WALLER: CUTS STILL ON TABLE https://t.co/x</title><link>https://x.com/DeItaone/status/1999</link><pubDate>'+pd+'</pubDate></item><item><title>FAKE NEWS FROM OTHER ACCOUNT HERE</title><link>https://x.com/outro/status/2</link><pubDate>'+pd+'</pubDate></item></rss>';
 const r=m.lerX(xml,{nome:'X · @DeItaone',perfil:'DeItaone'},agora);
 assert.equal(r.length,1);assert.equal(r[0].t,'FED’S WALLER: CUTS STILL ON TABLE');assert.equal(r[0].fonte,'X · @DeItaone');assert.ok(r[0].tema);
 const app=fs.readFileSync('src/domains/core/04-analises-e-estudos.js','utf8');assert.match(app,/MKT\.xBorda/);assert.match(app,/MKT\.nf==="x"&&!MKT\.xBorda/);
});
test('v846: termômetro só no Início, Revista registra o Cérebro, botões do fim de semana e Voltar visíveis, gráficos na ficha',()=>{
 const t=fs.readFileSync('src/market/termometro-abertura-v670.js','utf8');assert.doesNotMatch(t,/route:"dia"/);assert.match(t,/v4-day > \.dt670-opening/);
 const r=fs.readFileSync('supabase/functions/revista-ia/index.ts','utf8');assert.match(r,/referencias_cerebro/);
 assert.match(fs.readFileSync('src/domains/layers/01-navegacao-e-fluxos.js','utf8'),/consultando o Cérebro da IA/);
 const css=fs.readFileSync('src/app-theme.css','utf8');assert.match(css,/\.fdsl>span \.btn\{white-space:nowrap/);assert.match(css,/#imgov#imgov \.imgov-voltar/);
 const a=fs.readFileSync('src/analysis/analises.js','utf8');assert.match(a,/function graficoValuation/);assert.match(a,/function graficoPosicao/);assert.match(a,/scr846-graficos/);
});
