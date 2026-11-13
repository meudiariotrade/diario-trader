// ROTINA-CRON (v602) — rotinas agendadas pelo pg_cron (seg–sex, horário de Brasília). Só aceita chamadas com x-cron-secret.
//  acao 'matinal'    (06:50): atualiza a agenda econômica e o fechamento dos mercados globais numa "foto" em panorama_fotos
//                             (mesmo formato da foto do panorama do app), usada pela imagem /daily-panorama às 07:00.
//  acao 'fechamento' (17:45): quem tem trades no dia sem o "Fechar o dia" recebe Web Push; sem aparelho inscrito, e-mail.
const ENV = (k: string) => Deno.env.get(k) || '';
const SB = ENV('SUPABASE_URL'), SRK = ENV('SUPABASE_SERVICE_ROLE_KEY'), ANON = ENV('SUPABASE_ANON_KEY'), CRON = ENV('CRON_SECRET');
const svc = { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json' };
async function db(p: string, init: RequestInit = {}) { const r = await fetch(SB + '/rest/v1/' + p, { ...init, headers: { ...svc, ...((init.headers as any) || {}) } }); if (!r.ok) throw new Error('db ' + r.status + ' ' + (await r.text()).slice(0, 160)); const t = await r.text(); return t ? JSON.parse(t) : null; }
const log = (tarefa: string, ok: boolean, detalhe: string, ms = 0) => db('automacao_log', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ tarefa, ok, detalhe: detalhe.slice(0, 400), ms: Math.round(ms) }) }).catch(() => {});
function agoraSP() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { dia: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour}:${p.minute}`, util: !['Sat', 'Sun'].includes(p.weekday) };
}
const iguais = (a: string, b: string) => { if (!a || !b || a.length !== b.length) return false; let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0; };
const ADR_PAD = ['EWZ', 'WEGZY', 'BBSEY', 'BDORY', 'SUZ', 'SID', 'GGB', 'ITUB', 'PBR', 'VALE', 'ABEV', 'BBD'];

export async function matinal(slot: string) {
  const t0 = Date.now();
  const ja = await db(`panorama_fotos?select=id&slot=eq.${encodeURIComponent(slot)}&limit=1`);
  if (ja?.[0]) return { id: ja[0].id, ja: true };
  const chama = async (fn: string, body: unknown) => { try { const r = await fetch(`${SB}/functions/v1/${fn}`, { method: 'POST', signal: AbortSignal.timeout(40_000), headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON, ...(ANON ? { apikey: ANON, Authorization: 'Bearer ' + ANON } : {}) }, body: JSON.stringify(body) }); return r.ok ? await r.json() : null; } catch { return null; } };
  const [mdo, ag, fe, bal, ad] = await Promise.all([chama('macro', {}), chama('macro', { modo: 'agenda', semana: 0 }), chama('macro', { modo: 'fluxo' }), chama('macro', { modo: 'balancos' }), chama('adrs', { symbols: ADR_PAD })]);
  if (!mdo && !ad) { await log('rotina 06:50', false, `${slot}: macro e adrs não responderam`, Date.now() - t0); return { erro: 'fontes fora do ar' }; }
  const dados = { mdo, ag, fe, bal, ad: ad ? { ts: Date.now(), itens: ad.itens || [], fonte: ad.fonte || '', atraso: !!ad.atraso } : null };
  const r = await db('panorama_fotos', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ slot, dados }) });
  const tres = ((ag?.eventos || []) as any[]).filter((e) => +e.imp >= 1 && new Date(new Date(e.em).getTime() - 3 * 3600_000).toISOString().slice(0, 10) === slot.slice(0, 10)).length;
  await log('rotina 06:50', true, `${slot}: mercados ${mdo ? 'ok' : 'falhou'}, agenda ${ag ? tres + ' evento(s) 3★ hoje' : 'falhou'}, ADRs ${ad ? 'ok' : 'falhou'}`, Date.now() - t0);
  return { id: r?.[0]?.id ?? null, eventos3: tres };
}

let wp: any = null;
async function push() {
  if (wp) return wp;
  const mod: any = await import('npm:web-push@3.6.7'); const w = mod.default ?? mod;
  w.setVapidDetails(ENV('VAPID_SUBJECT') || 'mailto:contato@exemplo.com', ENV('VAPID_PUBLIC'), ENV('VAPID_PRIVATE'));
  return (wp = w);
}
async function fechamento(dia: string) {
  const t0 = Date.now();
  const pend: { user_id: string; trades: number }[] = (await db('rpc/rotina_fechamento_pendentes', { method: 'POST', body: JSON.stringify({ p_dia: dia }) })) || [];
  const out: Record<string, string> = {};
  for (const p of pend) {
    const chave = `fech-lembrete|${p.user_id}|${dia}`;
    const j = await db(`push_log?select=chave&chave=eq.${encodeURIComponent(chave)}`).catch(() => []);
    if (j?.length) { out[p.user_id.slice(0, 6)] = 'já avisado'; continue; }
    const corpo = `${p.trades} trade(s) hoje e o fechamento pós-operação ainda está pendente. São 2 minutos: trades, regras, disciplina e uma frase.`;
    let enviados = 0;
    const subs: any[] = (await db(`push_subs?select=id,sub&user_id=eq.${p.user_id}`).catch(() => [])) || [];
    if (subs.length && ENV('VAPID_PUBLIC') && ENV('VAPID_PRIVATE')) {
      const w = await push().catch(() => null);
      for (const s of subs) {
        try { await w.sendNotification(s.sub, JSON.stringify({ title: '🧾 Fechar o dia', body: corpo, tag: 'fech-' + dia, data: { go: 'home', r: 'fechar' } }), { TTL: 3600, urgency: 'normal' }); enviados++; }
        catch (e) { const st = (e as any)?.statusCode; if (st === 404 || st === 410) await db(`push_subs?id=eq.${encodeURIComponent(s.id)}`, { method: 'DELETE' }).catch(() => {}); }
      }
    }
    let via = enviados ? `push (${enviados})` : '';
    if (!enviados && ENV('RESEND_API_KEY')) {
      const u = await (await fetch(SB + '/auth/v1/admin/users/' + p.user_id, { headers: svc })).json().catch(() => null);
      if (u?.email) {
        const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + ENV('RESEND_API_KEY'), 'Content-Type': 'application/json' }, body: JSON.stringify({ from: ENV('EMAIL_DE') || 'Diário de Trader <onboarding@resend.dev>', to: [u.email], subject: '🧾 Fechar o dia: fechamento pós-operação pendente', html: `<div style="font-family:Arial,sans-serif;max-width:520px;color:#13201c"><h3 style="margin:0 0 8px">Fechar o dia</h3><p>${corpo}</p><p style="color:#667;font-size:12px">Abra o Diário de Trader &rarr; Início &rarr; Fechar o dia.</p></div>` }) });
        if (r.ok) via = 'e-mail';
      }
    }
    if (via) await db('push_log', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ chave, em: new Date().toISOString() }) }).catch(() => {});
    out[p.user_id.slice(0, 6)] = via || 'sem canal';
  }
  await log('lembrete 17:45', true, `${dia}: ${pend.length} conta(s) com fechamento pendente · ${Object.values(out).join(', ') || 'nada a enviar'}`, Date.now() - t0);
  return out;
}
Deno.serve(async (req) => {
  const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return out({ error: 'Método não permitido' }, 405);
  if (!iguais(req.headers.get('x-cron-secret') || '', CRON)) return out({ error: 'Não autorizado' }, 401);
  let b: any = {}; try { b = await req.json(); } catch { /* */ }
  const { dia, util } = agoraSP();
  try {
    if (b.acao === 'matinal') return out(await matinal(`${dia} ${b.hm || '06:50'}`));
    if (b.acao === 'fechamento') { if (!util && !b.forcar) return out({ r: 'fim de semana' }); return out(await fechamento(/^\d{4}-\d{2}-\d{2}$/.test(b.dia || '') ? b.dia : dia)); }
    return out({ error: 'Ação desconhecida' }, 400);
  } catch (e) { await log('rotina ' + (b.acao || '?'), false, (e as Error).message); return out({ error: (e as Error).message }, 500); }
});
