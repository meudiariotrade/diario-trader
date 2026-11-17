/* Aba principal: pesquisa, histórico recuperável e estudo. Credenciais ficam na sessão existente. */
(function(w,d){'use strict';
 const M=w.DiarioAnalisesModelo,E=M.escape,owner=()=>typeof SESS!=='undefined'&&SESS?SESS.uid:'local';
 let screenTab='pesquisa'; let account=owner(),jobs=[],current=null,busy=false,message='',input='ANALISE PETR4',loading=false,controller=null,loadedFor='',runId=0,premissas={wacc:'',crescimento:'',perpetuidade:'',anos:'5'};
 const context=()=>w.DiarioContexto;
 const fmt=t=>t?new Date(t).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Não informado';
 // v621: logos circulares (AssetLogo) e carteira automática
 const logos=(tks,tam)=>(Array.isArray(tks)?tks:[]).slice(0,4).map(t=>{try{return w.DiarioLogos?w.DiarioLogos.html(t,tam):''}catch{return ''}}).join('');
 function comCarteira(txt){const t=String(txt||'').trim();if(!/^CARTEIRA\s*$/i.test(t))return t;let tks=[];try{tks=[...new Set((pfCalc().pos||[]).map(p=>String(p.tk||'').toUpperCase().replace(/\.SA$/,'').replace(/F$/,'')).filter(x=>/^[A-Z]{4}\d{1,2}$/.test(x)||/^[A-Z]{1,5}(?:[.-][A-Z])?$/.test(x)))].slice(0,12)}catch{}if(!tks.length)throw Error('Sua aba Carteira não tem ativos. Escreva, por exemplo: CARTEIRA IAU, BOVA11, PETR4.');return 'CARTEIRA '+tks.join(', ')}
 const update=()=>{if(typeof tab!=='undefined'&&tab==='analises'){const root=d.querySelector('#an-root');if(root)root.outerHTML=view();afterRender()}};
 function syncAccount(){const now=owner();if(now===account)return;controller?.abort();runId++;account=now;jobs=[];current=null;busy=false;loading=false;loadedFor='';input=context()?.get('analises.comando')||'ANALISE PETR4';message='';premissas=context()?.get('analises.premissas')||{wacc:'',crescimento:'',perpetuidade:'',anos:'5'}}
 async function api(body){const uid=owner(),c=cfg();if(!SESS||!c)throw Error('Entre na sua conta em Configurações → Conta para pesquisar e salvar o histórico.');await tok();if(uid!==owner())throw Error('A conta mudou. A resposta foi descartada.');const ac=new AbortController();controller=ac;const timer=setTimeout(()=>ac.abort(),65000);try{const r=await fetch(c.url+'/functions/v1/pesquisa',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify(body),signal:ac.signal});const value=await r.json();if(uid!==owner())throw Error('A conta mudou. A resposta foi descartada.');if(!r.ok)throw Object.assign(Error(value.erro||'Não foi possível consultar a pesquisa.'),{status:r.status});w.DiarioDiagnostico?.recover({endpoint:'pesquisa'});return value}finally{clearTimeout(timer);if(controller===ac)controller=null}}
 function remember(job){if(!job)return;current=job;jobs=[job,...jobs.filter(x=>x.id!==job.id)].slice(0,30);context()?.set('analises.trabalho',job.id)}
 async function history(){syncAccount();if(loading||!SESS||w.DIARIO_DEMO)return;loading=true;update();try{const r=await api({acao:'listar'});jobs=r.trabalhos||[];if(!current){const id=context()?.get('analises.trabalho');current=jobs.find(x=>x.id===id)||null}loadedFor=owner();message=''}catch(e){message=e.message}finally{loading=false;update()}}
 async function run(id){if(busy)return;syncAccount();busy=true;message='';const seq=++runId;update();try{let job;if(id){const r=await api({acao:'status',id});job=r.trabalho}else{const cmdTxt=comCarteira(input);M.command(cmdTxt);const newId=crypto.randomUUID();const r=await api({acao:'criar',id:newId,comando:cmdTxt,premissas:['wacc','crescimento','perpetuidade'].some(k=>premissas[k]!=='')?Object.fromEntries(Object.entries(premissas).filter(([,v])=>v!=='').map(([k,v])=>[k,k==='anos'?Number(v):Number(String(v).replace(',','.'))/100])):{}});job=r.trabalho}remember(job);update();let count=0;while(!['concluido','cancelado'].includes(job.status)&&count++<18&&seq===runId){const r=await api({acao:'avancar',id:job.id});if(r.ocupado){message='Esta etapa já está sendo processada. O histórico permite atualizar e retomar.';break}job=r.trabalho;remember(job);update()}if(job.status==='concluido')message='Análise salva. Confira a data dos dados e as lacunas.'}catch(e){if(seq!==runId)return;message=e.name==='AbortError'?'A conexão foi interrompida. Use Atualizar histórico e Retomar; as etapas salvas permanecem disponíveis.':e.message;if(current&&current.status!=='concluido')remember({...current,status:'falhou',erro:message});w.DiarioDiagnostico?.incident({endpoint:'pesquisa',ativo:current?.comando?.tickers?.join(','),tentativa:current?.tentativas||1,mensagem:message,estado:'falhou'})}finally{if(seq===runId){busy=false;update()}}}
 function quiz(result){const q=result.questao,a=result.avaliacao;return `<section class="an-section"><p class="an-kicker">QUESTÃO ORIGINAL · ${E(q.modulo)} · ${E(q.tema||'Prática')}</p><h3>${E(q.enunciado)}</h3><div class="an-answers">${q.alternativas.map((text,i)=>`<button type="button" data-an-answer="${i}" ${a||busy?'disabled':''} class="${a?.correta===i?'an-correct':''}"><b>${'ABCDE'[i]}</b><span>${E(text)}</span></button>`).join('')}</div>${a?`<div role="status"><h3>${a.acertou?'Resposta correta':'Vamos revisar este ponto'}</h3><p>Gabarito: ${'ABCDE'[a.correta]} · sua resposta: ${'ABCDE'[a.resposta]}</p>${M.markdown(a.explicacao)}${a.calculo?`<p><b>Cálculo</b></p>${M.markdown(a.calculo)}`:''}</div><button class="btn" type="button" data-an-next="${E(q.modulo)}">Próxima questão</button>`:'<p>Escolha uma alternativa. A correção aparece depois da resposta.</p>'}</section>`}
 function performance(){const graded=jobs.filter(x=>x.resultado?.avaliacao);if(!graded.length)return '';const rows=['CB','CG1','CT1'].map(mod=>{const set=graded.filter(x=>x.resultado.questao?.modulo===mod),hit=set.filter(x=>x.resultado.avaliacao.acertou).length;return {mod,n:set.length,hit,rate:set.length?hit/set.length:null}});const weak=rows.filter(x=>x.n&&x.rate<.7);return `<details class="an-section"><summary>Desempenho por módulo · histórico recente</summary><div class="an-table"><table><thead><tr><th>Módulo</th><th>Acertos</th><th>Aproveitamento</th></tr></thead><tbody>${rows.map(x=>`<tr><th>${x.mod}</th><td>${x.hit}/${x.n}</td><td>${x.n?Math.round(x.rate*100)+'%':'Sem respostas'}</td></tr>`).join('')}</tbody></table></div><p>${weak.length?'Pontos para revisar: '+weak.map(x=>x.mod).join(', '):'Continue respondendo para identificar seus pontos de revisão.'} · Amostra: até 30 trabalhos recentes.</p></details>`}
 function report(){if(!current)return `<section class="an-empty"><span aria-hidden="true">↗</span><h3>Da pesquisa à decisão informada</h3><p>Escolha um comando para consultar balanços, contexto de mercado e gráficos. O relatório identifica fatos, premissas, opiniões e dados que não foram encontrados.</p><div class="an-examples">${['ANALISE BBAS3','ANALISE AAPL','RESULTADO IAU','TÉCNICO IVV','COMPARE AAPL MSFT NVDA','CARTEIRA','AGENDA','MODO PROVA CT1','EXPLIQUE WACC'].map(x=>`<button type="button" data-an-example="${E(x)}">${E(x)}</button>`).join('')}</div></section>`;const result=current.resultado,st=w.DiarioDominios.jobState(current);return `<section class="an-section an-current"><div class="an-result-head"><div><p class="an-kicker">${E(st.estado.toUpperCase())} · ${E(current.id.slice(0,8))}</p><h3 class="an-title-logos">${logos(current.comando?.tickers,26)}<span>${E(current.comando?.texto||'Análise')}</span></h3><small>Atualizado em ${fmt(current.atualizado)} · horário de Brasília</small></div><div class="an-actions">${result?.texto?'<button class="btn s" type="button" data-an-export="md">Salvar texto</button><button class="btn s" type="button" data-an-export="print">Imprimir / PDF</button>':''}${!st.terminal&&!busy?'<button class="btn s" type="button" data-an-resume>Retomar</button><button class="btn s" type="button" data-an-cancel>Cancelar trabalho</button>':''}</div></div>${!result?`<ol class="an-steps">${['Coletar dados reais (B3/EUA)','Calcular indicadores','Redigir e salvar'].map((label,i)=>`<li class="${current.etapa>i?'done':current.etapa===i?'active':''}">${label}${i===1?' · um ativo por etapa':''}</li>`).join('')}</ol><p>${E(current.erro||'As etapas concluídas são salvas para retomada. A consulta pode levar alguns minutos.')}</p>${!busy?'<button class="btn" type="button" data-an-resume>Retomar esta análise</button>':''}`:result.questao?quiz(result):`<p class="an-data-note">Pesquisa: ${fmt(result.consultado_em)} · geração: ${fmt(result.gerado_em)} · ${E(result.modelo||'IA')}</p><p class="an-notice">${E(result.estado_dados||"")}</p><div class="an-report">${M.markdown(result.texto)}</div>`}${result?.fontes?.length?`<details class="an-sources" open><summary>Fontes consultadas · ${result.fontes.length}</summary><ol>${result.fontes.map(s=>M.safeUrl(s.url)?`<li><a href="${E(M.safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${E(s.titulo||'Fonte '+s.id)}</a></li>`:'').join('')}</ol></details>`:''}${result?.sugestoes?'<div id="an-search-suggestions"></div>':''}</section>`}
 function subnav(){return '<nav class="an-subs" role="tablist" aria-label="Pesquisa e screeners de investimentos">'+[['pesquisa','B3 &amp; EUA'],['br','Screener Brasil'],['us','Screener EUA']].map(function(x){return '<button type="button" role="tab" data-an-sub="'+x[0]+'" class="'+(screenTab===x[0]?'selected':'')+'" aria-selected="'+(screenTab===x[0]?'true':'false')+'" aria-label="'+(x[0]==='pesquisa'?'Pesquisa B3 e EUA':x[1])+'">'+x[1]+(x[0]==='pesquisa'?'<small class="an-submeta">CB / CG1 / CT1</small>':'')+'</button>'}).join('')+'</nav>'}
 function view(){syncAccount();if(screenTab!=='pesquisa')return '<main id="an-root" class="an-page"><div class="an-screener-switch">'+subnav()+'</div>'+(w.DiarioScreeners?.view(screenTab)||'<p>Carregando Screener…</p>')+'</main>';const demo=w.DIARIO_DEMO;return `<main id="an-root" class="an-page" aria-labelledby="an-title"><div class="an-screener-switch">${subnav()}</div><header class="an-header"><div><p class="an-kicker">PESQUISA DE INVESTIMENTOS</p><h1 id="an-title">Análise técnica e fundamentalista</h1><p>Balanços, preço e contexto. Fontes e datas em cada análise.</p></div></header><div class="an-layout"><div class="an-main"><section class="an-section an-compose"><div class="an-modebar" role="group" aria-label="Comandos de análise">${[['ANALISE PETR4','Completa'],['RESULTADO PETR4','Resultados'],['TÉCNICO PETR4','Técnica'],['COMPARE PETR4 PBR','Comparar'],['CARTEIRA','Carteira'],['AGENDA','Agenda'],['MODO PROVA','Estudar']].map(([value,label])=>`<button type="button" data-an-example="${E(value)}">${label}</button>`).join('')}</div><form id="an-form"><label for="an-command">O que você quer analisar?</label><div class="an-command-line"><input id="an-command" name="comando" value="${E(input)}" placeholder="ANALISE PETR4" maxlength="2400" autocomplete="off" spellcheck="false" ${busy?'readonly':''}><button class="btn" type="submit" ${busy||demo?'disabled':''}>${busy?'Processando…':'Pesquisar e analisar'}</button></div><small>Comandos: ANALISE, RESULTADO, COMPARE, TÉCNICO, CARTEIRA, AGENDA, MODO PROVA e EXPLIQUE. Ativos da B3 (PETR4, BOVA11) e dos EUA (AAPL, IVV). CARTEIRA sozinho usa os ativos da sua aba Carteira.</small><details class="an-assumptions"><summary>Premissas de DCF · opcionais</summary><p>São hipóteses suas para o modelo, não dados observados. Em branco, o app usa premissas padrão (B3: WACC 14%, crescimento 5%, perpetuidade 4%; EUA: 9%, 6% e 2,5%) e informa quais foram usadas. Bancos e ETFs não usam DCF.</p><div class="an-modebar">${[["wacc","WACC anual (%)"],["crescimento","Crescimento anual (%)"],["perpetuidade","Crescimento na perpetuidade (%)"],["anos","Anos de projeção"]].map(([key,label])=>`<label>${label}<input type="number" data-an-assumption="${key}" value="${E(premissas[key])}" step="${key==='anos'?'1':'0.1'}" ${busy?'disabled':''}></label>`).join('')}</div></details></form>${demo?'<p class="an-notice">Demonstração: pesquisas externas desativadas. Entre no aplicativo para usar dados reais.</p>':!SESS?'<p class="an-notice">Entre na sua conta em Configurações → Conta para pesquisar e retomar análises em outros aparelhos.</p>':''}<p class="an-status" role="status" aria-live="polite">${E(message)}</p></section>${report()}${performance()}<p class="an-disclaimer">${E(M.disclaimer)} A ferramenta não possui certificação profissional.</p></div><aside class="an-history an-section" aria-label="Histórico de análises"><div class="an-history-head"><h2>Seu histórico</h2><div class="an-history-tools">${jobs.some(j=>['falhou','cancelado'].includes(j.status))?`<button class="btn s" type="button" data-an-clean ${loading||busy?'disabled':''}>Limpar falhas</button>`:''}<button class="btn s" type="button" data-an-history ${loading||busy?'disabled':''}>${loading?'Carregando…':'Atualizar'}</button></div></div><p>Trabalhos salvos por conta. Abra para consultar ou retomar.</p>${jobs.map(job=>`<div class="an-history-row"><button type="button" class="an-history-item ${current?.id===job.id?'on':''}" data-an-open="${E(job.id)}"><b>${logos(job.comando?.tickers,18)}<span>${E(job.comando?.texto||'Análise')}</span></b><span>${E(w.DiarioDominios.jobState(job).estado)} · ${fmt(job.atualizado)}</span></button><button type="button" class="an-history-del" data-an-del="${E(job.id)}" aria-label="Excluir esta análise" title="Excluir" ${busy?'disabled':''}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button></div>`).join('')||'<p class="mut">Nenhuma análise carregada.</p>'}</aside></div></main>`}
 function afterRender(){const target=d.getElementById('an-search-suggestions'),html=current?.resultado?.sugestoes;if(target&&html){const frame=d.createElement('iframe');frame.title='Sugestões da Pesquisa Google';frame.setAttribute('sandbox','allow-popups allow-popups-to-escape-sandbox');frame.referrerPolicy='no-referrer';frame.srcdoc='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src https: data:">'+html;frame.className='an-search-frame';target.replaceChildren(frame)}}
 function enter(){syncAccount();afterRender();if(screenTab!=='pesquisa'){w.DiarioScreeners?.load(screenTab);return;}if(loadedFor!==owner()&&!loading&&SESS&&!w.DIARIO_DEMO)void history()}
 d.addEventListener('input',e=>{if(e.target.id==='an-command'){input=e.target.value;context()?.set('analises.comando',input)}if(e.target.dataset.anAssumption){premissas[e.target.dataset.anAssumption]=e.target.value;context()?.set('analises.premissas',premissas)}});
 d.addEventListener('submit',e=>{if(e.target.id==='an-form'){e.preventDefault();if(!w.DIARIO_DEMO)void run()}});
 d.addEventListener('click',async e=>{const b=e.target.closest('[data-an-example],[data-an-history],[data-an-open],[data-an-resume],[data-an-answer],[data-an-next],[data-an-export],[data-an-cancel],[data-an-del],[data-an-clean]');if(!b)return;e.preventDefault();if(b.dataset.anDel&&!busy){const id=b.dataset.anDel;busy=true;update();try{await api({acao:'excluir',id});jobs=jobs.filter(x=>x.id!==id);if(current?.id===id)current=null;message='Análise excluída do histórico.'}catch(err){message=err.message}finally{busy=false;update()}return}if(b.hasAttribute('data-an-clean')&&!busy){busy=true;update();try{const r=await api({acao:'limpar_falhas'});jobs=jobs.filter(x=>!['falhou','cancelado'].includes(x.status));if(current&&['falhou','cancelado'].includes(current.status))current=null;message=(r.removidos||0)+' análise(s) com falha removida(s).'}catch(err){message=err.message}finally{busy=false;update()}return}if(b.dataset.anExample){input=b.dataset.anExample;context()?.set('analises.comando',input);update();d.getElementById('an-command')?.focus();return}if(b.hasAttribute('data-an-history'))return void history();if(b.dataset.anOpen){current=jobs.find(x=>x.id===b.dataset.anOpen);context()?.set('analises.trabalho',current?.id);update();return}if(b.hasAttribute('data-an-resume'))return void run(current?.id);if(b.hasAttribute('data-an-cancel')&&current&&!busy){busy=true;try{const r=await api({acao:'cancelar',id:current.id});remember(r.trabalho);message='Trabalho cancelado. O histórico foi preservado.'}catch(err){message=err.message}finally{busy=false;update()}return}if(b.dataset.anNext!==undefined){input='MODO PROVA '+b.dataset.anNext;current=null;return void run()}if(b.dataset.anAnswer!==undefined&&current&&!busy){busy=true;update();try{const r=await api({acao:'responder',id:current.id,resposta:Number(b.dataset.anAnswer)});remember({...current,resultado:{...current.resultado,avaliacao:r.avaliacao}});message='Resposta registrada.'}catch(err){message=err.message}finally{busy=false;update()}return}if(b.dataset.anExport){const data=current?.resultado;if(!data?.texto)return;if(b.dataset.anExport==='print'){w.print();return}const body=data.texto+'\n\nFontes:\n'+(data.fontes||[]).map(x=>x.titulo+' — '+x.url).join('\n')+'\n\nPesquisa: '+data.consultado_em+'\nID: '+current.id;const url=URL.createObjectURL(new Blob([body],{type:'text/markdown;charset=utf-8'})),a=d.createElement('a');a.href=url;a.download='Analise-'+current.id.slice(0,8)+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}});
 d.addEventListener('click',function(ev){const b=ev.target.closest('[data-an-sub]');if(!b)return;ev.preventDefault();if(!['pesquisa','br','us'].includes(b.dataset.anSub)||screenTab===b.dataset.anSub)return;screenTab=b.dataset.anSub;update();if(screenTab!=='pesquisa')w.DiarioScreeners?.load(screenTab)});
 w.DiarioAnalises={view,enter,syncAccount,history,command:function(value){input=String(value||'');screenTab='pesquisa';context()?.set('analises.comando',input);update();d.getElementById('an-command')?.focus()}};
})(window,document);

