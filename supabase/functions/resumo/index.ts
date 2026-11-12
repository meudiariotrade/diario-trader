// Função RESUMO — arquivo único para colar no editor do Supabase (Edge Functions → resumo → index.ts)

// ===== resumo =====
// supabase/functions/resumo/resumo.ts
// Regras puras do serviço de resumos de livros (sem rede e sem Deno.*): validação da entrada, prompt,
// normalização da resposta da IA e política da fila. Testado em resumo.test.ts.

export type Entrada = { bookId: string; titulo: string; autor: string; foco: string };
export type Job = { status: string; tentativas?: number; criado?: string; atualizado?: string; trava?: string | null };

const limpa = (v: unknown, max: number) =>
  String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export function limpaEntrada(b: any): Entrada {
  const titulo = limpa(b?.titulo, 150), autor = limpa(b?.autor, 100), foco = limpa(b?.foco, 300);
  const bookId = String(b?.book_id ?? '').trim();
  if (titulo.length < 2) throw new Error('Informe o título do livro.');
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(bookId)) throw new Error('Identificador do livro inválido.');
  return { bookId, titulo, autor, foco };
}

export const SYS_RESUMO = `Você é um editor de resumos de livros de finanças, investimentos, psicologia do trading e gestão de risco. Tom claro, didático e fiel ao livro. Responda SOMENTE com um objeto JSON válido, em português do Brasil, sem texto fora do JSON.
REGRAS DE FIDELIDADE:
- Use o seu conhecimento do livro e, se houver busca na web, fontes verificáveis (editora, resenhas sérias, sumários oficiais). Não invente capítulos, citações, páginas, números, estudos ou exemplos.
- Se você não conhecer o livro com segurança, diga isso em "nota_confianca", use "confianca": "baixa", resuma só o que for seguro e deixe "estrutura" vazia.
- Parafraseie. Não reproduza trechos longos do texto original (direitos autorais): no máximo uma frase curta entre aspas, e só se tiver certeza dela.
- Se o livro for em inglês, escreva em português e mantenha o termo original entre parênteses nos conceitos.
- O leitor é um trader (day trade e swing trade) estudando para melhorar processo, disciplina e gestão de risco: em "aplicacao_no_trading" traga ações concretas, sem prometer resultado.
Formato:
{"resumo":{
 "titulo":"","autor":"","ano_publicacao":"ano ou sem dado","tema":"uma linha",
 "confianca":"alta|média|baixa","nota_confianca":"por que essa confiança",
 "tese_central":"a ideia principal do livro em 2 a 3 frases",
 "resumo_executivo":["3 a 5 parágrafos"],
 "ideias_principais":[{"titulo":"","explicacao":""}],
 "estrutura":[{"parte":"capítulo ou seção","resumo":""}],
 "conceitos_chave":[{"termo":"","definicao":""}],
 "aplicacao_no_trading":[{"ideia":"","como_aplicar":""}],
 "criticas_e_limites":[""],
 "para_quem_e":"",
 "perguntas_de_revisao":[""],
 "fontes_consultadas":[""]}}
Quantidades: 6 a 10 ideias_principais, 5 a 10 conceitos_chave, 4 a 8 aplicacao_no_trading, 5 a 8 perguntas_de_revisao. "estrutura" só se você conhecer a divisão do livro com segurança.`;

export function montaPedido(e: Entrada): string {
  return `Livro: ${e.titulo}\nAutor: ${e.autor || 'não informado'}\nFoco do leitor: ${e.foco || 'visão geral completa'}`;
}

