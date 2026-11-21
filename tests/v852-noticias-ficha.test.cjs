const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('v852: X sem tema de mercado fica de fora; geopolítica vira tema próprio com WIN/WDO como hipótese',async()=>{
 const m=await import('../cloudflare/diario-noticias/index.mjs'),ev=await import('../cloudflare/diario-noticias/eventos.mjs');
 const ag=Date.now(),pd=new Date(ag-6e5).toUTCString(),x=t=>'<item><title>'+t+'</title><link>https://x.com/FirstSquawk/status/1</link><pubDate>'+pd+'</pubDate></item>';
 const r=m.lerX('<rss>'+x('Ceuta Sexual Assaults Soar 650% After Migrant Invasion')+x('US F-16 Forced to Make Emergency Landing After Alleged Iranian Missile Strike')+x('Celebrity wedding photos go viral today')+'</rss>',{nome:'X · @FirstSquawk',perfil:'FirstSquawk'},ag);
 assert.deepEqual(r.map(i=>i.tema),['geopolitica']);assert.ok(!m.X_PERFIS.includes('zerohedge'));
 const rel=ev.tickersAfetados('Iranian missile strike over the Gulf','geopolitica');assert.deepEqual(rel.diretos,[]);assert.ok(rel.hipoteses.includes('WIN'));
});
test('v852: Início não diz "cita diretamente" para hipótese, traduz manchete e expõe notícias por ativo',()=>{
 const e=fs.readFileSync('src/intelligence/etapa1.js','utf8');
 assert.match(e,/O título cita '\+tk\+' diretamente/);assert.match(e,/tipo:'hipotese'/);assert.match(e,/l\.tipo!=='hipotese'/);assert.match(e,/mkTraduzLote/);assert.match(e,/noticiasDo/);
 assert.doesNotMatch(e,/'A notícia cita '\+tk\+' diretamente\.'/);
});
test('v852: ficha explica a tendência, riscos com porquê, IA pelo Cérebro e logos',()=>{
 const a=fs.readFileSync('src/analysis/analises.js','utf8');
 for(const r of [/Média de 200 dias:/,/O que mudaria o quadro/,/function riscosExplicados/,/Controle estatal/,/modo:'ficha'/,/DiarioLogos\?\.html/])assert.match(a,r);
 assert.match(fs.readFileSync('src/analysis/tecnico-ui.js','utf8'),/DiarioLogos\?\.html/);
 assert.match(fs.readFileSync('supabase/functions/conhecimento-ia/index.ts','utf8'),/ficha:'Os DADOS do ativo/);
});
