const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync('src/intelligence/etapa1.js','utf8');
function make(){
  const dom=new JSDOM('<!doctype html><html><body><main id="app"><div class="dt393-native"><div class="card">Painel existente</div></div></main></body></html>',{url:'https://meudiariotrade.github.io/diario-trader/',runScripts:'outside-only'});
  const w=dom.window,calls=[],hooks=new Map();
  w.TraderUI={onRender:(id,fn)=>hooks.set(id,fn)};
  w.tab='home';w.MKT={tab:'mu'};
  w.fetch=async(url,params)=>{
    calls.push({url,params});
    return {ok:true,json:async()=>url.includes('/v2/eventos')?
      {atualizadoEm:new Date().toISOString(),eventos:[],desatualizado:false}:
      {atualizadoEm:new Date().toISOString(),fonte:'teste',mercados:{grupos:[]}}};
  };
  w.eval(source);
  const draw=hooks.get('inteligencia-integrada-v807');
  assert.equal(typeof draw,'function');
  return {w,dom,calls,draw};
}
test('v807: acopla Início sem criar menu nem sobrepor componentes antigos',()=>{
  const {w,draw,dom}=make();
  draw();draw();
  assert.equal(w.document.querySelectorAll('[data-intel-etapa1]').length,1);
  assert.equal(w.document.querySelectorAll('.dt393-native > .card').length,2);
  assert.equal(w.document.querySelectorAll('nav [data-tab]').length,0);
  dom.window.close();
});
test('v807: remove ao sair da tela e respeita navegação existente',()=>{
  const {w,draw,dom}=make();draw();
  w.tab='trades';draw();assert.equal(w.document.querySelectorAll('[data-intel-etapa1]').length,0);
  w.tab='mercado';w.MKT.tab='ag';draw();assert.match(w.document.querySelector('[data-intel-etapa1]').textContent,/Agenda econômica inteligente/);
  w.MKT.tab='se';draw();assert.equal(w.document.querySelectorAll('[data-intel-etapa1]').length,0);
  dom.window.close();
});
test('v807: frontend só consulta GET público sem enviar posições ou saldo',async()=>{
  const {w,draw,dom,calls}=make();
  w.S={watch:['PETR4'],trades:[],cart:{lanc:[]},olho:[]};
  draw();
  await Promise.resolve();
  assert.ok(calls.some(x=>x.url.endsWith('/v2/eventos')));
  assert.ok(calls.some(x=>x.url.endsWith('/v1/mercado')));
  assert.ok(calls.every(x=>x.params.method==='GET' && !x.params.body && x.params.credentials==='omit'));
  assert.deepEqual(w.DiarioInteligenciaEtapa1.meusAtivos(),['PETR4']);
  dom.window.close();
});
test('v807: fonte publica mantém SEC em branch e VAPID existente não é substituído',()=>{
  const worker=fs.readFileSync('cloudflare/diario-noticias/index.mjs','utf8');
  const backend=fs.readFileSync('supabase/functions/notificar/noticias-urgentes.ts','utf8');
  const prefs=fs.readFileSync('supabase/functions/notificar/index.ts','utf8');
  const html=fs.readFileSync('src/index.html','utf8'),sw=fs.readFileSync('src/service-worker.js','utf8');
  assert.match(worker,/export function lerSECAtom/);
  assert.match(backend,/sub\.id\+'\|int\|'\+evento\.id/);
  assert.match(prefs,/intelAtivos/);
  assert.match(html,/src\/intelligence\/etapa1\.js/);
  assert.match(sw,/src\/intelligence\/etapa1\.js/);
  assert.doesNotMatch(source,/setInterval\s*\(/);
});
