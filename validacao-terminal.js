/* Central de Validação do Terminal, integrada ao Diário Trader.
 * Registro manual e local, sem requisições a provedores, Supabase ou execução de ordens.
 */
(function (w, d) {
'use strict';
if (!d || !w.localStorage) return;
const KEY = 'dt-validacao-terminal-2026-v1';
const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now = () => new Date().toISOString();
const timeLocal = () => { const x=new Date();return new Date(x.getTime()-x.getTimezoneOffset()*60000).toISOString().slice(0,16); };
const niceTime = t => { try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(t));}catch(_){return t||'—';} };
const actualVersion = () => (d.querySelector('script[src*="camadas-v"]')?.getAttribute('src')||'').match(/camadas-v(\d+)/)?.[1]||'522';
const create = (id,cat,title,area,priority,steps,notes='') => ({
  id,cat,title,area,priority,status:'Pendente',steps,notes,expected:'',observed:'',version:actualVersion(),
  platform:'iPhone',testResult:'Inconclusivo',protectionFixed:false,asset:'',symbol:'',source:'',
  errorAt:'',message:'',recovery:'',images:[],createdAt:now(),updatedAt:now()
});
const defaults = () => ({
 version:actualVersion(),history:[],cases:[
 create('g1','graficos','Mãozinha: deslocar preço e tempo','Terminal / Gráficos','Alta','1. Abra um gráfico no Terminal.\n2. Arraste na vertical para deslocar a escala de preço.\n3. Arraste na horizontal para mover o tempo.\n4. Confira se não muda de aba.','Teste com mouse no PC e com toque no iPhone.'),
 create('g2','graficos','Zoom do gráfico: roda, gesto e pinça','Terminal / Gráficos','Alta','1. Use a roda do mouse ou gesto de pinça.\n2. Amplie e reduza.\n3. Confira se preço e tempo permanecem legíveis.'),
 create('g3','graficos','Escala linear / logarítmica','Terminal / Gráficos','Média','1. Alterne a escala linear/log.\n2. Confira rótulos e distâncias.\n3. Retorne à escala inicial.'),
 create('g4','graficos','Retornar ao ponto atual / restaurar visão','Terminal / Gráficos','Alta','1. Desloque preço e tempo para fora do ponto atual.\n2. Acione a restauração.\n3. Confira se volta ao dado mais recente sem saltos.'),
 create('n1','navegacao','Arrasto do gráfico não troca de aba','Terminal / Navegação','Crítica','1. Faça arrastos curtos e longos dentro do gráfico.\n2. Repita perto da borda.\n3. Confira se permanece na mesma aba.'),
 create('n2','navegacao','Rolagem de tabelas não troca de aba','Mercado / Tabelas','Alta','1. Role horizontalmente uma tabela larga.\n2. Tente com gesto rápido.\n3. Confira se a tela não muda para Configurações.'),
 create('n3','navegacao','Sazonalidade não abre Configurações por engano','Mercado / Sazonalidade','Crítica','1. Abra Sazonalidade e Sentimento.\n2. Desloque o conteúdo na horizontal.\n3. Confira se não aparece Configurações.'),
 create('n4','navegacao','Navegação intencional entre abas','Terminal / Navegação','Média','1. Use o seletor de abas intencionalmente.\n2. Verifique se a navegação continua funcionando.\n3. Compare com gestos internos que devem ser protegidos.'),
 create('d1','dados','VIX — investigar erro yahoo404','Mercado / VIX','Crítica','1. Abra o VIX no aplicativo.\n2. Atualize a consulta.\n3. Registre o símbolo efetivamente enviado, a fonte e a mensagem retornada.\n4. Confira a tentativa de recuperação.','Erro relatado anteriormente, ainda não validado nesta central.')
 ]});
