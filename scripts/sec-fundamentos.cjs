'use strict';
// v858: fundamentos anuais dos EUA direto do SEC EDGAR XBRL (10-K/20-F/40-F) com prova por indicador.
// Roda no GitHub Actions; o app lê o JSON estático. Nenhum dado privado, nenhum acesso ao Supabase.
// Metodologia (Faber/Morningstar/CFA): Total Yield = (dividendos pagos + recompras − emissões) ÷ valor de mercado;
// margem de FCF = (caixa operacional − capex) ÷ receita; crescimento anual de receita e EPS diluído.
const fs=require('node:fs'),path=require('node:path');
const OUT=path.resolve(__dirname,'../dados-publicos/sec-fundamentos.json');
const SNAP='https://diario-screeners-quant.lucianosilva43567.workers.dev/v1/screeners?market=US&snapshot=1&universe=1';
const EDGE='https://diario-screeners-quant.lucianosilva43567.workers.dev/v1/sec-xbrl?cik=';
const UA={'User-Agent':'DiarioTraderQuant/1.0 (contato@diariotrader.app)',Accept:'application/json'};
const ANUAL=new Set(['10-K','10-K/A','20-F','20-F/A','40-F','40-F/A']);
const DIA=864e5,sleep=ms=>new Promise(r=>setTimeout(r,ms));
const dias=(a,b)=>(Date.parse(b)-Date.parse(a))/DIA;
const r4=n=>Number.isFinite(n)?Math.round(n*10000)/10000:null;
const CAPEX=['PaymentsToAcquirePropertyPlantAndEquipment','PaymentsToAcquireProductiveAssets','PaymentsForCapitalImprovements','PaymentsToAcquireOilAndGasPropertyAndEquipment','PaymentsToAcquireOilAndGasProperty'];
const REV=['RevenueFromContractWithCustomerExcludingAssessedTax','RevenueFromContractWithCustomerIncludingAssessedTax','Revenues','SalesRevenueNet'];

// Fluxos anuais (≈1 ano) de um conceito, por fim de exercício; para cada fim, o 10-K mais antigo que o reportou
// (documento original do exercício), ignorando reapresentações em arquivos posteriores.
function anuais(facts,tag,unit='USD'){
 const rows=facts?.['us-gaap']?.[tag]?.units?.[unit]||[],por=new Map();
 for(const x of rows){
  if(!ANUAL.has(String(x.form))||!x.start||!x.end||!x.filed||typeof x.val!=='number'||!Number.isFinite(x.val))continue;
  if(!/^\d{10}-\d{2}-\d{6}$/.test(String(x.accn||'')))continue;
  const d=dias(x.start,x.end);if(d<330||d>390)continue;
  const old=por.get(x.end);if(!old||x.filed<old.filed)por.set(x.end,x);
 }
 return [...por.values()].sort((a,b)=>b.end.localeCompare(a.end));
}
const prova=(x,tag,unit)=>({documento_id:x.accn,competencia:x.end,publicado_em:x.filed,periodo_inicio:x.start,
 namespace:'us-gaap',codigo_xbrl:tag,unidade:unit,valor_reportado:x.val});
