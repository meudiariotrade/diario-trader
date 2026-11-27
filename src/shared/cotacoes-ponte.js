/* v1039 — Leitura única e incremental das cotações da ponte do Profit (tabela cotacoes).
 * Antes: Início (3 s), Terminal (2,5 s) e Mercado (15 s) liam a tabela inteira cada um,
 * com todas as colunas (~50 kB por leitura) → ~120 MB/h de egress com as telas abertas.
 * Agora: um cache só, compartilhado pelas telas:
 *  - só as 11 colunas usadas;
 *  - depois da 1ª carga, pede apenas as linhas alteradas (updated_at > última vista);
 *  - no máximo 1 leitura a cada 15 s no pregão (seg–sex 09:00–18:30, Brasília) e a cada 10 min fora dele;
 *  - aba escondida não consulta; pedidos simultâneos viram um só; recarga completa a cada 30 min.
 * Sem timers próprios: só lê quando uma tela pede.
 */
(function (root) {
  'use strict';
  if (root.DiarioCotacoesPonte) return;
  var COLS = 'ticker,ult,var,hor,dat,abe,max,min,fec,neg,updated_at';
  var mapa = new Map(), dono = null, ultimaMarca = '', ts = 0, cheio = 0, voo = null;

  function noPregao() {
    try {
      var p = {};
      new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      var m = +p.hour * 60 + +p.minute;
      return p.weekday !== 'Sat' && p.weekday !== 'Sun' && m >= 540 && m < 1110;
    } catch (e) { return true; }
  }
  function sessao() { try { return typeof SESS !== 'undefined' && SESS && SESS.uid ? SESS : null; } catch (e) { return null; } }
  function linhas() { return Array.from(mapa.values()); }
  function validade() { return noPregao() ? 15e3 : 10 * 6e4; }

  async function buscar(s) {
    if (dono !== s.uid) { mapa.clear(); ultimaMarca = ''; cheio = 0; dono = s.uid; }
    var completo = !ultimaMarca || Date.now() - cheio > 30 * 6e4;
    var url = '/rest/v1/cotacoes?select=' + COLS + '&user_id=eq.' + encodeURIComponent(s.uid) +
      (completo ? '' : '&updated_at=gt.' + encodeURIComponent(ultimaMarca));
    var r = await rq(url);
    if (!r.ok) throw new Error('Ponte do Profit: HTTP ' + r.status);
    var lista = await r.json();
    if (!Array.isArray(lista)) throw new Error('Ponte do Profit: resposta inválida');
    if (dono !== s.uid) return linhas(); /* trocou de conta no meio da leitura */
    if (completo) { mapa.clear(); cheio = Date.now(); }
    lista.forEach(function (l) {
      var tk = String(l.ticker || '').toUpperCase();
      if (!tk) return;
      mapa.set(tk, l);
      if (l.updated_at && String(l.updated_at) > ultimaMarca) ultimaMarca = String(l.updated_at);
    });
    ts = Date.now();
    return linhas();
  }

  /* Devolve todas as linhas conhecidas (mesmo formato da tabela). forcar ignora a validade, não a aba escondida. */
  function ler(opcoes) {
    var s = sessao();
    if (!s || typeof rq !== 'function') return Promise.resolve([]);
    var forcar = opcoes && opcoes.forcar;
    if (dono === s.uid && ts && (!forcar && Date.now() - ts < validade() || (typeof document !== 'undefined' && document.hidden)))
      return Promise.resolve(linhas());
    if (voo) return voo;
    voo = buscar(s).finally(function () { voo = null; });
    return voo;
  }

  root.DiarioCotacoesPonte = Object.freeze({
    ler: ler,
    linhas: linhas,
    info: function () { return { ts: ts, n: mapa.size, ultimaMarca: ultimaMarca, pregao: noPregao(), validadeMs: validade() }; }
  });
})(typeof window !== 'undefined' ? window : globalThis);