// ---------- normalização da resposta ----------
const txt = (v: unknown, max = 2500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const lista = (v: unknown, max: number) => (Array.isArray(v) ? v.slice(0, max) : []);
const pares = (v: unknown, k1: string, k2: string, max: number) =>
  lista(v, max).map((x: any) => ({ [k1]: txt(x?.[k1], 200), [k2]: txt(x?.[k2], 1500) })).filter((x: any) => x[k1] || x[k2]);

export function normalizaResumo(raw: any) {
  const r = raw && typeof raw === 'object' ? (raw.resumo && typeof raw.resumo === 'object' ? raw.resumo : raw) : {};
  const conf = txt(r.confianca, 10).toLowerCase();
  const out = {
    titulo: txt(r.titulo, 200), autor: txt(r.autor, 150), ano_publicacao: txt(r.ano_publicacao, 40) || 'sem dado', tema: txt(r.tema, 300),
    confianca: conf === 'alta' || conf === 'média' || conf === 'media' ? (conf === 'media' ? 'média' : conf) : 'baixa',
    nota_confianca: txt(r.nota_confianca, 600),
    tese_central: txt(r.tese_central, 1200),
    resumo_executivo: lista(r.resumo_executivo, 6).map((x) => txt(x, 2500)).filter(Boolean),
    ideias_principais: pares(r.ideias_principais, 'titulo', 'explicacao', 12),
    estrutura: pares(r.estrutura, 'parte', 'resumo', 40),
    conceitos_chave: pares(r.conceitos_chave, 'termo', 'definicao', 12),
    aplicacao_no_trading: pares(r.aplicacao_no_trading, 'ideia', 'como_aplicar', 10),
    criticas_e_limites: lista(r.criticas_e_limites, 8).map((x) => txt(x, 800)).filter(Boolean),
    para_quem_e: txt(r.para_quem_e, 600),
    perguntas_de_revisao: lista(r.perguntas_de_revisao, 10).map((x) => txt(x, 400)).filter(Boolean),
    fontes_consultadas: lista(r.fontes_consultadas, 8).map((x) => txt(x, 300)).filter(Boolean),
  };
  return out;
}

/** Um resumo só vale se tiver conteúdo mínimo (evita gravar "concluído" com resposta vazia ou texto bruto). */
export const resumoValido = (r: ReturnType<typeof normalizaResumo>) =>
  (r.resumo_executivo.length >= 1 || r.tese_central.length > 40) && r.ideias_principais.length >= 2;

// ---------- PDF enviado pelo usuário ----------
export const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50 MB

export const SYS_RESUMO_PDF = SYS_RESUMO + `
ESTE PEDIDO TEM O LIVRO ANEXADO EM PDF:
- Baseie o resumo exclusivamente no arquivo anexado. Não use conhecimento externo para preencher lacunas.
- Use a estrutura real de capítulos e seções do arquivo e, quando der, indique as páginas (ex.: "Cap. 3, p. 45-62").
- Se o PDF for imagem sem texto legível, estiver incompleto ou parecer ser de outro livro, diga isso em "nota_confianca" e use "confianca": "baixa".
- Em "fontes_consultadas" coloque apenas "arquivo PDF enviado".`;

/** Confere o caminho do arquivo no armazenamento (só dentro da pasta do próprio usuário) e o tamanho. Devolve o caminho limpo. */
export function validaArquivo(path: unknown, uid: string, bookId: string, bytes: number | null): string {
  const p = String(path ?? '');
  if (!/^[0-9a-f-]{36}\/[A-Za-z0-9_-]{1,64}-\d{10,14}\.pdf$/i.test(p) || !p.startsWith(uid + '/') || !p.slice(uid.length + 1).startsWith(bookId + '-')) throw new Error('Arquivo inválido.');
  if (bytes == null || !(bytes > 0)) throw new Error('Não encontrei o PDF enviado (ou ele está vazio).');
  if (bytes > MAX_PDF_BYTES) throw new Error('O PDF passa do limite de 50 MB.');
  return p;
}

// ---------- política da fila ----------
export const MAX_TENTATIVAS = 3;
export const MAX_TENTATIVAS_PDF = 2; // PDF custa mais processamento: menos tentativas automáticas
const MIN = 60_000;
/** Depois de uma falha: tenta de novo (volta para a fila) até o limite; depois marca erro. */
export const statusAposFalha = (tentativas: number, max = MAX_TENTATIVAS) => (tentativas < max ? 'na_fila' : 'erro');
/** Trabalho parado: na fila há mais de `filaMin`; ou processando sem ninguém trabalhando nele.
 *  Com a coluna `trava` (resumo em etapas): trava vencida, ou sem trava e parado há mais de `filaMin` (o encadeamento falhou).
 *  Sem a coluna (pedidos antigos): processando há mais de `procMin` (a função caiu no meio). */
export function precisaRetomar(j: Job, agora: number, filaMin = 1, procMin = 5): boolean {
  const t = Date.parse(j.atualizado || j.criado || '');
  if (!isFinite(t)) return false;
  if (j.status === 'na_fila') {
    if (j.trava) { const tv = Date.parse(j.trava); if (isFinite(tv) && agora < tv) return false; } // esperando o Gemini voltar
    return agora - t >= filaMin * MIN;
  }
  if (j.status !== 'processando') return false;
  if (j.trava === undefined) return agora - t >= procMin * MIN;
  if (j.trava) { const tv = Date.parse(j.trava); return isFinite(tv) ? agora >= tv : agora - t >= procMin * MIN; }
  return agora - t >= filaMin * MIN;
}

// =====================================================================================
// RESUMO COMPLETO (capítulo a capítulo, a partir do PDF, com meta mínima de páginas)
// O servidor faz uma etapa por vez (cada chamada ao Gemini tem limite de saída e de tempo):
//   plano (sumário do livro) -> geral (o resumo estruturado de sempre) -> parte 1..N -> fim
// =====================================================================================
export const PALAVRAS_POR_PAGINA = 400;   // página A4, fonte 12, espaçamento 1,5 (é o que a versão para imprimir usa)
export const MAX_PALAVRAS_PARTE = 3500;   // cabe com folga numa chamada do Gemini (~5 mil tokens de saída)
export const MIN_PALAVRAS_PARTE = 1200;
export const FOLGA_META = 1.15;           // pede 15% a mais para não ficar abaixo da meta
export const MAX_CONTINUACOES = 2;        // se uma parte vier curta, pede para continuar até 2 vezes
export const MAX_PARTES = 40;
export const PAGINAS_OPCOES = [50, 100, 150, 200];
export const MAX_FALHAS_ETAPA = 4;
/** Falhas passageiras do Gemini (sobrecarga, cota, rede) não contam como erro: o agendador tenta de novo sozinho. */
export const MAX_ESPERAS = 14;               // ≈ 6 horas de espera no total antes de desistir
export type TipoFalha = 'sobrecarga' | 'cota' | 'outra';
export function tipoFalha(msg: string): TipoFalha {
  const m = String(msg || '');
  if (/exceeded your current quota|quota exceeded|PerDay|limite di[aá]rio do gemini/i.test(m)) return 'cota';
  if (/Gemini (429|500|502|503|504)\b|UNAVAILABLE|overloaded|high demand|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|TimeoutError|timed out|aborted|fetch failed|connection (reset|closed)|network/i.test(m)) return 'sobrecarga';
  return 'outra';
}
/** Minutos até a próxima tentativa: sobrecarga cresce 2 → 30 min; cota espera 30 min (a cota por minuto/dia do Gemini volta sozinha). */
export const esperaMin = (n: number, tipo: TipoFalha) => (tipo === 'cota' ? 30 : [2, 4, 8, 15, 20, 30][Math.min(Math.max(n, 1), 6) - 1]);
/** Texto para o app enquanto espera. */
export const avisoEspera = (tipo: TipoFalha, min: number) =>
  (tipo === 'cota' ? 'Cota do Gemini esgotada no momento' : 'O Gemini está sobrecarregado agora') + `: o app tenta de novo sozinho em ${min} min. Não precisa fazer nada.`;

export const limpaModo = (v: unknown) => (v === 'completo' ? 'completo' : 'padrao');
export const limpaPaginas = (v: unknown) => { const n = Math.round(Number(v)); return PAGINAS_OPCOES.includes(n) ? n : 100; };
/** Prompt do usuário: mantém quebras de linha, tira caracteres de controle, até 4000 caracteres. */
export const limpaPrompt = (v: unknown) =>
  String(v ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 4000);

/** Junta as instruções do usuário ao prompt do sistema, sem deixar que elas desliguem as regras de fidelidade. */
export function comPrompt(sys: string, prompt: string): string {
  const p = limpaPrompt(prompt);
  if (!p) return sys;
  return sys + `\n\nINSTRUÇÕES EXTRAS DO LEITOR (siga-as no conteúdo, no foco e no estilo; elas NÃO mudam as regras de fidelidade, de direitos autorais nem o formato de saída pedido acima):\n"""\n${p}\n"""`;
}

export const contaPalavras = (s: unknown) => (String(s ?? '').match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
export const paginasEstimadas = (palavras: number) => Math.round((palavras || 0) / PALAVRAS_POR_PAGINA);
export const metaPalavras = (paginas: number) => Math.ceil(paginas * PALAVRAS_POR_PAGINA * FOLGA_META);

export type Parte = { titulo: string; paginas: string; topicos: string[]; alvo: number; texto?: string; palavras?: number; cont?: number };
export type Longo = { partes: Parte[] | null; total_paginas_livro?: number | null; geral: boolean; falhas: number; esperas?: number; gem?: { name: string; uri: string; ate: number } | null };
export const longoInicial = (): Longo => ({ partes: null, total_paginas_livro: null, geral: false, falhas: 0, esperas: 0, gem: null });

const faixa = (s: string): [number, number] | null => {
  const m = String(s || '').match(/(\d{1,4})\s*(?:-|–|—|a|até)\s*(\d{1,4})/i);
  if (!m) return null;
  const a = +m[1], b = +m[2];
  return b >= a ? [a, b] : null;
};
const tamanho = (p: { paginas: string; topicos: string[] }) => { const f = faixa(p.paginas); return f ? f[1] - f[0] + 1 : 0; };

/** Normaliza o sumário que a IA devolveu, divide capítulos grandes até ter partes suficientes para a meta e distribui as palavras. */
export function ajustaPlano(raw: any, paginasMeta: number): { partes: Parte[]; total_paginas_livro: number | null } {
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.partes) ? raw.partes : Array.isArray(raw?.plano?.partes) ? raw.plano.partes : [];
  type P = { base: string; paginas: string; topicos: string[] };
  let ps: P[] = arr.slice(0, 80).map((x: any) => ({
    base: txt(x?.titulo, 200), paginas: txt(String(x?.paginas ?? ''), 40),
    topicos: (Array.isArray(x?.topicos) ? x.topicos : []).slice(0, 15).map((t: unknown) => txt(t, 200)).filter(Boolean),
  })).filter((p: P) => p.base);
  if (!ps.length) throw new Error('A IA não conseguiu montar o sumário do livro.');
  // muitas partes: junta vizinhas (as duas menores seguidas)
  while (ps.length > MAX_PARTES) {
    let k = 0, best = Infinity;
    for (let i = 0; i < ps.length - 1; i++) { const t = (tamanho(ps[i]) || 1) + (tamanho(ps[i + 1]) || 1); if (t < best) { best = t; k = i; } }
    const a = ps[k], b = ps[k + 1], fa = faixa(a.paginas), fb = faixa(b.paginas);
    ps.splice(k, 2, { base: a.base + ' + ' + b.base, paginas: fa && fb ? `${fa[0]}-${fb[1]}` : a.paginas || b.paginas, topicos: [...a.topicos, ...b.topicos].slice(0, 15) });
  }
  const total = metaPalavras(paginasMeta);
  const minPartes = Math.min(MAX_PARTES, Math.ceil(total / MAX_PALAVRAS_PARTE));
  // poucas partes: divide a maior (por páginas; se não houver páginas, pelos tópicos; senão em duas metades do mesmo capítulo)
  type Q = P & { pedaco?: string };
  let qs: Q[] = ps.map((p) => ({ ...p }));
  const peso = (p: Q) => tamanho(p) || Math.max(1, p.topicos.length) / 100;
  while (qs.length < minPartes) {
    let k = 0;
    qs.forEach((p, i) => { if (peso(p) > peso(qs[k])) k = i; });
    const p = qs[k], f = faixa(p.paginas);
    let a: Q, b: Q;
    if (f && f[1] > f[0]) {
      const m = Math.floor((f[0] + f[1]) / 2);
      const h = Math.ceil(p.topicos.length / 2);
      a = { ...p, paginas: `${f[0]}-${m}`, topicos: p.topicos.slice(0, h) };
      b = { ...p, paginas: `${m + 1}-${f[1]}`, topicos: p.topicos.slice(h) };
    } else if (p.topicos.length >= 2) {
      const h = Math.ceil(p.topicos.length / 2);
      a = { ...p, topicos: p.topicos.slice(0, h) };
      b = { ...p, topicos: p.topicos.slice(h) };
    } else {
      a = { ...p, pedaco: 'primeira metade do capítulo' };
      b = { ...p, pedaco: 'segunda metade do capítulo' };
    }
    qs.splice(k, 1, a, b);
  }
  // numera pedaços do mesmo capítulo: "Cap. 3 (1/2)"
  const out: Parte[] = [];
  for (let i = 0; i < qs.length;) {
    let j = i; while (j + 1 < qs.length && qs[j + 1].base === qs[i].base) j++;
    const n = j - i + 1;
    for (let k = i; k <= j; k++) {
      const q = qs[k];
      out.push({ titulo: n > 1 ? `${q.base} (${k - i + 1}/${n})` : q.base, paginas: q.paginas, topicos: q.pedaco ? [...q.topicos, 'Cubra a ' + q.pedaco] : q.topicos, alvo: 0 });
    }
    i = j + 1;
  }
  // distribui a meta de palavras proporcional às páginas de cada parte (com piso e teto) e reparte a sobra
  const pesos = out.map((p) => tamanho(p) || 0), temPag = pesos.filter(Boolean).length >= out.length / 2;
  const mediaPag = temPag ? pesos.filter(Boolean).reduce((a, b) => a + b, 0) / pesos.filter(Boolean).length : 1;
  const w = out.map((_, i) => (temPag ? pesos[i] || mediaPag : 1));
  const sw = w.reduce((a, b) => a + b, 0);
  out.forEach((p, i) => { p.alvo = Math.min(MAX_PALAVRAS_PARTE, Math.max(MIN_PALAVRAS_PARTE, Math.round(total * w[i] / sw))); });
  for (let it = 0; it < 10; it++) {
    const falta = total - out.reduce((a, p) => a + p.alvo, 0);
    if (falta <= 0) break;
    const livres = out.filter((p) => p.alvo < MAX_PALAVRAS_PARTE);
    if (!livres.length) break;
    const add = Math.ceil(falta / livres.length);
    livres.forEach((p) => { p.alvo = Math.min(MAX_PALAVRAS_PARTE, p.alvo + add); });
  }
  const tp = Number(raw?.total_paginas ?? raw?.total_paginas_livro);
  return { partes: out, total_paginas_livro: isFinite(tp) && tp > 0 ? Math.round(tp) : null };
}

export type Passo = { tipo: 'plano' } | { tipo: 'geral' } | { tipo: 'parte'; i: number; continuar: boolean } | { tipo: 'fim' };
/** Qual a próxima etapa do resumo completo. */
export function proximoPasso(l: Longo): Passo {
  if (!l || !Array.isArray(l.partes) || !l.partes.length) return { tipo: 'plano' };
  if (!l.geral) return { tipo: 'geral' };
  for (let i = 0; i < l.partes.length; i++) {
    const p = l.partes[i];
    if (!p.texto) return { tipo: 'parte', i, continuar: false };
    if ((p.palavras || 0) < p.alvo * 0.85 && (p.cont || 0) < MAX_CONTINUACOES) return { tipo: 'parte', i, continuar: true };
  }
  return { tipo: 'fim' };
}
/** Resumo do andamento para a lista do app (sem os textos). */
export function progressoDe(l: Longo | null, paginasMeta: number) {
  const partes = (l && l.partes) || [];
  const palavras = partes.reduce((a, p) => a + (p.palavras || 0), 0);
  const prontas = partes.filter((p) => p.texto).length;
  const passo = l ? proximoPasso(l) : { tipo: 'plano' as const };
  return {
    etapa: passo.tipo, parte: passo.tipo === 'parte' ? passo.i + 1 : null, partes: partes.length, prontas,
    palavras, paginas: paginasEstimadas(palavras), meta_paginas: paginasMeta, geral: !!(l && l.geral),
  };
}

/** Tira cercas de código e espaços sobrando do markdown devolvido pela IA. */
export function limpaMarkdown(s: unknown): string {
  let t = String(s ?? '').trim();
  t = t.replace(/^```(?:markdown|md)?\s*\n/i, '').replace(/\n```\s*$/i, '');
  return t.replace(/\n{4,}/g, '\n\n\n').trim();
}
/** Junta o texto novo de uma continuação sem repetir o título da parte. */
export function juntaContinuacao(antes: string, novo: string, titulo: string): string {
  let n = limpaMarkdown(novo);
  const h = '## ' + titulo;
  if (n.startsWith(h)) n = n.slice(h.length).trim();
  return (antes.trim() + '\n\n' + n).trim();
}

export const SYS_PLANO = `Você recebe um livro em PDF. Monte o SUMÁRIO REAL dele para um resumo capítulo a capítulo. Responda SOMENTE com JSON válido:
{"total_paginas": número de páginas do PDF,
 "partes":[{"titulo":"Capítulo 1 — Nome do capítulo","paginas":"inicio-fim (páginas do PDF)","topicos":["3 a 8 tópicos/seções reais do capítulo"]}]}
Regras: siga a ordem e os nomes reais dos capítulos (traduza para português, mantendo o original entre parênteses se for em inglês). Inclua introdução, prefácio, apêndices ou glossário só se tiverem conteúdo relevante para estudo. Não invente capítulos. Use as páginas do arquivo PDF (não as do livro impresso) em "paginas". Entre 6 e 40 partes.`;

export function sysParte(p: Parte, i: number, n: number, palavras: number): string {
  return `Você escreve UMA PARTE de um resumo longo e aprofundado de um livro, capítulo a capítulo, a partir do PDF anexado. Escreva em português do Brasil, em Markdown.
REGRAS DE FIDELIDADE:
- Base exclusiva: o PDF anexado. Não invente exemplos, números, estudos, citações nem páginas. Se as páginas desta parte estiverem ilegíveis ou faltando, diga isso em uma linha e resuma o que for possível.
- Parafraseie com suas palavras. No máximo uma frase curta entre aspas por seção (direitos autorais).
- Se o livro for em inglês, mantenha o termo original entre parênteses nos conceitos.
PROFUNDIDADE:
- Explique cada ideia e o raciocínio do autor; reconte com suas palavras os exemplos, casos e histórias que ele usa; traga definições, passo a passo de métodos, regras, fórmulas e números que estão no texto, indicando a página (p. X) sempre que der.
- É um material de estudo para um trader (day trade e swing trade): deixe claro o que é ideia do autor e o que é aplicação prática.
FORMATO:
- Comece com "## ${p.titulo.replace(/"/g, "'")}" e organize em seções "###". Use listas quando ajudarem.
- Termine com "### Pontos-chave" (5 a 10 itens) e "### Como aplicar no trading" (ações concretas, sem prometer resultado).
- Não escreva introdução nem conclusão do livro inteiro e não repita o conteúdo de outras partes.
TAMANHO: escreva NO MÍNIMO ${palavras} palavras nesta parte (parte ${i + 1} de ${n}). Não encerre antes de cobrir todos os tópicos e páginas indicados.`;
}
export function pedidoParte(p: Parte, i: number, todas: Parte[]): string {
  const viz = todas.map((x, k) => `${k + 1}. ${x.titulo}${x.paginas ? ' (p. ' + x.paginas + ')' : ''}`).join('\n');
  return `Escreva agora a PARTE ${i + 1}: ${p.titulo}\nPáginas do PDF: ${p.paginas || 'localize pelo título'}\nTópicos a cobrir: ${p.topicos.join('; ') || 'todos os do capítulo'}\n\nSumário completo do resumo (para não repetir o conteúdo das outras partes):\n${viz}`;
}
export function pedidoContinuacao(p: Parte, falta: number): string {
  const fim = String(p.texto || '').slice(-3000);
  return `Você já escreveu o começo desta parte ("${p.titulo}"). Continue a MESMA parte a partir de onde parou, aprofundando tópicos, exemplos e páginas que ainda não foram cobertos ou foram cobertos de forma rasa. Não repita o que já foi escrito e não repita o título "##". Escreva pelo menos ${falta} palavras a mais e termine com as seções "### Pontos-chave" e "### Como aplicar no trading" se elas ainda não existirem.\n\nFinal do que já foi escrito:\n"""\n${fim}\n"""`;
}

export const SYS_EXTRA = `Você recebe o resumo de um livro (feito antes, a partir do livro) e um pedido do leitor, um trader em formação. Atenda ao pedido usando SOMENTE o conteúdo do resumo; se algo pedido não estiver no resumo, diga isso em vez de inventar. Responda em português do Brasil, em Markdown, de forma organizada e prática.`;

/** Texto corrido de um resumo concluído (para os prompts extras). */
export function textoCompleto(resultado: any, longo: Longo | null, max = 400_000): string {
  const r = resultado || {};
  const L: string[] = [];
  if (r.titulo) L.push('# ' + r.titulo + (r.autor ? ' — ' + r.autor : ''));
  if (r.tese_central) L.push('Tese central: ' + r.tese_central);
  (r.resumo_executivo || []).forEach((x: string) => L.push(x));
  (r.ideias_principais || []).forEach((x: any) => L.push('- ' + x.titulo + ': ' + x.explicacao));
  (r.conceitos_chave || []).forEach((x: any) => L.push('- ' + x.termo + ': ' + x.definicao));
  (r.aplicacao_no_trading || []).forEach((x: any) => L.push('- ' + x.ideia + ': ' + x.como_aplicar));
  ((longo && longo.partes) || []).forEach((p) => { if (p.texto) L.push(p.texto); });
  return L.join('\n\n').slice(0, max);
}

// =====================================================================================
// SIMULADO: perguntas de múltipla escolha a partir do resumo, do mais fácil ao mais difícil
// =====================================================================================
export const NIVEIS = ['fácil', 'média', 'difícil'] as const;
export type Pergunta = { nivel: string; tema: string; pergunta: string; alternativas: string[]; correta: number; explicacao: string };
export const QUIZ_QTDS = [10, 20, 30];
export const limpaQtd = (v: unknown) => { const n = Math.round(Number(v)); return QUIZ_QTDS.includes(n) ? n : 30; };
export const limpaNivelQuiz = (v: unknown) => (v === 'dificil' ? 'dificil' : 'progressivo');

export const SYS_QUIZ = `Você cria perguntas de estudo de múltipla escolha a partir do resumo de um livro, para um trader (day trade e swing trade) em formação.
Use SOMENTE o conteúdo do resumo enviado. Não invente conceitos, números ou exemplos que não estejam nele. Responda SOMENTE com JSON válido, em português do Brasil:
{"perguntas":[{"nivel":"fácil|média|difícil","tema":"capítulo ou assunto","pergunta":"","alternativas":["","","",""],"correta":0,"explicacao":""}]}
REGRAS:
- Exatamente 4 alternativas plausíveis e do mesmo tamanho aproximado; só uma correta; "correta" é o índice (0 a 3) da alternativa certa.
- Proibido "todas as anteriores", "nenhuma das anteriores", pegadinha de palavra ou dupla negação.
- fácil = lembrar um conceito ou definição; média = entender, comparar ou explicar ideias; difícil = aplicar num caso prático de trading (com números quando o livro tiver), relacionar dois conceitos ou identificar o erro numa situação.
- Distribua as perguntas pelos capítulos e assuntos do livro; não repita perguntas nem a mesma ideia.
- "explicacao": 1 a 3 frases dizendo por que a certa está certa e qual o erro comum nas outras.`;

export function pedidoQuiz(n: number, nivel: string, titulo: string, foco: string): string {
  const dist = nivel === 'dificil' ? `todas as ${n} de nível "difícil"` : `${Math.round(n / 3)} "fácil", ${n - 2 * Math.round(n / 3)} "média" e ${Math.round(n / 3)} "difícil", nessa ordem`;
  return `Crie ${n} perguntas sobre o livro "${titulo}": ${dist}.${foco ? ` Foque somente em: ${foco}.` : ''}`;
}

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const nivelDe = (v: unknown) => { const s = semAcento(String(v ?? '')); return s.startsWith('f') ? 'fácil' : s.startsWith('d') ? 'difícil' : 'média'; };
const PROIBIDAS = /(todas|nenhuma) (as|das) (anteriores|alternativas)/;

/** Valida as perguntas, ordena do mais fácil ao mais difícil e gira as alternativas para a certa não cair sempre na mesma letra. */
export function normalizaQuiz(raw: any, n: number): Pergunta[] {
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.perguntas) ? raw.perguntas : [];
  const out: Pergunta[] = [], vistas = new Set<string>();
  for (const q of arr) {
    const pergunta = txt(q?.pergunta, 700);
    const alts = (Array.isArray(q?.alternativas) ? q.alternativas : []).map((a: any) => txt(typeof a === 'string' ? a : a?.texto, 350)).filter(Boolean);
    let c: number = typeof q?.correta === 'string' && /^[A-Da-d]$/.test(q.correta.trim()) ? 'abcd'.indexOf(q.correta.trim().toLowerCase()) : Number(q?.correta);
    if (!pergunta || alts.length !== 4 || !Number.isInteger(c) || c < 0 || c > 3) continue;
    if (new Set(alts.map((a: string) => semAcento(a))).size !== 4) continue;
    if (alts.some((a: string) => PROIBIDAS.test(semAcento(a)))) continue;
    const k = semAcento(pergunta).replace(/\W+/g, ' ').trim();
    if (vistas.has(k)) continue;
    vistas.add(k);
    out.push({ nivel: nivelDe(q?.nivel), tema: txt(q?.tema ?? q?.capitulo, 140), pergunta, alternativas: alts, correta: c, explicacao: txt(q?.explicacao, 1000) });
    if (out.length >= n) break;
  }
  out.sort((a, b) => NIVEIS.indexOf(a.nivel as any) - NIVEIS.indexOf(b.nivel as any)); // estável: mantém a ordem dentro do nível
  out.forEach((q, i) => {
    const alvo = (i * 7 + 2) % 4; // posição desejada da certa (espalha entre A, B, C e D)
    const desloc = (q.correta - alvo + 4) % 4;
    q.alternativas = [...q.alternativas.slice(desloc), ...q.alternativas.slice(0, desloc)];
    q.correta = alvo;
  });
  return out;
}
/** Texto-base do simulado: o resumo inteiro ou só uma parte (capítulo) do resumo completo. */
export function baseQuiz(resultado: any, longo: Longo | null, parte: number): { texto: string; foco: string } {
  const ps = ((longo && longo.partes) || []).filter((p) => p.texto);
  if (parte >= 0 && ps[parte]) return { texto: ps[parte].texto!, foco: ps[parte].titulo };
  return { texto: textoCompleto(resultado, longo, 300_000), foco: '' };
}

