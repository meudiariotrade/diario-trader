const MK=['Alta calma','Alta volátil','Lateral calma','Lateral volátil','Baixa calma','Baixa volátil'];
const ERR=['Nenhum','Entrei por dica/emoção (fora do sistema)','Não saí no stop','Risco grande demais','Saí cedo por emoção','Não segui minha rotina','Operei fora do tipo de mercado','Foquei na entrada, não no risco/retorno','Entrei sem saída predeterminada','Precisava estar certo (realizei cedo/segurei perda)','Operei demais (perdi o controle)','Outro'];
const ESTR=['Compra de call','Compra de put','Venda coberta de call','Venda de put','Trava de alta','Trava de baixa','Financiamento / collar','Straddle / strangle','Borboleta / condor','Calendário','Outra'];
const CATS=['Plano de trade','Gestão de risco','Rotina','Psicologia'];
const SEED=[[0,'Só entro com setup do meu sistema (nunca por dica ou emoção)'],[0,'Defino a saída predeterminada antes de entrar'],[0,'Só opero o tipo de mercado para o qual meu sistema foi feito'],[1,'Defino o stop inicial antes de entrar'],[1,'Risco máximo de 1% do capital por trade'],[1,'Só pego trade com alvo de pelo menos 3 vezes o risco'],[1,'Saio quando o stop é atingido'],[2,'Faço autoavaliação e ensaio mental antes de abrir o mercado'],[2,'Registro todo trade com resultado e fotos'],[2,'Faço o debriefing no fim do dia'],[3,'Assumo a responsabilidade pelo resultado, sem culpar o mercado'],[3,'Aceito a perda no stop: não preciso estar certo']];
const $=s=>document.querySelector(s),uid=()=>Math.random().toString(36).slice(2,10),sum=a=>a.reduce((x,y)=>x+y,0),avg=a=>a.length?sum(a)/a.length:0;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const f2=n=>n==null||!isFinite(n)?'–':n.toFixed(2).replace('.',','),fr=r=>(r>0?'+':'')+f2(r)+'R',pc=x=>Math.round(x*100)+'%',cls=n=>n>0?'g':n<0?'r':'';
const money=n=>n==null?'–':n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const opt=(a,v)=>a.map(x=>{const[k,l]=Array.isArray(x)?x:[x,x];return `<option value="${esc(k)}"${k==v?' selected':''}>${esc(l)}</option>`}).join('');
const loc=()=>{const d=new Date();return new Date(d-d.getTimezoneOffset()*6e4).toISOString()};
const fdt=s=>s.slice(8,10)+'/'+s.slice(5,7)+' '+s.slice(11,16);
let S={trades:[],days:{},rules:[],seed:0},tab='home',T=null,orig={},isNew=0,delArm=0,D=loc().slice(0,10),db=null,M={},U={},st,PER='all',AUTO=0,TIPO='all',OPEN={},QM=0,VW={},LT='trades',SV=0,DV='ed',DX=null,LF={f:'all',q:''},CH={},SESS=null,AM='in',RECOV=null,SY={msg:'',email:''},sT;
const inPer=dt=>noPeriodo(dt.slice(0,10),PER,loc().slice(0,10));
const tipoSel=()=>`<label>Tipo<select id="tp">${opt([['all','Todos'],['D','Só day trade'],['S','Só swing'],['O','Só opções']],TIPO)}</select></label>`;
const sym=s=>{s=s.trim().toUpperCase();return s.includes(':')?s:'BMFBOVESPA:'+s};
const perSel=()=>`<label>Período<select id="per">${opt(PERIODOS,PER)}</select></label>`;
const open=()=>new Promise(r=>{try{const q=indexedDB.open('diario-trader',1);q.onupgradeneeded=()=>{q.result.createObjectStore('kv');q.result.createObjectStore('img')};q.onsuccess=()=>{db=q.result;r()};q.onerror=()=>r()}catch(e){r()}});
const idb=(s,m,...a)=>new Promise(r=>{if(!db)return r();try{const q=db.transaction(s,m==='get'?'readonly':'readwrite').objectStore(s)[m](...a);q.onsuccess=()=>r(q.result);q.onerror=()=>r()}catch(e){r()}});
const persist=()=>{clearTimeout(st);st=setTimeout(()=>idb('kv','put',S,'s'),250)},save=()=>{S.mt=Date.now();SV=Date.now();persist();syncSoon();svUi()};
const shrink=f=>new Promise(r=>{const i=new Image();i.onload=()=>{const k=Math.min(1,1100/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);c.toBlob(r,'image/jpeg',.7)};i.onerror=()=>r(null);i.src=URL.createObjectURL(f)});
async function fillImgs(){for(const e of document.querySelectorAll('img[data-img]')){const id=e.dataset.img;if(!U[id]){const b=M[id]||await idb('img','get',id);if(b)U[id]=URL.createObjectURL(b)}if(U[id])e.src=U[id]}}


/* ---------- Trades ---------- */
/* ---------- Capital por modalidade (day trade, opções, swing) ---------- */
const CAPN={D:'Day trade',O:'Opções',S:'Swing trade'},CAPU={D:'contrato',O:'lote',S:'lote'};let CAPO=0,CAPC=0;
document.addEventListener('toggle',e=>{if(e.target&&e.target.id==='capd')CAPO=e.target.open;if(e.target&&e.target.id==='capc')CAPC=e.target.open},true);
function capCalc(tp){const g=(k,d)=>gv('cap',tp+'_'+k,d),ini=g('ini','');if(ini===''||!isFinite(+ini))return null;const de=g('desde',''),ap=+g('ap',0)||0,cl=S.trades.filter(t=>(t.tipo||'D')===tp).map(t=>({t,c:calc(t)})).filter(x=>x.c.pl!=null&&(!de||(x.t.dtx||x.t.dt).slice(0,10)>=de)),res=sum(cl.map(x=>x.c.pl)),at=+ini+ap+res,cpc=+g('cpc',0)||0,rk=+g('rk',0)||0;return{ini:+ini,ap,res,at,n:cl.length,pct:+ini?res/+ini*100:null,cpc,rk,lotes:cpc>0?Math.max(0,Math.floor(at/cpc)):null,risco:rk>0?Math.max(0,at)*rk/100:null,curve:capCurvePts(+ini+ap,cl)}}
function capCard(tp){const c=capCalc(tp),u=CAPU[tp],g=k=>gv('cap',tp+'_'+k,''),f=(k,l,ph,ty='number')=>`<label>${l}<input type="${ty}"${ty==='number'?' step="any" inputmode="decimal"':''} data-ax="cap.${tp}_${k}" value="${esc(g(k))}" placeholder="${ph}"></label>`;
return `<div class="card"><div class="top"><b>💰 Capital · ${CAPN[tp]}</b>${c?`<span class="sm ${cls(c.res)}">${c.res>=0?'+':''}${money(c.res)}</span>`:''}</div>${c?`<div style="font-size:26px;font-weight:700;margin-top:4px" class="${c.at<=0?'r':''}">${money(c.at)}</div><div class="mut sm">Inicial ${money(c.ini)}${c.ap?' · aportes/saques '+money(c.ap):''} · ${c.n} operação(ões) encerrada(s)${c.pct!=null?' · '+(c.pct>=0?'+':'')+f2(c.pct)+'% sobre o inicial':''}</div>${c.lotes!=null?`<div style="margin-top:8px">Pode operar até <b>${c.lotes}</b> ${u}${c.lotes===1?'':'s'} <span class="mut sm">(${money(c.cpc)} de capital por ${u})</span></div>`:''}${c.risco!=null?`<div class="sm">Risco por trade (${f2(c.rk)}%): <b>${money(c.risco)}</b></div>`:''}${c.at<=0?'<div class="warn" style="margin-top:6px">Capital zerado ou negativo nesta modalidade.</div>':''}`:'<div class="mut sm" style="margin-top:6px">Informe o capital inicial. Ele sobe e desce com o resultado das operações encerradas, inclusive as importadas do Profit.</div>'}${capCurve(tp,c)}
<details id="capd" style="margin-top:8px"${CAPO?' open':''}><summary class="sm">${capResumo(tp,c)}</summary><div class="g2" style="margin-top:6px">${f('ini','Capital inicial (R$)','2000')}${f('desde','Contar resultados a partir de','','date')}</div><div class="g2">${f('cpc','Capital por '+u+' (R$)','1000')}${f('rk','Risco por trade (%)','2')}</div><div class="g2">${f('meta','Meta do ciclo (R$)','500')}${f('stp','Stop do ciclo (R$)','300')}</div>${f('ap','Aportes (+) ou saques (−) acumulados (R$)','0')}<div class="mut sm" style="margin-top:6px">Contratos permitidos = capital atual ÷ capital por ${u}. Em branco, a data inicial conta todas as operações já registradas.</div></details></div>`}
function capCurvePts(base,cl){const q=cl.slice().sort((a,b)=>(a.t.dtx||a.t.dt).localeCompare(b.t.dtx||b.t.dt));let acc=base;const p=[{v:acc,l:'Início'}];q.forEach(x=>{acc+=x.c.pl;const d=(x.t.dtx||x.t.dt);p.push({v:acc,l:d.slice(8,10)+'/'+d.slice(5,7)})});return p}
function capResumo(tp,c){if(!c)return '⚙️ Configurar capital (toque para preencher)';return '⚙️ Configurar capital · inicial '+money(c.ini)+(c.cpc?' · '+money(c.cpc)+'/'+CAPU[tp]:'')+(c.rk?' · risco '+f2(c.rk)+'%':'')}
function capCurve(tp,c){if(!c||!c.curve||c.curve.length<2)return '';const v=c.curve.map(p=>p.v),n=v.length,lo=Math.min(...v),hi=Math.max(...v),pad=(hi-lo)*.1||Math.abs(hi)*.05||1,a=lo-pad,b=hi+pad,X=i=>(i/(n-1)*296+2).toFixed(1),Y=x=>(66-(x-a)/(b-a)*60).toFixed(1),pts=v.map((x,i)=>X(i)+','+Y(x)).join(' '),y0=Y(v[0]),up=v[n-1]>=v[0],col=up?'var(--g)':'var(--r)';let pk=v[0],dd=0;v.forEach(x=>{pk=Math.max(pk,x);dd=Math.max(dd,pk-x)});
 return `<details id="capc"${CAPC?' open':''} style="margin-top:8px"><summary class="sm">📈 Curva de capital · ${n-1} operação(ões)</summary><svg viewBox="0 0 300 72" style="width:100%;height:auto;margin-top:6px" role="img" aria-label="Curva de capital ${CAPN[tp]}"><line x1="0" x2="300" y1="${y0}" y2="${y0}" stroke="var(--bd)" stroke-dasharray="3"/><polyline fill="none" stroke="${col}" stroke-width="2" points="${pts}"/><circle cx="${X(n-1)}" cy="${Y(v[n-1])}" r="3.5" fill="${col}"/></svg><div class="top sm mut"><span>Mín. ${money(lo)}</span><span>Máx. ${money(hi)}</span></div><div class="sm mut">Queda máxima (drawdown): <b class="${dd>0?'r':''}">${money(dd)}</b>. Linha tracejada = capital de partida. Conta só trades encerrados desde a data configurada.</div></details>`}
function capTotal(){const L=['D','O','S'].map(tp=>({tp,c:capCalc(tp)})).filter(x=>x.c);if(!L.length)return `<div class="card"><b>💰 Capital total</b><div class="mut sm" style="margin-top:4px">Defina o capital inicial em cada aba (Day trade, Opções e Swing) e o total aparece aqui.</div></div>`;const at=sum(L.map(x=>x.c.at)),ini=sum(L.map(x=>x.c.ini+x.c.ap)),res=sum(L.map(x=>x.c.res));return `<div class="card"><div class="top"><b>💰 Capital total</b><span class="sm ${cls(res)}">${res>=0?'+':''}${money(res)}</span></div><div style="font-size:26px;font-weight:700;margin-top:4px" class="${at<=0?'r':''}">${money(at)}</div><div class="mut sm">Inicial ${money(ini)}${ini?' · '+(res>=0?'+':'')+f2(res/ini*100)+'%':''}</div>${L.map(x=>`<div class="top sm" style="margin-top:6px"><span>${CAPN[x.tp]}</span><b class="${x.c.at<=0?'r':''}">${money(x.c.at)}</b></div>`).join('')}</div>`}
function card(t){const c=calc(t),p=t.pplan||t.pin||t.pout;return `<div class="card row" data-a="edit" data-id="${t.id}" data-s="${esc(((t.ativo||'')+' '+(t.setup||'')).toLowerCase())}"><div class="th">${p?`<img data-img="${p}">`:'📈'}</div><div class="fl"><b>${esc(t.ativo)||'<span class="r">⚠ sem ativo</span>'}</b> · ${t.tipo==='O'?(t.side==='C'?'Comprado':'Lançado'):(t.side==='C'?'Compra':'Venda')}<div class="mut sm">${fdt(t.dt)}${t.tipo==='O'&&t.strike?' · '+(t.ot==='P'?'Put':'Call')+' '+esc(t.strike):''}${t.setup?' · '+esc(t.setup):''}</div>${t.err&&t.err!=='Nenhum'?'<span class="tag">⚠ erro</span>':''}${t.rules==='n'?'<span class="tag">fora das regras</span>':''}</div><div class="rt ${cls(c.r)}">${isOpen(t)?`<span class="mut sm">aberto</span><br><button class="btn s" data-a="enc" data-id="${t.id}" style="margin-top:4px">Encerrar</button>`:c.pl==null?'<span class="mut sm">–</span>':mT(t,c.pl)}<div class="sm mut">${c.pl==null?'':pctConta(c.pl,moedaT(t),t.tipo||'D')}</div></div></div>`}
/* ---------- Extrato do plano (day trade, swing e opções) ---------- */
let EXD={},XTO=1;
document.addEventListener('toggle',e=>{if(e.target&&e.target.id==='xtd')XTO=e.target.open},true);
(function(){const c=document.createElement('style');c.textContent='.xt summary{cursor:pointer;font-weight:700}.xt-top{display:grid;grid-template-columns:150px 1fr;gap:12px;align-items:center;margin-top:10px}@media(max-width:520px){.xt-top{grid-template-columns:1fr}}.xt-g{text-align:center}.xt-gc{font-size:12px;margin-top:2px}.xt-s{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:10px}.xt-s>div{min-width:0}.xt-s .l{font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:var(--mut,#8b95a5)}.xt-s b{display:block;font-size:15px;margin-top:2px}.xt-m{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:10px;font-size:12px;color:var(--mut,#8b95a5)}.xt-m b{color:var(--tx,inherit)}.xt-w{overflow-x:auto;margin:10px -4px 0;padding:0 4px}.xt-w table{min-width:680px;font-size:12px;white-space:nowrap}.xt-w td,.xt-w th{padding:6px 6px;vertical-align:middle}.xt-w tr[data-a]{cursor:pointer}.xt-p{display:inline-block;padding:2px 7px;border-radius:99px;font-size:10px;border:1px solid var(--bd,#2a3140)}.xt-p.f{color:var(--ac,#7c8cff)}.xt-p.a{color:#e8a317}';document.head.appendChild(c)})();
function xtScore(rows){const v=[];rows.forEach(({t})=>{const p=[],e=numN(t.emo);if(e!=null&&e>=1&&e<=5)p.push((e-1)/4);if(t.rules==='s')p.push(1);else if(t.rules==='n')p.push(0);if(t.err&&p.length)p.push(t.err==='Nenhum'?1:0);if(p.length)v.push(avg(p))});return v.length?Math.round(avg(v)*100):null}
function xtGauge(res,meta,stp){const m=Math.max(Math.abs(res),1),hi=meta>0?meta:m,lo=-(stp>0?stp:m),fr0=Math.min(1,Math.max(0,(res-lo)/(hi-lo))),P=(f,r)=>{const a=Math.PI*(1-f);return[(60+r*Math.cos(a)).toFixed(1),(62-r*Math.sin(a)).toFixed(1)]},arc=(a,b,col)=>{const[x1,y1]=P(a,46),[x2,y2]=P(b,46);return `<path d="M${x1} ${y1} A46 46 0 0 1 ${x2} ${y2}" fill="none" stroke="${col}" stroke-width="9"/>`},[nx,ny]=P(fr0,38),z=(0-lo)/(hi-lo),[zx,zy]=P(z,46),[zx2,zy2]=P(z,38);
return `<svg viewBox="0 0 120 74" style="width:100%;max-width:170px;height:auto" role="img" aria-label="Resultado do ciclo frente à meta">${arc(0,.34,'var(--r)')}${arc(.34,.67,'#e8a317')}${arc(.67,1,'var(--g)')}<line x1="${zx}" y1="${zy}" x2="${zx2}" y2="${zy2}" stroke="var(--tx,#fff)" stroke-width="1.2" opacity=".55"/><line x1="60" y1="62" x2="${nx}" y2="${ny}" stroke="var(--tx,#fff)" stroke-width="2.4" stroke-linecap="round"/><circle cx="60" cy="62" r="4" fill="var(--tx,#fff)"/><text x="6" y="73" font-size="7" fill="var(--r)">${stp>0?'-'+Math.round(stp):''}</text><text x="114" y="73" font-size="7" text-anchor="end" fill="var(--g)">${meta>0?Math.round(meta):''}</text></svg>`}
function extrato(tp){const g=k=>gv('cap',tp+'_'+k,''),ini=g('ini');if(ini===''||!isFinite(+ini))return '';
 const de=g('desde'),ap=+g('ap')||0,base=+ini+ap,meta=+g('meta')||0,stp=+g('stp')||0,dia=t=>(t.dtx||t.dt).slice(0,10);
 const all=S.trades.filter(t=>(t.tipo||'D')===tp&&(!de||dia(t)>=de)).slice().sort(cmpCron).map(t=>({t,c:calc(t)}));
 const days=[...new Set(all.map(x=>dia(x.t)))].slice(-6);let sel=EXD[tp]||'all';if(sel!=='all'&&!days.includes(sel))sel='all';
 const cl=all.filter(x=>x.c.pl!=null),cres=sum(cl.map(x=>x.c.pl)),cum={},dc={};let ac=0;
 all.forEach(x=>{if(x.c.pl!=null){ac+=x.c.pl;const d=dia(x.t);dc[d]=(dc[d]||0)+x.c.pl;cum[x.t.id]={cy:ac,dy:dc[d]}}});
 const rows=sel==='all'?all:all.filter(x=>dia(x.t)===sel),rc=rows.filter(x=>x.c.pl!=null),res=sum(rc.map(x=>x.c.pl)),
  pi=base+(sel==='all'?0:sum(cl.filter(x=>dia(x.t)<sel).map(x=>x.c.pl))),pa=pi+res,
  w=rc.filter(x=>x.c.pl>0),l=rc.filter(x=>x.c.pl<0),wr=rc.length?w.length/rc.length:null,
  rrs=rows.map(x=>x.c.rr).filter(x=>x!=null),rrP=rrs.length?avg(rrs):null,rrR=w.length&&l.length?avg(w.map(x=>x.c.pl))/Math.abs(avg(l.map(x=>x.c.pl))):null,
  sc=xtScore(rows),scL=sc==null?'':sc>=70?'Saudável':sc>=40?'Atenção':'Crítico',scC=sc==null?'':sc>=70?'g':sc>=40?'':'r',
  est=meta>0&&cres>=meta?'🎯 Meta batida':stp>0&&cres<=-stp?'🛑 Stop atingido':cl.length?'📊 Em andamento':'⏳ Sem operações',
  sg=n=>(n>0?'+':'')+money(n),pt=n=>n==null?'':(n>0?'+':'')+(Math.abs(n)>=10?Math.round(n):f2(n)),
  un=tp==='O'?'prêmio':'pts',
  cell=(l2,v,k='')=>`<div><div class="l">${l2}</div><b class="${k}">${v}</b></div>`;
 const tr=rows.map((x,i)=>{const t=x.t,c=x.c,d=t.side==='C'?1:-1,e=numN(t.entry),s=numN(t.stop),tg=numN(t.target),up=tg!=null&&e!=null?(tg-e)*d:null,dn=s!=null&&e!=null?(s-e)*d:null,em=numN(t.emo),k=cum[t.id];
  return `<tr data-a="edit" data-id="${t.id}"><td class="mut">${i+1}</td><td>${fdt(t.dtx||t.dt)}</td><td><b>${esc(t.ativo)||'—'}</b>${tp==='O'&&t.strike?' <span class="mut">'+(t.ot==='P'?'Put':'Call')+' '+esc(t.strike)+'</span>':''}<div class="sm mut">${t.side==='C'?'<span class="g">C</span>':'<span class="r">V</span>'}${up!=null?' · <span class="g">↑ '+pt(up)+' '+un+'</span>':''}${dn!=null?' · <span class="r">↓ '+pt(dn)+' '+un+'</span>':''}</div></td><td>${em>=1&&em<=5?EMO[em-1]:'–'}${t.rules==='s'?' ✅':t.rules==='n'?' ⚠️':''}</td><td>${c.risk!=null&&pi>0?f2(c.risk/pi*100)+'%':'–'}</td><td>${c.rr!=null?f2(c.rr)+':1':'–'}</td><td class="${cls(c.pl)}${c.pl==null?' lvr':''}"${c.pl==null?' data-lvid="'+t.id+'"':''}><b>${c.pl!=null?sg(c.pl):'–'}</b></td><td class="${k?cls(k.dy):''}">${k?sg(k.dy):'–'}</td><td class="${k?cls(k.cy):''}">${k?sg(k.cy):'–'}</td><td><span class="xt-p ${c.pl!=null?'f':'a'}">${c.pl!=null?'Fechado':'Aberto'}</span></td></tr>`}).join('');
 return `<details id="xtd" class="card xt"${XTO?' open':''}><summary>🧾 Extrato do plano · ${CAPN[tp]}<span class="mut sm" style="font-weight:400"> · ${de?'desde '+de.split('-').reverse().join('/'):'todas as operações'}</span></summary>
 <div class="chips2" style="margin-top:8px"><button class="${sel==='all'?'on':''}" data-a="exd" data-tp="${tp}" data-id="all">Ciclo</button>${days.map(d=>`<button class="${sel===d?'on':''}" data-a="exd" data-tp="${tp}" data-id="${d}">${d.slice(8,10)}/${d.slice(5,7)}</button>`).join('')}</div>
 <div class="xt-top"><div class="xt-g">${xtGauge(cres,meta,stp)}<div class="xt-gc"><b class="${cls(cres)}">${sg(cres)}</b><div class="mut">${meta>0?Math.round(cres/meta*100)+'% da meta do ciclo':'defina meta e stop em ⚙️ Configurar capital'}</div></div></div>
 <div class="xt-s">${cell('PL inicial',money(pi))}${cell('Resultado',sg(res)+(pi>0?' <span class="sm mut">('+(res>=0?'+':'')+f2(res/pi*100)+'%)</span>':''),cls(res))}${cell('PL atual',money(pa),pa<=0?'r':'')}${cell('Estado (ciclo)',est)}${cell('Score emocional',sc==null?'–':sc+'/100 · '+scL,scC)}${cell('Meta / stop',(meta>0?money(meta):'–')+' / '+(stp>0?'-'+money(stp):'–'))}</div></div>
 <div class="xt-m">${all.some(x=>x.c.pl==null)?'<span>Em aberto (ao vivo) <b id="lvopen" data-tp="'+tp+'">–</b></span>':''}<span>ROI <b class="${cls(res)}">${pi>0?(res>=0?'+':'')+f2(res/pi*100)+'%':'–'}</b></span><span>Ganho/risco planejado <b>${rrP!=null?f2(rrP)+':1':'–'}</b></span><span>Ganho/risco realizado <b>${rrR!=null?f2(rrR)+':1':'–'}</b></span><span>Trades <b>${rows.length}</b>${rows.length!==rc.length?' <span class="sm">('+(rows.length-rc.length)+' aberto'+(rows.length-rc.length>1?'s':'')+')</span>':''}</span><span>WR <b>${wr!=null?f2(wr*100)+'%':'–'}</b>${rc.length?' <span class="sm">('+w.length+'/'+rc.length+')</span>':''}</span></div>
 ${rows.length?`<div class="xt-w"><table><tr><th>#</th><th>Data</th><th>Ativo</th><th>Emo</th><th>RO</th><th>RR</th><th>Resultado</th><th>Acum. dia</th><th>Acum. ciclo</th><th>Status</th></tr>${tr}</table></div>`:'<p class="mut sm" style="margin-top:10px">Nenhuma operação neste período.</p>'}
 <div class="mut sm" style="margin-top:8px">RO = risco do trade sobre o PL inicial. Velocímetro, estado e meta/stop são do ciclo inteiro; o restante acompanha o dia escolhido. Toque numa linha para editar.</div></details>`}
/*ANALISE*//* ---------- Análise do plano (sub-aba de Day trade, Swing e Opções) ---------- */
let XV={};
(function(){const c=document.createElement('style');c.textContent='.an-g{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:700px){.an-g{grid-template-columns:1fr}}.an{margin:0!important}.an-h{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--mut,#8b95a5);display:flex;align-items:center;gap:6px;margin-bottom:10px}.an-h i{font-style:normal}.an-h small{text-transform:none;letter-spacing:0;opacity:.7}.an-k{display:grid;grid-template-columns:1fr 1fr;gap:14px 12px}.an-k.c4{grid-template-columns:repeat(4,1fr)}@media(max-width:700px){.an-k.c4{grid-template-columns:1fr 1fr}}.an-k .l{font-size:11px;color:var(--mut,#8b95a5)}.an-k .v{font-size:21px;font-weight:700;font-variant-numeric:tabular-nums;margin:2px 0}.an-k .s{font-size:11px;color:var(--mut,#8b95a5);line-height:1.5}.an-bar{height:6px;border-radius:9px;background:var(--bd,#2a3140);overflow:hidden;margin-top:8px}.an-bar>i{display:block;height:100%}.an-box{border:1px solid var(--bd,#2a3140);border-radius:10px;padding:10px;text-align:center}.an-box .v{font-size:19px;font-weight:700;margin:2px 0}.an-box .l,.an-box .s{font-size:10px;color:var(--mut,#8b95a5)}.an-3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.an-hr{border:0;border-top:1px solid var(--bd,#2a3140);margin:12px 0}.an-amb{color:#e8a317}.an-blu{color:#5aa9ff}.an-tag{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;border:1px solid var(--bd,#2a3140);color:var(--mut,#8b95a5)}.an-ev.bad{border-color:rgba(248,81,73,.45)}';document.head.appendChild(c)})();
const xtSw=tp=>`<div class="seg" style="margin:8px 0">${[['op','📋 Operações'],['an','📊 Análise']].map(([k,l])=>`<button class="${(XV[tp]||'op')===k?'on':''}" data-a="xv" data-tp="${tp}" data-id="${k}">${l}</button>`).join('')}</div>`;
const xtHead=tp=>`<div class="top"><h1>${{D:'Day trade',S:'Swing trade',O:'Opções'}[tp]}</h1><button class="btn" data-a="new" data-tp="${tp}">+ Novo trade</button></div>`;
function xtSd(a){if(a.length<2)return null;const m=avg(a);return Math.sqrt(sum(a.map(x=>(x-m)*(x-m)))/(a.length-1))}
function xtDur(m){if(m==null||!isFinite(m))return '–';m=Math.round(m);if(m<60)return m+'min';if(m<1440)return Math.floor(m/60)+'h'+(m%60?' '+m%60+'min':'');const d=m/1440;return f2(d).replace(/,00$/,'')+' d'}
function analise(tp){const g=k=>gv('cap',tp+'_'+k,''),ini=g('ini');
 if(ini===''||!isFinite(+ini))return '<div class="card"><b>📊 Análise do plano</b><div class="mut sm" style="margin-top:6px">Informe o capital inicial desta aba (⚙️ Configurar capital, na aba Operações) para calcular saldo, drawdown e retorno.</div></div>';
 const de=g('desde'),base=+ini+(+g('ap')||0),rk=+g('rk')||0,dia=t=>(t.dtx||t.dt).slice(0,10),
  cl=S.trades.filter(t=>(t.tipo||'D')===tp&&(!de||dia(t)>=de)).slice().sort(cmpCron).map(t=>({t,c:calc(t)})).filter(x=>x.c.pl!=null),n=cl.length;
 if(!n)return '<div class="card"><b>📊 Análise do plano</b><div class="mut sm" style="margin-top:6px">Ainda não há operações encerradas neste ciclo.</div></div>';
 const pls=cl.map(x=>x.c.pl),res=sum(pls),w=cl.filter(x=>x.c.pl>0),l=cl.filter(x=>x.c.pl<0),wr=w.length/n,gw=sum(w.map(x=>x.c.pl)),gl=Math.abs(sum(l.map(x=>x.c.pl))),
  aw=w.length?gw/w.length:null,al=l.length?gl/l.length:null,pay=aw!=null&&al>0?aw/al:null,pf=gl>0?gw/gl:null,
  ret=x=>(x>0?'+':'')+f2(x)+'%',sg=v=>(v>0?'+':'')+money(v),
  quebra=x=>x.t.rules==='n'||(x.t.err&&x.t.err!=='Nenhum');
 /* curva, drawdown e retornos diários */
 let eq=base,pk=base,mdd=0,mddp=0;const dayR={};
 cl.forEach(x=>{const d=dia(x.t);if(!dayR[d])dayR[d]={s:eq,p:0};dayR[d].p+=x.c.pl;eq+=x.c.pl;pk=Math.max(pk,eq);const dd=pk-eq;if(dd>mdd){mdd=dd;mddp=pk>0?dd/pk*100:0}});
 const ddAtual=pk-eq,ddAtualP=pk>0?ddAtual/pk*100:0;
 /* conformidade e "sorte" */
 const rr_=cl.filter(x=>x.t.rules==='s'||x.t.rules==='n'),conf=rr_.length?rr_.filter(x=>x.t.rules==='s').length/rr_.length:null,sorte=w.filter(quebra).length;
 /* assimetria */
 const rrs=cl.map(x=>x.c.rr).filter(v=>v!=null),rrP=rrs.length?avg(rrs):null,be=rrP!=null?1/(1+rrP):null,
  rW=w.map(x=>x.c.risk).filter(v=>v!=null),rL=l.map(x=>x.c.risk).filter(v=>v!=null),rkWL=rW.length&&rL.length&&avg(rL)>0?avg(rW)/avg(rL):null,
  rAll=cl.map(x=>x.c.risk).filter(v=>v!=null),rkMax=rk>0?base*rk/100:0,util=rAll.length&&rkMax>0?avg(rAll)/rkMax:null;
 /* EV */
 const pe=cl.filter(x=>x.c.risk!=null&&numN(x.t.target)!=null&&numN(x.t.entry)!=null).map(x=>({r:x.c.risk,g:Math.abs(numN(x.t.target)-numN(x.t.entry))*(numN(x.t.qty)||0)*(numN(x.t.pv)||1)})),
  evE=pe.length?wr*avg(pe.map(x=>x.g))-(1-wr)*avg(pe.map(x=>x.r)):null,evR=res/n,gap=evE!=null?evR-evE:null,
  cap=evE>0?Math.min(1,Math.max(0,evR/evE)):null;
 /* consistência */
 const rd=Object.values(dayR).map(d=>d.s>0?d.p/d.s:0),sdD=xtSd(rd),selic=(typeof JR!=='undefined'&&JR.data&&JR.data.selic&&isFinite(JR.data.selic.v))?+JR.data.selic.v:null,rf=selic!=null?Math.pow(1+selic/100,1/252)-1:0,
  sharpe=sdD>0?(avg(rd)-rf)/sdD*Math.sqrt(252):null,shL=sharpe==null?'':sharpe<0?'Negativo':sharpe<1?'Fraco':sharpe<2?'Bom':sharpe<3?'Muito bom':'Excepcional',shC=sharpe==null?'':sharpe<0?'r':sharpe<1?'an-amb':'g',
  sdP=xtSd(pls),cv=sdP!=null&&avg(pls)!==0?sdP/Math.abs(avg(pls)):null,cvL=cv==null?'':cv<=1?'Consistente':cv<=2?'Moderado':'Muito errático',cvC=cv==null?'':cv<=1?'g':cv<=2?'an-amb':'r';
 const ex=cl.map(x=>{const t=x.t,e=numN(t.entry),d=t.side==='C'?1:-1,b=numN(t.mep),m=numN(t.men),s=numN(t.stop);return e>0?{mep:b!=null?(b-e)*d/e*100:null,men:m!=null?(m-e)*d/e*100:null,st:s!=null?Math.abs(e-s)/e*100:null,tg:numN(t.target)!=null?Math.abs(numN(t.target)-e)/e*100:null}:{}}),
  mepA=ex.map(x=>x.mep).filter(v=>v!=null),menA=ex.map(x=>x.men).filter(v=>v!=null),mep=mepA.length?avg(mepA):null,men=menA.length?avg(menA):null,stA=ex.map(x=>x.st).filter(v=>v!=null),tgA=ex.map(x=>x.tg).filter(v=>v!=null),
  mepC=mep==null?'':tgA.length&&mep>=avg(tgA)*.5?'g':'an-amb',menC=men==null?'':stA.length?(Math.abs(men)<=avg(stA)*.5?'g':Math.abs(men)<=avg(stA)?'an-amb':'r'):'';
 const mins=x=>{const a=new Date(x.t.dt),b=new Date(x.t.dtx);return x.t.dtx&&isFinite(a)&&isFinite(b)?(b-a)/6e4:null},
  tW=w.map(mins).filter(v=>v!=null),tL=l.map(mins).filter(v=>v!=null),tAll=cl.map(mins).filter(v=>v!=null),aTW=tW.length?avg(tW):null,aTL=tL.length?avg(tL):null,aT=tAll.length?avg(tAll):null,
  dT=aTW!=null&&aTL>0?(aTW/aTL-1)*100:null,estilo=aT==null?'':aT<=15?'Scalping':aT<1440?'Day trade':aT<7*1440?'Swing curto':'Posição';
 const lastD=dia(cl[cl.length-1].t),mes=MES[+lastD.slice(5,7)-1].slice(0,3).toUpperCase()+'/'+lastD.slice(0,4);
 const kv=(l2,v,s='',c='')=>`<div><div class="l">${l2}</div><div class="v ${c}">${v}</div><div class="s">${s}</div></div>`,
  gc=(a,b)=>`<span class="${a>=0?'g':'r'}">${b}</span>`;
 const fin=`<div class="card an"><div class="an-h"><i>💲</i>Financeiro <small>· ${n} operação(ões)${de?' desde '+de.split('-').reverse().join('/'):''}</small></div><div class="an-k">
  ${kv('Saldo',money(base+res),'PL inicial: <b>'+money(base)+'</b>')}
  ${kv('Resultado · ciclo','<span class="'+cls(res)+'">'+sg(res)+'</span> <span class="sm '+cls(res)+'">'+ret(res/base*100)+'</span>','Expectativa: <b class="'+cls(evR)+'">'+money(evR)+'/trade</b>')}
  ${kv('Drawdown do topo','<span class="'+(ddAtual>0?'r':'g')+'">'+f2(ddAtualP)+'%</span>','Máx.: <b class="r">-'+f2(mddp)+'%</b> (-'+money(mdd)+')')}
  ${kv('Profit factor',pf!=null?f2(pf):(gw>0?'∞':'–'),'Conformidade: <b class="'+(conf==null?'':conf>=.8?'g':'r')+'">'+(conf!=null?Math.round(conf*100)+'%':'–')+'</b><br>Sorte (ganhos fora das regras): <b class="'+(sorte?'r':'g')+'">'+(w.length?Math.round(sorte/w.length*100)+'%':'–')+'</b> ('+sorte+'/'+w.length+')')}
 </div></div>`;
 const ass=`<div class="card an"><div class="an-h"><i>🎯</i>Assimetria de risco</div><div class="an-k">
  ${kv('Win rate',f2(wr*100)+'%',be!=null?'Mínimo p/ empatar (RR '+f2(rrP)+':1): <b class="an-amb">'+f2(be*100)+'%</b> '+gc(wr-be,(wr>=be?'↑ +':'↓ ')+f2(Math.abs(wr-be)*100)+' p.p.'):'Sem alvo informado nos trades')}
  ${kv('Payoff',pay!=null?'<span class="'+(pay>=1?'g':'r')+'">'+f2(pay)+'x</span>':'–','W: <b class="g">'+(aw!=null?money(aw):'–')+'</b> L: <b class="r">'+(al!=null?money(al):'–')+'</b>')}
  ${kv('Risco W/L',rkWL!=null?'<span class="an-blu">'+f2(rkWL)+'x</span>':'–','W: <b>'+(rW.length?money(avg(rW)):'–')+'</b> L: <b>'+(rL.length?money(avg(rL)):'–')+'</b> <span class="mut">(risco médio por trade)</span>')}
  <div><div class="l">Utiliz. RO</div>${util!=null?'<div class="v an-amb">'+Math.round(util*100)+'%</div><div class="an-bar"><i style="width:'+Math.min(100,util*100)+'%;background:'+(util>1?'var(--r)':'#e8a317')+'"></i></div><div class="s">risco médio ÷ risco máx. ('+f2(rk)+'% do PL = '+money(rkMax)+')</div>':'<div class="v">–</div><div class="s">defina "Risco por trade (%)" em ⚙️ Configurar capital</div>'}</div>
 </div></div>`;
 const ev=`<div class="card an an-ev ${gap!=null&&gap<0?'bad':''}"><div class="an-h"><i>📉</i>EV ${gap!=null&&evE>0?(gap<0?'<b class="r" style="letter-spacing:0">'+Math.round(-gap/evE*100)+'% de perda</b>':'<b class="g" style="letter-spacing:0">no esperado ou acima</b>'):''}</div>
  ${evE!=null?`<div class="an-3"><div class="an-box"><div class="l">EV esperado</div><div class="v">${money(evE)}</div><div class="s">/trade</div></div><div class="an-box"><div class="l">EV real</div><div class="v ${cls(evR)}">${money(evR)}</div><div class="s">/trade</div></div><div class="an-box" style="${gap<0?'background:rgba(248,81,73,.08)':''}"><div class="l">Gap</div><div class="v ${cls(gap)}">${sg(gap)}</div><div class="s">/trade</div></div></div>
  <hr class="an-hr"><div class="top sm"><span class="mut">${gap<0?'Perda':'Ganho'} acumulada <span>(${n} trade${n>1?'s':''})</span></span><b class="${cls(gap)}">${sg(gap*n)}</b></div>${cap!=null?'<div class="an-bar"><i style="width:'+cap*100+'%;background:var(--g)"></i></div><div class="s mut" style="text-align:right;margin-top:4px">'+Math.round(cap*100)+'% capturado</div>':''}`:'<div class="mut sm">Informe entrada, stop e alvo nos trades para calcular o EV esperado (win rate × ganho planejado − perda × risco).</div>'}</div>`;
 const con=`<div class="card an"><div class="an-h"><i>〰️</i>Consistência operacional <small>· ${mes}</small></div><div class="an-k c4">
  ${kv('Sharpe',sharpe!=null?f2(sharpe):'–',sharpe!=null?'<b class="'+shC+'">'+shL+'</b><br><span class="an-tag">'+(selic!=null?'Selic atual '+f2(selic)+'%':'sem Selic (rf = 0)')+'</span>':'<span class="mut">precisa de 2+ dias</span>',sharpe!=null?shC:'')}
  ${kv('CV norm.',cv!=null?f2(cv):'–',cv!=null?'<b class="'+cvC+'">'+cvL+'</b>':'<span class="mut">precisa de 2+ trades</span>',cvC)}
  ${kv('MEP médio',mep!=null?ret(mep):'–','por entry'+(mep==null?'<br>preencha nos trades':''),mepC)}
  ${kv('MEN médio',men!=null?ret(men):'–','por entry'+(men==null?'<br>preencha nos trades':''),menC)}</div>
  <hr class="an-hr"><div class="top"><div><div class="l mut sm" style="font-size:11px">TEMPO W VS L</div><div class="sm" style="margin-top:4px">W: <b class="g">${xtDur(aTW)}</b> &nbsp; L: <b class="r">${xtDur(aTL)}</b></div></div>${dT!=null?'<div style="text-align:right"><b class="'+(dT>=0?'g':'r')+'" style="font-size:16px">'+(dT>=0?'+':'')+Math.round(dT)+'%</b> <span class="sm '+(dT>=0?'g':'r')+'">'+(dT>=0?'Winners run':'Ganhos cortados cedo')+'</span></div>':''}</div>
  <div class="sm mut" style="margin-top:10px">Tempo médio geral <b style="color:var(--tx,inherit)">${xtDur(aT)}</b> ${estilo?'<span class="an-tag">'+estilo+'</span>':''}</div></div>`;
 const info=`<details class="card" style="margin-top:10px"><summary class="sm">ⓘ Como cada número é calculado</summary><div class="sm mut" style="margin-top:8px;line-height:1.55">
 <b>Saldo</b> = capital inicial + aportes + resultado. <b>Drawdown do topo</b> = queda do saldo desde o maior saldo já atingido; "Máx." é a maior queda do ciclo. <b>Profit factor</b> = soma dos ganhos ÷ soma das perdas. <b>Conformidade</b> = % de trades com "segui minhas regras = Sim". <b>Sorte</b> = % dos ganhos obtidos quebrando regra ou com erro marcado.<br>
 <b>Payoff</b> = ganho médio ÷ perda média. <b>Mínimo p/ empatar</b> = 1 ÷ (1 + RR planejado médio). <b>Risco W/L</b> = risco médio dos ganhos ÷ risco médio das perdas. <b>Utiliz. RO</b> = risco médio ÷ (capital × risco por trade).<br>
 <b>EV esperado</b> = win rate × ganho planejado até o alvo − (1 − win rate) × risco. <b>EV real</b> = resultado médio por trade. <b>Gap</b> = real − esperado.<br>
 <b>Sharpe</b> = (retorno diário médio − Selic diária) ÷ desvio dos retornos diários × √252 (com poucos dias é pouco confiável). <b>CV norm.</b> = desvio ÷ |média| do resultado por trade (até 1 consistente, até 2 moderado, acima errático). <b>MEP / MEN</b> = melhor / pior preço atingido dentro do trade, em % da entrada (campos opcionais no trade). <b>Tempo W vs L</b> = duração média (entrada → saída) dos ganhos contra as perdas.</div></details>`;
 return `<div class="an-g">${fin}${ass}${ev}${con}</div>${info}`}
/*LIVE*//* ---------- Cotações ao vivo (ponte Profit → Supabase → app) ---------- */
const LV={px:{},dl:{},td:0,ts:0,err:'',ed:'',hit:{},busy:0},LVT=['trades','swing','opc'];
const lvKey=t=>String(t.ativo||'').trim().toUpperCase();
function lvQ(k){const b=LV.px[k];if(b&&b.ult>0&&Date.now()-b.up<30000)return{...b,d:0};const d=LV.dl[k];if(d&&d.ult>0&&Date.now()-d.up<180000)return{...d,d:1};return null}
function lvCalc(t){const q=lvQ(lvKey(t));if(!q)return null;const e=numN(t.entry),s=numN(t.stop),tg=numN(t.target),d=t.side==='C'?1:-1,qt=numN(t.qty)||0,pv=numN(t.pv)||1,cost=numN(t.cost)||0;if(e==null)return null;const pl=(q.ult-e)*d*qt*pv-cost,risk=s!=null?Math.abs(e-s)*qt*pv:null;return{px:q.ult,d:q.d,pl,r:risk>0?pl/risk:null,ds:s!=null?(q.ult-s)*d:null,dt:tg!=null?(tg-q.ult)*d:null,st:s!=null&&(q.ult-s)*d<=0?'stop':tg!=null&&(tg-q.ult)*d<=0?'alvo':''}}
async function lvPoll(){if(LV.busy||!SESS||!window.CLOUD_OK||document.hidden||!(LVT.includes(tab)||tab==='live')||(tab!=='live'&&!S.trades.some(t=>isOpen(t)&&lvKey(t))))return;LV.busy=1;try{const rows=await(await rq('/rest/v1/cotacoes?select=ticker,ult,abe,hor,dat,updated_at&user_id=eq.'+SESS.uid)).json(),px={};rows.forEach(x=>px[String(x.ticker).toUpperCase()]={ult:+x.ult,hor:x.hor,up:Date.parse(x.updated_at)||0});LV.px=px;LV.all=rows;LV.ts=Date.now();LV.err=''}catch(e){LV.err=e.status===404?'ponte não configurada (tabela "cotacoes" não existe)':String(e.message||e)}try{await lvDelayed()}catch(e){}LV.busy=0;lvPaint();lvcPaint()}
async function lvDelayed(){const c=cfg(),fut=/^(WIN|WDO|IND|DOL|BGI|CCM|ICF|WSP|DI1)/,miss=[...new Set(S.trades.filter(t=>isOpen(t)&&lvKey(t)).map(lvKey))].filter(k=>!fut.test(k)&&!(LV.px[k]&&Date.now()-LV.px[k].up<30000));if(!c||!miss.length||Date.now()-LV.td<60000)return;LV.td=Date.now();try{await tok();const r=await fetch(c.url+'/functions/v1/precos',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify({br:miss.filter(k=>/\d/.test(k)),us:miss.filter(k=>!/\d/.test(k))})});const j=await r.json();if(!r.ok)throw new Error(j.erro||('Erro '+r.status));const h=hm();for(const o of[j.br||{},j.us||{}])for(const k in o)if(o[k]>0)LV.dl[k.toUpperCase()]={ult:+o[k],hor:h,up:Date.now()};LV.ed=''}catch(e){LV.ed=String(e.message||e)}}
function lvPaint(){const ap=$('#app');if(!ap||!LVT.includes(tab))return;const ab=S.trades.filter(t=>isOpen(t)&&lvKey(t)),old=$('#lvbar');if(!SESS||!window.CLOUD_OK||!ab.length){if(old)old.remove();return}
 const fq=Object.values(LV.px).filter(x=>Date.now()-x.up<30000),nd=Object.values(LV.dl).filter(x=>Date.now()-x.up<180000);let bar=old;if(!bar){ap.insertAdjacentHTML('afterbegin','<div id="lvbar" class="sm" style="margin-bottom:8px"></div>');bar=$('#lvbar')}
 bar.innerHTML=fq.length&&!LV.err?'<span class="g">🟢 Ao vivo</span> <span class="mut">· '+esc(fq.sort((a,b)=>b.up-a.up)[0].hor||'')+' · '+fq.length+' ativo(s) chegando'+(nd.length?' · '+nd.length+' com atraso':'')+'</span>':nd.length?'<span class="an-amb">🟡 Cotação com atraso</span> <span class="mut">· brapi/Twelve Data, ~15 min · '+nd.length+' ativo(s) · atualiza a cada 1 min</span>':'<span class="mut">⚪ Sem cotações.'+(LV.err?' Ponte: '+esc(LV.err)+'.':'')+(LV.ed?' Fonte com atraso: '+esc(LV.ed)+'.':' Ponte do Profit desligada e a fonte com atraso não trouxe os ativos abertos (futuros e opções não têm fonte gratuita).')+'</span>';
 const f=n=>Math.abs(n)>=10?Math.round(n):f2(n),open={};
 ab.forEach(t=>{const r=lvCalc(t);let h='';if(r){(open[t.tipo||'D']??=[]).push(r.pl);if(r.st&&LV.hit[t.id]!==r.st){LV.hit[t.id]=r.st;buzz([200,100,200])}if(!r.st)delete LV.hit[t.id];
  h='<span class="'+(r.d?'an-amb':'g')+'">●</span> último <b>'+f2(r.px)+'</b>'+(r.d?' <span class="mut">(atraso)</span>':'')+' · aberto <b class="'+cls(r.pl)+'">'+(r.pl>0?'+':'')+money(r.pl)+'</b>'+(r.pl!=null&&pctConta(r.pl)?' <span class="'+cls(r.pl)+'">('+pctConta(r.pl)+')</span>':'')+(r.ds!=null?' · stop a '+f(r.ds):'')+(r.dt!=null?' · alvo a '+f(r.dt):'')+(r.st?' <b class="'+(r.st==='stop'?'r':'g')+'">'+(r.st==='stop'?'⚠ STOP ATINGIDO':'🎯 ALVO ATINGIDO')+'</b>':'')}
  const c=ap.querySelector('.card.row[data-id="'+t.id+'"]');if(c){const b=c.querySelector('.fl')||c;let e=b.querySelector('.lv');if(!e){e=document.createElement('div');e.className='lv sm';e.style.marginTop='4px';b.appendChild(e)}e.innerHTML=h}
  const x=ap.querySelector('td.lvr[data-lvid="'+t.id+'"]');if(x)x.innerHTML=r?'<b class="'+cls(r.pl)+'" title="ao vivo">'+(r.pl>0?'+':'')+money(r.pl)+' <span class="g">●</span></b>':'<b>–</b>'});
 const o=ap.querySelector('#lvopen');if(o){const a=open[o.dataset.tp]||[];o.innerHTML=a.length?'<span class="'+cls(sum(a))+'">'+(sum(a)>0?'+':'')+money(sum(a))+'</span>':'–'}}
setInterval(lvPoll,2500);
/* ---------- Tela Cotações ao vivo (lista de todos os ativos da ponte) ---------- */
let LVC={q:'',f:'all'};
const lvcHoje=()=>{const d=new Date();return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()};
function vLive(){return `<h1>Cotações ao vivo</h1><div id="lvcbar" class="sm" style="margin:6px 0"></div><input id="cq" placeholder="🔍 Buscar ativo" value="${esc(LVC.q)}" autocapitalize="characters" autocomplete="off"><div class="chips2" style="margin-top:8px">${[['all','Todos'],['meus','Meus trades'],['alta','Em alta'],['baixa','Em baixa']].map(([k,l])=>`<button class="${LVC.f===k?'on':''}" data-a="lvcf" data-id="${k}">${l}</button>`).join('')}</div><div class="card" style="margin-top:8px;padding:6px 8px"><table style="width:100%"><thead><tr><th style="text-align:left">Ativo</th><th style="text-align:right">Último</th><th style="text-align:right">Var.</th><th style="text-align:right">Hora</th></tr></thead><tbody id="lvcb"></tbody></table></div><div class="mut sm">Atualiza a cada ~3 s enquanto a ponte do Profit estiver rodando. Var. = sobre a abertura do dia. Linhas em cinza não negociaram hoje (aparece a data do último negócio). ★ = ativo de um trade aberto.</div>`}
function lvcPaint(){if(tab!=='live')return;const b=$('#lvcb'),bar=$('#lvcbar');if(!b||!bar)return;
 if(!SESS||!window.CLOUD_OK){bar.innerHTML='<span class="mut">Entre na sua conta (Mais → Conta): as cotações chegam pelo Supabase.</span>';b.innerHTML='';return}
 const now=Date.now(),hoje=lvcHoje(),mine=new Set(S.trades.filter(t=>isOpen(t)&&lvKey(t)).map(lvKey)),
  all=(LV.all||[]).map(r=>({k:String(r.ticker).toUpperCase(),u:+r.ult,a:+r.abe,h:r.hor||'',d:r.dat||'',up:Date.parse(r.updated_at)||0})).filter(r=>r.u>0),
  live=all.filter(r=>now-r.up<30000).length,last=all.reduce((m,r)=>Math.max(m,r.up),0);
 bar.innerHTML=LV.err?'<span class="r">⚠️ '+esc(LV.err)+'</span>':!all.length?'<span class="mut">⚪ Nenhuma cotação ainda. Rode a ponte do Profit (iniciar.bat) com o Profit e o Excel abertos.</span>':live?'<span class="g">🟢 Ao vivo</span> <span class="mut">· '+hm(last)+' · '+all.length+' ativos</span>':'<span class="mut">⚪ Ponte parada. Última cotação às '+hm(last)+' ('+all.length+' ativos).</span>';
 let r=all.map(x=>({...x,v:x.a>0?(x.u/x.a-1)*100:null,st:!!x.d&&x.d!==hoje}));
 if(LVC.q)r=r.filter(x=>x.k.includes(LVC.q));
 if(LVC.f==='meus')r=r.filter(x=>mine.has(x.k));else if(LVC.f==='alta')r=r.filter(x=>x.v>0).sort((p,q)=>q.v-p.v);else if(LVC.f==='baixa')r=r.filter(x=>x.v<0).sort((p,q)=>p.v-q.v);
 if(LVC.f==='all'||LVC.f==='meus')r.sort((p,q)=>p.k<q.k?-1:1);
 b.innerHTML=r.length?r.map(x=>`<tr class="${x.st?'mut':''}"><td><b>${mine.has(x.k)?'★ ':''}${esc(x.k)}</b></td><td style="text-align:right">${f2(x.u)}</td><td class="${x.st?'':cls(x.v)}" style="text-align:right">${x.v==null?'–':(x.v>0?'+':'')+f2(x.v)+'%'}</td><td class="sm mut" style="text-align:right">${x.st?esc(x.d.slice(0,5)):esc(x.h)}</td></tr>`).join(''):'<tr><td colspan="4" class="mut" style="padding:10px 0">Nada para mostrar.</td></tr>'}
document.addEventListener('input',e=>{if(e.target&&e.target.id==='cq'){LVC.q=e.target.value.trim().toUpperCase();lvcPaint()}});
function vList(tp='D'){if(XV[tp]==='an')return xtHead(tp)+xtSw(tp)+analise(tp);const sw=tp==='S',ts=S.trades.filter(t=>(t.tipo||'D')===tp&&inPer(t.dt)).sort((a,b)=>b.dt.localeCompare(a.dt));const crT=ts.map(t=>({...t,c:calc(t)})).filter(t=>t.c.pl!=null),cr=crT.map(t=>t.c.pl);return `<div class="top"><h1>${{D:'Day trade',S:'Swing trade',O:'Opções'}[tp]}</h1><button class="btn" data-a="new" data-tp="${tp}">+ Novo trade</button></div>${xtSw(tp)}${capCard(tp)}${extrato(tp)}${perSel()}${filtBar()}${cr.length?`<div class="mut sm" style="margin-top:8px">${cr.length} fechado(s) · ${ts.length-cr.length} aberto(s) · resultado <b class="${cls(sum(cr))}">${mnyMix(somaMoedas(crT))}</b> · média por trade <b class="${cls(avg(cr))}">${mnyMix(mediaMoedas(crT))}</b></div>`:''}`+(ts.length?(fl(ts).map(card).join('')||'<p class="mut">Nada com esse filtro.</p>'):`<p class="mut">Nenhum trade ainda. ${tp==='O'?'Registre a opção com strike, vencimento e prêmios. O stop em prêmio define o risco.':sw?'Envie a foto do planejamento (entrada, stop e alvos), o stop inicial define o risco.':'Registre o primeiro, com as fotos de entrada e saída, o stop inicial e o resultado.'}</p>`)}
function sheet(){const t=T,slot=(k,l)=>`<div class="ph"><label>${l}</label><div class="pv">${t[k]?`<img data-img="${t[k]}">`:''}</div><label class="btn s" style="color:var(--tx)">${t[k]?'Trocar':'Adicionar'} foto<input type="file" accept="image/*" hidden data-k="${k}"></label></div>`,n=(k,l,ph='')=>`<label>${l}<input name="${k}" type="number" step="any" inputmode="decimal" value="${esc(t[k])}" placeholder="${ph}"></label>`;
return `<div class="ov"><div class="sh"><div class="top"><h2 style="margin:0">${isNew?'Novo trade':'Editar trade'}${t.tipo==='S'?' (swing)':t.tipo==='O'?' (opção)':''}</h2><button class="x" data-a="close">✕</button></div>
${isNew?'':`<label>Tipo de operação</label>${segs('tipo',t.tipo||'D',[['D','Day trade'],['S','Swing'],['O','Opção']])}<div class="mut sm" style="margin:-4px 0 8px">Ao salvar, o trade passa para a aba escolhida.</div>`}<label>Data e hora<input type="datetime-local" name="dt" value="${t.dt}"></label>
<div class="g2"><label>Ativo<input name="ativo" value="${esc(t.ativo)}" placeholder="WINZ26"></label><div><label>Lado</label>${segs('side',t.side,t.tipo==='O'?[['C','Comprado','g'],['V','Lançado','r']]:[['C','Compra','g'],['V','Venda','r']])}</div></div>
<label>Setup / estratégia<input name="setup" value="${esc(t.setup)}"></label>
<label>Tipo de mercado<select name="mkt">${opt(MK,t.mkt)}</select></label>
${t.tipo==='O'?`<div class="g2"><label>Subjacente<input name="sub" value="${esc(t.sub)}" placeholder="PETR4"></label><label>Call / Put<select name="ot">${opt([['C','Call'],['P','Put']],t.ot||'C')}</select></label></div><div class="g2">${n('strike','Strike')}<label>Vencimento<input type="date" name="venc" value="${esc(t.venc)}"></label></div><div class="g2">${n('spot','Subjacente na entrada')}<label>Estrutura<select name="estr">${opt(ESTR,t.estr)}</select></label></div><div class="mut sm">Em travas e estruturas, use o prêmio líquido: débito = Comprado, crédito = Lançado.</div>`:''}
<div class="g3">${n('entry',t.tipo==='O'?'Prêmio de entrada':'Entrada')}${n('stop',t.tipo==='O'?'Prêmio do stop':'Stop inicial')}${n('target',t.tipo==='O'?'Prêmio alvo 1':t.tipo==='S'?'Alvo 1':'Alvo')}</div>
${t.tipo==='S'||t.tipo==='O'?`<div class="g2">${n('target2','Alvo 2')}${n('target3','Alvo 3')}</div>`:''}<div class="g3">${n('exit',t.tipo==='O'?'Prêmio de saída':'Saída')}${n('qty',t.tipo==='O'?'Qtd. de opções (lote 100)':'Qtd.')}${n('pv',t.tipo==='O'?'Multiplicador (1)':'R$/ponto')}</div>
<div class="g2">${n('mep','Melhor preço no trade (MEP)')}${n('men','Pior preço no trade (MEN)')}</div><div class="mut sm" style="margin:-4px 0 8px">Opcional. Maior preço atingido (compra) ou menor (venda) em MEP; o contrário em MEN. Alimenta a aba Análise.</div>${n('cost','Custos totais (R$)')}<label>Data e hora da saída<input type="datetime-local" name="dtx" value="${esc(t.dtx)}"></label>
<div class="prev" id="prev"></div>
<h3>Fotos</h3><div class="g2">${t.tipo==='S'||t.tipo==='O'?slot('pplan','Planejamento (entrada, stop, alvos)'):''}${slot('pin','Entrada')}${slot('pout','Saída')}</div>
<h3>Disciplina</h3>
<label>Segui minhas regras?</label>${segs('rules',t.rules,[['s','Sim','g'],['n','Não','r']])}<label>Como eu estava antes de entrar?</label><div class="chips2">${EMO.map((e,i)=>`<button class="${t.emo==i+1?'on':''}" data-seg="emo" data-v="${i+1}">${e}</button>`).join('')}</div>
<label>Erro cometido (erro = não seguir suas regras)<select name="err">${opt(ERR,t.err)}</select></label>
<label>Anotações (por que entrei, o que senti, o que aprendi)<textarea name="nota">${esc(t.nota)}</textarea></label>${iaBlock(t.ia,calc(t),'t')}
<div id="msg" class="r" style="margin:8px 0"></div>
<div class="g2"><button class="btn" data-a="savetrade">Salvar</button>${isNew?'':`<button class="btn d" data-a="deltrade">${delArm?'Confirmar exclusão':'Excluir'}</button>`}</div></div></div>`}
function prev(){const p=$('#prev');if(!p||!T)return;const c=calc(T),d=T.side==='C'?1:-1,e=+T.entry,s=+T.stop;let h='';if(!(e&&s))h='<span class="mut">Informe entrada e stop inicial: sem stop não dá para medir o risco.</span>';else{if((e-s)*d<=0)h+='<div class="r">⚠ Stop do lado errado da entrada para '+(T.tipo==='O'?(T.side==='C'?'Comprado':'Lançado'):(T.side==='C'?'Compra':'Venda'))+'. Confira o Lado: se estiver errado, o resultado sai com o sinal trocado.</div>';h+=`Risco planejado: <b>${mT(T,c.risk)}</b>${pctConta(c.risk,moedaT(T),T.tipo)?' ('+pctConta(c.risk,moedaT(T),T.tipo).replace('+','')+')':''}`;if(c.rr!=null)h+=` · ganho/risco planejado <b>${f2(c.rr)} para 1</b>${c.rr<3?' <span class="r">(abaixo de 3 para 1)</span>':''}`;if(T.tipo==='S'||T.tipo==='O')['target2','target3'].forEach((k,i)=>{if(+T[k])h+=` · Alvo ${i+2}: <b>${f2(Math.abs(+T[k]-e)/Math.abs(e-s))}:1</b>`});if(c.pl!=null)h+=`<br>Resultado: <b class="${cls(c.pl)}">${mT(T,c.pl)}</b>${pctConta(c.pl,moedaT(T),T.tipo)?' <span class="'+cls(c.pl)+'">('+pctConta(c.pl,moedaT(T),T.tipo)+')</span>':''}${c.r!=null&&c.r<-1.05?' <span class="r">perda maior que o risco planejado: o stop foi respeitado?</span>':''}`}if(T.tipo==='O'&&e&&s){const k=+T.strike,dte=T.venc?Math.round((new Date(T.venc+'T12:00')-new Date(T.dt.slice(0,10)+'T12:00'))/864e5):null;h+='<br>';if(dte!=null)h+=`DTE: <b>${dte}</b> dia(s)${dte<=7?' <span class="r">(vencimento próximo: o tempo corrói o prêmio mais rápido)</span>':''} · `;if(k)h+=`Breakeven (opção simples): <b>${f2(T.ot==='P'?k-e:k+e)}</b> · `;h+=`Risco: <b>${pc(Math.abs(e-s)/e)}</b> do prêmio`}{const cc=capCalc(T.tipo||'D');if(cc&&cc.lotes!=null)h+='<br>Capital atual permite até <b>'+cc.lotes+'</b> '+CAPU[T.tipo||'D']+(cc.lotes===1?'':'s')+'.'}p.innerHTML=h}
function showSheet(){const o=document.querySelector('#sh .ov'),y=o?o.scrollTop:0;$('#sh').innerHTML=T?(QM?qsheet():sheet()):'';const o2=document.querySelector('#sh .ov');if(o2&&y)o2.scrollTop=y;document.body.style.overflow=T?'hidden':'';$('#fab').style.display=T?'none':fabDisp();fillImgs();prev()}
function closeSheet(keep){if(T&&!keep)['pin','pout','pplan'].forEach(k=>{if(T[k]&&T[k]!==orig[k])idb('img','delete',T[k])});T=null;QM=0;delArm=0;showSheet()}
/* ---------- Dia ---------- */
function vDia(){const d=S.days[D]||{chk:{}},ts=S.trades.filter(t=>t.dt.slice(0,10)===D).map(t=>({...t,c:calc(t)})),cl=ts.filter(t=>t.c.pl!=null),R=sum(cl.map(t=>t.c.r||0)),P=totBRL(somaMoedas(cl)),er=ts.filter(t=>t.err&&t.err!=='Nenhum').length;
const ta=(k,l,h='')=>`<label>${l}<textarea data-d="${k}" placeholder="${h}">${esc(d[k])}</textarea></label>`;
if(DV==='hist')return vDiaHist();return `<h1>Meu dia</h1>${diaSeg()}<div style="display:grid;grid-template-columns:auto 1fr auto;gap:6px;align-items:end"><button class="btn s" data-a="dprev">‹</button><label style="margin:0">Data<input type="date" id="dd" value="${D}"></label><button class="btn s" data-a="dnext">›</button></div>${D!==loc().slice(0,10)?'<button class="btn s" style="margin-top:6px" data-a="dtoday">Ir para hoje</button>':''}<div class="mut sm" id="svs" style="margin-top:6px"></div>
<div class="card" style="margin-top:12px"><b>Resumo automático</b><div class="mut">${ts.length} trade(s) · <span class="${cls(P)}">${mnyMix(somaMoedas(cl))}</span>${pctConta(P)?' · <span class="'+cls(P)+'">'+pctConta(P)+'</span>':''} · ${er} erro(s)</div></div>
<h2>☀️ Antes do mercado</h2>
<label>Como estou hoje?</label><div class="chips2">${EMO.map((e,i)=>`<button class="${d.energia==i+1?'on':''}" data-dseg="energia" data-v="${i+1}">${e}</button>`).join('')}</div><div class="g2" style="grid-template-columns:1fr"><label>Tipo de mercado hoje<select data-d="mkt"><option value="">–</option>${opt(MK,d.mkt)}</select></label></div>
${ta('plano','Plano do dia','Cenário, níveis, o que vou operar…')}
${ta('pre','Ensaio mental: o que pode dar errado hoje e como vou reagir?')}
<h2>✅ Checklist de regras <span class="mut sm" id="cnt"></span></h2>
<div class="card">${S.rules.length?S.rules.map(r=>`<label class="ck"><input type="checkbox" data-chk="${r.id}"${d.chk&&d.chk[r.id]?' checked':''}><span>${esc(r.t)}</span></label>`).join(''):'<span class="mut">Cadastre suas regras na aba Regras.</span>'}</div>
<h2>🌙 Depois do mercado (debriefing)</h2>
${ta('resumo','Como foi meu dia?')}
<label>Cometi algum erro hoje? (erro = não seguir minhas regras)<select data-d="erros"><option value="">–</option>${opt([['n','Não — bom trabalho, segui as regras'],['s','Sim']],d.erros)}</select></label>
${ta('cond','Em que condições errei? Quando podem se repetir?')}
${ta('prevn','O que vou fazer para não repetir? (ensaiar mentalmente)')}
${ta('bem','O que fiz bem hoje?')}
<div class="g2"><label>Nota do dia: <b id="nv">${d.nota===undefined||d.nota===''?'–':esc(d.nota)}</b><input type="range" min="0" max="10" step="1" data-d="nota" value="${esc(d.nota||0)}"></label></div>
${ta('aprend','Aprendizado principal')}${iaBlock(d.ia,cl.length?{r:R,pl:P}:null,'d')}<button class="btn" style="width:100%;margin-top:14px" data-a="dsave">💾 Salvar dia</button><div class="mut sm" style="margin-top:6px">Também é salvo automaticamente a cada alteração.</div>`}
function cnt(){const e=$('#cnt');if(!e)return;const c=(S.days[D]||{}).chk||{};e.textContent=Object.values(c).filter(Boolean).length+'/'+S.rules.length}
/* ---------- Regras ---------- */
function vRegras(){return `<h1>Minhas regras</h1><p class="mut sm">Para Tharp, erro é simplesmente não seguir suas regras escritas. As regras abaixo são sugestões inspiradas no livro: edite ou apague.</p>
<div class="card"><div class="g2"><label>Categoria<select id="rc">${opt(CATS.map((c,i)=>[i,c]),0)}</select></label><label>Nova regra<input id="rt" placeholder="Escreva a regra"></label></div><button class="btn" style="margin-top:10px" data-a="addrule">Adicionar regra</button></div>`+CATS.map((c,i)=>{const rs=S.rules.filter(r=>r.cat==i);return rs.length?`<h3>${c}</h3>`+rs.map(r=>`<div class="card g2" style="grid-template-columns:1fr auto;align-items:center"><input data-rid="${r.id}" value="${esc(r.t)}" style="margin:0"><button class="x" data-a="delrule" data-id="${r.id}">✕</button></div>`).join(''):''}).join('')}
/* ---------- Estatísticas ---------- */
function grp(ts,k,o){const g={};ts.forEach(t=>{(g[t[k]||'—']??=[]).push(t.c.r)});return Object.entries(g).sort((a,b)=>o===1?a[0].localeCompare(b[0]):o?o.indexOf(a[0])-o.indexOf(b[0]):0).map(([k,a])=>`<tr><td>${esc(k)}</td><td>${a.length}</td><td>${pc(a.filter(x=>x>0).length/a.length)}</td><td class="${cls(avg(a))}">${f2(avg(a))}R</td><td class="${cls(sum(a))}">${f2(sum(a))}R</td></tr>`).join('')}
const tbl=(h,rows)=>`<div class="card"><table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows}</table></div>`;
const qual=x=>x<.16?'Abaixo do tradável':x<.2?'Fraco, mas operável':x<.25?'Médio':x<.3?'Bom':x<.5?'Excelente':x<.7?'Soberbo':'Santo Graal';
function vStats(){const head='<div class="top"><h1>Estatísticas</h1><button class="btn s" data-a="csv" id="csvb">Exportar CSV</button></div>',ts=S.trades.filter(t=>inPer(t.dt)&&(TIPO==='all'||(t.tipo||'D')===TIPO)).map(t=>({...t,c:calc(t)})).filter(t=>t.c.r!=null).sort((a,b)=>a.dt.localeCompare(b.dt)),n=ts.length;
if(!n)return head+perSel()+tipoSel()+'<p class="mut">Feche trades com stop e saída para ver expectância, SQN e o custo dos seus erros. Tharp recomenda juntar de 100 a 200 trades.</p>';
const rs=ts.map(t=>t.c.r),m=avg(rs),sd=n>1?Math.sqrt(sum(rs.map(r=>(r-m)**2))/(n-1)):0,ratio=sd?m/sd:0,sqn=ratio*Math.sqrt(Math.min(n,100)),w=rs.filter(r=>r>0),l=rs.filter(r=>r<0),big=l.filter(r=>r<-1.05).length;
const cur=[];let c=0,pk=0,dd=0;rs.forEach(r=>{c+=r;cur.push(c);pk=Math.max(pk,c);dd=Math.max(dd,pk-c)});
const dm={};ts.forEach(t=>{const k=(t.dtx||t.dt).slice(0,10);dm[k]=(dm[k]||0)+t.c.pl});const dv=Object.values(dm);
const er=ts.filter(t=>t.err&&t.err!=='Nenhum'),ok=ts.filter(t=>!(t.err&&t.err!=='Nenhum')&&t.rules!=='n'),nr=ts.filter(t=>t.rules==='n');
const lo=Math.min(0,...cur),hi=Math.max(0,...cur),sc=v=>90-(v-lo)/((hi-lo)||1)*80,pt=cur.map((v,i)=>`${n>1?i/(n-1)*300:150},${sc(v)}`).join(' ');
const WD=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],ex=ts.map(t=>({...t,wd:WD[new Date(t.dt).getDay()],hr:t.dt.slice(11,13)+'h'}));let mw=0,ml=0,cw=0,cq=0;rs.forEach(r=>{if(r>0){cw++;cq=0}else if(r<0){cq++;cw=0}else{cw=0;cq=0}mw=Math.max(mw,cw);ml=Math.max(ml,cq)});
const kv=(a,b,k='',h='')=>`<div class="card"><span class="mut sm">${a}</span><b class="${k}">${b}</b><span class="mut sm">${h}</span></div>`;
return head+perSel()+tipoSel()+(n<30?'<div class="warn">Amostra pequena ('+n+' trades): use os números como pista, não como conclusão.</div>':'')+`<div class="kv" style="margin-top:8px">
${kv('Expectância (média de R)',fr(m),cls(m),'quanto você ganha por trade, em R')}${kv('Trades fechados',n,'',pc(w.length/n)+' de acerto')}
${kv('SQN',f2(sqn),'',qual(ratio)+' (média ÷ desvio = '+f2(ratio)+')')}${kv('Desvio-padrão de R',f2(sd)+'R')}
${kv('Média dos ganhos',fr(avg(w)),'g')}${kv('Média das perdas',fr(avg(l)),'r')}
${kv('Maior ganho / perda',fr(Math.max(...rs))+' / '+fr(Math.min(...rs)))}${kv('Perdas acima de 1R',big+' de '+l.length,big>l.length/2?'r':'','se a maioria passa de 1R, o stop não está sendo respeitado')}
${kv('Resultado total',money(sum(ts.map(t=>t.c.pl))),cls(sum(rs)),'custos: '+money(sum(ts.map(t=>+t.cost||0))))}${kv('Drawdown máximo',f2(dd)+'R','r')}
${kv('Dias ganhos / perdidos',dv.filter(x=>x>0).length+' / '+dv.filter(x=>x<0).length)}${kv('Melhor / pior dia',money(Math.max(...dv))+' / '+money(Math.min(...dv)))}</div>
<div class="rings">${ring(w.length/n*100,'Acerto')}${ring(ok.length/n*100,'Regras seguidas','var(--g)')}${ring((n-er.length)/n*100,'Sem erro','#e8a317')}</div><h2>Curva de capital (em R)</h2>${lineChart('eq',cur,ts.map(t=>fdt(t.dtx||t.dt).slice(0,5)+' '+(t.ativo||'')),v=>fr(v))}<h2>Resultado por dia</h2>${(()=>{const dk=Object.keys(dm).sort().slice(-20);return barChart('dia',dk.map(k=>dm[k]),dk.map(k=>k.slice(8)+'/'+k.slice(5,7)))})()}
<h2>Disciplina e erros</h2><div class="kv">${kv('Eficiência (trades sem erro)',pc((n-er.length)/n),er.length?'':'g')}${kv('Erros a cada 100 trades',f2(er.length/n*100))}
${kv('R líquido dos trades com erro',fr(sum(er.map(t=>t.c.r))),cls(sum(er.map(t=>t.c.r))))}${kv('Expectância: regras seguidas × quebradas',fr(avg(ok.map(t=>t.c.r)))+' × '+fr(avg(nr.map(t=>t.c.r))))}</div>
${er.length?tbl(['Erro','Nº','Acerto','Média','R total'],grp(er,'err')):''}
<h2>Por tipo de mercado</h2>${tbl(['Mercado','Nº','Acerto','Média','R total'],grp(ts,'mkt'))}
<h2>Por setup</h2>${tbl(['Setup','Nº','Acerto','Média','R total'],grp(ts,'setup'))}<h2>Por dia da semana</h2>${tbl(['Dia','Nº','Acerto','Média','R total'],grp(ex,'wd',['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']))}<h2>Por horário de entrada</h2>${tbl(['Hora','Nº','Acerto','Média','R total'],grp(ex,'hr',1))}<h2>Sequências</h2><div class="kv">${kv('Maior sequência de ganhos',mw,'g')}${kv('Maior sequência de perdas',ml,'r')}${kv('Sequência atual',cw?cw+' ganho(s)':cq?cq+' perda(s)':'–',cw?'g':cq?'r':'')}</div><h2>Distribuição dos R</h2>${hist(rs)}${ts.some(t=>t.tipo==='O')?`<h2>Opções por estrutura</h2>${tbl(['Estrutura','Nº','Acerto','Média','R total'],grp(ts.filter(t=>t.tipo==='O'),'estr'))}`:''}`}
async function csv(){const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"',h=['data','ativo','lado','setup','mercado','entrada','stop','alvo','saida','qtd','valor_ponto','custos','risco_1R','resultado','R','seguiu_regras','erro','emocional','nota','tipo','alvo2','alvo3','subjacente','call_put','strike','vencimento','estrutura','saida_em'];const rows=S.trades.map(t=>{const c=calc(t);return [t.dt,t.ativo,t.side,t.setup,t.mkt,t.entry,t.stop,t.target,t.exit,t.qty,t.pv,t.cost,c.risk,c.pl,c.r,t.rules,t.err,t.emo,t.nota,t.tipo||'D',t.target2,t.target3,t.sub,t.ot,t.strike,t.venc,t.estr,t.dtx].map(q).join(',')});await saveFile('diario-trades.csv','\ufeff'+h.join(',')+'\n'+rows.join('\n'))}
function vGraf(){const op=S.trades.filter(t=>t.tipo==='S'&&calc(t).r==null),w=[...new Set([...(S.watch||[]),...op.map(t=>(t.ativo||'').toUpperCase()).filter(Boolean),...S.trades.filter(t=>t.tipo==='O'&&t.sub&&calc(t).r==null).map(t=>t.sub.toUpperCase())])];
return `<h1>Gráficos</h1><p class="mut sm">Gráfico ao vivo não carrega dentro desta página (conexões externas são bloqueadas aqui). O botão abre o gráfico em tempo real no TradingView em outra aba. Ativo fora da B3: digite com a bolsa, ex.: NASDAQ:AAPL.</p><div class="card"><div class="g2" style="grid-template-columns:1fr auto;align-items:end"><label>Adicionar ativo<input id="wt" placeholder="PETR4"></label><button class="btn" data-a="addw">Adicionar</button></div></div>`+(w.length?w.map(a=>{const ls=op.filter(t=>(t.ativo||'').toUpperCase()===a).map(t=>`Entrada ${esc(t.entry)} · Stop ${esc(t.stop)}${[t.target,t.target2,t.target3].filter(Boolean).map((x,i)=>` · Alvo ${i+1} ${esc(x)}`).join('')}`).join('<br>');return `<div class="card"><div class="top"><b>${esc(a)}</b><span><button class="btn s" data-a="chart" data-id="${esc(a)}">${OPEN[a]?'Fechar':'Ver gráfico aqui'}</button> <a class="btn s" href="https://www.tradingview.com/chart/?symbol=${encodeURIComponent(sym(a))}" target="_blank" rel="noopener noreferrer">Gráfico ao vivo ↗</a>${(S.watch||[]).includes(a)?` <button class="x" data-a="delw" data-id="${esc(a)}">✕</button>`:''}</span></div>${ls?`<div class="mut sm" style="margin-top:6px">${ls}</div>`:''}${OPEN[a]?`<iframe src="https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(sym(a))}&interval=D&theme=${matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}&locale=br&timezone=America%2FSao_Paulo&allow_symbol_change=1" style="width:100%;height:420px;border:0;margin-top:8px;border-radius:8px"></iframe><div class="mut sm">Quadro em branco ou aviso de símbolo indisponível? Use o botão "Gráfico ao vivo ↗".</div>`:''}</div>`}).join(''):'<p class="mut">Adicione ativos para acompanhar. Seus swing trades abertos aparecem aqui sozinhos, com entrada, stop e alvos.</p>')}
const KV=(a,b,k='',h='')=>`<div class="card"><span class="mut sm">${a}</span><b class="${k}">${b}</b><span class="mut sm">${h}</span></div>`;
function hist(rs){const L=['≤ −2R','−2 a −1R','−1 a 0R','0 a 1R','1 a 2R','2 a 3R','> 3R'],c=L.map(()=>0);rs.forEach(r=>c[r<=-2?0:r<=-1?1:r<0?2:r<1?3:r<2?4:r<=3?5:6]++);const m=Math.max(...c,1);return `<div class="card">${L.map((l,i)=>`<div style="display:flex;gap:8px;align-items:center;font-size:12px;margin:3px 0"><span style="width:70px">${l}</span><div style="flex:1"><div style="height:12px;border-radius:4px;width:${c[i]/m*100}%;background:${i<3?'var(--r)':'var(--g)'}"></div></div><b>${c[i]}</b></div>`).join('')}</div>`}
async function saveFile(n,data,type='text/csv'){try{if(typeof claude!=='undefined'){const dl=await claude.use('downloads');if(dl){await dl.save({filename:n,data});return}}}catch(e){}const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=n;document.body.appendChild(a);a.click();a.remove()}
async function backup(){const imgs={};for(const t of S.trades)for(const k of['pin','pout','pplan'])if(t[k]){const b=M[t[k]]||await idb('img','get',t[k]);if(b)imgs[t[k]]=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)})}await saveFile('diario-backup-'+loc().slice(0,10)+'.json',JSON.stringify({v:1,S,imgs}),'application/json');S.lastBackup=loc().slice(0,10);save()}
async function restore(f){try{const j=JSON.parse(await f.text()),o=j.S;if(!o)throw 0;for(const[id,u]of Object.entries(j.imgs||{})){const bin=atob(u.split(',')[1]),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);const b=new Blob([a],{type:'image/jpeg'});M[id]=b;await idb('img','put',b,id)}(o.trades||[]).forEach(t=>{const i=S.trades.findIndex(x=>x.id===t.id);i>=0?S.trades[i]=t:S.trades.push(t)});S.days={...S.days,...(o.days||{})};S.ops=unionU(o.ops,S.ops,{});S.lanc=unionU(o.lanc,S.lanc,{});if((o.rules||[]).length)S.rules=o.rules;S.watch=[...new Set([...(S.watch||[]),...(o.watch||[])])];['prop','goals','rev','pn','ax'].forEach(k=>{if(o[k])S[k]={...(S[k]||{}),...o[k]}});if((o.books||[]).length){const m=new Map((S.books||[]).map(b=>[b.id,b]));o.books.forEach(b=>{const x=m.get(b.id);if(!x||(b.u||0)>=(x.u||0))m.set(b.id,b)});S.books=[...m.values()]}save();return 'Backup restaurado: '+(o.trades||[]).length+' trade(s).'}catch(e){return 'Arquivo de backup inválido.'}}
/* ---------- Painel ---------- */
let Z={pct:1},RP='w0',CM=loc().slice(0,7);
const ymd=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
function rng(k){const n=new Date();let a,b,l;if(k[0]==='w'){a=new Date();a.setHours(12);a.setDate(a.getDate()-((a.getDay()+6)%7)-(k==='w1'?7:0));b=new Date(a);b.setDate(b.getDate()+6)}else{const o=k==='m1'?-1:0;a=new Date(n.getFullYear(),n.getMonth()+o,1);b=new Date(n.getFullYear(),n.getMonth()+o+1,0)}return[ymd(a),ymd(b),k+ymd(a)]}
function vPainel(){const P=S.prop||{},G=S.goals||{},f=(k,l)=>`<label>${l}<input type="number" step="any" inputmode="decimal" data-p="${k}" value="${esc(P[k])}"></label>`,z=(k,l)=>`<label>${l}<input type="number" step="any" inputmode="decimal" data-z="${k}" value="${esc(Z[k])}" ${k==='cap'?`placeholder="${esc(P.cap)}"`:''}></label>`;
return `<h1>Painel</h1><h2>🛡️ Mesa proprietária</h2><p class="mut sm">Preencha as regras da sua conta. O painel usa seus trades fechados.</p>
<div class="g2">${f('cap','Capital inicial (R$)')}${f('meta','Meta de lucro (R$)')}</div><div class="g2">${f('perdaDia','Perda máx. diária (R$)')}${f('ddTotal','Drawdown máx. total (R$)')}</div>
<div class="g2">${f('consist','Consistência: maior dia ≤ (% do lucro)')}<label>Tipo de drawdown<select data-p="ddTipo">${opt([['trail','Trailing (do pico)'],['fixo','Fixo (do capital inicial)']],P.ddTipo||'trail')}</select></label></div><div id="pp" style="margin-top:8px"></div>
<h2>🎯 Metas de processo</h2><div class="g2"><label>Máx. de trades por dia<input type="number" data-g="maxTr" value="${esc(G.maxTr)}"></label><label>Regras seguidas na semana (%)<input type="number" data-g="regPct" value="${esc(G.regPct)}"></label></div><div id="gg" style="margin-top:8px"></div>
<h2>🧮 Tamanho da posição</h2><div class="g2">${z('cap','Capital (R$)')}${z('pct','Risco por trade (%)')}</div><div class="g3">${z('entry','Entrada')}${z('stop','Stop')}${z('pv','R$/ponto')}</div><div class="prev" id="zz"></div><div class="mut sm">R$/ponto: WIN 0,20 · WDO 10 · ações 1.</div>
<h2>💾 Backup completo</h2><p class="mut sm">Salva trades, fotos, dias, regras e painel em um arquivo .json. Restaurar mescla com o que já existe neste aparelho.</p><div class="g2"><button class="btn" data-a="bk">Exportar backup</button><label class="btn s" style="margin:0;text-align:center;color:var(--tx)">Restaurar backup<input type="file" accept=".json,application/json" hidden id="bkf"></label></div><div id="bm" class="mut sm" style="margin-top:8px">${S.lastBackup?'Último backup: '+S.lastBackup.split('-').reverse().join('/'):'Nenhum backup feito ainda.'}</div>`}
function ppOut(){const e=$('#pp');if(!e)return;const P=S.prop||{},cl=S.trades.map(t=>({...t,c:calc(t)})).filter(t=>t.c.pl!=null).sort(cmpCron),cap=+P.cap||0,td=loc().slice(0,10),dm={};let eq=cap,pk=cap;cl.forEach(t=>{eq+=t.c.pl;pk=Math.max(pk,eq);const d=(t.dtx||t.dt).slice(0,10);dm[d]=(dm[d]||0)+t.c.pl});
const tot=eq-cap,ddv=P.ddTipo==='fixo'?Math.max(0,cap-eq):pk-eq,hoje=dm[td]||0,dv=Object.values(dm),best=dv.length?Math.max(...dv):0,L=n=>+P[n]||0;
const bar=(v,max,inv)=>{const p=max>0?Math.min(100,Math.max(0,v/max*100)):0,c=inv?(p>=80?'var(--r)':p>=50?'#e8a317':'var(--g)'):'var(--ac)';return `<div style="height:8px;background:var(--bg);border-radius:6px;margin:4px 0;border:1px solid var(--bd)"><div style="height:100%;width:${p}%;background:${c};border-radius:6px"></div></div>`},row=(t,m,sb,b)=>`<div class="card"><b>${t}</b> <span class="mut sm">${sb}</span><div>${m}</div>${b}</div>`;let h='';
if(L('perdaDia')){const u=Math.max(0,-hoje);h+=row('Perda diária hoje',`${money(u)} de ${money(L('perdaDia'))}`,'restam '+money(Math.max(0,L('perdaDia')-u)),bar(u,L('perdaDia'),1))+(u>=L('perdaDia')*.8?'<div class="warn">⚠ Perto (ou acima) do limite de perda diária: pare de operar hoje.</div>':'')}
if(L('ddTotal'))h+=row('Drawdown '+(P.ddTipo==='fixo'?'fixo':'trailing'),`${money(ddv)} de ${money(L('ddTotal'))}`,'restam '+money(Math.max(0,L('ddTotal')-ddv)),bar(ddv,L('ddTotal'),1));
if(L('meta'))h+=row('Meta de lucro',`${money(tot)} de ${money(L('meta'))}`,pc(Math.max(0,tot)/L('meta')),bar(Math.max(0,tot),L('meta')));
if(L('consist')&&tot>0){const sh=best/tot*100;h+=row('Consistência',`Maior dia: ${money(best)} = ${f2(sh)}% do lucro`,'limite '+L('consist')+'%',bar(sh,L('consist'),1))+(sh>L('consist')?`<div class="warn">⚠ Maior dia acima do limite. O lucro total precisa chegar a ${money(best/(L('consist')/100))} (sem novo dia maior).</div>`:'')}
e.innerHTML=h||'<p class="mut sm">Preencha os limites acima para ver o painel.</p>'}
function ggOut(){const e=$('#gg');if(!e)return;const G=S.goals||{},td=loc().slice(0,10),n=S.trades.filter(t=>t.dt.slice(0,10)===td).length,[a,b]=rng('w0'),w=S.trades.filter(t=>{const d=t.dt.slice(0,10);return d>=a&&d<=b}),ok=w.filter(t=>t.rules!=='n'&&(!t.err||t.err==='Nenhum')).length,ds=[...new Set([...S.trades.map(t=>t.dt.slice(0,10)),...Object.keys(S.days).filter(d=>S.days[d].resumo||S.days[d].erros)])].sort(),clean=d=>!S.trades.some(t=>t.dt.slice(0,10)===d&&(t.rules==='n'||(t.err&&t.err!=='Nenhum')))&&(S.days[d]||{}).erros!=='s';let run=0,best=0;ds.forEach(d=>{run=clean(d)?run+1:0;best=Math.max(best,run)});const over=+G.maxTr&&n>+G.maxTr,pr=w.length?ok/w.length*100:null;
e.innerHTML=`<div class="kv">${KV('Dias seguidos sem erro',run,run?'g':'','melhor: '+best)}${KV('Trades hoje',n+(+G.maxTr?' / '+G.maxTr:''),over?'r':'',over?'acima do limite: pare':'')}${KV('Regras seguidas (semana)',pr==null?'–':Math.round(pr)+'%',pr!=null&&+G.regPct&&pr<+G.regPct?'r':'g',+G.regPct?'meta '+G.regPct+'%':'')}</div>`}
function zzOut(){const e=$('#zz');if(!e)return;const P=S.prop||{},cap=+(Z.cap||P.cap),pct=+Z.pct,en=+Z.entry,st=+Z.stop,pv=+Z.pv||1;if(!(cap&&pct&&en&&st&&en!==st)){e.innerHTML='<span class="mut">Informe capital, % de risco, entrada e stop.</span>';return}const R=cap*pct/100,ru=Math.abs(en-st)*pv,q=Math.floor(R/ru);e.innerHTML=`Risco por trade: <b>${money(R)}</b><br>Risco por unidade: ${money(ru)}<br>Tamanho sugerido: <b>${q}</b> ${q<1?'<span class="r">(stop largo demais para esse risco)</span>':`<br>Risco real: ${money(q*ru)} (${f2(q*ru/cap*100)}% do capital)`}`}
/* ---------- Revisão ---------- */
const MES=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function cal(){const[y,m]=CM.split('-').map(Number),dim=new Date(y,m,0).getDate(),off=new Date(y,m-1,1).getDay(),dm={};S.trades.forEach(t=>{const c=calc(t);if(c.pl!=null&&(t.dtx||t.dt).slice(0,7)===CM){const d=(t.dtx||t.dt).slice(0,10);dm[d]=(dm[d]||0)+c.pl}});
let h=`<div class="top"><button class="btn s" data-a="cprev">‹</button><b>${MES[m-1]} ${y}</b><button class="btn s" data-a="cnext">›</button></div><div class="cal">${['D','S','T','Q','Q','S','S'].map(x=>`<i class="mut sm">${x}</i>`).join('')}`+'<i></i>'.repeat(off);for(let i=1;i<=dim;i++){const d=`${CM}-${String(i).padStart(2,'0')}`,v=dm[d];h+=`<button data-a="cday" data-id="${d}" class="${v>0?'cg':v<0?'cr':''}">${i}<span>${v==null?'':Math.round(v)}</span></button>`}return h+'</div><div class="mut sm">Verde: dia positivo · Vermelho: dia negativo (R$). Toque no dia para abrir o registro.</div>'}
function vRev(){const[a,b,key]=rng(RP),ts=S.trades.map(t=>({...t,c:calc(t)})).filter(t=>{const d=t.dt.slice(0,10);return d>=a&&d<=b&&t.c.pl!=null}),n=ts.length,rs=ts.map(t=>t.c.pl),rv=(S.rev||{})[key]||{},ds=Object.keys(S.days).filter(d=>d>=a&&d<=b),nt=ds.map(d=>S.days[d].nota).filter(x=>x!==''&&x!=null).map(Number),eg={};ts.filter(t=>t.err&&t.err!=='Nenhum').forEach(t=>{eg[t.err]=(eg[t.err]||0)+emBRL(t.c.pl,moedaT(t))});const top=Object.entries(eg).sort((x,y)=>x[1]-y[1])[0],ta=(k,l)=>`<label>${l}<textarea data-rv="${k}">${esc(rv[k])}</textarea></label>`;
return `<h1>Revisão</h1>${cal()}<h2>Revisão do período</h2><label>Período<select id="rp">${opt([['w0','Esta semana'],['w1','Semana passada'],['m0','Este mês'],['m1','Mês passado']],RP)}</select></label><div class="mut sm">${a.split('-').reverse().join('/')} a ${b.split('-').reverse().join('/')}</div>`+(n?`<div class="kv" style="margin-top:8px">${KV('Trades',n,'',pc(rs.filter(r=>r>0).length/n)+' de acerto')}${KV('Resultado',mnyMix(somaMoedas(ts)),cls(sum(rs)),pctConta(totBRL(somaMoedas(ts))))}${KV('Média por trade',mnyMix(mediaMoedas(ts)),cls(avg(rs)))}${KV('Regras seguidas',pc(ts.filter(t=>t.rules!=='n').length/n))}${KV('Nota média do dia',nt.length?f2(avg(nt)):'–')}${KV('Dias registrados',ds.length)}</div>${top?`<div class="card">Erro mais caro: <b>${esc(top[0])}</b> <span class="r">${money(top[1])}</span></div>`:'<div class="card g">Nenhum erro registrado no período 👏</div>'}`:'<p class="mut">Sem trades fechados neste período.</p>')+ta('repetir','O que vou repetir (o que funcionou)?')+ta('parar','O que vou parar de fazer?')+ta('plano','Foco para o próximo período')}
function vTrades(tp='D'){if(tp==='D')return vList(tp);if(XV[tp]==='an')return xtHead(tp)+xtSw(tp)+analise(tp);const vw=VW[tp]||'ab',ts=S.trades.filter(t=>t.tipo===tp&&inPer(t.dt)),ab=ts.filter(isOpen).sort((a,b)=>b.dt.localeCompare(a.dt));
return `<div class="top"><h1>${tp==='O'?'Opções':'Swing trade'}</h1><button class="btn" data-a="new" data-tp="${tp}">+ Novo trade</button></div>${xtSw(tp)}${capCard(tp)}${extrato(tp)}<div class="${tp==='S'?'g3':'g2'}" style="margin:8px 0"><button class="btn ${vw==='ab'?'':'s'}" data-a="vw" data-tp="${tp}" data-id="ab">Abertas (${ab.length})</button><button class="btn ${vw==='pf'?'':'s'}" data-a="vw" data-tp="${tp}" data-id="pf">Performance</button>${tp==='S'?`<button class="btn ${vw==='sc'?'':'s'}" data-a="vw" data-tp="S" data-id="sc">Scanner</button>`:''}</div>${vw==='sc'?'':perSel()}${vw==='pf'?filtBar():''}`+(vw==='sc'&&tp==='S'?vScan():vw==='ab'?(ab.length?ab.map(card).join(''):`<p class="mut">Nenhuma posição aberta. ${tp==='O'?'Registre a montagem com strike, vencimento e prêmio de entrada.':'Registre a entrada com o planejamento (entrada, stop e alvos).'} Depois use o botão Encerrar quando sair.</p>`):perfView(ts))}
function perfView(ts){const cl=fl(ts).map(t=>({...t,c:calc(t)})).filter(t=>t.c.pl!=null).sort((a,b)=>(b.dtx||b.dt).localeCompare(a.dtx||a.dt));if(!cl.length)return '<p class="mut">Nenhuma operação encerrada no período.</p>';const rs=cl.map(t=>t.c.pl),P=sum(rs),mo=moedaT(cl[0]),tp0=cl[0].tipo||'D';
return `<div class="kv" style="margin-top:8px">${KV('Resultado',mnyMix(somaMoedas(cl)),cls(P),cl.length+' operação(ões)'+(pctConta(P,mo,tp0)?' · '+pctConta(P,mo,tp0):''))}${KV('Média por trade',mnyMix(mediaMoedas(cl)),cls(avg(rs)))}${KV('Acerto',pc(rs.filter(r=>r>0).length/rs.length))}${KV('Maior ganho / perda',mnyC(Math.max(...rs),mo)+' / '+mnyC(Math.min(...rs),mo))}</div><div class="card" style="margin-top:8px"><table><tr><th>Ativo</th><th>Entrada</th><th>Saída</th><th>Resultado</th></tr>${cl.map(t=>`<tr data-a="edit" data-id="${t.id}" style="cursor:pointer"><td>${esc(t.ativo)||'—'}<div class="mut sm">${fdt(t.dtx||t.dt).slice(0,5)}${t.tipo==='O'&&t.strike?' · '+(t.ot==='P'?'Put':'Call')+' '+esc(t.strike):''}</div></td><td>${esc(t.entry)}</td><td>${esc(t.exit)}</td><td class="${cls(t.c.pl)}">${mT(t,t.c.pl)}<div class="sm">${pctConta(t.c.pl,moedaT(t),t.tipo||'D')}</div></td></tr>`).join('')}</table></div>`}
function qsheet(){const t=T,nn=(k,l)=>`<label>${l}<input name="${k}" type="number" step="any" inputmode="decimal" value="${esc(t[k])}"></label>`;return `<div class="ov"><div class="sh"><div class="top"><h2 style="margin:0">Encerrar posição</h2><button class="x" data-a="close">✕</button></div>${String(t.ativo||'').trim()?`<div class="card"><b>${esc(t.ativo)}</b></div>`:`<label>Ativo (obrigatório)<input name="ativo" value="" placeholder="WINZ26" autocapitalize="characters"></label>`}<label>Lado</label>${segs('side',t.side,t.tipo==='O'?[['C','Comprado','g'],['V','Lançado','r']]:[['C','Compra','g'],['V','Venda','r']])}<div class="g3">${nn('entry',t.tipo==='O'?'Prêmio de entrada':'Entrada')}${nn('stop',t.tipo==='O'?'Prêmio do stop':'Stop inicial')}${nn('qty','Qtd.')}</div>${t.tipo==='O'?'':nn('pv','R$/ponto')}
<div class="g2">${nn('mep','Melhor preço (MEP)')}${nn('men','Pior preço (MEN)')}</div><label>${t.tipo==='O'?'Prêmio de saída':'Preço de saída'}<input name="exit" type="number" step="any" inputmode="decimal" value="${esc(t.exit)}"></label>
<div class="g2"><label>Custos totais (R$)<input name="cost" type="number" step="any" inputmode="decimal" value="${esc(t.cost)}"></label><label>Data e hora da saída<input type="datetime-local" name="dtx" value="${esc(t.dtx)}"></label></div><div class="prev" id="prev"></div>
<h3>Foto da saída</h3><div class="ph"><div class="pv">${t.pout?`<img data-img="${t.pout}">`:''}</div><label class="btn s" style="color:var(--tx)">${t.pout?'Trocar':'Adicionar'} foto<input type="file" accept="image/*" hidden data-k="pout"></label></div>
<label>Segui minhas regras?</label>${segs('rules',t.rules,[['s','Sim','g'],['n','Não','r']])}<label>Erro cometido<select name="err">${opt(ERR,t.err)}</select></label>
<label>Anotações<textarea name="nota">${esc(t.nota)}</textarea></label><div id="msg" class="r" style="margin:8px 0"></div><button class="btn" data-a="savetrade" style="width:100%">Encerrar posição</button></div></div>`}
function zoom(src){const l=$('#lb');l.innerHTML=`<button class="x" data-a="lbx" style="position:fixed;top:calc(8px + env(safe-area-inset-top,0px));right:12px;color:#fff;font-size:30px;z-index:2">✕</button><img src="${src}" style="width:100%;display:block;margin:auto">`;l.style.display='block'}
function bkBanner(){if(tab==='painel'||!S.trades.length)return;if(SESS&&S.lastSyncAt&&Date.now()-S.lastSyncAt<3*864e5)return;const d=S.lastBackup?Math.floor((Date.now()-new Date(S.lastBackup+'T12:00'))/864e5):null;if(d!=null&&d<=7)return;$('#app').insertAdjacentHTML('afterbegin',`<div class="warn" style="margin-bottom:8px">💾 ${d==null?'Você ainda não fez backup.':'Último backup há '+d+' dias.'} Fotos e trades ficam só neste aparelho. <button class="btn s" data-a="gopainel" style="margin-left:6px">Fazer backup</button></div>`)}
function vHome(){const td=loc().slice(0,10),hj=S.trades.map(t=>({...t,c:calc(t)})).filter(t=>t.c.pl!=null&&(t.dtx||t.dt).slice(0,10)===td),P=sum(hj.map(t=>t.c.pl)),R=sum(hj.map(t=>t.c.r)),ab=S.trades.filter(isOpen).sort((a,b)=>b.dt.localeCompare(a.dt)),nck=Object.values((S.days[td]||{}).chk||{}).filter(Boolean).length,ven=ab.filter(t=>t.tipo==='O'&&t.venc).map(t=>({t,d:Math.round((new Date(t.venc+'T12:00')-new Date(td+'T12:00'))/864e5)})).filter(x=>x.d<=7).sort((a,b)=>a.d-b.d);
return `<section data-hb="hero">${hero(P,R,hj.length,ab.length,nck)}</section><section data-hb="cap">${capTotal()}</section><section data-hb="posso">${posso(hj,P,nck)}</section><section data-hb="turno">${turnoCard()}</section><section data-hb="venc">${ven.length?'<h2>⏳ Vencimentos próximos</h2>'+ven.map(x=>`<div class="warn" style="margin:6px 0">${esc(x.t.ativo)} · ${x.d<0?'venceu há '+(-x.d)+' dia(s)':x.d===0?'vence hoje':'vence em '+x.d+' dia(s)'}</div>`).join(''):''}</section><section data-hb="pos"><h2>Posições abertas (${ab.length})</h2>${ab.length?ab.map(card).join(''):'<p class="mut">Nenhuma posição aberta.</p>'}</section><section data-hb="lim"><h2>Limites da mesa</h2><div id="pp"></div></section><section data-hb="metas"><h2>Metas de processo</h2><div id="gg"></div></section><section data-hb="cal">${calMes()}</section><section data-hb="acoes"><div class="g2" style="margin-top:12px"><button class="btn" data-a="new" data-tp="D">+ Day trade</button><button class="btn s" data-a="gotab" data-id="dia">Abrir o dia</button></div></section>`}
/* ---------- Nuvem (Supabase) ---------- */
const ls={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const cfg=()=>window.SUPA_URL&&window.SUPA_KEY?{url:String(window.SUPA_URL).replace(/\/$/,''),key:window.SUPA_KEY}:ls.get('diario-cfg');
const hm=(t=Date.now())=>new Date(t).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
const em=e=>{const m=String(e&&e.message||e);return /Invalid login/i.test(m)?'E-mail ou senha incorretos.':/not confirmed/i.test(m)?'Confirme seu e-mail antes de entrar.':/already registered/i.test(m)?'E-mail já cadastrado: use Entrar.':/Failed to fetch|NetworkError|Load failed/i.test(m)?'Sem conexão com a internet.':/at least/i.test(m)?'A senha precisa ter pelo menos 6 caracteres.':m};
const seedRules=()=>{S.rules=SEED.map(([cat,t])=>({id:uid(),cat,t}))};
async function rq(path,o={},auth=true){const c=cfg();if(!c)throw new Error('Configure o Supabase.');if(auth)await tok();const bt=o.tok||(auth&&SESS?SESS.at:/^eyJ/.test(c.key)?c.key:''),h={apikey:c.key,...(bt?{Authorization:'Bearer '+bt}:{}),...(o.headers||{})},r=await fetch(c.url+path,{...o,headers:h});if(!r.ok){let m='';try{const j=await r.json();m=j.msg||j.message||j.error_description||j.error||''}catch(e){}const x=new Error(m||('Erro '+r.status));x.status=r.status;throw x}return r}
function setSess(j,email){SESS={at:j.access_token,rt:j.refresh_token,exp:Date.now()+(j.expires_in||3600)*1000,uid:j.user.id,email:email||j.user.email};ls.set('diario-sess',SESS)}
async function tok(){if(!SESS)throw new Error('Entre na sua conta.');if(SESS.exp-Date.now()>60000)return;try{const r=await rq('/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:SESS.rt})},false);setSess(await r.json(),SESS.email)}catch(e){if(e.status===400||e.status===401){SESS=null;ls.del('diario-sess');throw new Error('Sessão expirada: entre novamente.')}throw e}}
async function hashAuth(){const hp=new URLSearchParams(location.hash.slice(1)),at=hp.get('access_token');if(!at)return;history.replaceState(null,'',location.pathname);if(hp.get('type')==='recovery'){RECOV=at;tab='conta';return}try{const u=await(await rq('/auth/v1/user',{tok:at},false)).json();setSess({access_token:at,refresh_token:hp.get('refresh_token'),expires_in:+hp.get('expires_in')||3600,user:u},u.email);tab='conta'}catch(e){}}
async function doAuth(mode){const e=$('#ce').value.trim(),p=$('#cp').value;SY.email=e;if(!e||p.length<6){SY.msg='Informe e-mail e senha (mínimo 6 caracteres).';render();return}SY.msg='Aguarde…';render();try{const body=JSON.stringify({email:e,password:p}),H={'Content-Type':'application/json'};if(mode==='up'){const j=await(await rq('/auth/v1/signup',{method:'POST',headers:H,body},false)).json();if(!j.access_token){SY.msg='Conta criada. Confirme o e-mail que você recebeu e depois toque em Entrar.';AM='in';render();return}setSess(j,e)}else setSess(await(await rq('/auth/v1/token?grant_type=password',{method:'POST',headers:H,body},false)).json(),e);if(S.uid&&S.uid!==SESS.uid){S={trades:[],days:{},rules:[],seed:1,mt:0};seedRules()}SY.msg='';render();await sync(1)}catch(x){SY.msg=em(x);render()}}
const pub=()=>{const{uid,st,up,lastSyncAt,...x}=S;return x};
function syncSoon(){clearTimeout(sT);if(SESS)sT=setTimeout(()=>sync(),3000)}
function uiSy(){const e=$('#sy');if(e)e.textContent=SY.msg}
function adopt(c){const k={uid:S.uid,up:S.up};S={trades:[],days:{},rules:[],seed:1,...c,...k,st:c.mt};persist()}
function mergeIn(c){const del={...(c.del||{}),...(S.del||{})},tm=new Map();[...(c.trades||[]),...S.trades].forEach(t=>{const o=tm.get(t.id);if(!o||(t.u||0)>=(o.u||0))tm.set(t.id,t)});const trades=[...tm.values()].filter(t=>!(del[t.id]&&del[t.id]>=(t.u||0))),days={...(c.days||{})};for(const[k,v]of Object.entries(S.days||{}))if(!days[k]||(v.u||0)>=(days[k].u||0))days[k]=v;const rm=new Map();[...(c.rules||[]),...S.rules].forEach(r=>rm.set(r.id,r));const rules=[...rm.values()].filter(r=>!del[r.id]),bkm=new Map(),base=S.mt>=(c.mt||0)?S:c,oth=base===S?c:S;[...(c.books||[]),...(S.books||[])].forEach(b=>{const o=bkm.get(b.id);if(!o||(b.u||0)>=(o.u||0))bkm.set(b.id,b)});const books=[...bkm.values()].filter(b=>!(del[b.id]&&del[b.id]>=(b.u||0)));S={...oth,...base,trades,days,rules,books,del,ops:unionU(c.ops,S.ops,del),lanc:unionU(c.lanc,S.lanc,del),pn:{...(oth.pn||{}),...(base.pn||{})},ax:{...(oth.ax||{}),...(base.ax||{})},rev:{...(oth.rev||{}),...(base.rev||{})},watch:[...new Set([...(c.watch||[]),...(S.watch||[])])],uid:S.uid,up:S.up,st:S.st,mt:Date.now()}}
async function photos(){const ids=[...new Set(S.trades.flatMap(t=>['pin','pout','pplan'].map(k=>t[k]).filter(Boolean)))];S.up=S.up||{};let got=0;for(const id of ids){const have=M[id]||await idb('img','get',id),path='/storage/v1/object/fotos/'+SESS.uid+'/'+id+'.jpg';if(have&&!S.up[id]){await rq(path,{method:'POST',headers:{'Content-Type':'image/jpeg','x-upsert':'true'},body:have});S.up[id]=1}else if(!have){try{const b=await(await rq(path.replace('/object/','/object/authenticated/'))).blob();M[id]=b;await idb('img','put',b,id);S.up[id]=1;delete U[id];got++}catch(e){if(e.status!==400&&e.status!==404)throw e}}}persist();return got}
async function up(){const d=pub();await rq('/rest/v1/diario',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:SESS.uid,data:d,updated_at:new Date().toISOString()})});S.st=d.mt;persist()}
async function sync(manual){if(!SESS||SY.busy)return;SY.busy=1;SY.msg='Sincronizando…';uiSy();try{const rows=await(await rq('/rest/v1/diario?select=data&user_id=eq.'+SESS.uid)).json(),cl=rows[0]&&rows[0].data;let push=false,ch=0;if(!cl)push=true;else{const cm=cl.mt||0,lm=S.mt||0,seen=S.st||0;if(cm>seen&&lm>seen){mergeIn(cl);push=true;ch=1}else if(cm>seen){adopt(cl);ch=1}else if(lm>seen||manual)push=true}S.uid=SESS.uid;const got=await photos();if(push||!S.st)await up();S.lastSyncAt=Date.now();persist();SY.msg='Sincronizado às '+hm();if((got||ch)&&!typing())render()}catch(e){SY.msg='Falha ao sincronizar: '+em(e)}SY.busy=0;uiSy();svUi();if(tab==='conta')render()}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&SESS)sync()});addEventListener('online',()=>{if(SESS)sync()});
function vConta(){if(!window.CLOUD_OK)return '<h1>Conta</h1><div class="card">A conta com sincronização na nuvem funciona só na versão hospedada do app (Netlify ou GitHub Pages). Nesta versão, seus dados ficam só neste aparelho: use o backup completo na aba Painel.</div>';const c=cfg(),own=!(window.SUPA_URL&&window.SUPA_KEY);
if(!c)return `<h1>Conta</h1><p class="mut sm">Cole os dados do seu projeto Supabase (Project Settings → API): a URL e a chave <b>anon public</b>.</p><label>URL do projeto<input id="cu" placeholder="https://xxxx.supabase.co"></label><label>Chave anon<input id="ck"></label><button class="btn" style="margin-top:10px" data-a="savecfg">Salvar</button><div class="r sm" style="margin-top:8px">${esc(SY.msg)}</div>`;
if(RECOV)return `<h1>Nova senha</h1><label>Nova senha (mín. 6)<input id="np" type="password" autocomplete="new-password"></label><button class="btn" style="margin-top:10px" data-a="newpw">Salvar senha</button><div class="r sm" style="margin-top:8px">${esc(SY.msg)}</div>`;
if(!SESS)return `<h1>Conta</h1><p class="mut sm">Entre para sincronizar operações e fotos em todos os seus aparelhos.</p><div class="g2" style="margin:8px 0"><button class="btn ${AM==='in'?'':'s'}" data-a="am" data-id="in">Entrar</button><button class="btn ${AM==='up'?'':'s'}" data-a="am" data-id="up">Criar conta</button></div><label>E-mail<input id="ce" type="email" autocomplete="email" value="${esc(SY.email)}"></label><label>Senha (mín. 6)<input id="cp" type="password" autocomplete="${AM==='up'?'new-password':'current-password'}"></label><button class="btn" style="margin-top:10px;width:100%" data-a="auth">${AM==='in'?'Entrar':'Criar conta'}</button><div class="r sm" style="margin-top:8px">${esc(SY.msg)}</div>${own?'<button class="btn s" style="margin-top:12px" data-a="clrcfg">Trocar projeto Supabase</button>':''}`;
return `<h1>Conta</h1><div class="card"><b>${esc(SESS.email)}</b><div class="mut sm" id="sy">${esc(SY.msg||(S.lastSyncAt?'Última sincronização: '+hm(S.lastSyncAt):'Ainda não sincronizado'))}</div></div><div class="g2"><button class="btn" data-a="syncnow">Sincronizar agora</button><button class="btn s" data-a="logout">Sair</button></div><p class="mut sm">Seus dados também ficam salvos neste aparelho, então o app funciona offline e sincroniza quando a internet voltar. Apagar um trade em um aparelho apaga nos outros na próxima sincronização.</p>`}
/* ---------- Visual e interação ---------- */
const EMO=['😫','😕','😐','🙂','😄'];
const segs=(name,cur,items)=>`<div class="chips2">${items.map(([v,l,c])=>`<button class="${cur==v?'on '+(c||''):''}" data-seg="${name}" data-v="${v}">${l}</button>`).join('')}</div>`;
const segT=cur=>`<div class="seg hub" style="margin:2px 0 12px">${[['trades','Day trade'],['swing','Swing'],['opc','Opções'],['ativos','Forex'],['stats','Estatísticas'],['rev','Revisão']].map(([k,l])=>`<button class="${k===cur?'on':''}" data-a="gotab" data-id="${k}">${l}</button>`).join('')}</div>`;
const fl=ts=>ts.filter(t=>{const c=calc(t);return LF.f==='all'||(LF.f==='ab'&&c.r==null)||(LF.f==='g'&&c.pl>0)||(LF.f==='p'&&c.pl<0)});
const filtBar=()=>`<div class="chips2" style="margin-top:8px">${[['all','Todos'],['ab','Abertas'],['g','Ganhos'],['p','Perdas']].map(([k,l])=>`<button class="${LF.f===k?'on':''}" data-a="flt" data-id="${k}">${l}</button>`).join('')}</div><input id="lq" placeholder="🔍 Buscar ativo ou setup" value="${esc(LF.q)}" style="margin-top:8px">`;
function applyQ(){if(!LF.q)return;document.querySelectorAll('.card[data-s]').forEach(c=>c.style.display=c.dataset.s.includes(LF.q)?'':'none')}
function applyTheme(){const t=ls.get('diario-theme'),e=document.documentElement;if(!e||!e.setAttribute)return;if(t==='light'||t==='dark')e.setAttribute('data-theme',t);else e.removeAttribute('data-theme')}
function animCount(){document.querySelectorAll('[data-count]').forEach(e=>{const v=+e.dataset.count,t0=performance.now(),f=t=>{const k=Math.min(1,(t-t0)/700);e.textContent=money(v*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)})}
function streak(){const ds=[...new Set([...S.trades.map(t=>t.dt.slice(0,10)),...Object.keys(S.days).filter(d=>S.days[d].resumo||S.days[d].erros)])].sort(),clean=d=>!S.trades.some(t=>t.dt.slice(0,10)===d&&(t.rules==='n'||(t.err&&t.err!=='Nenhum')))&&(S.days[d]||{}).erros!=='s';let run=0;ds.forEach(d=>{run=clean(d)?run+1:0});return run}
function spark(){const cl=S.trades.map(t=>({t,c:calc(t)})).filter(x=>x.c.pl!=null).sort((a,b)=>(a.t.dtx||a.t.dt).localeCompare(b.t.dtx||b.t.dt)).slice(-30);if(cl.length<2)return '';let c=0;const v=cl.map(x=>c+=x.c.pl),lo=Math.min(0,...v),hi=Math.max(0,...v),sc=y=>46-(y-lo)/((hi-lo)||1)*40,pts=v.map((y,i)=>(i/(v.length-1)*300)+','+sc(y)).join(' ');return `<svg viewBox="0 0 300 50" style="width:100%;margin-top:8px"><polygon points="0,50 ${pts} 300,50" fill="var(--ac)" opacity=".15"/><polyline fill="none" stroke="var(--ac)" stroke-width="2" points="${pts}"/></svg><div class="sm mut">evolução dos últimos 30 trades</div>`}
function hero(P,R,n,nab,nck){const d=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'}),st=streak();return `<div class="hero"><div class="mut sm cap1">${d}</div><div class="sm" style="margin-top:6px">Resultado de hoje</div><div class="big ${cls(P)}" data-count="${P}">${money(P)}</div><div class="sm mut">${pctConta(P)?pctConta(P)+' · ':''}${n} encerrado(s)</div>${spark()}<div>${st?`<span class="chip">🔥 ${st} dia(s) sem erro</span>`:''}<span class="chip">📂 ${nab} aberta(s)</span><span class="chip">✅ ${nck}/${S.rules.length} regras hoje</span></div></div>`}
function vMais(){const T2=[['regras','📏','Regras','Seu plano escrito'],['graf','📺','Gráficos','TradingView e níveis'],['painel','🛡️','Painel','Mesa, metas e backup'],['rev','📅','Revisão','Calendário do mês'],['estudos','📚','Estudos','Livros e padrões de candles'],['live','⚡','Cotações ao vivo','Ponte do Profit'],['ativos','💹','Ativos','Margem, risco e lote'],['contratos','🧮','Contratos','Lotes pelo capital e volatilidade'],['carteiras','🥧','Carteiras','Brasil e EUA, evolução'],['analise','✨','Análise IA','Gemini: relatório da carteira ou de um ativo'],['imposto','🧾','Imposto de renda','Notas, custos e DARF'],['import','📥','Importar','Relatório do Profit (CSV)'],['conta','👤','Conta','Sincronização']],th=ls.get('diario-theme')||'auto';return `<h1>Mais</h1><div class="tiles">${T2.map(([k,i,t,d])=>`<button class="tile" data-a="gotab" data-id="${k}"><span>${IC(ICS[k])}</span><b>${t}</b><small>${d}</small></button>`).join('')}</div><h2>Aparência</h2><div class="seg">${[['auto','Automático'],['light','Claro'],['dark','Escuro']].map(([k,l])=>`<button class="${th===k?'on':''}" data-a="theme" data-id="${k}">${l}</button>`).join('')}</div>`}
const ring=(p,l,c='var(--ac)')=>{const r=26,C=2*Math.PI*r,d=C*Math.min(100,Math.max(0,p))/100;return `<div class="ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--bd)" stroke-width="7"/><circle cx="32" cy="32" r="${r}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${d} ${C}" transform="rotate(-90 32 32)"/><text x="32" y="36" text-anchor="middle" font-size="14" font-weight="700" fill="currentColor">${Math.round(p)}%</text></svg><span class="mut sm">${l}</span></div>`};
function lineChart(id,vals,labels,unit){CH[id]={vals,labels,unit};const n=vals.length,lo=Math.min(0,...vals),hi=Math.max(0,...vals),sc=v=>90-(v-lo)/((hi-lo)||1)*80,X=i=>n>1?i/(n-1)*300:150,pt=vals.map((v,i)=>X(i)+','+sc(v)).join(' ');return `<div class="card"><div class="mut sm" id="chr-${id}">Toque ou arraste no gráfico</div><svg viewBox="0 0 300 100" data-ch="${id}" style="width:100%;touch-action:pan-y"><line x1="0" x2="300" y1="${sc(0)}" y2="${sc(0)}" stroke="var(--bd)"/><polyline fill="none" stroke="var(--ac)" stroke-width="2" points="${pt}"/><line id="chl-${id}" y1="0" y2="100" stroke="var(--mut)" stroke-dasharray="3" style="display:none"/><circle id="chc-${id}" r="4" fill="var(--ac)" style="display:none"/></svg></div>`}
function barChart(id,vals,labels){if(!vals.length)return '';const m=Math.max(...vals.map(Math.abs),1);return `<div class="card"><div class="mut sm" id="chr-${id}">Toque numa barra</div><div class="bars">${vals.map((v,i)=>`<button class="bar" data-a="bar" data-id="${id}" data-t="${esc(labels[i])} · ${money(v)}" style="height:${Math.max(4,Math.abs(v)/m*100)}%;background:var(${v>=0?'--g':'--r'})"></button>`).join('')}</div></div>`}
function chPoint(e){const sv=e.target.closest&&e.target.closest('svg[data-ch]');if(!sv)return;const id=sv.dataset.ch,d=CH[id];if(!d)return;const rc=sv.getBoundingClientRect(),n=d.vals.length,i=Math.max(0,Math.min(n-1,Math.round((e.clientX-rc.left)/rc.width*(n>1?n-1:0)))),lo=Math.min(0,...d.vals),hi=Math.max(0,...d.vals),x=n>1?i/(n-1)*300:150,y=90-(d.vals[i]-lo)/((hi-lo)||1)*80,l=$('#chl-'+id),c=$('#chc-'+id);l.setAttribute('x1',x);l.setAttribute('x2',x);l.style.display='';c.setAttribute('cx',x);c.setAttribute('cy',y);c.style.display='';$('#chr-'+id).textContent=d.labels[i]+' · '+d.unit(d.vals[i])}
document.addEventListener('pointerdown',chPoint);document.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')chPoint(e)});
/* ---------- Estudos (livros + padrões de candles) ---------- */
const PATS=[
['martelo','Martelo','alta',[[60,64,10,63]],'Após uma queda (fundo ou suporte).','Corpo pequeno no topo e sombra inferior longa (≥ 2× o corpo), quase sem sombra superior. Os vendedores empurraram o preço para baixo, mas os compradores o devolveram até perto da abertura.','Candle seguinte fechando acima do corpo do martelo. Stop abaixo da mínima.'],
['enforcado','Homem enforcado','baixa',[[63,66,12,60]],'Após uma alta (topo ou resistência).','Mesmo formato do martelo, mas aparece no topo. Mostra que já houve venda forte durante o pregão; os compradores ainda seguraram o fechamento, mas o fôlego está acabando.','Candle seguinte de baixa, fechando abaixo do corpo. Sem confirmação é só um alerta.'],
['martelo-inv','Martelo invertido','alta',[[22,70,18,25]],'Após uma queda.','Corpo pequeno embaixo e sombra superior longa. Os compradores tentaram reagir; sozinho é fraco, precisa de confirmação.','Abertura/fechamento do dia seguinte acima do corpo do martelo invertido.'],
['estrela-cad','Estrela cadente','baixa',[[30,78,26,27]],'Após uma alta.','Corpo pequeno embaixo e sombra superior longa (≥ 2× o corpo). O preço subiu forte, mas foi rejeitado e devolvido. Sinal de exaustão dos compradores.','Candle seguinte de baixa. Stop acima da máxima da estrela.'],
['doji','Doji','indec',[[50,75,25,50]],'Em qualquer ponto; pesa mais no fim de tendência.','Abertura e fechamento praticamente iguais: equilíbrio entre compradores e vendedores. Indica indecisão e possível pausa ou virada da tendência.','Esperar o candle seguinte definir a direção.'],
['doji-lib','Doji libélula','alta',[[70,72,20,71]],'Fundo de tendência de baixa.','Abertura, fechamento e máxima praticamente iguais, com sombra inferior longa. Forma de "T". Rejeição forte de preços baixos.','Candle de alta na sequência.'],
['doji-lap','Doji lápide','baixa',[[30,80,28,29]],'Topo de tendência de alta.','Abertura, fechamento e mínima praticamente iguais, com sombra superior longa. Forma de "T" invertido. Rejeição forte de preços altos.','Candle de baixa na sequência.'],
['piao','Pião (spinning top)','indec',[[45,70,30,55]],'Qualquer ponto; relevante depois de candles longos.','Corpo pequeno com sombras dos dois lados: disputa sem vencedor. Mostra perda de força da tendência atual.','Aguardar o candle seguinte; observar volume.'],
['maru-alta','Marubozu de alta','cont',[[20,80,20,80]],'Início ou meio de movimento de alta.','Candle de alta sem sombras: compradores dominaram do começo ao fim. Força compradora.','Costuma ser suporte ao ser retestado (meio do corpo).'],
['maru-baixa','Marubozu de baixa','cont',[[80,80,20,20]],'Início ou meio de movimento de baixa.','Candle de baixa sem sombras: vendedores dominaram do começo ao fim. Força vendedora.','Costuma ser resistência ao ser retestado (meio do corpo).'],
['engolfo-alta','Engolfo de alta','alta',[[60,62,38,40],[36,68,34,66]],'Após uma queda.','Candle de baixa seguido de um candle de alta cujo corpo engole totalmente o corpo anterior. A força compradora assume o controle.','Quanto maior o segundo candle e o volume, mais forte. Stop abaixo da mínima do engolfo.'],
['engolfo-baixa','Engolfo de baixa','baixa',[[40,62,38,60],[64,66,32,34]],'Após uma alta.','Candle de alta seguido de um candle de baixa cujo corpo engole o corpo anterior. A força vendedora assume o controle.','Quanto maior o segundo candle e o volume, mais forte. Stop acima da máxima do engolfo.'],
['harami-alta','Harami de alta','alta',[[75,77,25,30],[45,55,42,52]],'Após uma queda.','Candle de baixa longo seguido de um candle pequeno de alta contido no corpo do primeiro. A pressão vendedora diminui.','Mais fraco que o engolfo; confirmar com um terceiro candle de alta.'],
['harami-baixa','Harami de baixa','baixa',[[30,77,25,75],[62,66,48,50]],'Após uma alta.','Candle de alta longo seguido de um candle pequeno de baixa contido no corpo do primeiro. A pressão compradora diminui.','Mais fraco que o engolfo; confirmar com um terceiro candle de baixa.'],
['harami-cross','Harami cross','indec',[[75,77,25,30],[52,60,44,52]],'Fim de tendência.','Como o harami, mas o segundo candle é um doji. Indecisão forte depois de um candle longo; sinal de reversão mais relevante que o harami comum.','Candle seguinte confirma a direção.'],
['penetracao','Linha de penetração','alta',[[75,77,30,32],[25,62,22,60]],'Após uma queda.','Candle de baixa longo; o seguinte abre abaixo da mínima anterior e fecha acima do meio do corpo do primeiro (sem engolfar).','Quanto mais o fechamento passar do meio do corpo, mais forte.'],
['nuvem-negra','Nuvem negra','baixa',[[30,72,28,70],[76,78,40,42]],'Após uma alta.','Candle de alta longo; o seguinte abre acima da máxima anterior e fecha abaixo do meio do corpo do primeiro. Contrário da linha de penetração.','Quanto mais o fechamento entrar no corpo anterior, mais forte.'],
['pinca-fundo','Pinça de fundo','alta',[[60,62,20,30],[28,55,20,50]],'Após uma queda, em suporte.','Dois candles com mínimas praticamente iguais: o mercado testou o mesmo piso duas vezes e não perdeu.','Mais forte se o segundo candle for de alta.'],
['pinca-topo','Pinça de topo','baixa',[[40,80,38,70],[72,80,50,52]],'Após uma alta, em resistência.','Dois candles com máximas praticamente iguais: o mercado testou o mesmo teto duas vezes e não passou.','Mais forte se o segundo candle for de baixa.'],
['estrela-manha','Estrela da manhã','alta',[[80,82,45,48],[40,44,30,38],[42,78,40,75]],'Fundo de uma tendência de baixa.','Três candles: baixa longo, candle pequeno (estrela) com gap para baixo, e alta longo que fecha acima do meio do primeiro. Reversão de alta clássica.','Terceiro candle é a confirmação. Stop abaixo da mínima da estrela.'],
['estrela-noite','Estrela da noite','baixa',[[20,55,18,52],[60,70,58,62],[58,60,22,25]],'Topo de uma tendência de alta.','Três candles: alta longo, candle pequeno (estrela) com gap para cima, e baixa longo que fecha abaixo do meio do primeiro. Reversão de baixa clássica.','Terceiro candle é a confirmação. Stop acima da máxima da estrela.'],
['bebe-abandonado','Bebê abandonado (alta)','alta',[[80,82,50,52],[40,44,36,41],[48,80,46,78]],'Fundo de uma tendência de baixa.','Variação rara e forte da estrela da manhã: o doji do meio fica isolado por gaps (suas sombras não encostam nos candles vizinhos).','Raro; quando aparece, merece atenção. Confirmar com volume.'],
['tres-soldados','Três soldados brancos','alta',[[20,45,18,42],[38,66,36,63],[58,86,56,83]],'Após uma queda ou lateralização.','Três candles de alta seguidos, cada um abrindo dentro do corpo anterior e fechando perto da máxima. Compradores no controle.','Cuidado se os candles forem muito longos (esticado): pode vir correção.'],
['tres-corvos','Três corvos negros','baixa',[[84,86,60,62],[66,68,38,40],[44,46,16,18]],'Após uma alta ou lateralização.','Três candles de baixa seguidos, cada um abrindo dentro do corpo anterior e fechando perto da mínima. Vendedores no controle.','Cuidado se o preço já caiu muito: pode vir repique.'],
['tres-metodos-alta','Três métodos ascendentes','cont',[[20,72,18,70],[62,66,48,52],[54,64,46,50],[52,60,44,48],[50,88,48,86]],'Durante uma tendência de alta.','Candle de alta longo, três candles pequenos de correção dentro da sua faixa e novo candle de alta longo fechando acima do primeiro. Pausa saudável e continuação.','Entrada no rompimento da máxima do quinto candle.'],
['tres-metodos-baixa','Três métodos descendentes','cont',[[80,82,30,32],[38,52,34,48],[46,54,40,44],[44,56,38,42],[44,46,12,14]],'Durante uma tendência de baixa.','Candle de baixa longo, três candles pequenos de repique dentro da sua faixa e novo candle de baixa longo fechando abaixo do primeiro. Pausa e continuação.','Entrada no rompimento da mínima do quinto candle.']
];
const PT={alta:['Reversão de alta','g'],baixa:['Reversão de baixa','r'],indec:['Indecisão','mut'],cont:['Continuação','mut']};
const STS=[['lendo','📖 Lendo'],['quero','🔖 Quero ler'],['feito','✅ Concluído']];
let BID=null,PF='all',BV='pad';
function csvg(a){const w=26,W=a.length*w+8,y=v=>100-v;return `<svg viewBox="0 0 ${W} 100" style="height:96px;width:auto;max-width:100%" aria-hidden="true">${a.map(([o,h,l,c],i)=>{const x=4+i*w+w/2,col=c>o?'var(--g)':c<o?'var(--r)':'var(--mut)';return `<line x1="${x}" x2="${x}" y1="${y(h)}" y2="${y(l)}" stroke="${col}" stroke-width="2"/><rect x="${x-8}" y="${y(Math.max(o,c))}" width="16" height="${Math.max(1.5,Math.abs(o-c))}" fill="${col}" rx="1"/>`}).join('')}</svg>`}
function seedBooks(){S.books??=[];if(!S.books.some(b=>b.id==='cand')&&!(S.del&&S.del.cand)){S.books.unshift({id:'cand',t:'Candlestick',a:'Carlos Alberto',st:'lendo',pat:1,notes:[],u:Date.now()});persist()}}
function vEstudos(){seedBooks();return `<h1>Estudos</h1><p class="mut sm">Seus livros e anotações. Cada livro tem suas próprias anotações, com página.</p><div class="card"><div class="g2"><label>Livro<input id="bt" placeholder="Título"></label><label>Autor<input id="ba" placeholder="Autor"></label></div><button class="btn" style="margin-top:10px" data-a="addbook">+ Adicionar livro</button></div>${S.books.map(b=>`<div class="card row" data-a="openbook" data-id="${b.id}"><div class="th">${b.pat?'🕯️':'📘'}</div><div class="fl"><b>${esc(b.t)}</b><div class="mut sm">${esc(b.a)} · ${(STS.find(s=>s[0]===b.st)||STS[0])[1]} · ${(b.notes||[]).length} anotação(ões)${b.pat?' · '+PATS.length+' padrões':''}</div></div></div>`).join('')}`}
function vLivro(){const b=(S.books||[]).find(x=>x.id===BID);if(!b)return vEstudos();const notes=(b.notes||[]).slice().sort((x,y)=>(y.u||0)-(x.u||0)),
top=`<div class="top"><button class="btn s" data-a="gotab" data-id="estudos">‹ Livros</button>${b.pat?'':'<button class="btn s d" data-a="delbook" data-id="'+b.id+'">Excluir livro</button>'}</div><h1>${esc(b.t)}</h1><div class="mut sm">${esc(b.a)}</div><label>Situação<select data-bs="${b.id}">${opt(STS,b.st||'lendo')}</select></label>`,
seg=b.pat?`<div class="seg"><button class="${BV==='pad'?'on':''}" data-a="bv" data-id="pad">🕯️ Padrões</button><button class="${BV==='not'?'on':''}" data-a="bv" data-id="not">📝 Anotações</button></div>`:'';
const nt=`<div class="card"><div class="g2" style="grid-template-columns:2fr 1fr"><label>Título<input id="nt" placeholder="Ex.: Capítulo 3, ideia-chave"></label><label>Página<input id="np" inputmode="numeric" placeholder="Pág."></label></div><label>Anotação<textarea id="nx" placeholder="O que aprendi / como aplico no meu trade"></textarea></label><button class="btn" style="margin-top:10px" data-a="addnote" data-id="${b.id}">Salvar anotação</button></div>${notes.map(n=>`<div class="card"><div class="top"><b>${esc(n.t||'Sem título')}</b><span class="mut sm">${n.p?'pág. '+esc(n.p)+' · ':''}${new Date(n.u||0).toLocaleDateString('pt-BR')}</span><button class="x" data-a="delnote" data-id="${b.id}" data-n="${n.id}">✕</button></div><textarea data-nb="${b.id}|${n.id}">${esc(n.x)}</textarea></div>`).join('')||'<p class="mut sm">Nenhuma anotação ainda.</p>'}`;
if(b.pat&&BV==='pad')return top+seg+vPadroes();return top+seg+nt}
function vPadroes(){const F=[['all','Todos'],['alta','Alta'],['baixa','Baixa'],['indec','Indecisão'],['cont','Continuação']],ps=PATS.filter(p=>PF==='all'||p[2]===PF);return `<div class="warn" style="margin:8px 0;border-color:var(--bd)">Padrões clássicos de candlestick (Nison/escola japonesa), com texto próprio. Um padrão só tem valor com <b>contexto</b> (tendência anterior, suporte/resistência, volume) e <b>confirmação</b> no candle seguinte. Use o campo de cada padrão para colocar o que o livro diz, com a página.</div><div class="seg" style="overflow-x:auto">${F.map(([k,l])=>`<button class="${PF===k?'on':''}" data-a="pf" data-id="${k}">${l}</button>`).join('')}</div>`+ps.map(([id,n,t,c,q,l,f])=>`<div class="card"><div class="top" style="align-items:flex-start"><div><b>${n}</b><div class="sm ${PT[t][1]}" style="font-weight:600">${PT[t][0]} · ${c.length} candle${c.length>1?'s':''}</div></div>${csvg(c)}</div><div class="sm" style="margin-top:8px"><b>Onde:</b> ${q}</div><div class="sm" style="margin-top:4px"><b>Leitura:</b> ${l}</div><div class="sm" style="margin-top:4px"><b>Confirmação:</b> ${f}</div><textarea data-pn="${id}" style="min-height:44px;margin-top:8px" placeholder="Sua anotação do livro (página, observações)…">${esc((S.pn||{})[id])}</textarea></div>`).join('')}

/* ---------- Ativos (margem, risco e valor do lote) ---------- */
// [símbolo, nome, categoria, tipo(fx|cfd), moeda base, moeda cotada, contrato (unid./lote), tamanho do pip/ponto, preço ref., alavancagem, stop padrão, unidade]
const AS=[
['EURUSD','Euro / Dólar','Forex','fx','EUR','USD',100000,.0001,1.10,100,20,'pips'],
['EURCAD','Euro / Dólar canadense','Forex','fx','EUR','CAD',100000,.0001,1.52,100,20,'pips'],
['USDCAD','Dólar / Dólar canadense','Forex','fx','USD','CAD',100000,.0001,1.38,100,20,'pips'],
['CADUSD','Dólar canadense / Dólar (inverso do USDCAD)','Forex','fx','CAD','USD',100000,.0001,.72,100,20,'pips'],
['GBPUSD','Libra / Dólar','Forex','fx','GBP','USD',100000,.0001,1.30,100,20,'pips'],
['USDJPY','Dólar / Iene','Forex','fx','USD','JPY',100000,.01,150,100,20,'pips'],
['USDCHF','Dólar / Franco suíço','Forex','fx','USD','CHF',100000,.0001,.90,100,20,'pips'],
['AUDUSD','Dólar australiano / Dólar','Forex','fx','AUD','USD',100000,.0001,.66,100,20,'pips'],
['NZDUSD','Dólar neozelandês / Dólar','Forex','fx','NZD','USD',100000,.0001,.60,100,20,'pips'],
['EURGBP','Euro / Libra','Forex','fx','EUR','GBP',100000,.0001,.85,100,20,'pips'],
['EURJPY','Euro / Iene','Forex','fx','EUR','JPY',100000,.01,165,100,20,'pips'],
['GBPJPY','Libra / Iene','Forex','fx','GBP','JPY',100000,.01,195,100,20,'pips'],
['EURCHF','Euro / Franco suíço','Forex','fx','EUR','CHF',100000,.0001,.95,100,20,'pips'],
['AUDJPY','Dólar australiano / Iene','Forex','fx','AUD','JPY',100000,.01,99,100,20,'pips'],
['NIKKEI','Nikkei 225 (JP225)','Índices','cfd','','JPY',1,1,48000,50,100,'pontos'],
['NAS100','Nasdaq 100','Índices','cfd','','USD',1,1,25000,50,50,'pontos'],
['USTEC','Nasdaq 100 (nome USTEC)','Índices','cfd','','USD',1,1,25000,50,50,'pontos'],
['UK100','FTSE 100','Índices','cfd','','GBP',1,1,9700,50,30,'pontos'],
['RUSSELL2000','Russell 2000 (US2000)','Índices','cfd','','USD',1,1,2400,50,15,'pontos'],
['HK50','Hang Seng 50','Índices','cfd','','HKD',1,1,26000,50,100,'pontos'],
['XAUUSD','Ouro / Dólar','Commodities','cfd','','USD',100,1,4000,100,5,'US$'],
['USOIL','Petróleo WTI','Commodities','cfd','','USD',1000,1,60,50,.5,'US$'],
['BTCUSD','Bitcoin / Dólar','Cripto','cfd','','USD',1,1,100000,25,500,'US$'],
['ETHUSD','Ethereum / Dólar','Cripto','cfd','','USD',1,1,3500,25,30,'US$']
];
let AF='all',AXO={};
const gv=(s,f,d)=>{const v=(S.ax||{})[s+'.'+f];return v===undefined||v===''?d:v};
const axg=(k,d)=>{const v=(S.ax||{})['g.'+k];return v===undefined||v===''?d:+v};
const aPx=s=>+gv(s,'px',(AS.find(a=>a[0]===s)||[])[8]);
function rate(c){if(c==='USD')return 1;if(['EUR','GBP','AUD','NZD'].includes(c))return aPx(c+'USD');if(c==='CAD')return 1/aPx('USDCAD');if(c==='JPY')return 1/aPx('USDJPY');if(c==='CHF')return 1/aPx('USDCHF');if(c==='HKD')return 1/axg('hkd',7.8);return 1}
function ac(a){const[s,,,k,b,q,cs0,pip,px0,lev0,st0]=a,px=+gv(s,'px',px0),lev=+gv(s,'lev',lev0)||1,stop=+gv(s,'stop',st0),cs=+gv(s,'cs',cs0),notional=k==='fx'?cs*rate(b):cs*px*rate(q),pv=cs*pip*rate(q);return{px,lev,stop,cs,notional,margin:notional/lev,pv,risk:stop*pv}}
const usd=n=>'US$ '+(+n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}),brl=n=>'R$ '+(+n*axg('brl',5.4)).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
function vAtivos0(){const CT=['all','Forex','Índices','Commodities','Cripto'],rk=axg('risco',100),as=AS.filter(a=>AF==='all'||a[2]===AF),gi=(k,l,d)=>`<label>${l}<input type="number" step="any" inputmode="decimal" data-axg="${k}" value="${axg(k,d)}"></label>`;
return `<p class="mut sm">Margem, risco e valor por <b>1 lote</b>. Cálculo com o tamanho de contrato padrão de corretoras MT5; margem, alavancagem e tamanho do contrato variam por corretora, então confira na sua e ajuste em “Ajustar”. Os preços são só de referência: atualize os que usar.</p>
<div class="card"><div class="g3">${gi('risco','Risco por trade (US$)',100)}${gi('brl','Dólar (R$)',5.4)}${gi('hkd','USD/HKD',7.8)}</div><div class="g2" style="margin-top:8px">${gi('cap','Capital na corretora (US$)',0)}<div class="mut sm" style="align-self:end">${axg('cap',0)>0?brl(axg('cap',0))+' · risco de '+usd(rk)+' = '+f2(rk/axg('cap',0)*100)+'% do capital':'Informe o capital para ver % de risco e lotes máximos.'}</div></div></div>
<div class="seg" style="overflow-x:auto">${CT.map(c=>`<button class="${AF===c?'on':''}" data-a="af" data-id="${c}">${c==='all'?'Todos':c}</button>`).join('')}</div>`+as.map(a=>{const r=ac(a),s=a[0],o=AXO[s],fi=(f,l,v)=>`<label>${l}<input type="number" step="any" inputmode="decimal" data-ax="${s}.${f}" value="${v}"></label>`;return `<div class="card"><div class="top" data-a="axo" data-id="${s}" style="cursor:pointer"><div><b>${s}</b> <span class="mut sm">${esc(a[1])}</span></div><span class="mut sm">${o?'▲':'▼ Ajustar'}</span></div>
<div class="kv" style="margin-top:8px"><div class="card"><span class="mut sm">Margem por lote (1:${r.lev})</span><b>${usd(r.margin)}</b><span class="mut sm">${brl(r.margin)}</span></div><div class="card"><span class="mut sm">Risco por lote (${f2(r.stop).replace(',00','')} ${a[11]})</span><b class="r">${usd(r.risk)}</b><span class="mut sm">${brl(r.risk)}</span></div><div class="card"><span class="mut sm">Valor do lote</span><b>${usd(r.notional)}</b><span class="mut sm">${a[3]==='fx'?'contrato '+r.cs.toLocaleString('pt-BR')+' '+a[4]:'contrato '+r.cs.toLocaleString('pt-BR')+' × preço'}</span></div><div class="card"><span class="mut sm">Valor de 1 ${a[2]==='Forex'?'pip':a[2]==='Índices'?'ponto':'US$ de variação'} por lote</span><b>${usd(r.pv)}</b><span class="mut sm">${brl(r.pv)}</span></div></div>
<div class="sm" style="margin-top:8px">Para arriscar <b>${usd(rk)}</b>: <b>${r.risk>0?f2(rk/r.risk):'–'} lote(s)</b> · margem ${r.risk>0?usd(rk/r.risk*r.margin):'–'}</div>${axg('cap',0)>0?`<div class="sm mut" style="margin-top:4px">Margem de 1 lote = ${f2(r.margin/axg('cap',0)*100)}% do capital · cabem até ${f2(Math.floor(axg('cap',0)/r.margin*100)/100)} lote(s) pela margem${r.risk>0&&rk/r.risk*r.margin>axg('cap',0)?' · <span class="r">⚠ esse trade pede mais margem que o capital</span>':''}</div>`:''}
${o?`<div class="g2" style="margin-top:6px">${fi('px','Preço atual',r.px)}${fi('lev','Alavancagem (1:x)',r.lev)}${fi('stop','Stop ('+a[11]+')',r.stop)}${fi('cs','Contrato (unid./lote)',r.cs)}</div>`:''}</div>`}).join('')+`<p class="mut sm">Margem = (contrato × preço, em US$) ÷ alavancagem. Risco por lote = stop × valor do pip/ponto. Conversões para US$ usam os preços de EURUSD, GBPUSD, USDJPY, USDCAD etc. desta lista, então mantenha-os atualizados. NAS100 e USTEC são o mesmo índice (o nome muda por corretora). CADUSD não existe em todas as corretoras (é o inverso do USDCAD).</p>`}
/* ---------- Scanner de tendência (swing) ---------- */
const WL0='PETR4 PETR3 VALE3 ITUB4 BBDC4 BBAS3 ABEV3 WEGE3 B3SA3 RENT3 SUZB3 JBSS3 GGBR4 CSNA3 USIM5 ELET3 ELET6 EQTL3 SBSP3 CMIG4 CPLE6 TAEE11 VIVT3 RADL3 LREN3 MGLU3 BBSE3 BPAC11 SANB11 ITSA4 HAPV3 RDOR3 RAIL3 CCRO3 EMBR3 PRIO3 CSAN3 BRFS3 MRFG3 BEEF3 KLBN11 UGPA3 VBBR3 AZUL4 CYRE3 MRVE3 COGN3 NATU3 ASAI3 CRFB3 TOTS3 MULT3 BOVA11 IVVB11 SMAL11'.split(' ');
let SC=ls.get('diario-scan')||{ts:0,d:{}},SCF='alta',SCX=null,SCB=0,SCM='',SCD={},SCA=null;
const wl=()=>S.wl&&S.wl.length?S.wl:WL0,scB3=s=>/^[A-Z]{4}\d{1,2}$/.test(s),tvLink=s=>'https://www.tradingview.com/chart/?symbol='+encodeURIComponent(scB3(s)?'BMFBOVESPA:'+s:s),yhLink=s=>'https://finance.yahoo.com/quote/'+encodeURIComponent(scB3(s)?s+'.SA':s)+'/chart';
async function scFetch(syms,detail){const c=cfg();if(!c)throw new Error('Configure o Supabase na aba Conta.');let r;try{r=await fetch(c.url+'/functions/v1/screener',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key},body:JSON.stringify({symbols:syms,detail:!!detail})})}catch(e){throw new Error('Não consegui falar com a função "screener": confira se ela foi publicada, se a verificação de JWT está desligada e se há internet.')}if(!r.ok){let m='';try{m=(await r.json()).error||''}catch(e){}throw new Error(r.status===401?'A função exige login: desligue "Verify JWT" nas configurações dela no Supabase.':r.status===404?'Função "screener" não encontrada: publique-a no Supabase.':(m||'Erro '+r.status))}return r.json()}
function scUi(){const e=$('#scm');if(e)e.textContent=SCM}
async function scRun(only){if(SCB)return;const list=only?Object.values(SC.d).filter(x=>x.ok&&x.state!=='neutro').map(x=>x.s):wl();if(!list.length)return;SCB=1;SCM='Buscando… 0/'+list.length;scUi();let done=0,err=0;try{for(let i=0;i<list.length;i+=25){const b=list.slice(i,i+25),j=await scFetch(b);(j.data||[]).forEach(x=>{SC.d[x.s]=x;if(!x.ok)err++});done+=b.length;SCM='Buscando… '+done+'/'+list.length;scUi()}SC.ts=Date.now();ls.set('diario-scan',SC);SCM='Atualizado às '+hm()+(err?' · '+err+' sem dados':'')}catch(e){SCM='Falha: '+e.message}SCB=0;if(tab==='swing'&&VW.S==='sc')render()}
async function scDetail(s){try{const j=await scFetch([s],true),x=(j.data||[])[0];if(x&&x.series)SCD[s]=x.series;else SCD[s]={err:1}}catch(e){SCD[s]={err:1,msg:e.message}}if(tab==='swing'&&SCX===s)render()}
function maChart(d){const n=d.c.length,all=[...d.c,...d.m20,...d.m50,...d.m150,...d.m200].filter(v=>v!=null),lo=Math.min(...all),hi=Math.max(...all),Y=v=>92-(v-lo)/((hi-lo)||1)*84,X=i=>i/(n-1)*300,pl=(a,c,w)=>`<polyline fill="none" stroke="${c}" stroke-width="${w}" points="${a.map((v,i)=>v==null?null:X(i)+','+Y(v)).filter(Boolean).join(' ')}"/>`;return `<svg viewBox="0 0 300 100" style="width:100%;margin-top:8px">${pl(d.m200,'#e5484d',1.4)}${pl(d.m150,'#f5a524',1.4)}${pl(d.m50,'#e8d44d',1.4)}${pl(d.m20,'#4aa8ff',1.4)}${pl(d.c,'var(--tx)',1.8)}<circle cx="300" cy="${Y(d.c[n-1])}" r="3" fill="var(--tx)"/></svg><div class="sm mut">Preço · <span style="color:#4aa8ff">MM20</span> · <span style="color:#e8d44d">MM50</span> · <span style="color:#f5a524">MM150</span> · <span style="color:#e5484d">MM200</span> · últimos ${n} pregões (o último ponto é o candle de hoje)</div>`}
function scPanel(x){const d=SCD[x.s];return `<div style="margin-top:10px"><div class="sm mut">MM20 ${f2(x.ma[20])} · MM50 ${f2(x.ma[50])} · MM150 ${f2(x.ma[150])} · MM200 ${f2(x.ma[200])}</div>${d?(d.err?`<div class="warn" style="margin-top:8px">Não consegui carregar o gráfico${d.msg?': '+esc(d.msg):''}.</div>`:maChart(d)):'<div class="mut sm" style="margin-top:8px">Carregando gráfico…</div>'}<div class="g3" style="margin-top:10px"><a class="btn s" href="${tvLink(x.s)}" target="_blank" rel="noopener noreferrer">TradingView ↗</a><a class="btn s" href="${yhLink(x.s)}" target="_blank" rel="noopener noreferrer">Yahoo ↗</a><button class="btn" data-a="scnew" data-id="${x.s}">➕ Swing</button></div><div class="mut sm" style="margin-top:6px">O botão ➕ Swing preenche entrada com o preço atual e stop na MM50: ajuste antes de salvar.</div></div>`}
function scRow(x){const o=SCX===x.s;return `<div class="card"><div class="top" data-a="scx" data-id="${x.s}" style="cursor:pointer"><div><b>${esc(x.s)}</b> ${x.days<=3?'<span class="chip" style="margin:0 0 0 4px">🆕</span>':''}<div class="mut sm">alinhado há ${x.days} pregão(ões) · ${f2(x.dist20)}% da MM20</div></div><div style="text-align:right"><b>${f2(x.px)}</b><div class="sm ${cls(x.chg)}">${x.chg>0?'+':''}${f2(x.chg)}%</div></div></div>${o?scPanel(x):''}</div>`}
function vScan(){if(!window.CLOUD_OK)return '<div class="card">O scanner busca cotações pela internet e só funciona no app hospedado (GitHub Pages).</div>';const all=Object.values(SC.d),ok=all.filter(x=>x.ok),al=ok.filter(x=>x.state==='alta'),qu=ok.filter(x=>x.state==='queda'),sem=all.length-ok.length,list=(SCF==='alta'?al:SCF==='queda'?qu:[...al,...qu]).sort((a,b)=>a.days-b.days);
return `<div class="card"><b>Scanner de tendência</b><p class="mut sm" style="margin:6px 0">🟢 Alta: preço &gt; MM20 &gt; MM50 &gt; MM150 &gt; MM200. 🔴 Queda: o inverso. O candle de hoje usa o último preço disponível (pode ter atraso).</p><div class="g2"><button class="btn" data-a="scrun">${SCB?'Buscando…':'🔄 Atualizar'}</button><button class="btn ${SCA?'':'s'}" data-a="scauto">${SCA?'⏸ Auto ligado':'▶ Auto (90 s)'}</button></div><div class="mut sm" id="scm" style="margin-top:8px">${esc(SCM||(SC.ts?'Última busca às '+hm(SC.ts):'Toque em Atualizar para buscar as cotações.'))}</div></div><div class="seg">${[['alta','🟢 Alta ('+al.length+')'],['queda','🔴 Queda ('+qu.length+')'],['todos','Todos']].map(([k,l])=>`<button class="${SCF===k?'on':''}" data-a="scf" data-id="${k}">${l}</button>`).join('')}</div>${list.length?list.map(scRow).join(''):`<p class="mut">${SC.ts?'Nenhum ativo da lista está assim agora.':'Sem resultados ainda.'}</p>`}${sem?`<div class="mut sm">${sem} ativo(s) sem dados (símbolo inválido ou limite do Yahoo): atualize de novo.</div>`:''}<h3>Minha lista (${wl().length})</h3><div class="g2" style="grid-template-columns:1fr auto;align-items:end"><label>Adicionar ativos<input id="wla" placeholder="PETR4, VALE3, AAPL…" autocapitalize="characters"></label><button class="btn" data-a="wladd">Adicionar</button></div><div class="chips2" style="margin-top:8px">${wl().map(s=>`<button data-a="wldel" data-id="${esc(s)}">${esc(s)} ✕</button>`).join('')}</div><button class="btn s" style="margin-top:8px" data-a="wlreset">Restaurar lista padrão</button>`}
function scNew(id){const x=SC.d[id];if(!x||!x.ok)return;const up=x.state==='alta',r2=v=>+(+v).toFixed(2);AUTO=0;isNew=1;orig={};T={tipo:'S',id:uid(),dt:loc().slice(0,16),side:up?'C':'V',ativo:id,entry:r2(x.px),stop:r2(x.ma[50]),target:'',qty:1,pv:1,cost:0,emo:'3',rules:'s',err:'Nenhum',mkt:up?MK[0]:MK[4],setup:'Médias alinhadas ('+(up?'alta':'queda')+')'};showSheet()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id;
if(a==='scrun')scRun();
else if(a==='scauto'){if(SCA){clearInterval(SCA);SCA=null}else{SCA=setInterval(()=>{if(tab==='swing'&&VW.S==='sc'&&!document.hidden)scRun(1)},90000);scRun(SC.ts?1:0)}render()}
else if(a==='scf'){SCF=id;render()}
else if(a==='scx'){SCX=SCX===id?null:id;render();if(SCX&&!SCD[SCX])scDetail(SCX)}
else if(a==='wladd'){const v=($('#wla').value||'').toUpperCase().split(/[\s,;]+/).filter(x=>/^[A-Z0-9.\-=^]{1,15}$/.test(x));if(!v.length)return;S.wl=[...new Set([...wl(),...v])];save();render()}
else if(a==='wldel'){S.wl=wl().filter(x=>x!==id);save();render()}
else if(a==='wlreset'){delete S.wl;save();render()}
else if(a==='scnew')scNew(id)});
/* ---------- Importar relatório do Profit (CSV de ordens) ---------- */
let IM=null;
const fN=s=>{s=String(s||'').trim();return s===''||s==='-'?null:parseFloat(s.replace(/\./g,'').replace(',','.'))},fT=s=>{const m=String(s||'').match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);return m?new Date(+m[3],+m[2]-1,+m[1],+m[4],+m[5],+m[6]):null},p2=n=>String(n).padStart(2,'0'),isoD=d=>d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()),isoL=d=>isoD(d)+'T'+p2(d.getHours())+':'+p2(d.getMinutes()),hs=str=>{let h=5381;for(let i=0;i<str.length;i++)h=((h<<5)+h+str.charCodeAt(i))|0;return (h>>>0).toString(36)};
const FUT=/^(WIN|WDO|IND|DOL)[FGHJKMNQUVXZ]\d{2}$/,OPT=/^[A-Z0-9]{4}([A-X])(\d{2,4})[A-Z]?$/;
function impParse(txt){const L=txt.replace(/\r/g,'').split('\n');if(!(L[1]||'').includes('Ativo')||!(L[1]||'').includes('Lado'))throw new Error('Esse arquivo não parece ser o histórico de ordens do Profit.');const orders=[];let cur=null;for(const ln of L.slice(2)){if(!ln.trim())continue;const f=ln.split(';');if(f[0]!==''){cur={a:f[4],lado:f[5],st:f[6],cr:fT(f[7]),stop:fN(f[10]),tipo:f[22],fills:[]};orders.push(cur)}else if(cur&&f[6]==='Trade')cur.fills.push([fT(f[7]),fN(f[12]),fN(f[13])])}return orders}
function impTrips(orders){const fl=[];orders.forEach(o=>o.fills.forEach(([t,p,q])=>{if(t&&p!=null&&q)fl.push({t,a:o.a,s:o.lado,p,q})}));fl.sort((x,y)=>x.t-y.t);const by={},out=[];fl.forEach(x=>(by[x.a]??=[]).push(x));
for(const[a,fs]of Object.entries(by)){let pos=0,cy=null;for(const x of fs){const sg=x.s==='C'?1:-1;let q=x.q;while(q>0){if(pos===0){cy={a,side:x.s,t0:x.t,op:[[x.p,q]],cl:[]};pos=sg*q;q=0}else if((pos>0)===(sg>0)){pos+=sg*q;cy.op.push([x.p,q]);q=0}else{const c=Math.min(q,Math.abs(pos));cy.cl.push([x.p,c]);pos+=sg*c;q-=c;cy.t1=x.t;if(pos===0){out.push(cy);cy=null}}}}if(cy&&pos!==0){cy.open=1;out.push(cy)}}
return out.sort((x,y)=>x.t0-y.t0)}
const impEp=c=>sum(c.op.map(x=>x[0]*x[1]))/sum(c.op.map(x=>x[1]));
function impStop(c,orders){const opp=c.side==='C'?'V':'C',t1=c.open?new Date():(c.t1||c.t0),a=c.t0.getTime()-120000,b=t1.getTime()+5000,ep=impEp(c),o=orders.filter(o=>o.a===c.a&&o.tipo==='Stop Limite'&&o.lado===opp&&o.stop!=null&&o.cr&&o.cr.getTime()>=a&&o.cr.getTime()<=b).sort((x,y)=>x.cr-y.cr)[0];return o&&(c.side==='C'?o.stop<ep:o.stop>ep)?o.stop:null}
function impKind(c){if(FUT.test(c.a))return'D';if(OPT.test(c.a))return'O';const t1=c.t1||c.t0;return isoD(c.t0)===isoD(t1)&&!c.open?'D':'S'}
function optInfo(a,d){const m=a.match(OPT),ci=m[1].charCodeAt(0)-65,call=ci<12,mo=call?ci:ci-12,dg=m[2],st=dg.length===3?+dg/10:dg.length===2?+dg:+dg/100;let y=d.getFullYear();if(mo<d.getMonth())y++;const f=new Date(y,mo,1),v=new Date(y,mo,1+(5-f.getDay()+7)%7+14);return{ot:call?'C':'P',strike:st,venc:isoD(v)}}
function impDefaults(orders,trs){const d={WIN:[],WDO:[]};trs.forEach(c=>{const k=c.a.slice(0,3),s=impStop(c,orders);if(d[k]&&s!=null)d[k].push(Math.abs(s-impEp(c)))});const med=a=>a.length?a.sort((x,y)=>x-y)[Math.floor(a.length/2)]:0;return{win:med(d.WIN)||100,wdo:med(d.WDO)||5,opt:100,cost:0}}
function impBuild(){const cfg=IM.cfg;return IM.trs.map(c=>{const oq=sum(c.op.map(x=>x[1])),ep=impEp(c),cq=sum(c.cl.map(x=>x[1])),xp=!c.open&&cq?sum(c.cl.map(x=>x[0]*x[1]))/cq:null,kind=impKind(c),root=c.a.slice(0,3),pv=root==='WIN'?0.2:root==='WDO'?10:1;let stop=impStop(c,IM.orders),est=0;if(stop==null){est=1;const pts=root==='WIN'?+cfg.win:root==='WDO'?+cfg.wdo:0;stop=kind==='O'?Math.max(0.01,ep*(1-(+cfg.opt||100)/100)):pts?(c.side==='C'?ep-pts:ep+pts):null}
const t={id:'imp'+hs(c.a+c.side+isoL(c.t0)+oq+ep.toFixed(4)),tipo:kind,dt:isoL(c.t0),dtx:xp!=null?isoL(c.t1):'',ativo:c.a,side:c.side,entry:+ep.toFixed(4),stop:stop==null?'':+(+stop).toFixed(4),exit:xp==null?'':+xp.toFixed(4),qty:oq,pv,cost:kind==='D'?+(oq*(+cfg.cost||0)).toFixed(2):0,rules:'s',err:'Nenhum',emo:'3',mkt:'',setup:'Importado do Profit',nota:(est?'Stop estimado na importação. ':'')+'Custos não vêm no relatório.'};if(kind==='O'){const oi=optInfo(c.a,c.t0);Object.assign(t,oi,{estr:c.side==='C'?(oi.ot==='C'?ESTR[0]:ESTR[1]):(oi.ot==='P'?ESTR[3]:'Outra')})}return{t,est,pl:xp==null?null:(xp-ep)*(c.side==='C'?1:-1)*oq*pv-t.cost}})}
function impRefresh(){IM.rows=impBuild();const ex=new Map(S.trades.map(x=>[x.id,x]));IM.dup=new Set();IM.upd=new Set();IM.rows.forEach(r=>{const e=ex.get(r.t.id);if(!e)return;if(isOpen(e)&&r.t.exit!=='')IM.upd.add(r.t.id);else IM.dup.add(r.t.id)})}
function impLoad(txt){const orders=impParse(txt),trs=impTrips(orders);if(!trs.length)throw new Error('Não encontrei ordens executadas nesse arquivo.');IM={orders,trs,cfg:impDefaults(orders,trs),off:new Set()};impRefresh()}
function impPrev(){if(IM.err)return `<div class="warn" style="margin-top:10px">${esc(IM.err)}</div>`;if(IM.msg)return `<div class="card g" style="margin-top:10px">${esc(IM.msg)}</div>`;if(!IM.rows)return '';const R=IM.rows,novos=R.filter(r=>!IM.dup.has(r.t.id)),sel=novos.filter(r=>!IM.off.has(r.t.id)),cn=k=>R.filter(r=>r.t.tipo===k).length,fi=(k,l)=>`<label>${l}<input type="number" step="any" inputmode="decimal" data-imc="${k}" value="${esc(IM.cfg[k])}"></label>`;
return `<div class="card" style="margin-top:10px"><b>${R.length} operações encontradas</b><div class="mut sm">${cn('D')} day trade (WIN/WDO) · ${cn('O')} opções · ${cn('S')} swing${IM.dup.size?' · '+IM.dup.size+' já importada(s)':''}${IM.upd.size?' · '+IM.upd.size+' abertas que agora fecham':''}</div></div><h3>Stops quando não aparecem no relatório</h3><div class="g2">${fi('win','WIN (pontos)')}${fi('wdo','WDO (pontos)')}${fi('opt','Opções: perda do prêmio (%)')}${fi('cost','Custo por contrato (R$)')}</div><div class="mut sm">Os padrões vêm da mediana dos seus próprios stops no relatório. Sem stop não há R, então esses valores são estimativas: ajuste depois em cada trade.</div><h3>Operações</h3>`+R.map(r=>{const t=r.t,d=IM.dup.has(t.id),o=IM.off.has(t.id);return `<div class="card row" ${d?'':`data-a="imptog" data-id="${t.id}"`} style="opacity:${d||o?.45:1}"><div style="font-size:20px">${d?'✔':o?'☐':'☑'}</div><div class="fl"><b>${esc(t.ativo)}</b> · ${t.tipo==='O'?(t.side==='C'?'Comprado':'Lançado'):(t.side==='C'?'Compra':'Venda')} ${t.qty}<div class="mut sm">${t.dt.slice(8,10)}/${t.dt.slice(5,7)} ${t.dt.slice(11)} · ${t.tipo==='D'?'Day trade':t.tipo==='O'?'Opção':'Swing'} · ${esc(t.entry)} → ${t.exit===''?'aberta':esc(t.exit)}${r.est?' · stop estimado':''}${d?' · já importada':''}${IM.upd.has(t.id)?' · fecha operação aberta':''}</div></div><div class="rt ${cls(r.pl)}">${r.pl==null?'<span class="mut sm">aberta</span>':money(r.pl)}</div></div>`}).join('')+`<button class="btn" style="width:100%;margin-top:12px" data-a="impgo" ${sel.length?'':'disabled'}>Importar ${sel.length} operação(ões)</button>`}
function vImport(){return `<h1>Importar relatório</h1><p class="mut sm">No Profit, exporte o histórico de ordens em CSV e escolha o arquivo aqui. O arquivo é lido no seu aparelho. O app junta as ordens executadas em operações (da entrada até a posição zerar): WIN e WDO viram day trade, opções viram Opções. Operações já importadas não duplicam.</p><label class="btn s" style="color:var(--tx);display:block;text-align:center">📂 Escolher arquivo CSV<input type="file" accept=".csv,text/csv,.txt" hidden id="impf"></label>${IM?impPrev():''}`}
document.addEventListener('change',async e=>{const f=e.target;if(f.id==='impf'&&f.files[0]){try{impLoad(new TextDecoder('windows-1252').decode(await f.files[0].arrayBuffer()))}catch(x){IM={err:x.message||'Não consegui ler o arquivo.'}}render();return}if(f.dataset&&f.dataset.imc&&IM&&IM.cfg){IM.cfg[f.dataset.imc]=f.value;impRefresh();render()}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id;if(a==='imptog'){IM.off.has(id)?IM.off.delete(id):IM.off.add(id);render()}else if(a==='impgo'&&IM&&IM.rows){const add=IM.rows.filter(r=>!IM.dup.has(r.t.id)&&!IM.off.has(r.t.id));let nv=0,fc=0;add.forEach(r=>{if(IM.upd.has(r.t.id)){const e=S.trades.find(x=>x.id===r.t.id);if(e){e.exit=r.t.exit;e.dtx=r.t.dtx;e.u=Date.now();fc++}}else{S.trades.push({...r.t,u:Date.now()});nv++}});save();IM={msg:'✅ '+nv+' operação(ões) importada(s)'+(fc?' e '+fc+' aberta(s) encerrada(s)':'')+'. Veja em Trades (Day trade e Opções).'};render()}});
/* ---------- Aba Dia: salvar e histórico ---------- */
const typing=()=>{const a=document.activeElement;return !!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.closest&&a.closest('#app'))};
function svUi(){const e=$('#svs');if(!e)return;e.textContent=SV?('✓ Salvo às '+hm(SV)+(SESS?(S.lastSyncAt&&S.lastSyncAt>=SV?' · na nuvem':' · enviando para a nuvem…'):' · só neste aparelho')):'As alterações são salvas automaticamente.'}
const DF=[['plano','☀️ Plano do dia'],['pre','Ensaio mental'],['resumo','🌙 Como foi o dia'],['cond','Condições dos erros'],['prevn','Para não repetir'],['bem','O que fiz bem'],['aprend','Aprendizado']];
const dHas=d=>!!d&&(DF.some(([k])=>d[k])||d.nota||d.energia||d.erros||d.mkt||Object.values(d.chk||{}).some(Boolean));
const diaSeg=()=>`<div class="seg"><button class="${DV==='ed'?'on':''}" data-a="dv" data-id="ed">✍️ Escrever</button><button class="${DV==='hist'?'on':''}" data-a="dv" data-id="hist">📜 Histórico</button></div>`;
function vDiaHist(){const ks=Object.keys(S.days).filter(k=>dHas(S.days[k])).sort().reverse();return `<h1>Meu dia</h1>${diaSeg()}<input id="lq" placeholder="🔍 Buscar nos meus relatórios" value="${esc(LF.q)}" style="margin-bottom:8px">`+(ks.length?ks.map(k=>{const d=S.days[k],ts=S.trades.filter(t=>(t.dtx||t.dt).slice(0,10)===k).map(t=>calc(t)).filter(c=>c.pl!=null),R=sum(ts.map(c=>c.pl)),txt=DF.map(([f])=>d[f]||'').join(' ').trim(),nck=Object.values(d.chk||{}).filter(Boolean).length,open=DX===k,ds=new Date(k+'T12:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',year:'2-digit'});
return `<div class="card" data-s="${esc((k+' '+ds+' '+txt).toLowerCase())}"><div class="top" data-a="dhx" data-id="${k}" style="cursor:pointer"><div style="min-width:0"><b>${esc(ds)}</b> ${d.energia?EMO[d.energia-1]:''}<div class="mut sm" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:62vw">${esc(d.resumo||d.plano||d.aprend||'(sem texto)')}</div></div><div class="sm mut" style="text-align:right;white-space:nowrap">${d.nota!==undefined&&d.nota!==''?'nota '+esc(d.nota)+' · ':''}${ts.length?`<span class="${cls(R)}">${money(R)}</span> ·`:''} ${open?'▴':'▾'}</div></div>${open?`<div style="margin-top:10px">${DF.filter(([f])=>d[f]).map(([f,l])=>`<div class="sm mut" style="margin-top:8px">${l}</div><div style="white-space:pre-wrap">${esc(d[f])}</div>`).join('')}${d.erros?`<div class="sm mut" style="margin-top:8px">Cometi erro?</div><div>${d.erros==='s'?'Sim':'Não'}</div>`:''}${nck?`<div class="sm mut" style="margin-top:8px">Checklist</div><div>${nck}/${S.rules.length} regras marcadas</div>`:''}<button class="btn s" style="margin-top:12px" data-a="dedit" data-id="${k}">✏️ Editar este dia</button></div>`:''}</div>`}).join(''):'<p class="mut">Nenhum dia registrado ainda. Escreva o primeiro na aba Escrever.</p>')}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id;
if(a==='dv'){DV=id;render();scrollTo(0,0)}
else if(a==='dhx'){DX=DX===id?null:id;render()}
else if(a==='dedit'){D=id;DV='ed';render();scrollTo(0,0)}
else if(a==='dprev'||a==='dnext'){const d=new Date(D+'T12:00');d.setDate(d.getDate()+(a==='dnext'?1:-1));const n=isoD(d);if(n>loc().slice(0,10))return;D=n;render();scrollTo(0,0)}
else if(a==='dtoday'){D=loc().slice(0,10);render();scrollTo(0,0)}
else if(a==='dsave'){clearTimeout(st);await idb('kv','put',S,'s');SV=Date.now();svUi();if(SESS)sync(1)}});
/* ---------- Ativos: Operações, Lucros e Performance (US$) ---------- */
let AV='at',OD={s:'EURUSD',side:'C',entry:'',stop:'',target:'',lots:'',nota:''},OC={},LD={d:'',s:'',v:'',n:''},AOF='all',APF='all',OX=null;
const unionU=(a,b,del)=>{const m=new Map();[...(a||[]),...(b||[])].forEach(x=>{const o=m.get(x.id);if(!o||(x.u||0)>=(o.u||0))m.set(x.id,x)});return [...m.values()].filter(x=>!(del[x.id]&&del[x.id]>=(x.u||0)))};
const asOf=s=>AS.find(a=>a[0]===s),csvQ=v=>'"'+String(v??'').replace(/"/g,'""')+'"',cN=v=>v==null||!isFinite(v)?'':(+v).toFixed(2).replace('.',',');
const apIn=d=>noPeriodo(d,APF,loc().slice(0,10));
function barChartU(id,vals,labels){if(!vals.length)return '';const m=Math.max(...vals.map(Math.abs),1);return `<div class="card"><div class="mut sm" id="chr-${id}">Toque numa barra</div><div class="bars">${vals.map((v,i)=>`<button class="bar" data-a="bar" data-id="${id}" data-t="${esc(labels[i])} · ${usd(v)}" style="height:${Math.max(4,Math.abs(v)/m*100)}%;background:var(${v>=0?'--g':'--r'})"></button>`).join('')}</div></div>`}
function opCalc(o){const a=asOf(o.s);if(!a)return null;const c=ac(a),e=+o.entry,st=+o.stop,tg=+o.target,dir=o.side==='C'?1:-1;if(!(e&&st))return{a,c,need:1};const sp=Math.abs(e-st)/a[7],risk1=sp*c.pv,lots=+o.lots>0?+o.lots:(risk1>0?Math.floor(axg('risco',100)/risk1*100+1e-9)/100:0),tp=tg?Math.abs(tg-e)/a[7]:null;return{a,c,sp,risk1,lots,risk:lots*risk1,gain:tp!=null?lots*tp*c.pv:null,rr:tp!=null&&sp>0?tp/sp:null,margin:lots*c.margin,wrong:(e-st)*dir<=0,wrongT:!!tg&&(tg-e)*dir<=0}}
function opRes(o,x,cost){const a=asOf(o.s),c=ac(a);return ((+x-+o.entry)*(o.side==='C'?1:-1)/a[7])*c.pv*(+o.lots)-(+cost||0)}
function opPrev(){const e=$('#opv');if(!e)return;const r=opCalc(OD);if(!r||r.need){e.innerHTML='<span class="mut sm">Informe entrada e stop para ver risco, lotes e ganho/risco.</span>';return}const u=r.a[11],cap=axg('cap',0);
e.innerHTML=`${r.wrong?'<div class="warn" style="margin-bottom:6px">⚠ O stop está do lado errado da entrada.</div>':''}${r.wrongT?'<div class="warn" style="margin-bottom:6px">⚠ O alvo está do lado errado da entrada.</div>':''}<div class="kv">${KV('Stop',f2(r.sp)+' '+u,'',usd(r.risk1)+' por lote')}${KV('Lotes',f2(r.lots),'',+OD.lots>0?'informado':'sugerido p/ risco de '+usd(axg('risco',100)))}${KV('Risco total',usd(r.risk),'r',cap>0?f2(r.risk/cap*100)+'% do capital':'')}${KV('Ganho no alvo',r.gain==null?'–':usd(r.gain),'g',r.rr==null?'informe o alvo':'ganho/risco '+f2(r.rr)+' para 1')}</div><div class="mut sm" style="margin-top:6px">Margem: ${usd(r.margin)}${cap>0&&r.margin>cap?' <span class="r">⚠ maior que o capital</span>':''}</div>`}
function opPanel(o){const b=(a,l,c='s')=>`<button class="btn ${c}" data-a="${a}" data-id="${o.id}">${l}</button>`,mine=OC.id===o.id,ci=(k,l)=>`<label>${l}<input type="number" step="any" inputmode="decimal" data-oc="${k}" value="${esc(mine?OC[k]:'')}"></label>`;let h='<div style="margin-top:10px">'+(o.nota?`<div class="sm mut" style="white-space:pre-wrap">${esc(o.nota)}</div>`:'');
if(o.st==='open')h+=`<div class="g3" style="margin-top:8px">${ci('exit','Saída (preço)')}${ci('res','Resultado US$ (opc.)')}${ci('cost','Custos US$')}</div><div class="mut sm" id="ocv" style="margin-top:6px">Informe o preço de saída (o resultado sai do valor do pip) ou o resultado direto.</div><div class="g2" style="margin-top:8px">${b('opfin','✅ Encerrar','')}${b('opdel','🗑 Excluir')}</div>`;
else if(o.st==='plan')h+=`<div class="g3" style="margin-top:8px">${b('opgo','▶ Entrei','')}${b('opedit','✏️ Editar')}${b('opdel','🗑 Excluir')}</div>`;
else h+=`<div class="sm" style="margin-top:6px">${o.x!==''&&o.x!=null?'Saída '+esc(o.x)+' · ':''}custos ${usd(o.cost||0)}</div><div class="g3" style="margin-top:8px">${b('opre','↩ Reabrir')}${b('opedit','✏️ Editar')}${b('opdel','🗑 Excluir')}</div>`;return h+'</div>'}
function opCard(o){const a=asOf(o.s)||[,,,,,,,1],sp=(numN(o.entry)!=null&&numN(o.stop)!=null)?Math.abs(numN(o.entry)-numN(o.stop))/a[7]:null,tp=(numN(o.target)!=null&&numN(o.entry)!=null)?Math.abs(numN(o.target)-numN(o.entry))/a[7]:null,rr=tp&&sp?tp/sp:null,R=o.st==='closed'&&o.rk>0?o.res/o.rk:null,stt={plan:'📝 Planejada',open:'▶ Em andamento',closed:'✅ Encerrada'}[o.st];
return `<div class="card"><div class="top" data-a="opx" data-id="${o.id}" style="cursor:pointer"><div><b>${esc(o.s)}</b> · ${o.side==='C'?'Compra':'Venda'} ${f2(o.lots)} lote(s)<div class="mut sm">${stt} · entrada ${esc(o.entry)} · stop ${esc(o.stop)}${o.target?' · alvo '+esc(o.target):''}${rr?' · ganho/risco '+f2(rr)+' para 1':''}</div></div><div class="rt ${o.st==='closed'?cls(o.res):''}">${o.st==='closed'?usd(o.res):'<span class="mut sm">'+usd(o.rk||0)+' em risco</span>'}</div></div>${OX===o.id?opPanel(o):''}</div>`}
function vOps(){const O=S.ops||[],ed=!!OD.id,a=asOf(OD.s),px=a?ac(a).px:'',lst=O.filter(o=>AOF==='all'||o.st===AOF).sort((x,y)=>(y.dt||'').localeCompare(x.dt||'')),fi=(k,l,ph)=>`<label>${l}<input type="number" step="any" inputmode="decimal" data-od="${k}" value="${esc(OD[k])}" placeholder="${esc(ph||'')}"></label>`;
return `<div class="card"><b>${ed?'Editar operação':'Montar operação'}</b><label>Ativo<select data-od="s">${AS.map(x=>`<option value="${x[0]}"${OD.s===x[0]?' selected':''}>${x[0]} · ${esc(x[1])}</option>`).join('')}</select></label><label>Lado</label><div class="chips2"><button class="${OD.side==='C'?'on g':''}" data-a="odside" data-id="C">Compra</button><button class="${OD.side==='V'?'on r':''}" data-a="odside" data-id="V">Venda</button></div><div class="g3">${fi('entry','Entrada',px)}${fi('stop','Stop')}${fi('target','Alvo')}</div><div class="g2">${fi('lots','Lotes (vazio = pelo risco)','auto')}<label>Anotação<input data-od="nota" value="${esc(OD.nota)}"></label></div><div id="opv" style="margin-top:10px"></div><button class="btn" style="width:100%;margin-top:10px" data-a="opadd">${ed?'💾 Salvar alterações':'➕ Adicionar à lista'}</button>${ed?'<button class="btn s" style="width:100%;margin-top:6px" data-a="opcancel">Cancelar edição</button>':''}</div>
<div class="chips2" style="margin-top:8px">${[['all','Todas'],['plan','Planejadas'],['open','Em andamento'],['closed','Encerradas']].map(([k,l])=>`<button class="${AOF===k?'on':''}" data-a="opf" data-id="${k}">${l}</button>`).join('')}</div>${lst.length?lst.map(opCard).join(''):'<p class="mut">Nenhuma operação nesta lista. Monte a primeira acima.</p>'}`}
function lcItems(){const it=[];(S.ops||[]).filter(o=>o.st==='closed').forEach(o=>it.push({id:o.id,d:(o.dtx||o.dt||'').slice(0,10),s:o.s,v:+o.res,n:'Operação '+(o.side==='C'?'de compra':'de venda'),op:1,rk:o.rk}));(S.lanc||[]).forEach(l=>it.push({id:l.id,d:l.d,s:l.s,v:+l.v,n:l.n||'',op:0}));return it.sort((a,b)=>a.d.localeCompare(b.d))}
function vLucros(){const it=lcItems(),td=loc().slice(0,10),wk=diasMais(td,-6),mo=td.slice(0,7),sm=f=>sum(it.filter(f).map(x=>x.v)),cap=axg('cap',0),tot=sm(()=>1),h=sm(x=>x.d===td),dm={};it.forEach(x=>dm[x.d]=(dm[x.d]||0)+x.v);const dk=Object.keys(dm).sort();let c=0;const cum=dk.map(k=>c+=dm[k]),lb=k=>k.slice(8)+'/'+k.slice(5,7),k7=dk.slice(-20);
return `<div class="kv">${KV('Hoje',usd(h),cls(h),brl(h))}${KV('Últimos 7 dias',usd(sm(x=>x.d>=wk)),cls(sm(x=>x.d>=wk)),brl(sm(x=>x.d>=wk)))}${KV('Este mês',usd(sm(x=>x.d.slice(0,7)===mo)),cls(sm(x=>x.d.slice(0,7)===mo)),brl(sm(x=>x.d.slice(0,7)===mo)))}${KV('Total',usd(tot),cls(tot),cap>0?f2(tot/cap*100)+'% do capital':brl(tot))}</div>
${dk.length>1?`<h2>Evolução</h2>${lineChart('lcum',cum,dk.map(lb),v=>usd(v))}<h2>Resultado por dia</h2>${barChartU('ldia',k7.map(k=>dm[k]),k7.map(lb))}`:''}
<div class="card" style="margin-top:12px"><b>Registrar lucro ou prejuízo</b><div class="g2"><label>Data<input type="date" data-lf="d" value="${esc(LD.d||td)}"></label><label>Valor (US$, negativo = prejuízo)<input type="number" step="any" inputmode="decimal" data-lf="v" value="${esc(LD.v)}"></label></div><div class="g2"><label>Ativo (opcional)<select data-lf="s"><option value="">–</option>${AS.map(x=>`<option value="${x[0]}"${LD.s===x[0]?' selected':''}>${x[0]}</option>`).join('')}</select></label><label>Anotação<input data-lf="n" value="${esc(LD.n)}"></label></div><button class="btn" style="width:100%;margin-top:10px" data-a="lcadd">➕ Adicionar</button><div class="mut sm" style="margin-top:6px">Operações encerradas na aba Operações entram aqui sozinhas.</div></div>
<h3>Lançamentos</h3>${it.length?[...it].reverse().slice(0,80).map(x=>`<div class="card g2" style="grid-template-columns:1fr auto;align-items:center"><div><b>${x.d.slice(8)}/${x.d.slice(5,7)}/${x.d.slice(2,4)}</b> ${x.s?'· '+esc(x.s):''}<div class="mut sm">${esc(x.n)}${x.op?' · da aba Operações':''}</div></div><div style="text-align:right"><b class="${cls(x.v)}">${usd(x.v)}</b>${x.op?'':`<button class="x" data-a="lcdel" data-id="${x.id}">✕</button>`}</div></div>`).join(''):'<p class="mut">Nenhum lançamento ainda.</p>'}`}
function pfRows(){const g={};lcItems().filter(x=>apIn(x.d)).forEach(x=>(g[x.s||'(sem ativo)']??=[]).push(x));return Object.entries(g).map(([s,a])=>{const v=a.map(x=>x.v),w=v.filter(z=>z>0),l=v.filter(z=>z<0),rs=a.filter(x=>x.op&&x.rk>0).map(x=>x.v/x.rk);return{s,n:a.length,win:w.length/a.length,tot:sum(v),avg:avg(v),gw:sum(w),gl:sum(l),R:rs.length?avg(rs):null,best:Math.max(...v),worst:Math.min(...v)}}).sort((x,y)=>y.tot-x.tot)}
function pfAll(rows){const n=sum(rows.map(r=>r.n)),gw=sum(rows.map(r=>r.gw)),gl=sum(rows.map(r=>r.gl)),nw=rows.reduce((a,r)=>a+Math.round(r.win*r.n),0),nl=lcItems().filter(x=>apIn(x.d)&&x.v<0).length;return{n,tot:sum(rows.map(r=>r.tot)),gw,gl,win:n?nw/n:0,pf:gl<0?gw/-gl:null,payoff:nw&&nl&&gl<0?(gw/nw)/(-gl/nl):null,best:rows.length?Math.max(...rows.map(r=>r.best)):0,worst:rows.length?Math.min(...rows.map(r=>r.worst)):0}}
function vPerf(){const rows=pfRows(),t=pfAll(rows);return `<div class="chips2">${[['all','Tudo'],['hoje','Hoje'],['7','7 dias'],['30','30 dias'],['mes','Este mês']].map(([k,l])=>`<button class="${APF===k?'on':''}" data-a="apf" data-id="${k}">${l}</button>`).join('')}</div>`+(rows.length?`<div class="kv" style="margin-top:8px">${KV('Resultado',usd(t.tot),cls(t.tot),t.n+' lançamento(s)/operação(ões)')}${KV('Acerto',pc(t.win))}${KV('Fator de lucro',t.pf==null?'–':f2(t.pf),'','ganhos ÷ perdas')}${KV('Payoff',t.payoff==null?'–':f2(t.payoff),'','ganho médio ÷ perda média')}${KV('Melhor',usd(t.best),'g')}${KV('Pior',usd(t.worst),'r')}</div><h2>Resultado por ativo</h2>${barChartU('pfa',rows.map(r=>r.tot),rows.map(r=>r.s))}<div class="card"><table><tr><th>Ativo</th><th>Nº</th><th>Acerto</th><th>Resultado</th><th>Média</th></tr>${rows.map(r=>`<tr><td>${esc(r.s)}</td><td>${r.n}</td><td>${pc(r.win)}</td><td class="${cls(r.tot)}">${usd(r.tot)}</td><td class="${cls(r.avg)}">${usd(r.avg)}</td></tr>`).join('')}</table></div>`:'<p class="mut" style="margin-top:10px">Sem resultados neste período. Encerre operações ou registre lucros para ver a performance.</p>')+`<h3>Exportar</h3><div class="g2"><button class="btn" data-a="pfexp">⬇️ Performance por ativo</button><button class="btn s" data-a="opexp">⬇️ Todas as operações</button></div><div class="mut sm" style="margin-top:6px">Arquivos CSV (separador ponto e vírgula, vírgula decimal) que abrem direto no Excel em português. Respeitam o período escolhido acima.</div>`}
async function pfExport(kind){const D0=new Date(),nm=isoD(D0);if(kind==='pf'){const rows=pfRows(),t=pfAll(rows),h=['ativo','operacoes','acerto_pct','resultado_usd','media_usd','ganhos_usd','perdas_usd','R_medio','melhor_usd','pior_usd'];const L=rows.map(r=>[r.s,r.n,cN(r.win*100),cN(r.tot),cN(r.avg),cN(r.gw),cN(r.gl),cN(r.R),cN(r.best),cN(r.worst)].map(csvQ).join(';'));L.push(['TOTAL',t.n,cN(t.win*100),cN(t.tot),'',cN(t.gw),cN(t.gl),'',cN(t.best),cN(t.worst)].map(csvQ).join(';'));await saveFile('performance-ativos-'+nm+'.csv','\ufeff'+h.join(';')+'\n'+L.join('\n'))}
else{const h=['tipo','data','ativo','lado','entrada','stop','alvo','lotes','saida','resultado_usd','risco_usd','R','status','anotacao'],L=[];(S.ops||[]).filter(o=>apIn((o.dtx||o.dt||'').slice(0,10))).forEach(o=>L.push(['Operação',(o.dtx||o.dt||'').slice(0,10),o.s,o.side==='C'?'Compra':'Venda',o.entry,o.stop,o.target,o.lots,o.x,o.st==='closed'?cN(o.res):'',cN(o.rk),o.st==='closed'&&o.rk>0?cN(o.res/o.rk):'',{plan:'Planejada',open:'Em andamento',closed:'Encerrada'}[o.st],o.nota].map(csvQ).join(';')));(S.lanc||[]).filter(l=>apIn(l.d)).forEach(l=>L.push(['Lançamento',l.d,l.s,'','','','','','',cN(l.v),'','','',l.n].map(csvQ).join(';')));await saveFile('operacoes-ativos-'+nm+'.csv','\ufeff'+h.join(';')+'\n'+L.join('\n'))}}
function vAtivos(){const sg=[['at','Ativos'],['op','Operações'],['lu','Lucros'],['pf','Performance']];return `<h1>Forex</h1><div class="seg">${sg.map(([k,l])=>`<button class="${AV===k?'on':''}" data-a="avv" data-id="${k}">${l}</button>`).join('')}</div>`+(AV==='op'?vOps():AV==='lu'?vLucros():AV==='pf'?vPerf():vAtivos0())}
document.addEventListener('input',e=>{const t=e.target,d=t.dataset||{};if(d.od!==undefined){OD[d.od]=t.value;opPrev()}else if(d.lf!==undefined)LD[d.lf]=t.value;else if(d.oc!==undefined){OC[d.oc]=t.value;const o=(S.ops||[]).find(x=>x.id===OC.id),v=$('#ocv');if(o&&v){const x=OC.exit,rs=OC.res;v.textContent=rs!==undefined&&rs!==''?'Resultado informado: '+usd(+rs):x!==undefined&&x!==''?'Resultado estimado: '+usd(opRes(o,x,OC.cost)):'Informe o preço de saída ou o resultado.'}}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id,fnd=()=>(S.ops||[]).find(x=>x.id===id),msg=m=>{const v=$('#opv');if(v)v.innerHTML='<div class="warn">'+m+'</div>'};
if(a==='avv'){AV=id;render()}
else if(a==='odside'){OD.side=id;render()}
else if(a==='opf'){AOF=id;render()}
else if(a==='opx'){OX=OX===id?null:id;OC={id};render()}
else if(a==='opcancel'){OD={s:OD.s,side:OD.side,entry:'',stop:'',target:'',lots:'',nota:''};render()}
else if(a==='opadd'){const r=opCalc(OD);if(!r||r.need||r.wrong||!(r.lots>0)){msg('Informe entrada e stop do lado certo (e lotes, se o stop for largo demais para o risco definido).');return}const f={s:OD.s,side:OD.side,entry:OD.entry,stop:OD.stop,target:OD.target||'',lots:r.lots,rk:+r.risk.toFixed(2),nota:OD.nota||'',u:Date.now()};if(OD.id){const o=(S.ops||[]).find(x=>x.id===OD.id);if(o)Object.assign(o,f)}else(S.ops??=[]).push({id:uid(),dt:loc().slice(0,16),st:'plan',...f});OD={s:OD.s,side:OD.side,entry:'',stop:'',target:'',lots:'',nota:''};save();render()}
else if(a==='opedit'){const o=fnd();if(!o)return;OD={id:o.id,s:o.s,side:o.side,entry:o.entry,stop:o.stop,target:o.target,lots:o.lots,nota:o.nota};render();scrollTo(0,0)}
else if(a==='opgo'){const o=fnd();if(o){o.st='open';o.u=Date.now();save();render()}}
else if(a==='opfin'){const o=fnd();if(!o||OC.id!==id)return;const rs=OC.res,x=OC.exit;let res;if(rs!==undefined&&rs!==''&&isFinite(+rs))res=+rs;else if(x!==undefined&&x!==''&&isFinite(+x))res=opRes(o,x,OC.cost);else{const v=$('#ocv');if(v)v.innerHTML='<span class="r">Informe o preço de saída ou o resultado.</span>';return}Object.assign(o,{st:'closed',x:x===undefined?'':x,cost:+OC.cost||0,res:+res.toFixed(2),dtx:loc().slice(0,16),u:Date.now()});OC={};OX=null;save();render()}
else if(a==='opre'){const o=fnd();if(o){o.st='open';o.u=Date.now();save();render()}}
else if(a==='opdel'){S.ops=(S.ops||[]).filter(x=>x.id!==id);(S.del??={})[id]=Date.now();OX=null;save();render()}
else if(a==='lcadd'){const v=+LD.v;if(!isFinite(v)||LD.v===''||v===0)return;(S.lanc??=[]).push({id:uid(),d:LD.d||loc().slice(0,10),s:LD.s||'',v,n:LD.n||'',u:Date.now()});LD={d:LD.d,s:'',v:'',n:''};save();render()}
else if(a==='lcdel'){S.lanc=(S.lanc||[]).filter(x=>x.id!==id);(S.del??={})[id]=Date.now();save();render()}
else if(a==='apf'){APF=id;render()}
else if(a==='pfexp')pfExport('pf');
else if(a==='opexp')pfExport('op')});
/* handlers das abas Estudos e Ativos */
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=b.dataset.id,bk=()=>S.books.find(x=>x.id===(a==='addnote'||a==='delnote'?id:BID));
if(a==='openbook'){BID=id;BV=(S.books.find(x=>x.id===id)||{}).pat?'pad':'not';tab='livro';render();scrollTo(0,0)}
else if(a==='addbook'){const t=$('#bt').value.trim();if(!t)return;S.books.unshift({id:uid(),t,a:$('#ba').value.trim(),st:'lendo',notes:[],u:Date.now()});save();render()}
else if(a==='delbook'){if(!confirm('Excluir este livro e todas as anotações?'))return;S.books=S.books.filter(x=>x.id!==id);(S.del??={})[id]=Date.now();save();tab='estudos';render();scrollTo(0,0)}
else if(a==='bv'){BV=id;render()}
else if(a==='pf'){PF=id;render()}
else if(a==='addnote'){const x=$('#nx').value.trim(),t=$('#nt').value.trim();if(!x&&!t)return;const k=bk();(k.notes??=[]).push({id:uid(),t,p:$('#np').value.trim(),x,u:Date.now()});k.u=Date.now();save();render()}
else if(a==='delnote'){const k=bk();k.notes=k.notes.filter(n=>n.id!==b.dataset.n);k.u=Date.now();save();render()}
else if(a==='af'){AF=id;render()}
else if(a==='axo'){AXO[id]=!AXO[id];render()}});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.pn){(S.pn??={})[t.dataset.pn]=t.value;save()}
else if(t.dataset.nb){const[bi,ni]=t.dataset.nb.split('|'),k=S.books.find(x=>x.id===bi),n=k&&k.notes.find(x=>x.id===ni);if(n){n.x=t.value;n.u=Date.now();k.u=Date.now();save()}}
else if(t.dataset.bs){const k=S.books.find(x=>x.id===t.dataset.bs);if(k){k.st=t.value;k.u=Date.now();save()}}});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.ax||t.dataset.axg){(S.ax??={})[t.dataset.ax||'g.'+t.dataset.axg]=t.value;save();render()}});
/* ---------- App ---------- */
/* ---------- Contratos pelo capital e volatilidade ---------- */
function vContratos(){const g=(k,d)=>+gv('ct',k,d),cap=g('cap',10000),pct=g('pct',2),vf=g('vf',20),nd=g('nd',3),ns=g('ns',2),nm=g('nm',2),R=cap*pct/100,rb=n=>'R$ '+(+n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}),fi=(k,l,v)=>`<label>${l}<input type="number" step="any" inputmode="decimal" data-ax="ct.${k}" value="${v}"></label>`,
IN=[['sp','SP-500',6000,.44,50],['nq','NASDAQ',21000,.6,20],['cl','OIL - CL',69,2.7,1000],['wdo','WDOFUT',5260,1,10],['win','WINFUT',197000,1,.2],['ac','AÇÕES',30,5,1]],
lim=[['Risco por trade',R],['Perda máx. no dia',R*nd],['Perda máx. na semana',R*nd*ns],['Perda máx. no mês',R*nd*ns*nm],['Stop pânico (2× o trade)',R*2]];
return `<h1>Contratos</h1><p class="mut sm">Quantos contratos cabem no seu risco: stop pela volatilidade (% da vol. do ativo) × valor do ponto. Preço e volatilidade são de referência: atualize antes do pregão.</p>
<div class="card"><div class="g2">${fi('cap','Capital (R$)',cap)}${fi('pct','Risco por trade (% do capital)',pct)}</div><div class="g2">${fi('vf','% da volatilidade como stop',vf)}${fi('nd','Máx. de stops no dia',nd)}</div><div class="g2">${fi('ns','Máx. dias de perda na semana',ns)}${fi('nm','Máx. semanas de perda no mês',nm)}</div></div>
<div class="kv">${lim.map(([l,v])=>`<div class="card"><span class="mut sm">${l}</span><b${l.startsWith('Stop')?' class="r"':''}>${rb(v)}</b></div>`).join('')}</div>`+
IN.map(([k,n,p0,v0,m0])=>{const px=g(k+'.px',p0),vol=g(k+'.vol',v0),mu=g(k+'.mult',m0),sm=g(k+'.stop',0),vp=px*vol/100,sv=vp*vf/100,st=sm>0?sm:sv,ru=st*mu,q=ru>0?Math.floor(R/ru):0,rl=q*ru;
return `<div class="card"><div class="top"><b>${n}</b><span class="rt ${q>0?'g':'r'}">${q} ${k==='ac'?'ações':'contrato'+(q===1?'':'s')}</span></div>
<div class="sm mut" style="margin-top:6px">Vol. em pontos ${f2(vp)} · stop ${f2(st)}${sm>0?' (manual)':''} · risco por contrato <b>${rb(ru)}</b></div>${q>0?`<div class="sm" style="margin-top:4px">Risco real <b>${rb(rl)}</b> (${f2(cap>0?rl/cap*100:0)}% do capital)</div>`:`<div class="warn" style="margin-top:6px">⚠ 1 ${k==='ac'?'ação':'contrato'} arrisca ${rb(ru)}, acima do limite de ${rb(R)} por trade.</div>`}
<div class="g2" style="margin-top:6px">${fi(k+'.px','Último preço',px)}${fi(k+'.vol','Volatilidade (%)',vol)}${fi(k+'.mult','Multiplicador (R$/pt)',mu)}${fi(k+'.stop','Stop manual (pts)',sm||'')}</div></div>`}).join('')+`<p class="mut sm">Stop pela vol = preço × vol% × ${vf}%. Contratos = risco do trade ÷ (stop × multiplicador), arredondado para baixo. O stop manual substitui o stop pela vol. Valores iniciais copiados da sua planilha (aba CÁLCULO DT).</p>`}
/* ---------- Início: posso operar hoje + calendário ---------- */
let CMX=0;
function pCore(hj,P){const g=(k,d)=>+gv('ct',k,d),pr=S.prop||{},nd=g('nd',3),lim=+pr.perdaDia||g('cap',10000)*g('pct',2)/100*nd,perda=Math.max(0,-P),ord=hj.slice().sort((a,b)=>(a.dtx||a.dt).localeCompare(b.dtx||b.dt)),mot=[];let seq=0;for(let i=ord.length-1;i>=0&&ord[i].c.pl<0;i--)seq++;
{const tk=loc().slice(0,10);if(turnoNv(tk)==='r')mot.push('dia de turno '+TH[tcod(tk)]);}if(perda>=lim)mot.push('perda diária no limite');if(seq>=2)mot.push(seq+' stops seguidos');if(hj.length>=nd)mot.push(hj.length+' trades feitos (máx. '+nd+')');return{nd,lim,perda,seq,mot}}
function pHoje(){const td=loc().slice(0,10),hj=S.trades.map(t=>({...t,c:calc(t)})).filter(t=>t.c.pl!=null&&(t.dtx||t.dt).slice(0,10)===td);return{td,hj,P:sum(hj.map(t=>t.c.pl))}}
function pBloq(){const{td,hj,P}=pHoje(),c=pCore(hj,P);if(!c.mot.length)return true;if(!confirm('PARE POR HOJE: '+c.mot.join(', ')+'.\n\nAbrir um novo trade mesmo assim?'))return false;(S.ax??={})['ov.'+td]=(+S.ax['ov.'+td]||0)+1;save();return true}
function posso(hj,P,nck){const c=pCore(hj,P),{nd,lim,perda,seq,mot}=c,rest=Math.max(0,lim-perda),nr=(S.rules||[]).length,ov=+((S.ax||{})['ov.'+loc().slice(0,10)])||0;
const lv=mot.length?'r':(perda>=lim*.8||(nr&&nck<nr)||turnoNv(loc().slice(0,10))==='a'?'a':'g'),tt={r:'Pare por hoje',a:'Atenção',g:'Pode operar'}[lv],col={r:'var(--r)',a:'#e8a317',g:'var(--g)'}[lv],kc=(l,v,s)=>`<div class="card"><span class="mut sm">${l}</span><b>${v}</b><span class="mut sm">${s}</span></div>`;
return `<div class="card" style="border:2px solid ${col}"><div class="top"><b style="font-size:20px;color:${col}">${tt}</b><span class="mut sm">Posso operar hoje?</span></div><div class="sm" style="margin:6px 0">${mot.length?mot.join(' · ')+'. Novo trade pede confirmação.':((turnoNv(loc().slice(0,10))==='a'?turnoTxt(loc().slice(0,10))+': cuide do horário. ':'')+(nr&&nck<nr?'Falta fechar o checklist de regras.':'Dentro dos limites do dia.'))}</div>${ov?`<div class="sm r" style="margin-bottom:6px">Você abriu ${ov} trade(s) depois do aviso hoje.</div>`:''}<div class="kv">${kc('Perda restante',money(rest),'de '+money(lim))}${kc('Trades hoje',hj.length,'máx. '+nd)}${kc('Stops seguidos',seq,'pare em 2')}${kc('Checklist',nck+'/'+nr,'regras de hoje')}</div></div>`}
function calMes(){const n=new Date();n.setDate(1);n.setMonth(n.getMonth()+CMX);const y=n.getFullYear(),m=n.getMonth(),pad=x=>String(x).padStart(2,'0'),pre=y+'-'+pad(m+1)+'-',dim=new Date(y,m+1,0).getDate(),off=(new Date(y,m,1).getDay()+6)%7,by={},td=loc().slice(0,10);S.trades.forEach(t=>{const c=calc(t),d=(t.dtx||t.dt).slice(0,10);if(c.pl!=null&&d.startsWith(pre))by[d]=(by[d]||0)+c.pl});const tot=sum(Object.values(by));let cells='';for(let i=0;i<off;i++)cells+='<div></div>';
for(let d=1;d<=dim;d++){const k=pre+pad(d),v=by[k],bg=v==null?'var(--bg)':`color-mix(in srgb,${v>=0?'var(--g)':'var(--r)'} 30%,var(--card))`;cells+=`<button class="dc" data-a="cday" data-id="${k}" style="background:${bg}${k===td?';outline:2px solid var(--ac)':''}"><span class="mut sm">${d}${tcod(k)?' <i style="font-size:9px">'+tcod(k)+'</i>':''}</span><b>${v==null?'':Math.abs(v)>=1000?(v/1000).toFixed(1).replace('.',',')+'k':Math.round(v)}</b></button>`}
return `<div class="top"><h2>Calendário</h2><div><button class="btn s" data-a="cm" data-id="-1">‹</button> <span class="sm">${n.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</span> <button class="btn s" data-a="cm" data-id="1">›</button></div></div><div class="mc">${['S','T','Q','Q','S','S','D'].map(x=>`<span class="mut sm">${x}</span>`).join('')}${cells}</div><div class="sm" style="margin:6px 0 12px">Resultado do mês: <b class="${tot>=0?'g':'r'}">${money(tot)}</b></div>`}

/* ==== TURNO:INICIO ==== escala de turno (Gerdau): códigos 8, 16, 0 e F; alerta para não operar */
var TCOD=['8','16','0','F'],TH={'8':'08h–17h','16':'16h–00h','0':'00h–08h','F':'Folga'},TNV0={'8':'r','16':'a','0':'a','F':'g'},TSV=0,TSM=0,TSMSG='';
function turnoSeed(){const d={};'8,F,16,16,16,F,0,0,8,8,F,F,16,16'.split(',').forEach((c,i)=>{d[diasMais('2026-10-14',i)]=c});return{on:1,letra:'A',dias:d,niv:{...TNV0}}}
function turnoGet(){const t=(S.ax||{}).turno;return t&&t.dias?{on:1,letra:'A',...t,niv:{...TNV0,...(t.niv||{})}}:turnoSeed()}
function turnoSet(f){const t=turnoGet();f(t);(S.ax??={}).turno=t;save()}
function tcod(k){const t=turnoGet();return t.on?(t.dias[k]||''):''}
function turnoNv(k){const t=turnoGet(),c=t.on&&t.dias[k];return c?(t.niv[c]||'g'):'g'}
function turnoTxt(k){const c=tcod(k);return c?(c==='F'?'Folga':'Turno '+c+' ('+TH[c]+')'):''}
/* lê linhas como "14.10.26 qua 8" ou a linha inteira da tabela (A B C D) e pega a coluna da letra */
function turnoParse(txt,letra){const idx=Math.max(0,'ABCD'.indexOf(String(letra||'A').toUpperCase())),dias={};let ign=0;
String(txt||'').split(/\r?\n/).forEach(ln=>{const m=ln.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);if(!m){if(ln.trim())ign++;return}
let y=m[3]?+m[3]:new Date().getFullYear();if(y<100)y+=2000;const dd=+m[1],mm=+m[2];if(dd<1||dd>31||mm<1||mm>12){ign++;return}
const resto=ln.slice(m.index+m[0].length),tk=(resto.match(/\b(16|8|0|F|folga)\b/gi)||[]).map(x=>/^f/i.test(x)?'F':x);
if(!tk.length){ign++;return}const c=tk.length>=4?tk[idx]:tk[0];if(!c){ign++;return}
dias[y+'-'+String(mm).padStart(2,'0')+'-'+String(dd).padStart(2,'0')]=c});return{dias,n:Object.keys(dias).length,ign}}
function turnoCard(){const t=turnoGet(),td=loc().slice(0,10),nm={r:'Não opere',a:'Atenção',g:'Livre'},cl={r:'var(--r)',a:'#e8a317',g:'var(--g)'};
const ch=Array.from({length:7},(_,i)=>{const k=diasMais(td,i),c=t.dias[k]||'',nv=c?t.niv[c]||'g':'';return `<div style="text-align:center;flex:1;min-width:0"><div class="mut sm">${i?new Date(k+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short'}).replace('.',''):'hoje'}</div><div style="margin-top:3px;padding:6px 0;border-radius:8px;border:${i?1:2}px solid ${nv?cl[nv]:'var(--bd,#8884)'};font-weight:700">${c||'–'}</div></div>`}).join('');
const hoje=t.on&&t.dias[td]?`<div style="margin:6px 0;color:${cl[turnoNv(td)]}"><b>${turnoTxt(td)}</b> · ${nm[turnoNv(td)]}${turnoNv(td)==='r'?' — hoje não é dia de operar.':''}</div>`:`<div class="mut sm" style="margin:6px 0">${t.on?'Hoje sem turno cadastrado.':'Alerta de turno desligado.'}</div>`;
return `<div class="card"><div class="top"><b>Escala de turno · letra ${esc(t.letra)}</b><button class="btn s" data-a="tsv">${TSV?'Fechar':'Editar escala'}</button></div>${hoje}<div style="display:flex;gap:4px">${ch}</div>${TSV?turnoEd(t):''}</div>`}
function turnoEd(t){const n=new Date();n.setDate(1);n.setMonth(n.getMonth()+TSM);const y=n.getFullYear(),m=n.getMonth(),pad=x=>String(x).padStart(2,'0'),dim=new Date(y,m+1,0).getDate(),off=(new Date(y,m,1).getDay()+6)%7,cl={r:'var(--r)',a:'#e8a317',g:'var(--g)'};let cells='';for(let i=0;i<off;i++)cells+='<div></div>';
for(let d=1;d<=dim;d++){const k=y+'-'+pad(m+1)+'-'+pad(d),c=t.dias[k]||'';cells+=`<button class="dc" data-a="tsc" data-id="${k}" style="${c?'border:2px solid '+cl[t.niv[c]||'g']:''}"><span class="mut sm">${d}</span><b>${c}</b></button>`}
const nvB=TCOD.map(c=>`<button class="btn s" data-a="tsn" data-id="${c}">${c==='F'?'Folga':c+' · '+TH[c]}: ${({r:'não opere',a:'atenção',g:'livre'})[t.niv[c]]}</button>`).join(' ');
return `<hr style="border:0;border-top:1px solid #8883;margin:10px 0"><div class="top"><span class="sm">${n.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})} · toque no dia para trocar (vazio → 8 → 16 → 0 → F)</span><div><button class="btn s" data-a="tsm" data-id="-1">‹</button> <button class="btn s" data-a="tsm" data-id="1">›</button></div></div><div class="mc">${['S','T','Q','Q','S','S','D'].map(x=>`<span class="mut sm">${x}</span>`).join('')}${cells}</div>
<div class="sm" style="margin:10px 0 4px">O que cada turno faz com o aviso (toque para mudar):</div><div style="display:flex;flex-wrap:wrap;gap:6px">${nvB}</div>
<div class="sm" style="margin:12px 0 4px">Importar: cole as linhas da tabela (ex.: <i>14.10.26 qua 8</i>, ou a linha inteira A B C D) e escolha a sua letra.</div><div style="display:flex;gap:6px"><input id="tsl" value="${esc(t.letra)}" maxlength="1" style="width:46px;text-align:center"><button class="btn s" data-a="tsimp">Importar</button><button class="btn s" data-a="tson">${t.on?'Desligar aviso':'Ligar aviso'}</button><button class="btn s" data-a="tsclr">Limpar</button></div><textarea id="tsx" rows="5" placeholder="14.10.26 qua 8 F 16 0&#10;15.10.26 qui F 16 0 8" style="width:100%;margin-top:6px"></textarea><div class="sm ${TSMSG[0]==='✓'?'g':'r'}" style="margin-top:4px">${esc(TSMSG)}</div>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||!/^ts/.test(b.dataset.a))return;const a=b.dataset.a,id=b.dataset.id;
if(a==='tsv'){TSV=!TSV;TSMSG=''}
else if(a==='tsm')TSM+=+id
else if(a==='tsc')turnoSet(t=>{const c=t.dias[id]||'',i=TCOD.indexOf(c),nx=i+1<TCOD.length?TCOD[i+1]:'';nx?t.dias[id]=nx:delete t.dias[id]})
else if(a==='tsn')turnoSet(t=>{t.niv[id]={r:'a',a:'g',g:'r'}[t.niv[id]||'g']})
else if(a==='tson')turnoSet(t=>{t.on=t.on?0:1})
else if(a==='tsclr'){if(!confirm('Apagar toda a escala cadastrada?'))return;turnoSet(t=>{t.dias={}})}
else if(a==='tsimp'){const l=(($('#tsl')||{}).value||'A').trim().toUpperCase().slice(0,1)||'A',r=turnoParse(($('#tsx')||{}).value,l);if(!r.n){TSMSG='Não achei datas com turno. Use linhas como: 14.10.26 qua 8';render();return}turnoSet(t=>{t.letra=l;Object.assign(t.dias,r.dias)});TSMSG='✓ '+r.n+' dia(s) importado(s)'+(r.ign?' ('+r.ign+' linha(s) ignorada(s))':'')}
else return;render()});
/* ==== TURNO:FIM ==== */

const IC=p=>`<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${p}"/></svg>`,
ICS={live:'M3 12h4l3-8 4 16 3-8h4',regras:'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2',graf:'M3 17l5-6 4 3 8-9M3 21h18',painel:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',rev:'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',estudos:'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 19h15',ativos:'M12 3v18M16 7h-5a3 3 0 000 6h2a3 3 0 010 6H8',contratos:'M6 3h12v18H6zM9 7h6M9 12h1M12 12h1M9 16h1M12 16h1',import:'M12 4v11M7 11l5 5 5-5M5 20h14',carteiras:'M12 3v9h9a9 9 0 11-9-9zM15 3.5A9 9 0 0120.5 9H15z',analise:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',imposto:'M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5zM10 8h4M10 12h4',conta:'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c1-4 4-6 8-6s7 2 8 6'};
/* ---------- Faixa de mercado no topo (ticker estilo terminal, TradingView) ---------- */
(function(){
const css=document.createElement('style');
css.textContent='#tape{position:fixed;top:0;left:0;right:0;z-index:40;background:#05070a;border-bottom:1px solid #1f6f3a;box-shadow:0 1px 10px rgba(31,111,58,.35);padding-top:env(safe-area-inset-top,0px)}#tapeSp{height:47px}#tape .tradingview-widget-container{height:46px;overflow:hidden}#tape .tradingview-widget-copyright{display:none}';
document.head.appendChild(css);
const P=a=>a.map(([s,d])=>({proName:s,title:d})),
cfg={symbols:P([['BMFBOVESPA:IBOV','IBOV'],['BMFBOVESPA:WIN1!','WIN'],['BMFBOVESPA:WDO1!','WDO'],['FX_IDC:USDBRL','USD/BRL'],['TVC:DXY','DXY'],['FOREXCOM:SPXUSD','S&P 500'],['FOREXCOM:NSXUSD','NASDAQ'],['FOREXCOM:DJI','DOW'],['INDEX:DEU40','DAX'],['TVC:NI225','NIKKEI'],['BITSTAMP:BTCUSD','BTC'],['BITSTAMP:ETHUSD','ETH'],['TVC:USOIL','WTI'],['TVC:UKOIL','BRENT'],['TVC:GOLD','OURO'],['TVC:SILVER','PRATA'],['COMEX:HG1!','COBRE'],['CBOT:ZS1!','SOJA'],['BMFBOVESPA:PETR4','PETR4'],['BMFBOVESPA:VALE3','VALE3'],['BMFBOVESPA:ITUB4','ITUB4'],['BMFBOVESPA:BBDC4','BBDC4'],['BMFBOVESPA:BBAS3','BBAS3'],['BMFBOVESPA:WEGE3','WEGE3'],['BMFBOVESPA:ABEV3','ABEV3'],['BMFBOVESPA:B3SA3','B3SA3']]),showSymbolLogo:true,colorTheme:'dark',isTransparent:true,largeChartUrl:'',displayMode:'regular',locale:'br'};
function mount(){
if(document.getElementById('tape'))return;
const t=document.createElement('div');t.id='tape';
const c=document.createElement('div');c.className='tradingview-widget-container';
c.innerHTML='<div class="tradingview-widget-container__widget"></div>';
const s=document.createElement('script');s.src='https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';s.async=true;s.innerHTML=JSON.stringify(cfg);
c.appendChild(s);t.appendChild(c);
const sp=document.createElement('div');sp.id='tapeSp';document.body.insertBefore(sp,document.body.firstChild);document.body.insertBefore(t,sp)}
if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
/* Faixa própria com rolagem automática (dados do screener); o widget do TradingView fica como reserva */
css.textContent+='#tape .mq{height:46px;overflow:hidden;display:flex;align-items:center;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}#tape .tr{display:flex;white-space:nowrap;animation:tpm var(--d,60s) linear infinite;will-change:transform}@keyframes tpm{to{transform:translateX(-50%)}}#tape .ti{display:flex;flex-direction:column;justify-content:center;gap:2px;padding:0 16px;border-right:1px solid #16202b;line-height:1.1;font-size:12px;color:#e5e7eb}#tape .ti b{font-size:13px}#tape .up{color:#22c55e}#tape .dn{color:#ef4444}';
const TS=[['^BVSP','IBOV'],['BRL=X','USD/BRL'],['DX-Y.NYB','DXY'],['^GSPC','S&P 500'],['^IXIC','NASDAQ'],['^DJI','DOW'],['BTC-USD','BTC'],['ETH-USD','ETH'],['CL=F','WTI'],['GC=F','OURO'],...['PETR4','VALE3','ITUB4','BBDC4','BBAS3','WEGE3','ABEV3','B3SA3','RENT3','SUZB3'].map(x=>[x,x])];
let TD={},TBUILT=0;
const tcell=([s,n])=>{const x=TD[s],c=+x.chg||0,u=c>=0;return `<span>${n} <span class="${u?'up':'dn'}">${u?'▲':'▼'}</span></span><span class="${u?'up':'dn'}">${f2(x.px)} <b>${u?'+':''}${f2(c)}%</b></span>`};
function tapeDraw(){const t=document.getElementById('tape');if(!t)return;const it=TS.filter(x=>TD[x[0]]);if(it.length<4)return;
if(TBUILT){t.querySelectorAll('.ti').forEach(e=>{const k=TS.find(x=>x[0]===e.dataset.s);if(k&&TD[k[0]])e.innerHTML=tcell(k)});return}
const h=it.map(k=>`<div class="ti" data-s="${k[0]}">${tcell(k)}</div>`).join(''),m=document.createElement('div');m.className='mq';
m.innerHTML=`<div class="tr" style="--d:${Math.max(30,it.length*4)}s">${h}${h}</div>`;
const w=t.querySelector('.tradingview-widget-container');if(w)w.style.display='none';t.appendChild(m);TBUILT=1}
async function tapeLoad(){if(document.hidden)return;try{const j=await scFetch(TS.map(x=>x[0]));(j.data||[]).forEach(x=>{if(x&&x.ok&&x.px!=null&&TS.some(k=>k[0]===x.s))TD[x.s]=x});tapeDraw()}catch(e){}}
setTimeout(tapeLoad,1200);setInterval(tapeLoad,60000)})();
/* ---------- Menu hambúrguer (substitui a barra de abas de baixo) ---------- */
(function(){
const css=document.createElement('style');
css.textContent='nav{display:none!important}#app{padding-bottom:calc(28px + env(safe-area-inset-bottom,0px))!important}#fab{bottom:calc(20px + env(safe-area-inset-bottom,0px))!important}#fabm{bottom:calc(86px + env(safe-area-inset-bottom,0px))!important}#mbtn{position:absolute;left:0;top:env(safe-area-inset-top,0px);width:46px;height:46px;display:flex;align-items:center;justify-content:center;background:#05070a;color:#e5e7eb;border:0;border-right:1px solid #1f6f3a;z-index:3;cursor:pointer;padding:0}#tape .tradingview-widget-container,#tape .mq{margin-left:46px}#mdr{position:fixed;left:0;top:0;right:0;bottom:0;z-index:90}#mdr .mbk{position:absolute;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.55)}#mdr .mpn{position:absolute;left:0;top:0;bottom:0;width:min(84vw,330px);background:var(--bg);color:var(--tx);border-right:1px solid var(--bd);overflow-y:auto;padding:calc(12px + env(safe-area-inset-top,0px)) 12px calc(16px + env(safe-area-inset-bottom,0px));animation:mdi .18s ease-out}@keyframes mdi{from{transform:translateX(-100%)}}#mdr .mhd{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}#mdr .mhd button{background:none;border:0;color:var(--tx);font-size:24px;padding:4px 8px}#mdr .ms{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);margin:14px 4px 6px}#mdr .mit{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:none;border:0;border-radius:12px;padding:10px;color:var(--tx);font:inherit;cursor:pointer}#mdr .mit small{display:block;color:var(--mut);font-size:12px}#mdr .mit.on{background:color-mix(in srgb,var(--ac) 18%,var(--bg))}#mdr .mi{width:28px;display:flex;justify-content:center;font-size:20px;flex:none}';
document.head.appendChild(css);
const A=[['home','🏠','Início','Resumo do dia'],['mercado','📰','Mercado','Agenda, notícias, cotações e alertas'],['live','⚡','Cotações ao vivo','Lista da ponte do Profit'],['juros','📚','Juros e DI','Selic, DI futuro e curva de juros'],['trades','📸','Day trade','Operações e fotos'],['swing','🌊','Swing','Posições e scanner'],['opc','🎯','Opções','Abertas e performance'],['dia','🌙','Meu dia','Antes e depois do mercado'],['stats','📊','Estatísticas','Resultados e feedback']],
B=[['regras','Regras','Seu plano escrito'],['graf','Gráficos','TradingView e níveis'],['painel','Painel','Mesa, metas e backup'],['rev','Revisão','Calendário do mês'],['estudos','Estudos','Livros e padrões de candles'],['ativos','Ativos','Margem, risco e lote'],['contratos','Contratos','Lotes pelo capital e volatilidade'],['carteiras','Carteiras','Brasil e EUA, evolução'],['analise','Análise IA','Relatório da carteira'],['imposto','Imposto de renda','Notas, custos e DARF'],['import','Importar','Relatório do Profit (CSV)'],['conta','Conta','Sincronização']];
const it=(k,i,t,d)=>`<button class="mit${tab===k?' on':''}" data-a="gotab" data-id="${k}"><span class="mi">${i}</span><span><b>${t}</b><small>${d}</small></span></button>`;
function mClose(){const m=document.getElementById('mdr');if(m)m.remove();document.body.style.overflow=T?'hidden':''}
function mOpen(){mClose();const m=document.createElement('div');m.id='mdr';
m.innerHTML=`<div class="mbk" data-m="x"></div><aside class="mpn"><div class="mhd"><b style="font-size:18px">Menu</b><button data-m="x" aria-label="Fechar">✕</button></div><div class="ms">Diário</div>${A.map(x=>it(...x)).join('')}<div class="ms">Ferramentas</div>${B.map(([k,t,d])=>it(k,IC(ICS[k]),t,d)).join('')}<div class="ms">Mais</div>${it('mais','⚙️','Aparência','Tema claro, escuro ou automático')}</aside>`;
document.body.appendChild(m);document.body.style.overflow='hidden'}
function put(){const t=document.getElementById('tape');if(!t){setTimeout(put,200);return}if(document.getElementById('mbtn'))return;
const b=document.createElement('button');b.id='mbtn';b.setAttribute('aria-label','Menu');b.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';t.appendChild(b)}
put();
document.addEventListener('click',e=>{if(e.target.closest('#mbtn')){mOpen();return}if(e.target.closest('#mdr [data-m="x"]')||e.target.closest('#mdr [data-a]'))mClose()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')mClose()})})();
/* ---------- Imposto de renda ---------- */
const IRC={D:['Day trade',.2,0],A:['Swing ações',.15,20000],O:['Swing ETF/BDR/futuros/opções',.15,0],F:['Swing FII',.2,0]};
function irVenc(m){const[y,mo]=m.split('-').map(Number),d=new Date(y,mo+1,0);while(d.getDay()%6===0)d.setDate(d.getDate()-1);return d.toLocaleDateString('pt-BR')}
function irCalc(){const ns=((S.ir||{}).notas||[]).slice().sort((a,b)=>a.d.localeCompare(b.d)),ms={},nu=x=>+x||0,tot={corr:0,emol:0,iss:0,out:0,bruto:0};
ns.forEach(n=>{const m=n.d.slice(0,7),o=ms[m]??={c:{},cost:0,bruto:0,irrf:0},c=o.c[n.m]??={bruto:0,cost:0,vendas:0},cs=nu(n.corr)+nu(n.emol)+nu(n.iss)+nu(n.out);c.bruto+=nu(n.bruto);c.cost+=cs;c.vendas+=nu(n.vendas);o.cost+=cs;o.bruto+=nu(n.bruto);o.irrf+=nu(n.irrf);['corr','emol','iss','out'].forEach(k=>tot[k]+=nu(n[k]));tot.bruto+=nu(n.bruto)});
const prej={D:0,A:0,O:0,F:0},out=[];let pool=0,carry=0;
Object.keys(ms).sort().forEach(m=>{const o=ms[m],rows=[];let imp=0;
for(const k of Object.keys(IRC)){const c=o.c[k];if(!c)continue;const liq=c.bruto-c.cost,[nm,al,ex]=IRC[k];let comp=0,base=0,tx=0,isento=false;
if(k==='A'&&c.vendas<=ex&&liq>=0)isento=true;else if(liq<0)prej[k]+=-liq;else{comp=Math.min(prej[k],liq);prej[k]-=comp;base=liq-comp;tx=base*al}
imp+=tx;rows.push({k,nm,liq,comp,base,tx,isento,vendas:c.vendas})}
const cred=pool+o.irrf,use=Math.min(cred,imp);pool=cred-use;const due=imp-use+carry;let darf=0;if(due>=10){darf=due;carry=0}else carry=due;
out.push({m,rows,cost:o.cost,bruto:o.bruto,irrf:o.irrf,imp,darf,carry,pool,prej:{...prej}})});
const all=sum(out.map(x=>x.cost)),yr=new Date().getFullYear()+'-',mm=loc().slice(0,7);
return{out,tot,all,ano:sum(out.filter(x=>x.m.startsWith(yr)).map(x=>x.cost)),mes:sum(out.filter(x=>x.m===mm).map(x=>x.cost))}}
function vImpostoAp(){const R=irCalc(),ns=((S.ir||{}).notas||[]).slice().sort((a,b)=>b.d.localeCompare(a.d)),fi=(i,l,t='number')=>`<label>${l}<input id="${i}" type="${t}" step="any" inputmode="decimal"></label>`,kc=(l,v,s)=>`<div class="card"><span class="mut sm">${l}</span><b>${v}</b><span class="mut sm">${s||''}</span></div>`,pct=R.tot.bruto>0?f2(R.all/R.tot.bruto*100)+'% do resultado bruto':'';
return `<p class="mut sm">Lance os valores de cada nota de corretagem. O app desconta os custos, separa day trade e swing, compensa prejuízos e calcula o DARF (código 6015).</p>
<h2>Custos operacionais</h2><div class="kv">${kc('Total gasto',money(R.all),pct)}${kc('No ano',money(R.ano))}${kc('No mês',money(R.mes))}</div><p class="sm mut">Corretagem ${money(R.tot.corr)} · Emolumentos/taxas ${money(R.tot.emol)} · ISS ${money(R.tot.iss)} · Outros ${money(R.tot.out)}</p>
<h2>Nova nota</h2><div class="card"><div class="g2">${fi('ir_d','Data','date')}<label>Mercado<select id="ir_m">${Object.entries(IRC).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('')}</select></label></div><div class="g2">${fi('ir_b','Resultado bruto (R$)')}${fi('ir_v','Total de vendas (só swing ações)')}</div><div class="g2">${fi('ir_c','Corretagem')}${fi('ir_e','Emolumentos + taxas')}</div><div class="g2">${fi('ir_i','ISS')}${fi('ir_o','Outros custos')}</div>${fi('ir_r','IRRF retido (R$)')}<button class="btn" data-a="irAdd" style="margin-top:10px">Adicionar nota</button></div>
<h2>Apuração mensal</h2>${R.out.length?R.out.slice().reverse().map(o=>`<div class="card"><div class="top"><b>${new Date(o.m+'-15').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</b><b class="${o.darf>0?'r':'g'}">DARF ${money(o.darf)}</b></div>${o.rows.map(r=>`<div class="sm" style="margin-top:6px"><b>${r.nm}</b>: líquido <b class="${r.liq>=0?'g':'r'}">${money(r.liq)}</b>${r.isento?' · <b class="g">isento (vendas ${money(r.vendas)} ≤ R$ 20 mil)</b>':r.liq<0?' · prejuízo a compensar':` · compensado ${money(r.comp)} · base ${money(r.base)} · imposto ${money(r.tx)}`}</div>`).join('')}<div class="sm mut" style="margin-top:6px">Custos do mês ${money(o.cost)} · IRRF ${money(o.irrf)}${o.darf>0?' · vence em '+irVenc(o.m)+' (sem feriados)':''}${o.carry>0?' · abaixo de R$ 10: soma ao mês seguinte':''}</div>${Object.values(o.prej).some(x=>x>0)?`<div class="sm mut">Prejuízo acumulado: ${Object.entries(o.prej).filter(([k,v])=>v>0).map(([k,v])=>IRC[k][0]+' '+money(v)).join(' · ')}</div>`:''}</div>`).join(''):'<p class="mut">Nenhuma nota lançada.</p>'}
<h2>Notas lançadas</h2>${ns.map(n=>`<div class="card"><div class="top"><span><b>${n.d.split('-').reverse().join('/')}</b> · ${IRC[n.m][0]}${n.src?' · 📥 importada':''}</span><button class="btn s" data-a="irDel" data-id="${n.id}">Excluir</button></div><div class="sm mut">Bruto ${money(+n.bruto||0)} · custos ${money((+n.corr||0)+(+n.emol||0)+(+n.iss||0)+(+n.out||0))} · IRRF ${money(+n.irrf||0)}</div>${n.av?`<div class="sm r">${esc(n.av)}</div>`:''}</div>`).join('')}
<p class="sm mut">Cálculo orientativo (15% swing, 20% day trade, FII 20%, isenção de R$ 20 mil só em ações no swing). Não cobre casos especiais nem feriados. Confirme com um contador de renda variável e guarde as notas.</p>`}
/* ---------- Importar nota de corretagem (PDF) ---------- */
const NT={notes:[],msg:'',busy:0,cart:1},
ntNum=s=>{const v=parseFloat(String(s).replace(/\./g,'').replace(',','.'));return isFinite(v)?v:0},
ntD=s=>{const m=String(s).match(/(\d{2})\/(\d{2})\/(\d{4})/);return m?m[3]+'-'+m[2]+'-'+m[1]:''},
ntNorm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim(),
NTETF=/^(BOVA|BOVV|SMAL|IVVB|HASH|GOLD|DIVO|FIND|MATB|ISUS|XINA|SPXI|NASD|ECOO|BBSD|B5P2|IMAB|IRFM|FIXA|GOVE|MILL|QBTC|ETHE|TECK|URET|WRLD|ACWI|DNAI|BRAX|PIBB|XFIX|QETH|SOLH|BITH|CHIP|JOGO|ESGB|BOVX)/,
NTUNIT=/^(TAEE|KLBN|SANB|BPAC|ALUP|SAPR|ENGI|SULA|BRBI|IGTI|TIET|AESB|RNEW|BIDI|BPAN|GETT)/,
ntOpt=o=>/OP[CÇ][AÃ]O/i.test(o.mkt||'')||/^[A-Z]{4}[A-X]\d{2,3}[A-Z]?$/.test(o.tk||''),
ntCat=o=>o.dt?'D':ntOpt(o)?'O':/11$/.test(o.tk)?(NTETF.test(o.tk)?'O':NTUNIT.test(o.tk)?'A':'F'):/(31|32|33|34|35|39)$/.test(o.tk)?'O':'A',
ntLines=(items,W)=>{const rows=[];items.filter(i=>i.str&&i.transform&&String(i.str).trim()).forEach(i=>{const x=i.transform[4],y=i.transform[5];let r=rows.find(r=>Math.abs(r.y-y)<2.5);if(!r)rows.push(r={y,it:[]});r.it.push({x,s:String(i.str).trim()})});rows.sort((a,b)=>b.y-a.y);
return rows.map(r=>{r.it.sort((a,b)=>a.x-b.x);return{full:r.it.map(i=>i.s).join(' '),R:r.it.filter(i=>i.x>=W*.5).map(i=>i.s).join(' ')}})},
ntParse=pages=>{const notes=[];let cur=null;
pages.forEach(pg=>{const L=ntLines(pg.items,pg.W),top=L.slice(0,14),hd=top.map(l=>l.full.match(/(\d{4,})\s+(\d{1,2})\s+(\d{2}\/\d{2}\/\d{4})/)).find(Boolean);
const d=hd?ntD(hd[3]):ntD((top.map(l=>l.full.match(/\d{2}\/\d{2}\/\d{4}/)).find(Boolean)||[''])[0]),nr=hd?hd[1]:'',fo=hd?+hd[2]:1;
if(!cur||fo===1||(nr&&nr!==cur.nr)||(d&&d!==cur.d)){const cx=top.map(l=>l.full).find(s=>/CTVM|DTVM|CORRETORA|\bS\.A\./i.test(s)&&!/NOTA DE/i.test(s))||'';cur={nr,d,corretora:/BTG/i.test(cx)?'BTG Pactual':cx.replace(/\s*(CTVM|DTVM).*$/i,'').replace(/\s*S\.A\.?.*$/i,'').trim()||'Corretora',ops:[],c:{},L:[]};notes.push(cur)}
cur.L.push(...L)});
notes.forEach(n=>{let sec='';const c={liq:0,reg:0,termo:0,ana:0,emol:0,transf:0,ccor:0,exe:0,exc:0,corr:0,iss:0,out:0,irrf:0,totcor:null,liquido:null,vliq:null};let got=0;
n.L.forEach(l=>{const t=l.full;
const m=t.match(/^\d+-[A-ZÀ-Ú]+(?:\s[A-ZÀ-Ú]+)?\s+([CV])\s+(.+?)\s+(\d[\d.]*)\s+([\d.]+,\d+)\s+([\d.]+,\d{2})\s+([DC])$/);
if(m){const toks=m[2].trim().split(/\s+/),ix=toks.findIndex(x=>/^[A-Z]{4}(\d{1,2}|[A-X]\d{2,3})[A-Z]?$/.test(x));if(ix>=0){let tk=toks[ix];if(/^[A-Z]{4}\d{1,2}F$/.test(tk))tk=tk.slice(0,-1);const rest=toks.slice(ix+1),last=rest[rest.length-1]||'';n.ops.push({cv:m[1],mkt:toks.slice(0,ix).join(' ').trim(),tk,qty:ntNum(m[3]),px:ntNum(m[4]),val:ntNum(m[5]),dc:m[6],dt:/^[A-Z#2-9]$/.test(last)&&/D/.test(last)||rest.some(x=>x==='D')});got++}return}
const r=l.R.trim();if(!r)return;
if(/^clearing$/i.test(r)){sec='clr';return}if(/^bolsa$/i.test(r)){sec='bol';return}if(/^deposit.ria$/i.test(r)){sec='dep';return}if(/^corretagem\s*\/\s*despesas$/i.test(r)){sec='cor';return}
const mm=r.match(/(-?[\d.]+,\d{2})\s*([DC])?\s*$/);if(!mm)return;const v=ntNum(mm[1]),lb=ntNorm(r.slice(0,mm.index));
if(/^valor liquido das operacoes/.test(lb))c.vliq=v;else if(/^taxa de liquidacao/.test(lb))c.liq+=v;else if(/^taxa de registro/.test(lb))c.reg+=v;else if(/^taxa de termo/.test(lb))c.termo+=v;else if(/^taxa a\.?n\.?a/.test(lb))c.ana+=v;else if(/^emolumentos/.test(lb))c.emol+=v;else if(/^taxa de transfer/.test(lb))c.transf+=v;
else if(/^total corretagem/.test(lb))c.totcor=v;else if(/^liquido para/.test(lb))c.liquido=mm[2]==='C'?v:-v;
else if(sec==='cor'){if(/^clearing/.test(lb))c.ccor+=v;else if(/^execucao casa/.test(lb))c.exc+=v;else if(/^execucao/.test(lb))c.exe+=v;else if(/^corretagem/.test(lb))c.corr+=v;else if(/^iss/.test(lb))c.iss+=v;else if(/^outras/.test(lb))c.out+=v;else if(/^i\.?r\.?r\.?f/.test(lb))c.irrf+=v}});
c.ok=got>0;n.c=c;n.vol=n.ops.reduce((a,o)=>a+o.val,0);delete n.L;
const r2=x=>Math.round(x*100)/100;n.cost={corr:r2(c.corr+c.exe+c.exc+c.ccor),emol:r2(c.liq+c.reg+c.termo+c.ana+c.emol+c.transf),iss:r2(c.iss),out:r2(c.out),irrf:r2(c.irrf)};
n.ops.forEach(o=>o.cat=ntCat(o));n.key=n.corretora+'|'+n.nr+'|'+n.d});
return notes.filter(n=>n.ops.length)};

let PDFJS=null;
async function ntLib(){if(PDFJS)return PDFJS;const U='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';await new Promise((ok,no)=>{const s=document.createElement('script');s.src=U+'pdf.min.js';s.onload=ok;s.onerror=()=>no(new Error('Sem internet para carregar o leitor de PDF.'));document.head.appendChild(s)});const L=window.pdfjsLib;try{const t=await(await fetch(U+'pdf.worker.min.js')).text();L.GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob([t],{type:'text/javascript'}))}catch(e){L.GlobalWorkerOptions.workerSrc=U+'pdf.worker.min.js'}return PDFJS=L}
async function ntRead(file){const L=await ntLib(),data=new Uint8Array(await file.arrayBuffer());let pw;for(let k=0;k<3;k++){try{const doc=await L.getDocument({data:data.slice(),password:pw}).promise,pg=[];for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i),tc=await p.getTextContent();pg.push({W:p.getViewport({scale:1}).width,items:tc.items})}return pg}catch(e){if(e&&e.name==='PasswordException'){pw=prompt(k?'Senha incorreta. Tente de novo:':'Este PDF tem senha. Normalmente são os 5 primeiros dígitos do CPF:');if(!pw)throw new Error('PDF protegido por senha.')}else throw e}}throw new Error('Senha incorreta.')}
function ntPm(tk,d){let q=0,c=0;((S.cart||{}).lanc||[]).filter(l=>l.mk==='BR'&&l.tk===tk&&l.tp!=='P'&&l.d<=d).sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0).forEach(l=>{const qq=+l.q||0,p=+l.p||0,cs=+l.cs||0;if(l.tp==='C'){q+=qq;c+=qq*p+cs}else{const pm=q>0?c/q:0,x=Math.min(qq,q);c-=pm*x;q-=x}});return q>1e-9?c/q:0}
function ntImport(){const ok=NT.notes.filter(n=>!n.dup&&n.d);if(!ok.length){NT.msg='Nenhuma nota nova para importar.';render();return}
const ir=(S.ir??={notas:[]}),cart=(S.cart??={lanc:[],px:{},snap:{}}),r2=x=>Math.round(x*100)/100,CL={F:'fii',O:'etf',A:'acao'};ir.imp??=[];ir.notas??=[];cart.lanc??=[];let nn=0,aw=0;
ok.sort((a,b)=>a.d.localeCompare(b.d)).forEach(n=>{const id=uid(),vol=n.vol||1,cs=n.cost,tot=cs.corr+cs.emol+cs.iss+cs.out,cats={};n.ops.forEach(o=>(cats[o.cat]??=[]).push(o));
const ks=Object.keys(cats),rem={corr:cs.corr,emol:cs.emol,iss:cs.iss,out:cs.out,irrf:cs.irrf};
ks.forEach((k,ix)=>{const ops=cats[k],v=sum(ops.map(o=>o.val)),last=ix===ks.length-1,pick=f=>{const x=last?rem[f]:r2(cs[f]*v/vol);rem[f]=r2(rem[f]-x);return x};let bruto=0,av='';
if(k==='D'){const T={};ops.forEach(o=>{const t=T[o.tk]??={qc:0,vc:0,qv:0,vv:0};if(o.cv==='C'){t.qc+=o.qty;t.vc+=o.val}else{t.qv+=o.qty;t.vv+=o.val}});Object.values(T).forEach(t=>{const q=Math.min(t.qc,t.qv);if(q>0)bruto+=q*(t.vv/t.qv)-q*(t.vc/t.qc)});if(Object.values(T).some(t=>t.qc!==t.qv))av='Day trade com quantidades de compra e venda diferentes: confira o resultado.'}
else if(ops.some(ntOpt))av='Opções: resultado bruto não calculado. Exclua e lance na mão, ou confira no fechamento da operação.';
else ops.forEach(o=>{if(o.cv==='V'){const pm=ntPm(o.tk,n.d);if(pm>0)bruto+=(o.px-pm)*o.qty;else av='Venda sem preço médio na Carteira: resultado bruto não calculado.'}
if(NT.cart&&!ntOpt(o))cart.lanc.push({id:uid(),mk:'BR',tp:o.cv,cl:CL[k]||'acao',tk:o.tk,d:n.d,q:o.qty,p:o.px,cs:r2(tot*o.val/vol),src:id})});
if(av)aw++;ir.notas.push({id:uid(),d:n.d,m:k,bruto:r2(bruto),vendas:r2(sum(ops.filter(o=>o.cv==='V').map(o=>o.val))),corr:pick('corr'),emol:pick('emol'),iss:pick('iss'),out:pick('out'),irrf:pick('irrf'),src:id,av})});
const c=n.c;ir.imp.push({id,key:n.key,corretora:n.corretora,nr:n.nr,d:n.d,vol:r2(n.vol),liquido:c.liquido,det:{corr:r2(c.corr),exe:r2(c.exe+c.exc),ccor:r2(c.ccor),liq:r2(c.liq),reg:r2(c.reg),termo:r2(c.termo),ana:r2(c.ana),emol:r2(c.emol),transf:r2(c.transf),iss:r2(c.iss),out:r2(c.out)},cost:{...cs},ops:n.ops.map(o=>({cv:o.cv,tk:o.tk,qty:o.qty,px:o.px,val:o.val,cat:o.cat}))});nn++});
save();NT.notes=[];NT.msg=nn+' nota(s) importada(s)'+(aw?' · '+aw+' lançamento(s) com aviso na aba Apuração.':'.');VW.IR='im';render()}
function ntDel(id){const ir=S.ir||{};ir.imp=(ir.imp||[]).filter(x=>x.id!==id);ir.notas=(ir.notas||[]).filter(x=>x.src!==id);if(S.cart)S.cart.lanc=(S.cart.lanc||[]).filter(x=>x.src!==id);save();render()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;if(a==='ntok')ntImport();else if(a==='ntclr'){NT.notes=[];NT.msg='';render()}else if(a==='ntdel'){if(confirm('Excluir esta nota importada? Os lançamentos de imposto e da Carteira gerados por ela também saem.'))ntDel(b.dataset.id)}});
document.addEventListener('change',async e=>{const f=e.target;if(f.id==='ntf'&&f.files&&f.files.length){NT.busy=1;NT.msg='Lendo '+f.files.length+' arquivo(s)…';NT.notes=[];render();const out=[],er=[],imp=(S.ir||{}).imp||[];for(const file of Array.from(f.files)){try{const ns=ntParse(await ntRead(file));if(!ns.length)er.push(file.name+': não achei operações da Bovespa (notas de futuros ainda não são lidas aqui).');out.push(...ns)}catch(x){er.push(file.name+': '+(x.message||'não consegui ler.'))}}out.forEach(n=>n.dup=imp.some(i=>i.key===n.key));NT.notes=out;NT.msg=er.join(' · ');NT.busy=0;VW.IR='im';render()}
else if(f.dataset&&f.dataset.ntc!==undefined){const[i,j]=f.dataset.ntc.split(':');if(NT.notes[i]&&NT.notes[i].ops[j]){NT.notes[i].ops[j].cat=f.value;render()}}else if(f.id==='ntcart')NT.cart=f.checked?1:0});
const irSeg=v=>`<div class="seg">${[['ap','🧾 Apuração'],['im','📥 Importar'],['cu','💸 Custos']].map(([k,l])=>`<button class="${k===v?'on':''}" data-a="vw" data-tp="IR" data-id="${k}">${l}</button>`).join('')}</div>`,
ntBar=(l,v,t)=>{const p=t>0?v/t*100:0;return `<div class="sm" style="margin-top:8px">${l} · ${f2(p)}% · ${money(v)}</div><div style="height:8px;border-radius:4px;background:var(--bd)"><div style="width:${p}%;height:8px;border-radius:4px;background:var(--ac)"></div></div>`},
ntKv=(l,v,s)=>`<div class="card"><span class="mut sm">${l}</span><b>${v}</b><span class="mut sm">${s||''}</span></div>`,ntFd=d=>d?d.split('-').reverse().join('/'):'sem data';
function vImpNotas(){const P=NT.notes,imp=((S.ir||{}).imp||[]).slice().sort((a,b)=>b.d.localeCompare(a.d)),sel=(i,j,v)=>`<select data-ntc="${i}:${j}" style="margin-top:4px">${Object.entries(IRC).map(([k,x])=>`<option value="${k}"${k===v?' selected':''}>${x[0]}</option>`).join('')}</select>`,nov=P.filter(n=>!n.dup&&n.d).length;
return `<div class="card"><b>📄 Importar nota de corretagem</b><div class="sm mut" style="margin-top:4px">Escolha o PDF da nota (pode ser mais de uma). O app lê as operações e as taxas, separa por tipo, calcula o resultado e lança na apuração, nos custos e na Carteira. Lê notas da Bovespa (ações, FIIs, ETFs). O PDF é lido no seu aparelho e nome e CPF da nota não são guardados. Precisa de internet para abrir o leitor de PDF.</div><label class="btn" style="margin-top:8px;display:block;text-align:center">${NT.busy?'Lendo…':'Escolher PDF(s)'}<input id="ntf" type="file" accept="application/pdf,.pdf" multiple hidden></label>${NT.msg?`<div class="sm ${P.length||NT.busy||/importada/.test(NT.msg)?'mut':'r'}" style="margin-top:6px">${esc(NT.msg)}</div>`:''}</div>
${P.length?`<h2>Conferir antes de importar</h2>${P.map((n,i)=>{const c=n.cost,tc=c.corr+c.emol+c.iss+c.out;return `<div class="card"><div class="top"><b>${esc(n.corretora)} · nota ${esc(n.nr||'–')}</b><span class="sm">${ntFd(n.d)}</span></div>${n.dup?'<div class="warn" style="margin:6px 0">Esta nota já foi importada e será ignorada.</div>':''}${n.d?'':'<div class="warn" style="margin:6px 0">Não achei a data do pregão: esta nota não será importada.</div>'}${n.ops.map((o,j)=>`<div class="sm" style="margin-top:8px"><b class="${o.cv==='C'?'g':'r'}">${o.cv==='C'?'Compra':'Venda'}</b> ${esc(o.tk)} · ${o.qty} × ${f2(o.px)} = ${money(o.val)}${o.dt?' · day trade':''}</div>${sel(i,j,o.cat)}`).join('')}<div class="sm mut" style="margin-top:8px">Corretagem ${money(c.corr)} · Taxas B3 ${money(c.emol)} · ISS ${money(c.iss)} · Outros ${money(c.out)} · IRRF ${money(c.irrf)}</div><div class="sm"><b>Custos da nota: ${money(tc)}</b>${n.c.liquido==null?'':' · líquido '+money(Math.abs(n.c.liquido))+(n.c.liquido<0?' (a pagar)':' (a receber)')}</div></div>`}).join('')}
<label style="display:flex;gap:8px;align-items:flex-start;margin:10px 0"><input id="ntcart" type="checkbox"${NT.cart?' checked':''} style="width:auto;margin-top:3px"><span class="sm">Lançar compras e vendas na aba Carteiras (calcula o preço médio e o resultado das vendas; day trade e opções não entram)</span></label><div class="g2"><button class="btn" data-a="ntok"${nov?'':' disabled'}>Importar ${nov} nota(s)</button><button class="btn s" data-a="ntclr">Descartar</button></div>`:''}
<h2>Notas importadas (${imp.length})</h2>${imp.length?imp.map(i=>{const c=i.cost;return `<div class="card"><div class="top"><span><b>${ntFd(i.d)}</b> · ${esc(i.corretora)} · nota ${esc(i.nr||'–')}</span><button class="btn s" data-a="ntdel" data-id="${i.id}">Excluir</button></div><div class="sm mut">${i.ops.map(o=>(o.cv==='C'?'C ':'V ')+o.tk+' '+o.qty).join(' · ')}</div><div class="sm mut">Volume ${money(i.vol)} · custos ${money(c.corr+c.emol+c.iss+c.out)}</div></div>`}).join(''):'<p class="mut">Nenhuma nota importada ainda.</p>'}`}
function vImpCustos(){const R=irCalc(),S0=S.ir||{},imp=S0.imp||[],ns=S0.notas||[],nu=x=>+x||0,t=R.tot,tc=t.corr+t.emol+t.iss+t.out,D={},mon={},mv={},tp={};
imp.forEach(i=>{for(const k in i.det)D[k]=(D[k]||0)+nu(i.det[k]);mv[i.d.slice(0,7)]=(mv[i.d.slice(0,7)]||0)+nu(i.vol)});
ns.forEach(n=>{const m=n.d.slice(0,7),c=nu(n.corr)+nu(n.emol)+nu(n.iss)+nu(n.out);mon[m]=(mon[m]||0)+c;tp[n.m]=(tp[n.m]||0)+c});
const irrf=sum(ns.map(n=>nu(n.irrf))),vol=sum(imp.map(i=>nu(i.vol))),nop=sum(imp.map(i=>i.ops.length)),
det=[['Corretagem',(D.corr||0)],['Execução',(D.exe||0)],['Clearing da corretora',(D.ccor||0)],['Taxa de liquidação',(D.liq||0)],['Taxa de registro',(D.reg||0)],['Emolumentos',(D.emol||0)],['Taxa A.N.A.',(D.ana||0)],['Taxa de termo/opções',(D.termo||0)],['Transferência de ativos',(D.transf||0)],['ISS',(D.iss||0)],['Outras despesas',(D.out||0)]].filter(x=>x[1]>0);
return `<div class="kv">${ntKv('Total gasto',money(R.all),vol>0?f2(sum(imp.map(i=>i.cost.corr+i.cost.emol+i.cost.iss+i.cost.out))/vol*100)+'% do volume importado':'')}${ntKv('No ano',money(R.ano))}${ntKv('No mês',money(R.mes))}</div>
${nop?`<p class="sm mut">Custo médio por operação importada: ${money(sum(imp.map(i=>i.cost.corr+i.cost.emol+i.cost.iss+i.cost.out))/nop)} · ${nop} operação(ões) · volume ${money(vol)}</p>`:''}
<h2>Para onde vai o dinheiro</h2>${tc>0?ntBar('Corretagem',t.corr,tc)+ntBar('Taxas B3 (liquidação, registro, emolumentos)',t.emol,tc)+ntBar('ISS',t.iss,tc)+ntBar('Outros',t.out,tc):'<p class="mut">Sem custos lançados.</p>'}
<h2>Detalhe das taxas</h2>${det.length?det.map(([l,v])=>`<div class="top sm" style="margin-top:6px"><span>${l}</span><b>${money(v)}</b></div>`).join(''):'<p class="mut sm">O detalhe aparece para as notas importadas por PDF.</p>'}
<h2>Por tipo de operação</h2>${Object.keys(tp).length?Object.entries(tp).sort((a,b)=>b[1]-a[1]).map(([k,v])=>ntBar(IRC[k]?IRC[k][0]:k,v,tc)).join(''):'<p class="mut">–</p>'}
<h2>Por mês</h2>${Object.keys(mon).length?Object.keys(mon).sort().reverse().map(m=>`<div class="card"><div class="top"><b>${new Date(m+'-15').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</b><b>${money(mon[m])}</b></div><div class="sm mut">${mv[m]?'Volume '+money(mv[m])+' · '+f2(mon[m]/mv[m]*100)+'% do volume':'Lançado na mão'}</div></div>`).join(''):'<p class="mut">–</p>'}
<p class="sm mut" style="margin-top:10px">IRRF retido (não é custo, abate o imposto): ${money(irrf)}</p>`}
function vImposto(){const v=VW.IR||'ap';return '<h1>Imposto de renda</h1>'+irSeg(v)+(v==='im'?vImpNotas():v==='cu'?vImpCustos():vImpostoAp())}

/* ---------- Carteiras ---------- */
const CCL={acao:'Ações',etf:'ETFs',fii:'FII/REIT',tesouro:'Tesouro',rf:'Renda fixa',outro:'Outros'},usdf=n=>(+n).toLocaleString('en-US',{style:'currency',currency:'USD'}),cmo=(mk,n)=>mk==='US'?usdf(n):money(n);
function carCalc(){const L=((S.cart||{}).lanc||[]).slice().sort((a,b)=>a.d.localeCompare(b.d)),P={},prov={BR:0,US:0},real={BR:0,US:0},px=(S.cart||{}).px||{};
L.forEach(l=>{const mk=l.mk,k=mk+':'+l.tk,q=+l.q||0,p=+l.p||0,cs=+l.cs||0;if(l.tp==='P'){prov[mk]+=p*(q||1)-cs;return}const o=P[k]??={mk,tk:l.tk,cl:l.cl,q:0,c:0};o.cl=l.cl;if(l.tp==='C'){o.q+=q;o.c+=q*p+cs}else{const pm=o.q>0?o.c/o.q:0,qq=Math.min(q,o.q);real[mk]+=qq*p-cs-pm*qq;o.c-=pm*qq;o.q-=qq}});
const pos=Object.values(P).filter(o=>o.q>1e-9).map(o=>{const pr=+(px[o.mk+':'+o.tk]||{}).p||0,pa=pr||o.c/o.q,v=o.q*pa;return{...o,pm:o.c/o.q,pa,tem:!!pr,v,lu:v-o.c,pc:o.c>0?(v-o.c)/o.c*100:0}}).sort((a,b)=>b.v-a.v);
const T=mk=>{const a=pos.filter(o=>o.mk===mk);return{v:sum(a.map(o=>o.v)),c:sum(a.map(o=>o.c)),pos:a,prov:prov[mk],real:real[mk]}};return{BR:T('BR'),US:T('US')}}
function carSnap(){const C=carCalc(),td=loc().slice(0,10),c=(S.cart??={lanc:[],px:{},snap:{}}),sn=(c.snap??={}),r=x=>+x.toFixed(2),n={BR:{v:r(C.BR.v),c:r(C.BR.c)},US:{v:r(C.US.v),c:r(C.US.c)}};if(C.BR.v+C.US.v>0&&JSON.stringify(sn[td])!==JSON.stringify(n)){sn[td]=n;save()}return C}
function carChart(mk){const sn=((S.cart||{}).snap)||{},ks=Object.keys(sn).filter(k=>sn[k][mk]&&sn[k][mk].v>0).sort();if(ks.length<2)return `<p class="mut sm">O gráfico de evolução se forma com o uso: o app grava um ponto por dia em que você abre esta aba (falta ${2-ks.length}).</p>`;
const V=ks.map(k=>sn[k][mk].v),Q=ks.map(k=>sn[k][mk].c),al=V.concat(Q),mn=Math.min(...al),mx=Math.max(...al),W=320,H=140,X=i=>8+i*(W-16)/(ks.length-1),Y=v=>H-10-(v-mn)/((mx-mn)||1)*(H-24),pt=a=>a.map((v,i)=>X(i).toFixed(1)+','+Y(v).toFixed(1)).join(' '),fd=k=>k.split('-').reverse().join('/');
return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto"><polyline points="${pt(Q)}" fill="none" stroke="#8a93a3" stroke-width="1.5" stroke-dasharray="4 3"/><polyline points="${pt(V)}" fill="none" stroke="var(--ac)" stroke-width="2.5" stroke-linejoin="round"/></svg><div class="sm mut top"><span>${fd(ks[0])}</span><span>linha cheia: patrimônio · tracejada: investido</span><span>${fd(ks[ks.length-1])}</span></div>`}
let CARMSG='';
async function carPrecos(){const c=cfg();if(!c){alert('Configure o Supabase em config.js para buscar preços.');return}
if(!SESS){alert('Entre na sua conta (Mais → Conta) para buscar preços.');return}
const C=carCalc(),br=C.BR.pos.map(o=>o.tk),us=C.US.pos.map(o=>o.tk);if(!br.length&&!us.length){alert('Lance uma posição primeiro.');return}
CARMSG='Buscando preços…';render();
try{await tok();const r=await fetch(c.url+'/functions/v1/precos',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify({br,us})});
if(r.status===401)throw new Error('Entre na sua conta de novo (Mais → Conta).')
const j=await r.json();if(!r.ok)throw new Error(j.erro||('Erro '+r.status));
const cc=(S.cart??={lanc:[],px:{},snap:{}}),td=loc().slice(0,10);let n=0;
for(const[mk,o]of[['BR',j.br||{}],['US',j.us||{}]])for(const t in o)if(o[t]>0){(cc.px??={})[mk+':'+t]={p:o[t],d:td};n++}
if(j.fx>0)cc.fx=j.fx;save();const er=j.erros||[];CARMSG=n+' preço(s) atualizado(s) às '+hm()+(er.length?'. Sem resposta: '+er.join(', ')+' (no plano gratuito, tente de novo em 1 minuto).':'.')}catch(e){CARMSG='Falha: '+em(e)}
render()}
function vCarteiras(){const C=carSnap(),mk=(S.ax||{})['cart.mk']||'BR',M=C[mk],fx=+((S.cart||{}).fx)||0,L=((S.cart||{}).lanc||[]).slice().sort((a,b)=>b.d.localeCompare(a.d)),res=M.v-M.c,fi=(i,l,t='number')=>`<label>${l}<input id="${i}" type="${t}" step="any" inputmode="decimal"></label>`,kc=(l,v,s,c)=>`<div class="card"><span class="mut sm">${l}</span><b${c?` class="${c}"`:''}>${v}</b><span class="mut sm">${s||''}</span></div>`,cls={};M.pos.forEach(o=>cls[o.cl]=(cls[o.cl]||0)+o.v);
return `<h1>Carteiras</h1><div class="g2"><button class="${mk==='BR'?'btn':'btn s'}" data-a="cmk" data-id="BR">🇧🇷 Brasil</button><button class="${mk==='US'?'btn':'btn s'}" data-a="cmk" data-id="US">🇺🇸 EUA (US$)</button></div>
<button class="btn s" data-a="carPx" style="margin-top:10px;width:100%">Atualizar preços</button><div class="sm mut" style="margin-top:4px">${esc(CARMSG)}</div>
<div class="kv" style="margin-top:12px">${kc('Patrimônio',cmo(mk,M.v),mk==='US'&&fx>0?'≈ '+money(M.v*fx):'')}${kc('Investido',cmo(mk,M.c))}${kc('Resultado',cmo(mk,res),f2(M.c>0?res/M.c*100:0)+'%',res>=0?'g':'r')}${kc('Proventos',cmo(mk,M.prov),'recebidos')}${kc('Lucro realizado',cmo(mk,M.real),'vendas',M.real>=0?'g':'r')}</div>
${mk==='US'?`<div class="card"><label>Dólar de hoje (R$) para converter<input type="number" step="any" inputmode="decimal" data-cfx="1" value="${fx||''}"></label></div>`:''}
<h2>Evolução</h2><div class="card">${carChart(mk)}</div>
<h2>Alocação por classe</h2>${M.v>0?Object.entries(cls).sort((a,b)=>b[1]-a[1]).map(([c,v])=>{const p=v/M.v*100;return `<div class="sm" style="margin-top:8px">${CCL[c]||c} · ${f2(p)}% · ${cmo(mk,v)}</div><div style="height:8px;border-radius:4px;background:var(--bd)"><div style="width:${p}%;height:8px;border-radius:4px;background:var(--ac)"></div></div>`}).join(''):'<p class="mut">Sem posições neste mercado.</p>'}
<h2>Posições</h2>${M.pos.map(o=>`<div class="card"><div class="top"><b>${esc(o.tk)} <span class="mut sm">${CCL[o.cl]||o.cl}</span></b><b class="${o.lu>=0?'g':'r'}">${cmo(mk,o.lu)} (${f2(o.pc)}%)</b></div><div class="sm mut" style="margin:4px 0">${f2(o.q)} un · PM ${cmo(mk,o.pm)} · valor ${cmo(mk,o.v)}${o.tem?'':' · sem preço atual (usando PM)'}</div><label>Preço atual<input type="number" step="any" inputmode="decimal" data-cpx="${esc(o.mk+':'+o.tk)}" value="${o.tem?o.pa:''}"></label></div>`).join('')||'<p class="mut">Nenhuma posição. Lance uma compra abaixo.</p>'}
<h2>Novo lançamento</h2><div class="card"><div class="g2"><label>Mercado<select id="c_mk"><option value="BR"${mk==='BR'?' selected':''}>Brasil</option><option value="US"${mk==='US'?' selected':''}>EUA</option></select></label><label>Tipo<select id="c_tp"><option value="C">Compra</option><option value="V">Venda</option><option value="P">Provento</option></select></label></div><div class="g2"><label>Classe<select id="c_cl">${Object.entries(CCL).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label>Ticker<input id="c_tk" type="text" autocapitalize="characters"></label></div><div class="g2">${fi('c_d','Data','date')}${fi('c_q','Quantidade')}</div><div class="g2">${fi('c_p','Preço unitário (provento: valor total)')}${fi('c_cs','Custos')}</div><button class="btn" data-a="carAdd" style="margin-top:10px">Adicionar</button></div>
<h2>Lançamentos</h2>${L.map(l=>`<div class="card"><div class="top"><span><b>${l.d.split('-').reverse().join('/')}</b> · ${{C:'Compra',V:'Venda',P:'Provento'}[l.tp]} ${esc(l.tk)} (${l.mk})</span><button class="btn s" data-a="carDel" data-id="${l.id}">Excluir</button></div><div class="sm mut">${+l.q||''} × ${cmo(l.mk,+l.p||0)}${+l.cs?' · custos '+cmo(l.mk,+l.cs):''}</div></div>`).join('')}
<p class="sm mut">Toque em “Atualizar preços” para buscar cotações (brapi no Brasil, Twelve Data nos EUA, com atraso). Você também pode digitar o preço manualmente, útil para Tesouro. O app grava um ponto por dia para o gráfico.</p>`}
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.cpx){const c=(S.cart??={lanc:[],px:{},snap:{}});(c.px??={})[t.dataset.cpx]={p:+t.value||0,d:loc().slice(0,10)};save();render()}else if(t.dataset.cfx){(S.cart??={lanc:[],px:{},snap:{}}).fx=+t.value||0;save();render()}});
/* Sanea os dados (locais ou vindos da nuvem) para que nenhuma tela quebre por campo ausente ou nulo */
function fixS(){const o=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};if(!S||typeof S!=='object')S={};
S.trades=(Array.isArray(S.trades)?S.trades:[]).filter(t=>t&&typeof t==='object').map(t=>{if(typeof t.dt!=='string'||!t.dt)t.dt=typeof t.dtx==='string'&&t.dtx?t.dtx:'2000-01-01T00:00';return t});
S.days=o(S.days);for(const k of Object.keys(S.days)){const v=S.days[k]=o(S.days[k]);if(!(v.chk&&typeof v.chk==='object'&&!Array.isArray(v.chk)))v.chk={}}
S.rules=(Array.isArray(S.rules)?S.rules:[]).filter(r=>r&&typeof r==='object');
['ax','rev','pn','del'].forEach(k=>{if(S[k]!=null&&(typeof S[k]!=='object'||Array.isArray(S[k])))S[k]={}});}
function render0(){fixS();const ap=$('#app');ap.style.animation='none';void ap.offsetWidth;ap.style.animation='';ap.innerHTML={home:vHome,mercado:()=>segM('mercado:'+MKT.tab)+vMercado(),juros:()=>segM('juros')+vJuros(),mais:vMais,trades:()=>segT('trades')+vTrades('D'),swing:()=>segT('swing')+vTrades('S'),opc:()=>segT('opc')+vTrades('O'),dia:()=>segD('dia')+vDia(),regras:()=>segD('regras')+vRegras(),stats:()=>segT('stats')+vStats(),graf:()=>segM('graf')+vGraf(),painel:vPainel,rev:()=>segT('rev')+vRev(),conta:vConta,live:()=>segM('live')+vLive(),estudos:vEstudos,livro:vLivro,ativos:()=>segT('ativos')+vAtivos(),contratos:vContratos,imposto:vImposto,carteiras:vCarteiras,analise:vAnalise,import:vImport,mesa:()=>vMesa(),carreira:()=>vCarreira()}[tab]();const GR={home:'home',trades:'trades',swing:'trades',opc:'trades',dia:'dia',stats:'stats'}[tab]||'mais';document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===GR));fillImgs();cnt();ppOut();ggOut();zzOut();animCount();applyQ();svUi();opPrev();if(!db)$('#app').insertAdjacentHTML('afterbegin','<div class="warn" style="margin-bottom:8px">Armazenamento do navegador indisponível: os dados não serão salvos ao fechar.</div>');bkBanner();fabVis();lvPaint();lvcPaint();if(tab==='live')lvPoll()}
function render(){try{render0()}catch(e){console.error(e);const ap=$('#app');if(ap)ap.innerHTML='<div class="warn" style="margin:12px 0"><b>Não consegui abrir esta tela ('+esc(tab)+').</b><div class="sm" style="margin-top:6px">'+esc(String(e&&e.message||e))+'</div><div class="sm mut" style="margin-top:6px">'+esc(String((e&&e.stack||'').split('\n')[1]||'').trim().slice(0,160))+'</div></div><div class="mut sm">Abra o menu (☰) e tente outra tela. Se o erro continuar, me mande esta mensagem.</div>'}}
document.addEventListener('click',async e=>{if(!e.target.closest('#fab,#fabm'))$('#fabm').style.display='none';const sg=e.target.closest('[data-seg]');if(sg&&T){T[sg.dataset.seg]=sg.dataset.v;if(sg.dataset.seg==='tipo')tipoMud();showSheet();return}const ds=e.target.closest('[data-dseg]');if(ds){const dd=(S.days[D]??={chk:{}});dd[ds.dataset.dseg]=ds.dataset.v;dd.u=Date.now();save();render();return}const im=e.target.closest('.pv img');if(im){zoom(im.src);return}const li=e.target.closest('#lb img');if(li){li.style.width=li.style.width==='260%'?'100%':'260%';return}const b=e.target.closest('[data-a],[data-tab]');if(!b)return;if(b.dataset.tab){tab=b.dataset.tab==='trades'?LT:b.dataset.tab;if(['trades','swing','opc'].includes(tab))LT=tab;render();scrollTo(0,0);return}const a=b.dataset.a,id=b.dataset.id;
if(a==='am'){AM=b.dataset.id;SY.msg='';render()}
else if(a==='auth')doAuth(AM)
else if(a==='savecfg'){const u=$('#cu').value.trim().replace(/\/$/,''),k=$('#ck').value.trim();if(!/^https:\/\/.+/.test(u)||k.length<20){SY.msg='Confira a URL (https://…) e a chave anon.';render();return}ls.set('diario-cfg',{url:u,key:k});SY.msg='';render()}
else if(a==='clrcfg'){ls.del('diario-cfg');render()}
else if(a==='syncnow')sync(1)
else if(a==='logout'){try{await rq('/auth/v1/logout',{method:'POST'})}catch(e){}SESS=null;ls.del('diario-sess');SY.msg='';render()}
else if(a==='newpw'){const p=$('#np').value;if(p.length<6){SY.msg='A senha precisa ter pelo menos 6 caracteres.';render();return}try{await rq('/auth/v1/user',{method:'PUT',tok:RECOV,headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p})},false);RECOV=null;SY.msg='Senha alterada. Agora é só entrar.'}catch(x){SY.msg=em(x)}render()}
else if(a==='enc'){AUTO=0;isNew=0;QM=1;T={...S.trades.find(x=>x.id===b.dataset.id),dtx:loc().slice(0,16)};orig={pin:T.pin,pout:T.pout,pplan:T.pplan};showSheet()}
else if(a==='xv'){XV[b.dataset.tp]=id;render();scrollTo(0,0)}
else if(a==='lvcf'){LVC.f=id;render()}
else if(a==='exd'){EXD[b.dataset.tp]=id;render()}
else if(a==='vw'){VW[b.dataset.tp]=b.dataset.id;render()}
else if(a==='carPx'){carPrecos()}else if(a==='cmk'){(S.ax??={})['cart.mk']=id;render()}else if(a==='carAdd'){const v=i=>(document.getElementById(i)||{}).value,n={id:uid(),mk:v('c_mk'),tp:v('c_tp'),cl:v('c_cl'),tk:(v('c_tk')||'').trim().toUpperCase(),d:v('c_d'),q:v('c_q'),p:v('c_p'),cs:v('c_cs')};if(!n.tk||!n.d||n.p===''||(n.tp!=='P'&&n.q===''))alert('Informe ticker, data, '+(n.tp==='P'?'valor':'quantidade e preço')+'.');else{(S.cart??={lanc:[],px:{},snap:{}}).lanc.push(n);save();render()}}else if(a==='carDel'){S.cart.lanc=S.cart.lanc.filter(x=>x.id!==id);save();render()}else if(a==='irAdd'){const v=i=>(document.getElementById(i)||{}).value,n={id:uid(),d:v('ir_d'),m:v('ir_m'),bruto:v('ir_b'),vendas:v('ir_v'),corr:v('ir_c'),emol:v('ir_e'),iss:v('ir_i'),out:v('ir_o'),irrf:v('ir_r')};if(!n.d||n.bruto==='')alert('Informe a data e o resultado bruto.');else{(S.ir??={notas:[]}).notas=(S.ir.notas||[]).concat(n);save();render()}}else if(a==='irDel'){S.ir.notas=S.ir.notas.filter(x=>x.id!==b.dataset.id);save();render()}else if(a==='cm'){CMX+=+b.dataset.id;render()}else if(a==='gopainel'){tab='painel';render();scrollTo(0,0)}
else if(a==='gotab'){tab=b.dataset.id;if(['trades','swing','opc'].includes(tab))LT=tab;render();scrollTo(0,0)}
else if(a==='fab'){const m=$('#fabm');m.style.display=m.style.display==='flex'?'none':'flex'}
else if(a==='flt'){LF.f=b.dataset.id;render()}
else if(a==='bar'){$('#chr-'+b.dataset.id).textContent=b.dataset.t}
else if(a==='theme'){ls.set('diario-theme',b.dataset.id);applyTheme();render()}
else if(a==='lbx'){$('#lb').style.display='none'}
else if(a==='new'){$('#fabm').style.display='none';if(!pBloq())return;AUTO=0;isNew=1;orig={};T={tipo:b.dataset.tp,id:uid(),dt:loc().slice(0,16),side:'C',qty:b.dataset.tp==='O'?100:1,...(b.dataset.tp==='O'?{ot:'C',estr:ESTR[0]}:{}),pv:1,cost:0,emo:'3',rules:'s',err:'Nenhum',mkt:MK[0]};showSheet()}
else if(a==='edit'){AUTO=0;isNew=0;T={...S.trades.find(x=>x.id===b.dataset.id)};orig={pin:T.pin,pout:T.pout,pplan:T.pplan};showSheet()}
else if(a==='close')closeSheet();
else if(a==='iadel')anxDel(id,b.dataset.w);
else if(a==='savetrade'){if(!String(T.ativo||'').trim()){const m=$('#msg');m.textContent='Informe o ativo (ex.: WINZ26).';m.scrollIntoView&&m.scrollIntoView({block:'center'});return}if(!+T.entry){$('#msg').textContent='Informe o preço de entrada.';return}if(!QM&&!+T.stop&&!confirm('Sem stop inicial não dá para calcular o risco (R). Salvar assim mesmo?'))return;if(QM&&isOpen(T)){$('#msg').textContent='Informe o preço de saída.';return}['pin','pout','pplan'].forEach(k=>{if(orig[k]&&orig[k]!==T[k])idb('img','delete',orig[k])});T.u=Date.now();const i=S.trades.findIndex(x=>x.id===T.id);i>=0?S.trades[i]=T:S.trades.push(T);save();closeSheet(1);render()}
else if(a==='deltrade'){if(!delArm){delArm=1;showSheet();return}['pin','pout','pplan'].forEach(k=>T[k]&&idb('img','delete',T[k]));S.trades=S.trades.filter(x=>x.id!==T.id);(S.del??={})[T.id]=Date.now();save();closeSheet(1);render()}
else if(a==='addrule'){const t=$('#rt').value.trim();if(!t)return;S.rules.push({id:uid(),cat:+$('#rc').value,t});save();render()}
else if(a==='delrule'){S.rules=S.rules.filter(r=>r.id!==b.dataset.id);(S.del??={})[b.dataset.id]=Date.now();save();render()}
else if(a==='chart'){OPEN[b.dataset.id]=!OPEN[b.dataset.id];render()}
else if(a==='addw'){const v=$('#wt').value.trim().toUpperCase();if(!v)return;S.watch??=[];if(!S.watch.includes(v))S.watch.push(v);save();render()}
else if(a==='delw'){S.watch=(S.watch||[]).filter(x=>x!==b.dataset.id);save();render()}
else if(a==='cprev'||a==='cnext'){const[y,m]=CM.split('-').map(Number);CM=ymd(new Date(y,m-1+(a==='cnext'?1:-1),1)).slice(0,7);render()}
else if(a==='cday'){D=b.dataset.id;tab='dia';render();scrollTo(0,0)}
else if(a==='bk'){await backup();$('#bm').textContent='Backup gerado.'}
else if(a==='csv')csv()});
document.addEventListener('input',e=>{const t=e.target;if(t.closest('#sh')&&t.name&&T){T[t.name]=t.value;if(t.name==='pv')AUTO=0;if(t.name==='ativo'){const u=t.value.toUpperCase(),v=u.startsWith('WIN')?0.2:u.startsWith('WDO')?10:0;if(v&&(!+T.pv||+T.pv===1||AUTO)){T.pv=v;AUTO=1;const i=$('#sh [name=pv]');if(i)i.value=v}}prev();return}
if(t.dataset.d){{const dd=(S.days[D]??={chk:{}});dd[t.dataset.d]=t.value;dd.u=Date.now();save();if(t.dataset.d==='nota'){const nv=$('#nv');if(nv)nv.textContent=t.value}}}
else if(t.dataset.rid){S.rules.find(x=>x.id===t.dataset.rid).t=t.value;save()}
else if(t.dataset.chk){{const dd=(S.days[D]??={chk:{}});dd.chk[t.dataset.chk]=t.checked;dd.u=Date.now();save();cnt()}}
else if(t.id==='dd'&&t.value){D=t.value;render()}
else if(t.id==='per'){PER=t.value;render()}
else if(t.id==='tp'){TIPO=t.value;render()}
else if(t.dataset.p){(S.prop??={})[t.dataset.p]=t.value;save();ppOut();zzOut()}
else if(t.dataset.g){(S.goals??={})[t.dataset.g]=t.value;save();ggOut()}
else if(t.dataset.z){Z[t.dataset.z]=t.value;zzOut()}
else if(t.dataset.rv){((S.rev??={})[rng(RP)[2]]??={})[t.dataset.rv]=t.value;save()}
else if(t.id==='rp'){RP=t.value;render()}
else if(t.id==='lq'){LF.q=t.value.toLowerCase();applyQ()}});
document.addEventListener('change',async e=>{const f=e.target;if(f.id==='bkf'&&f.files[0]){const m=await restore(f.files[0]);render();const x=$('#bm');if(x)x.textContent=m;return}if(f.type!=='file'||!f.files[0]||!T)return;const b=await shrink(f.files[0]);if(!b)return;const id=uid();M[id]=b;await idb('img','put',b,id);if(T[f.dataset.k]&&T[f.dataset.k]!==orig[f.dataset.k])idb('img','delete',T[f.dataset.k]);T[f.dataset.k]=id;showSheet()});
/* ===ANX-START=== */
/* ---------- Análise IA: Gemini (técnica, fundamentalista e foto) ---------- */
let ANX={mk:'BR',m:'tec',busy:'',msg:'',det:'',ok:'',res:{},img:null,tk:'',foco:'',sh:'both',pt:'classico',tkA:''},ANL=0;
const anxLoad=async()=>{if(ANL)return;ANL=1;const r=await idb('kv','get','anx');if(r&&typeof r==='object'){const lim=new Date(Date.now()-45*864e5).toISOString().slice(0,10);Object.keys(r).forEach(k=>{if(r[k]&&r[k].dia&&r[k].dia<lim)delete r[k]});ANX.res=r;if(tab==='analise')render()}};
const anxN=(x,d=2)=>x==null||x===''||!isFinite(+x)?'–':(+x).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const anxP=x=>anxN(x,Math.abs(+x)<1?4:2),anxPc=x=>x==null||!isFinite(+x)?'–':anxN(+x*100,1)+'%';
const anxBig=x=>x==null||!isFinite(+x)?'–':(+x).toLocaleString('pt-BR',{notation:'compact',maximumFractionDigits:1});
const anxV=v=>v==null||v===''?'':Array.isArray(v)?'<ul class="anx">'+v.map(x=>'<li>'+anxV(x)+'</li>').join('')+'</ul>':typeof v==='object'?Object.entries(v).map(([k,x])=>`<div class="anx"><b>${esc(k.replace(/_/g,' '))}:</b> ${anxV(x)}</div>`).join(''):`<span class="anx">${esc(v)}</span>`;
const anxSec=(t,v)=>{const h=anxV(v);return h?`<h3>${t}</h3>${h}`:''};
const anxVb=(t,c)=>t?`<span class="vb ${c}">${esc(t)}</span>`:'';
const anxVies=v=>{v=String(v||'').toUpperCase();return anxVb(v,v==='ALTA'?'g':v==='BAIXA'?'r':'n')};
const anxDisc='<p class="sm mut">Conteúdo gerado por IA a partir de dados de terceiros (com atraso) e pode conter erros. Não é recomendação de investimento.</p>';
const anxBar=(l,p,col)=>`<div class="sm" style="margin-top:8px">${esc(l)} · ${anxN(p,1)}%</div><div class="anxb"><i style="width:${Math.min(100,Math.abs(+p)||0)}%;background:${col||(p<0?'var(--r)':'var(--ac)')}"></i></div>`;
const anxArr=x=>Array.isArray(x)?x:[];
function anxItens(mk){const C=carCalc()[mk],tot=C.v||1;return C.pos.filter(o=>['acao','etf','fii'].includes(o.cl)).slice(0,12).map(o=>({tk:o.tk,mk,cl:o.cl,q:+(+o.q).toFixed(4),pm:+(+o.pm).toFixed(2),peso:+(o.v/tot*100).toFixed(1),lu:+(+o.pc).toFixed(2)}))}
async function anxCall(body){const c=cfg();if(!c)throw new Error('Configure o Supabase em config.js.');if(!SESS)throw new Error('Entre na sua conta (Mais → Conta).');await tok();const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),170000);
 try{const r=await fetch(c.url+'/functions/v1/analise',{method:'POST',signal:ac.signal,headers:{'Content-Type':'application/json',apikey:c.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify(body)});
  if(r.status===401)throw new Error('Entre na sua conta de novo (Mais → Conta).');
  if(r.status===404)throw new Error('A função "analise" ainda não foi publicada no Supabase (veja o README).');
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.erro||'Erro '+r.status)+(anxArr(j.erros).length?' — '+j.erros.join('; '):''));return j}
 catch(e){if(e&&e.name==='AbortError')throw new Error('Demorou demais. Tente de novo.');throw e}finally{clearTimeout(tm)}}
async function anxRun(k){if(ANX.busy)return;let mk=ANX.mk,body,key,sg='';const ta=(ANX.tkA||'').trim().toUpperCase();
 if(k==='pos'){const it=anxPosItens();if(!it.length){ANX.msg='Nenhuma posição aberta no diário (Day trade, Swing ou Opções).';render();return}body={modo:'posicoes',itens:it};key='pos';sg=it.map(x=>x.id).join(',')}
 else if(k==='img'){if(!ANX.img){ANX.msg='Escolha a foto do gráfico primeiro.';render();return}body={modo:'imagem',img:{mime:'image/jpeg',data:ANX.img.b64},foco:ANX.foco};const t=(ANX.tk||'').trim().toUpperCase();if(t){body.tk=t;body.mk=mk}key='img'}
 else if(ta){mk=scB3(ta)?'BR':'US';body={modo:k==='tec'?'tecnica':'fundamentalista',itens:[{tk:ta,mk,cl:'acao',q:0,pm:0,peso:100,lu:0}],avulso:true};key='tk:'+ta+':'+k}
 else{const it=anxItens(mk);if(!it.length){ANX.msg='Lance ações, ETFs ou FIIs na carteira deste mercado primeiro (Mais → Carteiras).';render();return}body={modo:k==='tec'?'tecnica':'fundamentalista',itens:it};key=mk+':'+k;sg=it.map(x=>x.tk).join(',')}
 if(k!=='img'&&ANX.res[key]&&ANX.res[key].dia===loc().slice(0,10)){if(!confirm('Já existe um relatório de hoje para isto. Gerar outro usa cota do Gemini. Continuar?'))return;body.force=true}
 ANX.busy=k;ANX.msg='';ANX.det='';ANX.ok='';render();
 try{const r=await anxCall(body);if(ta&&k!=='img'&&k!=='pos')r.unico=ta;r.dia=loc().slice(0,10);if(sg)r.sig=sg;ANX.res[key]=r;idb('kv','put',ANX.res,'anx')}catch(e){const m=em(e);ANX.msg=anxFriendly(m);ANX.det=anxDet(m)}
 ANX.busy='';render()}
const anxShrink=f=>new Promise((ok,no)=>{const i=new Image(),u=URL.createObjectURL(f);i.onload=()=>{const k=Math.min(1,1600/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0,c.width,c.height);const d=c.toDataURL('image/jpeg',.82);URL.revokeObjectURL(u);ok({b64:d.split(',')[1],url:d})};i.onerror=()=>{URL.revokeObjectURL(u);no(new Error('img'))};i.src=u});

/* gráfico de candles com pivôs diários (azul, contínuo) e semanais (âmbar, tracejado) */
function anxChart(a){const cs=anxArr(a.candles).slice(-45);if(cs.length<3)return '';
 const tp=ANX.pt,sh=ANX.sh,W=340,H=230,pl=4,pr=72,pt0=8,pb=18,hi=Math.max(...cs.map(c=>c[2])),lo=Math.min(...cs.map(c=>c[3])),pad=(hi-lo)*.3,L=[];
 [['d','diario','D','var(--ac)',''],['w','semanal','S','#e8a317','5 3']].forEach(([k,f,lb,col,da])=>{if(sh!=='both'&&sh!==k)return;const o=(a.pivos||{})[f];if(!o||!o[tp])return;Object.entries(o[tp]).forEach(([n,v])=>{if(v!=null&&isFinite(v)&&v>=lo-pad&&v<=hi+pad)L.push({v:+v,t:lb+' '+n,col,da})})});
 const px=+a.preco_atual,mn=Math.min(lo,...L.map(x=>x.v)),mx=Math.max(hi,...L.map(x=>x.v)),Y=v=>pt0+(mx-v)/((mx-mn)||1)*(H-pt0-pb),n=cs.length,st=(W-pl-pr)/n,X=i=>pl+st*(i+.5),bw=Math.max(1.5,st*.6),fd=d=>String(d).slice(8,10)+'/'+String(d).slice(5,7);
 let s=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="Gráfico de ${esc(a.tk)} com pivôs diários e semanais">`;
 cs.forEach((c,i)=>{const col=c[4]>=c[1]?'var(--g)':'var(--r)',x=X(i).toFixed(1);s+=`<line x1="${x}" x2="${x}" y1="${Y(c[2]).toFixed(1)}" y2="${Y(c[3]).toFixed(1)}" stroke="${col}" stroke-width="1"/><rect x="${(X(i)-bw/2).toFixed(1)}" y="${Y(Math.max(c[1],c[4])).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1,Math.abs(Y(c[1])-Y(c[4]))).toFixed(1)}" fill="${col}"/>`});
 let last=-99;L.sort((x,y)=>y.v-x.v).forEach(l=>{const y=Y(l.v),ly=Math.max(y,last+9);last=ly;s+=`<line x1="${pl}" x2="${W-pr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${l.col}" stroke-width="1"${l.da?` stroke-dasharray="${l.da}"`:''} opacity=".85"/><text x="${W-pr+3}" y="${(ly+3).toFixed(1)}" font-size="8.5" fill="${l.col}">${esc(l.t)} ${anxP(l.v)}</text>`});
 if(isFinite(px)&&px>=mn&&px<=mx)s+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(px).toFixed(1)}" y2="${Y(px).toFixed(1)}" stroke="var(--mut)" stroke-width="1" stroke-dasharray="1 2"/>`;
 s+=`<text x="${pl}" y="${H-4}" font-size="8" fill="var(--mut)">${esc(fd(cs[0][0]))}</text><text x="${W-pr}" y="${H-4}" font-size="8" text-anchor="end" fill="var(--mut)">${esc(fd(cs[n-1][0]))}</text></svg>`;
 return s+`<div class="sm mut">Linha azul: pivôs diários · tracejada âmbar: pivôs semanais · pontilhada: preço atual ${anxP(px)}</div>`}
function anxPivTab(a){const tp=ANX.pt,D=(a.pivos||{}).diario,Sm=(a.pivos||{}).semanal,ks=tp==='camarilla'?['R4','R3','R2','R1','S1','S2','S3','S4']:['R3','R2','R1','P','S1','S2','S3'],c=(o,k)=>o&&o[tp]&&o[tp][k]!=null?anxP(o[tp][k]):'–';
 return `<div class="anxt"><table><tr><th>Nível</th><th>Diário</th><th>Semanal</th></tr>${ks.map(k=>`<tr><td class="${k[0]==='R'?'r':k[0]==='S'?'g':''}">${k}</td><td>${c(D,k)}</td><td>${c(Sm,k)}</td></tr>`).join('')}</table></div><div class="sm mut">Diário: base ${esc(D?D.base:'sem dado')} · Semanal: base ${esc(Sm?Sm.base:'sem dado')}</div>`}
const anxTog=()=>`<div class="seg">${[['both','Diário + semanal'],['d','Só diário'],['w','Só semanal']].map(([v,l])=>`<button class="${ANX.sh===v?'on':''}" data-an="sh" data-v="${v}">${l}</button>`).join('')}</div><div class="seg">${[['classico','Clássico'],['fibonacci','Fibonacci'],['camarilla','Camarilla']].map(([v,l])=>`<button class="${ANX.pt===v?'on':''}" data-an="pt" data-v="${v}">${l}</button>`).join('')}</div>`;
const anxHead=(j,key)=>`<div class="top" style="margin-top:14px"><span class="mut sm">${esc(j.ia)} · ${esc(j.modelo)} · ${esc(new Date(j.gerado).toLocaleString('pt-BR'))}${j.cache?' · guardado':''}</span><button class="btn s" data-an="clr" data-v="${esc(key)}">Limpar</button></div>`;
const anxFoot=j=>(anxArr(j.avisos).length?`<div class="sm mut" style="margin-top:8px">ℹ️ ${j.avisos.map(esc).join(' · ')}</div>`:'')+(anxArr(j.erros).length?`<div class="warn" style="margin-top:8px">Sem dados para: ${j.erros.map(esc).join(' · ')}</div>`:'')+anxDisc;
const anxAiAtivos=R=>anxArr(R&&R.ativos);
const anxRaw=R=>R&&R.texto_bruto?`<div class="card"><div class="mut sm">A IA não devolveu o formato esperado. Texto original:</div><div class="anx">${esc(R.texto_bruto)}</div></div>`:'';

const anxTop=R=>R&&R.sumario_executivo?`<h2>Sumário executivo</h2><div class="card">${anxV(R.sumario_executivo)}</div>`:'';
const anxRiscos=v=>{v=anxArr(v);if(!v.length)return '';const g=(r,k)=>typeof r==='object'&&r?esc(r[k]||''):'';return `<h2>Matriz de riscos</h2><div class="card anxt"><table><tr><th>Risco</th><th>Tipo</th><th>Prob.</th><th>Impacto</th></tr>${v.map(r=>`<tr><td>${typeof r==='string'?esc(r):esc(r.risco||r.titulo||'')}${r&&r.gatilho?'<div class="sm mut">'+esc(r.gatilho)+'</div>':''}</td><td>${g(r,'tipo')}</td><td>${g(r,'probabilidade')}</td><td>${g(r,'impacto')}</td></tr>`).join('')}</table></div>`};
const anxRec=c=>{if(!c)return '';if(typeof c!=='object')return `<h2>Conclusão e recomendação</h2><div class="card">${anxV(c)}</div>`;const r=String(c.recomendacao||'').toUpperCase(),col=/COMPR|AUMENT/.test(r)?'g':/VEND|REDUZ/.test(r)?'r':'n',pa=c.preco_alvo,rest=Object.fromEntries(Object.entries(c).filter(([k])=>!['recomendacao','preco_alvo'].includes(k)));return `<h2>Conclusão e recomendação</h2><div class="card"><div class="top"><span>${anxVb(r,col)}</span><span class="sm">${pa!=null&&pa!==''?'Preço-alvo: <b>'+esc(typeof pa==='number'?anxP(pa):pa)+'</b>':''}</span></div>${anxV(rest)}</div>`};
const anxBot=R=>R?(R.resultados_recentes?`<h2>Resultados recentes e notícias</h2><div class="card">${anxV(R.resultados_recentes)}</div>`:'')+anxRiscos(R.matriz_de_riscos)+anxRec(R.conclusao):'';
/* PDF do relatório: tela dentro do app; o PDF é gerado no aparelho e enviado para "Salvar em Arquivos" (sem imprimir, sem trocar de página) */
let PDFB=null;
const pdfLib=(nome,url,get)=>{const g=get();if(g)return Promise.resolve(g);return new Promise((ok,no)=>{const s=document.createElement('script');s.src=url;s.onload=()=>{const x=get();x?ok(x):no(new Error('Falha ao iniciar '+nome+'.'))};s.onerror=()=>no(new Error('Sem internet para carregar o gerador de PDF.'));document.head.appendChild(s)})};
function pdfBar(){if(!document.getElementById('pdfov'))return;const P=PDFB||{};document.getElementById('pdfbar').innerHTML=`<button data-pv="x" class="pvs">← Voltar</button>${P.blob?'<button data-pv="s">📤 Salvar / compartilhar</button>':`<button data-pv="g"${P.busy?' disabled':''}>${P.busy?'Gerando…':'📥 Gerar PDF'}</button>`}`;document.getElementById('pdfst').textContent=P.msg||''}
function pdfClose(pop){const o=document.getElementById('pdfov');if(o)o.remove();document.body.style.overflow='';PDFB=null;if(!pop&&history.state&&history.state.pdf)history.back()}
window.addEventListener('popstate',()=>{if(document.getElementById('pdfov'))pdfClose(1)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('pdfov'))pdfClose()});
function anxPdf(){const el=document.getElementById('anx_rep');if(!el)return;
 const ant=document.getElementById('pdfov');if(ant){ant.remove();PDFB=null}
 if(!document.getElementById('pdfcss')){const st=document.createElement('style');st.id='pdfcss';st.textContent='#pdfov{position:fixed;inset:0;z-index:99999;overflow:auto;-webkit-overflow-scrolling:touch;background:#fff;color:#111;--bg:#fff;--tx:#111;--mut:#667085;--bd:#d9dde3;--g:#0a8f4d;--r:#d03a3a;--ac:#2563eb}#pdfov .pvbar{position:sticky;top:0;z-index:2;display:flex;gap:8px;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 10px;background:#fff;border-bottom:1px solid #d9dde3}#pdfov .pvbar button{flex:1;padding:13px 10px;font-size:16px;font-weight:600;border-radius:10px;border:0;background:#2563eb;color:#fff}#pdfov .pvbar button.pvs{background:#eef1f6;color:#111;border:1px solid #d9dde3;flex:0 0 auto}#pdfov .pvbar button[disabled]{opacity:.6}#pdfst{padding:6px 14px 0;min-height:18px;font-size:13px;color:#667085}#pdfbody{max-width:820px;margin:0 auto;padding:14px 14px calc(30px + env(safe-area-inset-bottom,0px));background:#fff;color:#111}#pdfov .card{background:#fff!important;box-shadow:none}#pdfov svg{max-width:100%}';document.head.appendChild(st)}
 const c=el.cloneNode(true);c.querySelectorAll('button,.seg,input,label').forEach(x=>x.remove());
 const tk=(ANX.tkA||'').trim().toUpperCase(),tp=ANX.m==='tec'?'técnico':ANX.m==='fun'?'fundamentalista':ANX.m==='pos'?'das posições abertas':'do gráfico',alvo=ANX.m==='img'?'foto':ANX.m==='pos'?'posições':tk||'carteira '+ANX.mk,tt='Relatório '+tp+' · '+alvo;
 PDFB={tt,busy:0,blob:null,msg:'',name:['relatorio',ANX.m==='tec'?'tecnico':ANX.m==='fun'?'fundamentalista':ANX.m==='pos'?'posicoes':'grafico',ANX.m==='img'||ANX.m==='pos'?'':(tk||ANX.mk),loc().slice(0,10)].filter(Boolean).join('-')+'.pdf'};
 const o=document.createElement('div');o.id='pdfov';
 o.innerHTML=`<div class="pvbar" id="pdfbar"></div><div id="pdfst"></div><div id="pdfbody"><h1>${esc(tt)}</h1><div class="sm mut">Gerado em ${esc(new Date().toLocaleString('pt-BR'))}</div></div>`;
 o.addEventListener('click',e=>{const b=e.target.closest('[data-pv]');if(!b)return;const v=b.dataset.pv;if(v==='x')pdfClose();else if(v==='g')pdfGen();else if(v==='s')pdfShare()});
 document.body.appendChild(o);document.body.style.overflow='hidden';
 if(!(history.state&&history.state.pdf))history.pushState({pdf:1},'');
 const bd=o.querySelector('#pdfbody'),kids=[...c.children];
 for(let i=0;i<kids.length;i++){const k=kids[i];if(/^H[23]$/.test(k.tagName)&&kids[i+1]){const g=document.createElement('div');g.append(k,kids[i+1]);bd.append(g);i++}else bd.append(k)}
 const cs=getComputedStyle(o);bd.querySelectorAll('svg *').forEach(n=>{[...n.attributes].forEach(a=>{if(a.value.includes('var('))n.setAttribute(a.name,a.value.replace(/var\((--[\w-]+)\)/g,(m,v)=>cs.getPropertyValue(v).trim()||'#888'))})});
 o.scrollTop=0;pdfBar()}
async function pdfGen(){const P=PDFB;if(!P||P.busy)return;P.busy=1;P.msg='Preparando o PDF… pode levar alguns segundos.';pdfBar();
 try{const H=await pdfLib('html2canvas','https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',()=>window.html2canvas),J=await pdfLib('jsPDF','https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',()=>window.jspdf&&window.jspdf.jsPDF);
  const doc=new J({unit:'mm',format:'a4',orientation:'portrait',compress:true}),PW=210,PH=297,M=10,CW=PW-2*M,CH=PH-2*M,bl=[...document.getElementById('pdfbody').children];let y=M;
  for(let i=0;i<bl.length;i++){P.msg='Preparando o PDF… '+(i+1)+'/'+bl.length;const s0=document.getElementById('pdfst');if(s0&&PDFB===P)s0.textContent=P.msg;
   const cv=await H(bl[i],{scale:1.6,backgroundColor:'#ffffff',useCORS:true,logging:false});if(!cv.width||!cv.height)continue;
   const h=cv.height*CW/cv.width;
   if(h<=CH){if(y+h>PH-M){doc.addPage();y=M}doc.addImage(cv.toDataURL('image/jpeg',.9),'JPEG',M,y,CW,h);y+=h+2}
   else{if(y>M){doc.addPage();y=M}const sl=Math.floor(cv.width*CH/CW);for(let q=0;q<cv.height;q+=sl){const hh=Math.min(sl,cv.height-q),c2=document.createElement('canvas');c2.width=cv.width;c2.height=hh;const g=c2.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c2.width,hh);g.drawImage(cv,0,q,cv.width,hh,0,0,cv.width,hh);if(q>0){doc.addPage();y=M}const hm=hh*CW/cv.width;doc.addImage(c2.toDataURL('image/jpeg',.9),'JPEG',M,y,CW,hm);y=M+hm+2}}}
  P.blob=doc.output('blob');P.msg='PDF pronto. Toque em "Salvar / compartilhar" e escolha "Salvar em Arquivos".'}
 catch(e){P.msg='Não consegui gerar o PDF: '+(e&&e.message||e)}
 P.busy=0;if(PDFB===P)pdfBar()}
async function pdfShare(){const P=PDFB;if(!P||!P.blob)return;const f=new File([P.blob],P.name,{type:'application/pdf'});
 try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:P.tt});return}}catch(e){if(e&&e.name==='AbortError')return}
 if(/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)){P.msg='Este iOS não permite compartilhar arquivo daqui. Atualize o iOS ou abra o app pelo Safari.';pdfBar();return}
 const a=document.createElement('a');a.href=URL.createObjectURL(P.blob);a.download=P.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4e4);P.msg='Download iniciado.';pdfBar()}
function anxTec(j,key){const R=j.relatorio||{},A=anxArr(j.ativos),ai=t=>anxAiAtivos(R).find(x=>String(x.ticker||'').toUpperCase()===t)||{};
 let h=anxHead(j,key)+anxRaw(R)+anxTop(R)+(R.visao_geral?`<h2>Visão geral</h2><div class="card">${anxV(R.visao_geral)}</div>`:'');
 h+=`<h2>Painel técnico</h2><div class="card anxt"><table><tr><th>Ativo</th><th>Preço</th><th>Dia</th><th>RSI</th><th>vs SMA20</th><th>ATR%</th><th>Viés</th></tr>${A.map(a=>{const i=a.ind||{},v=String(ai(a.tk).vies||'').toUpperCase();return `<tr><td>${esc(a.tk)}</td><td>${anxP(a.preco_atual)}</td><td class="${cls(i.var_1d_pct)}">${anxN(i.var_1d_pct)}%</td><td>${anxN(i.rsi14,0)}</td><td class="${cls(i.dist_sma20_pct)}">${anxN(i.dist_sma20_pct,1)}%</td><td>${anxN(i.atr14_pct,1)}</td><td class="${v==='ALTA'?'g':v==='BAIXA'?'r':'mut'}">${esc(v||'–')}</td></tr>`}).join('')}</table></div>`;
 h+=`<h2>Gráficos e pivôs</h2>${anxTog()}`;
 A.forEach(a=>{const x=ai(a.tk),i=a.ind||{};h+=`<div class="card"><div class="top"><span><b>${esc(a.tk)}</b> <span class="mut sm">${a.moeda==='USD'?'US$':'R$'} ${anxP(a.preco_atual)}</span></span>${anxVies(x.vies)}</div>${anxV(x.resumo)}${anxChart(a)}${anxPivTab(a)}
 <div><span class="chip">RSI ${anxN(i.rsi14,0)}</span><span class="chip">SMA20 ${anxP(i.sma20)}</span><span class="chip">SMA50 ${anxP(i.sma50)}</span><span class="chip">ATR ${anxN(i.atr14_pct,1)}%</span><span class="chip">Volume ${anxN(i.volume_vs_media20,1)}× média</span></div>${anxArr(a.avisos).length?`<div class="sm mut" style="margin-top:6px">${a.avisos.map(esc).join(' · ')}</div>`:''}
 ${anxSec('Tendência',x.tendencia)}${anxSec('Pivôs diários',x.pivos_diarios)}${anxSec('Pivôs semanais',x.pivos_semanais)}${anxSec('Confluências',x.confluencias)}${anxSec('Indicadores',x.indicadores)}${anxSec('Força e volume',x.forca_e_volume)}${anxSec('Plano de trade',x.plano_de_trade)}${anxSec('Zonas de interesse (entrada e saída)',x.zonas_de_interesse)}${anxSec('Cenário de alta',x.cenario_alta)}${anxSec('Cenário de baixa',x.cenario_baixa)}</div>`});
 return h+anxBot(R)+(anxArr(R.alertas).length?`<h2>Alertas técnicos</h2><div class="card">${anxV(R.alertas)}</div>`:'')+anxFoot(j)}

function anxFun(j,key){const R=j.relatorio||{},A=anxArr(j.ativos),W={},ai=t=>anxAiAtivos(R).find(x=>String(x.ticker||'').toUpperCase()===t)||{};anxItens(ANX.mk).forEach(o=>W[o.tk]=o.peso);
 const sec={};A.forEach(a=>{const s=(a.fund&&a.fund.setor)||'Sem dado';sec[s]=(sec[s]||0)+(W[a.tk]||0)});
 let h=anxHead(j,key)+anxRaw(R)+anxTop(R)+(R.visao_geral?`<h2>Visão geral</h2><div class="card">${anxV(R.visao_geral)}</div>`:'');
 if(!j.unico)h+=`<h2>Concentração</h2><div class="card">${Object.entries(sec).sort((a,b)=>b[1]-a[1]).map(([s,p])=>anxBar(s,p)).join('')}<h3>Por ativo</h3>${A.slice().sort((a,b)=>(W[b.tk]||0)-(W[a.tk]||0)).map(a=>anxBar(a.tk,W[a.tk]||0,'var(--g)')).join('')}${R.concentracao?`<div style="margin-top:10px">${anxV(R.concentracao)}</div>`:''}</div>`;
 h+=`<h2>Painel fundamentalista</h2><div class="card anxt"><table><tr><th>Ativo</th><th>P/L</th><th>P/VP</th><th>ROE</th><th>Mrg. líq.</th><th>Dív/PL</th></tr>${A.map(a=>{const f=a.fund||{};return `<tr><td>${esc(a.tk)}</td><td>${anxN(f.pl,1)}</td><td>${anxN(f.p_vp,2)}</td><td>${anxPc(f.roe)}</td><td>${anxPc(f.margem_liquida)}</td><td>${f.divida_pl_pct==null?'–':anxN(f.divida_pl_pct,0)+'%'}</td></tr>`}).join('')}</table></div><div class="sm mut">Dados de brapi, Twelve Data e Yahoo Finance (fontes não oficiais). Dividend yield e dívida/PL podem vir em escalas diferentes entre ativos.</div>`;
 A.forEach(a=>{const f=a.fund||{},x=ai(a.tk),q=String(x.qualidade||'').toUpperCase(),v=String(x.valuation||'').toUpperCase(),m=(l,t)=>`<div>${l}<b>${t}</b></div>`,cp=f.analistas_compra_forte_e_compra||0,mt=f.analistas_manter||0,vd=f.analistas_venda_e_venda_forte||0,tt=cp+mt+vd,up=f.alvo_medio_analistas&&f.preco?(f.alvo_medio_analistas/f.preco-1)*100:null;
  h+=`<div class="card"><div class="top"><span><b>${esc(a.tk)}</b> <span class="mut sm">${esc(f.nome||'')}</span></span><span>${anxVb(q&&'Qualidade '+q,q==='ALTA'?'g':q==='BAIXA'?'r':'w')}${anxVb(v&&v,v==='BARATO'?'g':v==='CARO'?'r':v==='JUSTO'?'w':'n')}</span></div>
  <div class="sm mut">${esc(f.setor||'Setor sem dado')}${f.industria?' · '+esc(f.industria):''}${a.cobertura==='baixa'?' · <span class="r">cobertura de dados baixa</span>':''}</div>${anxV(x.resumo)}
  <div class="anxm">${m('P/L',anxN(f.pl,1))}${m('P/VP',anxN(f.p_vp,2))}${m('EV/EBITDA',anxN(f.ev_ebitda,1))}${m('ROE',anxPc(f.roe))}${m('Margem líq.',anxPc(f.margem_liquida))}${m('Dív/PL',f.divida_pl_pct==null?'–':anxN(f.divida_pl_pct,0)+'%')}${m('Cresc. receita',anxPc(f.crescimento_receita))}${m('Cresc. lucro',anxPc(f.crescimento_lucro))}${m('Valor de mercado',anxBig(f.valor_mercado))}${m('Dividend yield',f.dividend_yield==null?'–':anxN(+f.dividend_yield<1?f.dividend_yield*100:f.dividend_yield,1)+'%')}${m('Payout',anxPc(f.payout))}${m('Beta',anxN(f.beta,2))}</div>
  ${[['Margem bruta',f.margem_bruta],['Margem EBITDA',f.margem_ebitda],['Margem operacional',f.margem_operacional],['Margem líquida',f.margem_liquida]].filter(r=>r[1]!=null).map(r=>anxBar(r[0],r[1]*100)).join('')}
  ${tt?`<div class="sm" style="margin-top:10px">Consenso de analistas (${tt}): ${cp} compra · ${mt} manter · ${vd} venda${up!=null?` · alvo médio ${up>=0?'+':''}${anxN(up,1)}% vs preço`:''}</div><div class="anxb"><i style="width:${cp/tt*100}%;background:var(--g)"></i><i style="width:${mt/tt*100}%;background:#e8a317"></i><i style="width:${vd/tt*100}%;background:var(--r)"></i></div>`:''}
  ${anxSec('Pontos fortes',x.pontos_fortes)}${anxSec('Pontos de atenção',x.pontos_de_atencao)}${anxSec('Rentabilidade e margens',x.rentabilidade_e_margens)}${anxSec('Endividamento e caixa',x.endividamento_e_caixa)}${anxSec('Dividendos',x.dividendos)}${anxSec('Valuation',x.valuation_leitura)}${anxSec('Perspectivas de crescimento',x.perspectivas_de_crescimento)}${anxSec('Riscos e catalisadores',x.riscos_e_catalisadores)}</div>`});
 return h+anxBot(R)+(anxArr(R.alertas).length?`<h2>Alertas fundamentalistas</h2><div class="card">${anxV(R.alertas)}</div>`:'')+anxFoot(j)}

function anxImg(j,key){const R=j.relatorio||{};
 let h=anxHead(j,key)+anxRaw(R);
 h+=`<div class="card"><div class="top"><span><b>${esc(R.ativo_lido||'Ativo não identificado')}</b> <span class="mut sm">${esc(R.timeframe_lido||'')}</span></span>${anxVies(R.vies)}</div>${anxV(R.resumo)}${anxSec('Tendência',R.tendencia)}${anxSec('Estrutura',R.estrutura)}${anxSec('Suportes',R.suportes)}${anxSec('Resistências',R.resistencias)}${anxSec('Padrões',R.padroes)}${anxSec('Indicadores visíveis',R.indicadores_visiveis)}${anxSec('Cenário de alta',R.cenario_alta)}${anxSec('Cenário de baixa',R.cenario_baixa)}${anxSec('Limitações da leitura',R.limitacoes)}</div>`;
 const A=anxArr(j.ativos);if(A.length)h+=`<h2>Pivôs calculados</h2>${anxTog()}`+A.map(a=>`<div class="card"><b>${esc(a.tk)}</b>${anxChart(a)}${anxPivTab(a)}</div>`).join('');
 return h+anxFoot(j)}

function vAnalise(){anxLoad();const mk=ANX.mk,m=ANX.m,seg=(a,cur,arr)=>`<div class="seg wr">${arr.map(([v,l])=>`<button class="${v===cur?'on':''}" data-an="${a}" data-v="${v}">${l}</button>`).join('')}</div>`,
 el=carCalc()[mk].pos.filter(o=>['acao','etf','fii'].includes(o.cl)).length,ta=(ANX.tkA||'').trim().toUpperCase(),key=m==='img'?'img':m==='pos'?'pos':ta?'tk:'+ta+':'+m:mk+':'+m,R=ANX.res[key],b=ANX.busy===m;
 const run=lbl=>`<button class="btn" style="width:100%;margin-top:10px" data-an="run" data-v="${m}"${ANX.busy?' disabled':''}>${b?'Gerando… pode levar até 2 minutos':R?(R.dia===loc().slice(0,10)?'Gerar de novo (usa cota do Gemini)':'Atualizar relatório'):lbl}</button>`;
 let h=`<h1>Análise IA</h1>`+(!SESS?'<div class="warn" style="margin-bottom:8px">Entre na sua conta (Mais → Conta) para usar as análises.</div>':'')+seg('mk',mk,[['BR','🇧🇷 Brasil'],['US','🇺🇸 EUA']])+seg('m',m,[['tec','📈 Técnica'],['fun','🏦 Fundamentos'],['img','🖼️ Foto'],['pos','📌 Posições']]);
 if(m!=='img'&&m!=='pos')h+=`<div class="card"><label>Analisar um ativo específico<input id="anx_ta" autocapitalize="characters" autocomplete="off" placeholder="${mk==='BR'?'PETR4, VALE3…':'AAPL, MSFT…'}" value="${esc(ANX.tkA)}"></label><div class="sm mut" style="margin-top:6px">Digite um ticker (ex.: PETR4 ou AAPL) para analisar só esse ativo. Deixe vazio para analisar a carteira. O mercado (B3 ou EUA) é detectado pelo ticker.</div></div>`;
 if(m==='tec')h+=`<div class="card"><b>📈 Analista técnico sênior · Gemini</b><div class="sm mut">Só análise gráfica: tendência, pivôs <b>diários e semanais</b>, médias, RSI, ATR e volume. Cotações: ${mk==='BR'?'brapi (B3)':'Twelve Data (EUA)'}, com atraso. Não comenta fundamentos.</div><div class="sm mut" style="margin-top:6px">${ta?'Ativo avulso: '+esc(ta)+' ('+(scB3(ta)?'B3 via brapi':'EUA via Twelve Data')+')':el?el+' ativo(s) elegível(is)'+(el>12?' · analisando os 12 maiores':''):'Nenhuma ação, ETF ou FII lançado neste mercado.'}</div>${run('Gerar relatório técnico')}</div>`;
 else if(m==='fun')h+=`<div class="card"><b>🏦 Analista fundamentalista sênior · Gemini</b><div class="sm mut">Só fundamentos: rentabilidade, margens, endividamento, dividendos e valuation. Dados: brapi (B3), Twelve Data (EUA) e Yahoo Finance (fonte não oficial). Não comenta gráfico.</div><div class="sm mut" style="margin-top:6px">${ta?'Ativo avulso: '+esc(ta)+' ('+(scB3(ta)?'B3 via brapi':'EUA via Twelve Data')+')':el?el+' ativo(s) elegível(is)'+(el>12?' · analisando os 12 maiores':''):'Nenhuma ação, ETF ou FII lançado neste mercado.'}</div>${run('Gerar relatório fundamentalista')}</div>`;
 else if(m==='pos')h+=`<div class="card"><b>📌 Revisão das posições abertas · Gemini</b><div class="sm mut">Revisa seus trades em aberto (day trade, swing e opções): se o stop faz sentido pelo ATR e pelos pivôs, a distância até os alvos e os vencimentos. Usa cotações da brapi/Twelve Data quando o ativo existe lá; opções usam o subjacente.</div><div class="sm mut" style="margin-top:6px">${anxPosItens().length} posição(ões) aberta(s) no diário</div>${run('Revisar posições abertas')}</div>`;
 else h+=`<div class="card"><b>🖼️ Foto do gráfico · Gemini</b><div class="sm mut">Envie um print ou foto do gráfico e o analista técnico sênior lê tendência, níveis e padrões. Se informar o ticker, o app junta os pivôs calculados com dados reais.</div>
  <label class="btn s" style="margin-top:10px;color:var(--tx);text-align:center">${ANX.img?'Trocar foto':'Escolher foto do gráfico'}<input type="file" accept="image/*" hidden id="anx_f"></label>${ANX.img?`<div style="margin-top:8px"><img src="${ANX.img.url}" alt="Gráfico enviado" style="width:100%;border-radius:8px;border:1px solid var(--bd)"><button class="btn s" style="margin-top:6px" data-an="imgx">Remover foto</button></div>`:''}
  <div class="g2"><label>Ticker (opcional)<input id="anx_tk" autocapitalize="characters" placeholder="${mk==='BR'?'PETR4':'AAPL'}" value="${esc(ANX.tk)}"></label><label>Contexto (opcional)<input id="anx_foco" placeholder="ex.: gráfico semanal" maxlength="200" value="${esc(ANX.foco)}"></label></div>${run('Analisar foto')}</div>`;
 if(ANX.msg)h+=`<div class="warn" style="margin-top:8px">${esc(ANX.msg)}${ANX.det&&ANX.det!==ANX.msg?`<div class="sm mut" style="margin-top:4px">Detalhe técnico: ${esc(ANX.det)}</div>`:''}</div>`;
 if(ANX.ok)h+=`<div class="sm" style="margin-top:8px;color:var(--g)">${esc(ANX.ok)}</div>`;
 return h+(R?anxBadge(R,m,mk,ta)+`<button class="btn" style="width:100%;margin-top:10px" data-an="pdf">📄 Gerar PDF do relatório</button><div id="anx_rep">`+(m==='tec'?anxTec:m==='fun'?anxFun:m==='pos'?anxPos:anxImg)(R,key)+'</div>'+anxSaveBox(R,key,m):anxDisc)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-an]');if(!b)return;const a=b.dataset.an,v=b.dataset.v;
 if(a==='mk'){ANX.mk=v;ANX.msg='';render()}else if(a==='m'){ANX.m=v;ANX.msg='';render()}else if(a==='run')anxRun(v);else if(a==='sh'){ANX.sh=v;render()}else if(a==='pt'){ANX.pt=v;render()}
 else if(a==='pdf')anxPdf();else if(a==='imgx'){ANX.img=null;render()}else if(a==='clr'){delete ANX.res[v];idb('kv','put',ANX.res,'anx');render()}else if(a==='save')anxSave(v);else if(a==='savepos')anxSavePos()});
document.addEventListener('change',async e=>{const f=e.target;if(f.id!=='anx_f'||!f.files[0])return;try{ANX.img=await anxShrink(f.files[0]);ANX.msg=''}catch(x){ANX.msg='Não consegui ler essa imagem.'}f.value='';render()});
document.addEventListener('input',e=>{const t=e.target;if(t.id==='anx_tk')ANX.tk=t.value;else if(t.id==='anx_foco')ANX.foco=t.value;else if(t.id==='anx_ta')ANX.tkA=t.value.replace(/[^A-Za-z0-9.\-]/g,'')});
/* ---------- Ajustes de layout, relatórios guardados, posições, erros amigáveis ---------- */
function fabDisp(){return ['home','trades','swing','opc'].includes(tab)?'':'none'}
function fabVis(){const f=$('#fab');if(f&&!T)f.style.display=fabDisp();if(fabDisp()==='none'){const m=$('#fabm');if(m)m.style.display='none'}}
function tipoMud(){if(T.tipo==='O'){if(!T.ot)T.ot='C';if(!T.estr)T.estr=ESTR[0]}}
(function(){const c=document.createElement('style');c.textContent='#fab{width:46px!important;height:46px!important;min-width:0!important;padding:0!important;font-size:24px!important;line-height:46px!important;right:14px!important;bottom:calc(12px + env(safe-area-inset-bottom,0px))!important;opacity:.92}#fabm{right:14px!important;bottom:calc(66px + env(safe-area-inset-bottom,0px))!important}#app{padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))!important}.g2>*,.g3>*{min-width:0}input[type=date],input[type=datetime-local],input[type=time]{display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box;-webkit-appearance:none;appearance:none;min-height:42px;text-align:left}.seg{display:flex!important;gap:4px}.seg.wr{flex-wrap:wrap}.seg>button{flex:1 1 auto;min-width:0;white-space:nowrap;font-size:14px;padding-left:8px;padding-right:8px}details>summary{cursor:pointer}';document.head.appendChild(c)})();

/* erros da API em português claro */
function anxDet(m){m=String(m||'').replace(/\s+/g,' ').trim();return m.length>220?m.slice(0,220)+'…':m}
function anxFriendly(m){m=String(m||'');
 const R=[
 [/GEMINI_API_KEY n[ãa]o configurada/i,'A chave do Gemini ainda não foi cadastrada no Supabase (GEMINI_API_KEY).'],
 [/Gemini 429|RESOURCE_EXHAUSTED|quota|rate.?limit/i,'Sem cota do Gemini agora. Espere alguns minutos e tente de novo, ou troque para um modelo Flash (variáveis GEMINI_MODEL_TEC e GEMINI_MODEL_FUN no Supabase).'],
 [/Gemini 50[0234]|overloaded|UNAVAILABLE|high demand/i,'O Gemini está sobrecarregado neste momento. Tente de novo em instantes.'],
 [/Gemini 404|is not found|not supported for generateContent/i,'O modelo do Gemini configurado não foi encontrado. Confira o nome em GEMINI_MODEL no Supabase.'],
 [/Gemini 40[13]|API key|API_KEY_INVALID|PERMISSION_DENIED/i,'O Gemini recusou a chave de acesso. Confira GEMINI_API_KEY no Supabase.'],
 [/Gemini 400/i,'O Gemini não aceitou o pedido. Se for foto, tente uma imagem menor ou mais nítida.'],
 [/Gemini n[ãa]o devolveu/i,'O Gemini não devolveu resposta. Tente de novo.'],
 [/brapi 40[13]/i,'A brapi recusou o token. Confira BRAPI_TOKEN no Supabase.'],
 [/brapi 429/i,'Limite de consultas da brapi atingido. Espere um pouco e tente de novo.'],
 [/brapi 400|brapi sem hist/i,'A brapi não devolveu o histórico deste ativo (ticker inexistente ou histórico fora do plano grátis). Confira o ticker e tente de novo.'],
 [/brapi/i,'A brapi (cotações da B3) não respondeu. Tente de novo em instantes.'],
 [/Twelve Data.*(credit|limit|minute|run out)/i,'Limite da Twelve Data atingido (cotações dos EUA). Espere um minuto e tente de novo.'],
 [/Twelve Data/i,'A Twelve Data (cotações dos EUA) não devolveu dados deste ativo. Confira o ticker.'],
 [/Yahoo/i,'O Yahoo Finance (fundamentos) não respondeu. Tente de novo em instantes.'],
 [/hist[óo]rico curto/i,'Este ativo tem poucos candles para a análise técnica.']];
 for(const [re,t] of R)if(re.test(m))return t;return m}

/* posições abertas para a IA */
function anxPosItens(){return S.trades.filter(isOpen).sort((a,b)=>b.dt.localeCompare(a.dt)).slice(0,15).map(t=>{const sub=String(t.sub||'').trim().toUpperCase(),tk=sub||String(t.ativo||'').trim().toUpperCase(),mk=scB3(tk)?'BR':/^[A-Z]{1,5}$/.test(tk)?'US':'';return{id:t.id,ativo:String(t.ativo||'').toUpperCase(),tipo:t.tipo||'D',lado:t.side,entrada:+t.entry||null,stop:+t.stop||null,alvos:[t.target,t.target2,t.target3].map(x=>+x||null).filter(Boolean),qtd:+t.qty||null,dt:t.dt,...(t.tipo==='O'?{opcao:t.ot==='P'?'PUT':'CALL',strike:+t.strike||null,venc:t.venc||'',estrutura:t.estr||''}:{}),tk:mk?tk:'',mk}})}
const iaCol=s=>{s=String(s||'').toUpperCase();return /COMPR|ALTA|BARAT|AUMENT|NO ALVO/.test(s)?'g':/VEND|BAIXA|CARO|ENCERR|REDUZ|PERTO DO STOP|VENCENDO/.test(s)?'r':'n'};
function anxPos(j,key){const R=j.relatorio||{},P=anxArr(R.posicoes);
 let h=anxHead(j,key)+anxRaw(R)+anxTop(R);
 h+=P.length?'<h2>Posições</h2>'+P.map(p=>{const t=S.trades.find(x=>x.id===p.id);return `<div class="card"><div class="top"><span><b>${esc(p.ativo||(t&&t.ativo)||'')}</b>${t?` <span class="mut sm">${fdt(t.dt)}</span>`:''}</span><span>${anxVb(p.acao_sugerida,iaCol(p.acao_sugerida))}</span></div>${p.situacao?`<div class="sm mut" style="margin-top:4px">${esc(p.situacao)}</div>`:''}${anxSec('Stop',p.stop)}${anxSec('Alvos',p.alvos)}${anxSec('Vencimento',p.vencimento)}${p.novo_stop?anxSec('Novo stop sugerido',p.novo_stop):''}${anxSec('Justificativa',p.justificativa)}</div>`}).join(''):'<p class="mut">A IA não devolveu posições.</p>';
 return h+(anxArr(R.alertas).length?`<h2>Alertas</h2><div class="card">${anxV(R.alertas)}</div>`:'')+anxFoot(j)}

/* aviso de cache e de relatório antigo */
function anxBadge(R,m,mk,ta){const td=loc().slice(0,10);let s=R.dia===td?'✅ Relatório de hoje, guardado no aparelho (reabrir não gasta cota).':'📅 Relatório de '+(R.dia?R.dia.slice(8,10)+'/'+R.dia.slice(5,7):'data desconhecida')+'. Toque em "Atualizar relatório" para renovar.';
 const cur=m==='pos'?anxPosItens().map(x=>x.id).join(','):(m==='img'||ta)?'':anxItens(mk).map(x=>x.tk).join(',');
 if(cur&&R.sig&&R.sig!==cur)s+=m==='pos'?' Suas posições abertas mudaram desde então.':' A carteira mudou desde então.';
 return `<div class="sm mut" style="margin-top:10px">${esc(s)}</div>`}

/* guardar relatório no trade ou no dia */
const anxTx=v=>Array.isArray(v)?v.map(anxTx).join(' '):v&&typeof v==='object'?Object.values(v).map(anxTx).join(' '):String(v==null?'':v);
function anxItem(j,key,tk){const R=j.relatorio||{},A=anxArr(R.ativos),m=key==='img'?'img':key==='pos'?'pos':/:fun$/.test(key)?'fun':'tec',a=A.find(x=>String(x.ticker||'').toUpperCase()===tk)||(A.length===1?A[0]:null),c=R.conclusao&&typeof R.conclusao==='object'?R.conclusao:{};
 const it={id:uid(),m,tk:tk||String(a&&a.ticker||R.ativo_lido||'').toUpperCase(),g:j.gerado||new Date().toISOString(),mod:j.modelo||'',dia:j.dia||loc().slice(0,10)};
 it.txt=anxTx(a?a.resumo:(R.sumario_executivo||R.resumo)).slice(0,900);
 it.rec=String(c.recomendacao||'').toUpperCase();it.vies=String((a&&(a.vies||a.valuation))||R.vies||'').toUpperCase();
 if(c.preco_alvo!=null&&c.preco_alvo!=='')it.alvo=c.preco_alvo;
 if(a&&a.plano_de_trade&&typeof a.plano_de_trade==='object'){const p=a.plano_de_trade;it.plano='Entrada '+anxTx(p.entrada||'–')+' · Stop '+anxTx(p.stop||'–')+' · Alvo 1 '+anxTx(p.alvo_1||'–')+' · Alvo 2 '+anxTx(p.alvo_2||'–')+' · ganho/risco '+anxTx(p.risco_retorno||'–')}
 return it}
function anxSaveBox(j,key,m){
 if(m==='pos')return `<div class="card" style="margin-top:12px"><b>💾 Guardar no diário</b><div class="sm mut">Anexa a análise de cada posição ao respectivo trade, para comparar com o resultado depois.</div><button class="btn" style="width:100%;margin-top:8px" data-an="savepos">Guardar em cada trade</button></div>`;
 const td=loc().slice(0,10),R=j.relatorio||{},tks=new Set([...anxArr(j.ativos).map(a=>String(a.tk||'').toUpperCase()),String(R.ativo_lido||'').toUpperCase(),String(ANX.tk||'').toUpperCase()].filter(Boolean)),mt=t=>[t.ativo,t.sub].some(x=>x&&tks.has(String(x).trim().toUpperCase())),L=S.trades.slice().sort((a,b)=>(mt(b)-mt(a))||b.dt.localeCompare(a.dt)).slice(0,30);
 const o=[['d:'+td,'📅 Meu dia de hoje'],...L.map(t=>[t.id,(mt(t)?'★ ':'')+(t.ativo||'sem ativo')+' · '+fdt(t.dt)+' · '+(isOpen(t)?'aberto':calc(t).pl==null?'fechado':mT(t,calc(t).pl))])];
 return `<div class="card" style="margin-top:12px"><b>💾 Guardar no diário</b><div class="sm mut">Anexa um resumo deste relatório a um trade ou ao dia, para comparar depois com o resultado.</div><label>Anexar a<select id="anx_dest">${opt(o,o[0][0])}</select></label><button class="btn" style="width:100%;margin-top:8px" data-an="save" data-v="${esc(key)}">Anexar</button></div>`}
function anxSave(key){const j=ANX.res[key],sel=$('#anx_dest');if(!j||!sel)return;const dest=sel.value;let tg,tk,nm;
 if(dest.slice(0,2)==='d:'){const k=dest.slice(2);tg=(S.days[k]??={chk:{}});tk=(ANX.tkA||'').trim().toUpperCase();nm='ao dia '+k.slice(8,10)+'/'+k.slice(5,7)}
 else{tg=S.trades.find(x=>x.id===dest);if(!tg)return;tk=String(tg.sub||tg.ativo||'').trim().toUpperCase();nm='ao trade '+(tg.ativo||'')}
 const it=anxItem(j,key,tk);
 if((tg.ia||[]).some(x=>x.g===it.g&&x.m===it.m&&x.tk===it.tk)){ANX.ok='Este relatório já está guardado '+nm+'.';render();return}
 tg.ia=[...(tg.ia||[]),it];tg.u=Date.now();save();ANX.ok='✓ Relatório guardado '+nm+'. Ele aparece em "Relatórios de IA guardados".';render()}
function anxSavePos(){const j=ANX.res.pos;if(!j)return;const P=anxArr((j.relatorio||{}).posicoes);let n=0;
 P.forEach(p=>{const t=S.trades.find(x=>x.id===p.id);if(!t)return;const ns=anxTx(p.novo_stop),g=j.gerado||new Date().toISOString();if((t.ia||[]).some(x=>x.g===g&&x.m==='pos'))return;
  t.ia=[...(t.ia||[]),{id:uid(),m:'pos',tk:String(p.ativo||t.ativo||'').toUpperCase(),g,mod:j.modelo||'',dia:j.dia||loc().slice(0,10),rec:String(p.acao_sugerida||'').toUpperCase(),vies:String(p.situacao||'').toUpperCase(),txt:[p.stop&&'Stop: '+anxTx(p.stop),p.alvos&&'Alvos: '+anxTx(p.alvos),p.vencimento&&'Vencimento: '+anxTx(p.vencimento),p.justificativa&&anxTx(p.justificativa)].filter(Boolean).join(' · ').slice(0,900),plano:ns&&!/sem dado/i.test(ns)?'Novo stop sugerido: '+ns:''}];t.u=Date.now();n++});
 if(n)save();ANX.ok=n?'✓ Análise guardada em '+n+' trade(s).':'Nada novo para guardar (já guardado ou posição não encontrada).';render()}
function iaBlock(L,c,w){if(!Array.isArray(L)||!L.length)return '';const MN={tec:'Técnica',fun:'Fundamentalista',img:'Foto do gráfico',pos:'Revisão de posição'};
 const res=c&&c.pl!=null?`<div class="sm mut">${w==='d'?'Resultado do dia':'Resultado do trade'}: <b class="${cls(c.pl)}">${money(c.pl)}</b>${pctConta(c.pl)?' · '+pctConta(c.pl):''}</div>`:`<div class="sm mut">${w==='d'?'Sem trades encerrados neste dia ainda.':'Trade ainda aberto: compare com o relatório quando encerrar.'}</div>`;
 return `<h3>🤖 Relatórios de IA guardados</h3>${res}`+L.map((x,i)=>`<details class="card"><summary class="sm"><b>${esc(MN[x.m]||'IA')}</b> · ${esc(x.tk||'')} · ${esc(new Date(x.g).toLocaleDateString('pt-BR'))} ${x.rec?anxVb(x.rec,iaCol(x.rec)):x.vies?anxVb(x.vies,iaCol(x.vies)):''}</summary>${x.txt?`<div class="sm" style="margin-top:6px">${esc(x.txt)}</div>`:''}${x.plano?`<div class="sm mut" style="margin-top:4px">${esc(x.plano)}</div>`:''}${x.alvo!=null?`<div class="sm mut">Preço-alvo da IA: ${esc(x.alvo)}</div>`:''}<button class="btn s" style="margin-top:8px" data-a="iadel" data-id="${i}" data-w="${w}">Remover</button></details>`).join('')}
function anxDel(id,w){const i=+id;
 if(w==='t'){if(!T)return;const arr=(T.ia||[]).filter((_,k)=>k!==i);T.ia=arr;const s=S.trades.find(x=>x.id===T.id);if(s){s.ia=arr.slice();s.u=Date.now();save()}showSheet()}
 else{const d=S.days[D];if(!d)return;d.ia=(d.ia||[]).filter((_,k)=>k!==i);d.u=Date.now();save();render()}}
/* ===ANX-END=== */
(async()=>{applyTheme();await open();try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}const s=await idb('kv','get','s');if(s)S=Object.assign(S,s);fixS();if(!S.seed){seedRules();S.seed=1;persist()}if(!S.mt&&(S.trades.length||Object.keys(S.days).length||S.prop))S.mt=Date.now();SESS=ls.get('diario-sess');if(window.CLOUD_OK&&cfg())await hashAuth();render();if(SESS)sync()})();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});

/* ---------- Interatividade: gestos, transições e feedback de toque ---------- */
(function(){
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const ORDER=['home','mercado','trades','swing','opc','dia','stats'];
const css=document.createElement('style');
css.textContent=
'html,body{overscroll-behavior-y:contain}'+
'.btn,.chip,.seg button,.mit,.tile,[data-a],[data-seg],[data-dseg]{-webkit-tap-highlight-color:transparent;touch-action:manipulation}'+
'.btn,.chip,.seg button,.mit,.tile,#fab,#btop{transition:transform .12s ease,filter .12s ease,background-color .15s ease}'+
'.btn:active,.chip:active,.seg button:active,.tile:active,#fab:active,#btop:active{transform:scale(.95);filter:brightness(1.15)}'+
'.mit:active{transform:scale(.98);filter:brightness(1.2)}'+
'.card[data-a]:active{transform:scale(.99)}'+
'.btn:focus-visible,.chip:focus-visible,.seg button:focus-visible,.mit:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--ac);outline-offset:2px}'+
'#ptr{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 56px);width:38px;height:38px;margin-left:-19px;border-radius:50%;background:var(--card,#111);color:var(--tx);border:1px solid var(--bd);display:flex;align-items:center;justify-content:center;font-size:18px;z-index:60;opacity:0;pointer-events:none;transform:translateY(-60px)}'+
'#ptr.go{color:var(--g)}#ptr.spin span{display:inline-block;animation:ptrs .7s linear infinite}@keyframes ptrs{to{transform:rotate(360deg)}}'+
'#btop{position:fixed;left:16px;bottom:calc(20px + env(safe-area-inset-bottom,0px));width:42px;height:42px;border-radius:50%;background:var(--card,#111);color:var(--tx);border:1px solid var(--bd);display:flex;align-items:center;justify-content:center;font-size:18px;z-index:40;opacity:0;transform:translateY(16px) scale(.9);pointer-events:none;transition:opacity .2s ease,transform .2s ease;padding:0}'+
'#btop.on{opacity:1;transform:none;pointer-events:auto}'+
'#tst{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);max-width:86vw;background:var(--card,#111);color:var(--tx);border:1px solid var(--bd);border-radius:12px;padding:10px 14px;font-size:14px;z-index:120;opacity:0;pointer-events:none;transition:opacity .2s ease,transform .2s ease}'+
'#tst.on{opacity:1;transform:translate(-50%,0)}'+
'@media (prefers-reduced-motion: reduce){.btn:active,.chip:active,.seg button:active,.tile:active,#fab:active,#btop:active{transform:none}#ptr.spin span{animation:none}}';
document.head.appendChild(css);

const mk=(tag,id,html)=>{const e=document.createElement(tag);e.id=id;if(html)e.innerHTML=html;document.body.appendChild(e);return e};
const ptr=mk('div','ptr','<span>↓</span>'),bt=mk('button','btop','↑'),tst=mk('div','tst');
bt.setAttribute('aria-label','Voltar ao topo');tst.setAttribute('role','status');
let tT;
window.toast=function(m,ms){tst.textContent=m;tst.classList.add('on');clearTimeout(tT);tT=setTimeout(()=>tst.classList.remove('on'),ms||2200)};
const buzz=n=>{try{navigator.vibrate&&navigator.vibrate(n||8)}catch(e){}};

/* transição direcional ao trocar de tela */
const idx=t=>ORDER.indexOf(t);
let lastTab=tab;
const r0=render0;
render0=function(){r0();if(tab===lastTab)return;const a=idx(lastTab),b=idx(tab);lastTab=tab;if(RM)return;const ap=document.getElementById('app');if(!ap||!ap.animate)return;const dir=a>=0&&b>=0?(b>a?1:-1):0;ap.animate([{opacity:0,transform:dir?'translateX('+(dir*28)+'px)':'translateY(10px)'},{opacity:1,transform:'none'}],{duration:200,easing:'cubic-bezier(.2,.7,.2,1)'})};

/* utilitários de gesto */
const blocked=el=>{
  if(!el||!el.closest)return true;
  if(el.closest('input,textarea,select,canvas,iframe,video,#lb,#mdr,#zz,.pv,.tradingview-widget-container,[data-noswipe]'))return true;
  if(T||document.body.style.overflow==='hidden')return true;
  for(let n=el;n&&n!==document.body;n=n.parentElement){const o=getComputedStyle(n).overflowX;if((o==='auto'||o==='scroll')&&n.scrollWidth>n.clientWidth+4)return true}
  return false};

let g=null;
document.addEventListener('touchstart',e=>{
  if(e.touches.length!==1){g=null;return}
  const t=e.touches[0];
  g={x:t.clientX,y:t.clientY,t0:Date.now(),edge:t.clientX<16,top:scrollY<=0,ok:!blocked(e.target),mode:null,dx:0,dy:0};
},{passive:true});

document.addEventListener('touchmove',e=>{
  if(!g)return;
  const t=e.touches[0];g.dx=t.clientX-g.x;g.dy=t.clientY-g.y;
  if(!g.mode){
    if(Math.abs(g.dx)<10&&Math.abs(g.dy)<10)return;
    g.mode=Math.abs(g.dx)>Math.abs(g.dy)*1.4?'h':(g.dy>0&&g.top&&g.ok&&scrollY<=0?'p':'v');
  }
  if(g.mode==='p'){
    const d=Math.min(g.dy,120)*.6;
    ptr.style.opacity=Math.min(1,d/40);
    ptr.style.transform='translateY('+(d-40)+'px)';
    ptr.firstChild.style.transform='rotate('+(d*5)+'deg)';
    ptr.classList.toggle('go',d>=45);
  }
},{passive:true});

document.addEventListener('touchend',()=>{
  if(!g)return;
  const d=g,dt=Date.now()-d.t0;g=null;
  const fast=dt<600;
  if(d.mode==='p'){
    const pull=Math.min(d.dy,120)*.6;
    if(pull>=45){
      buzz(12);ptr.classList.add('spin');ptr.style.transform='translateY(8px)';ptr.firstChild.style.transform='';
      const done=()=>{ptr.classList.remove('spin','go');ptr.style.opacity=0;ptr.style.transform='translateY(-60px)'};
      if(typeof SESS!=='undefined'&&SESS){Promise.resolve(sync(true)).finally(()=>setTimeout(done,300))}
      else{render();setTimeout(done,500)}
    }else{ptr.style.opacity=0;ptr.style.transform='translateY(-60px)';ptr.classList.remove('go')}
    return;
  }
  if(d.mode!=='h'||!fast)return;
  /* deslizar da borda esquerda abre o menu */
  if(d.edge&&d.dx>70){const b=document.getElementById('mbtn');if(b){buzz();b.click()}return}
  /* deslizar de lado troca de aba principal */
  if(!d.ok||Math.abs(d.dx)<80)return;
  const i=idx(tab);if(i<0)return;
  const n=d.dx<0?i+1:i-1;if(n<0||n>=ORDER.length)return;
  buzz();tab=ORDER[n];if(['trades','swing','opc'].includes(tab))LT=tab;render();scrollTo(0,0);
},{passive:true});

/* menu: arrastar o painel para a esquerda fecha */
let m=null;
document.addEventListener('touchstart',e=>{
  const p=e.target.closest&&e.target.closest('#mdr .mpn');
  m=p&&e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY,p,dx:0,on:0}:null;
},{passive:true});
document.addEventListener('touchmove',e=>{
  if(!m)return;const t=e.touches[0],dx=t.clientX-m.x,dy=t.clientY-m.y;
  if(!m.on){if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.5&&dx<0)m.on=1;else return}
  m.dx=Math.min(0,dx);m.p.style.animation='none';m.p.style.transform='translateX('+m.dx+'px)';
  const bk=m.p.previousElementSibling;if(bk)bk.style.opacity=Math.max(0,1+m.dx/300);
},{passive:true});
document.addEventListener('touchend',()=>{
  if(!m)return;const s=m;m=null;if(!s.on)return;
  if(s.dx<-90){buzz();const x=document.querySelector('#mdr [data-m="x"]');if(x)x.click()}
  else{s.p.style.transition='transform .15s ease';s.p.style.transform='';const bk=s.p.previousElementSibling;if(bk)bk.style.opacity='';setTimeout(()=>{s.p.style.transition=''},180)}
},{passive:true});

/* vibração leve nos toques em botões e seletores */
document.addEventListener('click',e=>{
  if(e.target.closest('.btn,.chip,.seg button,.mit,[data-seg],[data-dseg],#fab'))buzz(6);
},true);

/* botão de voltar ao topo */
let ticking=0;
addEventListener('scroll',()=>{if(ticking)return;ticking=1;requestAnimationFrame(()=>{ticking=0;bt.classList.toggle('on',scrollY>700&&!document.getElementById('mdr'))})},{passive:true});
bt.addEventListener('click',()=>{buzz();scrollTo({top:0,behavior:RM?'auto':'smooth'})});

/* aviso de conexão */
addEventListener('offline',()=>toast('Sem conexão — o diário continua salvando neste aparelho',3200));
addEventListener('online',()=>{toast('Conexão de volta');if(typeof SESS!=='undefined'&&SESS)sync()});
})();

/* ---------- Aba Mercado: agenda econômica + notícias do dia ---------- */
const MKT={tab:ls.get('diario-mkt-tab')||'ag',ct:ls.get('diario-mkt-ct')||'br,us',im:ls.get('diario-mkt-im')||'0,1',nf:'all',items:null,ts:0,busy:0,err:'',tm:null};
const MK_CT=[['br,us','Brasil + EUA'],['br','Brasil'],['us','EUA'],['br,us,eu,cn,gb,jp,de','Mundo']];
const MK_IM=[['-1,0,1','Todos'],['0,1','Médio e alto'],['1','Só alto']];
const MK_NF=[['all','Todas'],['urgente','Urgente'],['ibovespa','Ibovespa'],['dolar','Dólar'],['juros','Juros']];
const mkBtn=(k,v,l,on)=>`<button class="btn${on?'':' s'}" data-mk="${k}" data-v="${esc(v)}">${esc(l)}</button>`;
const mkRow=h=>`<div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0">${h}</div>`;
const mkDark=()=>{const t=document.documentElement.getAttribute('data-theme');return t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches};
const mkNorm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const mkAgo=iso=>{const m=Math.max(0,Math.round((Date.now()-new Date(iso))/6e4));if(m<1)return 'agora';if(m<60)return 'há '+m+' min';const h=Math.floor(m/60);if(h<24)return 'há '+h+' h';return new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',timeZone:'America/Sao_Paulo'})};
const mkDia=iso=>new Date(iso).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});

function vMercado(){
  const t=MKT.tab;
  const tabs='<div class="seg mk-seg" style="margin:10px 0">'+mkBtn('tab','ag','Agenda',t==='ag')+mkBtn('tab','nt','Notícias',t==='nt')+mkBtn('tab','cot','Cotações',t==='cot')+mkBtn('tab','al','Alertas',t==='al')+'</div>';
  if(t==='cot')return vCot(tabs);
  if(t==='al')return vAlertas(tabs);
  if(t==='ag')return `<div class="card"><div class="top"><b>Agenda econômica</b></div>${tabs}<div class="sm mut">País</div>${mkRow(MK_CT.map(([v,l])=>mkBtn('ct',v,l,MKT.ct===v)).join(''))}<div class="sm mut">Importância</div>${mkRow(MK_IM.map(([v,l])=>mkBtn('im',v,l,MKT.im===v)).join(''))}<div id="mkcal" style="min-height:560px"></div><div class="sm mut" style="margin-top:6px">Horários no fuso do seu aparelho. Dados do TradingView.</div></div>`;
  return `<div class="card"><div class="top"><b>Notícias do dia</b><button class="btn s" data-mk="rf" aria-label="Atualizar notícias">↻ Atualizar</button></div>${tabs}${mkRow(MK_NF.map(([v,l])=>mkBtn('nf',v,l,MKT.nf===v)).join(''))}<div id="mknews"></div><div class="sm mut" style="margin-top:8px">Fonte: Money Times. Toque na manchete para ler a matéria no site.</div></div>`;
}

function mkCal(){
  const box=document.getElementById('mkcal');if(!box)return;
  box.innerHTML='<div class="tradingview-widget-container"><div class="tradingview-widget-container__widget"></div></div>';
  const s=document.createElement('script');
  s.src='https://s3.tradingview.com/external-embedding/embed-widget-events.js';s.async=true;
  s.innerHTML=JSON.stringify({colorTheme:mkDark()?'dark':'light',isTransparent:true,locale:'br',countryFilter:MKT.ct,importanceFilter:MKT.im,width:'100%',height:560});
  box.firstChild.appendChild(s);
}

function mkPaint(){
  const box=document.getElementById('mknews');if(!box)return;
  if(MKT.busy&&!MKT.items){box.innerHTML='<div class="mut sm" style="padding:12px 0">Buscando notícias…</div>';return}
  if(!MKT.items){box.innerHTML=`<div class="warn">${esc(MKT.err||'Sem notícias por enquanto.')}</div>`;return}
  const hoje=mkDia(new Date().toISOString());
  let L=MKT.items.slice();
  if(MKT.nf!=='all'){const f=MKT.nf;L=L.filter(i=>(i.c||[]).some(c=>{const n=mkNorm(c);return f==='juros'?(n.includes('juros')||n.includes('selic')):n.includes(f)}))}
  const td=L.filter(i=>mkDia(i.d)===hoje);
  let nota='';
  if(td.length>=5)L=td;else{L=L.slice(0,15);nota='<div class="sm mut" style="margin-bottom:6px">Poucas notícias hoje, mostrando as mais recentes.</div>'}
  L=L.slice(0,25);
  if(!L.length){box.innerHTML='<div class="mut sm" style="padding:12px 0">Nenhuma notícia neste filtro.</div>';return}
  box.innerHTML=(MKT.err?`<div class="warn" style="margin-bottom:8px">${esc(MKT.err)} Mostrando a última cópia.</div>`:'')+nota+L.map(i=>{
    const ur=(i.c||[]).some(c=>mkNorm(c)==='urgente');
    return `<a class="card" href="${esc(i.l)}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;color:var(--tx);margin:6px 0"><div style="font-weight:600;line-height:1.35">${ur?'<span style="color:var(--r);font-size:12px;margin-right:6px">URGENTE</span>':''}${esc(i.t)}</div><div class="sm mut" style="margin-top:4px">${esc(mkAgo(i.d))}${i.a?' · '+esc(i.a):''}</div></a>`}).join('');
}

async function mkLoad(force){
  if(MKT.busy)return;
  if(!force&&MKT.items&&Date.now()-MKT.ts<3e5)return;
  const c=cfg();
  if(!c){MKT.err='Configure o Supabase na aba Conta para carregar as notícias.';mkPaint();return}
  MKT.busy=1;MKT.err='';mkPaint();
  try{
    let r;
    try{r=await fetch(c.url+'/functions/v1/noticias',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key},body:'{}'})}
    catch(e){throw new Error('Sem conexão com a função "noticias". Confira se ela foi publicada e se há internet.')}
    if(!r.ok){let m='';try{m=(await r.json()).error||''}catch(e){}throw new Error(r.status===401?'A função exige login: publique com --no-verify-jwt.':r.status===404?'Função "noticias" não encontrada: publique-a no Supabase.':(m||'Erro '+r.status))}
    const j=await r.json();
    if(!Array.isArray(j.itens))throw new Error('Resposta inesperada da função.');
    MKT.items=j.itens;MKT.ts=Date.now();
  }catch(e){MKT.err=e.message||String(e)}
  MKT.busy=0;
  if(tab==='mercado'&&MKT.tab==='nt')mkPaint();
}

function mkAfter(){
  if(MKT.tm){clearInterval(MKT.tm);MKT.tm=null}
  if(MKT.tab==='cot'){cotAfter();return}
  if(MKT.tab==='al'){alAfter();return}
  if(MKT.tab==='ag'){mkCal();return}
  mkPaint();mkLoad(false);
  MKT.tm=setInterval(()=>{if(tab==='mercado'&&MKT.tab==='nt'&&!document.hidden)mkLoad(true);else if(tab!=='mercado'){clearInterval(MKT.tm);MKT.tm=null}},3e5);
}

(function(){
  const r1=render0;
  render0=function(){r1();if(tab==='mercado')mkAfter()};
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-mk]');if(!b)return;
    const k=b.dataset.mk,v=b.dataset.v;
    if(k==='tab'){MKT.tab=v;ls.set('diario-mkt-tab',v);render()}
    else if(k==='ct'){MKT.ct=v;ls.set('diario-mkt-ct',v);render()}
    else if(k==='im'){MKT.im=v;ls.set('diario-mkt-im',v);render()}
    else if(k==='nf'){MKT.nf=v;render()}
    else if(k==='rf'){mkLoad(true)}
  });
})();

/* ---------- Meu dia: rotinas, limites, disciplina, sequência e notas rápidas ---------- */
const ROT0={
  m:['Olhei a agenda econômica e as notícias do dia','Marquei meus níveis e cenários dos ativos','Defini o risco máximo do dia (R) e o máximo de trades','Li minhas regras e o erro que não quero repetir hoje','Fiz o ensaio mental do que pode dar errado','Conferi capital e limites da mesa ou corretora'],
  n:['Vi a agenda e as notícias dos EUA para esta noite','Conferi posições abertas e stops antes da sessão','Revisei o plano e o limite de risco da sessão','Chequei meu estado emocional (sem revanche)']
};
const rotS=()=>S.rot&&Array.isArray(S.rot.m)&&Array.isArray(S.rot.n)?S.rot:(S.rot={m:ROT0.m.map((t,i)=>({id:'m'+(i+1),t})),n:ROT0.n.map((t,i)=>({id:'n'+(i+1),t}))});
const rotDone=(d,k)=>rotS()[k].filter(x=>d&&d.rt&&d.rt[k]&&d.rt[k][x.id]).length;
const dayTr=k=>S.trades.filter(t=>t.dt.slice(0,10)===k).map(t=>({...t,c:calc(t)}));
const dayR=ts=>sum(ts.filter(t=>t.c.r!=null).map(t=>t.c.r));
const isWk=k=>{const w=new Date(k+'T12:00').getDay();return w===0||w===6};
const addD=(k,n)=>{const d=new Date(k+'T12:00');d.setDate(d.getDate()+n);return isoD(d)};

/* nota de disciplina do dia (0 a 100), só com o que existe no dia */
function dscore(k){
  const d=S.days[k]||{},ts=dayTr(k);
  if(!ts.length&&!d.rt&&!(d.chk&&Object.keys(d.chk).length)&&!(typeof dHas==='function'&&dHas(d)))return null;
  const P=[],mL=rotS().m.length;
  if(mL)P.push([rotDone(d,'m')/mL,30]);
  if(S.rules.length)P.push([Object.values(d.chk||{}).filter(Boolean).length/S.rules.length,20]);
  if(ts.length)P.push([ts.filter(t=>!(t.err&&t.err!=='Nenhum')&&t.rules!=='n').length/ts.length,35]);
  const mR=limPerda(d),mT=+d.maxT;
  if(mR>0||mT>0)P.push([(mT>0&&ts.length>mT)||(mR>0&&dayPL(ts)<=-mR)?0:1,15]);
  const w=sum(P.map(x=>x[1]));
  return w?Math.round(sum(P.map(x=>x[0]*x[1]))/w*100):null;
}
function streak(){
  const today=loc().slice(0,10),mL=rotS().m.length;if(!mL)return 0;
  let n=0,k=today;
  for(let i=0;i<150;i++,k=addD(k,-1)){
    if(isWk(k))continue;
    const ok=rotDone(S.days[k],'m')===mL;
    if(ok)n++;else if(k!==today)break;
  }
  return n;
}
const scCol=p=>p==null?'var(--bd)':p>=80?'var(--g)':p>=50?'#d9a400':'var(--r)';

function disHtml(){
  const sc=dscore(D),st=streak(),today=loc().slice(0,10);
  const cells=[];for(let i=13;i>=0;i--){const k=addD(today,-i),p=dscore(k);cells.push(`<button data-a="cday" data-id="${k}" aria-label="${k}" title="${k}${p!=null?': '+p+'%':''}" style="width:100%;aspect-ratio:1;border-radius:8px;border:${k===D?'2px solid var(--tx)':'1px solid var(--bd)'};background:${p==null?'transparent':scCol(p)};opacity:${isWk(k)&&p==null?.35:1};color:${p==null?'var(--mut)':'#fff'};font-size:11px;padding:0">${+k.slice(8)}</button>`)}
  return `<div class="top"><b>Disciplina</b><span class="sm mut">${st?'🔥 '+st+(st>1?' dias':' dia')+' com a rotina da manhã completa':'Complete a rotina da manhã para iniciar uma sequência'}</span></div>
<div style="display:flex;align-items:center;gap:10px;margin:10px 0 8px"><b style="font-size:28px;color:${scCol(sc)}">${sc==null?'–':sc+'%'}</b><div class="sm mut" style="line-height:1.35">${sc==null?'A nota do dia aparece conforme você marca rotinas e registra trades.':'Nota do dia: rotinas, regras, trades dentro das regras e limites respeitados.'}</div></div>
<div style="display:grid;grid-template-columns:repeat(14,1fr);gap:3px">${cells.join('')}</div><div class="sm mut" style="margin-top:4px">Últimos 14 dias. Toque para abrir o dia.</div>`;
}
function limHtml(){
  const d=S.days[D]||{},ts=dayTr(D),R=dayPL(ts),mR=limPerda(d),mT=+d.maxT,out=[];
  const bar=(p,l,v)=>{const c=p>1?'var(--r)':p>.6?'#d9a400':'var(--g)';return `<div style="margin:8px 0"><div class="sm" style="display:flex;justify-content:space-between"><span>${l}</span><b style="color:${c}">${v}</b></div><div style="height:6px;border-radius:3px;background:var(--bd);overflow:hidden;margin-top:3px"><div style="height:100%;width:${Math.min(100,p*100)}%;background:${c};transition:width .3s"></div></div></div>`};
  if(mT>0)out.push(bar(ts.length/mT,'Trades do dia',ts.length+' de '+mT));
  if(mR>0)out.push(bar(Math.max(0,-R)/mR,'Perda do dia',money(Math.min(0,R))+' de -'+money(mR)));
  const hit=(mT>0&&ts.length>=mT)||(mR>0&&R<=-mR);
  if(!out.length)return '<div class="sm mut" style="margin-top:6px">Defina seus limites para acompanhar em tempo real e receber o alerta de parar.</div>';
  return out.join('')+(hit?'<div class="warn" style="margin-top:8px">🛑 Limite do dia atingido. Pelo seu plano, é hora de parar de operar.</div>':'');
}
function tlHtml(){
  const ts=dayTr(D).sort((a,b)=>a.dt.localeCompare(b.dt));
  if(!ts.length)return '';
  return `<details class="card" style="margin-top:8px"><summary class="sm"><b>Trades do dia (${ts.length})</b></summary>${ts.map(t=>`<div class="sm" style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid var(--bd)"><span>${esc(t.dt.slice(11,16))} · ${esc(t.ativo||'')} ${t.side==='C'?'C':'V'}${t.err&&t.err!=='Nenhum'?' ⚠️':''}</span><b class="${cls(t.c.pl)}">${t.c.pl==null?'aberto':mT(t,t.c.pl)}</b></div>`).join('')}</details>`;
}
function ntHtml(){
  const L=((S.days[D]||{}).nt||[]).map((n,i)=>({...n,i})).reverse();
  return `<div style="display:flex;gap:6px"><input id="qn" placeholder="O que está sentindo ou vendo agora?" style="margin:0;flex:1"><button class="btn" data-dn="add">Anotar</button></div>`+(L.length?L.map(n=>`<div class="sm" style="display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-top:1px solid var(--bd)"><span class="mut" style="flex:none">${esc(n.h)}</span><span style="flex:1;overflow-wrap:anywhere">${esc(n.x)}</span><button class="x" data-dn="del" data-i="${n.i}" aria-label="Apagar nota">✕</button></div>`).join(''):'<div class="sm mut" style="margin-top:6px">Anote rápido durante o pregão. Depois use no debriefing.</div>');
}
function rotCard(k,title,sub){
  const d=S.days[D]||{},L=rotS()[k],n=rotDone(d,k),p=L.length?n/L.length:0;
  return `<div class="card" id="rot-${k}"><div class="top"><b>${title}</b><span class="sm ${p===1?'g':'mut'}" data-rc="${k}">${n}/${L.length}</span></div><div class="sm mut" style="margin:2px 0 6px">${sub}</div>${L.map(x=>`<label class="ck"><input type="checkbox" data-rt="${k}:${x.id}"${d.rt&&d.rt[k]&&d.rt[k][x.id]?' checked':''}><span>${esc(x.t)}</span></label>`).join('')||'<span class="mut sm">Sem itens. Adicione abaixo.</span>'}<div style="height:4px;border-radius:2px;background:var(--bd);margin-top:8px;overflow:hidden"><div data-rb="${k}" style="height:100%;width:${p*100}%;background:var(--g);transition:width .25s"></div></div></div>`;
}
let ROTO=0;
function rotEdit(){
  const blk=(k,t)=>`<div class="sm" style="margin:10px 0 4px"><b>${t}</b></div>${rotS()[k].map(x=>`<div style="display:grid;grid-template-columns:1fr auto;gap:6px;margin:4px 0"><input data-rot="${k}:${x.id}" value="${esc(x.t)}" style="margin:0"><button class="x" data-rtx="del" data-k="${k}" data-id="${x.id}" aria-label="Remover item">✕</button></div>`).join('')}<div style="display:grid;grid-template-columns:1fr auto;gap:6px;margin:6px 0"><input id="rtn-${k}" placeholder="Novo item" style="margin:0"><button class="btn s" data-rtx="add" data-k="${k}">Adicionar</button></div>`;
  return `<details class="card" id="rtd"${ROTO?' open':''}><summary class="sm"><b>✏️ Editar itens das rotinas</b></summary>${blk('m','Rotina da manhã')}${blk('n','Abertura americana')}</details>`;
}
function lastLesson(){
  for(let i=1;i<=10;i++){const k=addD(D,-i),d=S.days[k];if(d&&(d.prevn||d.aprend)){
    const dt=new Date(k+'T12:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});
    return `<div class="card" style="margin-top:8px"><div class="sm mut">💡 Do seu debriefing de ${esc(dt)}</div>${d.prevn?`<div style="margin-top:4px"><b>Para não repetir:</b> ${esc(d.prevn)}</div>`:''}${d.aprend?`<div style="margin-top:4px"><b>Aprendizado:</b> ${esc(d.aprend)}</div>`:''}</div>`}}
  return '';
}

const vDia0=vDia;
vDia=function(){
  const h=vDia0();if(DV==='hist')return h;
  const today=D===loc().slice(0,10),d=S.days[D]||{};
  const pend=today&&new Date().getHours()>=8&&rotS().m.length&&rotDone(d,'m')<rotS().m.length?'<div class="warn" style="margin-bottom:8px">☀️ A rotina da manhã ainda está pendente.</div>':'';
  const top=`${pend}<div class="card" id="dis">${disHtml()}</div>
<div class="card" style="margin-top:8px"><b>🛑 Limites do dia</b><div class="g2" style="margin-top:6px"><label>Perda máxima (R$)<input type="number" inputmode="decimal" step="10" min="0" data-d="maxP" value="${esc(d.maxP||(limPerda(d)?Math.round(limPerda(d)):''))}" placeholder="ex.: 300"></label><label>Máx. de trades<input type="number" inputmode="numeric" step="1" min="0" data-d="maxT" value="${esc(d.maxT||'')}" placeholder="ex.: 5"></label></div><div id="limr">${limHtml()}</div></div>${tlHtml()}${lastLesson()}
<div class="card" style="margin-top:8px"><b>📝 Notas rápidas do pregão</b><div id="ntx" style="margin-top:6px">${ntHtml()}</div></div>`;
  const noite=rotCard('n','🌐 Abertura americana','Faça antes da sessão noturna.')+rotEdit();
  const e2=`<label>Como estou ao fim do dia?</label><div class="chips2">${EMO.map((e,i)=>`<button class="${d.energia2==i+1?'on':''}" data-dseg="energia2" data-v="${i+1}">${e}</button>`).join('')}</div>`;
  let o=h;
  const sw=(a,b)=>{if(o.includes(a))o=o.replace(a,()=>b)};
  sw('<h2>☀️ Antes do mercado</h2>',top+'<h2>☀️ Antes do mercado</h2>'+rotCard('m','Rotina da manhã','Faça antes de abrir o mercado.'));
  sw('<h2>🌙 Depois do mercado (debriefing)</h2>',noite+'<h2>🌙 Depois do mercado (debriefing)</h2>');
  sw('<label>Aprendizado principal<textarea',e2+'<label>Aprendizado principal<textarea');
  return o;
};

(function(){
  const refresh=k=>{
    const d=S.days[D]||{},L=rotS()[k],n=rotDone(d,k);
    document.querySelectorAll('[data-rc="'+k+'"]').forEach(e=>{e.textContent=n+'/'+L.length;e.className='sm '+(n===L.length&&L.length?'g':'mut')});
    document.querySelectorAll('[data-rb="'+k+'"]').forEach(e=>{e.style.width=(L.length?n/L.length*100:0)+'%'});
    const x=document.getElementById('dis');if(x)x.innerHTML=disHtml();
    if(L.length&&n===L.length&&window.toast)toast(k==='m'?'✅ Rotina da manhã completa':'✅ Abertura americana pronta');
  };
  document.addEventListener('change',e=>{
    const t=e.target;if(!t.dataset||!t.dataset.rt)return;
    const[k,id]=t.dataset.rt.split(':'),dd=(S.days[D]??={chk:{}});
    ((dd.rt??={m:{},n:{}})[k]??={})[id]=t.checked;dd.u=Date.now();save();refresh(k);
  });
  document.addEventListener('input',e=>{
    const t=e.target;if(!t.dataset)return;
    if(t.dataset.rot){const[k,id]=t.dataset.rot.split(':'),it=rotS()[k].find(x=>x.id===id);if(it){it.t=t.value;S.mt=Date.now();save()}return}
    if(t.dataset.d==='maxR'||t.dataset.d==='maxP'||t.dataset.d==='maxT'){const l=document.getElementById('limr');if(l)l.innerHTML=limHtml();const x=document.getElementById('dis');if(x)x.innerHTML=disHtml()}
  });
  document.addEventListener('toggle',e=>{if(e.target&&e.target.id==='rtd')ROTO=e.target.open},true);
  document.addEventListener('click',e=>{
    const x=e.target.closest('[data-rtx]');
    if(x){
      const k=x.dataset.k;
      if(x.dataset.rtx==='del'){rotS()[k]=rotS()[k].filter(i=>i.id!==x.dataset.id);S.mt=Date.now();save();render()}
      else{const inp=document.getElementById('rtn-'+k),v=inp&&inp.value.trim();if(v){rotS()[k].push({id:uid(),t:v});S.mt=Date.now();save();ROTO=1;render()}}
      return;
    }
    const n=e.target.closest('[data-dn]');
    if(n){
      const dd=(S.days[D]??={chk:{}});
      if(n.dataset.dn==='add'){const inp=document.getElementById('qn'),v=inp&&inp.value.trim();if(!v)return;(dd.nt??=[]).push({h:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),x:v})}
      else{(dd.nt||[]).splice(+n.dataset.i,1)}
      dd.u=Date.now();save();const b=document.getElementById('ntx');if(b)b.innerHTML=ntHtml();
      if(n.dataset.dn==='add'){const q=document.getElementById('qn');if(q)q.focus()}
    }
  });
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='qn'){e.preventDefault();const b=document.querySelector('[data-dn="add"]');if(b)b.click()}});
})();

/* ---------- Alertas: notificações push, preferências e próximos eventos ---------- */
const NP=Object.assign({m:'08:00',n:'18:50',lead:5,cur:['USD'],imp:'high'},ls.get('diario-np')||{});
NP.on=Object.assign({m:true,n:true,ev:true},NP.on||{});
const AL={ok:null,msg:'',busy:0,sub:null,ev:null,evTs:0,evErr:'',sy:null};
const AL_CUR=[['USD','EUA'],['EUR','Euro'],['GBP','Reino Unido'],['JPY','Japão'],['CNY','China'],['CAD','Canadá'],['AUD','Austrália']];
const alSup=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
const alSave=()=>ls.set('diario-np',NP);
const u8=b=>{const s=(b+'='.repeat((4-b.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/'),r=atob(s);return Uint8Array.from(r,c=>c.charCodeAt(0))};

async function alFn(acao,extra){
  const c=cfg();if(!c)throw new Error('Configure o Supabase na aba Conta.');
  let r;
  try{r=await fetch(c.url+'/functions/v1/notificar',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key},body:JSON.stringify(Object.assign({acao},extra||{}))})}
  catch(e){throw new Error('Sem conexão com a função "notificar". Confira a internet e se ela foi publicada.')}
  let j={};try{j=await r.json()}catch(e){}
  if(!r.ok)throw new Error(j.error||(r.status===404?'Função "notificar" não encontrada: publique-a no Supabase.':r.status===401?'A função exige login: publique com --no-verify-jwt.':'Erro '+r.status));
  return j;
}

async function alState(){
  if(!alSup()){AL.ok='nosup';return}
  if(Notification.permission==='denied'){AL.ok='denied';return}
  try{const reg=await navigator.serviceWorker.ready;AL.sub=await reg.pushManager.getSubscription()}catch(e){AL.sub=null}
  AL.ok=AL.sub&&Notification.permission==='granted'?'on':'off';
}

async function alEnable(){
  AL.busy=1;AL.msg='';alPaint();
  try{
    if(!alSup())throw new Error('Este navegador não suporta notificações push.');
    const perm=await Notification.requestPermission();
    if(perm!=='granted')throw new Error('Permissão negada. Libere as notificações nas configurações do navegador ou do app instalado.');
    const reg=await navigator.serviceWorker.ready,k=(await alFn('chave')).chave;
    let sub=await reg.pushManager.getSubscription();
    if(sub){try{await alFn('cancelar',{endpoint:sub.endpoint})}catch(e){}await sub.unsubscribe()}
    sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:u8(k)});
    await alFn('inscrever',{sub:sub.toJSON(),prefs:npComTurno()});
    AL.sub=sub;AL.ok='on';AL.msg='Notificações ativadas neste aparelho.';
  }catch(e){AL.msg=e.message||String(e)}
  AL.busy=0;await alState();alPaint();
}
async function alDisable(){
  AL.busy=1;AL.msg='';alPaint();
  try{if(AL.sub){try{await alFn('cancelar',{endpoint:AL.sub.endpoint})}catch(e){}await AL.sub.unsubscribe()}AL.sub=null;AL.msg='Notificações desativadas neste aparelho.'}
  catch(e){AL.msg=e.message||String(e)}
  AL.busy=0;await alState();alPaint();
}
async function alTest(){
  AL.busy=1;AL.msg='';alPaint();
  try{await alFn('teste',{endpoint:AL.sub.endpoint});AL.msg='Teste enviado. A notificação deve chegar em alguns segundos.'}
  catch(e){AL.msg=e.message||String(e)}
  AL.busy=0;alPaint();
}
function alPush(){
  alSave();clearTimeout(AL.sy);
  if(AL.ok!=='on'||!AL.sub)return;
  AL.sy=setTimeout(()=>{alFn('inscrever',{sub:AL.sub.toJSON(),prefs:npComTurno()}).then(()=>{AL.msg='Preferências salvas.';alPaint()}).catch(e=>{AL.msg=e.message;alPaint()})},700);
}
async function alLoadEv(force){
  if(!force&&AL.ev&&Date.now()-AL.evTs<18e5)return;
  try{const j=await alFn('eventos');AL.ev=j.itens||[];AL.evTs=Date.now();AL.evErr=''}
  catch(e){AL.evErr=e.message||String(e)}
}

const alWhen=iso=>{const d=new Date(iso),w=d.toLocaleDateString('pt-BR',{weekday:'short',timeZone:'America/Sao_Paulo'}),h=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'});return w.replace('.','')+' '+h};
const alIn=iso=>{const m=Math.round((new Date(iso)-Date.now())/6e4);if(m<=0)return 'agora';if(m<60)return 'em '+m+' min';const h=Math.floor(m/60);return h<24?'em '+h+' h':'em '+Math.floor(h/24)+' d'};
const alEvList=()=>{
  if(!AL.ev)return `<div class="mut sm">${esc(AL.evErr||'Carregando eventos…')}</div>`;
  const L=AL.ev.filter(e=>NP.cur.includes(e.cur)&&(NP.imp==='med'||e.imp==='high')&&new Date(e.d)>Date.now()-36e5).slice(0,10);
  if(!L.length)return '<div class="mut sm">Nenhum evento com esses filtros nos próximos dias.</div>';
  return L.map(e=>`<div class="card" style="margin:6px 0"><div style="font-weight:600;line-height:1.3">${e.imp==='high'?'<span style="color:var(--r);font-size:12px;margin-right:6px">ALTO</span>':'<span class="mut" style="font-size:12px;margin-right:6px">MÉDIO</span>'}${esc(e.t)} <span class="mut sm">(${esc(e.cur)})</span></div><div class="sm mut" style="margin-top:3px">${esc(alWhen(e.d))} · ${esc(alIn(e.d))}${e.f?' · prev. '+esc(e.f):''}${e.p?' · ant. '+esc(e.p):''}</div></div>`).join('')+(AL.evErr?`<div class="sm mut">${esc(AL.evErr)}</div>`:'');
};

function alHtml(){
  const b=(a,l,s)=>`<button class="btn${s?' s':''}" data-alb="${a}"${AL.busy?' disabled':''}>${l}</button>`;
  let st;
  if(AL.ok==null)st='<div class="mut sm">Verificando…</div>';
  else if(AL.ok==='nosup')st='<div class="warn">Este navegador não suporta notificações push. No iPhone, instale o app na Tela de Início e abra por lá (iOS 16.4 ou mais novo).</div>';
  else if(AL.ok==='denied')st='<div class="warn">As notificações estão bloqueadas para este app. Libere nas configurações do navegador ou do app instalado e volte aqui.</div>';
  else if(AL.ok==='off')st=`<div class="sm" style="margin-bottom:8px">Receba lembretes dos checklists e um aviso antes das notícias importantes, mesmo com o app fechado.</div>${b('on','🔔 Ativar notificações')}`;
  else st=`<div class="sm g" style="margin-bottom:8px">✅ Ativas neste aparelho</div><div style="display:flex;gap:6px;flex-wrap:wrap">${b('test','Enviar teste',1)}${b('off','Desativar',1)}</div>`;
  const ck=(k,l)=>`<label class="ck"><input type="checkbox" data-al="on.${k}"${NP.on[k]?' checked':''}><span>${l}</span></label>`;
  return `${st}${AL.msg?`<div class="sm" style="margin-top:8px">${esc(AL.msg)}</div>`:''}
<h3 style="margin-top:14px">Quando avisar</h3>
${ck('m','☀️ Checklist da manhã')}<label>Horário<input type="time" data-al="m" value="${esc(NP.m)}"></label>
${ck('n','🌐 Checklist da abertura americana')}<label>Horário<input type="time" data-al="n" value="${esc(NP.n)}"></label>
${ck('ev','⏰ Notícias importantes')}
<div class="g2"><label>Avisar antes<select data-al="lead">${opt([[3,'3 min'],[5,'5 min'],[10,'10 min'],[15,'15 min'],[30,'30 min']],NP.lead)}</select></label><label>Impacto<select data-al="imp">${opt([['high','Só alto'],['med','Médio e alto']],NP.imp)}</select></label></div>
<div class="sm mut" style="margin-top:6px">Países</div>
<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">${AL_CUR.map(([c,l])=>`<button class="btn${NP.cur.includes(c)?'':' s'}" data-alc="${c}">${esc(l)}</button>`).join('')}</div>
<div class="sm mut">Checklists: segunda a sexta, horário de Brasília. O calendário vem do Forex Factory e não inclui eventos do Brasil.</div>
<h3 style="margin-top:14px">Próximos eventos</h3>${alEvList()}`;
}
function alPaint(){const e=document.getElementById('alx');if(e)e.innerHTML=alHtml()}
function vAlertas(tabs){return `<div class="card"><div class="top"><b>Alertas</b></div>${tabs}<div id="alx">${alHtml()}</div></div>`}
async function alAfter(){
  alPaint();
  await alState();alPaint();
  if(!AL.ev){await alLoadEv();alPaint()}else alLoadEv().then(alPaint);
}

(function(){
  document.addEventListener('click',e=>{
    const c=e.target.closest('[data-alc]');
    if(c){const k=c.dataset.alc,i=NP.cur.indexOf(k);if(i>=0){if(NP.cur.length>1)NP.cur.splice(i,1)}else NP.cur.push(k);alPush();alPaint();return}
    const b=e.target.closest('[data-alb]');if(!b)return;
    const a=b.dataset.alb;
    if(a==='on')alEnable();else if(a==='off')alDisable();else if(a==='test')alTest();
  });
  document.addEventListener('change',e=>{
    const t=e.target,k=t.dataset&&t.dataset.al;if(!k)return;
    if(k.startsWith('on.'))NP.on[k.slice(3)]=t.checked;
    else if(k==='m'||k==='n'){if(/^\d\d:\d\d$/.test(t.value))NP[k]=t.value}
    else if(k==='lead')NP.lead=+t.value;
    else if(k==='imp')NP.imp=t.value;
    alPush();alPaint();
  });
})();

/* lembretes locais (só funcionam com o app aberto; usam a mesma "tag" da notificação do servidor, então não duplicam) */
(function(){
  const TZ='America/Sao_Paulo',seen=ls.get('diario-nl')||{};
  const mark=k=>{seen[k]=Date.now();Object.keys(seen).forEach(x=>{if(Date.now()-seen[x]>2*864e5)delete seen[x]});ls.set('diario-nl',seen)};
  async function show(tag,title,body,data){try{const reg=await navigator.serviceWorker.ready;await reg.showNotification(title,{body,tag,icon:'icon-192.png',badge:'icon-192.png',data})}catch(e){}}
  async function loop(){
    if(!alSup()||Notification.permission!=='granted')return;
    const now=new Date(),P=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(x=>[x.type,x.value]));
    const dia=P.year+'-'+P.month+'-'+P.day,min=+P.hour*60+ +P.minute,util=!['Sat','Sun'].includes(P.weekday),tm=s=>+s.slice(0,2)*60+ +s.slice(3,5);
    if(util&&NP.on.m&&min-tm(NP.m)>=0&&min-tm(NP.m)<3&&!seen['m'+dia]){mark('m'+dia);show('chk-m-'+dia,'☀️ Hora do checklist da manhã','Revise a agenda, defina seu risco do dia e marque a rotina antes de operar.',{go:'dia',r:'m'})}
    if(util&&NP.on.n&&min-tm(NP.n)>=0&&min-tm(NP.n)<3&&!seen['n'+dia]){mark('n'+dia);show('chk-n-'+dia,'🌐 Checklist da abertura americana','Faça o checklist de novo antes da sessão noturna. Confirme seu limite de risco.',{go:'dia',r:'n'})}
    if(NP.on.ev){
      if(!AL.ev||Date.now()-AL.evTs>18e5)await alLoadEv();
      (AL.ev||[]).forEach(e=>{
        if(!NP.cur.includes(e.cur)||(NP.imp==='high'&&e.imp!=='high'))return;
        const m=(new Date(e.d)-now)/6e4,k='e'+e.id+NP.lead;
        if(m>0&&m<=NP.lead&&!seen[k]){mark(k);show('ev-'+e.id,'⏰ Em '+Math.max(1,Math.round(m))+' min: '+e.t+' ('+e.cur+')',(e.imp==='high'?'Alto':'Médio')+' impacto às '+alWhen(e.d).split(' ').pop()+(e.f?' · Previsão '+e.f:'')+(e.p?' · Anterior '+e.p:''),{go:'mercado'})}
      });
    }
  }
  setInterval(()=>{if(!document.hidden)loop()},30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)loop()});
})();

/* abrir direto na tela certa ao tocar na notificação */
const GO={r:null,book:null};
(function(){
  const go=(g,r)=>{if(!['dia','mercado','home','estudos','livro','rev','mesa','carreira','import'].includes(g))return false;if(g==='rev')RP='w0';if(g==='livro'){GO.book=r||null;tab='estudos';return true}tab=g;if(g==='dia'){D=loc().slice(0,10);DV='ed'}GO.r=r||null;return true};
  const q=new URLSearchParams(location.search);
  if(q.get('go')){go(q.get('go'),q.get('r'));history.replaceState(null,'',location.pathname+location.hash)}
  if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{const d=e.data||{};if(d.go&&go(d.go,d.r)){render();scrollTo(0,0)}});
  const r2=render0;
  render0=function(){
    r2();
    if(GO.book&&(S.books||[]).some(x=>x.id===GO.book)){BID=GO.book;BV='not';tab='livro';GO.book=null;render();return}
    if(GO.r&&tab==='dia'){const el=document.getElementById('rot-'+GO.r);GO.r=null;if(el){setTimeout(()=>{el.scrollIntoView({behavior:'smooth',block:'center'});if(el.animate)el.animate([{boxShadow:'0 0 0 3px var(--ac)'},{boxShadow:'0 0 0 0 transparent'}],{duration:1600,easing:'ease-out'})},120)}}
  };
})();

/* ---------- Início: radar de ADRs brasileiras (com pré-mercado) ---------- */
const ADR0=['EWZ','WEGZY','BBSEY','BDORY','SUZ','SID','GGB','ITUB','PBR','VALE','ABEV','BBD'];
const AD={list:(ls.get('diario-adr')||ADR0).slice(),data:ls.get('diario-adr-d'),busy:0,err:'',sort:ls.get('diario-adr-o')||'lista',edit:0,tm:null};
/* EWZ (ETF do Brasil em NY) entra uma vez nas listas já editadas */
if(!ls.get('diario-adr-ewz')){if(!AD.list.includes('EWZ')){AD.list.unshift('EWZ');if(ls.get('diario-adr'))ls.set('diario-adr',AD.list)}ls.set('diario-adr-ewz',1)}
const adN=n=>n==null?'–':(+n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const adP=n=>n==null?'–':(n>0?'+':'')+adN(n)+'%';
const adSt={pre:'🟡 Pré-mercado',reg:'🟢 Pregão aberto',post:'🟠 Pós-mercado',closed:'⚪ Fechado'};
const adState=L=>{const c={};L.forEach(i=>{c[i.state]=(c[i.state]||0)+1});return Object.keys(c).sort((a,b)=>c[b]-c[a])[0]||'closed'};

function adRow(i){
  const sub=(l,x)=>x?`${l} ${adN(x.px)} <span class="${cls(x.chp)}">${adP(x.chp)}</span>`:'';
  const sec=i.state==='pre'?'Fech. '+adN(i.base):i.state==='reg'?sub('Pré',i.pre):sub('Pós',i.pos);
  return `<div style="display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;padding:9px 0;border-top:1px solid var(--bd)"><div style="min-width:0"><b>${esc(i.s)}</b>${i.state==='pre'?' <span class="sm" style="color:#d9a400;font-weight:600">PRÉ</span>':''}<div class="sm mut" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(i.n)}</div></div><div style="text-align:right"><b>${adN(i.px)}</b> <span class="sm ${cls(i.chp)}">${adP(i.chp)}</span><div class="sm mut">${sec||'&nbsp;'}</div></div></div>`;
}

function adrHtml(){
  let L=((AD.data&&AD.data.itens)||[]).filter(i=>AD.list.includes(i.s));
  const ewz=L.find(i=>i.s==='EWZ');L=L.filter(i=>i.s!=='EWZ');
  const st=L.length?adState(L):ewz?ewz.state:'closed',avg=L.length?sum(L.map(i=>i.chp))/L.length:null;
  if(AD.sort==='alta')L=L.slice().sort((a,b)=>b.chp-a.chp);
  else if(AD.sort==='queda')L=L.slice().sort((a,b)=>a.chp-b.chp);
  else L=L.slice().sort((a,b)=>AD.list.indexOf(a.s)-AD.list.indexOf(b.s));
  const ob=(k,l)=>`<button class="${AD.sort===k?'on':''}" data-adr="o:${k}">${l}</button>`;
  const ed=AD.edit?`<div class="card" style="margin:8px 0"><div style="display:flex;flex-wrap:wrap;gap:6px">${AD.list.map(s=>`<button class="btn s" data-adr="x:${esc(s)}" aria-label="Remover ${esc(s)}">${esc(s)} ✕</button>`).join('')}</div><div style="display:grid;grid-template-columns:1fr auto auto;gap:6px;margin-top:8px"><input id="adn" placeholder="Novo ticker (ex.: ERJ)" autocapitalize="characters" style="margin:0"><button class="btn" data-adr="add">Adicionar</button><button class="btn s" data-adr="reset">Padrão</button></div></div>`:'';
  return `<div class="top"><b>🇧🇷 ADRs brasileiras</b><span class="sm">${adSt[st]}</span></div>
<div class="sm mut" style="margin:4px 0 8px">Média ${avg==null?'–':`<b class="${cls(avg)}">${adP(avg)}</b>`}${AD.data?' · atualizado às '+hm(AD.data.ts):''}${AD.busy?' · buscando…':''}</div>
<div style="display:flex;gap:6px;align-items:center"><div class="seg" style="flex:1">${ob('lista','Lista')}${ob('alta','Altas')}${ob('queda','Quedas')}</div><button class="btn s ib" data-adr="rf" aria-label="Atualizar" ${AD.busy?'disabled':''}>↻</button><button class="btn ib${AD.edit?'':' s'}" data-adr="ed" aria-label="Editar lista">✏️</button></div>${ed}
${AD.err?`<div class="warn" style="margin-top:8px">${esc(AD.err)}</div>`:''}
${ewz?`<div class="card" style="margin:8px 0 0;padding:8px 10px;border-left:3px solid ${ewz.chp>=0?'var(--g)':'var(--r)'}"><div style="display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center"><div><b>EWZ</b> <span class="sm mut">ETF do Brasil em NY</span><div class="sm mut">termômetro do Ibovespa em dólar</div></div><div style="text-align:right"><b style="font-size:18px">${adN(ewz.px)}</b> <span class="${cls(ewz.chp)}">${adP(ewz.chp)}</span><div class="sm mut">${ewz.state==='pre'?'Pré · fech. '+adN(ewz.base):ewz.state==='reg'?(ewz.pre?'Pré '+adN(ewz.pre.px)+' '+adP(ewz.pre.chp):'&nbsp;'):ewz.pos?'Pós '+adN(ewz.pos.px)+' '+adP(ewz.pos.chp):'&nbsp;'}</div></div></div></div>`:''}
<div style="margin-top:6px">${L.length?L.map(adRow).join(''):`<div class="mut sm" style="padding:12px 0">${AD.busy?'Buscando cotações…':'Sem cotações ainda.'}</div>`}</div>
<div class="sm mut" style="margin-top:6px">Yahoo Finance, com possível atraso. No pré-mercado o número grande já é o preço de pré e a variação é contra o último fechamento. ADRs de balcão (WEGZY, BBSEY, BDORY) não têm pré-mercado. A média não inclui o EWZ.</div>`;
}
function adrPaint(){const e=document.getElementById('adr');if(e)e.innerHTML=adrHtml()}

async function adrLoad(force){
  if(AD.busy)return;
  const L=(AD.data&&AD.data.itens)||[],closed=L.length&&adState(L)==='closed';
  if(!force&&AD.data&&Date.now()-AD.data.ts<(closed?3e5:5e4))return;
  const c=cfg();
  if(!c){AD.err='Configure o Supabase na aba Conta para ver as cotações.';adrPaint();return}
  AD.busy=1;AD.err='';adrPaint();
  try{
    let r;
    try{r=await fetch(c.url+'/functions/v1/adrs',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key},body:JSON.stringify({symbols:AD.list})})}
    catch(e){throw new Error('Sem conexão. Mostrando a última cotação salva.')}
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok)throw new Error(j.error||(r.status===404?'Função "adrs" não encontrada: publique-a no Supabase.':r.status===401?'A função exige login: publique com --no-verify-jwt.':'Erro '+r.status));
    AD.data={ts:Date.now(),itens:j.itens||[]};ls.set('diario-adr-d',AD.data);
    if((j.erros||[]).length)AD.err='Sem dados de: '+j.erros.map(x=>String(x).split(':')[0]).join(', ')+'.';
  }catch(e){AD.err=e.message||String(e)}
  AD.busy=0;adrPaint();
}
function adrAfter(){
  adrPaint();adrLoad(false);
  if(AD.tm)return;
  AD.tm=setInterval(()=>{if(tab!=='home'){clearInterval(AD.tm);AD.tm=null;return}if(!document.hidden)adrLoad(false)},30000);
}

(function(){
  const h0=vHome;
  vHome=function(){
    const h=h0(),card=`<div class="card" id="adr" style="margin-top:12px">${adrHtml()}</div>`;
    let ct='';try{ct=capTotal()}catch(e){}
    if(ct&&h.includes(ct))return h.replace(ct,()=>card+ct);
    const m='<h2>Posições abert';
    return h.includes(m)?h.replace(m,()=>card+m):card+h;
  };
  const r3=render0;
  render0=function(){r3();if(tab==='home')adrAfter()};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&tab==='home')adrLoad(false)});
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-adr]');if(!b)return;
    const v=b.dataset.adr;
    if(v==='rf'){adrLoad(true);return}
    if(v==='ed'){AD.edit=!AD.edit;adrPaint();return}
    if(v.startsWith('o:')){AD.sort=v.slice(2);ls.set('diario-adr-o',AD.sort);adrPaint();return}
    if(v.startsWith('x:')){if(AD.list.length>1){AD.list=AD.list.filter(s=>s!==v.slice(2));ls.set('diario-adr',AD.list);adrPaint();adrLoad(true)}return}
    if(v==='reset'){AD.list=ADR0.slice();ls.set('diario-adr',AD.list);adrPaint();adrLoad(true);return}
    if(v==='add'){
      const i=document.getElementById('adn'),s=i&&i.value.trim().toUpperCase();
      if(!s||!/^[A-Z0-9.\-]{1,10}$/.test(s)||AD.list.includes(s)||AD.list.length>=40)return;
      AD.list.push(s);ls.set('diario-adr',AD.list);adrPaint();adrLoad(true);
    }
  });
})();

/* ---------- Estudos: resumo de livros com IA, gerado em segundo plano ---------- */
const RS_MAX=50*1024*1024;
const RS={up:{},jobs:ls.get('diario-rs')||{},loading:0,loadedAt:0,poll:null,clock:null,err:'',started:0,auto:ls.get('diario-rs-auto')!==false};
const RS_PEND=['na_fila','processando'];
const rsPend=j=>!!j&&RS_PEND.includes(j.status);
const rsChip=j=>({na_fila:'⏳ Na fila',processando:'⚙️ Gerando…',concluido:'✅ Resumo concluído',erro:'⚠️ Erro'}[j.status]||'');
const rsMin=iso=>{const s=Math.max(0,Math.round((Date.now()-new Date(iso))/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const rsParado=j=>j.status==='processando'&&Date.now()-new Date(j.atualizado||j.criado)>6*6e4;

async function rsFn(acao,extra){
  const c=cfg();if(!c)throw new Error('Configure o Supabase na aba Conta.');
  if(!SESS||!SESS.at)throw new Error('Entre na sua conta (Mais → Conta) para gerar resumos.');
  await tok();
  let r;
  try{r=await fetch(c.url+'/functions/v1/resumo',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key,Authorization:'Bearer '+SESS.at},body:JSON.stringify(Object.assign({acao},extra||{}))})}
  catch(e){throw new Error('Sem conexão. Se o pedido já foi enviado, o resumo continua sendo gerado no servidor.')}
  let j={};try{j=await r.json()}catch(e){}
  if(!r.ok)throw new Error(j.erro||(r.status===404?'Função "resumo" não encontrada: publique-a no Supabase.':r.status===401?'Entre na sua conta de novo (Mais → Conta).':'Erro '+r.status));
  return j;
}
const rsTela=()=>tab==='estudos'||tab==='livro';
function rsRefresh(){
  if(!rsTela())return;
  const a=document.activeElement;
  if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.value)return; // não atrapalha quem está digitando
  render();
}

async function rsLoad(force){
  if(RS.loading||!SESS)return;
  if(!force&&Date.now()-RS.loadedAt<15000)return;
  RS.loading=1;
  try{
    const j=await rsFn('listar'),novo={},prontos=[];let mudou=0;
    for(const it of j.itens||[]){
      const ant=RS.jobs[it.book_id],mesmo=ant&&ant.id===it.id,item=Object.assign({},mesmo?ant:{},it);
      if(it.status==='concluido'&&(!item.resultado||(mesmo&&ant.concluido!==it.concluido))){
        try{item.resultado=(await rsFn('obter',{id:it.id})).item.resultado}catch(e){}
      }
      if(mesmo&&rsPend(ant)&&it.status==='concluido')prontos.push(it);
      if(!mesmo||ant.status!==it.status)mudou=1;
      novo[it.book_id]=item;
    }
    if(Object.keys(RS.jobs).some(k=>!novo[k]))mudou=1;
    RS.jobs=novo;ls.set('diario-rs',novo);RS.err='';RS.loadedAt=Date.now();
    prontos.forEach(it=>{if(window.toast)toast('📖 Resumo concluído: '+it.titulo,4000)});
    if(mudou)rsRefresh();
  }catch(e){RS.err=e.message}
  RS.loading=0;rsPoll();
}
function rsPoll(){
  const pend=Object.values(RS.jobs).some(rsPend);
  if(pend&&!RS.poll)RS.poll=setInterval(()=>{if(!document.hidden)rsLoad(true)},6000);
  if(!pend&&RS.poll){clearInterval(RS.poll);RS.poll=null}
  if(pend&&!RS.clock)RS.clock=setInterval(()=>{document.querySelectorAll('[data-rs-t]').forEach(e=>{e.textContent=rsMin(e.dataset.rsT)})},1000);
  if(!pend&&RS.clock){clearInterval(RS.clock);RS.clock=null}
}

const rsPdfErro=f=>!f?'':(!(f.type==='application/pdf'||/\.pdf$/i.test(f.name))?'Envie um arquivo PDF.':f.size<=0?'O PDF está vazio.':f.size>RS_MAX?'O PDF passa de 50 MB ('+(f.size/1048576).toFixed(1).replace('.',',')+' MB). Escolha um arquivo menor.':'');
function rsUpload(file,b,onp){
  return new Promise((ok,fail)=>{
    const c=cfg();if(!c)return fail(new Error('Configure o Supabase na aba Conta.'));
    tok().then(()=>{
      const path=SESS.uid+'/'+b.id+'-'+Date.now()+'.pdf',x=new XMLHttpRequest();
      x.open('POST',c.url+'/storage/v1/object/livros/'+path);
      x.setRequestHeader('apikey',c.key);x.setRequestHeader('Authorization','Bearer '+SESS.at);x.setRequestHeader('Content-Type','application/pdf');x.setRequestHeader('x-upsert','false');
      x.timeout=10*60e3;
      x.upload.onprogress=e=>{if(e.lengthComputable&&onp)onp(Math.round(e.loaded/e.total*100))};
      x.onload=()=>{if(x.status>=200&&x.status<300)return ok(path);let m='';try{m=JSON.parse(x.responseText).message||''}catch(e){}fail(new Error(x.status===413?'O PDF passa do limite de envio do servidor (50 MB).':m||'Não consegui enviar o PDF (erro '+x.status+').'))};
      x.onerror=()=>fail(new Error('Falha de rede no envio do PDF. Tente de novo.'));x.ontimeout=()=>fail(new Error('O envio do PDF demorou demais.'));
      x.send(file);
    }).catch(fail);
  });
}
function rsUpUi(id,p){
  document.querySelectorAll('[data-rs-up="'+id+'"]').forEach(e=>{e.textContent=p+'%'});
  document.querySelectorAll('[data-rs-upbar="'+id+'"]').forEach(e=>{e.style.width=p+'%'});
}

async function rsCriar(b,foco,file){
  RS.err='';
  try{
    let endpoint;
    try{const reg=await navigator.serviceWorker.ready,s=await reg.pushManager.getSubscription();endpoint=s&&s.endpoint}catch(e){}
    let arquivo;
    if(file){
      const er=rsPdfErro(file);if(er)throw new Error(er);
      RS.up[b.id]={p:0};rsRefresh();
      try{arquivo=await rsUpload(file,b,p=>{RS.up[b.id].p=p;rsUpUi(b.id,p)})}finally{delete RS.up[b.id]}
    }
    const j=await rsFn('criar',{book_id:b.id,titulo:b.t,autor:b.a||'',foco:foco||'',endpoint,arquivo});
    const agora=new Date().toISOString();
    RS.jobs[b.id]={id:j.id,book_id:b.id,titulo:b.t,autor:b.a||'',status:j.status||'na_fila',criado:agora,atualizado:agora};
    ls.set('diario-rs',RS.jobs);
    if(window.toast)toast('Resumo na fila. Pode sair da tela, avisamos quando terminar.',3500);
  }catch(e){RS.err=e.message;if(window.toast)toast(e.message,4500)}
  rsRefresh();rsPoll();
}

const rsPushHint=()=>typeof Notification!=='undefined'&&Notification.permission==='granted'?'Você também recebe uma notificação quando terminar.':'Quer ser avisado com o app fechado? Ative em Mercado → Alertas.';
function rsView(b,j){
  const r=j.resultado;
  if(!r)return '<div class="sm mut" style="margin:6px 0">Carregando o resumo…</div>';
  const sec=(t,h,open)=>`<details class="rs-sec"${open?' open':''}><summary><b>${t}</b></summary><div class="sm" style="margin-top:6px;line-height:1.55">${h}</div></details>`;
  const P=a=>(a||[]).map(x=>`<p style="margin:6px 0">${esc(x)}</p>`).join('');
  const L=(a,k1,k2)=>(a||[]).map(x=>`<div style="margin:8px 0"><b>${esc(x[k1])}</b><div>${esc(x[k2])}</div></div>`).join('');
  const cor={alta:'var(--g)','média':'#d9a400',baixa:'var(--r)'}[r.confianca]||'var(--mut)';
  const dt=j.concluido?new Date(j.concluido).toLocaleDateString('pt-BR'):'';
  return `<div class="sm mut" style="margin-top:4px">${esc(r.autor||b.a||'')}${r.ano_publicacao&&r.ano_publicacao!=='sem dado'?' · '+esc(r.ano_publicacao):''}${r.tema?' · '+esc(r.tema):''}</div>
<div class="sm" style="margin:6px 0">Confiança da IA: <b style="color:${cor}">${esc(r.confianca)}</b>${r.nota_confianca?' · '+esc(r.nota_confianca):''}</div>
${r.tese_central?`<div class="card" style="margin:8px 0"><div class="sm mut">Tese central</div><div style="margin-top:2px">${esc(r.tese_central)}</div></div>`:''}
${r.resumo_executivo.length?sec('📄 Resumo executivo',P(r.resumo_executivo),1):''}
${r.ideias_principais.length?sec('💡 Ideias principais ('+r.ideias_principais.length+')',L(r.ideias_principais,'titulo','explicacao')):''}
${r.estrutura.length?sec('🗂️ Estrutura do livro',L(r.estrutura,'parte','resumo')):''}
${r.conceitos_chave.length?sec('🔑 Conceitos-chave',L(r.conceitos_chave,'termo','definicao')):''}
${r.aplicacao_no_trading.length?sec('🎯 Como aplicar no trading',L(r.aplicacao_no_trading,'ideia','como_aplicar')):''}
${r.criticas_e_limites.length?sec('⚖️ Críticas e limites',P(r.criticas_e_limites)):''}
${r.para_quem_e?sec('👤 Para quem é',P([r.para_quem_e])):''}
${r.perguntas_de_revisao.length?sec('❓ Perguntas de revisão','<ol style="margin:6px 0;padding-left:20px">'+r.perguntas_de_revisao.map(x=>`<li style="margin:4px 0">${esc(x)}</li>`).join('')+'</ol>'):''}
${r.fontes_consultadas.length?sec('🔗 Fontes consultadas',P(r.fontes_consultadas)):''}
<div class="sm mut" style="margin:8px 0">${r.origem==='pdf'?'Baseado no PDF que você enviou.':'Baseado no conhecimento do modelo e em busca na web, sem leitura do livro.'} Gerado por IA${dt?' em '+dt:''}. Pode haver imprecisões, confira no livro.</div>
<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" data-rs="note" data-id="${b.id}">📝 Salvar nas anotações</button><button class="btn s" data-rs="again" data-id="${b.id}">Gerar de novo</button><button class="btn s" data-rs="del" data-id="${b.id}">Apagar</button></div>`;
}
function rsCard(b){
  const j=RS.jobs[b.id];
  let h='<div class="card" id="rs-card" style="margin:10px 0"><div class="top"><b>✨ Resumo com IA</b>'+(j?`<span class="sm">${rsChip(j)}</span>`:'')+'</div>';
  if(!SESS)h+='<div class="sm mut" style="margin-top:6px">Entre na sua conta (Mais → Conta) para gerar resumos.</div>';
  else if(RS.up[b.id])h+=`<div class="sm" style="margin:8px 0 6px">⬆️ Enviando o PDF… <b data-rs-up="${b.id}">${RS.up[b.id].p}%</b></div><div style="height:4px;border-radius:2px;background:var(--bd);overflow:hidden"><div data-rs-upbar="${b.id}" style="height:100%;width:${RS.up[b.id].p}%;background:var(--ac)"></div></div><div class="sm mut" style="margin-top:6px">Mantenha o app aberto até o envio terminar. Depois pode sair da tela.</div>`;
  else if(!j)h+=`<div class="sm mut" style="margin:6px 0 8px">O Gemini usa o que conhece do livro (e busca na web) para montar um resumo detalhado aqui. Leva de 30 s a 2 min e roda em segundo plano: pode sair da tela.</div><label>Foco (opcional)<input id="rsfoco" placeholder="ex.: gestão de risco e psicologia"></label><label>📎 PDF do livro (opcional, até 50 MB)<input type="file" id="rspdf2" accept="application/pdf,.pdf"></label><div class="sm mut">Com o PDF o resumo é feito a partir do texto real do livro. O arquivo é enviado ao Gemini (Google) e apagado do seu armazenamento assim que o resumo fica pronto.</div><button class="btn" style="margin-top:8px" data-rs="gen" data-id="${b.id}">✨ Gerar resumo</button>`;
  else if(rsPend(j))h+=`<div class="sm" style="margin:8px 0 6px">${j.status==='na_fila'?'Na fila…':'Gerando o resumo…'} <b data-rs-t="${esc(j.criado)}">${rsMin(j.criado)}</b></div><div style="height:4px;border-radius:2px;background:var(--bd);overflow:hidden"><div class="rs-bar"></div></div><div class="sm mut" style="margin-top:6px">Pode sair desta tela. ${rsPushHint()}</div>${rsParado(j)?`<button class="btn s" style="margin-top:8px" data-rs="retry" data-id="${b.id}">Parece travado: tentar de novo</button>`:''}`;
  else if(j.status==='erro')h+=`<div class="warn" style="margin:8px 0">${esc(j.erro||'Não consegui gerar o resumo.')}</div><div style="display:flex;gap:6px"><button class="btn" data-rs="retry" data-id="${b.id}">Tentar de novo</button><button class="btn s" data-rs="del" data-id="${b.id}">Descartar</button></div>`;
  else h+=rsView(b,j);
  return h+(RS.err?`<div class="sm mut" style="margin-top:6px">${esc(RS.err)}</div>`:'')+'</div>';
}
function rsNote(b){
  const j=RS.jobs[b.id],r=j&&j.resultado;if(!r)return;
  const x=['Tese central: '+r.tese_central,'','Ideias principais:',...r.ideias_principais.map((i,n)=>(n+1)+'. '+i.titulo+': '+i.explicacao),'','Como aplicar no trading:',...r.aplicacao_no_trading.map(a=>'• '+a.ideia+': '+a.como_aplicar)].join('\n');
  (b.notes??=[]).unshift({id:uid(),t:'Resumo (IA): '+(r.titulo||b.t),p:'',x,u:Date.now()});
  save();render();if(window.toast)toast('Anotação criada com os pontos principais');
}

(function(){
  const st=document.createElement('style');
  st.textContent='.rs-sec{border-top:1px solid var(--bd);padding:8px 0}.rs-sec summary{cursor:pointer}.rs-bar{height:100%;width:40%;background:var(--ac);border-radius:2px;animation:rsb 1.3s ease-in-out infinite}@keyframes rsb{0%{margin-left:-40%}100%{margin-left:100%}}@media (prefers-reduced-motion: reduce){.rs-bar{animation:none;width:100%}}';
  document.head.appendChild(st);

  const e0=vEstudos;
  vEstudos=function(){
    let h=e0();
    const btn='<button class="btn" style="margin-top:10px" data-a="addbook">+ Adicionar livro</button>';
    if(h.includes(btn))h=h.replace(btn,()=>`<label style="margin-top:8px">📎 PDF do livro (opcional, até 50 MB)<input type="file" id="rspdf" accept="application/pdf,.pdf"></label><label class="ck" style="margin-top:8px"><input type="checkbox" id="rsauto"${RS.auto?' checked':''}><span>✨ Gerar resumo com IA ao adicionar</span></label>`+btn);
    (S.books||[]).forEach(b=>{
      const j=RS.jobs[b.id];if(!j)return;
      const a=h.indexOf('data-a="openbook" data-id="'+b.id+'"');if(a<0)return;
      const fim=h.indexOf('</div></div></div>',a);if(fim<0)return;
      const chip=`<div class="sm" style="margin-top:2px">${rsChip(j)}</div>`;
      h=h.slice(0,fim+6)+chip+h.slice(fim+6);
    });
    const pend=Object.values(RS.jobs).filter(rsPend);
    if(pend.length){
      const m='<div class="card"><div class="g2"><label>Livro';
      if(h.includes(m))h=h.replace(m,()=>`<div class="card" style="margin-bottom:8px"><b>⏳ Gerando resumo${pend.length>1?'s':''}</b>${pend.map(j=>`<div class="sm" style="margin-top:4px">${esc(j.titulo)} · <b data-rs-t="${esc(j.criado)}">${rsMin(j.criado)}</b></div>`).join('')}<div class="sm mut" style="margin-top:4px">Pode sair da tela. ${rsPushHint()}</div></div>`+m);
    }
    return h;
  };
  const l0=vLivro;
  vLivro=function(){
    const h=l0(),b=(S.books||[]).find(x=>x.id===BID);
    if(!b)return h;
    const m='</select></label>',i=h.indexOf(m);
    return i<0?h:h.slice(0,i+m.length)+rsCard(b)+h.slice(i+m.length);
  };
  const r6=render0;
  render0=function(){
    r6();
    if(!RS.started&&SESS){RS.started=1;rsLoad(true)}
    if(rsTela()){rsLoad(false);rsPoll()}
  };
  /* ao adicionar um livro com a opção marcada, o pedido do resumo sai junto (captura: lê os campos antes de a tela redesenhar) */
  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-a="addbook"]');if(!a)return;
    const v=id=>((document.getElementById(id)||{}).value||'').trim(),cb=document.getElementById('rsauto'),t=v('bt'),au=v('ba');
    const fi=document.getElementById('rspdf'),file=fi&&fi.files&&fi.files[0]||null;
    if(cb){RS.auto=cb.checked;ls.set('diario-rs-auto',RS.auto)}
    if(!t||!(file||(cb&&cb.checked)))return;
    const er=rsPdfErro(file);if(er){if(window.toast)toast(er+' O livro foi adicionado sem resumo.',5000);return}
    setTimeout(()=>{const nb=(S.books||[]).find(x=>x.t===t&&(x.a||'')===au&&Date.now()-(x.u||0)<5000);if(nb)rsCriar(nb,'',file)},60);
  },true);
  document.addEventListener('click',async e=>{
    const x=e.target.closest('[data-rs]');if(!x)return;
    const b=(S.books||[]).find(k=>k.id===x.dataset.id);if(!b)return;
    const j=RS.jobs[b.id],k=x.dataset.rs;
    if(k==='gen'){const fi=document.getElementById('rspdf2'),file=fi&&fi.files&&fi.files[0]||null,er=rsPdfErro(file);if(er){if(window.toast)toast(er,5000);return}rsCriar(b,((document.getElementById('rsfoco')||{}).value||'').trim(),file)}
    else if(k==='again'){if(confirm('Gerar um novo resumo? O atual será substituído.'))rsCriar(b,'')}
    else if(k==='note')rsNote(b);
    else if(k==='retry'&&j){try{await rsFn('retomar',{id:j.id});j.status='na_fila';j.atualizado=new Date().toISOString();j.erro=null;ls.set('diario-rs',RS.jobs)}catch(err){if(window.toast)toast(err.message,4000)}rsRefresh();rsPoll()}
    else if(k==='del'&&j){if(!confirm('Apagar este resumo?'))return;try{await rsFn('apagar',{id:j.id})}catch(err){}delete RS.jobs[b.id];ls.set('diario-rs',RS.jobs);rsRefresh()}
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&SESS&&Object.values(RS.jobs).some(rsPend))rsLoad(true)});
})();

/* ==== ESTUDOS2:INICIO ==== Meus prompts, resumo completo (100+ páginas), leitor, PDF e prompts extras */
var ESV='liv',RSNEXT=null;
const RS_PAGS=[100,150,200],RS_PPAG=400;
RS.full=RS.full||{};RS.extraBusy={};RS.fullTry={};
/* modelos prontos: servem como instrução na hora de gerar ou como prompt extra sobre um resumo pronto */
const RSP0=[
  ['Regras para o meu plano','Transforme as ideias do livro em regras objetivas que eu possa colocar no meu plano de trading: quando entrar, quando não operar, onde colocar o stop, como dimensionar a posição e quando sair. Para cada regra, diga de qual capítulo ela vem.'],
  ['Checklist pré-operação','Monte um checklist de 10 a 15 itens para eu revisar antes de cada operação, baseado no livro. Itens curtos, de marcar sim ou não.'],
  ['Flashcards','Crie 30 flashcards (pergunta e resposta curtas) com os conceitos mais importantes, do básico ao avançado.'],
  ['Questões de prova','Crie 15 questões de múltipla escolha (4 alternativas) com gabarito comentado, cobrindo os principais conceitos.'],
  ['Explicar simples','Explique os 10 conceitos mais difíceis em linguagem simples, cada um com um exemplo prático de day trade no mini índice (WIN).'],
  ['Plano de estudo','Monte um plano de estudo de 4 semanas para eu dominar este conteúdo, com metas por semana e exercícios práticos para fazer no meu diário de trades.'],
  ['Erros que o livro evita','Liste os erros de trader que o livro ajuda a evitar e, para cada um, o sinal de alerta e o que fazer no momento.'],
];
const rspLista=()=>((S.ax||{}).rsp||[]).filter(p=>p&&p.id);
const rspSet=a=>{(S.ax??={}).rsp=a;save()};
const rspPref=(k,d)=>{const v=(S.ax||{})['rs.'+k];return v==null?d:v};
const rspSetPref=(k,v)=>{(S.ax??={})['rs.'+k]=v;save()};
/* valor do seletor -> texto do prompt */
function rspTexto(v){if(!v)return '';if(v.startsWith('u:')){const p=rspLista().find(x=>x.id===v.slice(2));return p?p.x:''}if(v.startsWith('m:')){const m=RSP0[+v.slice(2)];return m?m[1]:''}return ''}
function rspOpts(sel,vazio){
  const u=rspLista();
  return `<option value="">${esc(vazio||'Nenhum (prompt padrão do app)')}</option>${u.length?`<optgroup label="Meus prompts">${u.map(p=>`<option value="u:${p.id}"${sel==='u:'+p.id?' selected':''}>${esc(p.n||'Sem nome')}</option>`).join('')}</optgroup>`:''}<optgroup label="Modelos prontos">${RSP0.map((m,i)=>`<option value="m:${i}"${sel==='m:'+i?' selected':''}>${esc(m[0])}</option>`).join('')}</optgroup>`;
}
const rsPagTxt=n=>'≈ '+(n||0).toLocaleString('pt-BR')+' página'+(n===1?'':'s');

/* ---------- markdown simples e seguro (escapa tudo antes) ---------- */
function mdHtml(md){
  const inl=x=>esc(x).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\*)/g,'$1<i>$2</i>').replace(/`([^`]+)`/g,'<code>$1</code>');
  const L=String(md||'').replace(/\r/g,'').split('\n');let h='',lst=null,para=[];
  const fp=()=>{if(para.length){h+='<p>'+inl(para.join(' '))+'</p>';para=[]}},fl=()=>{if(lst){h+='</'+lst+'>';lst=null}};
  for(const ln of L){let m;
    if(!ln.trim()){fp();fl();continue}
    if((m=ln.match(/^(#{1,5})\s+(.*)/))){fp();fl();const n=Math.min(5,m[1].length+1);h+=`<h${n}>${inl(m[2])}</h${n}>`;continue}
    if((m=ln.match(/^\s*[-*•]\s+(.*)/))){fp();if(lst!=='ul'){fl();h+='<ul>';lst='ul'}h+='<li>'+inl(m[1])+'</li>';continue}
    if((m=ln.match(/^\s*\d+[.)]\s+(.*)/))){fp();if(lst!=='ol'){fl();h+='<ol>';lst='ol'}h+='<li>'+inl(m[1])+'</li>';continue}
    if((m=ln.match(/^>\s?(.*)/))){fp();fl();h+='<blockquote>'+inl(m[1])+'</blockquote>';continue}
    if(/^\s*(-{3,}|\*{3,})\s*$/.test(ln)){fp();fl();h+='<hr>';continue}
    fl();para.push(ln.trim());
  }
  fp();fl();return h;
}

/* ---------- dados completos (partes e extras) só em memória: não cabem no armazenamento do aparelho ---------- */
async function rsFull(b,force){
  const j=RS.jobs[b.id];if(!j)return null;
  const f=RS.full[b.id];
  if(f&&f.id===j.id&&!force&&f.at>Date.parse(j.atualizado||0)-1)return f;
  if(RS.fullBusy)return f||null;
  RS.fullBusy=1;
  try{const it=(await rsFn('obter',{id:j.id})).item;RS.full[b.id]={id:it.id,at:Date.now(),longo:it.longo,extras:it.extras||[],prompt:it.prompt||'',resultado:it.resultado};return RS.full[b.id]}
  catch(e){if(window.toast)toast(e.message,4000);return f||null}
  finally{RS.fullBusy=0}
}
const rsPartes=f=>((f&&f.longo&&f.longo.partes)||[]).filter(p=>p.texto);
const rsLidas=b=>((S.ax||{})['rsl.'+b.id]||[]);

/* ---------- lista: também redesenha quando o andamento do resumo completo muda ---------- */
rsLoad=async function(force){
  if(RS.loading||!SESS)return;
  if(!force&&Date.now()-RS.loadedAt<15000)return;
  RS.loading=1;
  try{
    const j=await rsFn('listar'),novo={},prontos=[];let mudou=0;
    for(const it of j.itens||[]){
      const ant=RS.jobs[it.book_id],mesmo=ant&&ant.id===it.id,item=Object.assign({},mesmo?ant:{},it);
      if(it.status==='concluido'&&(!item.resultado||(mesmo&&ant.concluido!==it.concluido))){
        try{item.resultado=(await rsFn('obter',{id:it.id})).item.resultado}catch(e){}
      }
      if(mesmo&&rsPend(ant)&&it.status==='concluido')prontos.push(it);
      if(!mesmo||ant.status!==it.status||JSON.stringify(ant.progresso||null)!==JSON.stringify(it.progresso||null))mudou=1;
      novo[it.book_id]=item;
    }
    if(Object.keys(RS.jobs).some(k=>!novo[k]))mudou=1;
    RS.jobs=novo;ls.set('diario-rs',novo);RS.err='';RS.loadedAt=Date.now();
    prontos.forEach(it=>{delete RS.full[it.book_id];if(window.toast)toast((it.modo==='completo'?'📚 Resumo completo pronto: ':'📖 Resumo concluído: ')+it.titulo,4000)});
    if(mudou)rsRefresh();
  }catch(e){RS.err=e.message}
  RS.loading=0;rsPoll();
};

/* ---------- pedir um resumo (modo, páginas e prompt) ---------- */
rsCriar=async function(b,foco,file,o){
  o=o||RSNEXT||{modo:rspPref('modo','padrao'),paginas:rspPref('pag',100),prompt:rspTexto(rspPref('def',''))};RSNEXT=null;
  RS.err='';
  try{
    if(o.modo==='completo'&&!file)throw new Error('O resumo completo (100+ páginas) é feito a partir do PDF: anexe o arquivo do livro.');
    let endpoint;
    try{const reg=await navigator.serviceWorker.ready,s=await reg.pushManager.getSubscription();endpoint=s&&s.endpoint}catch(e){}
    let arquivo;
    if(file){
      const er=rsPdfErro(file);if(er)throw new Error(er);
      RS.up[b.id]={p:0};rsRefresh();
      try{arquivo=await rsUpload(file,b,p=>{RS.up[b.id].p=p;rsUpUi(b.id,p)})}finally{delete RS.up[b.id]}
    }
    const j=await rsFn('criar',{book_id:b.id,titulo:b.t,autor:b.a||'',foco:foco||'',endpoint,arquivo,modo:o.modo,paginas:o.paginas,prompt:o.prompt||''});
    const agora=new Date().toISOString();
    RS.jobs[b.id]={id:j.id,book_id:b.id,titulo:b.t,autor:b.a||'',status:j.status||'na_fila',criado:agora,atualizado:agora,modo:o.modo,paginas:o.modo==='completo'?o.paginas:null,progresso:null};
    delete RS.full[b.id];
    ls.set('diario-rs',RS.jobs);
    if(window.toast)toast(o.modo==='completo'?'Resumo completo na fila: leva de 15 a 40 min. Pode fechar o app, avisamos quando terminar.':'Resumo na fila. Pode sair da tela, avisamos quando terminar.',4500);
  }catch(e){RS.err=e.message;if(window.toast)toast(e.message,4500)}
  rsRefresh();rsPoll();
};

/* ---------- formulário de pedido ---------- */
function rsForm(b){
  const modo=rspPref('modo','padrao'),pag=rspPref('pag',100),def=rspPref('def','');
  return `<div class="sm mut" style="margin:6px 0 8px">Escolha o tipo de resumo. Tudo roda em segundo plano: pode sair da tela.</div>
<div class="seg" style="margin-bottom:8px"><button class="${modo==='padrao'?'on':''}" data-ep="modo" data-id="padrao">📄 Padrão</button><button class="${modo==='completo'?'on':''}" data-ep="modo" data-id="completo">📚 Completo</button></div>
${modo==='completo'?`<div class="card" style="margin:0 0 8px;background:var(--bg)"><div class="sm"><b>Resumo completo, capítulo a capítulo</b>, com no mínimo:</div><div class="seg" style="margin:6px 0">${RS_PAGS.map(n=>`<button class="${+pag===n?'on':''}" data-ep="pag" data-id="${n}">${n} pág.</button>`).join('')}</div><div class="sm mut">Feito a partir do <b>PDF</b> (obrigatório). O Gemini lê o sumário, faz o resumo geral e escreve cada capítulo em profundidade, com páginas citadas, pontos-chave e aplicação no trading. Leva de 15 a 40 min e usa várias chamadas ao Gemini (custa mais que o padrão). Página = A4, fonte 12, ~${RS_PPAG} palavras.</div></div>`:`<div class="sm mut" style="margin-bottom:8px">Resumo estruturado (tese, ideias, conceitos, aplicação no trading, perguntas). 30 s a 2 min. Com PDF usa o texto real do livro; sem PDF usa o que o Gemini conhece do livro.</div>`}
<label>🧩 Prompt (opcional)<select id="rspsel">${rspOpts(def)}</select></label>
<textarea id="rsptx" rows="3" placeholder="Escreva aqui o que você quer além do padrão (ex.: foque em gestão de risco e traga exemplos com mini índice)" style="width:100%;margin-top:4px">${esc(rspTexto(def))}</textarea>
<div class="sm mut" style="margin-bottom:6px">Seus prompts ficam em Estudos → 🧩 Meus prompts. As regras de fidelidade ao livro continuam valendo.</div>
<label>Foco (opcional)<input id="rsfoco" placeholder="ex.: gestão de risco e psicologia"></label>
<label>📎 PDF do livro ${modo==='completo'?'<b>(obrigatório)</b>':'(opcional)'}, até 50 MB<input type="file" id="rspdf2" accept="application/pdf,.pdf"></label>
<div class="sm mut">O arquivo vai para o Gemini (Google) e é apagado do seu armazenamento e do Gemini assim que o resumo fica pronto.</div>
<button class="btn" style="margin-top:8px;width:100%" data-ep="gen" data-id="${b.id}">✨ Gerar ${modo==='completo'?'resumo completo (mín. '+pag+' páginas)':'resumo'}</button>`;
}

/* ---------- andamento do resumo completo ---------- */
function rsAndamento(b,j){
  const p=j.progresso||{},meta=p.meta_paginas||j.paginas||100,tot=(p.partes||0)+2,feitas=(p.prontas||0)+(p.geral?1:0)+(p.partes?1:0);
  const pct=Math.min(99,Math.round(feitas/Math.max(tot,3)*100));
  const et=!p.partes?'Lendo o sumário do livro…':!p.geral?'Fazendo o resumo geral…':p.etapa==='parte'?`Escrevendo a parte ${p.parte} de ${p.partes}…`:p.etapa==='fim'?'Finalizando…':'Na fila…';
  const rest=p.partes?Math.max(1,Math.round((p.partes-(p.prontas||0))*1.5)):null;
  return `<div class="sm" style="margin:8px 0 4px"><b>${et}</b> <span class="mut">· <b data-rs-t="${esc(j.criado)}">${rsMin(j.criado)}</b></span></div>
<div style="height:6px;border-radius:3px;background:var(--bd);overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--ac);transition:width .4s"></div></div>
<div class="sm mut" style="margin-top:6px">${p.palavras?(p.palavras.toLocaleString('pt-BR')+' palavras · '+rsPagTxt(p.paginas)+' de '+meta):'Meta: '+meta+' páginas'}${rest?' · faltam ~'+rest+' min':''}</div>
${j.erro?`<div class="sm" style="margin-top:4px;color:#d9a400">Tentando de novo: ${esc(j.erro)}</div>`:''}
${p.prontas?`<button class="btn s" style="margin-top:8px" data-ep="ler" data-id="${b.id}">📖 Ler o que já está pronto (${p.prontas} parte${p.prontas>1?'s':''})</button>`:''}
<div class="sm mut" style="margin-top:6px">Pode fechar o app. ${rsPushHint()}</div>`;
}

/* ---------- resultado: resumo completo + prompts extras ---------- */
function rsCompletoCard(b,j){
  const r=j.resultado||{},c=r.completo,f=RS.full[b.id],lid=rsLidas(b).length;
  if(!c&&j.modo!=='completo')return '';
  const n=c?c.partes:rsPartes(f).length;
  return `<div class="card" style="margin:10px 0;border:1px solid var(--ac)"><div class="top"><b>📚 Resumo completo</b><span class="sm mut">${c?n+' partes · '+rsPagTxt(c.paginas):''}</span></div>
${c?`<div class="sm mut" style="margin:4px 0">${c.palavras.toLocaleString('pt-BR')} palavras · meta ${c.meta_paginas} páginas${lid?' · '+lid+'/'+n+' partes lidas':''}</div>`:''}
<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button class="btn" data-ep="ler" data-id="${b.id}">📖 Ler</button><button class="btn s" data-ep="pdf" data-id="${b.id}">🖨️ Salvar em PDF</button><button class="btn s" data-ep="md" data-id="${b.id}">⬇️ Baixar texto (.md)</button></div></div>`;
}
function rsExtrasCard(b,j){
  const f=RS.full[b.id],ex=((f&&f.extras)||[]).filter(x=>x.tipo!=='quiz'),busy=RS.extraBusy[b.id];
  return `<div class="card" style="margin:10px 0"><div class="top"><b>🧩 Perguntar ao resumo</b></div>
<div class="sm mut" style="margin:4px 0 6px">Rode um prompt seu (ou um modelo) em cima deste resumo: flashcards, checklist, regras para o seu plano…</div>
<select id="rsxsel">${rspOpts('','Escrever agora…')}</select>
<textarea id="rsxtx" rows="3" placeholder="Ex.: crie um checklist pré-operação com base no livro" style="width:100%;margin-top:4px"></textarea>
<button class="btn" style="margin-top:6px;width:100%" data-ep="extra" data-id="${b.id}"${busy?' disabled':''}>${busy?'⏳ Gerando… (até 2 min)':'▶️ Rodar prompt'}</button>
${f?ex.map(x=>`<details class="rs-sec"><summary><b>${esc(x.titulo)}</b> <span class="sm mut">· ${new Date(x.criado).toLocaleDateString('pt-BR')}</span></summary><div class="sm mut" style="margin:6px 0;white-space:pre-wrap">${esc(x.prompt)}</div><div class="md">${mdHtml(x.texto)}</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button class="btn s" data-ep="xnote" data-id="${b.id}" data-x="${x.id}">📝 Salvar nas anotações</button><button class="btn s" data-ep="xcopy" data-id="${b.id}" data-x="${x.id}">📋 Copiar</button><button class="btn s d" data-ep="xdel" data-id="${b.id}" data-x="${x.id}">Apagar</button></div></details>`).join(''):`<button class="btn s" style="margin-top:8px" data-ep="carrega" data-id="${b.id}">Ver respostas anteriores</button>`}
</div>`;
}

rsCard=function(b){
  const j=RS.jobs[b.id];
  let h='<div class="card" id="rs-card" style="margin:10px 0"><div class="top"><b>✨ Resumo com IA</b>'+(j?`<span class="sm">${j.modo==='completo'&&rsPend(j)?'📚 Completo · ':''}${rsChip(j)}</span>`:'')+'</div>';
  if(!SESS)h+='<div class="sm mut" style="margin-top:6px">Entre na sua conta (Mais → Conta) para gerar resumos.</div>';
  else if(RS.up[b.id])h+=`<div class="sm" style="margin:8px 0 6px">⬆️ Enviando o PDF… <b data-rs-up="${b.id}">${RS.up[b.id].p}%</b></div><div style="height:4px;border-radius:2px;background:var(--bd);overflow:hidden"><div data-rs-upbar="${b.id}" style="height:100%;width:${RS.up[b.id].p}%;background:var(--ac)"></div></div><div class="sm mut" style="margin-top:6px">Mantenha o app aberto até o envio terminar. Depois pode sair da tela.</div>`;
  else if(!j||RS.novo===b.id)h+=rsForm(b)+(j?`<button class="btn s" style="margin-top:6px;width:100%" data-ep="cancnovo" data-id="${b.id}">Cancelar e voltar ao resumo atual</button>`:'');
  else if(rsPend(j))h+=(j.modo==='completo'?rsAndamento(b,j):`<div class="sm" style="margin:8px 0 6px">${j.status==='na_fila'?'Na fila…':'Gerando o resumo…'} <b data-rs-t="${esc(j.criado)}">${rsMin(j.criado)}</b></div><div style="height:4px;border-radius:2px;background:var(--bd);overflow:hidden"><div class="rs-bar"></div></div><div class="sm mut" style="margin-top:6px">Pode sair desta tela. ${rsPushHint()}</div>`)+(rsParado(j)?`<button class="btn s" style="margin-top:8px" data-rs="retry" data-id="${b.id}">Parece travado: tentar de novo</button>`:'');
  else if(j.status==='erro')h+=`<div class="warn" style="margin:8px 0">${esc(j.erro||'Não consegui gerar o resumo.')}</div>${j.progresso&&j.progresso.prontas?`<div class="sm mut" style="margin-bottom:6px">${j.progresso.prontas} de ${j.progresso.partes} partes já prontas (${rsPagTxt(j.progresso.paginas)}).</div>`:''}<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" data-rs="retry" data-id="${b.id}">${j.modo==='completo'?'Continuar de onde parou':'Tentar de novo'}</button>${j.progresso&&j.progresso.prontas?`<button class="btn s" data-ep="ler" data-id="${b.id}">📖 Ler o que ficou pronto</button>`:''}<button class="btn s" data-rs="del" data-id="${b.id}">Descartar</button></div>`;
  else h+=rsView(b,j);
  return h+(RS.err?`<div class="sm mut" style="margin-top:6px">${esc(RS.err)}</div>`:'')+'</div>'+(j&&j.status==='concluido'&&RS.novo!==b.id?rsCompletoCard(b,j)+rsExtrasCard(b,j):'');
};
/* "Gerar de novo" abre o formulário (com modo e prompt) em vez de repetir o pedido igual */
const rsView0=rsView;
rsView=function(b,j){return rsView0(b,j).replace(`data-rs="again" data-id="${b.id}"`,`data-ep="novo" data-id="${b.id}"`)};

/* ---------- leitor ---------- */
let RL=null;
function rlAbre(b,f,i){
  const ps=rsPartes(f);if(!ps.length){if(window.toast)toast('Ainda não há partes prontas.');return}
  RL={b,f,i:Math.max(0,Math.min(i||0,ps.length-1)),fs:+(ls.get('diario-rl-fs')||17)};
  let ov=document.getElementById('rl');
  if(!ov){ov=document.createElement('div');ov.id='rl';document.body.appendChild(ov)}
  rlDesenha();document.body.style.overflow='hidden';
}
function rlFecha(){const ov=document.getElementById('rl');if(ov)ov.remove();RL=null;document.body.style.overflow='';render()}
function rlDesenha(){
  if(!RL)return;const ov=document.getElementById('rl');if(!ov)return;
  const ps=rsPartes(RL.f),p=ps[RL.i],lid=rsLidas(RL.b),li=lid.includes(p.titulo);
  ov.innerHTML=`<div class="rl-top"><button class="btn s" data-rl="x">✕</button><select data-rl="sel" style="flex:1;min-width:0">${ps.map((x,k)=>`<option value="${k}"${k===RL.i?' selected':''}>${lid.includes(x.titulo)?'✓ ':''}${k+1}. ${esc(x.titulo)}</option>`).join('')}</select><button class="btn s" data-rl="a-">A−</button><button class="btn s" data-rl="a+">A+</button></div>
<div class="rl-body md" style="font-size:${RL.fs}px">${RL.i===0&&RL.f.resultado&&RL.f.resultado.tese_central?`<div class="card" style="margin-bottom:14px"><div class="sm mut">Tese central</div>${esc(RL.f.resultado.tese_central)}</div>`:''}${mdHtml(p.texto)}
<div class="sm mut" style="margin:18px 0 8px">${(p.palavras||0).toLocaleString('pt-BR')} palavras${p.paginas?' · p. '+esc(p.paginas)+' do PDF':''} · parte ${RL.i+1} de ${ps.length}</div>
<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:40px"><button class="btn s" data-rl="ant"${RL.i?'':' disabled'}>‹ Anterior</button><button class="btn ${li?'s':''}" data-rl="lida">${li?'✓ Lida':'Marcar como lida'}</button><button class="btn s" data-rl="prox"${RL.i<ps.length-1?'':' disabled'}>Próxima ›</button></div></div>`;
  const bd=ov.querySelector('.rl-body');if(bd)bd.scrollTop=0;
}
document.addEventListener('click',e=>{
  const x=e.target.closest('[data-rl]');if(!x||!RL)return;const k=x.dataset.rl,ps=rsPartes(RL.f);
  if(k==='x')return rlFecha();
  if(k==='ant'&&RL.i>0)RL.i--;
  else if(k==='prox'&&RL.i<ps.length-1)RL.i++;
  else if(k==='a+'||k==='a-'){RL.fs=Math.max(13,Math.min(24,RL.fs+(k==='a+'?1:-1)));ls.set('diario-rl-fs',RL.fs)}
  else if(k==='lida'){const t=ps[RL.i].titulo,a=rsLidas(RL.b).slice(),i=a.indexOf(t);i<0?a.push(t):a.splice(i,1);(S.ax??={})['rsl.'+RL.b.id]=a;save();if(i<0&&RL.i<ps.length-1){RL.i++}}
  else return;
  rlDesenha();
});
document.addEventListener('change',e=>{const s=e.target.closest('[data-rl="sel"]');if(s&&RL){RL.i=+s.value;rlDesenha()}});
document.addEventListener('keydown',e=>{if(!RL)return;if(e.key==='Escape')rlFecha();else if(e.key==='ArrowRight'){const ps=rsPartes(RL.f);if(RL.i<ps.length-1){RL.i++;rlDesenha()}}else if(e.key==='ArrowLeft'&&RL.i>0){RL.i--;rlDesenha()}});

/* ---------- exportar: PDF (impressão A4) e markdown ---------- */
function rsMd(b,f){
  const r=f.resultado||{},L=['# '+(r.titulo||b.t),(r.autor||b.a)?'*'+(r.autor||b.a)+'*':'',''];
  if(r.tese_central)L.push('## Tese central','',r.tese_central,'');
  if((r.resumo_executivo||[]).length)L.push('## Resumo executivo','',...r.resumo_executivo.flatMap(x=>[x,'']));
  if((r.ideias_principais||[]).length)L.push('## Ideias principais','',...r.ideias_principais.map((x,i)=>`${i+1}. **${x.titulo}**: ${x.explicacao}`),'');
  if((r.conceitos_chave||[]).length)L.push('## Conceitos-chave','',...r.conceitos_chave.map(x=>`- **${x.termo}**: ${x.definicao}`),'');
  if((r.aplicacao_no_trading||[]).length)L.push('## Como aplicar no trading','',...r.aplicacao_no_trading.map(x=>`- **${x.ideia}**: ${x.como_aplicar}`),'');
  const ps=rsPartes(f);
  if(ps.length)L.push('# Resumo capítulo a capítulo','',...ps.flatMap(p=>[p.texto,'']));
  if((r.perguntas_de_revisao||[]).length)L.push('## Perguntas de revisão','',...r.perguntas_de_revisao.map((x,i)=>`${i+1}. ${x}`),'');
  L.push('---','Resumo gerado por IA (Gemini) a partir do PDF. Pode haver imprecisões: confira no livro.');
  return L.join('\n');
}
const rsArq=(b,ext)=>String(b.t||'resumo').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,60)+'-resumo.'+ext;
function rsBaixa(nome,txt,tipo){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:tipo}));a.download=nome;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}
function rsHtmlImpressao(b,f){
  const r=f.resultado||{},ps=rsPartes(f),c=r.completo||{},hoje=new Date().toLocaleDateString('pt-BR');
  const geral=mdHtml(rsMd(b,{resultado:r,longo:null}).split('\n').slice(3).filter(x=>!/^---$|Resumo gerado por IA/.test(x)).join('\n'));
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(r.titulo||b.t)} — resumo</title><style>
@page{size:A4;margin:2.5cm 2.3cm}*{box-sizing:border-box}body{font:12pt/1.62 Georgia,'Times New Roman',serif;color:#111;margin:0}
.capa{height:24cm;display:flex;flex-direction:column;justify-content:center;text-align:center;page-break-after:always}.capa h1{font-size:30pt;margin:0 0 10px}.capa .a{font-size:15pt;color:#444}.capa .m{margin-top:40px;color:#666;font-size:10.5pt}
h1{font-size:20pt}h2{font-size:17pt;margin:0 0 10px;page-break-after:avoid}h3{font-size:13.5pt;margin:18px 0 6px;page-break-after:avoid}h4,h5{font-size:12pt;margin:14px 0 4px}
p{margin:0 0 9px;text-align:justify;orphans:3;widows:3}li{margin:3px 0}blockquote{margin:8px 0;padding-left:12px;border-left:3px solid #999;color:#333}
.parte{page-break-before:always}.sum li{margin:4px 0}.nota{font-size:9.5pt;color:#666;margin-top:30px}code{font-size:10.5pt}
@media screen{body{max-width:820px;margin:20px auto;padding:0 16px}}</style></head><body>
<div class="capa"><h1>${esc(r.titulo||b.t)}</h1><div class="a">${esc(r.autor||b.a||'')}</div><div class="m">Resumo capítulo a capítulo${c.paginas?' · '+rsPagTxt(c.paginas):''}<br>Gerado por IA em ${hoje} a partir do PDF</div></div>
<h2>Sumário</h2><ol class="sum"><li>Visão geral</li>${ps.map(p=>`<li>${esc(p.titulo)}</li>`).join('')}</ol>
<div class="parte"><h2>Visão geral</h2>${geral}</div>
${ps.map(p=>`<div class="parte">${mdHtml(p.texto)}</div>`).join('')}
<p class="nota">Resumo gerado por IA (Gemini) a partir do PDF enviado. Pode haver imprecisões: confira no livro.</p>
<script>window.onload=function(){setTimeout(function(){try{window.print()}catch(e){}},500)}<\/script></body></html>`;
}
function rsPdf(b,f){
  const h=rsHtmlImpressao(b,f);
  let w=null;try{w=window.open(URL.createObjectURL(new Blob([h],{type:'text/html'})),'_blank')}catch(e){}
  if(!w){rsBaixa(rsArq(b,'html'),h,'text/html');if(window.toast)toast('Baixei o arquivo .html: abra e use Imprimir → Salvar como PDF.',5000)}
  else if(window.toast)toast('Na tela de impressão, escolha "Salvar como PDF".',4000);
}

/* ---------- aba Meus prompts ---------- */
function vPrompts(){
  const u=rspLista(),def=rspPref('def','');
  return `<div class="card"><b>Prompt usado automaticamente</b><div class="sm mut" style="margin:4px 0 6px">Vale para os resumos gerados ao adicionar um livro. No livro você pode escolher outro na hora.</div><select data-ep="def">${rspOpts(def)}</select></div>
<div class="top" style="margin-top:12px"><h2 style="margin:0">Meus prompts (${u.length})</h2><button class="btn" data-ep="pnovo">+ Novo prompt</button></div>
${u.length?u.map(p=>`<div class="card"><div class="top"><input data-epn="${p.id}" value="${esc(p.n)}" placeholder="Nome do prompt" style="flex:1;font-weight:600"><button class="x" data-ep="pdel" data-id="${p.id}">✕</button></div><textarea data-epx="${p.id}" rows="4" placeholder="O que a IA deve fazer" style="width:100%;margin-top:6px">${esc(p.x)}</textarea><div class="sm mut">${(p.x||'').length}/4000 caracteres${def==='u:'+p.id?' · <b>usado automaticamente</b>':''}</div></div>`).join(''):'<p class="mut sm">Nenhum prompt ainda. Crie um ou copie um modelo abaixo.</p>'}
<h2 style="margin-top:16px">Modelos prontos</h2><div class="sm mut" style="margin-bottom:6px">Use direto no livro ou copie para editar do seu jeito.</div>
${RSP0.map((m,i)=>`<div class="card"><div class="top"><b>${esc(m[0])}</b><button class="btn s" data-ep="pcop" data-id="${i}">Copiar</button></div><div class="sm" style="margin-top:4px">${esc(m[1])}</div></div>`).join('')}
<div class="sm mut" style="margin:10px 0">Dica: o prompt muda foco, profundidade e estilo do resumo. Ele não desliga as regras de fidelidade ao livro (a IA não inventa capítulos nem citações).</div>`;
}

(function(){
  const st=document.createElement('style');
  st.textContent='#rl{position:fixed;inset:0;z-index:9999;background:var(--bg,#111);display:flex;flex-direction:column}#rl .rl-top{display:flex;gap:6px;align-items:center;padding:10px 12px;padding-top:max(10px,env(safe-area-inset-top));border-bottom:1px solid var(--bd)}#rl .rl-body{flex:1;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;overflow-wrap:anywhere;padding:16px;max-width:760px;width:100%;margin:0 auto;line-height:1.65;-webkit-overflow-scrolling:touch}.md h2{font-size:1.35em;margin:6px 0 10px}.md h3{font-size:1.12em;margin:18px 0 6px}.md h4,.md h5{font-size:1em;margin:14px 0 4px}.md p{margin:0 0 10px}.md ul,.md ol{padding-left:22px;margin:6px 0 10px}.md li{margin:3px 0}.md blockquote{margin:8px 0;padding-left:10px;border-left:3px solid var(--bd);opacity:.9}.md code{font-size:.92em;background:var(--bd);padding:0 4px;border-radius:4px}';
  document.head.appendChild(st);

  const e1=vEstudos;
  vEstudos=function(){
    const sg=`<div class="seg" style="margin:8px 0 10px"><button class="${ESV==='liv'?'on':''}" data-ep="esv" data-id="liv">📚 Livros</button><button class="${ESV==='pr'?'on':''}" data-ep="esv" data-id="pr">🧩 Meus prompts</button></div>`;
    if(ESV==='pr')return `<h1>Estudos</h1>${sg}${vPrompts()}`;
    let h=e1();
    h=h.replace('</p>','</p>'+sg);
    /* no cadastro do livro: tipo de resumo e prompt */
    const m='<span>✨ Gerar resumo com IA ao adicionar</span></label>';
    if(h.includes(m))h=h.replace(m,()=>m+`<div class="g2" style="margin-top:6px"><label>Tipo<select id="rsmodo0"><option value="padrao"${rspPref('modo','padrao')==='padrao'?' selected':''}>📄 Padrão</option>${RS_PAGS.map(n=>`<option value="c${n}"${rspPref('modo','padrao')==='completo'&&+rspPref('pag',100)===n?' selected':''}>📚 Completo · ${n} pág. (com PDF)</option>`).join('')}</select></label><label>Prompt<select id="rsp0">${rspOpts(rspPref('def',''))}</select></label></div>`);
    /* andamento do completo no chip da lista */
    (S.books||[]).forEach(b=>{const j=RS.jobs[b.id];if(!j||j.modo!=='completo'||!rsPend(j)||!j.progresso||!j.progresso.partes)return;const c=rsChip(j);h=h.replace(`<div class="sm" style="margin-top:2px">${c}</div>`,()=>`<div class="sm" style="margin-top:2px">📚 ${j.progresso.prontas}/${j.progresso.partes} partes · ${rsPagTxt(j.progresso.paginas)}</div>`)});
    return h;
  };

  /* lê tipo e prompt do cadastro antes do pedido sair (o pedido sai 60 ms depois, pelo bloco anterior) */
  document.addEventListener('click',e=>{
    if(!e.target.closest('[data-a="addbook"]'))return;
    const m=(document.getElementById('rsmodo0')||{}).value||'padrao',p=(document.getElementById('rsp0')||{}).value||'',fi=document.getElementById('rspdf'),file=fi&&fi.files&&fi.files[0];
    const completo=m[0]==='c'&&!!file;
    if(m[0]==='c'&&!file&&window.toast)toast('Resumo completo precisa do PDF: vou fazer o resumo padrão.',4500);
    RSNEXT={modo:completo?'completo':'padrao',paginas:completo?+m.slice(1):100,prompt:rspTexto(p)};
    setTimeout(()=>{RSNEXT=null},3000);
  },true);

  document.addEventListener('change',e=>{
    const t=e.target;
    if(t.id==='rspsel'){const x=document.getElementById('rsptx');if(x)x.value=rspTexto(t.value)}
    else if(t.id==='rsxsel'){const x=document.getElementById('rsxtx');if(x)x.value=rspTexto(t.value)}
    else if(t.dataset&&t.dataset.ep==='def'){rspSetPref('def',t.value);render()}
    else if(t.dataset&&t.dataset.epn){const a=rspLista().map(p=>p.id===t.dataset.epn?{...p,n:t.value.trim().slice(0,60),u:Date.now()}:p);rspSet(a)}
    else if(t.dataset&&t.dataset.epx){const a=rspLista().map(p=>p.id===t.dataset.epx?{...p,x:t.value.slice(0,4000),u:Date.now()}:p);rspSet(a);render()}
  });

  document.addEventListener('click',async e=>{
    const x=e.target.closest('[data-ep]');if(!x||x.tagName==='SELECT')return;
    const k=x.dataset.ep,id=x.dataset.id,b=(S.books||[]).find(q=>q.id===id);
    if(k==='esv'){ESV=id;render();scrollTo(0,0);return}
    if(k==='modo'){rspSetPref('modo',id);render();return}
    if(k==='pag'){rspSetPref('pag',+id);render();return}
    if(k==='pnovo'){rspSet([{id:uid(),n:'Novo prompt',x:'',u:Date.now()},...rspLista()]);render();setTimeout(()=>{const t=document.querySelector('[data-epx]');if(t)t.focus()},50);return}
    if(k==='pcop'){const m=RSP0[+id];rspSet([{id:uid(),n:m[0],x:m[1],u:Date.now()},...rspLista()]);if(window.toast)toast('Copiado para Meus prompts');render();return}
    if(k==='pdel'){if(!confirm('Apagar este prompt?'))return;rspSet(rspLista().filter(p=>p.id!==id));if(rspPref('def','')==='u:'+id)rspSetPref('def','');render();return}
    if(!b)return;
    const j=RS.jobs[b.id];
    if(k==='gen'){
      const fi=document.getElementById('rspdf2'),file=fi&&fi.files&&fi.files[0]||null,er=rsPdfErro(file);
      if(er){if(window.toast)toast(er,5000);return}
      const modo=rspPref('modo','padrao');
      if(modo==='completo'&&!file){if(window.toast)toast('Anexe o PDF do livro para o resumo completo.',4500);return}
      const prompt=((document.getElementById('rsptx')||{}).value||'').trim();
      if(j&&RS.novo===b.id&&!confirm('Gerar um novo resumo? O atual será substituído.'))return;
      RS.novo=null;
      rsCriar(b,((document.getElementById('rsfoco')||{}).value||'').trim(),file,{modo,paginas:+rspPref('pag',100),prompt});
    }
    else if(k==='novo'){RS.novo=b.id;render();const c=document.getElementById('rs-card');if(c)c.scrollIntoView({block:'start'})}
    else if(k==='cancnovo'){RS.novo=null;render()}
    else if(k==='ler'||k==='pdf'||k==='md'){
      x.disabled=true;const f=await rsFull(b,rsPend(j)||(j&&j.status==='erro'));x.disabled=false;if(!f)return;
      if(k==='ler')rlAbre(b,f,0);
      else if(k==='md')rsBaixa(rsArq(b,'md'),rsMd(b,f),'text/markdown');
      else rsPdf(b,f);
    }
    else if(k==='carrega'){await rsFull(b,1);render()}
    else if(k==='extra'){
      const pr=((document.getElementById('rsxtx')||{}).value||'').trim(),sel=document.getElementById('rsxsel');
      if(pr.length<3){if(window.toast)toast('Escreva o prompt ou escolha um modelo.');return}
      const nome=sel&&sel.value?sel.options[sel.selectedIndex].text:pr.slice(0,50);
      RS.extraBusy[b.id]=1;render();
      try{const r=await rsFn('extra',{id:j.id,titulo:nome,prompt:pr});const f=RS.full[b.id]||(await rsFull(b,1));if(f)f.extras=r.extras;if(window.toast)toast('Resposta pronta ✓')}
      catch(err){if(window.toast)toast(err.message,5000)}
      delete RS.extraBusy[b.id];render();
    }
    else if(k==='xdel'){if(!confirm('Apagar esta resposta?'))return;try{const r=await rsFn('extra_apagar',{id:j.id,eid:x.dataset.x});if(RS.full[b.id])RS.full[b.id].extras=r.extras}catch(err){if(window.toast)toast(err.message,4000)}render()}
    else if(k==='xnote'||k==='xcopy'){
      const it=((RS.full[b.id]||{}).extras||[]).find(q=>q.id===x.dataset.x);if(!it)return;
      if(k==='xcopy'){try{await navigator.clipboard.writeText(it.texto);if(window.toast)toast('Copiado')}catch(err){if(window.toast)toast('Não consegui copiar.')}}
      else{(b.notes??=[]).unshift({id:uid(),t:'IA: '+it.titulo,p:'',x:it.texto,u:Date.now()});save();render();if(window.toast)toast('Salvo nas anotações')}
    }
  });

  /* abre o leitor/carrega as respostas ao entrar num livro concluído */
  const l1=vLivro;
  vLivro=function(){
    const h=l1(),b=(S.books||[]).find(x=>x.id===BID),j=b&&RS.jobs[b.id];
    if(j&&j.status==='concluido'&&!RS.full[b.id]&&!RS.fullBusy&&SESS&&Date.now()-(RS.fullTry[b.id]||0)>60000&&(RS.fullTry[b.id]=Date.now()))setTimeout(()=>{rsFull(b).then(f=>{if(f&&tab==='livro'&&BID===b.id)rsRefresh()})},0);
    return h;
  };
})();
/* ==== ESTUDOS2:FIM ==== */
/* ==== SIMULADO:INICIO ==== perguntas de múltipla escolha sobre o resumo (fácil → difícil), respondidas no app */
var QZ={n:30,nivel:'progressivo',parte:-1,busy:{},run:null};
const QZ_NIV=['fácil','média','difícil'],QZ_COR={'fácil':'var(--g)','média':'#d9a400','difícil':'var(--r)'};
const qzLista=b=>(((RS.full[b.id]||{}).extras)||[]).filter(x=>x.tipo==='quiz');
const qzHist=b=>((S.ax||{})['rsq.'+b.id]||[]);
function qzStats(b,qid){const h=qzHist(b).filter(x=>x.q===qid&&!x.parcial);if(!h.length)return '';const best=h.reduce((a,x)=>x.a/x.t>a.a/a.t?x:a);return `Melhor: <b>${best.a}/${best.t}</b> · ${h.length} tentativa${h.length>1?'s':''}`}

function qzCard(b,j){
  const f=RS.full[b.id],ps=rsPartes(f),L=qzLista(b),busy=QZ.busy[b.id];
  const sg=(k,v,l)=>`<button class="${QZ[k]==v?'on':''}" data-qz="set" data-k="${k}" data-v="${v}" data-id="${b.id}">${l}</button>`;
  return `<div class="card" style="margin:10px 0"><div class="top"><b>🎯 Simulado</b>${L.length?`<span class="sm mut">${L.length} gerado${L.length>1?'s':''}</span>`:''}</div>
<div class="sm mut" style="margin:4px 0 8px">A IA monta perguntas de múltipla escolha a partir deste resumo, das mais leves às mais difíceis. Você responde aqui e vê a explicação de cada uma.</div>
<div class="sm" style="margin-bottom:4px">Quantidade</div><div class="seg" style="margin-bottom:8px">${sg('n',10,'10')}${sg('n',20,'20')}${sg('n',30,'30')}</div>
<div class="sm" style="margin-bottom:4px">Dificuldade</div><div class="seg" style="margin-bottom:8px">${sg('nivel','progressivo','Fácil → difícil')}${sg('nivel','dificil','Só difíceis')}</div>
${ps.length?`<label>Assunto<select data-qz="parte" data-id="${b.id}"><option value="-1">Livro inteiro</option>${ps.map((p,i)=>`<option value="${i}"${QZ.parte===i?' selected':''}>${esc(p.titulo)}</option>`).join('')}</select></label>`:''}
<button class="btn" style="width:100%;margin-top:8px" data-qz="gen" data-id="${b.id}"${busy?' disabled':''}>${busy?'⏳ Montando as perguntas… (até 2 min)':'✨ Gerar '+QZ.n+' perguntas'}</button>
${f?L.map(q=>`<div style="display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center;padding:8px 0;border-top:1px solid var(--bd);margin-top:8px"><div style="min-width:0"><div class="sm"><b>${esc(q.titulo)}</b></div><div class="sm mut">${new Date(q.criado).toLocaleDateString('pt-BR')}${qzStats(b,q.id)?' · '+qzStats(b,q.id):' · ainda não respondido'}</div></div><button class="btn" data-qz="play" data-id="${b.id}" data-q="${q.id}">▶️ Responder</button><button class="x" data-qz="del" data-id="${b.id}" data-q="${q.id}" aria-label="Apagar simulado">✕</button></div>`).join(''):`<button class="btn s" style="margin-top:8px" data-ep="carrega" data-id="${b.id}">Ver simulados anteriores</button>`}
</div>`;
}

/* ---------- tela de responder ---------- */
function qzAbre(b,quiz,ordem){
  QZ.run={b,quiz,ordem:ordem||quiz.perguntas.map((_,i)=>i),i:0,resp:{},parcial:!!ordem,fim:0};
  let ov=document.getElementById('qz');if(!ov){ov=document.createElement('div');ov.id='qz';document.body.appendChild(ov)}
  document.body.style.overflow='hidden';qzDesenha();
}
function qzFecha(){const ov=document.getElementById('qz');if(ov)ov.remove();QZ.run=null;document.body.style.overflow='';render()}
function qzResultado(){
  const R=QZ.run,P=R.quiz.perguntas,por={};let a=0;
  R.ordem.forEach(k=>{const q=P[k],ok=R.resp[k]===q.correta;por[q.nivel]=por[q.nivel]||[0,0];por[q.nivel][1]++;if(ok){por[q.nivel][0]++;a++}});
  return{a,t:R.ordem.length,por,erradas:R.ordem.filter(k=>R.resp[k]!==P[k].correta)};
}
function qzDesenha(){
  const R=QZ.run;if(!R)return;const ov=document.getElementById('qz');if(!ov)return;
  const P=R.quiz.perguntas,tot=R.ordem.length;
  if(R.fim){
    const r=qzResultado(),pc=Math.round(r.a/r.t*100),cor=pc>=80?'var(--g)':pc>=60?'#d9a400':'var(--r)';
    const msg=pc>=90?'Excelente, você domina o conteúdo.':pc>=70?'Bom resultado. Revise as que errou.':pc>=50?'Na média. Vale reler os capítulos das erradas.':'Releia o resumo e tente de novo daqui a alguns dias.';
    ov.innerHTML=`<div class="qz-top"><button class="btn s" data-qz="x">✕</button><b style="flex:1">Resultado</b></div><div class="qz-body">
<div style="text-align:center;margin:10px 0 16px"><div style="font-size:46px;font-weight:800;color:${cor}">${r.a}/${r.t}</div><div class="mut">${pc}% de acerto · ${msg}</div></div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${QZ_NIV.map(n=>{const x=r.por[n];return `<div class="card" style="margin:0;text-align:center;padding:10px"><div class="sm" style="color:${QZ_COR[n]};font-weight:700">${n}</div><b style="font-size:20px">${x?x[0]+'/'+x[1]:'–'}</b></div>`}).join('')}</div>
${r.erradas.length?`<h3 style="margin:18px 0 6px">Para revisar (${r.erradas.length})</h3>${r.erradas.map(k=>{const q=P[k];return `<div class="card" style="padding:10px"><div class="sm" style="color:${QZ_COR[q.nivel]}">${q.nivel}${q.tema?' · '+esc(q.tema):''}</div><div style="margin:4px 0"><b>${esc(q.pergunta)}</b></div><div class="sm r">Você: ${R.resp[k]==null?'(sem resposta)':esc(q.alternativas[R.resp[k]])}</div><div class="sm g">Certa: ${esc(q.alternativas[q.correta])}</div>${q.explicacao?`<div class="sm mut" style="margin-top:4px">${esc(q.explicacao)}</div>`:''}</div>`}).join('')}`:'<div class="card" style="text-align:center">🏆 Nenhum erro!</div>'}
<div style="display:grid;gap:8px;margin:14px 0 40px">${r.erradas.length?`<button class="btn" data-qz="erradas">🔁 Refazer só as ${r.erradas.length} que errei</button><button class="btn s" data-qz="notas">📝 Salvar as erradas nas anotações do livro</button>`:''}<button class="btn s" data-qz="tudo">Refazer tudo</button><button class="btn s" data-qz="x">Fechar</button></div></div>`;
    return;
  }
  const k=R.ordem[R.i],q=P[k],resp=R.resp[k],res=resp!=null,L='ABCD';
  const okN=R.ordem.slice(0,R.i+(res?1:0)).filter(x=>R.resp[x]===P[x].correta).length;
  ov.innerHTML=`<div class="qz-top"><button class="btn s" data-qz="x">✕</button><div style="flex:1;min-width:0"><div class="sm"><b>${R.i+1}</b> de ${tot}${R.parcial?' · revisão':''} <span class="mut">· ${okN} certa${okN===1?'':'s'}</span></div><div style="height:4px;border-radius:2px;background:var(--bd);margin-top:4px;overflow:hidden"><div style="height:100%;width:${Math.round((R.i+(res?1:0))/tot*100)}%;background:var(--ac)"></div></div></div></div>
<div class="qz-body"><div class="sm" style="margin-bottom:6px"><span style="color:${QZ_COR[q.nivel]};font-weight:700">● ${q.nivel}</span>${q.tema?' <span class="mut">· '+esc(q.tema)+'</span>':''}</div>
<div style="font-size:18px;font-weight:600;line-height:1.4;margin-bottom:14px">${esc(q.pergunta)}</div>
${q.alternativas.map((a,i)=>{const st=!res?'':i===q.correta?'border-color:var(--g);background:color-mix(in srgb,var(--g) 18%,transparent)':i===resp?'border-color:var(--r);background:color-mix(in srgb,var(--r) 18%,transparent)':'opacity:.55';return `<button class="qz-op" data-qz="r" data-i="${i}" ${res?'disabled':''} style="${st}"><b>${L[i]}</b><span>${esc(a)}</span>${res&&i===q.correta?' ✓':res&&i===resp?' ✗':''}</button>`}).join('')}
${res?`<div class="card" style="margin-top:10px;border-left:3px solid ${resp===q.correta?'var(--g)':'var(--r)'}"><b>${resp===q.correta?'✅ Certo!':'❌ Não foi dessa vez.'}</b>${q.explicacao?`<div class="sm" style="margin-top:4px;line-height:1.5">${esc(q.explicacao)}</div>`:''}</div><button class="btn" style="width:100%;margin:10px 0 40px" data-qz="prox">${R.i<tot-1?'Próxima ›':'Ver resultado'}</button>`:''}
</div>`;
}
function qzSalvaTentativa(){
  const R=QZ.run,r=qzResultado(),h=qzHist(R.b).slice(-29);
  h.push({q:R.quiz.id,d:Date.now(),a:r.a,t:r.t,parcial:R.parcial?1:0,n:Object.fromEntries(Object.entries(r.por))});
  (S.ax??={})['rsq.'+R.b.id]=h;save();
}

(function(){
  const st=document.createElement('style');
  st.textContent='#qz{position:fixed;inset:0;z-index:9999;background:var(--bg,#111);display:flex;flex-direction:column}#qz .qz-top{display:flex;gap:10px;align-items:center;padding:10px 12px;padding-top:max(10px,env(safe-area-inset-top));border-bottom:1px solid var(--bd)}#qz .qz-body{flex:1;overflow-y:auto;padding:16px;max-width:680px;width:100%;margin:0 auto;box-sizing:border-box;-webkit-overflow-scrolling:touch}.qz-op{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;padding:12px;margin:0 0 8px;border:1.5px solid var(--bd);border-radius:12px;background:var(--card,transparent);color:inherit;font:inherit;line-height:1.4;cursor:pointer}.qz-op b{flex:0 0 22px;height:22px;border-radius:50%;background:var(--bd);display:flex;align-items:center;justify-content:center;font-size:12px}.qz-op span{flex:1}';
  document.head.appendChild(st);

  /* o simulado entra no livro, entre o resumo completo e o "Perguntar ao resumo" */
  const rc0=rsCard;
  rsCard=function(b){
    const h=rc0(b),j=RS.jobs[b.id];
    if(!j||j.status!=='concluido'||RS.novo===b.id)return h;
    const m='<div class="card" style="margin:10px 0"><div class="top"><b>🧩 Perguntar ao resumo</b>';
    const i=h.indexOf(m);
    return i<0?h+qzCard(b,j):h.slice(0,i)+qzCard(b,j)+h.slice(i);
  };

  document.addEventListener('change',e=>{const s=e.target.closest('[data-qz="parte"]');if(s)QZ.parte=+s.value});
  document.addEventListener('keydown',e=>{if(QZ.run&&e.key==='Escape')qzFecha()});
  document.addEventListener('click',async e=>{
    const x=e.target.closest('[data-qz]');if(!x||x.tagName==='SELECT')return;
    const k=x.dataset.qz,R=QZ.run;
    /* dentro da tela de responder */
    if(k==='x')return qzFecha();
    if(k==='r'&&R){const kk=R.ordem[R.i];if(R.resp[kk]!=null)return;R.resp[kk]=+x.dataset.i;if(navigator.vibrate)navigator.vibrate(R.resp[kk]===R.quiz.perguntas[kk].correta?15:[30,40,30]);qzDesenha();return}
    if(k==='prox'&&R){if(R.i<R.ordem.length-1)R.i++;else{R.fim=1;qzSalvaTentativa()}qzDesenha();const bd=document.querySelector('#qz .qz-body');if(bd)bd.scrollTop=0;return}
    if(k==='erradas'&&R){const er=qzResultado().erradas;qzAbre(R.b,R.quiz,er);return}
    if(k==='tudo'&&R){qzAbre(R.b,R.quiz);return}
    if(k==='notas'&&R){
      const r=qzResultado(),P=R.quiz.perguntas;
      const tx=r.erradas.map((kk,n)=>{const q=P[kk];return `${n+1}. [${q.nivel}] ${q.pergunta}\n   Certa: ${q.alternativas[q.correta]}${q.explicacao?'\n   Por quê: '+q.explicacao:''}`}).join('\n\n');
      (R.b.notes??=[]).unshift({id:uid(),t:`Simulado: ${r.erradas.length} para revisar (${r.a}/${r.t})`,p:'',x:tx,u:Date.now()});save();
      if(window.toast)toast('Salvo nas anotações do livro');return;
    }
    /* no livro */
    const b=(S.books||[]).find(q=>q.id===x.dataset.id);if(!b)return;
    const j=RS.jobs[b.id];
    if(k==='set'){QZ[x.dataset.k]=x.dataset.k==='n'?+x.dataset.v:x.dataset.v;render();return}
    if(k==='gen'){
      if(!j)return;
      QZ.busy[b.id]=1;render();
      try{
        const r=await rsFn('quiz',{id:j.id,n:QZ.n,nivel:QZ.nivel,parte:QZ.parte});
        const f=RS.full[b.id]||(await rsFull(b,1));if(f)f.extras=r.extras;
        delete QZ.busy[b.id];render();
        if(window.toast)toast('Simulado pronto: '+r.item.n+' perguntas');
        qzAbre(b,r.item);
      }catch(err){delete QZ.busy[b.id];render();if(window.toast)toast(err.message,5000)}
      return;
    }
    if(k==='play'){const q=qzLista(b).find(q=>q.id===x.dataset.q);if(q)qzAbre(b,q);return}
    if(k==='del'){
      if(!confirm('Apagar este simulado?'))return;
      try{const r=await rsFn('extra_apagar',{id:j.id,eid:x.dataset.q});if(RS.full[b.id])RS.full[b.id].extras=r.extras}catch(err){if(window.toast)toast(err.message,4000)}
      render();
    }
  });
})();
/* ==== SIMULADO:FIM ==== */


/* ---------- Juros: painel do Banco Central, cotações e aba educativa ---------- */
const JR={data:ls.get('diario-jr'),busy:0,err:''};
const jrN=(n,d=2)=>n==null||!isFinite(n)?'–':(+n).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const jrNum=s=>{const v=parseFloat(String(s||'').trim().replace(/\./g,'').replace(',','.'));return isFinite(v)?v:null};

/* --- painel Selic / CDI / IPCA / juro real (Banco Central) --- */
function jrPanelHtml(){
  const d=JR.data;
  if(!d)return `<div class="mut sm" style="padding:8px 0">${esc(JR.err||(JR.busy?'Buscando dados do Banco Central…':'Sem dados ainda.'))}</div>`;
  const s=d.selic,kv=(l,v,sub)=>`<div class="card" style="margin:0"><span class="mut sm">${l}</span><div><b style="font-size:20px">${v}</b></div><span class="mut sm">${sub||''}</span></div>`;
  const mud=s&&s.completo?(s.ant!=null&&s.ant!==s.v?`mudou de ${jrN(s.ant)}% em ${esc(s.desde)}`:`sem mudança desde ${esc(s.desde)}`):'';
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${kv('Selic meta',s?jrN(s.v)+'%':'–',mud)}${kv('CDI (ano)',d.cdi?jrN(d.cdi.v)+'%':'–',d.cdi?esc(d.cdi.d):'')}${kv('IPCA 12 meses',d.ipca12?jrN(d.ipca12.v)+'%':'–',d.ipca12?'ref. '+esc(d.ipca12.d.slice(3)):'')}${kv('Juro real (Selic − IPCA)',d.real!=null?jrN(d.real)+'%':'–','ex-post, ao ano')}</div>${JR.err?`<div class="warn" style="margin-top:8px">${esc(JR.err)}</div>`:''}<div class="sm mut" style="margin-top:6px">Banco Central do Brasil${JR.ts?' · atualizado às '+hm(JR.ts):''}</div>`;
}
function jrPaint(){const e=document.getElementById('jrp');if(e)e.innerHTML=jrPanelHtml()}
async function jrLoad(force){
  if(JR.busy)return;
  if(!force&&JR.data&&JR.ts&&Date.now()-JR.ts<36e5)return;
  const c=cfg();
  if(!c){JR.err='Configure o Supabase na aba Conta para ver os juros.';jrPaint();return}
  JR.busy=1;JR.err='';jrPaint();
  try{
    let r;
    try{r=await fetch(c.url+'/functions/v1/juros',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key},body:'{}'})}
    catch(e){throw new Error('Sem conexão. Mostrando o último valor salvo.')}
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok)throw new Error(j.error||(r.status===404?'Função "juros" não encontrada: publique-a no Supabase.':'Erro '+r.status));
    JR.data=j;JR.ts=Date.now();ls.set('diario-jr',j);
  }catch(e){JR.err=e.message||String(e)}
  JR.busy=0;jrPaint();
}

/* --- aba Mercado > Cotações: petróleo, minério e curva de DI (widget do TradingView) --- */
function vCot(tabs){
  return `<div class="card"><div class="top"><b>Cotações</b><button class="btn s" data-mk="cr" aria-label="Atualizar">↻</button></div>${tabs}<h3 style="margin-top:6px">Juros do Brasil</h3><div id="jrp">${jrPanelHtml()}</div><h3 style="margin-top:14px">Petróleo, minério e juros futuros</h3><div id="mkq" style="min-height:560px"></div><div class="sm mut" style="margin-top:6px">Dados do TradingView, com atraso nos mercados da B3 e da SGX. Se alguma linha vier vazia, o TradingView não liberou aquele contrato no plano gratuito. Quer entender os números? Veja a aba Juros e DI no menu.</div></div>`;
}
function cotAfter(){
  jrPaint();jrLoad(false);
  const box=document.getElementById('mkq');if(!box)return;
  const y=new Date().getFullYear(),di=[1,2,3,5].map(n=>({name:'BMFBOVESPA:DI1F'+(y+n),displayName:'DI1F'+String(y+n).slice(2)+' (jan/'+(y+n)+')'}));
  box.innerHTML='<div class="tradingview-widget-container"><div class="tradingview-widget-container__widget"></div></div>';
  const s=document.createElement('script');
  s.src='https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';s.async=true;
  s.innerHTML=JSON.stringify({width:'100%',height:560,symbolsGroups:[
    {name:'Petróleo e minério',symbols:[{name:'TVC:USOIL',displayName:'WTI (USOIL)'},{name:'TVC:UKOIL',displayName:'Brent (UKOIL)'},{name:'SGX:FEF1!',displayName:'FEF1 minério (1º venc.)'},{name:'SGX:FEF2!',displayName:'FEF2 minério (2º venc.)'}]},
    {name:'Juros',symbols:[{name:'TVC:US10Y',displayName:'Treasury 10 anos (EUA)'},{name:'BMFBOVESPA:DI11!',displayName:'DI1 contínuo'}].concat(di)}
  ],showSymbolLogo:false,colorTheme:mkDark()?'dark':'light',isTransparent:true,locale:'br'});
  box.firstChild.appendChild(s);
}

/* --- cálculos de juros --- */
const jrPU=(t,du)=>1e5/Math.pow(1+t/100,du/252);
const jrTaxa=(pu,du)=>(Math.pow(1e5/pu,252/du)-1)*100;
const jrFwd=(t1,d1,t2,d2)=>(Math.pow(Math.pow(1+t2/100,d2/252)/Math.pow(1+t1/100,d1/252),252/(d2-d1))-1)*100;
function jrEaster(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=(h+l-7*m+114)%31+1;return new Date(y,mo-1,da)}
const jrHol={};
function jrHolidays(y){
  if(jrHol[y])return jrHol[y];
  const E=jrEaster(y),s=new Set(),k=d=>d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();
  [[0,1],[3,21],[4,1],[8,7],[9,12],[10,2],[10,15],[10,20],[11,25]].forEach(([m,d])=>s.add(y+'-'+m+'-'+d));
  [-48,-47,-2,60].forEach(n=>{const d=new Date(E);d.setDate(d.getDate()+n);s.add(k(d))});
  return jrHol[y]=s;
}
const jrBD=d=>{const w=d.getDay();return w!==0&&w!==6&&!jrHolidays(d.getFullYear()).has(d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate())};
function jrVenc(y,m){const d=new Date(y,m,1);while(!jrBD(d))d.setDate(d.getDate()+1);return d}
function jrDu(venc){const d=new Date();d.setHours(12,0,0,0);let n=0;const v=new Date(venc);v.setHours(12,0,0,0);while(d<v){if(jrBD(d))n++;d.setDate(d.getDate()+1)}return n}
function jrDuMes(val){const m=/^(\d{4})-(\d{2})$/.exec(val||'');if(!m)return null;return jrDu(jrVenc(+m[1],+m[2]-1))}
const jrCod='FGHJKMNQUVXZ';
const jrContrato=val=>{const m=/^(\d{4})-(\d{2})$/.exec(val||'');return m?'DI1'+jrCod[+m[2]-1]+String(m[1]).slice(2):''};

function jrCalc(){
  const o1=document.getElementById('jr-o1'),o2=document.getElementById('jr-o2'),g=id=>jrNum((document.getElementById(id)||{}).value);
  if(o1){
    const t=g('jr-t'),du=g('jr-du'),pu=g('jr-pu');let h='';
    if(du>0&&pu>0){h=`Taxa implícita: <b>${jrN(jrTaxa(pu,du),3)}% a.a.</b>`}
    else if(du>0&&t!=null){const p=jrPU(t,du),p2=jrPU(t+0.1,du);h=`PU: <b>R$ ${jrN(p,2)}</b><br>Se a taxa subir 0,10 ponto, o PU cai <b>R$ ${jrN(p-p2,2)}</b> por contrato. Quem está comprado em taxa ganha esse valor, quem está vendido perde.`}
    else h='<span class="mut">Preencha taxa e dias úteis, ou PU e dias úteis.</span>';
    o1.innerHTML=h;
  }
  if(o2){
    const t1=g('jr-t1'),d1=g('jr-d1'),t2=g('jr-t2'),d2=g('jr-d2');
    o2.innerHTML=t1!=null&&t2!=null&&d1>0&&d2>d1?`Taxa a termo entre os dois vencimentos: <b>${jrN(jrFwd(t1,d1,t2,d2),3)}% a.a.</b>`:'<span class="mut">Preencha as duas taxas e os dias úteis (o segundo prazo tem que ser maior).</span>';
  }
}

/* --- aba educativa --- */
let JRO=ls.get('diario-jr-open')||'sel';
function vJuros(){
  const sec=(k,t,b)=>`<details class="card" data-jrs="${k}"${JRO===k?' open':''} style="margin-top:8px"><summary><b>${t}</b></summary><div class="sm" style="margin-top:8px;line-height:1.5">${b}</div></details>`;
  const p=t=>`<p style="margin:8px 0">${t}</p>`;
  const nx=new Date().getFullYear()+1,mes0=nx+'-01',du0=jrDuMes(mes0);
  return `<h1>Juros e DI</h1><div class="card"><div class="top"><b>Painel de juros</b><button class="btn s" data-mk="jr" aria-label="Atualizar">↻</button></div><div id="jrp" style="margin-top:8px">${jrPanelHtml()}</div></div>
${sec('sel','1. Selic, CDI e o Copom',
 p('A <b>Selic meta</b> é a taxa básica de juros da economia. Quem decide é o <b>Copom</b>, o comitê do Banco Central. Ele se reúne <b>8 vezes por ano</b>, em dois dias, e o resultado sai na quarta-feira à noite.')+
 p('A <b>Selic over</b> (ou efetiva) é a taxa que de fato se paga nos empréstimos de um dia entre bancos com títulos públicos. Ela fica colada na meta, em geral uns 0,10 ponto abaixo. O <b>CDI</b> é parecido: é a taxa dos empréstimos de um dia entre bancos, sem lastro em título público, e anda praticamente junto com a Selic.')+
 p('<b>Por que o Copom mexe nela?</b> O objetivo é manter a inflação perto da meta (hoje 3% ao ano, com tolerância de 1,5 ponto para cima ou para baixo). Inflação alta: o BC sobe os juros, o crédito encarece, o consumo esfria e os preços perdem força. Economia fraca e inflação sob controle: ele pode cortar.')+
 p('<b>Efeito nos mercados (tendência, não regra):</b> juros altos deixam a renda fixa mais atraente e pressionam ações de empresas endividadas e sensíveis a crédito, como construção e varejo. Juros em queda costumam ajudar a bolsa e essas empresas.'))}
${sec('real','2. Juro real',
 p('Juro real é o que sobra do juro depois de descontar a inflação. A conta é <b>(1 + Selic) ÷ (1 + inflação) − 1</b>.')+
 p('O painel acima usa o IPCA dos últimos 12 meses (juro real <b>ex-post</b>). O mercado também olha o juro real <b>ex-ante</b>, que usa a inflação esperada para os próximos 12 meses (pesquisa Focus). É esse que mostra o quanto a política está apertada ou frouxa.'))}
${sec('di','3. O que é o DI futuro (DI1)',
 p('É um contrato da B3 que negocia a <b>taxa média do DI (CDI) entre hoje e o vencimento</b>. A cotação do contrato é uma <b>taxa de juros efetiva ao ano, base 252 dias úteis</b>.')+
 p('O contrato vale <b>R$ 100.000 no vencimento</b>. Antes disso, o valor é o <b>PU</b> (preço unitário), que é R$ 100.000 trazidos a valor presente pela taxa: <b>PU = 100.000 ÷ (1 + taxa)^(dias úteis ÷ 252)</b>.')+
 p('<b>Taxa e PU andam em sentidos opostos.</b> Taxa sobe, PU cai. Por isso se diz <b>comprado em taxa</b> (ganha se os juros sobem) e <b>vendido em taxa</b> (ganha se os juros caem).')+
 p('<b>Vencimentos:</b> o contrato vence no 1º dia útil do mês. As letras dos meses são F (jan), G (fev), H (mar), J (abr), K (mai), M (jun), N (jul), Q (ago), U (set), V (out), X (nov) e Z (dez). Exemplo: <b>DI1F27</b> = vence em janeiro de 2027.')+
 p('O resultado é ajustado todo dia, então ganhos e perdas entram na conta diariamente. Bancos e empresas usam para se proteger de juros, e fundos usam para apostar na direção deles.'))}
${sec('curva','4. Como ler a curva de juros futuros',
 p('Cada vencimento do DI1 é um ponto (<b>vértice</b>) da curva. A taxa de um vértice é, aproximadamente, a <b>média do CDI que o mercado espera até aquela data</b>, mais um prêmio de risco.')+
 p('<b>Vértices curtos</b> (próximos meses) refletem o que o mercado espera do próximo Copom. <b>Vértices longos</b> (2 a 5 anos) refletem inflação futura, risco fiscal e juros lá fora (os Treasuries dos EUA).')+
 p('<b>Curva inclinada para cima:</b> taxas longas maiores que as curtas. <b>Curva invertida:</b> juros altos hoje e o mercado esperando cortes. O que importa para o dia a dia é a <b>variação</b>: DI subindo (taxa subindo) pressiona o índice, e DI caindo costuma aliviar.')+
 p('<b>Taxa a termo:</b> dá para extrair a taxa que o mercado projeta <i>entre</i> dois vértices. Use a calculadora logo abaixo.'))}
${sec('move','5. O que move os DIs',
 '<ul style="margin:8px 0 0 18px;padding:0"><li>Decisão e comunicado do Copom, e a ata uma semana depois</li><li>IPCA e prévias de inflação (a surpresa em relação ao esperado é o que mexe)</li><li>Relatório Focus, toda segunda-feira de manhã</li><li>Risco fiscal: contas do governo, arcabouço, gastos</li><li>Juros nos EUA: Fed e rendimento do Treasury de 10 anos</li><li>Dólar, petróleo e atividade econômica</li></ul>')}
${sec('calc','6. Calculadora: taxa, PU e dias úteis',
 p('Escolha o mês de vencimento (o app estima os dias úteis) ou digite os dias úteis você mesmo.')+
 `<label>Vencimento (mês)<input type="month" id="jr-mes" value="${mes0}"></label><div class="sm mut" id="jr-cod" style="margin:-4px 0 6px">${esc(jrContrato(mes0))}</div>
<div class="g2"><label>Dias úteis<input id="jr-du" inputmode="numeric" value="${du0==null?'':du0}"></label><label>Taxa (% a.a.)<input id="jr-t" inputmode="decimal" placeholder="ex.: 14,20"></label></div>
<label>PU (opcional, para achar a taxa)<input id="jr-pu" inputmode="decimal" placeholder="ex.: 85.000,00"></label>
<div class="card" id="jr-o1" style="margin-top:8px"><span class="mut">Preencha taxa e dias úteis.</span></div>
<div class="sm mut" style="margin-top:6px">Os dias úteis são uma estimativa (fins de semana e feriados nacionais). Confira com a B3 antes de operar.</div>`)}
${sec('fwd','7. Calculadora: taxa a termo entre dois vértices',
 p('Exemplo: se o DI1F27 está em 14,0% com 80 dias úteis e o DI1F28 em 13,0% com 330 dias úteis, a calculadora mostra a taxa embutida entre esses dois vencimentos.')+
 `<div class="g2"><label>Taxa 1 (% a.a.)<input id="jr-t1" inputmode="decimal" placeholder="14,00"></label><label>Dias úteis 1<input id="jr-d1" inputmode="numeric" placeholder="80"></label></div>
<div class="g2"><label>Taxa 2 (% a.a.)<input id="jr-t2" inputmode="decimal" placeholder="13,00"></label><label>Dias úteis 2<input id="jr-d2" inputmode="numeric" placeholder="330"></label></div>
<div class="card" id="jr-o2" style="margin-top:8px"><span class="mut">Preencha os campos.</span></div>`)}
${sec('gloss','8. Glossário rápido',
 '<ul style="margin:8px 0 0 18px;padding:0"><li><b>Copom:</b> comitê do Banco Central que define a Selic</li><li><b>Selic meta:</b> taxa básica decidida pelo Copom</li><li><b>CDI:</b> taxa dos empréstimos de um dia entre bancos, quase igual à Selic over</li><li><b>DI1:</b> contrato futuro da taxa de DI na B3</li><li><b>PU:</b> preço unitário, o valor do contrato em reais</li><li><b>Vértice:</b> um vencimento da curva de juros</li><li><b>Dias úteis (du):</b> contagem usada na base 252</li><li><b>Prêmio de risco:</b> parte da taxa que remunera incerteza, além da expectativa de Selic</li><li><b>Focus:</b> pesquisa semanal do BC com as projeções de analistas</li><li><b>Carry:</b> ganho de manter uma posição pela diferença de juros</li></ul>')}
<div class="sm mut" style="margin:12px 0">Conteúdo educativo, não é recomendação de investimento.</div>`;
}
function jrAfter(){jrPaint();jrLoad(false);jrCalc()}

/* ==== JUROS2:INICIO ==== painel de juros detalhado, curva de DI futuro (B3), cotações do TradingView */
const j2d=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?m[3]+'/'+m[2]:(s||'').slice(0,5)};
const j2pb=n=>n==null?'–':(n>0?'+':'')+String(Math.round(n*10)/10).replace('.',',')+' pb';
const j2pc=(n,d=2)=>n==null||!isFinite(n)?'–':jrN(n,d)+'%';
const j2tv=s=>'https://www.tradingview.com/chart/?symbol='+encodeURIComponent(s);
const J2META=3,J2TETO=4.5; // meta de inflação contínua (CMN) e teto da tolerância

/* decisão esperada em palavras */
function j2dec(atual,esp){if(atual==null||esp==null)return '';const d=Math.round((esp-atual)*100);return d===0?'manutenção':d<0?'corte de '+(-d)+' pb':'alta de '+d+' pb'}

jrPanelHtml=function(){
  const d=JR.data;
  if(!d)return `<div class="mut sm" style="padding:8px 0">${esc(JR.err||(JR.busy?'Buscando dados do Banco Central…':'Sem dados ainda.'))}</div>`;
  const s=d.selic,f=d.focus||{},cp=d.copom||{},y=new Date().getFullYear(),ci=d.curva_info;
  const kv=(l,v,sub,cor)=>`<div class="card" style="margin:0;padding:10px"><span class="mut sm">${l}</span><div><b style="font-size:19px${cor?';color:'+cor:''}">${v}</b></div><span class="mut sm" style="line-height:1.3;display:block">${sub||''}</span></div>`;
  const mud=s&&s.completo?(s.mud_pb?`${s.mud_pb<0?'corte':'alta'} de ${Math.abs(s.mud_pb)} pb em ${esc(s.desde)}`:`sem mudança desde ${esc(s.desde)}`):(s?'desde '+esc(s.desde):'');
  const ipCor=d.ipca12?(d.ipca12.v>J2TETO?'var(--r)':d.ipca12.v>J2META?'#d9a400':'var(--g)'):'';
  let h=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
${kv('Selic meta',s?j2pc(s.v):'–',mud)}
${kv('CDI · Selic over',d.cdi?j2pc(d.cdi.v):'–',(d.over?'over '+j2pc(d.over.v)+' · ':'')+(d.cdi?esc(d.cdi.d):''))}
${kv('IPCA 12 meses',d.ipca12?j2pc(d.ipca12.v):'–',(d.ipcaMes?'no mês: '+j2pc(d.ipcaMes.v)+' ('+esc(d.ipcaMes.d.slice(3))+')':'')+`<br>meta ${J2META}% · teto ${jrN(J2TETO,1)}%`,ipCor)}
${kv('Juro real',d.real!=null?j2pc(d.real):'–','ex-post (Selic − IPCA 12m)'+(d.real_exante?`<br>ex-ante <b>${j2pc(d.real_exante.v)}</b> (DI 1 ano − IPCA esperado)`:''))}
</div>`;
  /* Copom */
  if(cp.proxima){
    const fr=f.reuniao,esp=fr?j2dec(s&&s.v,fr.mediana):'';
    const dt=new Date(cp.proxima.decisao+'T12:00:00');
    h+=`<div class="card" style="margin:8px 0 0;padding:10px;border-left:3px solid var(--ac)"><div class="top"><b>🏛️ Próximo Copom</b><span class="sm mut">em ${cp.proxima.dias} dia${cp.proxima.dias===1?'':'s'}</span></div>
<div class="sm" style="margin-top:4px">${j2d(cp.proxima.inicio)} e ${dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} · decisão na quarta à noite (~18h30) · ${cp.restantes_ano>1?cp.restantes_ano+' reuniões até o fim do ano':'última do ano'}</div>
${fr?`<div class="sm" style="margin-top:4px">Focus espera <b>${j2pc(fr.mediana)}</b>${esp?' → <b>'+esp+'</b>':''}</div>`:''}
${ci&&ci.curto_vs_cdi_pb!=null?`<div class="sm" style="margin-top:4px">Curva: ${esc(ci.curto)} está <b>${j2pb(ci.curto_vs_cdi_pb)}</b> ${ci.curto_vs_cdi_pb<0?'abaixo':'acima'} do CDI → o mercado ${ci.curto_vs_cdi_pb<=-15?'precifica cortes':ci.curto_vs_cdi_pb>=15?'precifica altas':'não precifica mudança grande'} até esse vencimento.</div>`:''}</div>`;
  }
  /* Focus */
  if(f.selic||f.ipca){
    const c=(l,a,b)=>`<tr><td>${l}</td><td style="text-align:right"><b>${j2pc(a)}</b></td><td style="text-align:right"><b>${j2pc(b)}</b></td></tr>`;
    h+=`<div class="card" style="margin:8px 0 0;padding:10px"><div class="top"><b>📊 Focus (mediana do mercado)</b><span class="sm mut">${f.data?j2d(f.data):''}</span></div>
<table class="sm" style="width:100%;margin-top:4px;border-collapse:collapse"><tr class="mut"><td></td><td style="text-align:right">fim de ${y}</td><td style="text-align:right">fim de ${y+1}</td></tr>${c('Selic',f.selic&&f.selic[y],f.selic&&f.selic[y+1])}${c('IPCA',f.ipca&&f.ipca[y],f.ipca&&f.ipca[y+1])}</table>
${f.ipca12m?`<div class="sm mut" style="margin-top:4px">IPCA esperado para os próximos 12 meses: <b>${j2pc(f.ipca12m.v)}</b></div>`:''}</div>`;
  }
  /* IPCA mês a mês */
  if(d.ipcaMes&&d.ipcaMes.hist&&d.ipcaMes.hist.length>2){
    const H=d.ipcaMes.hist,mx=Math.max(.5,...H.map(x=>Math.abs(x.v))),w=100/H.length;
    h+=`<div class="card" style="margin:8px 0 0;padding:10px"><b class="sm">IPCA mês a mês</b><svg viewBox="0 0 100 34" preserveAspectRatio="none" style="width:100%;height:60px;margin-top:6px">${H.map((x,i)=>{const hh=Math.abs(x.v)/mx*15;return `<rect x="${i*w+w*.15}" y="${x.v>=0?17-hh:17}" width="${w*.7}" height="${Math.max(.4,hh)}" fill="${x.v>=0?'var(--r)':'var(--g)'}" opacity=".8"><title>${esc(x.m)}: ${jrN(x.v)}%</title></rect>`}).join('')}<line x1="0" x2="100" y1="17" y2="17" stroke="var(--bd)" stroke-width=".3"/></svg><div class="sm mut" style="display:flex;justify-content:space-between"><span>${esc(H[0].m)}</span><span>${esc(H[H.length-1].m)}: ${j2pc(H[H.length-1].v)}</span></div></div>`;
  }
  return h+(JR.err?`<div class="warn" style="margin-top:8px">${esc(JR.err)}</div>`:'')+`<div class="sm mut" style="margin-top:6px">Banco Central (SGS e Focus)${JR.ts?' · atualizado às '+hm(JR.ts):''}</div>`;
};

/* --- curva de juros (DI1 da B3) --- */
function j2CurvaSvg(c){
  const W=320,H=150,P={l:34,r:8,t:10,b:22},xs=c.map(p=>p.du),ys=c.flatMap(p=>[p.taxa,p.ant]).filter(v=>v!=null);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys)-.1,y1=Math.max(...ys)+.1;
  const X=v=>P.l+(v-x0)/(x1-x0||1)*(W-P.l-P.r),Y=v=>P.t+(y1-v)/(y1-y0||1)*(H-P.t-P.b);
  const ln=k=>c.filter(p=>p[k]!=null).map((p,i)=>(i?'L':'M')+X(p.du).toFixed(1)+','+Y(p[k]).toFixed(1)).join('');
  const ticks=[y0+.1,(y0+y1)/2,y1-.1];
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;margin-top:6px" role="img" aria-label="Curva de juros futuros">
${ticks.map(t=>`<line x1="${P.l}" x2="${W-P.r}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--bd)" stroke-width=".5"/><text x="${P.l-4}" y="${Y(t)+3}" font-size="9" text-anchor="end" fill="var(--mut)">${jrN(t,2)}</text>`).join('')}
<path d="${ln('ant')}" fill="none" stroke="var(--mut)" stroke-width="1.2" stroke-dasharray="3 3"/>
<path d="${ln('taxa')}" fill="none" stroke="var(--ac)" stroke-width="2"/>
${c.map(p=>`<circle cx="${X(p.du)}" cy="${Y(p.taxa)}" r="2.6" fill="var(--ac)"><title>${p.cod}: ${jrN(p.taxa,3)}%</title></circle>`).join('')}
${c.filter((p,i)=>i===0||p.cod.startsWith('DI1F')&&i%2===0||i===c.length-1).map(p=>`<text x="${X(p.du)}" y="${H-8}" font-size="8.5" text-anchor="middle" fill="var(--mut)">${p.cod.slice(3)}</text>`).join('')}
</svg><div class="sm mut" style="display:flex;gap:12px;justify-content:center"><span><b style="color:var(--ac)">━</b> hoje</span><span>┅ fechamento anterior</span></div>`;
}
function jrCurvaHtml(){
  const d=JR.data,c=d&&d.curva,ci=d&&d.curva_info;
  if(!c||c.length<2)return d&&d.tv&&!d.tv.ok?`<div class="sm mut">A curva vem do TradingView, que não respondeu agora (${esc(d.tv.erro||'')}).</div>`:'<div class="sm mut">Sem dados da curva ainda.</div>';
  const corPb=v=>v==null?'':v>0?'r':v<0?'g':'';
  return `${ci?`<div class="sm" style="margin:2px 0 4px;line-height:1.45">Curva <b>${esc(ci.forma)}</b>: ${esc(ci.longo)} − ${esc(ci.curto)} = <b>${j2pb(ci.inclinacao_pb)}</b>.${ci.dia?` Hoje os DIs estão <b>${esc(ci.dia)}</b> (média ${j2pb(ci.var_media_pb)}).`:''}${ci.taxa_1a!=null?` Taxa de 1 ano: <b>${j2pc(ci.taxa_1a,3)}</b>.`:''}</div>`:''}
${j2CurvaSvg(c)}
<div style="overflow-x:auto;margin-top:6px"><table class="sm" style="width:100%;border-collapse:collapse;white-space:nowrap">
<tr class="mut"><td style="padding:4px 2px">Vértice</td><td style="text-align:right">Taxa</td><td style="text-align:right">Var.</td><td style="text-align:right">PU (R$)</td><td style="text-align:right">du</td><td style="text-align:right">Termo</td></tr>
${c.map(p=>`<tr style="border-top:1px solid var(--bd)"><td style="padding:6px 2px"><a href="${j2tv('BMFBOVESPA:'+p.cod.slice(0,4)+p.venc.slice(0,4))}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none"><b>${esc(p.cod)}</b><div class="mut" style="font-size:11px">${esc(p.rotulo)}</div></a></td><td style="text-align:right"><b>${jrN(p.taxa,3)}</b></td><td style="text-align:right" class="${corPb(p.var_pb)}">${j2pb(p.var_pb)}</td><td style="text-align:right">${jrN(p.pu,0)}</td><td style="text-align:right">${p.du}</td><td style="text-align:right" class="mut">${p.termo==null?'–':jrN(p.termo,2)}</td></tr>`).join('')}
</table></div>
<div class="sm mut" style="margin-top:6px;line-height:1.45">Taxa em % ao ano (base 252). <b>Var.</b> em pontos-base (1 pb = 0,01 ponto): <span class="r">positivo = taxa subindo</span>, que costuma pesar no Ibovespa. <b>Termo</b> = taxa embutida entre o vértice anterior e este. TradingView, ~15 min de atraso. Toque no vértice para abrir o gráfico.</div>`;
}

/* --- petróleo, minério, juros lá fora --- */
function jrCotHtml(){
  const d=JR.data,c=d&&d.cot;
  if(!c||!Object.keys(c).length)return '';
  const nm={wti:'WTI (USOIL)',brent:'Brent (UKOIL)',fef1:'Minério · 1º venc.',fef2:'Minério · 2º venc.',ust2:'Treasury 2 anos',ust10:'Treasury 10 anos',ust30:'Treasury 30 anos',dxy:'DXY (dólar global)'};
  const row=k=>{const x=c[k];if(!x)return `<tr style="border-top:1px solid var(--bd)"><td style="padding:7px 2px">${nm[k]}</td><td colspan="2" class="mut" style="text-align:right">sem cotação</td></tr>`;
    const tx=k.startsWith('ust'),sub=k.startsWith('fef')?(x.alt>=2?'COMEX '+x.s.split(':')[1]+' · SGX indisponível':'SGX '+x.s.split(':')[1]):x.s;
    return `<tr style="border-top:1px solid var(--bd)"><td style="padding:7px 2px"><a href="${j2tv(x.s)}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none">${nm[k]}<div class="mut" style="font-size:11px">${esc(sub)}</div></a></td><td style="text-align:right"><b>${jrN(x.close,tx?3:2)}${tx?'%':''}</b></td><td style="text-align:right" class="${cls(tx?x.cha:x.chp)}">${tx?j2pb(x.cha==null?null:x.cha*100):(x.chp==null?'–':(x.chp>0?'+':'')+jrN(x.chp)+'%')}</td></tr>`};
  const grp=(t,ks)=>`<tr><td colspan="3" class="mut" style="padding:10px 2px 2px;font-weight:700;letter-spacing:.04em;font-size:11px">${t}</td></tr>`+ks.map(row).join('');
  return `<table class="sm" style="width:100%;border-collapse:collapse">${grp('PETRÓLEO E MINÉRIO',['wti','brent','fef1','fef2'])}${grp('JUROS E DÓLAR LÁ FORA',['ust2','ust10','ust30','dxy'])}</table>
<div class="sm mut" style="margin-top:6px">TradingView, ~15 min de atraso. Minério: contrato FEF da SGX (Singapura); quando a SGX não libera a cotação, mostra o contrato TIO da COMEX, que é o mesmo minério 62% Fe em US$/t.</div>`;
}

/* --- pinta tudo e recarrega a cada 3 min enquanto a tela está aberta --- */
jrPaint=function(){
  const a=document.getElementById('jrp');if(a)a.innerHTML=jrPanelHtml();
  const b=document.getElementById('jrc');if(b)b.innerHTML=jrCurvaHtml();
  const q=document.getElementById('mkq');
  if(q&&JR.data&&JR.data.cot&&Object.keys(JR.data.cot).length){q.style.minHeight='';q.innerHTML=jrCotHtml()}
  else if(q&&JR.data&&!q.dataset.w&&!JR.busy){q.dataset.w=1;cotWidget()}
};
jrLoad=async function(force){
  if(JR.busy)return;
  if(!force&&JR.data&&JR.ts&&Date.now()-JR.ts<18e4)return;
  const c=cfg();
  if(!c){JR.err='Configure o Supabase na aba Conta para ver os juros.';jrPaint();return}
  JR.busy=1;JR.err='';jrPaint();
  try{
    let r;
    try{r=await fetch(c.url+'/functions/v1/juros',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key},body:'{}'})}
    catch(e){throw new Error('Sem conexão. Mostrando o último valor salvo.')}
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok)throw new Error(j.error||(r.status===404?'Função "juros" não encontrada: publique-a no Supabase.':'Erro '+r.status));
    JR.data=j;JR.ts=Date.now();ls.set('diario-jr',j);
  }catch(e){JR.err=e.message||String(e)}
  JR.busy=0;jrPaint();
};
/* reserva: o quadro do TradingView (se a função ainda for a antiga ou o scanner falhar) */
function cotWidget(){
  const box=document.getElementById('mkq');if(!box)return;
  const y=new Date().getFullYear(),di=[1,2,3,4,5,6,7,8,10].map(n=>({name:'BMFBOVESPA:DI1F'+(y+n),displayName:'DI1F'+String(y+n).slice(2)+' (jan/'+(y+n)+')'}));
  box.style.minHeight='560px';
  box.innerHTML='<div class="tradingview-widget-container"><div class="tradingview-widget-container__widget"></div></div>';
  const s=document.createElement('script');
  s.src='https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';s.async=true;
  s.innerHTML=JSON.stringify({width:'100%',height:720,symbolsGroups:[
    {name:'Petróleo e minério',symbols:[{name:'TVC:USOIL',displayName:'WTI (USOIL)'},{name:'TVC:UKOIL',displayName:'Brent (UKOIL)'},{name:'COMEX:TIO1!',displayName:'Minério 62% (COMEX, 1º venc.)'},{name:'COMEX:TIO2!',displayName:'Minério 62% (COMEX, 2º venc.)'}]},
    {name:'DI futuro (B3)',symbols:[{name:'BMFBOVESPA:DI11!',displayName:'DI1 contínuo'}].concat(di)},
    {name:'Juros lá fora',symbols:[{name:'TVC:US02Y',displayName:'Treasury 2 anos'},{name:'TVC:US10Y',displayName:'Treasury 10 anos'}]}
  ],showSymbolLogo:false,colorTheme:mkDark()?'dark':'light',isTransparent:true,locale:'br'});
  box.firstChild.appendChild(s);
}
vCot=function(tabs){
  return `<div class="card"><div class="top"><b>Cotações</b><button class="btn s" data-mk="cr" aria-label="Atualizar">↻</button></div>${tabs}
<h3 style="margin-top:6px">Juros do Brasil</h3><div id="jrp">${jrPanelHtml()}</div>
<h3 style="margin-top:14px">Curva de juros · DI futuro (B3)</h3><div id="jrc">${jrCurvaHtml()}</div>
<h3 style="margin-top:14px">Petróleo, minério e juros lá fora</h3><div id="mkq">${jrCotHtml()}</div>
<div class="sm mut" style="margin-top:8px">Quer entender os números? Veja a aba Juros e DI no menu.</div></div>`;
};
cotAfter=function(){jrPaint();jrLoad(false)};
(function(){
  const v0=vJuros;
  vJuros=function(){
    const h=v0(),m='<details class="card" data-jrs="sel"';
    const i=h.indexOf(m);
    return i<0?h:h.slice(0,i)+`<div class="card" style="margin-top:8px"><b>📈 Curva de juros futuros (DI1)</b><div id="jrc" style="margin-top:6px">${jrCurvaHtml()}</div></div>\n`+h.slice(i);
  };
  /* recarrega sozinho a cada 3 min com a tela aberta */
  setInterval(()=>{if(!document.hidden&&(document.getElementById('jrp')||document.getElementById('jrc')))jrLoad(false)},6e4);
})();
/* ==== JUROS2:FIM ==== */

(function(){
  const r4=render0;
  render0=function(){r4();if(tab==='juros')jrAfter()};
  document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.dataset&&d.dataset.jrs&&d.open){JRO=d.dataset.jrs;ls.set('diario-jr-open',JRO)}},true);
  const jrIn=e=>{
    const t=e.target;if(!t.id||t.id.indexOf('jr-')!==0)return;
    if(t.id==='jr-mes'){const du=jrDuMes(t.value),d=document.getElementById('jr-du'),c=document.getElementById('jr-cod');if(d&&du!=null)d.value=du;if(c)c.textContent=jrContrato(t.value)}
    jrCalc();
  };
  document.addEventListener('input',jrIn);document.addEventListener('change',jrIn);
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-mk="cr"],[data-mk="jr"]');if(!b)return;
    jrLoad(true);if(b.dataset.mk==='cr')cotAfter();
  });
})();


/* ==== MOEDA:INICIO ==== resultados em R$ / US$ (moeda do ativo) e % da conta, no lugar de R */
function moedaAtv(a){const s=String(a||'').toUpperCase().replace(/\s/g,'');if(!s)return 'BRL';
  if(/^(WIN|WDO|IND|DOL|BGI|CCM|ICF|SFI|DI1|BIT|ETR)[FGHJKMNQUVXZ]?\d{0,2}$/.test(s))return 'BRL';
  if(/^(M?ES|M?NQ|M?YM|M2K|RTY|M?CL|M?GC|SI|SIL|NG|HG|ZB|ZN|ZF|6[EJBACS]|M6[EAB]|MBT|MET|VX)([FGHJKMNQUVXZ]\d{1,2})?!?$/.test(s))return 'USD';
  if(/^[A-Z]{4}\d{1,2}F?$/.test(s)||/^[A-Z]{4}[A-X]\d{2,3}[A-Z]?$/.test(s))return 'BRL';
  if(/^(EUR|GBP|AUD|NZD|USD|CAD|CHF|JPY|XAU|XAG)(USD|JPY|CHF|CAD|EUR|GBP|AUD|NZD)$/.test(s)||/USDT?$/.test(s)||/^(BTC|ETH|SOL|XRP)/.test(s)||/^(US30|US100|NAS100|SPX500|US500|GER40|DJI|NDX|SPX)/.test(s))return 'USD';
  if(/^[A-Z]{1,5}(\.[A-Z])?$/.test(s))return 'USD';
  return 'BRL'}
function moedaT(t){return (t&&t.moeda)||moedaAtv(t&&t.ativo)}
function mnyC(v,c){if(v==null||!isFinite(v))return '–';return c==='USD'?(v<0?'-':'')+'US$ '+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}):money(v)}
function mT(t,v){return mnyC(v,moedaT(t))}
function emBRL(v,c){return c==='USD'?v*(+axg('brl',5.4)||5.4):v}
/* capital de referência: o PL inicial da aba (Day trade, Swing ou Opções) se configurado; senão o capital da conta */
function capRef(tp){const g=k=>+gv('cap',k+'_ini','')||0;if(tp){const v=g(tp);if(v>0)return v}const c=+gv('ct','cap',0)||0;if(c>0)return c;return g('D')+g('S')+g('O')}
function pctConta(v,c,tp){const cap=capRef(tp);if(v==null||!isFinite(v)||!cap)return '';const p=emBRL(v,c||'BRL')/cap*100;return (p>0?'+':'')+p.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'% da conta'}
function riscoTrade(){return (+gv('ct','cap',0)||0)*(+gv('ct','pct',0)||0)/100}
function somaMoedas(ts){const o={};ts.forEach(t=>{const c=t.c||calc(t);if(c.pl!=null){const m=moedaT(t);o[m]=(o[m]||0)+c.pl}});return o}
function mediaMoedas(ts){const o={},n={};ts.forEach(t=>{const c=t.c||calc(t);if(c.pl!=null){const m=moedaT(t);o[m]=(o[m]||0)+c.pl;n[m]=(n[m]||0)+1}});Object.keys(o).forEach(k=>o[k]/=n[k]);return o}
function mnyMix(o){const k=Object.keys(o);if(!k.length)return money(0);return k.sort().map(c=>mnyC(o[c],c)).join(' · ')}
function totBRL(o){return Object.entries(o).reduce((s,[c,v])=>s+emBRL(v,c),0)}
const dayPL=ts=>sum(ts.filter(t=>t.c.pl!=null).map(t=>emBRL(t.c.pl,moedaT(t))));
function limPerda(d){return +d.maxP>0?+d.maxP:(+d.maxR>0&&riscoTrade()>0?+d.maxR*riscoTrade():0)}
/* ==== MOEDA:FIM ==== */
/* ==== ESTATISTICAS:INICIO (bloco puro e testado em tests/estatisticas.test.mjs: sem DOM e sem variáveis do app) ==== */

/* ---- números: campo vazio NUNCA vira zero ---- */
function numN(v){
  if(v==null)return null;
  if(typeof v==='number')return isFinite(v)?v:null;
  const s=String(v).trim();
  if(s===''||s==='-')return null;
  if(!/^[+-]?(\d+([.,]\d*)?|[.,]\d+)(e[+-]?\d+)?$/i.test(s))return null;
  const n=Number(s.replace(',','.'));
  return isFinite(n)?n:null;
}
function isOpen(t){return numN(t.exit)==null}

/* risk e r ficam null quando falta o stop (antes viravam entrada × qtd, porque '' virava 0) */
function calc(t){
  const d=t.side==='C'?1:-1,pv=numN(t.pv)||1,q=numN(t.qty)||0,e=numN(t.entry),s=numN(t.stop),x=numN(t.exit),cost=numN(t.cost)||0,tg=numN(t.target);
  const has=x!=null&&e!=null;
  const risk=e!=null&&s!=null?Math.abs(e-s)*q*pv:null;
  const pl=has?(x-e)*d*q*pv-cost:null;
  const r=has&&risk>0?pl/risk:null;
  const rr=e!=null&&s!=null&&tg!=null&&e!==s?Math.abs(tg-e)/Math.abs(e-s):null;
  return {risk,pl,r,rr,semStop:e!=null&&s==null};
}

/* ---- períodos: uma definição só para todas as telas (datas AAAA-MM-DD, sem depender de fuso nem de horário de verão) ---- */
function diasMais(d,n){const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)}
function segundaDe(d){const x=new Date(d+'T12:00:00Z');return diasMais(d,-((x.getUTCDay()+6)%7))}
/* hoje | sem (segunda até hoje) | 7 e 30 (últimos N dias, contando hoje) | mes | ano | all */
function intervalo(per,hoje){
  switch(per){
    case 'hoje':return [hoje,hoje];
    case 'sem':return [segundaDe(hoje),hoje];
    case '7':return [diasMais(hoje,-6),hoje];
    case '30':return [diasMais(hoje,-29),hoje];
    case 'mes':return [hoje.slice(0,8)+'01',hoje];
    case 'ano':return [hoje.slice(0,4)+'-01-01',hoje];
    default:return [null,null];
  }
}
function noPeriodo(d,per,hoje){const [a,b]=intervalo(per,hoje);return !a||(d>=a&&d<=b)}
const PERIODOS=[['all','Tudo'],['hoje','Hoje'],['sem','Esta semana'],['7','Últimos 7 dias'],['30','Últimos 30 dias'],['mes','Este mês'],['ano','Este ano']];

/* ---- ordem cronológica: pela SAÍDA (resultado realizado); empate pela entrada; depois pela posição original ---- */
function quando(t){const x=t.dtx||t.dt||'';return x.length===10?x+'T23:59':x}
function cmpCron(a,b){
  const x=quando(a),y=quando(b);if(x!==y)return x<y?-1:1;
  const p=a.dt||'',q=b.dt||'';return p<q?-1:p>q?1:0;
}
function ordenaCron(ts){return ts.map((t,i)=>({t,i})).sort((a,b)=>cmpCron(a.t,b.t)||a.i-b.i).map(o=>o.t)}

/* ---- métricas ---- */
const _soma=a=>a.reduce((s,x)=>s+x,0);
const _media=a=>a.length?_soma(a)/a.length:null;
function _grupo(k,v){
  const rs=v.filter(x=>x.c.r!=null).map(x=>x.c.r),pls=v.map(x=>x.c.pl);
  return {k,n:v.length,nR:rs.length,acerto:v.length?pls.filter(p=>p>0).length/v.length:null,mediaR:_media(rs),somaR:_soma(rs),somaPL:_soma(pls),mediaPL:_media(pls)};
}
function agrupa(rows,fn,ordem){
  const g=new Map();
  rows.forEach(r=>{const k=fn(r)||'—';if(!g.has(k))g.set(k,[]);g.get(k).push(r)});
  const a=[...g].map(([k,v])=>_grupo(k,v));
  if(ordem)a.sort((x,y)=>ordem.indexOf(x.k)-ordem.indexOf(y.k));
  return a;
}
const SEM=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const semDe=dt=>dt&&dt.length>=10?SEM[new Date(dt.slice(0,10)+'T12:00:00Z').getUTCDay()]:null;
const horaDe=dt=>dt&&dt.length>=13?dt.slice(11,13)+'h':null;
const minutosEntre=(a,b)=>{if(!a||!b||a.length<16||b.length<16)return null;const m=(Date.parse(b.slice(0,16)+':00Z')-Date.parse(a.slice(0,16)+':00Z'))/6e4;return m>=0?m:null};
const SQN_ESCALA=[[1.6,'Abaixo do tradável'],[2,'Fraco, mas operável'],[2.5,'Médio'],[3,'Bom'],[5,'Excelente'],[7,'Soberbo'],[Infinity,'Santo Graal']];
const qualSQN=x=>x==null?'sem dado':SQN_ESCALA.find(([l])=>x<l)[1];

/* Trades abertos até `janelaMin` minutos depois do FIM de uma perda (possível operação de revanche) contra os demais. */
function revancheDe(rr,janelaMin=15){
  const T=x=>Date.parse(String(x).slice(0,16)+':00Z');
  const fins=rr.filter(t=>t.c.r<0&&t.dtx&&t.dtx.length>=16).map(t=>({t,f:T(t.dtx)})).filter(x=>isFinite(x.f));
  const rev=[],resto=[],revP=[],restoP=[];
  rr.forEach(t=>{const a=t.dt&&t.dt.length>=16?T(t.dt):NaN,ehRev=isFinite(a)&&fins.some(p=>p.t!==t&&a>=p.f&&a-p.f<=janelaMin*6e4);(ehRev?rev:resto).push(t.c.r);(ehRev?revP:restoP).push(t.c.pl)});
  if(rev.length<5||resto.length<5)return null;
  return {janelaMin,rev:{n:rev.length,exp:_media(rev),expPL:_media(revP)},resto:{n:resto.length,exp:_media(resto),expPL:_media(restoP)}};
}

/* ts: trades já com c=calc(t). Só entram os fechados (com saída). */
function estat(ts){
  const rows=ordenaCron(ts.filter(t=>t.c&&t.c.pl!=null)),n=rows.length;
  const pls=rows.map(t=>t.c.pl),ganhos=pls.filter(p=>p>0),perdas=pls.filter(p=>p<0);
  const gW=_soma(ganhos),gL=_soma(perdas),mediaGanho=_media(ganhos),mediaPerda=_media(perdas);
  const rr=rows.filter(t=>t.c.r!=null),rs=rr.map(t=>t.c.r),nR=rs.length,mR=_media(rs);
  const sd=nR>1?Math.sqrt(_soma(rs.map(r=>(r-mR)**2))/(nR-1)):null,ratio=sd?mR/sd:null;
  const curvaR=[];let ac=0,pk=0,dd=0,ddR=[],ddMax=0,ddAt=-1;
  rs.forEach((r,i)=>{ac+=r;curvaR.push(ac);pk=Math.max(pk,ac);dd=ac-pk;ddR.push(dd);if(-dd>ddMax){ddMax=-dd;ddAt=i}});
  const curvaPL=[];let ap=0,pp=0,ddPL=0,ddPLMax=0;
  pls.forEach(p=>{ap+=p;curvaPL.push(ap);pp=Math.max(pp,ap);ddPL=ap-pp;if(-ddPL>ddPLMax)ddPLMax=-ddPL});
  let mg=0,mp=0,cg=0,cp=0;
  pls.forEach(p=>{if(p>0){cg++;cp=0}else if(p<0){cp++;cg=0}else{cg=0;cp=0}mg=Math.max(mg,cg);mp=Math.max(mp,cp)});
  const dias=new Map();
  rows.forEach(t=>{const k=(t.dtx||t.dt||'').slice(0,10);const d=dias.get(k)||{k,pl:0,r:0,n:0};d.pl+=t.c.pl;d.r+=t.c.r||0;d.n++;dias.set(k,d)});
  const dl=[...dias.values()].sort((a,b)=>a.k<b.k?-1:1),dpl=dl.map(d=>d.pl);
  const dg=[],dp=[];
  rows.forEach(t=>{const m=minutosEntre(t.dt,t.dtx);if(m!=null)(t.c.pl>0?dg:t.c.pl<0?dp:[]).push(m)});
  const cap=rr.filter(t=>t.c.pl>0&&t.c.rr>0).map(t=>t.c.r/t.c.rr);
  const semErro=t=>!(t.err&&t.err!=='Nenhum'),ok=rows.filter(t=>semErro(t)&&t.rules!=='n'),quebrou=rows.filter(t=>t.rules==='n'),comErro=rows.filter(t=>!semErro(t));
  const heat={};rows.forEach(t=>{const w=semDe(t.dt),h=horaDe(t.dt);if(!w||!h)return;const k=w+'|'+h;(heat[k]??={n:0,somaR:0});heat[k].n++;heat[k].somaR+=t.c.r||0});
  const grande=rs.filter(r=>r<-1.05).length,perdasR=rs.filter(r=>r<0).length;
  const num=v=>numN(v)||0;
  return {
    rows,n,nR,semStop:n-nR,
    resultado:_soma(pls),ganhoBruto:gW,perdaBruta:gL,custos:_soma(rows.map(t=>num(t.cost))),
    acerto:n?ganhos.length/n:null,nGanhos:ganhos.length,nPerdas:perdas.length,
    mediaGanho,mediaPerda,payoff:mediaPerda?mediaGanho/-mediaPerda:null,profitFactor:gL<0?gW/-gL:null,expectativaPL:n?_soma(pls)/n:null,
    mediaR:mR,desvioR:sd,sqn:ratio==null?null:ratio*Math.sqrt(Math.min(nR,100)),sqn100:ratio==null?null:ratio*10,
    mediaGanhoR:_media(rs.filter(r=>r>0)),mediaPerdaR:_media(rs.filter(r=>r<0)),maiorR:nR?Math.max(...rs):null,menorR:nR?Math.min(...rs):null,
    perdasAcima1R:grande,nPerdasR:perdasR,
    curvaR,ddR,ddMaxR:ddMax,ddMaxEm:ddAt>=0?rr[ddAt].dtx||rr[ddAt].dt:null,ddAtualR:ddR.length?-ddR[ddR.length-1]:0,
    curvaPL,ddMaxPL:ddPLMax,ddAtualPL:curvaPL.length?pp-ap:0,
    maxSeqGanhos:mg,maxSeqPerdas:mp,seqAtual:cg?{tipo:'ganho',n:cg}:cp?{tipo:'perda',n:cp}:null,
    dias:dl,diasGanhos:dpl.filter(x=>x>0).length,diasPerdidos:dpl.filter(x=>x<0).length,melhorDia:dpl.length?Math.max(...dpl):null,piorDia:dpl.length?Math.min(...dpl):null,
    durGanhoMin:_media(dg),durPerdaMin:_media(dp),nDurGanho:dg.length,nDurPerda:dp.length,
    captura:_media(cap),nCaptura:cap.length,
    maiorPL:pls.length?Math.max(...pls):null,menorPL:pls.length?Math.min(...pls):null,
    regras:{plErros:_soma(comErro.map(t=>t.c.pl)),plSemErro:_soma(rows.filter(semErro).map(t=>t.c.pl)),mediaPlOk:_media(ok.map(t=>t.c.pl)),mediaPlQuebrou:_media(quebrou.map(t=>t.c.pl)),ok:ok.length,quebrou:quebrou.length,erros:comErro.length,mediaOk:_media(ok.filter(t=>t.c.r!=null).map(t=>t.c.r)),mediaQuebrou:_media(quebrou.filter(t=>t.c.r!=null).map(t=>t.c.r)),rErros:_soma(comErro.map(t=>t.c.r||0)),rSemErro:_soma(rows.filter(semErro).map(t=>t.c.r||0))},
    porDia:agrupa(rows,t=>semDe(t.dt),['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']),porHora:agrupa(rows,t=>horaDe(t.dt)).sort((a,b)=>a.k<b.k?-1:1),
    porSetup:agrupa(rows,t=>t.setup),porMercado:agrupa(rows,t=>t.mkt),porAtivo:agrupa(rows,t=>(t.ativo||'').toUpperCase()),porErro:agrupa(comErro,t=>t.err),
    heat,revanche:revancheDe(rr),
  };
}

/* ---- diagnósticos: regras fixas, cada uma com os números que a justificam (a IA só interpreta) ---- */
const _f=(x,d=2)=>x==null?'–':x.toFixed(d).replace('.',',');
const _R=x=>x==null?'–':(x>0?'+':'')+_f(x)+'R';
const _pct=x=>x==null?'–':_f(x*100,0)+'%';
function diagnosticos(e,fm){
  const D=[],add=(nivel,id,titulo,texto)=>D.push({nivel,id,titulo,texto});
  const M=fm||(x=>x==null?'–':(x<0?'-':'')+'R$ '+Math.abs(x).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}));
  const Ms=x=>x==null?'–':(x>0?'+':'')+M(x);
  if(!e.n)return D;
  if(e.semStop>0)add('alerta','sem-stop',`${e.semStop} trade(s) fechado(s) sem stop`,`Sem o stop inicial o app não consegue medir quanto você arriscou. Esses trades entram no resultado, mas ficam fora das contas de risco (perdas maiores que o planejado, captura do alvo e qualidade do sistema). Preencha o stop inicial.`);
  if(e.n<30)add('info','amostra',`Amostra pequena (${e.n} trades)`,`Com menos de 30 trades os números ainda oscilam muito. Use como pista, não como conclusão.`);
  if(e.nR>=20&&e.mediaR!=null){
    if(e.mediaR<=0)add('alerta','expectancia',`Média negativa: ${Ms(e.expectativaPL)} por trade`,`Em ${e.n} trades você perde em média ${M(Math.abs(e.expectativaPL||0))} por operação. Nesse ritmo o sistema perde dinheiro mesmo com disciplina; revise setup, stop e alvo antes de aumentar a mão.`);
    else add('ok','expectancia',`Média positiva: ${Ms(e.expectativaPL)} por trade`,`Em ${e.n} trades você ganha em média ${M(e.expectativaPL)} por operação. Qualidade do sistema: ${qualSQN(e.sqn100).toLowerCase()} (nota ${_f(e.sqn100)}).`);
  }
  if(e.nPerdasR>=5&&e.perdasAcima1R/e.nPerdasR>0.3)add('alerta','stop-nao-respeitado',`${e.perdasAcima1R} de ${e.nPerdasR} perdas passaram do stop planejado`,`Perder mais do que o risco planejado indica stop movido, não executado ou mão maior que o plano. A pior perda foi ${M(e.menorPL)}.`);
  if(e.nCaptura>=5&&e.captura!=null&&e.captura<0.6)add('alerta','saida-cedo',`Você realiza só ${_pct(e.captura)} do ganho planejado`,`Nos ${e.nCaptura} ganhos com alvo definido, você saiu em média com ${_pct(e.captura)} do que ganharia no alvo. Há sinal de saída antecipada; compare com o que o preço fez depois.`);
  if(e.nDurGanho>=5&&e.nDurPerda>=5&&e.durGanhoMin<e.durPerdaMin*0.7)add('alerta','ganho-curto-perda-longa',`Ganhos duram menos que perdas`,`Ganhos ficam em média ${_f(e.durGanhoMin,0)} min e perdas ${_f(e.durPerdaMin,0)} min. É o padrão de realizar rápido e segurar o que dá errado.`);
  if(e.regras.erros>=3&&e.regras.rErros<0)add('alerta','custo-erros',`Trades com erro custaram ${M(e.regras.plErros)}`,`${e.regras.erros} trades tiveram erro registrado e somam ${Ms(e.regras.plErros)}; os demais somam ${Ms(e.regras.plSemErro)}.`);
  if(e.regras.quebrou>=5&&e.regras.mediaOk!=null&&e.regras.mediaQuebrou!=null&&e.regras.mediaQuebrou<e.regras.mediaOk)add('alerta','regras',`Quebrar regras piora o resultado`,`Seguindo as regras a média é ${Ms(e.regras.mediaPlOk)} por trade; quebrando, ${Ms(e.regras.mediaPlQuebrou)} (${e.regras.quebrou} trades).`);
  const fraco=(g,nome)=>{const c=g.filter(x=>x.n>=8&&x.nR>=8&&x.mediaR<0).sort((a,b)=>a.somaR-b.somaR)[0];if(c)add('info','fraco-'+nome,`Ponto fraco: ${nome} ${c.k}`,`${c.n} trades, média de ${Ms(c.mediaPL)} por trade, total ${Ms(c.somaPL)}. Considere evitar ou reduzir a mão aqui.`)};
  fraco(e.porDia,'dia da semana');fraco(e.porHora,'horário');fraco(e.porSetup,'setup');
  if(e.dias.length>=10){
    const ns=e.dias.map(d=>d.n).sort((a,b)=>a-b),med=ns[Math.floor(ns.length/2)],muito=e.dias.filter(d=>d.n>med),pouco=e.dias.filter(d=>d.n<=med);
    if(muito.length>=3&&pouco.length>=3){const a=_media(muito.map(d=>d.r/d.n)),b=_media(pouco.map(d=>d.r/d.n));if(a<b-0.2){const ap=_media(muito.map(d=>d.pl/d.n)),bp=_media(pouco.map(d=>d.pl/d.n));add('alerta','overtrading','Dias com mais trades rendem menos',`Em dias acima de ${med} trade(s) a média é ${Ms(ap)} por trade, contra ${Ms(bp)} nos demais. Pode ser excesso de operações.`)}}
  }
  if(e.revanche&&e.revanche.rev.exp<e.revanche.resto.exp-0.2)add('alerta','revanche','Trades logo depois de uma perda rendem menos',`Entradas até ${e.revanche.janelaMin} min depois de uma perda: ${Ms(e.revanche.rev.expPL)} por trade (${e.revanche.rev.n} trades), contra ${Ms(e.revanche.resto.expPL)} nos demais. Pode ser revanche; espere antes de operar de novo.`);
  if(e.seqAtual&&e.seqAtual.tipo==='perda'&&e.seqAtual.n>=3)add('alerta','sequencia',`${e.seqAtual.n} perdas seguidas`,`Sequência de perdas é o momento de maior risco emocional. Considere parar o dia e revisar os últimos trades.`);
  if(e.ddMaxR>0&&e.ddAtualR>0&&e.ddAtualR>=e.ddMaxR*0.5)add('info','drawdown',`Você está ${M(e.ddAtualPL)} abaixo do seu melhor momento`,`O maior recuo da conta até hoje foi de ${M(e.ddMaxPL)}; o recuo atual já está perto da metade disso.`);
  if(e.profitFactor!=null&&e.n>=20&&e.profitFactor<1)add('alerta','profit-factor',`Ganhos não cobrem as perdas (fator ${_f(e.profitFactor)})`,`Para cada R$ 1 perdido você ganhou ${M(e.profitFactor)}. Abaixo de 1 o resultado fica negativo.`);
  if(e.ganhoBruto>0&&e.custos/e.ganhoBruto>0.3)add('info','custos',`Custos consomem ${_pct(e.custos/e.ganhoBruto)} dos ganhos brutos`,`Corretagem e taxas somam ${M(e.custos)} contra ${M(e.ganhoBruto)} de ganho bruto.`);
  return D;
}
/* ==== ESTATISTICAS:FIM ==== */

/* ---------- Estatísticas: tela nova (todos os números vêm do bloco testado acima; a IA só interpreta) ---------- */
const ST={aba:ls.get('diario-st-aba')||'geral',ia:Object.assign({busy:0,err:'',rel:null,chave:'',em:0},ls.get('diario-st-ia')||{},{busy:0,err:''})};
const ST_ABAS=[['geral','Geral'],['risco','Risco'],['onde','Quando e onde'],['diag','Diagnóstico']];
const frN=x=>x==null?'–':fr(x),f2N=x=>x==null?'–':f2(x),pcN=x=>x==null?'–':pc(x);

function stRows(){
  const hoje=loc().slice(0,10);
  return S.trades.filter(t=>TIPO==='all'||(t.tipo||'D')===TIPO).map(t=>({...t,c:calc(t)}))
    .filter(t=>t.c.pl!=null&&noPeriodo((t.dtx||t.dt||'').slice(0,10),PER,hoje));
}
/* moeda da tela: a dos trades; se misturar R$ e US$, converte tudo para R$ (cotação do dólar do app) */
function stCtx(){
  const rows=stRows(),ms=[...new Set(rows.map(moedaT))],mix=ms.length>1,mo=mix?'BRL':(ms[0]||'BRL');
  const rr=mix?rows.map(t=>({...t,c:{...t.c,pl:emBRL(t.c.pl,moedaT(t)),risk:t.c.risk==null?null:emBRL(t.c.risk,moedaT(t))}})):rows;
  return {rows:rr,mo,mix,fm:v=>mnyC(v,mo),fs:v=>v==null?'–':(v>0?'+':'')+mnyC(v,mo)};
}
const stTbl=(nome,g,fs)=>g.length?tbl([nome,'Nº','Acerto','Média','Total'],g.map(x=>`<tr><td>${esc(x.k)}</td><td>${x.n}</td><td>${pcN(x.acerto)}</td><td class="${cls(x.mediaPL)}">${fs(x.mediaPL)}</td><td class="${cls(x.somaPL)}">${fs(x.somaPL)}</td></tr>`).join('')):'';
function stHeat(e,fs){
  const H={};e.rows.forEach(t=>{const w=semDe(t.dt),h=horaDe(t.dt);if(!w||!h)return;const k=w+'|'+h;(H[k]??={n:0,pl:0});H[k].n++;H[k].pl+=t.c.pl});
  const ks=Object.keys(H);if(!ks.length)return '';
  const dias=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].filter(d=>ks.some(k=>k.startsWith(d+'|'))),horas=[...new Set(ks.map(k=>k.split('|')[1]))].sort();
  const mx=Math.max(...Object.values(H).map(c=>Math.abs(c.pl)),1),cp=v=>{const a=Math.abs(v);return (v<0?'-':v>0?'+':'')+(a>=1000?(a/1000).toFixed(1).replace('.',',')+'k':Math.round(a))};
  const cel=(d,h)=>{const c=H[d+'|'+h];if(!c)return '<td></td>';const a=Math.min(.85,.18+Math.abs(c.pl)/mx*.67);return `<td style="background:${c.pl>=0?`rgba(46,160,67,${a})`:`rgba(229,83,75,${a})`};text-align:center;padding:6px 4px;font-size:12px" title="${c.n} trade(s): ${fs(c.pl)}">${cp(c.pl)}<div style="opacity:.75;font-size:10px">${c.n}x</div></td>`};
  return `<div class="card" style="overflow-x:auto"><table style="min-width:${70+horas.length*54}px"><tr><th></th>${horas.map(h=>`<th>${h}</th>`).join('')}</tr>${dias.map(d=>`<tr><th>${d}</th>${horas.map(h=>cel(d,h)).join('')}</tr>`).join('')}</table></div><div class="sm mut">Resultado somado por dia da semana e hora de entrada. Verde ganha, vermelho perde; o número pequeno é a quantidade de trades.</div>`;
}
const ST_NIV={alerta:['⚠️','var(--r)'],info:['ℹ️','#d9a400'],ok:['✅','var(--g)']};
const stDiagHtml=D=>D.length?D.map(d=>{const [i,c]=ST_NIV[d.nivel]||ST_NIV.info;return `<div class="card" style="border-left:4px solid ${c};margin:8px 0"><b>${i} ${esc(d.titulo)}</b><div class="sm" style="margin-top:4px;line-height:1.5">${esc(d.texto)}</div></div>`}).join(''):'<p class="mut">Nenhum ponto de atenção com os dados atuais.</p>';

/* pacote com os números já calculados que a IA vai interpretar (nunca os trades crus), em dinheiro e % */
function stPacote(e,D,X){
  X=X||stCtx();
  const r=x=>x==null?null:+(+x).toFixed(2),g=a=>a.slice(0,8).map(x=>({grupo:x.k,trades:x.n,acerto_pct:x.acerto==null?null:Math.round(x.acerto*100),media_por_trade:r(x.mediaPL),total:r(x.somaPL)}));
  return {
    resumo:{periodo:(PERIODOS.find(p=>p[0]===PER)||[])[1]||PER,tipo:TIPO,moeda:X.mo==='USD'?'dólar (US$)':'real (R$)',trades_fechados:e.n,trades_sem_stop:e.semStop,resultado:r(e.resultado),
      media_por_trade:r(e.expectativaPL),acerto_pct:e.acerto==null?null:Math.round(e.acerto*100),fator_de_lucro:r(e.profitFactor),ganho_medio_sobre_perda_media:r(e.payoff),
      ganho_medio:r(e.mediaGanho),perda_media:r(e.mediaPerda),maior_ganho:r(e.maiorPL),maior_perda:r(e.menorPL),perdas_maiores_que_o_stop:e.perdasAcima1R,perdas_com_stop_definido:e.nPerdasR,
      maior_recuo_da_conta:r(e.ddMaxPL),recuo_atual:r(e.ddAtualPL),qualidade_do_sistema_sqn:r(e.sqn100),max_seq_ganhos:e.maxSeqGanhos,max_seq_perdas:e.maxSeqPerdas,seq_atual:e.seqAtual,
      captura_do_alvo_pct:e.captura==null?null:Math.round(e.captura*100),duracao_ganhos_min:r(e.durGanhoMin),duracao_perdas_min:r(e.durPerdaMin),custos:r(e.custos),
      regras_seguidas:e.regras.ok,regras_quebradas:e.regras.quebrou,trades_com_erro:e.regras.erros,resultado_dos_trades_com_erro:r(e.regras.plErros),media_seguindo_regras:r(e.regras.mediaPlOk),media_quebrando_regras:r(e.regras.mediaPlQuebrou),
      observacao_para_a_ia:'Fale sempre em dinheiro (R$ ou US$) e em porcentagem. Não use R-múltiplo nem a letra R para resultados; o usuário não usa essa medida.'},
    diagnosticos:D.map(d=>({nivel:d.nivel,titulo:d.titulo,texto:d.texto})),
    grupos:{por_dia_da_semana:g(e.porDia),por_hora:g(e.porHora),por_setup:g(e.porSetup),por_mercado:g(e.porMercado),por_erro:g(e.porErro)}
  };
}
async function stIA(e,D){
  if(ST.ia.busy)return;
  const p=stPacote(e,D),chave=hs(JSON.stringify(p));
  ST.ia.busy=1;ST.ia.err='';render();
  try{
    const j=await anxCall({modo:'estatisticas',resumo:p.resumo,diagnosticos:p.diagnosticos,grupos:p.grupos});
    ST.ia.rel=j.relatorio||null;ST.ia.chave=chave;ST.ia.em=Date.now();
    ls.set('diario-st-ia',{rel:ST.ia.rel,chave,em:ST.ia.em});
    if(!ST.ia.rel)ST.ia.err='A IA não devolveu a interpretação. Tente de novo.';
  }catch(err){ST.ia.err=err.message||String(err)}
  ST.ia.busy=0;render();
}
const stT=x=>typeof x==='string'?esc(x):x&&typeof x==='object'?Object.entries(x).map(([k,v])=>`<b>${esc(k)}:</b> ${esc(String(v))}`).join(' · '):'';
function stIAHtml(e,D){
  const I=ST.ia,chave=hs(JSON.stringify(stPacote(e,D))),rel=I.rel,L=a=>Array.isArray(a)?a:[];
  const btn=`<button class="btn" data-st="ia"${I.busy?' disabled':''}>${I.busy?'Interpretando…':rel?'🤖 Interpretar de novo':'🤖 Interpretar com IA'}</button>`;
  let h=`<div class="card" style="margin:12px 0"><div class="top"><b>🤖 Leitura da IA</b></div><div class="sm mut" style="margin:4px 0 8px">Todos os números abaixo foram calculados pelo app. A IA só explica o que eles significam e sugere um plano de ação.</div>${btn}${I.err?`<div class="warn" style="margin-top:8px">${esc(I.err)}</div>`:''}`;
  if(rel){
    if(I.chave!==chave)h+='<div class="sm mut" style="margin-top:8px">Os números mudaram desde esta leitura. Gere de novo para atualizar.</div>';
    const sec=(t,x)=>x?`<div style="margin-top:12px"><b>${t}</b>${x}</div>`:'';
    const P=a=>L(a).map(x=>`<p style="margin:6px 0;line-height:1.5">${stT(x)}</p>`).join('');
    const C=a=>L(a).map(x=>`<div class="card" style="margin:6px 0"><b>${esc(x.tema||'')}</b>${x.evidencia?`<div class="sm mut" style="margin-top:2px">${esc(x.evidencia)}</div>`:''}<div class="sm" style="margin-top:4px">${esc(x.acao||x.por_que_importa||'')}</div></div>`).join('');
    h+=sec('Leitura geral',P(rel.leitura_geral))+sec('Pontos fortes',C(rel.pontos_fortes))+sec('Pontos de melhoria',C(rel.pontos_de_melhoria))+sec('Padrões de comportamento',P(rel.padroes_de_comportamento))
      +sec('Plano para os próximos 20 trades',L(rel.plano_proximos_20_trades).length?'<ol style="margin:6px 0;padding-left:20px">'+L(rel.plano_proximos_20_trades).map(x=>`<li style="margin:4px 0">${stT(x)}</li>`).join('')+'</ol>':'')+sec('Alertas',P(rel.alertas))
      +`<div class="sm mut" style="margin-top:10px">Gerada por IA${I.em?' em '+new Date(I.em).toLocaleDateString('pt-BR'):''}. Não é recomendação de investimento.</div>`;
  }
  return h+'</div>';
}

function vStats(){
  const head='<div class="top"><h1>Estatísticas</h1><button class="btn s" data-a="csv" id="csvb">Exportar CSV</button></div>';
  const filtros=perSel()+tipoSel()+'<div class="sm mut" style="margin:-2px 0 8px">O período vale pela data de saída de cada trade.</div>';
  const X=stCtx(),fm=X.fm,fs=X.fs,e=estat(X.rows),tp=TIPO==='all'?undefined:TIPO,pct=v=>pctConta(v,X.mo,tp);
  if(!e.n)return head+filtros+'<p class="mut">Feche trades (com saída) para ver as estatísticas. Quanto mais trades, mais confiáveis ficam os números: o ideal é juntar de 100 a 200.</p>';
  const D=diagnosticos(e,fm),alertas=D.filter(d=>d.nivel==='alerta').length;
  const abas=`<div class="seg" style="margin:8px 0">${ST_ABAS.map(([k,l])=>`<button class="${ST.aba===k?'on':''}" data-st="${k}">${l}${k==='diag'&&alertas?` <span style="color:var(--r)">●${alertas}</span>`:''}</button>`).join('')}</div>`;
  const kpi=`<div class="kv" style="margin-top:8px">${KV('Resultado',fs(e.resultado),cls(e.resultado),e.n+' trades'+(pct(e.resultado)?' · '+pct(e.resultado):''))}${KV('Média por trade',fs(e.expectativaPL),cls(e.expectativaPL),'quanto você ganha ou perde, em média, por operação')}${KV('Acerto',pcN(e.acerto),'',e.nGanhos+' ganhos · '+e.nPerdas+' perdas')}${KV('Ganho médio ÷ perda média',e.payoff==null?'–':f2(e.payoff)+'x','','ganho médio '+fm(e.mediaGanho)+' · perda média '+fm(e.mediaPerda==null?null:-e.mediaPerda))}${KV('Fator de lucro',f2N(e.profitFactor),e.profitFactor!=null&&e.profitFactor<1?'r':'','ganhos brutos ÷ perdas brutas (acima de 1 = lucro)')}${KV('Maior recuo da conta',fm(e.ddMaxPL),e.ddMaxPL>0?'r':'','atual '+fm(e.ddAtualPL)+(pct(-e.ddMaxPL)?' · '+pct(-e.ddMaxPL).replace(' da conta',' da conta no pior momento'):''))}</div>`;
  const aviso=(X.mix?`<div class="sm mut" style="margin-top:8px">Você tem trades em R$ e em US$: os valores desta tela foram convertidos para R$ (dólar a ${f2(+axg('brl',5.4)||5.4)}).</div>`:'')+(e.n<30?`<div class="warn" style="margin-top:8px">Amostra pequena (${e.n} trades): use os números como pista, não como conclusão.</div>`:'');
  const lab=e.rows.map(t=>fdt(t.dtx||t.dt).slice(0,5)+' '+(t.ativo||''));
  let corpo='';
  if(ST.aba==='geral'){
    const dk=e.dias.slice(-20);let pk=-Infinity;const dd=e.curvaPL.map(v=>{pk=Math.max(pk,v);return v-pk});
    const ult=e.rows.slice(-30);
    corpo=`<h2>Evolução do resultado</h2>${lineChart('eq',e.curvaPL,lab,v=>fs(v))}<h2>Recuos da conta</h2>${lineChart('dd',dd,lab,v=>fm(v))}<div class="sm mut">Quanto o resultado acumulado caiu em relação ao melhor momento anterior.</div><h2>Resultado por dia</h2>${barChart('dia',dk.map(d=>d.pl),dk.map(d=>d.k.slice(8)+'/'+d.k.slice(5,7)))}<div class="kv">${KV('Dias ganhos / perdidos',e.diasGanhos+' / '+e.diasPerdidos)}${KV('Melhor / pior dia',fs(e.melhorDia)+' / '+fs(e.piorDia))}</div><h2>Últimos ${ult.length} trades</h2>${barChart('tr',ult.map(t=>t.c.pl),ult.map(t=>fdt(t.dtx||t.dt).slice(0,5)))}`;
  }else if(ST.aba==='risco'){
    const R=e.regras;
    corpo=`<div class="kv" style="margin-top:8px">${KV('Ganho médio',fm(e.mediaGanho),'g')}${KV('Perda média',fm(e.mediaPerda),'r')}${KV('Maior ganho / maior perda',fs(e.maiorPL)+' / '+fs(e.menorPL))}${KV('Perdas maiores que o stop planejado',e.perdasAcima1R+' de '+e.nPerdasR,e.nPerdasR&&e.perdasAcima1R>e.nPerdasR*.3?'r':'','se muitas perdas passam do stop, ele não está sendo respeitado')}${KV('Qualidade do sistema',f2N(e.sqn100),'',qualSQN(e.sqn100)+' (nota SQN, padrão de 100 trades)')}${KV('Captura do alvo',e.captura==null?'–':pc(e.captura),e.captura!=null&&e.captura<.6?'r':'','quanto do ganho planejado até o alvo você realiza ('+e.nCaptura+' ganhos)')}${KV('Duração: ganhos × perdas',(e.durGanhoMin==null?'–':f2(e.durGanhoMin)+' min')+' × '+(e.durPerdaMin==null?'–':f2(e.durPerdaMin)+' min'))}</div>
<div class="rings">${ring((e.acerto||0)*100,'Acerto')}${ring(e.n?R.ok/e.n*100:0,'Regras seguidas','var(--g)')}${ring(e.n?(e.n-R.erros)/e.n*100:0,'Sem erro','#e8a317')}</div>
<h2>Disciplina e erros</h2><div class="kv">${KV('Trades sem erro',pcN(e.n?(e.n-R.erros)/e.n:null),R.erros?'':'g')}${KV('Erros a cada 100 trades',f2(e.n?R.erros/e.n*100:0))}${KV('Resultado dos trades com erro',fs(R.plErros),cls(R.plErros))}${KV('Média: regras seguidas × quebradas',fs(R.mediaPlOk)+' × '+fs(R.mediaPlQuebrou),'','resultado médio por trade em cada grupo')}</div>${stTbl('Erro',e.porErro,fs)}
<h2>Sequências</h2><div class="kv">${KV('Maior sequência de ganhos',e.maxSeqGanhos,'g')}${KV('Maior sequência de perdas',e.maxSeqPerdas,'r')}${KV('Sequência atual',e.seqAtual?e.seqAtual.n+' '+e.seqAtual.tipo+(e.seqAtual.n>1?'s':''):'–',e.seqAtual?(e.seqAtual.tipo==='ganho'?'g':'r'):'')}</div>`;
  }else if(ST.aba==='onde'){
    const op=e.rows.filter(t=>t.tipo==='O');
    corpo=`<h2>Mapa de calor: dia × hora</h2>${stHeat(e,fs)}<h2>Por dia da semana</h2>${stTbl('Dia',e.porDia,fs)}<h2>Por horário de entrada</h2>${stTbl('Hora',e.porHora,fs)}<h2>Por setup</h2>${stTbl('Setup',e.porSetup,fs)}<h2>Por tipo de mercado</h2>${stTbl('Mercado',e.porMercado,fs)}<h2>Por ativo</h2>${stTbl('Ativo',e.porAtivo.slice().sort((a,b)=>b.n-a.n).slice(0,15),fs)}${op.length?`<h2>Opções por estrutura</h2>${stTbl('Estrutura',agrupa(op,t=>t.estr),fs)}`:''}`;
  }else{
    corpo=`<h2>Pontos de atenção</h2>${stDiagHtml(D)}${stIAHtml(e,D)}`;
  }
  return head+filtros+abas+kpi+aviso+corpo;
}

(function(){
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-st]');if(!b)return;
    const k=b.dataset.st;
    if(k==='ia'){const X=stCtx(),x=estat(X.rows);stIA(x,diagnosticos(x,X.fm));return}
    ST.aba=k;ls.set('diario-st-aba',k);render();
  });
})();
/* ==== VISUAL:INICIO ==== tema profissional: cores, tipografia, componentes, ícones de linha e barra inferior */
(function(){
const css=`
:root{--bg:#0a0c10;--card:#12151b;--card2:#191d25;--bd:rgba(255,255,255,.08);--bd2:rgba(255,255,255,.14);--tx:#e7e9ee;--mut:#8b93a4;--ac:#4c8dff;--ac2:rgba(76,141,255,.14);--g:#22ab94;--r:#f2555f;--am:#e0a43a;--rad:14px;--nav:64px;
  --fs:-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Segoe UI",Roboto,Helvetica,Arial,sans-serif}
@media (prefers-color-scheme:light){:root:not([data-theme="dark"]){--bg:#f4f5f7;--card:#ffffff;--card2:#f0f2f5;--bd:rgba(15,23,42,.09);--bd2:rgba(15,23,42,.16);--tx:#111827;--mut:#64748b;--ac:#2563eb;--ac2:rgba(37,99,235,.10);--g:#0f9d84;--r:#e0384a;--am:#b7791f}}
:root[data-theme="light"]{--bg:#f4f5f7;--card:#ffffff;--card2:#f0f2f5;--bd:rgba(15,23,42,.09);--bd2:rgba(15,23,42,.16);--tx:#111827;--mut:#64748b;--ac:#2563eb;--ac2:rgba(37,99,235,.10);--g:#0f9d84;--r:#e0384a;--am:#b7791f}
:root[data-theme="dark"]{--bg:#0a0c10;--card:#12151b;--card2:#191d25;--bd:rgba(255,255,255,.08);--bd2:rgba(255,255,255,.14);--tx:#e7e9ee;--mut:#8b93a4;--ac:#4c8dff;--ac2:rgba(76,141,255,.14);--g:#22ab94;--r:#f2555f;--am:#e0a43a}
html body{background:var(--bg);color:var(--tx);font-family:var(--fs);font-size:15px;line-height:1.45;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums;letter-spacing:-.005em}
html body #app{max-width:760px;margin:0 auto;padding:14px 16px calc(var(--nav) + 28px + env(safe-area-inset-bottom,0px))!important}
html body h1{font-size:26px;font-weight:700;letter-spacing:-.025em;margin:6px 0 10px}
html body h2{font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--mut);margin:22px 0 8px}
html body h3{font-size:15px;font-weight:650;margin:16px 0 8px}
html body .sm{font-size:13px}html body .mut{color:var(--mut)}
html body .g,html body b.g,html body .g b{color:var(--g)}html body .r,html body b.r{color:var(--r)}
html body .card{background:var(--card);border:1px solid var(--bd);border-radius:var(--rad);padding:14px;margin:10px 0;box-shadow:none}
html body .card .card{background:var(--card2);border-color:transparent}
html body .top{display:flex;align-items:center;justify-content:space-between;gap:10px}
html body .row{display:flex;align-items:center;gap:12px}
html body .fl{flex:1;min-width:0}html body .rt{text-align:right;font-weight:650;white-space:nowrap}
html body .th{width:46px;height:46px;border-radius:10px;background:var(--card2);display:flex;align-items:center;justify-content:center;overflow:hidden;flex:none;color:var(--mut)}
html body .th img{width:100%;height:100%;object-fit:cover}
html body .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}html body .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
html body .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:8px 14px;border-radius:10px;border:1px solid transparent;background:var(--ac);color:#fff;font:600 14px/1.2 var(--fs);cursor:pointer;transition:filter .15s,background .15s,transform .05s;-webkit-tap-highlight-color:transparent}
html body .btn:active{transform:scale(.98)}html body .btn:disabled{opacity:.5}
html body .btn.s{background:var(--card2);color:var(--tx);border-color:var(--bd)}
html body .btn.d{background:transparent;color:var(--r);border-color:color-mix(in srgb,var(--r) 45%,transparent)}
html body .x{background:transparent;border:0;color:var(--mut);font-size:18px;width:36px;height:36px;border-radius:10px;cursor:pointer}
html body .seg{display:flex!important;gap:2px;padding:3px;background:var(--card2);border:1px solid var(--bd);border-radius:12px;overflow-x:auto;scrollbar-width:none}
html body .seg::-webkit-scrollbar{display:none}
html body .seg>button{flex:1 0 auto;min-height:34px;padding:6px 12px;border:0;border-radius:9px;background:transparent;color:var(--mut);font:600 13.5px var(--fs);white-space:nowrap;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px}
html body .seg>button.on{background:var(--card);color:var(--tx);box-shadow:0 1px 2px rgba(0,0,0,.25),0 0 0 1px var(--bd)}
html body label{display:block;font-size:12.5px;font-weight:600;color:var(--mut);margin:10px 0 0}
html body input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]),html body select,html body textarea{display:block;width:100%;box-sizing:border-box;margin-top:5px;min-height:42px;padding:9px 12px;border-radius:10px;border:1px solid var(--bd2);background:var(--card2);color:var(--tx);font:15px var(--fs);outline:none;-webkit-appearance:none;appearance:none}
html body select{background-image:linear-gradient(45deg,transparent 50%,var(--mut) 50%),linear-gradient(135deg,var(--mut) 50%,transparent 50%);background-position:calc(100% - 17px) 55%,calc(100% - 12px) 55%;background-size:5px 5px;background-repeat:no-repeat;padding-right:32px}
html body input:focus,html body select:focus,html body textarea:focus{border-color:var(--ac);box-shadow:0 0 0 3px var(--ac2)}
html body input[type=file]{margin-top:6px;font-size:13px;color:var(--mut)}
html body textarea{min-height:84px;line-height:1.45}
html body .ck{display:flex;align-items:center;gap:8px;font-weight:500;color:var(--tx)}
html body .kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
html body .kv>.card{margin:0;padding:12px;display:flex;flex-direction:column;gap:2px;background:var(--card);border:1px solid var(--bd)}
html body .kv>.card>span.mut:first-child{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
html body .kv>.card>b{font-size:20px;font-weight:700;letter-spacing:-.02em}
html body .warn{border:1px solid color-mix(in srgb,var(--am) 40%,transparent);background:color-mix(in srgb,var(--am) 9%,transparent);color:var(--tx);border-radius:12px;padding:10px 12px;font-size:13.5px}
html body .chip,html body .tag{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;background:var(--card2);border:1px solid var(--bd);font-size:12.5px;font-weight:600;color:var(--tx);margin:4px 6px 0 0}
html body .tag{padding:2px 8px;font-size:11.5px;color:var(--am);border-color:color-mix(in srgb,var(--am) 35%,transparent);background:transparent}
html body .hero{background:linear-gradient(160deg,color-mix(in srgb,var(--ac) 16%,var(--card)) 0%,var(--card) 70%);border:1px solid var(--bd);border-radius:18px;padding:18px;margin:6px 0 12px}
html body .hero .big,html body .big{font-size:40px;font-weight:750;letter-spacing:-.035em;line-height:1.1;margin:2px 0}
html body table{width:100%;border-collapse:collapse;font-size:13.5px}
html body th{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--mut);text-align:left;padding:6px 6px;border-bottom:1px solid var(--bd)}
html body td{padding:8px 6px;border-top:1px solid var(--bd)}
html body details>summary{cursor:pointer;list-style:none}html body details>summary::-webkit-details-marker{display:none}
html body details>summary::before{content:'';display:inline-block;width:7px;height:7px;border-right:2px solid var(--mut);border-bottom:2px solid var(--mut);transform:rotate(-45deg);margin:0 10px 2px 2px;transition:transform .15s}
html body details[open]>summary::before{transform:rotate(45deg)}
html body .rings{display:flex;justify-content:space-around;gap:8px;margin:10px 0}
html body .mc,html body .cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}
html body .dc,html body .cal>button{min-height:44px;border-radius:9px;border:1px solid var(--bd);background:var(--card);color:var(--tx);display:flex;flex-direction:column;align-items:center;justify-content:center;font:12px var(--fs);padding:2px}
html body #sh .ov{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.55);overflow-y:auto;-webkit-overflow-scrolling:touch}
html body #sh .sh{background:var(--bg);max-width:640px;margin:max(24px,env(safe-area-inset-top)) auto 0;min-height:100%;border-radius:18px 18px 0 0;padding:16px 16px calc(40px + env(safe-area-inset-bottom));border-top:1px solid var(--bd)}
html body #tst{border-radius:12px!important;background:var(--card2)!important;color:var(--tx)!important;border:1px solid var(--bd2)!important;box-shadow:0 8px 30px rgba(0,0,0,.35)!important}
/* topo (ticker) e menu */
html body #tape{background:var(--bg)!important;border-bottom:1px solid var(--bd)!important}
html body #mbtn{background:var(--bg)!important;color:var(--tx)!important;border-right:1px solid var(--bd)!important}
html body #mdr .mpn{background:var(--bg)!important}
html body #mdr .mit{border-radius:12px}html body #mdr .mi{color:var(--ac);display:inline-flex;width:28px;justify-content:center}
html body #mdr .mi .ico{width:22px;height:22px;margin:0}
/* botão + acima da barra de baixo */
html body #fab{position:fixed;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;border:0;z-index:40;bottom:calc(var(--nav) + 16px + env(safe-area-inset-bottom,0px))!important;right:16px!important;width:52px!important;height:52px!important;border-radius:16px!important;background:var(--ac)!important;box-shadow:0 6px 20px rgba(0,0,0,.35)!important}
html body #fabm{bottom:calc(var(--nav) + 78px + env(safe-area-inset-bottom,0px))!important}
/* barra inferior */
#bnav{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;justify-content:space-around;align-items:stretch;height:calc(var(--nav) + env(safe-area-inset-bottom,0px));padding-bottom:env(safe-area-inset-bottom,0px);background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:saturate(1.6) blur(14px);-webkit-backdrop-filter:saturate(1.6) blur(14px);border-top:1px solid var(--bd)}
#bnav button{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;background:none;border:0;color:var(--mut);font:600 10.5px var(--fs);letter-spacing:.01em;cursor:pointer;-webkit-tap-highlight-color:transparent}
#bnav button svg{width:23px;height:23px}
#bnav button.on{color:var(--ac)}
body.semnav #bnav{display:none}
/* ícones no lugar dos emojis */
.ico{width:1.1em;height:1.1em;vertical-align:-.17em;margin-right:.38em;flex:none;display:inline-block}
h1 .ico,h2 .ico{margin-right:.3em}.seg .ico,.btn .ico{margin-right:0}
.dot{display:inline-block;width:.6em;height:.6em;border-radius:50%;margin-right:.4em;vertical-align:.05em}
html body .chips2{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
html body .chips2>button{min-height:34px;padding:6px 13px;border-radius:999px;border:1px solid var(--bd2);background:var(--card2);color:var(--tx);font:600 13.5px var(--fs);cursor:pointer}
html body .chips2>button.on{background:var(--ac2);border-color:var(--ac);color:var(--ac)}
html body .chips2>button.on.g{background:color-mix(in srgb,var(--g) 14%,transparent);border-color:var(--g);color:var(--g)}
html body .chips2>button.on.r{background:color-mix(in srgb,var(--r) 14%,transparent);border-color:var(--r);color:var(--r)}
html body #sh .sh .top h2,html body .sh>.top>h2{font-size:19px;text-transform:none;letter-spacing:-.015em;color:var(--tx);margin:0}
.cap1::first-letter{text-transform:uppercase}
html body .ib{width:40px;padding:0;flex:none}
html body #fab{display:none!important}
html body #fabm{left:50%!important;right:auto!important;transform:translateX(-50%);flex-direction:column;gap:6px;padding:8px;background:var(--card);border:1px solid var(--bd2);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.45);z-index:55;bottom:calc(var(--nav) + 14px + env(safe-area-inset-bottom,0px))!important}
#bnav .mais{flex:0 0 64px}
#bnav .mais span.bx{width:48px;height:48px;margin-top:-10px;border-radius:16px;background:var(--ac);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px color-mix(in srgb,var(--ac) 45%,transparent)}
#bnav .mais span.bx svg{width:26px;height:26px}
html body .mk-seg>button.btn{flex:1 0 auto;background:transparent;color:var(--mut);border:0;min-height:34px;padding:6px 12px;font-size:13.5px;box-shadow:none}
html body .mk-seg>button.btn:not(.s){background:var(--card);color:var(--tx);box-shadow:0 1px 2px rgba(0,0,0,.25),0 0 0 1px var(--bd)}
html body .bars{display:flex;align-items:flex-end;gap:3px;height:120px;margin-top:10px}
html body .bars .bar{flex:1;min-width:3px;border:0;border-radius:3px 3px 1px 1px;padding:0;cursor:pointer;opacity:.9}
html body .bars .bar:hover,html body .bars .bar:focus{opacity:1;outline:none}
html body .kv>.card>b{overflow-wrap:anywhere}
/* textos de ajuda recolhidos */
.hint-t{display:inline-flex;align-items:center;gap:5px;margin-top:8px;background:none;border:0;padding:4px 0;color:var(--mut);font:600 12.5px var(--fs);cursor:pointer}
.hint{display:none}.hint.on{display:block;margin-top:4px}
`;
const st=document.createElement('style');st.id='tema';st.textContent=css;
const pon=()=>document.head.appendChild(st);pon();
/* garante que o tema fica por último, mesmo com estilos injetados depois */
setTimeout(pon,0);addEventListener('load',pon);

/* ---------- ícones (traço) ---------- */
const P={
 home:'M3 11l9-8 9 8M5 10v10h14V10',bar:'M4 20V10M10 20V4M16 20v-7M2 20h20',up:'M3 17l6-6 4 4 8-8M15 7h6v6',down:'M3 7l6 6 4-4 8 8M15 17h6v-6',
 cam:'M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',wave:'M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0',
 target:'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12h.01',wallet:'M3 7h15a3 3 0 013 3v7a3 3 0 01-3 3H3zM3 7V5h13v2M17 14h.01',
 receipt:'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4',clip:'M9 4h6v3H9zM7 5H5v16h14V5h-2M8 11h8M8 15h6',
 gear:'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-2.7-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.1-2.7H3a2 2 0 110-4h.1a1.6 1.6 0 001.1-2.7l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 002.7-1.1V3a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1.3z',
 bank:'M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18',book:'M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5zM4 19.5A2.5 2.5 0 006.5 22H20v-5',
 spark:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 3v4M17 5h4',puzzle:'M10 4a2 2 0 114 0v2h4v4h-2a2 2 0 100 4h2v4h-4v-2a2 2 0 10-4 0v2H6v-4h2a2 2 0 100-4H6V6h4z',
 ok:'M12 21a9 9 0 100-18 9 9 0 000 18zM8 12l3 3 5-6',alert:'M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01',
 no:'M12 21a9 9 0 100-18 9 9 0 000 18zM9 9l6 6M15 9l-6 6',info:'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5h.01',
 flame:'M12 3c1 4 6 6 6 11a6 6 0 01-12 0c0-3 2-5 3-6 0 3 1 4 2 4 0-4-1-6 1-9z',folder:'M3 6h6l2 2h10v11H3z',cal:'M4 5h16v16H4zM4 9h16M8 3v4M16 3v4',
 news:'M4 5h13v14a2 2 0 002 2H6a2 2 0 01-2-2zM17 9h3v10a2 2 0 01-2 2M7 9h7M7 13h7M7 17h4',bell:'M6 16v-5a6 6 0 0112 0v5l2 2H4zM10 20a2 2 0 004 0',
 bolt:'M13 2L4 14h7l-1 8 9-12h-7z',moon:'M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z',sun:'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
 pen:'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',redo:'M20 11a8 8 0 00-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0014.3 4.9L20 16M20 20v-4h-4',
 dl:'M12 3v12M7 10l5 5 5-5M4 21h16',ul:'M12 21V9M7 14l5-5 5 5M4 3h16',print:'M6 9V3h12v6M6 17H4v-6h16v6h-2M7 14h10v7H7z',play:'M7 4l13 8-13 8z',
 trophy:'M8 4h8v5a4 4 0 01-8 0zM8 6H4a4 4 0 004 4M16 6h4a4 4 0 01-4 4M12 13v4M8 21h8',wait:'M6 3h12M6 21h12M7 3c0 6 10 6 10 9s-10 3-10 9M17 3c0 6-10 6-10 9',
 stop:'M8 3h8l5 5v8l-5 5H8l-5-5V8zM8 12h8',search:'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5',link:'M10 14a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1M14 10a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1',
 bulb:'M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.8.8 1 1.7 1 2.5h6c0-.8.2-1.7 1-2.5A6 6 0 0012 3z',key:'M8 15a4 4 0 100-8 4 4 0 000 8zM11 11h10M18 11v3M15 11v2',
 user:'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',help:'M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 17h.01',
 bot:'M5 8h14v11H5zM12 4v4M9 13h.01M15 13h.01M9 16h6',globe:'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
 candle:'M8 3v4M8 17v4M6 7h4v10H6zM16 3v5M16 14v7M14 8h4v6h-4z',dollar:'M12 3v18M16 7h-6a3 3 0 000 6h4a3 3 0 010 6H8',box:'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
 pin:'M12 21s7-6 7-11a7 7 0 00-14 0c0 5 7 11 7 11zM12 12a2 2 0 100-4 2 2 0 000 4z',lock:'M5 11h14v10H5zM8 11V7a4 4 0 018 0v4',mail:'M3 5h18v14H3zM3 5l9 7 9-7',
 star:'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
 clock:'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 3',file:'M6 3h9l4 4v14H6zM14 3v5h5',paper:'M21 11l-9 9a5 5 0 01-7-7l9-9a3.5 3.5 0 015 5l-9 9a2 2 0 01-3-3l8-8',
 save:'M5 3h12l3 3v15H5zM8 3v6h8V3M8 21v-7h8v7',calc:'M6 3h12v18H6zM9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01',inbox:'M4 13h4l2 3h4l2-3h4M4 13l3-8h10l3 8v7H4z',
 phone:'M7 2h10v20H7zM11 18h2',chart:'M3 3v18h18M7 15l4-4 3 3 5-6',list:'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',grid:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
 menu:'M4 7h16M4 12h16M4 17h16',swap:'M7 4l-4 4 4 4M3 8h14M17 20l4-4-4-4M21 16H7',shield:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
 heart:'M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z',coffee:'M4 8h13v6a5 5 0 01-5 5H9a5 5 0 01-5-5zM17 10h2a2 2 0 010 4h-2M8 2v3M12 2v3',
};
const E={'📸':'cam','📷':'cam','🌊':'wave','🎯':'target','💰':'wallet','💵':'wallet','💸':'wallet','💲':'dollar','🧾':'receipt','📋':'clip','📊':'bar','📈':'up','📉':'down','⚙':'gear','🏛':'bank','📚':'book','📘':'book','📖':'book','📕':'book','📗':'book',
 '✨':'spark','🧩':'puzzle','✅':'ok','✔':'ok','☑':'ok','⚠':'alert','❌':'no','❗':'alert','‼':'alert','ℹ':'info','🔥':'flame','📂':'folder','📁':'folder','🗂':'folder','📅':'cal','🗓':'cal','📆':'cal','📰':'news','🔔':'bell','⚡':'bolt','🌙':'moon','☀':'sun','🌅':'sun',
 '✏':'pen','📝':'pen','🖊':'pen','🔁':'redo','🔄':'redo','⬇':'dl','📥':'inbox','⬆':'ul','📤':'ul','🖨':'print','▶':'play','🏆':'trophy','⏳':'wait','⌛':'wait','🛑':'stop','⛔':'stop','🔎':'search','🔍':'search','🔗':'link','💡':'bulb','🔑':'key','🔐':'lock','🔒':'lock',
 '👤':'user','❓':'help','❔':'help','🤖':'bot','🌎':'globe','🌍':'globe','🌐':'globe','🕯':'candle','📦':'box','📌':'pin','📍':'pin','✉':'mail','📧':'mail','⭐':'star','🌟':'star','👁':'eye','⏰':'clock','🕒':'clock','⏱':'clock','📄':'file','📃':'file','📑':'file','📎':'paper',
 '💾':'save','🧮':'calc','📱':'phone','📏':'chart','🧭':'target','🏠':'home','🎉':'spark','🧠':'bulb','🛡':'shield','❤':'heart','☕':'coffee','🔀':'swap','📣':'bell','🧪':'spark','🗒':'list','📜':'file','🔬':'search'};
const DOT={'🟢':'var(--g)','🟡':'var(--am)','🟠':'#f08a3a','🔴':'var(--r)','⚪':'var(--mut)','🔵':'var(--ac)','🟣':'#9b6bff','⚫':'var(--tx)'};
const ico=n=>`<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n]}"/></svg>`;
window.icoSvg=ico;
/* um "emoji" = pictográfico (ou bandeira) + variação/pele/ZWJ; rostos ficam (são conteúdo: energia do dia) */
const RX=/(?:\p{Regional_Indicator}{2}|(?:\p{Extended_Pictographic})(?:️|⃣|\p{Emoji_Modifier}|‍\p{Extended_Pictographic}️?)*)\s?/gu;
const FACE=/^[\u{1F600}-\u{1F64F}\u{1F910}-\u{1F92F}\u{1F970}-\u{1F97A}]/u;
const PULA='INPUT,TEXTAREA,SELECT,SCRIPT,STYLE,SVG,svg,OPTION,IFRAME,CODE,PRE';
function trocaTexto(node){
  const t=node.nodeValue;if(!t||!/[←-⯿\u{1F000}-\u{1FAFF}️]/u.test(t))return;
  RX.lastIndex=0;if(!RX.test(t))return;RX.lastIndex=0;
  const frag=document.createDocumentFragment();let last=0,m,mudou=0;
  while((m=RX.exec(t))){
    const em=m[0].trim(),base=em.replace(/[️⃣]|\p{Emoji_Modifier}/gu,'').split('‍')[0];
    if(FACE.test(base))continue;
    if(/^[←-⇿■-◿☀-☃←-↙]$/u.test(base)&&!E[base])continue; // setas e formas simples (▲▼◀▶ etc.) ficam
    if(m.index>last)frag.appendChild(document.createTextNode(t.slice(last,m.index)));
    if(DOT[base]){const s=document.createElement('span');s.className='dot';s.style.background=DOT[base];frag.appendChild(s)}
    else if(E[base]){const s=document.createElement('span');s.innerHTML=ico(E[base]);frag.appendChild(s.firstChild)}
    last=m.index+m[0].length;mudou=1;
  }
  if(!mudou)return;
  if(last<t.length)frag.appendChild(document.createTextNode(t.slice(last)));
  node.parentNode.replaceChild(frag,node);
}
function limpa(root){
  if(!root||root.nodeType!==1&&root.nodeType!==11)return;
  if(root.closest&&root.closest('.tradingview-widget-container,[contenteditable]'))return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;return !p||p.closest(PULA)||p.closest('.tradingview-widget-container,.noico')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});
  const L=[];while(w.nextNode())L.push(w.currentNode);L.forEach(trocaTexto);
  ajuda(root);
}
/* parágrafos longos de explicação no fim de um cartão viram "Sobre estes dados" */
function ajuda(root){
  (root.querySelectorAll?root.querySelectorAll('.card > div.sm.mut:last-child, .card > p.sm.mut:last-child, .card > p.mut:last-child'):[]).forEach(el=>{
    if(el.dataset.h||el.classList.contains('hint'))return;el.dataset.h=1;
    const tx=el.textContent.trim();if(tx.length<150||el.querySelector('input,button,select,textarea,a,b[data-rs-t],[data-rs-up]'))return;
    const b=document.createElement('button');b.className='hint-t';b.type='button';b.innerHTML=ico('info')+'Sobre estes dados';
    el.classList.add('hint');el.parentNode.insertBefore(b,el);
  });
}
document.addEventListener('click',e=>{const b=e.target.closest('.hint-t');if(!b)return;const n=b.nextElementSibling;if(n){n.classList.toggle('on');b.innerHTML=ico('info')+(n.classList.contains('on')?'Ocultar':'Sobre estes dados')}});
let fila=new Set(),agendado=0;
const roda=()=>{agendado=0;const L=[...fila];fila.clear();L.forEach(n=>{if(n.isConnected)limpa(n)})};
new MutationObserver(ms=>{for(const m of ms){m.addedNodes.forEach(n=>{if(n.nodeType===1)fila.add(n);else if(n.nodeType===3&&n.parentElement)fila.add(n.parentElement)})}if(fila.size&&!agendado){agendado=1;requestAnimationFrame(roda)}}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',()=>limpa(document.body));

/* ---------- barra de navegação inferior ---------- */
const NAV=[['home','home','Início'],['dia','moon','Meu dia'],['novo','',''],['trades','chart','Operações'],['mercado','news','Mercado']];
const grupo=t=>t==='home'?'home':['dia','regras'].includes(t)?'dia':['trades','swing','opc','ativos','stats','rev'].includes(t)?'trades':['mercado','live','juros','graf'].includes(t)?'mercado':'';
function navPinta(){
  let n=document.getElementById('bnav');
  if(!n){n=document.createElement('div');n.id='bnav';n.setAttribute('role','navigation');n.setAttribute('aria-label','Navegação principal');document.body.appendChild(n);
    n.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.k;
      if(k==='novo')return; // o próprio botão tem data-a="fab": abre o menu de novo trade como o botão + antigo
      tab=k==='trades'?(typeof LT!=='undefined'&&LT?LT:'trades'):k;if(typeof render==='function')render();scrollTo(0,0)})}
  const g=grupo(typeof tab!=='undefined'?tab:'home');
  n.innerHTML=NAV.map(([k,i,l])=>k==='novo'?`<button data-k="novo" data-a="fab" class="mais" aria-label="Novo trade"><span class="bx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span></button>`:`<button data-k="${k}" class="${g===k?'on':''}" aria-label="${l}"${g===k?' aria-current="page"':''}>${ico(i).replace('class="ico"','')}<span>${l}</span></button>`).join('');
  const sob=!!(document.getElementById('rl')||document.getElementById('qz')||(typeof T!=='undefined'&&T));
  document.body.classList.toggle('semnav',sob);
}
window.navPinta=navPinta;
if(typeof render0==='function'){const r0=render0;render0=function(){r0.apply(this,arguments);try{navPinta()}catch(e){}}}
document.addEventListener('click',()=>setTimeout(()=>{try{navPinta()}catch(e){}},0));
})();
/* ==== VISUAL:FIM ==== */
/* ==== MENU:INICIO ==== menu enxuto: 6 áreas, cada uma com abas internas */
const HUB_M=[['mercado:ag','Agenda'],['mercado:nt','Notícias'],['mercado:cot','Cotações'],['juros','Juros e DI'],['live','Ao vivo'],['graf','Gráficos'],['mercado:al','Alertas']];
const HUB_D=[['dia','Meu dia'],['regras','Regras']];
function hubSeg(L,cur){return `<div class="seg hub" style="margin:2px 0 12px">${L.map(([k,l])=>`<button class="${k===cur?'on':''}" data-hub="${k}">${l}</button>`).join('')}</div>`}
function segM(cur){return hubSeg(HUB_M,cur)}
function segD(cur){return hubSeg(HUB_D,cur)}
(function(){
  const css=document.createElement('style');
  css.textContent=`#app .mk-seg{display:none!important}
html body .seg.hub{-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 28px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 28px),transparent)}
html body .seg.hub.fim{-webkit-mask-image:none;mask-image:none}
#mdr2{position:fixed;inset:0;z-index:90}#mdr2 .bk{position:absolute;inset:0;background:rgba(0,0,0,.5);animation:m2f .18s ease-out}
#mdr2 .pn{position:absolute;left:0;top:0;bottom:0;width:min(82vw,320px);background:var(--bg);border-right:1px solid var(--bd);padding:calc(14px + env(safe-area-inset-top,0px)) 12px calc(14px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;animation:m2s .2s ease-out;overflow-y:auto}
@keyframes m2s{from{transform:translateX(-30px);opacity:.4}}@keyframes m2f{from{opacity:0}}
#mdr2 .hd{display:flex;align-items:center;justify-content:space-between;padding:4px 6px 14px}#mdr2 .hd b{font-size:20px;letter-spacing:-.02em}
#mdr2 .hd button{background:none;border:0;color:var(--mut);font-size:15px;font-weight:600;display:flex;align-items:center;gap:4px;cursor:pointer;padding:6px}
#mdr2 .it{display:flex;align-items:center;gap:14px;width:100%;padding:12px 10px;border:0;border-radius:12px;background:none;color:var(--tx);text-align:left;cursor:pointer;font:inherit}
#mdr2 .it.on{background:var(--ac2)}#mdr2 .it.on .ic{color:var(--ac)}
#mdr2 .it .ic{width:38px;height:38px;border-radius:11px;background:var(--card2);display:flex;align-items:center;justify-content:center;color:var(--tx);flex:none}
#mdr2 .it .ic svg{width:20px;height:20px;margin:0}
#mdr2 .it b{display:block;font-size:15.5px;font-weight:650}#mdr2 .it small{display:block;color:var(--mut);font-size:12.5px;margin-top:1px}
#mdr2 .it .ch{margin-left:auto;color:var(--mut)}
#mdr2 .ft{margin-top:auto;padding:14px 6px 0;border-top:1px solid var(--bd);display:flex;gap:6px}
#mdr2 .ft button{flex:1;background:var(--card2);border:1px solid var(--bd);color:var(--tx);border-radius:10px;padding:10px;font:600 13.5px var(--fs);display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer}
#mdr2 .ft svg{width:17px;height:17px;margin:0}`;
  document.head.appendChild(css);
  const I=n=>window.icoSvg?window.icoSvg(n):'';
  const AREAS=[['home','home','Início','Resumo do dia'],['ops','chart','Operações','Day trade, swing, opções, forex e estatísticas'],['mercado','news','Mercado','Agenda, notícias, cotações, juros e DI'],['dia','moon','Meu dia','Rotina, diário e regras'],['estudos','book','Estudos','Livros, resumos e simulados'],['ferr','grid','Ferramentas','Mesa, plano de transição, impostos e mais']];
  const FERR=[['mesa','shield','Mesa proprietária','Regras, meta e quanto posso perder hoje'],['carreira','star','Plano de transição','Quando dá para sair da CLT'],['painel','target','Painel','Metas, tamanho da posição e backup'],['contratos','calc','Contratos','Lotes pelo capital e volatilidade'],['carteiras','wallet','Carteiras','Brasil e EUA, evolução'],['analise','bot','Análise IA','Relatório da carteira'],['imposto','receipt','Imposto de renda','Notas, custos e DARF'],['import','inbox','Importar do Profit','Automático pela ponte ou CSV']];
  const area=t=>t==='home'?'home':['trades','swing','opc','ativos','stats','rev'].includes(t)?'ops':['mercado','live','juros','graf'].includes(t)?'mercado':['dia','regras'].includes(t)?'dia':['estudos','livro'].includes(t)?'estudos':FERR.some(f=>f[0]===t)?'ferr':'';
  let sub=0;
  function desenha(){
    const p=document.querySelector('#mdr2 .pn');if(!p)return;
    const a=area(tab);
    if(!sub)p.innerHTML=`<div class="hd"><b>Menu</b><button data-m2="x" aria-label="Fechar">✕</button></div>${AREAS.map(([k,i,t,d])=>`<button class="it${a===k?' on':''}" data-m2="${k}"><span class="ic">${I(i)}</span><span><b>${t}</b><small>${d}</small></span>${k==='ferr'?'<span class="ch">›</span>':''}</button>`).join('')}<div class="ft"><button data-m2="conta">${I('user')}Conta</button><button data-m2="mais">${I('sun')}Aparência</button></div>`;
    else p.innerHTML=`<div class="hd"><button data-m2="voltar">‹ Menu</button><button data-m2="x" aria-label="Fechar">✕</button></div><div style="padding:0 6px 8px"><b style="font-size:20px">Ferramentas</b></div>${FERR.map(([k,i,t,d])=>`<button class="it${tab===k?' on':''}" data-m2="${k}"><span class="ic">${I(i)}</span><span><b>${t}</b><small>${d}</small></span></button>`).join('')}`;
  }
  function abre(){fecha();sub=area(tab)==='ferr'?1:0;const m=document.createElement('div');m.id='mdr2';m.innerHTML='<div class="bk" data-m2="x"></div><aside class="pn" role="dialog" aria-label="Menu"></aside>';document.body.appendChild(m);document.body.style.overflow='hidden';desenha()}
  function fecha(){const m=document.getElementById('mdr2');if(m)m.remove();const o=document.getElementById('mdr');if(o)o.remove();document.body.style.overflow=''}
  function vai(t){tab=t;if(['trades','swing','opc'].includes(t))LT=t;fecha();render();scrollTo(0,0)}
  /* o botão ☰ abre o menu novo (no lugar do antigo) */
  document.addEventListener('click',e=>{
    if(e.target.closest('#mbtn')){e.stopPropagation();e.preventDefault();abre();return}
    const b=e.target.closest('[data-m2]');
    if(b){const k=b.dataset.m2;
      if(k==='x')return fecha();
      if(k==='ferr'){sub=1;return desenha()}
      if(k==='voltar'){sub=0;return desenha()}
      if(k==='ops')return vai(typeof LT!=='undefined'&&LT?LT:'trades');
      if(k==='estudos'){if(typeof ESV!=='undefined')ESV='liv';return vai('estudos')}
      return vai(k);
    }
    const h=e.target.closest('[data-hub]');
    if(h){const [t,s]=h.dataset.hub.split(':');if(s&&typeof MKT!=='undefined'){MKT.tab=s;ls.set('diario-mkt-tab',s)}e.stopPropagation();vai(t);return}
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('mdr2'))fecha()});
  /* a aba ativa das abas internas aparece inteira (rolagem horizontal) */
  const r0=render0;
  render0=function(){r0.apply(this,arguments);const h=document.querySelector('#app .hub');const on=h&&h.querySelector('.on');if(on){const x=on.offsetLeft-(h.clientWidth-on.offsetWidth)/2;h.scrollLeft=Math.max(0,x)};if(h){const f=()=>h.classList.toggle('fim',h.scrollLeft+h.clientWidth>=h.scrollWidth-4);f();h.addEventListener('scroll',f,{passive:true})}};
})();
/* ==== MENU:FIM ==== */
/* ==== MELHORIAS:INICIO ==== backup versionado, registro rápido, Início personalizável, ficha da operação,
   tags de erro, checklist por setup, aviso de limite, escala nas notificações e dólar automático */

/* ---------- tags de erro (vários por trade, em categorias) ---------- */
const TAGS_ERRO=[
  ['Emocional',['Entrei por dica/emoção (fora do sistema)','Saí cedo por emoção','Precisava estar certo (realizei cedo/segurei perda)','Revanche depois de uma perda','Medo de ficar de fora (FOMO)']],
  ['Gestão de risco',['Não saí no stop','Risco grande demais','Mexi no stop','Aumentei a mão no prejuízo']],
  ['Processo e análise',['Não segui minha rotina','Operei fora do tipo de mercado','Foquei na entrada, não no risco/retorno','Entrei sem saída predeterminada','Operei demais (perdi o controle)','Entrei atrasado']],
  ['Outros',['Outro']],
];
const catErro=tag=>{for(const [c,L] of TAGS_ERRO)if(L.includes(tag))return c;return 'Outros'};
/* tags de um trade (trades antigos só têm o campo "err") */
const tagsDe=t=>Array.isArray(t.tags)&&t.tags.length?t.tags:(t.err&&t.err!=='Nenhum'?[t.err]:[]);

/* ---------- checklist por setup ---------- */
const chkSetups=()=>((S.ax||{})['chk.setups'])||{};
const chkDe=setup=>{const m=chkSetups(),k=Object.keys(m).find(x=>x.trim().toLowerCase()===String(setup||'').trim().toLowerCase());return k?m[k].filter(Boolean):[]};
const chkFrac=t=>{const L=chkDe(t.setup);if(!L.length)return null;const c=t.chk||{};return L.filter((_,i)=>c[i]).length/L.length};
const setupsConhecidos=()=>[...new Set([...Object.keys(chkSetups()),...S.trades.map(t=>(t.setup||'').trim()).filter(Boolean)])].slice(0,40);

/* a ficha do trade ganha: lista de setups, checklist do setup e tags de erro no lugar do campo único */
(function(){
  const s0=sheet;
  sheet=function(){
    let h=s0();const t=T;if(!t)return h;
    const ss=setupsConhecidos();
    h=h.replace('<label>Setup / estratégia<input name="setup"',()=>`<datalist id="dl-setups">${ss.map(x=>`<option value="${esc(x)}">`).join('')}</datalist><label>Setup / estratégia<input name="setup" list="dl-setups"`);
    const L=chkDe(t.setup);
    if(L.length){
      const c=t.chk||{},feitos=L.filter((_,i)=>c[i]).length;
      const box=`<div class="card" style="margin:8px 0"><div class="top"><b>Checklist do setup</b><span class="sm ${feitos===L.length?'g':'mut'}">${feitos}/${L.length}</span></div>${L.map((it,i)=>`<label class="ck" style="margin-top:8px"><input type="checkbox" data-ck="${i}"${c[i]?' checked':''}><span>${esc(it)}</span></label>`).join('')}</div>`;
      h=h.replace(/(<label>Setup \/ estratégia<input[^>]*><\/label>)/,(m)=>m+box);
    }
    const tg=tagsDe(t);
    const chips=`<label>Erros cometidos (erro = não seguir suas regras)</label>${TAGS_ERRO.map(([cat,LL])=>`<div class="sm mut" style="margin:8px 0 2px">${cat}</div><div class="chips2">${LL.map(x=>`<button class="${tg.includes(x)?'on r':''}" data-tg="${esc(x)}">${esc(x)}</button>`).join('')}</div>`).join('')}${tg.length?'':'<div class="sm g" style="margin-top:6px">Nenhum erro marcado.</div>'}`;
    h=h.replace(/<label>Erro cometido[^<]*<select name="err">[\s\S]*?<\/select><\/label>/,()=>chips);
    return h;
  };
  document.addEventListener('click',e=>{
    const b=e.target.closest('#sh [data-tg]');if(!b||!T)return;
    const x=b.dataset.tg,L=tagsDe(T).slice(),i=L.indexOf(x);i<0?L.push(x):L.splice(i,1);
    T.tags=L;T.err=L[0]||'Nenhum';showSheet();
  });
  document.addEventListener('change',e=>{
    const c=e.target.closest('#sh [data-ck]');
    if(c&&T){(T.chk??={})[c.dataset.ck]=c.checked;showSheet();return}
    const s=e.target.closest('#sh input[name="setup"]');
    if(s&&T){T.setup=s.value;if(!T.chk)T.chk={};showSheet()}
  });
})();

/* ---------- registro rápido ---------- */
const raizAtivo=a=>{const s=String(a||'').toUpperCase().trim(),m=s.match(/^([A-Z]{3})[FGHJKMNQUVXZ]\d{2}$/)||s.match(/^([A-Z]{2,4})[FGHJKMNQUVXZ]\d{1,2}$/);return m?m[1]:s};
function padraoAtivo(a){
  const r=raizAtivo(a),u=[...S.trades].filter(t=>raizAtivo(t.ativo)===r&&r).sort((x,y)=>(y.dt||'').localeCompare(x.dt||''))[0];
  const pv=u&&+u.pv?+u.pv:r==='WIN'?0.2:r==='WDO'?10:r==='MES'?5:r==='MNQ'?2:r==='ES'?50:r==='NQ'?20:1;
  return {pv,qty:u&&+u.qty?+u.qty:1,setup:u?u.setup||'':'',tipo:u?u.tipo||'D':'D',mkt:u?u.mkt:undefined,cost:u&&u.cost!=null?u.cost:0};
}
let QK=null;
function qkAbre(){
  if(typeof pBloq==='function'&&!pBloq())return;
  const recentes=[...new Set([...S.trades].sort((a,b)=>(b.dt||'').localeCompare(a.dt||'')).map(t=>(t.ativo||'').toUpperCase()).filter(Boolean))].slice(0,6);
  QK={ativo:recentes[0]||'',side:'C',entry:'',stop:'',qty:'',exit:'',tipo:'D',rec:recentes};
  Object.assign(QK,{qty:padraoAtivo(QK.ativo).qty,tipo:padraoAtivo(QK.ativo).tipo});
  let ov=document.getElementById('qk');if(!ov){ov=document.createElement('div');ov.id='qk';document.body.appendChild(ov)}
  document.body.style.overflow='hidden';qkDesenha();
}
function qkFecha(){const o=document.getElementById('qk');if(o)o.remove();QK=null;document.body.style.overflow='';try{navPinta()}catch(e){}}
function qkCalc(){
  const p=padraoAtivo(QK.ativo),e=numN(QK.entry),s=numN(QK.stop),q=numN(QK.qty)||0,x=numN(QK.exit),d=QK.side==='C'?1:-1,mo=moedaAtv(QK.ativo);
  const risco=e!=null&&s!=null?Math.abs(e-s)*q*p.pv:null,res=e!=null&&x!=null?(x-e)*d*q*p.pv-(+p.cost||0):null;
  return {p,risco,res,mo};
}
function qkDesenha(){
  const ov=document.getElementById('qk');if(!ov||!QK)return;
  const c=qkCalc(),f=(k,l,ph)=>`<label>${l}<input data-qk="${k}" value="${esc(QK[k])}" inputmode="decimal" placeholder="${ph||''}"></label>`;
  ov.innerHTML=`<div class="qk-bk" data-qkx="1"></div><div class="qk-pn" role="dialog" aria-label="Registro rápido">
<div class="top"><b style="font-size:19px">Registro rápido</b><button class="x" data-qkx="1" aria-label="Fechar">✕</button></div>
<label>Ativo<input data-qk="ativo" value="${esc(QK.ativo)}" autocapitalize="characters" autocomplete="off" placeholder="WINZ26"></label>
${QK.rec.length?`<div class="chips2">${QK.rec.map(a=>`<button class="${a===QK.ativo?'on':''}" data-qka="${esc(a)}">${esc(a)}</button>`).join('')}</div>`:''}
<div class="seg" style="margin-top:10px"><button class="${QK.side==='C'?'on':''}" data-qks="C" style="${QK.side==='C'?'color:var(--g)':''}">Compra</button><button class="${QK.side==='V'?'on':''}" data-qks="V" style="${QK.side==='V'?'color:var(--r)':''}">Venda</button></div>
<div class="g3">${f('entry','Entrada')}${f('stop','Stop')}${f('qty','Qtd.')}</div>
${f('exit','Saída (se já saiu)','deixe vazio se está aberto')}
<div class="sm" style="margin:10px 0 2px;line-height:1.5">${c.risco!=null?`Risco: <b>${mnyC(c.risco,c.mo)}</b>${pctConta(c.risco,c.mo,QK.tipo)?' ('+pctConta(c.risco,c.mo,QK.tipo).replace('+','')+')':''}`:'<span class="mut">Preencha entrada e stop para ver o risco.</span>'}${c.res!=null?` · Resultado: <b class="${cls(c.res)}">${mnyC(c.res,c.mo)}</b>`:''}</div>
<div class="sm mut">Usa ${c.p.pv} ${c.mo==='USD'?'US$':'R$'} por ponto${c.p.setup?' e o setup "'+esc(c.p.setup)+'"':''} do seu último ${esc(raizAtivo(QK.ativo)||'trade')}.</div>
<div id="qkmsg" class="r sm" style="margin-top:6px"></div>
<div class="g2" style="margin-top:10px"><button class="btn" data-qkok="1">Salvar</button><button class="btn s" data-qkok="2">Salvar e completar</button></div></div>`;
}
function qkSalva(completar){
  const m=document.getElementById('qkmsg'),a=String(QK.ativo||'').trim().toUpperCase();
  if(!a){if(m)m.textContent='Informe o ativo.';return}
  if(numN(QK.entry)==null){if(m)m.textContent='Informe a entrada.';return}
  const p=padraoAtivo(a),agora=loc().slice(0,16),saiu=numN(QK.exit)!=null;
  const t={id:uid(),tipo:p.tipo||'D',dt:agora,ativo:a,side:QK.side,entry:String(QK.entry),stop:String(QK.stop||''),qty:String(QK.qty||p.qty),pv:String(p.pv),cost:String(p.cost||0),
    exit:saiu?String(QK.exit):'',dtx:saiu?agora:'',setup:p.setup,mkt:p.mkt||(typeof MK!=='undefined'?MK[0]:''),emo:'3',rules:'s',err:'Nenhum',tags:[],u:Date.now(),rapido:1};
  if(t.tipo==='O'){t.ot='C';t.estr=typeof ESTR!=='undefined'?ESTR[0]:''}
  S.trades.push(t);save();qkFecha();render();
  if(window.toast)toast(saiu?'Trade salvo e encerrado':'Trade salvo como aberto',2500);
  limiteConfere();
  if(completar){AUTO=0;isNew=0;T={...t};orig={pin:T.pin,pout:T.pout,pplan:T.pplan};showSheet()}
}
document.addEventListener('input',e=>{const i=e.target.closest('#qk [data-qk]');if(!i||!QK)return;QK[i.dataset.qk]=i.dataset.qk==='ativo'?i.value.toUpperCase():i.value;
  if(i.dataset.qk==='ativo'){const p=padraoAtivo(QK.ativo);QK.qty=QK.qty||p.qty;QK.tipo=p.tipo}
  const c=qkCalc(),pos=i.selectionStart,k=i.dataset.qk;qkDesenha();const n=document.querySelector(`#qk [data-qk="${k}"]`);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(_){}}});
document.addEventListener('click',e=>{
  if(!QK)return;
  if(e.target.closest('[data-qkx]'))return qkFecha();
  const a=e.target.closest('[data-qka]');if(a){QK.ativo=a.dataset.qka;const p=padraoAtivo(QK.ativo);QK.qty=p.qty;QK.tipo=p.tipo;return qkDesenha()}
  const s=e.target.closest('[data-qks]');if(s){QK.side=s.dataset.qks;return qkDesenha()}
  const ok=e.target.closest('[data-qkok]');if(ok)qkSalva(ok.dataset.qkok==='2');
});

/* ---------- ficha visual da operação ---------- */
let FX=null;
function fxLista(){return [...S.trades].sort((a,b)=>((b.dtx||b.dt)||'').localeCompare((a.dtx||a.dt)||''))}
function fxRegua(t,c){
  const N=k=>numN(t[k]),e=N('entry'),s=N('stop'),x=N('exit'),alvos=['target','target2','target3'].map(N).filter(v=>v!=null),mep=N('mep'),men=N('men');
  if(e==null)return '<div class="sm mut">Sem preço de entrada.</div>';
  const P=[e,s,x,mep,men,...alvos].filter(v=>v!=null),lo=Math.min(...P),hi=Math.max(...P),pad=(hi-lo)*.08||Math.abs(e)*.002||1;
  const W=340,H=240,L=8,Rr=118,y=v=>14+(hi+pad-v)/((hi-lo)+2*pad)*(H-28);
  const dec=Math.max(...P.map(v=>(String(v).split('.')[1]||'').length),0),fv=v=>(+v).toLocaleString('pt-BR',{minimumFractionDigits:Math.min(dec,4),maximumFractionDigits:Math.min(dec,4)});
  const linha=(v,cor,rot,tr)=>`<line x1="${L}" x2="${W-Rr}" y1="${y(v)}" y2="${y(v)}" stroke="${cor}" stroke-width="${tr?1.4:2}" ${tr?'stroke-dasharray="5 4"':''}/><text x="${W-Rr+8}" y="${y(v)+4}" font-size="11.5" fill="${cor}" font-weight="600">${rot} ${fv(v)}</text>`;
  const band=(a,b,cor,op)=>`<rect x="${L+70}" y="${Math.min(y(a),y(b))}" width="${W-Rr-L-140}" height="${Math.max(2,Math.abs(y(a)-y(b)))}" fill="${cor}" opacity="${op}" rx="4"/>`;
  let g='';
  if(mep!=null&&men!=null)g+=band(mep,men,'var(--mut)',.15);
  if(s!=null)g+=band(e,s,'var(--r)',.18);
  alvos.forEach(a=>{g+=band(e,a,'var(--g)',.10)});
  if(x!=null)g+=`<rect x="${L+100}" y="${Math.min(y(e),y(x))}" width="${W-Rr-L-200}" height="${Math.max(3,Math.abs(y(e)-y(x)))}" fill="${c.pl>=0?'var(--g)':'var(--r)'}" opacity=".85" rx="3"/>`;
  alvos.forEach((a,i)=>{g+=linha(a,'var(--g)',alvos.length>1?'Alvo '+(i+1):'Alvo',1)});
  if(s!=null)g+=linha(s,'var(--r)','Stop',1);
  if(mep!=null)g+=linha(mep,'var(--mut)','Melhor',1);
  if(men!=null)g+=linha(men,'var(--mut)','Pior',1);
  g+=linha(e,'var(--ac)','Entrada');
  if(x!=null)g+=linha(x,'var(--tx)','Saída');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="Régua de preços do trade">${g}</svg>
<div class="sm mut" style="display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:4px"><span><b style="color:var(--r)">■</b> risco planejado</span>${alvos.length?'<span><b style="color:var(--g)">■</b> até o alvo</span>':''}${x!=null?'<span>barra cheia = o que você realizou</span>':''}${mep!=null&&men!=null?'<span><b style="color:var(--mut)">■</b> faixa que o preço percorreu</span>':''}</div>`;
}
function fxHtml(){
  const L=fxLista(),i=L.findIndex(t=>t.id===FX.id),t=L[i];if(!t)return '';
  const c=calc(t),aberto=isOpen(t),mo=moedaT(t),tp=t.tipo||'D',dur=typeof minutosEntre==='function'?minutosEntre(t.dt,t.dtx):null;
  const durTxt=dur==null?'':dur<60?Math.round(dur)+' min':dur<1440?(dur/60).toFixed(1).replace('.',',')+' h':Math.round(dur/1440)+' dias';
  const st=aberto?['Aberto','var(--ac)']:c.pl>0?['Ganho','var(--g)']:c.pl<0?['Perda','var(--r)']:['Zero','var(--mut)'];
  const kv=(l,v,k='')=>`<div class="card" style="margin:0;padding:10px"><span class="sm mut">${l}</span><div><b class="${k}" style="font-size:16px">${v}</b></div></div>`;
  const vezes=c.r==null?null:(c.r>=0?'ganhou ':'perdeu ')+Math.abs(c.r).toFixed(1).replace('.',',')+'x o que arriscou';
  const ganhoPlan=c.rr!=null&&c.risk?c.risk*c.rr:null,captura=!aberto&&c.pl>0&&ganhoPlan?c.pl/ganhoPlan:null;
  const tg=tagsDe(t),ck=chkDe(t.setup),cf=t.chk||{};
  const fotos=[['pplan','Planejamento'],['pin','Entrada'],['pout','Saída']].filter(([k])=>t[k]);
  return `<div class="fx-top"><button class="btn s ib" data-fx="x" aria-label="Fechar">✕</button><div style="flex:1;min-width:0;text-align:center"><b>${esc(t.ativo||'Trade')}</b><div class="sm mut">${i+1} de ${L.length}</div></div><button class="btn s ib" data-fx="ant"${i>0?'':' disabled'} aria-label="Anterior">‹</button><button class="btn s ib" data-fx="prox"${i<L.length-1?'':' disabled'} aria-label="Próximo">›</button></div>
<div class="fx-body">
<div class="hero" style="margin-top:0"><div class="top"><span class="chip" style="color:${st[1]};border-color:${st[1]}">${st[0]}</span><span class="sm mut">${{D:'Day trade',S:'Swing',O:'Opção'}[tp]} · ${t.side==='C'?(tp==='O'?'Comprado':'Compra'):(tp==='O'?'Lançado':'Venda')}${t.setup?' · '+esc(t.setup):''}</span></div>
<div class="big ${aberto?'':cls(c.pl)}" style="margin-top:8px">${aberto?'Em aberto':mT(t,c.pl)}</div>
<div class="sm mut">${aberto?(c.risk!=null?'Risco em jogo: '+mT(t,c.risk):''):pctConta(c.pl,mo,tp)+(vezes?' · '+vezes:'')}</div>
<div class="sm mut" style="margin-top:6px">${fdt(t.dt)}${t.dtx?' → '+fdt(t.dtx):''}${durTxt?' · '+durTxt:''}</div></div>
<h2>Plano × execução</h2><div class="card">${fxRegua(t,c)}</div>
<div class="kv">${kv('Risco planejado',c.risk==null?'sem stop':mT(t,c.risk)+(pctConta(c.risk,mo,tp)?'<div class="sm mut" style="font-weight:500">'+pctConta(c.risk,mo,tp).replace('+','')+'</div>':''))}${kv('Ganho/risco planejado',c.rr==null?'sem alvo':c.rr.toFixed(1).replace('.',',')+' para 1')}${kv('Captura do alvo',captura==null?'–':Math.round(captura*100)+'%',captura!=null&&captura<.6?'r':'')}${kv('Custos',mT(t,+t.cost||0))}</div>
<h2>Disciplina</h2><div class="card"><div class="sm">Regras: <b class="${t.rules==='n'?'r':'g'}">${t.rules==='n'?'quebrei':'segui'}</b>${t.emo?' · Antes de entrar: '+(EMO[+t.emo-1]||''):''}</div>
${tg.length?`<div class="chips2" style="margin-top:8px">${tg.map(x=>`<span class="chip" style="color:var(--r);border-color:color-mix(in srgb,var(--r) 40%,transparent)" title="${esc(catErro(x))}">${esc(x)}</span>`).join('')}</div>`:'<div class="sm g" style="margin-top:6px">Nenhum erro marcado.</div>'}
${ck.length?`<div style="margin-top:10px"><div class="sm mut">Checklist do setup (${ck.filter((_,k)=>cf[k]).length}/${ck.length})</div>${ck.map((x,k)=>`<div class="sm" style="margin-top:4px">${cf[k]?'<span class="g">✓</span>':'<span class="r">✗</span>'} ${esc(x)}</div>`).join('')}</div>`:''}</div>
${fotos.length?`<h2>Fotos</h2><div class="g${fotos.length>1?'2':''}" style="gap:8px">${fotos.map(([k,l])=>`<div><div class="sm mut" style="margin-bottom:4px">${l}</div><img data-img="${t[k]}" style="width:100%;border-radius:12px;border:1px solid var(--bd);display:block;min-height:80px;background:var(--card2)"></div>`).join('')}</div>`:''}
${t.nota?`<h2>Comentários</h2><div class="card" style="white-space:pre-wrap;line-height:1.5">${esc(t.nota)}</div>`:''}
<div class="g2" style="margin:16px 0 30px"><button class="btn" data-fx="editar">Editar</button>${aberto?'<button class="btn s" data-fx="encerrar">Encerrar</button>':'<button class="btn s" data-fx="x">Fechar</button>'}</div></div>`;
}
function fxAbre(id){FX={id};let ov=document.getElementById('fx');if(!ov){ov=document.createElement('div');ov.id='fx';document.body.appendChild(ov)}document.body.style.overflow='hidden';fxDesenha()}
function fxDesenha(){const ov=document.getElementById('fx');if(!ov||!FX)return;ov.innerHTML=fxHtml();try{fillImgs()}catch(e){}const b=ov.querySelector('.fx-body');if(b)b.scrollTop=0;try{navPinta()}catch(e){}}
function fxFecha(){const o=document.getElementById('fx');if(o)o.remove();FX=null;document.body.style.overflow='';try{navPinta()}catch(e){}}
/* tocar num trade abre a ficha; "Editar" abre o formulário de sempre */
document.addEventListener('click',e=>{
  const f=e.target.closest('[data-fx]');
  if(f&&FX){const k=f.dataset.fx,L=fxLista(),i=L.findIndex(t=>t.id===FX.id);
    if(k==='x')return fxFecha();
    if(k==='ant'&&i>0){FX.id=L[i-1].id;return fxDesenha()}
    if(k==='prox'&&i<L.length-1){FX.id=L[i+1].id;return fxDesenha()}
    if(k==='editar'||k==='encerrar'){const id=FX.id;fxFecha();const t=S.trades.find(x=>x.id===id);if(!t)return;AUTO=0;isNew=0;QM=k==='encerrar'?1:0;T={...t,...(QM?{dtx:loc().slice(0,16)}:{})};orig={pin:T.pin,pout:T.pout,pplan:T.pplan};showSheet();return}
    return;
  }
  const c=e.target.closest('#app [data-a="edit"]');
  if(c&&!e.target.closest('button,a,input,select,textarea,label')&&S.trades.some(t=>t.id===c.dataset.id)){e.stopPropagation();fxAbre(c.dataset.id)}
},true);
document.addEventListener('keydown',e=>{if(!FX)return;if(e.key==='Escape')fxFecha();else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const L=fxLista(),i=L.findIndex(t=>t.id===FX.id),j=i+(e.key==='ArrowRight'?1:-1);if(L[j]){FX.id=L[j].id;fxDesenha()}}});

/* ---------- Início personalizável ---------- */
const HB_NOMES={hero:'Resultado de hoje',adr:'ADRs brasileiras',cap:'Capital',posso:'Posso operar hoje?',turno:'Escala de turno',venc:'Vencimentos de opções',pos:'Posições abertas',lim:'Limites da mesa',metas:'Metas de processo',cal:'Calendário do mês',acoes:'Atalhos'};
const HB_PADRAO=['hero','posso','turno','pos','adr','cap','venc','lim','metas','cal','acoes'];
const hbCfg=()=>{const c=((S.ax||{})['home.layout'])||{};const ordem=(c.ordem||[]).filter(k=>HB_NOMES[k]);HB_PADRAO.forEach(k=>{if(!ordem.includes(k))ordem.push(k)});return {ordem,ocultos:(c.ocultos||[]).filter(k=>HB_NOMES[k])}};
function hbAplica(){
  if(tab!=='home')return;const ap=document.getElementById('app');if(!ap)return;
  const adr=document.getElementById('adr');if(adr&&!adr.closest('[data-hb]')){} // fica onde está; tratado abaixo
  const blocos={};ap.querySelectorAll('[data-hb]').forEach(el=>{blocos[el.dataset.hb]=el});
  if(adr){const w=document.createElement('section');w.dataset.hb='adr';adr.parentNode.insertBefore(w,adr);w.appendChild(adr);blocos.adr=w}
  const {ordem,ocultos}=hbCfg(),fim=document.createElement('div');fim.id='hb-fim';ap.appendChild(fim);
  ordem.forEach(k=>{const el=blocos[k];if(!el)return;el.style.display=ocultos.includes(k)?'none':'';ap.insertBefore(el,fim)});
  fim.innerHTML=`<button class="btn s" style="width:100%;margin:14px 0 4px" data-hbp="1">${window.icoSvg?window.icoSvg('pen'):''}Personalizar o Início</button>`;
}
function hbEditor(){
  const {ordem,ocultos}=hbCfg();let ov=document.getElementById('hbe');if(!ov){ov=document.createElement('div');ov.id='hbe';document.body.appendChild(ov)}
  ov.innerHTML=`<div class="qk-bk" data-hbx="1"></div><div class="qk-pn"><div class="top"><b style="font-size:19px">Personalizar o Início</b><button class="x" data-hbx="1">✕</button></div><div class="sm mut" style="margin:4px 0 10px">Ligue o que quer ver e use as setas para mudar a ordem.</div>
${ordem.map((k,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--bd)"><label class="ck" style="flex:1;margin:0"><input type="checkbox" data-hbv="${k}"${ocultos.includes(k)?'':' checked'}><span>${HB_NOMES[k]}</span></label><button class="btn s ib" data-hbm="${k}:-1"${i?'':' disabled'} aria-label="Subir">↑</button><button class="btn s ib" data-hbm="${k}:1"${i<ordem.length-1?'':' disabled'} aria-label="Descer">↓</button></div>`).join('')}
<button class="btn s" style="width:100%;margin-top:12px" data-hbr="1">Voltar ao padrão</button></div>`;
  document.body.style.overflow='hidden';
}
const hbSalva=c=>{(S.ax??={})['home.layout']=c;save()};
document.addEventListener('click',e=>{
  if(e.target.closest('[data-hbp]'))return hbEditor();
  if(e.target.closest('[data-hbx]')){const o=document.getElementById('hbe');if(o)o.remove();document.body.style.overflow='';render();return}
  const m=e.target.closest('[data-hbm]');if(m){const [k,d]=m.dataset.hbm.split(':'),c=hbCfg(),i=c.ordem.indexOf(k),j=i+ +d;if(j>=0&&j<c.ordem.length){[c.ordem[i],c.ordem[j]]=[c.ordem[j],c.ordem[i]];hbSalva(c);hbEditor()}return}
  if(e.target.closest('[data-hbr]')){hbSalva({ordem:HB_PADRAO.slice(),ocultos:[]});hbEditor()}
});
document.addEventListener('change',e=>{const v=e.target.closest('[data-hbv]');if(!v)return;const c=hbCfg(),k=v.dataset.hbv;c.ocultos=c.ocultos.filter(x=>x!==k);if(!v.checked)c.ocultos.push(k);hbSalva(c)});

/* ---------- aviso de limite do dia ---------- */
function limiteConfere(){
  const td=loc().slice(0,10),d=S.days[td]||{},mR=limPerda(d),mT=+d.maxT,ts=dayTr(td),pl=dayPL(ts),n=ts.length,k='lim.'+td;
  if(((S.ax||{})[k]))return;
  let msg='';
  if(mR>0&&pl<=-mR)msg=`Você atingiu a perda máxima do dia (${money(pl)}). Pare por hoje.`;
  else if(mT>0&&n>=mT)msg=`Você chegou ao máximo de ${mT} trades hoje. Pare por hoje.`;
  else if(mR>0&&pl<=-mR*.8)msg=`Atenção: perda do dia em ${money(pl)}, perto do limite de ${money(-mR)}.`;
  if(!msg)return;
  const fim=/Pare por hoje/.test(msg);if(fim){(S.ax??={})[k]=1;save()}
  if(window.toast)toast('🛑 '+msg,6000);
  try{if('Notification' in window&&Notification.permission==='granted')navigator.serviceWorker.ready.then(r=>r.showNotification(fim?'🛑 Pare por hoje':'⚠️ Perto do limite',{body:msg,tag:'limite-'+td,icon:'icon-192.png'}))}catch(e){}
}
document.addEventListener('click',e=>{if(e.target.closest('[data-a="savetrade"]'))setTimeout(limiteConfere,80)});

/* ---------- escala de turno nas notificações (o servidor avisa "não opere" de manhã e a véspera à noite) ---------- */
function npComTurno(){
  const t=typeof turnoGet==='function'?turnoGet():null,np=Object.assign({},typeof NP!=='undefined'?NP:{});
  if(t){const hj=loc().slice(0,10),fim=diasMais(hj,60),dias={};Object.keys(t.dias).forEach(k=>{if(k>=diasMais(hj,-1)&&k<=fim)dias[k]=t.dias[k]});np.turno={on:t.on?1:0,niv:t.niv,dias}}
  return np;
}
async function turnoPushSync(force){
  try{
    if(!('serviceWorker' in navigator)||typeof alFn!=='function'||!cfg())return;
    const reg=await navigator.serviceWorker.ready,sub=await reg.pushManager.getSubscription();if(!sub)return;
    const np=npComTurno(),h=JSON.stringify(np)+loc().slice(0,10);if(!force&&ls.get('diario-np-h')===h)return;
    await alFn('inscrever',{sub:sub.toJSON(),prefs:np});ls.set('diario-np-h',h);
  }catch(e){}
}
if(typeof turnoSet==='function'){const ts0=turnoSet;turnoSet=function(f){ts0(f);clearTimeout(turnoSet._t);turnoSet._t=setTimeout(()=>turnoPushSync(true),1500)}}

/* ---------- dólar automático (PTAX do Banco Central, pela função "juros") ---------- */
function dolarAuto(){
  const d=(typeof JR!=='undefined'&&JR.data&&JR.data.ptax)||null;if(!d||!(d.v>0))return;
  if(((S.ax||{})['g.brl.manual']))return;
  const atual=+((S.ax||{})['g.brl'])||0;if(Math.abs(atual-d.v)<0.0001)return;
  (S.ax??={})['g.brl']=String(d.v);(S.ax)['g.brl.data']=d.d;save();
}
if(typeof jrPaint==='function'){const jp0=jrPaint;jrPaint=function(){jp0();dolarAuto()}}
document.addEventListener('change',e=>{const i=e.target.closest('[data-axg="brl"]');if(i)(S.ax??={})['g.brl.manual']=i.value?1:0});

/* ---------- backup: cópia diária versionada na sua conta (30 dias) ---------- */
const BK={lista:null,err:'',busy:0};
async function bkSnapshot(){
  if(!SESS||!cfg())return;
  const hj=loc().slice(0,10);if(ls.get('diario-snap-dia')===hj+'|'+SESS.uid)return;
  try{
    await rq('/rest/v1/diario_backup',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:SESS.uid,dia:hj,data:pub(),criado:new Date().toISOString()})});
    ls.set('diario-snap-dia',hj+'|'+SESS.uid);BK.err='';
    try{await rq('/rest/v1/diario_backup?user_id=eq.'+SESS.uid+'&dia=lt.'+diasMais(hj,-30),{method:'DELETE'})}catch(e){}
  }catch(e){BK.err=e.status===404||/diario_backup/.test(e.message||'')?'Falta criar a tabela de cópias: rode o SQL "seguranca-backup.sql" no Supabase.':'Não consegui guardar a cópia de hoje: '+(e.message||e)}
}
if(typeof sync==='function'){const sy0=sync;sync=async function(m){await sy0(m);if(SESS&&S.lastSyncAt&&Date.now()-S.lastSyncAt<6e4)bkSnapshot()}}
async function bkListar(){
  if(!SESS)return;BK.busy=1;
  try{BK.lista=await(await rq('/rest/v1/diario_backup?select=dia,criado&user_id=eq.'+SESS.uid+'&order=dia.desc&limit=30')).json();BK.err=''}
  catch(e){BK.lista=[];BK.err=e.status===404?'Falta criar a tabela de cópias: rode o SQL "seguranca-backup.sql" no Supabase.':e.message||String(e)}
  BK.busy=0;if(tab==='conta')render();
}
async function bkRestaura(dia){
  if(!confirm('Restaurar a cópia de '+dia.split('-').reverse().join('/')+'? O diário deste aparelho e da nuvem volta a ser igual ao daquele dia. (Antes disso, a situação atual é guardada como cópia de hoje.)'))return;
  try{
    ls.del('diario-snap-dia');await bkSnapshot();
    const r=await(await rq('/rest/v1/diario_backup?select=data&user_id=eq.'+SESS.uid+'&dia=eq.'+dia)).json();
    if(!r[0]||!r[0].data)throw new Error('Cópia não encontrada.');
    adopt(r[0].data);S.mt=Date.now();save();render();if(window.toast)toast('Cópia restaurada.',3000);
  }catch(e){if(window.toast)toast('Não consegui restaurar: '+(e.message||e),5000)}
}
(function(){
  const vc0=vConta;
  vConta=function(){
    const h=vc0();if(!SESS)return h;
    if(BK.lista==null&&!BK.busy)setTimeout(bkListar,0);
    const L=BK.lista||[];
    return h+`<div class="card"><div class="top"><b>Cópias de segurança</b><span class="sm mut">últimos 30 dias</span></div>
<div class="sm mut" style="margin:4px 0 8px">Uma vez por dia o app guarda uma cópia completa do diário na sua conta, além da sincronização. Se algo der errado, volte para o dia que quiser.</div>
${BK.err?`<div class="warn">${esc(BK.err)}</div>`:''}
${BK.lista==null?'<div class="sm mut">Carregando…</div>':L.length?L.slice(0,10).map(x=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-top:1px solid var(--bd)"><span>${x.dia.split('-').reverse().join('/')}<span class="sm mut"> · ${new Date(x.criado).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span></span><button class="btn s" data-bkr="${x.dia}">Restaurar</button></div>`).join(''):'<div class="sm mut">Nenhuma cópia ainda. A primeira é feita na próxima sincronização.</div>'}</div>`;
  };
  document.addEventListener('click',e=>{const b=e.target.closest('[data-bkr]');if(b)bkRestaura(b.dataset.bkr)});
})();
/* status do backup no Início (logado) e aviso mais claro quando não está */
function bkStatus(){
  if(tab!=='home')return;const h=document.querySelector('#app .hero');if(!h||h.querySelector('.bk-st'))return;
  const d=document.createElement('div');d.className='sm mut bk-st';d.style.marginTop='8px';
  if(SESS&&S.lastSyncAt){const min=Math.round((Date.now()-S.lastSyncAt)/6e4);d.innerHTML=(window.icoSvg?window.icoSvg('ok'):'')+'Salvo na nuvem '+(min<1?'agora':min<60?'há '+min+' min':'às '+hm(S.lastSyncAt))}
  else{d.innerHTML=(window.icoSvg?window.icoSvg('alert'):'')+'Backup automático desligado · <a href="#" data-a="gotab" data-id="conta" style="color:var(--ac)">entrar na conta</a>';d.style.color='var(--am)'}
  h.appendChild(d);
}

/* ---------- estatísticas: erros pelas tags e checklist ---------- */
(function(){
  const vs0=vStats;
  vStats=function(){
    let h=vs0();if(ST.aba!=='risco')return h;
    const X=stCtx(),rows=X.rows,ex=rows.flatMap(t=>tagsDe(t).map(g=>({...t,_g:g,_c:catErro(g)})));
    const porTag=agrupa(ex,t=>t._g).sort((a,b)=>a.somaPL-b.somaPL),porCat=agrupa(ex,t=>t._c).sort((a,b)=>a.somaPL-b.somaPL);
    const cks=rows.map(chkFrac).filter(v=>v!=null),ckm=cks.length?cks.reduce((a,b)=>a+b,0)/cks.length:null;
    const ckOk=rows.filter(t=>chkFrac(t)===1),ckNao=rows.filter(t=>{const f=chkFrac(t);return f!=null&&f<1});
    const med=a=>a.length?a.reduce((s,t)=>s+t.c.pl,0)/a.length:null;
    const extra=`${ckm!=null?`<h2>Checklist do setup</h2><div class="kv">${KV('Checklist cumprido',Math.round(ckm*100)+'%','',cks.length+' trades com checklist')}${KV('Média: completo × incompleto',X.fs(med(ckOk))+' × '+X.fs(med(ckNao)),'','resultado médio por trade')}</div>`:''}${ex.length?`<h2>Erros por categoria</h2>${stTbl('Categoria',porCat,X.fs)}<h2>Erros (cada marcação)</h2>${stTbl('Erro',porTag,X.fs)}`:''}`;
    const i=h.indexOf('<h2>Sequências</h2>');
    h=h.replace(/<div class="card"><table><tr><th>Erro<\/th>[\s\S]*?<\/table><\/div>/,'');
    return i<0?h+extra:h.slice(0,i)+extra+h.slice(i);
  };
})();

/* ---------- estilos e ganchos ---------- */
(function(){
  const st=document.createElement('style');
  st.textContent=`#qk,#hbe{position:fixed;inset:0;z-index:70}.qk-bk{position:absolute;inset:0;background:rgba(0,0,0,.55)}
.qk-pn{position:absolute;left:0;right:0;bottom:0;max-height:92vh;overflow-y:auto;background:var(--bg);border-top:1px solid var(--bd);border-radius:20px 20px 0 0;padding:16px 16px calc(20px + env(safe-area-inset-bottom,0px));max-width:640px;margin:0 auto;animation:qkS .2s ease-out}
@keyframes qkS{from{transform:translateY(30px);opacity:.5}}
#fx{position:fixed;inset:0;z-index:65;background:var(--bg);display:flex;flex-direction:column}
#fx .fx-top{display:flex;align-items:center;gap:8px;padding:10px 12px;padding-top:max(10px,env(safe-area-inset-top));border-bottom:1px solid var(--bd)}
#fx .fx-body{flex:1;overflow-y:auto;padding:14px 16px;max-width:720px;width:100%;margin:0 auto;box-sizing:border-box;-webkit-overflow-scrolling:touch}
.bk-st .ico{width:14px;height:14px;vertical-align:-2px}`;
  document.head.appendChild(st);
  /* botão de registro rápido no menu do + */
  const poe=()=>{const m=document.getElementById('fabm');if(!m||m.querySelector('[data-qkn]'))return;const b=document.createElement('button');b.className='btn';b.dataset.qkn='1';b.innerHTML=(window.icoSvg?window.icoSvg('bolt'):'')+'Registro rápido';m.insertBefore(b,m.firstChild)};
  document.addEventListener('click',e=>{if(e.target.closest('[data-qkn]')){const m=document.getElementById('fabm');if(m)m.style.display='none';qkAbre()}});
  const r0=render0;
  render0=function(){r0.apply(this,arguments);try{poe();hbAplica();bkStatus()}catch(e){console.error(e)}};
  /* dados do dólar e da escala ao abrir o app (silencioso) */
  setTimeout(()=>{try{if(typeof jrLoad==='function'&&cfg())jrLoad(false)}catch(e){}turnoPushSync(false)},4000);
})();
/* ==== MELHORIAS:FIM ==== */
/* ==== EXTRAS2:INICIO ==== revisão semanal guiada (B3 + Forex) com lembrete de domingo, gráfico de candles na ficha,
   painel da mesa proprietária, plano de transição (sair da CLT) e importação automática do Profit */
const dOf=t=>String(t.dtx||t.dt||'').slice(0,10);
const fmtD=d=>String(d||'').split('-').reverse().join('/');
const dsem=d=>['dom','seg','ter','qua','qui','sex','sáb'][new Date(d+'T12:00').getDay()];
const usdBrl=()=>+axg('brl',5.4)||5.4;
const pct0=v=>v==null||!isFinite(v)?'–':Math.round(v*100)+'%';
const ic2=n=>window.icoSvg?window.icoSvg(n):'';
const barra=(f,cor)=>`<div style="height:8px;border-radius:6px;background:var(--card2);overflow:hidden;margin-top:6px"><div style="height:100%;width:${Math.max(0,Math.min(100,(f||0)*100)).toFixed(1)}%;background:${cor||'var(--ac)'};border-radius:6px"></div></div>`;

/* =====================================================================================
   1) REVISÃO SEMANAL GUIADA — Brasil (R$) e Forex (US$)
   ===================================================================================== */
function semResumo(a,b){
  const ts=S.trades.map(t=>({...t,c:calc(t)})).filter(t=>t.c.pl!=null&&dOf(t)>=a&&dOf(t)<=b);
  const plB=t=>emBRL(t.c.pl,moedaT(t));
  const dB={};ts.forEach(t=>{const d=dOf(t);dB[d]=(dB[d]||0)+plB(t)});
  const eg={};ts.forEach(t=>tagsDe(t).forEach(g=>{(eg[g]??={v:0,n:0}).v+=plB(t);eg[g].n++}));
  const erro=Object.entries(eg).filter(([,x])=>x.v<0).sort((x,y)=>x[1].v-y[1].v)[0]||null;
  const lim=Object.keys(dB).map(d=>({d,l:limPerda(S.days[d]||{}),v:dB[d]})).filter(x=>x.l>0);
  const estouro=ts.filter(t=>t.c.r!=null&&t.c.r<-1.15);
  const dk=Object.keys(dB).sort((x,y)=>dB[y]-dB[x]);
  const b3={n:ts.length,soma:somaMoedas(ts),tot:sum(ts.map(plB)),acerto:ts.length?ts.filter(t=>t.c.pl>0).length/ts.length:null,dias:dB,
    melhor:dk.length?dk[0]:null,pior:dk.length?dk[dk.length-1]:null,erro,lim,limOk:lim.filter(x=>x.v>=-x.l).length,estouro,
    regras:ts.length?ts.filter(t=>t.rules!=='n').length/ts.length:null,semStop:ts.filter(t=>numN(t.stop)==null).length};
  const it=lcItems().filter(x=>x.d>=a&&x.d<=b),ops=(S.ops||[]).filter(o=>o.st==='closed'&&String(o.dtx||o.dt||'').slice(0,10)>=a&&String(o.dtx||o.dt||'').slice(0,10)<=b);
  const dF={};it.forEach(x=>{dF[x.d]=(dF[x.d]||0)+x.v});const fk=Object.keys(dF).sort((x,y)=>dF[y]-dF[x]);
  const fx={n:it.length,ops:ops.length,tot:sum(it.map(x=>x.v)),acerto:it.length?it.filter(x=>x.v>0).length/it.length:null,dias:dF,
    melhor:fk.length?fk[0]:null,pior:fk.length?fk[fk.length-1]:null,estouro:ops.filter(o=>+o.rk>0&&+o.res<-(+o.rk)*1.15)};
  return {a,b,b3,fx,vazio:!b3.n&&!fx.n};
}
/* resumo curto que vai para o servidor (o servidor não lê os seus trades): sai no push de domingo */
function semPush(){
  const [a,b]=rng('w0'),R=semResumo(a,b),p=[];
  if(R.b3.n)p.push(`Brasil: ${mnyMix(R.b3.soma)} em ${R.b3.n} trade${R.b3.n>1?'s':''}`);
  if(R.fx.n)p.push(`Forex: ${mnyC(R.fx.tot,'USD')}`);
  if(R.b3.erro)p.push(`erro mais caro: ${R.b3.erro[0]}`);
  const est=R.b3.estouro.length+R.fx.estouro.length;if(est)p.push(`${est} perda${est>1?'s':''} além do stop`);
  const corpo=(p.length?p.join(' · ')+'. ':'Semana sem operações registradas. ')+'Toque para fazer a revisão.';
  return {id:a,titulo:'📋 Revisão da semana',corpo:corpo.length>240?corpo.slice(0,237)+'…':corpo};
}
const semPassos=(R,rv)=>{
  const L=[['Stop e limites',!!rv.g_stop],['Erro mais caro',!R.b3.erro||!!String(rv.g_erro||'').trim()],['Forex',!R.fx.n||!!String(rv.g_fx||'').trim()],['Plano da próxima semana',!!String((rv.plano||'')+(rv.repetir||'')+(rv.parar||'')).trim()],['Concluir',!!rv.feita]];
  return {L,ok:L.filter(x=>x[1]).length};
};
function semCard(R,key,rv){
  const B=R.b3,F=R.fx,P=semPassos(R,rv);
  const lin=(l,v,k='')=>`<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-top:1px solid var(--bd)"><span class="sm mut">${l}</span><b class="${k}" style="text-align:right">${v}</b></div>`;
  const dd=d=>d?dsem(d)+' '+fmtD(d).slice(0,5):'–';
  const lin2=(l,v,k='')=>`<div style="padding:6px 0;border-top:1px solid var(--bd)"><div class="sm mut">${l}</div><b class="${k}">${v}</b></div>`;
  const col=(tit,X,fmt,extra)=>{const vd=d=>`${dd(d)}<br><span style="white-space:nowrap" class="${cls(X.dias[d])}">${X===B?money(X.dias[d]):mnyC(X.dias[d],'USD')}</span>`,nd=Object.keys(X.dias).length;return `<div class="card" style="margin:0;padding:10px 12px"><b>${tit}</b>${X.n?lin2('Resultado','<span style="white-space:nowrap">'+fmt(X)+'</span>',cls(X.tot))+lin2('Operações',X.n+(X.acerto!=null?' · '+pct0(X.acerto)+' de acerto':''))+(nd>1?lin2('Melhor dia',vd(X.melhor))+lin2('Pior dia',vd(X.pior)):lin2('Dia',vd(X.melhor)))+(extra||''):'<div class="sm mut" style="margin-top:6px">Nenhuma operação.</div>'}</div>`};
  const dias=[...new Set([...Object.keys(B.dias),...Object.keys(F.dias)])].sort();
  const btn=(k,v,l,cor)=>`<button class="btn ${rv[k]===v?'':'s'}" data-rvb="${k}:${v}"${rv[k]===v&&cor?` style="background:${cor};border-color:${cor}"`:''}>${l}</button>`;
  const ta=(k,l,ph='')=>`<label>${l}<textarea data-rv="${k}" placeholder="${esc(ph)}">${esc(rv[k])}</textarea></label>`;
  const passo=(i,t)=>`<h3 style="display:flex;align-items:center;gap:8px;margin:18px 0 6px;text-transform:none;letter-spacing:0;color:var(--tx);font-size:15.5px"><span style="width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:13px;background:${P.L[i]&&P.L[i][1]?'var(--g)':'var(--card2)'};color:${P.L[i]&&P.L[i][1]?'#fff':'var(--tx)'};flex:none">${P.L[i]&&P.L[i][1]?'✓':i+1}</span>${t}</h3>`;
  const lembr=`<div class="sm mut" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px">${ic2('clock')}<label class="ck" style="margin:0"><input type="checkbox" data-semon${(NP.on||{}).sem===false?'':' checked'}><span>Lembrete todo domingo às</span></label><input type="time" data-semh value="${esc(NP.sem||'18:00')}" style="width:auto;padding:4px 8px;margin:0"></div>`;
  return `<section class="card" id="semrev" style="padding:14px">
<div class="top"><b style="font-size:17px">Revisão guiada</b><span class="chip">${P.ok} de 5 passos</span></div>${barra(P.ok/5,P.ok===5?'var(--g)':'var(--ac)')}
${rv.feita?`<div class="sm g" style="margin-top:8px">${ic2('ok')} Revisão concluída em ${new Date(rv.feita).toLocaleDateString('pt-BR')}.</div>`:''}
<h3 style="margin:16px 0 6px;text-transform:none;letter-spacing:0;color:var(--tx);font-size:15.5px">Números da semana</h3>
<div class="g2" style="gap:8px">${col('Brasil (R$)',B,X=>mnyMix(X.soma),lin2('Regras seguidas',pct0(B.regras)))}${col('Forex (US$)',F,X=>mnyC(X.tot,'USD'))}</div>
${dias.length?`<div class="card" style="margin-top:8px;padding:8px 12px"><table><tr><th>Dia</th><th>Brasil</th><th>Forex</th></tr>${dias.map(d=>`<tr><td>${dd(d)}</td><td class="${cls(B.dias[d]||0)}">${B.dias[d]!=null?money(B.dias[d]):'–'}</td><td class="${cls(F.dias[d]||0)}">${F.dias[d]!=null?mnyC(F.dias[d],'USD'):'–'}</td></tr>`).join('')}</table></div>`:''}
${passo(0,'Stop e limites')}
<div class="sm">${B.n?`Brasil: ${B.lim.length?`respeitou a perda máxima do dia em <b>${B.limOk} de ${B.lim.length}</b> dia(s).`:'você não definiu perda máxima nos dias operados (Meu dia).'}`:''} ${B.estouro.length+F.estouro.length?`<span class="r">Perdas maiores que o stop planejado: <b>${B.estouro.length}</b> no Brasil${F.n?` e <b>${F.estouro.length}</b> no Forex`:''}.</span>`:B.n||F.n?'<span class="g">Nenhuma perda passou do stop planejado.</span>':''}${B.semStop?` <span class="am">${B.semStop} trade(s) sem stop registrado.</span>`:''}</div>
<div class="sm" style="margin:8px 0 4px">Nesta semana eu tirei o stop, mexi nele ou deixei a perda correr?</div><div class="g2">${btn('g_stop','n','Não, respeitei','var(--g)')}${btn('g_stop','s','Sim, aconteceu','var(--r)')}</div>
${rv.g_stop==='s'?ta('g_stop_txt','O que eu estava sentindo e o que vou fazer na próxima vez (ex.: ordem de stop na plataforma antes de entrar)?'):''}
${passo(1,'Erro mais caro')}
${B.erro?`<div class="card" style="margin:0 0 6px">Erro mais caro: <b>${esc(B.erro[0])}</b> <span class="r" style="white-space:nowrap">${money(B.erro[1].v)}</span> <span class="sm mut">(${B.erro[1].n}x)</span></div>${ta('g_erro','Por que aconteceu e o que vai impedir na próxima semana?')}`:'<div class="sm g">Nenhum erro marcado nos trades desta semana.</div>'}
${passo(2,'Forex')}
${F.n?ta('g_fx','Na conta de fora, segui o plano (lote, stop, horário)? O que ajustar?'):'<div class="sm mut">Sem operações no Forex nesta semana.</div>'}
${passo(3,'Plano da próxima semana')}
${ta('repetir','O que vou repetir (o que funcionou)?')}${ta('parar','O que vou parar de fazer?')}${ta('plano','Foco para a próxima semana','Ex.: só 2 trades por dia; stop sempre na plataforma')}
${passo(4,'Concluir')}
<button class="btn" style="width:100%" data-rvok="1">${rv.feita?'Revisão concluída ✓':'Concluir a revisão'}</button>${lembr}</section>`;
}
(function(){
  const vr0=vRev;
  vRev=function(){
    if(RP[0]!=='w')return vr0();
    const [a,b,key]=rng(RP),rv=(S.rev||{})[key]||{},R=semResumo(a,b);
    return `<h1>Revisão da semana</h1><label>Período<select id="rp">${opt([['w0','Esta semana'],['w1','Semana passada'],['m0','Este mês'],['m1','Mês passado']],RP)}</select></label><div class="mut sm" style="margin-bottom:10px">${fmtD(a)} a ${fmtD(b)}</div>${semCard(R,key,rv)}<h2>Calendário</h2>${cal()}`;
  };
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-rvb]');
    if(b){const [k,v]=b.dataset.rvb.split(':');((S.rev??={})[rng(RP)[2]]??={})[k]=v;save();render();return}
    if(e.target.closest('[data-rvok]')){const r=((S.rev??={})[rng(RP)[2]]??={});r.feita=new Date().toISOString();save();render();if(window.toast)toast('Revisão da semana concluída. Boa semana!',3000);return}
    const g=e.target.closest('[data-semgo]');if(g){RP=g.dataset.semgo;tab='rev';render();scrollTo(0,0)}
  });
  document.addEventListener('change',e=>{
    const on=e.target.closest('[data-semon]'),h=e.target.closest('[data-semh]');
    if(!on&&!h)return;NP.on=Object.assign({m:true,n:true,ev:true},NP.on||{});
    if(on)NP.on.sem=on.checked;if(h&&/^\d\d:\d\d$/.test(h.value))NP.sem=h.value;
    alSave();turnoPushSync(true);if(window.toast)toast(NP.on.sem===false?'Lembrete de domingo desligado.':'Lembrete de domingo às '+(NP.sem||'18:00')+'.',2500);
  });
  /* o resumo da semana vai junto com as preferências de notificação (servidor manda o push no domingo) */
  const npc0=npComTurno;npComTurno=function(){const np=npc0();try{np.semana=semPush()}catch(e){}if(!np.sem)np.sem=NP.sem||'18:00';return np};
  let tS=0;document.addEventListener('click',e=>{if(e.target.closest('[data-a="savetrade"],[data-qkok]')){clearTimeout(tS);tS=setTimeout(()=>turnoPushSync(false),8000)}});
})();
/* aviso no Início: domingo à tarde (semana atual) e segunda (semana passada) se a revisão não foi feita */
function semAviso(){
  if(tab!=='home'||document.getElementById('semav'))return;
  const n=new Date(),dw=n.getDay(),k=dw===0&&n.getHours()>=12?'w0':dw===1?'w1':null;if(!k)return;
  const [a,b,key]=rng(k),rv=(S.rev||{})[key]||{};if(rv.feita)return;
  const R=semResumo(a,b);if(R.vazio)return;
  const ap=document.getElementById('app');if(!ap)return;
  ap.insertAdjacentHTML('afterbegin',`<div class="card" id="semav" style="display:flex;align-items:center;gap:10px;border-color:var(--ac)">${ic2('pen')}<div style="flex:1"><b>Revisão da semana pendente</b><div class="sm mut">${fmtD(a).slice(0,5)} a ${fmtD(b).slice(0,5)} · 5 passos, uns 10 minutos</div></div><button class="btn" data-semgo="${k}">Fazer</button></div>`);
}

/* =====================================================================================
   2) GRÁFICO DE CANDLES NA FICHA DA OPERAÇÃO (função "candles" no Supabase)
   ===================================================================================== */
const CDL={};
const epBR=x=>{const m=/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(x||''));return m?Date.parse(`${m[1]}T${m[2]||'12'}:${m[3]||'00'}:00-03:00`)/1000:NaN};
function cdlSvg(j,t){
  const C=j.candles||[];if(!C.length)return '<div class="sm mut">Sem candles para esse período.</div>';
  const W=360,H=210,pl=6,pr=58,pt=10,pb=22,n=C.length,cw=(W-pl-pr)/n;
  const e=numN(t.entry),s=numN(t.stop),x=numN(t.exit),tg=numN(t.target),preco=!j.proxy;
  let lo=Math.min(...C.map(c=>c[3])),hi=Math.max(...C.map(c=>c[2]));
  if(preco)[e,s,x,tg].forEach(v=>{if(v!=null&&v>lo-(hi-lo)*.6&&v<hi+(hi-lo)*.6){lo=Math.min(lo,v);hi=Math.max(hi,v)}});
  const pad=(hi-lo)*.06||1;lo-=pad;hi+=pad;
  const Y=v=>pt+(hi-v)/(hi-lo)*(H-pt-pb),X=i=>pl+(i+.5)*cw;
  const idx=ts=>{if(!isFinite(ts))return null;if(ts<C[0][0]-86400*3||ts>C[n-1][0]+86400*3)return null;let k=0;for(let i=0;i<n;i++)if(C[i][0]<=ts)k=i;return k};
  const dec=hi>1000?0:hi>20?2:4,fp=v=>v.toLocaleString('pt-BR',{minimumFractionDigits:dec,maximumFractionDigits:dec});
  let g='';
  for(let i=0;i<=3;i++){const v=lo+(hi-lo)*i/3;g+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--bd)" stroke-width=".6"/><text x="${W-pr+4}" y="${Y(v)+3}" font-size="9" fill="var(--mut)">${fp(v)}</text>`}
  C.forEach((c,i)=>{const up=c[4]>=c[1],cor=up?'var(--g)':'var(--r)',y1=Y(Math.max(c[1],c[4])),y2=Y(Math.min(c[1],c[4]));
    g+=`<line x1="${X(i)}" x2="${X(i)}" y1="${Y(c[2])}" y2="${Y(c[3])}" stroke="${cor}" stroke-width="1"/><rect x="${X(i)-Math.max(.6,cw*.35)}" y="${y1}" width="${Math.max(1.2,cw*.7)}" height="${Math.max(.8,y2-y1)}" fill="${cor}"/>`});
  const iE=idx(epBR(t.dt)),iX=t.dtx?idx(epBR(t.dtx)):null;
  const vl=(i,cor,l,baixo)=>i==null?'':`<line x1="${X(i)}" x2="${X(i)}" y1="${pt}" y2="${H-pb}" stroke="${cor}" stroke-width="1.2" stroke-dasharray="3 3"/><text x="${X(i)>W-pr-44?X(i)-3:X(i)+3}" text-anchor="${X(i)>W-pr-44?'end':'start'}" y="${baixo?H-pb-5:pt+9}" font-size="9.5" font-weight="700" fill="${cor}">${l}</text>`;
  if(iE!=null&&iX!=null&&iX>iE)g+=`<rect x="${X(iE)}" y="${pt}" width="${X(iX)-X(iE)}" height="${H-pt-pb}" fill="var(--ac)" opacity=".09"/>`;
  const hl=(v,cor,l)=>v==null||!preco||v<lo||v>hi?'':`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${cor}" stroke-width="1" stroke-dasharray="5 3" opacity=".9"/><rect x="${W-pr+1}" y="${Y(v)-7}" width="${pr-2}" height="13" rx="3" fill="${cor}"/><text x="${W-pr+4}" y="${Y(v)+3}" font-size="9" fill="#fff" font-weight="700">${l}</text>`;
  g+=vl(iE,'var(--ac)','Entrada')+vl(iX,'var(--tx)','Saída',1);
  g+=hl(s,'var(--r)','Stop')+hl(tg,'var(--g)','Alvo')+hl(e,'var(--ac)','Entr.')+hl(x,'#6b7280','Saída');
  if(preco&&iE!=null&&e!=null)g+=`<circle cx="${X(iE)}" cy="${Y(e)}" r="4" fill="var(--ac)" stroke="#fff" stroke-width="1.5"/>`;
  if(preco&&iX!=null&&x!=null)g+=`<circle cx="${X(iX)}" cy="${Y(x)}" r="4" fill="var(--tx)" stroke="var(--bg)" stroke-width="1.5"/>`;
  const fT=ts=>{const d=new Date(ts*1000);return j.intervalo==='1d'?d.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit'}):d.toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'})+(j.intervalo==='60m'?' '+d.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit'}):'')};
  [0,Math.floor(n/2),n-1].forEach((i,k)=>{g+=`<text x="${k===0?pl:k===2?W-pr:X(i)}" y="${H-6}" font-size="9" fill="var(--mut)" text-anchor="${k===0?'start':k===2?'end':'middle'}">${fT(C[i][0])}</text>`});
  const iv={'5m':'5 minutos','60m':'1 hora','1d':'1 dia'}[j.intervalo]||j.intervalo;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="Gráfico de candles do trade">${g}</svg>
<div class="sm mut" style="margin-top:6px">${esc(j.simbolo)} · candles de ${iv} · Yahoo Finance (com atraso)${iE==null?' · horário da entrada fora do gráfico':''}</div>${j.nota?`<div class="sm ${j.proxy?'am':'mut'}" style="margin-top:4px">${esc(j.nota)}</div>`:''}`;
}
async function fxCandles(t){
  const box=document.getElementById('fxc');if(!box||!t)return;
  const c=cfg();if(!c){box.innerHTML='<div class="sm mut">Entre na conta (Supabase) para ver o gráfico do trade.</div>';return}
  const k=[t.id,t.ativo,t.sub,t.dt,t.dtx].join('|');
  if(!CDL[k])CDL[k]=fetch(c.url+'/functions/v1/candles',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.key},body:JSON.stringify({ativo:t.ativo,sub:t.sub||'',de:t.dt,ate:t.dtx||''})})
    .then(async r=>{let j={};try{j=await r.json()}catch(e){}if(!r.ok){const m=j.error||'';throw new Error(m||(r.status===404?'Função "candles" não encontrada: publique-a no Supabase (veja o passo a passo).':'Erro '+r.status))}return j})
    .catch(e=>({erro:e.message||String(e)}));
  const j=await CDL[k];if(j.erro)delete CDL[k];
  const b2=document.getElementById('fxc');if(!b2||b2.dataset.fxc!==t.id)return;
  b2.innerHTML=j.erro?`<div class="sm mut">${esc(j.erro)}</div>`:cdlSvg(j,t);
}
(function(){
  const fh0=fxHtml;
  fxHtml=function(){
    let h=fh0();const t=FX&&S.trades.find(x=>x.id===FX.id);if(!h||!t)return h;
    if(t.orig==='profit'&&numN(t.stop)==null)h=h.replace('<h2>Plano × execução</h2>',`<div class="warn" style="margin:10px 0">${ic2('bolt')} Importado do Profit. Toque em <b>Editar</b> para completar stop, setup e erros.</div><h2>Plano × execução</h2>`);
    if(String(t.ativo||'').trim()&&t.dt)h=h.replace('<h2>Plano × execução</h2>',`<h2>Gráfico</h2><div class="card" id="fxc" data-fxc="${esc(t.id)}" style="padding:10px"><div class="sm mut">Carregando o gráfico…</div></div><h2>Plano × execução</h2>`);
    return h;
  };
  const fd0=fxDesenha;
  fxDesenha=function(){fd0();if(FX)fxCandles(S.trades.find(x=>x.id===FX.id))};
})();

/* =====================================================================================
   3) MESA PROPRIETÁRIA — regras, status do teste e "quanto posso perder hoje"
   ===================================================================================== */
/* regras que você já tinha anotado de cada mesa; confira sempre no regulamento atual da mesa */
const MESA_PRESETS={
  euro25:{nome:'Euro Global Prop 25k',moeda:'USD',fonte:'usd',capital:25000,meta:1500,perdaDia:0,perdaTotal:1500,dd:'eod',trava:1,consist:40,capDia:0,diasMin:5,diasTipo:'pos',prazo:30,pregao:19,contratos:3,obs:'Até 3 minis ou 30 micros. Drawdown no fechamento do dia. Pregão das 19h às 18h.'},
  mide:{nome:'MIDE Exame Arrojado',moeda:'BRL',fonte:'b3',capital:0,meta:2400,perdaDia:0,perdaTotal:3300,dd:'fixo',trava:0,consist:0,capDia:50,diasMin:5,diasTipo:'op',prazo:0,pregao:0,contratos:20,obs:'Sem stop diário no exame, mas o resultado de cada dia conta no máximo 50% da meta.'},
  euroinv:{nome:'Euro Invest Júnior',moeda:'BRL',fonte:'b3',capital:0,meta:1400,perdaDia:0,perdaTotal:2835,dd:'fixo',trava:0,consist:40,capDia:0,diasMin:5,diasTipo:'pos',prazo:0,pregao:0,contratos:10,obs:'Conta turbinada.'},
  fpips:{nome:'FundingPips 50k',moeda:'USD',fonte:'fx',capital:50000,meta:0,perdaDia:1500,perdaTotal:2500,dd:'fixo',trava:0,consist:15,capDia:0,diasMin:7,diasTipo:'pos',prazo:0,pregao:0,contratos:0,obs:'Perda máxima 5% e diária 3%. Preencha a meta da fase.'},
  custom:{nome:'Minha mesa',moeda:'BRL',fonte:'b3',capital:0,meta:0,perdaDia:0,perdaTotal:0,dd:'fixo',trava:0,consist:0,capDia:0,diasMin:0,diasTipo:'pos',prazo:0,pregao:0,contratos:0,obs:''},
};
function mesaCfg(){
  const c=(S.ax||{}).mesa;if(c&&c.preset)return c;
  const P=S.prop||{};if(+P.meta>0||+P.ddTotal>0)return {...MESA_PRESETS.custom,preset:'custom',capital:+P.cap||0,meta:+P.meta||0,perdaDia:+P.perdaDia||0,perdaTotal:+P.ddTotal||0,dd:P.ddTipo==='fixo'?'fixo':'trail',consist:+P.consist||0,inicio:'',_antigo:1};
  return null;
}
const mesaSalva=c=>{delete c._antigo;(S.ax??={}).mesa=c;save()};
const mesaDia=(dt,pregao)=>{const d=String(dt).slice(0,10),h=+String(dt).slice(11,13)||0;return pregao>0&&h>=pregao?diasMais(d,1):d};
function mesaItens(c){
  const pre=String(c.ativos||'').toUpperCase().split(/[\s,;]+/).filter(Boolean),okA=a=>!pre.length||pre.some(p=>String(a||'').toUpperCase().startsWith(p));
  let it=[];
  if(c.fonte==='fx')it=lcItems().map(x=>({d:x.d,t:x.d+'T12:00',v:x.v,q:null}));
  else it=S.trades.map(t=>({...t,c:calc(t)})).filter(t=>t.c.pl!=null&&moedaT(t)===(c.fonte==='usd'?'USD':'BRL')&&okA(t.ativo)).map(t=>({d:mesaDia(t.dtx||t.dt,+c.pregao||0),t:t.dtx||t.dt,v:t.c.pl,q:numN(t.qty),a:t.ativo}));
  if(c.inicio)it=it.filter(x=>x.d>=c.inicio);
  return it.sort((a,b)=>a.t.localeCompare(b.t));
}
function mesaCalc(c,agora){
  const it=mesaItens(c),pt=+c.perdaTotal||0,pd=+c.perdaDia||0,meta=+c.meta||0,hoje=mesaDia(agora||loc().slice(0,16),+c.pregao||0);
  const dias={};it.forEach(x=>{dias[x.d]=(dias[x.d]||0)+x.v});const ks=Object.keys(dias).sort();
  const pisoDe=pk=>!pt?-Infinity:c.dd==='fixo'?-pt:(c.trava?Math.min(pk-pt,0):pk-pt);
  let eq=0,pk=0,quebra=null,diaQ=null;
  if(c.dd==='trail'){it.forEach(x=>{eq+=x.v;if(!quebra&&eq<=pisoDe(pk))quebra=x.d;pk=Math.max(pk,eq)})}
  else ks.forEach(d=>{eq+=dias[d];if(!quebra&&eq<=pisoDe(pk))quebra=d;if(d!==hoje)pk=Math.max(pk,eq)});
  if(pd>0)ks.forEach(d=>{if(!diaQ&&dias[d]<=-pd)diaQ=d});
  const saldo=eq,piso=pisoDe(pk),margem=pt?saldo-piso:null,plHoje=dias[hoje]||0;
  const cap=+c.capDia>0&&meta>0?meta*c.capDia/100:0;
  const lucroEf=ks.reduce((s,d)=>s+(cap&&dias[d]>cap?cap:dias[d]),0);
  const pos=ks.filter(d=>dias[d]>0),maior=pos.length?Math.max(...pos.map(d=>dias[d])):0;
  const cons=+c.consist>0&&saldo>0?maior/saldo:null,consOk=+c.consist>0?(saldo>0?cons<=c.consist/100:null):true;
  const precisaTotal=+c.consist>0&&maior>0?maior/(c.consist/100):0;
  const nDias=c.diasTipo==='op'?ks.length:pos.length,diasOk=!(+c.diasMin>0)||nDias>=+c.diasMin;
  const restDia=pd>0?pd+Math.min(plHoje,0):null; // limite do dia − perda já feita hoje
  const cand=[];if(restDia!=null)cand.push(['o limite diário',restDia]);if(margem!=null)cand.push(['o limite de perda total',margem]);
  const lp=(()=>{const d=S.days[loc().slice(0,10)]||{},l=limPerda(d);if(!(l>0)||c.fonte!=='b3')return null;const ph=dayPL(dayTr(loc().slice(0,10)));return l+Math.min(ph,0)})();
  if(lp!=null)cand.push(['o seu limite do dia (Meu dia)',lp]);
  const pode=cand.length?cand.reduce((m,x)=>x[1]<m[1]?x:m):null;
  const ganhoMaxHoje=+c.consist>0&&meta>0?Math.max(0,Math.max(meta,saldo)*c.consist/100):cap||null;
  const fimPrazo=+c.prazo>0&&c.inicio?diasMais(c.inicio,+c.prazo-1):null,restam=fimPrazo?Math.round((new Date(fimPrazo+'T12:00')-new Date(loc().slice(0,10)+'T12:00'))/864e5)+1:null;
  const acima=+c.contratos>0?it.filter(x=>x.q!=null&&x.q>+c.contratos).length:0;
  let st=['Em andamento','var(--ac)'];
  if(quebra)st=['Reprovado: perda total','var(--r)'];else if(diaQ)st=['Reprovado: perda diária','var(--r)'];
  else if(meta>0&&lucroEf>=meta){st=diasOk&&consOk!==false?['Meta batida','var(--g)']:['Meta batida, falta '+(!diasOk?'dias':'consistência'),'var(--am)']}
  else if(restam!=null&&restam<=0)st=['Prazo encerrado','var(--r)'];
  return {it,dias,ks,saldo,piso,pk,margem,plHoje,hoje,lucroEf,cap,maior,cons,consOk,precisaTotal,nDias,diasOk,pode,ganhoMaxHoje,fimPrazo,restam,acima,quebra,diaQ,st,meta,pt,pd};
}
const mFmt=(c,v)=>mnyC(v,c.moeda==='USD'?'USD':'BRL');
function mesaMini(){
  const c=mesaCfg();if(!c)return '';const M=mesaCalc(c);
  return `<div class="card" style="padding:12px 14px"><div class="top"><b>${esc(c.nome)}</b><span class="chip" style="color:${M.st[1]};border-color:${M.st[1]}">${M.st[0]}</span></div>
${M.pode?`<div class="sm mut" style="margin-top:8px">Hoje você ainda pode perder</div><div style="font-size:22px;font-weight:750" class="${M.pode[1]<=0?'r':''}">${M.pode[1]<=0?'Nada: pare por hoje':mFmt(c,M.pode[1])}</div><div class="sm mut">antes de bater ${M.pode[0]}</div>`:''}
${M.meta>0?`<div class="sm" style="margin-top:8px;display:flex;justify-content:space-between"><span>Meta ${mFmt(c,M.meta)}</span><b class="${cls(M.lucroEf)}">${mFmt(c,M.lucroEf)}</b></div>${barra(M.lucroEf/M.meta,'var(--g)')}`:''}
<button class="btn s" style="width:100%;margin-top:10px" data-m2="mesa">Abrir o painel da mesa</button></div>`;
}
function vMesa(){
  const c=mesaCfg();
  const escolhe=`<div class="g2" style="gap:8px">${Object.entries(MESA_PRESETS).map(([k,p])=>`<button class="btn ${c&&c.preset===k?'':'s'}" data-msp="${k}" style="text-align:left;white-space:normal;line-height:1.25">${esc(p.nome)}</button>`).join('')}</div>`;
  if(!c)return `<h1>Mesa proprietária</h1><p class="mut">Escolha a sua mesa para o app acompanhar a meta, a perda máxima, os dias mínimos e a consistência com os seus trades. As regras já vêm preenchidas com o que você anotou; confira no regulamento da mesa e ajuste.</p>${escolhe}`;
  const M=mesaCalc(c),F=v=>mFmt(c,v);
  const kv=(l,v,sub='',k='')=>`<div class="card" style="margin:0;padding:10px"><span class="sm mut">${l}</span><div><b class="${k}" style="font-size:16px">${v}</b></div>${sub?`<div class="sm mut">${sub}</div>`:''}</div>`;
  const al=[];
  if(M.cap&&M.ks.some(d=>M.dias[d]>M.cap))al.push(`Em ${M.ks.filter(d=>M.dias[d]>M.cap).length} dia(s) o ganho passou de ${F(M.cap)} (${c.capDia}% da meta): o excedente não conta para a meta.`);
  if(M.consOk===false)al.push(`Consistência: o maior dia (${F(M.maior)}) é ${pct0(M.cons)} do lucro. O limite é ${c.consist}%: o lucro total precisa chegar a ${F(M.precisaTotal)}.`);
  if(M.acima)al.push(`${M.acima} trade(s) com mais de ${c.contratos} contrato(s).`);
  if(M.plHoje>0&&M.ganhoMaxHoje&&M.plHoje>=M.ganhoMaxHoje*.9)al.push(`Hoje você já ganhou ${F(M.plHoje)}: perto do máximo recomendado para o dia (${F(M.ganhoMaxHoje)}). Pense em parar.`);
  const last=M.ks.slice(-15).reverse();let ac=M.saldo;const saldoAte={};[...M.ks].reverse().forEach(d=>{saldoAte[d]=ac;ac-=M.dias[d]});
  const f=(k,l,tp='number',extra='')=>`<label>${l}<input type="${tp}" ${tp==='number'?'step="any" inputmode="decimal"':''} data-ms="${k}" value="${esc(c[k]??'')}" ${extra}></label>`;
  return `<h1>Mesa proprietária</h1>
<div class="hero" style="margin-top:0"><div class="top"><span class="chip" style="color:${M.st[1]};border-color:${M.st[1]}">${M.st[0]}</span><span class="sm mut">${esc(c.nome)}</span></div>
${M.pode?`<div class="sm mut" style="margin-top:10px">Hoje você ainda pode perder</div><div class="big ${M.pode[1]<=0?'r':''}">${M.pode[1]<=0?'Nada: pare por hoje':F(M.pode[1])}</div><div class="sm mut">antes de bater ${M.pode[0]}${M.plHoje?` · hoje: <b class="${cls(M.plHoje)}">${F(M.plHoje)}</b>`:''}</div>`:`<div class="sm mut" style="margin-top:10px">Preencha a perda máxima (diária ou total) para ver quanto pode perder hoje.</div>`}
${M.ganhoMaxHoje?`<div class="sm" style="margin-top:6px">Ganho máximo recomendado no dia: <b>${F(M.ganhoMaxHoje)}</b>${c.capDia>0?' (acima disso não conta)':' (consistência)'}</div>`:''}
${M.meta>0?`<div class="sm" style="margin-top:12px;display:flex;justify-content:space-between"><span>Meta ${F(M.meta)}</span><b>${pct0(Math.max(0,M.lucroEf)/M.meta)}</b></div>${barra(M.lucroEf/M.meta,'var(--g)')}`:''}</div>
${al.map(x=>`<div class="warn" style="margin:8px 0">${x}</div>`).join('')}
<div class="kv" style="margin-top:10px">${kv('Resultado no teste',F(M.saldo),M.it.length+' operação(ões) desde '+(c.inicio?fmtD(c.inicio):'o início'),cls(M.saldo))}
${kv('Até a perda total',M.margem==null?'–':F(M.margem),M.pt?(c.dd==='fixo'?'limite fixo de '+F(M.pt):'piso em '+F(M.piso)+' (pico '+F(M.pk)+')'):'sem limite',M.margem!=null&&M.margem<M.pt*.3?'r':'')}
${kv(c.diasTipo==='op'?'Dias operados':'Dias positivos',M.nDias+(+c.diasMin>0?' de '+c.diasMin:''),M.diasOk?'mínimo cumprido':'faltam '+(c.diasMin-M.nDias),M.diasOk?'g':'')}
${kv('Consistência',+c.consist>0?(M.cons==null?'–':pct0(M.cons)):'sem regra',+c.consist>0?'maior dia ≤ '+c.consist+'% do lucro':'',M.consOk===false?'r':M.consOk?'g':'')}
${M.fimPrazo?kv('Prazo',M.restam>0?M.restam+' dia(s)':'encerrado','até '+fmtD(M.fimPrazo)):''}${+c.contratos>0?kv('Contratos',`até ${c.contratos}`,M.acima?M.acima+' trade(s) acima':'tudo dentro',M.acima?'r':'g'):''}</div>
${last.length?`<h2>Dia a dia</h2><div class="card"><table><tr><th>Pregão</th><th>Resultado</th><th>Acumulado</th></tr>${last.map(d=>`<tr><td>${dsem(d)} ${fmtD(d).slice(0,5)}</td><td class="${cls(M.dias[d])}">${F(M.dias[d])}${M.cap&&M.dias[d]>M.cap?' <span class="sm am">(conta '+F(M.cap)+')</span>':''}</td><td>${F(saldoAte[d])}</td></tr>`).join('')}</table></div>`:'<p class="mut">Nenhuma operação desta mesa ainda. Confira a data de início e de onde vêm os trades nas regras abaixo.</p>'}
<h2>Regras da mesa</h2>${c._antigo?'<div class="warn">Usando as regras do Painel antigo. Escolha a sua mesa abaixo para completar.</div>':''}${escolhe}
${c.obs?`<div class="sm mut" style="margin:8px 0">${esc(c.obs)}</div>`:''}<div class="sm am" style="margin:6px 0 10px">Confira sempre no regulamento atual da mesa: as regras mudam.</div>
<div class="card"><div class="g2">${f('nome','Nome','text')}${f('inicio','Início do teste','date')}</div>
<div class="g2"><label>Trades que contam<select data-ms="fonte">${opt([['b3','Day trade/swing em R$ (B3)'],['usd','Day trade em US$ (futuros EUA)'],['fx','Aba Forex']],c.fonte)}</select></label>${f('ativos','Só estes ativos (opcional)','text','placeholder="WIN, WDO"')}</div>
<div class="g2"><label>Moeda<select data-ms="moeda">${opt([['BRL','R$'],['USD','US$']],c.moeda)}</select></label>${f('capital','Tamanho da conta')}</div>
<div class="g2">${f('meta','Meta de lucro')}${f('perdaTotal','Perda máxima total')}</div>
<div class="g2"><label>Tipo da perda total<select data-ms="dd">${opt([['fixo','Fixa (do saldo inicial)'],['eod','Móvel no fechamento do dia'],['trail','Móvel a cada trade']],c.dd)}</select></label>${f('perdaDia','Perda máxima diária (0 = não tem)')}</div>
${c.dd!=='fixo'?`<label class="ck"><input type="checkbox" data-ms="trava"${c.trava?' checked':''}><span>A perda móvel para de subir no saldo inicial</span></label>`:''}
<div class="g2">${f('consist','Consistência: maior dia ≤ % do lucro')}${f('capDia','Ganho do dia conta até % da meta')}</div>
<div class="g2">${f('diasMin','Dias mínimos')}<label>Contar dias<select data-ms="diasTipo">${opt([['pos','Positivos'],['op','Operados']],c.diasTipo)}</select></label></div>
<div class="g3">${f('prazo','Prazo (dias)')}${f('pregao','Pregão começa às (h)')}${f('contratos','Máx. contratos')}</div></div>`;
}
(function(){
  document.addEventListener('click',e=>{const b=e.target.closest('[data-msp]');if(!b)return;const c0=mesaCfg(),p=MESA_PRESETS[b.dataset.msp];
    if(c0&&!c0._antigo&&c0.preset!==b.dataset.msp&&!confirm('Trocar para '+p.nome+'? As regras serão substituídas.'))return;
    mesaSalva({...p,preset:b.dataset.msp,inicio:(c0&&c0.inicio)||loc().slice(0,10)});render()});
  document.addEventListener('change',e=>{const i=e.target.closest('[data-ms]');if(!i)return;const c=mesaCfg()||{...MESA_PRESETS.custom,preset:'custom'},k=i.dataset.ms;
    c[k]=i.type==='checkbox'?(i.checked?1:0):i.type==='number'?(i.value===''?0:+i.value):i.value;mesaSalva(c);render()});
  /* Início: o cartão "Limites da mesa" mostra o painel novo quando a mesa está configurada */
  HB_NOMES.lim='Mesa proprietária';
  const pp0=ppOut;ppOut=function(){pp0();if(tab==='home'&&mesaCfg()){const e=document.getElementById('pp');if(e){e.innerHTML=mesaMini();const h=e.previousElementSibling;if(h&&h.tagName==='H2')h.textContent='Mesa proprietária'}}};
  /* Painel: atalho para o painel completo */
  const vp0=vPainel;vPainel=function(){return vp0().replace('<h2>🛡️ Mesa proprietária</h2>','<div class="card" style="display:flex;align-items:center;gap:10px"><div style="flex:1"><b>Painel completo da mesa</b><div class="sm mut">Regras prontas das suas mesas, status do teste e quanto pode perder hoje.</div></div><button class="btn" data-m2="mesa">Abrir</button></div><h2>🛡️ Mesa proprietária (básico)</h2>')};
  /* aviso quando a mesa não deixa perder mais nada hoje */
  const lc0=limiteConfere;limiteConfere=function(){lc0();try{const c=mesaCfg();if(!c)return;const M=mesaCalc(c),k='mesa.av.'+M.hoje;if(!M.pode||M.pode[1]>0||(S.ax||{})[k])return;(S.ax??={})[k]=1;save();if(window.toast)toast('🛑 Mesa: você chegou a '+M.pode[0]+'. Pare por hoje.',6000)}catch(e){}};
})();

/* =====================================================================================
   4) PLANO DE TRANSIÇÃO — quando dá para viver do trading (sair da CLT)
   ===================================================================================== */
const CR_PADRAO={renda:0,custo:0,reserva:0,mesesReserva:12,mesesPos:12,alvo:0,ir:20,fx:1};
const crCfg=()=>({...CR_PADRAO,...((S.ax||{}).carreira||{})});
function crMeses(c){
  const m={},add=(ym,k,v)=>{(m[ym]??={b3:0,fx:0,n:0})[k]+=v;m[ym].n++};
  S.trades.forEach(t=>{const x=calc(t);if(x.pl!=null)add(dOf(t).slice(0,7),'b3',emBRL(x.pl,moedaT(t)))});
  if(c.fx)lcItems().forEach(x=>add(x.d.slice(0,7),'fx',x.v*usdBrl()));
  const ks=Object.keys(m).filter(k=>/^\d{4}-\d{2}$/.test(k)).sort();if(!ks.length)return [];
  const out=[],fim=loc().slice(0,7);let y=+ks[0].slice(0,4),mo=+ks[0].slice(5,7),prej=0;
  for(;;){const k=y+'-'+String(mo).padStart(2,'0');if(k>fim)break;const r=m[k]||{b3:0,fx:0,n:0},bruto=r.b3+r.fx;
    let ir=0;if(bruto<0)prej+=-bruto;else{const base=Math.max(0,bruto-prej);prej=Math.max(0,prej-bruto);ir=base*(+c.ir||0)/100}
    out.push({k,b3:r.b3,fx:r.fx,bruto,ir,liq:bruto-ir,n:r.n,atual:k===fim});if(++mo>12){mo=1;y++}}
  return out;
}
function crCalc(c){
  const M=crMeses(c),fe=M.filter(x=>!x.atual),alvo=+c.alvo||+c.renda||0,custo=+c.custo||0;
  let seq=0;for(let i=fe.length-1;i>=0&&fe[i].liq>0;i--)seq++;
  const med=n=>{const L=fe.slice(-n);return L.length?sum(L.map(x=>x.liq))/L.length:null};
  const u6=fe.slice(-6),pior6=u6.length?Math.min(...u6.map(x=>x.liq)):null;
  const de=diasMais(loc().slice(0,10),-90),t90=S.trades.map(t=>({...t,c:calc(t)})).filter(t=>t.c.pl!=null&&dOf(t)>=de),disc=t90.length?t90.filter(t=>t.rules!=='n').length/t90.length:null;
  const resM=custo>0?(+c.reserva||0)/custo:null,resAlvo=custo*(+c.mesesReserva||0);
  const crit=[
    {t:`${c.mesesPos} meses positivos seguidos`,v:`${seq} de ${c.mesesPos}`,ok:seq>=+c.mesesPos,f:Math.min(1,seq/(+c.mesesPos||1)),falta:seq>=+c.mesesPos?'':`faltam ${c.mesesPos-seq} mês(es) positivos seguidos`},
    {t:'Média dos últimos 6 meses ≥ renda alvo',v:med(6)==null?'–':money(med(6))+' / '+money(alvo),ok:alvo>0&&fe.length>=6&&med(6)>=alvo,f:alvo>0&&med(6)!=null?Math.max(0,Math.min(1,med(6)/alvo)):0,falta:!alvo?'preencha a renda alvo':fe.length<6?'precisa de 6 meses de histórico':med(6)>=alvo?'':'faltam '+money(alvo-med(6))+' por mês'},
    {t:'Nenhum mês (6m) com perda maior que 1 mês de custo',v:pior6==null?'–':'pior: '+money(pior6),ok:custo>0&&pior6!=null&&fe.length>=6&&pior6>=-custo,f:pior6==null||!custo?0:pior6>=-custo?1:Math.max(0,1-(-pior6-custo)/custo),falta:!custo?'preencha o custo de vida':''},
    {t:`Reserva de ${c.mesesReserva} meses de custo`,v:resM==null?'–':resM.toFixed(1).replace('.',',')+' meses',ok:custo>0&&(+c.reserva||0)>=resAlvo,f:resAlvo>0?Math.min(1,(+c.reserva||0)/resAlvo):0,falta:!custo?'preencha o custo de vida':(+c.reserva||0)>=resAlvo?'':'faltam '+money(resAlvo-(+c.reserva||0))},
    {t:'Disciplina: regras seguidas em 90% dos trades (90 dias)',v:pct0(disc),ok:disc!=null&&disc>=.9&&t90.length>=20,f:disc||0,falta:t90.length<20?'precisa de pelo menos 20 trades nos últimos 90 dias':''},
  ];
  return {M,fe,seq,med3:med(3),med6:med(6),med12:med(12),alvo,custo,pior6,disc,resM,crit,ok:crit.filter(x=>x.ok).length,pos:fe.length?fe.filter(x=>x.liq>0).length/fe.length:null};
}
function crGraf(R){
  const L=R.M.slice(-12);if(!L.length)return '';
  const W=360,H=170,pl=4,pr=4,pt=14,pb=22,vals=L.map(x=>x.liq).concat(R.alvo?[R.alvo]:[],[0]);
  const hi=Math.max(...vals)*1.1||1,lo=Math.min(0,...vals)*1.1,Y=v=>pt+(hi-v)/(hi-lo)*(H-pt-pb),bw=(W-pl-pr)/L.length;
  let g=`<line x1="${pl}" x2="${W-pr}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--bd)"/>`;
  L.forEach((x,i)=>{const y=Y(Math.max(0,x.liq)),h=Math.abs(Y(x.liq)-Y(0));g+=`<rect x="${pl+i*bw+bw*.15}" y="${y}" width="${bw*.7}" height="${Math.max(1,h)}" rx="3" fill="${x.liq>=0?'var(--g)':'var(--r)'}" opacity="${x.atual?.5:1}"/><text x="${pl+i*bw+bw/2}" y="${H-6}" font-size="9" text-anchor="middle" fill="var(--mut)">${['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'][+x.k.slice(5)-1]}</text>`});
  if(R.alvo)g+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(R.alvo)}" y2="${Y(R.alvo)}" stroke="var(--ac)" stroke-dasharray="5 4"/><text x="${W-pr}" y="${Y(R.alvo)-4}" font-size="9.5" text-anchor="end" fill="var(--ac)" font-weight="700">renda alvo</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" role="img" aria-label="Resultado líquido por mês">${g}</svg>`;
}
function vCarreira(){
  const c=crCfg(),R=crCalc(c),f=(k,l)=>`<label>${l}<input type="number" step="any" inputmode="decimal" data-cr="${k}" value="${esc(c[k]||'')}"></label>`;
  const vazio=!(+c.renda>0||+c.custo>0);
  const ver=R.ok===5?['Os números permitem planejar a saída','var(--g)','Monte a data com calma: avise com antecedência, mantenha a reserva intocada e converse com um contador sobre impostos e INSS.']
    :R.ok>=3?['Perto, mas ainda não','var(--am)','Mantenha a CLT e feche os critérios que faltam. Sair antes da hora transforma o trading em obrigação de pagar contas, o que piora as decisões.']
    :['Ainda não: mantenha a CLT','var(--r)','Use o salário como base e construa histórico. O critério que mais pesa é a sequência de meses positivos com disciplina.'];
  return `<h1>Plano de transição</h1><p class="mut sm" style="margin-top:-4px">Quando dá para viver do trading com segurança. Usa os seus resultados (Brasil${c.fx?' + Forex convertido pelo dólar de hoje':''}) já descontando o IR estimado.</p>
${vazio?'<div class="warn">Preencha o salário, o custo de vida e a reserva no fim da página para o plano funcionar.</div>':''}
<div class="hero" style="margin-top:8px"><div class="top"><span class="chip" style="color:${ver[1]};border-color:${ver[1]}">${R.ok} de 5 critérios</span><span class="sm mut">prontidão</span></div><div class="big" style="color:${ver[1]}">${Math.round(R.ok/5*100)}%</div>${barra(R.ok/5,ver[1])}<div style="margin-top:10px;font-weight:650">${ver[0]}</div><div class="sm mut" style="margin-top:4px">${ver[2]}</div></div>
<h2>Critérios</h2>${R.crit.map(x=>`<div class="card" style="padding:10px 12px"><div style="display:flex;gap:8px;align-items:flex-start"><b class="${x.ok?'g':'r'}" style="flex:none">${x.ok?'✓':'✗'}</b><div style="flex:1"><div>${x.t}</div><b style="font-size:15px">${x.v}</b>${barra(x.f,x.ok?'var(--g)':'var(--ac)')}${x.falta?`<div class="sm mut" style="margin-top:4px">${x.falta}</div>`:''}</div></div></div>`).join('')}
<h2>Resultado por mês (líquido de IR)</h2>${R.M.length?`<div class="card">${crGraf(R)}</div>
<div class="kv">${KV('Média 3 meses',R.med3==null?'–':money(R.med3),cls(R.med3||0))}${KV('Média 6 meses',R.med6==null?'–':money(R.med6),cls(R.med6||0),R.alvo?'alvo '+money(R.alvo):'')}${KV('Média 12 meses',R.med12==null?'–':money(R.med12),cls(R.med12||0))}${KV('Meses positivos',pct0(R.pos),'',R.seq+' seguido(s) agora')}${KV('Média 6m × custo de vida',R.custo&&R.med6!=null?Math.round(R.med6/R.custo*100)+'%':'–')}${KV('Reserva',R.resM==null?'–':R.resM.toFixed(1).replace('.',',')+' meses','','de custo de vida')}</div>
<div class="card"><table><tr><th>Mês</th><th>Brasil</th>${c.fx?'<th>Forex</th>':''}<th>Líquido</th></tr>${R.M.slice(-12).reverse().map(x=>`<tr><td>${x.k.slice(5)}/${x.k.slice(2,4)}${x.atual?' <span class="sm mut">(em curso)</span>':''}</td><td class="${cls(x.b3)}">${money(x.b3)}</td>${c.fx?`<td class="${cls(x.fx)}">${money(x.fx)}</td>`:''}<td class="${cls(x.liq)}"><b>${money(x.liq)}</b>${x.ir?`<div class="sm mut">IR ${money(x.ir)}</div>`:''}</td></tr>`).join('')}</table></div>`:'<p class="mut">Sem trades fechados ainda.</p>'}
<h2>Seus números</h2><div class="card"><div class="g2">${f('renda','Salário líquido hoje (R$/mês)')}${f('custo','Custo de vida (R$/mês)')}</div><div class="g2">${f('alvo','Renda alvo do trading (R$/mês)')}${f('reserva','Reserva guardada (R$)')}</div><div class="g3">${f('mesesReserva','Reserva (meses)')}${f('mesesPos','Meses positivos seguidos')}${f('ir','IR estimado (%)')}</div>
<label class="ck"><input type="checkbox" data-cr="fx"${c.fx?' checked':''}><span>Somar o Forex (convertido em reais)</span></label>
<div class="sm mut" style="margin-top:6px">Se a renda alvo ficar vazia, o app usa o salário. O IR é estimado sobre o lucro de cada mês, compensando prejuízos anteriores. Não é recomendação financeira: é um termômetro dos seus próprios números.</div></div>`;
}
document.addEventListener('change',e=>{const i=e.target.closest('[data-cr]');if(!i)return;const c=crCfg();c[i.dataset.cr]=i.type==='checkbox'?(i.checked?1:0):(i.value===''?0:+i.value);(S.ax??={}).carreira=c;save();render()});

/* =====================================================================================
   5) IMPORTAÇÃO AUTOMÁTICA DO PROFIT — a ponte grava em "operacoes_profit" e o app puxa ao abrir
   ===================================================================================== */
const PFX={busy:0,err:'',ult:ls.get('diario-pf-ult')||'',n:0,off:0};
const pvDe=a=>{const s=String(a||'').toUpperCase();return /^WIN/.test(s)?0.2:/^IND/.test(s)?1:/^WDO/.test(s)?10:/^DOL/.test(s)?50:/^BIT/.test(s)?0.1:null};
const brLocal=x=>{if(!x)return '';const d=new Date(x);if(isNaN(d))return String(x).slice(0,16);return d.toLocaleString('sv-SE',{timeZone:'America/Sao_Paulo'}).slice(0,16).replace(' ','T')};
function pfTrade(o){
  const e=+o.preco_entrada,x=o.preco_saida==null?null:+o.preco_saida,q=+o.qtd||1,dir=o.lado==='V'?-1:1;
  let pv=+o.valor_ponto||pvDe(o.ativo);
  if(!pv&&o.resultado!=null&&x!=null&&x!==e)pv=Math.abs((+o.resultado+(+o.custos||0))/((x-e)*dir*q))||1;
  const dt=brLocal(o.abertura),dtx=x==null?'':brLocal(o.fechamento||o.abertura);
  const ativo=String(o.ativo||'').toUpperCase(),opc=!FUT.test(ativo)&&OPT.test(ativo);
  const t={id:/^imp[0-9a-z]+$/.test(o.id_externo)?o.id_externo:uid(),tipo:opc?'O':FUT.test(ativo)||dt.slice(0,10)===(dtx||dt).slice(0,10)?'D':'S',ativo,side:dir<0?'V':'C',qty:String(q),entry:String(e),exit:x==null?'':String(x),stop:o.stop!=null?String(+o.stop):'',target:'',pv:String(opc?1:pv||1),cost:o.custos!=null?String(o.custos):'',dt,dtx,setup:'',err:'Nenhum',rules:'',nota:'',ext:'profit:'+o.id_externo,orig:'profit',u:Date.now()};
  if(opc)try{Object.assign(t,optInfo(ativo,new Date(dt+':00')))}catch(e){}
  return t;
}
/* a mesma operação já registrada à mão: mesmo ativo, lado e quantidade, entrada até 10 min de diferença */
function pfJaTem(n){const t0=Date.parse(n.dt);return S.trades.some(t=>t.orig!=='profit'&&String(t.ativo||'').toUpperCase()===n.ativo&&t.side===n.side&&String(+t.qty)===String(+n.qty)&&Math.abs(Date.parse(t.dt)-t0)<=6e5)}
async function profitImporta(manual){
  if(!SESS||!cfg()||PFX.busy||(PFX.off&&!manual))return;PFX.busy=1;
  try{
    const L=await(await rq('/rest/v1/operacoes_profit?select=*&importado=eq.false&order=abertura.asc&limit=500')).json();
    const ja=new Set(S.trades.flatMap(t=>[t.ext,t.id]).filter(Boolean)),novos=[],ids=[];let manual=0;
    (L||[]).forEach(o=>{ids.push(o.id);const k='profit:'+o.id_externo;if(ja.has(k)||ja.has(o.id_externo)||!o.ativo||!isFinite(+o.preco_entrada))return;
      const t=pfTrade(o);if(pfJaTem(t)){manual++;return}ja.add(k);ja.add(t.id);novos.push(t)});
    if(manual&&!novos.length&&window.toast)toast(manual+' operação(ões) do Profit já estavam no diário.',3000);
    if(novos.length){S.trades.push(...novos);save();render();if(window.toast)toast(`${novos.length} operação(ões) importada(s) do Profit. Complete stop e setup na ficha.`,5000);setTimeout(()=>{try{limiteConfere()}catch(e){}},300)}
    else if(manual&&window.toast)toast('Nenhuma operação nova do Profit.',2500);
    if(ids.length)await rq('/rest/v1/operacoes_profit?id=in.('+ids.join(',')+')',{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({importado:true})});
    PFX.n+=novos.length;PFX.ult=new Date().toISOString();ls.set('diario-pf-ult',PFX.ult);PFX.err='';PFX.off=0;
  }catch(e){PFX.err=e.status===404||/operacoes_profit/.test(e.message||'')?'Falta criar a tabela: rode o SQL "profit-importacao.sql" no Supabase.':(e.message||String(e));if(e.status===404)PFX.off=1}
  PFX.busy=0;if(tab==='import')render();
}
(function(){
  const vi0=vImport;
  vImport=function(){
    const h=vi0();
    return `<div class="card" style="padding:14px"><div class="top"><b style="font-size:16px">${ic2('bolt')} Importação automática do Profit</b><span class="chip" style="color:${PFX.err?'var(--am)':'var(--g)'};border-color:${PFX.err?'var(--am)':'var(--g)'}">${PFX.err?'atenção':SESS?'ligada':'entre na conta'}</span></div>
<div class="sm mut" style="margin:6px 0">Exporte no Profit o Histórico de ordens (CSV) para a pasta Downloads do computador: a ponte envia as operações encerradas, com o stop, e o app traz para o diário sozinho (ao abrir e a cada 2 minutos). Depois é só completar setup e erros na ficha.</div>
${PFX.err?`<div class="warn">${esc(PFX.err)}</div>`:''}<div class="sm">${PFX.ult?'Última busca: '+new Date(PFX.ult).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Ainda não buscou.'}${PFX.n?' · '+PFX.n+' importada(s) nesta sessão':''}</div>
<button class="btn s" style="width:100%;margin-top:10px" data-pfnow="1"${SESS?'':' disabled'}>Buscar agora</button></div>`+h;
  };
  document.addEventListener('click',e=>{if(e.target.closest('[data-pfnow]'))profitImporta(true)});
  setTimeout(()=>profitImporta(false),6000);
  setInterval(()=>{if(document.visibilityState==='visible')profitImporta(false)},120000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>profitImporta(false),1500)});
})();

/* ---------- ganchos de tela ---------- */
(function(){
  const r0=render0;
  render0=function(){r0.apply(this,arguments);try{semAviso()}catch(e){console.error(e)}};
})();
/* ==== EXTRAS2:FIM ==== */
