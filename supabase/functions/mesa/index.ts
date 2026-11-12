// Jornal do Pregão (v562) — Editor-Chefe de mesa proprietária.
// Lê a última edição do Jornal já gerada pela função "analise" (tabela analise_cache),
// reescreve no formato de 5 seções (Capa, Plano do Pregão, Macro, Radar Corporativo, Agenda & Coluna)
// e guarda em analise_cache com a chave "mesa:<chave da edição>".
// Números (cotações, pivôs, maiores altas e baixas) são calculados aqui; a IA só escreve o texto.
// Sem dado confiável → "–". Nunca inventar.

import { edicaoSalva } from './fallback.ts';
const SB = Deno.env.get('SUPABASE_URL') || '';
const SB_SVC = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SB_ANON = Deno.env.get('SUPABASE_ANON_KEY') || '';
const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const modeloAtual = (nome: string) => {
  const id = String(nome || '').trim().replace(/^models\//, '');
  if (!id || /^gemini-(?:1\.|2\.[0-5](?:-|$))/.test(id)) return 'gemini-3.6-flash';
  return id;
};
const MODELO = modeloAtual(Deno.env.get('GEMINI_MODEL_MESA') || Deno.env.get('GEMINI_MODEL_JORNAL') || Deno.env.get('GEMINI_MODEL') || 'gemini-3.6-flash');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const VERSAO = 'mesa-v563';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const out = (x: unknown, st = 200) => new Response(JSON.stringify(x), { status: st, headers: { ...CORS, 'Content-Type': 'application/json' } });
const svc = (x: Record<string, string> = {}) => ({ apikey: SB_SVC, Authorization: 'Bearer ' + SB_SVC, 'Content-Type': 'application/json', ...x });

async function usuario(req: Request): Promise<string | null> {
  const a = req.headers.get('Authorization') || '';
  if (!/^Bearer\s+\S+/.test(a)) return null;
  try {
    const r = await fetch(`${SB}/auth/v1/user`, { headers: { apikey: SB_ANON || SB_SVC, Authorization: a }, signal: AbortSignal.timeout(6_000) });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.id || null;
  } catch { return null; }
}

async function cacheGet(chave: string): Promise<{ dia: string; dados: any; criado?: string } | null> {
  const r = await fetch(`${SB}/rest/v1/analise_cache?select=dia,dados,criado&chave=eq.${encodeURIComponent(chave)}&limit=1`, { headers: svc() });
  if (!r.ok) return null;
  const j = await r.json();
  return j && j[0] ? j[0] : null;
}
async function cachePut(chave: string, dia: string, dados: any) {
  await fetch(`${SB}/rest/v1/analise_cache?on_conflict=chave`, {
    method: 'POST', headers: svc({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify({ chave, dia, dados, criado: new Date().toISOString() }),
  });
}
/** Edição mais recente do Jornal (ou a pedida). */
async function edicao(chave?: string): Promise<{ chave: string; dia: string; dados: any } | null> {
  if (chave && /^jornal:\d{4}-\d{2}-\d{2}:[a-z]+$/.test(chave)) {
    const c = await cacheGet(chave);
    return c ? { chave, dia: c.dia, dados: c.dados } : null;
  }
  const r = await fetch(`${SB}/rest/v1/analise_cache?select=chave,dia,dados,criado&chave=like.jornal%3A*&order=criado.desc&limit=12`, { headers: svc() });
  if (!r.ok) return null;
  const L = ((await r.json()) as any[]).filter((x) => /^jornal:\d{4}-\d{2}-\d{2}:[a-z]+$/.test(x.chave) && x.dados && (x.dados.manchete || x.dados.materias));
  return L[0] ? { chave: L[0].chave, dia: L[0].dia, dados: L[0].dados } : null;
}

// ---------- números ----------
const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : null);
function pivos(H: number, L: number, C: number) {
  const P = (H + L + C) / 3, r = H - L;
  return { R2: P + r, R1: 2 * P - L, P, S1: 2 * P - H, S2: P - r };
}
const arred = (v: number, passo: number) => Math.round(v / passo) * passo;
/** Máxima, mínima e fechamento da sessão do TradingView (WIN1! e WDO1!). */
async function sessao(): Promise<Record<string, { H: number; L: number; C: number } | null>> {
  try {
    const r = await fetch('https://scanner.tradingview.com/global/scan', {
      method: 'POST', signal: AbortSignal.timeout(9_000),
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
      body: JSON.stringify({ symbols: { tickers: ['BMFBOVESPA:WIN1!', 'BMFBOVESPA:WDO1!'], query: { types: [] } }, columns: ['high', 'low', 'close'] }),
    });
    if (!r.ok) return {};
    const j = await r.json(), o: Record<string, any> = {};
    for (const x of j?.data || []) {
      const k = /WIN/.test(x.s) ? 'win' : /WDO/.test(x.s) ? 'wdo' : '';
      const [H, L, C] = (x.d || []).map(num);
      if (k && H && L && C && H >= L && C <= H && C >= L) o[k] = { H, L, C };
    }
    return o;
  } catch { return {}; }
}
/** Cinco maiores altas e baixas do Ibovespa no último pregão. */
async function topIbov(): Promise<{ altas: any[]; baixas: any[] }> {
  try {
    const r = await fetch('https://scanner.tradingview.com/brazil/scan', {
      method: 'POST', signal: AbortSignal.timeout(9_000),
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' },
      body: JSON.stringify({ symbols: { symbolset: ['SYML:BMFBOVESPA;IBOV'] }, columns: ['name', 'close', 'change'], sort: { sortBy: 'change', sortOrder: 'desc' }, range: [0, 120] }),
    });
    if (!r.ok) return { altas: [], baixas: [] };
    const j = await r.json();
    const L = (j?.data || []).map((x: any) => ({ tk: String(x.d?.[0] || x.s || '').replace(/^.*:/, ''), px: num(x.d?.[1]), var: num(x.d?.[2]) })).filter((x: any) => x.tk && x.px != null && x.var != null);
    if (L.length < 10) return { altas: [], baixas: [] };
    const ord = [...L].sort((a, b) => b.var - a.var);
    return { altas: ord.slice(0, 5), baixas: ord.slice(-5).reverse() };
  } catch { return { altas: [], baixas: [] }; }
}

// ---------- texto ----------
const SYS = `Você é o Editor-Chefe de uma mesa proprietária de day trade e swing trade na B3. Escreve o "Jornal do Pregão": leitura de no máximo 4 minutos, focada no que mexe com o preço.

REGRAS
1. Sem repetição: cada fato aparece em UM lugar só. As "5 Coisas" não repetem a manchete; a Coluna não repete a Capa.
2. Estilo telegráfico: cada bloco tem no máximo 3 linhas: Fato + Número + Impacto em WIN, WDO, DI ou ações.
3. Sem economês: frases curtas, verbos diretos, termo técnico só quando o trader usa.
4. Etiquetas de impacto por ativo, no formato {"s":"+","a":"WIN"} (alta), {"s":"-","a":"WDO"} (queda) ou {"s":"=","a":"DI"} (neutro). Use os ativos WIN, WDO, DI, IBOV ou o ticker da ação.
5. NUNCA invente dado. Use apenas os números e fatos do material recebido. Sem o dado, escreva "–".
6. Português do Brasil, texto original. Sem recomendação de compra ou venda; descreva cenários e gatilhos.
7. Nunca use a notação "R" para resultado ou risco (ex.: "2R"); use "vezes o risco", R$ ou %.

Responda SOMENTE este JSON:
{
 "capa": {"manchete":"até 10 palavras","subtitulo":"2 linhas no máximo","por_que_importa":"1 frase","cinco":["5 itens curtos, diferentes da manchete"]},
 "plano": {
   "win": {"vies":"Alta|Baixa|Neutro","leitura":"1 linha","gatilho_alta":"1 linha","gatilho_baixa":"1 linha","tags":[{"s":"+","a":"WIN"}]},
   "wdo": {"vies":"Alta|Baixa|Neutro","leitura":"1 linha","gatilho_alta":"1 linha","gatilho_baixa":"1 linha","tags":[]}
 },
 "macro": {
   "brasil": {"titulo":"Fiscal e Banco Central","fato":"","numero":"","impacto":"","tags":[]},
   "exterior": {"titulo":"EUA e commodities","fato":"","numero":"","impacto":"","tags":[]}
 },
 "radar": {
   "placar": [{"tk":"TICKER","receita":"R$ ... ou –","lucro":"R$ ... ou –","ebitda":"R$ ... ou –","leitura":"Acima|Em linha|Abaixo|–","texto":"3 linhas no máximo: o que veio, o número-chave e o efeito na ação","tags":[]}],
   "comentario_movers": "1 linha sobre o que explica as maiores altas e baixas, ou –"
 },
 "agenda": {
   "eventos": [{"hora":"hh:mm ou –","pais":"BR|EUA|...","evento":"","relevancia":"Alta|Média","consenso":"– se não houver","anterior":"– se não houver"}],
   "corporativos": ["balanços, dividendos, assembleias do próximo pregão"],
   "coluna": ["parágrafo 1: sentimento do mercado","parágrafo 2: onde está a assimetria (o que o preço não precificou)"],
   "psicologia": "1 frase de psicologia do trader"
 }
}`;

async function gemini(pedido: string, ate: number): Promise<any> {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY não configurada.');
  const modelos = [...new Set([MODELO, 'gemini-3.6-flash', 'gemini-3.5-flash-lite'])];
  let ult = '';
  for (const m of modelos) {
    const ms = ate - Date.now();
    if (ms < 8_000) break;
    for (const pensar of [true, false]) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
          method: 'POST', signal: AbortSignal.timeout(Math.min(ms, 90_000)),
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYS }] },
            contents: [{ role: 'user', parts: [{ text: pedido }] }],
            generationConfig: { temperature: 0.35, maxOutputTokens: 12000, responseMimeType: 'application/json', ...(pensar && /gemini-3/.test(m) ? { thinkingConfig: { thinkingLevel: 'low' } } : {}) },
          }),
        });
        if (!r.ok) {
          ult = `Gemini ${r.status}: ${(await r.text()).slice(0, 200)}`;
          if (r.status === 400 && pensar && /thinking/i.test(ult)) continue;
          break;
        }
        const j = await r.json();
        const t = (j?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
        const a = t.indexOf('{'), b = t.lastIndexOf('}');
        if (a < 0 || b <= a) { ult = 'resposta sem JSON'; break; }
        return JSON.parse(t.slice(a, b + 1));
      } catch (e) { ult = (e as Error)?.message || String(e); break; }
    }
  }
  throw new Error(ult || 'IA indisponível');
}