/* Screeners Quant BR/EUA: componente isolado na aba Análises. Carteira é apenas leitura. */
;(function(w,d){'use strict';
const E=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=(n,dg=1)=>n==null||!Number.isFinite(Number(n))?'—':Number(n).toLocaleString('pt-BR',{minimumFractionDigits:dg,maximumFractionDigits:dg});
const pct=(x)=>x==null||!Number.isFinite(Number(x))?'—':fmt(x,1)+'%';
const mny=(x,usd)=>x==null?'—':new Intl.NumberFormat('pt-BR',{style:'currency',currency:usd?'USD':'BRL',maximumFractionDigits:0,notation:'compact'}).format(Number(x));
const state={br:{},us:{}},cache=new Map();let timer=null,reqId=0;
function init(m){const s=state[m]||(state[m]={});if(s.preset===undefined)Object.assign(s,{search:'',sector:'',custody:'todos',liquidity:'0',cap:'all',preset:'top',order:'score',page:0,chart:'auto',zoom:1,panX:0,panY:0,focus:'',detailTicker:'',selected:[],selectedRows:{},rows:null,data:null,loading:false,error:'',pdfBusy:false,pdfError:'',requested:''});return s}
let holdingsCache=[],holdingsAt=0,holdingsOwner='';function holdings(){const uid=typeof SESS!=='undefined'&&SESS?.uid?SESS.uid:'local';if(holdingsOwner===uid&&Date.now()-holdingsAt<5000)return holdingsCache;try{const snapshot=w.pfCalc();holdingsCache=(snapshot.pos||[]).filter(p=>+p.q>0&&+p.v>0).map(p=>({ticker:String(p.tk||'').toUpperCase().replace(/\.SA$/,''),market:p.mk,pct:Number(p.peso)||0,sector:p.setor||'',value:Number(p.v)||0}));holdingsAt=Date.now();holdingsOwner=uid;return holdingsCache}catch{return []}}
function owner(){return typeof SESS!=='undefined'&&SESS?.uid?SESS.uid:'local'}
function owned(){return [...new Set(holdings().map(p=>p.ticker))].slice(0,80)}
function ownRow(row){const k=String(row?.ticker||'').toUpperCase(),b=String(row?.bdr_ticker||'').toUpperCase();return holdings().find(p=>p.ticker===k||(b&&p.ticker===b))||null}
function options(list,value){return list.map(([v,label])=>'<option value="'+E(v)+'"'+(String(v)===String(value)?' selected':'')+'>'+E(label)+'</option>').join('')}
const labels={br:{roe:'ROE mediano',dy:'DY mediano',payout:'Payout implícito mediano',momentum:'Momentum 12-1 mediano'},us:{roic:'ROIC mediano',forward_pe:'Forward P/E mediano',total_yield:'Total Yield mediano',momentum:'Momentum 12-1 mediano'}};
function opts(m,s){const presets=m==='br'?[['top','Top Score BR'],['dividendos','Vacas Leiteiras (DY + FCF)'],['valor','Qualidade Descontada (ROIC + Value)'],['bancos','Bancos & Seguros (ROE x P/VP)']]:
[['top','Top Score US'],['compounders','Compounders'],['garp','GARP'],['rule40','Tech Rule of 40'],['buybacks','Shareholder Cannibals']];
const sectors=(s.data?.sectors||[]).filter(Boolean).sort((a,b)=>a.localeCompare(b));
return '<div class="scr-filters"><label>Buscar ticker ou empresa<input type="search" data-scr-search="'+m+'" value="'+E(s.search)+'" placeholder="Ticker / empresa" autocomplete="off"></label>'+
'<label>Setor<select data-scr-filter="sector">'+options([['','Todos os setores'],...sectors.map(x=>[x,x])],s.sector)+'</select></label>'+
'<label>Custódia<select data-scr-filter="custody">'+options([['todos','Todos'],['carteira','Na Minha Carteira'],['fora','Fora da Carteira']],s.custody)+'</select></label>'+
(m==='br'?'<label>Liquidez<select data-scr-filter="liquidity">'+options([['0','Todas as ações (inclui Small/Micro Caps)'],['1000000','> R$ 1M/dia'],['5000000','> R$ 5M/dia'],['20000000','> R$ 20M/dia']],s.liquidity)+'</select></label>':
'<label>Capitalização<select data-scr-filter="cap">'+options([['all','All Stocks'],['large','Large Cap'],['mid','Mid Cap'],['small','Small Cap']],s.cap)+'</select></label>')+
'<label>Estratégia<select data-scr-filter="preset">'+options(presets,s.preset)+'</select></label></div>';
}
function coverage(m,s){const c=s.data?.coverage||{},total=Number(s.data?.total||0),scores=Number(c.com_score||0);
const scorePct=total?((scores/total)*100).toFixed(1).replace('.',','):'0';
return '<div class="scr-coverage" role="status">'+
'<span><b>'+fmt(total,0)+'</b> ativos filtrados</span>'+
'<span><b>'+fmt(Number(c.cobertura_media_pct)||0,1)+'%</b> cobertura média dos indicadores</span>'+
'<span><b>'+fmt(scores,0)+'</b> scores completos ('+scorePct+'%)</span>'+
'<span class="scr-coverage-note">Métricas ausentes ficam como “—”. Os scores só aparecem quando todas as famílias necessárias têm dados.</span>'+
'</div>'}
function kpis(m,s){const v=s.data?.medians||{};return '<div class="scr-kpis">'+Object.entries(labels[m]).map(([key,label])=>'<div class="scr-kpi"><span>'+E(label)+'</span><b>'+((key==='forward_pe')?fmt(v[key],1):pct(v[key]))+'</b></div>').join('')+'</div>'}
function stats(m,s){
 const arr=s.data?.scatter||[], scored=arr.filter(r=>r.score!=null);
 const byScore=[...scored].sort((a,b)=>b.score-a.score)[0];
 const dy=[...arr].filter(r=>r.dy!=null&&r.dy>0&&
   (m==='br'?r.payout!=null&&r.payout>=20&&r.payout<=90&&r.fcf_yield!=null&&r.fcf_yield>0:
     r.fcf_margin!=null&&r.fcf_margin>0)).sort((a,b)=>b.dy-a.dy)[0];
 const momentum=[...arr].filter(r=>r.momentum!=null).sort((a,b)=>b.momentum-a.momentum)[0];
 const cards=[['Maior score',byScore,'score','Não equivale a preço-alvo ou assimetria.'],
   ['DY com FCF positivo',dy,'dy','Histórico; não garante pagamento futuro.'],
   ['Líder de momentum',momentum,'momentum','Reflete preço passado, não previsão.']];
 return '<section class="scr-highlights">'+cards.map(([label,r,k,note])=>
  '<div class="scr-highlight"><span>'+E(label)+'</span><b>'+(r?E(r.ticker):'Sem dados suficientes')+'</b>'+
  '<small>'+(r?(k==='score'?'Score '+fmt(r.score,1):pct(r[k])):E(note))+'</small></div>').join('')+
 '</section><p class="scr-hint">Destaques apenas da amostra exibida pelo Screener (até 300 ativos); não é ranking de todo o mercado.</p>';
}
function chart(m,s){
 const view=w.DiarioScreenersGrafico?.plot(m,s,ownRow);
 return view||'<section class="scr-panel"><p>Gráfico indisponível. Atualize o aplicativo.</p></section>';
}
function detail(m,s){
 const tk=s.detailTicker;if(!tk)return '';
 const row=(s.data?.rows||[]).find(x=>x.ticker===tk)||s.selectedRows[tk];
 if(!row)return '';
 const meta=w.DiarioScreenersInteligencia?.diagnostics(m.toUpperCase(),row);
 if(!meta)return '';
 const owned=ownRow(row);
 return '<section class="scr-detail" id="scr-detail" aria-live="polite">'+
 '<div class="scr-head"><div><p class="an-kicker">VALIDAÇÃO DO ATIVO</p><h3>'+E(row.ticker)+' · '+E(meta.company)+'</h3></div>'+
 '<button type="button" data-scr-detail-close="1" aria-label="Fechar explicação">Fechar</button></div>'+
 '<div class="scr-score-line"><strong>'+(meta.score==null?'Score indisponível':fmt(meta.score,1)+'/100')+'</strong>'+
 '<span class="'+(meta.validated?'is-ok':'is-review')+'">'+E(meta.level)+'</span>'+
 '<span>'+fmt(meta.coverage,0)+'% dos critérios disponíveis</span></div>'+
 '<p class="scr-detail-note">'+E(meta.interpretation)+'</p>'+
 '<div class="scr-detail-groups">'+meta.parts.map(p=>
 '<div class="scr-detail-group"><div><b>'+E(p.name)+'</b><span>'+(p.points==null?'Não calculado':fmt(p.points,1)+' / '+p.weight+' pontos')+'</span></div>'+
 '<div class="scr-meter"><i style="width:'+(p.points==null?0:p.points/p.weight*100)+'%"></i></div>'+
 '<small>'+E(p.metrics.filter(x=>x.number!=null).map(x=>x.label+': '+fmt(x.number,1)+(x.unit==='%'?'%':x.unit==='x'?'x':'')).join(' · ')||'Sem dados para este critério')+'</small></div>').join('')+'</div>'+
 '<details class="scr-why" open><summary>Por que este resultado exige atenção?</summary>'+
 '<div class="scr-detail-columns"><div><b>O que favorece</b>'+
 (meta.positives.length?'<ul>'+meta.positives.map(x=>'<li>'+E(x)+'</li>').join('')+'</ul>':'<p>Sem evidência suficiente para apontar forças no score.</p>')+
 '</div><div><b>Limitações e riscos</b>'+
 '<ul>'+(meta.risks.length?meta.risks:['Confirmar valuation, preço, setor e risco.']).map(x=>'<li>'+E(x)+'</li>').join('')+'</ul></div></div></details>'+
 '<p class="scr-hint">Fonte: '+E(meta.source)+' · Fundamentos: '+E(meta.fundamentals_at||'sem data')+
 ' · Técnico: '+E(meta.technical_at||'sem data')+' · Snapshot: '+E(meta.updated_at||'sem data')+
 (owned?' · Carteira: '+pct(owned.pct):'')+'</p>'+
 '<div class="scr-detail-footer"><button type="button" data-scr-analyze="'+E(row.ticker)+'">Abrir pesquisa completa</button>'+
 '<button type="button" data-scr-detail-close="1">Voltar ao ranking</button></div>'+
 '</section>';
}
function selections(m,s){
 const count=s.selected.length;
 return '<section class="scr-selections" aria-label="Seleção para relatório">'+
 '<div class="scr-selections-head"><div><b>Seleção para estudo</b><span>'+count+' / 10 ações · permanece ao mudar páginas e filtros</span></div>'+
 '<button type="button" data-scr-pdf="1" '+(!count||s.pdfBusy?'disabled':'')+'>'+(s.pdfBusy?'Preparando PDF…':'Gerar PDF / Compartilhar')+'</button></div>'+
 (count?'<div class="scr-chips">'+s.selected.map(t=>
  '<button type="button" data-scr-remove="'+E(t)+'" aria-label="Remover '+E(t)+'">'+E(t)+' <span aria-hidden="true">×</span></button>').join('')+'</div>':'')+
 '<p class="scr-hint">Escolha até 10 ativos. O PDF detalha score, contribuições, qualidade das fontes e o que precisa ser conferido. A comparação aprofundada na Pesquisa continua limitada a 2–4 ativos.</p>'+
 (s.pdfError?'<p class="scr-alert" role="alert">'+E(s.pdfError)+'</p>':'')+
 '</section>';
}
function table(m,s){const all=s.data?.rows||[],us=m==='us';
const cols=us?[['ticker','Ticker'],['company_name','Empresa'],['score_quant_us','Score'],['cobertura_pct','Cobertura'],['roic','ROIC'],['forward_pe','Fwd P/E'],['total_shareholder_yield','Total Yield'],['momentum_12_1','Mom. 12-1']]:
[['ticker','Ticker'],['empresa','Empresa'],['score_quant_br','Score'],['cobertura_pct','Cobertura'],['roe','ROE'],['dividend_yield','DY'],['payout_implicito','Payout'],['momentum_12_1','Mom. 12-1']];
const percentKeys=new Set(['roic','roe','dividend_yield','total_shareholder_yield','payout_implicito','momentum_12_1','cobertura_pct']);
return '<section class="scr-panel"><div class="scr-head"><h3>Ranking · '+fmt(s.data?.total||0,0)+' ações</h3><div class="scr-actions"><label>Ordenação <select data-scr-filter="order">'+options(us?[['score','Score'],['roic','ROIC'],['forward_pe','Forward P/E'],['yield','Total Yield'],['momentum','Momentum']]:[['score','Score'],['roe','ROE'],['dy','DY'],['pvp','P/VP'],['momentum','Momentum']],s.order)+'</select></label>'+
'<button class="btn s" data-scr-bulk="1" '+(s.selected.length<2||s.selected.length>4?'disabled':'')+'>Comparar na Pesquisa (até 4)</button></div></div>'+
'<div class="scr-scroll"><table class="scr-table"><thead><tr><th>Sel.</th>'+cols.map(c=>'<th>'+E(c[1])+'</th>').join('')+'<th>Contexto</th><th>Ações</th></tr></thead><tbody>'+
all.map(row=>{const own=ownRow(row);const tk=E(row.ticker),score=us?row.score_quant_us:row.score_quant_br;const valid=w.DiarioScreenersInteligencia?.diagnostics(m.toUpperCase(),row);
return '<tr><td><input type="checkbox" data-scr-select="'+tk+'" '+(s.selected.includes(row.ticker)?'checked':'')+' aria-label="Selecionar '+tk+'"></td>'+
cols.map(([key])=>'<td>'+((key==='ticker')?'<b>'+tk+'</b>':(key==='company_name'||key==='empresa')?E(row[key]):(row[key]==null?'—':(percentKeys.has(key)?pct(row[key]):fmt(row[key],1))))+'</td>').join('')+
'<td><span class="scr-tech">'+(row.rsi_14==null?'Técnico indisponível':Number(row.rsi_14)>=70?'RSI esticado':Number(row.rsi_14)<=30?'RSI pressionado':'RSI neutro')+'</span>'+
(own?'<span class="scr-owned" title="Peso '+fmt(own.pct)+'%">CARTEIRA · '+pct(own.pct)+'</span>':'')+(valid?'<span class="scr-verified '+(valid.validated?'is-ok':'is-review')+'">'+E(valid.level)+'</span>':'')+'</td>'+
'<td class="scr-buttons"><button data-scr-detail="'+tk+'">Por quê?</button><button data-scr-analyze="'+tk+'">Analisar</button><button data-scr-add="'+tk+'">+ Carteira</button></td></tr>'}).join('')+
'</tbody></table></div>'+
(all.length?'':'<p class="scr-empty">Nenhuma ação neste filtro. Se os dados fundamentais ainda não estiverem preenchidos, escolha Todos os ativos.</p>')+
'<div class="scr-pager"><button class="btn s" data-scr-page="-1" '+(s.page<=0?'disabled':'')+'>Anterior</button><span>Página '+(s.page+1)+' de '+Math.max(1,Math.ceil((s.data?.total||0)/50))+'</span><button class="btn s" data-scr-page="1" '+((s.page+1)*50>=(s.data?.total||0)?'disabled':'')+'>Próxima</button></div></section>';
}
function view(m){const s=init(m);return '<header class="an-header"><div><p class="an-kicker">SCREENING QUANTITATIVO · '+(m==='br'?'B3':'NYSE / NASDAQ')+'</p><h1 id="an-title">Screener '+(m==='br'?'Brasil':'EUA')+'</h1><p>Universo dinâmico, indicadores com fontes e datas. Não representa recomendação de compra ou venda.</p></div><span class="an-badge">'+(s.data?.total||0)+' no filtro</span></header>'+
opts(m,s)+
'<div class="scr-top"><span role="status">'+(s.loading?'Consultando snapshot compartilhado…':s.error?E(s.error):(s.data?'Snapshot: '+(s.data.last_update?new Date(s.data.last_update).toLocaleString('pt-BR'):'sem atualização'):'Abra para consultar dados'))+'</span><button class="btn s" data-scr-refresh="1" '+(s.loading?'disabled':'')+'>Atualizar</button></div>'+
(s.data?coverage(m,s)+kpis(m,s)+selections(m,s)+stats(m,s)+chart(m,s)+detail(m,s)+table(m,s):'<section class="scr-panel scr-empty">'+(s.loading?'Carregando indicadores…':E(s.error||'Aguardando dados do catálogo.'))+'</section>');
}
function render(){try{if(typeof tab==='undefined'||tab!=='analises')return;const root=d.getElementById('an-root');if(!root)return;const active=d.activeElement,searchFocused=!!active?.matches?.('[data-scr-search]'),ss=searchFocused?{pos:active.selectionStart,end:active.selectionEnd}:null;
root.outerHTML=w.DiarioAnalises.view();if(searchFocused){const target=d.querySelector('[data-scr-search]');if(target){target.focus();if(ss?.pos!=null)try{target.setSelectionRange(ss.pos,ss.end)}catch{}}}}catch(e){console.warn('Screener render',e)}}
async function load(m,refresh=false){const s=init(m),u=owner();if(s.loading){s.refreshWhenDone=true;return;}
const body={market:m.toUpperCase(),search:s.search,sector:s.sector,custody:s.custody,owned:owned(),liquidity:Number(s.liquidity),cap:s.cap,preset:s.preset,order:s.order,page:s.page};
const key=u+'|'+JSON.stringify(body),previous=cache.get(key);
if(!refresh&&previous&&Date.now()-previous.time<5*60000){s.data=previous.data;for(const row of s.data.rows||[]){if(s.selected.includes(row.ticker))s.selectedRows[row.ticker]=row;}s.error='';render();return;}
if(!SESS||!cfg()||w.DIARIO_DEMO){s.error='Entre na sua conta para consultar os Screeners.';render();return;}
s.loading=true;s.error='';const req=++reqId;render();
try{await tok();const c=cfg(),r=await fetch(c.url+'/functions/v1/screeners-quant',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
const data=await r.json().catch(()=>({}));if(!r.ok||!data.ok)throw Error(data.error||'Falha HTTP '+r.status);
if(u!==owner()||req!==reqId)return;
s.data=data;for(const row of data.rows||[]){if(s.selected.includes(row.ticker))s.selectedRows[row.ticker]=row;}cache.set(key,{time:Date.now(),data});if(cache.size>15)cache.delete(cache.keys().next().value);s.error='';
}catch(e){if(req===reqId)s.error=String(e.message||'Não foi possível carregar.');}
finally{s.loading=false;if(req===reqId){render();if(s.refreshWhenDone){s.refreshWhenDone=false;void load(m,true)}}}
}
function field(el){const m=d.querySelector('[data-an-sub].selected')?.dataset.anSub;if(m==='br'||m==='us')return [m,init(m)];return [null,null]}
function changeFilter(m,s,key,value){if(!(key in s))return;s[key]=value;s.page=0;if(key!=='chart'&&key!=='zoom'){s.data=null;clearTimeout(timer);timer=setTimeout(()=>load(m),110)}render()}
d.addEventListener('input',ev=>{const b=ev.target;if(!b?.hasAttribute?.('data-scr-search'))return;const [m,s]=field(b);if(!m)return;s.search=b.value;s.page=0;clearTimeout(timer);timer=setTimeout(()=>load(m),420)});
d.addEventListener('change',ev=>{
 const b=ev.target,[m,s]=field(b);if(!m||!b.closest('#an-root'))return;
 if(b.dataset.scrFilter){changeFilter(m,s,b.dataset.scrFilter,b.value);return}
 if(b.hasAttribute('data-scr-chart')){s.chart=b.value;s.focus='';s.zoom=1;s.panX=0;s.panY=0;render();return}
 if(b.hasAttribute('data-scr-select')){
  const tk=b.dataset.scrSelect,row=(s.data?.rows||[]).find(r=>r.ticker===tk);
  if(b.checked&&!s.selected.includes(tk)){
   if(s.selected.length>=10){b.checked=false;s.pdfError='Limite de 10 ações por dossiê. Remova uma ação antes de adicionar outra.';render();return}
   if(!row){b.checked=false;return}
   s.selected.push(tk);s.selectedRows[tk]={...row};
  }else if(!b.checked){s.selected=s.selected.filter(x=>x!==tk);delete s.selectedRows[tk]}
  s.pdfError='';render();
 }
});
d.addEventListener('click',async ev=>{
 const b=ev.target.closest('[data-scr-analyze],[data-scr-add],[data-scr-page],[data-scr-refresh],[data-scr-bulk],[data-scr-compare],[data-scr-point],[data-scr-detail],[data-scr-detail-close],[data-scr-remove],[data-scr-pdf],[data-scr-zoom],[data-scr-pan],[data-scr-reset]');
 if(!b||!b.closest('#an-root'))return;
 ev.preventDefault();const [m,s]=field(b);if(!m)return;
 if(b.hasAttribute('data-scr-refresh')){void load(m,true);return}
 if(b.dataset.scrPage){s.page=Math.max(0,s.page+Number(b.dataset.scrPage));void load(m);return}
 if(b.dataset.scrZoom){const factor=b.dataset.scrZoom==='in'?1.6:1/1.6;s.zoom=Math.min(6,Math.max(1,(Number(s.zoom)||1)*factor));render();return}
 if(b.dataset.scrPan){s.panX=(Number(s.panX)||0)+(b.dataset.scrPan==='left'?-0.28:0.28);render();return}
 if(b.dataset.scrReset){s.zoom=1;s.panX=0;s.panY=0;s.focus='';render();return}
 if(b.dataset.scrPoint){s.focus=b.dataset.scrPoint;render();return}
 if(b.dataset.scrRemove){const tk=b.dataset.scrRemove;s.selected=s.selected.filter(x=>x!==tk);delete s.selectedRows[tk];s.pdfError='';render();return}
 if(b.dataset.scrDetail){s.detailTicker=s.detailTicker===b.dataset.scrDetail?'':b.dataset.scrDetail;render();if(s.detailTicker)d.getElementById('scr-detail')?.scrollIntoView({behavior:'smooth',block:'start'});return}
 if(b.dataset.scrDetailClose){s.detailTicker='';render();return}
 if(b.hasAttribute('data-scr-pdf')){
  if(s.pdfBusy||!s.selected.length)return;
  const rows=s.selected.map(t=>s.selectedRows[t]).filter(Boolean);
  if(rows.length!==s.selected.length){s.pdfError='Um ou mais ativos não têm snapshot salvo. Selecione-os novamente no ranking.';render();return}
  s.pdfBusy=true;s.pdfError='';render();
  try{
   const res=await w.DiarioScreenersRelatorio.share(m.toUpperCase(),rows);
   if(!res.cancelled){s.pdfError='PDF pronto com '+res.pages+' páginas. '+(res.downloaded?'Abra em Arquivos/Downloads para compartilhar.':'Compartilhamento iniciado.')}
  }catch(e){s.pdfError='Não foi possível gerar o PDF: '+String(e.message||e).slice(0,170)}
  finally{s.pdfBusy=false;render()}
  return;
 }
 if(b.dataset.scrAnalyze){w.DiarioAnalises.command('ANALISE '+b.dataset.scrAnalyze);return}
 if(b.hasAttribute('data-scr-bulk')){
  if(s.selected.length>=2&&s.selected.length<=4)w.DiarioAnalises.command('COMPARE '+s.selected.join(' '));
  return;
 }
 if(b.dataset.scrCompare){w.DiarioAnalises.command('COMPARE '+b.dataset.scrCompare.replace(',',' '));return}
 if(b.dataset.scrAdd){
  const ticker=b.dataset.scrAdd;
  try{if(typeof irPara==='function'){irPara('carteiras');setTimeout(()=>{
   const input=d.getElementById('c_tk');if(input){input.value=ticker;input.focus()}
   else w.alert('Para cadastrar '+ticker+', abra o formulário de compra na Carteira.')
  },100);return}}catch{}
  try{navigator.clipboard.writeText(ticker)}catch{}
  w.alert('Ticker '+ticker+' selecionado. Abra a aba Carteira para registrar uma compra; nenhum lançamento foi criado.');
 }
});
let graphDrag=null;
d.addEventListener('pointerdown',ev=>{
 if(ev.target.closest('[data-scr-point]'))return;
 const svg=ev.target.closest('svg.scr-svg');if(!svg||!svg.closest('#an-root'))return;
 const [m]=field(svg);if(m)graphDrag={m,x:ev.clientX,y:ev.clientY,width:svg.getBoundingClientRect().width};
});
d.addEventListener('pointerup',ev=>{
 if(!graphDrag)return;const drag=graphDrag;graphDrag=null;
 const [m,s]=field(ev.target);if(m!==drag.m)return;
 const dx=ev.clientX-drag.x;
 if(Math.abs(dx)>14){s.panX=(Number(s.panX)||0)-dx/Math.max(150,drag.width);render()}
});
d.addEventListener('pointercancel',()=>{graphDrag=null});
d.addEventListener('keydown',ev=>{
 if(ev.key!=='Enter'&&ev.key!==' ')return;
 const dot=ev.target.closest('[data-scr-point]');if(!dot)return;
 ev.preventDefault();dot.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
});
w.DiarioScreeners={view,load,holdings};
})(window,document);
