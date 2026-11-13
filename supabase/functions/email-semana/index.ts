// Função EMAIL-SEMANA — resumo da semana + a planilha da aba Operações (xlsx montado pelo app; CSV se o app não abriu) por e-mail (Resend).
// v600: também grava o resumo em weekly_reports. Secret: RESEND_API_KEY. Opcional: EMAIL_DE (padrão onboarding@resend.dev). Idempotente (push_log). pg_cron domingo 21h como reserva.
const ENV = (k: string) => Deno.env.get(k) || '';
const SB = ENV('SUPABASE_URL'), SRK = ENV('SUPABASE_SERVICE_ROLE_KEY'), KEY = ENV('RESEND_API_KEY');
const svc = { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json' };
async function db(p: string, init: RequestInit = {}) { const r = await fetch(SB + '/rest/v1/' + p, { ...init, headers: { ...svc, ...((init.headers as any) || {}) } }); if (!r.ok) throw new Error('db ' + r.status + ' ' + (await r.text()).slice(0, 160)); const t = await r.text(); return t ? JSON.parse(t) : null; }
const n = (x: any) => { const v = parseFloat(String(x ?? '').replace(',', '.')); return isFinite(v) ? v : NaN; };
const brl = (v: number) => (v < 0 ? '-' : '') + 'R$ ' + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s: any) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
function res(t: any) { const e = n(t.entry), x = n(t.exit), q = n(t.qty) || 1, pv = n(t.pv) || 1, c = n(t.cost) || 0; if (!isFinite(e) || !isFinite(x)) return NaN; return (x - e) * (t.side === 'V' ? -1 : 1) * q * pv - c; }
function semana() { const agora = new Date(Date.now() - 3 * 3600_000); const d = agora.getUTCDay(); const fim = new Date(agora); fim.setUTCDate(agora.getUTCDate() - ((d + 1) % 7)); const ini = new Date(fim); ini.setUTCDate(fim.getUTCDate() - 6); return [ini.toISOString().slice(0, 10), fim.toISOString().slice(0, 10)]; }
const b64 = (s: string) => { const u8 = new TextEncoder().encode(s); let bin = ''; for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(bin); };
// v600: resumo da semana gravado em weekly_reports (origem 'servidor'; não sobrescreve o que o app já salvou).
const r2 = (v: number | null) => v == null || !isFinite(v) ? null : Math.round(v * 100) / 100;
function resumo(L: { pl: number; min: number | null }[]) {
  const g = L.filter((x) => x.pl > 0), p = L.filter((x) => x.pl < 0), soma = L.reduce((s, x) => s + x.pl, 0);
  const mg = g.length ? g.reduce((s, x) => s + x.pl, 0) / g.length : null, mp = p.length ? -p.reduce((s, x) => s + x.pl, 0) / p.length : null;
  return { n: L.length, g: g.length, p: p.length, soma, acerto: L.length ? g.length / L.length * 100 : null, payoff: mg != null && mp ? mg / mp : null };
}
async function salvaResumo(uid: string, dados: any, T: any[], de: string, ate: string) {
  const L = T.map((t: any) => { const m = /T(\d{2}):(\d{2})/.exec(String(t.dt || '')); return { t, pl: res(t), min: m ? +m[1] * 60 + +m[2] : null }; }).filter((x) => isFinite(x.pl));
  if (!L.length) return;
  const S = resumo(L), plDia: Record<string, number> = {}; L.forEach((x) => { const d = String(x.t.dt).slice(0, 10); plDia[d] = (plDia[d] || 0) + x.pl; });
  let acc = 0, pico = 0, dd = 0; for (const x of L) { acc += x.pl; pico = Math.max(pico, acc); dd = Math.min(dd, acc - pico); }
  const ext: Record<string, any> = {}; (await db(`estado_diario?select=dia,emotional_state,pre_concluido_em&user_id=eq.${uid}&dia=gte.${de}&dia=lte.${ate}`).catch(() => []) || []).forEach((e: any) => (ext[e.dia] = e));
  const hm = (iso: string) => { const d = new Date(new Date(iso).getTime() - 3 * 3600_000); return { dia: d.toISOString().slice(0, 10), min: d.getUTCHours() * 60 + d.getUTCMinutes() }; };
  let chk = 0; const bom = { v: 0, n: 0 }, ruim = { v: 0, n: 0 };
  for (const dia of Object.keys(plDia)) {
    const x = dados?.days?.[dia] || {}, e = ext[dia] || {}, pre = x.preOkEm || e.pre_concluido_em, em = x.emocao || e.emotional_state;
    if (pre) { const h = hm(pre); if (h.dia === dia && h.min <= 540) chk++; }
    if (em === 'calmo' || em === 'focado') { bom.v += plDia[dia]; bom.n++; } else if (em === 'ansioso' || em === 'cansado') { ruim.v += plDia[dia]; ruim.n++; }
  }
  const faixas = [['09:00–10:30', 540, 630], ['10:30–12:00', 630, 720], ['12:00–15:00', 720, 900], ['15:00–18:00', 900, 1080]].map(([f, a, b]) => { const r = resumo(L.filter((x) => x.min != null && x.min >= (a as number) && x.min < (b as number))); return { faixa: f, trades: r.n, acerto: r2(r.acerto), payoff: r2(r.payoff), media_vezes_risco: null, resultado: r2(r.soma) }; });
  const corpo = { user_id: uid, semana_ini: de, semana_fim: ate, origem: 'servidor', gerado_em: new Date().toISOString(), trades: S.n, ganhos: S.g, perdas: S.p, acerto: r2(S.acerto), payoff: r2(S.payoff), resultado: r2(S.soma), maior_queda: r2(dd),
    pregoes: Object.keys(plDia).length, checklist_pre_ok: chk, resultado_calmo_focado: bom.n ? r2(bom.v) : null, resultado_ansioso_cansado: ruim.n ? r2(ruim.v) : null, faixas };
  await db('weekly_reports?on_conflict=user_id,semana_fim', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify(corpo) });
}
async function enviaUm(uid: string, dados: any, forca: boolean, ateX = '', xlsx = '') {
  let [de, ate] = semana();
  if (/^\d{4}-\d{2}-\d{2}$/.test(ateX)) { ate = ateX; const i = new Date(ate + 'T12:00:00Z'); i.setUTCDate(i.getUTCDate() - 6); de = i.toISOString().slice(0, 10); }
  const chave = `email-semana:${uid}:${ate}`;
  if (!forca) { const j = await db(`push_log?select=chave&chave=eq.${encodeURIComponent(chave)}`); if (j?.length) return 'já enviado'; }
  const T = (dados?.trades || []).filter((t: any) => t && t.dt && t.dt.slice(0, 10) >= de && t.dt.slice(0, 10) <= ate).sort((a: any, b: any) => a.dt < b.dt ? -1 : 1);
  if (!T.length && !forca) return 'sem operações';
  if (T.length) await salvaResumo(uid, dados, T, de, ate).catch(() => {}); // v600: histórico em weekly_reports (o app sobrescreve com o cálculo completo)
  const u = await (await fetch(SB + '/auth/v1/admin/users/' + uid, { headers: svc })).json(); const para = u?.email; if (!para) return 'sem e-mail';
  const R = T.map(res), ok = R.filter((v: number) => isFinite(v)), tot = ok.reduce((s: number, v: number) => s + v, 0), g = ok.filter((v: number) => v > 0).length, p = ok.filter((v: number) => v < 0).length;
  const porSetup: Record<string, number> = {}; T.forEach((t: any, i: number) => { if (isFinite(R[i])) porSetup[t.setup || 'Sem setup'] = (porSetup[t.setup || 'Sem setup'] || 0) + R[i]; });
  const dias: Record<string, number> = {}; T.forEach((t: any, i: number) => { if (isFinite(R[i])) dias[t.dt.slice(0, 10)] = (dias[t.dt.slice(0, 10)] || 0) + R[i]; });
  const cor = (v: number) => v >= 0 ? '#0a8f63' : '#c0392b';
  const linhas = (o: Record<string, number>) => Object.entries(o).map(([k, v]) => `<tr><td style="padding:4px 10px">${esc(k)}</td><td style="padding:4px 10px;text-align:right;color:${cor(v)}">${brl(v)}</td></tr>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#13201c"><h2 style="margin:0 0 4px">Sua semana no Diário de Trader</h2><div style="color:#667">${de.split('-').reverse().join('/')} a ${ate.split('-').reverse().join('/')}</div>
<p style="font-size:28px;margin:16px 0;color:${cor(tot)}"><b>${brl(tot)}</b></p><p>${T.length} operações · ${g} ganhos · ${p} perdas · acerto ${ok.length ? Math.round(g / ok.length * 100) : 0}%</p>
<h3>Por dia</h3><table style="border-collapse:collapse">${linhas(dias)}</table><h3>Por setup</h3><table style="border-collapse:collapse">${linhas(porSetup)}</table>
<p style="color:#667;font-size:12px">A planilha da semana vai anexa (abre no Excel).</p></div>`;
  const cab = ['Data', 'Ativo', 'Lado', 'Qtd', 'Entrada', 'Saída', 'Stop', 'Setup', 'Erro', 'Resultado (R$)'];
  const csv = '﻿' + [cab, ...T.map((t: any, i: number) => [t.dt.replace('T', ' '), t.ativo, t.side === 'V' ? 'Venda' : 'Compra', t.qty, t.entry, t.exit, t.stop, t.setup, t.err, isFinite(R[i]) ? R[i].toFixed(2).replace('.', ',') : ''])].map((l) => l.map((c: any) => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(';')).join('\r\n');
  let anexo: any = { filename: `operacoes-${de}-a-${ate}.csv`, content: b64(csv) };
  if (xlsx && xlsx.startsWith(uid + '/')) { // a planilha da aba Operações, montada pelo app (com fotos)
    const f = await fetch(SB + '/storage/v1/object/authenticated/planilhas/' + xlsx, { headers: { apikey: SRK, Authorization: 'Bearer ' + SRK } });
    if (f.ok) { const u8 = new Uint8Array(await f.arrayBuffer()); let bin = ''; for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000)); anexo = { filename: `diario-trades-${de}-a-${ate}.xlsx`, content: btoa(bin) }; }
  }
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: ENV('EMAIL_DE') || 'Diário de Trader <onboarding@resend.dev>', to: [para], subject: `Semana ${de.slice(8)}/${de.slice(5, 7)}–${ate.slice(8)}/${ate.slice(5, 7)}: ${brl(tot)}`, html, attachments: [anexo] }) });
  if (!r.ok) return 'resend ' + r.status + ' ' + (await r.text()).slice(0, 200);
  await db('push_log', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ chave, em: new Date().toISOString() }) }).catch(() => {});
  return 'enviado para ' + para.replace(/(.).+@/, '$1***@');
}
Deno.serve(async (req) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!KEY) return new Response(JSON.stringify({ error: 'Falta RESEND_API_KEY' }), { status: 500, headers: cors });
  let b: any = {}; try { b = await req.json(); } catch { /* */ }
  const out: any = {};
  // pedido do app: só a própria conta
  const tk = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (b.acao === 'agora') {
    const u = await (await fetch(SB + '/auth/v1/user', { headers: { apikey: ENV('SUPABASE_ANON_KEY'), Authorization: 'Bearer ' + tk } })).json().catch(() => null);
    if (!u?.id) return new Response(JSON.stringify({ error: 'Entre na sua conta.' }), { status: 401, headers: cors });
    const d = await db(`diario?select=data&user_id=eq.${u.id}`); out.r = await enviaUm(u.id, d?.[0]?.data, b.forca !== false, String(b.ate || ''), String(b.xlsx || ''));
    return new Response(JSON.stringify(out), { headers: cors });
  }
  if (typeof b.teste === 'string' && /^[0-9a-f]{6}$/.test(b.teste)) { // envio de teste: 1 por dia, só para o dono da conta
    const k = 'email-teste:' + new Date().toISOString().slice(0, 10); const j = await db(`push_log?select=chave&chave=eq.${k}`); if (j?.length) return new Response(JSON.stringify({ r: 'teste já feito hoje' }), { headers: cors });
    const L0 = await db('diario?select=user_id,data'); const x = (L0 || []).find((y: any) => String(y.user_id).startsWith(b.teste)); if (!x) return new Response(JSON.stringify({ r: 'conta não achada' }), { headers: cors });
    out.r = await enviaUm(x.user_id, x.data, true, String(b.ate || '')); await db('push_log', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ chave: k, em: new Date().toISOString() }) }).catch(() => {});
    return new Response(JSON.stringify(out), { headers: cors });
  }
  const L = await db(`diario?select=user_id,data&updated_at=gte.${new Date(Date.now() - 14 * 864e5).toISOString()}`).catch(() => db('diario?select=user_id,data'));
  for (const x of L || []) { if (!x.user_id || x.data?.emailSemana === false) continue; try { out[x.user_id.slice(0, 6)] = await enviaUm(x.user_id, x.data, false); } catch (e) { out[x.user_id.slice(0, 6)] = String((e as Error).message).slice(0, 120); } }
  return new Response(JSON.stringify(out), { headers: cors });
});
