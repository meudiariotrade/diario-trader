// Revista da Semana (v618) — prompt metodológico e validação dos 4 blocos escritos pela IA.
// Funções puras (sem rede, sem Deno.*) para poderem ser testadas com node --test.

export const BLOCOS = ['mtf', 'pa', 'fibo', 'cenarios'] as const;
export type Bloco = typeof BLOCOS[number];

export const SYS_REVISTA = `Você é o analista técnico da Revista da Semana do Jornal do Pregão (Diário de Trader).
Escreva em português do Brasil, com frases curtas, tom editorial e técnico.
Recebe, para cada ativo, métricas JÁ CALCULADAS pelo código (médias, RSI 14, Fibonacci da perna dominante, distância das médias,
padrões dos últimos 5 candles, polaridade e confluências). Use SOMENTE esses números; não calcule nem invente valores, datas ou notícias.

Para cada ativo escreva 4 blocos (2 a 4 frases cada), sem repetir frases entre ativos e sem texto padrão:
1. "mtf" — Visão multi-timeframe e médias (Martin Pring / Alexander Elder): cruze a estrutura semanal (MM10s/MM40s) com a diária
   (MM20/MM50/MM200) e diga se o preço está na zona de valor ou esticado longe das médias (use os percentuais de distância).
2. "pa" — Price action e momentum (Al Brooks / Bob Volman): leia os últimos candles (inside bars, pavios de rejeição, sequência de topos
   e fundos, força de compradores ou vendedores) junto com o RSI 14 (sobrecompra, sobrevenda ou perda de momentum).
3. "fibo" — Mapa de Fibonacci, polaridade e confluências (Flávio Lemos): cite os níveis de 38,2%, 50% e 61,8% e destaque as zonas onde
   Fibonacci, médias e antiga resistência/suporte (polaridade) se encontram como região de pullback.
4. "cenarios" — Cenários condicionais e invalidação: gatilhos próximos para a semana (continuidade, pullback e invalidação objetiva),
   sempre na forma "se fechar acima/abaixo de X, ...".

Proibido: linguagem prescritiva (compre, venda, entre, recomendo), probabilidades, preço-alvo próprio e promessa de resultado.
Números no formato brasileiro (1.234,56). Responda só JSON: {"ativos":{"TICKER":{"mtf":"...","pa":"...","fibo":"...","cenarios":"..."}}}`;

const PRESCRITIVO = /\b(compre|comprar agora|venda já|vender agora|recomendo|recomendamos|entre comprado|entre vendido|zere|garantid[oa])\b/i;

/** Todos os números de um objeto de fatos, para conferir o que a IA escreveu. */
export function numerosDe(o: unknown, acc: number[] = []): number[] {
  if (typeof o === 'number' && isFinite(o)) acc.push(o);
  else if (Array.isArray(o)) o.forEach((x) => numerosDe(x, acc));
  else if (o && typeof o === 'object') Object.values(o as Record<string, unknown>).forEach((x) => numerosDe(x, acc));
  else if (typeof o === 'string') for (const n of numerosTexto(o)) acc.push(n);
  return acc;
}

/** Números escritos em pt-BR ("1.234,56", "38,2", "+0,61%") dentro de um texto. */
export function numerosTexto(t: string): number[] {
  return (String(t).match(/[-+]?\d{1,3}(?:\.\d{3})+(?:,\d+)?|[-+]?\d+(?:,\d+)?/g) || [])
    .map((x) => Number(x.replace(/\./g, '').replace(',', '.')))
    .filter((x) => isFinite(x));
}

/** Um número do texto é aceito se bate (com arredondamento) com algum número dos fatos, ou é pequeno/estrutural (5 candles, 14, 20...). */
export function numeroConfere(n: number, fatos: number[]): boolean {
  const a = Math.abs(n);
  if (a <= 200 && Number.isInteger(n) && [1, 2, 3, 4, 5, 10, 14, 20, 30, 40, 50, 70, 80, 100, 200].includes(a)) return true;
  if ([38.2, 50, 61.8].includes(a)) return true;
  return fatos.some((f) => {
    const b = Math.abs(f);
    if (b === 0) return a === 0;
    return Math.abs(a - b) <= Math.max(0.051, b * 0.0006);
  });
}

/** Valida e limpa a resposta da IA; bloco suspeito (número inventado, prescritivo, vazio) volta para o texto do código. */
export function normaliza(r: any, entrada: { ticker: string; fatos: any; base: Record<Bloco, string> }[]) {
  const out: Record<string, Record<Bloco, string> & { fonte: string; trocados: number }> = {};
  const A = r && typeof r === 'object' && r.ativos && typeof r.ativos === 'object' ? r.ativos : {};
  for (const e of entrada) {
    const ia = A[e.ticker] || {}, fatos = numerosDe([e.fatos, e.base]);
    let trocados = 0;
    const item: any = {};
    for (const k of BLOCOS) {
      const t = typeof ia[k] === 'string' ? ia[k].replace(/\s+/g, ' ').trim().slice(0, 1100) : '';
      const inventados = numerosTexto(t).filter((n) => !numeroConfere(n, fatos)).length;
      if (t.length < 40 || PRESCRITIVO.test(t) || inventados > 1) { item[k] = e.base[k]; trocados++; }
      else item[k] = t;
    }
    out[e.ticker] = { ...item, fonte: trocados === BLOCOS.length ? 'código' : 'ia', trocados };
  }
  return out;
}
