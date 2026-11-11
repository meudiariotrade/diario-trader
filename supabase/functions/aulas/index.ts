// Função AULAS — gera videoaulas a partir do texto de capítulos de um livro (Gemini).
// O app extrai o texto do PDF no aparelho e manda um capítulo por chamada:
//   POST {acao:"iniciar", livro, numero, capitulos:[nomes]}            -> cria a aula (status "gerando")
//   POST {acao:"parte", id, idx, total, capitulo, texto}                 -> escreve as cenas desse capítulo
//   POST {acao:"enfileirar", ...mesmo corpo de parte}                    -> v516: guarda na fila; o servidor escreve com o app fechado
//   POST {acao:"processar"}  (pg_cron a cada minuto)                     -> avança a fila
// A última parte fecha a aula (revisão + encerramento) e muda o status para "pronta".
// Secrets: GEMINI_API_KEY (já existe). Opcional: GEMINI_MODEL_AULAS.
// Deploy sem verificação de JWT (igual às outras); o login é conferido aqui dentro.

const ENV = (k: string) => Deno.env.get(k) || '';
const SB = ENV('SUPABASE_URL'), SRK = ENV('SUPABASE_SERVICE_ROLE_KEY'), ANON = ENV('SUPABASE_ANON_KEY'), GEMINI_KEY = ENV('GEMINI_API_KEY');
export const VERSAO_FN = 'v516';
const LIMITE_AULAS_DIA = 6, LIMITE_PARTES_DIA = 80, MAX_TEXTO = 90_000;

