/* v842 — Atalhos do iPhone (Panorama no WhatsApp às 07:00 e 18:30, alerta do checklist e notas por e-mail).
   Depois da troca de projeto do Supabase (16/11) o link antigo dos Atalhos parou de funcionar: o token pessoal
   só existe como hash no banco e o app não tinha onde gerar um novo. Este cartão, em Configurações, gera o token
   (RPC atalhos_gerar_token, protegida por login e RLS), mostra os links prontos para colar no app Atalhos e o
   último uso registrado. O token aparece uma única vez; gerar outro invalida o anterior. Sem polling. */
(function (w) {
  'use strict';
  const d = w.document;
  const st = { token: '', uso: undefined, busy: false, erro: '' };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const conf = () => { try { return typeof cfg === 'function' ? cfg() : null; } catch (_) { return null; } };
  const sessao = () => { try { return typeof SESS !== 'undefined' && SESS && SESS.uid ? SESS : null; } catch (_) { return null; } };
  function links(tk) {
    const c = conf(); if (!c?.url || !tk) return [];
    const b = String(c.url).replace(/\/$/, '') + '/functions/v1/';
    return [
      ['Panorama das 07:00 (WhatsApp)', b + 'daily-panorama?token=' + tk + '&turno=manha'],
      ['Panorama das 18:30 (WhatsApp)', b + 'daily-panorama?token=' + tk + '&turno=fechamento'],
      ['Alerta do checklist (08:40)', b + 'check-morning-status?token=' + tk],
      ['Nota de corretagem (compartilhar PDF)', b + 'inbound-btg-note?token=' + tk],
    ];
  }
  async function ultimoUso() {
    if (!sessao() || typeof rq !== 'function') return;
    try {
      const r = await rq('/rest/v1/atalhos_tokens?select=criado_em,usado_em&user_id=eq.' + encodeURIComponent(sessao().uid));
      const j = await r.json(); st.uso = Array.isArray(j) && j[0] ? j[0] : null;
    } catch (_) { st.uso = null; }
    pinta();
  }
  async function gerar() {
    if (st.busy) return;
    if (!sessao()) { st.erro = 'Entre na sua conta para gerar o link.'; return pinta(); }
    if (st.uso && !confirm('Gerar um novo link? O link antigo dos Atalhos deixa de funcionar.')) return;
    st.busy = true; st.erro = ''; pinta();
    try {
      const r = await rq('/rest/v1/rpc/atalhos_gerar_token', { method: 'POST', body: '{}' });
      const tk = await r.json();
      if (typeof tk !== 'string' || !/^[0-9a-f]{48}$/.test(tk)) throw new Error('Resposta inesperada do servidor.');
      st.token = tk; st.uso = { criado_em: new Date().toISOString(), usado_em: null };
    } catch (e) { st.erro = 'Não foi possível gerar: ' + String(e?.message || e).slice(0, 120); }
    st.busy = false; pinta();
  }
  const dt = (x) => x ? new Date(x).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'nunca';
  function html() {
    const L = links(st.token);
    return '<header class="atl842-h"><div><h3>Atalhos do iPhone · WhatsApp</h3><p>Panorama às 07:00 e 18:30, alerta do checklist e envio de notas. Gere o link e cole no app Atalhos, na ação "Obter conteúdo do URL".</p></div>' +
      '<button type="button" class="btn s" data-atl842-gerar' + (st.busy ? ' disabled' : '') + '>' + (st.busy ? 'Gerando…' : st.uso ? 'Gerar novo link' : 'Gerar link') + '</button></header>' +
      (st.uso !== undefined ? '<p class="atl842-uso">' + (st.uso ? 'Link criado em ' + dt(st.uso.criado_em) + ' · último uso pelo iPhone: <b class="' + (st.uso.usado_em ? 'ok' : 'neg') + '">' + dt(st.uso.usado_em) + '</b>' : 'Nenhum link gerado nesta conta.') + '</p>' : '') +
      (st.uso && !st.uso.usado_em && !st.token ? '<p class="atl842-aviso">O iPhone ainda não usou o link desta conta. Se o WhatsApp recebe só uma mensagem de erro, o Atalho está com o endereço antigo: gere um link novo e troque nas automações.</p>' : '') +
      (st.erro ? '<p class="atl842-aviso">' + esc(st.erro) + '</p>' : '') +
      (L.length ? '<p class="atl842-aviso">Copie agora: por segurança o link completo só aparece desta vez.</p><div class="atl842-lista">' + L.map(([n, u]) => '<div class="atl842-it"><b>' + esc(n) + '</b><code>' + esc(u) + '</code><button type="button" class="btn s" data-atl842-copiar="' + esc(u) + '">Copiar</button></div>').join('') + '</div>' +
        '<ol class="atl842-passos"><li>Abra o app Atalhos → Automação → a das 07:00.</li><li>Na ação "Obter conteúdo do URL", troque o endereço pelo link copiado.</li><li>Repita na das 18:30 e na do checklist.</li><li>Toque em ▶ para testar: a imagem do Panorama deve chegar no WhatsApp.</li></ol>' : '');
  }
  function pinta() { const el = d.getElementById('atl842'); if (el) el.innerHTML = html(); }
  function montar() {
    const host = d.querySelector('#app .dt395-native-mais'); if (!host || d.getElementById('atl842')) return;
    const sec = d.createElement('section'); sec.id = 'atl842'; sec.className = 'card atl842';
    const ref = host.querySelector('#dt414-settings'); ref ? ref.after(sec) : host.appendChild(sec);
    sec.innerHTML = html();
    if (st.uso === undefined) ultimoUso();
  }
  d.addEventListener('click', async (e) => {
    const g = e.target.closest?.('[data-atl842-gerar]'); if (g) { e.preventDefault(); return gerar(); }
    const c = e.target.closest?.('[data-atl842-copiar]');
    if (c) { e.preventDefault(); try { await navigator.clipboard.writeText(c.dataset.atl842Copiar); c.textContent = 'Copiado'; } catch (_) { c.textContent = 'Copie manualmente'; } }
  });
  let agendado = false;
  const obs = new MutationObserver(() => { if (agendado) return; agendado = true; queueMicrotask(() => { agendado = false; montar(); }); });
  const liga = () => { const app = d.getElementById('app'); if (app) { obs.observe(app, { childList: true, subtree: true }); montar(); } };
  d.readyState === 'loading' ? d.addEventListener('DOMContentLoaded', liga) : liga();
  w.DiarioAtalhosIphone = Object.freeze({ montar, links });
})(window);
