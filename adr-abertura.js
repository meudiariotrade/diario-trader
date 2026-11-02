/* Abertura teórica na B3 quando a B3 está fechada (feriado) e Nova York abre.
   Ação local ≈ ADR × dólar, então a variação esperada é (1 + var. ADR) × (1 + var. dólar) − 1.
   O mesmo vale para o Ibovespa via EWZ. Base: último fechamento da B3. Estimativa, não cotação. */
(function(){
'use strict';
if(typeof adrHtml!=='function')return;
const MAPA={PBR:'PETR3','PBR.A':'PETR4','PBR-A':'PETR4',VALE:'VALE3',ITUB:'ITUB4',BBD:'BBDC4',BBDO:'BBDC3',ABEV:'ABEV3',BSBR:'SANB11',SBS:'SBSP3',ERJ:'EMBJ3',EMBJ:'EMBJ3',GGB:'GGBR4',SID:'CSNA3',CIG:'CMIG4',ELP:'CPLE6',UGP:'UGPA3',SUZ:'SUZB3',BAK:'BRKM5',TIMB:'TIMS3',VIV:'VIVT3',EBR:'ELET3','EBR.B':'ELET6','EBR-B':'ELET6',CSAN:'CSAN3',BDORY:'BBAS3',EWZ:'IBOV'};
const S={ts:0,busy:0,dados:null,err:''};
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=(v,d=2)=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const pc=v=>(v>0?'+':'')+nf(v,2)+'%',cor=v=>v>0.05?'g':v<-0.05?'r':'mut';
const diaBR=t=>new Date((t-3*3600)*1000).toISOString().slice(0,10);
const hojeBR=()=>new Date(Date.now()-3*3600e3).toISOString().slice(0,10);
async function velas(ativo){const r=await rq('/functions/v1/candles',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ativo,intervalo:'1d'}),signal:AbortSignal.timeout(20000)});const j=await r.json();return(j.candles||[]).filter(x=>x&&isFinite(x[4]))}
async function load(){
  if(Date.now()-S.ts<300000&&S.adrTs===AD.data?.ts)return;
  if(window.DIARIO_DEMO||typeof SESS==='undefined'||!SESS?.at)return;
  const itens=(AD.data&&AD.data.itens)||[];if(!itens.length)return;
  S.busy=1;S.err='';const adrTs=AD.data?.ts;
  try{
    const [ibov,dol]=await Promise.all([velas('IBOV'),velas('USDBRL')]);
    if(ibov.length<2||dol.length<2)throw new Error('Sem histórico do Ibovespa ou do dólar.');
    const ultB3=diaBR(ibov[ibov.length-1][0]);
    // dólar: variação do dia em relação ao fechamento do dia do último pregão da B3
    const dBase=[...dol].reverse().find(x=>diaBR(x[0])<=ultB3),dHoje=dol[dol.length-1];
    if(!dBase||!(dBase[4]>0)||!(dHoje[4]>0))throw new Error('Sem câmbio válido na data-base da B3.');
    const usd=diaBR(dHoje[0])>ultB3?(dHoje[4]/dBase[4]-1)*100:0;
    const linhas=[];
    const groups=itens.filter(row=>MAPA[String(row.s).toUpperCase()]);
    for(let i=0;i<groups.length;i+=3)await Promise.all(groups.slice(i,i+3).map(async row=>{
      const loc=MAPA[String(row.s).toUpperCase()];if(!loc)return;
      const v=window.TraderAdr.view(row),adr=v.regular&&v.regular.chp;if(typeof adr!=='number'||!Number.isFinite(adr))return;
      let base=null;
      if(loc==='IBOV')base=ibov[ibov.length-1][4];
      else{try{const c=await velas(loc);const u=[...c].reverse().find(x=>diaBR(x[0])<=ultB3);base=u?u[4]:null}catch{}}
      const varp=((1+adr/100)*(1+usd/100)-1)*100;
      linhas.push({adr:row.s,loc,adrp:adr,varp,base,teo:base?base*(1+varp/100):null});
    }));
    linhas.sort((a,b)=>itens.findIndex(x=>x.s===a.adr)-itens.findIndex(x=>x.s===b.adr));
    S.dados={ultB3,usd,dolar:dHoje[4],linhas,b3Fechada:ultB3<hojeBR()&&new Date().getUTCDay()%6!==0};S.ts=Date.now();S.dataTs=S.ts;S.adrTs=adrTs;
  }catch(e){S.err=String(e.message||e);S.ts=Date.now()}
  S.busy=0;if(typeof adrPaint==='function')adrPaint();
}
function carrega(){if(S.job)return S.job;S.job=load().finally(()=>{S.job=null});return S.job}
function abHtml(){
  setTimeout(carrega,0);
  const d=S.dados;
  if(!d)return`<div class="adr-ab card-sub"><b>Abertura teórica na B3</b><p class="sm mut">${S.busy?'Calculando…':S.err?h(S.err):'Calcula quando as ADRs carregarem (precisa estar logado).'}</p></div>`;
  const [,m,dd]=d.ultB3.split('-');
  const tab=d.linhas.map(l=>`<tr><td><b>${h(l.loc==='IBOV'?'Ibovespa':l.loc)}</b><small>${h(l.adr)} ${pc(l.adrp)}</small></td><td>${l.base?nf(l.base,l.loc==='IBOV'?0:2):'—'}</td><td class="${cor(l.varp)}"><b>${l.teo?pc(l.varp):'—'}</b></td><td>${l.teo?nf(l.teo,l.loc==='IBOV'?0:2):'—'}</td></tr>`).join('');
  return`<div class="adr-ab"><div class="adr-ab-top"><b>Abertura teórica na B3</b>${'<span class="adr-ab-tag">Estimativa · base '+dd+'/'+m+'</span>'}</div>
<p class="sm mut">Referência indicativa para o próximo pregão, sem prever o leilão de abertura: variação da ADR × variação do dólar (${pc(d.usd)}, R$ ${nf(d.dolar,4)}) sobre o fechamento da B3 em ${dd}/${m}.</p>
<div class="adr-ab-tab"><table><thead><tr><th>Ativo</th><th>Fech. B3</th><th>Var. esperada</th><th>Abertura teórica</th></tr></thead><tbody>${tab||'<tr><td colspan="4" class="mut">Nenhuma ADR da lista tem ação correspondente mapeada.</td></tr>'}</tbody></table></div>
<p class="sm mut">Conta: (1 + var. ADR) × (1 + var. dólar) − 1. Usa o pregão regular de Nova York; pós-mercado, notícias e o leilão de abertura podem mudar o preço. Ibovespa estimado pelo EWZ. Não é cotação.</p></div>`;
}

