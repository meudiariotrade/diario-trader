/* v1054 (Etapa 7) — "Onde você ganha e onde perde".
 * Lê os mesmos registros do Dashboard (dshTodas: v = resultado em R$, r = múltiplo de R,
 * setup, emo, h = hora de entrada, d = data, at = ativo, ok = seguiu as regras) e aponta
 * os grupos que mais somam e os que mais tiram dinheiro. Só leitura; nada é salvo nem enviado.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || window.DiarioOndeGanho) return;

  var MIN = 3; // grupos com menos trades não entram (evita conclusão por acaso)
  var EMO = { calmo: 'Calmo', focado: 'Focado', ansioso: 'Ansioso', cansado: 'Cansado', euforico: 'Eufórico', medo: 'Com medo', raiva: 'Com raiva', fomo: 'FOMO' };
  var DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  function dimensoes(t) {
    var out = [];
    if (t.setup && t.setup !== 'Sem setup') out.push(['Setup', t.setup]);
    if (t.emo) out.push(['Emoção', EMO[t.emo] || t.emo]);
    if (t.h != null && isFinite(t.h)) out.push(['Horário', String(t.h).padStart(2, '0') + 'h–' + String(t.h + 1).padStart(2, '0') + 'h']);
    if (/^\d{4}-\d{2}-\d{2}$/.test(t.d || '')) out.push(['Dia', DIAS[new Date(t.d + 'T12:00:00Z').getUTCDay()]]);
    if (t.at && t.at !== '?') out.push(['Ativo', t.at]);
    if (typeof t.ok === 'boolean') out.push(['Regras', t.ok ? 'Seguiu as regras' : 'Quebrou as regras']);
    return out;
  }

  function analisar(registros) {
    var lista = (Array.isArray(registros) ? registros : []).filter(function (t) { return t && isFinite(t.v); });
    var grupos = new Map();
    lista.forEach(function (t) {
      dimensoes(t).forEach(function (par) {
        var chave = par[0] + '\u0000' + par[1];
        var g = grupos.get(chave) || { tipo: par[0], nome: par[1], n: 0, v: 0, ganhos: 0, rs: [] };
        g.n++; g.v += +t.v; if (+t.v > 0) g.ganhos++; if (t.r != null && isFinite(t.r)) g.rs.push(+t.r);
        grupos.set(chave, g);
      });
    });
    var validos = Array.from(grupos.values()).filter(function (g) { return g.n >= MIN; }).map(function (g) {
      return { tipo: g.tipo, nome: g.nome, n: g.n, v: g.v, acerto: g.ganhos / g.n, rMedio: g.rs.length ? g.rs.reduce(function (a, b) { return a + b; }, 0) / g.rs.length : null };
    });
    var ganha = validos.filter(function (g) { return g.v > 0; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 3);
    var perde = validos.filter(function (g) { return g.v < 0; }).sort(function (a, b) { return a.v - b.v; }).slice(0, 3);
    return { total: lista.length, ganha: ganha, perde: perde };
  }

  var brl = function (v) { return (v < 0 ? '−' : '+') + 'R$ ' + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  function linha(g) {
    var r = g.rMedio == null ? '' : ' · ' + g.rMedio.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'R';
    return '<li><span class="og-tipo">' + esc(g.tipo) + '</span><b>' + esc(g.nome) + '</b>' +
      '<small>' + g.n + ' trades · ' + Math.round(g.acerto * 100) + '% de acerto' + r + '</small>' +
      '<em class="' + (g.v >= 0 ? 'g' : 'r') + '">' + brl(g.v) + '</em></li>';
  }

  function html(registros) {
    var a = analisar(registros);
    if (a.total < MIN) return '';
    var vazio = '<li class="og-vazio">Ainda sem um grupo com ' + MIN + '+ trades aqui.</li>';
    return '<section class="v4-card og1054" aria-label="Onde você ganha e onde perde">' +
      '<header><h2>Onde você ganha e onde perde</h2><small>' + a.total + ' trades no período · grupos com ' + MIN + '+ trades</small></header>' +
      '<div class="og-cols"><div><h3 class="g">Onde você ganha</h3><ol>' + (a.ganha.map(linha).join('') || vazio) + '</ol></div>' +
      '<div><h3 class="r">Onde você perde</h3><ol>' + (a.perde.map(linha).join('') || vazio) + '</ol></div></div></section>';
  }

  window.DiarioOndeGanho = Object.freeze({ analisar: analisar, html: html, minimo: MIN, versao: 1054 });
})();
