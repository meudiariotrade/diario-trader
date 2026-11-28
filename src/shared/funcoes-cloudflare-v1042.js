/* v1042 — Fase A: chamadas às Edge Functions públicas vão para o Worker da Cloudflare.
 * terminal, mesa-macro, sazonal-extras e finnhub-token rodam no Worker diario-trader (/v1/fn/<nome>)
 * com o mesmo código. O pedido segue igual (método, corpo e o login do usuário, que o Worker valida
 * no Supabase Auth). Só se o Worker falhar (rede, 404 ou 5xx) cai na função antiga do Supabase.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof window.fetch !== 'function' || window.DiarioFuncoesCloudflare) return;
  var HOST = 'vdzwydizostutukppcsj.supabase.co';
  var WORKER = 'https://diario-trader.lucianosilva43567.workers.dev/v1/fn/';
  // Fase B (v1054): o Worker responde 503 enquanto faltar alguma chave; aí o app usa a função antiga.
  var MIGRADAS = new Set(['terminal', 'mesa-macro', 'sazonal-extras', 'finnhub-token',
    'analise', 'resumo', 'revista-ia', 'conhecimento-ia', 'aulas', 'mesa',
    'logos', 'series', 'screener']);
  var anterior = window.fetch.bind(window);

  function alvo(input) {
    try {
      var u = new URL(typeof input === 'string' ? input : input && input.url, location.href);
      if (u.hostname !== HOST) return null;
      var m = /^\/functions\/v1\/([a-z0-9-]+)$/.exec(u.pathname);
      return m && MIGRADAS.has(m[1]) ? { nome: m[1], busca: u.search } : null;
    } catch (e) { return null; }
  }

  window.fetch = function (input, init) {
    var a = alvo(input);
    if (!a) return anterior(input, init);
    var original = input instanceof Request ? input.clone() : null;
    var destino = WORKER + a.nome + a.busca;
    var pedido = input instanceof Request ? new Request(destino, input) : new Request(destino, Object.assign({}, init || {}, { credentials: 'omit' }));
    // v1054: marca a origem da resposta (só no aparelho; não vai para a rede) para o Status do sistema.
    function marca(r, origem) {
      try { var h = new Headers(r.headers); h.set('x-diario-origem', origem); return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h }); }
      catch (e) { return r; }
    }
    function reserva() { return anterior(original || input, init).then(function (r) { return marca(r, 'supabase'); }); }
    return anterior(pedido).then(function (r) {
      if (r.status === 404 || r.status >= 500) return reserva();
      return marca(r, 'cloudflare');
    }, function (erro) {
      if (erro && erro.name === 'AbortError') throw erro;
      return reserva();
    });
  };
  window.DiarioFuncoesCloudflare = Object.freeze({ migradas: Array.from(MIGRADAS), versao: 1054 });
})();
