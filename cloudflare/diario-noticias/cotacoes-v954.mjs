// v954 — referências explícitas e qualidade de cotações.
const BRENT='ICEEUR:BRN1!', MONTHS='FGHJKMNQUVXZ';
export function contratoBrentV954(now=Date.now()){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date(now)).map(x=>[x.type,x.value]));
 const y=+p.year,m=+p.month-1,d=+p.day;
 // Política conservadora: rolar no penúltimo dia de semana do mês, antes da expiração.
 const cut=new Date(Date.UTC(y,m+1,0));
 while([0,6].includes(cut.getUTCDay()))cut.setUTCDate(cut.getUTCDate()-1);
 cut.setUTCDate(cut.getUTCDate()-1);
 while([0,6].includes(cut.getUTCDay()))cut.setUTCDate(cut.getUTCDate()-1);
 // Feriado britânico de fim de maio/agosto quando a última segunda coincide com o fim do mês.
 if([4,7].includes(m)&&cut.getUTCDay()===5&&new Date(cut.getTime()+3*864e5).getUTCMonth()===m)cut.setUTCDate(cut.getUTCDate()-1);
 const v=new Date(Date.UTC(y,m+2+(d>=cut.getUTCDate()?1:0),1));
 return 'ICEEUR:BRN'+MONTHS[v.getUTCMonth()]+v.getUTCFullYear();
}
export function cotacaoMetaV954(row,cols,now=Date.now()){
 const get=k=>row?.d?.[cols.indexOf(k)],px=get('close'),d1=get('change'),abs=get('change_abs'),ts=get('update_time'),mode=get('update_mode');
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const ant=finite(px)&&finite(abs)&&px-abs>0?px-abs:null;
 const calc=ant!==null?100*(px/ant-1):null;
 const at=finite(ts)&&ts>0&&ts*1000<=now+60000?new Date(ts*1000).toISOString():null;
 return {simboloFonte:row?.simboloFonte||row?.s||null,horarioPreco:at,priceAt:at,modoAtualizacao:mode||null,fechamentoAnterior:ant,baseVariacao:'Fechamento/ajuste anterior do mesmo instrumento (fonte)',quoteStatus:calc!==null&&(!finite(d1)||Math.abs(calc-d1)>0.08)?'divergente':!at?'horario_nao_confirmado':now-Date.parse(at)>1800000?'referencia_anterior':'coerente'};
}
async function scanBrentV954(fetcher,url,options,now=Date.now()){
 const b=JSON.parse(options.body||'{}'),tickers=b.symbols?.tickers;
 if(!Array.isArray(tickers)||!tickers.includes(BRENT))return fetcher(url,options);
 const contrato=contratoBrentV954(now),cols=b.columns||[],all=[...new Set([...cols,'close','change','change_abs','update_time','update_mode'])];
 const body=JSON.stringify({...b,columns:all,symbols:{...b.symbols,tickers:[...new Set(tickers.map(s=>s===BRENT?contrato:s))]}});
 const res=await fetcher(url,{...options,body});if(!res.ok)return res;
 const j=await res.json();if(!Array.isArray(j?.data))return Response.json(j,{status:res.status});
 const data=[];
 for(const q of j.data){
  if(q.s===BRENT)continue;
  if(q.s===contrato){
   const m=cotacaoMetaV954(q,all,now);
   if(m.fechamentoAnterior===null||m.quoteStatus==='divergente')continue;
   if(tickers.includes(contrato))data.push({...q,d:cols.map(k=>q.d?.[all.indexOf(k)])});
   data.push({...q,s:BRENT,simboloFonte:contrato,d:cols.map(k=>q.d?.[all.indexOf(k)])});
  }else data.push({...q,d:cols.map(k=>q.d?.[all.indexOf(k)])});
 }
 return Response.json({...j,data},{status:res.status});
}
// Diagnóstico de acesso: CFD/spot OANDA não substitui futuro ICE/NYMEX.
export async function diagnosticarFinnhubV954(key,fetcher=fetch,now=Date.now()){
 const result={em:new Date(now).toISOString(),tipo:'CFD/spot, nao equivalente ao futuro',itens:[]};
 if(!key)return {...result,status:'sem_chave'};
 const call=async path=>{try{const r=await fetcher('https://finnhub.io/api/v1/'+path,{headers:{'X-Finnhub-Token':key},signal:AbortSignal.timeout(8000)});return r.ok?{status:'ok',data:await r.json()}:{status:'http_'+r.status};}catch{return {status:'indisponivel'};}};
 const cat=await call('forex/symbol?exchange=OANDA');
 if(cat.status!=='ok'||!Array.isArray(cat.data))return {...result,status:cat.status==='ok'?'catalogo_invalido':cat.status};
 const available=new Set(cat.data.map(x=>x.symbol)),to=Math.floor(now/1000);
 result.itens=await Promise.all(['OANDA:BCO_USD','OANDA:WTICO_USD','OANDA:XAU_USD','OANDA:XAG_USD','OANDA:XCU_USD'].map(async s=>{
  if(!available.has(s))return {s,status:'nao_listado'};
  const q=await call('forex/candle?symbol='+encodeURIComponent(s)+'&resolution=5&from='+(to-7200)+'&to='+to),stamp=q.data?.t?.at(-1),price=q.data?.c?.at(-1);
  const valid=q.status==='ok'&&q.data?.s==='ok'&&Number.isFinite(stamp)&&stamp>0&&stamp<=to+60&&Number.isFinite(price)&&price>0;
  return {s,status:valid?'acesso_confirmado':q.status==='ok'?(q.data?.s==='no_data'?'sem_dados':'resposta_invalida'):q.status,ultimaVela:valid?new Date(stamp*1000).toISOString():null};
 }));
 return {...result,status:'testado'};
}
export async function agendarDiagnosticoFinnhubV954(event,env){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(event.scheduledTime)).map(x=>[x.type,x.value]));
 if(!env.NEWS_CACHE||!env.FINNHUB_API_KEY||+p.hour<6||+p.hour>=21||+p.minute%10!==0)return;
 const k='diario:finnhub:commodities:v954',dia=p.year+'-'+p.month+'-'+p.day;
 const old=await env.NEWS_CACHE.get(k,'json').catch(()=>null);if(old?.dia===dia)return;
 const out=await diagnosticarFinnhubV954(env.FINNHUB_API_KEY,fetch,event.scheduledTime);
 await env.NEWS_CACHE.put(k,JSON.stringify({...out,dia}),{expirationTtl:7*86400});
}