// ---------- segurança (mesmo padrão das outras funções) ----------
const CACHE = new Map<string, { uid: string; ate: number }>();
async function usuarioDe(req: Request): Promise<string | null> {
  const tk = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!tk || !SB || tk.split('.').length !== 3 || tk === ANON || tk.length > 4096) return null;
  const c = CACHE.get(tk); if (c && c.ate > Date.now()) return c.uid;
  try {
    const r = await fetch(SB + '/auth/v1/user', { headers: { apikey: ANON || SRK, Authorization: 'Bearer ' + tk }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null; const j = await r.json(); if (!j || typeof j.id !== 'string') return null;
    if (CACHE.size > 500) CACHE.clear(); CACHE.set(tk, { uid: j.id, ate: Date.now() + 300_000 }); return j.id;
  } catch { return null; }
}
const USO = new Map<string, number[]>();
function dentroDoLimite(k: string, max: number, jan = 60_000) { const a = Date.now(), L = (USO.get(k) || []).filter((t) => a - t < jan); if (L.length >= max) { USO.set(k, L); return false; } L.push(a); USO.set(k, L); return true; }
const origemLimpa = (x: string) => { const s = String(x || '').trim(); if (!s) return ''; try { return new URL(s).origin; } catch { return s.replace(/\/+$/, ''); } };
const ORIGENS = ENV('ALLOWED_ORIGINS').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = { 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
  const o = req.headers.get('origin') || ''; if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*'; else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o; return h;
};
const svc = (x: Record<string, string> = {}) => ({ apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json', ...x });
async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(SB + '/rest/v1/' + path, { ...init, headers: svc((init.headers as any) || {}), signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error('Banco ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
// Reserva persistente, atômica e acessível apenas ao service_role.
async function reservaUso(uid: string, acao: string, chave: string) {
  const r=await db('rpc/aulas_reservar_uso',{method:'POST',body:JSON.stringify({p_uid:uid,p_acao:acao,p_chave:chave})});
  if(!r || typeof r.permitido!=='boolean')throw new Error('Controle de uso indisponível. Nenhuma geração foi iniciada.');
  return r;
}
const hojeBR = () => new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);

// ---------- validação do roteiro (a IA nunca escreve direto no banco) ----------
const txt = (x: unknown, n: number) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const num = (x: unknown, a: number, b: number, d?: number) => { const v = Number(x); return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };
const arr = (x: unknown) => (Array.isArray(x) ? x : []);
const emOk = (x: unknown) => { const v = num(x, 0, 12); return v == null ? undefined : Math.round(v); };
const limpaObj = (o: Record<string, unknown>) => { for (const k of Object.keys(o)) if (o[k] === undefined || o[k] === '' ) delete o[k]; return o; };
const PH_DADOS = ['ini', 'fim', 'max', 'min', 'varp', 'dias', 'deTx', 'ateTx'], PH_AJ = ['chamadas', 'deposito', 'total', 'pIni', 'pFim', 'margemIni', 'margemMan'];
const ATIVO_OK = /^(WIN|WDO|IBOV|USDBRL|SPX|NDX|DOW|DXY|BRENT|WTI|OURO|PRATA|BTC|ETH|EURUSD|[A-Z]{4}\d{1,2})$/;
const dataOk = (s: unknown) => { const t = String(s || ''); if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return ''; const v = Date.parse(t + 'T12:00:00Z'); return v > Date.parse('1995-01-01') && v < Date.now() - 86400_000 ? t : ''; };

// figuras do livro: id no formato p<página><letra> (ex.: p45a), extraídas no aparelho
const FIG_ID = /^p\d{1,4}[a-z]$/;
const MARCAS_OK = ['max', 'min', 'ini', 'fim', 'mm'];
function limpaVis(v: any, figs: Set<string> = new Set()): any {
  const t = String(v?.tipo || '');
  const base = { tipo: t, t: txt(v?.t, 110) || undefined, nota: txt(v?.nota, 200) || undefined };
  switch (t) {
    case 'titulo': return limpaObj({ tipo: t, kicker: txt(v.kicker, 40), t: txt(v.t, 120) || 'Aula', sub: txt(v.sub, 180), chips: arr(v.chips).map((c) => txt(c, 40)).filter(Boolean).slice(0, 4) });
    case 'topicos': { const itens = arr(v.itens).map((i: any) => limpaObj({ t: txt(typeof i === 'string' ? i : i?.t, 90), s: txt(i?.s, 150), em: emOk(i?.em) })).filter((i: any) => i.t).slice(0, 6); return itens.length ? limpaObj({ ...base, itens }) : null; }
    case 'tabela': { const cab = arr(v.cab).map((c) => txt(c, 40)).slice(0, 4); const linhas = arr(v.linhas).map((l) => arr(l).map((c) => txt(c, 90)).slice(0, cab.length || 4)).filter((l) => l.length).slice(0, 7); if (!linhas.length) return null; const n = Math.max(cab.length, ...linhas.map((l) => l.length)); while (cab.length < n) cab.push(''); return limpaObj({ ...base, cab, linhas: linhas.map((l) => { while (l.length < n) l.push(''); return l; }), em: arr(v.em).slice(0, linhas.length).map((e) => emOk(e) ?? 0) }); }
    case 'formula': return limpaObj({ ...base, f: txt(v.f, 90) || ' ', linhas: arr(v.linhas).map((l: any) => limpaObj({ t: txt(typeof l === 'string' ? l : l?.t, 120), em: emOk(l?.em), forte: l?.forte ? true : undefined })).filter((l: any) => l.t).slice(0, 5) });
    case 'pergunta': return { tipo: t, q: txt(v.q, 200) || 'Pergunta', r: txt(v.r, 300) || '', em: emOk(v.em) ?? 1 };
    case 'convergencia': return limpaObj({ ...base, emA: emOk(v.emA) ?? 1, emB: emOk(v.emB) ?? 2 });
    case 'fluxo': {
      const nos = arr(v.nos).map((n: any, i: number) => limpaObj({ id: txt(n?.id, 12) || 'n' + i, t: txt(n?.t, 18), sub: txt(n?.sub, 26), x: num(n?.x, 10, 90, 50), y: num(n?.y, 5, 60, 20), w: num(n?.w, 12, 30, 22), em: emOk(n?.em) })).filter((n: any) => n.t).slice(0, 8);
      const ids = new Set(nos.map((n: any) => n.id));
      const setas = arr(v.setas).map((s: any) => limpaObj({ de: txt(s?.de, 12), para: txt(s?.para, 12), t: txt(s?.t, 18), dupla: s?.dupla ? true : undefined, em: emOk(s?.em) })).filter((s: any) => ids.has(s.de) && ids.has(s.para) && s.de !== s.para).slice(0, 10);
      if (nos.length < 2) return null;
      const h = Math.max(30, Math.min(66, Math.max(...nos.map((n: any) => n.y)) + 10));
      return limpaObj({ ...base, h, nos, setas });
    }
    case 'payoff': {
      const pernas = arr(v.pernas).map((p: any) => ({ tipo: ['call', 'put', 'termo'].includes(p?.tipo) ? p.tipo : 'call', K: num(p?.K, 0.0001, 1e7), p: num(p?.p, 0, 1e6, 0), pos: Number(p?.pos) < 0 ? -1 : 1, q: num(p?.q, 1, 100, 1) })).filter((p: any) => p.K != null).slice(0, 4);
      if (!pernas.length) return null;
      let a = num(arr(v.x)[0], 0, 1e7), b = num(arr(v.x)[1], 0, 1e7); const Ks = pernas.map((p: any) => p.K);
      if (a == null || b == null || b <= a) { a = Math.min(...Ks) * 0.75; b = Math.max(...Ks) * 1.25; }
      const ponto = v.ponto && num(v.ponto.s, a, b) != null ? limpaObj({ s: num(v.ponto.s, a, b), t: txt(v.ponto.t, 30), em: emOk(v.ponto.em), esq: v.ponto.esq ? true : undefined }) : undefined;
      return limpaObj({ ...base, x: [a, b], pernas, emBe: emOk(v.emBe), ponto, xr: txt(v.xr, 40) });
    }
    case 'candles': {
      const d = v?.dados || {}, ativo = txt(d.ativo, 10).toUpperCase(), de = dataOk(d.de), ate = dataOk(d.ate);
      if (!ATIVO_OK.test(ativo) || !de || !ate || de >= ate) return null;
      // marcas calculadas pelo app a partir dos dados reais (a IA nunca escreve preço)
      const marcas = arr(v.marcas).map((m: any) => { const k = String(m?.k || ''); if (!MARCAS_OK.includes(k)) return null; return limpaObj({ k, n: k === 'mm' ? Math.round(num(m?.n, 5, 200, 20)!) : undefined, t: txt(m?.t, 30), em: emOk(m?.em) }); }).filter(Boolean).slice(0, 5);
      return limpaObj({ ...base, dados: { ativo, de, ate, casas: Math.round(num(d.casas, 0, 4, 2)!) }, emMarcas: emOk(v.emMarcas) ?? 1, marcas: marcas.length ? marcas : undefined });
    }
    case 'figura': {
      const id = txt(v?.id, 8).toLowerCase();
      if (!FIG_ID.test(id) || !figs.has(id)) return null;
      return limpaObj({ tipo: t, id, t: txt(v?.t, 110), nota: txt(v?.nota, 200), zoom: v?.zoom ? true : undefined });
    }
    case 'ajuste': {
      const comum = { mult: num(v.mult, 0.01, 1000, 1), contratos: Math.round(num(v.contratos, 1, 100, 1)!), margemIni: num(v.margemIni, 1, 1e7, 1000), margemMan: num(v.margemMan, 1, 1e7, 750), emTab: emOk(v.emTab) ?? 1, desc: txt(v.desc, 200), lado: Number(v.lado) < 0 ? -1 : 1 };
      if (comum.margemMan! >= comum.margemIni!) comum.margemMan = comum.margemIni! * 0.75;
      const precos = arr(v.precos).map((p) => num(p, 0.0001, 1e8)).filter((p) => p != null).slice(0, 14);
      if (precos.length >= 3) return limpaObj({ ...base, precos, casas: Math.round(num(v.casas, 0, 4, precos.some((p) => p! % 1) ? 1 : 0)!), ...comum });
      const d = v?.dados || {}, ativo = txt(d.ativo, 10).toUpperCase(), de = dataOk(d.de), ate = dataOk(d.ate);
      if (!ATIVO_OK.test(ativo) || !de || !ate || de >= ate || Date.parse(ate) - Date.parse(de) > 40 * 86400_000) return null;
      return limpaObj({ ...base, dados: { ativo, de, ate, casas: Math.round(num(d.casas, 0, 4, 0)!) }, casas: Math.round(num(v.casas, 0, 4, 0)!), ...comum });
    }
  }
  return null;
}
function limpaCena(c: any, figs: Set<string> = new Set()): any {
  let vis = limpaVis(c?.vis || {}, figs);
  const titulo = txt(c?.titulo, 70) || (vis?.t ?? 'Cena');
  if (!vis) vis = { tipo: 'titulo', t: titulo };
  const comDados = !!vis.dados, aj = vis.tipo === 'ajuste';
  const permitidos = new Set([...(comDados ? PH_DADOS : []), ...(aj ? PH_AJ : [])]);
  // placeholder desconhecido = número que a IA não tem como saber: tira o parágrafo
  const ok = (p: string) => [...p.matchAll(/\{(\w+)\}/g)].every((m) => permitidos.has(m[1]));
  let fala = arr(c?.fala).map((p) => txt(p, 1400)).filter(Boolean).filter(ok).slice(0, 8);
  if (!fala.length) return null;
  const out: any = { titulo, vis, fala };
  if (comDados) {
    let sem = arr(c?.falaSem).map((p) => txt(p, 1400)).filter((p) => p && !/\{\w+\}/.test(p)).slice(0, 5);
    if (!sem.length) sem = fala.filter((p) => !/\{\w+\}/.test(p));
    if (!sem.length) sem = ['Os dados reais desta cena não carregaram agora. Entre na sua conta e volte a ela para ver o gráfico.'];
    out.falaSem = sem;
  }
  const pausa = num(c?.pausa, 0, 3000); if (pausa != null) out.pausa = pausa;
  return out;
}

// ---------- Gemini ----------
let cModelos: { ts: number; v: string[] } | null = null;
async function modelos(): Promise<string[]> {
  const fixo = ENV('GEMINI_MODEL_AULAS').split(',').map((x) => x.trim()).filter(Boolean);
  if (fixo.length) return fixo;
  if (cModelos && Date.now() - cModelos.ts < 6 * 3600_000) return cModelos.v;
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': GEMINI_KEY }, signal: AbortSignal.timeout(6000) });
    const j = await r.json();
    const nomes: string[] = (j?.models || []).filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m: any) => String(m.name || '').replace(/^models\//, ''));
    const ok = nomes.map((n) => /^gemini-(\d+(?:\.\d+)?)-(flash|pro)(-lite)?$/.exec(n)).filter((m): m is RegExpExecArray => !!m);
    const fl = ok.filter((m) => m[2] === 'flash' && !m[3]).sort((a, b) => +b[1] - +a[1]).map((m) => m[0]);
    const li = ok.filter((m) => m[3]).sort((a, b) => +b[1] - +a[1]).map((m) => m[0]);
    // flash-lite primeiro: responde em ~10 s e foi o que gerou todas as aulas prontas; o flash (mais lento, pensa mais) fica de reserva
    const v = [...new Set([li[0], fl[0], li[1]].filter(Boolean))] as string[];
    if (v.length) { cModelos = { ts: Date.now(), v }; return v; }
  } catch { /* lista fixa */ }
  return ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
}
async function gemini(prompt: string, sistema: string, prazoMs: number): Promise<any> {
  const fim = Date.now() + prazoMs; let ultimo = ''; const falhas: string[] = [];
  const fila = [...(await modelos())]; fila.push(fila[fila.length - 1]); // o último (o que costuma ter cota) ganha uma segunda chance
  for (const modelo of fila) {
    const sobra = fim - Date.now(); if (sobra < 15_000) break;
    const resta = falhas.length ? sobra : Math.min(sobra - 30_000, 95_000), t0 = Date.now(), seg = () => Math.round((Date.now() - t0) / 1000) + 's';
    const pensar = /gemini-3/.test(modelo) ? { thinkingConfig: { thinkingLevel: 'low' } } : /2\.5-flash/.test(modelo) ? { thinkingConfig: { thinkingBudget: 1024 } } : {};
    const corpo = (p: any) => JSON.stringify({ systemInstruction: { parts: [{ text: sistema }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.55, maxOutputTokens: 32768, responseMimeType: 'application/json', ...p } });
    try {
      let r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY }, body: corpo(pensar), signal: AbortSignal.timeout(resta) });
      if (r.status === 400 && (pensar as any).thinkingConfig) r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY }, body: corpo({}), signal: AbortSignal.timeout(Math.max(10_000, resta - (Date.now() - t0))) });
      if (!r.ok) { ultimo = `Gemini ${r.status}: ${(await r.text()).slice(0, 200)}`; falhas.push(modelo + ' ' + seg() + ' ' + ultimo.slice(0, 160)); continue; }
      const j = await r.json();
      const t = (j?.candidates?.[0]?.content?.parts || []).filter((p: any) => !p.thought).map((p: any) => p.text || '').join('');
      const s = t.replace(/```json|```/g, ''); const a = s.indexOf('{'), b = s.lastIndexOf('}');
      if (a < 0 || b < a) { ultimo = 'A IA não devolveu o roteiro.'; falhas.push(modelo + ' sem JSON (' + (j?.candidates?.[0]?.finishReason || '?') + ')'); continue; }
      const bruto = s.slice(a, b + 1);
      let json: any; try { json = JSON.parse(bruto); } catch { try { json = JSON.parse(bruto.replace(/,\s*([}\]])/g, '$1').replace(/[“”]/g, '"').replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":')); } catch (e2) { ultimo = 'JSON inválido'; falhas.push(modelo + ' ' + seg() + ' JSON inválido'); continue; } }
      return { json, modelo: modelo + ' ' + seg(), falhas };
    } catch (e) { ultimo = (e as Error)?.name === 'TimeoutError' ? 'A IA demorou demais.' : String((e as Error)?.message || e); falhas.push(modelo + ' ' + seg() + ' ' + ultimo.slice(0, 160)); }
  }
  const er: any = new Error(ultimo || 'A IA não respondeu.'); er.falhas = falhas; throw er;
}

