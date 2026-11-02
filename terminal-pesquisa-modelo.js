/* Pesquisa determinística: campos com unidade explícita, comparáveis e risco em datas comuns. */
(function(root){
 'use strict';
 const num=root.CarteiraCalculo.num,finite=v=>typeof v==='number'&&Number.isFinite(v);
 const ticker=v=>String(v||'').trim().toUpperCase().replace(/^.*:/,'');
 const fields=[['pl','P/L','x'],['pvp','P/VP','x'],['ev','EV/EBITDA','x'],['dy','Dividend yield','%'],['roe','ROE','%'],['margin','Margem líquida','%'],['growth','Crescimento de receita','%'],['debt','Dívida líquida / EBITDA','x'],['marketcap','Valor de mercado','moeda']];
 function fundamental(tk,data={},meta={}){
  const y=data.yahoo?.numeros||{},t=data.tv||{},f=meta.fs||{},metric={},origin={};
  function pick(key,choices){for(const [v,source]of choices){const n=num(v);if(n!==null){metric[key]=n;origin[key]=source;return}}metric[key]=null}
  const pct=v=>num(v)===null?null:num(v)*100;
  pick('pl',[[t.price_earnings_ttm,'TradingView'],[y.pl,'Yahoo Finance'],[f.pl,'Cadastro da carteira']]);
  pick('pvp',[[t.price_book_ratio,'TradingView'],[y.pvp,'Yahoo Finance'],[f.pvp,'Cadastro da carteira']]);
  pick('ev',[[t.enterprise_value_ebitda_ttm,'TradingView'],[y.ev_ebitda,'Yahoo Finance'],[f.evebitda??f.ev_ebitda,'Cadastro da carteira']]);
  pick('dy',[[t.dividend_yield_recent,'TradingView'],[pct(data.yahoo?.proventos?.dy),'Yahoo Finance'],[f.dy,'Cadastro da carteira']]);
  pick('roe',[[t.return_on_equity,'TradingView'],[pct(y.roe),'Yahoo Finance'],[f.roe,'Cadastro da carteira']]);
  pick('margin',[[t.net_margin,'TradingView'],[pct(y.margem_liq),'Yahoo Finance'],[f.margem_liquida_pct??f.ml,'Cadastro da carteira']]);
  pick('growth',[[pct(y.cresc_receita),'Yahoo Finance'],[f.crescimento_receita_pct,'Cadastro da carteira']]);
  const debt=num(y.divida),cash=num(y.caixa),ebitda=num(y.ebitda);
  pick('debt',[[debt!==null&&cash!==null&&ebitda>0?(debt-cash)/ebitda:null,'Yahoo Finance · cálculo (dívida − caixa) / EBITDA'],[f.div_liq_ebitda??f.dl_ebitda,'Cadastro da carteira']]);
  pick('marketcap',[[t.market_cap_basic,'TradingView'],[y.valor_mercado,'Yahoo Finance']]);
  const series=data.sec?.anos?.length?data.sec.anos:data.balancos?.anos||[];
  const annual=series.filter(r=>Number.isInteger(+r.ano)).map(r=>({date:String(r.ano),revenue:num(r.receita),profit:num(r.lucro_liquido)})).sort((a,b)=>a.date.localeCompare(b.date));
  return {ticker:ticker(tk),name:t.description||meta.nome||ticker(tk),sector:data.yahoo?.perfil?.setor||t.sector||meta.setor||'Não informado',metric,origin,annual,
   financialCurrency:data.sec?.anos?.length?'USD':data.yahoo?.moeda_contabil||'moeda contábil não confirmada',currency:data.br===false?'USD':data.br===true?'BRL':/\d$/.test(ticker(tk))?'BRL':'USD',queried:data.em||null,accountingRef:f.ref||f.data_referencia||null,
   sources:data.fontes||[],peers:data.pares||[],error:data.error||null};
 }
 function screen(rows,filters={}){
  return rows.filter(r=>{const m=r.metric;
   if(filters.sector&&r.sector!==filters.sector)return false;
   const tests=[['dy','minDy',1],['roe','minRoe',1],['pl','maxPl',-1],['debt','maxDebt',-1]];
   for(const [key,f,direction]of tests){const limit=num(filters[f]);if(limit!==null&&(m[key]===null||!finite(m[key])||direction===1&&m[key]<limit||direction===-1&&(m[key]>limit||key==='pl'&&m[key]<=0)))return false}
   return true;
  });
 }
 function normalizeNews(items=[]){
  const groups=[],normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  for(const item of items){const title=String(item.t||item.titulo||item.title||'').trim();if(!title)continue;const key=normalize(title),date=String(item.d||item.data||item.date||'').slice(0,10),link=item.u||item.url||item.link||'',source=item.f||item.fonte||item.source||'Fonte não informada';
   let group=groups.find(g=>g.key===key&&g.date===date||link&&g.links.some(x=>x.url===link));
   if(!group){group={title,key,date,links:[],sentiment:item.sentimento||item.sentiment||null};groups.push(group)}
   if(!group.links.some(x=>x.url===link&&x.source===source))group.links.push({url:link,source});
  }return groups;
 }
 function closeSeries(bars=[]){const map=new Map;for(const r of bars){const seconds=num(r[0]),value=num(r[4]);if(!(seconds>0&&value>0))continue;const date=new Date(seconds*1000);if(!Number.isNaN(+date))map.set(date.toISOString().slice(0,10),value)}return [...map].sort((a,b)=>a[0].localeCompare(b[0])).map(([date,value])=>({date,value}))}
 function stats(a,b){if(a.length!==b.length||a.length<20)return null;const mean=x=>x.reduce((s,v)=>s+v,0)/x.length,A=mean(a),B=mean(b),va=a.reduce((s,v)=>s+(v-A)**2,0),vb=b.reduce((s,v)=>s+(v-B)**2,0);if(va===0||vb===0)return null;return Math.max(-1,Math.min(1,a.reduce((s,v,i)=>s+(v-A)*(b[i]-B),0)/Math.sqrt(va*vb)))}
 function correlation(series){
  const keys=Object.keys(series),maps=keys.map(k=>new Map(closeSeries(series[k]).map(r=>[r.date,r.value])));
  const dates=maps.length?[...maps[0].keys()].filter(d=>maps.every(m=>m.has(d))).sort().slice(-253):[];
  const returns=maps.map(m=>dates.slice(1).map((d,i)=>m.get(d)/m.get(dates[i])-1));
  return {keys,dates,n:Math.max(0,dates.length-1),matrix:returns.map(a=>returns.map(b=>stats(a,b))),method:'Retornos simples nas datas comuns; até 252 intervalos. Sem preencher sessões ausentes. Preços em moeda local; ajustes dependem da fonte.'};
 }
 function scenarios(assets,changes){
  const rows=[],missing=[];for(const a of assets){const shock=num(changes[a.cl]??changes.default),v=num(a.v);if(!a.tem||v===null||shock===null){missing.push(a.tk);continue}rows.push({ticker:a.tk,value:v,shock,impact:v*shock/100})}return {rows,missing,total:rows.reduce((s,r)=>s+r.impact,0),covered:rows.reduce((s,r)=>s+r.value,0)};
 }
 function hypothetical(series,weights){
  const keys=Object.keys(weights).filter(k=>num(weights[k])>0),total=keys.reduce((s,k)=>s+num(weights[k]),0);
  if(Math.abs(total-100)>1e-6)return {points:[],reason:'Os pesos precisam somar 100%.'};
  const maps=keys.map(k=>new Map(closeSeries(series[k]||[]).map(r=>[r.date,r.value]))),dates=maps.length?[...maps[0].keys()].filter(d=>maps.every(m=>m.has(d))).sort():[];
  if(dates.length<2)return {points:[],reason:'Faltam preços em pelo menos duas datas comuns.'};
  const points=dates.map(date=>({date,value:keys.reduce((s,k,i)=>s+num(weights[k])*maps[i].get(date)/maps[i].get(dates[0]),0)}));
  return {points,reason:'',return:points.at(-1).value-100,from:dates[0],to:dates.at(-1),method:'Compra inicial pelos pesos; sem rebalanceamento, taxas ou impostos. Não adiciona dividendos: dependem dos ajustes da série da fonte. Resultado histórico não é previsão.'};
 }
 function flow(rows){
  const seen=new Set,valid=[],players=new Map;let buy=0,sell=0,neutral=0;
  for(const r of rows){const id=String(r.trade_id||''),px=num(r.price),qty=num(r.quantity),timestamp=Date.parse(r.traded_at);if(!id||seen.has(id)||!(px>0&&qty>0)||!Number.isFinite(timestamp))continue;seen.add(id);const v={...r,price:px,quantity:qty};valid.push(v);
   if(r.side==='buy')buy+=qty;else if(r.side==='sell')sell+=qty;else neutral+=qty;
   for(const [name,sign]of [[r.buyer,1],[r.seller,-1]])if(name){const p=players.get(name)||{name,buy:0,sell:0,net:0};if(sign>0)p.buy+=qty;else p.sell+=qty;p.net=p.buy-p.sell;players.set(name,p)}
  }
  valid.sort((a,b)=>Date.parse(b.traded_at)-Date.parse(a.traded_at)||String(b.trade_id).localeCompare(String(a.trade_id)));
  return {rows:valid,buy,sell,neutral,delta:buy-sell,players:[...players.values()].sort((a,b)=>Math.abs(b.net)-Math.abs(a.net)),from:valid.at(-1)?.traded_at,to:valid[0]?.traded_at};
 }
 root.TerminalResearchModel={num,finite,ticker,fields,fundamental,screen,normalizeNews,closeSeries,correlation,hypothetical,scenarios,flow};
})(typeof window==='undefined'?globalThis:window);
