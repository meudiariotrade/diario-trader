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
    const r=await fetch('https://scanner.tradingview.com/brazil/scan',{method:'POST',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json','User-Agent':'Mozilla/5.0'},body:JSON.stringify({symbols:{symbolset:['SYML:BMFBOVESPA;IBOV']},columns:['name','close','change','time'],range:[0,150]})});
    if(!r.ok)throw new Error(String(r.status));const data=await r.json();
    const rows=(data?.data||[]).map((x:any)=>({tk:x.d?.[0],px:x.d?.[1],var:x.d?.[2],dia:finite(x.d?.[3])?new Date(x.d[3]*1000).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}):''})).filter((x:any)=>x.dia===dia&&finite(x.px)&&finite(x.var));
    const sorted=rows.sort((a:any,b:any)=>b.var-a.var);
    return {altas:sorted.filter((x:any)=>x.var>0).slice(0,5),baixas:sorted.filter((x:any)=>x.var<0).slice(-5).reverse(),dia,referencia_em:collected,fonte:'TradingView - universo de componentes informado pela fonte'};
  }catch{return {altas:[],baixas:[],dia,referencia_em:collected,fonte:'TradingView indisponível'};}
}
