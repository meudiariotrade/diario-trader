/** Coleta única do Jornal. Não altera os provedores das demais abas. */
import '../_shared/jornal-quality.js';
const Q = (globalThis as any).DiarioJornalQualidade;
const finite = (x: unknown) => typeof x === 'number' && Number.isFinite(x);
export function contratosCandidatos(dia: string) {
  const base = new Date(dia + 'T12:00:00Z'), meses = 'FGHJKMNQUVXZ', result: string[] = [];
  for (let i=0;i<7;i++) { const d=new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()+i,1)); for(const root of ['WIN','WDO']) result.push('BMFBOVESPA:'+root+meses[d.getUTCMonth()]+d.getUTCFullYear()); }
  return result;
}
export function normalizaColeta(rows: any[], mapa: [string,string,string][], dia: string, collected: string) {
  const date=new Date(collected).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}), quotes: any[]=[], sessoes: Record<string,any>={};
  const local=new Date(new Date(collected).toLocaleString('en-US',{timeZone:'America/Sao_Paulo'}));
  for(const [k,symbol,n]of mapa) {
    const candidates = rows.filter(x=>x.s===symbol || (['win','wdo'].includes(k)&&new RegExp(':'+k.toUpperCase()+'[FGHJKMNQUVXZ]\\d{4}$').test(x.s)));
    const concrete=candidates.filter(x=>finite(x.d?.[8])&&String(x.d[8])>=dia.replaceAll('-','')&&!/1!$/.test(x.s)).sort((a,b)=>a.d[8]-b.d[8])[0];
    const row=concrete||candidates.find(x=>x.s===symbol),d=row?.d||[],rate=k.startsWith('di')||k==='us10';
    const bar=finite(d[7])?new Date(d[7]*1000).toISOString():'',barDay=bar?new Date(bar).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}):'';
    const contrato=concrete?row.s.split(':')[1]:'';
    const q=Q.quote({k,n,px:finite(d[0])?d[0]:null,d1:finite(d[rate?2:1])?d[rate?2:1]:null,ext:k==='ewz'?(finite(d[3])?d[3]:finite(d[4])?d[4]:null):null,fonte:'TradingView',simbolo:row?.s||symbol,contrato,coletado_em:collected,barra_inicio_em:bar,dia_referencia:barDay,atraso_fonte:d[9]||'',referencia_tipo:'último disponível da sessão '+(barDay||'não identificada')+'; horário do negócio não fornecido'},collected);
    if(concrete&&finite(q.px)) {
      const step=k==='win'?5:.5;
      if(Math.abs(q.px/step-Math.round(q.px/step))>.00001){q.status='divergente';q.px=null;q.d1=null;q.observacao='Último valor incompatível com o incremento do contrato; omitido.';}
    }
    quotes.push(q);
    if(concrete&&q.px!==null&&[d[5],d[6],d[0]].every(finite)&&barDay&&barDay<=dia) sessoes[k]={H:d[5],L:d[6],C:d[0],dia:barDay,contrato,fonte:'TradingView',referencia_em:collected,completa:barDay<date||local.getHours()>=19,referencia_tipo:'OHLC da série do contrato; último disponível, não ajuste oficial'};
  }
  return {q:quotes,sessoes};
}
export async function coletaJornal(mapa: [string,string,string][], dia: string) {
  const collected=new Date().toISOString();
  const symbols=[...new Set([...mapa.map(x=>x[1]),...contratosCandidatos(dia)])];
  const r=await fetch('https://scanner.tradingview.com/global/scan',{method:'POST',headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(10000),body:JSON.stringify({symbols:{tickers:symbols,query:{types:[]}},columns:['close','change','change_abs','premarket_change','postmarket_change','high','low','time','expiration','update_mode']})});
  if(!r.ok)throw new Error('Coleta do Jornal indisponível: '+r.status);
  const data=await r.json();return {...normalizaColeta(data?.data||[],mapa,dia,collected),coletado_em:collected};
}

