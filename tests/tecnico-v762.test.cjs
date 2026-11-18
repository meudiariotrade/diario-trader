'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../src/analysis/tecnico-engine.js');
const read=p=>fs.readFileSync(p,'utf8');
function trend(dir=1,len=320,scale=1){
 return Array.from({length:len},(_,i)=>{
  const p=(dir===1?25+i*.13:85-i*.13)*scale+Math.sin(i/8)*.8;
  return [1700000000+i*86400,p,p+1.1,p-1.1,p+.12,200000+(i%12)*1000];
 });
}
test('motor: sintaxe, versão e validação OHLCV (não aceita candles sem volume)',()=>{
 for(const file of ['src/analysis/tecnico-engine.js','src/analysis/tecnico-worker.js','src/analysis/tecnico-ui.js','src/analysis/tecnico-pdf.js'])new vm.Script(read(file),{filename:file});
 assert.equal(M.VERSION,'tecnico-762.1');
 const bars=trend();assert.equal(M.normalize(bars).length,bars.length);
 assert.equal(M.normalize([...bars,[1900000000,0,2,1,1,1000]]).length,bars.length);
 assert.equal(M.one(trend(1,120),1).valid,false);
 assert.equal(M.one(trend(1,320).map(row=>[...row.slice(0,5),0]),1).valid,false);
});
test('motor: compra e venda são simétricas na tendência, com notas de 0 a 10 e quatro pilares 30/30/20/20',()=>{
 const up=trend(1),down=trend(-1);
 const u=M.examine(up,{tf:'1d',daily:up,higher:M.aggregateWeekly(up),rs:90});
 const d=M.examine(down,{tf:'1d',daily:down,higher:M.aggregateWeekly(down),rs:15});
 assert.equal(u.buy.valid,true);assert.equal(d.sell.valid,true);
 assert.ok(u.buy.score>=0&&u.buy.score<=10);
 assert.ok(d.sell.score>=0&&d.sell.score<=10);
 assert.deepEqual(u.buy.pillars.map(x=>x.weight),[30,30,20,20]);
 assert.deepEqual(d.sell.pillars.map(x=>x.weight),[30,30,20,20]);
 assert.ok(u.buy.metrics.sma20>u.buy.metrics.sma200);
 assert.ok(d.sell.metrics.sma20<d.sell.metrics.sma200);
 assert.equal(u.buy.metrics.mtf,true);
});
test('motor: não inventa alvo de alta abaixo da entrada ou R/R positivo sem projeção',()=>{
 const c=trend(),x=M.one(c,1,{tf:'1d',daily:c,higher:M.aggregateWeekly(c),rs:81});
 const p=x.plan;assert.ok(p.entry>0&&p.stop<p.entry);
 for(const k of ['target1','target2','targetFinal'])assert.ok(p[k]===null||p[k]>p.entry);
 assert.ok(p.rr===null||p.rr>0);
});
test('template não pode ser 8/8 sem RS válido; Elliott é condicional',()=>{
 const c=M.normalize(trend()),t=M.passTemplate(c,1,null,true);
 assert.equal(t.score<8,true);
 assert.ok(t.missing.some(x=>/RS Rating/.test(x)));
 assert.ok(['Possível impulso 1-2-3-4-5','Contagem invalidada','Indeterminada'].includes(M.elliott(M.swings(c),1).label));
});
test('worker recebe lote e devolve ambas as direções sem Supabase',()=>{
 const src=read('src/analysis/tecnico-worker.js'),out=[];
 const worker={DiarioTecnicoEngine:M,postMessage:r=>out.push(r)};
 vm.runInNewContext(src,{self:worker,importScripts:()=>{}});
 const up=trend(),down=trend(-1);
 worker.onmessage({data:{action:'RUN',reqId:3,tf:'1d',assets:[
  {ticker:'PETR4',market:'BR',candles:up,daily:up,higher:M.aggregateWeekly(up),name:'Petróleo'},
  {ticker:'VALE3',market:'BR',candles:down,daily:down,higher:M.aggregateWeekly(down)}],benchmarks:{BR:up}}});
 assert.equal(out.length,1);assert.equal(out[0].action,'DONE');
 assert.equal(out[0].rows.length,2);
 assert.equal(out[0].rows[0].buy.valid,true);
 assert.equal(out[0].rows[1].sell.valid,true);
 assert.equal(out[0].rows[0].buy.metrics.rs,null,'percentil não é inventado com menos de 10 pares');
});
test('roteamento técnico mantém screeners antigos e teardown idempotente por troca de aba',()=>{
 const src=read('src/analysis/analises.js'),ui=read('src/analysis/tecnico-ui.js');
 assert.match(src,/Técnico Brasil/);assert.match(src,/Técnico EUA &amp; Cripto/);
 assert.match(src,/Screener Brasil/);assert.match(src,/Screener EUA/);
 assert.match(src,/DiarioTecnico\?\.leave/);assert.match(src,/DiarioTecnico\?\.enter/);
 assert.match(ui,/new Worker\(/);assert.match(ui,/\.terminate\(\)/);
 assert.match(ui,/AbortController/);assert.match(ui,/MutationObserver/);
 assert.match(ui,/indexedDB\.open\('diario-tecnico-v762'/);
 assert.doesNotMatch(ui,/setInterval\(/);
 assert.doesNotMatch(ui,/\/rest\/v1\/|\/functions\/v1\//);
});
test('Cloudflare: histórico técnico só de fornecedores públicos e limite por símbolo',()=>{
 const edge=read('cloudflare/diario-screeners/index.mjs');
 assert.match(edge,/\/v1\/tecnico-candles/);
 assert.match(edge,/api\.binance\.com\/api\/v3\/klines/);
 assert.match(edge,/query1\.finance\.yahoo\.com/);
 assert.match(edge,/caches\.default/);
 assert.doesNotMatch(edge,/SUPABASE_SERVICE_ROLE_KEY/);
 const release=JSON.parse(read('release.config.json'));
 assert.equal(release.version,762);
 assert.equal(JSON.parse(read('package.json')).version,'762.0.0');
 for(const p of ['tecnico-engine.js','tecnico-worker.js','tecnico-ui.js','tecnico-pdf.js'])assert.ok(release.bundles[p]);
});