function primeiro(facts,tags,unit='USD'){for(const t of tags){const a=anuais(facts,t,unit);if(a.length)return {tag:t,rows:a}}return null}
// Mesmo conceito, exercícios consecutivos (320–410 dias entre os fins).
function crescimento(serie,unit){
 if(!serie||serie.rows.length<2)return null;
 const [cur,prev]=serie.rows,gap=dias(prev.end,cur.end);
 if(gap<320||gap>410||!(prev.val>0))return null;
 return {valor:r4((cur.val/prev.val-1)*100),prova:[prova(cur,serie.tag,unit),prova(prev,serie.tag,unit)]};
}
// Caixa operacional, capex e receita do MESMO documento e período.
function margemFcf(facts){
 const cfo=anuais(facts,'NetCashProvidedByUsedInOperatingActivities')[0];if(!cfo)return null;
 let capex=null,capexTag='';
 for(const t of CAPEX){const x=anuais(facts,t).find(r=>r.end===cfo.end&&r.accn===cfo.accn);if(x){capex=x;capexTag=t;break}}
 if(!capex)return null;
 for(const t of REV){
  const rev=anuais(facts,t).find(x=>x.end===cfo.end);
  if(!rev||!(rev.val>0))continue;
  // As três linhas precisam citar o mesmo 10-K: usa o arquivo do fluxo de caixa quando coincide.
  const mesmo=[cfo,capex,rev].every(x=>x.accn===cfo.accn&&x.start===cfo.start);
  if(!mesmo)return null;
  return {valor:r4((cfo.val-capex.val)/rev.val*100),prova:[prova(cfo,'NetCashProvidedByUsedInOperatingActivities','USD'),
   prova(capex,capexTag,'USD'),prova(rev,t,'USD')]};
 }
 return null;
}
function retorno(facts,cap){
 const base=anuais(facts,'NetCashProvidedByUsedInOperatingActivities')[0]||primeiro(facts,REV)?.rows[0];
 if(!base||!(cap>0))return null;
 const no=(tags)=>{for(const t of tags){const x=anuais(facts,t).find(r=>r.end===base.end);if(x)return {tag:t,x}}return null};
 const rec=no(['PaymentsForRepurchaseOfCommonStock']),emi=no(['ProceedsFromIssuanceOfCommonStock']),
  div=no(['PaymentsOfDividendsCommonStock','PaymentsOfDividends']);
 if(!rec&&!div)return null;
 const recompra=Math.abs(rec?.x.val||0),emissao=Math.abs(emi?.x.val||0),dividendos=Math.abs(div?.x.val||0);
 const liquida=recompra-emissao;
 return {exercicio:base.end,recompra_usd:recompra,emissao_usd:emissao,dividendos_pagos_usd:dividendos,
  buyback_yield:r4(liquida/cap*100),dividendos_pagos_yield:r4(dividendos/cap*100),
  total_shareholder_yield:r4((dividendos+liquida)/cap*100),
  prova:[rec&&prova(rec.x,rec.tag,'USD'),emi&&prova(emi.x,emi.tag,'USD'),div&&prova(div.x,div.tag,'USD')].filter(Boolean)};
}
async function json(url,headers){const r=await fetch(url,{headers,signal:AbortSignal.timeout(25000)});return {status:r.status,body:r.ok?await r.json():null}}
async function fatos(cik,estado){
 if(!estado.borda){
  const r=await json('https://data.sec.gov/api/xbrl/companyfacts/CIK'+cik+'.json',UA).catch(()=>({status:0}));
  if(r.body)return r.body.facts;
  if(r.status===403||r.status===429){estado.borda=true;console.log('SEC direta recusou ('+r.status+'); usando a borda Cloudflare')}
  else if(r.status===404)return null;
 }
 const e=await json(EDGE+cik,{Accept:'application/json'}).catch(()=>({status:0}));
 return e.body?.facts||null;
}
(async()=>{
 const snap=await fetch(SNAP,{signal:AbortSignal.timeout(30000)}).then(r=>r.json());
 // v1053: usa o CIK da própria linha (100% preenchido) quando a URL da SEC não veio no snapshot.
 const cikDe=x=>(String(x?.sec_source_url||'').match(/CIK(\d{10})/)||[])[1]||(/^\d{1,10}$/.test(String(x?.cik||''))?String(x.cik).padStart(10,'0'):null);
 const rows=(snap.universe_rows||snap.rows||[]).filter(x=>x?.ticker&&cikDe(x));
 const estado={borda:false},tickers={};let ok=0,falhas=0;
 for(const row of rows){
  const cik=cikDe(row);
  try{
   const f=await fatos(cik,estado);if(!f){falhas++;continue}
   const cap=Number(row.market_cap_usd);
   const rec=crescimento(primeiro(f,REV),'USD'),eps=crescimento(primeiro(f,['EarningsPerShareDiluted'],'USD/shares'),'USD/shares'),
    fcf=margemFcf(f),ret=retorno(f,cap);
   // v1053: remuneração em ações (% da receita, mesmo exercício) e série anual de receita (até 6 anos).
   const revS=primeiro(f,REV),sbcX=anuais(f,'ShareBasedCompensation')[0],revSbc=sbcX&&revS?.rows.find(x=>x.end===sbcX.end&&x.val>0);
   const sbc=sbcX&&revSbc?{valor:r4(sbcX.val/revSbc.val*100),prova:[prova(sbcX,'ShareBasedCompensation','USD'),prova(revSbc,revS.tag,'USD')]}:null;
   const serieRec=revS?revS.rows.slice(0,6).map(x=>({fim:x.end,valor:x.val,documento_id:x.accn})):[];
   const c3=serieRec.length>=4&&serieRec[3].valor>0&&serieRec[0].valor>0?r4((Math.pow(serieRec[0].valor/serieRec[3].valor,1/3)-1)*100):null;
   if(!rec&&!eps&&!fcf&&!ret&&!sbc){falhas++;continue}
   const o={cik};
   if(sbc)o.stock_based_compensation=sbc.valor;if(serieRec.length>=3)o.serie_receita=serieRec;if(c3!==null)o.cagr_receita_3a=c3;
   if(rec)o.revenue_growth_yoy=rec.valor;if(eps)o.eps_growth_yoy=eps.valor;if(fcf)o.fcf_margin=fcf.valor;
   if(ret)Object.assign(o,{buyback_yield:ret.buyback_yield,total_shareholder_yield:ret.total_shareholder_yield,
    dividendos_pagos_yield:ret.dividendos_pagos_yield,retorno_exercicio:ret.exercicio,
    recompra_usd:ret.recompra_usd,emissao_usd:ret.emissao_usd,dividendos_pagos_usd:ret.dividendos_pagos_usd,market_cap_usd:cap});
   o.linhagem_indicadores={};
   if(rec)o.linhagem_indicadores.revenue_growth_yoy=rec.prova;
   if(eps)o.linhagem_indicadores.eps_growth_yoy=eps.prova;
   if(fcf)o.linhagem_indicadores.fcf_margin=fcf.prova;
   if(ret)o.linhagem_indicadores.total_shareholder_yield=ret.prova;
   if(sbc)o.linhagem_indicadores.stock_based_compensation=sbc.prova;
   tickers[row.ticker]=o;ok++;
  }catch(e){falhas++}
  await sleep(estado.borda?150:130); // abaixo de 10 req/s exigidos pela SEC
 }
 if(ok<50)throw Error('Poucas empresas com fatos SEC ('+ok+'); arquivo anterior mantido');
 const body={gerado_em:new Date().toISOString(),fonte:'SEC EDGAR XBRL Companyfacts (10-K/20-F/40-F)',
  metodo:'Total Yield = (dividendos pagos + recompras − emissões de ações) ÷ valor de mercado; margem FCF = (caixa operacional − capex) ÷ receita; crescimento anual de receita e EPS diluído no mesmo conceito XBRL',
  empresas:ok,falhas,tickers};
 fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(body));
 console.log('SEC fundamentos:',ok,'empresas,',falhas,'sem fatos');
})().catch(e=>{console.error(String(e));process.exit(1)});