// ===== segurança =====
// seguranca.ts — login obrigatório, limite de uso por pessoa e comparação de segredo em tempo constante.
// Copiado em cada função (cada função do Supabase é publicada sozinha). Testes em seguranca.test.ts.
const ENV = (k: string) => ((globalThis as any).Deno?.env?.get(k) as string | undefined) || '';
const CACHE = new Map<string, { uid: string; ate: number }>();

/** Id do usuário logado a partir do token do app (a chave anônima sozinha não passa). Guarda o resultado por 5 min. */
export async function usuarioDe(req: Request): Promise<string | null> {
  const tk = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim(), url = ENV('SUPABASE_URL'), anon = ENV('SUPABASE_ANON_KEY');
  if (!tk || !url || tk.split('.').length !== 3 || tk === anon || tk.length > 4096) return null;
  const c = CACHE.get(tk);
  if (c && c.ate > Date.now()) return c.uid;
  try {
    const r = await fetch(url + '/auth/v1/user', { headers: { apikey: anon || ENV('SUPABASE_SERVICE_ROLE_KEY'), Authorization: 'Bearer ' + tk }, signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j || typeof j.id !== 'string') return null;
    if (CACHE.size > 500) CACHE.clear();
    CACHE.set(tk, { uid: j.id, ate: Date.now() + 5 * 60_000 });
    return j.id;
  } catch { return null; }
}

const USO = new Map<string, number[]>();
/** Janela deslizante: no máximo `max` chamadas em `janelaMs` por chave (usuário). */
export function dentroDoLimite(chave: string, max: number, janelaMs = 60_000, agora = Date.now()): boolean {
  const L = (USO.get(chave) || []).filter((t) => agora - t < janelaMs);
  if (L.length >= max) { USO.set(chave, L); return false; }
  L.push(agora); USO.set(chave, L);
  if (USO.size > 2000) USO.clear();
  return true;
}

/** Compara segredos sem vazar pelo tempo de resposta. Segredo vazio nunca confere. */
export function segredoIgual(recebido: string | null, esperado: string): boolean {
  if (!esperado || typeof recebido !== 'string') return false;
  const a = new TextEncoder().encode(recebido), b = new TextEncoder().encode(esperado);
  let d = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) d |= (a[i % (a.length || 1)] ?? 0) ^ b[i];
  return d === 0 && a.length === b.length;
}

