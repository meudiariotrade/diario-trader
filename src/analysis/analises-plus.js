/* v873/v874 — Análises+: Rankings completos, Radar & Distorções, Página do ativo e Teses.
 * Layout inspirado em telas de stock picking, na identidade escura do Diário (CLAUDE.md).
 * Tudo calculado no aparelho a partir do snapshot público do Screener (Cloudflare/IndexedDB).
 * Sem Supabase, sem polling: séries só sob ação do usuário ou 1x por entrada (cache 12 h). */
;(function(w,d){'use strict';
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=x=>x==null||x===''?null:Number.isFinite(Number(x))?Number(x):null;
const fmt=(n,dg=2)=>n==null||!Number.isFinite(Number(n))?'—':Number(n).toLocaleString('pt-BR',{minimumFractionDigits:dg,maximumFractionDigits:dg});
const pct=(n,dg=1)=>n==null?'—':fmt(n,dg)+'%';
const sinal=(n,dg=1)=>n==null?'—':(n>0?'+':'')+fmt(n,dg)+'%';
const brl=n=>n==null?'—':'R$ '+fmt(n,2);
const cmp=n=>n==null?'—':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',notation:'compact',maximumFractionDigits:2}).format(n);
const cor=n=>n==null?'':n>=0?'ap-g':'ap-r';
const logo=tk=>w.DiarioLogos?.html?.(tk,20)||'';
const ls={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const K_EXTRA='ap874-extra',URL_EXTRA='https://raw.githubusercontent.com/meudiariotrade/diario-trader/main/dados-publicos/analises-plus.json',K_COLS='ap874-colunas',K_ROT='ap873-rotacao',K_TESES='diario-teses-v873',K_FILT='ap873-filtros';

/* ---------- estado ---------- */
const st={tab:'rankpro',rows:null,loading:false,erro:'',ref:null,tk:'',sub:'visao',per:'1A',ibov:false,
 f:Object.assign({q:'',preset:'',setor:'',porte:'',nota:0,liq:0,sort:'nota',dir:-1,pg:30,page:0},ls.get(K_FILT,{})),
 radarPorte:'',radarSetor:'',rot:ls.get(K_ROT,null),rotLoading:false,serie:{},teseEdit:null,excluir:''};
const COLS=[
 ['nota','Nota Raio-X',1],['setor','Setor',1],['porte','Porte',1],['crowded','Crowded',1],['preco','Preço',1],
 ['graham','Justo Graham',1],['bazin','Justo Bazin',1],['gordon','Justo Gordon',1],['justo','Justo médio',1],['proprio','Teto próprio',1],
 ['pl','P/L',1],['pvp','P/VP',1],['ev_ebitda','EV/EBITDA',1],['dy','DY',1],['payout','Payout',0],['roe','ROE',1],['roic','ROIC',1],
 ['margem_liquida','Margem líq.',1],['fcf_yield','FCF yield',0],['div_liq_ebitda','DL/EBITDA',1],['momentum','Momentum 12m',1],['g1','Cresc. lucro',1],['cagr3','CAGR lucro 3a',0],['pegC','PEG',0],
 ['mm200','Dist. MM200',0],['rsi','RSI 14',0],['lpa','LPA',0],['vpa','VPA',0],['dpa','DPA',0],['liquidez','Liquidez diária',1],
 ['cap','Valor de mercado',1],['balanco','Balanço',0]];
let vis=ls.get(K_COLS,null)||COLS.filter(c=>c[2]).map(c=>c[0]);
const PRESETS={
 deep:{n:'Deep Value Raiz',d:'P/L < 10, P/VP < 1,5 e DL/EBITDA < 2,5',f:r=>r.pl>0&&r.pl<10&&r.pvp>0&&r.pvp<1.5&&(r.div_liq_ebitda==null||r.div_liq_ebitda<2.5)},
 div:{n:'Dividendos Saudáveis',d:'DY > 6%, payout < 90%, ROE > 12% e DL/EBITDA < 3',f:r=>r.dy>6&&(r.payout==null||r.payout<90)&&r.roe>12&&(r.div_liq_ebitda==null||r.div_liq_ebitda<3)},
 quality:{n:'Quality Compounders',d:'ROE > 15%, ROIC > 12%, margem > 10% e DL/EBITDA < 2',f:r=>r.roe>15&&r.roic>12&&r.margem_liquida>10&&(r.div_liq_ebitda==null||r.div_liq_ebitda<2)},
 small:{n:'Small Caps Ocultas',d:'Small/Micro, nota ≥ 2,5, crowded < 100% e liquidez > R$ 1 mi',f:r=>(r.porte==='Small'||r.porte==='Micro')&&r.nota>=2.5&&r.crowded!=null&&r.crowded<100&&r.liquidez>1e6}};

/* ---------- dados ---------- */
const median=a=>{const v=a.filter(x=>x!=null&&Number.isFinite(x)).sort((x,y)=>x-y);return v.length?v[Math.floor((v.length-1)/2)]:null};
function rankPct(rows,key,desc){const v=rows.filter(r=>r[key]!=null).sort((a,b)=>desc?a[key]-b[key]:b[key]-a[key]),n=v.length,m=new Map();v.forEach((r,i)=>m.set(r.ticker,n>1?i/(n-1):.5));return m}
function porte(cap){return cap==null?null:cap>=2e10?'Large':cap>=5e9?'Mid':cap>=1e9?'Small':'Micro'}
function enrich(raw,X){const CR=X?.crescimento||{};
 const rows=raw.filter(r=>r&&r.ticker).map(r=>{
  const preco=N(r.preco_referencia),pl=N(r.pl),pvp=N(r.pvp),dy=N(r.dividend_yield),cap=N(r.valor_mercado_brl),liq=N(r.liquidez_diaria_brl);
  const lpa=preco&&pl>0?preco/pl:null,vpa=preco&&pvp>0?preco/pvp:null,dpa=preco&&dy>0?preco*dy/100:null;
  const graham=lpa>0&&vpa>0?Math.sqrt(22.5*lpa*vpa):null,bazin=dpa?dpa/.06:null,gordon=dpa?dpa*1.04/(.10-.04):null;
  const met=[graham,bazin,gordon].filter(x=>x!=null),justo=met.length?met.reduce((a,b)=>a+b,0)/met.length:null;
  let proprio=null;try{proprio=w.DiarioScreenersInteligencia?.valuationBR?.(r,{yieldAceitavel:.07})?.methods?.proprio??null}catch{}
  return {raw:r,ticker:String(r.ticker).toUpperCase(),empresa:r.empresa||r.company_name||'',setor:r.setor||r.sector||'Outros',segmento:r.segmento||'',
   preco,pl,pvp,dy,cap,liquidez:liq,lpa,vpa,dpa,graham,bazin,gordon,justo,proprio,ev_ebitda:N(r.ev_ebitda),payout:N(r.payout_implicito),
   roe:N(r.roe),roic:N(r.roic),margem_liquida:N(r.margem_liquida),fcf_yield:N(r.fcf_yield),div_liq_ebitda:N(r.div_liq_ebitda??r.divida_liquida_ebitda),
   momentum:N(r.momentum_12_1),mm200:N(r.dist_mm200_pct),rsi:N(r.rsi_14),peg:N(r.peg_ratio),balanco:r.data_competencia_balanco||r.fundamentais_em||'',porte:porte(cap),
   giro:cap>0&&liq!=null?liq/cap:null,...(()=>{const c=CR[String(r.ticker).toUpperCase()];if(!c)return {};
   const pegC=pl>0&&c.cagr3>0&&!c.prejuizo4&&c.atualizado?pl/c.cagr3:null;return {g1:c.g1,cagr3:c.cagr3,pegC}})()};
 });
 const mg=median(rows.map(r=>r.giro));rows.forEach(r=>r.crowded=r.giro!=null&&mg?r.giro/mg*100:null);
 const P=(k,desc)=>rankPct(rows,k,desc);
 const pl=P('pl',false),pvp=P('pvp',false),ev=P('ev_ebitda',false),roe=P('roe',true),roic=P('roic',true),ml=P('margem_liquida',true),fcf=P('fcf_yield',true),
  dl=P('div_liq_ebitda',false),dy=P('dy',true),mo=P('momentum',true),m2=P('mm200',true);
 const av=(...ms)=>t=>{const v=ms.map(m=>m.get(t)).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length*4:null};
 const eixos={Valuation:av(pl,pvp,ev),Rentabilidade:av(roe,roic),Margens:av(ml,fcf),Endividamento:av(dl),Dividendos:av(dy),Momentum:av(mo,m2)};
 rows.forEach(r=>{if(!(r.pl>0))pl.delete(r.ticker);r.eixos={};for(const[k,f]of Object.entries(eixos))r.eixos[k]=f(r.ticker);
  const v=Object.values(r.eixos).filter(x=>x!=null);r.nota=v.length>=4?v.reduce((a,b)=>a+b,0)/v.length:null});
 const porSetor={};rows.forEach(r=>(porSetor[r.setor]=porSetor[r.setor]||[]).push(r));
 const medPL={};for(const[s,l]of Object.entries(porSetor))medPL[s]=median(l.map(r=>r.pl>0?r.pl:null));
 return {rows,porSetor,medPL,map:new Map(rows.map(r=>[r.ticker,r]))};
}
async function extra(){const c=ls.get(K_EXTRA,null);if(c&&Date.now()-c.at<12*3600000)return c.d;
 try{const r=await fetch(URL_EXTRA,{cache:'no-cache'});if(!r.ok)throw 0;const j=await r.json();ls.set(K_EXTRA,{at:Date.now(),d:j});return j}catch{return c?.d||null}}
/* v875: cotações ao vivo da ponte do Profit (mesmo CQ.pf do app: {px,d1,em}); só leitura, sem rede extra. */
function pf(){try{return typeof CQ!=='undefined'&&CQ?.pf?CQ.pf:{}}catch{return {}}}
function aplicaProfit(){if(!st.rows)return 0;const P=pf();let n=0;for(const r of st.rows.rows){const q=P[r.ticker];if(q&&q.px>0){r.preco=q.px;r.d1=q.d1;r.profit=1;n++}else r.profit=0}
 st.nProfit=n;if(st.X){const ra=rotacaoArquivo(st.rows,st.X);if(ra)st.rot=ra}return n}
function rotacaoArquivo(D,X){const R=X?.retornos;if(!R||!Object.keys(R).length)return null;const s={};let data='';
 for(const[setor,l]of Object.entries(D.porSetor)){const v=l.filter(r=>r.cap&&R[r.ticker]);if(!v.length)continue;const o={n:l.length};
  const val=(r,k)=>k==='1D'&&r.profit&&r.d1!=null?r.d1:R[r.ticker]?.[k];for(const[k]of PER){const q=v.filter(r=>val(r,k)!=null),tw=q.reduce((a,r)=>a+r.cap,0);o[k]=tw?q.reduce((a,r)=>a+r.cap*val(r,k),0)/tw:null}
  v.forEach(r=>{if(R[r.ticker].data>data)data=R[r.ticker].data});s[setor]=o}
 return {at:Date.parse(X.gerado_em)||Date.now(),s,arquivo:1,data}}
async function carregar(force){
 if(st.rows&&!force)return;if(st.loading)return;st.loading=true;st.erro='';render();
 try{const fn=w.DiarioScreeners?.universo;if(!fn)throw Error('Screener ainda carregando');
  const res=await fn('br');if(!res?.rows?.length)throw Error('Snapshot do Screener indisponível');
  st.ref=res.reference;const X=await extra();st.X=X;st.rows=enrich(res.rows,X);const ra=rotacaoArquivo(st.rows,X);if(ra)st.rot=ra;
 }catch(e){st.erro=e.message||String(e)}st.loading=false;render();
}

/* ---------- rankings ---------- */
function filtrados(){
 const f=st.f,q=f.q.trim().toUpperCase(),pr=PRESETS[f.preset];
 let l=st.rows.rows.filter(r=>(!q||r.ticker.includes(q)||r.empresa.toUpperCase().includes(q))&&(!f.setor||r.setor===f.setor)&&(!f.porte||r.porte===f.porte)&&
  (!f.nota||(r.nota??-1)>=f.nota)&&(!f.liq||(r.liquidez??0)>=f.liq)&&(!pr||pr.f(r)));
 const k=f.sort,dir=f.dir;
 l.sort((a,b)=>{let x=k==='ticker'||k==='setor'||k==='porte'?a[k]:valor(a,k),y=k==='ticker'||k==='setor'||k==='porte'?b[k]:valor(b,k);
  if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return(typeof x==='string'?x.localeCompare(y):x-y)*dir});
 return l;
}
function valor(r,k){if(['graham','bazin','gordon','justo','proprio'].includes(k))return r[k]&&r.preco?r[k]/r.preco-1:null;return k==='balanco'?(r.balanco?Date.parse(r.balanco):null):r[k]}
function justoCel(v,p){if(v==null)return '<td class="ap-n">—</td>';const u=p?(v/p-1)*100:null;return '<td class="ap-n"><span class="ap-est">~'+fmt(v)+'</span><small class="'+cor(u)+'">'+sinal(u,0)+'</small></td>'}
function notaCel(n){if(n==null)return '<td>—</td>';const p=Math.round(n/4*100);return '<td><span class="ap-nota" style="--p:'+p+'">'+fmt(n,2)+'</span></td>'}
function cel(r,k){
 switch(k){case 'nota':return notaCel(r.nota);case 'setor':return '<td class="ap-up">'+E(r.setor)+'</td>';case 'porte':return '<td>'+E(r.porte||'—')+'</td>';
  case 'crowded':return '<td class="ap-n"><span class="ap-pill'+(r.crowded>150?' hot':'')+'">'+(r.crowded==null?'—':fmt(r.crowded,0)+'%')+'</span></td>';
  case 'preco':return '<td class="ap-n">'+brl(r.preco)+(r.profit&&r.d1!=null?'<small class="'+cor(r.d1)+'"> '+sinal(r.d1,2)+'</small>':'')+'</td>';case 'graham':case 'bazin':case 'gordon':case 'justo':case 'proprio':return justoCel(r[k],r.preco);
  case 'pl':case 'pvp':case 'ev_ebitda':case 'div_liq_ebitda':return '<td class="ap-n">'+(r[k]==null?'—':fmt(r[k],1)+'x')+'</td>';
  case 'g1':case 'cagr3':return '<td class="ap-n '+cor(r[k])+'">'+sinal(r[k])+'</td>';case 'pegC':return '<td class="ap-n">'+fmt(r.pegC,2)+'</td>';case 'dy':case 'payout':case 'roe':case 'roic':case 'margem_liquida':case 'fcf_yield':return '<td class="ap-n">'+pct(r[k])+'</td>';
  case 'momentum':case 'mm200':return '<td class="ap-n '+cor(r[k])+'">'+sinal(r[k])+'</td>';case 'rsi':return '<td class="ap-n">'+fmt(r.rsi,0)+'</td>';
  case 'lpa':case 'vpa':case 'dpa':return '<td class="ap-n">'+fmt(r[k])+'</td>';case 'liquidez':return '<td class="ap-n">'+cmp(r.liquidez)+'</td>';
  case 'cap':return '<td class="ap-n">'+cmp(r.cap)+'</td>';case 'balanco':return '<td>'+E(String(r.balanco).slice(0,10)||'—')+'</td>'}return '<td>—</td>'}
function viewRank(){
 const f=st.f,l=filtrados(),tot=l.length,pg=f.pg,pages=Math.max(1,Math.ceil(tot/pg));if(f.page>=pages)f.page=0;
 const pag=l.slice(f.page*pg,f.page*pg+pg),setores=Object.keys(st.rows.porSetor).sort(),cols=COLS.filter(c=>vis.includes(c[0]));
 const th=(k,t)=>'<th data-ap-sort="'+k+'" class="'+(f.sort===k?'on':'')+'">'+t+(f.sort===k?(f.dir<0?' ▾':' ▴'):'')+'</th>';
 return '<div class="ap-rank"><aside class="ap-filtros"><details open><summary>Filtros'+(f.preset||f.setor||f.porte||f.nota||f.liq||f.q?' <button type="button" class="ap-link" data-ap-limpar>Limpar</button>':'')+'</summary>'+
  '<p class="ap-lbl">Screeners por gestor</p>'+Object.entries(PRESETS).map(([k,p])=>'<button type="button" class="ap-preset'+(f.preset===k?' on':'')+'" data-ap-preset="'+k+'"><b>'+p.n+'</b><small>'+p.d+'</small></button>').join('')+
  '<label class="ap-lbl">Setor<select data-ap-f="setor"><option value="">Todos</option>'+setores.map(s=>'<option'+(f.setor===s?' selected':'')+'>'+E(s)+'</option>').join('')+'</select></label>'+
  '<label class="ap-lbl">Porte<select data-ap-f="porte"><option value="">Todos</option>'+['Large','Mid','Small','Micro'].map(s=>'<option'+(f.porte===s?' selected':'')+'>'+s+'</option>').join('')+'</select></label>'+
  '<label class="ap-lbl">Nota Raio-X mínima <b>'+fmt(f.nota,1)+'</b><input type="range" min="0" max="4" step=".25" value="'+f.nota+'" data-ap-f="nota"></label>'+
  '<label class="ap-lbl">Liquidez diária mínima<select data-ap-f="liq">'+[[0,'Qualquer'],[1e5,'R$ 100 mil'],[1e6,'R$ 1 mi'],[5e6,'R$ 5 mi'],[2e7,'R$ 20 mi']].map(([v,t])=>'<option value="'+v+'"'+(Number(f.liq)===v?' selected':'')+'>'+t+'</option>').join('')+'</select></label>'+
  '</details></aside><section class="ap-tabela"><div class="ap-bar"><input type="search" placeholder="Buscar ticker ou empresa…" value="'+E(f.q)+'" data-ap-f="q" class="ap-busca">'+
  '<details class="ap-cols"><summary class="btn s">Colunas</summary><div>'+COLS.map(c=>'<label><input type="checkbox" data-ap-col="'+c[0]+'"'+(vis.includes(c[0])?' checked':'')+'> '+c[1]+'</label>').join('')+'</div></details>'+
  '<select data-ap-f="pg">'+[30,50,100].map(n=>'<option value="'+n+'"'+(pg===n?' selected':'')+'>'+n+'/pág</option>').join('')+'</select>'+
  (st.nProfit?'<span class="ap-tag st-ativa">Profit ao vivo · '+st.nProfit+'</span>':'')+'<button type="button" class="btn s" data-ap-csv>Exportar CSV</button><span class="ap-mut">'+(tot?f.page*pg+1:0)+'–'+Math.min(tot,f.page*pg+pg)+' de '+tot+'</span>'+
  '<button type="button" class="btn s" data-ap-page="-1"'+(f.page?'':' disabled')+'>‹</button><button type="button" class="btn s" data-ap-page="1"'+(f.page<pages-1?'':' disabled')+'>›</button></div>'+
  '<p class="ap-mut ap-leg">~ = estimado no aparelho (Graham √22,5·LPA·VPA · Bazin DPA÷6% · Gordon k 10%, g 4%) · Nota Raio-X 0–4 por percentis do mercado · Crowded = giro ÷ mediana do mercado</p>'+
  '<div class="ap-scroll"><table class="ap-t"><thead><tr><th class="ap-stk" data-ap-sort="ticker">Ativo</th>'+cols.map(c=>th(c[0],c[1])).join('')+'</tr></thead><tbody>'+
  (pag.length?pag.map(r=>'<tr data-ap-ativo="'+r.ticker+'"><td class="ap-stk">'+logo(r.ticker)+'<b>'+r.ticker+'</b><small>'+E(r.empresa)+'</small></td>'+cols.map(c=>cel(r,c[0])).join('')+'</tr>').join(''):
   '<tr><td colspan="'+(cols.length+1)+'" class="ap-vazio">Nenhum ativo passa nesses filtros.</td></tr>')+'</tbody></table></div></section></div>';
}
function csv(){const cols=COLS.filter(c=>vis.includes(c[0])),l=filtrados(),q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const lin=[['Ticker','Empresa',...cols.map(c=>c[1])].map(q).join(';')].concat(l.map(r=>[r.ticker,r.empresa,...cols.map(c=>{const v=['setor','porte','balanco'].includes(c[0])?r[c[0]]:r[c[0]];return typeof v==='number'?String(Math.round(v*100)/100).replace('.',','):v})].map(q).join(';')));
 const a=d.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+lin.join('\n')],{type:'text/csv;charset=utf-8'}));a.download='rankings-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}

/* ---------- radar ---------- */
function listasRadar(){
 const D=st.rows,pf=st.radarPorte,sf=st.radarSetor,base=D.rows.filter(r=>(!pf||r.porte===pf)&&(!sf||r.setor===sf)&&r.preco);
 const risco=r=>(r.div_liq_ebitda!=null&&r.div_liq_ebitda>3.5)||(r.momentum!=null&&r.momentum<-10&&r.div_liq_ebitda!=null&&r.div_liq_ebitda>2);
 const dist=base.filter(r=>r.pl>0&&D.medPL[r.setor]&&r.pl<D.medPL[r.setor]*.5),rep=base.filter(r=>r.g1>10&&r.roic>10&&r.pl>0&&r.pl<20),
  peg=base.filter(r=>r.pegC>0&&r.pegC<1),ign=base.filter(r=>(r.porte==='Small'||r.porte==='Micro')&&r.crowded!=null&&r.crowded<80&&(r.nota??0)>=2),
  ris=base.filter(risco),sD=new Set(dist.map(r=>r.ticker)),outros=new Set([...rep,...peg,...ign].map(r=>r.ticker)),
  op=base.filter(r=>sD.has(r.ticker)&&outros.has(r.ticker)&&!risco(r)),ok=base.filter(r=>!risco(r));
 const top=(l,k,asc)=>l.filter(r=>r[k]!=null&&(k!=='pl'||r.pl>0)&&(k!=='dy'||r.dy>0)).sort((a,b)=>asc?a[k]-b[k]:b[k]-a[k]).slice(0,20);
 return {op,rep,dist,peg,ign,ris,tops:[['Top Value (P/L)','Menor P/L',top(ok,'pl',1),r=>fmt(r.pl,1)+'x'],['Top Quality (ROE)','Maior ROE',top(ok,'roe'),r=>pct(r.roe)],
  ['Top Yield','Maior dividend yield',top(ok,'dy'),r=>pct(r.dy)],['Top Crowded','Mais negociadas vs porte',top(ok,'crowded'),r=>fmt(r.crowded,0)+'%']]};
}
function cardsLista(t,desc,l,met,tone){return '<section class="ap-lista'+(tone?' '+tone:'')+'"><header><h3>'+t+' <span>('+l.length+')</span></h3><p>'+desc+'</p></header><div class="ap-chips">'+
 (l.length?l.slice(0,80).map(r=>'<button type="button" data-ap-ativo="'+r.ticker+'"><b>'+r.ticker+'</b><small>'+E(r.setor)+'</small><em>'+met(r)+'</em></button>').join(''):'<p class="ap-mut">Nada detectado.</p>')+'</div></section>'}
const PER=[['1D',1],['7D',5],['1M',21],['6M',126],['12M',252],['YTD',0]];
function retornos(cl){if(!cl?.length)return null;const u=cl[cl.length-1].c,ano=String(new Date().getFullYear()),o={};
 for(const[k,n]of PER){let b;if(k==='YTD'){const i=cl.findIndex(x=>x.d.startsWith(ano));b=i>0?cl[i-1].c:i===0?cl[0].c:null}else b=cl.length>n?cl[cl.length-1-n].c:null;o[k]=b?(u/b-1)*100:null}return o}
async function rotacao(){
 if(st.rotLoading||!st.rows||!w.DiarioTecnico?.serie)return;st.rotLoading=true;render();
 const set=[];for(const[s,l]of Object.entries(st.rows.porSetor)){l.filter(r=>r.cap&&r.liquidez>2e6).sort((a,b)=>b.cap-a.cap).slice(0,6).forEach(r=>set.push([s,r]))}
 const res={};let i=0;const worker=async()=>{while(i<set.length){const[s,r]=set[i++];try{const sr=await w.DiarioTecnico.serie(r.ticker,'br'),ret=retornos(sr?.closes);if(ret)(res[s]=res[s]||[]).push([r.cap,ret])}catch{}}};
 await Promise.all([1,2,3,4].map(worker));
 const out={};for(const[s,l]of Object.entries(res)){const o={n:st.rows.porSetor[s].length};for(const[k]of PER){const v=l.filter(x=>x[1][k]!=null),tw=v.reduce((a,x)=>a+x[0],0);o[k]=tw?v.reduce((a,x)=>a+x[0]*x[1][k],0)/tw:null}out[s]=o}
 st.rot={at:Date.now(),s:out};ls.set(K_ROT,st.rot);st.rotLoading=false;render();
}
function heat(v,max){if(v==null)return '';const a=Math.min(1,Math.abs(v)/(max||1))*.55+.06;return 'background:rgba('+(v>=0?'16,185,129':'239,68,68')+','+a.toFixed(2)+')'}
function viewRadar(){
 const R=listasRadar(),rot=st.rot?.s,mx={};
 if(rot)for(const[k]of PER)mx[k]=Math.max(...Object.values(rot).map(o=>Math.abs(o[k]??0)),.1);
 const lin=rot?Object.entries(rot).sort((a,b)=>(b[1]['1M']??-999)-(a[1]['1M']??-999)):[],forte=lin.slice(0,3),fraco=lin.slice(-3).reverse();
 return '<div class="ap-radar"><section class="ap-card ap-rot"><header><div><h3>Rotação setorial</h3><p>Retorno por setor ponderado por valor de mercado'+(st.rot?.arquivo?' (todas as ações do setor, fechamento de '+E(st.rot.data)+')':' (até 6 maiores líquidas de cada setor)')+'. Clique num setor para filtrar o Radar.</p></div>'+
  (st.rot?.arquivo?'':'<button type="button" class="btn s" data-ap-rot'+(st.rotLoading?' disabled':'')+'>'+(st.rotLoading?'Calculando…':rot?'Atualizar':'Calcular rotação')+'</button>')+'</header>'+
  (rot?'<div class="ap-rotgrid"><div class="ap-scroll"><table class="ap-t ap-heat"><thead><tr><th>Setor</th><th>Ações</th>'+PER.map(p=>'<th>'+p[0]+'</th>').join('')+'</tr></thead><tbody>'+
   lin.map(([s,o])=>'<tr data-ap-setor="'+E(s)+'" class="'+(st.radarSetor===s?'on':'')+'"><td>'+E(s)+'</td><td class="ap-n">'+o.n+'</td>'+PER.map(p=>'<td class="ap-n" style="'+heat(o[p[0]],mx[p[0]])+'">'+sinal(o[p[0]])+'</td>').join('')+'</tr>').join('')+
   '</tbody></table></div><aside class="ap-dest"><p class="ap-lbl">Mais fortes · mês</p>'+forte.map(([s,o])=>'<div><span>'+E(s)+'</span><b class="'+cor(o['1M'])+'">'+sinal(o['1M'])+'</b></div>').join('')+
   '<p class="ap-lbl">Mais fracos · mês</p>'+fraco.map(([s,o])=>'<div><span>'+E(s)+'</span><b class="'+cor(o['1M'])+'">'+sinal(o['1M'])+'</b></div>').join('')+
   '<p class="ap-mut">Calculado em '+new Date(st.rot.at).toLocaleString('pt-BR')+(st.nProfit?' · 1D ao vivo pelo Profit ('+st.nProfit+' ativos)':'')+'</p>'+(st.X?.retornos?'<button type="button" class="btn s" data-ap-faltam>Copiar tickers sem cotação</button>':'')+'</aside></div>':'<p class="ap-mut">'+(st.rotLoading?'Buscando séries diárias…':'Toque em "Calcular rotação" (usa o cache de cotações do Técnico).')+'</p>')+'</section>'+
  '<div class="ap-bar"><b>Radar &amp; Distorções</b>'+['','Large','Mid','Small','Micro'].map(p=>'<button type="button" class="ap-chip'+(st.radarPorte===p?' on':'')+'" data-ap-rporte="'+p+'">'+(p||'Todas')+'</button>').join('')+
  (st.radarSetor?'<button type="button" class="ap-chip on" data-ap-setor="">'+E(st.radarSetor)+' ✕</button>':'')+'</div>'+
  cardsLista('Oportunidades claras','Em Distorções de valuation e em pelo menos mais um radar (Reprecificação, PEG ou Ignoradas), sem risco elevado. Convergência reduz falsos positivos.',R.op,r=>'Nota '+fmt(r.nota,1),'dest')+
  cardsLista('Reprecificação (momentum)','Crescimento do lucro > 10% (último exercício CVM), ROIC > 10% e P/L < 20: momentum operacional forte com valuation ainda contido.',R.rep,r=>'Cresc. lucro '+sinal(r.g1,1))+
  cardsLista('Distorções de valuation','P/L abaixo de 50% da mediana do setor. Desconto excessivo ou deterioração: analise caso a caso.',R.dist,r=>'P/L '+fmt(r.pl,1))+
  cardsLista('PEG Ratio (< 1)','PEG = P/L ÷ crescimento anual médio do lucro nos últimos 3 anos (%). Fica de fora quem teve prejuízo em algum dos 4 anos ou está com balanço desatualizado.',R.peg,r=>'PEG '+fmt(r.pegC,2))+
  cardsLista('Small caps ignoradas','Small e Micro com crowded < 80% e nota ≥ 2: pouca cobertura, possível ineficiência.',R.ign,r=>'Crowded '+fmt(r.crowded,0)+'%')+
  cardsLista('Riscos elevados','DL/EBITDA > 3,5x, ou momentum < −10% com DL/EBITDA > 2x.',R.ris,r=>'DL/EBITDA '+fmt(r.div_liq_ebitda,1),'risco')+
  '<h3 class="ap-h">Rankings <small>Top 20 por métrica, sem riscos elevados</small></h3><div class="ap-tops">'+R.tops.map(([t,s,l,m])=>'<section class="ap-card"><h4>'+t+'</h4><p class="ap-mut">'+s+'</p><ol>'+
  l.map(r=>'<li data-ap-ativo="'+r.ticker+'"><b>'+r.ticker+'</b><span>'+m(r)+'</span></li>').join('')+'</ol></section>').join('')+'</div>'+
  '<p class="ap-mut">Filtros estatísticos para investigar, não recomendação de compra ou venda.</p></div>';
}

/* ---------- página do ativo ---------- */
async function carregaSerie(tk){if(st.serie[tk]||!w.DiarioTecnico?.serie)return;st.serie[tk]={loading:1};render();
 try{const r=await w.DiarioTecnico.serie(tk,'br');st.serie[tk]={c:r?.closes||[],src:r?.source}}catch(e){st.serie[tk]={c:[],erro:e.message}}render()}
function grafico(r){
 const s=st.serie[r.ticker];if(!s||s.loading)return '<div class="ap-graf ap-mut">Carregando cotações…</div>';if(!s.c.length)return '<div class="ap-graf ap-mut">Sem série diária disponível.</div>';
 const n={'1M':21,'3M':63,'6M':126,'1A':252,'3A':756,'Máx':1e9}[st.per]||252,c=s.c.slice(-n),ib=st.ibov&&st.serie.BOVA11?.c?.length?st.serie.BOVA11.c:null;
 const W=760,H=260,P=34,ys=c.map(x=>x.c);let lines=[],lo,hi;
 if(ib){const m=new Map(ib.map(x=>[x.d,x.c])),b0=c.find(x=>m.has(x.d)),i0=b0?m.get(b0.d):null,p0=c[0].c;
  const a=c.map(x=>(x.c/p0-1)*100),b=c.map(x=>m.has(x.d)&&i0?(m.get(x.d)/i0-1)*100:null);lo=Math.min(...a,...b.filter(x=>x!=null));hi=Math.max(...a,...b.filter(x=>x!=null));lines=[[a,'ap-l1'],[b,'ap-l2']]}
 else{lo=Math.min(...ys);hi=Math.max(...ys);if(r.justo){lo=Math.min(lo,r.justo);hi=Math.max(hi,r.justo)}lines=[[ys,'ap-l1']]}
 const pad=(hi-lo)*.06||1;lo-=pad;hi+=pad;const X=i=>P+(W-P-8)*i/Math.max(1,c.length-1),Y=v=>8+(H-30)*(1-(v-lo)/(hi-lo));
 const path=l=>{let o='',m=0;l.forEach((v,i)=>{if(v==null){m=0;return}o+=(m?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1);m=1});return o};
 const gr=[0,.25,.5,.75,1].map(t=>lo+(hi-lo)*t),u=ys[ys.length-1],var_=(u/ys[0]-1)*100,mi=Math.min(...ys),ma=Math.max(...ys);
 return '<div class="ap-graf"><div class="ap-bar">'+['1M','3M','6M','1A','3A','Máx'].map(p=>'<button type="button" class="ap-chip'+(st.per===p?' on':'')+'" data-ap-per="'+p+'">'+p+'</button>').join('')+
  '<button type="button" class="ap-chip'+(st.ibov?' on':'')+'" data-ap-ibov>Comparar IBOV (BOVA11)</button></div>'+
  '<div class="ap-stats"><div><span>Início '+E(c[0].d)+'</span><b>'+brl(ys[0])+'</b></div><div><span>Mínima</span><b>'+brl(mi)+'</b></div><div><span>Máxima</span><b>'+brl(ma)+'</b></div><div><span>No período</span><b class="'+cor(var_)+'">'+sinal(var_)+'</b></div></div>'+
  '<svg viewBox="0 0 '+W+' '+H+'" class="ap-svg" role="img" aria-label="Cotação de '+r.ticker+'">'+gr.map(v=>'<line x1="'+P+'" x2="'+(W-8)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" class="ap-grid"/><text x="2" y="'+(Y(v)+4)+'" class="ap-ax">'+(ib?fmt(v,0)+'%':fmt(v,v<10?2:0))+'</text>').join('')+
  (!ib&&r.justo?'<line x1="'+P+'" x2="'+(W-8)+'" y1="'+Y(r.justo)+'" y2="'+Y(r.justo)+'" class="ap-justo"/><text x="'+(W-10)+'" y="'+(Y(r.justo)-5)+'" text-anchor="end" class="ap-ax ap-am">Justo médio ~'+fmt(r.justo)+'</text>':'')+
  lines.map(([l,c2])=>'<path d="'+path(l)+'" class="'+c2+'"/>').join('')+'<text x="'+P+'" y="'+(H-6)+'" class="ap-ax">'+E(c[0].d)+'</text><text x="'+(W-8)+'" y="'+(H-6)+'" text-anchor="end" class="ap-ax">'+E(c[c.length-1].d)+'</text></svg>'+
  (ib?'<p class="ap-mut"><span class="ap-k1"></span>'+r.ticker+' <span class="ap-k2"></span>BOVA11 · retorno acumulado no período</p>':'')+'</div>';
}
function radarSvg(r){const ks=Object.keys(r.eixos),C=130,R0=100,pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/ks.length;return[C+Math.cos(a)*R0*v,C+Math.sin(a)*R0*v]};
 const poly=v=>ks.map((k,i)=>pt(i,v(k)).map(x=>x.toFixed(1)).join(',')).join(' ');
 return '<svg viewBox="0 0 260 260" class="ap-radarsvg">'+[.25,.5,.75,1].map(t=>'<polygon points="'+poly(()=>t)+'" class="ap-grid"/>').join('')+
  '<polygon points="'+poly(k=>(r.eixos[k]??0)/4)+'" class="ap-area"/>'+ks.map((k,i)=>{const[x,y]=pt(i,1.16);return '<text x="'+x.toFixed(0)+'" y="'+y.toFixed(0)+'" text-anchor="middle" class="ap-ax">'+k+' '+(r.eixos[k]==null?'—':fmt(r.eixos[k],1))+'</text>'}).join('')+'</svg>'}
function raiox(r){const pares=st.rows.porSetor[r.setor]||[],M=[['P/L','pl',0,'x'],['P/VP','pvp',0,'x'],['EV/EBITDA','ev_ebitda',0,'x'],['DY','dy',1,'%'],['Payout','payout',null,'%'],['ROE','roe',1,'%'],['ROIC','roic',1,'%'],
  ['Margem líquida','margem_liquida',1,'%'],['FCF yield','fcf_yield',1,'%'],['DL/EBITDA','div_liq_ebitda',0,'x'],['Momentum 12m','momentum',1,'%'],['Dist. MM200','mm200',null,'%'],['RSI 14','rsi',null,'']];
 const pos=(k,hb)=>{if(hb==null||r[k]==null)return '—';const v=pares.map(p=>p[k]).filter(x=>x!=null&&(k!=='pl'||x>0));if(v.length<3)return '—';const melhor=v.filter(x=>hb?x<r[k]:x>r[k]).length;return Math.round(melhor/(v.length-1)*100)+'º pct'};
 return '<div class="ap-2"><section class="ap-card"><h3>Nota Raio-X <b class="ap-big">'+(r.nota==null?'—':fmt(r.nota,2))+'</b><small>/ 4</small></h3>'+radarSvg(r)+
  '<p class="ap-mut">Cada eixo = percentil do ativo no mercado (0–4). Cálculo próprio do app com o snapshot do Screener; não é recomendação.</p></section>'+
  '<section class="ap-card"><h3>Comparar com pares · '+E(r.setor)+' <small>('+pares.length+')</small></h3><div class="ap-scroll"><table class="ap-t"><thead><tr><th>Métrica</th><th>'+r.ticker+'</th><th>Mediana setor</th><th>Posição</th></tr></thead><tbody>'+
  M.map(([t,k,hb,u])=>'<tr><td>'+t+'</td><td class="ap-n">'+(r[k]==null?'—':fmt(r[k],u==='x'?1:1)+u)+'</td><td class="ap-n">'+(()=>{const m=median(pares.map(p=>k==='pl'&&!(p.pl>0)?null:p[k]));return m==null?'—':fmt(m,1)+u})()+'</td><td class="ap-n">'+pos(k,hb===0?true:hb===1?false:null)+'</td></tr>').join('')+
  '</tbody></table></div></section></div>'}
function calcs(r){const lucro=r.cap&&r.pl>0?r.cap/r.pl:null,acoes=r.cap&&r.preco?r.cap/r.preco:null;
 const inp=(k,v,l,s='any')=>'<label>'+l+'<input type="number" step="'+s+'" data-ap-calc="'+k+'" value="'+(v==null?'':Math.round(v*1e4)/1e4)+'"></label>';
 return '<div class="ap-calcs" data-preco="'+(r.preco||'')+'">'+
  '<section class="ap-card" data-calc="graham"><h4>Graham</h4><p class="ap-mut">√(22,5 × LPA × VPA)</p>'+inp('lpa',r.lpa,'LPA (R$)')+inp('vpa',r.vpa,'VPA (R$)')+'<p class="ap-res"></p></section>'+
  '<section class="ap-card" data-calc="bazin"><h4>Bazin</h4><p class="ap-mut">DPA ÷ yield mínimo</p>'+inp('dpa',r.dpa,'DPA 12m (R$)')+inp('y',6,'Yield mínimo (%)')+'<p class="ap-res"></p></section>'+
  '<section class="ap-card" data-calc="gordon"><h4>Gordon</h4><p class="ap-mut">DPA × (1+g) ÷ (k − g)</p>'+inp('dpa',r.dpa,'DPA 12m (R$)')+inp('k',10,'Retorno exigido k (%)')+inp('g',4,'Crescimento g (%)')+'<p class="ap-res"></p></section>'+
  '<section class="ap-card" data-calc="novo"><h4>Novo Bazin (seu método)</h4><p class="ap-mut">(lucro projetado × payout ÷ nº de ações) ÷ yield desejado</p>'+inp('l',lucro,'Lucro projetado (R$)')+inp('p',r.payout??50,'Payout (%)')+inp('a',acoes,'Nº de ações')+inp('y',7,'Yield desejado (%)')+'<p class="ap-res"></p></section></div>'+
  '<p class="ap-mut">Valores pré-preenchidos com o snapshot (lucro = valor de mercado ÷ P/L, últimos 12 meses). Edite para simular.</p>'}
function calcRun(root){if(!root)return;const p=Number(root.dataset.preco);root.querySelectorAll('[data-calc]').forEach(s=>{const g=k=>Number(s.querySelector('[data-ap-calc="'+k+'"]')?.value);let v=null;
 switch(s.dataset.calc){case 'graham':v=g('lpa')>0&&g('vpa')>0?Math.sqrt(22.5*g('lpa')*g('vpa')):null;break;case 'bazin':v=g('dpa')>0&&g('y')>0?g('dpa')/(g('y')/100):null;break;
  case 'gordon':v=g('dpa')>0&&g('k')>g('g')?g('dpa')*(1+g('g')/100)/((g('k')-g('g'))/100):null;break;case 'novo':v=g('l')>0&&g('a')>0&&g('y')>0?g('l')*(g('p')/100)/g('a')/(g('y')/100):null}
 const u=v&&p?(v/p-1)*100:null;s.querySelector('.ap-res').innerHTML=v==null?'<span class="ap-mut">Dados insuficientes</span>':'Preço justo <b>'+brl(v)+'</b> <span class="'+cor(u)+'">'+(u==null?'':(u>=0?'margem ':'acima em ')+fmt(Math.abs(u),1)+'%')+'</span>'})}
function viewAtivo(){
 const r=st.rows.map.get(st.tk);if(!r)return '<p class="ap-mut">Ativo '+E(st.tk)+' fora do universo do Screener. <button type="button" class="ap-link" data-ap-voltar>Voltar</button></p>';
 const u=r.justo&&r.preco?(r.justo/r.preco-1)*100:null,tese=teses().find(t=>t.tk===r.ticker&&t.status==='ativa');
 const subs=[['visao','Visão geral'],['raiox','Raio-X'],['div','Dividendos e preço justo'],['empresa','Empresa']];
 let body='';
 if(st.sub==='visao')body='<div class="ap-2 ap-2w"><section class="ap-card"><h3>Cotação</h3>'+grafico(r)+'</section><section class="ap-card"><h3>Resumo</h3><div class="ap-kv">'+
  [['Nota Raio-X',r.nota==null?'—':fmt(r.nota,2)+' / 4'],['P/L',r.pl==null?'—':fmt(r.pl,1)+'x'],['P/VP',r.pvp==null?'—':fmt(r.pvp,2)+'x'],['DY',pct(r.dy)],['ROE',pct(r.roe)],['ROIC',pct(r.roic)],
   ['DL/EBITDA',r.div_liq_ebitda==null?'—':fmt(r.div_liq_ebitda,1)+'x'],['Momentum 12m',sinal(r.momentum)],['RSI 14',fmt(r.rsi,0)],['Crowded',r.crowded==null?'—':fmt(r.crowded,0)+'%']].map(([k,v])=>'<div><span>'+k+'</span><b>'+v+'</b></div>').join('')+'</div>'+
  '<h4>Preço justo</h4><div class="ap-kv">'+[['Graham',r.graham],['Bazin',r.bazin],['Gordon',r.gordon],['Teto próprio',r.proprio]].map(([k,v])=>'<div><span>'+k+'</span><b>'+(v==null?'—':'~'+fmt(v)+' <small class="'+cor(r.preco?(v/r.preco-1):null)+'">'+sinal(r.preco?(v/r.preco-1)*100:null,0)+'</small>')+'</b></div>').join('')+'</div>'+
  '<h4>Minha tese</h4>'+(tese?'<p>Alvo <b>'+brl(tese.alvo)+'</b> · '+E(tese.texto).slice(0,160)+'</p>':'<p class="ap-mut">Sem tese para '+r.ticker+'.</p>')+'<button type="button" class="btn s" data-ap-novatese="'+r.ticker+'">'+(tese?'Editar tese':'Nova tese')+'</button></section></div>';
 else if(st.sub==='raiox')body=raiox(r);else if(st.sub==='div')body=calcs(r);
 else body='<section class="ap-card"><h3>'+E(r.empresa||r.ticker)+'</h3><div class="ap-kv">'+[['Setor',r.setor],['Segmento',r.segmento||'—'],['Porte',r.porte||'—'],['Valor de mercado',cmp(r.cap)],['Liquidez diária',cmp(r.liquidez)],
  ['Ações (estimado)',r.cap&&r.preco?fmt(r.cap/r.preco,0):'—'],['Lucro 12m (estimado)',r.cap&&r.pl>0?cmp(r.cap/r.pl):'—'],['Balanço de referência',String(r.balanco).slice(0,10)||'—'],['Fonte',r.raw.fonte_principal||r.raw.source||'Screener público']].map(([k,v])=>'<div><span>'+k+'</span><b>'+E(v)+'</b></div>').join('')+'</div>'+
  (r.raw.documento_balanco_url?'<p><a href="'+E(r.raw.documento_balanco_url)+'" target="_blank" rel="noopener">Abrir documento na CVM ↗</a></p>':'')+'</section>';
 return '<div class="ap-ativo"><header class="ap-hero"><div><button type="button" class="ap-link" data-ap-voltar>← Voltar</button><h2>'+logo(r.ticker)+r.ticker+' <span class="ap-tag">'+E(r.setor)+'</span>'+(r.porte?'<span class="ap-tag">'+r.porte+' Cap</span>':'')+'</h2><p class="ap-mut">'+E(r.empresa)+'</p></div>'+
  '<div class="ap-hk"><div><span>Cotação</span><b>'+brl(r.preco)+'</b></div><div><span>Justo médio (3 métodos)</span><b>~'+fmt(r.justo)+' <small class="'+cor(u)+'">'+sinal(u,0)+'</small></b></div></div>'+
  '<div class="ap-acoes"><button type="button" class="ui-cta" data-dt815="foco" data-tk="'+r.ticker+'">Gráfico no Terminal</button><button type="button" class="btn s" data-hf-abrir="'+r.ticker+'" data-hf-market="BR">Histórico 10 anos</button><button type="button" class="btn s" data-ap-ia="'+r.ticker+'">Analisar com IA</button></div></header>'+
  '<nav class="ap-subs" role="tablist">'+subs.map(([k,t])=>'<button type="button" role="tab" data-ap-sub="'+k+'" class="'+(st.sub===k?'on':'')+'">'+t+'</button>').join('')+'</nav>'+body+'</div>';
}

/* ---------- teses ---------- */
const teses=()=>ls.get(K_TESES,[]);
function viewTeses(){
 const l=teses(),ed=st.teseEdit,map=st.rows?.map;
 const form=ed?'<section class="ap-card ap-form"><h3>'+(ed.id?'Editar tese':'Nova tese')+'</h3><div class="ap-fgrid">'+
  [['tk','Ativo','text',ed.tk],['entrada','Preço de entrada (R$)','number',ed.entrada],['alvo','Preço-alvo (R$)','number',ed.alvo],['stop','Invalida abaixo de (R$)','number',ed.stop],['horizonte','Horizonte','text',ed.horizonte||'12 meses']].map(([k,t,ty,v])=>'<label>'+t+'<input type="'+ty+'" step="any" data-ap-tf="'+k+'" value="'+E(v??'')+'"></label>').join('')+
  '<label>Status<select data-ap-tf="status">'+['ativa','realizada','invalidada'].map(s=>'<option'+(ed.status===s?' selected':'')+'>'+s+'</option>').join('')+'</select></label></div>'+
  '<label>Tese (por que comprar)<textarea rows="3" data-ap-tf="texto" placeholder="Ex.: ROE alto, dívida controlada, desconto vs pares">'+E(ed.texto||'')+'</textarea></label>'+
  '<label>Critérios para acompanhar (1 por linha)<textarea rows="3" data-ap-tf="criterios" placeholder="ROE > 15%&#10;DL/EBITDA < 2x">'+E(ed.criterios||'')+'</textarea></label>'+
  '<label>Riscos<textarea rows="2" data-ap-tf="riscos">'+E(ed.riscos||'')+'</textarea></label><div class="ap-bar"><button type="button" class="ui-cta" data-ap-tsalvar>Salvar tese</button><button type="button" class="btn s" data-ap-tcancel>Cancelar</button></div></section>':'';
 const card=t=>{const r=map?.get(t.tk),p=r?.preco,prog=p&&t.entrada&&t.alvo&&t.alvo!==t.entrada?Math.max(0,Math.min(100,(p-t.entrada)/(t.alvo-t.entrada)*100)):null,up=p&&t.alvo?(t.alvo/p-1)*100:null;
  return '<article class="ap-card ap-tese"><header><h4 data-ap-ativo="'+E(t.tk)+'">'+logo(t.tk)+E(t.tk)+'</h4><span class="ap-tag st-'+E(t.status)+'">'+E(t.status)+'</span></header>'+
   '<div class="ap-kv"><div><span>Atual</span><b>'+brl(p)+'</b></div><div><span>Entrada</span><b>'+brl(N(t.entrada))+'</b></div><div><span>Alvo</span><b>'+brl(N(t.alvo))+' <small class="'+cor(up)+'">'+sinal(up,0)+'</small></b></div><div><span>Horizonte</span><b>'+E(t.horizonte||'—')+'</b></div></div>'+
   (prog!=null?'<div class="ap-prog"><i style="width:'+prog.toFixed(0)+'%"></i></div><p class="ap-mut">'+fmt(prog,0)+'% do caminho até o alvo'+(t.stop&&p&&p<t.stop?' · <b class="ap-r">abaixo do ponto de invalidação</b>':'')+'</p>':'')+
   (t.texto?'<p>'+E(t.texto)+'</p>':'')+(t.criterios?'<ul>'+String(t.criterios).split('\n').filter(Boolean).map(c=>'<li>'+E(c)+'</li>').join('')+'</ul>':'')+(t.riscos?'<p class="ap-mut">Riscos: '+E(t.riscos)+'</p>':'')+
   '<div class="ap-bar"><button type="button" class="btn s" data-ap-tedit="'+t.id+'">Editar</button><button type="button" class="btn s" data-ap-ia="'+E(t.tk)+'">Validar com IA</button><button type="button" class="btn s ap-del" data-ap-tdel="'+t.id+'">'+(st.excluir===t.id?'Confirmar exclusão':'Excluir')+'</button></div></article>'};
 return '<div class="ap-teses"><header class="ap-bar"><div><h3>Minhas teses</h3><p class="ap-mut">'+l.length+' tese(s) · salvas neste aparelho (inclua no backup)</p></div>'+(ed?'':'<button type="button" class="ui-cta" data-ap-novatese="">+ Nova tese</button>')+'</header>'+form+
  (l.length?'<div class="ap-tgrid">'+l.sort((a,b)=>(a.status==='ativa'?0:1)-(b.status==='ativa'?0:1)).map(card).join('')+'</div>':ed?'':'<section class="ap-card ap-vazio"><h4>Nenhuma tese documentada</h4><p class="ap-mut">Faça o valuation na página do ativo, registre aqui o preço-alvo e os critérios e acompanhe a evolução.</p></section>')+'</div>';
}

/* ---------- render ---------- */
function corpo(){
 if(st.erro&&!st.rows)return '<section class="ap-card ap-vazio"><p>'+E(st.erro)+'</p><button type="button" class="btn s" data-ap-recarregar>Tentar de novo</button></section>';
 if(!st.rows)return '<section class="ap-card ap-vazio"><p class="ap-mut">Carregando universo do Screener Brasil…</p></section>';
 if(st.tk)return viewAtivo();
 return st.tab==='radar'?viewRadar():st.tab==='teses'?viewTeses():viewRank();
}
function view(tab){if(tab)st.tab=tab;css();return '<div id="ap-root" class="ap">'+corpo()+'</div>'}
function render(){const el=d.getElementById('ap-root');if(!el)return;aplicaProfit();const sc=el.querySelector('.ap-scroll')?.scrollLeft;el.innerHTML=corpo();if(sc)el.querySelector('.ap-scroll')&&(el.querySelector('.ap-scroll').scrollLeft=sc);
 calcRun(el.querySelector('.ap-calcs'));if(st.tk&&st.sub==='visao'){carregaSerie(st.tk);if(st.ibov)carregaSerie('BOVA11')}
 if(st.tab==='radar'&&st.rows&&!st.rotLoading&&!st.tk&&!st.rot?.arquivo&&(!st.rot||Date.now()-st.rot.at>12*3600000)&&!st._rotTentou){st._rotTentou=1;rotacao()}}
function enter(tab){if(tab)st.tab=tab;st._rotTentou=0;if(tab!=='ativo'&&!st._abrindo)st.tk='';st._abrindo=0;carregar().then(render);render()}
function abrir(tk){st.tk=String(tk||'').toUpperCase();st.sub='visao';st._abrindo=1}
const salvaF=()=>ls.set(K_FILT,{...st.f,q:'',page:0});

d.addEventListener('click',ev=>{const t=ev.target.closest?.('[data-ap-voltar],[data-ap-ativo],[data-ap-sort],[data-ap-preset],[data-ap-limpar],[data-ap-page],[data-ap-csv],[data-ap-rot],[data-ap-rporte],[data-ap-setor],[data-ap-sub],[data-ap-per],[data-ap-ibov],[data-ap-novatese],[data-ap-tsalvar],[data-ap-tcancel],[data-ap-tedit],[data-ap-tdel],[data-ap-ia],[data-ap-recarregar],[data-ap-faltam]');
 if(!t||!t.closest('#ap-root'))return;const ds=t.dataset;
 if('apIa' in ds){w.DiarioAnalises?.command?.('ANALISE '+ds.apIa);d.querySelector('[data-an-sub="pesquisa"]')?.click();return}
 if('apRecarregar' in ds){carregar(true);return}
 if('apFaltam' in ds){const R=st.X?.retornos||{},P=pf(),l=st.rows.rows.filter(r=>!R[r.ticker]&&!P[r.ticker]).map(r=>r.ticker);navigator.clipboard?.writeText(l.join('\n'));t.textContent=l.length+' tickers copiados';return}
 if('apVoltar' in ds){st.tk='';}
 else if('apAtivo' in ds&&!ev.target.closest('button[data-ap-tedit],button[data-ap-tdel]')){st.tk=ds.apAtivo;st.sub='visao';w.DiarioBarraContexto?.definirFoco?.(ds.apAtivo);d.getElementById('ap-root')?.scrollIntoView({block:'start'})}
 else if('apSort' in ds){const k=ds.apSort;if(st.f.sort===k)st.f.dir*=-1;else{st.f.sort=k;st.f.dir=['ticker','setor','porte','pl','pvp','ev_ebitda','div_liq_ebitda'].includes(k)?1:-1}salvaF()}
 else if('apPreset' in ds){st.f.preset=st.f.preset===ds.apPreset?'':ds.apPreset;st.f.page=0;salvaF()}
 else if('apLimpar' in ds){ev.preventDefault();Object.assign(st.f,{q:'',preset:'',setor:'',porte:'',nota:0,liq:0,page:0});salvaF()}
 else if('apPage' in ds)st.f.page+=Number(ds.apPage);
 else if('apCsv' in ds){csv();return}
 else if('apRot' in ds){rotacao();return}
 else if('apRporte' in ds)st.radarPorte=ds.apRporte;
 else if('apSetor' in ds)st.radarSetor=st.radarSetor===ds.apSetor?'':ds.apSetor;
 else if('apSub' in ds)st.sub=ds.apSub;else if('apPer' in ds)st.per=ds.apPer;else if('apIbov' in ds)st.ibov=!st.ibov;
 else if('apNovatese' in ds){const ex=teses().find(x=>x.tk===ds.apNovatese&&x.status==='ativa'),r=st.rows?.map.get(ds.apNovatese);st.teseEdit=ex?{...ex}:{tk:ds.apNovatese,entrada:r?.preco?Math.round(r.preco*100)/100:'',alvo:r?.justo?Math.round(r.justo*100)/100:'',status:'ativa'};st.tk='';st.tab='teses';d.querySelector('[data-an-sub="teses"]:not(.selected)')?.click()}
 else if('apTedit' in ds)st.teseEdit={...teses().find(x=>x.id===ds.apTedit)};
 else if('apTcancel' in ds)st.teseEdit=null;
 else if('apTdel' in ds){if(st.excluir===ds.apTdel){ls.set(K_TESES,teses().filter(x=>x.id!==ds.apTdel));st.excluir=''}else st.excluir=ds.apTdel}
 else if('apTsalvar' in ds){const f=st.teseEdit,tk=String(f.tk||'').trim().toUpperCase();if(!tk){d.querySelector('[data-ap-tf="tk"]')?.focus();return}
  const t={...f,tk,id:f.id||Date.now().toString(36),entrada:N(f.entrada),alvo:N(f.alvo),stop:N(f.stop),atualizada:new Date().toISOString()},l=teses().filter(x=>x.id!==t.id);l.push(t);ls.set(K_TESES,l);st.teseEdit=null}
 render()});
d.addEventListener('click',ev=>{const b=ev.target.closest?.('[data-ap-abrir]');if(b)abrir(b.dataset.apAbrir)},true);
d.addEventListener('input',ev=>{const t=ev.target;if(!t.closest?.('#ap-root'))return;
 if(t.dataset.apCalc!=null){calcRun(t.closest('.ap-calcs'));return}
 if(t.dataset.apTf){st.teseEdit[t.dataset.apTf]=t.value;return}
 if(t.dataset.apF==='q'){st.f.q=t.value;st.f.page=0;clearTimeout(st._q);st._q=setTimeout(()=>{const p=t.selectionStart;render();const i=d.querySelector('#ap-root [data-ap-f="q"]');if(i){i.focus();i.setSelectionRange(p,p)}},250)}
 else if(t.dataset.apF==='nota'){st.f.nota=Number(t.value);t.previousElementSibling&&(t.previousElementSibling.textContent=fmt(st.f.nota,1))}});
d.addEventListener('change',ev=>{const t=ev.target;if(!t.closest?.('#ap-root'))return;
 if(t.dataset.apCol){vis=t.checked?[...new Set([...vis,t.dataset.apCol])]:vis.filter(x=>x!==t.dataset.apCol);vis=COLS.map(c=>c[0]).filter(k=>vis.includes(k));ls.set(K_COLS,vis);render();d.querySelector('#ap-root .ap-cols')?.setAttribute('open','');return}
 if(t.dataset.apTf){st.teseEdit[t.dataset.apTf]=t.value;return}
 const k=t.dataset.apF;if(!k||k==='q')return;st.f[k]=k==='setor'||k==='porte'?t.value:Number(t.value);st.f.page=0;salvaF();render()});

let cssOk=false;function css(){if(cssOk)return;cssOk=true;const s=d.createElement('style');s.id='ap873-css';s.textContent=`
.ap{--b:var(--ui-card,#12151E);--b2:var(--ui-sub,#181C28);--ln:rgba(255,255,255,.06);--am:#F59E0B;--g:#10B981;--r:#EF4444;--mu:#64748B;--tx:#E2E8F0;color:var(--tx);font-variant-numeric:tabular-nums;display:flex;flex-direction:column;gap:16px;min-width:0}
.ap .ap-g{color:var(--g)}.ap .ap-r{color:var(--r)}.ap .ap-am{fill:var(--am)}.ap-mut{color:var(--mu);font-size:12px;margin:4px 0}
.ap-card{background:var(--b);border:1px solid var(--ln);border-radius:4px;padding:16px;min-width:0}.ap-card h3,.ap-card h4{margin:0 0 8px;font-size:14px;color:var(--tx)}
.ap-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.ap-bar h3{margin:0}.ap-h{font-size:15px;margin:8px 0 0}.ap-h small{color:var(--mu);font-weight:400}
.ap-link{background:none;border:0;color:var(--am);cursor:pointer;padding:0;font:inherit;font-size:12px}
.ap-rank{display:grid;grid-template-columns:240px minmax(0,1fr);gap:16px}.ap-filtros details{background:var(--b);border:1px solid var(--ln);border-radius:4px;padding:12px;position:sticky;top:8px}
.ap-filtros summary{font-weight:600;cursor:pointer;display:flex;justify-content:space-between}.ap-lbl{display:block;color:var(--mu);font-size:11px;text-transform:uppercase;letter-spacing:.04em;margin:12px 0 6px}
.ap-lbl select,.ap-lbl input{display:block;width:100%;margin-top:6px;text-transform:none}.ap-lbl b{color:var(--tx)}
.ap select,.ap input[type=search],.ap input[type=number],.ap input[type=text],.ap textarea{background:var(--b2);border:1px solid var(--ln);color:var(--tx);border-radius:4px;padding:8px;font:inherit;font-size:13px;min-height:36px;box-sizing:border-box}
.ap-preset{display:block;width:100%;text-align:left;background:var(--b2);border:1px solid var(--ln);border-left:2px solid transparent;border-radius:4px;color:var(--tx);padding:8px 10px;margin-bottom:6px;cursor:pointer}
.ap-preset.on{border-left-color:var(--am)}.ap-preset b{display:block;font-size:13px}.ap-preset small{color:var(--mu);font-size:11px}
.ap-tabela{min-width:0;display:flex;flex-direction:column;gap:8px}.ap-busca{flex:1;min-width:180px}.ap-leg{margin:0}
.ap-cols{position:relative}.ap-cols>div{position:absolute;z-index:20;right:0;top:110%;background:var(--b2);border:1px solid var(--ln);border-radius:4px;padding:10px;display:grid;grid-template-columns:repeat(2,minmax(140px,1fr));gap:4px 12px;font-size:12px;width:340px}
.ap-scroll{overflow-x:auto;min-width:0;border:1px solid var(--ln);border-radius:4px}
.ap-t{width:100%;border-collapse:collapse;font-size:12.5px;white-space:nowrap}.ap-t th{position:sticky;top:0;background:var(--b2);color:var(--mu);font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;text-align:left;padding:8px 10px;cursor:pointer;font-weight:600}
.ap-t th.on{color:var(--am)}.ap-t td{padding:7px 10px;border-top:1px solid var(--ln);background:var(--b)}.ap-t tbody tr{cursor:pointer}.ap-t tbody tr:hover td{background:var(--b2)}
.ap-n{text-align:right}.ap-t th.ap-stk,.ap-t td.ap-stk{position:sticky;left:0;z-index:2;min-width:150px}.ap-t th.ap-stk{z-index:3}.ap-stk img{vertical-align:middle;margin-right:6px}.ap-stk small{display:block;color:var(--mu);max-width:150px;overflow:hidden;text-overflow:ellipsis}
.ap-up{text-transform:uppercase;font-size:11px;color:var(--mu)}.ap-est{display:block}.ap-t small{font-size:10.5px}.ap-vazio{text-align:center;padding:24px}
.ap-nota{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:50%;font-size:11px;font-weight:600;background:radial-gradient(closest-side,var(--b) 76%,transparent 78%),conic-gradient(var(--am) calc(var(--p)*1%),var(--b2) 0)}
.ap-pill{border:1px solid var(--ln);border-radius:10px;padding:1px 8px;font-size:11px}.ap-pill.hot{border-color:rgba(239,68,68,.5);color:#FCA5A5}
.ap-chip{background:var(--b2);border:1px solid var(--ln);color:var(--tx);border-radius:4px;padding:6px 10px;font-size:12px;cursor:pointer;min-height:32px}.ap-chip.on{border-color:var(--am);color:var(--am)}
.ap-rot header,.ap-lista header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.ap-rot header p,.ap-lista header p{color:var(--mu);font-size:12px;margin:4px 0 12px}
.ap-rotgrid{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:16px}.ap-heat td{font-weight:600}.ap-heat tr.on td:first-child{color:var(--am)}
.ap-dest div{display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid var(--ln)}
.ap-lista{background:var(--b);border:1px solid var(--ln);border-radius:4px;padding:16px}.ap-lista.dest{border-left:2px solid var(--am)}.ap-lista.risco{border-left:2px solid var(--r)}.ap-lista h3{margin:0;font-size:14px}.ap-lista h3 span{color:var(--mu);font-weight:400}
.ap-chips{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.ap-chips button{text-align:left;background:var(--b2);border:1px solid var(--ln);border-radius:4px;color:var(--tx);padding:8px 10px;cursor:pointer;min-height:44px}
.ap-chips b{display:block;font-size:13px}.ap-chips small{display:block;color:var(--mu);font-size:10.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ap-chips em{font-style:normal;font-size:11px;color:var(--am)}
.ap-tops{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}.ap-tops ol{margin:0;padding-left:22px;font-size:12.5px}.ap-tops li{display:flex;justify-content:space-between;padding:3px 0;cursor:pointer;border-bottom:1px solid var(--ln)}.ap-tops li span{color:var(--mu)}
.ap-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px 24px;background:var(--b);border:1px solid var(--ln);border-radius:4px;padding:16px}.ap-hero h2{margin:6px 0 0;font-size:24px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ap-tag{font-size:10.5px;text-transform:uppercase;border:1px solid var(--ln);border-radius:3px;padding:2px 6px;color:var(--mu);font-weight:600}.ap-tag.st-ativa{color:var(--g)}.ap-tag.st-invalidada{color:var(--r)}
.ap-hk{display:flex;gap:24px}.ap-hk span,.ap-kv span,.ap-stats span{display:block;color:var(--mu);font-size:11px}.ap-hk b{font-size:20px}.ap-acoes{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px}
.ap-subs{display:flex;gap:4px;border-bottom:1px solid var(--ln);overflow-x:auto}.ap-subs button{background:none;border:0;border-bottom:2px solid transparent;color:var(--mu);padding:10px 12px;cursor:pointer;font:inherit;font-size:13px;white-space:nowrap;min-height:40px}.ap-subs button.on{color:var(--tx);border-bottom-color:var(--am)}
.ap-2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}.ap-2w{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}
.ap-kv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px;margin-bottom:12px}.ap-kv b{font-size:14px}.ap-kv small{font-size:11px}
.ap-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0}.ap-svg{width:100%;height:auto;display:block}
.ap-grid{stroke:rgba(255,255,255,.06);fill:none}.ap-ax{fill:var(--mu);font-size:10px}.ap-l1{fill:none;stroke:var(--g);stroke-width:1.6}.ap-l2{fill:none;stroke:#94A3B8;stroke-width:1.2;stroke-dasharray:3 3}.ap-justo{stroke:var(--am);stroke-dasharray:6 4}
.ap-k1,.ap-k2{display:inline-block;width:12px;height:2px;background:var(--g);margin:0 4px 3px 8px}.ap-k2{background:#94A3B8}
.ap-radarsvg{width:100%;max-width:340px;display:block;margin:auto}.ap-area{fill:rgba(245,158,11,.18);stroke:var(--am);stroke-width:1.5}.ap-big{font-size:22px;margin-left:8px}
.ap-calcs{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.ap-calcs label,.ap-form label{display:block;font-size:12px;color:var(--mu);margin-bottom:8px}.ap-calcs input,.ap-form input,.ap-form select,.ap-form textarea{display:block;width:100%;margin-top:4px}
.ap-res{font-size:13px;margin:8px 0 0}.ap-res b{font-size:16px}.ap-fgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0 12px}
.ap-tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}.ap-tese header{display:flex;justify-content:space-between;align-items:center}.ap-tese h4{cursor:pointer;display:flex;gap:6px;align-items:center}.ap-tese ul{margin:6px 0;padding-left:18px;font-size:12.5px}
.ap-prog{height:4px;background:var(--b2);border-radius:2px}.ap-prog i{display:block;height:100%;background:var(--am);border-radius:2px}.ap-del{color:#FCA5A5}
@media(max-width:900px){.ap-rank,.ap-2,.ap-2w,.ap-rotgrid,.ap-hero{grid-template-columns:minmax(0,1fr)}.ap-filtros details{position:static}.ap-filtros details:not([open]){padding:10px}.ap-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ap-hk{gap:16px}.ap input,.ap select,.ap textarea{font-size:16px}.ap-cols>div{width:280px}}
`;d.head.appendChild(s)}

w.DiarioAnalisesPlus={view,enter,abrir,TABS:['rankpro','radar','teses','ativo']};
})(window,document);