let db;
try{db=JSON.parse(w.localStorage.getItem(KEY)||'null');if(!db||!Array.isArray(db.cases)||!Array.isArray(db.history))db=defaults();}catch(_){db=defaults();}
db.cases=db.cases.filter(x=>x&&typeof x.id==='string').slice(0,250);
db.history=db.history.filter(x=>x&&typeof x.id==='string').slice(-600);
db.version=String(db.version||actualVersion()).slice(0,30);
let tab='visao',selected='',search='',filterCat='',filterStatus='',filterPriority='',sort='prioridade',notice='';
const cats={graficos:'Gráficos',navegacao:'Navegação',dados:'Dados e fontes'};
const statuses=['Pendente','Em análise','Corrigido','Validado'];
const priorities=['Crítica','Alta','Média','Baixa'];
let overlay,contents,oldOverflow='',painting=false;
const findCase=id=>db.cases.find(x=>x.id===id);
const platformName=()=> /iPhone|iPad|iPod/i.test(navigator.userAgent)?'iPhone':'PC';
function save(){try{w.localStorage.setItem(KEY,JSON.stringify(db));return true;}catch(e){notice='Armazenamento cheio: exporte um backup e reduza as imagens. Mudança não persistida.';return false;}}
function history(issue,action,detail='',testResult=''){
 db.history.push({id:issue.id,title:issue.title,cat:issue.cat,action,detail,version:String(db.version),platform:issue.platform||platformName(),result:testResult||'',at:now(),status:issue.status});
 if(db.history.length>600)db.history=db.history.slice(-600);
 issue.updatedAt=now();issue.version=String(db.version);
}
function fmtStatus(s){return '<span class="dtval-tag '+(s==='Validado'?'ok':s==='Pendente'?'bad':'')+'">'+E(s)+'</span>';}
function root(){
 if(overlay)return;
 overlay=d.createElement('div');overlay.className='dtval-root';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Central de validação do Terminal');
 overlay.innerHTML='<div class="dtval-shell"><div class="dtval-header"><div class="dtval-brand"><small>DIÁRIO TRADER · TERMINAL</small><h2>Central de validação</h2><p class="dtval-desc">Testes de usabilidade, navegação e confiabilidade dos dados</p></div><button type="button" class="dv-btn" data-dva="export">Exportar backup</button><button type="button" class="dv-btn dv-icon" data-dva="close" aria-label="Voltar ao Terminal">×</button></div><div class="dtval-main"><p class="dtval-note"><b>Somente consulta.</b> Esta central não executa ordens nem replica o book do Profit Pro. Os registros ficam <b>neste navegador</b>; iPhone e PC não sincronizam automaticamente. Use exportação/importação para transferi-los.</p><div class="dtval-tabs" role="tablist"></div><div id="dtval-content"></div></div></div>';
 d.body.appendChild(overlay);
 contents=overlay.querySelector('#dtval-content');
 overlay.addEventListener('click',handleClick);
 overlay.addEventListener('change',handleChange);
 overlay.addEventListener('input',handleInput);
 d.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close();});
}
function open(){root();oldOverflow=d.body.style.overflow;d.body.style.overflow='hidden';overlay.hidden=false;paint();}
function close(){if(!overlay)return;overlay.hidden=true;d.body.style.overflow=oldOverflow;}
function tabButtons(){
 const list=[['visao','Visão geral'],['graficos','Gráficos'],['navegacao','Navegação'],['dados','Dados e fontes'],['historico','Histórico / versões']];
 overlay.querySelector('.dtval-tabs').innerHTML=list.map(([id,l])=>'<button type="button" role="tab" class="dtval-tab" aria-selected="'+(tab===id)+'" data-dva="tab" data-id="'+id+'">'+l+'</button>').join('');
}
function toolbar(){
 return '<div class="dtval-toolbar"><input class="dv-filter dv-search" aria-label="Pesquisar testes" id="dtval-search" placeholder="Buscar problema ou ativo..." value="'+E(search)+'">'+
 '<select class="dv-filter" id="dtval-status" aria-label="Filtrar status"><option value="">Todos os status</option>'+statuses.map(x=>'<option '+(filterStatus===x?'selected':'')+'>'+x+'</option>').join('')+'</select>'+
 '<select class="dv-filter" id="dtval-prio" aria-label="Filtrar prioridade"><option value="">Todas prioridades</option>'+priorities.map(x=>'<option '+(filterPriority===x?'selected':'')+'>'+x+'</option>').join('')+'</select>'+
 '<button type="button" class="dv-btn dv-primary" data-dva="new">+ Novo registro</button></div>';
}
function cases(cat=''){
 const prio=x=>priorities.indexOf(x.priority);
 const list=db.cases.filter(x=>(!cat||x.cat===cat)&&(!filterStatus||x.status===filterStatus)&&(!filterPriority||x.priority===filterPriority)&&(!search||[x.title,x.area,x.symbol,x.asset,x.message,x.notes].join(' ').toLowerCase().includes(search.toLowerCase())))
 .sort((a,b)=>prio(a)-prio(b)||b.updatedAt.localeCompare(a.updatedAt));
 if(!list.length)return '<div class="dtval-empty">Nenhum registro encontrado com os filtros atuais.</div>';
 return '<div class="dtval-list">'+list.map(x=>'<div class="dtval-case"><div class="dtval-rail '+(x.priority==='Alta'||x.priority==='Crítica'?'alta':x.priority==='Baixa'?'baixa':'')+'"></div><div class="dtval-casebody"><b>'+E(x.title)+'</b><p>'+E(x.area)+'</p><div class="dtval-tags">'+fmtStatus(x.status)+'<span class="dtval-tag">'+E(x.priority)+'</span><span class="dtval-tag">'+E(cats[x.cat]||x.cat)+'</span>'+(x.cat==='navegacao'&&x.protectionFixed?'<span class="dtval-tag ok">Proteção corrigida</span>':'')+'</div><small>Última alteração: '+niceTime(x.updatedAt)+'</small></div><button class="dv-btn" type="button" data-dva="edit" data-id="'+E(x.id)+'">Abrir</button></div>').join('')+'</div>';
}
function overview(){
 const count=s=>db.cases.filter(x=>x.status===s).length;
 const pending=db.cases.filter(x=>x.status!=='Validado'&&['Crítica','Alta'].includes(x.priority)).length;
 return '<div class="dtval-kpis">'+[
 ['Casos cadastrados',db.cases.length],['Prioritários abertos',pending],['Corrigidos, a testar',count('Corrigido')],['Validados',count('Validado')]
 ].map(([n,v])=>'<div class="dtval-kpi"><small>'+n+'</small><b>'+v+'</b></div>').join('')+'</div>'+
 '<div class="dtval-panel"><div class="dtval-toolbar"><label style="margin:0;max-width:150px">Versão em teste<input id="dtval-version" value="'+E(db.version)+'" maxlength="30" placeholder="Ex.: 522"></label><button class="dv-btn" type="button" data-dva="capture">Capturar yahoo404 visível</button><button class="dv-btn" type="button" data-dva="resume">Voltar ao Terminal</button></div><p class="dtval-muted">Os roteiros são pontos de verificação, não resultados aprovados. A captura examina apenas a mensagem exibida na tela — não monitora requisições nem confirma a fonte automaticamente.</p></div>'+
 '<h3 style="margin:18px 0 9px;font-size:15px">Pendências e reproduções</h3>'+toolbar()+cases();
}
function categoryPage(cat){
 return '<div class="dtval-panel"><h3>'+E(cats[cat])+'</h3><p class="dtval-muted">'+(cat==='graficos'?'Teste a mãozinha, o ajuste de preço e tempo, zoom, escala log/linear e retorno ao ponto atual no gráfico REAL do Terminal.':cat==='navegacao'?'Arrastos internos em gráficos, tabelas e sazonalidade não devem acionar a troca lateral de abas. Registre qualquer troca acidental e marque a proteção como corrigida apenas após testar.':'Registre ativo, símbolo realmente consultado, fonte, data/hora, mensagem, tentativa de recuperação e histórico da correção. Erros não são corrigidos automaticamente aqui.')+'</p><button type="button" class="dv-btn" data-dva="resume">Testar no aplicativo</button></div>'+toolbar()+cases(cat);
}
function field(label,key,x,opts={}){
 const v=x[key]??'',wide=opts.wide?' wide':'';
 if(opts.kind==='select')return '<label class="'+wide+'">'+E(label)+'<select name="'+key+'">'+opts.list.map(s=>'<option value="'+E(s)+'" '+(v===s?'selected':'')+'>'+E(s)+'</option>').join('')+'</select></label>';
 if(opts.kind==='textarea')return '<label class="'+wide+'">'+E(label)+'<textarea name="'+key+'" rows="'+(opts.rows||3)+'">'+E(v)+'</textarea></label>';
 return '<label class="'+wide+'">'+E(label)+'<input name="'+key+'" type="'+(opts.kind||'text')+'" value="'+E(v)+'" maxlength="'+(opts.max||300)+'"></label>';
}
function detail(id){
 const x=findCase(id);if(!x)return '<div class="dtval-empty">Registro não encontrado.</div>';
 const logs=db.history.filter(h=>h.id===id).slice(-20).reverse();
 return '<div class="dtval-toolbar"><button type="button" class="dv-btn" data-dva="back">← Voltar aos testes</button><span class="dtval-tag">'+E(x.id)+'</span><span class="dtval-tag">'+E(cats[x.cat]||x.cat)+'</span></div>'+
 '<form id="dtval-form" class="dtval-panel"><h3>Reproduzir e acompanhar · '+E(x.title)+'</h3><div class="dtval-formgrid">'+
 field('Problema / teste','title',x,{wide:true})+
 field('Área do aplicativo','area',x)+
 field('Categoria','cat',x,{kind:'select',list:Object.keys(cats)})+
 field('Prioridade','priority',x,{kind:'select',list:priorities})+
 field('Status','status',x,{kind:'select',list:statuses})+
 field('Dispositivo','platform',x,{kind:'select',list:['iPhone','PC']})+
 field('Resultado da reprodução','testResult',x,{kind:'select',list:['Inconclusivo','Falhou','Passou']})+
 field('Passos para reproduzir','steps',x,{kind:'textarea',wide:true,rows:4})+
 field('Comportamento esperado','expected',x,{kind:'textarea',wide:true,rows:2})+
 field('Comportamento observado','observed',x,{kind:'textarea',wide:true,rows:2})+
 field('Observações e hipótese de correção','notes',x,{kind:'textarea',wide:true,rows:3})+
 (x.cat==='dados'?'<div class="wide"><h3>Diagnóstico de dados e fonte</h3></div>'+
 field('Ativo afetado','asset',x)+field('Símbolo consultado','symbol',x)+field('Fonte consultada','source',x)+
 field('Data e hora do erro','errorAt',x,{kind:'datetime-local'})+
 field('Mensagem do erro','message',x,{kind:'textarea',wide:true})+
 field('Tentativa de recuperação','recovery',x,{kind:'textarea',wide:true}):'')+
 (x.cat==='navegacao'?'<label class="wide" style="display:flex;gap:9px;align-items:center;font-size:13px"><input type="checkbox" name="protectionFixed" '+(x.protectionFixed?'checked':'')+'> Proteção contra swipe acidental corrigida (confirmada por teste)</label>':'')+
 '</div><div class="dtval-actions"><button type="button" class="dv-btn dv-primary" data-dva="save">Salvar alterações</button><button type="button" class="dv-btn" data-dva="reproduce">Registrar reprodução</button><button type="button" class="dv-btn" data-dva="corrected">Marcar corrigido</button><button type="button" class="dv-btn" data-dva="validated">Marcar validado</button><button type="button" class="dv-btn" data-dva="resume">Testar no Terminal</button></div></form>'+
 '<div class="dtval-panel"><h3>Imagens de evidência ('+x.images.length+'/4)</h3><label class="dtval-upload">📎 Anexar imagem (até 4, comprimidas)<input id="dtval-image-file" type="file" accept="image/png,image/jpeg,image/webp" multiple></label><div class="dtval-images">'+x.images.map((im,i)=>'<div class="dtval-image"><img loading="lazy" alt="Evidência '+(i+1)+'" src="'+E(im.data)+'"><button type="button" class="dv-btn" data-dva="delimage" data-i="'+i+'">Remover</button></div>').join('')+'</div><p class="dtval-muted">As imagens são guardadas neste aparelho. Evite capturas com senhas, saldos, ordens ou dados pessoais.</p></div>'+
 '<div class="dtval-panel"><h3>Histórico deste problema</h3>'+ (logs.length?'<div class="dtval-history">'+logs.map(h=>'<div class="dtval-event"><b>'+E(h.action)+'</b> · '+E(h.detail||'')+'<small>'+niceTime(h.at)+' · v'+E(h.version)+' · '+E(h.platform)+'</small></div>').join('')+'</div>':'<p class="dtval-muted">Nenhuma alteração registrada ainda.</p>')+'</div>';
}
function timeline(){
 const versions=[...new Set([db.version,...db.history.map(h=>h.version)].filter(Boolean))].sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}));
 const latest=db.history.slice(-60).reverse();
 const versionRows=versions.map(v=>{
  const ev=db.history.filter(h=>h.version===v);
  return {v,events:ev.length,fails:ev.filter(x=>x.action==='Teste reproduzido'&&x.result==='Falhou').length,passes:ev.filter(x=>x.action==='Teste reproduzido'&&x.result==='Passou').length,validated:ev.filter(x=>x.action==='Validado').length};
 });
 return '<div class="dtval-panel"><h3>Comparação de versões</h3><p class="dtval-muted">A comparação usa os testes efetivamente registrados em cada versão, não presume que uma atualização corrigiu o problema.</p><div class="dtval-table-scroll"><table class="dtval-table"><thead><tr><th>Versão</th><th>Registros</th><th>Falhas</th><th>Passou</th><th>Validações</th></tr></thead><tbody>'+versionRows.map(x=>'<tr><td>v'+E(x.v)+'</td><td>'+x.events+'</td><td>'+x.fails+'</td><td>'+x.passes+'</td><td>'+x.validated+'</td></tr>').join('')+'</tbody></table></div></div>'+
 '<div class="dtval-panel"><h3>Histórico de alterações</h3>'+(latest.length?'<div class="dtval-history">'+latest.map(h=>'<div class="dtval-event"><b>'+E(h.action)+'</b> — '+E(h.title)+'<small>'+niceTime(h.at)+' · v'+E(h.version)+' · '+E(h.platform)+' · '+E(h.detail)+'</small></div>').join('')+'</div>':'<div class="dtval-empty">O histórico aparece assim que um teste ou alteração for registrado.</div>')+'</div>'+
 '<div class="dtval-panel"><h3>Backup e transferência</h3><div class="dtval-actions"><button class="dv-btn" type="button" data-dva="export">Exportar JSON</button><label class="dtval-upload">Importar backup JSON<input id="dtval-import" type="file" accept=".json,application/json"></label></div><p class="dtval-muted">Importar substitui os registros deste aparelho. O backup é necessário para acompanhar o mesmo histórico no PC e no iPhone sem sincronização em nuvem.</p></div>';
}
function paint(){
 if(!overlay||overlay.hidden||painting)return;
 painting=true;tabButtons();
 if(selected)contents.innerHTML=detail(selected);
 else contents.innerHTML=tab==='visao'?overview():tab==='historico'?timeline():categoryPage(tab);
 if(notice){const p=d.createElement('p');p.className='dtval-note';p.setAttribute('role','status');p.textContent=notice;contents.prepend(p);notice='';}
 painting=false;
}
function formValues(x){
 const f=overlay.querySelector('#dtval-form');if(!f)return;
 const data=new FormData(f);
 const props=['title','area','cat','priority','status','platform','testResult','steps','expected','observed','notes','asset','symbol','source','errorAt','message','recovery'];
 for(const key of props)if(data.has(key))x[key]=String(data.get(key)||'').slice(0,key==='steps'||key==='notes'||key==='message'?5000:1500);
 if(x.cat==='navegacao')x.protectionFixed=data.has('protectionFixed');
}
function persistForm(action,detailText,result){
 const x=findCase(selected);if(!x)return;
 const prevStatus=x.status,prevProtect=x.protectionFixed;
 formValues(x);
 if(action==='Teste reproduzido'){if(x.testResult==='Falhou')x.status='Em análise';}
 if(action==='Corrigido')x.status='Corrigido';
 if(action==='Validado')x.status='Validado';
 let extra=detailText||'';
 if(x.protectionFixed!==prevProtect)extra+=(extra?' · ':'')+'Proteção '+(x.protectionFixed?'marcada corrigida':'reaberta');
 if(prevStatus!==x.status)extra+=(extra?' · ':'')+prevStatus+' → '+x.status;
 history(x,action,extra,result||x.testResult);
 save();paint();
}
function addNew(){
 const id='t'+Date.now().toString(36);
 const x=create(id,tab==='historico'||tab==='visao'?'graficos':tab,'Novo teste', 'Terminal / Validar','Média','Descreva as etapas para reproduzir.', '');
 x.platform=platformName();db.cases.unshift(x);history(x,'Registro criado');save();selected=id;paint();
}
function exportJson(){
 const bytes=JSON.stringify({format:'diario-terminal-validacao-v1',exportedAt:now(),data:db},null,2);
 const a=d.createElement('a'),u=URL.createObjectURL(new Blob([bytes],{type:'application/json;charset=utf-8'}));
 a.href=u;a.download='diario-terminal-validacao-'+new Date().toISOString().slice(0,10)+'.json';d.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);
}
function capture(){
 const host=d.querySelector('#trgrid')||d.querySelector('#app');
 const text=host?.textContent||'';
 const match=text.match(/.{0,140}yahoo\s*404.{0,200}/i)||text.match(/.{0,90}erro.{0,50}404.{0,150}/i);
 if(!match){notice='Não encontrei yahoo404 no texto visível do Terminal. Abra o erro e preencha o diagnóstico manualmente.';paint();return;}
 let x=findCase('d1');if(!x){x=create('d'+Date.now(),'dados','Erro 404 observado','Terminal / Dados','Alta','Reproduzir consulta da fonte e registrar retorno.');db.cases.unshift(x);}
 x.message=match[0].trim();x.errorAt=timeLocal();x.platform=platformName();x.status='Em análise';
 history(x,'Mensagem capturada','Texto visível do aplicativo; símbolo e fonte ainda precisam ser confirmados');save();
 notice='Mensagem capturada. Confirme símbolo e fonte manualmente antes de concluir o diagnóstico.';selected=x.id;paint();
}
async function importJson(file){
 if(!file||file.size>12*1024*1024){notice='Arquivo não selecionado ou acima de 12 MB.';paint();return;}
 try{
 const parsed=JSON.parse(await file.text()),v=parsed?.data;
 if(parsed.format!=='diario-terminal-validacao-v1'||!Array.isArray(v?.cases)||!Array.isArray(v?.history))throw Error('Formato incompatível');
 if(!w.confirm('Substituir os registros deste navegador pelo conteúdo do backup?'))return;
 db={version:String(v.version||actualVersion()).slice(0,30),cases:v.cases.filter(x=>x&&typeof x.id==='string').slice(0,250).map(x=>({...create(x.id,'graficos','','','Média',''),...x,images:(Array.isArray(x.images)?x.images:[]).filter(y=>y&&/^data:image\/(?:jpeg|png|webp);base64,/.test(y.data||'')&&(y.data||'').length<1800000).slice(0,4)})),history:v.history.filter(x=>x&&typeof x.id==='string').slice(-600)};
 save();selected='';notice='Backup importado. Confira a versão e os registros.';paint();
 }catch(e){notice='Falha ao importar: '+String(e.message||e);paint();}
}
function upload(filelist){
 const x=findCase(selected);if(!x)return;
 const items=[...filelist].slice(0,4-x.images.length);
 if(!items.length){notice='Limite de 4 imagens por caso.';paint();return;}
 let index=0;
 const next=()=>{
  if(index>=items.length){history(x,'Evidência anexada',items.length+' imagem(ns)');save();paint();return;}
  const file=items[index++];
  if(!/^image\/(?:png|jpeg|webp)$/.test(file.type)||file.size>12*1024*1024){notice='Imagem inválida ou maior que 12 MB.';next();return;}
  const img=new Image(),blobUrl=URL.createObjectURL(file);
  img.onload=()=>{try{const canvas=d.createElement('canvas'),scale=Math.min(1,960/Math.max(img.width,img.height));canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);x.images.push({name:file.name.slice(0,100),data:canvas.toDataURL('image/jpeg',.72)});}catch(_){notice='Falha ao processar imagem.';}finally{URL.revokeObjectURL(blobUrl);next();}};
  img.onerror=()=>{URL.revokeObjectURL(blobUrl);notice='Não foi possível abrir a imagem.';next();};img.src=blobUrl;
 };
 next();
}
function handleClick(e){
 const b=e.target.closest('[data-dva]');if(!b||!overlay.contains(b))return;
 e.preventDefault();const a=b.dataset.dva,id=b.dataset.id;
 if(a==='close'||a==='resume'){close();if(a==='resume')d.querySelector('#trgrid')?.scrollIntoView({block:'start',behavior:'smooth'});return;}
 if(a==='tab'){selected='';tab=id;paint();return;}
 if(a==='back'){selected='';paint();return;}
 if(a==='edit'){selected=id;paint();return;}
 if(a==='new'){addNew();return;}
 if(a==='export'){exportJson();return;}
 if(a==='capture'){capture();return;}
 if(a==='save')persistForm('Atualização do registro','Campos e observações salvos');
 if(a==='reproduce')persistForm('Teste reproduzido','Resultado informado no formulário');
 if(a==='corrected')persistForm('Corrigido','Pendente de validação no dispositivo real');
 if(a==='validated')persistForm('Validado','Validação manual confirmada pelo usuário');
 if(a==='delimage'){const x=findCase(selected),i=Number(b.dataset.i);if(x&&x.images[i]){x.images.splice(i,1);history(x,'Evidência removida');save();paint();}}
}
function handleChange(e){
 const t=e.target;
 if(t.id==='dtval-status'){filterStatus=t.value;paint();}
 if(t.id==='dtval-prio'){filterPriority=t.value;paint();}
 if(t.id==='dtval-version'){db.version=String(t.value||actualVersion()).slice(0,30);save();paint();}
 if(t.id==='dtval-import'){importJson(t.files?.[0]);}
 if(t.id==='dtval-image-file'){upload(t.files||[]);}
}
function handleInput(e){
 const t=e.target;if(t.id==='dtval-search'){search=t.value;const p=t.selectionStart;paint();const n=overlay.querySelector('#dtval-search');n?.focus();n?.setSelectionRange(p,p);}
}
function attachEntry(){
 if(d.querySelector('.dtval-open'))return;
 const panel=d.querySelector('#trgrid');
 if(!panel||!panel.parentElement)return;
 const b=d.createElement('button');b.type='button';b.className='dtval-open';b.textContent='☑ Testes e validação do Terminal';
 b.setAttribute('aria-label','Abrir Central de Validação do Terminal');b.addEventListener('click',open);
 panel.parentElement.insertBefore(b,panel);
}
let frame=false;
function schedule(){if(frame)return;frame=true;w.requestAnimationFrame(()=>{frame=false;attachEntry();});}
function init(){
 attachEntry();
 const host=d.querySelector('#app')||d.body;
 new MutationObserver(schedule).observe(host,{childList:true,subtree:true});
 w.addEventListener('storage',e=>{if(e.key===KEY){try{const updated=JSON.parse(e.newValue||'null');if(updated&&Array.isArray(updated.cases)&&Array.isArray(updated.history)){db=updated;paint();}}catch(_){}}});
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window,document);