/** Só aceita endereços dos serviços de push oficiais (Apple, Google, Mozilla, Microsoft): a função não vira um "carteiro" para qualquer site. */
export function pushOk(u: unknown): boolean {
  if (typeof u !== 'string' || u.length > 800) return false;
  try {
    const x = new URL(u);
    return x.protocol === 'https:' && !x.port && /(^|\.)(push\.apple\.com|fcm\.googleapis\.com|android\.googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com)$/.test(x.hostname);
  } catch { return false; }
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
// supabase/functions/resumo/index.ts
// Resumos de livros com o Gemini, gerados em SEGUNDO PLANO.
//
// Como funciona (fila):
//   1. O app chama "criar": a função grava o pedido na tabela `resumos` (status "na_fila") e responde na hora.
//   2. O processamento roda em background (EdgeRuntime.waitUntil): na_fila -> processando -> concluido.
//   3. Se falhar, o pedido volta para a fila (até 3 tentativas) e o agendador (ação "tick", a cada minuto) retoma
//      pedidos parados. Depois da 3ª falha o status vira "erro" e o app mostra "Tentar de novo".
//   4. Ao terminar, manda notificação push para o aparelho que fez o pedido e o app mostra "Resumo concluído".
//
// Livro em PDF (opcional): o app envia o arquivo (até 50 MB) para o bucket privado "livros"; a função baixa, manda ao Gemini
// (Files API), gera o resumo e apaga o arquivo do Gemini e do seu armazenamento ao terminar.
//
// Modo "completo" (precisa do PDF): resumo capítulo a capítulo com meta mínima de páginas (50, 100, 150 ou 200).
//   Uma etapa por execução: plano (sumário) -> geral -> parte 1..N -> fim. Ao terminar cada etapa a função chama
//   a si mesma (ação "passo") para seguir; se isso falhar, o agendador ("tick") retoma em até 1 minuto.
//   O PDF fica no Gemini durante o trabalho (reaproveitado em todas as etapas) e é apagado no fim.
// Prompt do usuário: texto livre (até 4000 caracteres) somado às regras; ação "extra" roda um prompt sobre um resumo pronto.
// Ação "quiz": simulado de 10, 20 ou 30 perguntas de múltipla escolha (fácil → difícil) sobre o resumo, guardado em "extras".
//
// Deploy: supabase functions deploy resumo      (a função valida o login do usuário por conta própria)
// Secrets usados: GEMINI_API_KEY (já existe), VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT e CRON_SECRET (já existem das notificações)
// Opcionais: GEMINI_MODEL_RESUMO, GEMINI_MODEL_LONGO (modelo das partes do resumo completo), LIMITE_RESUMOS (padrão 10 por dia), ALLOWED_ORIGINS


const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const MODELO = Deno.env.get('GEMINI_MODEL_RESUMO') || Deno.env.get('GEMINI_MODEL') || 'gemini-3.1-pro-preview';
const MODELO_LONGO = Deno.env.get('GEMINI_MODEL_LONGO') || MODELO;
/** Modelos de reserva quando o principal está sobrecarregado (503) ou sem cota (429). Cada modelo tem a própria cota no plano grátis. */
const RESERVAS = (Deno.env.get('GEMINI_MODEL_RESERVA') || 'gemini-3.6-flash,gemini-3.5-flash-lite').split(',').map((x) => x.trim()).filter(Boolean);
const dorme = (ms: number) => new Promise((r) => setTimeout(r, (globalThis as any).__SEM_ESPERA ? 0 : ms)); // a simulação não espera de verdade
const SB = Deno.env.get('SUPABASE_URL') || '';
const SB_ANON = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SB_SVC = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const CRON = Deno.env.get('CRON_SECRET') || '';
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC') || '';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE') || '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:contato@exemplo.com';
const LIMITE = +(Deno.env.get('LIMITE_RESUMOS') || 10);
const TZ = 'America/Sao_Paulo';