// ---------- normalização ----------
const s = (v: unknown, n = 400) => { const x = typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : ''; return x ? x.slice(0, n) : '–'; };
const semR = (x: string) => x.replace(/\b(\d+(?:[.,]\d+)?)\s?R\b(?!\$)/g, '$1 vezes o risco');
const tx = (v: unknown, n = 400) => semR(s(v, n));
const tags = (v: unknown) => (Array.isArray(v) ? v : []).map((t: any) => ({ s: ['+', '-', '='].includes(t?.s) ? t.s : '=', a: String(t?.a || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) })).filter((t) => t.a).slice(0, 4);
const vies = (v: unknown) => (/^alta/i.test(String(v)) ? 'Alta' : /^baixa/i.test(String(v)) ? 'Baixa' : /^neutr/i.test(String(v)) ? 'Neutro' : '–');
function normal(r: any) {
  const pl = (x: any) => ({ vies: vies(x?.vies), leitura: tx(x?.leitura, 200), gatilho_alta: tx(x?.gatilho_alta, 200), gatilho_baixa: tx(x?.gatilho_baixa, 200), tags: tags(x?.tags) });
  const mc = (x: any, t: string) => ({ titulo: s(x?.titulo, 60) === '–' ? t : s(x?.titulo, 60), fato: tx(x?.fato, 260), numero: tx(x?.numero, 120), impacto: tx(x?.impacto, 260), tags: tags(x?.tags) });
  const cinco = (Array.isArray(r?.capa?.cinco) ? r.capa.cinco : []).map((x: unknown) => tx(x, 180)).filter((x: string) => x !== '–').slice(0, 5);
  return {
    capa: { manchete: tx(r?.capa?.manchete, 90), subtitulo: tx(r?.capa?.subtitulo, 220), por_que_importa: tx(r?.capa?.por_que_importa, 220), cinco },
    plano: { win: pl(r?.plano?.win), wdo: pl(r?.plano?.wdo) },
    macro: { brasil: mc(r?.macro?.brasil, 'Fiscal e Banco Central'), exterior: mc(r?.macro?.exterior, 'EUA e commodities') },
    radar: {
      placar: (Array.isArray(r?.radar?.placar) ? r.radar.placar : []).slice(0, 8).map((x: any) => ({
        tk: String(x?.tk || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7) || '–', receita: s(x?.receita, 40), lucro: s(x?.lucro, 40), ebitda: s(x?.ebitda, 40),
        leitura: /^acima/i.test(x?.leitura) ? 'Acima' : /^abaixo/i.test(x?.leitura) ? 'Abaixo' : /linha/i.test(x?.leitura) ? 'Em linha' : '–', texto: tx(x?.texto, 360), tags: tags(x?.tags),
      })),
      comentario_movers: tx(r?.radar?.comentario_movers, 220),
    },
    agenda: {
      eventos: (Array.isArray(r?.agenda?.eventos) ? r.agenda.eventos : []).slice(0, 10).map((x: any) => ({ hora: s(x?.hora, 12), pais: s(x?.pais, 10), evento: tx(x?.evento, 120), relevancia: /^alta/i.test(x?.relevancia) ? 'Alta' : 'Média', consenso: s(x?.consenso, 30), anterior: s(x?.anterior, 30) })),
      corporativos: (Array.isArray(r?.agenda?.corporativos) ? r.agenda.corporativos : []).map((x: unknown) => tx(x, 160)).filter((x: string) => x !== '–').slice(0, 6),
      coluna: (Array.isArray(r?.agenda?.coluna) ? r.agenda.coluna : []).map((x: unknown) => tx(x, 900)).filter((x: string) => x !== '–').slice(0, 2),
      psicologia: tx(r?.agenda?.psicologia, 200),
    },
  };
}

