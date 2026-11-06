/* Diário de Trader v432 — Terminal: menus internos e painéis no padrão Bloomberg
 * 1) "Menu do Terminal": sem itens repetidos, nomes claros e grupos por assunto
 *    (Ativo em foco · Buscar · Painéis e espaços · Dados e inteligência · Rotina · Ajuda).
 * 2) Painéis (G, TECH, DES, TOP…): cabeçalho enxuto; no gráfico, só tempo gráfico e estilo à vista,
 *    indicadores e zoom em "Indicadores ▾"; avisos "Entre na sua conta" com botão.
 * Os botões originais continuam existindo e são os que executam cada ação. Nada é removido. */
(function(root){
'use strict';
const doc=root.document;if(!doc)return;
const g=(f,d)=>{try{const v=f();return v===undefined?d:v}catch(e){return d}};
const LS='diario-v432-ind';
const indAberto=()=>{try{return localStorage.getItem(LS)==='1'}catch(e){return false}};
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim().toLowerCase();

/* ---------- 1) Menu do Terminal ---------- */
const GRUPOS=['Ativo em foco','Buscar','Painéis e espaços','Dados e inteligência','Rotina','Ajuda e saída'];
// [teste no texto normalizado, grupo, novo nome (ou função), remover?]
const REGRAS=[
  [/^atalhos/,null,null,true],                       // já está no botão ••• da barra
  [/^buscar ou digitar comando$/,null,null,true],    // já está na lupa da barra
  [/^\d+$/,'Dados e inteligência',t=>`Problemas nos dados (${t.trim()})`],
  [/^favorit/,'Ativo em foco'],
  [/^pesquisar /,'Ativo em foco'],
  [/^grafico$/,'Ativo em foco','Gráfico do ativo'],
  [/^fundamentos/,'Ativo em foco'],
  [/^comandos$/,'Buscar','Lista de comandos'],
  [/^pesquisa$/,'Buscar','Pesquisa de ativos'],
  [/^fluxo$/,'Rotina','Fluxo do dia'],
  [/^rotina/,'Rotina'],
  [/^planejar/,'Rotina','Planejar sessão'],
  [/^observador/,'Rotina','Observador'],
  [/^espacos$/,'Painéis e espaços','Trocar de espaço'],
  [/^workspaces$/,'Painéis e espaços','Gerenciar espaços'],
  [/^$/,'Painéis e espaços','Renomear ou excluir este espaço'], // "⋯"
  [/^organizar$/,'Painéis e espaços','Layouts por horário'],
  [/^auto/,'Painéis e espaços',t=>'Troca automática de layout: '+(/deslig/i.test(t)?'desligada':'ligada')],
  [/radar|acoes brasil|exterior|cripto|macro/,'Dados e inteligência',(t,raw)=>/radar proativo/i.test(raw)?'Radar proativo':/▾/.test(raw)&&!/intelig/i.test(raw)?'Lista do radar: '+raw.replace('▾','').trim()+' ▾':null],
  [/consulta|qualidade|dados|automac|intelig/,'Dados e inteligência'],
  [/^guia$/,'Ajuda e saída','Guia do Terminal'],
  [/^sair$/,'Ajuda e saída','Sair do Terminal'],
];
let mexendo=false;
function arrumaMenu(dlg){
  const cont=dlg.querySelector('.tr341-content');if(!cont||cont.dataset.v432===cont.childElementCount+'|'+cont.textContent.length)return;
  const bts=[...cont.querySelectorAll('button[data-tr341-action]')];if(!bts.length)return;
  mexendo=true;
  const vistos=new Set(),por={};GRUPOS.forEach(x=>por[x]=[]);
  for(const b of bts){
    const raw=b.textContent.trim();const n=norm(raw).replace(/^[^\w]+/,'');
    let grupo=null,nome=null,remove=false,achou=false;
    if(/[☆★]/.test(raw)){achou=true;grupo='Ativo em foco';nome='☆ Favoritar '+raw.replace(/[☆★]/g,'').trim()}
    else for(const [re,gr,nv,rm] of REGRAS){if(re.test(n)){achou=true;grupo=gr;remove=!!rm;nome=typeof nv==='function'?nv(raw,raw):nv;break}}
    if(remove)continue;
    if(!achou){const h=b.closest('section')?.querySelector('h3')?.textContent||'';grupo=/pesquisa/i.test(h)?'Buscar':/organiza/i.test(h)?'Painéis e espaços':/intelig/i.test(h)?'Dados e inteligência':'Ajuda e saída'}
    const rotulo=(nome||raw).replace(/\s+/g,' ').trim();
    const k=norm(rotulo);if(vistos.has(k))continue;vistos.add(k);
    b.textContent=rotulo;if(b.dataset.v432o==null)b.dataset.v432o=raw;
    (por[grupo]||por['Ajuda e saída']).push(b);
  }
  const frag=doc.createDocumentFragment();
  for(const gr of GRUPOS){
    if(!por[gr].length)continue;
    const sec=doc.createElement('section');sec.className='tr341-group v432-grp';
    const h=doc.createElement('h3');h.textContent=gr;const grid=doc.createElement('div');grid.className='tr341-items';
    por[gr].forEach(b=>grid.appendChild(b));sec.append(h,grid);frag.appendChild(sec);
  }
  cont.replaceChildren(frag);
  cont.dataset.v432=cont.childElementCount+'|'+cont.textContent.length;
  mexendo=false;
}
const mo=new MutationObserver(()=>{if(mexendo)return;const d=doc.querySelector('dialog.tr341-dialog');if(d&&(d.open||d.hasAttribute('open')))try{arrumaMenu(d)}catch(e){mexendo=false}});
function observaMenu(){const d=doc.querySelector('dialog.tr341-dialog');if(d&&!d.dataset.v432obs){d.dataset.v432obs='1';mo.observe(d,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});try{arrumaMenu(d)}catch(e){}}}

/* ---------- 2) painéis ---------- */
const TF=/^(tf|style)\|/;
function paineis(){
  doc.querySelectorAll('#trgrid .trp').forEach(p=>{
    // cabeçalho: "Ampliar" só com o ícone
    p.querySelectorAll('.trph .trmx').forEach(b=>{if(!b.dataset.v432){b.dataset.v432='1';b.setAttribute('aria-label','Ampliar painel')}});
    // gráfico: barra principal só com tempo gráfico e estilo; o resto em "Indicadores ▾"
    p.querySelectorAll('.g9bar').forEach(bar=>{
      if(!bar.querySelector('.v432-ind')){
        const b=doc.createElement('button');b.type='button';b.className='g9b v432-ind';bar.appendChild(b);
      }
      bar.querySelectorAll(':scope>button:not(.v432-ind),:scope>input').forEach(x=>{const k=x.dataset.g9||'';x.classList.toggle('v432-pri',TF.test(k))});
      const on=indAberto();bar.classList.toggle('v432-aberto',on);
      const bt=bar.querySelector('.v432-ind');const t=on?'Menos ▴':'Indicadores ▾';
      if(bt.textContent!==t){bt.textContent=t;bt.setAttribute('aria-expanded',on?'true':'false');bt.setAttribute('aria-label',on?'Recolher indicadores e zoom':'Mostrar indicadores (médias, RSI, MACD, Fibo), zoom e escala')}
    });
    // "Entre na sua conta." com botão
    p.querySelectorAll('.trerr').forEach(e=>{
      if(!/entre na sua conta/i.test(e.textContent)||e.querySelector('.v432-conta'))return;
      const b=doc.createElement('button');b.type='button';b.className='v432-conta';b.textContent='Entrar na conta';e.appendChild(b);
    });
  });
}
doc.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('.v432-ind');
  if(b){e.preventDefault();e.stopPropagation();try{localStorage.setItem(LS,indAberto()?'0':'1')}catch(x){}paineis();return}
  const c=e.target.closest&&e.target.closest('.v432-conta');
  if(c){e.preventDefault();e.stopPropagation();g(()=>{tab='conta';render0();scrollTo(0,0)})}
},true);

function tudo(){try{observaMenu()}catch(e){}try{paineis()}catch(e){}}
let k=0;const iv=setInterval(()=>{k++;tudo();if(k>20)clearInterval(iv)},700);
setInterval(()=>{if(!doc.hidden&&g(()=>tab,'')==='term')tudo()},1500);
root.DIARIO_V432={tudo,arrumaMenu};
})(window);