const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origemLimpa).filter(Boolean);
const corsFor = (req: Request) => {
  const h: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  const o = req.headers.get('origin') || '';
  if (!ORIGENS.length) h['Access-Control-Allow-Origin'] = '*';
  else if (ORIGENS.includes(o)) h['Access-Control-Allow-Origin'] = o;
  return h;
};

// ---------- banco (PostgREST com a chave de serviço) ----------
const svc = (x: Record<string, string> = {}) => ({ apikey: SB_SVC, Authorization: 'Bearer ' + SB_SVC, 'Content-Type': 'application/json', ...x });
async function rest(caminho: string, init: RequestInit = {}) {
  const r = await fetch(`${SB}/rest/v1/${caminho}`, { ...init, headers: svc({ Prefer: 'return=representation', ...((init.headers as Record<string, string>) || {}) }) });
  if (!r.ok) throw new Error(`banco ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const t = await r.text();
  return t ? JSON.parse(t) : [];
}
const patch = (caminho: string, corpo: unknown) => rest(caminho, { method: 'PATCH', body: JSON.stringify(corpo) });
const agoraIso = () => new Date().toISOString();

async function usuario(req: Request): Promise<string | null> {
  const tk = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!tk || !SB) return null;
  try {
    const r = await fetch(SB + '/auth/v1/user', { headers: { apikey: SB_ANON || SB_SVC, Authorization: 'Bearer ' + tk } });
    if (!r.ok) return null;
    const j = await r.json();
    return j && j.id ? String(j.id) : null;
  } catch { return null; }
}
const sha = async (s: string) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);

// ---------- Gemini ----------
const GBASE = 'https://generativelanguage.googleapis.com';
const gkey = () => ({ 'x-goog-api-key': GEMINI_KEY });
/** Pensamento curto: as partes longas precisam caber no tempo da função. Se o modelo não aceitar a opção, tenta sem ela. */
const pensamento = (m: string) => (/gemini-3/i.test(m) ? { thinkingConfig: { thinkingLevel: 'low' } } : /gemini-2\.5/i.test(m) ? { thinkingConfig: { thinkingBudget: 1024 } } : {});
type Gera = { json?: boolean; busca?: boolean; max?: number; timeoutMs?: number; modelo?: string; temperatura?: number };
/**
 * Chama o Gemini com insistência: em sobrecarga (500/502/503/504) tenta de novo no mesmo modelo depois de 3 s e 8 s;
 * se continuar, ou se a cota acabou (429), passa para os modelos de reserva. Tempo esgotado não é repetido (a função tem limite).
 */
async function gerar(system: string, parts: unknown[], o: Gera = {}): Promise<string> {
  const principal = o.modelo || MODELO, fila = [principal, ...RESERVAS.filter((m) => m !== principal)];
  const ini = Date.now(), limite = (o.timeoutMs || 100_000) + 30_000;
  let ultimo: unknown = null;
  for (const modelo of fila) {
    for (let t = 0; t < 3; t++) {
      const resta = limite - (Date.now() - ini);
      if (resta < 20_000) throw ultimo || new Error('Gemini 503: sem tempo para tentar de novo');
      try { return await gerarCom(modelo, system, parts, { ...o, timeoutMs: Math.min(o.timeoutMs || 100_000, resta) }); }
      catch (e) {
        ultimo = e;
        const m = String((e as Error).message || e);
        if (/Gemini (500|502|503|504)\b|UNAVAILABLE|overloaded|high demand/i.test(m) && t < 2) { await dorme(t ? 8000 : 3000); continue; }
        if (/Gemini (429|500|502|503|504)\b|UNAVAILABLE|overloaded|high demand|RESOURCE_EXHAUSTED|quota/i.test(m)) break; // próximo modelo
        throw e; // erro de verdade (pedido inválido, tempo esgotado...): não adianta insistir
      }
    }
  }
  throw ultimo || new Error('Gemini indisponível');
}
async function gerarCom(modelo: string, system: string, parts: unknown[], o: Gera = {}): Promise<string> {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY não configurada no Supabase.');
  const chamar = (busca: boolean, pensar: boolean) =>
    fetch(`${GBASE}/v1beta/models/${modelo}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...gkey() }, signal: AbortSignal.timeout(o.timeoutMs || 100_000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: o.temperatura ?? 0.3, maxOutputTokens: o.max || 16000,
          ...(o.json && !busca ? { responseMimeType: 'application/json' } : {}), ...(pensar ? pensamento(modelo) : {}),
        },
        ...(busca ? { tools: [{ google_search: {} }] } : {}),
      }),
    });
  let busca = !!o.busca, pensar = true;
  let r = await chamar(busca, pensar);
  if (!r.ok && r.status === 400) {
    const t = await r.text();
    if (/thinking/i.test(t)) { pensar = false; r = await chamar(busca, pensar); }
    else if (!busca) throw new Error('Gemini 400: ' + t.slice(0, 300));
  }
  if (!r.ok && busca) { busca = false; r = await chamar(busca, pensar); } // plano sem busca na web
  if (!r.ok) throw new Error('Gemini ' + r.status + ': ' + (await r.text()).slice(0, 300));
  const j = await r.json();
  const c = j?.candidates?.[0];
  const txt = (c?.content?.parts || []).filter((p: any) => !p.thought).map((p: any) => p.text || '').join('');
  if (!txt) throw new Error('Gemini não devolveu texto' + (c?.finishReason ? ' (' + c.finishReason + ')' : '') + '.');
  return txt;
}
function parseJson(x: string) {
  const t = x.replace(/```json|```/g, '');
  return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
}
/** JSON com uma tentativa de reparo se vier cortado. */
async function gerarJson(system: string, parts: unknown[], o: Gera = {}) {
  const txt = await gerar(system, parts, { ...o, json: true });
  try { return parseJson(txt); } catch { /* tenta reparar */ }
  const rr = await gerar('Você corrige JSON.', [{ text: 'O JSON abaixo está inválido ou foi cortado. Devolva SOMENTE o JSON corrigido e completo, sem acrescentar dados novos:\n' + txt }], { json: true, max: o.max });
  try { return parseJson(rr); } catch { throw new Error('Resposta da IA em formato inválido.'); }
}

