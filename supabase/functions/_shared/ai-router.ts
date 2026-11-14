// Roteador Multi-IA gratuito (v622) — compartilhado pela aba Análises (pesquisa), Revista da Semana (revista-ia)
// e Jornal do Pregão (analise). Divide o peso entre os provedores ativos, troca de provedor em 429 e devolve
// qual provedor/modelo respondeu — ou a mensagem técnica real de cada falha.
//
// Provedores (ativados automaticamente quando a chave existe nos Secrets ou no Vault do Supabase):
//   GEMINI_API_KEY ou GOOGLE_API_KEY → Google Gemini   (gemini-2.5-flash → gemini-2.5-flash-lite, + modelos da conta)
//   GROQ_API_KEY                     → Groq            (llama-3.3-70b-versatile)
//   OPENROUTER_API_KEY               → OpenRouter      (meta-llama/llama-3.3-70b-instruct:free, deepseek/deepseek-r1:free;
//                                      quando saem do ar, usa os modelos ":free" atuais descobertos na API)
//   CEREBRAS_API_KEY                 → Cerebras        (llama-3.3-70b)
//   MISTRAL_API_KEY                  → Mistral         (mistral-small-latest)
//   HF_TOKEN                         → Hugging Face    (meta-llama/Llama-3.3-70B-Instruct)
//   DEEPSEEK_API_KEY                 → DeepSeek        (deepseek-chat)
//   (sem chave)                      → Pollinations    (openai — gpt-oss-20b), sempre ativo como balanceamento e reserva
// Opcional: IA_ORDEM="groq,gemini,cerebras" fixa a preferência; IA_DESLIGAR="pollinations" remove provedores.

type Env = (key: string) => string | undefined;
const ENV0: Env = (k) => ((globalThis as any).Deno?.env?.get(k) as string | undefined) || undefined;

// v622: chaves também podem ficar no Vault do Supabase (função public.ia_chaves, só service_role).
// O Secret da Edge Function tem prioridade; o Vault completa o que faltar. Cache de 10 min por instância.
let VAULT: { t: number; v: Record<string, string> } | null = null;
export async function envComVault(base: Env = ENV0, fetcher: typeof fetch = fetch): Promise<Env> {
  const url = base('SUPABASE_URL'), svc = base('SUPABASE_SERVICE_ROLE_KEY');
  if (url && svc && (!VAULT || Date.now() - VAULT.t > 600_000)) {
    try {
      const r = await fetcher(url + '/rest/v1/rpc/ia_chaves', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: svc, Authorization: 'Bearer ' + svc }, body: '{}', signal: AbortSignal.timeout(5000) });
      VAULT = { t: Date.now(), v: r.ok ? ((await r.json()) || {}) : VAULT?.v || {} };
    } catch { VAULT = { t: Date.now() - 540_000, v: VAULT?.v || {} }; }
  }
  const v = VAULT?.v || {};
  return (k: string) => base(k) || (typeof v[k] === 'string' && v[k] ? v[k] : undefined);
}

export type Provedor = { id: string; nome: string; modelos: string[]; tipo: 'gemini' | 'openai'; url?: string; chave?: string; extra?: Record<string, string> };

const limpa = (t: unknown) => String(t ?? '').replace(/\s+/g, ' ').replace(/(?:sk-|AIza|gsk_|hf_|csk-)[\w-]+/g, '[removido]').slice(0, 200);
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
const lista = (v: string | undefined) => String(v || '').split(',').map((x) => x.trim()).filter(Boolean);

