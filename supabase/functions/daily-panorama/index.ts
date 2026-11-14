// DAILY-PANORAMA (v603) — imagem PNG do Panorama de Mercado para o Atalho do iPhone (07:00, 12:00 e 18:30, seg–sex).
// GET /daily-panorama?token=...  → image/png (1080 px de largura, visual escuro/âmbar do app).
// v603: 3 disparos por dia (07:00, 12:00 e 18:30). Título pelo horário de Brasília — até 10:30 "Antes da Abertura",
// 10:31–16:30 "Giro do Meio-Dia", depois "Fechamento do Mercado" — ou pelo parâmetro opcional &turno=manha|almoco|fechamento.
// Dados: a foto mais recente de hoje em panorama_fotos (gerada às 06:50 pela rotina-cron); sem foto de hoje, gera na hora.
// Opcional: &formato=svg devolve o SVG (para conferir o layout).
import { initWasm, Resvg } from 'npm:@resvg/resvg-wasm@2.6.2';
import { panoramaSvg, CHAVE, type Logos } from './svg.ts';
import { resolveLogos, svgDe } from './resolve.ts';
const ENV = (k: string) => Deno.env.get(k) || '';
const SB = ENV('SUPABASE_URL'), SRK = ENV('SUPABASE_SERVICE_ROLE_KEY'), CRON = ENV('CRON_SECRET');
const PAGES = ENV('APP_URL') || 'https://meudiariotrade.github.io/diario-trader/';
const svc = { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json' };
async function db(p: string, init: RequestInit = {}) { const r = await fetch(SB + '/rest/v1/' + p, { ...init, headers: { ...svc, ...((init.headers as any) || {}) } }); if (!r.ok) throw new Error('db ' + r.status); const t = await r.text(); return t ? JSON.parse(t) : null; }
async function sha(s: string) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join(''); }
async function dono(req: Request): Promise<string | null> {
  const tk = new URL(req.url).searchParams.get('token') || '';
  if (!/^[0-9a-f]{48}$/.test(tk)) return null;
  const r = await db(`atalhos_tokens?select=user_id&token_hash=eq.${await sha(tk)}`);
  const uid = r?.[0]?.user_id || null;
  if (uid) db(`atalhos_tokens?user_id=eq.${uid}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ usado_em: new Date().toISOString() }) }).catch(() => {});
  return uid;
}
let wasm: Promise<void> | null = null, fontes: Promise<Uint8Array[]> | null = null;
const prepara = () => {
  wasm ??= initWasm(fetch('https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm')).catch((e) => { wasm = null; throw e; });
  fontes ??= Promise.all(['pdf-sans.ttf', 'pdf-sans-bold.ttf', 'pdf-serif-bold.ttf'].map(async (n) => { const r = await fetch(PAGES + n); if (!r.ok) throw new Error('fonte ' + n); return new Uint8Array(await r.arrayBuffer()); })).catch((e) => { fontes = null; throw e; });
  return Promise.all([wasm, fontes]);
};
const TITULOS: Record<string, string> = { manha: 'Antes da Abertura', almoco: 'Giro do Meio-Dia', fechamento: 'Fechamento do Mercado' };
function tituloTurno(req: Request) {
  const tu = (new URL(req.url).searchParams.get('turno') || '').toLowerCase();
  if (TITULOS[tu]) return TITULOS[tu];
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()).split(':').map(Number);
  const min = h * 60 + m;
  return min <= 630 ? TITULOS.manha : min <= 990 ? TITULOS.almoco : TITULOS.fechamento;
}
const hojeSP = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
async function foto(hoje: string) {
  const ini = new Date(hoje + 'T00:00:00-03:00').toISOString();
  const q = () => db(`panorama_fotos?select=id,slot,gerado,dados&gerado=gte.${ini}&order=gerado.desc&limit=1`);
  let f = (await q())?.[0];
  if (!f) {
    const hm = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
    await fetch(SB + '/functions/v1/rotina-cron', { method: 'POST', signal: AbortSignal.timeout(60_000), headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON }, body: JSON.stringify({ acao: 'matinal', hm }) }).catch(() => null);
    f = (await q())?.[0] || (await db('panorama_fotos?select=id,slot,gerado,dados&order=gerado.desc&limit=1'))?.[0];
  }
  return f;
}
// v608: logos oficiais (brapi / TradingView) e bandeiras embutidos como data URI (resvg não busca na rede).
const b64 = (t: string) => { const u = new TextEncoder().encode(t); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
async function logosDe(dados: any): Promise<Logos> {
  const paises = ((dados?.ag?.eventos || []) as any[]).map((e) => 'PAIS:' + String(e.p || '').slice(0, 2).toUpperCase()).filter((x) => /^PAIS:[A-Z]{2}$/.test(x));
  const adrs = ((dados?.ad?.itens || []) as any[]).map((a) => String(a.s || '')).filter(Boolean);
  const chaves = [...new Set([...Object.values(CHAVE), ...adrs, ...paises])];
  const r = await Promise.race([resolveLogos(chaves), new Promise<Record<string, null>>((ok) => setTimeout(() => ok({}), 8000))]);
  const out: Logos = {};
  await Promise.all(Object.entries(r).map(async ([k, v]) => {
    if (!v || !v.urls?.length) return;
    const svgs = (await Promise.all(v.urls.map((u) => svgDe(u)))).filter(Boolean) as string[];
    if (svgs.length === v.urls.length) out[k] = svgs.map((x) => 'data:image/svg+xml;base64,' + b64(x));
  }));
  return out;
}
Deno.serve(async (req) => {
  const txt = (s: string, st: number) => new Response(s, { status: st, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  if (req.method !== 'GET') return txt('Use GET.', 405);
  try {
    if (!(await dono(req))) return txt('Token inválido.', 401);
    const hoje = hojeSP(), f = await foto(hoje);
    if (!f) return txt('Panorama ainda não disponível.', 503);
    const svg = panoramaSvg(f.dados, new Date(f.gerado), hoje, tituloTurno(req), await logosDe(f.dados).catch(() => ({})));
    if (new URL(req.url).searchParams.get('formato') === 'svg') return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-store' } });
    const [, fb] = await prepara();
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1080 }, font: { fontBuffers: fb, defaultFontFamily: 'DejaVu Sans', loadSystemFonts: false } }).render().asPng();
    return new Response(png, { headers: { 'Content-Type': 'image/png', 'Content-Disposition': `inline; filename="panorama-${hoje}.png"`, 'Cache-Control': 'no-store' } });
  } catch (e) {
    return txt('Falha ao gerar o panorama: ' + (e as Error).message, 500);
  }
});
