const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),core=read('src/domains/core/13-diagnostico-e-relatorios.js');
function setup(){
 let calls=0,resolveFetch;
 const CQ={aba:'cmd',d:{},ts:{},errors:{},loading:{},busy:''},document={hidden:false},window={};
 const ctx={CQ,CQ_ABAS:[['cmd']],CQ_EDGE_V1022:'https://example.com/v1/macro',cqIntervaloV1022:()=>30000,document,window,tab:'home',MKT:{tab:'cq'},Date,Promise,Map,AbortController,AbortSignal,URLSearchParams,cqPinta:()=>{throw Error('Mercado DOM ausente')},fetch:async()=>{calls++;return new Promise(r=>{resolveFetch=r;});}};
 vm.runInNewContext(core.slice(core.indexOf('const cqControllersV1022=new Map()'),core.indexOf('\nvar cqPonte, cqPinta;'))+'\nthis.api={cqCarrega,cqCancelarV1022};',ctx);
 const cycle=core.slice(core.indexOf('let cqTimerV1022=null;'),core.indexOf('document.addEventListener("visibilitychange",cqCicloV1022)'));
 vm.runInNewContext(cycle+'\nthis.cycle=cqCicloV1022;',ctx);
 return {CQ,document,ctx,calls:()=>calls,reply:()=>resolveFetch({ok:true,json:async()=>({itens:[{s:'SGX:FEF2!',simboloFonte:'SGX:FEFZ2026',px:88.75,d1:-1.61},{s:'ICEEUR:BRN1!',px:92.07,d1:.44}]})})};
}
test('Início consulta commodities sem DOM do Mercado; Panorama e atualização manual aguardam mesma chamada',async()=>{
 const h=setup(),a=h.ctx.api.cqCarrega('cmd',false),b=h.ctx.api.cqCarrega('cmd',true);
 await Promise.resolve();assert.equal(h.calls(),1);assert.equal(a,b);h.ctx.cycle();h.reply();await Promise.all([a,b]);assert.equal(h.CQ.d.cmd.itens[0].px,88.75);assert.equal(h.CQ.loading.cmd,false);
 await h.ctx.api.cqCarrega('cmd',false);assert.equal(h.calls(),1);
});
test('ciclo do Mercado não cancela requisição compartilhada ao renderizar Início',async()=>{
 const h=setup(),p=h.ctx.api.cqCarrega('cmd',false);await Promise.resolve();h.ctx.cycle();h.ctx.cycle();h.reply();await p;assert.equal(h.CQ.d.cmd.itens[1].px,92.07);
});
test('coleta Cloudflare 24h com intervalo de dez minutos, sem depender da sessão B3',async()=>{
 const m=await import('../cloudflare/diario-noticias/producao-snapshot-v894.mjs');
 for(const iso of ['2026-11-27T01:10:00Z','2026-11-27T05:20:00Z','2026-11-28T03:00:00Z'])assert.equal(m.coletarMercadoAgora(new Date(iso)),true);
 assert.equal(m.coletarMercadoAgora(new Date('2026-11-27T01:12:00Z')),false);
});

test('central usa a mesma seleção Profit de Mercado para mini, inclusive linha pública sem preço',()=>{
 const w={document:{hidden:false},DiarioPublico:{peek:()=>null}};
 const at=new Date().toISOString(),CQ={d:{fut:{itens:[{s:'BMFBOVESPA:WIN1!',c:'WIN',px:null},{s:'BMFBOVESPA:WDO1!',c:'WDO',px:5700},{s:'BMFBOVESPA:IND1!',c:'IND',px:178728},{s:'BMFBOVESPA:DOL1!',c:'DOL',px:5746.5}]}}};
 const overlay={WIN:{tk:'WINFUT',px:178960,em:at,fechado:true},WDO:{tk:'WDOFUT',px:5656,em:at,fechado:true}};
 vm.runInNewContext(read('src/shared/cache-publico.js'),{window:w,CQ,cqPf:r=>overlay[r.c],Date,Promise});
 assert.equal(w.DiarioMarketData.get('WIN').px,178960);assert.equal(w.DiarioMarketData.get('WDO').px,5656);
 assert.equal(w.DiarioMarketData.get('WIN').priceAt,at);
 overlay.WIN={tk:'INDZ26',px:178728,em:at,fechado:true};assert.equal(w.DiarioMarketData.get('WIN'),null);
 overlay.WDO={tk:'DOLZ26',px:5746.5,em:at,fechado:true};assert.equal(w.DiarioMarketData.get('WDO').px,5700);
});