// ---------- OpenRouter (modelos gratuitos) como reserva quando o Gemini falha ----------
const OR_KEY = ENV('OPENROUTER_API_KEY');
let cOr: { ts: number; v: string[] } | null = null;
const OR_PREF = ['deepseek/', 'qwen/qwen3', 'moonshotai/kimi', 'openai/gpt-oss', 'meta-llama/llama-4', 'meta-llama/llama-3.3-70b', 'z-ai/glm', 'google/gemma', 'mistralai/'];
async function orModelos(): Promise<string[]> {
  const fixo = ENV('OPENROUTER_MODELS').split(',').map((x) => x.trim()).filter(Boolean); if (fixo.length) return fixo;
  if (cOr && Date.now() - cOr.ts < 6 * 3600_000) return cOr.v;
  try {
    const j = await (await fetch('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(6000) })).json();
    const lento = (id: string) => /ultra|405b|480b|550b|-r1\b|r1-|thinking|reason/i.test(id) ? 50 : 0;
    const nota = (id: string) => { const i = OR_PREF.findIndex((p) => id.startsWith(p)); return (i < 0 ? 20 : i) + lento(id); };
    const v = (j?.data || []).filter((m: any) => String(m?.id || '').endsWith(':free') && (+m?.context_length || 0) >= 32000 && !/embed|guard|vision|audio|image/i.test(m.id)).map((m: any) => String(m.id)).sort((a: string, b: string) => nota(a) - nota(b)).slice(0, 5);
    if (v.length) { cOr = { ts: Date.now(), v }; return v; }
  } catch { /* lista fixa */ }
  return ['deepseek/deepseek-chat-v3-0324:free', 'meta-llama/llama-3.3-70b-instruct:free'];
}
async function openrouter(prompt: string, sistema: string, ate: number): Promise<any> {
  if (!OR_KEY) throw new Error('OpenRouter não configurado.');
  const falhas: string[] = [];
  for (const m of await orModelos()) {
    const ms = ate - Date.now(); if (ms < 15_000) break;
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', signal: AbortSignal.timeout(Math.min(ms - 2000, 70_000)), headers: { Authorization: 'Bearer ' + OR_KEY, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://diario-de-trader.app', 'X-Title': 'Diario de Trader' }, body: JSON.stringify({ model: m, temperature: 0.55, max_tokens: 16000, messages: [{ role: 'system', content: sistema }, { role: 'user', content: prompt }] }) });
      if (!r.ok) { const t = (await r.text()).slice(0, 160); falhas.push(m.split('/').pop() + ' ' + r.status); if (r.status === 402 || /free-models-per-day/i.test(t)) break; continue; }
      const j = await r.json(), txt = String(j?.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').replace(/<think>[\s\S]*?<\/think>/g, '');
      const a = txt.indexOf('{'), b = txt.lastIndexOf('}'); if (a < 0 || b < a) { falhas.push(m.split('/').pop() + ' sem JSON'); continue; }
      const bruto = txt.slice(a, b + 1);
      let json: any; try { json = JSON.parse(bruto); } catch { try { json = JSON.parse(bruto.replace(/,\s*([}\]])/g, '$1')); } catch { falhas.push(m.split('/').pop() + ' JSON inválido'); continue; } }
      return { json, modelo: 'openrouter ' + m, falhas };
    } catch (e) { falhas.push(m.split('/').pop() + ' ' + ((e as Error).name === 'TimeoutError' ? 'demorou' : (e as Error).message).slice(0, 60)); }
  }
  const er: any = new Error('OpenRouter sem resposta.'); er.falhas = falhas; throw er;
}