// ---------- PDF: armazenamento e Gemini Files API ----------
const BUCKET = 'livros';
const stH = () => ({ apikey: SB_SVC, Authorization: 'Bearer ' + SB_SVC });
/** Tamanho em bytes do arquivo no bucket (null se não existir). */
async function stTamanho(path: string): Promise<number | null> {
  const r = await fetch(`${SB}/storage/v1/object/authenticated/${BUCKET}/${path}`, { method: 'HEAD', headers: stH() });
  if (!r.ok) return null;
  const n = +(r.headers.get('content-length') || 0);
  return n > 0 ? n : null;
}
async function stBaixa(path: string): Promise<ArrayBuffer> {
  const r = await fetch(`${SB}/storage/v1/object/authenticated/${BUCKET}/${path}`, { headers: stH(), signal: AbortSignal.timeout(40_000) });
  if (!r.ok) throw new Error('Não consegui ler o PDF no armazenamento (' + r.status + ').');
  const buf = await r.arrayBuffer();
  if (buf.byteLength > MAX_PDF_BYTES) throw new Error('O PDF passa do limite de 50 MB.');
  return buf;
}
async function stApaga(path: string | null | undefined) {
  if (!path) return;
  try { await fetch(`${SB}/storage/v1/object/${BUCKET}/${path}`, { method: 'DELETE', headers: stH() }); } catch { /* o agendador limpa depois */ }
}

/** Envia o PDF para a Files API do Gemini e espera ficar pronto. O Gemini apaga sozinho em 48 h. */
async function gemEnvia(pdf: ArrayBuffer): Promise<{ name: string; uri: string; ate: number }> {
  const ini = await fetch(`${GBASE}/upload/v1beta/files`, {
    method: 'POST', signal: AbortSignal.timeout(30_000),
    headers: {
      ...gkey(), 'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(pdf.byteLength), 'X-Goog-Upload-Header-Content-Type': 'application/pdf', 'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: 'livro.pdf' } }),
  });
  const urlEnvio = ini.headers.get('x-goog-upload-url');
  if (!ini.ok || !urlEnvio) throw new Error('Gemini (início do envio) ' + ini.status);
  const up = await fetch(urlEnvio, {
    method: 'POST', signal: AbortSignal.timeout(60_000),
    headers: { 'Content-Length': String(pdf.byteLength), 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' }, body: pdf,
  });
  const info = await up.json().catch(() => ({}));
  const f = info?.file;
  if (!up.ok || !f?.uri || !f?.name) throw new Error('Gemini (envio do PDF) ' + up.status);
  let estado: string = f.state || 'PROCESSING';
  for (let i = 0; i < 20 && estado !== 'ACTIVE'; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const g = await (await fetch(`${GBASE}/v1beta/${f.name}`, { headers: gkey() })).json().catch(() => ({}));
    estado = g?.state || estado;
    if (estado === 'FAILED') { gemApaga(f.name); throw new Error('O Gemini não conseguiu ler este PDF.'); }
  }
  if (estado !== 'ACTIVE') { gemApaga(f.name); throw new Error('O Gemini demorou para processar o PDF.'); }
  return { name: f.name, uri: f.uri, ate: Date.now() + 46 * 3600_000 };
}
function gemApaga(name: string | null | undefined) {
  if (name) fetch(`${GBASE}/v1beta/${name}`, { method: 'DELETE', headers: gkey() }).catch(() => {}); // não deixa o livro guardado no Gemini
}
async function gemAtivo(g: { name: string; ate: number } | null | undefined): Promise<boolean> {
  if (!g || !g.name || Date.now() > g.ate) return false;
  try {
    const r = await fetch(`${GBASE}/v1beta/${g.name}`, { headers: gkey(), signal: AbortSignal.timeout(10_000) });
    return r.ok && (await r.json())?.state === 'ACTIVE';
  } catch { return false; }
}
const parteArquivo = (uri: string) => ({ file_data: { mime_type: 'application/pdf', file_uri: uri } });

/** Resumo padrão a partir do PDF: envia, gera e apaga. */
async function geminiPdf(system: string, texto: string, pdf: ArrayBuffer) {
  const g = await gemEnvia(pdf);
  try { return await gerarJson(system, [parteArquivo(g.uri), { text: texto }], { temperatura: 0.2, timeoutMs: 110_000 }); }
  finally { gemApaga(g.name); }
}

// ---------- push ----------
// deno-lint-ignore no-explicit-any
let wp: any = null;
async function notifica(endpointId: string | null, payload: Record<string, unknown>) {
  if (!endpointId || !VAPID_PUBLIC || !VAPID_PRIVATE) return;
  try {
    const subs = await rest(`push_subs?id=eq.${endpointId}&select=id,sub`);
    if (!subs.length) return;
    if (!wp) {
      const mod = await import('npm:web-push@3.6.7');
      wp = mod.default ?? mod;
      wp.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
    }
    await wp.sendNotification(subs[0].sub, JSON.stringify(payload), { TTL: 3600, urgency: 'normal' });
  } catch (e) {
    const sc = (e as { statusCode?: number }).statusCode;
    if (sc === 404 || sc === 410) { try { await rest(`push_subs?id=eq.${endpointId}`, { method: 'DELETE' }); } catch { /* ignora */ } }
    else console.error('push do resumo falhou', (e as Error).message);
  }
}

// ---------- fila ----------
function emFundo(p: Promise<unknown>) {
  // deno-lint-ignore no-explicit-any
  const er = (globalThis as any).EdgeRuntime;
  if (er && typeof er.waitUntil === 'function') er.waitUntil(p); else p.catch(() => {});
}

const TRAVA_MIN = 4; // uma etapa nunca passa disso; se a função cair, a trava vence e o agendador retoma
const emMin = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

/** Pega o pedido para si (só um processo consegue: trava no banco) e faz o trabalho. Nunca lança erro. */
async function processa(id: string) {
  try {
    const atual = (await rest(`resumos?id=eq.${id}&select=*`))[0];
    if (!atual) return;
    const agora = agoraIso();
    const completo = atual.modo === 'completo';
    const pego = await patch(`resumos?id=eq.${id}&status=in.(na_fila,processando)&or=(trava.is.null,trava.lt.${agora})`, {
      status: 'processando', trava: emMin(TRAVA_MIN), atualizado: agora, erro: null, ...(completo ? {} : { tentativas: (atual.tentativas || 0) + 1 }),
    });
    if (!pego.length) return; // outro processo já pegou ou o pedido já terminou
    if (completo) return await etapaCompleto(pego[0]);
    const tentativa: number = pego[0].tentativas;
    try {
      const entrada = limpaEntrada({ book_id: atual.book_id, titulo: atual.titulo, autor: atual.autor, foco: atual.foco });
      const prompt = atual.prompt || '';
      let bruto;
      if (atual.arquivo) bruto = await geminiPdf(comPrompt(SYS_RESUMO_PDF, prompt), montaPedido(entrada), await stBaixa(atual.arquivo));
      else bruto = await gerarJson(comPrompt(SYS_RESUMO, prompt), [{ text: montaPedido(entrada) }], { busca: tentativa === 1 }); // 1ª tentativa com busca na web
      const resumo: any = normalizaResumo(bruto);
      if (!resumoValido(resumo)) throw new Error('A IA devolveu um resumo incompleto.');
      resumo.origem = atual.arquivo ? 'pdf' : 'conhecimento';
      if (atual.arquivo) resumo.fontes_consultadas = ['arquivo PDF enviado'];
      const fim = agoraIso();
      await patch(`resumos?id=eq.${id}`, { status: 'concluido', resultado: resumo, modelo: MODELO, concluido: fim, atualizado: fim, erro: null, arquivo: null, trava: null });
      await stApaga(atual.arquivo); // o livro não fica guardado depois do resumo pronto
      await notifica(atual.endpoint_id, {
        title: '📖 Resumo concluído', body: `"${atual.titulo}" já está na aba Estudos.`, tag: 'resumo-' + id, data: { go: 'livro', r: atual.book_id },
      });
    } catch (e) {
      const msg = String((e as Error).message || e), tipo = tipoFalha(msg), esp = ((atual.longo && atual.longo.esperas) || 0) + 1;
      if (tipo !== 'outra' && esp <= MAX_ESPERAS) {
        const min = esperaMin(esp, tipo);
        await patch(`resumos?id=eq.${id}`, { status: 'na_fila', tentativas: Math.max(0, tentativa - 1), longo: { ...(atual.longo || {}), esperas: esp }, erro: avisoEspera(tipo, min), atualizado: agoraIso(), trava: emMin(min) });
        return;
      }
      const status = statusAposFalha(tentativa, atual.arquivo ? MAX_TENTATIVAS_PDF : MAX_TENTATIVAS);
      await patch(`resumos?id=eq.${id}`, { status, erro: String((e as Error).message || e).slice(0, 300), atualizado: agoraIso(), trava: null });
      if (status === 'erro') {
        await notifica(atual.endpoint_id, {
          title: '⚠️ Não consegui gerar o resumo', body: `"${atual.titulo}": toque para tentar de novo.`, tag: 'resumo-' + id, data: { go: 'livro', r: atual.book_id },
        });
      }
    }
  } catch (e) { console.error('processa falhou', (e as Error).message); }
}

