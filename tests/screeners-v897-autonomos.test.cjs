'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const mod=require('../scripts/screeners-publicos-v897.cjs');
const sample=(m,n)=>({ok:true,market:m,universe_complete:true,last_update:new Date().toISOString(),rows:[],
 universe_rows:Array.from({length:n},(_,i)=>({ticker:(m==='BR'?'ABCD':'AAA')+String(i),ativo_elegivel:true,
  score_quant_br:50+i%10,score_quant_us:60+i%10,roe:12,roic:15,dividend_yield:3,cobertura_pct:80,setor:'Energia',sector:'Energy'}))});
test('v897: exige universo completo e não aceita dados pessoais',()=>{
 const b=sample('BR',159),u=sample('US',624);
 assert.equal(mod.valid(b,'BR'),true);assert.equal(mod.valid(u,'US'),true);
 assert.equal(mod.valid({...b,universe_rows:b.universe_rows.slice(0,20)},'BR'),false);
 assert.equal(mod.valid({...b,user_id:'alguem'},'BR'),false);
});
test('v897: formata snapshot institucional sem perder cobertura',()=>{
 const b=sample('BR',159),out=mod.computeSnapshot(b,'BR',0);
 assert.equal(out.universe_rows.length,159);assert.equal(out.rows.length,50);
 assert.equal(out.last_update,b.last_update);
 assert.equal(out.universe_complete,true);
 assert.equal(out.pipeline_origin,'github-actions-public');
});
test('v897: preserva métricas ao faltar fonte e não fabrica provas',()=>{
 const r={ticker:'PETR4',roe:20,score_quant_br:85};
 assert.equal(mod.update(r,{roe:null,roic:undefined},'BR','Desconhecida',null),false);
 assert.equal(r.roe,20);
 const u={ticker:'AAPL',roe:22};
 assert.equal(mod.secEvidence(u,{cik:'0000320193',fcf_margin:12,linhagem_indicadores:{}}),false);
});
test('v897: nenhuma rota de dados públicos depende de Supabase',()=>{
 const src=fs.readFileSync('scripts/screeners-publicos-v897.cjs','utf8');
 const cf=fs.readFileSync('cloudflare/diario-screeners/snapshot-cache-v896.mjs','utf8');
 assert.doesNotMatch(src,/https:\/\/[a-z0-9-]+\.supabase\.co/);
 assert.match(cf,/raw\.githubusercontent\.com/);
 assert.doesNotMatch(cf,/functions\/v1\/screeners-quant/);
 assert.match(src,/scanner\.tradingview\.com/);
});
