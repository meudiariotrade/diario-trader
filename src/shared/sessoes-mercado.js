/* Calendário público por instrumento. Sem rede, timers ou dados privados.
 * Fora da cobertura verificada retorna desconhecido; feriado bancário não fecha bolsa. */
(function(root){
 'use strict';
 if(root.DiarioSessoes)return;
 const sources=Object.freeze({
  b3:'https://www.b3.com.br/pt_br/noticias/calendario-de-negociacao-da-b3-confira-o-funcionamento-da-bolsa-em-2026.htm',
  b3_2027:'https://www.b3.com.br/pt_br/solucoes/plataformas/puma-trading-system/para-participantes-e-traders/calendario-de-negociacao/feriados/',
  hours:'https://www.b3.com.br/pt_br/solucoes/plataformas/puma-trading-system/para-participantes-e-traders/horario-de-negociacao/',
  us:'https://www.nyse.com/trade/hours-calendars',nasdaq:'https://www.nasdaqtrader.com/Trader.aspx?id=Calendar',
  cme:'https://www.cmegroup.com/markets/equities/sp-500-and-nasdaq-100-futures.html'
 });
 /* v811: cobertura 2027 — B3 (12 dias sem pregão; 01/05, 20/11 e 25/12 caem no sábado) e NYSE/Nasdaq
    (comunicado NYSE Group 2026–2028). Fora desses anos o estado continua 'desconhecido'. */
 const brClosed=new Set([...['01-01','02-16','02-17','04-03','04-21','05-01','06-04','09-07','10-12','11-02','11-20','12-24','12-25','12-31'].map(x=>'2026-'+x),
  ...['01-01','02-08','02-09','03-26','04-21','05-27','09-07','10-12','11-02','11-15','12-24','12-31'].map(x=>'2027-'+x)]);
 const usClosed=new Set([...['01-01','01-19','02-16','04-03','05-25','06-19','07-03','09-07','11-26','12-25'].map(x=>'2026-'+x),
  ...['01-01','01-18','02-15','03-26','05-31','06-18','07-05','09-06','11-25','12-24'].map(x=>'2027-'+x)]);
 const usEarly=new Set(['2026-11-27','2026-12-24','2027-11-26']);
 const COBERTURA=/^(2026|2027)-\d\d-\d\d$/;
 const brCinzas=new Set(['2026-02-18','2027-02-10']);
 const formats=new Map();
 function local(now,tz){
  let fmt=formats.get(tz);if(!fmt){fmt=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});formats.set(tz,fmt);}
  const p=Object.fromEntries(fmt.formatToParts(new Date(now)).map(x=>[x.type,x.value]));
  return {date:p.year+'-'+p.month+'-'+p.day,minute:+p.hour*60 + +p.minute,weekend:['Sat','Sun'].includes(p.weekday),day:p.weekday};
 }
 function shift(d,n){return new Date(Date.parse(d+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);}
 function tradingDay(market,d){
  const w=new Date(d+'T12:00:00Z').getUTCDay();if(w===0||w===6)return false;
  if(!COBERTURA.test(d))return null;
  return !(market==='B3'?brClosed:usClosed).has(d);
 }
 function adjacent(market,d,direction){for(let i=1;i<=14;i++){const day=shift(d,i*direction),v=tradingDay(market,day);if(v===null)return null;if(v)return day;}return null;}
 function dst(now){const parts=local(now,'America/New_York'),utc=new Date(now);return (utc.getUTCHours()*60+utc.getUTCMinutes()-parts.minute+1440)%1440===240;}
 function session(instrument,now=Date.now()){
  const id=String(instrument||'B3').toUpperCase();
  if(!Number.isFinite(new Date(now).getTime()))return {instrument:id,state:'desconhecido',reason:'Data inválida'};
  if(['CRYPTO','BTC','ETH','SOL'].includes(id))return {instrument:id,state:'regular',tradable:true,phase:'during',source:'Mercado cripto 24/7',date:local(now,'UTC').date};
  const br=['B3','WIN','WDO','DI'].includes(id),us=['NYSE','NASDAQ','US'].includes(id);
  if(!br&&!us){
   if(['ES','NQ'].includes(id)){
    const c=local(now,'America/Chicago'),u=local(now,'America/New_York');
    const special=usClosed.has(u.date)||usEarly.has(u.date)||usClosed.has(shift(u.date,1))||usEarly.has(shift(u.date,1));
    if(special||!COBERTURA.test(u.date))return {instrument:id,state:'desconhecido',tradable:false,phase:'post',reason:'Conferir grade especial CME por contrato',source:sources.cme};
    const closed=c.day==='Sat'||(c.day==='Sun'&&c.minute<1020)||(c.day==='Fri'&&c.minute>=960);
    const pause=c.minute>=960&&c.minute<1020;
    return {instrument:id,state:closed?'fechado':pause?'intervalo':'regular',tradable:!closed&&!pause,phase:closed||pause?'post':'during',source:sources.cme};
   }
   return {instrument:id,state:'desconhecido',tradable:false,phase:'post',reason:'Sessão depende do contrato, praça e provedor; não inferir por bolsa americana',source:null};
  }
  const market=br?'B3':'US',p=local(now,br?'America/Sao_Paulo':'America/New_York'),valid=tradingDay(market,p.date);
  const base={instrument:id,date:p.date,source:br?sources.b3:sources.us,nextDate:adjacent(market,p.date,1),previousDate:adjacent(market,p.date,-1),tradable:false,verified:valid!==null};
  if(valid===null)return {...base,state:'desconhecido',phase:'post',reason:'Calendário fora da cobertura verificada (2026–2027)'};
  if(!valid)return {...base,state:'fechado',phase:'post',reason:p.weekend?'Fim de semana':'Feriado da bolsa'};
  const special=br&&brCinzas.has(p.date);
  const open=br?(special?780:id==='B3'?600:540):570;
  const close=br?(id==='WIN'?1105:id==='WDO'?1110:id==='DI'?1080:dst(now)?1020:1080):(usEarly.has(p.date)?780:960);
  const auction=br&&id==='B3'&&p.minute>=close-5&&p.minute<close;
  let state=p.minute<open?'pre':p.minute<close?(auction?'leilao':'regular'):'post';
  // Horários estendidos são possibilidades da praça, não comprovação de negócios de uma ADR.
  if(us&&p.minute<240)state='fechado';
  if(us&&p.minute>=(usEarly.has(p.date)?1020:1200))state='fechado';
  return {...base,nextDate:p.minute<open?p.date:base.nextDate,state,open,close,early:usEarly.has(p.date),special,tradable:state==='regular',phase:p.minute<open?'pre':p.minute<close?'during':'post'};
 }
 function context(now=Date.now(),manual){
  const b3=session('B3',now),win=session('WIN',now),wdo=session('WDO',now),us=session('NYSE',now),br=local(now,'America/Sao_Paulo');
  const weekend=br.weekend,closed=b3.state==='fechado',autoPhase=win.phase==='during'||wdo.phase==='during'?'during':win.phase;
  const mode=weekend?'cripto_macro':closed?'b3_fechada':autoPhase==='pre'?'pre':autoPhase==='during'?'pregao':'pos';
  const anchorDate=b3.phase==='post'&&!closed&&b3.verified?b3.date:b3.previousDate;
  const anchorSession=anchorDate?session('B3',Date.parse(anchorDate+'T15:00:00Z')):null;
  const anchorAt=anchorSession?.close?new Date(Date.parse(anchorDate+'T03:00:00Z')+anchorSession.close*60000).toISOString():null;
  return {at:new Date(now).toISOString(),anchorAt,b3,win,wdo,us,nasdaq:session('NASDAQ',now),es:session('ES',now),nq:session('NQ',now),crypto:session('CRYPTO',now),mode,
   phase:['pre','during','post'].includes(manual)?manual:autoPhase,manual:['pre','during','post'].includes(manual),
   anchorDate,
   priorities:weekend?['cripto','macro','agenda']:closed?['adr','ewz','eua','commodities','macro','agenda']:autoPhase==='pre'?['adr','ewz','futuros','juros','commodities','agenda','balancos','opcoes']:autoPhase==='during'?['urgente','b3','juros','cambio','agenda','opcoes']:['fechamento','fato_relevante','adr','commodities','proxima_sessao'],
   warning:b3.verified===false?'Calendário requer atualização':us.state==='fechado'&&b3.tradable?'EUA fechados: referências americanas podem estar congeladas; liquidez pode ser menor.':null};
 }
 function nextTransition(now=Date.now()){
  const signature=c=>[c.mode,c.b3.state,c.win.state,c.wdo.state,c.us.state,c.es.state,c.b3.date].join('|');
  const current=signature(context(now)),candidates=[];
  const grades=[['America/Sao_Paulo',[0,540,600,780,1015,1020,1075,1080,1105,1110]],['America/New_York',[0,240,570,780,960,1020,1200]],['America/Chicago',[0,960,1020]]];
  for(const [zone,minutes] of grades){
   const date=local(now,zone).date;
   for(let day=0;day<=1;day++)for(const minute of minutes){
    const target=shift(date,day),nominal=Date.parse(target+'T00:00:00Z')+minute*60000;
    let at=nominal;
    for(let i=0;i<2;i++){const p=local(at,zone);const observed=Date.parse(p.date+'T00:00:00Z')+p.minute*60000;at+=nominal-observed;}
    if(at>now+500&&at<=now+24*3600000)candidates.push(at);
   }
  }
  for(const at of [...new Set(candidates)].sort((a,b)=>a-b))if(signature(context(at))!==current)return at;
  return now+24*3600000;
 }
 root.DiarioSessoes=Object.freeze({session,context,nextTransition,local,shift,tradingDay,adjacent,sources,version:2,coverage:'2026-2027'});
})(typeof window!=='undefined'?window:globalThis);
