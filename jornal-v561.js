/* v561 — Jornal do Pregão repaginado: cada matéria ganha a arte 3D do seu tema (mesma câmera e luz
 * das capas) no lugar da ilustração genérica; o cabeçalho vira um expediente editorial.
 * Só apresentação: textos, ordem das matérias e botões continuam os do Jornal. */
(function (w, d) {
  'use strict';
  if (w.DiarioJornal561) return;
  const cache = new Map();
  function arte(n) {
    const k = n.titulo; if (cache.has(k)) return cache.get(k);
    const cv = w.DiarioCapas561 && w.DiarioCapas561.arte(n, 1200, 480); const u = cv ? cv.toDataURL('image/jpeg', .86) : null;
    if (u) cache.set(k, u); return u;
  }
  function aplica() {
    const box = d.getElementById('jrbox'); if (!box || !w.DiarioCapas561) return;
    let ed = null; try { ed = JRN.v; } catch { ed = null; } if (!ed) return;
    box.querySelectorAll('.jrart').forEach(art => {
      const id = (art.id || '').replace('jra-', ''); const n = id === 'm' ? ed.manchete : (ed.materias || [])[+id]; if (!n || !n.titulo) return;
      let fig = art.querySelector(':scope > .jr561-arte');
      if (fig && fig.dataset.k === n.titulo) return;
      const u = arte(n); if (!u) return;
      if (!fig) { fig = d.createElement('figure'); fig.className = 'jr561-arte'; fig.setAttribute('aria-hidden', 'true'); fig.append(Object.assign(d.createElement('img'), { alt: '', width: 1200, height: 480 })); art.prepend(fig); }
      fig.dataset.k = n.titulo; fig.firstChild.src = u;
    });
    const cab = box.querySelector('.jrcab'); if (cab && !cab.querySelector('.jr561-exp')) {
      const exp = d.createElement('div'); exp.className = 'jr561-exp'; exp.textContent = 'Diário Trader · edição do dia · não é recomendação de investimento'; cab.append(exp);
    }
  }
  let t = 0;
  new MutationObserver(() => { if (t || !d.getElementById('jrbox')) return; t = setTimeout(() => { t = 0; aplica(); }, 120); }).observe(d.documentElement, { childList: true, subtree: true });
  w.DiarioJornal561 = { aplica };
})(window, document);
