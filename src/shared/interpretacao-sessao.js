/* Classificações descritivas locais: nenhum preço, probabilidade ou causalidade fabricada. */
(function(root){
 'use strict';if(root.DiarioInterpretacao)return;
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const day=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
 function flow(rows,now=Date.now()){
  const seen=new Set(),all=(Array.isArray(rows)?rows:[]).filter(r=>r&&day(r.d)&&(!root.DiarioSessoes||root.DiarioSessoes.tradingDay('B3',r.d)===true)&&finite(r.est)&&Date.parse(r.d+'T00:00:00Z')<=now).sort((a,b)=>b.d.localeCompare(a.d)).filter(r=>!seen.has(r.d)&&seen.add(r.d)).slice(0,65);
  const n=all.length,sum=n=>all.slice(0,n).reduce((s,r)=>s+r.est,0),mean=a=>a.reduce((s,r)=>s+r.est,0)/a.length;
  const latest=all[0],windows=Object.fromEntries([5,10,20].map(k=>[k,n>=k?sum(k):null]));
  let classification='amostra_insuficiente',text='Amostra insuficiente: são necessários pelo menos 20 pregões válidos para classificar tendência.';
  // scale calculado separadamente para preservar unidades (R$ milhões).
  const abs=n>=20?all.slice(0,20).reduce((s,r)=>s+Math.abs(r.est),0)/20:0;
  const contiguous=n>=20&&(!root.DiarioSessoes||all.slice(0,19).every((r,i)=>root.DiarioSessoes.adjacent('B3',r.d,-1)===all[i+1].d));
  if(contiguous){
   const a=mean(all.slice(0,5)),b=mean(all.slice(5,10)),threshold=Math.max(abs*0.15,1);
   const positives=all.slice(0,10).filter(x=>x.est>0).length;
   if(a>threshold&&b>0&&positives>=7){classification='entradas_sustentadas';text='Entradas predominam em duas janelas de cinco pregões, com pelo menos sete saldos positivos nos dez mais recentes. O padrão pode mudar.';}
   else if(Math.abs(a)<=threshold){classification='estabilizacao';text='Os saldos recentes se aproximaram do equilíbrio. Há sinais de estabilização, ainda insuficientes para confirmar reversão sustentada.';}
   else if(a<0&&b<0&&a>b+threshold){classification='desaceleracao_saidas';text='As saídas recentes perderam intensidade em relação aos cinco pregões anteriores. Ainda não há confirmação de reversão sustentada.';}
   else if(a<0&&a<b-threshold){classification='aceleracao_saidas';text='A média das saídas aumentou em intensidade nos cinco pregões recentes em comparação com a janela anterior.';}
   else if(a>0&&b<=0){classification='possivel_reversao';text='O saldo dos cinco pregões recentes ficou positivo após uma janela negativa ou neutra. Um único dia positivo não confirma reversão; falta persistência.';}
   else {classification='sem_confirmacao';text='Fluxo sem mudança sustentada confirmada entre as janelas recentes.';}
  }
  const month=latest?.d.slice(0,7),mes=all.filter(x=>x.d.startsWith(month||'!'));
  const daysOld=latest?Math.floor((now-Date.parse(latest.d+'T12:00:00Z'))/86400000):null;
  return {n,classification,text,windows,last:latest||null,monthObserved:mes.reduce((s,r)=>s+r.est,0),monthComplete:!!mes.length&&!!root.DiarioSessoes&&root.DiarioSessoes.adjacent('B3',mes.at(-1).d,-1)?.slice(0,7)!==month,daysOld,
   warning:'Fluxo diário divulgado com defasagem; não representa fluxo intradiário. Acumulado refere-se à amostra disponível.'};
 }
 function sentiment(current,history,method){
  if(!current||!finite(current.value)||current.value<0||current.value>100||!day(current.date)||!method)return null;
  const rows=(history||[]).filter(x=>x&&finite(x.value)&&x.value>=0&&x.value<=100&&day(x.date)&&x.date<current.date&&x.method===method).sort((a,b)=>b.date.localeCompare(a.date));
  const prev=rows[0],week=rows.find(x=>Date.parse(current.date)-Date.parse(x.date)>=7*86400000);
  const delta=prev?current.value-prev.value:null;
  return {value:current.value,date:current.date,method,daily:prev&&Date.parse(current.date)-Date.parse(prev.date)<=4*86400000?delta:null,weekly:week&&Date.parse(current.date)-Date.parse(week.date)<=10*86400000?current.value-week.value:null,
   text:current.value<25&&delta>0?'Permanece em medo extremo, mas a melhora indica redução da pressão pessimista; não confirma reversão.':delta>0?'Sentimento melhorou na mesma metodologia, sem confirmar direção dos preços.':delta<0?'Sentimento piorou na mesma metodologia; avaliar preços e fluxo antes de concluir.':'Sem mudança comparável confirmada.'};
 }
 function surprise(e){
  if(!e||!finite(e.actual)||!finite(e.consensus)||!e.unit||e.unit!==e.consensusUnit||!e.period||e.period!==e.consensusPeriod||!e.source||!Number.isFinite(Date.parse(e.publishedAt)))return null;
  const delta=e.actual-e.consensus;return {delta,direction:delta>0?'acima':delta<0?'abaixo':'igual',unit:e.unit,previous:finite(e.previous)?e.previous:null,revised:finite(e.revised)?e.revised:null,note:'Surpresa do indicador não define impacto favorável ou desfavorável sobre um ativo.'};
 }
 function calendarSurprise(event,collectedAt){
  function value(raw){
   if(typeof raw==='number'&&finite(raw))return {value:raw,unit:'unidade do indicador'};
   const m=/^([+-]?\d+(?:[.,]\d+)?)\s*(%|K|M|B|pontos|pts)?$/i.exec(String(raw??'').trim());
   return m?{value:Number(m[1].replace(',','.')),unit:(m[2]||'unidade do indicador').toUpperCase()}:null;
  }
  const a=value(event?.atual),c=value(event?.proj),p=value(event?.ant);
  if(!a||!c||!event?.per)return null;
  return surprise({actual:a.value,consensus:c.value,unit:a.unit,consensusUnit:c.unit,period:event.per,consensusPeriod:event.per,
   source:event.fonte||'TradingView (calendário existente)',publishedAt:collectedAt,previous:p?.unit===a.unit?p.value:null});
 }
 const noise=/\b(loteria|mega.sena|lotof[aá]cil|hor[oó]scopo|horoscope|moneyist|dear penny|conte[uú]do patrocinado|advertorial)\b/i;
 function prioritize(events,context,now=Date.now(),anchor){
  const seen=new Set(),cut=Math.max(now-7*86400000,Number.isFinite(anchor)?anchor:now-48*3600000);
  return (events||[]).filter(e=>{
   const ts=Date.parse(e?.ultimaAtualizacao),source=e?.fontes?.find(f=>/^https:\/\//.test(f?.url));
   const key=String(e?.titulo||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
   if(!source||!key||noise.test(e.titulo)||!finite(ts)||ts<cut||ts>now+60000||seen.has(e.id||key)||seen.has(key))return false;
   seen.add(e.id||key);seen.add(key);return true;
  }).map(e=>({...e,epistemic:['CVM','SEC'].includes(e.fontes?.at(-1)?.nome)?'fato_documentado':'informacao_publicada',score:(e.prioridade==='alta'?30:0)+((context?.mode==='cripto_macro'&&/cripto|macro|politica_economica/.test(e.tema))?20:0)+Math.max(0,10-(now-Date.parse(e.ultimaAtualizacao))/3600000)})).sort((a,b)=>b.score-a.score).slice(0,12);
 }
 function adrScenario(event,quotes,context,now=Date.now()){
  const direct=event?.relacoes?.diretos||event?.tickers||[],map={VALE3:'VALE',PETR3:'PBR',PETR4:'PBR.A',ITUB4:'ITUB',BBDC4:'BBD'};
  const ticker=direct.find(t=>map[t]);if(!ticker)return null;
  const symbol=map[ticker],q=(quotes||[]).find(q=>q.s===symbol),ts=Date.parse(q?.priceAt||q?.horarioPreco||''),published=Date.parse(event.ultimaAtualizacao);
  const valid=!!q&&({reg:'regular',pre:'pre',post:'post'}[q.state]===context?.us?.state)&&q.sessionDate===context?.us?.date&&finite(q.px)&&q.px>0&&finite(ts)&&ts>=published&&ts<=now&&now-ts<20*60000&&['regular','pre','post'].includes(context?.us?.state);
  return {ticker,symbol,validQuote:valid,publishedAt:event.ultimaAtualizacao,
   text:valid?'Há cotação americana identificada após a publicação; simultaneidade não demonstra causalidade.':'Sem negócio americano válido e sincronizado após o comunicado; não atribuir reação de preço.',
   scenario:'Se a informação alterar perspectivas e for confirmada por minério/petróleo, câmbio e mercado global, poderá influenciar a próxima abertura. Reavaliar se houver novo comunicado, reversão das referências ou baixa liquidez.',
   parity:null,note:'Paridade indisponível sem razão ADR/ação oficial vigente, câmbio e preços sincronizados. Não converter variação da ADR em previsão exata da ação.'};
 }
 root.DiarioInterpretacao=Object.freeze({flow,sentiment,surprise,calendarSurprise,prioritize,adrScenario,noise});
})(typeof window!=='undefined'?window:globalThis);
