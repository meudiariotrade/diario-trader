'use strict';
// v781: diagnóstico OFFLINE, determinístico e somente leitura sobre snapshot informado.
// Proibido chamar rede, SDK, Supabase, Logs/Analytics; nenhuma persistência/alteração.
const fs=require('node:fs');
const {audit,acceptance,validDoc,actualLineage}=require('./analises-auditoria-v780.cjs');
const positive=x=>typeof x==='number'&&Number.isFinite(x)&&x>0;
const fraction=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=100;
const hasDate=x=>/^\d{4}-\d\d-\d\d$/.test(String(x||''));
const fields={
 BR:{
  graham:r=>positive(r.lpa)&&positive(r.vpa),
  bazin:r=>positive(r.dpa_12m),
  bazinDinamico:r=>Array.isArray(r.dividendos_anuais)&&r.dividendos_anuais.length>=3,
  proprio:r=>positive(r.lucro_projetado_brl)&&positive(r.total_acoes)&&fraction(r.payout_projetado)
 },
 US:{
  epsTrimestral:r=>typeof r.eps_growth_yoy==='number'&&Number.isFinite(r.eps_growth_yoy),
  epsAnual:r=>typeof r.eps_growth_annual_3y==='number'&&Number.isFinite(r.eps_growth_annual_3y),
  roe:r=>typeof r.roe==='number'&&Number.isFinite(r.roe)
 }
};
function diagnostic(rows,asOf){
 if(!Array.isArray(rows)||rows.length>10000)throw Error('Snapshot limitado a 10000 ativos');
 const summary=audit(rows,{today:asOf});
 const issues=[],counts={BR:{},US:{}};
 for(const r of rows){
  if(!r||r.eligible===false||!['BR','US'].includes(r.market))continue;
  const market=r.market,ticker=String(r.ticker||'').trim().toUpperCase();
  if(!/^[A-Z0-9.-]{2,20}$/.test(ticker))continue;
  const missing=[];
  const document=validDoc(market,r,asOf);
  if(!document)missing.push('documento_oficial');
  if(market==='US'&&document){
   if(!hasDate(r.sec_facts_at)||!r.sec_source_url?.startsWith('https://data.sec.gov/api/xbrl/'))
    missing.push('sec_xbrl');
   if(!actualLineage(r,asOf))missing.push('linhagem_contabil');
  }
  for(const [key,check]of Object.entries(fields[market]))if(!check(r))missing.push(key);
  if(market==='BR'&&(!hasDate(r.fundamentais_em)||r.fundamentais_em>asOf))
   missing.push('data_fundamentos');
  for(const name of missing)counts[market][name]=(counts[market][name]||0)+1;
  if(missing.length)issues.push({market,ticker,priority:missing.includes('documento_oficial')||missing.includes('sec_xbrl')?'P0':'P1',missing});
 }
 const rank={P0:0,P1:1};
 issues.sort((a,b)=>rank[a.priority]-rank[b.priority]||b.missing.length-a.missing.length||a.market.localeCompare(b.market)||a.ticker.localeCompare(b.ticker));
 return {version:'v781.1',asOf,summary,gate:acceptance(summary,{}),
  totalIssues:issues.length,counts,issues,method:'snapshot-publico-offline',
  limitation:'Snapshots incompletos devem produzir N/D; não converter faltas em preços ou scores'};
}
function markdown(result){
 const lines=['# Diagnóstico de lacunas v781 — SEC/CVM/valuation',
  'Data: '+result.asOf+' · Universo com pendências: '+result.totalIssues,
  'Sem consultas a Supabase Logs/Analytics; indicadores não comprovados ficam N/D.',
  '## COBERTURA ORIGINAL v780',
  '| Mercado | Docs | XBRL | Linhagem |','|---|---:|---:|---:|'];
 for(const k of ['BR','US']){
  const x=result.summary.markets[k];
  lines.push('| '+k+' | '+x.docs+'/'+x.eligible+' | '+(k==='US'?x.xbrl+'/'+x.eligible:'N/A')+
   ' | '+(k==='US'?x.lineage+'/'+x.eligible:'N/A')+' |');
 }
 lines.push('## Lacunas por campo');
 for(const m of ['BR','US'])for(const [key,n]of Object.entries(result.counts[m]).sort((a,b)=>b[1]-a[1]))
  lines.push('- '+m+' / '+key+': '+n);
 lines.push('## Ativos prioritários (até 100)');
 for(const x of result.issues.slice(0,100))lines.push('- '+x.priority+' '+x.market+' '+x.ticker+': '+x.missing.join(', '));
 lines.push('Critérios de aceitação preservados: '+JSON.stringify(result.gate.checks));
 return lines.join('\n')+'\n';
}
module.exports={diagnostic,markdown};
if(require.main===module){
 try{
  const input=JSON.parse(fs.readFileSync(0,'utf8'));
  const report=diagnostic(input.rows,input.asOf||new Date().toISOString().slice(0,10));
  if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(report,null,2)+'\n');
  else process.stdout.write(markdown(report));
 }catch(e){console.error('Snapshot inválido: '+String(e.message||e));process.exitCode=1}
}
