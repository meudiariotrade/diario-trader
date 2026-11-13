// INBOUND-BTG-NOTE (v602) — recebe PDFs de nota de corretagem do BTG Pactual (padrão SINACOR).
// POST /inbound-btg-note?token=...  aceita:
//   • o PDF puro (Content-Type: application/pdf) — ex.: Atalho do iPhone "Obter conteúdo de URL" com o arquivo;
//   • multipart/form-data com um ou mais arquivos PDF;
//   • JSON de serviço de e-mail encaminhado: { attachments: [{ filename, content (base64) }] } ou { pdf: base64 }.
// Guarda o PDF no bucket privado "notas" e cria a linha em notas_inbox. Trava anti-duplicidade: número da nota + data do
// pregão (lidos do próprio PDF quando ele não tem senha) e o hash do arquivo. A leitura completa das operações e taxas é
// feita no app pelo MESMO leitor do botão Importar (aba Imposto de renda), que também pede a senha do PDF quando houver.
import { getDocumentProxy, extractText } from 'npm:unpdf@0.12.1';
const ENV = (k: string) => Deno.env.get(k) || '';
const SB = ENV('SUPABASE_URL'), SRK = ENV('SUPABASE_SERVICE_ROLE_KEY');
const svc = { apikey: SRK, Authorization: 'Bearer ' + SRK };
const MAX = 20 * 1024 * 1024;
async function db(p: string, init: RequestInit = {}) { const r = await fetch(SB + '/rest/v1/' + p, { ...init, headers: { ...svc, 'Content-Type': 'application/json', ...((init.headers as any) || {}) } }); const t = await r.text(); if (!r.ok) { const e = new Error('db ' + r.status + ' ' + t.slice(0, 160)); (e as any).status = r.status; throw e; } return t ? JSON.parse(t) : null; }
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const sha = async (u: Uint8Array | string) => hex(await crypto.subtle.digest('SHA-256', typeof u === 'string' ? new TextEncoder().encode(u) : u));
async function dono(req: Request): Promise<string | null> {
  const tk = new URL(req.url).searchParams.get('token') || '';
  if (!/^[0-9a-f]{48}$/.test(tk)) return null;
  const r = await db(`atalhos_tokens?select=user_id&token_hash=eq.${await sha(tk)}`);
  return r?.[0]?.user_id || null;
}
const b64 = (s: string) => { const bin = atob(String(s).replace(/^data:[^,]*,/, '').replace(/\s+/g, '')); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
const ehPdf = (u: Uint8Array) => u.length > 4 && u[0] === 0x25 && u[1] === 0x50 && u[2] === 0x44 && u[3] === 0x46; // %PDF
async function arquivos(req: Request): Promise<{ nome: string; bytes: Uint8Array }[]> {
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('multipart/form-data')) {
    const f = await req.formData(), out: { nome: string; bytes: Uint8Array }[] = [];
    for (const [, v] of f.entries()) if (v instanceof File) out.push({ nome: v.name || 'nota.pdf', bytes: new Uint8Array(await v.arrayBuffer()) });
    return out;
  }
  if (ct.includes('application/json')) {
    const j = await req.json(), out: { nome: string; bytes: Uint8Array }[] = [];
    if (j?.pdf) out.push({ nome: j.nome || 'nota.pdf', bytes: b64(j.pdf) });
    for (const a of (j?.attachments || j?.Attachments || [])) { const c = a.content ?? a.Content ?? a.data; if (c) out.push({ nome: a.filename || a.Name || a.name || 'nota.pdf', bytes: b64(c) }); }
    return out;
  }
  return [{ nome: 'nota.pdf', bytes: new Uint8Array(await req.arrayBuffer()) }];
}
async function cabecalho(bytes: Uint8Array): Promise<{ nr: string | null; d: string | null; corretora: string | null; senha: boolean }> {
  try {
    const pdf = await getDocumentProxy(bytes.slice());
    const { text } = await extractText(pdf, { mergePages: true });
    const t = String(text || '').replace(/\s+/g, ' ');
    const m = t.match(/(\d{4,})\s+(\d{1,2})\s+(\d{2})\/(\d{2})\/(\d{4})/);
    const d0 = m ? null : t.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    return { nr: m ? m[1] : null, d: m ? `${m[5]}-${m[4]}-${m[3]}` : d0 ? `${d0[3]}-${d0[2]}-${d0[1]}` : null, corretora: /BTG/i.test(t) ? 'BTG Pactual' : null, senha: false };
  } catch (e) {
    return { nr: null, d: null, corretora: null, senha: /password/i.test(String((e as any)?.name || '') + String((e as any)?.message || '')) };
  }
}
Deno.serve(async (req) => {
  const out = (o: Record<string, unknown>, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  if (req.method !== 'POST') return out({ mensagem: 'Envie o PDF da nota com POST.' }, 405);
  try {
    const uid = await dono(req);
    if (!uid) return out({ mensagem: 'Token inválido.' }, 401);
    const L = (await arquivos(req)).filter((a) => ehPdf(a.bytes)).slice(0, 10);
    if (!L.length) return out({ mensagem: 'Nenhum PDF recebido.' }, 400);
    const res: Record<string, unknown>[] = [];
    for (const a of L) {
      if (a.bytes.length > MAX) { res.push({ arquivo: a.nome, status: 'erro', motivo: 'PDF maior que 20 MB' }); continue; }
      const h = await sha(a.bytes);
      if ((await db(`notas_inbox?select=id&user_id=eq.${uid}&sha256=eq.${h}`))?.length) { res.push({ arquivo: a.nome, status: 'duplicada', motivo: 'este PDF já foi recebido' }); continue; }
      const c = await cabecalho(a.bytes);
      if (c.nr && c.d) {
        const ja = await db(`notas_inbox?select=id&user_id=eq.${uid}&numero_nota=eq.${encodeURIComponent(c.nr)}&data_pregao=eq.${c.d}`);
        const imp = await db(`diario?select=user_id&user_id=eq.${uid}&data->ir->imp=cs.${encodeURIComponent(JSON.stringify([{ nr: c.nr, d: c.d }]))}`).catch(() => []);
        if (ja?.length || imp?.length) { res.push({ arquivo: a.nome, nota: c.nr, data: c.d, status: 'duplicada', motivo: 'nota já recebida ou já importada' }); continue; }
      }
      const caminho = `${uid}/${c.d || 'sem-data'}-${c.nr || h.slice(0, 12)}.pdf`;
      const up = await fetch(`${SB}/storage/v1/object/notas/${caminho}`, { method: 'POST', headers: { ...svc, 'Content-Type': 'application/pdf', 'x-upsert': 'true' }, body: a.bytes });
      if (!up.ok) { res.push({ arquivo: a.nome, status: 'erro', motivo: 'falha ao guardar o PDF (' + up.status + ')' }); continue; }
      try {
        await db('notas_inbox', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: uid, arquivo: caminho, sha256: h, numero_nota: c.nr, data_pregao: c.d, corretora: c.corretora, origem: new URL(req.url).searchParams.get('origem') || 'webhook', erro: c.senha ? 'PDF com senha: o app pede a senha ao ler' : null }) });
        res.push({ arquivo: a.nome, nota: c.nr, data: c.d, status: 'recebida', senha: c.senha });
      } catch (e) {
        res.push({ arquivo: a.nome, nota: c.nr, data: c.d, status: (e as any).status === 409 ? 'duplicada' : 'erro', motivo: (e as any).status === 409 ? 'nota já recebida' : 'falha ao registrar' });
      }
    }
    const novas = res.filter((r) => r.status === 'recebida').length, dup = res.filter((r) => r.status === 'duplicada').length;
    const mensagem = novas ? `✅ ${novas} nota(s) recebida(s). Abra o Diário de Trader → Imposto de renda → Importar para conferir e lançar.` + (dup ? ` ${dup} já existia(m).` : '')
      : dup ? '♻️ Esta nota já tinha sido recebida ou importada. Nada foi duplicado.' : '⚠️ Não consegui registrar a nota.';
    return out({ mensagem, notas: res }, novas || dup ? 200 : 422);
  } catch (e) {
    return out({ mensagem: '⚠️ Erro ao receber a nota: ' + (e as Error).message }, 500);
  }
});
