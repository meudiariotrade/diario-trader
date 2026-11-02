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
async function carrega(){
  if(S.busy||Date.now()-S.ts<300000)return;
  if(window.DIARIO_DEMO||typeof SESS==='undefined'||!SESS?.at)return;
  const itens=(AD.data&&AD.data.itens)||[];if(!itens.length)return;
  S.busy=1;S.err='';
  try{
    const ibov=await velas('IBOV'),dol=await velas('USDBRL');
    if(ibov.length<2||dol.length<2)throw new Error('Sem histórico do Ibovespa ou do dólar.');
    const ultB3=diaBR(ibov[ibov.length-1][0]);
    // dólar: variação do dia em relação ao fechamento do dia do último pregão da B3
    const dBase=[...dol].reverse().find(x=>diaBR(x[0])<=ultB3),dHoje=dol[dol.length-1];
    const usd=dBase&&diaBR(dHoje[0])>ultB3?(dHoje[4]/dBase[4]-1)*100:0;
    const linhas=[];
    for(const row of itens){
      const loc=MAPA[String(row.s).toUpperCase()];if(!loc)continue;
      const v=window.TraderAdr.view(row),adr=v.regular&&v.regular.chp;if(!isFinite(adr))continue;
      let base=null;
      if(loc==='IBOV')base=ibov[ibov.length-1][4];
      else{try{const c=await velas(loc);const u=[...c].reverse().find(x=>diaBR(x[0])<=ultB3);base=u?u[4]:null}catch{}}
      const varp=((1+adr/100)*(1+usd/100)-1)*100;
      linhas.push({adr:row.s,loc,adrp:adr,varp,base,teo:base?base*(1+varp/100):null});
    }
    S.dados={ultB3,usd,dolar:dHoje[4],linhas,b3Fechada:ultB3<hojeBR()&&new Date().getUTCDay()%6!==0};S.ts=Date.now();
  }catch(e){S.err=String(e.message||e);S.ts=Date.now()}
  S.busy=0;if(typeof adrPaint==='function')adrPaint();
}
function abHtml(){
  setTimeout(carrega,0);
  const d=S.dados;
  if(!d)return`<div class="adr-ab card-sub"><b>Abertura teórica na B3</b><p class="sm mut">${S.busy?'Calculando…':S.err?h(S.err):'Calcula quando as ADRs carregarem (precisa estar logado).'}</p></div>`;
  const [,m,dd]=d.ultB3.split('-');
  const tab=d.linhas.map(l=>`<tr><td><b>${h(l.loc==='IBOV'?'Ibovespa':l.loc)}</b><small>${h(l.adr)} ${pc(l.adrp)}</small></td><td>${l.base?nf(l.base,l.loc==='IBOV'?0:2):'—'}</td><td class="${cor(l.varp)}"><b>${pc(l.varp)}</b></td><td>${l.teo?nf(l.teo,l.loc==='IBOV'?0:2):'—'}</td></tr>`).join('');
  return`<div class="adr-ab"><div class="adr-ab-top"><b>Abertura teórica na B3</b>${d.b3Fechada?'<span class="adr-ab-tag">B3 fechada hoje</span>':''}</div>
<p class="sm mut">${d.b3Fechada?'Nova York operou com a B3 fechada. Estimativa da abertura do próximo pregão:':'A B3 operou hoje, então a conta abaixo só faz sentido em dias de feriado aqui. Referência:'} variação da ADR × variação do dólar (${pc(d.usd)}, R$ ${nf(d.dolar,4)}) sobre o fechamento da B3 em ${dd}/${m}.</p>
<div class="adr-ab-tab"><table><thead><tr><th>Ativo</th><th>Fech. B3</th><th>Var. esperada</th><th>Abertura teórica</th></tr></thead><tbody>${tab||'<tr><td colspan="4" class="mut">Nenhuma ADR da lista tem ação correspondente mapeada.</td></tr>'}</tbody></table></div>
<p class="sm mut">Conta: (1 + var. ADR) × (1 + var. dólar) − 1. Usa o pregão regular de Nova York; pós-mercado, notícias e o leilão de abertura podem mudar o preço. Ibovespa estimado pelo EWZ. Não é cotação.</p></div>`;
}
const o=adrHtml;adrHtml=function(){return o.apply(this,arguments)+abHtml()};
const st=document.createElement('style');st.textContent=`.adr-ab{margin-top:14px;padding-top:12px;border-top:1px solid rgba(127,127,127,.2)}.adr-ab-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.adr-ab-tag{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:rgba(250,204,21,.18);color:#b45309}.adr-ab-tab{overflow-x:auto;margin:8px 0}.adr-ab table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}.adr-ab th{text-align:left;font-size:11px;opacity:.65;padding:6px 4px;border-bottom:1px solid rgba(127,127,127,.25)}.adr-ab td{padding:7px 4px;border-bottom:1px solid rgba(127,127,127,.12)}.adr-ab td small{display:block;opacity:.6;font-size:11px}.adr-ab td:nth-child(n+2),.adr-ab th:nth-child(n+2){text-align:right}`;document.head.appendChild(st);
})();
