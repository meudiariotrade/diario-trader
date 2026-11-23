#!/usr/bin/env node
/* v896 — Coleta pública de Fundos Imobiliários (FIIs) da B3 para dados-publicos/fiis.json.
   Fonte primária: Fundamentus (fii_resultado.php) — tabela pública consolidada da B3.
   Calcula classificação (Tijolo / Papel / Híbrido / FOF), Spread vs NTN-B, Score FII (0-100) e alertas. */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('dados-publicos/fiis.json');
const NTNB_REF = 6.8; // referência conservadora NTN-B longa (% a.a. real)

function parseBrNum(raw) {
  const s = String(raw || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/%/g, '').trim();
  if (!s || s === '-' || s === 'N/A') return null;
  const n = Number(s.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function stripTags(raw) {
  return String(raw || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

const FOF_SET = new Set(['BCFF11','HFOF11','KFOF11','RBRF11','XPSF11','BPFF11','FOFT11','JSAF11','KISU11','SNFF11','RVBI11','MGFF11','HGFF11','RFOF11']);
const HIB_SET = new Set(['VGHF11','BTHF11','HSAF11','MANA11','KNHF11','RBRX11','SNEL11','TGAR11','URPR11','VINO11']);
const PAPEL_SET = new Set(['KNCR11','KNIP11','MXRF11','CPTS11','IRDM11','RECR11','KNHY11','RBRR11','VGIR11','VGIP11','RBRY11','MCCI11','KNSC11','CVBI11','HABT11','DEVA11','HCTR11','VSLH11','BARI11','HGCR11','VRTA11','BTCI11','CLIN11','PCIP11','RPRI11','KCRE11','KNCA11','RURA11','RZAG11','SNAG11','VGIA11','BBGO11','HGCR11','KNUQ11','WHGR11','AFHI11','CACR11','CYCR11','GALG11','ITRI11','PLCR11','PORD11','VCJR11','XPCI11','KIVO11','OUJP11','MCRE11','ARRI11','BCRI11','RCRB11']);
const TIJOLO_SET = new Set(['HGLG11','XPLG11','BTLG11','VILG11','LVBI11','BRCO11','GGRC11','SDIL11','XPML11','VISC11','HSML11','MALL11','HGBS11','TRXF11','HGRU11','ALZR11','GARE11','RBVA11','KNRI11','HGRE11','PVBI11','BRCR11','JSRE11','RBRP11','TEPP11','HGPO11','RECT11','RZTR11','BPML11','AJFI11','PMLL11','HLOG11','PATL11','RBLG11','VTLT11']);

function classificarTipo(seg, ticker, qtdImoveis) {
  const s = String(seg || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tk = String(ticker || '').toUpperCase();
  if (FOF_SET.has(tk)) return 'FOF';
  if (HIB_SET.has(tk)) return 'Híbrido';
  if (TIJOLO_SET.has(tk)) return 'Tijolo';
  if (PAPEL_SET.has(tk)) return 'Papel';
  if (/titulos|val\.?\s*mob|recebiv|papel|cri\b/.test(s)) return 'Papel';
  if (/hibrid/.test(s)) return 'Híbrido';
  if (/fundo de fundos|fof/.test(s)) return 'FOF';
  if (/logist|shopping|lajes|escritor|varejo|residenc|hotel|hospit|agencia|educac|renda|imoveis/.test(s)) return 'Tijolo';
  if ((qtdImoveis || 0) >= 1) return 'Tijolo';
  return 'Papel';
}

function calcularScoreFII(it, ntnb) {
  const tipo = it.tipo;
  const pvp = it.p_vp;
  const dy = it.dy;
  const vac = it.vacancia;
  const liq = it.liquidez || 0;
  const imoveis = it.qtd_imoveis || 0;
  const vm = it.valor_mercado || 0;
  const spread = dy != null ? +(dy - ntnb).toFixed(2) : null;
  let score = 50;
  const alertas = [];
  const selos = [];

  // 1) P/VP (separado por categoria: Papel vs Tijolo/Híbrido/FOF)
  if (pvp != null && pvp > 0) {
    if (tipo === 'Papel') {
      if (pvp >= 0.88 && pvp <= 1.01) score += 16;
      else if (pvp > 1.01 && pvp <= 1.05) score += 6;
      else if (pvp < 0.82) { score -= 6; alertas.push('Desconto forte em Papel (checar inadimplência)'); }
      else if (pvp > 1.06) { score -= 12; alertas.push('Ágio elevado para FII de Papel'); }
    } else {
      if (pvp >= 0.72 && pvp <= 0.94) { score += 18; selos.push('Desconto raro'); }
      else if (pvp > 0.94 && pvp <= 1.03) score += 10;
      else if (pvp < 0.65) { score -= 4; alertas.push('P/VP muito baixo (checar risco estrutural)'); }
      else if (pvp > 1.08) { score -= 10; alertas.push('Negociado com ágio'); }
    }
  }

  // 2) Dividend Yield 12m + trava anti-Yield Trap + Spread NTN-B
  if (dy != null) {
    if (dy > 17.5) {
      score -= 14;
      alertas.push('Possível Yield Trap (DY > 17,5%)');
    } else if (dy >= 9 && dy <= 14.5) {
      score += 14;
    } else if (dy >= 7.5 && dy < 9) {
      score += 7;
    } else if (dy > 14.5 && dy <= 17.5) {
      score += 8;
      if (tipo === 'Papel') selos.push('High Yield');
    } else if (dy < 6) {
      score -= 8;
    }
    if (spread != null && spread >= 2.5 && dy <= 16.5) score += 6;
  }

  // 3) Vacância (apenas Tijolo)
  if (tipo === 'Tijolo' && vac != null) {
    if (vac <= 5) { score += 12; selos.push('Vacância baixa'); }
    else if (vac <= 10) score += 6;
    else if (vac > 18) { score -= 14; alertas.push('Vacância alta (' + vac.toFixed(1).replace('.', ',') + '%)'); }
    else if (vac > 12) score -= 5;
  }

  // 4) Liquidez diária
  if (liq >= 2_000_000) score += 10;
  else if (liq >= 500_000) score += 6;
  else if (liq < 200_000) { score -= 12; alertas.push('Liquidez baixa'); }

  // 5) Porte & Diversificação
  if (vm >= 1_000_000_000) score += 6;
  else if (vm >= 400_000_000) score += 3;
  if (tipo === 'Tijolo' && imoveis >= 5) score += 4;
  else if (tipo === 'Tijolo' && imoveis === 1) { score -= 6; alertas.push('Mono-ativo'); }

  score = Math.max(0, Math.min(100, Math.round(score)));
  if (score >= 78 && !alertas.length) selos.unshift('Qualidade');
  return { score, spread_ntnb: spread, selos: selos.slice(0, 2), alertas: alertas.slice(0, 2) };
}

function parseFundamentusHtml(html) {
  const tbody = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)?.[1] || '';
  const rows = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = trRe.exec(tbody))) {
    const tds = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((x) => x[1]);
    if (tds.length < 13) continue;
    const ticker = stripTags(tds[0]).toUpperCase();
    if (!/^[A-Z]{4}11B?$/.test(ticker)) continue;
    const segmento = stripTags(tds[1]) || 'Outros';
    const cotacao = parseBrNum(tds[2]);
    const ffo_yield = parseBrNum(tds[3]);
    const dy = parseBrNum(tds[4]);
    const p_vp = parseBrNum(tds[5]);
    const valor_mercado = parseBrNum(tds[6]);
    const liquidez = parseBrNum(tds[7]);
    const qtd_imoveis = parseBrNum(tds[8]);
    const preco_m2 = parseBrNum(tds[9]);
    const aluguel_m2 = parseBrNum(tds[10]);
    const cap_rate = parseBrNum(tds[11]);
    const vacancia = parseBrNum(tds[12]);
    if (!(cotacao > 0)) continue;
    const tipo = classificarTipo(segmento, ticker, qtd_imoveis);
    const base = {
      ticker,
      segmento,
      tipo,
      cotacao,
      ffo_yield,
      dy,
      p_vp,
      valor_mercado,
      liquidez,
      qtd_imoveis: qtd_imoveis != null ? Math.round(qtd_imoveis) : null,
      preco_m2,
      aluguel_m2,
      cap_rate,
      vacancia,
    };
    const av = calcularScoreFII(base, NTNB_REF);
    rows.push({ ...base, ...av });
  }
  return rows.sort((a, b) => (b.liquidez || 0) - (a.liquidez || 0));
}

async function main() {
  const r = await fetch('https://www.fundamentus.com.br/fii_resultado.php', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw new Error('Fundamentus HTTP ' + r.status);
  const buf = await r.arrayBuffer();
  const html = new TextDecoder('iso-8859-1').decode(buf);
  const all = parseFundamentusHtml(html);
  const rows = all.filter((x) => (x.liquidez || 0) >= 50_000 || (x.valor_mercado || 0) >= 100_000_000).slice(0, 220);
  if (rows.length < 30) throw new Error('Poucos FIIs encontrados: ' + rows.length);
  const payload = {
    versao: 1,
    gerado_em: new Date().toISOString(),
    fonte: 'Fundamentus FIIs (B3) · referência NTN-B ' + NTNB_REF.toFixed(1).replace('.', ',') + '% a.a.',
    ntnb_ref: NTNB_REF,
    total: rows.length,
    rows,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log('FIIs atualizados:', rows.length, 'em', OUT);
}

main().catch((err) => {
  console.error('Erro ao atualizar FIIs:', err?.message || err);
  process.exit(1);
});
