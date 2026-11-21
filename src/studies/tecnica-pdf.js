/* Estudos > Mentor: PDF e aulas ficam no dispositivo; IA processa somente texto. */
;(function(){'use strict';const T=window.TecnicaPratica,E=T.escape,baseChart=T.chart;let disposed=false,owner='',file=null,busy=false,message='',theme='',first=1,last=8,requestId='',controller=null,task=null,loadedAt=0,loadingList=false,pdfExpanded=false,storedRows=[],retryAt=0;
const uid=()=>typeof SESS!=='undefined'&&SESS?.uid?String(SESS.uid):'',active=()=>typeof tab!=='undefined'&&tab==='estudos'&&typeof ESV!=='undefined'&&ESV==='aul';
const CACHE_TTL=15*60*1000;
const cacheKey=(kind,who)=>'diario:mentor-local:v706:'+kind+':'+who;
async function localRead(kind,who){
 const key=cacheKey(kind,who);
 try{if(typeof idb==='function'){const v=await idb('kv','get',key);if(v)return v;}}catch{}
 try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}
}
async function localWrite(kind,who,data){
 const key=cacheKey(kind,who);
 try{if(typeof idb==='function'&&await idb('kv','put',data,key)!==undefined)return;}catch{}
 // iOS pode bloquear localStorage por cota: cache opcional, nunca perder a aula em memória.
 try{const json=JSON.stringify(data);if(json.length<180000)localStorage.setItem(key,json);}catch{}
}
async function guardarAulas(current){
 const value={time:Date.now(),rows:storedRows.filter(r=>r?.user_id===current).slice(-100)};
 await localWrite('aulas',current,value);
}
function carregarLocalSeguro(rows,current){
 if(!Array.isArray(rows))return;
 for(const row of rows.slice(-100))if(row?.user_id===current)try{insert(row);}catch{}
}
function reset(){if(owner===uid())return;controller?.abort();task?.destroy();owner=uid();file=null;busy=false;message='';requestId='';loadedAt=0;retryAt=0;storedRows=[];pdfExpanded=false;T.lessons=T.lessons.filter(l=>!l.pdf);T.modules=T.modules.filter(m=>m.id!=='mentor-pdf');}
function safeLesson(row){const l=row?.roteiro?.mentor;if(!l||!row.id||!Array.isArray(l.stages)||l.stages.length!==4||l.stages.some(t=>typeof t!=='string')||!Array.isArray(l.questions)||l.questions.length!==3||l.questions.some(q=>typeof q.q!=='string'||!Array.isArray(q.options)||q.options.length!==3||!Number.isInteger(q.answer)||q.answer<0||q.answer>2)||!Array.isArray(l.roteiroVoz?.etapas)||l.roteiroVoz.etapas.length!==4||l.roteiroVoz.etapas.some(v=>typeof v!=='string')||!Array.isArray(l.stageNames)||l.stageNames.length!==4||!Array.isArray(l.visuals)||l.visuals.length!==4||l.visuals.some(v=>!Array.isArray(v.items)))throw Error('A aula salva está incompleta.');return {...l,id:String(row.id),videoId:String(row.id),module:'mentor-pdf',pdf:true,title:String(l.title).slice(0,120),summary:String(l.summary).slice(0,500),minutes:Math.max(1,Math.min(60,Number(l.minutes)||3)),stageNames:l.stageNames.map(t=>String(t).slice(0,70))};}
function insert(row){const ownRow={...row,user_id:row.user_id||uid()};const l=safeLesson(ownRow);T.lessons=T.lessons.filter(x=>x.id!==l.id);T.lessons.push(l);storedRows=storedRows.filter(x=>x.id!==ownRow.id);storedRows.push(ownRow);if(!T.modules.some(m=>m.id==='mentor-pdf'))T.modules.push({id:'mentor-pdf',title:'Minhas aulas do Mentor · PDF',reference:'Material enviado por você'});return l;}
T.chart=function(l,step){if(!l.pdf)return baseChart(l,step);const v=l.visuals[step]||{},items=(v.items||[]).slice(0,4);return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 370" role="img" aria-label="${E(v.title||l.stageNames?.[step]||'Mapa da etapa')}"><rect width="760" height="370" fill="#0A0C10"/><text x="28" y="40" fill="#D4A017" font-size="21">${E(String(v.title||'Etapa').slice(0,60))}</text>${items.map((t,i)=>{const text=String(t).slice(0,105),words=text.split(' ');let lines=[''];for(const w of words){const k=lines.length-1;if((lines[k]+' '+w).length>58)lines.push(w);else lines[k]+=(lines[k]?' ':'')+w;}return `<line x1="30" y1="${76+i*69}" x2="730" y2="${76+i*69}" stroke="#1E232E"/><text x="32" y="${102+i*69}" fill="#D4A017" font-size="18">${i+1}</text><text x="67" y="${102+i*69}" fill="#E7EBF2" font-size="17">${lines.slice(0,2).map((line,j)=>`<tspan x="67" dy="${j?22:0}">${E(line)}</tspan>`).join('')}</text>`;}).join('')}</svg>`;};
/* v855: lê até ~600 mil caracteres e, se passar do limite da aula, guarda as páginas mais ligadas ao tema (no aparelho, sem custo). */
const LIMITE_LEITURA=600000,LIMITE_AULA=120000;
function selecionarPorTema(texto,tema,limite){
 const norm=x=>String(x||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
 const SIN={elliott:['elliott','onda','ondas','impulso','impulsiva','corretiva','correcao','abc','fibonacci','extensao','retracao'],fibonacci:['fibonacci','retracao','extensao','61,8','38,2','50%','projecao'],
  candle:['candle','candlestick','martelo','engolfo','doji','pavio','sombra','corpo'],media:['media','medias','mme','mms','cruzamento','tendencia'],suporte:['suporte','resistencia','rompimento','pullback'],
  risco:['risco','stop','gerenciamento','posicao','capital','drawdown'],volume:['volume','vwap','fluxo','agressao'],ifr:['ifr','rsi','sobrecompra','sobrevenda','divergencia'],tendencia:['tendencia','topo','fundo','dow','canal']};
 let termos=norm(tema).split(/[^a-z0-9%,]+/).filter(t=>t.length>=3&&!['das','dos','de','para','com','uma','como'].includes(t));
 for(const [k,v] of Object.entries(SIN))if(termos.some(t=>t.startsWith(k.slice(0,5))||v.includes(t)))termos=termos.concat(v);
 termos=[...new Set(termos)];
 const paginas=texto.split(/(?=\n\[Página \d+\]\n)/).filter(Boolean).map((p,i)=>{const n=norm(p);let sc=0;for(const t of termos){let k=0,j=-1;while((j=n.indexOf(t,j+1))>=0&&k<50)k++;sc+=k}return {i,p,sc:sc/Math.sqrt(Math.max(400,p.length)/400)}});
 const escolhidas=new Set();let total=0;
 for(const pg of [...paginas].sort((a,b)=>b.sc-a.sc)){if(pg.sc<=0&&escolhidas.size)break;if(total+pg.p.length>limite)continue;escolhidas.add(pg.i);total+=pg.p.length}
 return paginas.filter(pg=>escolhidas.has(pg.i)).map(pg=>pg.p).join('');
}
T.pdfControls=()=>{reset();const atual=document.querySelector('#tp-root .tp-pdf');if(atual)pdfExpanded=atual.open;return `<details class="tp-pdf" ${pdfExpanded||busy||message?'open':''}><summary>Gerar Aula do Mentor via PDF</summary><form data-tp-pdf-form><label>Arquivo PDF<input data-tp-pdf-file type="file" accept=".pdf,application/pdf" ${busy?'disabled':''}></label><button type="button" data-tp-pdf="refresh">Atualizar minhas aulas</button><small>${E(file?.name||'Até 25 MB · até 150 páginas por trecho (limite de 85 mil caracteres extraídos).')}</small><label>Foco ou tema<input data-tp-pdf-theme maxlength="180" value="${E(theme)}" placeholder="Ex.: leitura de suportes ou resposta de circuitos" required ${busy?'disabled':''}></label><div class="tp-controls"><label>Página inicial<input data-tp-pdf-first type="number" min="1" value="${first}" required ${busy?'disabled':''}></label><label>Página final<input data-tp-pdf-last type="number" min="1" value="${last}" required ${busy?'disabled':''}></label></div><p>O texto das páginas selecionadas será enviado à IA configurada no app. O PDF original fica no aparelho. A aula ficará salva somente neste aparelho. Exporte backup JSON para outro aparelho.</p><button type="submit" ${busy?'disabled':''}>${busy?'Preparando aula…':'Gerar e salvar aula'}</button>${busy?'<button type="button" data-tp-pdf="cancel">Cancelar espera</button>':''}<p role="status" data-tp-pdf-status>${E(message)}</p></form></details><details class="tp-backup"><summary>Backup local · Estudos</summary><p>Livros, PDFs, aulas e áudios ficam neste aparelho. Faça backup antes de limpar dados do iPhone.</p><div class="tp-controls"><button type="button" data-tp-backup="export">Exportar backup JSON</button><label>Importar backup JSON<input type="file" data-tp-backup-file accept=".json,application/json"></label></div><button type="button" data-tp-pdf="migrate">Migrar aulas antigas da nuvem (uma única vez)</button><p role="status" data-tp-backup-status></p></details>`;};
function update(text){message=text;const s=document.querySelector('[data-tp-pdf-status]');if(s)s.textContent=text;}
function validOwner(current){if(uid()!==current)throw Error('A conta mudou. A geração anterior não será exibida nesta conta.');}
async function call(body,signal){await tok();const c=cfg(),res=await fetch(c.url+'/functions/v1/aulas',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify(body),signal});let data;try{data=await res.json();}catch{throw Error('O servidor não respondeu corretamente. Tente novamente.');}if(!res.ok)throw Error(data.error||'Não foi possível gerar a aula.');return data;}
async function generate(){
 reset();if(busy)return;
 if(!uid())throw Error('Entre na sua conta para gerar e salvar a aula.');
 if(!file||!(/\.pdf$/i.test(file.name)||file.type==='application/pdf')||file.size>25*1024*1024)throw Error('Escolha um PDF de até 25 MB.');
 if(!theme.trim()||!Number.isInteger(first)||!Number.isInteger(last)||first<1||last<first||last-first>=150)throw Error('Informe tema e intervalo de até 150 páginas.');
 const current=uid(),selectedFile=file,range=first+'–'+last;
 T.view?.stop();busy=true;controller=new AbortController();const signal=controller.signal;requestId=requestId||crypto.randomUUID();T.view?.refresh();
 try{
  const textKey=current+':'+selectedFile.name+':'+selectedFile.size+':'+(selectedFile.lastModified||0)+':'+range;
  let text='';
  const saved=await localRead('texto',textKey);
  if(saved?.text&&typeof saved.text==='string'&&saved.text.length<=LIMITE_AULA){
   text=saved.text;update('Trecho extraído recuperado deste aparelho.');
  }else{
   update('Lendo o trecho selecionado do PDF…');
   const buffer=await selectedFile.arrayBuffer();validOwner(current);
   if(new TextDecoder().decode(buffer.slice(0,1024)).indexOf('%PDF-')<0)throw Error('O arquivo selecionado não é um PDF válido.');
   const lib=await ntLib();validOwner(current);
   task=lib.getDocument({data:new Uint8Array(buffer),isEvalSupported:false,enableScripting:false});
   const pdf=await task.promise;
   try{
    if(last>pdf.numPages)throw Error('A página final ultrapassa as '+pdf.numPages+' páginas do PDF.');
    for(let i=first;i<=last;i++){
     validOwner(current);if(signal.aborted)throw new DOMException('Cancelado','AbortError');
     update('Lendo página '+i+' de '+last+'…');
     const page=await pdf.getPage(i),content=await page.getTextContent();
     text+='\n[Página '+i+']\n'+content.items.map(x=>typeof x.str==='string'?x.str:'').join(' ');
     page.cleanup?.();
     if(text.length>LIMITE_LEITURA)throw Error('O trecho passa de '+Math.round(LIMITE_LEITURA/1000)+' mil caracteres (cerca de 250 páginas). Escolha menos páginas.');
    }
   }finally{await pdf.destroy();task=null;}
   if(text.replace(/\s/g,'').length<300)throw Error('Este trecho não tem texto suficiente. PDFs escaneados precisam de OCR antes do envio.');
   if(text.length>LIMITE_AULA){const total=text.length;text=selecionarPorTema(text,theme,LIMITE_AULA);update('Trecho grande ('+Math.round(total/1000)+' mil caracteres): usei as páginas mais ligadas a "'+theme.trim()+'" ('+Math.round(text.length/1000)+' mil).')}
   await localWrite('texto',textKey,{time:Date.now(),text});
  }
  validOwner(current);
  if(window.EstudosLocal&&selectedFile instanceof Blob)await window.EstudosLocal.put('livro-pdf',selectedFile.name+':'+selectedFile.size+':'+(selectedFile.lastModified||0),selectedFile,{nome:selectedFile.name,paginas:range});
  update('Criando roteiro, etapas visuais e revisão com a IA…');
  const timeout=setTimeout(()=>controller?.abort(),140000);
  try{
   const result=await call({acao:'mentor_pdf_local',requestId,texto:text,tema:theme.trim(),arquivo:selectedFile.name,paginas:range},signal);
   validOwner(current);if(!result.local||!result.aula)throw Error('A função de IA ainda não suporta aulas locais. Atualize a Edge Function aulas.');insert(result.aula);await guardarAulas(current);
   requestId='';update('Aula salva exclusivamente neste aparelho. Exporte backup JSON para levá-la ao iPhone ou PC.');
  }finally{clearTimeout(timeout);}
 }catch(err){if(uid()===current)update(err.name==='AbortError'?'Espera cancelada. A aula pode terminar no servidor; use Atualizar minhas aulas antes de gerar novamente.':err.message);}
 finally{if(uid()===current){busy=false;controller=null;T.view?.refresh();}}
}
async function load(force=false){
 if(disposed)return;reset();if(loadingList||!active()||(!force&&Date.now()-loadedAt<CACHE_TTL))return;
 const current=uid();loadingList=true;
 try{
  const saved=await localRead('aulas',current);
  if(disposed||uid()!==current)return;
  carregarLocalSeguro(saved?.rows,current);
  loadedAt=Date.now();if((saved?.rows?.length||force)&&active()&&!T.view?.isMediaActive())T.view?.refresh();
 }catch{if(force)update('Não foi possível ler as aulas locais. Confira espaço do navegador e backup.');}
 finally{loadingList=false;}
}
async function migrarDaNuvem(){
 const current=uid();if(!current)throw Error('Entre na conta usada para criar as aulas antigas.');
 await tok();const c=cfg();
 const res=await fetch(c.url+'/rest/v1/aulas?select=id,user_id,roteiro&user_id=eq.'+encodeURIComponent(current)+'&status=eq.pronta&roteiro->>tipo=eq.mentor-pdf-v1&order=criado_em.asc&limit=100',{headers:{apikey:c.key,Authorization:'Bearer '+SESS.at},signal:AbortSignal.timeout(12000)});
 if(!res.ok)throw Error('Não foi possível recuperar aulas antigas. Nenhum arquivo local foi apagado.');
 const rows=await res.json();if(!Array.isArray(rows))throw Error('Resposta de aulas inválida.');
 if(uid()!==current)throw Error('A conta mudou durante a importação.');
 carregarLocalSeguro(rows,current);await guardarAulas(current);T.view?.refresh();return rows.length;
}
T.pdf={generate,load,insert,safeLesson,dispose(){disposed=true;observer.disconnect();controller?.abort();task?.destroy();}};
/* Mantém a escolha do usuário quando a trilha atualiza o HTML e recria o form.
   A mudança de conta já limpa pdfExpanded em reset(). */
document.addEventListener('toggle',e=>{
 const el=e.target;
 if(!disposed&&el?.matches?.('#tp-root .tp-pdf'))pdfExpanded=el.open;
},true);
document.addEventListener('change',e=>{const el=e.target;if(!el.closest?.('#tp-root'))return;if(el.matches('[data-tp-pdf-file]')){file=el.files?.[0]||null;requestId='';const hint=el.parentElement.nextElementSibling;if(hint)hint.textContent=file?.name||'Selecione um PDF.';}});
document.addEventListener('input',e=>{const el=e.target;if(!el.closest?.('#tp-root'))return;if(el.matches('[data-tp-pdf-theme]')){theme=el.value;requestId='';}if(el.matches('[data-tp-pdf-first]')){first=Number(el.value);requestId='';}if(el.matches('[data-tp-pdf-last]')){last=Number(el.value);requestId='';}});
document.addEventListener('submit',e=>{if(!e.target.matches('[data-tp-pdf-form]'))return;e.preventDefault();generate().catch(err=>{update(err.message);});});
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-tp-pdf]');if(!b||!b.closest('#tp-root'))return;if(b.dataset.tpPdf==='cancel'){controller?.abort();update('Cancelando espera…');}if(b.dataset.tpPdf==='refresh')load(true);if(b.dataset.tpPdf==='migrate'){update('Importando aulas antigas, uma única vez…');migrarDaNuvem().then(n=>update(n+' aulas antigas preservadas neste aparelho. Exporte backup JSON.')).catch(err=>update(err.message));}});
document.addEventListener('click',e=>{const b=e.target.closest?.('#tp-root [data-tp-backup]');if(!b)return;e.preventDefault();const status=document.querySelector('#tp-root [data-tp-backup-status]');if(!window.EstudosLocal){if(status)status.textContent='Armazenamento local indisponível.';return;}status.textContent='Preparando backup…';window.EstudosLocal.exportar().then(r=>{status.textContent='Backup gerado: '+r.arquivos+' arquivos, '+r.livros+' livros.';}).catch(err=>status.textContent=err.message);});
document.addEventListener('change',e=>{const f=e.target.closest?.('#tp-root [data-tp-backup-file]');if(!f||!f.files?.[0])return;const status=document.querySelector('#tp-root [data-tp-backup-status]');status.textContent='Importando…';window.EstudosLocal?.importar(f.files[0]).then(r=>{status.textContent='Importados '+r.arquivos+' arquivos e '+r.livros+' livros. Reabra Estudos para atualizar.';load(true);}).catch(err=>status.textContent=err.message);});
let scheduled=false;const observer=new MutationObserver(()=>{if(disposed||scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;if(disposed)return;reset();if(active()&&document.getElementById('tp-root'))load();});});observer.observe(document.body,{childList:true,subtree:true});
})();
