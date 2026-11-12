/** Validação numérica v563. Texto de análises anteriores nunca serve como fonte. */
type Token = { valor: number; tolerancia: number; percentual: boolean };

function tokens(texto: string, contexto = true): Token[] {
  const original = String(texto || '').replace(/[−–]/g, '-');
  const s = contexto ? original.replace(/\b(?:\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\b/g,v=>' '.repeat(v.length)) : original, out: Token[] = [];
  const re = /[+-]?\d+(?:[.,]\d+)*/g;
  for (const m of s.matchAll(re)) {
    const pos = m.index!, antes = s.slice(Math.max(0, pos - 60), pos), depois = s.slice(pos + m[0].length, pos + m[0].length + 60);
    // Identificadores, datas e períodos descrevem a métrica, não o seu valor.
    if (contexto && (/[\p{L}\d_]$/u.test(antes) || /^[Tt]\d{2,4}\b/.test(depois) ||
      (+m[0] >= 1990 && +m[0] <= 2100 && /\b(?:ano|exerc[ií]cio)(?:\s+de)?\s*$/i.test(antes)) ||
      /^\s*(?:dias?|semanas?|meses|anos?|per[ií]odos?|preg[oõ]es)\b/i.test(depois) ||
      /(?:m[eé]dias? m[oó]veis?|per[ií]odos?)(?:\s+de)?\s*(?:\d+\s*[,e]\s*)*$/i.test(antes))) continue;
    let raw = m[0], casas = 0;
    const percentual = /^\s*%/.test(depois);
    const temPonto = raw.includes('.'), temVirgula = raw.includes(',');
    if (temPonto && temVirgula) {
      const decimal = raw.lastIndexOf('.') > raw.lastIndexOf(',') ? '.' : ',';
      casas = raw.length - raw.lastIndexOf(decimal) - 1;
      raw = decimal === ',' ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '');
    } else if (temVirgula) {
      casas = raw.length - raw.lastIndexOf(',') - 1;
      raw = raw.replace(',', '.');
    } else if (temPonto) {
      const grupos = raw.replace(/^[+-]/, '').split('.');
      const milhar = grupos.length > 2 || (grupos[1]?.length === 3 && grupos[0] !== '0' && !percentual && (/R\$\s*$/.test(antes) || /^\s+BRL\b/.test(depois)));
      if (milhar) raw = raw.replace(/\./g, ''); else casas = grupos[1]?.length || 0;
    }
    const unidade = /^\s*(?:de\s+)?(bilh(?:[aã]o|[oõ]es)|milh(?:[aã]o|[oõ]es)|mil)\b/i.exec(depois)?.[1]?.toLowerCase() || '';
    const fator = unidade.startsWith('bilh') ? 1e9 : unidade.startsWith('milh') ? 1e6 : unidade === 'mil' ? 1e3 : 1;
    const valor = Number(raw) * fator;
    if (Number.isFinite(valor)) out.push({ valor, percentual, tolerancia: Math.max(1e-9, .5 * 10 ** -casas * fator) });
  }
  return out;
}
export const numerosFato = (s: string): number[] => tokens(s, false).map(x => x.valor);

function numerosDados(d: unknown, out: number[] = []): number[] {
  if (typeof d === 'number' && Number.isFinite(d)) out.push(d);
  else if (typeof d === 'string' && /^[+-]?\d+(?:[.,]\d+)*\s*%?$/.test(d.trim())) out.push(...numerosFato(d));
  else if (Array.isArray(d)) for (const v of d) numerosDados(v, out);
  else if (d && typeof d === 'object') for (const [k, v] of Object.entries(d)) {
    if (!/RELATORIO_ANTERIOR|relatorios_individuais|fatos|interpretacoes|hipoteses|noticias|texto/i.test(k)) numerosDados(v, out);
  }
  return out;
}
function perto(base: number[], valor: number, tolerancia: number): boolean {
  let l = 0, r = base.length;
  while (l < r) { const m = (l + r) >>> 1; if (base[m] < valor - tolerancia) l = m + 1; else r = m; }
  return l < base.length && base[l] <= valor + tolerancia + 1e-9;
}
export function validaRelatorio(rel: unknown, dados: unknown, lacunas: string[]) {
  // Índice ordenado: evita percorrer todos os dados para cada número de cada frase.
  const base = [...new Set(numerosDados(dados))].sort((a, b) => a - b), problemas: string[] = [];
  const varre = (o: any, caminho: string) => {
    if (!o || typeof o !== 'object') return;
    for (const fato of Array.isArray(o.fatos) ? o.fatos : []) {
      const ruins = tokens(fato).filter(t => !perto(base, t.valor, t.tolerancia) &&
        !(t.percentual && perto(base, t.valor / 100, t.tolerancia / 100)));
      if (ruins.length) problemas.push(`${caminho}: número sem origem nos dados (${ruins.slice(0, 3).map(t => t.valor).join('; ')}) em "${String(fato).slice(0, 120)}"`);
    }
    for (const [k, v] of Object.entries(o)) if (v && typeof v === 'object' && k !== 'fatos') { if(Array.isArray(v))v.forEach((item,index)=>{if(item&&typeof item==='object')varre(item,(caminho ? caminho + '.' : '')+k+'['+index+']')});else varre(v, caminho ? caminho + '.' + k : k); }
  };
  varre(rel, '');
  return { estado: problemas.length ? 'revisar' : lacunas.length ? 'com_limitacoes' : 'validado', problemas: problemas.slice(0, 10), lacunas: lacunas.slice(0, 10), conferidos: base.length, versao: 'v563' };
}
