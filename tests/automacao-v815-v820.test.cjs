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
test('v836: preços e candles na Cloudflare com volta ao Supabase, mais fontes e layout em colunas no PC',async()=>{
  const p=await import('../cloudflare/diario-noticias/precos.mjs');
  assert.equal(p.temChaves({}),false);assert.equal(p.temChaves({TWELVE_KEY:'x'}),true);
  const f=async(u)=>({json:async()=>u.includes('brapi')?{results:[{symbol:'PETR4',regularMarketPrice:38.5}]}:{AAPL:{price:'230'},'USD/BRL':{price:'5.4'}}});
  const v=await p.buscarPrecos({BRAPI_TOKEN:'a',TWELVE_KEY:'b'},['petr4'],['aapl'],f);
  assert.equal(v.br.PETR4,38.5);assert.equal(v.us.AAPL,230);assert.equal(v.fx,5.4);
  const c=await import('../cloudflare/diario-noticias/candles.mjs');
  assert.equal(c.mapa('WDOZ26').mult,1000);assert.equal(c.mapa('PETR4').y,'PETR4.SA');
  assert.equal(c.janela('2026-11-20T10:00','2026-11-20T11:00',Date.parse('2026-11-21T00:00:00Z')/1000).intervalo,'5m');
  const w=fs.readFileSync('cloudflare/diario-noticias/index.mjs','utf8');
  assert.ok(w.indexOf("path==='/v1/precos'")<w.indexOf("if(!['/v1/noticias'"));
  assert.ok(w.indexOf("path==='/v1/candles'")<w.indexOf("if(!['/v1/noticias'"));
  for(const h of ['estadao.com.br','bloomberglinea','investing.com','cnbc.com','federalreserve.gov'])assert.match(w,new RegExp(h.replace('.','\\.')));
  const s=fs.readFileSync('src/shared/cache-publico.js','utf8');
  assert.match(s,/precos\|candles\|macro\|ewz/);assert.match(s,/b\.modo==='replay'\?null/);assert.match(s,/return nativo\(input,init\)/);
  const css=fs.readFileSync('src/app-theme.css','utf8');
  assert.match(css,/m404-internal>\.m404-panel\{flex:999/);assert.match(css,/#cotbox \.m623-term\{display:block!important;column-count:3/);
  assert.match(css,/dt395-native-imposto,[\s\S]*column-count:2/);
});
test('v836b: Macro, EWZ e candles do Radar na Cloudflare (gerados da fonte do Supabase)',async()=>{
  const {execFileSync}=require('node:child_process');
  const antes=['macro-gerado.mjs','ewz-gerado.mjs'].map(f=>fs.readFileSync('cloudflare/diario-noticias/'+f,'utf8'));
  execFileSync(process.execPath,['scripts/gerar-worker-macro.cjs'],{stdio:'ignore'});
  const depois=['macro-gerado.mjs','ewz-gerado.mjs'].map(f=>fs.readFileSync('cloudflare/diario-noticias/'+f,'utf8'));
  assert.deepEqual(depois,antes,'rode node scripts/gerar-worker-macro.cjs depois de mexer em macro/ewz');
  const m=await import('../cloudflare/diario-noticias/macro-gerado.mjs');
  assert.equal(typeof m.macroResponder,'function');assert.equal((await m.macroResponder({modo:'xyz'})).status,400);
  const e=await import('../cloudflare/diario-noticias/ewz.mjs');
  assert.equal(e.ewzColetaAgora(null,new Date('2026-11-20T15:00:00Z')),true);
  assert.equal(e.ewzColetaAgora({ts:'2026-11-20T14:58:00Z'},new Date('2026-11-20T15:00:00Z')),false);
  assert.equal(e.ewzColetaAgora(null,new Date('2026-11-21T15:00:00Z')),false);
  const C=[{s:'EWZ261218C00030000',venc:'2026-12-18',t:'C',k:30,bid:1,ask:1.2,last:1.2,vol:5000,oi:100,iv:.3,d:.5,g:.1,lado:'C',prem:600000}];
  const d1=e.ewzAvanca(null,C,30,{dia:'2026-11-20',min:600,semana:5},'2026-11-20T15:00:00Z',.25);
  const d2=e.ewzAvanca(d1,C,30,{dia:'2026-11-23',min:600,semana:1},'2026-11-23T15:00:00Z',.25);
  assert.equal(d2.oiAnt.dia,'2026-11-20');assert.equal(d2.serie.length,1);
  const w=fs.readFileSync('cloudflare/diario-noticias/index.mjs','utf8');
  for(const r of ['/v1/macro','/v1/ewz','/v1/diario'])assert.ok(w.indexOf("path==='"+r+"'")<w.indexOf("if(!['/v1/noticias'"),r);
  assert.match(w,/ewzColeta\(env,fetch/);
  const s=fs.readFileSync('src/shared/cache-publico.js','utf8');
  assert.match(s,/b\.modo==='diag'\?null/);assert.match(s,/nHist>=20/);
  assert.match(fs.readFileSync('supabase/functions/radar/index.ts','utf8'),/workers\.dev\/v1\/diario/);
});
test('v838: tom da notícia, seus ativos primeiro no pregão e pontos para amanhã',()=>{
  const e=fs.readFileSync('src/intelligence/etapa1.js','utf8');
  assert.match(e,/function sentimento\(e\)/);assert.match(e,/function minha\(e\)/);assert.match(e,/function pontosDoDia\(hoje, proxima\)/);
  assert.match(e,/fase==='during'\?todas\.filter\(minha\)/);
  assert.match(e,/request\('\/v1\/agenda\?semana=0'/);
  assert.match(e,/localStorage\.setItem\(PONTOS_KEY/);
  assert.doesNotMatch(e.slice(e.indexOf('function pontosDoDia'),e.indexOf('function pontosHtml')),/supabase|functions\/v1/i);
  const ctx={window:{},document:{addEventListener(){},removeEventListener(){},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]},addEventListener(){},removeEventListener(){},setTimeout,clearTimeout,localStorage:{getItem:()=>null,setItem(){}},console};ctx.window=ctx;
  vm.runInNewContext(e,ctx);
  const I=ctx.DiarioInteligenciaEtapa1;
  assert.equal(I.sentimento({titulo:'Petrobras sobe com alta do petróleo'}),'pos');
  assert.equal(I.sentimento({titulo:'Vale cai após queda do minério'}),'neg');
  assert.equal(I.sentimento({titulo:'Copom mantém Selic'}),'neu');
  assert.match(fs.readFileSync('src/app-theme.css','utf8'),/\.i838-pos\{color:#10B981/);
});
test('v839: preço teto da fórmula do usuário, Bazin e Graham com estimativa do snapshot',()=>{
  const I=require('../src/analysis/screeners-inteligencia.js');
  assert.equal(+I.precoTeto(14613000000,25,5730834040,.07).toFixed(2),9.11);
  const row={ticker:'X',preco_referencia:8,pl:6,pvp:1.2,dividend_yield:9,valor_mercado_brl:8*5730834040,payout_implicito:54};
  const v=I.valuationBR(row,{yieldAceitavel:.07});
  assert.equal(+v.methods.bazin.toFixed(2),12);assert.equal(+v.methods.graham.toFixed(2),14.14);
  assert.deepEqual(v.estimados,{proprio:true,bazin:true,graham:true});
  assert.equal(v.scoreActive,false,'estimativa não entra na nota');
  const m=I.valuationBR(row,{manual:{lucro:14613000000,payout:25,acoes:5730834040,yield:.07}});
  assert.equal(+m.methods.proprio.toFixed(2),9.11);assert.equal(m.estimados.proprio,undefined);assert.ok(m.margins.proprio>0);
  const a=fs.readFileSync('src/analysis/analises.js','utf8');
  assert.match(a,/\['__teto','Preço teto'\],\['__margem','Margem'\]/);assert.match(a,/Abaixo do teto/);
  assert.match(a,/data-scr-teto-save/);assert.match(a,/localStorage\.setItem\(TETO_KEY/);
  assert.match(a,/\['bazinDinamico','Bazin dinâmico'\]/);
});
