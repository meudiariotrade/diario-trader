/* v684 · Assistente acadêmico ABNT (NBR 6023:2025, 10520:2023, 14724:2024). Apenas front-end. */
;(function(){
'use strict';
const L=window.EconomiaLab,S=L.state,E=L.esc,N=L.note,C=L.card;
const KEY='diario-laboratorio-abnt-v684';
const blank={tipo:'livro',autores:'',org:'',titulo:'',ano:'',cidade:'',editora:'',periodico:'',volume:'',numero:'',paginas:'',doi:'',url:'',acesso:new Date().toISOString().slice(0,10),pagina:'',modo:'indireta',tcc:'',curso:'',instituicao:'',capitulo:'Introdução',texto:'',tabela:null,tabelaCSV:'',aviso:''};
let state={...blank};
try{const old=JSON.parse(localStorage.getItem(KEY)||'null');if(old&&typeof old==='object')state={...blank,...old};}catch{}
S.abnt=state;
const safe=(v,n=5000)=>String(v??'').trim().slice(0,n);
function autorNome(s){
 const a=safe(s,150);
 if(!a)return '';
 if(a===a.toUpperCase()&&a.length>5)return a;
 if(a.includes(',')){
  const i=a.indexOf(',');return a.slice(0,i).trim().toLocaleUpperCase('pt-BR')+', '+a.slice(i+1).trim();
 }
 const p=a.split(/\s+/),last=p.pop();
 return last.toLocaleUpperCase('pt-BR')+', '+p.join(' ');
}
const authors=s=>safe(s,800).split(/\s*;\s*|\n+/).map(x=>x.trim()).filter(Boolean).slice(0,8);
const authorList=s=>{
 const a=authors(s).map(autorNome);if(a.length<=3)return a.join('; ');
 return a[0]+' et al.';
};
const citeName=s=>{
 const a=authors(s);
 return a.map(x=>{let name=x.includes(',')?x.split(',')[0]:x.trim().split(/\s+/).at(-1);return name.charAt(0).toLocaleUpperCase('pt-BR')+name.slice(1).toLocaleLowerCase('pt-BR');}).slice(0,3).join('; ');
};
const accessDate=d=>{
 if(!/^\d{4}-\d\d-\d\d$/.test(String(d)))return '';
 const p=d.split('-');return p[2]+' '+['jan.','fev.','mar.','abr.','maio','jun.','jul.','ago.','set.','out.','nov.','dez.'][+p[1]-1]+' '+p[0];
};
function formatRef(s){
 const creator=safe(s.tipo==='site'&&s.org?s.org:s.autores,500);
 if(!creator||!s.titulo||!/^\d{4}[a-z]?$/.test(String(s.ano)))return 'Preencha autoria (ou instituição), título e ano válido antes de gerar a referência.';
 const author=s.tipo==='site'&&s.org?safe(s.org,150).toLocaleUpperCase('pt-BR'):authorList(creator);
 const yr=s.ano,ct=safe(s.cidade,100)||'[S. l.]',pub=safe(s.editora,130)||'[s. n.]';
 const url=/^https:\/\//i.test(s.url)?safe(s.url,450):'';
 const doi=/^10\.\d{4,9}\//.test(s.doi)?' DOI: '+safe(s.doi,150)+'.':'';
 if(s.tipo==='livro')return author+'. '+safe(s.titulo,300)+'. '+ct+': '+pub+', '+yr+'.';
 if(s.tipo==='artigo')return author+'. '+safe(s.titulo,300)+'. '+(safe(s.periodico,150)||'[Periódico não informado]')+', '+
  ct+(s.volume?', v. '+safe(s.volume,20):'')+(s.numero?', n. '+safe(s.numero,20):'')+
  (s.paginas?', p. '+safe(s.paginas,35):'')+', '+yr+'.'+doi+(url?' Disponível em: '+url+'. Acesso em: '+accessDate(s.acesso)+'.':'');
 return author+'. '+safe(s.titulo,300)+'. '+yr+'.'+(url?' Disponível em: '+url+'. Acesso em: '+accessDate(s.acesso)+'.':' Acesso eletrônico não informado.');
}
function citation(s){
 const creator=safe(s.tipo==='site'&&s.org?s.org:s.autores,500),name=s.tipo==='site'&&s.org?safe(s.org,150):citeName(creator);
 if(!name||!/^\d{4}[a-z]?$/.test(String(s.ano)))return 'Informe autoria e ano para gerar a citação.';
 const page=s.modo==='direta'?(s.pagina?', p. '+safe(s.pagina,20):' [informe a página]'):'';
 return '('+name+', '+s.ano+page+')';
}
function outliner(s){
 return ['1 INTRODUÇÃO','2 REFERENCIAL TEÓRICO','3 METODOLOGIA','4 RESULTADOS E DISCUSSÃO','5 CONSIDERAÇÕES FINAIS','REFERÊNCIAS'];
}
function csvRows(text){
 const lines=safe(text,150000).split(/\r?\n/).filter(x=>x.trim()).slice(0,61);
 const delimiter=lines[0]?.includes('\t')?'\t':';';
 return lines.map(row=>{
  const cells=[],re=new RegExp('(?:^|'+(delimiter==='\t'?'\\t':';')+')(?:"((?:[^"]|"")*)"|([^'+(delimiter==='\t'?'\\t':';')+']*))','g');
  for(const m of row.matchAll(re))cells.push(safe((m[1]??m[2]??'').replace(/""/g,'"'),200));
  return cells.slice(0,8);
 }).filter(a=>a.length);
}
function tableHTML(t){
 if(!t?.rows?.length)return '';
 return '<figure class="eco-abnt-table"><figcaption>'+E(t.name||'Tabela 1 — Série consultada')+'</figcaption><div class="eco-qscroll"><table><thead><tr>'+t.rows[0].map(x=>'<th>'+E(x)+'</th>').join('')+'</tr></thead><tbody>'+
 t.rows.slice(1,61).map(row=>'<tr>'+row.map(x=>'<td>'+E(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><small>Fonte: '+E(t.source||'dados informados pelo usuário')+'</small></figure>';
}
function documentHTML(s){
 const ref=formatRef(s),citationText=citation(s);
 return '<article class="eco-abnt-paper"><header><strong>'+E(safe(s.instituicao||'INSTITUIÇÃO',150))+'</strong><p>'+E(safe(s.autores||'AUTOR(A)',250))+'</p><h2>'+E(safe(s.tcc||'TÍTULO DO TRABALHO',250))+'</h2>'+
 '<p>'+E(safe(s.curso||'Curso / disciplina não informado',150))+'</p></header>'+
 '<h3>'+E(s.capitulo)+'</h3><div class="eco-abnt-text">'+E(s.texto||'Escreva aqui o texto autoral do seu capítulo.').replace(/\n/g,'<p></p>')+'</div>'+
 tableHTML(s.tabela)+'<h3>REFERÊNCIAS</h3><p class="eco-abnt-reference">'+E(ref)+'</p>'+
 '<footer>Exemplo de chamada autor-data: '+E(citationText)+'. Conferir regras complementares do manual da sua instituição.</footer></article>';
}
function remember(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{state.aviso='Não foi possível gravar neste dispositivo. Exporte seu trabalho.';}}
const f=(key,label,type='text')=>'<label>'+label+'<input data-abnt-field="'+key+'" type="'+type+'" value="'+E(state[key])+'"></label>';
const options=(key,arr)=>'<label>'+ (key==='tipo'?'Tipo de referência':key==='modo'?'Citação':'Capítulo')+
 '<select data-abnt-field="'+key+'">'+arr.map(([v,n])=>'<option value="'+E(v)+'"'+(state[key]===v?' selected':'')+'>'+E(n)+'</option>').join('')+'</select></label>';
L.views.abnt=()=>{
 const current=L.uni?.data?.consultas||[];
 const sourceOptions=current.map(a=>'<option value="'+E(a.id)+'">'+E(a.serie)+' · '+E(a.fonte)+'</option>').join('');
 let html='<div class="eco-controls">'+options('tipo',[['livro','Livro'],['artigo','Artigo científico'],['site','Site / BCB / IBGE']])+
 options('modo',[['indireta','Citação indireta'],['direta','Citação direta']])+'</div>';
 html+='<div class="eco-qform">'+f('autores','Autores: sobrenome, prenome; próximo autor')+f('org','Instituição (site, BCB, IBGE)')+
 f('titulo','Título da obra, artigo ou página')+f('ano','Ano (AAAA)')+f('cidade','Cidade')+f('editora','Editora')+
 (state.tipo==='artigo'?f('periodico','Periódico')+f('volume','Volume')+f('numero','Número')+f('paginas','Páginas')+f('doi','DOI'):'')+
 (state.tipo!=='livro'?f('url','URL HTTPS')+f('acesso','Data de acesso','date'):'')+
 (state.modo==='direta'?f('pagina','Página para a citação direta'):'')+'</div>';
 html+='<div class="eco-qresults"><h4>Referência · NBR 6023:2025</h4><p>'+E(formatRef(state))+'</p><h4>Citação autor-data · NBR 10520:2023</h4><p>'+E(citation(state))+'</p>'+
 '<div class="eco-controls"><button type="button" data-eco-btn="abntCopy">Copiar referência</button></div></div>';
 let work=options('capitulo',outliner(state).map(x=>[x,x]))+
 '<div class="eco-qform">'+f('instituicao','Instituição de ensino')+f('curso','Curso / disciplina')+f('tcc','Título do TCC / trabalho')+'</div>'+
 '<label>Texto do capítulo<textarea data-abnt-field="texto" rows="7" placeholder="Cole seu texto autoral e as citações verificadas...">'+E(state.texto)+'</textarea></label>';
 work+='<div class="eco-qresults"><h4>Importar dados do extrator BCB/IBGE</h4>'+
 '<div class="eco-controls"><label>Consulta já feita<select data-abnt-source><option value="">Selecione uma série</option>'+sourceOptions+'</select></label>'+
 '<button type="button" data-eco-btn="abntSeries">Inserir tabela oficial</button></div>'+
 '<label>Ou colar CSV (;)/tabela TSV (TAB)<textarea data-abnt-field="tabelaCSV" rows="3" placeholder="data;valor;fonte;serie;unidade">'+E(state.tabelaCSV)+'</textarea></label>'+
 '<button type="button" data-eco-btn="abntCSV">Montar tabela colada</button>'+
 (state.tabela?N('Tabela incorporada à prévia acadêmica abaixo, com fonte e valores originais.'):N('Nenhuma tabela importada. Os números serão mantidos exatamente como estiverem na fonte, sem interpolação.'))+'</div>';
 work+='<div class="eco-controls"><button type="button" class="eco-action" data-eco-btn="abntSave">Salvar rascunho local</button>'+
 '<button type="button" data-eco-btn="abntExport">Exportar HTML para Word</button><button type="button" data-eco-btn="abntPrint">Imprimir A4 / PDF</button></div>'+
 (state.aviso?N(E(state.aviso)):'')+documentHTML(state);
 return C('Assistente ABNT · citações e referências',html+N('Referências: NBR 6023:2025; citações NBR 10520:2023. O preenchimento de campos essenciais é necessário; não são inventados autores ou fontes.'))+
 C('TCC · estruturação e tabelas oficiais',work+N('Padrão de apresentação acadêmica inspirado na NBR 14724:2024. Confira capa, pré-textuais e manual da faculdade; este editor não substitui revisão bibliográfica.'));
};
document.addEventListener('input',e=>{
 if(typeof ESV==='undefined'||ESV!=='eco'||S.tool!=='abnt')return;
 const el=e.target;if(el?.matches?.('[data-abnt-field]')&&Object.hasOwn(state,el.dataset.abntField))state[el.dataset.abntField]=safe(el.value,el.dataset.abntField==='texto'?30000:el.dataset.abntField==='tabelaCSV'?120000:1000);
},true);
document.addEventListener('change',e=>{
 if(typeof ESV==='undefined'||ESV!=='eco'||S.tool!=='abnt')return;
 const el=e.target;if(el?.matches?.('[data-abnt-field]')){state[el.dataset.abntField]=safe(el.value,100000);L.paint();}
},true);
function syncFields(){
 // Valor atual do DOM prevalece no instante de salvar; não depende de blur/change
 // nem de atualizações assíncronas do Laboratório que podem remontar formulários.
 for(const el of document.querySelectorAll('#eco-body [data-abnt-field]')){
  const key=el.dataset.abntField;
  if(Object.prototype.hasOwnProperty.call(state,key)){
   const max=key==='texto'?30000:key==='tabelaCSV'?120000:1000;
   state[key]=safe(el.value,max);
  }
 }
}
L.events.abntSave=()=>{syncFields();remember();state.aviso='Rascunho salvo no navegador deste aparelho.';L.paint();};
L.events.abntSeries=()=>{
 const id=document.querySelector('#eco-body [data-abnt-source]')?.value;
 const row=L.uni?.data?.consultas?.find(x=>x.id===id);if(!row)return;
 state.tabela={name:'Tabela 1 — '+safe(row.serie,150),source:safe(row.fonte,100)+' · '+safe(row.url,350)+' · consulta '+safe(row.em,20),
 rows:[['Data / período','Valor ('+safe(row.unidade,60)+')'],...(row.pontos||[]).slice(-60).map(x=>[String(x.data),String(x.valor)])]};
 state.aviso='Série oficial importada; confira o período e a fonte.';remember();L.paint();
};
L.events.abntCSV=()=>{
 const rows=csvRows(state.tabelaCSV);
 if(rows.length<2){state.aviso='Cole ao menos cabeçalho e uma linha de valores.';L.paint();return;}
 state.tabela={name:'Tabela 1 — Dados importados',source:'tabela colada pelo usuário · confira origem',rows};
 state.aviso='Tabela colada convertida; revise fonte e unidades.';remember();L.paint();
};
L.events.abntCopy=async()=>{
 const ref=formatRef(state);
 try{
  if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(ref);
  else{const e=document.createElement('textarea');e.value=ref;document.body.appendChild(e);e.select();document.execCommand('copy');e.remove();}
  state.aviso='Referência copiada.';
 }catch{state.aviso='Copie a referência exibida manualmente.';}
 L.paint();
};
L.events.abntPrint=()=>window.print();
L.events.abntExport=()=>{
 const html='<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>'+E(state.tcc||'Trabalho acadêmico')+'</title><style>@page{size:A4;margin:3cm 2cm 2cm 3cm}body{font:12pt "Times New Roman",serif;line-height:1.5;color:#111}h2,h3{text-align:left}p{text-align:justify}table{border-collapse:collapse;width:100%;font-size:10pt}td,th{border:1px solid #555;padding:4px}figure{margin:18px 0}footer{font-size:10pt}</style>'+
 documentHTML(state)+'</html>';
 const blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='trabalho-academico-abnt.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),2500);
};
L.abnt={formatRef,citation,csvRows,documentHTML,autorNome,accessDate};
})();
