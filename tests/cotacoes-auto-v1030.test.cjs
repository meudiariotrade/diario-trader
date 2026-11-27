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
