/* v661 · Fichamento e flashcards; somente navegador, sem banco novo. */
;(function(){
'use strict';
const L=window.EconomiaLab,S=L.state, esc=L.esc, note=L.note, card=L.card;
const KEY='diario-laboratorio-universitario-v1',DISC=['Macroeconomia','Microeconomia','Econometria / Estatística','Economia Brasileira','História do Pensamento Econômico'];
const initial=()=>({schema:1,fichas:[],cards:[],revisoes:[],consultas:[],resumos:[]});
const seeds=[
['Macroeconomia','O que desloca a LM no modelo IS–LM?','Mudanças na oferta real de moeda ou na demanda por moeda.'],
['Macroeconomia','O que a Regra de Taylor relaciona?','Taxa nominal de juros, juro real neutro, inflação, meta e hiato do produto.'],
['Microeconomia','Quando um consumidor iguala TMS e preços relativos?','Em ótimo interior diferenciável: TMS = Px/Py.'],
['Microeconomia','Condição de lucro máximo interior','Receita marginal igual a custo marginal, com segunda ordem adequada.'],
['Econometria / Estatística','Qual o estimador angular no MQO simples?','Covariância amostral X,Y dividida pela variância amostral de X.'],
['Econometria / Estatística','O que R² NÃO prova?','Causalidade ou previsão fora da amostra.'],
['Economia Brasileira','Três pilares do tripé macroeconômico pós-1999','Metas de inflação, câmbio flutuante e compromisso fiscal.'],
['Economia Brasileira','O que a URV buscou fazer?','Criar unidade de conta de transição para reduzir a inflação inercial.'],
['História do Pensamento Econômico','Ideia central de vantagem comparativa (Ricardo)','Ganhos do comércio decorrem de custos de oportunidade relativos.'],
['História do Pensamento Econômico','Para Keynes, por que pode haver desemprego involuntário?','Demanda efetiva insuficiente pode manter produção abaixo do pleno emprego.']
];
let db=initial(),erro='';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,9);
const trunc=(v,n=3000)=>String(v??'').trim().slice(0,n);
function fixCard(c){return {id:trunc(c.id,90)||uid(),disc:DISC.includes(c.disc)?c.disc:DISC[0],front:trunc(c.front,400),back:trunc(c.back,900),source:trunc(c.source,120),reps:Math.min(150,Math.max(0,+c.reps||0)),ease:Math.max(1.3,Math.min(3,+c.ease||2.5)),interval:Math.min(3650,Math.max(0,+c.interval||0)),due:/^\d{4}-\d\d-\d\dT/.test(c.due)?c.due:new Date().toISOString()};}
function persist(){
 try{localStorage.setItem(KEY,JSON.stringify(db));erro='';return true;}
 catch(e){erro='Armazenamento local cheio ou bloqueado; exporte seu JSON antes de fechar.';return false;}
}
function sanitize(v){
 const out=initial();if(!v||typeof v!=='object'||v.schema!==1)throw Error('JSON de histórico incompatível.');
 for(const f of (Array.isArray(v.fichas)?v.fichas:[]).slice(0,80)){
  if(!f||typeof f!=='object')continue;
  out.fichas.push({id:trunc(f.id,90)||uid(),titulo:trunc(f.titulo,180),disc:DISC.includes(f.disc)?f.disc:DISC[0],origem:trunc(f.origem,120),criado:trunc(f.criado,35),
   excerto:trunc(f.excerto,12000),tese:trunc(f.tese,3000),
   conceitos:(Array.isArray(f.conceitos)?f.conceitos:[]).slice(0,15).map(x=>({termo:trunc(x?.termo,140),significado:trunc(x?.significado,900)})),
   equacoes:(Array.isArray(f.equacoes)?f.equacoes:[]).slice(0,12).map(x=>trunc(x,400)),
   escola:trunc(f.escola,1500),criticas:trunc(f.criticas,1500),
   questoes:(Array.isArray(f.questoes)?f.questoes:[]).slice(0,3).map(x=>trunc(x,500)),
   metodo:trunc(f.metodo,80)});
 }
 out.cards=(Array.isArray(v.cards)?v.cards:[]).slice(0,500).filter(x=>x&&x.front&&x.back).map(fixCard);
 out.revisoes=(Array.isArray(v.revisoes)?v.revisoes:[]).slice(-600).map(x=>({card:trunc(x?.card,90),acerto:!!x?.acerto,at:trunc(x?.at,35)}));
 out.consultas=(Array.isArray(v.consultas)?v.consultas:[]).slice(-20).map(x=>({id:trunc(x?.id,70),serie:trunc(x?.serie,180),fonte:trunc(x?.fonte,60),url:trunc(x?.url,450),unidade:trunc(x?.unidade,45),em:trunc(x?.em,40),pontos:(Array.isArray(x?.pontos)?x.pontos:[]).slice(-500).map(p=>({data:trunc(p.data,16),valor:+p.valor})).filter(p=>Number.isFinite(p.valor))}));
 out.resumos=(Array.isArray(v.resumos)?v.resumos:[]).slice(-50).map(x=>({id:trunc(x?.id,90),tema:trunc(x?.tema,100),em:trunc(x?.em,40),texto:trunc(x?.texto,9000)}));
 return out;
}
try{const r=localStorage.getItem(KEY);if(r)db=sanitize(JSON.parse(r));}catch(e){erro='Não foi possível ler o histórico local: '+String(e.message||e).slice(0,100);}
if(!db.cards.length){db.cards=seeds.map(([disc,front,back])=>fixCard({id:uid(),disc,front,back,source:'Banco local',due:new Date().toISOString()}));persist();}
const U=L.uni={get data(){return db;},save:persist,disc:DISC,uid,sanitize,warning:()=>erro};
function refresh(){L.paint();}
function download(name,data,type){
 const b=new Blob([data],{type}),url=URL.createObjectURL(b),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
L.events.uniExport=()=>download('laboratorio-economia-historico.json',JSON.stringify(db,null,2),'application/json');
// Preserva título e texto enquanto o app recebe atualizações e repinta a aba.
document.addEventListener('input',e=>{
 if(typeof ESV==='undefined'||ESV!=='eco'||S.tool!=='ficha')return;
 if(e.target.matches('[data-uni-title]'))S.uniTitle=e.target.value.slice(0,160);
 if(e.target.matches('[data-uni-text]'))S.uniText=e.target.value.slice(0,60000);
},true);
document.addEventListener('change',async e=>{
 const target=e.target;if(!target||typeof tab==='undefined'||tab!=='estudos'||typeof ESV==='undefined'||ESV!=='eco')return;
 if(target.matches('[data-eco-history]')){
  const f=target.files?.[0];if(!f)return;try{
   if(f.size>2e6)throw Error('Arquivo muito grande (limite 2 MB).');
   const incoming=sanitize(JSON.parse(await f.text()));
   const merge=(a,b,max)=>[...new Map([...a,...b].map(x=>[x.id,x])).values()].slice(-max);
   db.fichas=merge(db.fichas,incoming.fichas,80);db.cards=merge(db.cards,incoming.cards,500);
   db.revisoes=[...db.revisoes,...incoming.revisoes].slice(-600);
   db.consultas=merge(db.consultas,incoming.consultas,20);db.resumos=merge(db.resumos,incoming.resumos,50);
   persist();S.uniStatus='Histórico importado e mesclado com sucesso.';refresh();
  }catch(err){S.uniStatus='Erro no JSON: '+String(err.message||err).slice(0,130);refresh();}
  return;
 }
 if(target.matches('[data-uni-pdf]')){const f=target.files?.[0];if(f)await extractPdf(f);return;}
 if(target.matches('[data-uni-disc]')){S.uniDisc=target.value;refresh();return;}
 if(target.matches('[data-uni-select-ficha]')){S.uniFid=target.value;refresh();return;}
 if(target.matches('[data-uni-flashdisc]')){S.uniFlashDisc=target.value;S.uniFlip=false;S.uniCard=null;refresh();}
},true);
S.uniDisc=DISC[0];S.uniFlashDisc=DISC[0];S.uniFid='';S.uniText='';S.uniTitle='';S.uniSource='Colar texto';S.uniPdfStatus='';S.uniStatus='';S.uniBusy=false;S.uniFlip=false;S.uniCard=null;
const PDF_SRC='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', PDF_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
async function pdfLib(){
 if(window.pdfjsLib)return window.pdfjsLib;
 if(!U.pdfPromise)U.pdfPromise=new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src=PDF_SRC;s.async=true;s.crossOrigin='anonymous';
  s.onload=()=>window.pdfjsLib?resolve(window.pdfjsLib):reject(Error('Leitor de PDF indisponível.'));
  s.onerror=()=>reject(Error('Não foi possível carregar PDF.js (verifique a conexão).'));
  document.head.append(s);
 }).catch(e=>{U.pdfPromise=null;throw e});
 const lib=await U.pdfPromise;lib.GlobalWorkerOptions.workerSrc=PDF_WORKER;return lib;
}
async function extractPdf(f){
 S.uniPdfStatus='Extraindo texto localmente do PDF…';refresh();
 try{
  if(f.size>12e6)throw Error('PDF acima de 12 MB: divida o material para preservar a memória do celular.');
  if(!/\.pdf$/i.test(f.name)&&f.type!=='application/pdf')throw Error('Selecione um arquivo PDF.');
  const lib=await pdfLib(),buf=await f.arrayBuffer();
  const doc=await lib.getDocument({data:new Uint8Array(buf),useSystemFonts:true}).promise;
  if(doc.numPages>100)throw Error('Limite de 100 páginas; divida o PDF.');
  const parts=[];
  for(let i=1;i<=doc.numPages;i++){
   const page=await doc.getPage(i),ct=await page.getTextContent();
   parts.push(ct.items.map(x=>x.str||'').join(' '));
   if(parts.join('').length>65000)break;
  }
  const text=parts.join('\n\n').slice(0,60000).trim();
  if(text.length<100)throw Error('PDF sem texto selecionável. Para documento digitalizado, use uma versão com OCR antes do upload.');
  S.uniText=text;S.uniTitle=f.name.replace(/\.pdf$/i,'');S.uniSource='PDF · '+f.name;S.uniPdfStatus='Texto extraído de '+parts.length+' página(s). Confira o trecho antes de gerar.';
 }catch(err){S.uniPdfStatus='PDF: '+String(err.message||err).slice(0,180);}
 refresh();
 const ta=document.querySelector('[data-uni-text]');if(ta)ta.value=S.uniText;
}
function valorTexto(){const t=document.querySelector('[data-uni-text]');return t?t.value:S.uniText;}
function frases(t){return String(t).match(/[^.!?\n]{25,}[.!?]?/g)?.slice(0,15)||[];}
function offline(text,title,disc){
 const f=frases(text),eq=[...new Set(text.split('\n').map(x=>x.trim()).filter(x=>x.length<190&&/[=≈≤≥∑∂]/.test(x)))].slice(0,8);
 return {id:uid(),titulo:title||'Fichamento acadêmico',disc,origem:S.uniSource,criado:new Date().toISOString(),excerto:text.slice(0,12000),
  tese:trunc(f[0]||text.slice(0,300),1000),conceitos:[],equacoes:eq,
  escola:'Não identificada de maneira verificável no trecho.',criticas:'Não identificadas de maneira verificável no trecho.',
  questoes:['Qual é a tese central do texto?','Quais são os conceitos e pressupostos usados pelo autor?','Que objeções ou limitações o autor reconhece?'],metodo:'Extração local (sem IA)'};
}
async function geraFicha(){
 if(S.uniBusy)return;
 const text=valorTexto().trim();S.uniText=text;
 const title=(document.querySelector('[data-uni-title]')?.value||S.uniTitle||'Texto acadêmico').trim().slice(0,160);
 const disc=document.querySelector('[data-uni-disc]')?.value||S.uniDisc;
 if(text.length<200){S.uniStatus='Cole ao menos 200 caracteres ou selecione um PDF com texto.';refresh();return;}
 S.uniTitle=title;S.uniDisc=disc;S.uniBusy=true;S.uniStatus='Gerando fichamento via roteador de IA…';refresh();
 let result=offline(text,title,disc);
 try{
  if(typeof anxCall!=='function')throw Error('Roteador de IA não carregado.');
  const prompt='FICHAMENTO ACADÊMICO, exclusivamente com base no EXCERTO fornecido. Não invente bibliografia, escola, críticas ou fórmulas; onde faltar, escreva NÃO IDENTIFICADO. Responda com uma tese central em resumo, conceitos e equações em glossario, escola em visoes, limites em contraponto e TRÊS perguntas de prova em o_que_observar (formato de pergunta). Texto estudado (amostra limitada a 4800 caracteres):\n'+text.slice(0,4800);
  const out=await anxCall({modo:'economista',texto:prompt.slice(0,5900)});
  const ai=out.resposta||out;
  if(!ai||(!ai.resumo&&!ai.explicacao?.length))throw Error('A IA não devolveu conteúdo estruturado.');
  result.tese=trunc(ai.resumo||ai.explicacao[0],3000);
  result.conceitos=(Array.isArray(ai.glossario)?ai.glossario:[]).slice(0,12).map(x=>({termo:trunc(x.termo,140),significado:trunc(x.significado,900)}));
  result.escola=trunc((Array.isArray(ai.visoes)?ai.visoes:[]).map(x=>(x.escola||'')+': '+(x.argumento||'')).join('; '),1500)||result.escola;
  result.criticas=trunc(ai.contraponto||'',1500)||result.criticas;
  const qs=(Array.isArray(ai.o_que_observar)?ai.o_que_observar:[]).filter(x=>String(x).includes('?')).slice(0,3);
  if(qs.length===3)result.questoes=qs.map(x=>trunc(x,500));
  result.metodo='IA existente · excerto de até 4800 caracteres';
  S.uniStatus='Fichamento salvo no navegador. Confira a precisão da IA contra o texto original.';
 }catch(err){S.uniStatus='IA indisponível: ficha de extração local salva sem preencher conceitos ausentes. '+String(err.message||err).slice(0,160);}
 db.fichas.unshift(result);db.fichas=db.fichas.slice(0,80);S.uniFid=result.id;persist();S.uniBusy=false;refresh();
}
L.events.uniFichar=geraFicha;
L.events.uniLocal=()=>{
 S.uniText=valorTexto().trim();if(S.uniText.length<100){S.uniStatus='Cole um trecho antes de salvar.';refresh();return;}
 const disc=document.querySelector('[data-uni-disc]')?.value||S.uniDisc;
 const title=(document.querySelector('[data-uni-title]')?.value||S.uniTitle||'Texto acadêmico').trim().slice(0,160);
 const f=offline(S.uniText,title,disc);db.fichas.unshift(f);db.fichas=db.fichas.slice(0,80);S.uniFid=f.id;S.uniTitle=title;persist();S.uniStatus='Ficha de extração local salva (não é análise de IA).';refresh();
};
L.events.uniAbrir=el=>{S.uniFid=el.dataset.id;refresh();};
L.events.uniExcluir=el=>{if(!confirm('Excluir apenas esta ficha do histórico local?'))return;db.fichas=db.fichas.filter(x=>x.id!==el.dataset.id);S.uniFid='';persist();refresh();};
function fichaHTML(f){
 return '<div class="uni-ficha"><h3>'+esc(f.titulo)+'</h3>'+note('<b>Fonte:</b> '+esc(f.origem)+' · '+esc(f.metodo))+
 note('<b>Tese central:</b> '+esc(f.tese))+
 note('<b>Conceitos-chave:</b> '+(f.conceitos.length?f.conceitos.map(x=>'<b>'+esc(x.termo)+'</b>: '+esc(x.significado)).join('; '):'Não identificados no trecho.'))+
 note('<b>Equações:</b> '+(f.equacoes.length?f.equacoes.map(esc).join(' | '):'Não identificadas.'))+
 note('<b>Escola econômica:</b> '+esc(f.escola))+note('<b>Críticas / limites:</b> '+esc(f.criticas))+
 '<h4>3 questões prováveis de prova</h4><ol>'+f.questoes.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>'+
 '<div class="eco-controls"><button type="button" class="eco-action" data-eco-btn="uniDeck" data-id="'+esc(f.id)+'">Gerar Flashcards</button><button type="button" data-eco-btn="uniExcluir" data-id="'+esc(f.id)+'">Excluir ficha</button></div></div>';
}
L.views.ficha=()=>{
 const f=db.fichas.find(x=>x.id===S.uniFid);
 return card('Fichador de textos e artigos',
 '<div class="uni-grid"><label>Título / artigo<input data-uni-title maxlength="160" value="'+esc(S.uniTitle)+'" placeholder="Ex.: Cap. 3 — Keynes"></label>'+
 '<label>Disciplina<select data-uni-disc>'+DISC.map(d=>'<option'+(S.uniDisc===d?' selected':'')+'>'+esc(d)+'</option>').join('')+'</select></label></div>'+
 '<label>PDF com texto selecionável<input data-uni-pdf type="file" accept="application/pdf,.pdf"></label>'+
 note('PDF extraído no seu dispositivo com PDF.js. A IA recebe somente o trecho de até 4.800 caracteres que você decidiu analisar. PDFs escaneados exigem OCR prévio.')+
 (S.uniPdfStatus?note(esc(S.uniPdfStatus)):'')+
 '<label>Texto / capítulo<textarea data-uni-text rows="9" placeholder="Cole aqui um trecho de artigo, capítulo ou suas notas…">'+esc(S.uniText)+'</textarea></label>'+
 '<div class="eco-controls"><button type="button" data-eco-btn="uniFichar" class="eco-action"'+(S.uniBusy?' disabled':'')+'>'+(S.uniBusy?'Gerando…':'Gerar fichamento com IA')+'</button>'+
 '<button type="button" data-eco-btn="uniLocal">Fichar sem IA</button></div>'+
 (S.uniStatus?note(esc(S.uniStatus)):'')+ (erro?note(esc(erro)):'') )+
 card('Fichamentos salvos · '+db.fichas.length,
 (db.fichas.length?'<div class="uni-saved">'+db.fichas.map(x=>'<button type="button" data-eco-btn="uniAbrir" data-id="'+esc(x.id)+'" class="'+(x.id===S.uniFid?'on':'')+'"><b>'+esc(x.titulo)+'</b><small>'+esc(x.disc)+' · '+esc(x.criado.slice(0,10))+'</small></button>').join('')+'</div>':'<p class="eco-note">Ainda não há fichamentos neste navegador.</p>')+
 (f?fichaHTML(f):''));
};
const D0=new Date().toISOString();
function cardsFromFicha(f){
 const list=[];
 for(const x of f.conceitos.slice(0,12))if(x.termo&&x.significado)list.push({front:'Defina '+x.termo,back:x.significado});
 for(const x of f.equacoes.slice(0,6))list.push({front:'Explique a equação '+x.slice(0,65),back:x});
 if(f.tese)list.push({front:'Qual é a tese central de '+f.titulo+'?',back:f.tese});
 if(f.escola&&!f.escola.startsWith('Não identificada'))list.push({front:'Qual escola é associada a '+f.titulo+'?',back:f.escola});
 for(const q of f.questoes.slice(0,3))list.push({front:q,back:'Responda usando o fichamento: '+f.tese.slice(0,240)});
 return list.slice(0,24).map(x=>fixCard({id:uid(),disc:f.disc,front:x.front,back:x.back,source:f.titulo,due:D0}));
}
L.events.uniDeck=el=>{
 const f=db.fichas.find(x=>x.id===el.dataset.id);if(!f)return;
 const add=cardsFromFicha(f);if(!add.length){S.uniStatus='Fichamento sem conteúdo suficiente para cartões.';refresh();return;}
 db.cards.push(...add);db.cards=db.cards.slice(-500);persist();S.uniFlashDisc=f.disc;S.uniCard=null;S.uniFlip=false;S.tool='flash';
 document.querySelectorAll('.eco-nav [data-eco-tool]').forEach(btn=>btn.classList.toggle('on',btn.dataset.ecoTool==='flash'));
 L.paint();
};
const due=c=>Date.parse(c.due||'')<=Date.now();
function getDeck(){
 const deck=db.cards.filter(x=>x.disc===S.uniFlashDisc).sort((a,b)=>(Date.parse(a.due)-Date.parse(b.due)));
 return {deck,pendentes:deck.filter(due)};
}
L.events.uniFlip=()=>{S.uniFlip=!S.uniFlip;refresh();};
function review(ok){
 const c=db.cards.find(x=>x.id===S.uniCard);if(!c)return;
 if(ok){
  c.reps+=1;c.interval=c.reps===1?1:c.reps===2?3:Math.min(3650,Math.round(c.interval*c.ease));
  c.ease=Math.min(3,Math.max(1.3,c.ease+0.06));
 }else{c.reps=0;c.interval=0;c.ease=Math.max(1.3,c.ease-.2);}
 c.due=new Date(Date.now()+(ok?c.interval*864e5:60000)).toISOString();
 db.revisoes.push({card:c.id,acerto:ok,at:new Date().toISOString()});db.revisoes=db.revisoes.slice(-600);
 persist();S.uniCard=null;S.uniFlip=false;refresh();
}
L.events.uniAcerto=()=>review(true);
L.events.uniErro=()=>review(false);
L.events.uniNovo=()=>{S.uniCard=null;S.uniFlip=false;refresh();};
L.views.flash=()=>{
 const {deck,pendentes}=getDeck();
 let curr=deck.find(x=>x.id===S.uniCard);
 if(!curr){curr=pendentes[0];S.uniCard=curr?.id||null;}
 const resumo=note('Repetição espaçada local: acerto adia a próxima revisão (1, 3, depois intervalos crescentes); erro devolve o cartão à fila. Históricos ficam somente neste navegador.');
 return card('Flashcards por disciplina',
 (S.uniStatus?note(esc(S.uniStatus)):'')+'<label>Matéria<select data-uni-flashdisc>'+DISC.map(d=>'<option'+(S.uniFlashDisc===d?' selected':'')+'>'+esc(d)+'</option>').join('')+'</select></label>'+
 note('<b>'+pendentes.length+'</b> para revisar hoje · '+deck.length+' cartões desta disciplina · '+db.revisoes.length+' respostas registradas.')+resumo+
 (curr?'<button type="button" data-eco-btn="uniFlip" class="uni-flash" aria-label="Virar flashcard"><small>'+esc(curr.source)+'</small><strong>'+esc(S.uniFlip?curr.back:curr.front)+'</strong><span>'+ (S.uniFlip?'Resposta · toque para ver a pergunta':'Pergunta · toque para revelar a resposta')+'</span></button>'+
 (S.uniFlip?'<div class="eco-controls"><button type="button" data-eco-btn="uniErro">Errei · revisar</button><button type="button" class="eco-action" data-eco-btn="uniAcerto">Acertei ✓</button></div>':''):
 '<p class="eco-note">Revisões em dia. Crie cartões a partir de um fichamento ou escolha outra disciplina.</p>'));
};
})();
