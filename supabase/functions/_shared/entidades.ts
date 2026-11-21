// v846: decodifica entidades HTML de títulos de RSS (inclusive duplas, como &amp;#8216;).
const NOMES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…' };
export function decodeEntidades(s: string): string {
  let t = String(s ?? '');
  for (let i = 0; i < 2; i++) {
    t = t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, n: string) => {
      if (n[0] === '#') { const c = n[1].toLowerCase() === 'x' ? parseInt(n.slice(2), 16) : parseInt(n.slice(1), 10); return c > 0 && c <= 0x10ffff ? String.fromCodePoint(c) : ''; }
      return NOMES[n.toLowerCase()] ?? m;
    });
  }
  return t;
}
