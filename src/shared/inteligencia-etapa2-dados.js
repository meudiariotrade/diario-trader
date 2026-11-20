/* v808 — Cálculos locais para auditoria, exposição e histórico.
 * Contratos puros: nunca gravam trades, carteira ou preferências. */
(function(root){
 'use strict';
 if(root.DiarioInteligenciaEtapa2Dados)return;
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const n=x=>{if(x===null||x===undefined||x==='')return null;const v=Number(x);return Number.isFinite(v)?v:null};
 const date=x=>String(x||'').slice(0,10);
 const ticker=x=>String(x||'').trim().toUpperCase().replace(/[^A-Z0-9.^_-]/g,'').slice(0,24);
 function auditarOperacoes(operacoes,helpers={}){
   const registros=[];
   for(const t of Array.isArray(operacoes)?operacoes:[]){
     if(!t||typeof t!=='object')continue;
     let aberto=false;
     try{aberto=helpers.isOpen?!!helpers.isOpen(t):t.exit===null||t.exit===''||t.exit===undefined;}catch{aberto=true;}
     if(aberto)continue;
     const entry=n(t.entry),exit=n(t.exit),stop=n(t.stop),q=n(t.qty);
     const lado=String(t.side||'').toUpperCase(),tipo=String(t.tipo||'D').toUpperCase(),falhas=[];
     if(!t.ativo)falhas.push({tipo:'dado',texto:'Ativo não informado'});
     if(entry===null||entry<=0)falhas.push({tipo:'dado',texto:'Entrada inválida'});
     if(exit===null||exit<=0)falhas.push({tipo:'dado',texto:'Saída inválida'});
     if(q===null||q<=0)falhas.push({tipo:'dado',texto:'Quantidade inválida'});
     if(!String(t.setup||'').trim())falhas.push({tipo:'dado',texto:'Estratégia não identificada'});
     if(tipo!=='O'&&(stop===null||stop<=0))falhas.push({tipo:'risco',texto:'Stop inicial não registrado'});
     if(tipo!=='O'&&stop>0&&entry>0&&(lado==='C'&&stop>=entry||lado==='V'&&stop<=entry))
       falhas.push({tipo:'risco',texto:'Stop informado no lado incorreto da entrada'});
     if(t.rules==='n')falhas.push({tipo:'disciplina',texto:'Usuário registrou que não seguiu as regras'});
     else if(!t.rules)falhas.push({tipo:'dado',texto:'Checklist de disciplina não preenchido'});
     if(!t.dtx)falhas.push({tipo:'dado',texto:'Data/horário de saída ausente'});
     let pnl=null,r=null;
     try{const x=helpers.pnl?.(t);if(finite(x))pnl=x;}catch(_){}
     try{const x=helpers.r?.(t);if(finite(x))r=x;}catch(_){}
     const rawDate=t.dtx||t.dt,rawTime=t.dt||'';
     registros.push({id:String(t.id||''),ativo:ticker(t.ativo),tipo,lado,dia:date(rawDate),
       hora:/T(\d\d):/.exec(String(rawTime))?.[1]||null,
       setup:String(t.setup||'').trim()||'Não informado',
       regime:String(t.regime||'').trim()||null,volatilidade:finite(n(t.atr))?n(t.atr):null,
       resultado:pnl,r,mkt:String(t.mkt||''),falhas,
       evidencias:{entry,exit,stop,q,rules:t.rules||null},grave:falhas.some(f=>f.tipo==='risco'||f.tipo==='disciplina')});
   }
   const comResultado=registros.filter(t=>finite(t.resultado));
   return {n:registros.length,comResultado:comResultado.length,
     pendencias:registros.filter(t=>t.falhas.length).length,
     graves:registros.filter(t=>t.grave).length,
     registros};
 }
 function resumoCondicoes(registros,criterio,opts={}){
   const list=(Array.isArray(registros)?registros:[]).filter(r=>r&&finite(r.resultado));
   const grupos=new Map(),agenda=new Set(opts.agendaDias||[]);
   for(const r of list){
     let chave='Não classificado';
     if(criterio==='horario')chave=r.hora===null?'Hora desconhecida':String(r.hora).padStart(2,'0')+':00–'+String((Number(r.hora)+1)%24).padStart(2,'0')+':00';
     else if(criterio==='regime')chave=r.regime||'Regime não registrado à época';
     else if(criterio==='setup')chave=r.setup||'Sem estratégia';
     else if(criterio==='agenda')chave=agenda.has(r.dia)?'Dia de divulgação conhecida':'Sem classificação confirmada';
     else if(criterio==='volatilidade')chave=finite(r.volatilidade)?'ATR registrado (valor bruto, sem normalizar por ativo)':'Volatilidade não registrada';
     const group=grupos.get(chave)||{nome:chave,n:0,resultado:0,ganhos:0,perdas:0,semR:0};
     group.n++;group.resultado+=r.resultado;if(r.resultado>0)group.ganhos++;else if(r.resultado<0)group.perdas++;
     if(!finite(r.r))group.semR++;grupos.set(chave,group);
   }
   return [...grupos.values()].sort((a,b)=>b.n-a.n).map(v=>({
     ...v,amostraSuficiente:v.n>=Math.max(5,opts.minAmostra||5),
     taxaAcerto:v.n>=5?100*v.ganhos/v.n:null,
     aviso:v.n<5?'Amostra insuficiente para concluir tendência.':null
   })).slice(0,12);
 }
 function exposicaoCarteira(snap,metadados={}){
   const markets=['BR','US'];const moedas={BR:'BRL',US:'USD'},output=[];
   for(const market of markets){
     const s=snap?.[market]||{},pos=(Array.isArray(s.pos)?s.pos:[]).filter(p=>p&&n(p.v)>0);
     const total=pos.reduce((sum,p)=>sum+n(p.v),0),sector=new Map(),issuer=new Map(),factors=new Map();
     for(const p of pos){
       const val=n(p.v),tk=ticker(p.tk);
       if(!tk||!(val>0))continue;
       const meta=metadados[market+':'+tk]||{},setor=String(meta.setor||meta.sector||'Setor não identificado').slice(0,70);
       const f=/^(PETR|PRIO|RECV|BRAV|XOM|CVX)/.test(tk)?'Energia e petróleo':
         /^(VALE|CSNA|GGBR|USIM|BHP|RIO)/.test(tk)?'Minério e metais':
         /^(ITUB|BBDC|BBAS|SANB|JPM|BAC)/.test(tk)?'Financeiro':null;
       issuer.set(tk,(issuer.get(tk)||0)+val);sector.set(setor,(sector.get(setor)||0)+val);
       if(f)factors.set(f,(factors.get(f)||0)+val);
     }
     const rows=map=>[...map].sort((a,b)=>b[1]-a[1]).map(([nome,v])=>({nome,v,pct:total>0?100*v/total:null}));
     output.push({mercado:market,moeda:moedas[market],total,n:pos.length,
       empresas:rows(issuer),setores:rows(sector),fatoresHipoteticos:rows(factors),
       maiorEmpresa:rows(issuer)[0]||null});
   }
   return output;
 }
 const fundamentals=['roe','roic','margem_ebitda','margem_liquida','fcf_yield','divida_liquida_ebitda','pvp','pl','forward_pe','momentum_12_1','score_quant_br','score_quant_us'];
 function mudaFundamentos(atual,anterior){
   const valid=x=>x&&typeof x==='object'&&x.ticker&&typeof x.referencia==='string';
   if(!valid(atual))return {comparavel:false,mudancas:[],motivo:'Sem fonte atual identificada'};
   if(!valid(anterior)||anterior.ticker!==atual.ticker)return {comparavel:false,mudancas:[],motivo:'Sem análise anterior comparável armazenada'};
   if(anterior.referencia===atual.referencia)return {comparavel:false,mudancas:[],motivo:'Mesma referência da fonte; não é mudança entre trimestres'};
   const changes=[];
   for(const k of fundamentals){
     const a=n(atual[k]),b=n(anterior[k]);
     if(a===null||b===null)continue;
     const delta=a-b,pct=b!==0?delta/Math.abs(b)*100:null;
     let efeito='neutro';
     if(['roe','roic','margem_ebitda','margem_liquida','fcf_yield','momentum_12_1','score_quant_br','score_quant_us'].includes(k))efeito=delta<0?'deterioração':'melhoria';
     if(['divida_liquida_ebitda','pvp','pl','forward_pe'].includes(k))efeito=delta>0?'pressão potencial':'alívio potencial';
     changes.push({indicador:k,anterior:b,atual:a,delta,pct,efeito});
   }
   return {comparavel:changes.length>0,mudancas:changes,motivo:changes.length?'Comparação histórica descritiva; não demonstra causalidade nem indica negociação.':'Sem métricas equivalentes entre referências'};
 }
 function extrairFundamentos(row,referencia){
   const out={ticker:ticker(row?.ticker),referencia:String(referencia||''),fonte:String(row?.fonte||row?.source||'snapshot público').slice(0,90)};
   for(const k of fundamentals)if(n(row?.[k])!==null)out[k]=n(row[k]);
   return out;
 }
 function temaEstudo(e){
   const s=String(e?.titulo||e||'').toLowerCase();
   if(/copom|selic|fed|fomc|juros|treasur|taxa/.test(s))return {tema:'Política monetária e curva de juros',mecanica:'Expectativas para os juros alteram desconto dos fluxos de caixa, duration, câmbio e custo de capital.',lab:'eco'};
   if(/cpi|ipca|infla|payroll|emprego/.test(s))return {tema:'Inflação, Phillips e modelo IS–LM',mecanica:'Surpresas de preços ou emprego podem alterar expectativas sobre juros e prêmio de risco, dependendo do regime.',lab:'eco'};
   if(/petrol|brent|wti|opep|opec/.test(s))return {tema:'Choque de oferta e abertura comercial',mecanica:'Preço de energia influencia custos, termos de troca e expectativas de inflação, sem relação mecânica obrigatória com ações.',lab:'eco'};
   if(/balan|resultado|lucro|relevante|divida|margem/.test(s))return {tema:'Fluxo de caixa descontado e valuation',mecanica:'O valor depende de projeções de fluxo de caixa, risco e taxa de desconto; um fato não prova o movimento do preço.',lab:'eco'};
   return {tema:'Transmissão macro e risco',mecanica:'Compare canais de juros, câmbio, commodities e risco; correlação isolada não identifica causalidade.',lab:'eco'};
 }
 root.DiarioInteligenciaEtapa2Dados=Object.freeze({
   auditarOperacoes,resumoCondicoes,exposicaoCarteira,mudaFundamentos,extrairFundamentos,temaEstudo
 });
})(typeof window!=='undefined'?window:globalThis);
