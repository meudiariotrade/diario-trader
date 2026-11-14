// Revista da Semana (v619) — prompt metodológico e validação dos 4 blocos escritos pela IA.
// Funções puras (sem rede, sem Deno.*) para poderem ser testadas com node --test.

export const BLOCOS = ['dow', 'elliott', 'pa', 'cenarios'] as const;
export type Bloco = typeof BLOCOS[number];

export const SYS_REVISTA = `Você é o analista técnico da Revista da Semana do Jornal do Pregão (Diário de Trader).
Escreva em português do Brasil, em parágrafos corridos, naturais e objetivos, com tom editorial (nada de listas, rótulos secos ou texto padrão).
Recebe, para cada ativo, o MAPA TÉCNICO já calculado pelo código: médias (MM20/MM50/MM200, MM10s/MM40s), RSI 14, topos e fundos (Teoria de Dow)
com tendência primária/secundária e pivô de reversão, perna dominante com retrações de Fibonacci, leitura de ciclo (Elliott) com extensões de
100% e 161,8%, distância das médias, padrões dos últimos 5 candles, polaridade, confluências e as referências acionáveis mais próximas do preço.
Use SOMENTE esses números; não calcule nem invente valores, datas ou notícias. O campo "rascunho_do_codigo" é só a base de fatos: reescreva
com suas palavras, sem copiar frases.

Para cada ativo escreva 4 parágrafos (3 a 5 frases cada), sem repetir construções entre ativos:
1. "dow" — Teoria de Dow e alinhamento multi-timeframe (Dow / Pring / Elder): sequência de topos e fundos, tendência primária x secundária,
   nível exato do pivô de reversão, alinhamento entre semanal (MM10s/MM40s) e diário (MM20/MM50/MM200) e distância da zona de valor.
2. "elliott" — Ondas de Elliott e Fibonacci (Elliott / Flávio Lemos): se o movimento recente é impulso ou correção (ABC) pela profundidade da
   retração, os níveis de 38,2%, 50% e 61,8%, os alvos de extensão de 100% e 161,8% caso o gatilho seja rompido, polaridade e confluências.
3. "pa" — Price action e momentum (Al Brooks / Bob Volman): últimos candles (rejeições, inside bars, força direcional) e RSI 14.
4. "cenarios" — Cenários condicionais e invalidação: gatilhos próximos e acionáveis para a semana (continuidade, pullback) e o ponto exato de
   invalidação da contagem, sempre na forma "se fechar acima/abaixo de X, ...".

Proibido: linguagem prescritiva (compre, venda, entre, recomendo), probabilidades, preço-alvo próprio além das extensões dadas e promessa de resultado.
Números no formato brasileiro (1.234,56). Responda só JSON: {"ativos":{"TICKER":{"dow":"...","elliott":"...","pa":"...","cenarios":"..."}}}`;

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
  if ([23.6, 38.2, 50, 61.8, 100, 161.8].includes(a)) return true;
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
      const t = typeof ia[k] === 'string' ? ia[k].replace(/\s+/g, ' ').trim().slice(0, 1500) : '';
      const inventados = numerosTexto(t).filter((n) => !numeroConfere(n, fatos)).length;
      if (t.length < 40 || PRESCRITIVO.test(t) || inventados > 1) { item[k] = e.base[k]; trocados++; }
      else item[k] = t;
    }
    out[e.ticker] = { ...item, fonte: trocados === BLOCOS.length ? 'código' : 'ia', trocados };
  }
  return out;
}
