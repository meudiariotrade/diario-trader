/* v1037 — Etapa 5: Áurea (inspirado no kit de chat do Astryx/UI Moments, MIT).
 * Camada sobre o chat que já existe (#wf-chat-panel); não muda o envio nem o backend.
 *  1. Resposta revelada aos poucos (o servidor ainda entrega tudo de uma vez)
 *  2. Etapas visíveis enquanto ela trabalha (estado real: anexos, contexto, encaminhamento)
 *  3. Fontes numeradas, links clicáveis e atalho "Fontes (n)" no topo da resposta
 *  4. Tickers clicáveis (abrem a busca) e variações % em verde/vermelho
 *  5. Tabelas em texto "| a | b |" viram tabela compacta
 *  6. Sugestões da caixa "Você pode começar por aqui" passam a mudar com o horário (pré, pregão, pós)
 *  7. @trade, @hoje e @plano: inserem o dado do diário na pergunta
 *  8. Ditado por voz (quando o navegador permite)
 *  9. "Ir para o fim" quando a conversa está rolada para cima
 * 10. "Bastidores da análise": o que foi usado (membro, anexos, contexto, fontes, tempo)
 */
(function () {
  'use strict';
  if (window.DiarioAureaUI) return;
  var doc = document;
  var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function painel() { return doc.getElementById('wf-chat-panel'); }

  var CSS = [
    '#wf-chat-panel .uim-etapas{list-style:none;margin:6px 0;padding:8px 10px;border-left:2px solid #F59E0B;background:#12151E;font-size:12.5px;color:#64748B}',
    '#wf-chat-panel .uim-etapas li{display:flex;gap:8px;align-items:center;min-height:22px}',
    '#wf-chat-panel .uim-etapas li.ok{color:#E2E8F0}',
    '#wf-chat-panel .uim-etapas li.ok::before{content:"✓";color:#10B981;width:12px}',
    '#wf-chat-panel .uim-etapas li.vez::before{content:"";width:8px;height:8px;margin:0 2px;border-radius:50%;background:#F59E0B;animation:uim-pulso 1s ease-in-out infinite}',
    '#wf-chat-panel .uim-etapas li.err{color:#EF4444}',
    '@keyframes uim-pulso{50%{opacity:.25}}',
    '#wf-chat-panel .uim-chatbar{display:flex;justify-content:flex-end;min-height:0}',
    '#wf-chat-panel .uim-chatbar button{min-height:32px;padding:0 10px;border-radius:4px;border:1px solid rgba(255,255,255,.08);background:#181C28;color:#E2E8F0;font-size:12px}',
    '#wf-chat-panel .uim-tk{all:unset;cursor:pointer;color:#F59E0B;font-weight:600;font-variant-numeric:tabular-nums;border-bottom:1px dotted rgba(245,158,11,.5)}',
    '#wf-chat-panel .uim-tk:focus-visible{outline:2px solid #F59E0B}',
    '#wf-chat-panel .uim-pg{color:#10B981;font-variant-numeric:tabular-nums}#wf-chat-panel .uim-pr{color:#EF4444;font-variant-numeric:tabular-nums}',
    '#wf-chat-panel .uim-fontes-chip{all:unset;cursor:pointer;display:inline-block;margin:2px 0 6px;font-size:12px;color:#64748B;border:1px solid rgba(255,255,255,.08);border-radius:4px;padding:2px 8px}',
    '#wf-chat-panel .uim-tab{width:100%;border-collapse:collapse;margin:6px 0;font-size:12.5px;font-variant-numeric:tabular-nums}',
    '#wf-chat-panel .uim-tab th{text-align:left;color:#64748B;font-weight:600;border-bottom:1px solid #1E232E;padding:4px 6px}',
    '#wf-chat-panel .uim-tab td{border-bottom:1px solid #1E232E;padding:4px 6px}',
    '#wf-chat-panel .uim-tab td.n{text-align:right}',
    '#wf-chat-panel .uim-revela{opacity:0;transform:translateY(4px)}',
    '#wf-chat-panel .uim-revela.on{opacity:1;transform:none;transition:opacity .25s,transform .25s}',
    '#wf-chat-panel .uim-mencao{position:absolute;left:8px;right:8px;bottom:100%;margin-bottom:4px;z-index:5;background:#181C28;border:1px solid rgba(255,255,255,.08);border-radius:4px;padding:4px}',
    '#wf-chat-panel .uim-mencao button{display:flex;width:100%;justify-content:space-between;gap:8px;min-height:40px;padding:0 10px;border:0;border-radius:4px;background:transparent;color:#E2E8F0;font-size:13px;text-align:left}',
    '#wf-chat-panel .uim-mencao button small{color:#64748B}',
    '#wf-chat-panel .uim-mencao button.sel,#wf-chat-panel .uim-mencao button:hover{background:rgba(245,158,11,.12)}',
    '#wf-chat-panel [data-uim-mic]{display:inline-flex;align-items:center;justify-content:center}',
    '#wf-chat-panel [data-uim-mic][aria-pressed="true"]{color:#EF4444}',
    '@media (max-width:760px){#wf-chat-panel .uim-com-texto [data-uim-mic][aria-pressed="false"]{display:none}}',
    '#wf-chat-panel .uim-bast summary{color:#64748B}',
    '#wf-chat-panel .uim-bast li{font-variant-numeric:tabular-nums}',
    '@media (prefers-reduced-motion:reduce){#wf-chat-panel .uim-etapas li.vez::before{animation:none}#wf-chat-panel .uim-revela{opacity:1;transform:none}}'
  ].join('\n');
  function montarCss() {
    if (doc.getElementById('uim-aurea-css')) return;
    var s = doc.createElement('style'); s.id = 'uim-aurea-css'; s.textContent = CSS; doc.head.appendChild(s);
  }

  /* ---------- dados do diário para @menções ---------- */
  function hoje() { try { return typeof loc === 'function' ? loc().slice(0, 10) : new Date().toISOString().slice(0, 10); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function brl(v) { return (v < 0 ? '−' : '') + 'R$ ' + Math.abs(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function resultado(t) { try { var c = calc(t); return c && typeof c.pl === 'number' ? c.pl : null; } catch (e) { return null; } }
  function trades() { try { return (S.trades || []).slice(); } catch (e) { return []; } }
  var MENCOES = {
    trade: ['Último trade', function () {
      var t = trades().filter(function (x) { return x.dt; }).sort(function (a, b) { return String(b.dt).localeCompare(String(a.dt)); })[0];
      if (!t) return null;
      var r = resultado(t);
      return 'Último trade: ' + (t.ativo || '?') + ' · ' + (t.side === 'V' ? 'venda' : 'compra') + ' ' + (t.qty || 1) + ' · entrada ' + (t.entry || '—') + ' · stop ' + (t.stop || '—') +
        ' · alvo ' + (t.target || '—') + ' · saída ' + (t.exit || 'em aberto') + (r != null ? ' · resultado ' + brl(r) : '') + (t.setup ? ' · setup ' + t.setup : '') +
        (t.err && t.err !== 'Nenhum' ? ' · erro marcado: ' + t.err : '') + ' · ' + String(t.dt).replace('T', ' ');
    }],
    hoje: ['Meu dia de hoje', function () {
      var d = hoje(), ts = trades().filter(function (x) { return String(x.dt || '').slice(0, 10) === d; });
      var fech = ts.filter(function (x) { return resultado(x) != null; }), soma = 0, ganhos = 0;
      fech.forEach(function (x) { var r = resultado(x); soma += r; if (r > 0) ganhos++; });
      return 'Meu dia (' + d.split('-').reverse().join('/') + '): ' + ts.length + ' trade(s), ' + fech.length + ' encerrado(s), resultado ' + brl(soma) +
        (fech.length ? ', acerto ' + Math.round((ganhos / fech.length) * 100) + '%' : '') + '.';
    }],
    plano: ['Plano do dia', function () {
      try { var p = (S.days && S.days[hoje()] && S.days[hoje()].plano) || ''; return p ? 'Meu plano do dia: ' + String(p).slice(0, 600) : null; } catch (e) { return null; }
    }]
  };
  function expandir(txt) {
    return String(txt).replace(/(^|\s)@(trade|hoje|plano)\b/g, function (m, sp, k) {
      var v = MENCOES[k][1]();
      return sp + (v ? '[' + v + ']' : '@' + k);
    });
  }

  /* ---------- 6. Sugestões por horário ---------- */
  function sugestoes() {
    var h = new Date().getHours();
    /* A 1ª pergunta sempre parte da agenda econômica (compromisso do navegacao-simples). */
    if (h < 9) return ['Como interpretar a agenda econômica de hoje?', 'Plano do pregão WIN e WDO hoje', 'Riscos do dia para o meu plano @plano'];
    if (h < 17) return ['O que da agenda econômica ainda pode mexer no pregão?', 'Como está meu dia? @hoje', 'Analise meu último trade @trade'];
    return ['O que a agenda econômica de amanhã pode trazer?', 'Revise meus trades de hoje @hoje', 'O que aprendi com meu último trade? @trade'];
  }
  /* Usa a caixa "Você pode começar por aqui" que já existe (navegacao-simples) e troca as perguntas
   * fixas pelas do horário, sem criar uma segunda fileira. */
  function desenharSug(p) {
    var ta = p.querySelector('textarea'), box = p.querySelector('.simple-questions');
    if (!ta || !box) return;
    var lista = sugestoes(), chave = lista.join('|');
    if (box.dataset.uimSug === chave) return;
    box.dataset.uimSug = chave;
    box.querySelectorAll('button').forEach(function (b) { b.remove(); });
    lista.forEach(function (q) {
      var b = doc.createElement('button');
      b.type = 'button'; b.textContent = q; b.dataset.uimQ = q;
      box.appendChild(b);
    });
    if (!box.dataset.uimLig) {
      box.dataset.uimLig = '1';
      box.addEventListener('click', function (e) {
        var b = e.target.closest('[data-uim-q]'); if (!b) return;
        ta.value = expandir(b.dataset.uimQ);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.focus();
      });
    }
  }

  /* ---------- 7. Menções com @ ---------- */
  var menu = null, menuSel = 0;
  function fecharMenu() { if (menu) { menu.remove(); menu = null; } }
  function tokenAtual(ta) {
    var ate = ta.value.slice(0, ta.selectionStart), m = ate.match(/(^|\s)@([a-z]*)$/i);
    return m ? { ini: ate.length - m[2].length - 1, txt: m[2].toLowerCase() } : null;
  }
  function abrirMenu(ta) {
    var tk = tokenAtual(ta);
    if (!tk) { fecharMenu(); return; }
    var itens = Object.keys(MENCOES).filter(function (k) { return k.indexOf(tk.txt) === 0; });
    if (!itens.length) { fecharMenu(); return; }
    var comp = ta.closest('.wf-chat-composer');
    if (!menu) { menu = doc.createElement('div'); menu.className = 'uim-mencao'; menu.setAttribute('role', 'listbox'); comp.style.position = 'relative'; comp.appendChild(menu); }
    menuSel = Math.min(menuSel, itens.length - 1);
    menu.innerHTML = itens.map(function (k, i) { return '<button type="button" role="option" data-k="' + k + '" class="' + (i === menuSel ? 'sel' : '') + '"><span>@' + k + '</span><small>' + esc(MENCOES[k][0]) + '</small></button>'; }).join('');
    menu.onclick = function (e) { var b = e.target.closest('[data-k]'); if (b) escolher(ta, b.dataset.k); };
  }
  function escolher(ta, k) {
    var tk = tokenAtual(ta); if (!tk) { fecharMenu(); return; }
    var v = MENCOES[k][1]();
    var ins = v ? '[' + v + '] ' : '@' + k + ' ';
    ta.value = ta.value.slice(0, tk.ini) + ins + ta.value.slice(ta.selectionStart);
    var pos = tk.ini + ins.length; ta.setSelectionRange(pos, pos);
    fecharMenu();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
    if (!v) avisar('Sem dados para @' + k + ' ainda.');
  }
  function avisar(m) { if (window.DiarioMomentos) window.DiarioMomentos.toast(m); }

  /* ---------- 8. Ditado ---------- */
  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null;
  function prepararMic(p) {
    if (!Rec || p.querySelector('[data-uim-mic]')) return;
    var cam = p.querySelector('[data-chat-camera]'); if (!cam) return;
    var b = doc.createElement('button');
    b.type = 'button'; b.setAttribute('data-uim-mic', ''); b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', 'Ditar pergunta'); b.title = 'Ditar pergunta';
    b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
    cam.parentNode.insertBefore(b, cam);
    b.addEventListener('click', function () {
      if (rec) { rec.stop(); return; }
      var ta = p.querySelector('textarea'), base = ta.value ? ta.value.replace(/\s*$/, ' ') : '';
      try {
        rec = new Rec(); rec.lang = 'pt-BR'; rec.interimResults = true; rec.continuous = false;
        rec.onresult = function (e) {
          var t = ''; for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
          ta.value = base + t; ta.dispatchEvent(new Event('input', { bubbles: true }));
        };
        rec.onend = function () { rec = null; b.setAttribute('aria-pressed', 'false'); };
        rec.onerror = function (e) { if (e.error === 'not-allowed') avisar('Permita o microfone para ditar.'); };
        rec.start(); b.setAttribute('aria-pressed', 'true');
      } catch (er) { rec = null; avisar('Ditado indisponível neste navegador.'); }
    });
  }

  /* ---------- 2 e 10. Etapas e bastidores ---------- */
  var pedido = null, mensagensVistas = new Set();
  function capturarEnvio(p) {
    var ta = p.querySelector('textarea'), q = (ta && ta.value.trim()) || '';
    var nImg = p.querySelectorAll('.wf-chat-preview-item').length;
    var ops = Array.prototype.slice.call(p.querySelectorAll('.wf-chat-options input[type=checkbox]:checked')).map(function (c) {
      return ((c.closest('label') || {}).textContent || c.name).replace(/\s+/g, ' ').trim();
    });
    if (q.length < 3 && !nImg) return;
    if (ta && /(^|\s)@(trade|hoje|plano)\b/.test(ta.value)) ta.value = expandir(ta.value);
    pedido = { t0: Date.now(), nImg: nImg, ops: ops, rota: '', menc: (ta.value.match(/\[(Último trade|Meu dia|Meu plano)/g) || []).length };
    p.querySelectorAll('.wf-chat-history [data-aurea-message]').forEach(function (a) { mensagensVistas.add(a.getAttribute('data-aurea-message')); });
    desenharEtapas(p);
  }
  function desenharEtapas(p) {
    if (!pedido) return;
    var st = p.querySelector('.wf-chat-status'); if (!st) return;
    var ul = p.querySelector('.uim-etapas');
    if (!ul) { ul = doc.createElement('ul'); ul.className = 'uim-etapas'; ul.setAttribute('aria-hidden', 'true'); st.parentNode.insertBefore(ul, st); }
    var txt = (st.textContent || '').trim(), m = txt.match(/encaminhou para (.+?)…/);
    if (m) pedido.rota = m[1];
    if (/Conselho/.test(txt)) pedido.rota = pedido.rota || 'o Conselho';
    var e = [['ok', 'Pergunta recebida']];
    if (pedido.nImg) e.push(['ok', pedido.nImg + ' gráfico(s) enviado(s)']);
    if (pedido.menc) e.push(['ok', 'Dados do diário anexados (' + pedido.menc + ')']);
    if (pedido.ops.length) e.push(['ok', 'Contexto: ' + pedido.ops.join(', ')]);
    if (pedido.rota) e.push(['ok', 'Encaminhada para ' + pedido.rota]);
    if (pedido.fim) e.push([pedido.erro ? 'err' : 'ok', pedido.erro ? 'Não concluiu: ' + pedido.erro : 'Resposta pronta em ' + Math.max(1, Math.round((pedido.fim - pedido.t0) / 1000)) + ' s']);
    else e.push(['vez', pedido.rota ? 'Montando a resposta' : 'Analisando']);
    ul.innerHTML = e.map(function (x) { return '<li class="' + x[0] + '">' + esc(x[1]) + '</li>'; }).join('');
  }
  function encerrarEtapas(p, erro) {
    if (!pedido || pedido.fim) return;
    pedido.fim = Date.now(); pedido.erro = erro || '';
    desenharEtapas(p);
    var ref = pedido;
    setTimeout(function () { var ul = p.querySelector('.uim-etapas'); if (ul && pedido === ref) ul.remove(); }, erro ? 6000 : 2500);
  }

  /* ---------- 1, 3, 4, 5, 10. Tratamento de cada resposta ---------- */
  var RE_TK = /\b((?:WIN|WDO)[FGHJKMNQUVXZ]\d{2}|[A-Z]{4}(?:3|4|5|6|11)|IBOV|BOVA11)\b/g;
  var RE_PCT = /([+−-]\s?\d{1,3}(?:[.,]\d+)?\s?%)/g;
  function marcarTexto(raiz) {
    var w = doc.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || p.closest('.wf-chat-question,button,a,summary,.uim-tk,small,script,style,svg,figure')) return NodeFilter.FILTER_REJECT;
        RE_TK.lastIndex = 0; RE_PCT.lastIndex = 0;
        return RE_TK.test(n.nodeValue) || RE_PCT.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nos = []; while (w.nextNode()) nos.push(w.currentNode);
    nos.forEach(function (n) {
      var h = esc(n.nodeValue)
        .replace(RE_TK, '<button type="button" class="uim-tk" data-uim-tk="$1" title="Abrir $1">$1</button>')
        .replace(RE_PCT, function (m) { return '<span class="' + (/^[−-]/.test(m) ? 'uim-pr' : 'uim-pg') + '">' + m + '</span>'; });
      var s = doc.createElement('span'); s.innerHTML = h;
      n.parentNode.replaceChild(s, n);
    });
  }
  function tabelas(raiz) {
    raiz.querySelectorAll('p,li').forEach(function (p) {
      var linhas = (p.textContent || '').split(/\n/).map(function (l) { return l.trim(); }).filter(function (l) { return /^\|.*\|$/.test(l); });
      if (linhas.length < 2) return;
      linhas = linhas.filter(function (l) { return !/^\|[\s:|-]+\|$/.test(l); });
      var cel = function (l) { return l.slice(1, -1).split('|').map(function (c) { return c.trim(); }); };
      var cab = cel(linhas[0]), corpo = linhas.slice(1).map(cel);
      var num = function (c) { return /^[+−-]?(R\$\s?)?[\d.,]+%?$/.test(c); };
      var t = '<table class="uim-tab"><thead><tr>' + cab.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        corpo.map(function (r) { return '<tr>' + r.map(function (c) { return '<td' + (num(c) ? ' class="n"' : '') + '>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
      var d = doc.createElement('div'); d.innerHTML = t; p.replaceWith(d.firstChild);
    });
  }
  function fontes(a) {
    var det = Array.prototype.slice.call(a.querySelectorAll('details')).filter(function (d) { var s = d.querySelector('summary'); return s && /^Fontes/.test(s.textContent); })[0];
    if (!det || det.dataset.uim) return;
    det.dataset.uim = '1';
    var lis = det.querySelectorAll('li');
    lis.forEach(function (li, i) {
      var t = li.textContent;
      var h = esc(t).replace(/(https?:\/\/[^\s<]+[^\s<.,;)])/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
      li.innerHTML = '<b>[' + (i + 1) + ']</b> ' + h;
    });
    var h3 = a.querySelector('h3');
    if (h3 && lis.length) {
      var c = doc.createElement('button'); c.type = 'button'; c.className = 'uim-fontes-chip';
      c.textContent = 'Fontes (' + lis.length + ') ↓';
      c.addEventListener('click', function () { det.open = true; det.scrollIntoView({ block: 'nearest', behavior: reduz ? 'auto' : 'smooth' }); });
      h3.insertAdjacentElement('afterend', c);
    }
  }
  function bastidores(a, info) {
    if (!info || a.querySelector('.uim-bast')) return;
    var it = [];
    if (info.rota) it.push('Encaminhada para: ' + info.rota);
    if (info.nImg) it.push('Gráficos analisados: ' + info.nImg);
    if (info.menc) it.push('Dados do diário anexados: ' + info.menc);
    it.push('Contexto extra: ' + (info.ops.length ? info.ops.join(', ') : 'nenhum'));
    var nf = a.querySelectorAll('.uim-fontes-chip').length ? (a.querySelector('.uim-fontes-chip').textContent.match(/\d+/) || [0])[0] : 0;
    it.push('Fontes citadas: ' + nf);
    if (info.fim) it.push('Tempo de resposta: ' + Math.max(1, Math.round((info.fim - info.t0) / 1000)) + ' s');
    var d = doc.createElement('details'); d.className = 'uim-bast';
    d.innerHTML = '<summary>Bastidores da análise</summary><ul>' + it.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    var sm = a.querySelector(':scope > small'); a.insertBefore(d, sm || null);
  }
  function revelar(a) {
    if (reduz) return;
    var blocos = Array.prototype.slice.call(a.children).filter(function (c) { return !c.classList.contains('wf-chat-question'); });
    blocos.forEach(function (b, i) {
      b.classList.add('uim-revela');
      setTimeout(function () { b.classList.add('on'); }, 60 + i * 110);
    });
  }
  var infoPorMsg = {};
  function tratarResposta(a, nova) {
    if (a.dataset.uimOk) return;
    a.dataset.uimOk = '1';
    var id = a.getAttribute('data-aurea-message');
    tabelas(a); fontes(a); marcarTexto(a);
    if (nova && pedido) { infoPorMsg[id] = pedido; }
    bastidores(a, infoPorMsg[id]);
    if (nova) revelar(a);
  }

  /* ---------- 9. Ir para o fim ---------- */
  function prepararBarra(p) {
    var hist = p.querySelector('.wf-chat-history'), st = p.querySelector('.wf-chat-status');
    if (!hist || !st || p.querySelector('.uim-chatbar')) return;
    var bar = doc.createElement('div'); bar.className = 'uim-chatbar';
    bar.innerHTML = '<button type="button" hidden>↓ Ir para o fim</button>';
    st.parentNode.insertBefore(bar, st);
    var seg = doc.createElement('div');
    seg.className = 'uim-modo-conselho';
    seg.style.cssText = 'display:inline-flex;gap:4px;margin-right:auto;align-items:center';
    var atual = modoConselho();
    seg.innerHTML = '<button type="button" data-uim-modo="objetivo" aria-pressed="' + (atual === 'objetivo') + '" style="min-height:30px;padding:0 10px;border-radius:999px;font-size:11.5px;border:1px solid rgba(255,255,255,.12);background:' + (atual === 'objetivo' ? 'rgba(245,158,11,.18);color:#FBBF24' : 'transparent;color:#94A3B8') + '">Objetivo</button>' +
      '<button type="button" data-uim-modo="completo" aria-pressed="' + (atual === 'completo') + '" style="min-height:30px;padding:0 10px;border-radius:999px;font-size:11.5px;border:1px solid rgba(255,255,255,.12);background:' + (atual === 'completo' ? 'rgba(245,158,11,.18);color:#FBBF24' : 'transparent;color:#94A3B8') + '">Completo</button>';
    bar.insertBefore(seg, bar.firstChild);
    seg.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-uim-modo]'); if (!btn) return;
      var m = btn.dataset.uimModo === 'completo' ? 'completo' : 'objetivo';
      try { localStorage.setItem('diario_conselho_modo', m); } catch (e) {}
      seg.querySelectorAll('[data-uim-modo]').forEach(function (x) {
        var on = x.dataset.uimModo === m;
        x.setAttribute('aria-pressed', String(on));
        x.style.background = on ? 'rgba(245,158,11,.18)' : 'transparent';
        x.style.color = on ? '#FBBF24' : '#94A3B8';
      });
    });
    var b = bar.querySelector('button:not([data-uim-modo])');
    var ver = function () { b.hidden = hist.scrollHeight - hist.clientHeight - hist.scrollTop < 80; };
    hist.addEventListener('scroll', ver, { passive: true });
    b.addEventListener('click', function () { hist.scrollTo({ top: hist.scrollHeight, behavior: reduz ? 'auto' : 'smooth' }); });
    new MutationObserver(ver).observe(hist, { childList: true });
  }
  function modoConselho() {
    try { return localStorage.getItem('diario_conselho_modo') === 'completo' ? 'completo' : 'objetivo'; } catch (e) { return 'objetivo'; }
  }
  function anexarGraficosLivermore(host, opts) {
    if (!host || !window.DiarioLivermoreGraficos || !opts || !opts.candles) return false;
    var box = doc.createElement('div');
    box.innerHTML = window.DiarioLivermoreGraficos.renderHtmlPanel({ ticker: opts.ticker, analysis: opts.analysis, candles: opts.candles, tf: opts.tf || '1d', theme: 'dark', dir: opts.dir });
    host.appendChild(box);
    return true;
  }

  /* ---------- ligação com o painel ---------- */
  function ligar(p) {
    if (p.dataset.uimAurea) return;
    p.dataset.uimAurea = '1';
    var ta = p.querySelector('textarea'), form = p.querySelector('form'), st = p.querySelector('.wf-chat-status');
    form.addEventListener('submit', function () { capturarEnvio(p); fecharMenu(); if (rec) rec.stop(); }, true);
    ta.addEventListener('input', function () {
      abrirMenu(ta);
      var c = ta.closest('.wf-chat-composer'); if (c) c.classList.toggle('uim-com-texto', !!ta.value.trim());
    });
    ta.addEventListener('keydown', function (e) {
      if (!menu) return;
      var bs = menu.querySelectorAll('[data-k]');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); menuSel = (menuSel + (e.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length; abrirMenu(ta); }
      else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); escolher(ta, bs[menuSel].dataset.k); menuSel = 0; }
      else if (e.key === 'Escape') { e.stopPropagation(); fecharMenu(); }
    }, true);
    ta.addEventListener('blur', function () { setTimeout(fecharMenu, 150); });
    new MutationObserver(function () {
      desenharEtapas(p);
      var t = (st.textContent || '').trim(), ocupado = false;
      try { ocupado = !!ECO.busy; } catch (e) {}
      if (pedido && !pedido.fim && !ocupado && t && !/Áurea/.test(t)) encerrarEtapas(p, t);
      desenharSug(p);
    }).observe(st, { childList: true, characterData: true, subtree: true });
    var hist = p.querySelector('.wf-chat-history');
    new MutationObserver(function () {
      hist.querySelectorAll('[data-aurea-message]').forEach(function (a) {
        var id = a.getAttribute('data-aurea-message');
        var nova = !!pedido && !mensagensVistas.has(id);
        if (nova) { mensagensVistas.add(id); encerrarEtapas(p); }
        tratarResposta(a, nova);
      });
    }).observe(hist, { childList: true });
    p.addEventListener('click', function (e) {
      var b = e.target.closest('[data-uim-tk]'); if (!b) return;
      var tk = b.dataset.uimTk;
      try {
        if (window.DiarioBuscaGlobal) {
          window.DiarioBuscaGlobal.abrir();
          var q = doc.getElementById('dt949-q');
          if (q) { q.value = tk; q.dispatchEvent(new Event('input', { bubbles: true })); }
        }
      } catch (er) {}
    });
    new MutationObserver(function () { desenharSug(p); }).observe(p, { childList: true });
    prepararMic(p); prepararBarra(p); desenharSug(p);
    hist.querySelectorAll('[data-aurea-message]').forEach(function (a) { mensagensVistas.add(a.getAttribute('data-aurea-message')); tratarResposta(a, false); });
  }
  function iniciar() {
    montarCss();
    var agendado = false;
    new MutationObserver(function () {
      if (agendado) return; agendado = true;
      requestAnimationFrame(function () { agendado = false; var p = painel(); if (p) ligar(p); });
    }).observe(doc.body, { childList: true });
    var p = painel(); if (p) ligar(p);
  }
  window.DiarioAureaUI = Object.freeze({ expandir: expandir, modoConselho: modoConselho, anexarGraficosLivermore: anexarGraficosLivermore, versao: 2 });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
