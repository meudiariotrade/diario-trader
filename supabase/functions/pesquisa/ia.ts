// v621: cascata de IA da aba Análises — os mesmos modelos e chaves da Revista e do Jornal (GEMINI_MODEL_GIRO / GEMINI_MODEL),
// sem busca na web (que estourava a cota). Cada modelo tem 1 nova tentativa curta em 429; depois OpenRouter.
// Se nada responder, o erro traz a mensagem técnica real de cada provedor.
type Env = (key: string) => string | undefined;

const limpa = (t: string) => String(t || '').replace(/\s+/g, ' ').replace(/(?:sk-|AIza)[\w-]+/g, '[removido]').slice(0, 220);
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
let ULTIMO_OK = '';

async function modelosGemini(env: Env, key: string, fetcher: typeof fetch) {
  const fixos = [env('GEMINI_MODEL_PESQUISA'), env('GEMINI_MODEL_GIRO'), env('GEMINI_MODEL'), ...String(env('GEMINI_MODEL_RESERVA') || '').split(',')].map((x) => String(x || '').trim()).filter((x) => /^[a-zA-Z0-9.\-_]+$/.test(x));
  let lista: string[] = [];
  try {
    const r = await fetcher('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(5000) });
    if (r.ok) lista = ((await r.json()).models || []).filter((x: any) => (x.supportedGenerationMethods || []).includes('generateContent')).map((x: any) => String(x.name || '').replace(/^models\//, '')).filter((x: string) => /^gemini-[\d.]+-(flash|flash-lite|pro)$/.test(x));
    else await r.body?.cancel();
  } catch { /* lista é opcional */ }
  lista.sort((a, b) => parseFloat(b.slice(7)) - parseFloat(a.slice(7)) || Number(a.includes('lite')) - Number(b.includes('lite')));
  // o último modelo que respondeu vai primeiro; depois os estáveis da Revista/Jornal e a lista da conta
  return [...new Set([...(ULTIMO_OK ? [ULTIMO_OK] : []), ...fixos, 'gemini-3.6-flash', 'gemini-3.5-flash-lite', ...lista])].slice(0, 6);
}

export async function gerarIA(system: string, prompt: string, env: Env, opt: { json?: boolean; ate?: number; fetcher?: typeof fetch } = {}) {
  const fetcher = opt.fetcher || fetch, ate = opt.ate || Date.now() + 50_000, erros: string[] = [];
  const key = env('GEMINI_API_KEY');
  if (key) {
    const modelos = await modelosGemini(env, key, fetcher);
    for (const [mi, modelo] of modelos.entries()) {
      let pensar: any = /gemini-3/i.test(modelo) ? { thinkingConfig: { thinkingLevel: 'low' } } : {};
      for (let tentativa = 0; tentativa < 2; tentativa++) {
        const resta = ate - Date.now();
        if (resta < 7000) break;
        try {
          const r = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(Math.min(resta - 2000, mi === 0 && tentativa === 0 ? 32_000 : 20_000)),
            body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 8192, ...pensar, ...(opt.json ? { responseMimeType: 'application/json' } : {}) } }),
          });
          if (r.ok) {
            const j = await r.json(), c = j.candidates?.[0], texto = (c?.content?.parts || []).filter((p: any) => !p.thought).map((p: any) => p.text || '').join('');
            if (texto && c?.finishReason !== 'MAX_TOKENS') { ULTIMO_OK = modelo; return { texto, modelo }; }
            erros.push(`${modelo}: resposta ${c?.finishReason || 'vazia'}`);
            break;
          }
          let msg = '';
          try { const j = await r.json(); msg = j?.error?.message || ''; } catch { /* corpo não JSON */ }
          if (r.status === 400 && pensar.thinkingConfig && /thinking/i.test(msg) && tentativa === 0) { pensar = {}; continue; } // modelo sem ajuste de raciocínio
          erros.push(`${modelo}: HTTP ${r.status}${msg ? ' — ' + limpa(msg) : ''}`);
          if (r.status === 429 && tentativa === 0) { await espera(1500); continue; } // 429: uma nova tentativa curta antes do próximo modelo
          break; // cota diária/faturamento, modelo inexistente ou erro: próximo modelo
        } catch (e) { erros.push(`${modelo}: ${/timeout|abort/i.test(String(e)) ? 'tempo esgotado' : limpa((e as Error).message)}`); break; }
      }
    }
  } else erros.push('GEMINI_API_KEY não configurada');
  const orKey = env('OPENROUTER_API_KEY');
  if (orKey && ate - Date.now() > 8000) {
    const m = String(env('OPENROUTER_MODELS') || 'openrouter/auto').split(',')[0].trim();
    try {
      const r = await fetcher('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + orKey }, signal: AbortSignal.timeout(Math.min(ate - Date.now() - 1000, 30_000)),
        body: JSON.stringify({ model: m, temperature: 0.4, ...(opt.json ? { response_format: { type: 'json_object' } } : {}), messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }) });
      if (r.ok) { const j = await r.json(), texto = String(j?.choices?.[0]?.message?.content || ''); if (texto) return { texto, modelo: 'openrouter:' + m }; erros.push('OpenRouter: resposta vazia'); }
      else { let msg = ''; try { msg = (await r.json())?.error?.message || ''; } catch { /* sem corpo */ } erros.push(`OpenRouter: HTTP ${r.status}${msg ? ' — ' + limpa(msg) : ''}`); }
    } catch (e) { erros.push('OpenRouter: ' + limpa((e as Error).message)); }
  }
  // agrupa mensagens iguais: "gemini-a, gemini-b: HTTP 429 — ..." (mostra a mensagem real uma vez só)
  const grupos = new Map<string, string[]>();
  for (const e of erros) { const i = e.indexOf(': '), m = i > 0 ? e.slice(0, i) : '', msg = i > 0 ? e.slice(i + 2) : e; grupos.set(msg, [...new Set([...(grupos.get(msg) || []), m])]); }
  throw Object.assign(new Error('Nenhum modelo de IA respondeu. ' + [...grupos].map(([msg, ms]) => (ms.filter(Boolean).join(', ') || 'IA') + ': ' + msg).join(' | ')), { erros });
}

