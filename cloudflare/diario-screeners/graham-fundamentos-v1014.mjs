import {servePublicSnapshot} from './snapshot-cache-v896.mjs';
const txt=(x,n)=>typeof x==='string'?x.trim().slice(0,n):'';
const num=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x?x:null;
const FIELDS=['roe','roic','pl','pvp','p_l','p_vp','ev_ebitda','fcf_yield','margem_liquida','div_liq_ebitda','net_debt_ebitda','dividend_yield','payout_implicito','fcf_margin','revenue_growth_yoy','eps_growth_yoy','forward_pe','peg_ratio','ev_fcf','price_sales','total_shareholder_yield','buyback_yield','preco_referencia','lpa','vpa','dpa_12m','market_cap_usd','valor_mercado_brl','payout','margem_ebitda','net_margin','gross_margin','operating_margin','interest_coverage','current_ratio','debt_equity','ffo','affo','price_ffo','price_affo','cet1','net_interest_margin','combined_ratio','stock_based_compensation','diluted_shares','free_cash_flow','free_cash_flow_ttm'];
const PEERS=['roe','roic','pl','pvp','ev_ebitda','fcf_yield','fcf_margin','forward_pe','ev_fcf','div_liq_ebitda','net_debt_ebitda','peg_ratio','price_sales','price_ffo','price_affo','total_shareholder_yield'];
const metrics=row=>Object.fromEntries(FIELDS.flatMap(k=>num(row?.[k])===null?[]:[[k,row[k]]]));
export function tickersGrahamV1014(q){
 const s=String(q||''),br=[...new Set((s.match(/\b[A-Za-z]{4}(?:3|4|5|6|7|8|11B?)\b/g)||[]).map(x=>x.toUpperCase()))],us=[...new Set([...s.matchAll(/\b(?:ticker|NASDAQ|NYSE|AMEX)\s*:\s*([A-Za-z]{1,5}(?:\.[A-Za-z])?)\b/gi)].map(x=>x[1].toUpperCase()))];
 const standalone=s.trim().match(/^(?:@graham\s+)?\$?([A-Z]{1,5}(?:\.[A-Z])?)$/),tagged=[...s.matchAll(/(?:^|\s)\$([A-Z]{1,5}(?:\.[A-Z])?)\b/g)].map(x=>x[1]);
 const excluded=new Set(['BR','EUA','US','USD','BRL','ROE','ROIC','FCF','DCF','PEG','CET','DY','ETF','FII','PIB','FED','SELIC','IBOV']);
 for(const x of [...tagged,...(standalone?[standalone[1]]:[])])if(!excluded.has(x)&&!us.includes(x))us.push(x);
 const all=[...br.map(ticker=>({ticker,market:'BR'})),...us.map(ticker=>({ticker,market:'US'}))];
 return all.length<=3?all:[];
}
// Modelos separados por mercado e atividade. Ausência de classificação não é prova de atividade.
export function modeloGrahamV1014(row,market){
 const s=String(row?.setor||row?.sector||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),d=String(row?.segmento||row?.industry||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),n=String(row?.empresa||row?.company_name||'').toLowerCase();
 const all=s+' '+d+' '+n;
 const tipo=/\b(?:reit|real estate investment trust|fundo imobiliario|fii)\b/.test(all)?'imobiliario':/\b(?:bank|banks|banking|banco|bancos|unibanco|bancorp|bradesco|jpmorgan|citigroup|wells fargo|goldman sachs|morgan stanley)\b/.test(all)?'banco':/\b(?:insurance|insurer|insurers|seguros|seguradora|seguradoras|chubb|allstate)\b/.test(all)?'seguradora':/semiconductor|semicondutor|chipmaker/.test(all)?'semicondutores':/software|saas|cloud computing/.test(s+' '+d)?'software':/technology|tecnologia|electronic technology/.test(s)?'tecnologia':/oil|gas|petroleo|mining|mineracao|commodity|commodities|steel|siderurgia/.test(s+' '+d)?'ciclico':/finance|financial|financeir/.test(s)?'financeiro_indefinido':'geral';
 const moeda=market==='US'?'USD':'BRL',juros=market==='US'?'Fed Funds e Treasury; sem taxa atual presumida':'Selic e curva DI; sem taxa atual presumida';
 const check={
 banco:['ROE e P/VP associados a retorno sustentável','Capital regulatório CET1, inadimplência e provisões','Margem financeira, depósitos e liquidez','P/L e distribuição de capital'],
 seguradora:['ROE e P/VP','Índice combinado, reservas técnicas e solvência','Resultado de subscrição versus resultado financeiro','Capital e distribuição'],
 imobiliario:['FFO/AFFO por ação e preço/FFO ou preço/AFFO','Ocupação, contratos, dívida e vencimentos','Distribuição coberta por AFFO','NAV e cap rates quando documentados'],
 semicondutores:['ROIC, margem bruta e FCF','Ciclo de estoques, capacidade, capex e clientes','Crescimento normalizado e concentração','Forward P/E, EV/FCF e diluição'],
 software:['Crescimento e margem de FCF','Receita recorrente, retenção e unit economics quando divulgados','SBC, diluição líquida e recompras','EV/FCF, Forward P/E e PEG com crescimento positivo'],
 tecnologia:['ROIC e margem de FCF','Crescimento, reinvestimento, capex e concorrência','SBC, diluição e retorno total','Forward P/E, PEG e EV/FCF quando aplicáveis'],
 ciclico:['Lucro e FCF normalizados ao longo do ciclo','Custo de produção, sensibilidade a preços e capex','Dívida e vencimentos no cenário adverso','Múltiplos normalizados, nunca julgar barato pelo pico do ciclo'],
 financeiro_indefinido:['Identificar primeiro a atividade financeira','ROE e estrutura de capital','Qualidade dos ativos e liquidez','Evitar múltiplos industriais até identificar atividade'],
 geral:['ROIC versus custo de capital quando comprovado','Margens, conversão de caixa e crescimento','Dívida, liquidez, vencimentos e governança','Valuation relativo e absoluto conforme dados']
 }[tipo];
 return {tipo,moeda,juros,check,metodo:market==='US'?'Qualidade + crescimento + caixa + retorno líquido ao acionista; múltiplos adequados ao setor; DCF somente com fluxo, reinvestimento, desconto e premissas explícitas.':'Qualidade + caixa + ciclo + endividamento; dividendos recorrentes e Graham/Bazin somente quando aplicáveis; DCF com premissas explícitas.'};
}
const restricted=new Set(['banco','seguradora','imobiliario','financeiro_indefinido']);
const multiples=new Set(['pl','pvp','ev_ebitda','forward_pe','ev_fcf','peg_ratio','price_sales','price_ffo','price_affo']);
const applicable=(tipo,k)=>!restricted.has(tipo)|| (tipo==='imobiliario'?['price_ffo','price_affo','ffo','affo','pvp','dividend_yield','interest_coverage','debt_equity','net_debt_ebitda','div_liq_ebitda','market_cap_usd','valor_mercado_brl','preco_referencia'].includes(k):['roe','pl','pvp','forward_pe','dividend_yield','total_shareholder_yield','cet1','net_interest_margin','combined_ratio','payout','payout_implicito','market_cap_usd','valor_mercado_brl','preco_referencia','lpa','vpa','dpa_12m'].includes(k));
// A existência de uma data SEC global não prova origem de cada valor. Exigir linhagem individual.
const secProof=(r,k)=>{
 const p=r?.linhagem_indicadores?.[k];
 if(!Array.isArray(p)||!p.length||!p.every(x=>/^\d{10}-\d{2}-\d{6}$/.test(String(x?.documento_id||''))&&date(x?.competencia)&&date(x?.publicado_em)&&x.competencia<=x.publicado_em&&typeof x.valor_reportado==='number'&&Number.isFinite(x.valor_reportado)))return null;
 const latest=[...p].sort((a,b)=>b.competencia.localeCompare(a.competencia))[0];
 return {competencia:latest.competencia,publicado_em:latest.publicado_em,documento_id:latest.documento_id};
};

