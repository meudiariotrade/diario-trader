const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync('src/shared/cache-publico.js','utf8');
function env(rows={},overlay=()=>null){
 const w={document:{hidden:false},DiarioPublico:{peek:()=>null}};
 const ctx={window:w,CQ:{d:rows},cqPf:overlay,Date,Promise};
 vm.runInNewContext(code,ctx);return w.DiarioMarketData;
}
test('USD/BRL não vira WDO e ausência não vira zero',()=>{
 const c=env({fx:{itens:[{s:'FX_IDC:USDBRL',px:5.65,d1:null}]},fut:{itens:[{s:'BMFBOVESPA:WDO1!',px:5746,d1:2}]}});
 assert.equal(c.get('BRL=X').px,5.65);assert.equal(c.get('USDBRL').d1,null);assert.equal(c.get('WDO').px,5746);
});
test('snapshot reaproveita overlay da lista e mantém preço e percentual juntos',()=>{
 const c=env({cri:{itens:[{s:'BITSTAMP:BTCUSD',px:60000,d1:-2}]}},()=>({px:60496,d1:.45,bnc:true,live:true,em:new Date().toISOString()}));
 const q=c.get('BTC-USD'),s=c.snapshot(['BTC-USD']);
 assert.equal(q.px,60496);assert.equal(s.rows['BTC-USD'].d1,.45);assert.equal(q.simboloFonte,'BINANCE:BTCUSDT');assert.equal(q.baseVariacao,'24h');assert.ok(Object.isFrozen(s.rows));
});
test('Brent sem vencimento não tem percentual; base incompatível não é inventada',()=>{
 const c=env({cmd:{itens:[{s:'ICEEUR:BRN1!',px:96,d1:2},{s:'TVC:GOLD',px:100,d1:2,fechamentoAnterior:100}]}});
 assert.equal(c.get('BZ=F').d1,null);assert.equal(c.get('GC=F').d1,null);
});
test('índice Nasdaq não é Nasdaq futuro',()=>{
 const c=env({idx:{itens:[{s:'NASDAQ:IXIC',px:23000,d1:-.6}]},fut:{itens:[{s:'CME_MINI:NQ1!',px:26000,d1:.5}]}});
 assert.equal(c.get('^IXIC').d1,-.6);assert.equal(c.get('NQ=F').d1,.5);
});

test('overlay ao vivo vencido não sobrescreve a referência pública',()=>{
 const c=env({cri:{itens:[{s:'BITSTAMP:BTCUSD',px:60000,d1:1}]}},()=>({px:60496,d1:.45,bnc:true,live:true,em:Date.now()-600000}));
 assert.equal(c.get('BTC-USD').px,60000);
});