/** Chama a própria função para fazer a próxima etapa (cada execução tem limite de tempo). */
async function encadeia(id: string) {
  if (!CRON) return; // sem CRON_SECRET o agendador segue a cada minuto
  try {
    await fetch(`${SB}/functions/v1/resumo`, {
      method: 'POST', signal: AbortSignal.timeout(15_000),
      headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON, apikey: SB_ANON, Authorization: 'Bearer ' + SB_ANON },
      body: JSON.stringify({ acao: 'passo', id }),
    });
  } catch { /* o tick retoma */ }
}

/** Uma etapa do resumo completo: plano -> geral -> parte 1..N (com continuação se vier curta) -> fim. */
async function etapaCompleto(job: any) {
  const id = job.id;
  const l: Longo = { ...longoInicial(), ...(job.longo || {}) };
  const meta: number = job.paginas || 100;
  const salva = (extra: Record<string, unknown> = {}) =>
    patch(`resumos?id=eq.${id}`, { longo: l, progresso: progressoDe(l, meta), atualizado: agoraIso(), ...extra });
  try {
    const passo = proximoPasso(l);
    if (passo.tipo !== 'fim') {
      if (!job.arquivo) throw new Error('O PDF deste resumo não está mais no armazenamento. Gere de novo enviando o PDF.');
      if (!(await gemAtivo(l.gem))) l.gem = await gemEnvia(await stBaixa(job.arquivo)); // reaproveita o arquivo entre etapas
    }
    const pdf = l.gem ? parteArquivo(l.gem.uri) : null;
    const prompt = job.prompt || '';
    const entrada = limpaEntrada({ book_id: job.book_id, titulo: job.titulo, autor: job.autor, foco: job.foco });

    if (passo.tipo === 'plano') {
      const raw = await gerarJson(SYS_PLANO, [pdf, { text: `Livro: ${entrada.titulo}${entrada.autor ? ' — ' + entrada.autor : ''}` }], { temperatura: 0.1, max: 12000, timeoutMs: 110_000 });
      const p = ajustaPlano(raw, meta);
      l.partes = p.partes; l.total_paginas_livro = p.total_paginas_livro;
      l.falhas = 0; l.esperas = 0;
      await salva({ trava: null, erro: null });
      return encadeia(id);
    }
    if (passo.tipo === 'geral') {
      const bruto = await gerarJson(comPrompt(SYS_RESUMO_PDF, prompt), [pdf, { text: montaPedido(entrada) }], { temperatura: 0.2, timeoutMs: 120_000 });
      const resumo: any = normalizaResumo(bruto);
      if (!resumoValido(resumo)) throw new Error('A IA devolveu um resumo incompleto.');
      resumo.origem = 'pdf'; resumo.fontes_consultadas = ['arquivo PDF enviado'];
      l.geral = true; l.falhas = 0; l.esperas = 0;
      await salva({ resultado: resumo, trava: null, erro: null });
      return encadeia(id);
    }
    if (passo.tipo === 'parte') {
      const ps = l.partes!, p = ps[passo.i];
      const falta = Math.max(500, p.alvo - (p.palavras || 0));
      const sys = comPrompt(sysParte(p, passo.i, ps.length, passo.continuar ? falta : p.alvo), prompt);
      const pedido = pedidoParte(p, passo.i, ps) + (passo.continuar ? '\n\n' + pedidoContinuacao(p, falta) : '');
      const t = await gerar(sys, [pdf, { text: pedido }], { modelo: MODELO_LONGO, temperatura: 0.3, max: 20000, timeoutMs: 135_000 });
      if (!passo.continuar) {
        const md = limpaMarkdown(t);
        if (contaPalavras(md) < 150) throw new Error('A IA devolveu uma parte vazia.');
        p.texto = md;
      } else {
        p.texto = juntaContinuacao(p.texto || '', t, p.titulo);
        p.cont = (p.cont || 0) + 1;
      }
      p.palavras = contaPalavras(p.texto);
      l.falhas = 0; l.esperas = 0;
      await salva({ trava: null, erro: null });
      return encadeia(id);
    }
    // fim: fecha o trabalho, apaga o livro do Gemini e do armazenamento
    const pr = progressoDe(l, meta);
    const resultado = { ...(job.resultado || {}), completo: { partes: l.partes!.length, palavras: pr.palavras, paginas: pr.paginas, meta_paginas: meta } };
    gemApaga(l.gem && l.gem.name); l.gem = null;
    const fim = agoraIso();
    await patch(`resumos?id=eq.${id}`, { status: 'concluido', resultado, longo: l, progresso: pr, modelo: MODELO_LONGO, concluido: fim, atualizado: fim, erro: null, arquivo: null, trava: null });
    await stApaga(job.arquivo);
    await notifica(job.endpoint_id, {
      title: '📚 Resumo completo pronto', body: `"${job.titulo}": ${pr.partes} partes, ≈ ${pr.paginas} páginas. Está na aba Estudos.`, tag: 'resumo-' + id, data: { go: 'livro', r: job.book_id },
    });
  } catch (e) {
    const msg = String((e as Error).message || e).slice(0, 240), tipo = tipoFalha(msg);
    if (tipo !== 'outra' && (l.esperas || 0) < MAX_ESPERAS) {
      l.esperas = (l.esperas || 0) + 1;
      const min = esperaMin(l.esperas, tipo);
      await salva({ erro: avisoEspera(tipo, min), trava: emMin(min) }).catch(() => {});
      return;
    }
    l.falhas = (l.falhas || 0) + 1;
    if (l.falhas >= MAX_FALHAS_ETAPA || tipo !== 'outra') {
      await salva({ status: 'erro', erro: msg + ' — o que já foi feito está guardado; "Tentar de novo" continua de onde parou.', trava: null }).catch(() => {});
      await notifica(job.endpoint_id, { title: '⚠️ Resumo completo parou', body: `"${job.titulo}": toque para continuar de onde parou.`, tag: 'resumo-' + id, data: { go: 'livro', r: job.book_id } });
    } else {
      // espera um pouco mais a cada falha; o agendador retoma quando a trava vencer
      await salva({ erro: msg, trava: emMin(l.falhas) }).catch(() => {});
    }
  }
}

