'use strict';
// v780 — auditoria offline e reprodutível: recebe um snapshot OPERACIONAL explicitamente
// exportado; nunca abre rede/SDK Supabase/Logs/Analytics e jamais altera dados.
const fs=require('node:fs');
const iso=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x||''))&&!Number.isNaN(Date.parse(x));
const afterToday=(x,today)=>!iso(x)||x>today;
const validDoc=(market,r,today)=>{
 const form=String(r.documento_balanco_tipo||''),id=String(r.documento_balanco_id||'');
 const url=String(r.documento_balanco_url||''),date=String(r.documento_balanco_publicado_em||''),
  period=String(r.data_competencia_balanco||'');
 if(!iso(date)||afterToday(date,today)||!iso(period)||afterToday(period,today)||date<period)return false;
 if(market==='US')return /^\d{10}-\d{2}-\d{6}$/.test(id)&&
  /^(10-K|10-Q|20-F|40-F)(\/A)?$/.test(form)&&
  url.startsWith('https://www.sec.gov/Archives/edgar/data/');
 if(market==='BR')return /^\d{1,18}$/.test(id)&&['ITR','DFP'].includes(form)&&
  (url.startsWith('https://dados.cvm.gov.br/')||url.startsWith('https://www.rad.cvm.gov.br/'));
 return false;
};
const actualLineage=(r,today)=>{
 const p=r.linhagem_indicadores;
 if(!p||typeof p!=='object'||Array.isArray(p))return false;
 return Object.values(p).some(v=>Array.isArray(v)&&v.some(x=>
  x&&typeof x==='object'&&
  /^\d{10}-\d{2}-\d{6}$/.test(String(x.documento_id||''))&&
  typeof x.codigo_xbrl==='string'&&x.codigo_xbrl.length>0&&
  iso(x.competencia)&&!afterToday(x.competencia,today)&&
  typeof x.valor_reportado==='number'&&Number.isFinite(x.valor_reportado)&&
  /^(USD|EUR|CAD|GBP|BRL|CHF|JPY)(\/shares)?$/.test(String(x.unidade||''))));
};
const ratio=(n,d)=>d?+((n/d)*100).toFixed(2):null;
function audit(rows,opts={}){
 const today=opts.today||new Date().toISOString().slice(0,10);
 if(!iso(today))throw Error('Data de auditoria inválida');
 if(!Array.isArray(rows)||rows.length>10000)throw Error('Auditoria exige array limitado');
 const totals={US:{eligible:0,docs:0,xbrl:0,lineage:0,exceptions:[]},
  BR:{eligible:0,docs:0,xbrl:0,lineage:0,exceptions:[]}};
 const unique=new Set();
 for(const r of rows){
  const m=r?.market,t=String(r?.ticker||'').toUpperCase();
  if(!['US','BR'].includes(m)||!/^[A-Z0-9.-]{2,20}$/.test(t))continue;
  if(unique.has(m+'|'+t))throw Error('Ticker duplicado no snapshot: '+m+' '+t);
  unique.add(m+'|'+t);
  if(r.eligible===false)continue;
  const bucket=totals[m];bucket.eligible++;
  const document=validDoc(m,r,today);
  if(document)bucket.docs++;
  else if(bucket.exceptions.length<25)bucket.exceptions.push({ticker:t,reason:String(r.documento_rastreio_motivo||'Documento oficial não comprovado').slice(0,140)});
  if(m==='US'&&document&&iso(r.sec_facts_at)&&!afterToday(r.sec_facts_at,today)&&
   /^https:\/\/data\.sec\.gov\/api\/xbrl\/companyfacts\/CIK\d{10}\.json$/.test(String(r.sec_source_url||''))){
   bucket.xbrl++;
   if(actualLineage(r,today))bucket.lineage++;
  }
 }
 return {asOf:today,markets:Object.fromEntries(Object.entries(totals).map(([market,x])=>
  [market,{...x,docRate:ratio(x.docs,x.eligible),xbrlRate:market==='US'?ratio(x.xbrl,x.eligible):null,
   lineageRate:market==='US'?ratio(x.lineage,x.eligible):null}])),
  limitation:'Cobertura documental e XBRL ≠ desempenho de trading; não é índice de recomendação'};
}
function acceptance(summary,technical){
 const us=summary.markets.US,br=summary.markets.BR;
 const checks={
  documentosEUA:us.eligible>0&&us.docRate>=98,
  documentosBrasil:br.eligible>0&&br.docRate>=95,
  fundamentosXBRL:us.eligible>0&&us.xbrlRate>=90,
  linhagemIndicadores:us.eligible>0&&us.lineageRate>=85,
  tecnicoSemLookAhead:technical?.noLookAheadVerified===true,
  estatisticaReproduzivel:technical?.outOfSampleVerified===true,
  custosEEventosAuditados:technical?.costsAndCorporateActionsVerified===true
 };
 return {approved:Object.values(checks).every(Boolean),checks,
  status:Object.values(checks).every(Boolean)?'Critérios documentais/técnicos cumpridos; validação profissional independente ainda necessária':
   'NÃO HOMOLOGADO: métricas pendentes; não prometer 100% de confiabilidade'};
}
function markdown(a,gate){
 const m=a.markets,n=x=>x===null?'N/D':x.toFixed(2)+'%';
 return ['# Auditoria operacional da aba Análises — v780',
  'Apuração: '+a.asOf+' (fotografia dos dados informados, nunca leitura automática do Supabase).',
  '| Indicador | Cobertura |','|---|---:|',
  '| Documentação SEC EUA | '+m.US.docs+'/'+m.US.eligible+' · '+n(m.US.docRate)+' |',
  '| Documentação CVM Brasil | '+m.BR.docs+'/'+m.BR.eligible+' · '+n(m.BR.docRate)+' |',
  '| XBRL EUA documentado | '+m.US.xbrl+'/'+m.US.eligible+' · '+n(m.US.xbrlRate)+' |',
  '| Indicadores com linhagem oficial SEC | '+m.US.lineage+'/'+m.US.eligible+' · '+n(m.US.lineageRate)+' |',
  '## Critérios de aceite',...Object.entries(gate.checks).map(([k,v])=>'- ['+(v?'x':' ')+'] '+k),
  '**'+gate.status+'**',
  'Não consultar Logs/Analytics do Supabase; não inferir dados de emissores pendentes.',
  'Documentos oficiais e backtest exploratório não tornam uma recomendação de investimento certificada.'].join('\n');
}
module.exports={audit,acceptance,markdown,validDoc,actualLineage};
if(require.main===module){
 try{const raw=fs.readFileSync(0,'utf8'),input=JSON.parse(raw);
  const summary=audit(input.rows,{today:input.asOf}),gate=acceptance(summary,input.technical||{});
  process.stdout.write(markdown(summary,gate)+'\n');
  if(!gate.approved)process.exitCode=2;
 }catch(e){console.error('Auditoria inválida: '+String(e.message||e));process.exitCode=1}
}
