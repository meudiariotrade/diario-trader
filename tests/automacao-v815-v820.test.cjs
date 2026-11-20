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
test('v823: séries do BC e logos na Cloudflare, com reserva no Supabase',async()=>{
  const sm=await import('../cloudflare/diario-noticias/series.mjs');
  assert.equal((await sm.seriePublica('inexistente')).status,400);
  const lm=await import('../cloudflare/diario-noticias/logos.mjs');
  assert.equal(typeof lm.resolveLogos,'function');
  const idx=fs.readFileSync('cloudflare/diario-noticias/index.mjs','utf8');
  assert.match(idx,/path==='\/v1\/series'/);assert.match(idx,/path==='\/v1\/logos'/);
  const cp=fs.readFileSync('src/shared/cache-publico.js','utf8');assert.match(cp,/v1\\\/series/);
  assert.match(fs.readFileSync('src/domains/layers/02-carteira-e-terminal.js','utf8'),/workers\.dev\/v1\/logos/);
});
test('v824: ADRs na Cloudflare sem WebSocket e com reserva no Supabase',async()=>{
  const m=await import('../cloudflare/diario-noticias/adrs.mjs');
  assert.equal(typeof m.loadQuotes,'function');assert.equal(typeof m.overnightQuotes,'function');
  assert.match(fs.readFileSync('cloudflare/diario-noticias/index.mjs','utf8'),/path==='\/v1\/adrs'/);
  assert.match(fs.readFileSync('src/shared/cache-publico.js','utf8'),/\/v1\/adrs\?s=/);
  const a=fs.readFileSync('cloudflare/diario-noticias/adrs.mjs','utf8');assert.doesNotMatch(a,/npm:ws|new WebSocket/);assert.match(a,/Upgrade:'websocket'/);
});
test('v828: componentes base do redesign escapam texto e montam as classes .ui-*',()=>{
  const win={};vm.runInNewContext(fs.readFileSync('src/shared/ui-base.js','utf8'),{window:win});
  const U=win.DiarioUI;
  assert.match(U.kpi({rotulo:'Resultado',valor:'+R$ 312,00',tom:'g'}),/class="ui-kpi".*class="ui-g"/);
  assert.match(U.card({titulo:'<b>x</b>',span:8,corpo:'<p>ok</p>'}),/ui-card ui-s8.*&lt;b&gt;x/);
  assert.match(U.badge('B3 fechada'),/ui-badge">B3 fechada/);
  const css=fs.readFileSync('src/app-theme.css','utf8');
  assert.match(css,/body:not\(\[data-v4route=term\]\)\{--dt-bg:var\(--ui-bg\)/);
  assert.match(css,/--ui-accent:#F59E0B/);
});
test('v832: snapshot público aceita tickers de uma letra (V, T, F, C) dos EUA',()=>{
  assert.match(fs.readFileSync('src/analysis/snapshot-contract-v800.js','utf8'),/\[A-Z0-9\.-\]\{1,14\}/);
  assert.match(fs.readFileSync('src/app-theme.css','utf8'),/html\[data-v427-tema=claro\]\{--ui-bg:#F3F0E8/);
});
test('v833: última vez parecida acha o dia mais recente com a mesma direção e o que veio depois',async()=>{
  const m=await import('../cloudflare/diario-noticias/analogia.mjs');
  const datas=[];for(let i=0;i<60;i++){const d=new Date(Date.UTC(2026,0,1)+i*864e5);datas.push(d.toISOString().slice(0,10));}
  const mk=(f)=>{const s=new Map();let v=100;datas.forEach((d,i)=>{v*=1+f(i)/100;s.set(d,v)});return s};
  // dia 30 e o último dia (59): tudo cai ~1%; resto oscila pouco
  const queda=(i)=>i===30||i===59?-1.2:(i%2?0.1:-0.1);
  const series={spx:mk(queda),ndx:mk(queda),ibov:mk(queda),ouro:mk(queda),btc:mk(queda),petroleo:mk(queda)};
  const a=m.calcularAnalogia(series,new Date('2026-03-01T15:00:00Z'));
  assert.equal(a.titulo,'Tudo caindo junto hoje');
  assert.equal(a.ultima.data,datas[30]);
  assert.equal(a.vezes,1);
  assert.equal(typeof a.ultima.depois5.spx,'number');
  assert.equal(m.analogiaAgora(new Date('2026-11-20T15:00:00Z')),true);
  assert.equal(m.analogiaAgora(new Date('2026-11-21T15:00:00Z')),false);
  const e=fs.readFileSync('src/intelligence/etapa1.js','utf8');
  assert.match(e,/function importante\(e\)/);assert.match(e,/VALE3/);assert.match(e,/PETR4/);
  assert.doesNotMatch(e,/>Estudar impacto</);
});
test('v835: correlação quebrada, gap desde o fechamento e reação histórica por evento',async()=>{
  const m=await import('../cloudflare/diario-noticias/extras.mjs');
  const datas=[];for(let i=0;i<70;i++)datas.push(new Date(Date.UTC(2026,5,1)+i*864e5).toISOString().slice(0,10));
  const mk=(f)=>{const s=new Map();let v=100;datas.forEach((d,i)=>{v*=1+f(i)/100;s.set(d,v)});return s};
  const base=i=>Math.sin(i)*1.5;
  const series={'PETR4.SA':mk(i=>i===69?2:base(i)),'CL=F':mk(i=>i===69?-2:base(i))};
  const p=m.avaliarPares(series).find(x=>x.id==='petr-oleo');
  assert.ok(p.correlacao60>0.9);assert.equal(p.quebrou,true);
  const ts=[1000,2000,3000],js={chart:{result:[{timestamp:ts,indicators:{quote:[{close:[100,101,99]}]}}]}};
  assert.equal(m.variacaoDesde(js,2000*1000),-1.98);
  const r=m.registrarReacoes({},[{t:'EUA: CPI (Nov. 2026)'}],{data:'2026-11-20',ret:-0.69});
  assert.deepEqual(r[m.chaveEvento('EUA: CPI (Dez. 2026)')],[{data:'2026-11-20',ibov:-0.69}]);
  assert.deepEqual(m.extrasAgora(new Date('2026-11-20T21:30:00Z')),{coleta:false,reacoes:true});
  assert.match(fs.readFileSync('cloudflare/diario-noticias/index.mjs','utf8'),/path==='\/v1\/extras'/);
  assert.match(fs.readFileSync('src/analysis/analises.js','utf8'),/Por que mexeu/);
});
