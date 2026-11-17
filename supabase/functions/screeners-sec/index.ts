// Fonte SEC/XBRL para Análises. Back-end isolado, sem credenciais no browser.
// Sem downloads de ZIP em Edge Functions, sem polling; batches pequenos de 12 empresas.
const SB=Deno.env.get('SUPABASE_URL')||'',SVC=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const HEAD={apikey:SVC,Authorization:'Bearer '+SVC,'Content-Type':'application/json'};
const UA='DiarioTrader/743 (https://github.com/meudiariotrade/diario-trader)';
const reply=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
async function rpc(name,args={}){
 const r=await fetch(SB+'/rest/v1/rpc/'+name,{method:'POST',headers:HEAD,body:JSON.stringify(args),signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error(name+': '+r.status);
 return r.json();
}
async function authorize(req){
 const actual=req.headers.get('x-cron-secret')||'';
 if(!actual||!SB||!SVC)return false;
 const expected=await rpc('diario_agendamento_chave').catch(()=>null);
 if(typeof expected!=='string'||expected.length!==actual.length)return false;
 let d=0;for(let i=0;i<actual.length;i++)d|=actual.charCodeAt(i)^expected.charCodeAt(i);
 return d===0;
}
const finite=(n)=>typeof n==='number'&&Number.isFinite(n)?n:null;
const round=(n)=>Number.isFinite(n)?+n.toFixed(4):null;
const capPercent=(v,low,hi,inv=false)=>{if(v==null)return null;const s=Math.min(100,Math.max(0,((v-low)/(hi-low))*100));return inv?100-s:s};
const average=(arr)=>{const v=arr.filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null};
function score(row){
 const q=average([capPercent(row.roic,5,22),capPercent(row.eps_growth_yoy,-10,35),capPercent(row.fcf_margin,0,30)]);
 const v=average([capPercent(row.forward_pe,8,40,true),capPercent(row.peg_ratio,0.7,3,true),capPercent(row.ev_fcf,5,35,true)]);
 const mom=average([capPercent(row.momentum_12_1,-30,50),capPercent(row.short_interest_pct,0,15,true)]);
 const ret=capPercent(row.total_shareholder_yield,0,12);
 return q!=null&&v!=null&&mom!=null&&ret!=null?round(.3*q+.25*v+.25*mom+.2*ret):null;
}
const elapsed=(start,end)=>{const s=Date.parse(start+'T00:00:00Z'),e=Date.parse(end+'T00:00:00Z');return Number.isFinite(s)&&Number.isFinite(e)?(e-s)/86400000:0};
function annual(facts,tags,unit='USD'){
 const us=facts?.['us-gaap']||{},out=[];
 for(const tag of tags){
  const rows=us[tag]?.units?.[unit]||[];
  for(const row of rows){
   if(!['10-K','10-K/A','20-F','40-F'].includes(row.form)||row.fp!=='FY')continue;
   if(!row.start||!row.end||elapsed(row.start,row.end)<330||elapsed(row.start,row.end)>390)continue;
   const val=finite(row.val);
   if(val==null||!row.filed)continue;
   const y=Number(row.end.slice(0,4));if(y<2022)continue;
   out.push({...row,tag,val});
  }
  if(out.length)break;
 }
 const dates=new Map();
 for(const row of out){
  const old=dates.get(row.end);
  // Preferir o 10-K mais recente para o mesmo periodo, sem misturar trimestrais.
  if(!old||row.filed>old.filed)dates.set(row.end,row);
 }
 return [...dates.values()].sort((a,b)=>b.end.localeCompare(a.end)).slice(0,4);
}
function instant(facts,tags,unit='USD'){
 const us=facts?.['us-gaap']||{};
 for(const tag of tags){
  const rows=us[tag]?.units?.[unit]||[];
  const valid=rows.filter(x=>['10-K','10-K/A','20-F','40-F'].includes(x.form)&&x.end&&finite(x.val)!=null);
  if(valid.length){valid.sort((a,b)=>b.end.localeCompare(a.end)||b.filed.localeCompare(a.filed));return valid[0]}
 }
 return null;
}
const revTags=['RevenueFromContractWithCustomerExcludingAssessedTax','RevenueFromContractWithCustomerIncludingAssessedTax','Revenues','SalesRevenueNet','SalesRevenueGoodsNet'];
function compute(x,current){
 const facts=x.facts, rev=annual(facts,revTags),cfo=annual(facts,['NetCashProvidedByUsedInOperatingActivities']),
 capex=annual(facts,['PaymentsToAcquirePropertyPlantAndEquipment']),
 buy=annual(facts,['PaymentsForRepurchaseOfCommonStock']),eps=annual(facts,['EarningsPerShareDiluted'],'USD/shares'),
 income=annual(facts,['NetIncomeLoss']),equity=instant(facts,['StockholdersEquity']);
 const match=(arr,end)=>arr.find(r=>r.end===end);
 const latest=rev[0]||cfo[0]||income[0]||eps[0]||buy[0],lastEnd=latest?.end||null;
 const revenue=rev[0]?.val,prev=rev.find(r=>rev[0]&&r.end!==rev[0].end&&elapsed(r.end,rev[0].end)>=300&&elapsed(r.end,rev[0].end)<=430);
 const growth=revenue>0&&prev?.val>0?round((revenue/prev.val-1)*100):null;
 const flow=match(cfo,lastEnd),investment=match(capex,lastEnd);
 const fcf=flow&&investment?flow.val-investment.val:null;
 const margin=fcf!=null&&revenue>0?round(fcf/revenue*100):null;
 const ep=eps[0],epsOld=eps.find(r=>ep&&r.end!==ep.end&&elapsed(r.end,ep.end)>=300&&elapsed(r.end,ep.end)<=430);
 const epsGrowth=ep?.val>0&&epsOld?.val>0?round((ep.val/epsOld.val-1)*100):null;
 const net=match(income,lastEnd),roe=net&&equity?.val>0&&equity.end===lastEnd?round(net.val/equity.val*100):null;
 const rep=match(buy,lastEnd),cap=finite(current.market_cap_usd);
 const buyback=rep&&rep.val>=0&&cap>0?round(rep.val/cap*100):null;
 const merged={...current,revenue_growth_yoy:growth??current.revenue_growth_yoy,eps_growth_yoy:epsGrowth??current.eps_growth_yoy,
  fcf_margin:margin??current.fcf_margin,roe:current.roe??roe,buyback_yield:buyback??current.buyback_yield};
 merged.total_shareholder_yield=merged.dividend_yield!=null&&merged.buyback_yield!=null?
  merged.dividend_yield+merged.buyback_yield:null;
 const scoreValue=score(merged);
 return {
  ticker:current.ticker,cik:current.cik,revenue_growth_yoy:growth,eps_growth_yoy:epsGrowth,
  fcf_margin:margin,roe,buyback_yield:buyback,score_quant_us:scoreValue,
  sec_status:lastEnd?'verificado':'sem_fatos_anuais',sec_facts_at:lastEnd,
  sec_source_url:'https://data.sec.gov/api/xbrl/companyfacts/CIK'+current.cik+'.json'
 };
}
async function mapping(){
 const url='https://raw.githubusercontent.com/jadchaar/sec-cik-mapper/main/mappings/stocks/ticker_to_cik.json';
 const res=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}});
 if(!res.ok)throw Error('Mapa CIK indisponivel: HTTP '+res.status);
 const map=await res.json();
 if(!map||typeof map!=='object'||Object.keys(map).length<3000)throw Error('Mapa incompleto ou formato invalido');
 const rows=Object.entries(map).filter(([ticker,cik])=>/^[A-Z0-9][A-Z0-9.\\-]{0,19}$/.test(ticker)&&/^[0-9]{1,10}$/.test(String(cik)))
  .map(([ticker,cik])=>({ticker,cik:String(cik)}));
 let updated=0;for(let i=0;i<rows.length;i+=220)updated+=Number(await rpc('quant_screeners_sec_map',{p_rows:rows.slice(i,i+220)}))||0;
 return {mapeados:updated,fonte:'SEC via sec-cik-mapper',consultados:rows.length};
}
async function sec(){
 const pending=await rpc('quant_screeners_sec_pendentes',{p_limit:12});
 const patches=[],errors=[];
 for(const target of Array.isArray(pending)?pending:[]){
  const source='https://data.sec.gov/api/xbrl/companyfacts/CIK'+target.cik+'.json';
  try{
   const r=await fetch(source,{headers:{'User-Agent':UA,'Accept':'application/json','Accept-Encoding':'identity'},
    signal:AbortSignal.timeout(12500)});
   if(r.status===403){errors.push('A SEC bloqueou os acessos a partir da Edge Function (HTTP 403). Nao repetir em lote.');break;}
   if(r.status===429){errors.push('Rate limit SEC (429), proxima rodada suspensa');break;}
   if(!r.ok){patches.push({ticker:target.ticker,cik:target.cik,sec_status:'http_'+r.status,sec_source_url:source});continue;}
   const json=await r.json();if(String(json.cik)!==String(Number(target.cik)))throw Error('CIK divergente');
   patches.push(compute(json,target));
  }catch(e){errors.push(target.ticker+': '+String(e).slice(0,80));
   patches.push({ticker:target.ticker,cik:target.cik,sec_status:'falha_transitoria',sec_source_url:source});
  }
 }
 let updated=0;if(patches.length)updated=await rpc('quant_screeners_sec_patch',{p_rows:patches});
 return {selecionados:pending?.length||0,concluidos:updated,com_fatos:patches.filter(x=>x.sec_status==='verificado').length,
  indicadores:patches.filter(x=>x.score_quant_us!=null).length,erros:errors.slice(0,5)};
}
Deno.serve(async req=>{
 if(req.method!=='POST')return reply({error:'Somente POST'},405);
 if(!await authorize(req))return reply({error:'Nao autorizado'},401);
 try{
  const body=await req.json().catch(()=>({}));
  if(body.acao==='mapear')return reply({acao:'mapear',...await mapping()});
  if(body.acao==='sec')return reply({acao:'sec',...await sec()});
  return reply({error:'Acao desconhecida'},400);
 }catch(e){console.error('screeners-sec',String(e).slice(0,180));return reply({error:'Processamento temporariamente indisponivel'},503)}
});
