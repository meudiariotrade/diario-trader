#!/usr/bin/env node
/* v914 — Coleta oficial de indicadores fiscais, dívida pública e macro global para dados-publicos/macro-fiscal.json.
   Fontes 100% públicas e gratuitas:
   - Banco Central do Brasil (API SGS): Selic (432), IPCA 12m (13522), Dívida Bruta/PIB (13762), Dívida Líquida/PIB (4513), Reservas (3546).
   - Yahoo Finance: Treasury 10Y (^TNX) e DXY (DX-Y.NYB).
   Zero Supabase, zero chave paga. */
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('dados-publicos/macro-fiscal.json');

async function bcbUlt(serie) {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie}/dados/ultimos/2?formato=json`;
  const r = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'DiarioTrader/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`BCB ${serie} HTTP ${r.status}`);
  const arr = await r.json();
  if (!Array.isArray(arr) || !arr.length) return null;
  const ult = arr[arr.length - 1];
  const ant = arr.length > 1 ? arr[arr.length - 2] : null;
  const v = Number(String(ult.valor || '').replace(',', '.'));
  const vAnt = ant ? Number(String(ant.valor || '').replace(',', '.')) : null;
  if (!Number.isFinite(v)) return null;
  return { valor: v, anterior: Number.isFinite(vAnt) ? vAnt : null, data: String(ult.data || '') };
}

async function yahooUlt(sym) {
  for (const h of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
    try {
      const r = await fetch(`https://${h}/v8/finance/chart/${encodeURIComponent(sym)}?range=5d&interval=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) continue;
      const j = await r.json();
      const meta = j?.chart?.result?.[0]?.meta;
      const px = Number(meta?.regularMarketPrice);
      const prev = Number(meta?.chartPreviousClose);
      if (Number.isFinite(px) && px > 0) {
        return {
          valor: +px.toFixed(2),
          var_pct: Number.isFinite(prev) && prev > 0 ? +((px / prev - 1) * 100).toFixed(2) : null,
        };
      }
    } catch {}
  }
  return null;
}

async function main() {
  const [selic, ipca12, divBruta, divLiq, reservas, tnx, dxy] = await Promise.all([
    bcbUlt(432).catch(() => null),
    bcbUlt(13522).catch(() => null),
    bcbUlt(13762).catch(() => null),
    bcbUlt(4513).catch(() => null),
    bcbUlt(3546).catch(() => null),
    yahooUlt('^TNX').catch(() => null),
    yahooUlt('DX-Y.NYB').catch(() => null),
  ]);

  const juroReal =
    selic?.valor != null && ipca12?.valor != null
      ? +(((1 + selic.valor / 100) / (1 + ipca12.valor / 100) - 1) * 100).toFixed(2)
      : null;

  const payload = {
    versao: 1,
    gerado_em: new Date().toISOString(),
    fonte: 'Banco Central do Brasil (SGS oficial) · Yahoo Finance (^TNX / DXY) · Referência FMI (WEO)',
    brasil: {
      selic_meta: selic,
      ipca_12m: ipca12,
      juro_real_expost: juroReal,
      divida_bruta_pib: divBruta,
      divida_liquida_pib: divLiq,
      reservas_usd_bi: reservas ? { valor: +(reservas.valor / 1000).toFixed(1), data: reservas.data } : null,
    },
    mundo: {
      us_10y: tnx,
      dxy,
      divida_pib_ref: [
        { pais: 'EUA', pct: 122, fonte: 'FMI / US Treasury' },
        { pais: 'Japão', pct: 250, fonte: 'FMI WEO' },
        { pais: 'Zona do Euro', pct: 88, fonte: 'Eurostat / FMI' },
        { pais: 'China (governo geral)', pct: 88, fonte: 'FMI WEO' },
      ],
    },
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log('Macro-fiscal atualizado:', JSON.stringify({
    selic: selic?.valor,
    ipca12: ipca12?.valor,
    juroReal,
    divBruta: divBruta?.valor,
    divLiq: divLiq?.valor,
    us10y: tnx?.valor,
  }));
}

main().catch((err) => {
  console.error('Erro ao atualizar macro-fiscal:', err?.message || err);
  process.exit(1);
});