const SISTEMA = `Você é um professor brasileiro de mercado financeiro que transforma capítulos de livros em videoaulas narradas para um aluno chamado Luciano. Ele faz day trade de mini índice (WIN) e mini dólar (WDO) na B3, gosta de operar ações, estuda para a certificação CNPI-T e cursa Ciências Econômicas. A aula é tocada por uma voz sintética (texto para fala) enquanto a tela mostra visuais desenhados pelo app.

REGRAS DE CONTEÚDO
- Ensine o conteúdo do capítulo enviado, com fidelidade. Não invente afirmações que não estejam no texto ou que não sejam conhecimento consolidado. O livro pode estar em inglês: escreva SEMPRE em português do Brasil.
- Cubra os conceitos principais do capítulo na ordem do livro, explicando o porquê, com exemplos numéricos simples. Exemplos seus devem ser hipotéticos e ditos como tal ("imagine que...").
- Quando ajudar, conecte com o mercado brasileiro (WIN, WDO, ações da B3, índice do dólar, opções), sem forçar.
- Nunca use operações pessoais do aluno como exemplo. Exemplos vêm do livro, de gráficos reais de mercado (cena "candles") ou são hipotéticos e ditos como tal.
- Destaque pegadinhas de prova ("isso cai em prova").
- Nunca cite números de mercado reais de memória (cotações, máximas, variações). Para dados reais existem as cenas "candles" e "ajuste" com marcadores: o app preenche os números a partir de dados verdadeiros.

REGRAS DE NARRAÇÃO ("fala")
- "fala" é uma lista de parágrafos (2 a 6), cada um com 1 a 4 frases, escritos como se fala: frases curtas, tom de professor próximo, tratando o aluno por "você".
- Nada de markdown, emojis, siglas soletradas estranhas, fórmulas com símbolos (S_T, Σ, ≥) ou notas de rodapé. Fórmulas são ditas em palavras; a forma simbólica vai no visual, escrita de forma legível (h* = ρ × σS ÷ σF, não sigma_S).
- Não diga o número da aula por extenso na abertura; chame pelo tema.
- Números nos visuais no padrão brasileiro: vírgula decimal e ponto de milhar (0,928; 5.050.000).
- Na revisão, o aluno não responde em voz alta: nunca diga "Exato!" ou "Isso mesmo"; diga "A resposta é...".
- Cada parágrafo da fala tem um índice (0, 1, 2...). Os itens do visual com "em": k aparecem quando o parágrafo k começa. Faça os visuais aparecerem no ritmo da explicação.
- Cada cena de conteúdo tem de 100 a 180 palavras de fala (3 a 5 parágrafos). Cerca de 130 palavras por minuto: cada trecho de ~10 páginas deve render de 5 a 8 minutos de narração. Não resuma demais: explique como um bom professor, com o raciocínio e um exemplo.

GANCHO E RITMO (como um bom vídeo educativo)
- A primeira cena da aula é um GANCHO de até 12 segundos (2 parágrafos curtos, no máximo 35 palavras no total): vis "pergunta" com "q" = uma pergunta provocadora ou uma situação concreta do dia a dia de quem opera WIN/WDO ligada ao tema, e "r" = a promessa do que o aluno vai aprender ("Nesta aula: ..."), "em":1.
- Comece cada cena de conteúdo com uma frase curta de impacto (até 10 palavras) e depois explique.
- Troque de visual com frequência: prefira mais cenas mais curtas a poucas cenas longas.

TIPOS DE VISUAL ("vis") — use variedade e escolha o que melhor ensina
1. {"tipo":"titulo","kicker":"Capítulo 3","t":"Título","sub":"subtítulo","chips":["..."]}
2. {"tipo":"topicos","t":"Título","itens":[{"t":"item curto","s":"detalhe","em":0}]}  (até 6 itens)
3. {"tipo":"tabela","t":"Título","cab":["","Coluna A","Coluna B"],"linhas":[["Linha","a","b"]],"em":[0,1],"nota":"..."}  (até 7 linhas, 4 colunas; textos curtos)
4. {"tipo":"formula","t":"Título","f":"Fórmula curta","linhas":[{"t":"exemplo numérico passo a passo","em":1},{"t":"resultado","em":2,"forte":true}]}
5. {"tipo":"payoff","t":"Call comprada: K = 40, prêmio = 2","x":[30,52],"pernas":[{"tipo":"call","K":40,"p":2,"pos":1}],"emBe":2,"ponto":{"s":48,"t":"ação a 48:","em":3},"xr":"Ação no vencimento (R$)"}  tipos de perna: call, put, termo; pos 1 = comprado, -1 = vendido; "p" = prêmio; várias pernas = estratégia (trava, straddle...). O app calcula o gráfico e o ponto de equilíbrio.
6. {"tipo":"fluxo","t":"Título","nos":[{"id":"a","t":"Caixa","sub":"detalhe","x":15,"y":15,"em":0}],"setas":[{"de":"a","para":"b","t":"rótulo","dupla":false,"em":1}]}  diagrama: x de 10 a 90, y de 8 a 55; textos de caixa com até 14 letras.
7. {"tipo":"convergencia","t":"Título","emA":1,"emB":2,"nota":"..."}  desenho fixo: preço futuro (acima e abaixo) convergindo ao à vista no vencimento.
8. {"tipo":"pergunta","q":"Pergunta","r":"Resposta curta","em":1}  revisão: o parágrafo 0 faz a pergunta e diz "pense um pouco"; o parágrafo 1 responde.
9. {"tipo":"candles","t":"Título (dados reais)","dados":{"ativo":"USDBRL","de":"2024-01-02","ate":"2024-12-30","casas":2},"emMarcas":1,"nota":"..."}  gráfico real de candles. Ativos aceitos: WIN (mostra o Ibovespa à vista), WDO (mostra o dólar à vista × 1000), IBOV, USDBRL, DXY (índice do dólar), SPX, NDX, DOW, BRENT, WTI, OURO, PRATA, BTC, EURUSD ou ação da B3 (PETR4, VALE3, ITUB4...). Marcações opcionais calculadas pelo app com os dados reais: "marcas":[{"k":"max","em":1},{"k":"min","em":1},{"k":"mm","n":20,"t":"média de 20","em":2}] (k = max, min, ini, fim ou mm = média móvel de n períodos); nunca escreva preços. Datas passadas reais, de 3 semanas a 2 anos. Na fala use SÓ estes marcadores para números: {ini} {fim} {max} {min} {varp} {deTx} {ateTx}. Obrigatório "falaSem": fala alternativa sem marcadores, para quando os dados não carregarem. Use até 2 por capítulo quando o conceito pede um exemplo real (tendência, suporte e resistência, rompimento, volatilidade, médias móveis, correlação ação × índice ou dólar); prefira ações da B3, IBOV, WIN, WDO e DXY. Não afirme o que aconteceu no período: deixe os marcadores mostrarem.
10. {"tipo":"ajuste","t":"2 WDO comprados","desc":"explicação curta","precos":[5400,5386.5,5371],"mult":10,"contratos":2,"margemIni":1500,"margemMan":1125,"casas":1,"emTab":1}  tabela de ajuste diário de futuros com saldo de margem e chamadas de margem calculadas pelo app (mult = R$ por ponto por contrato; WIN 0.2, WDO 10). Marcadores: {chamadas} {deposito} {total} {pIni} {pFim} {margemIni} {margemMan}. Só use se o capítulo tratar de futuros/margem.
11. {"tipo":"figura","id":"p45a","t":"Título curto","nota":"Figura 3.2 do livro: o que observar","zoom":false}  mostra uma figura do próprio livro (gráfico, tabela, diagrama). Use SÓ ids listados em FIGURAS DO LIVRO. Quando o texto do trecho tiver uma marca [FIGURA p45a ...], mostre essa figura na cena em que a explicação fala dela e explique na fala o que ela mostra com base no texto do livro (não descreva detalhes que o texto não confirma). Uma figura por cena; prefira a figura do livro a um desenho genérico quando ela ilustra o conceito. "zoom":true quando a figura tem detalhes pequenos.

FORMATO DA RESPOSTA: apenas JSON {"titulo_aula":"...","cenas":[{"titulo":"nome curto da cena","vis":{...},"fala":["...","..."]}]}`;

