/* v560 — Relatório de desempenho em PDF (publicação editorial, texto selecionável).
 * Não substitui nada: a exportação em planilha continua igual. O painel aparece dentro da
 * janela "Exportar" (#csvch), abaixo das opções de planilha.
 * Dados: S.trades + calc() do núcleo. Resultado em R$ e em "vezes o risco".
 */
(function (w, d) {
  'use strict';
  if (w.DiarioRelatorioPDF) return;

  /* ---------- formatação ---------- */
  const fx = (v, c = 2) => Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
  const sg = v => (v > 0 ? '+' : v < 0 ? '−' : '');
  const money = v => v == null || !isFinite(v) ? '—' : sg(v) + 'R$ ' + fx(v);
  const vezes = v => v == null || !isFinite(v) ? '—' : sg(v) + fx(v) + '×';
  const pc = v => v == null || !isFinite(v) ? '—' : fx(v, 1) + '%';
  const br = s => s.split('-').reverse().join('/');
  const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const MOD = { dt: 'Day trade', sw: 'Swing trade', op: 'Opções', ex: 'EUA e Forex' };
  const MOD_ABA = { dt: 'Day trade', sw: 'Swing trade', op: 'Opções', fx: 'Forex', us: 'EUA' }; // abas de Operações
  const isoLocal = dt => dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');

  /* ---------- dados ---------- */
  function fechados() {
    let lista = [];
    try { lista = (typeof S !== 'undefined' && Array.isArray(S.trades)) ? S.trades : []; } catch { lista = []; }
    const out = [];
    for (const t of lista) {
      let c = null;
      try { c = typeof calc === 'function' ? calc(t) : null; } catch { c = null; }
      if (!c || c.pl == null || !isFinite(c.pl)) continue;
      const dia = String(t.dtx || t.dt || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) continue;
      let mod = '';
      try { mod = typeof modDe === 'function' ? modDe(t) : ''; } catch { mod = ''; }
      const fino = mod === 'ex' ? ((t.forex || t.tipo === 'F') ? 'fx' : 'us') : mod;
      out.push({ modCod: fino, dia, ativo: String(t.ativo || '—'), setup: String(t.setup || 'Sem setup'), mod: MOD[mod] || 'Outros', pl: c.pl, risco: c.risk, r: c.r, semStop: !!c.semStop, regras: t.rules });
    }
    return out.sort((a, b) => (a.dia < b.dia ? -1 : a.dia > b.dia ? 1 : 0));
  }
  const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  function janela(chave, hoje = new Date()) {
    const base = isoLocal(hoje), y = hoje.getFullYear();
    if (chave === 'mes' || chave === 'mes-ant') {
      const ref = new Date(y, hoje.getMonth() - (chave === 'mes-ant' ? 1 : 0), 1);
      const fim = chave === 'mes' ? base : isoLocal(new Date(ref.getFullYear(), ref.getMonth() + 1, 0));
      const nome = MESES_LONGOS[ref.getMonth()].replace(/^./, c => c.toUpperCase()) + ' de ' + ref.getFullYear();
      return { de: isoLocal(ref), ate: fim, nome: chave === 'mes' ? nome + ' (até hoje)' : nome, curto: nome, mensal: true };
    }
    const menos12 = new Date(hoje); menos12.setFullYear(y - 1); menos12.setDate(menos12.getDate() + 1);
    if (chave === 'ytd') return { de: y + '-01-01', ate: base, nome: 'Acumulado no ano', curto: 'Acumulado ' + y };
    if (chave === 'ano') return { de: (y - 1) + '-01-01', ate: (y - 1) + '-12-31', nome: 'Ano fechado ' + (y - 1), curto: 'Ano fechado ' + (y - 1) };
    if (chave === 'tudo') return { de: '0000-01-01', ate: base, nome: 'Todo o histórico', curto: 'Todo o histórico' };
    return { de: isoLocal(menos12), ate: base, nome: 'Últimos 12 meses', curto: 'Últimos 12 meses' };
  }
  function stats(ts) {
    const n = ts.length; if (!n) return { n: 0 };
    const g = ts.filter(t => t.pl > 0), p = ts.filter(t => t.pl < 0);
    const soma = ts.reduce((s, t) => s + t.pl, 0);
    const mg = g.length ? g.reduce((s, t) => s + t.pl, 0) / g.length : null, mp = p.length ? -p.reduce((s, t) => s + t.pl, 0) / p.length : null;
    let acc = 0, pico = 0, dd = 0, seq = 0, maxSeq = 0; const curva = [];
    for (const t of ts) { acc += t.pl; curva.push(acc); pico = Math.max(pico, acc); dd = Math.min(dd, acc - pico); seq = t.pl < 0 ? seq + 1 : 0; maxSeq = Math.max(maxSeq, seq); }
    const comR = ts.filter(t => t.r != null && isFinite(t.r));
    const mediaR = comR.length ? comR.reduce((s, t) => s + t.r, 0) / comR.length : null;
    const alemStop = p.filter(t => t.r != null && t.r < -1.05);
    const custoAlem = alemStop.reduce((s, t) => s + (t.pl + (t.risco || 0)), 0);
    const comRegra = ts.filter(t => t.regras === 's' || t.regras === 'n');
    return { n, soma, acerto: g.length / n * 100, ganhos: g.length, perdas: p.length, payoff: mg != null && mp ? mg / mp : null, mediaR, nR: comR.length, dd, maxSeq, curva,
      melhor: Math.max(...ts.map(t => t.pl)), pior: Math.min(...ts.map(t => t.pl)), alemStop: alemStop.length, custoAlem, semStop: ts.filter(t => t.semStop).length,
      seguiu: comRegra.length ? comRegra.filter(t => t.regras === 's').length / comRegra.length * 100 : null };
  }

  /* ---------- carregamento das bibliotecas já publicadas no app ---------- */
  const script = src => new Promise((ok, err) => { const s = d.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => err(new Error('Não consegui carregar ' + src + '.')); d.head.append(s); });
  async function libs() {
    if (!w.PDFLib) { if (typeof rpLib === 'function') await rpLib(); else await script('pdf-lib.min.js'); }
    if (!w.fontkit) await script('fontkit.umd.min.js');
    const fonte = async n => { const r = await fetch(n); if (!r.ok) throw new Error('Fonte indisponível: ' + n); return new Uint8Array(await r.arrayBuffer()); };
    const [sans, bold, serif] = await Promise.all(['pdf-sans.ttf', 'pdf-sans-bold.ttf', 'pdf-serif-bold.ttf'].map(fonte));
    return { PDFLib: w.PDFLib, fontkit: w.fontkit, sans, bold, serif };
  }

  /* ---------- PDF ---------- */
  async function gerar(chave = '12m', opts = {}) {
    const J = janela(chave), filtroMod = opts.mod && MOD_ABA[opts.mod] ? opts.mod : null;
    const todos = fechados().filter(t => !filtroMod || t.modCod === filtroMod);
    const escopo = filtroMod ? MOD_ABA[filtroMod] : 'Todas as modalidades';
    const ts = todos.filter(t => t.dia >= J.de && t.dia <= J.ate);
    if (!ts.length) { const e = new Error('Não há trades encerrados ' + (filtroMod ? 'de ' + escopo.toLowerCase() + ' ' : '') + 'em ' + J.nome.toLowerCase() + '.'); e.vazio = true; throw e; }
    const S1 = stats(ts);
    const L = await libs();
    const { PDFDocument, rgb } = L.PDFLib;
    const doc = await PDFDocument.create();
    doc.registerFontkit(L.fontkit);
    const F = { r: await doc.embedFont(L.sans, { subset: true }), b: await doc.embedFont(L.bold, { subset: true }), s: await doc.embedFont(L.serif, { subset: true }) };
    const hoje = new Date(), dataBase = br(isoLocal(hoje));
    doc.setTitle('Diário Trader — Relatório de desempenho — ' + escopo + ' — ' + J.nome);
    doc.setSubject('Período ' + (J.de === '0000-01-01' ? 'completo' : br(J.de)) + ' a ' + br(J.ate) + ' · BRL');
    doc.setCreator('Diário Trader v560'); doc.setProducer('Diário Trader');
    const C = { paper: rgb(.953, .941, .91), ink: rgb(.102, .106, .118), mute: rgb(.435, .408, .345), line: rgb(.831, .804, .741), amb: rgb(.553, .424, .2), up: rgb(.122, .478, .302), dn: rgb(.702, .251, .18), gra: rgb(.09, .094, .106), ouro: rgb(.788, .631, .357) };
    const cor = v => (v > 0 ? C.up : v < 0 ? C.dn : C.ink);
    const W = 595.28, H = 841.89, M = 50;
    const pages = [];
    const nova = () => { const p = doc.addPage([W, H]); p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.paper }); pages.push(p); return p; };
    const txt = (p, s, x, y, o = {}) => { const f = o.f || F.r, z = o.z || 9; let X = x; if (o.dir) X = x - f.widthOfTextAtSize(s, z); p.drawText(String(s), { x: X, y, size: z, font: f, color: o.c || C.ink }); };
    const cab = (p, titulo) => {
      txt(p, 'DIÁRIO TRADER · RELATÓRIO DE DESEMPENHO', M, H - 40, { z: 7, c: C.mute });
      txt(p, (J.nome + ' · ' + escopo).toUpperCase(), W - M, H - 40, { z: 7, c: C.mute, dir: 1 });
      p.drawLine({ start: { x: M, y: H - 46 }, end: { x: W - M, y: H - 46 }, thickness: .6, color: C.line });
      txt(p, titulo, M, H - 84, { f: F.s, z: 18 });
      return H - 112;
    };
    const rot = (p, s, y) => { txt(p, s.toUpperCase(), M, y, { z: 7, c: C.amb, f: F.b }); return y - 16; };
    const para = (p, s, y, o = {}) => {
      const z = o.z || 9.2, lh = o.lh || 13.6, larg = o.w || (W - 2 * M), f = o.f || F.r; let linha = '';
      for (const pal of s.split(/\s+/)) { const t = linha ? linha + ' ' + pal : pal; if (f.widthOfTextAtSize(t, z) > larg && linha) { txt(p, linha, M, y, { z, f }); y -= lh; linha = pal; } else linha = t; }
      if (linha) { txt(p, linha, M, y, { z, f }); y -= lh; } return y - 4;
    };
    const tabela = (p, cols, linhas, y, cores) => {
      const total = cols.reduce((s, c) => s + c[1], 0); let x = M;
      for (const [t, l, al] of cols) { al === 'r' ? txt(p, t.toUpperCase(), x + l - 4, y, { z: 6.6, c: C.mute, dir: 1 }) : txt(p, t.toUpperCase(), x + 4, y, { z: 6.6, c: C.mute }); x += l; }
      y -= 6; p.drawLine({ start: { x: M, y }, end: { x: M + total, y }, thickness: .8, color: C.ink }); y -= 12;
      linhas.forEach((ln, i) => {
        x = M;
        ln.forEach((v, j) => { const [, l, al] = cols[j]; const c = cores && cores[i] && cores[i][j] || C.ink; al === 'r' ? txt(p, v, x + l - 4, y, { z: 8.2, c, dir: 1 }) : txt(p, v, x + 4, y, { z: 8.2, c }); x += l; });
        p.drawLine({ start: { x: M, y: y - 5 }, end: { x: M + total, y: y - 5 }, thickness: .5, color: C.line }); y -= 15;
      });
      return y - 8;
    };
    const curva = (p, cv, x0, y0, wd, ht, cLinha, cBase, rotulo = true) => {
      if (cv.length < 2) return;
      const mn = Math.min(0, ...cv), mx = Math.max(0, ...cv), rg = (mx - mn) || 1, X = i => x0 + i / (cv.length - 1) * wd, Y = v => y0 + (v - mn) / rg * ht;
      p.drawLine({ start: { x: x0, y: Y(0) }, end: { x: x0 + wd, y: Y(0) }, thickness: .6, color: cBase, dashArray: [3, 3] });
      for (let i = 1; i < cv.length; i++) p.drawLine({ start: { x: X(i - 1), y: Y(cv[i - 1]) }, end: { x: X(i), y: Y(cv[i]) }, thickness: 1.1, color: cLinha });
      if (rotulo) for (const v of (Math.abs(mn) < rg * .15 ? [mn, mx] : [mn, 0, mx])) txt(p, (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + ' mil', x0 + wd + 6, Y(v) - 2, { z: 6.5, c: C.mute });
    };

    /* Página 1 — capa e resumo executivo */
    let p = nova();
    p.drawRectangle({ x: 0, y: H - 190, width: W, height: 190, color: C.gra });
    txt(p, 'D I Á R I O   ·   T R A D E R', M, H - 60, { f: F.s, z: 13, c: C.ouro });
    txt(p, 'RELATÓRIO DE DESEMPENHO · ' + escopo.toUpperCase(), M, H - 76, { z: 7, c: rgb(.56, .54, .5) });
    curva(p, S1.curva, W * .45, H - 172, W * .45 - 40, 70, C.ouro, rgb(.23, .23, .25));
    let y = H - 238;
    txt(p, J.nome, M, y, { f: F.s, z: 28 }); y -= 18;
    txt(p, (J.de === '0000-01-01' ? 'Desde o primeiro registro' : br(J.de)) + ' a ' + br(J.ate) + ' · moeda BRL · data-base ' + dataBase, M, y, { z: 9, c: C.mute }); y -= 30;
    y = rot(p, 'Resumo executivo', y);
    p.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: .8, color: C.ink });
    const kw = (W - 2 * M) / 3;
    [['Resultado líquido', money(S1.soma), cor(S1.soma)], ['Trades encerrados', String(S1.n), C.ink], ['Média por trade', S1.mediaR == null ? '—' : vezes(S1.mediaR) + ' o risco', cor(S1.mediaR || 0)]].forEach(([l, v, c], i) => {
      const x = M + i * kw; if (i) p.drawLine({ start: { x, y: y - 46 }, end: { x, y }, thickness: .5, color: C.line });
      txt(p, l.toUpperCase(), x + 8, y - 14, { z: 6.8, c: C.mute }); txt(p, v, x + 8, y - 36, { z: 16, c, f: F.b });
    });
    y -= 46; p.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: .8, color: C.ink }); y -= 22;
    y = para(p, `${S1.n} trades com ${pc(S1.acerto)} de acerto (${S1.ganhos} ganhos e ${S1.perdas} perdas)` + (S1.payoff ? ` e payoff de ${fx(S1.payoff)}: o ganho médio foi ${fx(S1.payoff)} vezes a perda média.` : '.'), y);
    y = para(p, `O maior rebaixamento da curva foi de ${money(S1.dd)}, com até ${S1.maxSeq} perdas seguidas.`, y);
    y = para(p, S1.alemStop ? `${S1.alemStop} perdas passaram do stop planejado e custaram ${money(S1.custoAlem)} além do risco — é o ponto de maior ganho de disciplina.` : 'Nenhuma perda passou do stop planejado no período.', y);
    if (S1.semStop) y = para(p, `${S1.semStop} trades foram registrados sem stop; neles a medida “vezes o risco” não existe e aparece como —.`, y);
    y -= 8; y = rot(p, 'Janelas de tempo', y);
    const linhasJ = [], coresJ = [];
    for (const k of ['ano', 'ytd', '12m']) {
      const j = janela(k), s = stats(todos.filter(t => t.dia >= j.de && t.dia <= j.ate));
      linhasJ.push([j.nome, br(j.de) + ' a ' + br(j.ate), s.n ? String(s.n) : '—', s.n ? pc(s.acerto) : '—', s.n ? money(s.soma) : '—', s.n && s.mediaR != null ? vezes(s.mediaR) : '—']);
      coresJ.push([null, C.mute, null, null, s.n ? cor(s.soma) : C.mute, s.n ? cor(s.mediaR || 0) : C.mute]);
    }
    y = tabela(p, [['Janela', 118, 'l'], ['Período', 128, 'l'], ['Trades', 46, 'r'], ['Acerto', 50, 'r'], ['Resultado', 82, 'r'], ['Média', 71, 'r']], linhasJ, y, coresJ);
    para(p, 'Ano fechado: 1º de janeiro a 31 de dezembro do último ano encerrado. Acumulado no ano: de 1º de janeiro até a data-base. Últimos 12 meses: os 365 dias anteriores à data-base. “—” indica ausência de trades, nunca resultado zero.', y, { z: 7.6, lh: 11 });

    /* Páginas de desempenho mês a mês (quebra automática, sem cortar tabelas) */
    const meses = {}; ts.forEach(t => (meses[t.dia.slice(0, 7)] = meses[t.dia.slice(0, 7)] || []).push(t));
    const chaves = Object.keys(meses).sort(); let acc = 0;
    const linhasM = [], coresM = [];
    for (const k of chaves) { const s = stats(meses[k]); acc += s.soma; linhasM.push([MES[+k.slice(5) - 1] + '/' + k.slice(2, 4), String(s.n), pc(s.acerto), money(s.soma), s.mediaR == null ? '—' : vezes(s.mediaR), money(acc)]); coresM.push([null, null, null, cor(s.soma), cor(s.mediaR || 0), null]); }
    const colsM = [['Mês', 70, 'l'], ['Trades', 60, 'r'], ['Acerto', 65, 'r'], ['Resultado', 105, 'r'], ['Média', 80, 'r'], ['Acumulado', 115, 'r']];
    for (let i = 0, primeira = true; i < linhasM.length || primeira; primeira = false) {
      p = nova(); y = cab(p, primeira ? 'Desempenho' : 'Desempenho (continuação)');
      if (primeira) { y = rot(p, 'Curva de resultado acumulado (R$)', y); curva(p, S1.curva, M, y - 130, W - 2 * M - 44, 120, C.ink, C.line); y -= 156; }
      y = rot(p, 'Mês a mês', y);
      const cabe = Math.max(1, Math.floor((y - 70) / 15) - 1);
      y = tabela(p, colsM, linhasM.slice(i, i + cabe), y, coresM.slice(i, i + cabe));
      i += cabe;
      if (i >= linhasM.length) break;
    }

    /* Risco e disciplina */
    p = nova(); y = cab(p, 'Risco e disciplina');
    y = rot(p, 'Risco', y);
    y = tabela(p, [['Medida', 300, 'l'], ['Valor', 195, 'r']], [
      ['Maior rebaixamento da curva', money(S1.dd)], ['Sequência máxima de perdas', String(S1.maxSeq)],
      ['Melhor trade', money(S1.melhor)], ['Pior trade', money(S1.pior)],
      ['Perdas além do stop planejado', S1.alemStop + ' · ' + money(S1.custoAlem)], ['Trades sem stop registrado', String(S1.semStop)],
      ['Trades com “vezes o risco” calculável', S1.nR + ' de ' + S1.n],
      ['Seguiu as regras (onde foi marcado)', S1.seguiu == null ? '—' : pc(S1.seguiu)],
    ], y, [[null, C.dn], [null, null], [null, C.up], [null, C.dn], [null, S1.alemStop ? C.dn : null], [null, null], [null, null], [null, null]]);
    y = rot(p, 'Benchmark', y);
    y = para(p, 'O aplicativo não guarda a série histórica de um índice de referência no aparelho, então este relatório não compara o resultado com o Ibovespa. A comparação aparece como “—” em vez de um número inventado.', y);

    /* Fundamentos: setups, ativos e modalidades */
    p = nova(); y = cab(p, 'Fundamentos da operação');
    const grupo = chave => { const gm = {}; ts.forEach(t => (gm[t[chave]] = gm[t[chave]] || []).push(t)); return Object.entries(gm).map(([k, v]) => [k, stats(v)]).sort((a, b) => b[1].soma - a[1].soma); };
    const bloco = (titulo, chave, limite) => {
      y = rot(p, titulo, y);
      const gr = grupo(chave).slice(0, limite);
      y = tabela(p, [[titulo.replace('Por ', ''), 170, 'l'], ['Trades', 50, 'r'], ['Acerto', 55, 'r'], ['Payoff', 55, 'r'], ['Média', 70, 'r'], ['Resultado', 95, 'r']],
        gr.map(([k, s]) => [k.length > 32 ? k.slice(0, 31) + '…' : k, String(s.n), pc(s.acerto), s.payoff ? fx(s.payoff) : '—', s.mediaR == null ? '—' : vezes(s.mediaR), money(s.soma)]), y,
        gr.map(([, s]) => [null, null, null, null, cor(s.mediaR || 0), cor(s.soma)]));
    };
    if (!filtroMod) bloco('Por modalidade', 'mod', 6); bloco('Por setup', 'setup', 10); bloco('Por ativo', 'ativo', 10);

    /* Metodologia */
    p = nova(); y = cab(p, 'Metodologia');
    for (const [t, s] of [
      ['Fonte', 'Trades encerrados registrados no Diário Trader deste aparelho/conta. Trades em aberto ficam de fora. Moeda: real (BRL). Data-base: ' + dataBase + '.'],
      ['Resultado', 'Diferença entre saída e entrada, vezes quantidade e valor por ponto, menos os custos informados no trade.'],
      ['Vezes o risco', 'Resultado do trade dividido pela perda planejada até o stop. Ganhar o dobro do que se arriscou aparece como +2,00×. Sem stop registrado, a medida não existe e aparece como —.'],
      ['Payoff', 'Ganho médio dos trades vencedores dividido pela perda média dos perdedores.'],
      ['Rebaixamento', 'Maior queda da curva de resultado acumulado a partir de um topo anterior.'],
      ['Limitações', 'Emolumentos e impostos só entram se tiverem sido lançados como custo no trade. A exportação em planilha continua disponível para análise detalhada.'],
    ]) { y = rot(p, t, y); y = para(p, s, y) - 4; }

    const total = pages.length;
    pages.forEach((pg, i) => {
      pg.drawLine({ start: { x: M, y: 40 }, end: { x: W - M, y: 40 }, thickness: .6, color: C.line });
      txt(pg, 'Diário Trader · ' + escopo + ' · BRL · data-base ' + dataBase + ' · ' + J.nome, M, 28, { z: 6.6, c: C.mute });
      txt(pg, 'Página ' + (i + 1) + ' de ' + total, W - M, 28, { z: 6.6, c: C.mute, dir: 1 });
    });
    const bytes = await doc.save();
    const rotulo = (filtroMod ? filtroMod + '-' : '') + (J.mensal ? J.de.slice(0, 7) : chave === 'ano' ? String(hoje.getFullYear() - 1) : chave);
    return { bytes, nome: 'relatorio-desempenho-' + rotulo + '-' + isoLocal(hoje) + '.pdf', paginas: total, janela: J, trades: S1.n };
  }

  /* ---------- painel dentro da janela de exportação ---------- */
  let periodo = '12m', ultimo = null;
  function painel(box) {
    if (!box || box.querySelector('.rel560')) return;
    const sec = d.createElement('section'); sec.className = 'rel560'; sec.setAttribute('aria-labelledby', 'rel560-t');
    sec.innerHTML = `<div><h3 id="rel560-t">Relatório de desempenho (PDF)</h3><p>Publicação para leitura e revisão. A planilha acima continua igual, para enviar ao mentor.</p></div>
      <div class="rel560-per" role="group" aria-label="Período do relatório">
        <button type="button" data-p="12m">Últimos 12 meses</button><button type="button" data-p="ytd">Acumulado no ano</button><button type="button" data-p="ano">Ano fechado</button><button type="button" data-p="tudo">Tudo</button>
      </div>
      <div class="rel560-acoes"><button type="button" class="btn" data-rel560="gerar">Gerar relatório PDF</button></div>
      <div class="rel560-st" role="status" aria-live="polite"></div>`;
    const marca = () => sec.querySelectorAll('[data-p]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.p === periodo)));
    marca();
    sec.addEventListener('click', async e => {
      const pb = e.target.closest('[data-p]'); if (pb) { periodo = pb.dataset.p; marca(); return; }
      const a = e.target.closest('[data-rel560]'); if (!a) return;
      e.stopPropagation();
      const st = sec.querySelector('.rel560-st'), acoes = sec.querySelector('.rel560-acoes');
      if (a.dataset.rel560 === 'gerar') {
        a.disabled = true; st.className = 'rel560-st'; st.textContent = 'Calculando e diagramando…';
        try {
          ultimo = await gerar(periodo);
          st.className = 'rel560-st ok';
          st.textContent = `Relatório pronto · ${ultimo.paginas} páginas · ${ultimo.trades} trades · ${ultimo.janela.nome}`;
          acoes.innerHTML = '<button type="button" class="btn" data-rel560="baixar">Baixar PDF</button><button type="button" class="btn s" data-rel560="abrir">Abrir</button><button type="button" class="btn s" data-rel560="gerar">Gerar de novo</button>';
        } catch (er) {
          st.className = 'rel560-st er'; st.textContent = er.vazio ? er.message : 'Não foi possível gerar: ' + (er.message || er) + ' Seus dados não foram alterados. Tente de novo.';
          a.disabled = false;
        }
      } else if (a.dataset.rel560 === 'baixar' && ultimo) {
        try { await saveFile(ultimo.nome, ultimo.bytes, 'application/pdf'); st.textContent = 'Arquivo enviado para Downloads: ' + ultimo.nome; }
        catch { st.className = 'rel560-st er'; st.textContent = 'O download foi bloqueado. Use “Abrir”.'; }
      } else if (a.dataset.rel560 === 'abrir' && ultimo) {
        const url = URL.createObjectURL(new Blob([ultimo.bytes], { type: 'application/pdf' }));
        const jan = w.open(url, '_blank'); if (!jan) { st.className = 'rel560-st er'; st.textContent = 'O navegador bloqueou a nova aba. Use “Baixar PDF”.'; }
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    });
    const cancelar = box.querySelector('[data-csvm="x"]');
    (cancelar ? cancelar.before(sec) : box.append(sec));
  }
  /* Botões "PDF deste mês" / "PDF do mês passado" das abas de Operações: mesmo relatório editorial,
     filtrado pela modalidade da aba. Interceptados antes do gerador antigo (captura de tela). */
  d.addEventListener('click', async e => {
    const b = e.target.closest('[data-modpdf]'); if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (b.dataset.rel560Ocupado) return; b.dataset.rel560Ocupado = '1';
    let mod = null; try { mod = (typeof STMOD !== 'undefined' && STMOD) || (typeof modAtual === 'function' ? modAtual() : null); } catch { mod = null; }
    const aviso = (m, ms) => { try { toast(m, ms); } catch { } };
    const original = b.innerHTML; b.setAttribute('aria-busy', 'true'); b.textContent = 'Montando o PDF…';
    try {
      const r = await gerar(b.dataset.modpdf === 'ant' ? 'mes-ant' : 'mes', { mod });
      await saveFile(r.nome, r.bytes, 'application/pdf');
      aviso('PDF pronto · ' + r.paginas + ' páginas · ' + r.janela.curto, 3500);
    } catch (er) {
      aviso(er.vazio ? er.message : 'Não foi possível gerar o PDF. Tente de novo.', 4000);
    } finally { b.innerHTML = original; b.removeAttribute('aria-busy'); delete b.dataset.rel560Ocupado; }
  }, true);

  new MutationObserver(() => { const c = d.querySelector('#csvch .csvc'); if (c) painel(c); }).observe(d.documentElement, { childList: true, subtree: true });
  /* A janela de exportação fecha em qualquer clique em [data-csvm]; os botões do relatório não fecham. */
  w.DiarioRelatorioPDF = { gerar, stats, janela, fechados };
})(window, document);
