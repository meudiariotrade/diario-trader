/* v805 — biblioteca local com RAG opt-in. Zero Storage, zero polling. */
;(function(w,d){'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 const DB='diario-cerebro-local-v805',ST='obras',MAX=150;
 const categorias=['Analise_Tecnica','Fibonaccing','Price_Action','Fundamentalista','Fatos_Relevantes_Macro','Gestao_Risco'];
 const tipos={pdf:'Livro_PDF',txt:'Livro_PDF',md:'Livro_PDF'};
 let progress='',progressPct=0,items=[],hits=[],busy=false,controller=null,viewer=false,observer=null;
 const owner=()=>typeof SESS!=='undefined'&&SESS?.uid?String(SESS.uid):'local';
 const key=(id)=>owner()+'|'+id;
 function open(){return new Promise((ok,no)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(ST,{keyPath:'key'});r.onerror=()=>no(r.error);r.onsuccess=()=>ok(r.result)})}
 async function tx(mode,fn){const b=await open();try{return await new Promise((ok,no)=>{const tr=b.transaction(ST,mode),r=fn(tr.objectStore(ST));r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}finally{b.close()}}
 async function store(v){await tx('readwrite',s=>s.put({...v,key:key(v.id),owner:owner()}));}
 async function all(){return (await tx('readonly',s=>s.getAll())).filter(x=>x.owner===owner())}
 function refresh(){if(typeof tab==='undefined'||tab!=='estudos'||typeof ESV==='undefined'||ESV!=='brain')return;const root=d.querySelector('[data-brain-root]');if(root)root.outerHTML=view()}
 function status(message,pct){progress=message;progressPct=pct;refresh()}
 async function api(payload,signal){
  if(typeof cfg!=='function'||typeof tok!=='function'||typeof SESS==='undefined'||!SESS)throw Error('Entre na sua conta para indexar ou consultar.');
  await tok();const c=cfg();if(!c?.url||!c?.key||!SESS.at)throw Error('Sessão ou Supabase indisponível');
  const r=await fetch(c.url+'/functions/v1/conhecimento-ia',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify(payload),signal});
  const j=await r.json();if(!r.ok)throw Error(j.erro||'Falha na biblioteca (HTTP '+r.status+')');return j;
 }
 function chunks(text){
  const paragraphs=String(text||'').replace(/\r/g,'').replace(/[^\S\n]+/g,' ').split(/\n\s*\n|(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚ])/).map(x=>x.trim()).filter(Boolean);
  const arr=[];let acc='';
  for(const p of paragraphs){
   const pieces=p.length>1190?p.match(/[\s\S]{1,1050}/g)||[]:[p];
   for(const item of pieces){if(acc&&acc.length+item.length+1>1150){arr.push(acc);acc=acc.slice(-150)}
    acc+=(acc?' ':'')+item;}
  }
  if(acc)arr.push(acc);
  return arr.slice(0,MAX).filter(x=>x.trim().length>=50).map((texto,indice)=>({texto,indice}));
 }
 async function extractPDF(file){
  // PDF.js é importado sob demanda. Bytes nunca vão ao servidor.
  const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs';
  // PDF.js v6: destroy() pertence ao PDFDocumentLoadingTask, não ao PDFDocumentProxy.
  const loadingTask=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}),parts=[];
  try{
   const doc=await loadingTask.promise;
   for(let i=1;i<=Math.min(doc.numPages,550);i++){
    const page=await doc.getPage(i),content=await page.getTextContent();
    parts.push(content.items.map(t=>t.str||'').join(' '));
    if(i%10===0)status('PDF local: '+i+'/'+doc.numPages+' páginas',Math.floor(i/doc.numPages*35));
   }
  }finally{
   await loadingTask.destroy();
  }
  return parts.join('\n\n');
 }
 const invalidUrl=u=>!/^https:\/\//.test(u)||u.length>1000;
 function videoId(s){try{const u=new URL(s);if(!['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(u.hostname))return null;
 return (/^[\w-]{11}$/.test(u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v')||'')?(u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v')):null)}catch{return null}}
 async function workerText(url){
  if(invalidUrl(url))throw Error('Informe URL HTTPS pública');
  const edge='https://diario-screeners-quant.lucianosilva43567.workers.dev';
  const u=new URL(w.DIARIO_SCREENERS_EDGE_URL||edge);if(!u.hostname.endsWith('.workers.dev'))throw Error('Proxy não autorizado');
  const res=await fetch(u.origin+'/v1/biblioteca-texto?url='+encodeURIComponent(url),{signal:controller.signal});
  const j=await res.json();if(!res.ok)throw Error(j.erro||'Fonte não disponível; cole o conteúdo autorizado');
  return j.texto;
 }
 async function ingest({titulo,autor,tipo,categoria,texto,url=''},anterior=null){
  if(busy)throw Error('Importação anterior em andamento');
  const blocks=chunks(texto);if(!blocks.length)throw Error('Texto insuficiente para indexar');
  if(!anterior&&!confirm('Indexar '+blocks.length+' trechos no Supabase? Originais ficam apenas neste dispositivo.'))return;
  busy=true;controller=new AbortController();const origin=owner(),id=anterior?.id||crypto.randomUUID();
  const inicio=anterior?.sincronizados||0;
  const criado=anterior?.criado||new Date().toISOString();
  try{
   if(!anterior)await store({id,titulo,autor,tipo,categoria,texto,origem:url,blocos:blocks.length,criado,sincronizados:0});
   for(let i=inicio;i<blocks.length;i+=6){
    if(controller.signal.aborted||owner()!==origin)throw Error('Importação interrompida');
    const group=blocks.slice(i,i+6);
    await api({acao:'indexar',obra_id:id,titulo_obra:titulo,autor,tipo_fonte:tipo,categoria,chunks:group},controller.signal);
    if(owner()!==origin)throw Error('Conta alterada durante a importação');
    status('Indexados '+Math.min(i+6,blocks.length)+' de '+blocks.length+' trechos',35+Math.round((i+6)/blocks.length*65));
    await store({id,titulo,autor,tipo,categoria,texto,origem:url,blocos:blocks.length,criado,sincronizados:Math.min(i+6,blocks.length)});
   }
   status('Biblioteca atualizada: '+titulo,100);
  }finally{busy=false;controller=null;items=await all();refresh()}
 }
 const manual=[
 'MANUAL MESTRE INSTITUCIONAL — Estudo original. A tendência é uma hipótese de mercado, não certeza. A leitura multi-tempo confirma médias, pivôs, volume, volatilidade, confluências, sinais de invalidação e janela operacional.',
 'FIBONACCING — A grade é sempre calculada numericamente a partir de duas âncoras explícitas. Níveis: -61,8%; -41,4%; -27,2%; -11,8%; 0%; 23,6%; 38,2%; 50%; 61,8%; 76,4%; 100%; 111%; 127,2%; 141,4%; 161,8%. Não assumir que a imagem revela ancoragens exatas; conferir ticker e tempo gráfico.',
 'GESTÃO DE RISCO — O gatilho depende de confirmação da estrutura. O stop deve invalidar a hipótese, jamais ser escolhido só para aumentar risco-retorno. R/R=(alvo-entrada)/(entrada-stop) em compra ou equivalente em venda. Sem spread, taxa ou liquidez confiáveis, o resultado é ilustrativo.',
 'FATOS RELEVANTES — Priorizar comunicados oficiais da CVM, empresas, B3 e SEC (8-K, 6-K, 10-Q, 10-K). Verificar data, emissor, documento, guidance, M&A, endividamento, proventos, alterações de capital e evento não recorrente. Não confundir notícia de terceiro com fato oficialmente protocolado.',
 'MACRO — Copom/Selic, FOMC/Fed Funds, IPCA, CPI, payroll, Treasuries, DI, DXY, petróleo e minério têm canais e defasagens distintos. Checar calendário, valor anterior, consenso, realizado, revisão e curva de juros; exigir fonte e carimbo temporal antes de inferir impacto causal.',
 'CONFLUÊNCIA — Confrontar notícia e estrutura de preços, volumes, liquidez e tendência; classificar impacto real, ruído e incerteza. Informação sem confirmação não modifica os números determinísticos nem gera recomendação de entrada.'
 ].join('\n\n');
 function view(){const local=items.filter(x=>x.owner===owner());
  return '<section data-brain-root="1" style="background:#11141B;color:#E5E7EB;padding:16px;border:1px solid #1E232E;border-radius:4px">'+
   '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><h2 style="color:#D4A017">Cérebro da IA · Biblioteca local e RAG</h2><button data-brain-back="1" class="btn s">Voltar aos Estudos</button></div>'+
   '<p>Livros, vídeos e artigos: extração no dispositivo, originais apenas no IndexedDB e somente trechos enviados com sua confirmação. Limite de 150 trechos por obra. Embeddings privativos por conta; sem atualização automática.</p>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn s" data-brain-manual="1">Indexar Manual Mestre original</button><button class="btn s" data-brain-refresh="1">Atualizar lista</button>'+(busy?'<button class="btn s" data-brain-cancel="1">Cancelar importação</button>':'')+'</div>'+
   '<label style="display:block;margin-top:12px">Título <input id="brain-title" maxlength="200" placeholder="Nome da obra / aula"></label>'+
   '<label style="display:block">Autor <input id="brain-author" maxlength="120" placeholder="Autor ou fonte"></label>'+
   '<label style="display:block">Categoria <select id="brain-cat">'+categorias.map(x=>'<option value="'+x+'">'+x.replace(/_/g,' ')+'</option>').join('')+'</select></label>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0"><input type="file" id="brain-file" accept=".pdf,.txt,.md" style="max-width:240px"><button class="btn s" data-brain-import-file="1">Importar arquivo</button></div>'+
   '<label>Link HTTPS de YouTube ou artigo <input id="brain-url" inputmode="url" placeholder="https://..." style="font-size:16px"></label>'+
   '<label>Transcrição ou texto autorizado (opcional para artigos) <textarea id="brain-text" rows="4" placeholder="Cole aqui uma transcrição de vídeo, ou um artigo que você pode utilizar"></textarea></label>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn s" data-brain-import-video="1">Importar vídeo</button><button class="btn s" data-brain-import-web="1">Importar artigo</button></div>'+
   '<p role="status" aria-live="polite">'+esc(progress)+'</p><progress max="100" value="'+progressPct+'" style="width:100%;accent-color:#D4A017"></progress>'+
   '<h3>Buscar na base privada</h3><input id="brain-query" maxlength="480" placeholder="Ex.: impacto do Copom no DI e Fibonaccing" style="font-size:16px"><button class="btn s" data-brain-search="1">Buscar trechos</button>'+
   (hits.length?'<ol>'+hits.map(x=>'<li><b>'+esc(x.titulo_obra)+'</b> · similaridade '+Number(x.similarity||0).toFixed(2)+'<p>'+esc(x.conteudo_chunk)+'</p></li>').join('')+'</ol>':'')+
   '<h3>Obras indexadas neste dispositivo</h3><div>'+local.map(x=>'<div style="border-top:1px solid #1E232E;padding:8px 0"><b>'+esc(x.titulo)+'</b><small> · '+x.sincronizados+'/'+x.blocos+' trechos · '+esc(x.categoria)+'</small>'+(x.sincronizados<x.blocos&&x.texto?'<button class="btn s" data-brain-resume="'+esc(x.id)+'">Continuar</button>':'')+'<button class="btn s" data-brain-remove="'+esc(x.id)+'">Remover</button></div>').join('')+'</div></section>';
 }
 async function sync(){items=await all();refresh();
  observer?.disconnect();observer=null;
  if(d.querySelector('[data-brain-root]')&&typeof MutationObserver!=='undefined'){
   observer=new MutationObserver(()=>{if(d.querySelector('[data-brain-root]'))return;controller?.abort();observer?.disconnect();observer=null});
   observer.observe(d.body,{subtree:true,childList:true});
  }
 }
 function value(id){return d.getElementById(id)?.value?.trim()||''}
 async function execute(action){
  const titulo=value('brain-title'),autor=value('brain-author'),categoria=value('brain-cat')||'Analise_Tecnica',url=value('brain-url'),text=value('brain-text');
  if(action==='manual')return ingest({titulo:'Manual Mestre Institucional',autor:'Diário de Trader',tipo:'Guia_Mercado',categoria:'Fatos_Relevantes_Macro',texto:manual});
  if(action==='file'){const f=d.getElementById('brain-file')?.files?.[0];if(!f)throw Error('Escolha um PDF, TXT ou MD');
   const ext=f.name.split('.').pop().toLowerCase();if(!tipos[ext]||f.size>35*1024*1024)throw Error('Formato ou tamanho não aceito (máximo 35 MB)');
   status('Extraindo texto localmente…',5);const s=ext==='pdf'?await extractPDF(f):await f.text();
   return ingest({titulo:titulo||f.name,autor,tipo:'Livro_PDF',categoria,texto:s});
  }
  if(action==='video'){if(!videoId(url))throw Error('Cole um link válido do YouTube');
   if(!text)throw Error('Cole uma transcrição autorizada. Legendas automáticas podem não estar disponíveis.');
   return ingest({titulo:titulo||'Vídeo YouTube '+videoId(url),autor,tipo:'Video_YouTube',categoria,texto:text,url});
  }
  if(action==='web'){if(invalidUrl(url))throw Error('Cole um link HTTPS de artigo');
   status('Buscando versão pública limpa via Cloudflare…',10);controller=new AbortController();
   let body=text;try{if(!body)body=await workerText(url)}finally{controller=null}
   return ingest({titulo:titulo||url,autor,tipo:'Artigo_Web',categoria,texto:body,url});
  }
 }
 d.addEventListener('click',async e=>{
  const btn=e.target.closest('[data-brain-import-file],[data-brain-import-video],[data-brain-import-web],[data-brain-manual],[data-brain-refresh],[data-brain-cancel],[data-brain-search],[data-brain-remove],[data-brain-resume],[data-brain-back]');
  if(!btn||typeof tab==='undefined'||tab!=='estudos'||typeof ESV==='undefined'||ESV!=='brain')return;
  e.preventDefault();
  if(btn.hasAttribute('data-brain-back')){controller?.abort();ESV='est';if(typeof render==='function')render();return}
  if(btn.hasAttribute('data-brain-cancel')){controller?.abort();status('Importação interrompida.',0);return}
  try{
   if(btn.hasAttribute('data-brain-refresh'))return void await sync();
   if(btn.hasAttribute('data-brain-search')){const q=value('brain-query');if(!q)throw Error('Digite uma consulta');const j=await api({acao:'buscar',consulta:q});hits=j.trechos||[];status('Pesquisa concluída',100);return}
   if(btn.dataset.brainResume){
    const obra=items.find(x=>x.owner===owner()&&x.id===btn.dataset.brainResume);
    if(!obra?.texto)throw Error('Texto original indisponível neste dispositivo');
    return void await ingest({...obra,url:obra.origem},obra);
   }
   if(btn.dataset.brainRemove){if(!confirm('Excluir esta obra indexada?'))return;const id=btn.dataset.brainRemove;await api({acao:'remover',obra_id:id});await tx('readwrite',s=>s.delete(key(id)));return void await sync()}
   const action=btn.hasAttribute('data-brain-manual')?'manual':btn.hasAttribute('data-brain-import-file')?'file':btn.hasAttribute('data-brain-import-video')?'video':'web';
   await execute(action);
  }catch(err){status('Não foi possível concluir: '+String(err.message||err).slice(0,150),0)}
 });
 w.DiarioCerebroIA={view,enter:sync,leave(){controller?.abort();controller=null;observer?.disconnect();observer=null},chunks,manual};
})(window,document);
