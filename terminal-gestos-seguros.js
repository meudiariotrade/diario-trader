/* Diário Trader v522 — patch isolado de gestos de análise.
 * Não altera o Profit Pro, dados, ordens, rotas ou navegação intencional.
 * Mãozinha padrão: continua sendo controlada pelo gráfico existente (v418).
 * Modos Preço/Tempo: usam a API pública TRM.tec.chartView, com atualização incremental.
 */
(function (root, doc) {
  'use strict';
  if (!root || !doc || root.TraderGestosSeguros) return;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));
  const modes = new Map();
  let drag = null, swipe = null, scheduled = false;
  const chartOf = el => el?.closest?.('svg[data-g9svg]');
  const validPanel = svg => {
    const n = Number(svg?.dataset?.g9svg);
    return svg?.dataset?.g9svg !== undefined && Number.isInteger(n) && n >= 0 ? n : null;
  };
  const send = (panel, action, value, anchor) => {
    if (typeof root.TRM?.tec?.chartView !== 'function') return false;
    try { root.TRM.tec.chartView(panel, action, value, anchor); return true; }
    catch (err) { root.console?.warn?.('[Terminal] gesto não aplicado:', err); return false; }
  };
  const modeOf = panel => modes.get(panel) || 'hand';
  const modeLabel = {hand:'✋ Mover',price:'↕ Preço',time:'↔ Tempo'};
  const protectionArea = target => {
    if (!target?.closest || !doc.getElementById('app')?.contains(target)) return null;
    const chart = target.closest('svg[data-g9svg], .g418-toolbar, #v421-gp .gp-svg');
    if (chart) return {kind:'grafico',element:chart};
    const season = target.closest('.us-rank, .us-events, .us-event-table, .us-rank-grid, .v357-extra, .v357-event, .v357-corr-grid, .m409-plot, [data-sazonalidade], [data-seasonality]');
    if (season) return {kind:'sazonalidade',element:season};
    const table = target.closest('table, .anxt, .dtval-table-scroll, .m403-table, .m409-table, .tblscroll, .table-scroll, [data-horizontal-scroll]');
    if (table) return {kind:'tabela',element:table};
    return null;
  };
  function info(panel, message) {
    const host = doc.querySelector('.g418-toolbar[data-g418-panel="'+panel+'"]');
    const sr = host?.querySelector('.g418-sr');
    if (sr) sr.textContent = message;
  }
  function updateControls(panel) {
    const sel = '.g522-tool[data-g522-panel="'+panel+'"]';
    for (const el of doc.querySelectorAll(sel)) {
      const summary = el.querySelector('summary');
      if (summary) summary.textContent = modeLabel[modeOf(panel)]+' ▾';
      for (const b of el.querySelectorAll('[data-g522-mode]'))
        b.setAttribute('aria-pressed', String(b.dataset.g522Mode === modeOf(panel)));
      const scale = el.querySelector('[data-g522-action="scale"]');
      if (scale) {
        let log = true;
        try { log = root.TerminalChart?.axis?.(panel)?.log !== false; } catch (_) {}
        scale.textContent = log ? 'Escala: logarítmica' : 'Escala: linear';
      }
    }
  }
  function addTools() {
    scheduled = false;
    for (const svg of doc.querySelectorAll('svg[data-g9svg]')) {
      const p = validPanel(svg), host = svg.closest('[data-trp],.trpb') || svg.parentElement;
      if (p === null || !host) continue;
      const toolbar = host.querySelector('.g418-toolbar[data-g418-panel="'+p+'"]');
      if (!toolbar || toolbar.querySelector('.g522-tool')) continue;
      const node = doc.createElement('details');
      node.className = 'g522-tool';
      node.dataset.g522Panel = String(p);
      node.innerHTML =
        '<summary aria-label="Modo de interação do gráfico">✋ Mover ▾</summary>'+
        '<div class="g522-menu" role="group" aria-label="Ajustes do gráfico">'+
        '<div class="g522-modes">'+
        '<button type="button" data-g522-mode="hand" aria-pressed="true">✋ Mãozinha</button>'+
        '<button type="button" data-g522-mode="price" aria-pressed="false">↕ Ajustar preço</button>'+
        '<button type="button" data-g522-mode="time" aria-pressed="false">↔ Ajustar tempo</button>'+
        '</div><p class="g522-hint">Escolha o modo e arraste no gráfico. No modo Mãozinha, mova preço e tempo juntos.</p>'+
        '<div class="g522-actions">'+
        '<button type="button" data-g522-action="zoom-in" title="Aproximar tempo">Zoom +</button>'+
        '<button type="button" data-g522-action="zoom-out" title="Afastar tempo">Zoom −</button>'+
        '<button type="button" data-g522-action="scale">Escala: logarítmica</button>'+
        '<button type="button" data-g522-action="latest">Ir ao ponto atual</button>'+
        '</div></div>';
      const reset = toolbar.querySelector('[data-g418-action="reset"]');
      toolbar.insertBefore(node,reset||toolbar.firstChild);
      updateControls(p);
    }
  }
  function queueTools() {
    if (scheduled) return;
    scheduled = true;
    root.requestAnimationFrame?.(addTools) || addTools();
  }

  doc.addEventListener('click', e => {
    const button = e.target.closest?.('[data-g522-mode], [data-g522-action]');
    if (!button) return;
    const host = button.closest('.g522-tool');
    if (!host) return;
    e.preventDefault();
    e.stopPropagation();
    const panel = Number(host.dataset.g522Panel);
    if (!Number.isInteger(panel) || panel < 0) return;
    if (button.hasAttribute('data-g522-mode')) {
      if (drag) { drag = null; }
      const mode = button.dataset.g522Mode;
      if (!Object.hasOwn(modeLabel,mode)) return;
      modes.set(panel,mode);
      info(panel,'Modo '+modeLabel[mode]);
      updateControls(panel);
      host.open = false;
      return;
    }
    const action = button.dataset.g522Action;
    if (action === 'scale') send(panel,'scale',0);
    if (action === 'latest') send(panel,'latest',0);
    if (action === 'zoom-in') send(panel,'zoom',.8,.5);
    if (action === 'zoom-out') send(panel,'zoom',1.25,.5);
    updateControls(panel);
    info(panel, action === 'latest'?'Voltou ao ponto atual':action==='scale'?'Escala alterada':'Zoom ajustado');
    if (action !== 'scale') host.open = false;
  },true);

  // Janela/captura executa antes do handler legado registrado em document.
  // Somente os modos explícitos Preço e Tempo interceptam pointer events.
  function down(e) {
    const svg = chartOf(e.target);
    if (!svg || e.button > 0) return;
    const panel = validPanel(svg);
    if (panel === null || modeOf(panel) === 'hand') return;
    const box = svg.getBoundingClientRect();
    if (box.width < 20 || box.height < 20) return;
    if (!drag || drag.panel!==panel) drag = {
      id:e.pointerId,panel,mode:modeOf(panel),box,
      points:new Map(),start:new Map(),multi:false,pinchStart:null,pinchEnd:null,
      pendingX:0,pendingY:0,frame:0,moved:false
    };
    drag.points.set(e.pointerId,{x:e.clientX,y:e.clientY});
    drag.start.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(drag.points.size === 2){
      drag.multi = true;
      drag.pendingX=0;drag.pendingY=0;
      if(drag.frame)root.cancelAnimationFrame?.(drag.frame);
      drag.frame=0;
      drag.pinchStart=[...drag.points.values()].map(p=>({...p}));
    }
    if(e.cancelable)e.preventDefault();
    e.stopImmediatePropagation();
  }
  function flush(g) {
    if (!g || g.multi) return;
    const dx=g.pendingX,dy=g.pendingY;
    g.pendingX=0;g.pendingY=0;g.frame=0;
    if(Math.abs(dx)+Math.abs(dy)<.3) return;
    if(g.mode==='price') send(g.panel,'pricepan',clamp(dy/g.box.height,-.75,.75));
    if(g.mode==='time') send(g.panel,'page',clamp(dx/g.box.width,-.75,.75));
  }
  function move(e) {
    const g=drag;
    if(!g||!g.points.has(e.pointerId))return;
    const prev=g.points.get(e.pointerId), p={x:e.clientX,y:e.clientY};
    g.points.set(e.pointerId,p);
    if(e.cancelable)e.preventDefault();
    e.stopImmediatePropagation();
    if(g.multi){if(g.points.size===2)g.pinchEnd=[...g.points.values()].map(a=>({...a}));return;}
    g.pendingX+=p.x-prev.x;g.pendingY+=p.y-prev.y;
    if(Math.hypot(p.x-prev.x,p.y-prev.y)>2)g.moved=true;
    if(!g.frame)g.frame=root.requestAnimationFrame?root.requestAnimationFrame(()=>flush(g)):0;
    if(!root.requestAnimationFrame)flush(g);
  }
  function finish(e,cancelled) {
    const g=drag;
    if(!g||!g.points.has(e.pointerId))return;
    g.points.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(e.cancelable)e.preventDefault();
    e.stopImmediatePropagation();
    if(g.multi&&g.points.size===2)g.pinchEnd=[...g.points.values()].map(p=>({...p}));
    g.points.delete(e.pointerId);
    if(g.points.size)return;
    if(g.frame)root.cancelAnimationFrame?.(g.frame);
    g.frame=0;
    drag=null;
    if(cancelled)return;
    if(g.multi&&g.pinchStart&&g.pinchEnd){
      const dist=a=>Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
      const start=dist(g.pinchStart),end=dist(g.pinchEnd);
      if(start>20&&end>20&&Math.abs(end/start-1)>.05){
        const zoom=clamp(start/end,.45,2.3);
        send(g.panel,'zoom',zoom,clamp(((g.pinchStart[0].x+g.pinchStart[1].x)/2-g.box.left)/g.box.width,0,1));
        send(g.panel,'pricezoom',zoom);
      }
    } else flush(g);
    info(g.panel,g.multi?'Pinça aplicada':g.mode==='price'?'Preço deslocado':'Tempo deslocado');
  }
  root.addEventListener('pointerdown',down,true);
  root.addEventListener('pointermove',move,{capture:true,passive:false});
  root.addEventListener('pointerup',e=>finish(e,false),true);
  root.addEventListener('pointercancel',e=>finish(e,true),true);
  root.addEventListener('blur',()=>{if(drag?.frame)root.cancelAnimationFrame?.(drag.frame);drag=null;swipe=null;});

  // Protege gestos internos sem impedir a rolagem NATIVA de tabelas/sazonalidade.
  // Deixa a área externa e os seletores de abas livres para navegação intencional.
  root.addEventListener('touchstart',e=>{
    if(e.touches?.length!==1){swipe=null;return;}
    const area=protectionArea(e.target);
    if(!area){swipe=null;return;}
    const t=e.touches[0];
    swipe={area:area.kind,x:t.clientX,y:t.clientY,protected:false};
  },{capture:true,passive:true});
  root.addEventListener('touchmove',e=>{
    if(!swipe)return;
    if(e.touches?.length!==1){swipe=null;return;}
    const t=e.touches[0],dx=t.clientX-swipe.x,dy=t.clientY-swipe.y;
    if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.35)swipe.protected=true;
    if(swipe.protected){
      // Não usar preventDefault aqui: Safari precisa receber a rolagem horizontal.
      e.stopPropagation();
    }
  },{capture:true,passive:true});
  root.addEventListener('touchend',e=>{
    if(!swipe)return;
    const locked=swipe.protected,area=swipe.area;
    swipe=null;
    if(locked){
      e.stopPropagation();
      try{root.dispatchEvent(new CustomEvent('dt:gesto-interno',{detail:{area,at:new Date().toISOString()}}));}catch(_){}
    }
  },{capture:true,passive:true});
  root.addEventListener('touchcancel',()=>{swipe=null},{capture:true,passive:true});

  function ready(){
    addTools();
    const target=doc.getElementById('app')||doc.body;
    if(root.MutationObserver&&target)new MutationObserver(queueTools).observe(target,{childList:true,subtree:true});
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
  root.TraderGestosSeguros=Object.freeze({version:'v522-patch525',modeOf,protectionArea});
})(window,document);
