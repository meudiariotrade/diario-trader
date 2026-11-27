// v836 — Gera cloudflare/diario-noticias/macro-gerado.mjs a partir de supabase/functions/macro (fonte única):
// remove os tipos, troca o Deno.serve por um despachante sem login (dados públicos) e exporta.
const fs = require('fs'), path = require('path'), { stripTypeScriptTypes } = require('module');
const raiz = path.join(__dirname, '..'), dir = path.join(raiz, 'supabase/functions/macro');
let saz = stripTypeScriptTypes(fs.readFileSync(path.join(dir, 'sazonal-us.ts'), 'utf8'));
let src = fs.readFileSync(path.join(dir, 'index.ts'), 'utf8');
src = src.replace(/^import \{ sazonalidadeUs \} from "\.\/sazonal-us\.ts";\n/m, '');
const i = src.indexOf('Deno.serve(');
if (i < 0) throw new Error('Deno.serve não encontrado em macro/index.ts');
let corpo = stripTypeScriptTypes(src.slice(0, i));
corpo = corpo.replace(/Deno\.env\.get\(/g, '((_k) => undefined)(');
saz = saz.replace(/^export /gm, '');
const desp = `
export const MACRO_MODOS = { painel: () => painel(), balancos: () => balancos(7), ranking: () => ranking(), sazonal_us: () => sazonalidadeUs(), sazonal: () => sazonalidade(), fluxo: () => fluxo(), setores: () => setores() };
/** Mesmo contrato da função macro do Supabase; devolve {status, body}. */
export async function macroResponder(c = {}) {
  try {
    const f = MACRO_MODOS[c.modo];
    if (f) return { status: 200, body: await f() };
    if (c.modo === 'cotacoes') return { status: 200, body: await cotacoes(String(c.aba || 'fut')) };
    if (c.modo === 'agenda') return { status: 200, body: await agenda(Math.max(0, Math.min(1, Math.trunc(+c.semana || 0)))) };
    if (c.modo) return { status: 400, body: { error: 'modo_nao_suportado' } };
    const [m, b] = await Promise.allSettled([mercados(), brasil()]);
    return { status: 200, body: { mercados: m.status === 'fulfilled' ? m.value : null, brasil: b.status === 'fulfilled' ? b.value : null, erros: [m, b].filter((x) => x.status === 'rejected').map((x) => String(x.reason?.message || x.reason)) } };
  } catch (e) { return { status: 502, body: { error: String(e?.message || e) } }; }
}
`;
corpo = (s=>s.replace('const r = await fetch(`https://scanner.tradingview.com/${mercado}/scan`, {','const r = await scanMercadoV954(fetch, `https://scanner.tradingview.com/${mercado}/scan`, {').replace('out[x.s] = { simboloFonte:x.s,','out[x.s] = { ...cotacaoMetaV954(x,TV_COLS), simboloFonte:x.simboloFonte||x.s,').replace(/baseVariacao:\(t\s*\)\.baseVariacao\}\);/,'baseVariacao:t.baseVariacao,quoteStatus:t.quoteStatus,priceAt:t.priceAt});').replace('if (!juro && it.d1 != null',"if(a.s==='BZ=F'){it.spark=[];it.m1=t?.m1??null;}\n  if (!juro && it.d1 != null"))(corpo);
// v1029: a fonte legada permanece intacta; o contrato público da borda usa FEF2.
corpo=corpo.replace("'TIO=F': ['SGX:FEF1!', 'COMEX:TIO1!']","'TIO=F': ['SGX:FEF2!']").replace("{ s: 'SGX:FEF1!', n: 'Minério de ferro (Singapura)'","{ s: 'SGX:FEF2!', n: 'Minério de ferro (SGX FEF2!)'");
const out = "import {scanMercadoV954,cotacaoMetaV954} from './cotacoes-v954.mjs';\n" + '/* GERADO por scripts/gerar-worker-macro.cjs a partir de supabase/functions/macro — não edite aqui. */\n' + saz + '\n' + corpo + desp;
fs.writeFileSync(path.join(raiz, 'cloudflare/diario-noticias/macro-gerado.mjs'), out);
console.log('macro-gerado.mjs', out.length, 'bytes');
// EWZ: só as regras puras (contratos, resumo, volatilidade, OI, incremento, estruturas, horaNY).
{
  const e = fs.readFileSync(path.join(raiz, 'supabase/functions/ewz/index.ts'), 'utf8'), k = e.indexOf('// ===== segurança');
  if (k < 0) throw new Error('marcador de segurança não encontrado em ewz/index.ts');
  const o = '/* GERADO por scripts/gerar-worker-macro.cjs a partir de supabase/functions/ewz — não edite aqui. */\n' + stripTypeScriptTypes(e.slice(0, k));
  fs.writeFileSync(path.join(raiz, 'cloudflare/diario-noticias/ewz-gerado.mjs'), o);
  console.log('ewz-gerado.mjs', o.length, 'bytes');
}