/** Indicadores com período explícito, obtidos diretamente nas APIs públicas do BCB. */
export async function macroJornal() {
  const collected=new Date().toISOString(),ind:any[]=[],fontes:any[]=[];
  const series=[['Selic meta',432,'% a.a.'],['CDI',4389,'% a.a.'],['IPCA em 12 meses',13522,'%']];
  const responses=await Promise.allSettled(series.map(async([nome,id,un])=>{
    const url=`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${id}/dados/ultimos/1?formato=json`;
    const r=await fetch(url,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error(String(r.status));
    const data=await r.json(),row=data?.[0],value=Number(String(row?.valor).replace(',','.'));
    if(!finite(value)||!/^\d{2}\/\d{2}\/\d{4}$/.test(row?.data||''))throw new Error('Indicador sem referência');
    return {nome,v:value,un,periodo:row.data,fonte_url:url,consultado_em:collected};
  }));
  responses.forEach(r=>{if(r.status==='fulfilled'){ind.push(r.value);fontes.push({titulo:r.value.nome+' - Banco Central',url:r.value.fonte_url,consultado_em:collected});}});
  const focus:any[]=[];
  try{
    const year=new Date(collected).getUTCFullYear(),filter=`(Indicador eq 'IPCA' or Indicador eq 'PIB Total' or Indicador eq 'Câmbio' or Indicador eq 'Selic') and baseCalculo eq 0 and (DataReferencia eq '${year}' or DataReferencia eq '${year+1}')`;
    const url='https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais?$top=200&$filter='+encodeURIComponent(filter)+'&$orderby='+encodeURIComponent('Data desc')+'&$select=Indicador,Data,DataReferencia,Mediana&$format=json';
    const r=await fetch(url,{signal:AbortSignal.timeout(8000)});if(r.ok){const data=await r.json();const rows=data?.value||[];
      for(const metric of ['IPCA','PIB Total','Câmbio','Selic'])for(const target of [year,year+1]){
        const list=rows.filter((x:any)=>x.Indicador===metric&&String(x.DataReferencia)===String(target)&&finite(x.Mediana)).sort((a:any,b:any)=>String(b.Data).localeCompare(String(a.Data)));
        if(list.length){const latest=list[0],cutoff=new Date(Date.parse(latest.Data)-7*86400000).toISOString().slice(0,10),previous=list.find((x:any)=>x.Data.slice(0,10)<=cutoff);
          focus.push({indicador:metric,ano:target,mediana:latest.Mediana,data:latest.Data,anterior:previous?.Mediana??null,data_anterior:previous?.Data||'',fonte_url:url});}
      }
      if(focus.length)fontes.push({titulo:'Expectativas de mercado - Banco Central',url,consultado_em:collected});
    }
  }catch{/* Fonte indisponível: não criar projeções. */}
  return {ind,focus,fontes,coletado_em:collected};
}

export async function destaquesJornal(dia:string) {
  const collected=new Date().toISOString();
  try{
    const r=await fetch('https://scanner.tradingview.com/brazil/scan',{method:'POST',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0'},body:JSON.stringify({symbols:{symbolset:['SYML:BMFBOVESPA;IBOV']},columns:['name','close','change','time','sector'],range:[0,150]})});
    if(!r.ok)throw new Error(String(r.status));const data=await r.json();
    const rows=(data?.data||[]).map((x:any)=>({tk:x.d?.[0],px:x.d?.[1],var:x.d?.[2],setor:String(x.d?.[4]||''),dia:finite(x.d?.[3])?new Date(x.d[3]*1000).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}):''})).filter((x:any)=>x.dia===dia&&finite(x.px)&&finite(x.var));
    const sorted=rows.sort((a:any,b:any)=>b.var-a.var);
    const ps:Record<string,string>={'Finance':'Financeiro','Energy Minerals':'Petróleo e gás','Non-Energy Minerals':'Mineração e siderurgia','Utilities':'Utilidades','Retail Trade':'Varejo','Consumer Non-Durables':'Consumo básico','Consumer Durables':'Consumo durável','Consumer Services':'Serviços ao consumidor','Health Services':'Saúde','Health Technology':'Saúde','Transportation':'Transporte','Process Industries':'Indústria de base','Producer Manufacturing':'Bens de capital','Industrial Services':'Serviços industriais','Communications':'Telecom','Technology Services':'Tecnologia','Electronic Technology':'Tecnologia','Distribution Services':'Distribuição','Commercial Services':'Serviços'};
    const ag=new Map<string,number[]>();for(const x of rows){const k=ps[x.setor]||'';if(!k)continue;const a=ag.get(k)||[];a.push(x.var);ag.set(k,a);}
    const setores=[...ag.entries()].filter(([,a])=>a.length>=2).map(([setor,a])=>({setor,var:+(a.reduce((s,v)=>s+v,0)/a.length).toFixed(2),n:a.length})).sort((a,b)=>b.var-a.var);
    return {setores,altas:sorted.filter((x:any)=>x.var>0).slice(0,5),baixas:sorted.filter((x:any)=>x.var<0).slice(-5).reverse(),dia,referencia_em:collected,fonte:'TradingView - universo de componentes informado pela fonte'};
  }catch{return {altas:[],baixas:[],dia,referencia_em:collected,fonte:'TradingView indisponível'};}
}

/* v840: painel técnico de índices americanos e criptos para o Jornal. Candles diários vêm do cache
   compartilhado da Cloudflare (/v1/diario); sem resposta, Yahoo direto. Cálculo determinístico, sem IA. */
export const TEC_GLOBAL: [string, string, string][] = [
  ['^GSPC', 'S&P 500', 'indice'], ['^IXIC', 'Nasdaq', 'indice'], ['^DJI', 'Dow Jones', 'indice'], ['^RUT', 'Russell 2000', 'indice'],
  ['BTC-USD', 'Bitcoin', 'cripto'], ['ETH-USD', 'Ethereum', 'cripto'], ['SOL-USD', 'Solana', 'cripto'], ['XRP-USD', 'XRP', 'cripto'],
];
const smaT = (a: number[], n: number) => a.length >= n ? a.slice(-n).reduce((s, x) => s + x, 0) / n : null;
function rsiT(c: number[], n = 14) {
  if (c.length < n + 1) return null; let g = 0, l = 0;
  for (let i = 1; i <= n; i++) { const d = c[i] - c[i - 1]; if (d >= 0) g += d; else l -= d; }
  g /= n; l /= n;
  for (let i = n + 1; i < c.length; i++) { const d = c[i] - c[i - 1]; g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n; }
  return l === 0 ? (g === 0 ? 50 : 100) : 100 - 100 / (1 + g / l);
}
export function tecnicoDe(sym: string, nome: string, tipo: string, j: any) {
  const r = j?.chart?.result?.[0], ts: number[] = r?.timestamp || [], q = r?.indicators?.quote?.[0] || {};
  const rows = ts.map((t, i) => [t, q.high?.[i], q.low?.[i], q.close?.[i]]).filter((x) => [x[1], x[2], x[3]].every((v) => finite(v) && (v as number) > 0)) as number[][];
  if (rows.length < 30) return null;
  const c = rows.map((x) => x[3]), px = c[c.length - 1], ant = c[c.length - 2];
  const s20 = smaT(c, 20), s50 = smaT(c, 50), s200 = smaT(c, 200), rsi = rsiT(c), ano = rows.slice(-252);
  const ret = (n: number) => c.length > n ? (px / c[c.length - 1 - n] - 1) * 100 : null;
  const tend = s50 != null && s200 != null ? (px > s50 && s50 > s200 ? 'Alta' : px < s50 && s50 < s200 ? 'Baixa' : 'Lateral') : s20 != null && s50 != null ? (px > s20 && s20 > s50 ? 'Alta' : px < s20 && s20 < s50 ? 'Baixa' : 'Lateral') : 'Lateral';
  const r2 = (x: number | null, d = 2) => x == null || !finite(x) ? null : +x.toFixed(d);
  return { sym, nome, tipo, px: r2(px, 2), d1: r2((px / ant - 1) * 100), rsi14: r2(rsi, 1), sma20: r2(s20), sma50: r2(s50), sma200: r2(s200),
    dist20: s20 ? r2((px / s20 - 1) * 100) : null, dist200: s200 ? r2((px / s200 - 1) * 100) : null, ret1m: r2(ret(21)), ret3m: r2(ret(63)),
    max52: r2(Math.max(...ano.map((x) => x[1]))), min52: r2(Math.min(...ano.map((x) => x[2]))), tendencia: tend,
    dia: new Date(rows[rows.length - 1][0] * 1000).toISOString().slice(0, 10), serie: c.slice(-60).map((v) => +v.toFixed(2)) };
}
export async function tecnicoGlobal() {
  const collected = new Date().toISOString();
  const out = await Promise.all(TEC_GLOBAL.map(async ([sym, nome, tipo]) => {
    for (const url of [`https://diario-trader.lucianosilva43567.workers.dev/v1/diario?t=${encodeURIComponent(sym)}&range=1y`, `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1y&interval=1d`]) {
      try { const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(9000) }); if (r.ok) { const t = tecnicoDe(sym, nome, tipo, await r.json()); if (t) return t; } } catch { /* próxima fonte */ }
    }
    return null;
  }));
  const [fng, setores_eua, ewz] = await Promise.all([fngCripto(), setoresEUA(), ewzJornal()]);
  return { itens: out.filter(Boolean), fng, setores_eua, ewz, coletado_em: collected, fonte: 'Yahoo Finance (candles diários) via cache da Cloudflare' };
}
/* v841: medo e ganância das criptos (alternative.me, índice público de 0 a 100). */
export async function fngCripto() {
  try { const r = await fetch('https://api.alternative.me/fng/?limit=8', { signal: AbortSignal.timeout(7000) }); if (!r.ok) return null;
    const d = (await r.json())?.data || [], v = Number(d[0]?.value), ant = Number(d[7]?.value ?? d[1]?.value);
    const tr: Record<string, string> = { 'Extreme Fear': 'Medo extremo', 'Fear': 'Medo', 'Neutral': 'Neutro', 'Greed': 'Ganância', 'Extreme Greed': 'Ganância extrema' };
    return finite(v) ? { v, classe: tr[String(d[0]?.value_classification || '')] || String(d[0]?.value_classification || ''), semana_passada: finite(ant) ? ant : null, fonte_url: 'https://alternative.me/crypto/fear-and-greed-index/' } : null;
  } catch { return null; }
}
/* v841: mapa de calor dos setores do S&P 500 (ETFs setoriais SPDR), variação do dia e de 1 mês. */
const SETORES_SP: [string, string][] = [['XLK','Tecnologia'],['XLF','Financeiro'],['XLV','Saúde'],['XLY','Consumo discricionário'],['XLP','Consumo básico'],['XLE','Energia'],['XLI','Indústria'],['XLB','Materiais'],['XLU','Utilidades'],['XLRE','Imobiliário'],['XLC','Comunicação']];
export async function setoresEUA() {
  const out = await Promise.all(SETORES_SP.map(async ([sym, nome]) => {
    try { const r = await fetch(`https://diario-trader.lucianosilva43567.workers.dev/v1/diario?t=${sym}&range=1mo`, { signal: AbortSignal.timeout(8000) }); if (!r.ok) return null;
      const c = ((await r.json())?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter((v: any) => finite(v) && v > 0);
      if (c.length < 3) return null; const px = c[c.length - 1];
      return { sym, nome, d1: +((px / c[c.length - 2] - 1) * 100).toFixed(2), m1: +((px / c[0] - 1) * 100).toFixed(2) };
    } catch { return null; }
  }));
  return out.filter(Boolean);
}
/* v841: fluxo de opções do EWZ (coletado na Cloudflare a partir da Cboe, cotações atrasadas ~15 min). */
export async function ewzJornal() {
  try { const r = await fetch('https://diario-trader.lucianosilva43567.workers.dev/v1/ewz', { signal: AbortSignal.timeout(12000) }); if (!r.ok) return null;
    const j = await r.json(); if (!finite(j?.spot)) return null;
    return { spot: j.spot, vies: String(j.vies || ''), netC: finite(j.netC) ? j.netC : null, netP: finite(j.netP) ? j.netP : null, pcVol: finite(j.pcVol) ? +j.pcVol.toFixed(2) : null,
      iv30: finite(j.vol?.iv30) ? +(j.vol.iv30 * 100).toFixed(1) : null, rank: finite(j.vol?.rank) ? Math.round(j.vol.rank * 100) : null,
      mov30: finite(j.vol?.mov1dp) ? +(j.vol.mov1dp * 100).toFixed(1) : null, estruturas: Array.isArray(j.estruturas) ? j.estruturas.length : 0, gerado: String(j.gerado || ''), fonte: 'Cboe (atrasado ~15 min) via Cloudflare' };
  } catch { return null; }
}
