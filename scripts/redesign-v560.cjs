#!/usr/bin/env node
/* v560 — Identidade "Terminal Grafite".
 *
 * Gera, a partir da publicação v554, uma única folha de estilo (estilo-v560.css) no lugar das
 * 13 camadas anteriores (2 blocos <style> do index.html + 12 arquivos CSS) e os bundles
 * nucleo-v560.js / camadas-v560.js com a nova paleta.
 *
 * Regras aplicadas de forma determinística:
 *  - Paleta: verdes/teal de marca -> âmbar; fundos/bordas coloridos -> grafite neutro;
 *    verde e vermelho ficam só para variação (contextos de alta/baixa, lucro/perda).
 *  - Espaçamento em escala de 8 pt com ajustes finos de 4 px (padding, margin, gap, inset).
 *  - Bordas sempre 1 px (contornos de foco mantêm 2 px para acessibilidade).
 *  - Raios contidos: 4 / 6 / 8 px; pílulas e círculos preservados.
 *  - Botões equivalentes com 40 px de altura.
 * Uso: node scripts/redesign-v560.cjs  (lê as fontes v522/v554 e escreve os arquivos v560)
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const BASE = '8f852aa'; // publicação v554: todas as entradas do gerador vêm deste commit (reprodutível)
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const git = f => require('node:child_process').execSync('git show ' + BASE + ':' + f, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 27 });
const wr = (f, s) => fs.writeFileSync(path.join(root, f), s);

/* ---------------- cores ---------------- */
const P = {
  amber: [201, 161, 91], amberHi: [226, 194, 133],
  up: [63, 185, 124], down: [232, 99, 79], info: [127, 167, 201],
};
function hexToRgb(h) {
  h = h.slice(1);
  if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('');
  const n = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return [...n, a];
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  if (!s) return [l, l, l].map(v => Math.round(v * 255));
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255));
}
const POS = /(pos-por-contraste|pos|up\b|-up|gain|ganho|lucro|alta|\bwin|profit|success|sucesso|verde|\.g\b|\bg\b|buy|compra|positivo|ok\b|bull|lucr)/i;
const NEG = /(neg|down|dn\b|loss|perda|baixa|preju|erro|error|danger|venda|sell|bear|\.r\b|negativo|alerta)/i;
/** Mapeia uma cor RGB(A) para a paleta Terminal Grafite, considerando o contexto (seletor/propriedade). */
function mapRgb([r, g, b, a], ctx = '') {
  const [h, s, l] = rgbToHsl(r, g, b);
  let out;
  const neutral = (ll, warm = false) => hslToRgb(warm ? 40 : 220, warm ? .10 : .07, ll);
  if (s < .12) out = [r, g, b];                                   // já neutro
  else if ((h >= 345 || h < 22) && s > .3) out = hslToRgb(8, Math.min(s, .76), l); // vermelho semântico
  else if (h >= 22 && h < 66) out = hslToRgb(39, Math.min(s, .52), Math.min(l, .74)); // ouro/laranja -> âmbar
  else if (h >= 66 && h < 205) {                                  // verdes, teal, ciano
    if (l < .2) out = neutral(l * .9);                            // fundos
    else if (l > .82) out = neutral(Math.min(l, .93), true);      // textos claros esverdeados
    else if (s < .38 || l < .3) out = neutral(l * .92);           // bordas/superfícies
    else if (POS.test(ctx)) out = hslToRgb(150, .5, Math.max(.36, Math.min(l, .6)));
    else if (NEG.test(ctx)) out = hslToRgb(8, .72, Math.max(.4, Math.min(l, .6)));
    else out = hslToRgb(39, .5, Math.max(.45, Math.min(l, .66))); // destaque de marca -> âmbar
  } else if (h >= 205 && h < 255) {                               // azuis
    if (l < .3) out = neutral(l * .9);
    else if (l > .85) out = neutral(l, true);
    else if (s > .35 && l > .45) out = hslToRgb(208, .4, Math.min(l, .66)); // informação
    else out = neutral(l);
  } else out = l < .3 ? neutral(l * .9) : neutral(l, true);       // roxos/rosas
  return [...out, a];
}
const toHex = ([r, g, b, a]) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('') + (a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : '');
function mapColorsIn(text, ctx) {
  return text
    .replace(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g, m => toHex(mapRgb(hexToRgb(m), ctx)))
    .replace(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+%?)\s*)?\)/g, (m, r, g, b, a) => {
      let al = a == null ? 1 : a.endsWith('%') ? parseFloat(a) / 100 : +a;
      const [R, G, B] = mapRgb([+r, +g, +b, al], ctx);
      return al < 1 ? `rgba(${R},${G},${B},${+al.toFixed(3)})` : `rgb(${R},${G},${B})`;
    });
}

