/* Gráficos interativos locais: escala robusta, zoom real, deslocamento e tooltip no iPhone. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioScreenersGrafico=api;
})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const PAIRS={
 BR:[['roe-payout','ROE × Payout','roe','payout'],['roe-pvp','ROE × P/VP','roe','pvp'],
     ['roic-ev','ROIC × EV/EBITDA','roic','ev_ebitda'],['dy-debt','DY × Dívida/EBITDA','dy','div_liq_ebitda'],
     ['roe-momentum','ROE × Momentum','roe','momentum']],
 US:[['roic-pe','ROIC × Forward P/E','roic','forward_pe'],['roic-momentum','ROIC × Momentum','roic','momentum'],
     ['yield-momentum','Total Yield × Momentum','yield','momentum'],['rule-momentum','Rule of 40 × Momentum','rule40','momentum'],
     ['roe-peg','ROE × PEG','roe','peg_ratio']]
 };
 const E=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const number=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:1});
 const valid=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
 const metricNames={roe:'ROE',payout:'Payout',pvp:'P/VP',roic:'ROIC',ev_ebitda:'EV/EBITDA',dy:'DY',div_liq_ebitda:'Dívida/EBITDA',momentum:'Momentum 12-1',forward_pe:'Forward P/E',yield:'Total Yield',rule40:'Rule of 40',peg_ratio:'PEG'};
 const quant=(vals,q)=>{if(!vals.length)return 0;const p=(vals.length-1)*q,i=Math.floor(p);return vals[i]+(vals[Math.min(i+1,vals.length-1)]-vals[i])*(p-i)};
 function prepare(m,s){
  const market=m==='us'?'US':'BR',src=Array.isArray(s.data?.scatter)?s.data.scatter:[],pairs=PAIRS[market];
  const available=pairs.map(pair=>({pair,count:src.filter(p=>valid(p[pair[2]])&&valid(p[pair[3]])).length}));
  if(!pairs.some(x=>x[0]===s.chart))s.chart=available.slice().sort((a,b)=>b.count-a.count)[0]?.pair[0]||pairs[0][0];
  const pair=pairs.find(x=>x[0]===s.chart);
  const pts=src.filter(p=>valid(p[pair[2]])&&valid(p[pair[3]]));
  const coords=(key)=>pts.map(p=>Number(p[key])).sort((a,b)=>a-b);
  const x=coords(pair[2]),y=coords(pair[3]);
  function range(v,pan){if(!v.length)return [0,1];
   // Um único outlier não achata o conjunto. Valores extremos ficam marcados na borda.
   const low=v.length>=20?quant(v,.05):v[0],high=v.length>=20?quant(v,.95):v[v.length-1];
   const center=(low+high)/2,span=Math.max(1e-6,high-low)*1.10/Math.max(1,Number(s.zoom)||1);
   const mid=center+(Number(pan)||0)*span;
   return [mid-span/2,mid+span/2];
  }
  const [xmin,xmax]=range(x,s.panX),[ymin,ymax]=range(y,s.panY);
  return {market,pair,pairs,available,pts,xmin,xmax,ymin,ymax,medx:quant(x,.5),medy:quant(y,.5)};
 }
 function plot(m,s,own){
  const p=prepare(m,s),zoom=Math.max(1,Number(s.zoom)||1),sx=v=>55+(Number(v)-p.xmin)/(p.xmax-p.xmin)*600,
    sy=v=>266-(Number(v)-p.ymin)/(p.ymax-p.ymin)*230;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dot=p.pts.slice(0,300).map((row,i)=>{
   const rawX=sx(row[p.pair[2]]),rawY=sy(row[p.pair[3]]),atEdge=rawX<55||rawX>655||rawY<36||rawY>266;
   const onPortfolio=!!row.owned||!!own(row),focus=s.focus===row.ticker;
   const jitter=((i*17)%9-4)*.55;
   const x=clamp(rawX,55,655)+jitter,y=clamp(rawY,36,266)+jitter;
   return '<circle data-scr-point="'+E(row.ticker)+'" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(focus?7:onPortfolio?5.5:3.3)+'" fill="'+(focus?'#D4A017':onPortfolio?'#D4A017':'#4b85a9')+
   '" fill-opacity="'+(atEdge?.45:focus?1:.78)+'" stroke="'+(focus?'#ffffff':onPortfolio?'#fae2a0':'none')+'" stroke-width="'+(focus?2:1.3)+'" role="button" tabindex="0" aria-label="'+E(row.ticker)+'; '+E(metricNames[p.pair[2]])+' '+number(row[p.pair[2]])+'; '+E(metricNames[p.pair[3]])+' '+number(row[p.pair[3]])+'">'+
   '<title>'+E(row.ticker)+' · '+number(row[p.pair[2]])+' / '+number(row[p.pair[3]])+(onPortfolio?' · CARTEIRA':'')+(atEdge?' · valor fora do recorte':'')+'</title></circle>';
  }).join('');
  const extremes=p.pts.filter(row=>sx(row[p.pair[2]])<55||sx(row[p.pair[2]])>655||sy(row[p.pair[3]])<36||sy(row[p.pair[3]])>266).length;
  const selected=p.pts.find(x=>x.ticker===s.focus)||null;
  const opts=p.available.map(({pair,count})=>'<option value="'+E(pair[0])+'"'+(s.chart===pair[0]?' selected':'')+'>'+E(pair[1])+' ('+count+')</option>').join('');
  const scaleText=number(p.xmin)+' a '+number(p.xmax);
  const mx=clamp(sx(p.medx),55,655),my=clamp(sy(p.medy),36,266);
  return '<section class="scr-panel scr-chart-panel"><div class="scr-head"><h3>Dispersão quantitativa</h3><span class="scr-hint">Escolha métricas, arraste ou use os controles</span></div>'+
  '<div class="scr-chart-controls"><label>Comparar eixos<select data-scr-chart aria-label="Escolher indicadores do gráfico">'+opts+'</select></label>'+
  '<div class="scr-chart-nav" aria-label="Zoom e deslocamento">'+
  '<button type="button" data-scr-zoom="out" aria-label="Reduzir zoom" title="Reduzir zoom">−</button>'+
  '<strong>'+number(zoom)+'×</strong>'+
  '<button type="button" data-scr-zoom="in" aria-label="Aumentar zoom" title="Aumentar zoom">+</button>'+
  '<button type="button" data-scr-pan="left" aria-label="Deslocar gráfico à esquerda">←</button>'+
  '<button type="button" data-scr-pan="right" aria-label="Deslocar gráfico à direita">→</button>'+
  '<button type="button" data-scr-reset="1" title="Redefinir gráfico">Redefinir</button></div></div>'+
  (p.pts.length?'<svg class="scr-svg" viewBox="0 0 710 312" role="img" aria-label="Gráfico '+E(p.pair[1])+', '+p.pts.length+' ações com dados">'+
  '<path d="M55 36V266H655" stroke="#68707a" stroke-width="1" fill="none"/>'+
  '<line x1="'+mx.toFixed(1)+'" x2="'+mx.toFixed(1)+'" y1="36" y2="266" stroke="#b6a06a" stroke-dasharray="4 5" stroke-width="1"/>'+
  '<line x1="55" x2="655" y1="'+my.toFixed(1)+'" y2="'+my.toFixed(1)+'" stroke="#b6a06a" stroke-dasharray="4 5" stroke-width="1"/>'+
  dot+
  '<text x="55" y="292" fill="#bcc0cc" font-size="11">'+E(metricNames[p.pair[2]])+': '+scaleText+'</text>'+
  '<text x="655" y="22" fill="#bcc0cc" text-anchor="end" font-size="11">'+E(metricNames[p.pair[3]])+': '+number(p.ymin)+' a '+number(p.ymax)+'</text></svg>':
  '<p class="scr-empty">Não há empresas com os dois indicadores selecionados. Experimente outra combinação acima.</p>')+
  (selected?'<div class="scr-spotlight"><b>'+E(selected.ticker)+'</b><span>'+E(metricNames[p.pair[2]])+' '+number(selected[p.pair[2]])+' · '+E(metricNames[p.pair[3]])+' '+number(selected[p.pair[3]])+'</span><button type="button" data-scr-analyze="'+E(selected.ticker)+'">Analisar ativo</button></div>':'')+
  '<p class="scr-hint">'+p.pts.length+' ativos com ambos os indicadores. '+(extremes?extremes+' pontos extremos aproximados às bordas; valores originais preservados no toque. ':'')+'Linhas pontilhadas = medianas da amostra; pontos dourados = sua Carteira. Escala ajustada para evitar compressão por valores extremos.</p></section>';
 }
 return Object.freeze({plot,prepare,pairs:PAIRS,metricNames});
});
