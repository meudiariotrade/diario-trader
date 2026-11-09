import { BUCKETS, uidOk, apagaArquivos } from './storage.ts';
// Função CONTA — publicar index.ts e storage.ts juntos.

// ===== plano =====
// Regressões em tests/conta.test.cjs.
/** Apenas tabelas legadas sem FK ON DELETE CASCADE. As demais são limpas ao excluir auth.users. */
export const TABELAS: [string, string][] = [
  ['aulas_audio_jobs', 'user_id'], ['aulas_imagens_jobs', 'user_id'], ['aulas_teste', 'uid'],
];
/** Caminhos REST de exclusão: SEMPRE filtrados pelo id da pessoa (nunca apaga a tabela inteira). */
export function caminhosExclusao(uid: string): string[] {
  if (!uidOk(uid)) throw new Error('Identificador inválido');
  return TABELAS.map(([t, c]) => `/rest/v1/${t}?${c}=eq.${uid}`);
}

// Limite de tentativas da operação de exclusão.
const USO = new Map<string, number[]>();
/** Janela deslizante: no máximo `max` chamadas em `janelaMs` por chave (usuário). */
export function dentroDoLimite(chave: string, max: number, janelaMs = 60_000, agora = Date.now()): boolean {
  const L = (USO.get(chave) || []).filter((t) => agora - t < janelaMs);
  if (L.length >= max) { USO.set(chave, L); return false; }
  L.push(agora); USO.set(chave, L);
  if (USO.size > 2000) USO.clear();
  return true;
}

/** Versão das funções: o app compara com a dele na tela "Status do sistema". */
export const VERSAO_FN = 'v90';
/** ALLOWED_ORIGINS aceita o endereço escrito com caminho ou barra no final ("https://x.github.io/diario-trader/" vira "https://x.github.io"). */
export const origemLimpa = (x: string) => { const s = String(x || '').trim(); if (!s) return ''; try { return new URL(s).origin; } catch { return s.replace(/\/+$/, ''); } };
/** GET ?versao=1: responde só o nome e a versão da função (nenhum dado de ninguém), para o diagnóstico do app. */
export function versaoResp(req: Request, nome: string, cors: Record<string, string>): Response | null {
  try { if (!new URL(req.url).searchParams.has('versao')) return null; } catch { return null; }
  return new Response(JSON.stringify({ fn: nome, versao: VERSAO_FN }), { headers: { ...cors, 'Content-Type': 'application/json' } });
}

// ===== servidor =====
// supabase/functions/conta/index.ts
// Excluir conta (LGPD): apaga TODOS os dados da pessoa (tabelas, fotos, PDFs de livros) e depois a própria conta.
// Exige login + a senha de novo + a palavra EXCLUIR. Publicar com "Verify JWT" desligado, como as outras funções.

const SB = Deno.env.get('SUPABASE_URL') || '', ANON = Deno.env.get('SUPABASE_ANON_KEY') || '', SVC = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*'; else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};
const svc = (x: Record<string, string> = {}) => ({ apikey: SVC, Authorization: 'Bearer ' + SVC, 'Content-Type': 'application/json', ...x });

/** Quem está pedindo (pelo token do app). */
async function quem(req: Request): Promise<{ id: string; email: string } | null> {
  const tk = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!tk || tk === ANON || tk.split('.').length !== 3) return null;
  try {
    const r = await fetch(SB + '/auth/v1/user', { headers: { apikey: ANON || SVC, Authorization: 'Bearer ' + tk }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    return uidOk(j?.id) && typeof j?.email === 'string' ? { id: j.id, email: j.email } : null;
  } catch { return null; }
}
/** Confere a senha de novo: quem pegou o celular desbloqueado não consegue apagar a conta. */
async function senhaConfere(email: string, senha: string, uid: string): Promise<boolean> {
  try {
    const r = await fetch(SB + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: ANON || SVC, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: senha }), signal: AbortSignal.timeout(8000) });
    if (!r.ok) return false;
    const j = await r.json();
    return j?.user?.id === uid;
  } catch { return false; }
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  { const vr = versaoResp(req, 'conta', cors); if (vr) return vr; }
  if (req.method !== 'POST') return out({ error: 'Método não permitido' }, 405);
  if (!SB || !SVC) return out({ error: 'Função sem SUPABASE_URL/SERVICE_ROLE.' }, 500);
  let b: any = {}; try { b = await req.json(); } catch { return out({ error: 'JSON inválido' }, 400); }
  if (b.acao !== 'excluir') return out({ error: 'Ação desconhecida' }, 400);
  const u = await quem(req);
  if (!u) return out({ error: 'Entre na sua conta de novo antes de excluir.' }, 401);
  if (!dentroDoLimite('excluir:' + u.id, 5, 3600_000)) return out({ error: 'Muitas tentativas. Espere uma hora.' }, 429);
  if (String(b.confirma || '').trim().toUpperCase() !== 'EXCLUIR') return out({ error: 'Digite EXCLUIR para confirmar.' }, 400);
  if (typeof b.senha !== 'string' || !b.senha || b.senha.length > 200 || !(await senhaConfere(u.email, b.senha, u.id))) return out({ error: 'Senha incorreta.' }, 403);

  const feito: Record<string, number | string> = {};
  try {
    const storage = { url: SB, headers: svc(), fetch, deadline: Date.now() + 90_000 };
    for (const bk of BUCKETS) feito['arquivos_' + bk] = await apagaArquivos(bk, u.id, storage);
    for (const p of caminhosExclusao(u.id)) {
      const r = await fetch(SB + p, { method: 'DELETE', headers: svc({ Prefer: 'return=minimal' }) });
      const t = p.split('?')[0].split('/').pop()!;
      if (r.ok) { feito[t] = 'ok'; continue; }
      const txt = await r.text();
      if (r.status === 404 || (r.status === 400 && /column|does not exist|42703/i.test(txt))) feito[t] = 'não existe'; // tabela ou coluna que este projeto não tem
      else throw new Error(`Não consegui apagar ${t}: ${r.status} ${txt.slice(0, 120)}`);
    }
    // As demais tabelas pessoais usam ON DELETE CASCADE; não duplicar sua limpeza aqui.
    const a = await fetch(`${SB}/auth/v1/admin/users/${u.id}`, { method: 'DELETE', headers: svc() });
    if (!a.ok) throw new Error('Os dados foram apagados, mas não consegui remover o login: ' + a.status);
    console.log('conta excluída', u.id, JSON.stringify(feito));
    return out({ ok: true, apagado: feito });
  } catch (e) {
    console.error('excluir conta', u.id, (e as Error).message);
    return out({ error: (e as Error).message + ' Tente de novo: o que já foi apagado não volta.' }, 500);
  }
});
