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
test('v822: níveis do plano por ativo, com validade e sem valores inválidos',()=>{
  const store={},evs=[];
  const win={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)}},dispatchEvent:e=>evs.push(e)};
  vm.runInNewContext(fs.readFileSync('src/shared/niveis-plano.js','utf8'),{window:win,document:null,CustomEvent:function(t,o){this.type=t;this.detail=o&&o.detail}});
  assert.equal(win.DiarioNiveis.set('petr4',{entrada:'37,60',stop:37.2,alvos:['38,4','x',null]}),true);
  const n=win.DiarioNiveis.get('PETR4');
  assert.equal(n.entrada,37.6);assert.equal(n.stop,37.2);assert.deepEqual(n.alvos,[38.4]);
  assert.equal(win.DiarioNiveis.set('VALE3',{entrada:'',stop:null,alvos:[]}),false);
  const o=JSON.parse(store['diario-niveis-v822']);o.PETR4.em=Date.now()-8*864e5;store['diario-niveis-v822']=JSON.stringify(o);
  assert.equal(win.DiarioNiveis.get('PETR4'),null);
  assert.match(fs.readFileSync('src/domains/core/17-fontes-e-balancos.js','utf8'),/DiarioNiveis\.get\(F\)/);
});
