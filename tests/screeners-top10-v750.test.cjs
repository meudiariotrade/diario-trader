const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ranking=require('../src/analysis/screeners-top10.js');
const intel=require('../src/analysis/screeners-inteligencia.js');
const read=path=>fs.readFileSync(path,'utf8');
// Dados "de ontem": datas fixas viravam dado velho com o passar do calendário (falhou em 28/11/2026).
const ONTEM=new Date(Date.now()-864e5).toISOString().slice(0,10);
const app=read('src/analysis/analises.js'),pdf=read('src/analysis/screeners-relatorio.js'),html=read('src/index.html');
function br(ticker,index){
 const row={ticker,empresa:'Companhia '+ticker,roe:20-index/2,roic:17-index/3,pl:7+index/3,
  ev_ebitda:6+index/4,fcf_yield:7-index/5,dividend_yield:8-index/6,liquidez_diaria_brl:12000000,
  payout_implicito:45,momentum_12_1:22-index,updated_at:ONTEM,
  fundamentais_em:ONTEM,tecnicos_em:ONTEM,score_model_version:'v2.0',ativo_elegivel:true,
  data_competencia_balanco:'2026-09-30',documento_balanco_tipo:'ITR',documento_balanco_id:'123456789',
  documento_balanco_url:'https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/ITR/DADOS/',documento_balanco_publicado_em:'2026-11-14'};
 const weights=intel.weights.BR;
 row.score_quant_br=+intel.calculate('BR',row).reduce((sum,n,i)=>sum+n*weights[i].weight/100,0).toFixed(2);
 return row;
}
test('Top 10 BR: elege automaticamente dez empresas distintas com notas reais entre 0 e 10',()=>{
 const rows=Array.from({length:14},(_,i)=>br('X'+String(i).padStart(3,'0')+'3',i));
 const ranked=ranking.generate('BR',rows,intel);
 assert.equal(ranked.entries.length,10);
 assert.equal(new Set(ranked.entries.map(x=>x.row.ticker.slice(0,4))).size,10);
 assert.deepEqual(ranked.entries.map(x=>x.rank),[1,2,3,4,5,6,7,8,9,10]);
 assert.ok(ranked.entries.every(x=>x.note>=0&&x.note<=10));
 assert.ok(ranked.entries.every(x=>x.diagnosis.validated));
 assert.ok(ranked.entries.every(x=>x.reason.includes(' / ')===false));
 assert.ok(ranked.entries.every(x=>x.reason&&x.caution));
 for(let i=1;i<ranked.entries.length;i++)assert.ok(ranked.entries[i-1].score>=ranked.entries[i].score);
});
test('Top 10 exclui nota com fórmula divergente e ação duplicada da mesma companhia',()=>{
 const rows=Array.from({length:13},(_,i)=>br('L'+String(i).padStart(3,'0')+'3',i));
 rows[0].score_quant_br=99;
 const preferred={...rows[1],ticker:'L0014',empresa:rows[1].empresa,score_quant_br:rows[1].score_quant_br};
 const res=ranking.generate('BR',[...rows,preferred],intel);
 assert.ok(!res.entries.some(x=>x.row.ticker===rows[0].ticker));
 assert.ok(res.entries.filter(x=>x.row.ticker.slice(0,4)==='L001').length<=1);
 assert.equal(res.entries.length,10);
});
test('Top 10 rejeita liquidez inferior a R$ 1 milhão e DY extremo sem inventar nota',()=>{
 const rows=Array.from({length:13},(_,i)=>br('B'+String(i).padStart(3,'0')+'3',i));
 rows[0].liquidez_diaria_brl=15000;
 rows[1].dividend_yield=36;
 const r=ranking.generate('BR',rows,intel);
 assert.equal(r.entries.length,10);
 assert.ok(!r.entries.some(x=>x.row.ticker===rows[0].ticker));
 assert.ok(!r.entries.some(x=>x.row.ticker===rows[1].ticker));
});
test('EUA sem scores reais: ranking vazio, nunca inventa as dez melhores',()=>{
 const sample=[{ticker:'AAPL',company_name:'Empresa de exemplo',roic:22,forward_pe:18,
  eps_growth_yoy:12,updated_at:ONTEM,fundamentais_em:ONTEM}];
 const out=ranking.generate('US',sample,intel);
 assert.equal(out.entries.length,0);
 assert.equal(out.excluded,1);
});
test('Top 10 usa snapshot global elegível e gera PDF local sem varrer tickers',()=>{
 // v754: o ranking automático é montado sobre o universo elegível do snapshot,
 // não mais sobre a primeira página de até 50 resultados da consulta dinâmica.
 assert.match(app,/function rankedSnapshot\(snapshot\)/);
 assert.match(app,/snapshot\?\.universe_complete&&Array\.isArray\(snapshot\.universe_rows\)/);
 assert.match(app,/rows:snapshot\.universe_rows\.slice\(0,250\)/);
 assert.match(app,/s\.topData=rankedSnapshot\(snapshot\)/);
 assert.match(app,/stateNow\.topData=rankedSnapshot\(result\)/);
 assert.match(app,/getGlobalSnapshot\(m,refresh\)/);
 assert.match(app,/loadTopGlobal/);
 assert.match(app,/p(?:age)?:0|page:0/);
 assert.match(app,/s\.topData\?\.rows/);
 assert.match(app,/topTen\(m,s\)/);
 assert.match(app,/DiarioScreenersRelatorio\.share\(m\.toUpperCase\(\),rows,/);
 assert.match(pdf,/opts\.automatic/);
 assert.match(pdf,/num\(\(opts\.automatic\?s\.modelScore:s\.score\)\/10,1\)/);
 assert.doesNotMatch(pdf,/supabase\.co|SERVICE_ROLE_KEY/);
 assert.match(html,/screeners-top10\.js/);
 const sw=read('src/service-worker.js');
 assert.match(sw,/"screeners-top10\.js"/);
 assert.ok(JSON.parse(read('release.config.json')).version>=750);
});

test('Snapshot v799 prioriza Worker público e cache local, sem fallback direto ao Supabase',()=>{
 const begin=app.indexOf('async function getGlobalSnapshot('),
  end=app.indexOf('function rankedSnapshot(',begin),
  snapshot=app.slice(begin,end);
 assert.match(snapshot,/diario-screeners-quant\.lucianosilva43567\.workers\.dev\/v1\/screeners/);
 assert.match(snapshot,/const endpoints=\[\{url:edgeUrl\+path,edge:true\}\]/);
 assert.match(snapshot,/for\(const endpoint of endpoints\)/);
 assert.doesNotMatch(snapshot,/\/functions\/v1\/screeners-quant/);
 assert.match(snapshot,/if\(stored\?\.data\)\{\s*const age=Date\.now\(\)-Number\(stored\.when\|\|0\)/);
 assert.match(snapshot,/GLOBAL_OFFLINE_SLA/);
});