/** Provedores ativos a partir dos Secrets (nunca expõe as chaves). */
export function provedores(env: Env = ENV0): Provedor[] {
  const P: Provedor[] = [];
  const gk = env('GEMINI_API_KEY') || env('GOOGLE_API_KEY');
  if (gk) P.push({ id: 'gemini', nome: 'Google Gemini', tipo: 'gemini', chave: gk, modelos: [...new Set(['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', ...lista(env('GEMINI_MODEL_GIRO')), ...lista(env('GEMINI_MODEL'))])].slice(0, 6) });
  const ok = (id: string, nome: string, key: string | undefined, url: string, modelos: string[], extra?: Record<string, string>) => key && P.push({ id, nome, tipo: 'openai', url, chave: key, modelos, extra });
  ok('groq', 'Groq', env('GROQ_API_KEY'), 'https://api.groq.com/openai/v1/chat/completions', lista(env('GROQ_MODELS')).length ? lista(env('GROQ_MODELS')) : ['llama-3.3-70b-versatile']);
  ok('cerebras', 'Cerebras', env('CEREBRAS_API_KEY'), 'https://api.cerebras.ai/v1/chat/completions', lista(env('CEREBRAS_MODELS')).length ? lista(env('CEREBRAS_MODELS')) : ['llama-3.3-70b']);
  ok('openrouter', 'OpenRouter', env('OPENROUTER_API_KEY'), 'https://openrouter.ai/api/v1/chat/completions', ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-r1:free'], { 'HTTP-Referer': 'https://meudiariotrade.github.io/diario-trader/', 'X-Title': 'Diario de Trader' });
  ok('mistral', 'Mistral', env('MISTRAL_API_KEY'), 'https://api.mistral.ai/v1/chat/completions', ['mistral-small-latest']);
  ok('huggingface', 'Hugging Face', env('HF_TOKEN') || env('HUGGINGFACE_API_KEY'), 'https://router.huggingface.co/v1/chat/completions', ['meta-llama/Llama-3.3-70B-Instruct']);
  ok('deepseek', 'DeepSeek', env('DEEPSEEK_API_KEY'), 'https://api.deepseek.com/chat/completions', ['deepseek-chat']);
  P.push({ id: 'pollinations', nome: 'Pollinations', tipo: 'openai', url: 'https://text.pollinations.ai/openai', modelos: ['openai'], extra: { Referer: 'https://meudiariotrade.github.io/diario-trader/' } });
  const fora = new Set(lista(env('IA_DESLIGAR')).map((x) => x.toLowerCase()));
  return P.filter((p) => !fora.has(p.id));
}

// Estado por instância: rodízio e pausa de provedores que devolveram 429/5xx.
let RODIZIO = 0;
const OK_MODELO = new Map<string, string>(); // provedor → último modelo que respondeu
let OR_GRATIS: { t: number; ids: string[] } | null = null;
/** OpenRouter: os modelos ":free" mudam com frequência — descobre os disponíveis (cache de 1 h) e prioriza famílias boas em português. */
async function openRouterGratis(base: string[], fetcher: typeof fetch) {
  if (!OR_GRATIS || Date.now() - OR_GRATIS.t > 3600_000) {
    try {
      const r = await fetcher('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(6000) });
      const ids = r.ok ? ((await r.json())?.data || []).filter((m: any) => /:free$/.test(m.id) && (m.context_length || 0) >= 32000).map((m: any) => String(m.id)) : [];
      OR_GRATIS = { t: Date.now(), ids };
    } catch { OR_GRATIS = { t: Date.now() - 3000_000, ids: [] }; }
  }
  const ids = OR_GRATIS.ids, pref = [/llama-3\.3-70b/, /deepseek/, /gemma-4-31b/, /nemotron-3-ultra/, /qwen/, /gemma/, /nemotron/, /mistral/];
  const escolhidos = pref.flatMap((re) => ids.filter((id) => re.test(id))).filter((x, i, a) => a.indexOf(x) === i);
  return [...base.filter((m) => !ids.length || ids.includes(m)), ...escolhidos].filter((x, i, a) => a.indexOf(x) === i).slice(0, 3);
}
const PAUSA = new Map<string, { ate: number; motivo: string }>();
export function pausa(id: string, ms: number, motivo: string) { PAUSA.set(id, { ate: Date.now() + ms, motivo }); }

/** Ordem de tentativa: preferência explícita (IA_ORDEM/opção) e depois rodízio entre os ativos; pausados vão para o fim. */
export function ordem(P: Provedor[], env: Env = ENV0, preferir: string[] = []) {
  const pref = [...preferir, ...lista(env('IA_ORDEM'))].map((x) => x.toLowerCase());
  const comPref = P.filter((p) => pref.includes(p.id)).sort((a, b) => pref.indexOf(a.id) - pref.indexOf(b.id));
  const resto = P.filter((p) => !pref.includes(p.id) && p.id !== 'pollinations');
  const n = resto.length, giro = n ? resto.slice(RODIZIO % n).concat(resto.slice(0, RODIZIO % n)) : [];
  RODIZIO++;
  const pol = P.filter((p) => p.id === 'pollinations' && !pref.includes('pollinations'));
  const todos = [...comPref, ...giro, ...pol], agora = Date.now();
  return [...todos.filter((p) => !(PAUSA.get(p.id)?.ate! > agora)), ...todos.filter((p) => PAUSA.get(p.id)?.ate! > agora)];
}

async function chamaGemini(p: Provedor, modelo: string, system: string, prompt: string, json: boolean, temp: number, ms: number, fetcher: typeof fetch) {
  const pensar = /gemini-3/i.test(modelo) ? { thinkingConfig: { thinkingLevel: 'low' } } : /gemini-2\.5-flash/i.test(modelo) ? { thinkingConfig: { thinkingBudget: 0 } } : {};
  const r = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': p.chave! }, signal: AbortSignal.timeout(ms),
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: temp, maxOutputTokens: 8192, ...pensar, ...(json ? { responseMimeType: 'application/json' } : {}) } }),
  });
  if (!r.ok) { let m = ''; try { m = (await r.json())?.error?.message || ''; } catch { /* sem corpo */ } return { status: r.status, erro: m }; }
  const j = await r.json(), c = j.candidates?.[0], texto = (c?.content?.parts || []).filter((x: any) => !x.thought).map((x: any) => x.text || '').join('');
  return texto && c?.finishReason !== 'MAX_TOKENS' ? { texto } : { status: 0, erro: 'resposta ' + (c?.finishReason || 'vazia') };
}