function promptParte(b: { livro: string; numero: number; idx: number; total: number; capitulo: string; texto: string; caps: string[]; anteriores: string[]; bloco: number; blocos: number; figuras?: { id: string; pag: number; leg: string }[] }) {
  const prim = b.idx === 0, ult = b.idx === b.total - 1, iniCap = b.bloco === 0, fimCap = b.bloco === b.blocos - 1;
  const estrutura = [
    prim ? `- Comece com a cena de GANCHO (vis "pergunta", ver GANCHO E RITMO). Depois, UMA cena de abertura (vis "titulo", kicker "Aula ${b.numero}") que cumprimenta o Luciano e diz o que a aula cobre: ${b.caps.join('; ')}.` : '',
    iniCap ? `- ${prim ? 'Depois da abertura, uma' : 'Comece com uma'} cena "titulo" com kicker "${b.capitulo.slice(0, 40)}" apresentando o capítulo.` : `- Este texto é a CONTINUAÇÃO do capítulo "${b.capitulo}" (trecho ${b.bloco + 1} de ${b.blocos}). Não abra o capítulo de novo: siga direto do ponto onde as cenas anteriores pararam.`,
    `- ${ult ? '5 a 7' : '6 a 9'} cenas que ensinam TODO o conteúdo deste trecho, na ordem, com visuais variados (tabela, fórmula com exemplo numérico, diagrama, payoff quando houver opções). Cada exemplo numérico do livro merece uma cena de fórmula com o passo a passo.`,
    !ult && fimCap && b.blocos > 1 ? '- Feche o capítulo com uma frase de transição para o próximo.' : '',
    ult ? '- Termine a aula com 3 cenas de revisão (vis "pergunta", "pausa":600) sobre os pontos mais importantes de TODA a aula e uma cena final de encerramento (vis "topicos" com o resumo) que se despede e indica o que vem a seguir no livro.' : '- Não faça revisão nem encerramento: a aula continua com o próximo capítulo.',
  ].filter(Boolean).join('\n');
  return `Livro: ${b.livro}
Aula ${b.numero}, parte ${b.idx + 1} de ${b.total}. Capítulos desta aula: ${b.caps.join('; ')}.
Capítulo desta parte: ${b.capitulo} (trecho ${b.bloco + 1} de ${b.blocos})
${b.anteriores.length ? 'Cenas já feitas nas partes anteriores (não repita): ' + b.anteriores.join(' | ') : ''}

${b.figuras && b.figuras.length ? 'FIGURAS DO LIVRO neste trecho (use com vis "figura"):\n' + b.figuras.map((f) => `- ${f.id} (página ${f.pag})${f.leg ? ': ' + f.leg : ''}`).join('\n') + '\n' : ''}
ESTRUTURA DESTA PARTE
${estrutura}

TEXTO DESTE TRECHO DO CAPÍTULO (extraído do PDF; pode ter cabeçalhos, números de página e quebras soltas — ignore esse ruído):
"""
${b.texto}
"""`;
}

