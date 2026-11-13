// CHECK-MORNING-STATUS (v602) — usado pelo Atalho do iPhone às 08:40 (seg–sex).
// GET /check-morning-status?token=...  → texto do alerta se o checklist pré-mercado OU o estado emocional de hoje
// ainda não foram feitos; corpo vazio ('') quando já está tudo feito (o Atalho não manda mensagem).
// Fontes: tabela estado_diario (Meu dia) e, como reserva, o próprio diário sincronizado (diario.data.days).
const ENV = (k: string) => Deno.env.get(k) || '';
const SB = ENV('SUPABASE_URL'), SRK = ENV('SUPABASE_SERVICE_ROLE_KEY');
const svc = { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json' };
const ALERTA = '⚠️ Atenção: faltam 20 min para a abertura (09:00) e seu checklist pré-mercado ainda está pendente. Acesse o Diário de Trader agora.';
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
function hojeSP() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { dia: `${p.year}-${p.month}-${p.day}`, util: !['Sat', 'Sun'].includes(p.weekday) };
}
Deno.serve(async (req) => {
  const txt = (s: string, status = 200) => new Response(s, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  if (req.method !== 'GET' && req.method !== 'POST') return txt('', 405);
  try {
    const uid = await dono(req);
    if (!uid) return txt('Token inválido.', 401);
    const { dia, util } = hojeSP();
    if (!util && new URL(req.url).searchParams.get('forcar') !== '1') return txt('');
    const [ed, di] = await Promise.all([
      db(`estado_diario?select=emotional_state,pre_concluido_em&user_id=eq.${uid}&dia=eq.${dia}`).catch(() => []),
      db(`diario?select=dia:data->days->${dia}&user_id=eq.${uid}`).catch(() => []),
    ]);
    const e = ed?.[0] || {}, d = di?.[0]?.dia || {};
    const pre = !!(e.pre_concluido_em || d.preOkEm), emo = !!(e.emotional_state || d.emocao);
    return txt(pre && emo ? '' : ALERTA);
  } catch (_) {
    // na dúvida, avisa: é melhor um lembrete a mais do que perder o checklist
    return txt(ALERTA);
  }
});
