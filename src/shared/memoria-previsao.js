/* v811 — Memória "previsto × ocorrido" do Termômetro de Abertura Teórica.
   Antes da abertura guarda a leitura teórica (WIN/WDO) com os insumos usados.
   Depois do fechamento guarda a variação observada do mesmo dia e compara SÓ a direção.
   Regras: leitura neutra (|x| < 0,15%), dado ausente ou de outra data = inconclusivo.
   Nada vai para o Supabase: fica no aparelho (localStorage), no máximo 40 sessões. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DiarioMemoriaPrevisao = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  const KEY = 'diario-previsao-v811';
  const NEUTRO = 0.15;
  const ok = (x) => typeof x === 'number' && Number.isFinite(x);
  const pct = (x) => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
  const dir = (x) => (!ok(x) ? null : Math.abs(x) < NEUTRO ? 'neutro' : x > 0 ? 'alta' : 'queda');

  function memoria(storage) {
    const s = storage || root.localStorage;
    return {
      ler() { try { const v = JSON.parse(s.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; } },
      gravar(v) {
        try {
          const datas = Object.keys(v).sort().slice(-40);
          const out = {}; for (const d of datas) out[d] = v[d];
          s.setItem(KEY, JSON.stringify(out));
        } catch { /* armazenamento indisponível: sem memória, sem erro */ }
      },
    };
  }

  /* Leitura teórica de antes da abertura. Não sobrescreve a primeira leitura da sessão. */
  function registrarPrevisao(sessao, leitura, agora, storage) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(sessao || '')) || !leitura) return null;
    if (!ok(leitura.winPct) && !ok(leitura.wdoPct)) return null;
    const m = memoria(storage), v = m.ler();
    if (v[sessao]?.previsao) return v[sessao];
    v[sessao] = { ...(v[sessao] || {}), previsao: {
      em: new Date(agora || Date.now()).toISOString(),
      winPct: ok(leitura.winPct) ? leitura.winPct : null,
      wdoPct: ok(leitura.wdoPct) ? leitura.wdoPct : null,
      insumos: { ewz: leitura.ewz ?? null, spf: leitura.spf ?? null, wti: leitura.wti ?? null, dxy: leitura.dxy ?? null, zar: leitura.zar ?? null, mxn: leitura.mxn ?? null },
    } };
    m.gravar(v);
    return v[sessao];
  }

  /* Variação observada no fechamento. Só aceita dado com horário do próprio dia da sessão. */
  function registrarFechamento(sessao, obs, storage) {
    if (!obs || (!ok(obs.win) && !ok(obs.wdo))) return null;
    const dia = String(obs.em || '').slice(0, 10);
    if (dia !== sessao) return null;
    const m = memoria(storage), v = m.ler();
    if (!v[sessao]) return null; // sem previsão salva não há o que comparar
    v[sessao].observado = { em: obs.em, win: ok(obs.win) ? obs.win : null, wdo: ok(obs.wdo) ? obs.wdo : null, fonte: obs.fonte || '' };
    m.gravar(v);
    return v[sessao];
  }

  function compara(nome, previsto, ocorrido) {
    const p = dir(previsto), o = dir(ocorrido);
    if (p == null) return { nome, previsto: 'Sem leitura teórica', ocorrido: ok(ocorrido) ? pct(ocorrido) : 'Dados insuficientes', resultado: 'inconclusivo', porque: 'Faltaram insumos na leitura de antes da abertura.' };
    if (o == null) return { nome, previsto: p + ' ' + pct(previsto), ocorrido: 'Dados insuficientes', resultado: 'inconclusivo', porque: 'Sem variação de fechamento datada desta sessão.' };
    if (p === 'neutro') return { nome, previsto: 'neutro ' + pct(previsto), ocorrido: o + ' ' + pct(ocorrido), resultado: 'inconclusivo', porque: 'Leitura teórica perto de zero não indica direção.' };
    if (o === 'neutro') return { nome, previsto: p + ' ' + pct(previsto), ocorrido: 'estável ' + pct(ocorrido), resultado: 'inconclusivo', porque: 'O dia fechou praticamente estável.' };
    return { nome, previsto: p + ' ' + pct(previsto), ocorrido: o + ' ' + pct(ocorrido), resultado: p === o ? 'direção confirmada' : 'direção contrária',
      porque: p === o ? 'O fechamento seguiu a direção dos referenciais externos.' : 'O pregão local se afastou dos referenciais externos; procure o motivo nas notícias e na agenda do dia.' };
  }

  function avaliar(registro) {
    if (!registro || !registro.previsao) return null;
    const p = registro.previsao, o = registro.observado || {};
    const ins = p.insumos || {};
    const usados = [['EWZ', ins.ewz], ['S&P fut.', ins.spf], ['WTI', ins.wti], ['DXY', ins.dxy]].filter(([, v]) => ok(v)).map(([n, v]) => n + ' ' + pct(v));
    return {
      leituraEm: p.em,
      fechamentoEm: o.em || null,
      itens: [compara('WIN', p.winPct, o.win), compara('WDO', p.wdoPct, o.wdo)],
      insumos: usados,
      aviso: 'Comparação apenas de direção. O termômetro é teórico (pesos fixos de referências externas), não previsão de preço nem recomendação.',
    };
  }

  function historico(storage) {
    const v = memoria(storage).ler();
    const linhas = Object.keys(v).sort().map((d) => ({ d, a: avaliar(v[d]) })).filter((x) => x.a);
    let conf = 0, contra = 0, inc = 0;
    for (const x of linhas) for (const i of x.a.itens) i.resultado === 'direção confirmada' ? conf++ : i.resultado === 'direção contrária' ? contra++ : inc++;
    return { sessoes: linhas.length, confirmadas: conf, contrarias: contra, inconclusivas: inc };
  }

  return { registrarPrevisao, registrarFechamento, avaliar, historico, ler: (s) => memoria(s).ler(), KEY, NEUTRO };
});