/* ---------------- espaçamento ---------------- */
function snap(px) {
  const a = Math.abs(px), s = Math.sign(px);
  if (a <= 1) return px;              // linhas finas e ajustes ópticos de 1 px
  if (a <= 3) return 4 * s;
  const lo = Math.floor(a / 4) * 4, hi = lo + 4;
  if (a === lo) return px;
  const d1 = a - lo, d2 = hi - a;
  const v = d1 < d2 ? lo : d2 < d1 ? hi : (lo % 8 === 0 ? lo : hi); // empate: múltiplo de 8
  return v * s;
}
const SPACE_PROPS = /^(padding|margin|gap|row-gap|column-gap|grid-gap|inset|top|right|bottom|left|padding-[a-z-]+|margin-[a-z-]+|scroll-padding[a-z-]*|scroll-margin[a-z-]*)$/;
function normDecl(prop, val, sel) {
  const p = prop.trim().toLowerCase();
  const last = sel.split(',').map(x => x.trim().split(/[\s>+~]+/).pop() || '').join(' ');
  if (/^(padding|margin)/.test(p) || /gap$/.test(p)) {
    val = val.replace(/(-?\d*\.?\d+)px/g, (m, n) => snap(parseFloat(n)) + 'px');
    // Cartões: 24 px de padding quando o cartão já usava respiro de cartão (>= 12 px).
    if (p === 'padding' && /\.[\w-]*card\b|\.card[\w-]*/.test(last) && !/chip|mini|pill|tag|btn/.test(last)) {
      const nums = [...val.matchAll(/(\d+)px/g)].map(x => +x[1]);
      if (nums.length && Math.min(...nums) >= 12) val = val.replace(/^[^!]*/, '24px');
    }
    // Espaço entre cartões: 24 px em grades e listas de cartões.
    if (/gap$/.test(p) && /(grid|cards|tiles|kpis|v4-home|stack|lista|page|screen|-view\b|painel|panel)/i.test(last)) {
      val = val.replace(/(\d+)px/g, (m, n) => (+n >= 12 ? '24px' : m));
    }
  }
  if (/^border(-(top|right|bottom|left))?(-width)?$/.test(p) && !/:focus|outline/.test(sel)) {
    val = val.replace(/(\d*\.?\d+)px/, (m, n) => (+n > 0 && +n <= 3 ? '1px' : m));
  }
  if (/^border(-[a-z]+)?-radius$/.test(p)) {
    val = val.replace(/(\d*\.?\d+)px/g, (m, n) => {
      n = +n; if (n >= 99) return m; if (n <= 3) return n + 'px'; if (n <= 5) return '4px'; if (n <= 8) return '6px'; return '8px';
    });
  }
  if (/^(min-)?height$/.test(p) && /(^|[\s,>+~(])(button|\.btn)\b|\.btn\b|\[type=(button|submit)\]/.test(sel)) {
    val = val.replace(/^(\s*)(3[2-9]|4[0-8])px/, '$140px');
  }
  return val;
}

/* Percorre regras CSS (inclusive @media aninhado) aplicando cores e espaçamento. */
function transformCss(css) {
  let out = '', i = 0;
  const stack = [];
  while (i < css.length) {
    if (css.startsWith('/*', i)) { const j = css.indexOf('*/', i + 2); out += css.slice(i, j < 0 ? css.length : j + 2); i = j < 0 ? css.length : j + 2; continue; }
    const open = css.indexOf('{', i), close = css.indexOf('}', i);
    if (open !== -1 && (close === -1 || open < close)) {
      const head = css.slice(i, open);
      const isAt = /^\s*@/.test(head);
      // bloco de declarações = sem chaves internas até o fechamento
      const nextOpen = css.indexOf('{', open + 1), nextClose = css.indexOf('}', open + 1);
      if (!isAt || /^\s*@(font-face|page)/.test(head)) {
        if (nextClose !== -1 && (nextOpen === -1 || nextClose < nextOpen)) {
          const body = css.slice(open + 1, nextClose);
          out += head + '{' + transformBody(body, head) + '}';
          i = nextClose + 1; continue;
        }
      }
      out += head + '{'; stack.push(head); i = open + 1; continue;
    }
    if (close !== -1) { out += css.slice(i, close + 1); stack.pop(); i = close + 1; continue; }
    out += css.slice(i); break;
  }
  return out;
}
function transformBody(body, sel) {
  // separa declarações respeitando parênteses e strings
  const parts = []; let depth = 0, q = null, cur = '';
  for (const ch of body) {
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === '(') depth++; if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += ch;
  }
  parts.push(cur);
  return parts.map(d => {
    const k = d.indexOf(':'); if (k < 0) return d;
    const prop = d.slice(0, k), val = d.slice(k + 1);
    if (/^\s*--/.test(prop)) return prop + ':' + mapColorsIn(val, sel + ' ' + prop);
    let v = mapColorsIn(val, sel + ' ' + prop);
    // Bordas douradas viram linhas neutras de 1 px (âmbar só em estado ativo, seleção e foco).
    if (/^\s*border(-(top|right|bottom|left))?(-color)?\s*$/i.test(prop) && !/\.on\b|active|current|pressed|selected|checked|:focus|:hover|\.ab\b|-on\b|\.sel\b/i.test(sel.replace(/:not\((?:[^()]|\([^()]*\))*\)/g, ''))) {
      v = v.replace(/#([0-9a-f]{6})([0-9a-f]{2})?\b/gi, (m, h) => { const [r, g, b2] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); const [hh, ss] = rgbToHsl(r, g, b2); return hh >= 30 && hh < 50 && ss > .3 ? 'rgba(255,255,255,.14)' : m; });
    }
    return prop + ':' + normDecl(prop, v, sel);
  }).join(';');
}

/* JavaScript: uma única passada, com as posições calculadas sobre o texto original (nada é convertido duas vezes).
   1) literais que são CSS completo (folhas injetadas em <style>) → transformCss;
   2) demais cores em texto (estilos inline, desenhos em canvas, SVG): hex de 6/8 dígitos e rgb()/rgba()
      em qualquer literal; hex de 3/4 dígitos só dentro de declarações CSS (evita confundir com seletores #id).
   Verde ao lado de um vermelho (padrão alta ? verde : vermelho) é tratado como variação positiva. */
function transformJs(js) {
  const acorn = require('acorn');
  const edits = [];
  const ast = acorn.parse(js, { ecmaVersion: 'latest', allowHashBang: true });
  const isCss = raw => raw.length > 40 && !raw.includes('${') && (raw.match(/\{/g) || []).length === (raw.match(/\}/g) || []).length
    && /[\w\]\)*>-]\s*\{[^{}]*?[a-z-]+\s*:\s*[^{};]+;?[^{}]*\}/i.test(raw) && !/\bfunction\b|=>|\breturn\b/.test(raw);
  const literais = [];
  (function walk(n) {
    if (!n || typeof n.type !== 'string') return;
    if (n.type === 'Literal' && typeof n.value === 'string') literais.push([n.start + 1, n.end - 1]);
    else if (n.type === 'TemplateElement') literais.push([n.start, n.end]);
    for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); }
  })(ast);
  const RED = /#(?:e[0-9a-f]|f[0-9a-f]|d[0-9a-f]|b[0-9a-f])[0-6][0-9a-f][0-6][0-9a-f]\b|rgba?\(\s*2[0-5]\d\s*,\s*[0-9]{1,2}\s*,/i;
  for (const [a, b] of literais) {
    const raw = js.slice(a, b);
    if (isCss(raw)) { const t = transformCss(raw); if (t !== raw) edits.push([a, b, t]); continue; }
    if (!/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(raw)) continue;
    const ctxOf = off => { const ini = Math.max(0, a + off - 140), viz = js.slice(Math.max(0, a + off - 90), a + off + 90); return js.slice(ini, a + off + 40) + (RED.test(viz) ? ' pos-por-contraste ' : ''); };
    let out = raw.replace(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6})\b/g, (m, off) => toHex(mapRgb(hexToRgb(m), ctxOf(off))))
      .replace(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+%?)\s*)?\)/g, (m, r, g, bb, al, off) => {
        const A = al == null ? 1 : al.endsWith('%') ? parseFloat(al) / 100 : +al; const [R, G, B] = mapRgb([+r, +g, +bb, A], ctxOf(off));
        return A < 1 ? `rgba(${R},${G},${B},${+A.toFixed(3)})` : `rgb(${R},${G},${B})`; })
      .replace(/((?:background(?:-color)?|color|fill|stroke|stop-color|border(?:-[a-z]+)*|outline(?:-color)?|accent-color)\s*[:=]\s*\\?["']?)(#[0-9a-fA-F]{3,4})\b/g, (m, pre, hx, off) => pre + toHex(mapRgb(hexToRgb(hx), ctxOf(off))));
    if (out !== raw) edits.push([a, b, out]);
  }
  edits.sort((x, y) => y[0] - x[0]);
  for (const [a, b, t] of edits) js = js.slice(0, a) + t + js.slice(b);
  // Chaves de destaque de paletas (ac/accent/brand) são sempre âmbar, mesmo ao lado de verde/vermelho.
  return js.replace(/([{,]\s*(?:ac|accent|brand)\s*:\s*["'])#([0-9a-f]{6})(["'])/gi, (m, pre, h, q) => { const [hh, ss] = rgbToHsl(...[0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))); return hh >= 66 && hh < 205 && ss > .3 ? pre + '#c9a15b' + q : m; });
}

/* ---------------- montagem ---------------- */
const LEGACY_CSS = ['estilo-v522.css', 'validacao-terminal.css', 'terminal-gestos-seguros.css', 'navegacao-simples.css', 'terminal-inicio.css',
  'terminal-bbg.css', 'modo-simples.css', 'plano-operacional.css', 'estudos-mercado-v546.css', 'mercado-simples-v549.css', 'melhorias-v550.css', 'ajustes-v554.css'];

const SMALL_JS = ['terminal-fonte-v533.js', 'app.js', 'inicio.js', 'terminal-gp-v421.js']; // auxiliar com cores próprias + fontes do núcleo

function build() {
  // Fonte: index.html da v554 (blocos <style> embutidos). O bloco "hotfix-versao-v389" era um rótulo de depuração
  // (" · visual v390" ao lado do título do Mercado) e fica de fora.
  const srcIndex = git('index.html');
  const inline = [...srcIndex.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)].filter(m => !/hotfix-versao/.test(m[1])).map(m => m[2]);
  const pieces = [
    ...inline.map((c, n) => ['index.html <style> ' + (n + 1), c]),
    ...LEGACY_CSS.map(f => [f, git(f)]),
  ];
  const legacy = pieces.map(([name, c]) => `/* ── origem: ${name} ── */\n` + transformCss(c)).join('\n');
  const ds = rd('design-system-v560.css');
  const css = `/* Diário Trader v560 — folha única. Gerada por scripts/redesign-v560.cjs.\n   1) Tokens do design system  2) Telas existentes já normalizadas (cores, 8 pt, bordas 1 px)  3) Componentes do design system. */\n`
    + ds.split('/*@@COMPONENTES@@*/')[0] + '\n' + legacy + '\n' + ds.split('/*@@COMPONENTES@@*/')[1];
  wr('estilo-v560.css', css);
  wr('nucleo-v560.js', transformJs(git('nucleo-v522.js')).replace('Diário de Trader v522 — núcleo.', 'Diário de Trader v560 — núcleo (paleta Terminal Grafite).'));
  wr('camadas-v560.js', transformJs(git('camadas-v522.js')));
  // Fontes do núcleo e arquivos auxiliares com cores próprias recebem a mesma paleta (mantém fonte e bundle iguais).
  for (const f of ['tema-claro-v427.css', ...SMALL_JS]) wr(f, f.endsWith('.css') ? transformCss(git(f)) : transformJs(git(f)));
  console.log('estilo-v560.css', css.length, 'bytes; bundles v560 gerados.');
}
module.exports = { mapRgb, snap, transformCss, transformJs, normDecl };
if (require.main === module) build();