async function chamaOpenAI(p: Provedor, modelo: string, system: string, prompt: string, json: boolean, temp: number, ms: number, fetcher: typeof fetch) {
  const corpo: any = { model: modelo, temperature: temp, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] };
  if (json && p.id !== 'pollinations') corpo.response_format = { type: 'json_object' };
  if (p.id !== 'pollinations') corpo.max_tokens = 8192;
  const r = await fetcher(p.url!, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(p.chave ? { Authorization: 'Bearer ' + p.chave } : {}), ...(p.extra || {}) }, signal: AbortSignal.timeout(ms), body: JSON.stringify(corpo) });
  if (!r.ok) { let m = ''; try { const j = await r.json(); m = j?.error?.message || j?.message || j?.error || ''; } catch { /* sem corpo */ } return { status: r.status, erro: typeof m === 'string' ? m : JSON.stringify(m) }; }
  const j = await r.json(), texto = String(j?.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  return texto ? { texto, real: j?.model } : { status: 0, erro: 'resposta vazia' };
}

export type Resposta = { texto: string; provedor: string; modelo: string; rotulo: string; tentativas: string[] };

/**
 * Gera texto com failover entre os provedores ativos.
 * Em 429: 1 nova tentativa rápida no mesmo modelo, depois pausa o provedor e passa ao próximo.
 */
