/* Modelo puro dos fluxos de processo. Sem rede, DOM ou cálculos fiscais. */
(function(root){
  'use strict';
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const id=()=>root.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  const strip=record=>Object.fromEntries(Object.entries(record||{}).filter(([key])=>!['_history','_events','_fc','_conflicts','_resolved','u'].includes(key)).map(([key,value])=>[key,clone(value)]));
  const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
  function union(a=[],b=[],limit=100){return [...new Map([...a,...b].filter(x=>x&&x.id).map(x=>[x.id,x])).values()].sort((x,y)=>x.at-y.at).slice(-limit)}
  function mergeRecord(a,b){const winner=(a?.u||0)>=(b?.u||0)?a:b;return {...clone(winner),_history:union(a?._history,b?._history,50),_events:union(a?._events,b?._events,100)}}
  function archive(record,previous,reason,now=Date.now(),coalesce=30000){
    if(!previous||stable(strip(record))===stable(strip(previous)))return false;
    const history=record._history||(record._history=[]),last=history.at(-1);
    if(!last||now-last.at>=coalesce||last.reason!==reason)history.push({id:id(),at:now,reason,data:strip(previous)});
    record._history=history.slice(-50);
    const changes=[...new Set([...Object.keys(strip(previous)),...Object.keys(strip(record))])].filter(k=>stable(previous[k])!==stable(record[k]));
    const events=record._events||(record._events=[]),event=events.at(-1);
    if(event&&now-event.at<coalesce&&event.kind===reason){event.at=now;event.fields=[...new Set([...event.fields,...changes])]}else events.push({id:id(),at:now,kind:reason,fields:changes});
    record._events=events.slice(-100);return true;
  }
  function ruleSnapshot(rules=[],checked={},now=Date.now(),scope='registro'){
    return {id:id(),at:now,scope,rules:rules.map(rule=>({id:String(rule.id),text:String(rule.t||''),category:rule.cat??null,version:rule.u||0,checked:checked[rule.id]===true}))};
  }
  function captureTrade(trade,rules,day,today,now=Date.now()){
    if(!trade._rulesSnapshot)trade._rulesSnapshot=ruleSnapshot(rules,day?.chk,now,String(trade.dt||'').slice(0,10)===today?'registro_no_dia':'registro_posterior_sem_comprovacao_historica');
    if(!trade._events?.length)trade._events=[{id:id(),at:now,kind:'registro',fields:[]}];
    return trade;
  }
  const templates={
    dt:{name:'Day trade',plano:'Cenário principal:\nCenário alternativo:\nNíveis de atenção:\nGatilho e invalidação:\nRisco máximo e condição de parada:\n',pre:'Qual comportamento devo evitar nesta sessão? Como vou reagir a um stop?\n'},
    sw:{name:'Swing trade',plano:'Tese e horizonte:\nCatalisadores e eventos da empresa:\nNíveis de atenção e invalidação:\nExposição e risco de carregar a posição:\nData de revisão:\n',pre:'O que mudaria minha tese? Como vou lidar com um gap?\n'},
    us:{name:'Mercado americano',plano:'Sessão e fuso horário:\nAgenda de dados e resultados:\nCenário principal e alternativo:\nGatilho e invalidação:\nRisco em USD e efeito cambial:\n',pre:'Como vou reagir a uma surpresa de dado ou a um movimento na abertura?\n'}
  };
  function applyTemplate(day,template,overwrite=false){
    for(const key of ['plano','pre'])if(overwrite||!String(day[key]||'').trim())day[key]=template[key]||'';
    day._template={name:template.name,at:Date.now()};return day;
  }
  const status=trade=>['followed','broken','unknown'].includes(trade._assessment?.status)?trade._assessment.status:trade.rules==='s'?'followed':trade.rules==='n'?'broken':'unknown';
  function compare(trades,calc,currency,from='',to='9999-12-31'){
    const groups=Object.fromEntries(['followed','broken','unknown'].map(k=>[k,{n:0,wins:0,risks:[],currencies:{}}]));
    for(const trade of trades||[]){const date=String(trade.dtx||trade.dt||'').slice(0,10),c=calc(trade);if(date<from||date>to||c?.pl==null||!Number.isFinite(c.pl))continue;
      const g=groups[status(trade)],unit=currency(trade)||'BRL';g.n++;if(c.pl>0)g.wins++;if(Number.isFinite(c.r))g.risks.push(c.r);g.currencies[unit]=(g.currencies[unit]||0)+c.pl;
    }
    for(const group of Object.values(groups)){group.winRate=group.n?group.wins/group.n*100:null;group.meanR=group.risks.length?group.risks.reduce((a,b)=>a+b,0)/group.risks.length:null;group.rCount=group.risks.length}
    return groups;
  }
  function monday(date){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()-(d.getDay()+6)%7);return localDay(d)}
  const localDay=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function addDays(date,n){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return localDay(d)}
  function weekly(trades,days,from,calc,currency){
    from=monday(from);const to=addDays(from,6),list=(trades||[]).filter(t=>{const d=String(t.dtx||t.dt||'').slice(0,10);return d>=from&&d<=to}),errors={};
    list.forEach(t=>(Array.isArray(t.tags)?t.tags:t.err&&t.err!=='Nenhum'?[t.err]:[]).forEach(tag=>errors[tag]=(errors[tag]||0)+1));
    const ranked=Object.entries(errors).sort((a,b)=>b[1]-a[1]);
    return {from,to,comparison:compare(list,calc,currency,from,to),errors:ranked,notes:Object.entries(days||{}).filter(([d])=>d>=from&&d<=to).flatMap(([date,day])=>[['BR',day],['US',day.us]].filter(([,v])=>v&&(v.aprend||v.bem)).map(([market,v])=>({date,market,learning:v.aprend||'',good:v.bem||''}))),suggestion:ranked.length?`Escolher uma prevenção concreta para: ${ranked[0][0]}`:'Definir um comportamento observável para praticar na próxima semana.'};
  }
  function search(state,query){
    const tokens=normalize(query).trim().split(/\s+/).filter(Boolean);if(!tokens.length)return [];
    const entries=[];
    for(const t of state.trades||[])entries.push({kind:'trade',id:t.id,title:`${t.ativo||'Operação'} · ${String(t.dt||'').slice(0,10)}`,text:[t.ativo,t.setup,t.nota,t.obs,t.coment,t.err,t.rules,...(t.tags||[])].filter(Boolean).join(' '),date:t.dt||''});
    for(const [date,day] of Object.entries(state.days||{}))for(const [market,item] of [['BR',day],['US',day.us]])if(item)entries.push({kind:'day',id:date,market,title:`Diário ${market} · ${date}`,date,text:[date,item.plano,item.pre,item.resumo,item.aprend,item.bem,item.cond,item.prevn].filter(Boolean).join(' ')});
    for(const [market,rules] of [['BR',state.rules],['US',state.rulesUS]])for(const rule of rules||[])entries.push({kind:'rule',market,id:rule.id,title:(rule.t||'Regra')+' · '+market,text:rule.t||'',date:''});
    for(const book of state.books||[])entries.push({kind:'book',id:book.id,title:book.t||book.nome||'Estudo',text:[book.t,book.a,book.nome].filter(Boolean).join(' '),date:''});
    return entries.filter(e=>tokens.every(token=>normalize(e.title+' '+e.text).includes(token))).sort((a,b)=>b.date.localeCompare(a.date));
  }
  function undoBatch(state,batch,now=Date.now()){
    if(batch.undoneAt)return {removed:0,restored:0,skipped:[]};
    const result={removed:0,restored:0,skipped:[]};
    for(const item of batch.items||[]){const at=(state.trades||[]).findIndex(t=>t.id===item.id),current=state.trades[at];if(!current||stable(strip(current))!==item.after){result.skipped.push(item.id);continue}
      if(item.before){const restored=clone(item.before);restored.u=now;restored._events=union(current._events,[{id:id(),at:now,kind:'desfazer_importacao',fields:[]}]);state.trades[at]=restored;result.restored++}
      else {state.trades.splice(at,1);(state.del??={})[item.id]=now;result.removed++}
    }
    batch.undoneAt=now;batch.result=result;return result;
  }
  function journal(edition,prefs={}){
    const result=clone(edition),hidden=new Set(prefs.hidden||[]),tickers=(prefs.tickers||[]).map(normalize);
    result.materias=(result.materias||[]).filter(item=>!hidden.has(item.editoria)).filter(item=>!tickers.length||!/empresa/i.test(item.editoria||'')||tickers.some(t=>normalize(JSON.stringify(item)).includes(t)));
    if(prefs.mode==='brief'){
      result.formato='resumido';result.nome=(result.nome||'Edição')+' · resumo';
      for(const item of [result.manchete,...result.materias].filter(Boolean))item.texto=String(item.texto||'').split(/\n\s*\n/)[0];
    }
    return result;
  }
  root.TraderModel={clone,normalize,id,strip,stable,union,mergeRecord,archive,ruleSnapshot,captureTrade,templates,applyTemplate,status,compare,monday,addDays,weekly,search,undoBatch,journal};
})(typeof window==='undefined'?globalThis:window);
