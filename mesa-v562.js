/* v562 — Jornal do Pregão (Editor-Chefe de mesa proprietária).
   5 seções no topo do Jornal: Capa, Plano do Pregão, Macro, Radar Corporativo, Agenda & Coluna da Mesa.
   Os dados vêm da função "mesa" do Supabase, que reescreve a edição do Jornal já gerada.
   Sem dado → "–". A edição completa continua disponível logo abaixo. */
(function () {
  'use strict';
  var LS = 'diario-mesa562', LS_AB = 'diario-mesa562-completa';
  var M = { v: null, busy: false, err: '', tent: {}, aberta: false };
  try { M.v = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { M.v = null; }
  try { M.aberta = localStorage.getItem(LS_AB) === '1'; } catch (e) { /* sem storage */ }
  var demo = /[?&]demo=1\b/.test(location.search) && !navigator.webdriver;

  var e = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var t = function (s) { var x = String(s == null ? '' : s).trim(); return x ? e(x) : '–'; };
  var nf = function (v, c) { return typeof v === 'number' && isFinite(v) ? v.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }) : '–'; };
  var DEC = { ibov: 0, win: 0, wdo: 1, dolar: 4, dxy: 2, di29: 2, di33: 2, spx: 2, dji: 0, ndq: 0, es: 2, nq: 0, ewz: 2, sgx: 2 };
  var juro = function (k) { return /^di/.test(k); };
  var sinal = function (v) { return typeof v !== 'number' || !isFinite(v) ? '' : v > 0 ? 'up' : v < 0 ? 'dn' : ''; };
  var varTxt = function (k, v) {
    if (typeof v !== 'number' || !isFinite(v)) return '–';
    return (v > 0 ? '+' : '') + nf(v, juro(k) ? 2 : 2) + (juro(k) ? ' p.p.' : '%');
  };
  var tagsH = function (L) {
    if (!L || !L.length) return '';
    return '<span class="m562-tags">' + L.map(function (g) {
      var c = g.s === '+' ? 'up' : g.s === '-' ? 'dn' : 'eq';
      return '<span class="m562-tag ' + c + '">[' + (g.s === '-' ? '−' : e(g.s)) + ' ' + e(g.a) + ']</span>';
    }).join('') + '</span>';
  };

  function cfgSb() {
    try { if (typeof cfg === 'function') { var c = cfg(); if (c && c.url) return c; } } catch (x) { /* sem cfg */ }
    return null;
  }
  function sessao() { try { return typeof SESS !== 'undefined' && SESS && SESS.at ? SESS : null; } catch (x) { return null; } }
  function edAtual() { try { return typeof JRN !== 'undefined' && JRN.v ? JRN.v : null; } catch (x) { return null; } }

  async function carrega(force) {
    if (M.busy) return;
    var c = cfgSb(); if (!c || !sessao()) return;
    M.busy = true; M.err = ''; pinta();
    var ac = new AbortController(), to = setTimeout(function () { ac.abort(); }, 160000);
    try {
      try { if (typeof tok === 'function') await tok(); } catch (x) { /* segue com o token atual */ }
      var ed = edAtual();
      var corpo = { force: !!force };
      if (ed && ed.dia && ed.edicao) corpo.chave = 'jornal:' + ed.dia + ':' + ed.edicao;
      var r = await fetch(c.url + '/functions/v1/mesa', { method: 'POST', signal: ac.signal, headers: { 'Content-Type': 'application/json', apikey: c.key, Authorization: 'Bearer ' + sessao().at }, body: JSON.stringify(corpo) });
      var j = await r.json().catch(function () { return {}; });
      if (r.status === 404 && corpo.chave) { // edição local ainda não está no servidor: pega a mais recente
        r = await fetch(c.url + '/functions/v1/mesa', { method: 'POST', signal: ac.signal, headers: { 'Content-Type': 'application/json', apikey: c.key, Authorization: 'Bearer ' + sessao().at }, body: JSON.stringify({ force: !!force }) });
        j = await r.json().catch(function () { return {}; });
      }
      if (!r.ok || !j.capa) throw new Error(j.erro || ('Erro ' + r.status));
      M.v = j;
      M.err = j.desatualizado ? j.avisoAtualizacao || 'Exibindo a edição salva enquanto a atualização está indisponível.' : '';
      try { localStorage.setItem(LS, JSON.stringify(j)); } catch (x) { /* cheio */ }
    } catch (x) {
      M.err = x && x.name === 'AbortError' ? 'Demorou demais. Tente de novo.' : String((x && x.message) || x);
    } finally { clearTimeout(to); M.busy = false; pinta(); }
  }

  // ---------- seções ----------
  function capa(v) {
    var c = v.capa || {}, cot = (v.cotacoes || []).filter(function (x) { return x && x.k; });
    var ordem = ['ibov', 'win', 'wdo', 'dolar', 'di29', 'di33', 'dxy', 'spx', 'ndq', 'ewz', 'sgx'];
    cot.sort(function (a, b) { return (ordem.indexOf(a.k) + 99) % 99 - (ordem.indexOf(b.k) + 99) % 99; });
    var tab = cot.length ? '<table class="m562-cot"><thead><tr><th>Ativo</th><th>Último</th><th>Var.</th></tr></thead><tbody>' + cot.slice(0, 11).map(function (x) {
      return '<tr><td>' + e(x.n || x.k) + '</td><td class="n">' + nf(x.px, DEC[x.k] == null ? 2 : DEC[x.k]) + '</td><td class="n ' + sinal(x.d1) + '">' + varTxt(x.k, x.d1) + '</td></tr>';
    }).join('') + '</tbody></table>' : '<p class="m562-vazio">Cotações: –</p>';
    var cinco = (c.cinco || []).length ? '<ol class="m562-5">' + c.cinco.map(function (x) { return '<li>' + t(x) + '</li>'; }).join('') + '</ol>' : '<p class="m562-vazio">–</p>';
    return '<section class="m562-sec m562-capa" aria-labelledby="m562-h1">' +
      '<div class="m562-kick"><span>' + t(v.titulo) + '</span><span class="n">' + dataBR(v.dia) + '</span></div>' +
      '<h2 id="m562-h1" class="m562-manchete">' + t(c.manchete) + '</h2>' +
      '<p class="m562-sub">' + t(c.subtitulo) + '</p>' +
      '<p class="m562-pq"><b>Por que importa</b>' + t(c.por_que_importa) + '</p>' +
      '<div class="m562-grid2"><div><h3 class="m562-h">Cotações</h3>' + tab + '</div>' +
      '<div><h3 class="m562-h">5 coisas para saber</h3>' + cinco + '</div></div></section>';
  }
  function escada(n, k) {
    if (!n) return '<div class="m562-esc vazio"><div><span>R2</span><b>–</b></div><div><span>R1</span><b>–</b></div><div class="p"><span>Pivô</span><b>–</b></div><div><span>S1</span><b>–</b></div><div><span>S2</span><b>–</b></div></div>';
    var d = k === 'wdo' ? 1 : 0;
    return '<div class="m562-esc">' + [['R2', n.R2, ''], ['R1', n.R1, ''], ['Pivô', n.P, 'p'], ['S1', n.S1, ''], ['S2', n.S2, '']].map(function (x) {
      return '<div class="' + x[2] + '"><span>' + x[0] + '</span><b>' + nf(x[1], d) + '</b></div>';
    }).join('') + '</div>';
  }
  function plano(v) {
    var P = v.plano || {}, N = v.niveis || {};
    var card = function (k, nome) {
      var p = P[k] || {}, vi = p.vies || '–', cl = vi === 'Alta' ? 'up' : vi === 'Baixa' ? 'dn' : 'eq';
      return '<article class="m562-card"><div class="m562-ct"><h3>' + nome + '</h3><span class="m562-vies ' + cl + '">Viés: ' + e(vi) + '</span></div>' +
        (p.leitura && p.leitura !== '–' ? '<p class="m562-lei">' + t(p.leitura) + '</p>' : '') +
        escada(N[k], k) +
        '<dl class="m562-gat"><div><dt class="up">Gatilho de alta</dt><dd>' + t(p.gatilho_alta) + '</dd></div><div><dt class="dn">Gatilho de baixa</dt><dd>' + t(p.gatilho_baixa) + '</dd></div></dl>' +
        tagsH(p.tags) + '</article>';
    };
    var base = N.win && N.win.base ? 'Pivô clássico da sessão de referência (máx., mín. e fechamento).' : 'Níveis sem dado da sessão de referência.';
    return '<section class="m562-sec"><h2 class="m562-st"><span class="n">2</span>Plano do pregão</h2><div class="m562-grid2">' + card('win', 'Mini índice · WIN') + card('wdo', 'Mini dólar · WDO') + '</div><p class="m562-nota">' + base + '</p></section>';
  }
  function bloco(b) {
    b = b || {};
    return '<article class="m562-card m562-bl"><h3>' + t(b.titulo) + '</h3><p><b>Fato.</b> ' + t(b.fato) + '</p><p><b>Número.</b> <span class="n">' + t(b.numero) + '</span></p><p><b>Impacto.</b> ' + t(b.impacto) + '</p>' + tagsH(b.tags) + '</article>';
  }
  function macro(v) {
    var m = v.macro || {};
    return '<section class="m562-sec"><h2 class="m562-st"><span class="n">3</span>Macro Brasil e exterior</h2><div class="m562-grid2">' + bloco(m.brasil) + bloco(m.exterior) + '</div></section>';
  }
  function radar(v) {
    var r = v.radar || {}, mv = v.movers || {};
    var lista = function (L, tit, cl) {
      return '<div class="m562-mov"><h3 class="m562-h">' + tit + '</h3>' + ((L || []).length ? '<ol>' + L.map(function (x) {
        return '<li><span>' + e(x.tk) + '</span><b class="n ' + cl + '">' + (x.var > 0 ? '+' : '') + nf(x.var, 2) + '%</b></li>';
      }).join('') + '</ol>' : '<p class="m562-vazio">–</p>') + '</div>';
    };
    var pl = r.placar || [];
    var tabela = pl.length ? '<div class="m562-tw"><table class="m562-plac"><thead><tr><th>Empresa</th><th>Receita</th><th>Lucro</th><th>Ebitda</th><th>Leitura</th></tr></thead><tbody>' + pl.map(function (x) {
      var cl = x.leitura === 'Acima' ? 'up' : x.leitura === 'Abaixo' ? 'dn' : '';
      return '<tr><td><b>' + t(x.tk) + '</b></td><td class="n">' + t(x.receita) + '</td><td class="n">' + t(x.lucro) + '</td><td class="n">' + t(x.ebitda) + '</td><td class="' + cl + '">' + t(x.leitura) + '</td></tr>';
    }).join('') + '</tbody></table></div>' + pl.map(function (x) {
      return '<p class="m562-emp"><b>' + t(x.tk) + '.</b> ' + t(x.texto) + ' ' + tagsH(x.tags) + '</p>';
    }).join('') : '<p class="m562-vazio">Sem balanços nesta edição.</p>';
    return '<section class="m562-sec"><h2 class="m562-st"><span class="n">4</span>Radar corporativo</h2>' +
      '<div class="m562-grid2">' + lista(mv.altas, 'Top 5 altas · Ibovespa', 'up') + lista(mv.baixas, 'Top 5 baixas · Ibovespa', 'dn') + '</div>' +
      (r.comentario_movers && r.comentario_movers !== '–' ? '<p class="m562-nota">' + t(r.comentario_movers) + '</p>' : '') +
      '<h3 class="m562-h">Placar de balanços</h3>' + tabela + '</section>';
  }
  function agenda(v) {
    var a = v.agenda || {}, ev = a.eventos || [];
    var tab = ev.length ? '<div class="m562-tw"><table class="m562-ag"><thead><tr><th>Hora</th><th>País</th><th>Evento</th><th>Relevância</th><th>Consenso</th><th>Anterior</th></tr></thead><tbody>' + ev.map(function (x) {
      return '<tr><td class="n">' + t(x.hora) + '</td><td>' + t(x.pais) + '</td><td>' + t(x.evento) + '</td><td><span class="m562-rel ' + (x.relevancia === 'Alta' ? 'a' : 'm') + '">' + t(x.relevancia) + '</span></td><td class="n">' + t(x.consenso) + '</td><td class="n">' + t(x.anterior) + '</td></tr>';
    }).join('') + '</tbody></table></div>' : '<p class="m562-vazio">Agenda: –</p>';
    var corp = (a.corporativos || []).length ? '<ul class="m562-corp">' + a.corporativos.map(function (x) { return '<li>' + t(x) + '</li>'; }).join('') + '</ul>' : '<p class="m562-vazio">–</p>';
    var col = (a.coluna || []).length ? a.coluna.map(function (x) { return '<p>' + t(x) + '</p>'; }).join('') : '<p>–</p>';
    return '<section class="m562-sec"><h2 class="m562-st"><span class="n">5</span>Agenda e coluna da mesa</h2>' + tab +
      '<h3 class="m562-h">Eventos corporativos</h3>' + corp +
      '<div class="m562-col"><h3 class="m562-h">Coluna da mesa</h3>' + col + '</div>' +
      '<blockquote class="m562-psi">' + t(a.psicologia) + '</blockquote>' +
      '<p class="m562-aviso">' + t(v.aviso) + '</p></section>';
  }
  function dataBR(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || '')); return m ? m[3] + '/' + m[2] + '/' + m[1] : '–'; }

  function html() {
    var v = M.v || (demo ? DEMO : null);
    var bar = '<div class="m562-bar">' +
      (demo && !M.v ? '<span class="m562-demo">Exemplo fictício</span>' : '<span></span>') +
      '<button type="button" class="btn s" data-m562="ab" aria-expanded="' + (M.aberta ? 'true' : 'false') + '">' + (M.aberta ? 'Ocultar edição completa' : 'Edição completa') + '</button></div>';
    if (!v) {
      var msg = M.busy ? 'Montando o Jornal do Pregão a partir da edição de hoje…' : M.err ? e(M.err) : sessao() ? 'O Jornal do Pregão aparece aqui assim que a edição do dia estiver pronta.' : 'Entre na sua conta para ver o Jornal do Pregão.';
      return bar + '<p class="m562-estado" role="status">' + msg + '</p>';
    }
    var ed = edAtual(), velha = !!M.v && ed && v.dia && ed.dia && (ed.dia !== v.dia || (ed.edicao && v.edicao && ed.edicao !== v.edicao));
    return bar + (M.err ? '<p class="m562-estado erro" role="alert">' + e(M.err) + '</p>' : '') +
      (velha && !M.busy ? '<p class="m562-estado">Há uma edição mais nova do Jornal. <button type="button" class="lnk" data-m562="rf">Montar agora</button></p>' : '') +
      capa(v) + plano(v) + macro(v) + radar(v) + agenda(v);
  }

  var pintando = false;
  function pinta() {
    var box = document.getElementById('jrbox'); if (!box) return;
    pintando = true;
    var el = box.querySelector(':scope > .m562');
    if (!el) { el = document.createElement('div'); el.className = 'm562'; }
    var cab = box.querySelector(':scope > .jrcab');
    if (cab) { if (cab.nextElementSibling !== el) cab.after(el); } else if (box.firstElementChild !== el) box.insertBefore(el, box.firstChild);
    el.innerHTML = html();
    box.classList.toggle('m562-so', !!(M.v || demo) && !M.aberta);
    pintando = false;
    // dispara a montagem quando a edição local é nova ou não há nada
    var ed = edAtual(), k = ed ? (ed.dia + ':' + (ed.edicao || '')) : 'ultima';
    var precisa = !M.v || (ed && ed.dia && (ed.dia !== M.v.dia || (ed.edicao && M.v.edicao && ed.edicao !== M.v.edicao)));
    if (precisa && sessao() && !M.busy && !M.tent[k] && !navigator.webdriver) { M.tent[k] = 1; setTimeout(function () { carrega(false); }, 0); }
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest && ev.target.closest('[data-m562]'); if (!b) return;
    ev.preventDefault();
    if (b.getAttribute('data-m562') === 'rf') carrega(true);
    else { M.aberta = !M.aberta; try { localStorage.setItem(LS_AB, M.aberta ? '1' : '0'); } catch (x) { /* sem storage */ } pinta(); }
  });

  var tm = 0;
  new MutationObserver(function () {
    if (pintando) return;
    clearTimeout(tm);
    tm = setTimeout(function () {
      var box = document.getElementById('jrbox');
      if (box && !box.querySelector(':scope > .m562')) pinta();
    }, 60);
  }).observe(document.documentElement, { childList: true, subtree: true });

  // exemplo para o modo demonstração (?demo=1): dados fictícios, sinalizados na tela
  var DEMO = {
    titulo: 'Antes da Abertura', dia: '2026-11-11', edicao: 'manha',
    capa: { manchete: 'Exemplo: juros futuros cedem e abrem espaço para o índice', subtitulo: 'Texto fictício para demonstração do layout. Os números abaixo não são de mercado.', por_que_importa: 'Exemplo de frase que explica o efeito no preço.', cinco: ['Item fictício 1', 'Item fictício 2', 'Item fictício 3', 'Item fictício 4', 'Item fictício 5'] },
    cotacoes: [{ k: 'ibov', n: 'Ibovespa', px: 100000, d1: 0.5 }, { k: 'win', n: 'Mini índice (WIN)', px: 101000, d1: 0.4 }, { k: 'wdo', n: 'Dólar futuro (WDO)', px: 5000, d1: -0.3 }, { k: 'di29', n: 'DI jan/29 (%)', px: 12, d1: -0.05 }],
    niveis: { win: { R2: 102000, R1: 101500, P: 101000, S1: 100500, S2: 100000 }, wdo: { R2: 5050, R1: 5025, P: 5000, S1: 4975, S2: 4950 } },
    plano: { win: { vies: 'Alta', leitura: 'Exemplo de leitura.', gatilho_alta: 'Exemplo: acima do R1.', gatilho_baixa: 'Exemplo: abaixo do pivô.', tags: [{ s: '+', a: 'WIN' }] }, wdo: { vies: 'Neutro', leitura: 'Exemplo de leitura.', gatilho_alta: 'Exemplo.', gatilho_baixa: 'Exemplo.', tags: [{ s: '=', a: 'WDO' }] } },
    macro: { brasil: { titulo: 'Fiscal e Banco Central', fato: 'Fato fictício.', numero: '–', impacto: 'Impacto fictício.', tags: [{ s: '-', a: 'DI' }] }, exterior: { titulo: 'EUA e commodities', fato: 'Fato fictício.', numero: '–', impacto: 'Impacto fictício.', tags: [] } },
    movers: { altas: [{ tk: 'AAAA3', var: 3.1 }, { tk: 'BBBB4', var: 2.4 }], baixas: [{ tk: 'CCCC3', var: -2.8 }, { tk: 'DDDD3', var: -1.9 }] },
    radar: { placar: [{ tk: 'AAAA3', receita: '–', lucro: '–', ebitda: '–', leitura: '–', texto: 'Empresa fictícia de exemplo.', tags: [] }], comentario_movers: '–' },
    agenda: { eventos: [{ hora: '10:00', pais: 'BR', evento: 'Evento fictício', relevancia: 'Alta', consenso: '–', anterior: '–' }], corporativos: ['Exemplo fictício'], coluna: ['Parágrafo fictício sobre sentimento.', 'Parágrafo fictício sobre assimetria.'], psicologia: 'Frase fictícia de psicologia do trader.' },
    aviso: 'Exemplo fictício para demonstração. Conteúdo informativo, sem recomendação de compra ou venda.',
  };

  window.DiarioMesa562 = { carrega: carrega, pinta: pinta, estado: function () { return M; } };
})();