export async function gerarTexto(system: string, prompt: string, opt: { json?: boolean; temp?: number; ate?: number; env?: Env; fetcher?: typeof fetch; preferir?: string[]; porTentativaMs?: number } = {}): Promise<Resposta> {
  const fetcher = opt.fetcher || fetch, env = opt.env ? opt.env : await envComVault(ENV0, fetcher), ate = opt.ate || Date.now() + 55_000, temp = opt.temp ?? 0.4, erros: string[] = [];
  for (const p of ordem(provedores(env), env, opt.preferir || [])) {
    let modelos = p.id === 'openrouter' ? await openRouterGratis(p.modelos, fetcher) : p.modelos;
    const bom = OK_MODELO.get(p.id);
    if (bom && modelos.includes(bom)) modelos = [bom, ...modelos.filter((m) => m !== bom)];
    for (const modelo of modelos) {
      let proximo = false;
      for (let tentativa = 0; tentativa < 2 && !proximo; tentativa++) {
        const resta = ate - Date.now();
        if (resta < 6000) { erros.push('prazo esgotado antes de ' + p.nome); return falha(erros); }
        try {
          const ms = Math.min(resta - 1500, opt.porTentativaMs || 30_000);
          const r: any = p.tipo === 'gemini' ? await chamaGemini(p, modelo, system, prompt, !!opt.json, temp, ms, fetcher) : await chamaOpenAI(p, modelo, system, prompt, !!opt.json, temp, ms, fetcher);
          if (r.texto) { PAUSA.delete(p.id); OK_MODELO.set(p.id, modelo); const m = r.real || modelo; return { texto: r.texto, provedor: p.nome, modelo: m, rotulo: `${p.nome} · ${m}`, tentativas: erros }; }
          erros.push(`${p.nome} ${modelo}: ${r.status ? 'HTTP ' + r.status : ''}${r.erro ? (r.status ? ' — ' : '') + limpa(r.erro) : ''}`);
          if (r.status === 429 && tentativa === 0) { await espera(1200); continue; } // retry rápido
          if (r.status === 429 && p.tipo === 'gemini') break; // Gemini: cota por modelo — tenta o próximo modelo
          if (r.status === 404 && p.tipo === 'gemini') break;
          if (r.status === 429) { pausa(p.id, /quota|billing|daily|per day|exceeded/i.test(r.erro || '') ? 10 * 60_000 : 60_000, 'HTTP 429'); proximo = true; break; }
          if (r.status === 401 || r.status === 403 || r.status === 402) { pausa(p.id, 30 * 60_000, 'HTTP ' + r.status); proximo = true; break; }
          if (r.status >= 500) pausa(p.id, 30_000, 'HTTP ' + r.status);
          break; // 404/400/5xx/resposta vazia: próximo modelo do mesmo provedor
        } catch (e) { erros.push(`${p.nome} ${modelo}: ${/timeout|abort/i.test(String(e)) ? 'tempo esgotado' : limpa((e as Error).message)}`); break; }
      }
      if (proximo) break; // provedor em 429/402: pula os outros modelos dele
    }
  }
  return falha(erros);
}

function falha(erros: string[]): never {
  throw Object.assign(new Error('Nenhum provedor de IA respondeu. ' + (erros.join(' | ') || 'nenhum provedor ativo')), { erros });
}

/** JSON tolerante: tira cercas e pega do primeiro "{" ao último "}". */
export function jsonDe(t: string) { const x = String(t || '').replace(/```json|```/g, ''); return JSON.parse(x.slice(x.indexOf('{'), x.lastIndexOf('}') + 1)); }

/** Diagnóstico (sem chaves): quais provedores estão ativos e quais Secrets faltam. */
export function status(env: Env = ENV0) {
  const P = provedores(env), ativos = new Set(P.map((p) => p.id));
  const todos: [string, string][] = [['gemini', 'GEMINI_API_KEY'], ['groq', 'GROQ_API_KEY'], ['cerebras', 'CEREBRAS_API_KEY'], ['openrouter', 'OPENROUTER_API_KEY'], ['mistral', 'MISTRAL_API_KEY'], ['huggingface', 'HF_TOKEN'], ['deepseek', 'DEEPSEEK_API_KEY']];
  return { ativos: P.map((p) => ({ id: p.id, nome: p.nome, modelos: p.modelos, chave: !!p.chave, pausado: PAUSA.get(p.id)?.ate! > Date.now() ? PAUSA.get(p.id)!.motivo : null })), faltando: todos.filter(([id]) => !ativos.has(id)).map(([id, secret]) => ({ id, secret })) };
}
