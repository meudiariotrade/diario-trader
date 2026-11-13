// DAILY-PANORAMA (v602) — imagem PNG do Panorama de Mercado para o Atalho do iPhone (07:00, seg–sex).
// GET /daily-panorama?token=...  → image/png (1080 px de largura, visual escuro/âmbar do app).
// Dados: a foto mais recente de hoje em panorama_fotos (gerada às 06:50 pela rotina-cron); sem foto de hoje, gera na hora.
// Opcional: &formato=svg devolve o SVG (para conferir o layout).
import { initWasm, Resvg } from 'npm:@resvg/resvg-wasm@2.6.2';
import { panoramaSvg } from './svg.ts';
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
Deno.serve(async (req) => {
  const txt = (s: string, st: number) => new Response(s, { status: st, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  if (req.method !== 'GET') return txt('Use GET.', 405);
  try {
    if (!(await dono(req))) return txt('Token inválido.', 401);
    const hoje = hojeSP(), f = await foto(hoje);
    if (!f) return txt('Panorama ainda não disponível.', 503);
    const svg = panoramaSvg(f.dados, new Date(f.gerado), hoje);
    if (new URL(req.url).searchParams.get('formato') === 'svg') return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-store' } });
    const [, fb] = await prepara();
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1080 }, font: { fontBuffers: fb, defaultFontFamily: 'DejaVu Sans', loadSystemFonts: false } }).render().asPng();
    return new Response(png, { headers: { 'Content-Type': 'image/png', 'Content-Disposition': `inline; filename="panorama-${hoje}.png"`, 'Cache-Control': 'no-store' } });
  } catch (e) {
    return txt('Falha ao gerar o panorama: ' + (e as Error).message, 500);
  }
});