const sector=r=>txt(r?.setor||r?.sector,100),issuer=r=>txt(r?.emissor_cnpj||r?.cik||r?.empresa||r?.company_name,180).toLowerCase();
const dateFor=(r,k)=>secProof(r,k)?.competencia||date(r.fundamentais_em);
export function perfilGrahamV1014(t,snapshot,{stale=false,now=Date.now()}={}){
 if(snapshot?.market!==t.market||snapshot.universe_complete!==true||!Array.isArray(snapshot.universe_rows))return null;
 const ts=Date.parse(snapshot.last_update||'');
 if(!Number.isFinite(ts)||ts>now+300000||now-ts>7*86400000)return null;
 const row=snapshot.universe_rows.find(x=>x.ticker===t.ticker);if(!row)return null;
 const metricas=metrics(row);if(!Object.keys(metricas).length)return null;
 const modelo=modeloGrahamV1014(row,t.market);
 const hoje=new Date(now).toISOString().slice(0,10),fonte=txt(row.fonte_principal,150)||'Research público · Cloudflare/GitHub';
 const dados=Object.entries(metricas).map(([id,valor])=>{
  const ref=dateFor(row,id),proof=secProof(row,id),sec=proof&&proof.publicado_em<=hoje;
  const data=ref&&ref<=hoje?ref:null;
  return {id,valor,data,fonte:sec?'SEC EDGAR XBRL · linhagem informada (sem recálculo)':'Snapshot Research · origem individual não certificada',periodo:id==='forward_pe'?'projetado':id==='pl'?'TTM conforme provedor':id==='pvp'?'patrimônio conforme provedor':'não confirmado',...(sec?{documento:proof}:{}),aplicavel:applicable(modelo.tipo,id),utilizavel:!!data&&(!multiples.has(id)||valor>0)};
 });
 const setor=sector(row),empresa=txt(row.empresa||row.company_name,180),ref=date(row.fundamentais_em),identity=issuer(row);
 const seen=new Set(identity?[identity]:[]),pares=[];
 // Somente universo de mesmo mercado, setor e data de referência; uma linha por emissor.
 if(setor&&identity&&ref&&ref<=hoje&&!stale){
  for(const p of snapshot.universe_rows){
   if(p.ticker===t.ticker||sector(p)!==setor||date(p.fundamentais_em)!==ref||!issuer(p)||seen.has(issuer(p))||modeloGrahamV1014(p,t.market).tipo!==modelo.tipo)continue;
   const ind=txt(row.segmento||row.industry,100),indP=txt(p.segmento||p.industry,100);if(ind&&ind!==indP)continue;
   const m=Object.fromEntries(PEERS.flatMap(k=>num(p[k])===null||!applicable(modelo.tipo,k)||(multiples.has(k)&&(p[k]<=0||!(row[k]>0)))||dateFor(p,k)!==dateFor(row,k)||Boolean(secProof(p,k))!==Boolean(secProof(row,k))?[]:[[k,p[k]]]));
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
 if(t.market==='US')lacunas.push('DCF e margem de segurança intrínseca exigem fluxo normalizado, reinvestimento, custo de capital e premissas; não inferir de múltiplos.');
 if(modelo.tipo==='banco'&&!Object.hasOwn(metricas,'cet1'))lacunas.push('CET1 e qualidade de crédito não comprovados');
 if(modelo.tipo==='seguradora'&&!Object.hasOwn(metricas,'combined_ratio'))lacunas.push('Índice combinado e solvência não comprovados');
 if(modelo.tipo==='imobiliario'&&!Object.hasOwn(metricas,'affo'))lacunas.push('AFFO e cobertura de distribuição não comprovados');
 if(['software','tecnologia','semicondutores'].includes(modelo.tipo)&&!Object.hasOwn(metricas,'stock_based_compensation'))lacunas.push('Remuneração em ações e diluição líquida não comprovadas');
 const valuationInput={};for(const k of ['preco_referencia','lpa','vpa','dpa_12m','pl','pvp','dividend_yield'])if(Object.hasOwn(metricas,k))valuationInput[k]=metricas[k];
 return {...t,empresa,setor,modelo,data:new Date(ts).toISOString(),fonte:'Research público · Cloudflare/GitHub',metricas,dados,pares,documento,defasado:stale||!ref||Date.parse(ref+'T00:00:00Z')>now||now-Date.parse(ref+'T00:00:00Z')>7*86400000,lacunas,valuationInput,referencia_indicadores:ref||null};
}
// FII é uma categoria de ativo distinta de ações/REITs. Nunca inferir pelo sufixo 11.
const FII_FIELDS={cotacao:'preco_referencia',p_vp:'pvp',dy:'dividend_yield',ffo_yield:'ffo_yield',valor_mercado:'valor_mercado_brl',liquidez:'liquidez',qtd_imoveis:'qtd_imoveis',preco_m2:'preco_m2',aluguel_m2:'aluguel_m2',cap_rate:'cap_rate',vacancia:'vacancia'};
function fiiMetrics(r){
 const tijolo=r.tipo==='Tijolo';
 return Object.fromEntries(Object.entries(FII_FIELDS).flatMap(([k,id])=>{
  const v=num(r[k]);if(v===null||v<0||(['cotacao','p_vp'].includes(k)&&v<=0))return [];
  if(!tijolo&&['qtd_imoveis','preco_m2','aluguel_m2','cap_rate','vacancia'].includes(k))return [];
  if(['preco_m2','aluguel_m2','cap_rate','qtd_imoveis'].includes(k)&&v===0)return [];
  if(k==='vacancia'&&(v>100||!(r.qtd_imoveis>0)))return [];
  return [[id,v]];
 }));
}
export function perfilFiiGrahamV1014(t,snapshot,{now=Date.now()}={}){
 if(t.market!=='BR'||snapshot?.versao!==1||!Array.isArray(snapshot.rows))return null;
 const ts=Date.parse(snapshot.gerado_em||'');if(!Number.isFinite(ts)||ts>now+300000||now-ts>7*86400000)return null;
 const row=snapshot.rows.find(x=>x.ticker===t.ticker);
 if(!row||!['Tijolo','Papel','Híbrido','FOF'].includes(row.tipo))return null;
 const metricas=fiiMetrics(row);if(!Object.keys(metricas).length)return null;
 const tipo=row.tipo,ref=new Date(ts).toISOString().slice(0,10),segmento=txt(row.segmento,100),defasado=now-ts>3*86400000;
 const check={
  Tijolo:['Ocupação física e financeira, localização e qualidade dos imóveis','WAULT, reajustes, revisões, concentração de inquilinos e vencimentos','Capex, dívida, NOI recorrente e cobertura dos rendimentos','P/VP, cap rate e risco de reavaliação patrimonial'],
  Papel:['Qualidade dos CRIs, devedores, garantias, LTV e inadimplência','Indexadores CDI/IPCA, duration, spread e concentração','Receita recorrente versus amortizações e eventos extraordinários','P/VP, marcação a mercado, risco de crédito e liquidez'],
  'Híbrido':['Composição tijolo/papel e exposição por segmento','Vacância e contratos da parcela imobiliária','Crédito, garantias e indexadores da parcela de recebíveis','Resultado recorrente, alavancagem e liquidez'],
  FOF:['Carteira de FIIs, concentração e sobreposição','Desconto patrimonial dos fundos investidos e do próprio FOF','Taxas em duplicidade, giro e liquidez','Rendimento recorrente versus ganho de capital e reservas']
 }[tipo];
 const fonte='Fundamentus · snapshot público de FIIs via GitHub/Cloudflare';
 const dados=Object.entries(metricas).map(([id,valor])=>({id,valor,data:ref,fonte,periodo:'coleta do snapshot; competência não informada',aplicavel:true,utilizavel:true}));
 const pares=[];
 if(!defasado&&segmento&&segmento!=='Outros'){
  for(const p of snapshot.rows){
   if(p.ticker===t.ticker||p.tipo!==tipo||p.segmento!==segmento||pares.some(x=>x.ticker===p.ticker))continue;
   const m=fiiMetrics(p),metricas=Object.fromEntries(['pvp','dividend_yield','ffo_yield','cap_rate','vacancia'].filter(k=>Object.hasOwn(m,k)).map(k=>[k,m[k]]));
   if(Object.keys(metricas).length)pares.push({ticker:txt(p.ticker,12),metricas});if(pares.length===12)break;
  }
 }
 const lacunas=['Classificação e valores do provedor; competência dos relatórios gerenciais não confirmada','Rendimento histórico não comprova recorrência, distribuição futura ou valor justo','Não calcular spread DY nominal menos NTN-B real: taxa de referência do arquivo não certificada e bases incompatíveis','Dívida, vencimentos, cobertura de distribuições e emissões exigem relatório gerencial'];
 if(tipo==='Tijolo')lacunas.push('WAULT, concentração de locatários, vacância financeira e capex não comprovados');
 if(tipo==='Papel')lacunas.push('LTV, garantias, devedores, inadimplência, indexadores e duration não comprovados');
 if(tipo==='Híbrido'||tipo==='FOF')lacunas.push('Composição da carteira, concentração, taxas e resultado por estratégia não comprovados');
 if(pares.length<3)lacunas.push('Amostra de fundos do mesmo tipo e segmento insuficiente');
 return {...t,classe:'FII',empresa:t.ticker,setor:segmento,subtipo_fii:tipo,modelo:{tipo:'fii',moeda:'BRL',juros:'Selic, CDI, IPCA e NTN-B; comparar rendimentos em bases equivalentes, sem taxa atual presumida',check,metodo:'Renda recorrente, patrimônio, qualidade dos ativos, riscos e liquidez. P/VP não equivale a valor intrínseco; sem Graham/Bazin de ações ou DCF sem insumos.'},data:new Date(ts).toISOString(),fonte,metricas,dados,pares,documento:null,defasado,lacunas,valuationInput:{},referencia_indicadores:ref};
}

export async function carregarGrahamV1014(env,ctx,q,load=servePublicSnapshot,loadFiis){
 const targets=tickersGrahamV1014(q),cache=new Map();
 const fiis=loadFiis&&targets.some(t=>t.market==='BR'&&/11B?$/.test(t.ticker))?Promise.resolve().then(()=>loadFiis()).then(r=>r.ok?r.json():null).catch(()=>null):Promise.resolve(null);
 return (await Promise.all(targets.map(async t=>{
  try{
   if(t.market==='BR'&&/11B?$/.test(t.ticker)){
    const f=await fiis;
    if(f?.rows?.some(x=>x.ticker===t.ticker))return perfilFiiGrahamV1014(t,f);
   }
   if(!cache.has(t.market))cache.set(t.market,(async()=>{
    const r=await load(new Request('https://diario-screeners-quant.lucianosilva43567.workers.dev/v1/screeners?market='+t.market+'&snapshot=1&universe=1'),env,ctx);
    return r.ok?{snapshot:await r.json(),stale:r.headers.get('X-Snapshot-Stale')==='1'}:null;
   })());
   const data=await cache.get(t.market);
   return data?perfilGrahamV1014(t,data.snapshot,{stale:data.stale}):null;
  }catch{return null}
 }))).filter(Boolean);
}
export const PROTOCOLO_GRAHAM_V1014='Graham deve formar tese própria e condicional sobre qualidade, vantagem competitiva, margens, rentabilidade, caixa, dívida e valuation. Use SOMENTE indicadores dos perfis fornecidos, distinguindo data do snapshot, referência do indicador e competência documental; não associe documento CVM a métrica sem linhagem comprovada. Não invente histórico, preço atual, múltiplo, preço justo, WACC, margem de segurança ou projeção. Não trate múltiplo projetado como realizado. Indicadores de bancos/seguradoras exigem ROE, capital e qualidade de crédito; não aplicar EV/EBITDA como regra universal. Para EUA use USD, Fed/Treasuries, crescimento, FCF e retorno total ao acionista; Brasil BRL, Selic/DI. Compare apenas mesmo mercado/setor e base; pares são amostra não representativa. Descreva números apenas quando presentes e sem cálculos de valuation: o cliente calcula com fórmulas existentes. Se dados faltarem, declare quais; informe catalisador, risco e invalidação. Não dê ordem de compra ou venda. Use o modelo setorial de cada perfil: bancos (CET1, crédito, ROE/P/VP), seguradoras (índice combinado, solvência), REITs (FFO/AFFO, cobertura e ocupação), software (receita recorrente, retenção, SBC e diluição), semicondutores (estoques, capex e ciclo), cíclicas (lucro/caixa normalizado). Nos EUA priorize crescimento sustentável, ROIC, FCF, Forward P/E, PEG e EV/FCF quando aplicáveis; remuneração em ações, dividendos e recompras líquidas, nunca penalize automaticamente DY baixo. FCF/EV não é FCF yield sobre capital próprio. Diferencie desconto relativo de margem intrínseca, preço em USD de retorno convertido em BRL; não use Bazin ou número de Graham automaticamente nos EUA. Nunca suponha WACC, taxa Treasury, crescimento ou diluição. Em empresa sem lucro/FCF positivo não use múltiplos negativos como sinal de oportunidade. Para FIIs brasileiros identificados na base própria, diferencie tijolo, papel, híbridos e FOF. Não use P/L, ROIC ou número de Graham como critério padrão de FII. Não atribua vacância zero a fundo de papel, não invente WAULT, LTV, crédito ou cobertura. DY alto pode ser não recorrente; P/VP baixo não é margem intrínseca; não subtraia DY nominal de juro real NTN-B. Para cada ativo: tese, evidências, qualidade, riscos, valuation, cenário alternativo, catalisador e invalidação.';
