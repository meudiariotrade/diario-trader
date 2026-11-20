const test=require('node:test'),assert=require('node:assert'),fs=require('node:fs'),vm=require('node:vm');
test('v820: Juros na Cloudflare tem vértices do DI, Copom e rota pública',async()=>{
  const m=await import('../cloudflare/diario-noticias/juros.mjs');
  assert.equal(typeof m.coletarJuros,'function');
  assert.ok(m.vertices(new Date('2026-11-20T12:00:00Z')).length>=10);
  assert.match(m.copom('2026-11-20').proxima.decisao,/^2026-12-\d\d$/);
  const idx=fs.readFileSync('cloudflare/diario-noticias/index.mjs','utf8');
  assert.match(idx,/'\/v1\/juros'/);
  assert.match(fs.readFileSync('src/shared/cache-publico.js','utf8'),/'\/v1\/juros'/);
});
test('v815: barra de contexto guarda o ativo em foco e publica no barramento',()=>{
  const store={},pub=[];
  const win={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)}},addEventListener(){},
    DiarioInteligencia:{normalizeTicker:t=>/^[A-Z0-9]{4,6}$/.test(String(t).toUpperCase())?String(t).toUpperCase():null,selectAsset:(t,o)=>pub.push([t,o]),getSelectedAsset:()=>null},
    setInterval(){},setTimeout(){}};
  const doc={hidden:false,addEventListener(){},getElementById:()=>null};
  vm.runInNewContext(fs.readFileSync('src/shared/barra-contexto.js','utf8'),{window:win,document:doc,localStorage:win.localStorage,setInterval(){},setTimeout(){},CustomEvent:function(){}});
  assert.equal(win.DiarioBarraContexto.definirFoco('petr4','teste'),true);
  assert.equal(store['diario-foco-v815'],'PETR4');
  assert.deepEqual(pub.at(-1),['PETR4','teste']);
  assert.equal(win.DiarioBarraContexto.definirFoco('x!','teste'),false);
});
test('v817: Fibonaccing sem notação em R',()=>{
  const s=fs.readFileSync('src/analysis/fibo-visual.js','utf8');
  assert.doesNotMatch(s,/\+'R'\)/);
  assert.match(s,/vezes o risco/);
});
