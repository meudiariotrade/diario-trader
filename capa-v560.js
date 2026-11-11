/* v560 — Capa 3D do Diário Trader (abertura do aplicativo).
 * Primeira abertura do dia: a capa espera o toque em "Abrir o diário" (ou Enter).
 * Demais aberturas: o livro abre sozinho em ~1 s. "Pausar movimento" deixa a capa estática
 * (também respeita prefers-reduced-motion). Navegação automatizada (testes) não mostra a capa.
 */
(function (w, d) {
  'use strict';
  if (w.DiarioCapa) return;
  const KEY_DIA = 'dt560-capa-dia', KEY_PARADO = 'dt560-capa-parado';
  const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* armazenamento indisponível */ } };
  const params = new URLSearchParams(w.location.search);
  if (navigator.webdriver || params.get('capa') === '0' || params.has('go')) { w.DiarioCapa = { aberta: false }; return; }

  const hoje = new Date();
  const iso = hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' + String(hoje.getDate()).padStart(2, '0');
  const primeiraDoDia = get(KEY_DIA) !== iso;
  const reduz = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let parado = get(KEY_PARADO) === '1' || reduz;
  const diaAno = Math.floor((hoje - new Date(hoje.getFullYear(), 0, 0)) / 864e5);
  const dataBR = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const romano = n => [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, '');
  const ano = romano(hoje.getFullYear());

  const el = d.createElement('div');
  el.id = 'capa';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Capa do Diário Trader');
  el.innerHTML = `
  <div class="cp-wrap">
    <div class="cp-texto">
      <div class="cp-eyebrow">Diário Trader · segunda tela</div>
      <h1>Cada pregão,<br>escrito à mão<br>e medido em números.</h1>
      <p class="cp-desc">Consulta, mercado, carteira, diário e estudos num só caderno. A execução continua no Profit Pro.</p>
      <div class="cp-acoes">
        <button type="button" class="pri" data-capa-abrir>Abrir o diário</button>
        <button type="button" data-capa-mov aria-pressed="false">Pausar movimento</button>
      </div>
      <div class="cp-meta"><span>${dataBR}</span><span>v560</span></div>
    </div>
    <div class="cp-cena" aria-hidden="true">
      <div class="cp-livro">
        <div class="cp-sombra"></div>
        <div class="cp-verso cp-couro cp-face"></div>
        <div class="cp-lombada cp-couro"><span class="cp-ouro">DIÁRIO TRADER · ${ano}</span></div>
        <div class="cp-folhas-d"></div><div class="cp-folhas-t"></div><div class="cp-folhas-b"></div>
        <div class="cp-pagina">
          <p class="t">Plano do dia — ${dataBR}</p>
          <div class="m">Stop definido antes de entrar.<br>Respeitar o limite de entradas.<br>Registrar cada trade com foto.<br>Revisar ao fechar o pregão.</div>
          <div class="c">PÁG. ${String(diaAno).padStart(3, '0')}</div>
        </div>
        <div class="cp-frente">
          <div class="cp-fora cp-couro cp-face">
            <div class="cp-marca">
              <div class="sub">Caderno de operações</div>
              <div class="t1 cp-ouro">DIÁRIO</div>
              <div class="fio"></div>
              <div class="t2 cp-ouro">TRADER</div>
            </div>
            <svg class="mono" width="44" height="44" viewBox="0 0 46 46" aria-hidden="true"><defs><linearGradient id="cpg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#8d6c33"/><stop offset=".45" stop-color="#ecd29a"/><stop offset="1" stop-color="#9d7a3a"/></linearGradient></defs><rect x="3" y="3" width="40" height="40" fill="none" stroke="url(#cpg)" stroke-width="1" transform="rotate(45 23 23)" opacity=".8"/><path d="M13 31 L19 24 L24 27 L33 15" fill="none" stroke="url(#cpg)" stroke-width="1.6"/></svg>
            <div class="ano">${ano}</div>
            <div class="cp-elastico"></div>
          </div>
          <div class="cp-forro cp-face"></div>
        </div>
        <div class="cp-fita"></div>
        <div class="cp-caneta"></div>
      </div>
    </div>
  </div>`;

  const livro = el.querySelector('.cp-livro'), mov = el.querySelector('[data-capa-mov]'), abrirBtn = el.querySelector('[data-capa-abrir]');
  const aplicaMov = () => { el.classList.toggle('parado', parado); mov.textContent = parado ? 'Retomar movimento' : 'Pausar movimento'; mov.setAttribute('aria-pressed', String(parado)); };
  let aberta = true, foco = null;
  function abrir() {
    if (!aberta) return; aberta = false;
    set(KEY_DIA, iso);
    livro.classList.add('aberto'); livro.style.setProperty('--ry', '-8deg'); livro.style.setProperty('--rx', '4deg');
    setTimeout(() => {
      el.classList.add('sai');
      d.removeEventListener('keydown', tecla, true);
      setTimeout(() => { el.remove(); try { (foco && foco.isConnected ? foco : d.querySelector('#app button, #app a'))?.focus({ preventScroll: true }); } catch { } }, 520);
      w.dispatchEvent(new CustomEvent('diario:capa-aberta'));
    }, parado ? 120 : 1150);
  }
  function tecla(e) {
    if (!aberta) return;
    if (e.key === 'Enter' && e.target !== mov) { e.preventDefault(); abrir(); }
    else if (e.key === 'Escape') { e.preventDefault(); abrir(); }
    else if (e.key === 'Tab') { // mantém o foco dentro da capa
      const f = [abrirBtn, mov]; const i = f.indexOf(d.activeElement);
      e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
    }
  }
  abrirBtn.addEventListener('click', abrir);
  mov.addEventListener('click', () => { parado = !parado; set(KEY_PARADO, parado ? '1' : '0'); aplicaMov(); if (parado) { livro.style.removeProperty('--rx'); livro.style.removeProperty('--ry'); } });
  const cena = el.querySelector('.cp-cena');
  const fino = w.matchMedia && w.matchMedia('(pointer:fine)').matches;
  cena.addEventListener('pointermove', e => {
    if (parado || !fino || !aberta) return;
    const r = cena.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    livro.style.setProperty('--ry', (-30 + x * 22) + 'deg'); livro.style.setProperty('--rx', (9 - y * 12) + 'deg');
  });
  cena.addEventListener('pointerleave', () => { livro.style.removeProperty('--rx'); livro.style.removeProperty('--ry'); });

  function monta() {
    aplicaMov();
    foco = d.activeElement;
    d.body.prepend(el);
    d.addEventListener('keydown', tecla, true);
    abrirBtn.focus({ preventScroll: true });
    if (!primeiraDoDia) setTimeout(abrir, parado ? 350 : 700);
  }
  if (d.body) monta(); else d.addEventListener('DOMContentLoaded', monta, { once: true });
  w.DiarioCapa = { get aberta() { return aberta; }, abrir, mostrar() { if (!d.getElementById('capa')) { aberta = true; livro.classList.remove('aberto'); el.classList.remove('sai'); monta(); } } };
})(window, document);