function promptExpande(cenas: any[], texto: string) {
  return `Abaixo está o roteiro de um trecho da aula, em JSON. As falas ficaram curtas demais. Reescreva o roteiro inteiro, no mesmo formato JSON {"cenas":[...]}, mantendo a mesma ordem, os mesmos títulos e o mesmo propósito de cada cena, e:
- deixe CADA cena de conteúdo com 4 a 5 parágrafos e 140 a 200 palavras de fala: explique o porquê, dê um exemplo hipotético simples com números e, quando couber, ligue ao WIN, WDO ou ações da B3;
- cenas de abertura ("titulo") ficam com 2 ou 3 parágrafos; cenas de "pergunta" mantêm 2 parágrafos (pergunta e resposta);
- melhore os visuais quando houver números: prefira "formula" com o passo a passo ou "tabela" a uma lista de tópicos; ajuste os "em" para os novos parágrafos;
- tudo fiel ao texto do livro abaixo, em português do Brasil, sem inventar dados de mercado.

ROTEIRO ATUAL:
${JSON.stringify({ cenas })}

TEXTO DO TRECHO:
"""
${texto.slice(0, 60_000)}
"""`;
}

const palavras = (r: any) => (r?.cenas || []).reduce((s: number, c: any) => s + (c.fala || []).join(' ').split(/\s+/).length, 0);