const AVISO = 'Conteúdo informativo e educacional, sem recomendação de compra ou venda de ativos. Rentabilidade passada não garante resultado futuro. Operações em mercado futuro envolvem risco elevado; decida com base no seu próprio plano e perfil de risco.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return out({ erro: 'Use POST.' }, 405);
  const cron = Deno.env.get('CRON_SECRET') || '';
  const porCron = !!cron && req.headers.get('x-cron-secret') === cron;
  const uid = porCron ? 'cron' : await usuario(req);
  if (!uid) return out({ erro: 'Entre na sua conta de novo (Mais → Conta).' }, 401);
  let b: any = {};
  try { b = await req.json(); } catch { /* vazio */ }
  const ate = Date.now() + 140_000;
  let ultimaSalva: any = null;
  try {
    const ed = await edicao(typeof b.chave === 'string' ? b.chave : undefined);
    if (!ed) return out({ erro: 'O Jornal de hoje ainda não foi gerado.' }, 404);
    const chave = 'mesa:' + ed.chave;
    const c = await cacheGet(chave);
    ultimaSalva = edicaoSalva(c?.dados);
    const recente = c?.criado && Date.now() - Date.parse(c.criado) < 10 * 60_000;
    if (c?.dados?.capa && c.dados.versao === VERSAO && (!b.force || recente)) return out({ ...c.dados, cache: true });

    const d = ed.dados || {};
    const tipoEd = String(ed.chave.split(':')[2] || d.edicao || '');
    const abertura = /manha|fds/.test(tipoEd);
    const titulo = abertura ? 'Antes da Abertura' : 'Fechamento do Pregão';
    const cot = (Array.isArray(d.cotacoes) ? d.cotacoes : []).map((x: any) => ({ k: String(x.k || ''), n: String(x.n || ''), px: num(x.px), d1: num(x.d1) }));

    // pivôs: de manhã a sessão do TradingView ainda é a do último pregão; no fechamento, a de hoje (vale para amanhã). No meio do pregão, a sessão está incompleta → "–".
    const [ses, mov] = await Promise.all([tipoEd === 'meio' ? Promise.resolve({}) : sessao(), topIbov()]);
    const niveis: Record<string, any> = {};
    for (const [k, passo] of [['win', 5], ['wdo', 0.5]] as const) {
      const x = (ses as any)[k];
      niveis[k] = x ? Object.fromEntries(Object.entries(pivos(x.H, x.L, x.C)).map(([n, v]) => [n, arred(v, passo)])) : null;
      if (niveis[k]) niveis[k].base = { max: x.H, min: x.L, fec: x.C };
    }
    const fN = (v: number, c = 0) => v.toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c });
    const linhasCot = cot.filter((x: any) => x.px != null).map((x: any) => `${x.n}: ${fN(x.px, x.k === 'dolar' ? 4 : x.k.startsWith('di') ? 3 : x.k === 'wdo' ? 1 : x.k === 'win' || x.k === 'ibov' ? 0 : 2)}${x.d1 != null ? ` (${x.d1 >= 0 ? '+' : ''}${fN(x.d1, x.k.startsWith('di') ? 3 : 2)}${x.k.startsWith('di') ? ' p.p.' : '%'})` : ''}`);
    const linhaNiv = (k: string) => niveis[k] ? `R2 ${fN(niveis[k].R2, k === 'wdo' ? 1 : 0)} · R1 ${fN(niveis[k].R1, k === 'wdo' ? 1 : 0)} · Pivô ${fN(niveis[k].P, k === 'wdo' ? 1 : 0)} · S1 ${fN(niveis[k].S1, k === 'wdo' ? 1 : 0)} · S2 ${fN(niveis[k].S2, k === 'wdo' ? 1 : 0)}` : '–';
    const fonte = JSON.stringify({
      manchete: d.manchete, em_poucas_linhas: d.em_poucas_linhas, analise: d.analise, fechamento_texto: d.fechamento_texto, mesa: d.mesa,
      cinco_coisas: d.cinco_coisas, materias: d.materias, agenda: d.agenda, manchetes_externas: d.manchetes_externas, grafico_do_dia: d.grafico_do_dia, bal_cobertos: d.bal_cobertos,
    }).slice(0, 60_000);
    const pedido = `Edição: "${titulo}" de ${String(ed.dia).split('-').reverse().join('/')}.
Cotações (números oficiais desta edição, use estes):
- ${linhasCot.join('\n- ') || '–'}
Níveis calculados (pivô clássico da sessão de referência): WIN ${linhaNiv('win')} | WDO ${linhaNiv('wdo')}
Maiores altas do Ibovespa: ${mov.altas.map((x) => `${x.tk} ${x.var >= 0 ? '+' : ''}${fN(x.var, 2)}%`).join(', ') || '–'}
Maiores baixas do Ibovespa: ${mov.baixas.map((x) => `${x.tk} ${fN(x.var, 2)}%`).join(', ') || '–'}

Material da redação (única fonte de fatos; não acrescente nada que não esteja aqui):
${fonte}

Escreva o Jornal do Pregão no JSON pedido. Use os níveis calculados nos gatilhos do plano quando existirem; sem eles, descreva os gatilhos sem número. No placar, inclua só as empresas com balanço no material.`;
    const r = normal(await gemini(pedido, ate));
    const dados = {
      versao: VERSAO, chave: ed.chave, dia: ed.dia, edicao: tipoEd, titulo, gerado: new Date().toISOString(),
      cotacoes: cot, niveis, movers: mov, ...r, aviso: AVISO,
    };
    await cachePut(chave, ed.dia, dados);
    return out(dados);
  } catch (e) {
    console.error('mesa', e);
    if (!ultimaSalva) {
      try {
        const resposta = await fetch(`${SB}/rest/v1/analise_cache?select=dados&chave=like.mesa%3Ajornal%3A*&order=criado.desc&limit=1`, {headers:svc(),signal:AbortSignal.timeout(4000)});
        if (resposta.ok) ultimaSalva = edicaoSalva((await resposta.json())?.[0]?.dados);
      } catch { /* mantém o erro original se não há edição guardada */ }
    }
    if (ultimaSalva) return out(ultimaSalva);
    return out({ erro: 'Não foi possível montar o Jornal do Pregão agora. ' + String((e as Error)?.message || '').slice(0, 160) }, 502);
  }
});
