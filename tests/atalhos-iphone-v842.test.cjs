const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('v842: Configurações gera o link dos Atalhos do iPhone (Panorama no WhatsApp) sem guardar o token',()=>{
 const src=fs.readFileSync('src/shared/atalhos-iphone.js','utf8');
 assert.match(src,/rpc\/atalhos_gerar_token/);assert.match(src,/daily-panorama\?token=/);assert.match(src,/check-morning-status\?token=/);
 assert.doesNotMatch(src,/localStorage|setInterval/,'token não fica salvo e não há polling');
 assert.match(fs.readFileSync('src/index.html','utf8'),/src\/shared\/atalhos-iphone\.js/);
 assert.match(fs.readFileSync('src/service-worker.js','utf8'),/"src\/shared\/atalhos-iphone\.js"/);
 const ctx={window:{},document:{readyState:'complete',addEventListener(){},getElementById:()=>null,querySelector:()=>null,createElement:()=>({})},MutationObserver:class{observe(){}},queueMicrotask,cfg:()=>({url:'https://x.supabase.co/'}),console};ctx.window=ctx;
 vm.runInNewContext(src,ctx);
 const L=ctx.DiarioAtalhosIphone.links('a'.repeat(48));
 assert.equal(L.length,4);assert.equal(L[0][1],'https://x.supabase.co/functions/v1/daily-panorama?token='+'a'.repeat(48)+'&turno=manha');
 assert.match(L[1][1],/turno=fechamento$/);
});
test('v844: tela não pisca no tema claro (sem transição de cor) e progresso do Cérebro não refaz a tela',()=>{
 const css=fs.readFileSync('src/app-theme.css','utf8');
 assert.match(css,/html:root body #app :not\(\.cqr,\.cqr \*\),[^{]+\{transition-property:transform,opacity,width,height,max-height,flex-basis!important\}/);
 const c=fs.readFileSync('src/ai/cerebro-ia.js','utf8');assert.match(c,/st\.textContent=message;pg\.value=pct;return/);
});
