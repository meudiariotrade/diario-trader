/* v684 · Telas Markowitz, Juro Real e Backtester — apenas Laboratório. */
;(function(){
'use strict';
const L=window.EconomiaLab,S=L.state,U=L.quant,Q=U.Q,E=L.esc,F=L.f,C=L.card,K=L.kpi,N=L.note;
const pct=(x,n=2)=>Number.isFinite(x)?F(x,n)+'%':'—';
const line=(name,value)=>'<div class="eco-qline"><span>'+E(name)+'</span><b>'+value+'</b></div>';
function chart(lines,desc,points=[]){
 const raw=lines.flatMap(a=>a.map(p=>p[1])).filter(Number.isFinite);
 if(!raw.length)return N('Sem pontos válidos para o gráfico.');
 let lo=Math.min(...raw),hi=Math.max(...raw);if(lo===hi){lo-=1;hi+=1;}
 const xv=lines.flatMap(x=>x.map(p=>p[0])),x0=Math.min(...xv),x1=Math.max(...xv),colors=['#D4A017','#10B981','#709BC2','#EF4444'];
 const plot=p=>[48+575*(p[0]-x0)/(x1-x0||1),178-145*(p[1]-lo)/(hi-lo)];
 const shape=lines.map((series,i)=>'<polyline fill="none" stroke="'+colors[i%4]+'" stroke-width="2.4" points="'+series.map(p=>plot(p).map(z=>z.toFixed(1)).join(',')).join(' ')+'"/>').join('');
 const pins=points.map((p,i)=>{const v=plot(p.coords);return '<circle cx="'+v[0].toFixed(1)+'" cy="'+v[1].toFixed(1)+'" r="5" fill="'+colors[(i+1)%4]+'" stroke="#0A0C10"><title>'+E(p.name)+'</title></circle>';}).join('');
 return '<svg class="eco-plot eco-q-plot" viewBox="0 0 655 222" role="img" aria-label="'+E(desc)+'"><path d="M48 28V178H623" stroke="#657080" fill="none"/><text x="4" y="32" fill="#abb8c8" font-size="11">'+E(F(hi,2))+'</text><text x="4" y="177" fill="#abb8c8" font-size="11">'+E(F(lo,2))+'</text><text x="48" y="205" fill="#abb8c8" font-size="11">'+E(F(x0,1))+'</text><text x="568" y="205" fill="#abb8c8" font-size="11">'+E(F(x1,1))+'</text>'+shape+pins+'</svg>';
}
const refresh='<button type="button" class="eco-action" data-eco-btn="quantRefresh"'+(Q.busy?' disabled':'')+'>'+(Q.busy?'Consultando…':'Atualizar históricos')+'</button>';
const choice=(name,items,values)=>'<select data-quant-field="'+name+'">'+items.map((value,i)=>'<option value="'+E(value)+'"'+(Q[name]===value?' selected':'')+'>'+E(values?.[i]||value)+'</option>').join('')+'</select>';
L.views.port=()=>{
 const m=U.markowitz(U.prices());
 let html='<div class="eco-controls">'+refresh+'</div>';
 html+=N('Históricos reais do Candles já integrado; CDI diário BCB/SGS 12 convertido em índice acumulado. Pesos ajustáveis: simulação (não acessa seus lotes).');
 if(Q.error)html+=N('<b>Fonte:</b> '+E(Q.error));
 html+='<div class="eco-qweights">'+U.A.map((s,i)=>'<label>'+E(s)+' · peso %<input type="number" data-quant-weight="'+i+'" min="0" max="100" step="1" value="'+E(Q.pesos[i])+'"></label>').join('')+'</div>';
 if(!m)html+=N('Aguardando seis séries com ao menos 30 retornos em pregões coincidentes. Sem dados não há fronteira nem Sharpe calculados.');
 else{
  html+='<div class="eco-grid-stats">'+K('Retorno anual histórico',pct(m.chosen.ret*100))+K('Volatilidade anual',pct(m.chosen.vol*100))+
   K('Sharpe anualizado',F(m.chosen.sharpe,3))+K('Amostra',String(m.p.n)+' retornos')+'</div>';
  html+=chart([m.efficient.map(x=>[x.vol*100,x.ret*100])],'Fronteira eficiente · eixo X risco anual %; eixo Y retorno anual %',[
   {name:'Mínima variância',coords:[m.min.vol*100,m.min.ret*100]},
   {name:'Máximo Sharpe',coords:[m.maximum.vol*100,m.maximum.ret*100]},
   {name:'Simulada',coords:[m.chosen.vol*100,m.chosen.ret*100]}]);
  html+=line('Mínima variância',pct(m.min.vol*100)+' risco')+line('Máximo Sharpe',F(m.maximum.sharpe,3))+
   '<div class="eco-qscroll"><table class="eco-qtable"><caption>Matriz de covariância anualizada × 10.000</caption><thead><tr><th>Ativo</th>'+U.A.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+
   U.A.map((x,i)=>'<tr><th>'+x+'</th>'+m.p.cov[i].map(v=>'<td>'+F(v*10000,2)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 }
 return C('Markowitz · Fronteira Eficiente & Sharpe',html)+
 C('Modelo e premissas',N('E[Rp] = wᵀμ; Var(Rp) = wᵀΣw; Sharpe = (retorno anual médio − CDI anual médio) / volatilidade anual. Retornos diários simples × 252; covariância amostral × 252. Otimização numérica aproximada, somente posições compradas, sem alavancagem. Séries históricas não são previsão.'));
};
function diReference(years){
 try{
  if(typeof M606==='undefined'||!Array.isArray(M606.v?.di)||!(years>0))return null;
  const d=M606.v.di.filter(x=>+x.anos>0&&+x.taxa>0).sort((a,b)=>Math.abs(a.anos-years)-Math.abs(b.anos-years))[0];
  if(d&&Math.abs(d.anos-years)<=1.5)return {rate:+d.taxa,code:d.k||'DI'};
 }catch{}
 return null;
}
L.views.real=()=>{
 const titles=Q.titulos.filter(x=>x.type==='real').sort((a,b)=>a.maturity.localeCompare(b.maturity));
 const picked=titles.find(t=>t.name===Q.titulo)||titles[0];
 const years=picked?(Date.parse(picked.maturity)-Date.now())/(365.25*864e5):null,di=diReference(years);
 const pre=U.num(Q.ratePre)??di?.rate??null,real=U.num(Q.rateReal)??picked?.rate??null;
 const implicit=pre!==null&&real!==null?U.inflation(pre,real):null;
 let html='<div class="eco-controls"><button type="button" class="eco-action" data-eco-btn="quantTreasury"'+(Q.tdBusy?' disabled':'')+'>'+(Q.tdBusy?'Consultando…':'Consultar taxas Tesouro Direto')+'</button>'+refresh+'</div>';
 if(Q.tdError)html+=N(E(Q.tdError));
 if(titles.length)html+='<label>NTN-B · Tesouro IPCA+<select data-quant-field="titulo">'+titles.map(t=>'<option value="'+E(t.name)+'"'+(picked===t?' selected':'')+'>'+E(t.name)+' · '+F(t.rate)+'% a.a.</option>').join('')+'</select></label>';
 html+='<div class="eco-controls"><label>DI pré % a.a. (manual, opcional)<input data-quant-field="ratePre" type="number" step=".01" value="'+E(Q.ratePre)+'" placeholder="Informe se DI não carregou"></label>'+
 '<label>NTN-B % a.a. (manual, opcional)<input data-quant-field="rateReal" type="number" step=".01" value="'+E(Q.rateReal)+'" placeholder="Informe se Tesouro não carregou"></label></div>';
 html+='<div class="eco-grid-stats">'+K('DI pré',pre===null?'Indisponível':pct(pre))+
  K('NTN-B real',real===null?'Indisponível':pct(real))+K('Breakeven aprox.',implicit?pct(implicit.approx):'Sem par válido')+
  K('Fisher exato',implicit?pct(implicit.exact):'Sem par válido')+'</div>';
 html+=N('Breakeven ≈ Taxa pré DI − juro real NTN-B. Forma equivalente: [(1 + DI)/(1 + real) − 1] × 100. Comparação só faz sentido com prazos semelhantes; inflação implícita inclui prêmios de risco e liquidez.');
 html+=N('Fonte direta: Tesouro Direto (taxas de investimento)'+(Q.tdTime?' · '+E(new Date(Q.tdTime).toLocaleString('pt-BR')):'')+'. DI: curva Mesa Macro se vencimento compatível'+(di?' · '+E(di.code):'')+'. Campos manuais sempre identificados como tal.');
 const usd=U.usdIndex(U.prices()),last=usd.at(-1);
 let other='<div class="eco-controls">'+refresh+'</div>';
 if(last)other+='<div class="eco-grid-stats">'+K('IBOV / USD/BRL',F(last.p,2))+K('Data',E(last.d))+K('Observações',String(usd.length))+'</div>'+
 chart([usd.map((x,i)=>[i,x.p])],'Ibovespa dolarizado, IBOV dividido pelo USD/BRL em datas coincidentes');
 else other+=N('IBOV e USD/BRL precisam ter fechamentos diários coincidentes. Carregue as séries para calcular.');
 other+=N('Índice relativo em pontos por dólar: IBOV / USD/BRL; não representa cotação de ativo negociável.');
 return C('Juro real NTN-B & inflação implícita',html)+C('Ibovespa dolarizado',other);
};
L.views.back=()=>{
 const result=U.backtest(Q.candles[Q.ativo],Q);
 let html='<div class="eco-controls"><label>Ativo'+choice('ativo',['PETR4','VALE3','IAU','BTC','IVVB11','IBOV'])+'</label>'+
 '<label>Regra'+choice('regra',['mm','rsi','break'],['Cruzamento MM20 / MM50','RSI 14 · retorno dos extremos','Rompimento máxima/mínima anterior'])+'</label>'+
 '<label>Direção'+choice('lado',['ambos','long','short'],['Compras e vendas','Só compras','Só vendas'])+'</label></div>'+
 '<div class="eco-controls"><label>Stop<input type="number" data-quant-field="stop" min=".01" max="100000" step=".1" value="'+E(Q.stop)+'"></label>'+
 '<label>Alvo<input type="number" data-quant-field="alvo" min=".01" max="100000" step=".1" value="'+E(Q.alvo)+'"></label>'+
 '<label>Unidade'+choice('unidade',['%','pts'],['Percentual','Pontos do ativo'])+'</label>'+refresh+'</div>';
 if(Q.error)html+=N(E(Q.error));
 if(!result)html+=N('Para testar, carregue ao menos 75 candles diários OHLC reais do ativo. Não são criadas operações fictícias.');
 else{
  html+='<div class="eco-grid-stats">'+K('Taxa de acerto',pct(result.win,1))+K('Fator de lucro',result.pf===Infinity?'Sem perdas':F(result.pf,2))+
   K('Drawdown máximo',pct(result.drawdown))+K('Trades',String(result.trades.length))+'</div>';
  html+=chart([result.curve.map((v,i)=>[i,v.v])],'Curva de capital da estratégia · valores em unidades de conta');
  html+=line('Capital inicial','10.000 unidades')+line('Capital final',F(result.capital,2)+' unidades');
  html+='<div class="eco-qscroll"><table class="eco-qtable"><caption>Últimas operações simuladas</caption><thead><tr><th>Entrada</th><th>Saída</th><th>Direção</th><th>Resultado</th></tr></thead><tbody>'+
   result.trades.slice(-12).reverse().map(t=>'<tr><td>'+E(t.start)+'</td><td>'+E(t.end)+'</td><td>'+(t.side>0?'Compra':'Venda')+'</td><td>'+pct(t.ret*100)+'</td></tr>').join('')+'</tbody></table></div>';
 }
 html+=N('Sem look-ahead: sinal no fechamento, entrada na abertura seguinte. Usa máximo/mínimo de cada candle para stop e alvo; se ambos ocorrem, considera stop primeiro; gaps adversos usam a abertura. Não contempla corretagem, impostos, spread, slippage ou financiamento de short; capital nocional de 10.000 unidades, exposição de 100%.');
 return C('Backtester rápido · regras técnicas',html);
};
L.events.quantRefresh=()=>U.load(true);
L.events.quantTreasury=()=>U.tesouro();
L.events.enter=L.events.enter||{};
L.events.enter.port=()=>{if(!Q.ts)U.load();};
L.events.enter.back=()=>{if(!Q.ts)U.load();};
L.events.enter.real=()=>{if(!Q.ts)U.load();if(!Q.tdTime&&!Q.tdError)U.tesouro();};
document.addEventListener('input',event=>{
 if(typeof tab==='undefined'||tab!=='estudos'||typeof ESV==='undefined'||ESV!=='eco')return;
 const e=event.target;
 if(e.matches('[data-quant-weight]')){const i=+e.dataset.quantWeight;const n=+e.value;if(i>=0&&i<6&&Number.isFinite(n))Q.pesos[i]=Math.max(0,Math.min(100,n));}
 if(e.matches('input[data-quant-field]')&&Object.hasOwn(Q,e.dataset.quantField))Q[e.dataset.quantField]=e.value;
},true);
document.addEventListener('change',event=>{
 if(typeof tab==='undefined'||tab!=='estudos'||typeof ESV==='undefined'||ESV!=='eco'||!['port','real','back'].includes(S.tool))return;
 const e=event.target;
 if(e.matches('[data-quant-weight]')){L.paint();return;}
 if(e.matches('[data-quant-field]')&&Object.hasOwn(Q,e.dataset.quantField)){
  Q[e.dataset.quantField]=e.value;L.paint();
 }
},true);
})();