// Integra a estimativa no mesmo fluxo de desenho, imediatamente depois das ADRs.
function imageHeight(){return S.dados?.linhas.length?156+S.dados.linhas.slice(0,12).length*58:0}
function drawImage(ctx,width,y){
 const d=S.dados,L=d?.linhas.slice(0,12)||[];if(!L.length)return 0;
 const M=36,H=imageHeight(),top=y+48,boxH=40+L.length*58;
 ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillStyle='#e2e8f0';ctx.font='700 30px system-ui';ctx.fillText('Abertura teórica na B3',48,y+30);
 ctx.textAlign='right';ctx.fillStyle='#a8b5c5';ctx.font='22px system-ui';ctx.fillText('Estimativa · base '+d.ultB3.slice(8)+'/'+d.ultB3.slice(5,7),width-48,y+30);
 ctx.fillStyle='#0d1b28';ctx.strokeStyle='#24313e';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(M,top,width-2*M,boxH,18);ctx.fill();ctx.stroke();
 const cols=[60,560,760,width-60];ctx.font='20px system-ui';ctx.fillStyle='#a8b5c5';
 ['Ativo / ADR','Fech. B3','Variação est.','Preço teórico'].forEach((t,i)=>{ctx.textAlign=i?'right':'left';ctx.fillText(t,cols[i],top+28)});
 L.forEach((l,k)=>{const yy=top+66+k*58;
  if(k){ctx.strokeStyle='#24313e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(56,yy-34);ctx.lineTo(width-56,yy-34);ctx.stroke()}
  ctx.textAlign='left';ctx.font='700 26px system-ui';ctx.fillStyle='#e2e8f0';ctx.fillText(l.loc==='IBOV'?'Ibovespa':l.loc,60,yy);ctx.font='18px system-ui';ctx.fillStyle='#a8b5c5';ctx.fillText(l.adr+' '+pc(l.adrp),60,yy+20);
  ctx.textAlign='right';ctx.font='24px system-ui';ctx.fillStyle='#e2e8f0';ctx.fillText(l.base?nf(l.base,l.loc==='IBOV'?0:2):'—',cols[1],yy);
  ctx.font='700 26px system-ui';ctx.fillStyle=l.teo?(l.varp>0.05?'#22c55e':l.varp<-0.05?'#f87171':'#a8b5c5'):'#a8b5c5';ctx.fillText(l.teo?pc(l.varp):'—',cols[2],yy);
  ctx.fillStyle='#e2e8f0';ctx.fillText(l.teo?nf(l.teo,l.loc==='IBOV'?0:2):'—',cols[3],yy);
 });
 ctx.textAlign='left';ctx.fillStyle='#a8b5c5';ctx.font='20px system-ui';ctx.fillText('ADR regular × dólar ('+pc(d.usd)+') · referência, não é preço de leilão.',48,top+boxH+30,width-96);
 ctx.fillText((S.err?'Falha na atualização · cópia anterior. ':'Consulta: ')+new Date(S.dataTs).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})+' · pós-mercado não incluído.',48,top+boxH+56,width-96);
 return H;
}
window.TraderPreOpen={height:imageHeight,draw:drawImage,prepare:carrega};
if(typeof imgDados==='function'){const original=imgDados;imgDados=async function(){await original.apply(this,arguments);S.ts=0;await carrega()}}
setTimeout(carrega,6000);setInterval(()=>{if(!document.hidden)carrega()},300000);
const o=adrHtml;adrHtml=function(){return o.apply(this,arguments)+abHtml()};
const st=document.createElement('style');st.textContent=`.adr-ab{margin-top:14px;padding-top:12px;border-top:1px solid rgba(127,127,127,.2)}.adr-ab-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.adr-ab-tag{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(250,204,21,.18);color:#b45309}.adr-ab-tab{overflow-x:auto;margin:8px 0}.adr-ab table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}.adr-ab th{text-align:left;font-size:11px;opacity:.65;padding:6px 4px;border-bottom:1px solid rgba(127,127,127,.25)}.adr-ab td{padding:7px 4px;border-bottom:1px solid rgba(127,127,127,.12)}.adr-ab td small{display:block;opacity:.6;font-size:11px}.adr-ab td:nth-child(n+2),.adr-ab th:nth-child(n+2){text-align:right}`;document.head.appendChild(st);
})();