// v1032: fixture simulada, sem dependência de rede ou de dados em produção.
const sinaFixture=(px='657.5',ant='661.5',date='2026-11-27',time='100000')=>{
 const f=['Iron',time,'660','665','650','661','657','658',px,'0',ant,'1','1','100','100','DCE','I',date];
 return 'var hq_str_nf_I0="'+f.join(',')+'";';
};
test('SINA I0: usa último preço e ajuste anterior do mesmo instrumento, mantém yuan e horário da China',async()=>{
 const m=await import('../cloudflare/diario-noticias/producao-snapshot-v894.mjs');
 const now=Date.parse('2026-11-27T02:01:00Z'),q=m.parseSinaDalianV1032(sinaFixture(),now);
 assert.equal(q.px,657.5);assert.equal(q.fechamentoAnterior,661.5);
 assert.equal(q.simboloFonte,'SINA:I0');assert.equal(q.fonte,'Sina');
 assert.ok(Math.abs(q.d1-(657.5/661.5-1)*100)<1e-9);
 assert.equal(q.priceAt,'2026-11-27T02:00:00.000Z');
 assert.equal(m.parseSinaDalianV1032(sinaFixture('0'),now),null);
 assert.equal(m.parseSinaDalianV1032(sinaFixture('657.5','0'),now),null);
 assert.equal(m.parseSinaDalianV1032(sinaFixture().replace('nf_I0','nf_I2701'),now),null);
 assert.equal(m.parseSinaDalianV1032(sinaFixture('657.5','661.5','2026-11-28'),now).priceAt,null);
});
test('snapshot central inclui Dalian SINA sem abrir Commodities e sem confundir FEF2',async()=>{
 const m=await import('../cloudflare/diario-noticias/producao-snapshot-v894.mjs');
 const now=Date.parse('2026-11-27T02:01:00Z');
 const fetcher=async(url,opt)=>{
  if(String(url).includes('sinajs.cn'))return new Response(sinaFixture());
  const b=JSON.parse(opt.body),rows=b.symbols.tickers.filter(s=>s!=='DCE:I1!').map(s=>({s,d:b.columns.map(k=>({close:88.75,change:0,change_abs:0,update_time:now/1000,update_mode:'delayed'}[k]??null))}));
  return Response.json({data:rows});
 };
 const snap=await m.coletarMercado(fetcher,now),cmd=snap.mercados.grupos.find(g=>g.g==='Commodities').itens;
 assert.equal(cmd.filter(r=>r.s==='DCE:I1!').length,1);
 assert.equal(cmd.find(r=>r.s==='DCE:I1!').px,657.5);
 assert.equal(cmd.find(r=>r.s==='DCE:I1!').source,'Sina');
 assert.equal(cmd.find(r=>r.s==='SGX:FEF2!').px,88.75);
 const noSina=await m.coletarMercado(async(u,o)=>String(u).includes('sinajs.cn')?new Response('',{status:503}):fetcher(u,o),now);
 assert.equal(noSina.mercados.grupos.find(g=>g.g==='Commodities').itens.some(r=>r.s==='DCE:I1!'),false);
});
test('lista de commodities usa SINA sem depender de TradingView DCE',async()=>{
 const m=await import('../cloudflare/diario-noticias/producao-snapshot-v894.mjs');
 const original=global.fetch;
 try{
  global.fetch=async(url,opt)=>{
   if(String(url).includes('sinajs.cn'))return new Response(sinaFixture('657.5','661.5',new Date().toISOString().slice(0,10),'000000'));
   return Response.json({data:[]});
  };
  const response=await m.default.fetch(new Request('https://example.com/v1/macro?modo=cotacoes&aba=cmd'),{});
  assert.equal(response.status,200);
  const j=await response.json(),q=j.itens.find(r=>r.s==='DCE:I1!');
  assert.equal(q.px,657.5);assert.equal(q.fonte,'Sina');assert.equal(q.simboloFonte,'SINA:I0');
 }finally{global.fetch=original}
});
