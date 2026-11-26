import {servePublicSnapshot} from './snapshot-cache-v896.mjs';
const txt=(x,n)=>typeof x==='string'?x.trim().slice(0,n):'';
const num=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x?x:null;
const FIELDS=['roe','roic','pl','pvp','p_l','p_vp','ev_ebitda','fcf_yield','margem_liquida','div_liq_ebitda','net_debt_ebitda','dividend_yield','payout_implicito','fcf_margin','revenue_growth_yoy','eps_growth_yoy','forward_pe','peg_ratio','ev_fcf','price_sales','total_shareholder_yield','buyback_yield','preco_referencia','lpa','vpa','dpa_12m'];
const PEERS=['roe','roic','pl','pvp','ev_ebitda','fcf_yield','fcf_margin','forward_pe','ev_fcf','div_liq_ebitda','net_debt_ebitda'];
const metrics=row=>Object.fromEntries(FIELDS.flatMap(k=>num(row?.[k])===null?[]:[[k,row[k]]]));
export function tickersGrahamV1014(q){
 const s=String(q||''),br=[...new Set((s.match(/\b[A-Za-z]{4}(?:3|4|5|6|7|8|11)\b/g)||[]).map(x=>x.toUpperCase()))],us=[...new Set([...s.matchAll(/\b(?:ticker|NASDAQ|NYSE|AMEX)\s*:\s*([A-Za-z]{1,5}(?:\.[A-Za-z])?)\b/gi)].map(x=>x[1].toUpperCase()))];
 const all=[...br.map(ticker=>({ticker,market:'BR'})),...us.map(ticker=>({ticker,market:'US'}))];
 return all.length<=3?all:[];
}
const sector=r=>txt(r?.setor||r?.sector,100),issuer=r=>txt(r?.emissor_cnpj||r?.cik||r?.empresa||r?.company_name,180).toLowerCase();
const dateFor=(r,k)=>date(['revenue_growth_yoy','eps_growth_yoy','fcf_margin','buyback_yield','total_shareholder_yield'].includes(k)&&r.sec_facts_at?r.sec_facts_at:r.fundamentais_em);
export function perfilGrahamV1014(t,snapshot,{stale=false,now=Date.now()}={}){
 if(snapshot?.market!==t.market||snapshot.universe_complete!==true||!Array.isArray(snapshot.universe_rows))return null;
 const ts=Date.parse(snapshot.last_update||'');
 if(!Number.isFinite(ts)||ts>now+300000||now-ts>7*86400000)return null;
 const row=snapshot.universe_rows.find(x=>x.ticker===t.ticker);if(!row)return null;
 const metricas=metrics(row);if(!Object.keys(metricas).length)return null;
 const hoje=new Date(now).toISOString().slice(0,10),fonte=txt(row.fonte_principal,150)||'Research público · Cloudflare/GitHub';
 const dados=Object.entries(metricas).map(([id,valor])=>{
  const ref=dateFor(row,id),sec=['revenue_growth_yoy','eps_growth_yoy','fcf_margin','buyback_yield','total_shareholder_yield'].includes(id)&&date(row.sec_facts_at);
  const data=ref&&ref<=hoje?ref:null;
  return {id,valor,data,fonte:sec?'SEC EDGAR XBRL · referência do exercício (sem recálculo)':fonte,periodo:id==='forward_pe'?'projetado':id==='pl'?'TTM conforme provedor':id==='pvp'?'patrimônio conforme provedor':'não confirmado'};
 });
 const setor=sector(row),empresa=txt(row.empresa||row.company_name,180),ref=date(row.fundamentais_em),identity=issuer(row);
 const seen=new Set(identity?[identity]:[]),pares=[];
 // Somente universo de mesmo mercado, setor e data de referência; uma linha por emissor.
 if(setor&&identity&&ref&&ref<=hoje&&!stale){
  for(const p of snapshot.universe_rows){
   if(p.ticker===t.ticker||sector(p)!==setor||date(p.fundamentais_em)!==ref||!issuer(p)||seen.has(issuer(p)))continue;
   const m=Object.fromEntries(PEERS.flatMap(k=>num(p[k])===null||dateFor(p,k)!==dateFor(row,k)?[]:[[k,p[k]]]));
   if(!Object.keys(m).length)continue;
   seen.add(issuer(p));pares.push({ticker:txt(p.ticker,12),metricas:m});if(pares.length===12)break;
  }
 }
 const d=date(row.data_competencia_balanco),pub=date(row.documento_balanco_publicado_em),url=txt(row.documento_balanco_url,600);
 const documento=d&&pub&&d<=pub&&pub<=hoje&&/^https:\/\/(?:dados\.cvm\.gov\.br|www\.rad\.cvm\.gov\.br)\//.test(url)?{competencia:d,publicado_em:pub,url,tipo:txt(row.documento_balanco_tipo,12)}:null;
 const lacunas=[];
 for(const [name,keys] of [['Rentabilidade',['roe','roic']],['Caixa',['fcf_yield','fcf_margin']],['Endividamento',['div_liq_ebitda','net_debt_ebitda']],['Valuation',['pl','pvp','forward_pe','ev_fcf']],['Crescimento',['revenue_growth_yoy','eps_growth_yoy']]])if(!keys.some(k=>Object.hasOwn(metricas,k)))lacunas.push(name+' sem indicador no snapshot');
 if(!ref)lacunas.push('Data dos indicadores do provedor não informada');
 if(!documento&&!row.sec_facts_at)lacunas.push('Competência documental não identificada');
 if(pares.length<3)lacunas.push('Amostra setorial comparável insuficiente');
 lacunas.push('Série histórica não incluída; não inferir tendência de longo prazo de um snapshot');
 const valuationInput={};for(const k of ['preco_referencia','lpa','vpa','dpa_12m','pl','pvp','dividend_yield'])if(Object.hasOwn(metricas,k))valuationInput[k]=metricas[k];
 return {...t,empresa,setor,data:new Date(ts).toISOString(),fonte:'Research público · Cloudflare/GitHub',metricas,dados,pares,documento,defasado:stale||!ref||Date.parse(ref+'T00:00:00Z')>now||now-Date.parse(ref+'T00:00:00Z')>7*86400000,lacunas,valuationInput,referencia_indicadores:ref||null};
}
export async function carregarGrahamV1014(env,ctx,q,load=servePublicSnapshot){
 const targets=tickersGrahamV1014(q),cache=new Map();
 return (await Promise.all(targets.map(async t=>{
  try{
   if(!cache.has(t.market))cache.set(t.market,(async()=>{
    const r=await load(new Request('https://diario-screeners-quant.lucianosilva43567.workers.dev/v1/screeners?market='+t.market+'&snapshot=1&universe=1'),env,ctx);
    return r.ok?{snapshot:await r.json(),stale:r.headers.get('X-Snapshot-Stale')==='1'}:null;
   })());
   const data=await cache.get(t.market);
   return data?perfilGrahamV1014(t,data.snapshot,{stale:data.stale}):null;
  }catch{return null}
 }))).filter(Boolean);
}
export const PROTOCOLO_GRAHAM_V1014='Graham deve formar tese própria e condicional sobre qualidade, vantagem competitiva, margens, rentabilidade, caixa, dívida e valuation. Use SOMENTE indicadores dos perfis fornecidos, distinguindo data do snapshot, referência do indicador e competência documental; não associe documento CVM a métrica sem linhagem comprovada. Não invente histórico, preço atual, múltiplo, preço justo, WACC, margem de segurança ou projeção. Não trate múltiplo projetado como realizado. Indicadores de bancos/seguradoras exigem ROE, capital e qualidade de crédito; não aplicar EV/EBITDA como regra universal. Para EUA use USD, Fed/Treasuries, crescimento, FCF e retorno total ao acionista; Brasil BRL, Selic/DI. Compare apenas mesmo mercado/setor e base; pares são amostra não representativa. Descreva números apenas quando presentes e sem cálculos de valuation: o cliente calcula com fórmulas existentes. Se dados faltarem, declare quais; informe catalisador, risco e invalidação. Não dê ordem de compra ou venda.';
