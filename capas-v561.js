/* v971 — Capas Cinematográficas Inteligentes do Jornal do Pregão.
 * Motor editorial que cruza 4 sinais reais (clima_capa da IA, impacto.direcao, semântica ponderada
 * da manchete e cotações reais do pregão) para escolher automaticamente entre 10 cenas fotográficas
 * cinematográficas (WebP offline no PWA) e compor capas editoriais de revista (4:5, 1:1 e 9:16).
 */
(function (root, d) {
  'use strict';
  if (root.DiarioCapas561) return;

  const g = (f, v) => { try { const x = f(); return x === undefined ? v : x; } catch { return v; } };
  const FMT = { feed: [1080, 1350, '4:5'], quad: [1080, 1080, '1:1'], story: [1080, 1920, '9:16'] };
  const SANS = '"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
  const COND = '"Barlow Condensed","Arial Narrow","Helvetica Neue",system-ui,-apple-system,sans-serif';
  const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"DejaVu Serif",serif';
  const MONO = 'ui-monospace,"SF Mono",Menlo,Consolas,"DejaVu Sans Mono",monospace';

  const nf = (v, c) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  const pct = (v) => v == null || !isFinite(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), 2) + '%';
  const dataCurta = (dia) => {
    try {
      const dt = dia ? new Date(dia + 'T12:00:00') : new Date();
      return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' }).replace(/\./g, '').toUpperCase();
    } catch { return ''; }
  };

  /* ---------------- catálogo de 10 cenas cinematográficas ---------------- */
  const CENAS = {
    'bolsa-alta':    { url: 'assets/capas/bolsa-alta.webp',    rotulo: 'Touro · Ritmo comprador',    focusY: 0.24, syms: ['^BVSP', 'BRL=X', '^GSPC'] },
    'bolsa-baixa':   { url: 'assets/capas/bolsa-baixa.webp',   rotulo: 'Urso · Pressão vendedora',   focusY: 0.22, syms: ['^BVSP', 'BRL=X', '^GSPC'] },
    'bolsa-cautela': { url: 'assets/capas/bolsa-cautela.webp', rotulo: 'Faria Lima · Cautela',       focusY: 0.28, syms: ['^BVSP', 'BRL=X', '^GSPC'] },
    'juros':         { url: 'assets/capas/juros.webp',         rotulo: 'Juros & Política Monetária', focusY: 0.26, syms: ['^BVSP', 'BRL=X', '^GSPC'] },
    'dolar':         { url: 'assets/capas/dolar.webp',         rotulo: 'Dólar & Fluxo Cambial',      focusY: 0.34, syms: ['BRL=X', 'DX-Y.NYB', '^BVSP'] },
    'petroleo':      { url: 'assets/capas/petroleo.webp',      rotulo: 'Petróleo & Energia',         focusY: 0.24, syms: ['BZ=F', 'CL=F', '^BVSP'] },
    'minerio':       { url: 'assets/capas/minerio.webp',       rotulo: 'Minério, Aço & China',       focusY: 0.28, syms: ['TIO=F', '^BVSP', 'BRL=X'] },
    'eua':           { url: 'assets/capas/eua.webp',           rotulo: 'Wall Street & EUA',          focusY: 0.25, syms: ['^GSPC', '^IXIC', 'BRL=X'] },
    'balancos':      { url: 'assets/capas/balancos.webp',      rotulo: 'Balanços & Corporativo B3',  focusY: 0.26, syms: ['^BVSP', 'BRL=X', '^GSPC'] },
    'cripto':        { url: 'assets/capas/cripto.webp',        rotulo: 'Cripto & Ativos Digitais',   focusY: 0.22, syms: ['BTC-USD', '^IXIC', 'BRL=X'] },
  };

  const PALETA = {
    baixa:   { accent: '#e03a3e', accentSoft: '#ff6b6f', glow: 'rgba(198,28,38,.34)',  tag: 'PRESSÃO VENDEDORA', bg0: '#160709', bg1: '#090608' },
    alta:    { accent: '#dfba69', accentSoft: '#f6dc9c', glow: 'rgba(212,175,105,.28)', tag: 'RITMO COMPRADOR',  bg0: '#141109', bg1: '#08090c' },
    cautela: { accent: '#d99b38', accentSoft: '#f2c777', glow: 'rgba(217,155,56,.24)', tag: 'MERCADO EM CAUTELA', bg0: '#11131a', bg1: '#08090c' },
  };

  /* ---------------- cache e pré-carregamento das imagens ---------------- */
  const imgCache = new Map();
  const imgPend = new Map();
  function carregaCena(key) {
    const info = CENAS[key] || CENAS['bolsa-cautela'];
    if (imgCache.has(key)) return Promise.resolve(imgCache.get(key));
    if (imgPend.has(key)) return imgPend.get(key);
    const p = new Promise((resolve) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => { imgCache.set(key, im); imgPend.delete(key); resolve(im); };
      im.onerror = () => { imgPend.delete(key); resolve(null); };
      im.src = info.url;
    });
    imgPend.set(key, p);
    return p;
  }
  const imgSync = (key) => imgCache.get(key) || null;
  function preload(keys) {
    const list = Array.isArray(keys) && keys.length ? keys : Object.keys(CENAS);
    return Promise.all(list.map(carregaCena));
  }

  /* ---------------- leitura de dados do Jornal e Cotações ---------------- */
  const ATIVOS = [
    ['^BVSP', 'Ibovespa', 0], ['BRL=X', 'Dólar', 4], ['BZ=F', 'Brent', 2], ['CL=F', 'WTI', 2],
    ['TIO=F', 'Minério', 2], ['GC=F', 'Ouro', 0], ['^GSPC', 'S&P 500', 0], ['^IXIC', 'Nasdaq', 0],
    ['ES=F', 'S&P Fut', 0], ['NQ=F', 'Nasdaq Fut', 0], ['DX-Y.NYB', 'DXY', 2], ['BTC-USD', 'Bitcoin', 0],
  ];
  const K_MAP = {
    ibov: ['^BVSP', 'Ibovespa', 0], win: ['^BVSP', 'WIN', 0],
    dolar: ['BRL=X', 'Dólar', 4], wdo: ['BRL=X', 'WDO', 2],
    brent: ['BZ=F', 'Brent', 2], wti: ['CL=F', 'WTI', 2],
    minerio: ['TIO=F', 'Minério', 2], ouro: ['GC=F', 'Ouro', 0],
    sp500: ['^GSPC', 'S&P 500', 0], spx: ['^GSPC', 'S&P 500', 0],
    nasdaq: ['^IXIC', 'Nasdaq', 0], dxy: ['DX-Y.NYB', 'DXY', 2], btc: ['BTC-USD', 'Bitcoin', 0],
  };

  const edicao = () => g(() => root.jrVer && root.jrVer(), null) || g(() => JRN.v, null);
  const noticias = (ed) => g(() => [ed.manchete, ...(ed.materias || [])].filter((x) => x && x.titulo), []);

  function cot(ed) {
    const out = [], seen = new Set();
    const push = (s, n, c, px, d1) => {
      if (!isFinite(+px) || seen.has(s)) return;
      seen.add(s);
      out.push({ s, n, c, px: +px, d1: isFinite(+d1) ? +d1 : null });
    };
    const e = ed || edicao();
    const edCots = e?.snapshot?.cotacoes || e?.cotacoes || [];
    for (const q of Array.isArray(edCots) ? edCots : []) {
      const k = String(q.k || '').toLowerCase();
      const hit = K_MAP[k];
      if (hit) push(hit[0], q.n || hit[1], hit[2], q.px, q.d1);
    }
    for (const [s, n, c] of ATIVOS) {
      const q = g(() => root.imgQ ? root.imgQ(s) : null, null);
      if (q && isFinite(+q.px)) push(s, n, c, q.px, q.d1);
    }
    return out;
  }

  /* ---------------- motor inteligente de classificação (Tema + Clima + Direção) ---------------- */
  const RE_BAIXA = /press[aã]o vendedora|tombo|despenca|derrete|\bcai\b|recua|queda|perde\b|suporte [aà] prova|avers[aã]o|estresse|risco fiscal|rombo|fuga|p[aâ]nico|sell[- ]?off|\bbaixa\b|pressiona|temor|alerta|crise|desaba|corrige|recess[aã]o|infla[cç][aã]o acelera|dispara juros|afunda|enfraquece|rompe suporte/i;
  const RE_ALTA = /\brali\b|avan[cç]a|\bsobe\b|\balta\b|recorde|rompe topo|otimism|al[ií]vio|impulsiona|valoriza|supera expectativas|(?:lucro|receita|ebitda|balan[cç]o|resultado)[^.]{0,35}acima do esperado|lucro salta|corte de juros|corte na selic|apetite|recupera|ganhos|dispara(?!.*(?:juro|d[oó]lar|risco|infla))/i;
  const RE_CAUTELA = /cautela|espera|aguarda|impasse|indefini|lateral|est[aá]vel|dividid|observa|decis[aã]o|antes do|v[eé]spera|volatilidade|incerteza|equil[ií]brio|misto|compasso/i;

  const RE_BOLSA_FOCO = /ibovespa|\bibov\b|\bbolsa\b|\bb3\b|\bwin\b|mini [ií]ndice|press[aã]o vendedora|suporte [aà] prova|rali na bolsa|preg[aã]o brasileiro/i;
  const RE_TEMAS = [
    ['petroleo', /petr[oó]le|petrobras|\bpetr[34]\b|\bpbr\b|brent|\bwti\b|opep|opec|combust[ií]vel|gasolina|diesel|\bprio3?\b|brava energia/i, 'BZ=F'],
    ['minerio',  /min[eé]rio|\bvale\b|\bvale3\b|sider[uú]rg|\ba[cç]o\b|gerdau|\bggbr4?\b|usiminas|\bcsn\b|csna3|dalian|ferro\b/i, 'TIO=F'],
    ['cripto',   /bitcoin|cripto|ethereum|\bbtc\b|\beth\b|blockchain|solana/i, 'BTC-USD'],
    ['balancos', /balan[cç]o|lucro l[ií]quido|ebitda|resultado(?:s)? do [1-4]t|\b[1-4]t2\d\b|trimestre|dividendo|jcp|provento|temporada de resultados/i, '^BVSP'],
    ['juros',    /selic|copom|\bfed\b|fomc|juro(?:s)?|ipca|infla[cç][aã]o|\bdi\b|curva de juros|treasur|banco central|powell|gal[ií]polo|pol[ií]tica monet[aá]ria|fiscal|arcabou[cç]o|contas p[uú]blicas/i, '^BVSP'],
    ['dolar',    /d[oó]lar|c[aâ]mbio|\bptax\b|\bwdo\b|\bdxy\b|moeda americana/i, 'BRL=X'],
    ['eua',      /\beua\b|wall street|nasdaq|s&p\s*500|dow jones|nova york|big tech|nvidia|apple|microsoft|payroll|\bcpi\b|tarifa/i, '^GSPC'],
  ];

  function classificar(n, ed, qts) {
    const e = ed || edicao();
    const qs = qts || cot(e);
    const tit = String(n?.titulo || '');
    const edtr = String(n?.editoria || '');
    const fina = String(n?.linha_fina || n?.por_que_importa || '');
    const full = `${tit} ${edtr} ${fina}`;
    const isManchete = !!(e && n && e.manchete && e.manchete.titulo === n.titulo);

    // 1. Detecta o tema com pontuação ponderada (Título > Editoria > Linha-fina)
    let temaKey = 'bolsa', anchorSym = '^BVSP', bestScore = 0;
    const bolsaNoTitulo = RE_BOLSA_FOCO.test(tit);
    for (const [k, re, sym] of RE_TEMAS) {
      let sc = 0;
      if (re.test(tit)) sc += 5;
      if (re.test(edtr)) sc += 3;
      if (re.test(fina)) sc += 1.5;
      // Se o título é explicitamente sobre Ibovespa/Bolsa/Suporte/Pressão, dá preferência às cenas icônicas Touro/Urso
      if (bolsaNoTitulo && (k === 'juros' || k === 'eua' || k === 'dolar') && sc < 6) sc *= 0.45;
      if (sc > bestScore) { bestScore = sc; temaKey = k; anchorSym = sym; }
    }
    if (bestScore < 2.5) { temaKey = 'bolsa'; anchorSym = '^BVSP'; }

    // 2. Detecta o clima/direção cruzando 4 sinais reais
    let clima = '';
    const bearTit = RE_BAIXA.test(tit), bullTit = RE_ALTA.test(tit), cautTit = RE_CAUTELA.test(tit);
    if (temaKey === 'dolar') {
      if (bullTit && !bearTit) clima = 'baixa';
      else if (bearTit && !bullTit) clima = 'alta';
    }
    if (!clima) {
      if (bearTit && !bullTit) clima = 'baixa';
      else if (bullTit && !bearTit) clima = 'alta';
      else if (cautTit && !bearTit && !bullTit) clima = 'cautela';
    }

    if (!clima && isManchete && ['alta', 'baixa', 'cautela'].includes(String(e?.clima_capa || '').toLowerCase())) {
      clima = String(e.clima_capa).toLowerCase();
    }
    if (!clima) {
      const dir = String(n?.impacto?.direcao || '').toLowerCase();
      if (dir === 'baixa') clima = 'baixa';
      else if (dir === 'alta') clima = 'alta';
      else if (dir === 'misto') clima = 'cautela';
    }
    if (!clima) {
      const bearFull = RE_BAIXA.test(full), bullFull = RE_ALTA.test(full);
      if (bearFull && !bullFull) clima = 'baixa';
      else if (bullFull && !bearFull) clima = 'alta';
    }
    if (!clima) {
      const qRef = qs.find((q) => q.s === anchorSym) || qs.find((q) => q.s === '^BVSP') || qs[0];
      if (qRef && qRef.d1 != null) {
        if (qRef.s === 'BRL=X') clima = qRef.d1 >= 0.6 ? 'baixa' : qRef.d1 <= -0.6 ? 'alta' : 'cautela';
        else clima = qRef.d1 <= -0.55 ? 'baixa' : qRef.d1 >= 0.55 ? 'alta' : 'cautela';
      } else {
        clima = 'cautela';
      }
    }

    // 3. Mapeia para a cena WebP exata
    const cena = temaKey === 'bolsa'
      ? (clima === 'baixa' ? 'bolsa-baixa' : clima === 'alta' ? 'bolsa-alta' : 'bolsa-cautela')
      : temaKey;

    const info = CENAS[cena] || CENAS['bolsa-cautela'];
    const pal = PALETA[clima] || PALETA.cautela;
    return { cena, tema: temaKey, clima, pal, rotulo: info.rotulo, url: info.url, focusY: info.focusY, syms: info.syms };
  }

  const tema = (n) => {
    const r = classificar(n);
    return [r.tema, /./, r.syms, r];
  };

  /* ---------------- utilitários gráficos de revista ---------------- */
  function roundRectPath(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  function drawCoverImage(c, im, x, y, w, h, focusY = 0.25) {
    if (!im || !im.naturalWidth) return false;
    const ir = im.naturalWidth / im.naturalHeight;
    const tr = w / h;
    let sw, sh, sx, sy;
    if (ir > tr) {
      sh = im.naturalHeight;
      sw = sh * tr;
      sx = (im.naturalWidth - sw) * 0.58; // favorece o sujeito no lado direito
      sy = 0;
    } else {
      sw = im.naturalWidth;
      sh = sw / tr;
      sx = 0;
      sy = Math.max(0, Math.min(im.naturalHeight - sh, (im.naturalHeight - sh) * focusY));
    }
    c.drawImage(im, sx, sy, sw, sh, x, y, w, h);
    return true;
  }

  function fundoCena(c, W, H, cenaKey, pal, opts = {}) {
    const info = CENAS[cenaKey] || CENAS['bolsa-cautela'];
    const im = imgSync(cenaKey);
    // Base dark fallback
    const bg = c.createRadialGradient(W * 0.72, H * 0.25, 20, W * 0.5, H * 0.5, Math.max(W, H));
    bg.addColorStop(0, pal.bg0);
    bg.addColorStop(1, pal.bg1);
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    if (im) {
      drawCoverImage(c, im, 0, 0, W, H, opts.focusY ?? info.focusY);
    }

    // Vinheta cinematográfica superior esquerda para destacar o masthead (sem linha de corte)
    const topL = c.createRadialGradient(W * 0.16, H * 0.12, 10, W * 0.22, H * 0.14, W * 0.78);
    topL.addColorStop(0, 'rgba(6,8,12,.72)');
    topL.addColorStop(0.55, 'rgba(6,8,12,.34)');
    topL.addColorStop(1, 'rgba(6,8,12,0)');
    c.fillStyle = topL;
    c.fillRect(0, 0, W, H);

    // Leve banho de cor emocional (crimson na baixa, ouro na alta)
    const tint = c.createLinearGradient(0, 0, W, H * 0.65);
    tint.addColorStop(0, pal.glow);
    tint.addColorStop(0.55, 'rgba(0,0,0,0)');
    c.fillStyle = tint;
    c.fillRect(0, 0, W, H);

    // Vinheta profunda na metade inferior (integração natural da manchete na cena)
    const cutStart = opts.cutStart ?? 0.38;
    const bot = c.createLinearGradient(0, H * cutStart, 0, H);
    bot.addColorStop(0, 'rgba(6,8,12,0)');
    bot.addColorStop(0.36, 'rgba(6,8,12,.56)');
    bot.addColorStop(0.68, 'rgba(6,8,12,.88)');
    bot.addColorStop(1, 'rgba(5,7,10,.97)');
    c.fillStyle = bot;
    c.fillRect(0, H * cutStart, W, H * (1 - cutStart));

    // Grão cinematográfico sutil
    c.save();
    c.globalAlpha = 0.025;
    let seed = 17;
    for (let i = 0; i < 1800; i++) {
      seed = (seed * 16807) % 2147483647;
      const gx = seed % W;
      seed = (seed * 16807) % 2147483647;
      const gy = seed % H;
      c.fillStyle = i % 2 ? '#fff' : '#000';
      c.fillRect(gx, gy, 1.4, 1.4);
    }
    c.restore();
  }

  function faseLabel(ed) {
    const f = String(ed?.edicao || '').toLowerCase();
    if (f === 'manha') return 'EDIÇÃO DA MANHÃ · PRÉ-PREGÃO';
    if (f === 'meio') return 'EDIÇÃO DA TARDE · PREGÃO AO VIVO';
    if (f === 'tarde') return 'FECHAMENTO DO PREGÃO';
    if (f === 'fds') return 'EDIÇÃO ESPECIAL · FIM DE SEMANA';
    return 'ANÁLISE DIÁRIA DO MERCADO';
  }

  function masthead(c, W, M, pal, ed, editoria) {
    const topY = M + 48;
    c.save();
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.shadowColor = 'rgba(0,0,0,.68)';
    c.shadowBlur = 18;
    c.shadowOffsetY = 3;

    // Título editorial estilo revista (inspirado na estética condensada de capa)
    c.fillStyle = '#f8fafc';
    c.font = `900 58px ${COND}`;
    c.fillText('JORNAL DO PREGÃO', M, topY);

    c.shadowBlur = 10;
    c.fillStyle = '#e2e8f0';
    c.font = `500 22px ${SANS}`;
    c.fillText(faseLabel(ed), M, topY + 32);

    // Barra vertical de acento + 2 linhas de contexto editorial
    const barY = topY + 52;
    c.shadowBlur = 0;
    c.fillStyle = pal.accent;
    c.fillRect(M, barY, 4.5, 42);

    c.fillStyle = '#f1f5f9';
    c.font = `700 18px ${SANS}`;
    c.fillText(`DIÁRIO TRADER · ${dataCurta(ed?.dia)}`, M + 16, barY + 17);
    c.fillStyle = pal.accentSoft;
    c.font = `700 17px ${MONO}`;
    c.fillText(String(editoria || pal.tag).toUpperCase().slice(0, 34), M + 16, barY + 39);
    c.restore();
  }

  function quebra(c, txt, w, max) {
    const ps = String(txt || '').trim().split(/\s+/).filter(Boolean), ls = [];
    let l = '';
    for (const p of ps) {
      const t = l ? l + ' ' + p : p;
      if (c.measureText(t).width > w && l) { ls.push(l); l = p; }
      else l = t;
    }
    if (l) ls.push(l);
    if (ls.length > max) { ls.length = max; ls[max - 1] = ls[max - 1].replace(/\s+\S*$/, '') + '…'; }
    return ls;
  }

  function drawHeadline(c, txt, cx, bottomY, maxW, maxSize, minSize, maxLines, align = 'center') {
    const clean = String(txt || '').trim().toUpperCase();
    let s = maxSize, ls = [];
    do {
      c.font = `800 ${s}px ${COND}`;
      ls = quebra(c, clean, maxW, 99);
      if (ls.length <= maxLines) break;
      s -= 3;
    } while (s > minSize);
    ls = quebra(c, clean, maxW, maxLines);
    const lh = Math.round(s * 1.12);
    const totalH = ls.length * lh;
    const startY = bottomY - totalH + s;

    c.save();
    c.textAlign = align;
    c.textBaseline = 'alphabetic';
    const gr = c.createLinearGradient(0, startY - s, 0, bottomY + 10);
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(0.65, '#e5e9f0');
    gr.addColorStop(1, '#bcc4d0');
    c.fillStyle = gr;
    c.shadowColor = 'rgba(0,0,0,.85)';
    c.shadowBlur = 22;
    c.shadowOffsetY = 4;
    ls.forEach((line, i) => c.fillText(line, cx, startY + i * lh));
    c.restore();
    return { topY: startY - s, bottomY, lines: ls.length, fontSize: s };
  }

  function drawGlassQuotes(c, qs, M, y, W, pal) {
    const list = (qs || []).slice(0, 3);
    const boxW = W - 2 * M, boxH = 112;
    c.save();
    roundRectPath(c, M, y, boxW, boxH, 20);
    c.fillStyle = 'rgba(11,14,20,.78)';
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.14)';
    c.lineWidth = 1.4;
    c.stroke();
    // filete superior luminoso
    const hi = c.createLinearGradient(M, y, M + boxW, y);
    hi.addColorStop(0, 'rgba(255,255,255,0)');
    hi.addColorStop(0.5, pal.accent);
    hi.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = hi;
    c.fillRect(M + 24, y, boxW - 48, 2);

    if (!list.length) {
      c.fillStyle = '#94a3b8';
      c.font = `500 22px ${SANS}`;
      c.textAlign = 'center';
      c.fillText('Edição Diária · Diário Trader', W / 2, y + 64);
      c.restore();
      return;
    }

    const colW = boxW / list.length;
    list.forEach((a, i) => {
      const cx = M + colW * i + colW / 2;
      if (i) {
        c.fillStyle = 'rgba(255,255,255,.1)';
        c.fillRect(M + colW * i, y + 20, 1.2, boxH - 40);
      }
      c.textAlign = 'center';
      c.fillStyle = '#94a3b8';
      c.font = `700 18px ${SANS}`;
      c.fillText(String(a.n || a.s).toUpperCase().slice(0, 14), cx, y + 32);

      c.fillStyle = '#f8fafc';
      c.font = `700 30px ${MONO}`;
      c.fillText(nf(a.px, a.c), cx, y + 68);

      const up = a.d1 > 0, dn = a.d1 < 0;
      c.fillStyle = up ? '#4ade80' : dn ? '#f87171' : '#94a3b8';
      c.font = `700 21px ${MONO}`;
      c.fillText((up ? '▲ ' : dn ? '▼ ' : '') + pct(a.d1), cx, y + 97);
    });
    c.restore();
  }

  function rodape(c, W, H, M, texto) {
    c.save();
    c.textAlign = 'center';
    c.fillStyle = 'rgba(203,213,225,.66)';
    c.font = `500 17px ${SANS}`;
    c.fillText(texto || 'diario-trader · edição de mercado · dados com atraso · não é recomendação', W / 2, H - M + 18);
    c.restore();
  }

  /* ---------------- modelos de capa (5 modelos cinematográficos) ---------------- */
  function mManchete(c, W, H, ctx) {
    const n = ctx.noticia; if (!n) return false;
    const ed = ctx.ed || edicao();
    const qsAll = cot(ed);
    const info = classificar(n, ed, qsAll);
    const M = 68, story = H / W > 1.6, quad = H === W;

    fundoCena(c, W, H, info.cena, info.pal, { cutStart: story ? 0.34 : 0.38 });
    masthead(c, W, M, info.pal, ed, n.editoria || info.pal.tag);

    // Barra de cotações no rodapé
    const barH = 112;
    const barY = H - M - barH - 22;
    const pick = info.syms.map((sym) => qsAll.find((q) => q.s === sym)).filter(Boolean);
    for (const q of qsAll) if (pick.length < 3 && !pick.some((x) => x.s === q.s)) pick.push(q);
    drawGlassQuotes(c, pick, M, barY, W, info.pal);

    // Subtítulo opcional (linha fina) acima da barra de cotações
    const fina = !quad ? String(n.linha_fina || n.por_que_importa || '').trim() : '';
    let headBottom = barY - 38;
    if (fina) {
      c.save();
      c.font = `500 ${story ? 28 : 23}px ${SANS}`;
      const fls = quebra(c, fina, W - 2 * M - 36, 2);
      const flh = story ? 36 : 30;
      const fy0 = barY - 34 - (fls.length - 1) * flh;
      c.textAlign = 'center';
      c.fillStyle = 'rgba(226,232,240,.84)';
      c.shadowColor = 'rgba(0,0,0,.75)';
      c.shadowBlur = 10;
      fls.forEach((ln, idx) => c.fillText(ln, W / 2, fy0 + idx * flh));
      c.restore();
      headBottom = fy0 - (story ? 44 : 34);
    }

    // Manchete forte de capa centralizada na zona escura inferior (estilo Revista Timing)
    drawHeadline(
      c,
      n.titulo,
      W / 2,
      headBottom,
      W - 2 * M - 24,
      story ? 74 : quad ? 54 : 62,
      story ? 46 : quad ? 36 : 40,
      story ? 4 : quad ? 3 : 4,
      'center',
    );

    rodape(c, W, H, M);
    ctx.meta = info;
    return true;
  }

  function mNumero(c, W, H, ctx) {
    const ed = ctx.ed || edicao();
    const qsAll = cot(ed);
    const mov = qsAll.filter((a) => a.d1 != null).sort((a, b) => Math.abs(b.d1) - Math.abs(a.d1))[0];
    if (!mov) return false;
    const clima = mov.d1 >= 0 ? 'alta' : 'baixa';
    const cena = mov.s === 'BZ=F' || mov.s === 'CL=F' ? 'petroleo'
      : mov.s === 'TIO=F' ? 'minerio'
      : mov.s === 'BRL=X' || mov.s === 'DX-Y.NYB' ? 'dolar'
      : mov.s === 'BTC-USD' ? 'cripto'
      : mov.s === '^GSPC' || mov.s === '^IXIC' ? 'eua'
      : clima === 'baixa' ? 'bolsa-baixa' : 'bolsa-alta';
    const pal = PALETA[clima];
    const M = 68, story = H / W > 1.6;

    fundoCena(c, W, H, cena, pal, { cutStart: 0.28 });
    masthead(c, W, M, pal, ed, 'O NÚMERO DO DIA');

    const cy = H * (story ? 0.56 : 0.57);
    const txt = pct(mov.d1);
    c.save();
    c.textAlign = 'center';
    let s = story ? 220 : 196;
    c.font = `900 ${s}px ${COND}`;
    while (c.measureText(txt).width > W - 2 * M && s > 100) { s -= 8; c.font = `900 ${s}px ${COND}`; }
    c.shadowColor = 'rgba(0,0,0,.85)';
    c.shadowBlur = 28;
    c.shadowOffsetY = 8;
    const gr = c.createLinearGradient(0, cy - s, 0, cy + 10);
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(0.6, mov.d1 >= 0 ? '#6ee7b7' : '#fca5a5');
    gr.addColorStop(1, mov.d1 >= 0 ? '#22c55e' : '#ef4444');
    c.fillStyle = gr;
    c.fillText(txt, W / 2, cy);

    c.shadowBlur = 12;
    c.fillStyle = '#f8fafc';
    c.font = `800 52px ${COND}`;
    c.fillText(String(mov.n || mov.s).toUpperCase(), W / 2, cy + 68);
    c.fillStyle = '#cbd5e1';
    c.font = `600 32px ${MONO}`;
    c.fillText(nf(mov.px, mov.c), W / 2, cy + 112);
    c.restore();

    const resto = qsAll.filter((a) => a.s !== mov.s).slice(0, 3);
    drawGlassQuotes(c, resto, M, H - M - 134, W, pal);
    rodape(c, W, H, M);
    ctx.meta = { cena, clima, rotulo: `Número do dia · ${mov.n}` };
    return true;
  }

  function mPontos(c, W, H, ctx) {
    const ed = ctx.ed || edicao();
    const ns = (ctx.lista || []).slice(0, H === W ? 2 : 3);
    if (ns.length < 2) return false;
    const info = classificar(ns[0], ed);
    const M = 68, story = H / W > 1.6;

    fundoCena(c, W, H, info.cena, info.pal, { cutStart: 0.22 });
    masthead(c, W, M, info.pal, ed, 'TRÊS PONTOS DO PREGÃO');

    let y = story ? H * 0.36 : H === W ? H * 0.35 : H * 0.34;
    const availH = H - M - 60 - y;
    const cardH = Math.min(story ? 260 : 196, (availH - (ns.length - 1) * 18) / ns.length);

    ns.forEach((n, i) => {
      c.save();
      roundRectPath(c, M, y, W - 2 * M, cardH, 22);
      c.fillStyle = 'rgba(11,14,20,.78)';
      c.fill();
      c.strokeStyle = i === 0 ? info.pal.accent : 'rgba(255,255,255,.14)';
      c.lineWidth = i === 0 ? 2 : 1.3;
      c.stroke();

      c.fillStyle = info.pal.accentSoft;
      c.font = `900 58px ${COND}`;
      c.fillText(String(i + 1), M + 28, y + 66);

      c.fillStyle = '#94a3b8';
      c.font = `700 17px ${MONO}`;
      c.fillText(String(n.editoria || 'MERCADOS').toUpperCase(), M + 86, y + 38);

      c.fillStyle = '#f8fafc';
      c.font = `700 ${story ? 36 : 30}px ${SANS}`;
      const ls = quebra(c, n.titulo, W - 2 * M - 114, 3);
      ls.forEach((ln, k) => c.fillText(ln, M + 86, y + 76 + k * (story ? 44 : 38)));
      c.restore();
      y += cardH + 18;
    });

    rodape(c, W, H, M);
    ctx.meta = info;
    return true;
  }

  function mVersus(c, W, H, ctx) {
    const ed = ctx.ed || edicao();
    const qsAll = cot(ed);
    const a = qsAll.find((x) => x.s === '^BVSP');
    const b = qsAll.find((x) => x.s === '^GSPC') || qsAll.find((x) => x.s === 'BRL=X');
    if (!a || !b) return false;
    const M = 68;
    const cenaBR = (a.d1 != null && a.d1 < -0.3) ? 'bolsa-baixa' : 'bolsa-alta';
    const pal = PALETA[(a.d1 != null && a.d1 < -0.3) ? 'baixa' : 'alta'];

    // Split cinema: Brasil à esquerda, EUA à direita
    c.save();
    c.beginPath(); c.rect(0, 0, W / 2, H); c.clip();
    const imL = imgSync(cenaBR);
    if (imL) drawCoverImage(c, imL, 0, 0, W / 2, H, 0.25);
    else { c.fillStyle = '#14110b'; c.fillRect(0, 0, W / 2, H); }
    c.restore();

    c.save();
    c.beginPath(); c.rect(W / 2, 0, W / 2, H); c.clip();
    const imR = imgSync('eua');
    if (imR) drawCoverImage(c, imR, W / 2, 0, W / 2, H, 0.25);
    else { c.fillStyle = '#0c111b'; c.fillRect(W / 2, 0, W / 2, H); }
    c.restore();

    // Vinheta + linha divisória dourada
    const ov = c.createLinearGradient(0, 0, 0, H);
    ov.addColorStop(0, 'rgba(6,8,12,.72)');
    ov.addColorStop(0.35, 'rgba(6,8,12,.22)');
    ov.addColorStop(0.62, 'rgba(6,8,12,.78)');
    ov.addColorStop(1, 'rgba(5,7,10,.96)');
    c.fillStyle = ov;
    c.fillRect(0, 0, W, H);

    c.fillStyle = 'rgba(212,175,105,.55)';
    c.fillRect(W / 2 - 1, H * 0.24, 2, H * 0.62);

    masthead(c, W, M, pal, ed, 'PLACAR · BRASIL × MUNDO');

    const cardY = H - M - 270, cardH = 220, halfW = (W - 2 * M - 24) / 2;
    [[a, M, 'BRASIL'], [b, M + halfW + 24, 'EXTERIOR']].forEach(([q, x, tag]) => {
      c.save();
      roundRectPath(c, x, cardY, halfW, cardH, 22);
      c.fillStyle = 'rgba(11,14,20,.82)';
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,.15)';
      c.lineWidth = 1.4;
      c.stroke();

      const cx = x + halfW / 2;
      c.textAlign = 'center';
      c.fillStyle = '#dfba69';
      c.font = `700 18px ${MONO}`;
      c.fillText(tag, cx, cardY + 38);
      c.fillStyle = '#f8fafc';
      c.font = `800 40px ${COND}`;
      c.fillText(String(q.n).toUpperCase(), cx, cardY + 86);
      c.fillStyle = '#cbd5e1';
      c.font = `600 30px ${MONO}`;
      c.fillText(nf(q.px, q.c), cx, cardY + 132);
      c.fillStyle = q.d1 > 0 ? '#4ade80' : q.d1 < 0 ? '#f87171' : '#94a3b8';
      c.font = `800 42px ${MONO}`;
      c.fillText((q.d1 > 0 ? '▲ ' : q.d1 < 0 ? '▼ ' : '') + pct(q.d1), cx, cardY + 188);
      c.restore();
    });

    rodape(c, W, H, M);
    ctx.meta = { cena: cenaBR, clima: pal === PALETA.baixa ? 'baixa' : 'alta', rotulo: 'Placar Brasil × Mundo' };
    return true;
  }

  function mFechamento(c, W, H, ctx) {
    const dia = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
    const ts = g(() => S.trades, []).map((t) => ({ t, k: g(() => calc(t), null) }))
      .filter((x) => x.k && x.k.pl != null && String(x.t.dtx || x.t.dt || '').slice(0, 10) === dia);
    if (!ts.length) return false;
    const soma = ts.reduce((s, x) => s + x.k.pl, 0);
    const rs = ts.filter((x) => x.k.r != null).map((x) => x.k.r);
    const somaR = rs.length ? rs.reduce((a, b) => a + b, 0) : null;
    const acerto = ts.filter((x) => x.k.pl > 0).length / ts.length * 100;
    const regras = ts.filter((x) => x.t.rules === 's').length;

    const clima = soma >= 0 ? 'alta' : 'baixa';
    const cena = soma >= 0 ? 'bolsa-alta' : 'bolsa-baixa';
    const pal = PALETA[clima];
    const M = 68;

    fundoCena(c, W, H, cena, pal, { cutStart: 0.34 });
    masthead(c, W, M, pal, { dia }, 'MEU FECHAMENTO PESSOAL');

    const big = ctx.ocultar
      ? (somaR != null ? (somaR > 0 ? '+' : somaR < 0 ? '−' : '') + nf(Math.abs(somaR), 2) + 'R' : (soma >= 0 ? 'DIA POSITIVO' : 'DIA NEGATIVO'))
      : (soma > 0 ? '+' : soma < 0 ? '−' : '') + 'R$ ' + nf(Math.abs(soma), 2);

    const cy = H - M - 260;
    c.save();
    c.textAlign = 'center';
    c.shadowColor = 'rgba(0,0,0,.85)';
    c.shadowBlur = 24;
    c.fillStyle = soma >= 0 ? '#4ade80' : '#f87171';
    c.font = `900 ${big.length > 11 ? 116 : 148}px ${COND}`;
    c.fillText(big, W / 2, cy);
    c.fillStyle = '#e2e8f0';
    c.font = `500 28px ${SANS}`;
    c.fillText(ctx.ocultar ? 'Múltiplo de risco somado no pregão' : (somaR != null ? nf(somaR, 2) + 'R somados no pregão' : 'Resultado líquido do pregão'), W / 2, cy + 46);
    c.restore();

    // 3 KPIs em vidro
    const kpiY = H - M - 150, kpiH = 110;
    roundRectPath(c, M, kpiY, W - 2 * M, kpiH, 20);
    c.fillStyle = 'rgba(11,14,20,.8)';
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.15)';
    c.lineWidth = 1.4;
    c.stroke();
    const fs = [['TRADES', String(ts.length)], ['ACERTO', nf(acerto, 0) + '%'], ['NAS REGRAS', `${regras}/${ts.length}`]];
    const cw = (W - 2 * M) / 3;
    fs.forEach(([l, v], i) => {
      const cx = M + cw * i + cw / 2;
      c.save();
      c.textAlign = 'center';
      c.fillStyle = '#94a3b8'; c.font = `700 18px ${SANS}`; c.fillText(l, cx, kpiY + 34);
      c.fillStyle = '#f8fafc'; c.font = `700 42px ${MONO}`; c.fillText(v, cx, kpiY + 84);
      c.restore();
    });

    rodape(c, W, H, M, 'diario-trader · fechamento pessoal · não é recomendação de investimento');
    ctx.meta = { cena, clima, rotulo: 'Meu fechamento' };
    return true;
  }

  const MODELOS = [['manchete', mManchete], ['numero', mNumero], ['pontos', mPontos], ['versus', mVersus]];

  /* ---------------- geração síncrona + assíncrona (aguarda WebP) ---------------- */
  const est = { fmt: 'feed', i: 0, ocultar: true, canvas: null, modelo: '', meta: null };

  function buildFila(ed) {
    const lista = noticias(ed);
    const fila = [];
    lista.forEach((n, i) => {
      fila.push(['manchete', { noticia: n, lista, ed }]);
      if (i === 0) { fila.push(['numero', { ed }]); fila.push(['pontos', { lista, ed }]); }
      if (i === 1) fila.push(['versus', { ed }]);
    });
    if (!lista.length) fila.push(['numero', { ed }], ['versus', { ed }]);
    return fila;
  }

  function cenasNecessarias(tipo, ed, idx) {
    if (tipo === 'dia') return ['bolsa-alta', 'bolsa-baixa'];
    const fila = buildFila(ed);
    const [nome, ctx] = fila[idx % fila.length] || [];
    if (nome === 'versus') return ['bolsa-alta', 'bolsa-baixa', 'eua'];
    if (nome === 'manchete' && ctx?.noticia) return [classificar(ctx.noticia, ed).cena];
    if (nome === 'pontos' && ctx?.lista?.[0]) return [classificar(ctx.lista[0], ed).cena];
    return ['bolsa-alta', 'bolsa-baixa', 'bolsa-cautela', 'eua', 'dolar', 'petroleo', 'minerio', 'cripto'];
  }

  function gerar(tipo) {
    const ed = edicao();
    const [W, H] = FMT[est.fmt] || FMT.feed;
    const cv = d.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'); if (!c) return null;
    if (tipo === 'dia') {
      const ctx = { ocultar: est.ocultar };
      if (mFechamento(c, W, H, ctx)) { est.modelo = 'dia'; est.meta = ctx.meta; cv.__folga = 1; return cv; }
      return null;
    }
    const fila = buildFila(ed);
    for (let k = 0; k < fila.length; k++) {
      const [nome, ctx] = fila[(est.i + k) % fila.length];
      c.clearRect(0, 0, W, H);
      try {
        const fn = MODELOS.find((m) => m[0] === nome)?.[1];
        if (fn && fn(c, W, H, ctx)) {
          est.i = (est.i + k) % fila.length;
          est.modelo = nome;
          est.meta = ctx.meta || null;
          cv.__folga = 1;
          return cv;
        }
      } catch (e) { console.warn('[capas v971]', nome, e); }
    }
    return null;
  }

  async function gerarAsync(fmt = 'feed', idx = 0, tipo = null) {
    const prevFmt = est.fmt, prevI = est.i;
    est.fmt = FMT[fmt] ? fmt : 'feed';
    if (typeof idx === 'number') est.i = idx;
    const ed = edicao();
    await preload(cenasNecessarias(tipo, ed, est.i));
    const cv = gerar(tipo);
    est.fmt = prevFmt;
    est.i = prevI;
    return cv;
  }

  /* ---------------- visor / estúdio de capas (#c561) ---------------- */
  function aviso(m) { try { toast(m, 3500); } catch {} }

  async function abre(tipo) {
    const ed = edicao();
    const isDia = tipo === 'dia';
    await preload(cenasNecessarias(isDia ? 'dia' : null, ed, est.i));
    if (tipo !== 'mesmo') est.canvas = gerar(isDia ? 'dia' : null);
    if (!est.canvas) {
      aviso(isDia ? 'Registre ao menos um trade encerrado hoje para montar a capa do seu fechamento.' : 'Abra o Jornal do Pregão e aguarde a edição e as cotações para gerar a capa.');
      return;
    }
    let el = d.getElementById('c561');
    if (!el) {
      el = d.createElement('div');
      el.id = 'c561';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-label', 'Capa do Jornal do Pregão');
      d.body.append(el);
    }
    const f = Object.entries(FMT).map(([k, v]) => `<button type="button" data-c561-fmt="${k}" aria-pressed="${k === est.fmt}">${v[2]}</button>`).join('');
    const badge = est.meta?.rotulo ? `<span class="c561-cena">${est.meta.rotulo}</span>` : '';
    el.innerHTML = `<div class="c561-bar"><button type="button" data-c561="x">Voltar</button><button type="button" data-c561="nova">Outra capa</button><button type="button" data-c561="dia">Meu fechamento</button></div>
      <div class="c561-opc"><div class="c561-seg" role="group" aria-label="Formato">${f}</div>${badge}${est.modelo === 'dia' ? `<label class="c561-chk"><input type="checkbox" data-c561-ocultar ${est.ocultar ? 'checked' : ''}> Ocultar valores em R$</label>` : ''}</div>
      <div class="c561-img"><img alt="Capa gerada (${est.modelo})" src="${est.canvas.toDataURL('image/png')}"></div>
      <button type="button" class="c561-pri" data-c561="s">Compartilhar / salvar</button>
      <p class="c561-nota">${est.modelo === 'dia' ? 'Seu fechamento de hoje. Confira antes de compartilhar.' : 'Cena escolhida automaticamente pelo tema e humor do pregão. “Outra capa” alterna entre notícias e modelos.'}</p>`;
    el.hidden = false;
    d.body.classList.add('c561-open');
    (el.querySelector('[data-c561="nova"]') || el).focus({ preventScroll: true });
  }

  function fecha() {
    const el = d.getElementById('c561');
    if (el) el.hidden = true;
    d.body.classList.remove('c561-open');
  }

  async function salva() {
    if (!est.canvas) return;
    const blob = await new Promise((r) => est.canvas.toBlob(r, 'image/png'));
    if (!blob) { aviso('Não consegui gerar a imagem.'); return; }
    const nome = 'capa-jornal-' + (est.modelo || 'dia') + '-' + est.fmt + '-' + new Date().toISOString().slice(0, 10) + '.png';
    try {
      const file = new File([blob], nome, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Jornal do Pregão' });
        return;
      }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await saveFile(nome, blob, 'image/png'); aviso('Imagem salva.'); }
    catch { aviso('Não foi possível salvar. Toque e segure a imagem.'); }
  }

  d.addEventListener('click', (e) => {
    const t = e.target.closest?.('[data-c561],[data-c561-fmt],[data-v429-capa],[data-v430-thumb],[data-v429],[data-jr971-capa]');
    if (!t) return;
    if (t.dataset.c561Fmt) { est.fmt = t.dataset.c561Fmt; void abre(est.modelo === 'dia' ? 'dia' : 'mesmo-novo'); return; }
    e.preventDefault();
    e.stopImmediatePropagation();
    const a = t.dataset.c561 || t.dataset.v429 || 'nova';
    if (a === 'x') fecha();
    else if (a === 'dia') void abre('dia');
    else if (a === 's') void salva();
    else if (a === 'nova' && d.body.classList.contains('c561-open')) { est.i++; void abre(); }
    else { est.i = 0; void abre(); }
  }, true);

  d.addEventListener('change', (e) => {
    if (e.target.matches?.('[data-c561-ocultar]')) { est.ocultar = e.target.checked; void abre('dia'); }
  });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && d.body.classList.contains('c561-open')) fecha();
  });

  // Atualiza miniatura antiga (se presente) apenas em renderizações (sem polling 2.5s)
  let ultimaThumb = '';
  const syncThumb = async () => {
    const img = d.querySelector('[data-v430-thumb] img');
    const ed = edicao();
    if (!img || !ed?.manchete) return;
    const k = String(ed.manchete.titulo || '') + '|' + String(ed.clima_capa || '');
    if (k === ultimaThumb && img.dataset.c561 === 'v971') return;
    ultimaThumb = k;
    const cv = await gerarAsync('feed', 0);
    if (cv && img.isConnected) { img.src = cv.toDataURL('image/jpeg', 0.86); img.dataset.c561 = 'v971'; }
  };
  root.addEventListener('diario:render', () => { void syncThumb(); });

  const arte = (n, w = 1200, h = 520) => {
    const info = classificar(n);
    const cv = d.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d'); if (!c) return null;
    fundoCena(c, w, h, info.cena, info.pal, { cutStart: 0.35 });
    return cv;
  };

  root.DiarioCapas561 = {
    cenas: CENAS,
    classificar,
    preload,
    arte,
    gerar: (fmt = 'feed', i = 0, tipo) => {
      const f = est.fmt, j = est.i;
      est.fmt = FMT[fmt] ? fmt : 'feed';
      est.i = i;
      const cv = gerar(tipo);
      est.fmt = f; est.i = j;
      return cv;
    },
    gerarAsync,
    tema,
    abre,
  };
})(window, document);
