/* Pesquisa da carteira integrada à posição e à IA de Carteiras. */
(() => {
 'use strict';const R=window.CarteiraResearch,safe=v=>esc(String(v??''));
 const money=(v,unit='BRL',digits=2)=>v==null?'Não disponível':Number(v).toLocaleString('pt-BR',{style:'currency',currency:unit,minimumFractionDigits:digits,maximumFractionDigits:digits});
 const today=()=>loc().slice(0,10);
 function context(){let performance=null,raw=null;try{performance=perfCalc();raw=window.TRM?.trGet('histp',pfHistArgs())?.v||window.PF.histUlt}catch{}const rows=(S.cart?.lanc||[]),snapshot=pfCalc();return {snapshot,ledger:rows,income:R.income(rows,today()),wealth:R.wealth(performance,rows,raw),performance,raw,asOf:today()}}
 function svgLine(points,label){
   if(points.length<2)return '<p class="cr-empty">Sem observações suficientes para o gráfico.</p>';
   const W=680,H=240,M=48,values=points.map(p=>p.value),min=Math.min(...values),max=Math.max(...values),span=max-min||Math.max(Math.abs(max)*.05,1),X=i=>M+(W-M-14)*i/(points.length-1),Y=v=>H-35-(v-min)/span*(H-65),path=points.map((p,i)=>(i?'L':'M')+X(i).toFixed(2)+' '+Y(p.value).toFixed(2)).join(' ');
   return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${safe(label)}"><title>${safe(label)}</title>${[0,.5,1].map(f=>{const value=min+span*f,y=Y(value);return `<line x1="${M}" x2="${W-14}" y1="${y}" y2="${y}" stroke="currentColor" opacity=".12"/><text x="${M-6}" y="${y+4}" text-anchor="end" fill="currentColor" font-size="10">${safe((value/1000).toFixed(1))}k</text>`}).join('')}<path d="${path}" fill="none" stroke="#22b779" stroke-width="2.5"/>${points.map((p,i)=>`<circle cx="${X(i)}" cy="${Y(p.value)}" r="3" fill="#22b779"><title>${safe(p.date)}: ${safe(money(p.value))}</title></circle>`).join('')}<text x="${M}" y="${H-8}" fill="currentColor" font-size="10">${safe(points[0].date)}</text><text x="${W-14}" y="${H-8}" text-anchor="end" fill="currentColor" font-size="10">${safe(points.at(-1).date)}</text></svg>`;
 }
 function bars(points,unit='BRL'){
   if(!points.length)return '<p class="cr-empty">Nenhum provento lançado neste período. Não foram estimados recebimentos.</p>';
   const max=Math.max(...points.map(p=>Math.abs(p.value)),1);return `<div class="cr-bars">${points.map(p=>`<div><span>${safe(p.date)}</span><i><b style="width:${Math.max(0,Math.abs(p.value)/max*100)}%"></b></i><strong>${safe(money(p.value,unit))}</strong></div>`).join('')}</div>`;
 }
 function charts(data){
   const units=['BRL','USD'].filter(unit=>data.income.events.some(e=>e.unit===unit));
   return `<section class="cr-section"><h3>Evolução do valor dos ativos</h3>${data.wealth.points.length?svgLine(data.wealth.points,'Valor dos ativos em BRL, sem caixa'):`<p class="cr-empty">${safe(data.wealth.reason)}</p>`}<p class="cr-note">Valor dos ativos, sem caixa. Compras, vendas e variação cambial alteram o patrimônio; este gráfico não é rentabilidade. Referência: ${safe(data.wealth.points.at(-1)?.date||'não disponível')}.</p></section><section class="cr-section"><h3>Proventos recebidos por mês</h3>${units.length?units.map(unit=>`<h4>${unit} · lançamentos registrados</h4>${bars(Object.entries(data.income.months).filter(([,v])=>v[unit]!==0).slice(-24).map(([date,v])=>({date,value:v[unit]})),unit)}`).join(''):'<p class="cr-empty">Sem proventos lançados. Cadastre dividendos, JCP ou rendimentos recebidos em Movimentação.</p>'}<p class="cr-note">Valores líquidos dos custos informados no lançamento. BRL e USD são separados; meses futuros não são preenchidos.</p></section>`;
 }
 function rowsHtml(asset,data){
   const d=R.detail(asset,data.ledger,today()),usdMissing=asset.moeda==='USD'&&!data.snapshot.fx;
   const rows=[['Quantidade',d.quantity?.toLocaleString('pt-BR',{maximumFractionDigits:8})],['Cotação',asset.tem?money(asset.pa,d.unit):'Sem cotação'],['Variação diária da posição atual',money(d.daily,d.unit)],['Resultado não realizado',money(d.result,d.unit)],['Resultado não realizado + proventos do ciclo',money(d.withIncome,d.unit)],['Preço médio',money(d.pm,d.unit,4)],['Preço médio líquido de proventos · gerencial',money(d.pmIncome,d.unit,4)],['Proventos lançados no ciclo atual',money(d.income,d.unit)],['Proventos de todo o histórico',money(d.allIncome,d.unit)],['Saldo atual da posição',money(d.value,d.unit)],['Custo da posição atual',money(d.cost,d.unit)],['Peso na carteira',usdMissing?'Indisponível sem câmbio':d.weight==null?'Não disponível':d.weight.toFixed(2)+'%']];
   return `<section class="cr-position"><h3>Sua posição · ${safe(asset.tk)}</h3><dl>${rows.map(([name,value])=>`<div><dt>${safe(name)}</dt><dd>${safe(value??'Não disponível')}</dd></div>`).join('')}</dl><p class="cr-note">Cotação: ${safe(asset.pxEm||'sem referência')}. Ciclo desde ${safe(d.cycleStart||'data não identificada')}. Proventos do ciclo são os lançados desde o último zeramento; elegibilidade na data-com não é aferida. Preço médio líquido é uma visão gerencial, sem alterar o preço médio cadastrado ou fiscal. A variação diária usa a quantidade atual, sem apurar operações intradiárias.</p><button class="pfbt" data-cr="movements" data-key="${safe(asset.k)}">Detalhes e movimentações</button></section>`;
 }
 function decorate(){
   if(tab!=='carteiras'||!window.PF||!window.TraderReports)return;let data;try{data=context()}catch{return}
   const root=document.getElementById('app');
   const quality=R.coverage(data.snapshot.pos,today()),kpis=root.querySelector('.pf > .pfks');
   if(kpis&&!root.querySelector('.cr-coverage')){
     const note=document.createElement('p');note.className='cr-note cr-coverage';note.setAttribute('role','status');
     note.textContent=`Cotações disponíveis: ${quality.priced} de ${quality.total} ativos.`+
       (quality.missing.length?` Sem preço: ${quality.missing.join(', ')}. Valores consolidados podem incluir custo como referência; não representam patrimônio totalmente marcado a mercado.`:'')+
       (quality.undated.length?` Data não informada: ${quality.undated.join(', ')}.`:'')+
       (quality.previous.length?' Há preços de pregões anteriores; confira a referência ao abrir o ativo.':'');
     kpis.after(note);
     if(quality.missing.length){const title=kpis.querySelector('.pfk span');if(title)title.textContent='Patrimônio de referência (parcial)'}
   }
   if(window.PF.sel){const box=root.querySelector('.pfmd[data-pfbk="selx"] .pfmb'),asset=data.snapshot.pos.find(a=>a.k===window.PF.sel);if(box&&asset&&!box.querySelector('.cr-position')){const head=box.querySelector('.pfdh');if(head)head.insertAdjacentHTML('afterend',rowsHtml(asset,data));else box.insertAdjacentHTML('afterbegin',rowsHtml(asset,data));box.querySelectorAll('.pfks.pfks6').forEach(node=>node.remove())}}
   if(window.PF.rv){const box=root.querySelector('.pfprint'),report=(window.PF.rel||[]).find(r=>String(r.id)===String(window.PF.rv));if(box&&!box.querySelector('.cr-report-visual')){
     const wrapper=document.createElement('div');wrapper.className='cr-report-visual';wrapper.innerHTML='<h2>Pesquisa patrimonial</h2><p class="cr-note">Gráficos dos registros atuais da carteira. Referência da análise selecionada: '+safe(report?.ref||'não informada')+'. Não representam a composição histórica de uma análise antiga.</p>'+charts(data)+'<p><button class="pfbt pfam" data-cr="pdf">Baixar relatório profissional em PDF</button></p>';const title=box.querySelector('.pfmodalh,.pfmh');if(title)title.after(wrapper);else box.prepend(wrapper);
   }}
   if(window.PF.aba==='ia'&&!root.querySelector('.cr-research-intro')){const target=root.querySelector('.pf');if(target){const section=document.createElement('section');section.className='cr-research-intro pfc';section.innerHTML='<h3>Relatório patrimonial e fundamentalista</h3><p>Gere a análise consolidada pelos botões desta aba. Ao abrir o relatório, veja evolução, proventos e fichas por ativo; a exportação usa paginação própria.</p><button class="pfbt" data-cr="load">Carregar histórico e fundamentos</button>';target.append(section)}}
 }
 window.TraderUI.onRender('carteira-experiencia',decorate);
 window.addEventListener('click',async event=>{
   const button=event.target.closest('[data-cr]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();
   if(button.dataset.cr==='pdf'){const label=button.textContent;button.disabled=true;button.textContent='Carregando dados…';try{const input=await TraderReports.preparePortfolioInput();rpAbrir('Relatório patrimonial e fundamentalista','carteira-pesquisa-'+today()+'.pdf',()=>TraderReports.portfolioPdf(input))}catch(error){toast(error.message||String(error))}finally{button.disabled=false;button.textContent=label}}
   if(button.dataset.cr==='load'){if(window.DIARIO_DEMO)return toast('Consultas externas desativadas na demonstração.');button.disabled=true;try{await Promise.allSettled([pfHist(),pfMeta(),pfRel(true)]);render()}finally{button.disabled=false;button.textContent=label}}
   if(button.dataset.cr==='movements'){const asset=dataFor(button.dataset.key);if(!asset)return;const d=R.detail(asset,(S.cart?.lanc||[]),today()),dialog=document.createElement('dialog');dialog.id='cr-movements';document.getElementById('cr-movements')?.remove();dialog.className='wf-dialog';dialog.innerHTML='<header><h2>'+safe(asset.tk)+' · movimentações</h2><button class="btn s" data-cr="close">Fechar</button></header><div class="wf-content"><div class="wf-table"><table><tr><th>Data</th><th>Tipo</th><th>Quantidade</th><th>Preço / valor</th></tr>'+d.events.map(r=>'<tr><td>'+safe(r.d)+'</td><td>'+safe(({C:'Compra',V:'Venda',P:'Provento',E:'Evento'})[r.tp]||r.tp)+'</td><td>'+safe(r.q||'—')+'</td><td>'+safe(r.p??'—')+'</td></tr>').join('')+'</table></div></div>';document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal()}
   if(button.dataset.cr==='close')button.closest('dialog')?.close();
 },true);
 function dataFor(key){try{return pfCalc().pos.find(a=>a.k===key)}catch{return null}}
 window.CarteiraExperience={context,charts,rowsHtml,decorate,svgLine,bars};
})();
