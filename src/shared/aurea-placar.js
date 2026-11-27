/* v1048 — Placar da Áurea: guarda no aparelho o gatilho e a invalidação de cada veredito
 * e confere depois, com o histórico diário já carregado, qual dos dois o preço atingiu primeiro.
 * Nada vai para o servidor; não há polling (só confere quando o ativo é consultado de novo). */
(function () {
  "use strict";
  const LIMITE = 120, PRAZO_DIAS = 60;
  const chave = () => {
    let dono = "anon";
    try { dono = (typeof syncOwner === "function" && syncOwner()) || "anon"; } catch {}
    return "aurea_placar_v1048:" + dono;
  };
  const ler = () => { try { const v = JSON.parse(localStorage.getItem(chave()) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
  const salvar = (l) => { try { localStorage.setItem(chave(), JSON.stringify(l.slice(-LIMITE))); } catch {} };

  function registrar(resposta, lente, dossie) {
    const v = resposta && resposta.veredito;
    if (!v || !dossie || !["alta", "baixa"].includes(v.direcao)) return;
    const g = Number(v.gatilho_preco), inv = Number(v.invalidacao_preco), p = Number(dossie.fechamento);
    if (!(g > 0 && inv > 0 && p > 0)) return;
    // Gatilho e invalidação precisam estar em lados opostos coerentes com a direção.
    if (v.direcao === "alta" ? !(g > inv) : !(g < inv)) return;
    const l = ler();
    if (l.some((x) => x.ticker === dossie.ticker && x.lente === lente && x.em === dossie.data && x.status === "aberto")) return;
    l.push({ id: Date.now().toString(36), ticker: dossie.ticker, lente: lente || "conselho", em: dossie.data, preco: p, direcao: v.direcao, gatilho: g, invalidacao: inv, status: "aberto" });
    salvar(l);
  }

  function avaliar(ticker, rows) {
    if (!Array.isArray(rows) || !rows.length) return;
    const l = ler();
    let mudou = false;
    const hoje = Date.now();
    for (const x of l) {
      if (x.status !== "aberto" || x.ticker !== ticker) continue;
      const desde = Date.parse(x.em + "T23:59:59Z");
      for (const r of rows) {
        if (!Array.isArray(r) || r[0] * 1000 <= desde) continue;
        const h = r[2], lo = r[3];
        const bateu = x.direcao === "alta" ? h >= x.gatilho : lo <= x.gatilho;
        const invalidou = x.direcao === "alta" ? lo <= x.invalidacao : h >= x.invalidacao;
        // Barra que toca os dois lados não define quem veio primeiro.
        if (bateu && invalidou) { x.status = "indefinido"; x.ate = new Date(r[0] * 1000).toISOString().slice(0, 10); mudou = true; break; }
        if (bateu || invalidou) { x.status = bateu ? "acerto" : "erro"; x.ate = new Date(r[0] * 1000).toISOString().slice(0, 10); mudou = true; break; }
      }
      if (x.status === "aberto" && hoje - desde > PRAZO_DIAS * 864e5) { x.status = "sem_desfecho"; mudou = true; }
    }
    if (mudou) salvar(l);
  }

  function resumo(lente) {
    const l = ler().filter((x) => !lente || x.lente === lente);
    const ac = l.filter((x) => x.status === "acerto").length, er = l.filter((x) => x.status === "erro").length;
    return { acertos: ac, erros: er, abertos: l.filter((x) => x.status === "aberto").length, total: l.length };
  }

  window.DiarioPlacarAurea = Object.freeze({ registrar, avaliar, resumo });
})();
