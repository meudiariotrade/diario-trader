/* v971 — Jornal do Pregão Híbrido:
 * - Manchete principal ganha capa cinematográfica inteligente (WebP real por tema + clima do pregão)
 *   com botão 1-toque para o estúdio de capas compartilháveis (4:5, 1:1, 9:16).
 * - Matérias secundárias ("Mais do dia") ficam limpas (sem banners repetitivos), com selos escaneáveis
 *   de direção (Alta/Baixa/Misto), ativos afetados e destaque automático "★ Na sua carteira".
 * - Novo bloco "Radar da Mesa (30s)" com leitura objetiva de WIN, WDO e DI logo após a manchete.
 */
(function (w, d) {
  'use strict';
  if (w.DiarioJornal561) return;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const nf = (v, dec = 2) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  function getMeusAtivos() {
    const set = new Set();
    try {
      const lista = w.DiarioInteligenciaEtapa1?.meusAtivos?.() || [];
      for (const t of lista) if (t) set.add(String(t).toUpperCase().trim());
    } catch {}
    try {
      const cart = (typeof S !== 'undefined' && S?.carteira) || w.S?.carteira || [];
      for (const p of Array.isArray(cart) ? cart : []) {
        const tk = String(p?.tk || p?.ativo || p?.ticker || '').toUpperCase().trim();
        if (tk) set.add(tk);
      }
    } catch {}
    try {
      const pf = (typeof PF !== 'undefined' && PF?.pos) || w.PF?.pos || [];
      for (const p of Array.isArray(pf) ? pf : []) {
        const tk = String(p?.tk || p?.ativo || '').toUpperCase().trim();
        if (tk) set.add(tk);
      }
    } catch {}
    return set;
  }

  function formatRef(q, fallbackLabel) {
    if (!q || !isFinite(+q.px)) return { px: '', d1: null, nota: fallbackLabel };
    const dec = q.px > 1000 ? 0 : q.px < 10 ? 4 : 2;
    const d1 = isFinite(+q.d1) ? +q.d1 : null;
    const ses = q.dia_referencia ? `Sessão ${String(q.dia_referencia).split('-').reverse().slice(0, 2).join('/')}` : 'Última referência da edição';
    return {
      px: nf(q.px, dec),
      d1,
      nota: `${q.n || fallbackLabel} em ${nf(q.px, dec)}${d1 != null ? ` (${d1 > 0 ? '+' : ''}${nf(d1, 2)}%)` : ''} · ${ses}.`,
    };
  }

  function buildRadarHtml(ed) {
    const cots = ed?.snapshot?.cotacoes || ed?.cotacoes || [];
    const findQ = (re) => cots.find((q) => re.test(String(q?.k || '') + ' ' + String(q?.n || '')));
    const qWin = findQ(/\b(win|ibov)\b|ibovespa/i);
    const qWdo = findQ(/\b(wdo|dolar|usd)\b|d[oó]lar/i);
    const qDi = findQ(/\bdi\d|di\s*jan|juros/i);

    const rm = ed?.radar_mesa || null;
    const refWin = formatRef(qWin, 'Acompanhe abertura do Índice e curva externa.');
    const refWdo = formatRef(qWdo, 'Acompanhe fluxo cambial, DXY e Treasuries.');
    const refDi = formatRef(qDi, 'Acompanhe juros futuros, fiscal e agenda macro.');

    const items = [
      { k: 'WIN', nome: 'Índice', ref: refWin, txt: rm?.win || refWin.nota },
      { k: 'WDO', nome: 'Dólar',  ref: refWdo, txt: rm?.wdo || refWdo.nota },
      { k: 'DI',  nome: 'Juros',  ref: refDi,  txt: rm?.di  || refDi.nota },
    ];
    if (!rm && !qWin && !qWdo && !qDi) return '';

    return `<section class="jr971-radar" aria-label="Radar da Mesa">
      <div class="jr971-rh"><b>Radar da Mesa · 30s</b><span>${rm ? 'Leitura da edição' : 'Referências da edição'}</span></div>
      <div class="jr971-rgrid">${items.map((it) => {
        const d1 = it.ref.d1;
        const cls = d1 == null ? 'neu' : d1 > 0 ? 'up' : d1 < 0 ? 'dn' : 'neu';
        const varTxt = d1 != null ? `${d1 > 0 ? '▲ +' : d1 < 0 ? '▼ ' : ''}${nf(d1, 2)}%` : '';
        return `<div class="jr971-rc"><div class="jr971-rt"><span class="jr971-rk">${it.k}</span><small>${it.nome}</small>${varTxt ? `<i class="${cls}">${varTxt}</i>` : ''}</div><p>${esc(it.txt)}</p></div>`;
      }).join('')}</div>
    </section>`;
  }

  function buildMetaHtml(n, meus, omitDir) {
    const dir = omitDir ? '' : String(n?.impacto?.direcao || '').toLowerCase();
    const ativos = (Array.isArray(n?.impacto?.ativos) ? n.impacto.ativos : []).slice(0, 4);
    const hits = [];
    if (meus.size) {
      for (const a of ativos) {
        const up = String(a).toUpperCase().trim();
        if (meus.has(up) && !hits.includes(up)) hits.push(up);
      }
      if (!hits.length) {
        const txt = String(n?.titulo || '') + ' ' + String(n?.linha_fina || '');
        for (const tk of meus) {
          if (/^[A-Z]{4}\d{1,2}$/.test(tk) && new RegExp('\\b' + tk + '\\b').test(txt)) {
            hits.push(tk);
            if (hits.length >= 2) break;
          }
        }
      }
    }
    if (!dir && !ativos.length && !hits.length) return '';
    const dirTag = dir === 'alta' ? '<span class="jr971-dir up">▲ Alta</span>'
      : dir === 'baixa' ? '<span class="jr971-dir dn">▼ Baixa</span>'
      : dir === 'misto' ? '<span class="jr971-dir neu">◆ Misto</span>' : '';
    const cartTag = hits.length ? `<span class="jr971-cart">★ ${esc(hits.join(' · '))} · Carteira</span>` : '';
    const pills = ativos.filter((a) => !hits.includes(String(a).toUpperCase().trim())).slice(0, 3)
      .map((a) => `<span class="jr971-tk">${esc(a)}</span>`).join('');
    return `<div class="jr971-meta">${cartTag}${dirTag}${pills}</div>`;
  }

  let running = false;
  function aplica() {
    if (running) return;
    const box = d.getElementById('jrbox');
    if (!box) return;
    let ed = null;
    try { ed = (typeof jrVer === 'function' ? jrVer() : null) || (typeof JRN !== 'undefined' ? JRN.v : null); } catch { ed = null; }
    if (!ed || !ed.manchete) return;

    running = true;
    obs.disconnect();
    try {
      const meus = getMeusAtivos();
      const capas = w.DiarioCapas561;

      box.querySelectorAll('.jrart').forEach((art) => {
        const id = (art.id || '').replace('jra-', '');
        const isManchete = id === 'm' || art.classList.contains('jrman');
        const n = isManchete ? ed.manchete : (ed.materias || [])[+id];
        if (!n || !n.titulo) return;

        // Remove banners 3D legados (.jr561-arte) de TODAS as matérias
        art.querySelector(':scope > .jr561-arte')?.remove();

        if (isManchete) {
          const info = capas?.classificar ? capas.classificar(n, ed) : { cena: 'bolsa-cautela', clima: 'cautela', url: 'assets/capas/bolsa-cautela.webp', rotulo: 'Edição do dia' };
          const hKey = `${n.titulo}|${info.cena}|${info.clima}`;
          let hero = art.querySelector(':scope > .jr971-hero');
          if (!hero || hero.dataset.k !== hKey) {
            if (!hero) {
              hero = d.createElement('figure');
              hero.className = 'jr971-hero';
              art.prepend(hero);
            }
            hero.dataset.k = hKey;
            hero.dataset.clima = info.clima;
            const moodLbl = info.clima === 'baixa' ? '▼ Pressão vendedora' : info.clima === 'alta' ? '▲ Ritmo comprador' : '◆ Mercado em cautela';
            const ico = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
            hero.innerHTML = `<img src="${esc(info.url)}" alt="${esc(info.rotulo)}" loading="eager" decoding="async">` +
              `<div class="jr971-hshade" aria-hidden="true"></div>` +
              `<div class="jr971-htop"><span class="jr971-mood ${esc(info.clima)}">${moodLbl}</span><button type="button" class="jr971-cbtn" data-jr971-capa="1" aria-label="Abrir estúdio de capas do Jornal">${ico}<span>Capa</span></button></div>` +
              `<div class="jr971-hbot"><span class="jr971-hscene">${esc(info.rotulo)}</span></div>`;
          }
          // Também aplica selo de carteira + ativos na manchete (sem duplicar direção, já no selo da capa)
          const mHtml = buildMetaHtml(n, meus, true);
          let meta = art.querySelector(':scope > .jr971-meta-wrap');
          if (mHtml) {
            if (!meta || meta.dataset.k !== mHtml) {
              const chap = art.querySelector(':scope > .jrchap');
              if (!meta) { meta = d.createElement('div'); meta.className = 'jr971-meta-wrap'; (chap || hero).after(meta); }
              meta.dataset.k = mHtml;
              meta.innerHTML = mHtml;
            }
          } else if (meta) meta.remove();
        } else {
          // Matéria secundária (Híbrido): ZERO imagem repetitiva, só selos limpos e escaneáveis
          art.querySelector(':scope > .jr971-hero')?.remove();
          const mHtml = buildMetaHtml(n, meus, false);
          let meta = art.querySelector(':scope > .jr971-meta-wrap');
          if (mHtml) {
            if (!meta || meta.dataset.k !== mHtml) {
              const chap = art.querySelector(':scope > .jrchap');
              if (!meta) { meta = d.createElement('div'); meta.className = 'jr971-meta-wrap'; if (chap) chap.after(meta); else art.prepend(meta); }
              meta.dataset.k = mHtml;
              meta.innerHTML = mHtml;
            }
          } else if (meta) meta.remove();
        }
      });

      // Bloco "Radar da Mesa (30s)" logo após a manchete principal
      const manEl = box.querySelector('#jra-m, .jrart.jrman');
      if (manEl) {
        const rHtml = buildRadarHtml(ed);
        let radar = box.querySelector(':scope > .jr971-radar-wrap');
        if (rHtml) {
          if (!radar || radar.dataset.k !== rHtml) {
            if (!radar) { radar = d.createElement('div'); radar.className = 'jr971-radar-wrap'; manEl.after(radar); }
            radar.dataset.k = rHtml;
            radar.innerHTML = rHtml;
          } else if (manEl.nextElementSibling !== radar) {
            manEl.after(radar);
          }
        } else if (radar) radar.remove();
      }

      const cab = box.querySelector('.jrcab');
      if (cab && !cab.querySelector('.jr561-exp')) {
        const exp = d.createElement('div');
        exp.className = 'jr561-exp';
        exp.textContent = 'Diário Trader · edição do dia · não é recomendação de investimento';
        cab.append(exp);
      }
    } finally {
      running = false;
      obs.observe(d.documentElement, { childList: true, subtree: true });
    }
  }

  let t = 0;
  const sched = () => {
    if (running || t || !d.getElementById('jrbox')) return;
    t = setTimeout(() => { t = 0; aplica(); }, 80);
  };
  const obs = new MutationObserver(sched);
  obs.observe(d.documentElement, { childList: true, subtree: true });
  w.addEventListener('diario:render', aplica);
  if (w.TraderUI?.onRender) w.TraderUI.onRender('jornal-v971', { after: aplica });
  if (d.readyState !== 'loading') aplica();
  else d.addEventListener('DOMContentLoaded', aplica, { once: true });

  w.DiarioJornal561 = { aplica };
})(window, document);
