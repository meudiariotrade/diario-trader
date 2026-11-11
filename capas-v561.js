/* v561 — Capas inteligentes do Jornal do Pregão (identidade Terminal Grafite).
 * Lê a edição do dia (manchete + matérias) e as cotações do app, escolhe o tema de cada notícia
 * (petróleo, juros, dólar, minério/aço, balanços, cripto, EUA, bolsa) e monta uma composição própria
 * com um objeto 3D desenhado em metal escovado e vidro fumê — mesma câmera e mesma luz em todos.
 * Formatos recompostos (não esticados): 4:5 (feed), 1:1 e 9:16 (stories). Opção de ocultar valores
 * pessoais em "Meu fechamento". Os dados financeiros nunca são desenhados em perspectiva.
 */
(function (root, d) {
  'use strict';
  if (root.DiarioCapas561) return;
  const g = (f, v) => { try { const x = f(); return x === undefined ? v : x; } catch { return v; } };
  const FMT = { feed: [1080, 1350, '4:5'], quad: [1080, 1080, '1:1'], story: [1080, 1920, '9:16'] };
  const C = { bg0: '#0b0c0e', bg1: '#141619', tx: '#ede9e1', tx2: '#a9a59c', tx3: '#7d7a73', amb: '#c9a15b', ambHi: '#e8cd92', up: '#3fb97c', dn: '#e8634f', line: 'rgba(255,255,255,.10)' };
  const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"DejaVu Serif",serif';
  const SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
  const MONO = 'ui-monospace,"SF Mono",Menlo,Consolas,"DejaVu Sans Mono",monospace';
  const nf = (v, c) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  const pct = v => v == null || !isFinite(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 2) + '%';
  const hoje = () => new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });

  /* ---------------- dados ---------------- */
  const ATIVOS = [['^BVSP', 'Ibovespa', 0], ['BRL=X', 'Dólar', 4], ['BZ=F', 'Petróleo Brent', 2], ['CL=F', 'Petróleo WTI', 2], ['TIO=F', 'Minério', 2], ['GC=F', 'Ouro', 0],
    ['^GSPC', 'S&P 500', 0], ['^IXIC', 'Nasdaq', 0], ['ES=F', 'S&P futuro', 0], ['NQ=F', 'Nasdaq futuro', 0], ['DX-Y.NYB', 'DXY', 2], ['BTC-USD', 'Bitcoin', 0], ['^N225', 'Nikkei', 0], ['^GDAXI', 'DAX', 0]];
  const cot = () => ATIVOS.map(([s, n, c]) => { const q = g(() => root.imgQ ? root.imgQ(s) : null, null); return q && isFinite(+q.px) ? { s, n, c, px: +q.px, d1: isFinite(+q.d1) ? +q.d1 : null } : null; }).filter(Boolean);
  const edicao = () => g(() => root.jrVer && root.jrVer(), null) || g(() => JRN.v, null);
  const noticias = ed => g(() => [ed.manchete, ...(ed.materias || [])].filter(x => x && x.titulo), []);
  const TEMAS = [
    ['petroleo', /petr[oó]le|petrobras|\bpbr\b|brent|\bwti\b|opep|combust|gasolina|diesel|prio|petr4/i, ['BZ=F', 'CL=F']],
    ['juros', /juro|selic|copom|\bfed\b|fomc|infla[cç]|ipca|\bdi\b|treasur|t[ií]tulo|banco central|powell|galípolo/i, ['^BVSP']],
    ['dolar', /d[oó]lar|c[aâ]mbio|real\b|\bdxy\b|moeda/i, ['BRL=X', 'DX-Y.NYB']],
    ['aco', /min[eé]rio|vale\b|vale3|sider|a[cç]o\b|gerdau|usiminas|\bcsn\b|ggb|china|dalian/i, ['TIO=F']],
    ['balanco', /balan[cç]o|lucro|receita|ebitda|resultado|\b[1-4]t\d{2}\b|trimestre|dividend|proventos/i, ['^BVSP']],
    ['cripto', /bitcoin|cripto|ethereum|\bbtc\b|blockchain/i, ['BTC-USD']],
    ['eua', /\beua\b|wall street|nasdaq|s&p|dow jones|trump|nova york|big tech|nvidia|apple/i, ['^GSPC', '^IXIC', 'ES=F', 'NQ=F']],
    ['bolsa', /./, ['^BVSP']],
  ];
  const tema = n => { const t = ((n && (n.titulo + ' ' + (n.editoria || '') + ' ' + (n.linha_fina || ''))) || ''); return TEMAS.find(([, re]) => re.test(t)) || TEMAS[TEMAS.length - 1]; };

  /* ---------------- desenho base ---------------- */
  function fundo(c, W, H) {
    const gr = c.createRadialGradient(W * .72, H * .3, 20, W * .6, H * .4, Math.max(W, H) * .9);
    gr.addColorStop(0, '#22252a'); gr.addColorStop(.5, C.bg1); gr.addColorStop(1, C.bg0);
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    // grão fino (identidade "papel de couro"), determinístico
    c.save(); c.globalAlpha = .035; let s = 7;
    for (let i = 0; i < 2400; i++) { s = (s * 16807) % 2147483647; const x = s % W; s = (s * 16807) % 2147483647; const y = s % H; c.fillStyle = i % 2 ? '#fff' : '#000'; c.fillRect(x, y, 1.4, 1.4); }
    c.restore();
  }
  function marca(c, W, H, M, fonte) {
    c.save(); c.translate(M + 14, M + 14); c.rotate(Math.PI / 4); c.strokeStyle = C.amb; c.lineWidth = 2.4; c.strokeRect(-12, -12, 24, 24); c.restore();
    c.fillStyle = C.tx; c.font = `500 30px ${SERIF}`; c.textBaseline = 'middle'; c.fillText('Jornal do Pregão', M + 48, M + 15);
    c.textAlign = 'right'; c.fillStyle = C.tx3; c.font = `400 22px ${MONO}`; c.fillText(hoje(), W - M, M + 15); c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillStyle = C.line; c.fillRect(M, H - M - 44, W - 2 * M, 1.5);
    c.fillStyle = C.tx3; c.font = `400 19px ${SANS}`; c.fillText(fonte || 'Diário Trader · cotações do app com atraso · não é recomendação de investimento', M, H - M - 8);
  }
  function quebra(c, txt, w, max) {
    const ps = String(txt || '').split(/\s+/), ls = []; let l = '';
    for (const p of ps) { const t = l ? l + ' ' + p : p; if (c.measureText(t).width > w && l) { ls.push(l); l = p; } else l = t; }
    if (l) ls.push(l);
    if (ls.length > max) { ls.length = max; ls[max - 1] = ls[max - 1].replace(/\s+\S*$/, '') + '…'; }
    return ls;
  }
  function bloco(c, txt, x, y, w, size, max, cor, fam, peso = 500, lh = 1.12) {
    let s = size, ls;
    do { c.font = `${peso} ${s}px ${fam}`; ls = quebra(c, txt, w, 99); if (ls.length <= max) break; s -= 4; } while (s > size * .55);
    ls = quebra(c, txt, w, max); c.fillStyle = cor;
    ls.forEach((l, i) => c.fillText(l, x, y + i * s * lh));
    return y + ls.length * s * lh;
  }

  /* ---------------- objetos 3D (mesma câmera: 3/4, luz alta à esquerda) ---------------- */
  function metal(c, x0, y0, x1, y1, tom = 0) {
    const gr = c.createLinearGradient(x0, y0, x1, y1);
    const a = tom ? ['#6e5326', '#e8cd92', '#9d7a3a', '#f1dca9', '#8d6c33'] : ['#2a2c31', '#8d9097', '#3d4046', '#b9bcc2', '#2f3237'];
    a.forEach((cor, i) => gr.addColorStop(i / (a.length - 1), cor)); return gr;
  }
  function escovado(c, x, y, w, h, n = 60) { c.save(); c.globalAlpha = .07; c.strokeStyle = '#fff'; c.lineWidth = 1; for (let i = 0; i < n; i++) { const yy = y + (i / n) * h; c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy + 0.5); c.stroke(); } c.restore(); }
  function sombra(c, cx, cy, rx, ry) { const gr = c.createRadialGradient(cx, cy, 0, cx, cy, rx); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.scale(1, ry / rx); c.fillStyle = gr; c.beginPath(); c.arc(cx, cy * rx / ry, rx, 0, 7); c.fill(); c.restore(); }
  // caixa isométrica (barra/lingote/monólito)
  function caixa(c, cx, cy, w, h, dp, tomTopo = 0, tomFrente = 0, rotulo = '') {
    const dx = dp * .75, dy = dp * .42;
    sombra(c, cx + dx / 2, cy + h / 2 + 18, w * .9, w * .18);
    // frente
    c.fillStyle = metal(c, cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, tomFrente); c.fillRect(cx - w / 2, cy - h / 2, w, h); escovado(c, cx - w / 2, cy - h / 2, w, h);
    // lado
    c.beginPath(); c.moveTo(cx + w / 2, cy - h / 2); c.lineTo(cx + w / 2 + dx, cy - h / 2 - dy); c.lineTo(cx + w / 2 + dx, cy + h / 2 - dy); c.lineTo(cx + w / 2, cy + h / 2); c.closePath();
    const gl = c.createLinearGradient(cx + w / 2, 0, cx + w / 2 + dx, 0); gl.addColorStop(0, tomFrente ? '#5d4520' : '#1c1d21'); gl.addColorStop(1, tomFrente ? '#3a2b14' : '#0f1012'); c.fillStyle = gl; c.fill();
    // topo
    c.beginPath(); c.moveTo(cx - w / 2, cy - h / 2); c.lineTo(cx - w / 2 + dx, cy - h / 2 - dy); c.lineTo(cx + w / 2 + dx, cy - h / 2 - dy); c.lineTo(cx + w / 2, cy - h / 2); c.closePath();
    c.fillStyle = metal(c, cx - w / 2, cy - h / 2 - dy, cx + w / 2 + dx, cy - h / 2, tomTopo); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.2; c.stroke();
    if (rotulo) { c.save(); c.fillStyle = tomFrente ? '#2a1f0d' : 'rgba(232,205,146,.92)'; c.font = `600 ${Math.round(Math.min(w, h) * .2)}px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(rotulo, cx, cy); c.restore(); }
  }
  function cilindro(c, cx, cy, r, h, tom = 0, aneis = 3) {
    const ry = r * .3;
    sombra(c, cx + 20, cy + h / 2 + 16, r * 1.3, r * .3);
    const corpo = c.createLinearGradient(cx - r, 0, cx + r, 0);
    (tom ? ['#4a3818', '#c9a15b', '#f1dca9', '#9d7a3a', '#3a2b14'] : ['#16171a', '#55585f', '#a7aab0', '#44474d', '#141518']).forEach((k, i, a) => corpo.addColorStop(i / (a.length - 1), k));
    c.fillStyle = corpo; c.beginPath(); c.moveTo(cx - r, cy - h / 2); c.lineTo(cx - r, cy + h / 2); c.ellipse(cx, cy + h / 2, r, ry, 0, Math.PI, 0, true); c.lineTo(cx + r, cy - h / 2); c.closePath(); c.fill();
    for (let i = 1; i <= aneis; i++) { const yy = cy - h / 2 + (h / (aneis + 1)) * i; c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 6; c.beginPath(); c.ellipse(cx, yy, r, ry, 0, 0, Math.PI); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, yy - 4, r, ry, 0, 0, Math.PI); c.stroke(); }
    const topo = c.createLinearGradient(cx - r, cy - h / 2 - ry, cx + r, cy - h / 2 + ry); topo.addColorStop(0, tom ? '#f1dca9' : '#c9ccd2'); topo.addColorStop(1, tom ? '#6e5326' : '#3a3d42');
    c.fillStyle = topo; c.beginPath(); c.ellipse(cx, cy - h / 2, r, ry, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; c.beginPath(); c.ellipse(cx, cy - h / 2, r * .82, ry * .82, 0, 0, 7); c.stroke();
  }
  function vidro(c, cx, cy, w, h, dp) { // bloco de vidro fumê
    const dx = dp * .75, dy = dp * .42;
    sombra(c, cx + dx / 2, cy + h / 2 + 18, w * .8, w * .16);
    c.save(); c.globalAlpha = .9;
    const fr = c.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2); fr.addColorStop(0, 'rgba(120,130,140,.38)'); fr.addColorStop(.5, 'rgba(40,44,50,.55)'); fr.addColorStop(1, 'rgba(20,22,26,.7)');
    c.fillStyle = fr; c.fillRect(cx - w / 2, cy - h / 2, w, h);
    c.beginPath(); c.moveTo(cx + w / 2, cy - h / 2); c.lineTo(cx + w / 2 + dx, cy - h / 2 - dy); c.lineTo(cx + w / 2 + dx, cy + h / 2 - dy); c.lineTo(cx + w / 2, cy + h / 2); c.closePath(); c.fillStyle = 'rgba(15,16,19,.7)'; c.fill();
    c.beginPath(); c.moveTo(cx - w / 2, cy - h / 2); c.lineTo(cx - w / 2 + dx, cy - h / 2 - dy); c.lineTo(cx + w / 2 + dx, cy - h / 2 - dy); c.lineTo(cx + w / 2, cy - h / 2); c.closePath(); c.fillStyle = 'rgba(200,205,212,.28)'; c.fill();
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.4; c.strokeRect(cx - w / 2, cy - h / 2, w, h);
    const br = c.createLinearGradient(cx - w / 2, cy - h / 2, cx, cy); br.addColorStop(0, 'rgba(255,255,255,.22)'); br.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = br; c.fillRect(cx - w / 2, cy - h / 2, w * .5, h * .5);
  }
  function prisma(c, cx, cy, r, h) { // prisma hexagonal (cripto)
    const pts = Array.from({ length: 6 }, (_, i) => [cx + r * Math.cos(Math.PI / 3 * i + Math.PI / 6), cy + r * .42 * Math.sin(Math.PI / 3 * i + Math.PI / 6)]);
    sombra(c, cx + 16, cy + h + 20, r * 1.2, r * .26);
    for (let i = 0; i < 6; i++) {
      const [a, b] = [pts[i], pts[(i + 1) % 6]]; if (b[1] < cy - 1 && a[1] < cy - 1) continue;
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(b[0], b[1] + h); c.lineTo(a[0], a[1] + h); c.closePath();
      const lum = .25 + .5 * Math.max(0, Math.cos(Math.PI / 3 * i - 2.2)); c.fillStyle = `rgba(${Math.round(201 * lum + 30)},${Math.round(161 * lum + 25)},${Math.round(91 * lum + 18)},1)`; c.fill();
      c.strokeStyle = 'rgba(255,255,255,.15)'; c.stroke();
    }
    c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = metal(c, cx - r, cy - r, cx + r, cy + r, 1); c.fill();
  }
  function mostrador(c, cx, cy, r, v) { // juros: mostrador em metal com ponteiro
    sombra(c, cx + 14, cy + r + 24, r * 1.1, r * .22);
    cilindro(c, cx, cy + r * .2, r, r * .42, 0, 0);
    c.save(); c.translate(cx, cy + r * .2 - r * .21); c.scale(1, .3);
    c.strokeStyle = 'rgba(232,205,146,.85)'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, r * .78, Math.PI * .85, Math.PI * 2.15); c.stroke();
    for (let i = 0; i <= 10; i++) { const a = Math.PI * .85 + (Math.PI * 1.3) * i / 10; c.beginPath(); c.moveTo(Math.cos(a) * r * .66, Math.sin(a) * r * .66); c.lineTo(Math.cos(a) * r * .76, Math.sin(a) * r * .76); c.lineWidth = 4; c.stroke(); }
    const a = Math.PI * .85 + Math.PI * 1.3 * Math.max(0, Math.min(1, v)); c.strokeStyle = C.amb; c.lineWidth = 10; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * .62, Math.sin(a) * r * .62); c.stroke();
    c.restore();
  }
  function objeto(c, nome, cx, cy, k) {
    const s = k; // escala
    if (nome === 'petroleo') { cilindro(c, cx - 70 * s, cy + 30 * s, 120 * s, 300 * s, 0, 2); cilindro(c, cx + 120 * s, cy + 70 * s, 100 * s, 240 * s, 1, 2); }
    else if (nome === 'aco') { caixa(c, cx - 40 * s, cy + 90 * s, 380 * s, 110 * s, 120 * s, 0, 0); caixa(c, cx + 10 * s, cy - 40 * s, 340 * s, 100 * s, 110 * s, 1, 1, ''); }
    else if (nome === 'juros') mostrador(c, cx, cy, 230 * s, .62);
    else if (nome === 'dolar') { vidro(c, cx - 30 * s, cy, 360 * s, 300 * s, 120 * s); c.save(); c.fillStyle = 'rgba(232,205,146,.95)'; c.font = `600 ${120 * s}px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('US$', cx - 30 * s, cy + 6 * s); c.restore(); }
    else if (nome === 'balanco') { caixa(c, cx - 140 * s, cy + 80 * s, 120 * s, 200 * s, 90 * s, 0, 0); caixa(c, cx, cy + 30 * s, 120 * s, 300 * s, 90 * s, 0, 0); caixa(c, cx + 140 * s, cy - 20 * s, 120 * s, 400 * s, 90 * s, 1, 1); }
    else if (nome === 'cripto') prisma(c, cx, cy - 120 * s, 190 * s, 300 * s);
    else if (nome === 'eua') { vidro(c, cx - 90 * s, cy + 40 * s, 170 * s, 420 * s, 90 * s); caixa(c, cx + 110 * s, cy + 90 * s, 150 * s, 320 * s, 90 * s, 1, 1); }
    else { caixa(c, cx, cy, 200 * s, 520 * s, 120 * s, 1, 0); c.fillStyle = C.amb; c.fillRect(cx - 100 * s, cy - 40 * s, 200 * s, 6 * s); }
  }

  /* ---------------- modelos ---------------- */
  function linhaCot(c, q, x, y, w) {
    if (!q.length) { c.fillStyle = C.tx3; c.font = `400 24px ${SANS}`; c.fillText('Cotações indisponíveis no momento', x, y); return; }
    const col = Math.min(q.length, 3), cw = w / col;
    q.slice(0, col).forEach((a, i) => {
      const xx = x + i * cw; if (i) { c.fillStyle = C.line; c.fillRect(xx - 16, y - 46, 1.5, 70); }
      c.fillStyle = C.tx3; c.font = `500 22px ${SANS}`; c.fillText(a.n.toUpperCase(), xx, y - 22);
      c.fillStyle = C.tx; c.font = `500 34px ${MONO}`; c.fillText(nf(a.px, a.c), xx, y + 18);
      c.fillStyle = a.d1 > 0 ? C.up : a.d1 < 0 ? C.dn : C.tx2; c.font = `500 26px ${MONO}`; c.fillText(pct(a.d1), xx + c.measureText(nf(a.px, a.c)).width * 0 + 0, y + 54);
    });
  }
  function mManchete(c, W, H, ctx) {
    const n = ctx.noticia; if (!n) return false;
    const [nomeTema, , syms] = tema(n), M = 72, story = H / W > 1.6, quad = H === W;
    fundo(c, W, H); marca(c, W, H, M);
    // objeto 3D: área de identidade
    const oy = story ? H * .27 : quad ? H * .36 : H * .27, ox = quad ? W * .72 : W * .6;
    c.save(); c.globalAlpha = quad ? .95 : 1; objeto(c, nomeTema, ox, oy, story ? 1.3 : quad ? .62 : .8); c.restore();
    let y = story ? H * .52 : quad ? H * .58 : H * .5;
    c.fillStyle = C.amb; c.font = `600 22px ${MONO}`; c.fillText(String(n.editoria || 'Manchete do dia').toUpperCase(), M, y - 30);
    y = bloco(c, n.titulo, M, y + (story ? 92 : 34), W - 2 * M, story ? 96 : quad ? 54 : 66, story ? 5 : quad ? 3 : 4, C.tx, SERIF, 500, 1.1);
    const fina = n.linha_fina || n.por_que_importa;
    if (fina && !quad) y = bloco(c, fina, M, y + 28, W - 2 * M, story ? 38 : 28, story ? 4 : 2, C.tx2, SANS, 400, 1.35);
    const qs = cot().filter(a => syms.includes(a.s)).concat(cot().filter(a => a.s === '^BVSP' || a.s === 'BRL=X')).filter((a, i, arr) => arr.findIndex(b => b.s === a.s) === i);
    linhaCot(c, qs, M, H - M - 120, W - 2 * M);
    return true;
  }
  function mNumero(c, W, H) {
    const mov = cot().filter(a => a.d1 != null).sort((a, b) => Math.abs(b.d1) - Math.abs(a.d1))[0]; if (!mov) return false;
    const M = 72; fundo(c, W, H); marca(c, W, H, M);
    const cor = mov.d1 >= 0 ? C.up : C.dn, txt = pct(mov.d1), cx = W / 2, cy = H * (H / W > 1.6 ? .4 : .42);
    c.fillStyle = C.amb; c.font = `600 24px ${MONO}`; c.textAlign = 'center'; c.fillText('O NÚMERO DO DIA', cx, cy - 250);
    // número extrudado em metal (identidade), mantendo a leitura plana do valor
    let s = 230; c.font = `600 ${s}px ${SERIF}`; while (c.measureText(txt).width > W - 2 * M - 40 && s > 100) { s -= 10; c.font = `600 ${s}px ${SERIF}`; }
    for (let i = 18; i > 0; i--) { c.fillStyle = `rgba(${mov.d1 >= 0 ? '22,70,48' : '84,32,26'},${.5 + i / 40})`; c.fillText(txt, cx + i * 1.4, cy + i); }
    const gr = c.createLinearGradient(0, cy - s, 0, cy); gr.addColorStop(0, '#f4efe4'); gr.addColorStop(1, cor); c.fillStyle = gr; c.fillText(txt, cx, cy);
    c.fillStyle = C.tx; c.font = `500 64px ${SANS}`; c.fillText(mov.n, cx, cy + 120);
    c.fillStyle = C.tx2; c.font = `500 40px ${MONO}`; c.fillText(nf(mov.px, mov.c), cx, cy + 180);
    c.textAlign = 'left';
    const resto = cot().filter(a => a.s !== mov.s && a.d1 != null).sort((a, b) => Math.abs(b.d1) - Math.abs(a.d1)).slice(0, 3);
    linhaCot(c, resto, M, H - M - 120, W - 2 * M);
    return true;
  }
  function mPontos(c, W, H, ctx) {
    const ns = ctx.lista.slice(0, H === W ? 2 : 3); if (ns.length < 2) return false;
    const M = 72; fundo(c, W, H); marca(c, W, H, M);
    c.save(); c.globalAlpha = .9; objeto(c, tema(ns[0])[0], W * .76, H * .2, .48); c.restore();
    c.fillStyle = C.amb; c.font = `600 24px ${MONO}`; c.fillText('O QUE MOVE O PREGÃO', M, H * .14);
    c.fillStyle = C.tx; c.font = `500 64px ${SERIF}`; c.fillText('Três pontos', M, H * .14 + 76);
    let y = H * .34; const gap = (H - M - 170 - y) / ns.length;
    ns.forEach((n, i) => {
      c.fillStyle = C.line; c.fillRect(M, y - 50, W - 2 * M, 1.5);
      c.fillStyle = C.amb; c.font = `500 72px ${SERIF}`; c.fillText(String(i + 1), M, y + 22);
      c.fillStyle = C.tx3; c.font = `600 20px ${MONO}`; c.fillText(String(n.editoria || '').toUpperCase(), M + 90, y - 12);
      bloco(c, n.titulo, M + 90, y + 30, W - 2 * M - 90, 40, 3, C.tx, SERIF, 500, 1.15);
      y += gap;
    });
    return true;
  }
  function mVersus(c, W, H) {
    const q = cot(); const a = q.find(x => x.s === '^BVSP'), b = q.find(x => x.s === '^GSPC') || q.find(x => x.s === 'BRL=X'); if (!a || !b) return false;
    const M = 72; fundo(c, W, H); marca(c, W, H, M);
    c.fillStyle = C.amb; c.font = `600 24px ${MONO}`; c.textAlign = 'center'; c.fillText('BRASIL × MUNDO', W / 2, H * .14);
    const cy = H * .45;
    caixa(c, W * .3, cy, 170, 420, 100, 1, 0); vidro(c, W * .7, cy, 170, 420, 100);
    [[a, W * .3], [b, W * .7]].forEach(([x, px]) => {
      c.fillStyle = C.tx; c.font = `500 46px ${SANS}`; c.fillText(x.n, px, cy + 330);
      c.font = `500 40px ${MONO}`; c.fillStyle = C.tx2; c.fillText(nf(x.px, x.c), px, cy + 388);
      c.fillStyle = x.d1 >= 0 ? C.up : C.dn; c.font = `600 52px ${MONO}`; c.fillText(pct(x.d1), px, cy + 452);
    });
    c.fillStyle = C.tx3; c.font = `400 22px ${SANS}`; c.fillText('Altura dos objetos é ilustrativa; os números estão abaixo.', W / 2, H - M - 70);
    c.textAlign = 'left'; return true;
  }
  function mFechamento(c, W, H, ctx) {
    const dia = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const ts = g(() => S.trades, []).map(t => ({ t, k: g(() => calc(t), null) })).filter(x => x.k && x.k.pl != null && String(x.t.dtx || x.t.dt || '').slice(0, 10) === dia);
    if (!ts.length) return false;
    const soma = ts.reduce((s, x) => s + x.k.pl, 0), rs = ts.filter(x => x.k.r != null).map(x => x.k.r), somaR = rs.length ? rs.reduce((a, b) => a + b, 0) : null;
    const acerto = ts.filter(x => x.k.pl > 0).length / ts.length * 100, regras = ts.filter(x => x.t.rules === 's').length;
    const M = 72; fundo(c, W, H); marca(c, W, H, M, 'Diário Trader · fechamento pessoal · não é recomendação de investimento');
    c.save(); c.globalAlpha = .95; caixa(c, W * .74, H * .25, 160, 300, 100, 1, 1); c.restore();
    c.fillStyle = C.amb; c.font = `600 24px ${MONO}`; c.fillText('MEU FECHAMENTO · ' + hoje(), M, H * .16);
    const big = ctx.ocultar ? (somaR != null ? (somaR > 0 ? '+' : somaR < 0 ? '−' : '') + nf(Math.abs(somaR), 2) + '×' : (soma >= 0 ? 'Dia positivo' : 'Dia negativo')) : (soma > 0 ? '+' : soma < 0 ? '−' : '') + 'R$ ' + nf(Math.abs(soma), 2);
    c.fillStyle = soma >= 0 ? C.up : C.dn; c.font = `600 ${big.length > 12 ? 110 : 140}px ${SERIF}`; c.fillText(big, M, H * .48);
    c.fillStyle = C.tx2; c.font = `400 34px ${SANS}`; c.fillText(ctx.ocultar ? 'vezes o risco que eu corri, somado no dia' : (somaR != null ? nf(somaR, 2) + '× o risco somado no dia' : 'resultado do dia'), M, H * .48 + 64);
    const fs = [['Trades', String(ts.length)], ['Acerto', nf(acerto, 0) + '%'], ['Nas regras', regras + ' de ' + ts.length]];
    const cw = (W - 2 * M) / 3, y = H * .68; c.fillStyle = C.line; c.fillRect(M, y - 70, W - 2 * M, 1.5);
    fs.forEach(([l, v], i) => { c.fillStyle = C.tx3; c.font = `500 24px ${SANS}`; c.fillText(l, M + i * cw, y - 20); c.fillStyle = C.tx; c.font = `500 64px ${MONO}`; c.fillText(v, M + i * cw, y + 50); });
    return true;
  }
  const MODELOS = [['manchete', mManchete], ['numero', mNumero], ['pontos', mPontos], ['versus', mVersus]];

  /* ---------------- geração ---------------- */
  const est = { fmt: 'feed', i: 0, ocultar: true, canvas: null, modelo: '' };
  function gerar(tipo) {
    const [W, H] = FMT[est.fmt]; const cv = d.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); if (!c) return null;
    if (tipo === 'dia') { if (mFechamento(c, W, H, { ocultar: est.ocultar })) { est.modelo = 'dia'; return cv; } return null; }
    const lista = noticias(edicao());
    // sequência inteligente: manchete → número do dia → três pontos → matéria 2 → versus → matéria 3 …
    const fila = [];
    lista.forEach((n, i) => { fila.push(['manchete', { noticia: n, lista }]); if (i === 0) { fila.push(['numero', {}]); fila.push(['pontos', { lista }]); } if (i === 1) fila.push(['versus', {}]); });
    if (!lista.length) fila.push(['numero', {}], ['versus', {}]);
    for (let k = 0; k < fila.length; k++) {
      const [nome, ctx] = fila[(est.i + k) % fila.length]; c.clearRect(0, 0, W, H);
      try { if (MODELOS.find(m => m[0] === nome)[1](c, W, H, ctx)) { est.i = (est.i + k) % fila.length; est.modelo = nome; return cv; } } catch (e) { console.warn('[capas v561]', nome, e); }
    }
    return null;
  }

  /* ---------------- visor ---------------- */
  function aviso(m) { try { toast(m, 3500); } catch { } }
  function abre(tipo) {
    if (tipo !== 'mesmo') est.canvas = gerar(tipo === 'dia' ? 'dia' : null);
    if (!est.canvas) { aviso(tipo === 'dia' ? 'Registre ao menos um trade encerrado hoje para montar a capa do seu fechamento.' : 'Abra o Jornal do Pregão e aguarde a edição e as cotações para gerar a capa.'); return; }
    let el = d.getElementById('c561');
    if (!el) { el = d.createElement('div'); el.id = 'c561'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Capa do Jornal do Pregão'); d.body.append(el); }
    const f = Object.entries(FMT).map(([k, v]) => `<button type="button" data-c561-fmt="${k}" aria-pressed="${k === est.fmt}">${v[2]}</button>`).join('');
    el.innerHTML = `<div class="c561-bar"><button type="button" data-c561="x">Voltar</button><button type="button" data-c561="nova">Outra capa</button><button type="button" data-c561="dia">Meu fechamento</button></div>
      <div class="c561-opc"><div class="c561-seg" role="group" aria-label="Formato">${f}</div>${est.modelo === 'dia' ? `<label class="c561-chk"><input type="checkbox" data-c561-ocultar ${est.ocultar ? 'checked' : ''}> Ocultar valores em R$</label>` : ''}</div>
      <div class="c561-img"><img alt="Capa gerada (${est.modelo})" src="${est.canvas.toDataURL('image/png')}"></div>
      <button type="button" class="c561-pri" data-c561="s">Compartilhar / salvar</button>
      <p class="c561-nota">${est.modelo === 'dia' ? 'Seu fechamento de hoje. Confira antes de compartilhar.' : 'Montada com a edição de hoje e as cotações do app. “Outra capa” passa para a próxima notícia ou modelo.'}</p>`;
    el.hidden = false; d.body.classList.add('c561-open');
    (el.querySelector('[data-c561="nova"]') || el).focus({ preventScroll: true });
  }
  function fecha() { const el = d.getElementById('c561'); if (el) el.hidden = true; d.body.classList.remove('c561-open'); }
  async function salva() {
    if (!est.canvas) return;
    const blob = await new Promise(r => est.canvas.toBlob(r, 'image/png')); if (!blob) { aviso('Não consegui gerar a imagem.'); return; }
    const nome = 'capa-jornal-' + (est.modelo || 'dia') + '-' + est.fmt + '-' + new Date().toISOString().slice(0, 10) + '.png';
    try { const file = new File([blob], nome, { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Jornal do Pregão' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await saveFile(nome, blob, 'image/png'); aviso('Imagem salva.'); } catch { aviso('Não foi possível salvar. Toque e segure a imagem.'); }
  }
  // Os botões antigos (Capa do dia, miniatura, Outra capa, Meu fechamento) passam a abrir as capas v561.
  d.addEventListener('click', e => {
    const t = e.target.closest?.('[data-c561],[data-c561-fmt],[data-v429-capa],[data-v430-thumb],[data-v429]'); if (!t) return;
    if (t.dataset.c561Fmt) { est.fmt = t.dataset.c561Fmt; abre(est.modelo === 'dia' ? 'dia' : 'mesmo-novo'); return; }
    e.preventDefault(); e.stopImmediatePropagation();
    const a = t.dataset.c561 || t.dataset.v429 || 'nova';
    if (a === 'x') fecha();
    else if (a === 'dia') abre('dia');
    else if (a === 's') salva();
    else if (a === 'nova' && d.body.classList.contains('c561-open')) { est.i++; abre(); }
    else abre();
  }, true);
  d.addEventListener('change', e => { if (e.target.matches?.('[data-c561-ocultar]')) { est.ocultar = e.target.checked; abre('dia'); } });
  d.addEventListener('keydown', e => { if (e.key === 'Escape' && d.body.classList.contains('c561-open')) fecha(); });
  // Miniatura da capa no Jornal passa a mostrar o novo modelo.
  let ultimaEd = '';
  setInterval(() => {
    const img = d.querySelector('[data-v430-thumb] img'); const ed = edicao(); if (!img || !ed) return;
    const k = g(() => ed.manchete.titulo, '') + est.fmt; if (k === ultimaEd && img.dataset.c561) return;
    const fmt = est.fmt; est.fmt = 'feed'; const i = est.i; est.i = 0; const cv = gerar(); est.fmt = fmt; est.i = i;
    if (cv) { img.src = cv.toDataURL('image/jpeg', .85); img.dataset.c561 = '1'; ultimaEd = k; }
  }, 2500);
  const arte = (n, w = 960, h = 420) => { const cv = d.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); if (!c) return null; fundo(c, w, h); objeto(c, tema(n)[0], w * .5, h * .56, Math.min(w / 1080, h / 520) * 1.05); return cv; };
  root.DiarioCapas561 = { _desenho: { fundo, objeto, caixa, vidro, cilindro }, arte, gerar: (fmt = 'feed', i = 0, tipo) => { const f = est.fmt, j = est.i; est.fmt = fmt; est.i = i; const cv = gerar(tipo); est.fmt = f; est.i = j; return cv; }, tema, abre };
})(window, document);
