const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const src=fs.readFileSync('src/domains/core/08-terminal-e-sazonalidade.js','utf8');
const layer=fs.readFileSync('src/domains/layers/01-navegacao-e-fluxos.js','utf8');
const section=src.slice(src.indexOf('function imgBrent955('),src.indexOf('function imgDesenha()'));
const groups={
 cmd:['SGX:FEF1!','DCE:I1!','ICEEUR:BRN1!','NYMEX:CL1!','TVC:GOLD'],
 fut:['CME_MINI:ES1!','CME_MINI:NQ1!'],
 fx:['FX_IDC:USDBRL','TVC:DXY'],
 idx:['BMFBOVESPA:IBOV','TVC:NI225','XETR:DAX'],
 cri:['BITSTAMP:BTCUSD','BITSTAMP:ETHUSD']
};
const make=(fail=[],window={})=>{
 const calls=[],CQ={d:{}},IMG={},MDO={v:null};
 const fetch=async url=>{
  const u=new URL(url),aba=u.searchParams.get('aba');
  calls.push(aba);
  assert.equal(u.searchParams.get('modo'),'cotacoes');
  if(fail.includes(aba))throw Error('offline');
  return {ok:true,json:async()=>({itens:groups[aba].map(s=>({s,px:100,d1:1, ...(s==='ICEEUR:BRN1!'?{simboloFonte:'ICEEUR:BRNF2027',fechamentoAnterior:100/1.01,quoteStatus:'coerente'}:{})}))})};
 };
 const ctx=vm.createContext({IMG,MDO,CQ,fetch,URLSearchParams,AbortController,setTimeout,clearTimeout,window,SESS:{at:'mock'},AD:{data:{itens:[{}]},err:''},adrLoad:async()=>true,CQ_EDGE_V1022:'https://worker.test/v1/macro'});
 vm.runInContext(section+'\nthis.api={imgQ,imgDados,imgListasV1025,imgSimbolosPublicos}',ctx);
 return {calls,CQ,IMG,api:ctx.api,MDO};
};
test('v1025 card frio usa as cinco listas da aba Mercado e resolve todos os 14 ativos',async()=>{
 const {calls,api,IMG}=make();await api.imgDados();
 assert.equal(calls.length,5);assert.equal(new Set(calls).size,5);
 assert.equal(Object.keys(api.imgSimbolosPublicos).length,14);
 for(const s of Object.keys(api.imgSimbolosPublicos)){assert.equal(api.imgQ(s).px,100,s);assert.equal(api.imgQ(s).d1,1,s)}
 assert.equal(IMG.aviso,'');
});
test('v1025 falha parcial usa cache local sem fabricar cotação nem perder outras listas',async()=>{
 const {api,CQ,IMG}=make(['cri']);
 CQ.d.cri={itens:[{s:'BITSTAMP:BTCUSD',px:95,d1:0},{s:'BITSTAMP:ETHUSD',px:null}]};
 await api.imgDados();assert.equal(api.imgQ('BTC-USD').px,95);assert.equal(api.imgQ('BTC-USD').d1,0);
 assert.equal(api.imgQ('ETH-USD'),null);assert.equal(api.imgQ('ES=F').px,100);
 assert.match(IMG.aviso,/CONSULTA ANTERIOR/);assert.match(IMG.aviso,/1 ATIVOS SEM PREÇO/);
});
test('v1025 Brent mantém preço da lista mas oculta variação sem contrato/base coerentes',async()=>{
 const {api,IMG}=make();await api.imgDados();
 IMG.cotacoesPublicas=[{s:'ICEEUR:BRN1!',px:80,d1:8}];
 assert.equal(api.imgQ('BZ=F').px,80);assert.equal(api.imgQ('BZ=F').d1,null);
 IMG.cotacoesPublicas=[{s:'ICEEUR:BRN1!',px:80,d1:8,suspeito:true}];assert.equal(api.imgQ('BZ=F'),null);
});
test('v1025 camada legada executa carregador do core em vez de sobrescrever seu trabalho',()=>{
 assert.match(layer,/imgDados = \(\(carregar\) => async function/);
 assert.match(layer,/carregar\.apply\(this, arguments\)/);
 assert.doesNotMatch(layer,/m = await Promise\.allSettled\(\[mdoCarrega\(!0\), adrLoad\(!0\), P\(\)\]\)/);
});

test('v1026 Panorama congela a mesma cotação da central e não volta a consultar as cinco listas',async()=>{
 const row={s:'BITSTAMP:BTCUSD',px:60496,d1:.45,simboloFonte:'BINANCE:BTCUSDT',baseVariacao:'24h',fonte:'Binance'};
 let refreshes=0,current=row;
 const central={refresh:async()=>{refreshes++},snapshot:()=>({id:'snapshot',rows:{'BTC-USD':current}})};
 const {api,calls,IMG}=make([],{DiarioMarketData:central});
 await api.imgDados();current={...row,px:60373,d1:-.02};
 assert.equal(refreshes,1);assert.equal(calls.length,0);assert.equal(IMG.snapshot1026,'snapshot');
 assert.equal(api.imgQ('BTC-USD').px,60496);assert.equal(api.imgQ('BTC-USD').d1,.45);
});