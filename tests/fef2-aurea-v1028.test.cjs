const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8'),central=read('src/shared/cache-publico.js'),intel=read('src/intelligence/etapa1.js');
test('FEF2 jamais usa FEF1 ou COMEX no lugar',()=>{
 const w={document:{hidden:false},DiarioPublico:{peek:()=>({mercados:{grupos:[{itens:[{s:'TIO=F',simboloFonte:'SGX:FEF1!',px:90,d1:1}]}]}})}};const CQ={d:{cmd:{itens:[{s:'SGX:FEF1!',px:90,d1:1}]}}};
 vm.runInNewContext(central,{window:w,CQ,Date,Promise});
 assert.equal(w.DiarioMarketData.get('TIO=F'),null);
 CQ.d.cmd.itens.push({s:'SGX:FEF2!',px:88.7,d1:-1.66});
 assert.equal(w.DiarioMarketData.get('TIO=F').px,88.7);assert.equal(w.DiarioMarketData.get('TIO=F').d1,-1.66);
});
test('Áurea mostra dois petróleos e futuros separados, sem alterar pesos',()=>{
 const start=intel.indexOf('function pulsoDoisMercados()'),end=intel.indexOf('function sinalNum(',start);
 const w={DiarioMarketData:{has:()=>true,get:k=>({px:100,d1:k==='ES=F'?1:0.5,fonte:'TV'})},DiarioSessoes:{context:()=>({us:{state:'fechado'}})}};
 const ctx={w,state:{mercado:null},sinalNum:String};vm.runInNewContext(intel.slice(start,end),ctx);
 const p=ctx.pulsoDoisMercados();assert.ok(p.us.some(x=>x.n==='Brent'));assert.ok(p.us.some(x=>x.n==='WTI'));assert.ok(p.futuros.some(x=>x.n==='S&P fut.'));assert.ok(p.futuros.some(x=>x.n==='Nasdaq fut.'));assert.match(p.texto,/Futuros:/);assert.match(intel,/add\(sp,30\);add\(nq,25\)/);
});
test('Worker mantém FEF1 na curva e FEF2 no painel',()=>{
 const worker=read('cloudflare/diario-noticias/producao-snapshot-v894.mjs');assert.match(worker,/"TIO=F":\["SGX:FEF2!"\]/);assert.match(worker,/fef1:\["SGX:FEF1!"/);assert.match(worker,/s:"SGX:FEF2!"/);
});
test('tema claro explicita contraste do Termômetro',()=>assert.match(read('src/app-theme.css'),/v1028 — contraste do Termômetro/));