export const jsonDe = (t: string) => { const x = String(t).replace(/```json|```/g, ''); return JSON.parse(x.slice(x.indexOf('{'), x.lastIndexOf('}') + 1)); };

/** Banco de reserva do modo Estudar (usado só quando nenhuma IA responde). */
export const QUESTOES = [
  { modulo: 'CT1', tema: 'Teoria de Dow', enunciado: 'Segundo a Teoria de Dow, uma tendência primária de alta permanece válida enquanto:', alternativas: ['O volume cair em todos os pregões', 'Os topos e fundos continuarem ascendentes', 'O preço ficar acima da MM9', 'O RSI permanecer acima de 70', 'Não houver correção secundária'], correta: 1, explicacao: 'Dow define a alta por topos e fundos ascendentes; correções secundárias fazem parte da tendência, e a reversão só se confirma quando a sequência é rompida.', calculo: '' },
  { modulo: 'CT1', tema: 'Fibonacci', enunciado: 'Em uma perna de alta de 100 para 150, a retração de 61,8% fica em:', alternativas: ['130,90', '119,10', '125,00', '138,20', '111,80'], correta: 1, explicacao: 'Retração = topo − amplitude × 0,618 = 150 − 50 × 0,618 = 119,10.', calculo: '150 − (150 − 100) × 0,618 = 119,10' },
  { modulo: 'CT1', tema: 'Ondas de Elliott', enunciado: 'Na contagem impulsiva de Elliott, qual regra não pode ser violada?', alternativas: ['A onda 3 é sempre a mais curta', 'A onda 2 retrai mais de 100% da onda 1', 'A onda 4 não entra no território da onda 1', 'A onda 5 é sempre estendida', 'As correções são sempre em ABC de 3 ondas iguais'], correta: 2, explicacao: 'Regras: a onda 2 não retrai mais de 100% da onda 1, a onda 3 não é a mais curta e a onda 4 não invade o território da onda 1 (em mercados à vista).', calculo: '' },
  { modulo: 'CT1', tema: 'Momento (Pring)', enunciado: 'Uma divergência baixista no RSI ocorre quando:', alternativas: ['Preço e RSI fazem novos topos', 'O preço faz topo mais alto e o RSI faz topo mais baixo', 'O RSI cruza 50 para cima', 'O preço cai e o RSI cai', 'O volume sobe com o preço'], correta: 1, explicacao: 'Divergência baixista: o preço sobe a um novo topo sem confirmação do oscilador, sinal de perda de momento.', calculo: '' },
  { modulo: 'CG1', tema: 'Opções', enunciado: 'Um investidor com ações vende uma call coberta. O principal risco assumido é:', alternativas: ['Perda ilimitada na alta', 'Limitar o ganho acima do strike, mantendo o risco de queda da ação', 'Perder apenas o prêmio', 'Ser obrigado a comprar ações', 'Pagar ajuste diário'], correta: 1, explicacao: 'Na venda coberta o prêmio reduz o custo, mas o ganho fica limitado ao strike e o risco de queda da ação permanece.', calculo: '' },
  { modulo: 'CG1', tema: 'Valuation', enunciado: 'Pelo modelo de Graham, com LPA de 4 e VPA de 25, o preço justo é:', alternativas: ['R$ 47,43', 'R$ 100,00', 'R$ 22,50', 'R$ 15,00', 'R$ 60,00'], correta: 0, explicacao: 'Preço justo de Graham = √(22,5 × LPA × VPA) = √(22,5 × 4 × 25) = √2.250 ≈ 47,43.', calculo: '√(22,5 × 4 × 25) = 47,43' },
  { modulo: 'CB', tema: 'Price action', enunciado: 'Um candle com pavio superior longo após uma alta, segundo a leitura de price action, indica:', alternativas: ['Força compradora crescente', 'Rejeição vendedora na máxima', 'Gap de continuação', 'Rompimento confirmado', 'Volume obrigatoriamente alto'], correta: 1, explicacao: 'Pavio superior longo mostra que o preço testou a máxima e foi rejeitado; em Brooks/Volman é sinal de possível armadilha de compra.', calculo: '' },
];
export const GLOSSARIO: Record<string, string> = {
  WACC: 'Custo médio ponderado de capital: WACC = E/(D+E) × Ke + D/(D+E) × Kd × (1 − IR). É a taxa usada para descontar o fluxo de caixa livre da firma no DCF. Exemplo hipotético: 60% capital próprio a 15% e 40% dívida a 12% com IR de 34% → 0,6 × 15% + 0,4 × 12% × 0,66 = 12,17%.',
  DCF: 'Fluxo de caixa descontado: valor da empresa = soma dos fluxos de caixa livres projetados trazidos a valor presente pelo WACC + valor terminal (FCLn × (1+g) ÷ (WACC − g)). Preço justo = (valor da empresa − dívida líquida) ÷ ações.',
  GRAHAM: 'Preço justo de Graham = √(22,5 × LPA × VPA). O 22,5 vem de P/L máximo de 15 × P/VP máximo de 1,5. Serve para empresas lucrativas e com patrimônio positivo.',
  BAZIN: 'Preço-teto de Bazin = proventos pagos nos últimos 12 meses ÷ 6%. Busca empresas que pagam pelo menos 6% de dividend yield.',
  FIBONACCI: 'Retrações de Fibonacci (38,2%, 50% e 61,8%) medem quanto um movimento corrige a perna anterior. Extensões (100% e 161,8%) projetam alvos se o topo/fundo for rompido.',
  ELLIOTT: 'Ondas de Elliott: o mercado avança em 5 ondas (1-2-3-4-5) e corrige em 3 (A-B-C). Regras: onda 2 não retrai mais de 100% da onda 1, a 3 não é a mais curta e a 4 não invade a 1.',
  DOW: 'Teoria de Dow: tendência de alta = topos e fundos ascendentes; de baixa = descendentes. Tendências primária, secundária e menor; a reversão se confirma quando a sequência é quebrada (pivô de reversão).',
  RSI: 'RSI (IFR) de 14 períodos, suavização de Wilder: RSI = 100 − 100/(1 + média de altas ÷ média de baixas). Acima de 70 sobrecompra, abaixo de 30 sobrevenda; divergências indicam perda de momento (Pring).',
};