async function fazParte(uid: string, b: any): Promise<{ s: number; o: any }> {
  const out = (o: any, s = 200) => ({ s, o });
  let reservaId: string | null = null;
  try {
      const id = txt(b.id, 40); if (!/^[0-9a-f-]{36}$/.test(id)) return out({ error: 'Aula inválida.' }, 400);
      const L = await db(`aulas?select=id,livro,numero,roteiro,status&id=eq.${id}&user_id=eq.${uid}`);
      const a = L?.[0]; if (!a) return out({ error: 'Aula não encontrada.' }, 404);
      const rot = a.roteiro || { cenas: [], partes: [] }, idx = Math.round(num(b.idx, 0, 23, 0)!), total = Math.round(num(b.total, 1, 24, 1)!), bloco = Math.round(num(b.bloco, 0, 11, 0)!), blocos = Math.max(bloco + 1, Math.round(num(b.blocos, 1, 12, 1)!));
      if ((rot.partes || []).includes(idx)) return out({ ok: true, pronta: a.status === 'pronta', jaFeita: true, cenas: rot.cenas.length });
      if ((rot.partes || []).length !== idx) return out({ error: 'Gere as partes em ordem.' }, 409);
      let texto = String(b.texto || '').replace(/\u0000/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      if (texto.length < 800) return out({ error: 'Quase não há texto nessas páginas. O PDF pode ser escaneado (imagem), sem texto selecionável.' }, 422);
      if (texto.length > MAX_TEXTO) texto = texto.slice(0, MAX_TEXTO);
      const reserva=await reservaUso(uid,'parte','parte:'+id+':'+idx);
      if(!reserva.permitido)return out({error:reserva.motivo==='em_andamento'?'Este capítulo já está sendo gerado. Aguarde antes de tentar novamente.':`Limite de ${LIMITE_PARTES_DIA} gerações de capítulos por dia atingido.`},reserva.motivo==='em_andamento'?409:429);
      reservaId=reserva.id;
      const capitulo = txt(b.capitulo, 120) || `Capítulo ${idx + 1}`;
      // figuras extraídas do PDF no aparelho e já enviadas ao bucket aulas-figuras/<uid>/<aula>/<id>.jpg
      const figuras = arr(b.figuras).map((f: any) => ({ id: txt(f?.id, 8).toLowerCase(), pag: Math.round(num(f?.pag, 1, 9999, 1)!), leg: txt(f?.leg, 160), w: Math.round(num(f?.w, 1, 4000, 0)!), h: Math.round(num(f?.h, 1, 4000, 0)!) })).filter((f) => FIG_ID.test(f.id) && f.w && f.h).slice(0, 30);
      const figSet = new Set(figuras.map((f) => f.id));
      if (figuras.length) { rot.figDir = `${uid}/${id}`; rot.figuras = { ...(rot.figuras || {}) }; for (const f of figuras) rot.figuras[f.id] = { pag: f.pag, leg: f.leg, w: f.w, h: f.h }; }
      const anteriores = (rot.cenas || []).map((c: any) => c.titulo).slice(-60);
      let res: any, modelo = ''; const t0Req = Date.now();
      try {
      const pp = promptParte({ livro: a.livro, numero: a.numero, idx, total, capitulo, texto, caps: rot.caps || [capitulo], anteriores, bloco, blocos, figuras });
      try { const g = await gemini(pp, SISTEMA, OR_KEY ? 80_000 : 125_000); res = g.json; modelo = g.modelo; rot.falhas = (g.falhas || []).slice(0, 4); }
      catch (e0) { if (!OR_KEY) throw e0; const g = await openrouter(pp, SISTEMA, t0Req + 140_000).catch((e1: any) => { const er: any = new Error((e0 as Error).message); er.falhas = [...((e0 as any).falhas || []), ...(e1.falhas || [e1.message])]; throw er; }); res = g.json; modelo = g.modelo; rot.falhas = [...((e0 as any).falhas || []), ...(g.falhas || [])].slice(0, 6); }
    } catch (e) { const msg = String((e as Error).message || e); await db(`aulas?id=eq.${id}&user_id=eq.${uid}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ erro: ((e as any).falhas || [msg]).join(' | ').slice(0, 900) }) }).catch(() => {}); return out({ error: /429|quota|RESOURCE/i.test(msg) ? 'A cota da IA do Google acabou por agora. Tente mais tarde.' : /503|overload|UNAVAILABLE/i.test(msg) ? 'A IA do Google está sobrecarregada. Tente de novo em alguns minutos.' : 'A IA não conseguiu escrever este capítulo: ' + msg.slice(0, 160) }, 502); }
      let novas = arr(res?.cenas).map((c: any) => limpaCena(c, figSet)).filter(Boolean).slice(0, 16);
      // modelo mais fraco (cota dos melhores esgotada) costuma escrever curto: uma segunda passada aprofunda as falas
      const media = (L: any[]) => { const c = L.filter((x) => !['titulo', 'pergunta'].includes(x.vis.tipo)); return c.length ? c.reduce((s, x) => s + x.fala.join(' ').split(/\s+/).length, 0) / c.length : 999; };
      if (novas.length >= 2 && media(novas) < 90 && Date.now() - t0Req < 75_000) {
        try {
          const g2 = await gemini(promptExpande(novas, texto), SISTEMA, Math.max(20_000, 138_000 - (Date.now() - t0Req)));
          const mais = arr(g2.json?.cenas).map((c: any) => limpaCena(c, figSet)).filter(Boolean).slice(0, 14);
          if (mais.length >= novas.length - 1 && media(mais) > media(novas) * 1.25) { novas = mais; modelo += ' + ' + g2.modelo; }
        } catch { /* fica com a primeira versão */ }
      }
      if (novas.length < 2) return out({ error: 'A IA devolveu um roteiro curto demais. Tente de novo.' }, 502);
      rot.cenas = [...(rot.cenas || []), ...novas]; rot.partes = [...(rot.partes || []), idx];
      rot.min = Math.max(1, Math.round(palavras(rot) / 135)); rot.modelo = modelo;
      const ult = rot.partes.length >= total;
      const patch: any = { roteiro: rot, atualizado_em: new Date().toISOString(), status: ult ? 'pronta' : 'gerando', erro: null };
      if (idx === 0) patch.titulo = txt(res?.titulo_aula, 90) || capitulo;
      if (ult) patch.criado_em = new Date().toISOString(); // muda a "versão" para o app baixar o roteiro novo
      await db(`aulas?id=eq.${id}&user_id=eq.${uid}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(patch) });
      return out({ ok: true, pronta: ult, cenas: rot.cenas.length, min: rot.min });
  } finally { if (reservaId) await db('rpc/aulas_finalizar_uso', { method: 'POST', body: JSON.stringify({ p_uid: uid, p_id: reservaId }) }).catch(() => {}); }
}

// ---------- fila no servidor: o app enfileira os trechos e pode ser fechado ----------
let WP: any = null;
async function avisa(uid: string, title: string, body: string) {
  const pub = ENV('VAPID_PUBLIC'), pri = ENV('VAPID_PRIVATE'); if (!pub || !pri) return;
  try {
    if (!WP) { WP = (await import('npm:web-push@3.6.7')).default; WP.setVapidDetails(ENV('VAPID_SUBJECT') || 'mailto:aulas@example.com', pub, pri); }
    const subs = await db(`push_subs?select=id,sub&user_id=eq.${uid}`).catch(() => []);
    for (const x of subs || []) { try { await WP.sendNotification(x.sub, JSON.stringify({ title, body, tag: 'aula', data: { go: 'estudos' } }), { TTL: 3600 }); } catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await db(`push_subs?id=eq.${x.id}`, { method: 'DELETE' }).catch(() => null); } }
  } catch { /* sem push */ }
}
async function processar() {
  const t0 = Date.now(); let feitos = 0;
  const velho = new Date(Date.now() - 7 * 60_000).toISOString();
  await db(`aulas_fila?status=eq.processando&atualizado=lt.${velho}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'pendente' }) }).catch(() => {});
  while (Date.now() - t0 < 45_000) {
    const L = await db('aulas_fila?select=id,user_id,aula_id,idx,status&status=in.(pendente,processando)&order=criado.asc,idx.asc&limit=200');
    const ocup = new Set((L || []).filter((r: any) => r.status === 'processando').map((r: any) => r.aula_id));
    const vistos = new Set<string>(); let alvo: any = null;
    for (const r of L || []) { if (vistos.has(r.aula_id)) continue; vistos.add(r.aula_id); if (!ocup.has(r.aula_id) && r.status === 'pendente') { alvo = r; break; } }
    if (!alvo) break;
    const pega = await db(`aulas_fila?id=eq.${alvo.id}&status=eq.pendente`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ status: 'processando', atualizado: new Date().toISOString() }) });
    const p = pega?.[0]; if (!p) continue;
    let r: { s: number; o: any };
    try { r = await fazParte(p.user_id, { id: p.aula_id, idx: p.idx, total: p.total, bloco: p.bloco, blocos: p.blocos, capitulo: p.capitulo, texto: p.texto, figuras: p.figuras }); }
    catch (e) { r = { s: 500, o: { error: String((e as Error).message || e) } }; }
    const agora = new Date().toISOString();
    if (r.s === 200) {
      feitos++;
      await db(`aulas_fila?id=eq.${p.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'feito', texto: '', erro: null, atualizado: agora }) });
      if (r.o?.pronta && !r.o?.jaFeita) {
        const A = await db(`aulas?select=titulo,numero&id=eq.${p.aula_id}`).catch(() => []);
        await avisa(p.user_id, 'Videoaula pronta', `Aula ${A?.[0]?.numero || ''} — ${A?.[0]?.titulo || ''}`.trim());
      }
    } else if (r.s === 409 && /ordem/.test(r.o?.error || '')) {
      await db(`aulas_fila?id=eq.${p.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'erro', erro: r.o.error, atualizado: agora }) });
    } else {
      const tent = (p.tentativas || 0) + 1, fim = tent >= 4 || r.s === 422;
      await db(`aulas_fila?id=eq.${p.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: fim ? 'erro' : 'pendente', tentativas: tent, erro: String(r.o?.error || '').slice(0, 400), atualizado: agora }) });
      if (fim) { await db(`aulas?id=eq.${p.aula_id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'erro', erro: String(r.o?.error || '').slice(0, 400) }) }).catch(() => {}); await avisa(p.user_id, 'Videoaula parou', String(r.o?.error || 'Falha na IA').slice(0, 120)); }
      if (/429|cota/i.test(String(r.o?.error))) break;
    }
  }
  return { ok: true, feitos };
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try { if (new URL(req.url).searchParams.has('versao')) return out({ fn: 'aulas', versao: VERSAO_FN }); } catch { /* */ }
  if (req.method !== 'POST') return out({ error: 'Método não permitido' }, 405);
  if (!GEMINI_KEY || !SRK) return out({ error: 'Falta configurar a chave do Gemini no Supabase.' }, 500);
  let b: any; try { b = await req.json(); } catch { return out({ error: 'Pedido inválido.' }, 400); }
  if (b?.acao === 'processar') { if (!dentroDoLimite('fila:proc', 4)) return out({ ok: true, ocupado: true }); // só avança a fila; não lê nem devolve dados
    const job = processar().catch((e) => console.error('fila', e));
    try { (globalThis as any).EdgeRuntime?.waitUntil(job); } catch { /* */ }
    return out({ ok: true, rodando: true }); }
  const uid = await usuarioDe(req);
  if (!uid) return out({ error: 'Entre na sua conta no app (Mais → Conta).' }, 401);
  if (!dentroDoLimite(uid, 8)) return out({ error: 'Muitos pedidos seguidos. Espere um minuto.' }, 429);

  let reservaId: string | null = null;
  try {
    if (b.acao === 'iniciar') {
      const livro = txt(b.livro, 140), numero = Math.round(num(b.numero, 1, 999, 0)!), caps = arr(b.capitulos).map((c) => txt(c, 120)).filter(Boolean).slice(0, 4);
      if (!livro || !numero || !caps.length) return out({ error: 'Informe o livro, o número da aula e os capítulos.' }, 400);
      const reserva=await reservaUso(uid,'iniciar','inicio:'+livro.slice(0,180)+':'+numero);
      if(!reserva.permitido)return out({error:reserva.motivo==='em_andamento'?'Esta aula já está sendo iniciada. Espere alguns instantes.':`Limite de ${LIMITE_AULAS_DIA} inícios de aula por dia atingido.`},reserva.motivo==='em_andamento'?409:429);
      reservaId=reserva.id;
      const linha = { user_id: uid, livro, numero, titulo: 'Gerando…', capitulos: caps.map((c) => (/^\d+/.exec(c.replace(/^cap[íi]tulo\s*/i, '')) || [c.slice(0, 18)])[0]).join(', '), status: 'gerando', erro: null, roteiro: { versao: 1, livro, min: 0, cenas: [], partes: [], caps }, progresso: {}, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() };
      const r = await db('aulas?on_conflict=user_id,livro,numero', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(linha) });
      return out({ id: r?.[0]?.id });
    }

    if (b.acao === 'parte') { const r = await fazParte(uid, b); return out(r.o, r.s); }

    if (b.acao === 'enfileirar') {
      const id = txt(b.id, 40); if (!/^[0-9a-f-]{36}$/.test(id)) return out({ error: 'Aula inválida.' }, 400);
      const A = await db(`aulas?select=id&id=eq.${id}&user_id=eq.${uid}`); if (!A?.[0]) return out({ error: 'Aula não encontrada.' }, 404);
      const texto = String(b.texto || '').replace(/\u0000/g, '').slice(0, MAX_TEXTO);
      const linha = { user_id: uid, aula_id: id, idx: Math.round(num(b.idx, 0, 23, 0)!), total: Math.round(num(b.total, 1, 24, 1)!), bloco: Math.round(num(b.bloco, 0, 11, 0)!), blocos: Math.round(num(b.blocos, 1, 12, 1)!), capitulo: txt(b.capitulo, 120), texto, figuras: arr(b.figuras).slice(0, 30), status: 'pendente', tentativas: 0, erro: null, atualizado: new Date().toISOString() };
      await db('aulas_fila?on_conflict=aula_id,idx', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(linha) });
      if (linha.idx === 0) await db(`aulas?id=eq.${id}&user_id=eq.${uid}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'gerando', erro: null }) }).catch(() => {});
      return out({ ok: true, fila: true });
    }
    return out({ error: 'Ação desconhecida.' }, 400);
  } catch (e) { return out({ error: String((e as Error).message || e).slice(0, 300) }, 500); }
  finally { if(reservaId)await db('rpc/aulas_finalizar_uso',{method:'POST',body:JSON.stringify({p_uid:uid,p_id:reservaId})}).catch(()=>{}); }
});