// ---------- servidor ----------
Deno.serve(async (req) => {
  const cors = corsFor(req);
  const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  { const vr = versaoResp(req, 'resumo', cors); if (vr) return vr; }
  if (req.method !== 'POST') return out({ erro: 'Método não permitido' }, 405);
  if (!SB || !SB_SVC) return out({ erro: 'A função não recebeu as chaves do Supabase.' }, 500);
  let b: any;
  try { b = await req.json(); } catch { return out({ erro: 'JSON inválido' }, 400); }

  try {
    // ----- agendador: retoma pedidos parados (chamado pelo pg_cron) -----
    if (b.acao === 'tick') {
      if (!CRON || req.headers.get('x-cron-secret') !== CRON) return out({ erro: 'Não autorizado' }, 401);
      const fila = await rest('resumos?status=in.(na_fila,processando)&select=id,status,criado,atualizado,trava&order=criado.asc&limit=10');
      const alvo = fila.find((j: any) => precisaRetomar(j, Date.now()));
      if (alvo) emFundo(processa(alvo.id));
      const velhos = await rest(`resumos?status=eq.erro&arquivo=not.is.null&atualizado=lt.${new Date(Date.now() - 2 * 864e5).toISOString()}&select=id,arquivo&limit=5`);
      for (const v of velhos) { await stApaga(v.arquivo); await patch(`resumos?id=eq.${v.id}`, { arquivo: null }); }
      return out({ ok: true, retomado: alvo ? alvo.id : null, arquivos_limpos: velhos.length });
    }

    // ----- próxima etapa do resumo completo (a própria função chama) -----
    if (b.acao === 'passo') {
      if (!CRON || req.headers.get('x-cron-secret') !== CRON) return out({ erro: 'Não autorizado' }, 401);
      const pid = String(b.id || '');
      if (!/^[0-9a-f-]{36}$/i.test(pid)) return out({ erro: 'Identificador inválido' }, 400);
      emFundo(processa(pid));
      return out({ ok: true });
    }

    const uid = await usuario(req);
    if (!uid) return out({ erro: 'Entre na sua conta de novo (Mais → Conta).' }, 401);

    if (b.acao === 'criar') {
      const e = limpaEntrada(b);
      const modo = limpaModo(b.modo), paginas = limpaPaginas(b.paginas), prompt = limpaPrompt(b.prompt);
      if (modo === 'completo' && !b.arquivo) return out({ erro: 'O resumo completo (100+ páginas) é feito a partir do PDF do livro. Anexe o PDF.' }, 400);
      const ativo = await rest(`resumos?uid=eq.${uid}&book_id=eq.${e.bookId}&status=in.(na_fila,processando)&select=id,status&limit=1`);
      if (ativo.length) return out({ ok: true, id: ativo[0].id, status: ativo[0].status, ja_existia: true });
      const inicio = new Date(new Date().toLocaleDateString('en-CA', { timeZone: TZ }) + 'T00:00:00-03:00').toISOString();
      const hoje = await rest(`resumos?uid=eq.${uid}&criado=gte.${inicio}&select=id`);
      if (hoje.length >= LIMITE) return out({ erro: `Limite de ${LIMITE} resumos por dia atingido. Tente amanhã.` }, 429);
      const ep = typeof b.endpoint === 'string' && b.endpoint.startsWith('https://') && b.endpoint.length < 800 ? await sha(b.endpoint) : null;
      let arquivo: string | null = null, bytes: number | null = null;
      if (b.arquivo) {
        const caminho = String(b.arquivo);
        try { const tam = await stTamanho(caminho); arquivo = validaArquivo(caminho, uid, e.bookId, tam); bytes = tam; }
        catch (x) {
          // arquivo grande demais ou fora do padrão: apaga do armazenamento para não gerar custo
          if (caminho.startsWith(uid + '/')) await stApaga(caminho);
          return out({ erro: (x as Error).message }, /50 MB/.test((x as Error).message) ? 413 : 400);
        }
      }
      const novo = (await rest('resumos', {
        method: 'POST',
        body: JSON.stringify({
          uid, book_id: e.bookId, titulo: e.titulo, autor: e.autor, foco: e.foco, endpoint_id: ep, status: 'na_fila', arquivo, arquivo_bytes: bytes,
          modo, paginas: modo === 'completo' ? paginas : null, prompt, longo: modo === 'completo' ? longoInicial() : null,
          progresso: modo === 'completo' ? progressoDe(longoInicial(), paginas) : null,
        }),
      }))[0];
      // mantém só o pedido mais recente de cada livro (e apaga PDFs de pedidos antigos)
      const antigos = await rest(`resumos?uid=eq.${uid}&book_id=eq.${e.bookId}&id=neq.${novo.id}&select=arquivo,longo`);
      for (const a of antigos) { await stApaga(a.arquivo); gemApaga(a.longo && a.longo.gem && a.longo.gem.name); }
      await rest(`resumos?uid=eq.${uid}&book_id=eq.${e.bookId}&id=neq.${novo.id}`, { method: 'DELETE' });
      emFundo(processa(novo.id));
      return out({ ok: true, id: novo.id, status: 'na_fila' });
    }

    if (b.acao === 'listar') {
      const cols = 'id,book_id,titulo,autor,status,erro,tentativas,criado,atualizado,concluido,modo,paginas,progresso' + (b.completo ? ',resultado' : '');
      return out({ itens: await rest(`resumos?uid=eq.${uid}&select=${cols}&order=criado.desc&limit=40`) });
    }

    const id = String(b.id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return out({ erro: 'Identificador inválido' }, 400);
    const linha = (await rest(`resumos?id=eq.${id}&uid=eq.${uid}&select=*`))[0];
    if (!linha) return out({ erro: 'Resumo não encontrado' }, 404);

    if (b.acao === 'obter') {
      const item = { ...linha };
      if (item.longo) item.longo = { ...item.longo, gem: null };
      delete item.arquivo; delete item.endpoint_id;
      return out({ item });
    }
    if (b.acao === 'apagar') {
      await stApaga(linha.arquivo); gemApaga(linha.longo && linha.longo.gem && linha.longo.gem.name);
      await rest(`resumos?id=eq.${id}&uid=eq.${uid}`, { method: 'DELETE' });
      return out({ ok: true });
    }
    if (b.acao === 'extra') {
      // roda um prompt do usuário sobre o resumo (o PDF já foi apagado; a base é o próprio resumo)
      const temTexto = linha.status === 'concluido' || (linha.longo && Array.isArray(linha.longo.partes) && linha.longo.partes.some((p: any) => p.texto));
      if (!temTexto) return out({ erro: 'Espere o resumo ficar pronto.' }, 409);
      const pedido = limpaPrompt(b.prompt), titulo = String(b.titulo || '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Prompt';
      if (pedido.length < 3) return out({ erro: 'Escreva o prompt.' }, 400);
      const ext: any[] = Array.isArray(linha.extras) ? linha.extras : [];
      if (ext.filter((x) => Date.now() - Date.parse(x.criado) < 864e5).length >= 15) return out({ erro: 'Limite de 15 prompts extras por dia neste livro.' }, 429);
      const base = textoCompleto(linha.resultado, linha.longo);
      const entrada = `PEDIDO DO LEITOR:\n<<<\n${pedido}\n>>>\n\nRESUMO DO LIVRO "${linha.titulo}":\n${base}`;
      const texto = limpaMarkdown(await gerar(SYS_EXTRA, [{ text: entrada }], { max: 16000, timeoutMs: 130_000 }));
      const item = { id: crypto.randomUUID(), titulo, prompt: pedido, texto, criado: agoraIso() };
      const extras = [item, ...ext].slice(0, 20);
      await patch(`resumos?id=eq.${id}&uid=eq.${uid}`, { extras });
      return out({ ok: true, item, extras });
    }
    if (b.acao === 'quiz') {
      // simulado: perguntas de múltipla escolha a partir do resumo (do mais fácil ao mais difícil)
      const temTexto = linha.status === 'concluido' || (linha.longo && Array.isArray(linha.longo.partes) && linha.longo.partes.some((p: any) => p.texto));
      if (!temTexto) return out({ erro: 'Espere o resumo ficar pronto.' }, 409);
      const n = limpaQtd(b.n), nivel = limpaNivelQuiz(b.nivel), parte = Number.isInteger(b.parte) ? b.parte : -1;
      const ext: any[] = Array.isArray(linha.extras) ? linha.extras : [];
      if (ext.filter((x) => Date.now() - Date.parse(x.criado) < 864e5).length >= 15) return out({ erro: 'Limite de 15 pedidos por dia neste livro. Tente amanhã.' }, 429);
      const base = baseQuiz(linha.resultado, linha.longo, parte);
      const raw = await gerarJson(SYS_QUIZ, [{ text: `${pedidoQuiz(n, nivel, linha.titulo, base.foco)}\n\nRESUMO DO LIVRO:\n${base.texto}` }], { max: 24000, timeoutMs: 135_000, temperatura: 0.4 });
      const perguntas = normalizaQuiz(raw, n);
      if (perguntas.length < Math.ceil(n * 0.6)) throw new Error(`A IA devolveu só ${perguntas.length} perguntas válidas. Tente de novo.`);
      const item = {
        id: crypto.randomUUID(), tipo: 'quiz', titulo: `${perguntas.length} perguntas · ${nivel === 'dificil' ? 'só difíceis' : 'fácil → difícil'}${base.foco ? ' · ' + base.foco : ''}`,
        n: perguntas.length, nivel, foco: base.foco, perguntas, criado: agoraIso(),
      };
      const extras = [item, ...ext].slice(0, 20);
      await patch(`resumos?id=eq.${id}&uid=eq.${uid}`, { extras });
      return out({ ok: true, item, extras });
    }
    if (b.acao === 'extra_apagar') {
      const extras = (Array.isArray(linha.extras) ? linha.extras : []).filter((x: any) => x.id !== b.eid);
      await patch(`resumos?id=eq.${id}&uid=eq.${uid}`, { extras });
      return out({ ok: true, extras });
    }
    if (b.acao === 'retomar') {
      if (linha.status === 'concluido') return out({ erro: 'Este resumo já foi concluído.' }, 409);
      if (linha.status === 'processando' && !precisaRetomar(linha, Date.now())) return out({ erro: 'Ainda está sendo gerado.' }, 409);
      if (linha.modo === 'completo' && !linha.arquivo) return out({ erro: 'O PDF deste resumo já foi apagado. Gere de novo enviando o PDF.' }, 409);
      const longo = linha.longo ? { ...linha.longo, falhas: 0, esperas: 0 } : linha.longo;
      await patch(`resumos?id=eq.${id}&uid=eq.${uid}`, { status: 'na_fila', tentativas: 0, erro: null, atualizado: agoraIso(), trava: null, longo });
      emFundo(processa(id));
      return out({ ok: true, status: 'na_fila' });
    }
    return out({ erro: 'Ação desconhecida' }, 400);
  } catch (e) {
    return out({ erro: (e as Error).message }, 500);
  }
});