// v1029 — tentativa reduzida somente para o FEF2. Se o contínuo não vier,
// o segundo mês do calendário é uma referência explícita, não cotação do contínuo.
const FEF2='SGX:FEF2!', FEF_FIELDS=['close','change','change_abs','update_time','update_mode'];
export function segundoMesSGXV1029(now=Date.now()){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Singapore',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date(now)).map(x=>[x.type,x.value]));
 const v=new Date(Date.UTC(+p.year,+p.month,1));
 return 'SGX:FEF'+MONTHS[v.getUTCMonth()]+v.getUTCFullYear();
}
export async function scanMercadoV954(fetcher,url,options,now=Date.now()){
 const b=JSON.parse(options.body||'{}'),tickers=b.symbols?.tickers||[];
 if(!tickers.includes(FEF2))return scanBrentV954(fetcher,url,options,now);
 const original=await scanBrentV954(fetcher,url,options,now);
 if(!original.ok)return original;
 const j=await original.json(),cols=b.columns||[];
 const usable=(r,fields,strict=false)=>{
  const px=r?.d?.[fields.indexOf('close')],d=r?.d?.[fields.indexOf('change')];
  const m=cotacaoMetaV954(r,fields,now);
  return Number.isFinite(px)&&px>0&&Number.isFinite(d)&&Math.abs(d)<=35&&m.quoteStatus!=='divergente'&&(!strict||(m.priceAt&&now-Date.parse(m.priceAt)<=96*3600000&&m.fechamentoAnterior>0));
 };
 const rows=Array.isArray(j?.data)?j.data:[];
 if(rows.some(r=>r.s===FEF2&&usable(r,cols)))return Response.json(j,{status:original.status});
 try{
  const contrato=segundoMesSGXV1029(now);
  const res=await fetcher('https://scanner.tradingview.com/global/scan',{...options,signal:AbortSignal.timeout(4500),body:JSON.stringify({...b,columns:FEF_FIELDS,symbols:{...b.symbols,tickers:[FEF2,contrato]}})});
  if(res.ok){
   const data=(await res.json())?.data||[];
   const direct=data.find(r=>r.s===FEF2&&usable(r,FEF_FIELDS)),ref=data.find(r=>r.s===contrato&&usable(r,FEF_FIELDS,true)),q=direct||ref;
   if(q){const row={...q,s:FEF2,simboloFonte:q.s,d:cols.map(k=>q.d[FEF_FIELDS.indexOf(k)]??null)};return Response.json({...j,data:[...rows.filter(r=>r.s!==FEF2),row]},{status:original.status});}
  }
 }catch{}
 return Response.json(j,{status:original.status});
}
