// Notícias urgentes v649 — isolado da rotina de alertas já existente.
// O banco push_log reserva por inscrição+hash, com retry e deduplicação persistente.
export type NoticiaUrgente = {
  titulo: string; link: string; fonte: string; publicado: number; assinatura: string;
};
type Fonte = { nome: string; urls: string[] };
type Fetcher = typeof fetch;
export const RSS_FINANCEIRO: Fonte[] = [
  { nome: 'InfoMoney', urls: ['https://www.infomoney.com.br/feed/'] },
  { nome: 'Money Times', urls: ['https://www.moneytimes.com.br/mercados/feed/', 'https://www.moneytimes.com.br/feed/'] },
  { nome: 'Investing.com', urls: ['https://br.investing.com/rss/news.rss'] },
  { nome: 'Bloomberg Línea', urls: ['https://www.bloomberglinea.com.br/arc/outboundfeeds/rss.xml'] },
  { nome: 'CNBC', urls: ['https://www.cnbc.com/id/100003114/device/rss/rss.html'] },
  // A Reuters não oferece um RSS oficial estável: Google Notícias limitado ao domínio.
  { nome: 'Reuters (Google Notícias)', urls: ['https://news.google.com/rss/search?q=when%3A24h%20site%3Areuters.com&hl=en-US&gl=US&ceid=US:en'] },
];
export const X_PERFIS = ['FirstSquawk', 'DeItaone'];
const PARAR = new Set(('a o as os um uma uns umas de da do das dos na no nas nos em por para com e ou que ao aos sua seu suas seus the an and or to from in on for of with by at this that is are was were has have after before amid about says said news mercado markets market sobre apos hoje ontem agora nova novo new latest update updates live breaking report reports shares stocks stock').split(' '));
const PORTAIS = '(?:InfoMoney|Money\\s*Times|Investing(?:\\.com)?|Bloomberg\\s*L[ií]nea|CNBC|Reuters|Finnhub|MarketWatch|Google\\s*News|FirstSquawk|DeItaone)';
const limpaHtml = (s: unknown) => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n: string) => {
    const v = n.toLowerCase().startsWith('x') ? parseInt(n.slice(1), 16) : parseInt(n, 10);
    return v > 0 && v <= 0x10ffff ? String.fromCodePoint(v) : '';
  })
  .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/gi, (m) => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' } as Record<string,string>)[m.toLowerCase()] || m)
  .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
export function tituloLimpo(t: unknown): string {
  let s = limpaHtml(t);
  s = s.replace(new RegExp('\\s*\\(\\s*' + PORTAIS + '\\s*\\)\\s*$', 'i'), '')
    .replace(new RegExp('\\s*[-|–—]\\s*' + PORTAIS + '\\s*$', 'i'), '')
    .replace(/^\s*(?:BREAKING|URGENT|FLASH|PLANTÃO)\s*[:\-–]\s*/i, '')
    .replace(/\s+/g, ' ').trim();
  return s.slice(0, 240);
}
const normal = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const PESSOAL = /\b(?:moneyist|dear penny|husband|wife|wedding|horoscope|boyfriend|girlfriend|divorce|marriage|zodiac|astrology|mpox|monkeypox|measles|celebrity|fashion|relationship|retire at|should i marry|should i divorce|should i retire|personal advice|my spouse|my wife|my husband)\b/i;
export function temaPrioritario(titulo: string): 'petroleo' | 'minerio' | 'acoes' | 'politica' | '' {
  const n = normal(titulo);
  const petroleo = /\b(?:petroleo|brent|wti|oil|crude|opec|opep|petrobras|petr[34]|diesel|refinaria|refinery)\b/.test(n);
  const minerio = /\b(?:minerio|iron ore|iron-ore|siderurgia|steel|vale3|csn mineracao|mining)\b/.test(n);
  const acoes = /\b(?:acoes|acao|stocks|shares|equities|ibovespa|ibov|nasdaq|bolsa|earnings|balanco|dividendos|lucro|resultados|petrobras|vale3|b3)\b/.test(n);
  const politico = /\b(?:governo|congresso|senado|presidente|election|eleicoes|congress|senate|white house|trump|tarifa|tariff|sancoes|sanctions|guerra|war|orcamento|impostos|tax)\b/.test(n);
  const economico = /\b(?:fiscal|mercado|market|economia|economy|comercio|trade|export|import|tarif|tax|sanc|guerra|war|petroleo|oil|minerio|iron|bolsa|stocks|acoes|juros|rates|dolar|dollar|energia|energy|credito|debt)\b/.test(n);
  if (petroleo) return 'petroleo';
  if (minerio) return 'minerio';
  if (politico && economico) return 'politica';
  if (acoes) return 'acoes';
  return '';
}
export function mancheteUrgente(titulo: string): boolean {
  const n = normal(titulo);
  if (PESSOAL.test(n)) return false;
  if (/\b(?:copom|selic|fed|powell|fomc|payroll|cpi|ipca|tarifas?|tariffs?|petroleo|oil|crude|opep|opec|guerra|war|petrobras|petr[34]|bitcoin|btc)\b/.test(n)) return true;
  if (/\b(?:Vale|VALE3|mineradora\s+vale|minerio de ferro|iron ore)\b/i.test(titulo)) return true;
  const t = temaPrioritario(titulo);
  return (t === 'politica' || t === 'acoes') &&
    /\b(?:breaking|urgent|urgente|aprova|aprovou|decide|decidiu|anuncia|anunciou|ataque|attack|votacao|vote|suspende|corta|cuts|sanctions|sancoes|tarifas|tariffs|embargo|dividendo|earnings|balanco|lucro|revenue|receita|prejuizo|losses|regulacao|regulation|intervencao|intervention|crise|crisis)\b/.test(n);
}
export function assinaturaNoticia(titulo: string): string {
  const n = normal(tituloLimpo(titulo))
    .replace(/\bfederal reserve\b/g, 'fed')
    .replace(/\bbanco central (?:americano|dos estados unidos)\b/g, 'fed')
    .replace(/\bopec\b/g, 'opep')
    .replace(/\b(?:oil|crude)\b/g, 'petroleo')
    .replace(/\b(?:tariffs?|tarifas)\b/g, 'tarifa')
    .replace(/\b(?:war)\b/g, 'guerra')
    .replace(/\b(?:bitcoin)\b/g, 'btc')
    .replace(/\b(?:stocks|shares)\b/g, 'acoes')
    .replace(/\b(?:rates|rate)\b/g, 'juros');
  const palavras = n.replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/)
    .filter((p) => p.length >= 3 && !PARAR.has(p));
  return [...new Set(palavras)].sort().slice(0, 32).join('|');
}
export function mesmaNoticia(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const A = new Set(a.split('|')), B = new Set(b.split('|'));
  if (Math.min(A.size, B.size) < 3) return false;
  const inter = [...A].filter((x) => B.has(x)).length;
  const jaccard = inter / (A.size + B.size - inter);
  return jaccard >= 0.78 || (inter / Math.min(A.size, B.size) >= 0.90 && jaccard >= 0.60);
}
export function janelaNoticias(agora = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit',
    minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(agora).map((x) => [x.type, x.value]));
  // Abrange o pregão brasileiro e a sessão americana regular, sem impedir feriados dos EUA.
  const pregao = !['Sat', 'Sun'].includes(p.weekday) && +p.hour >= 9 && +p.hour < 18;
  const intervalo = pregao ? 2 : 10;
  return { pregao, intervalo, consultar: +p.minute % intervalo === 0, idadeMaxMs: (intervalo + 7) * 60_000 };
}
function linkSeguro(link: unknown): string {
  try {
    const u = new URL(limpaHtml(link));
    if (u.protocol !== 'https:' || u.username || u.password || u.port || u.hostname === 'localhost') return '';
    return u.href.slice(0, 1200);
  } catch { return ''; }
}
function tag(xml: string, nome: string): string {
  const m = new RegExp('<' + nome + '\\b[^>]*>([\\s\\S]*?)<\\/' + nome + '>', 'i').exec(xml);
  return m ? limpaHtml(m[1]) : '';
}
export function lerRSS(xml: string, fonte: string): NoticiaUrgente[] {
  const entradas = xml.slice(0, 650_000).match(/<(?:item|entry)\b[^>]*>[\s\S]*?<\/(?:item|entry)>/gi) || [];
  const itens: NoticiaUrgente[] = [];
  for (const bloco of entradas.slice(0, 55)) {
    const titulo = tituloLimpo(tag(bloco, 'title'));
    const href = /<link\b[^>]*\bhref=["']([^"']+)["']/i.exec(bloco)?.[1] || '';
    const link = linkSeguro(tag(bloco, 'link') || href || tag(bloco, 'guid'));
    const pub = tag(bloco, 'pubDate') || tag(bloco, 'published') || tag(bloco, 'updated') || tag(bloco, 'dc:date');
    const publicado = Date.parse(pub);
    if (titulo.length < 12 || !link || !Number.isFinite(publicado)) continue;
    itens.push({ titulo, link, fonte, publicado, assinatura: assinaturaNoticia(titulo) });
  }
  return itens;
}
async function baixarRSS(fonte: string, url: string, fetcher: Fetcher): Promise<NoticiaUrgente[]> {
  const r = await fetcher(url, { signal: AbortSignal.timeout(6500), headers: {
    Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
    // FxTwitter fornece RSS válido, mas pode rejeitar User-Agent de robô (404).
    ...(url.startsWith('https://fxtwitter.com/') ? {} : { 'User-Agent': 'DiarioTraderNewsMonitor/1.0' }),
  } });
  if (!r.ok) throw Error('RSS ' + r.status);
  const xml = await r.text();
  const itens = lerRSS(xml, fonte);
  if (!itens.length) throw Error('RSS vazio ou sem datas');
  return itens;
}
async function fonteRSS(fonte: Fonte, fetcher: Fetcher) {
  // Alternativas só quando o feed principal falha; nunca busca HTML protegido.
  for (const url of fonte.urls) {
    try { return await baixarRSS(fonte.nome, url, fetcher); } catch { /* próxima URL */ }
  }
  throw Error('Feed indisponível: ' + fonte.nome);
}
// O provedor FxEmbed documenta dois domínios RSS. Uma fonte fora do ar não
// impede as notícias dos portais e o próximo ciclo tenta novamente com intervalo seguro.
const X_FALHA_ATE = new Map<string, number>();
async function fonteX(perfil: string, fetcher: Fetcher) {
  if (Date.now() < (X_FALHA_ATE.get(perfil) || 0))
    throw Error('Feed X em recuperação: @' + perfil);
  const urls = [
    'https://fxtwitter.com/' + perfil + '/feed.xml?count=30',
    'https://fixupx.com/' + perfil + '/feed.xml?count=30',
  ];
  for (const url of urls) {
    try {
      const itens = await baixarRSS('X @' + perfil, url, fetcher);
      X_FALHA_ATE.delete(perfil);
      return itens;
    } catch { /* tentar apenas o outro domínio, sem fan-out paralelo */ }
  }
  X_FALHA_ATE.set(perfil, Date.now() + 5 * 60_000);
  throw Error('Feed X temporariamente indisponível: @' + perfil);
}
async function fonteFinnhub(categoria: string, chave: string, fetcher: Fetcher): Promise<NoticiaUrgente[]> {
  const r = await fetcher('https://finnhub.io/api/v1/news?category=' + categoria + '&token=' + encodeURIComponent(chave), {
    signal: AbortSignal.timeout(7000), headers: { Accept: 'application/json' },
  });
  if (!r.ok) throw Error('Finnhub ' + categoria + ' HTTP ' + r.status);
  const j = await r.json();
  if (!Array.isArray(j)) throw Error('Finnhub: resposta inválida');
  return j.slice(0, 100).map((x: any) => {
    const titulo = tituloLimpo(x.headline), link = linkSeguro(x.url);
    const publicado = Number(x.datetime) * 1000;
    return { titulo, link, fonte: 'Finnhub ' + categoria, publicado, assinatura: assinaturaNoticia(titulo) };
  }).filter((x: NoticiaUrgente) => x.titulo.length >= 12 && x.link && Number.isFinite(x.publicado));
}
export async function coletarNoticias(chave: string, agora = new Date(), fetcher: Fetcher = fetch, modo: 'completo' | 'leve' = 'completo') {
  // O cron coleta 3 RSS financeiros + 2 perfis X + Finnhub general; não gera Jornal nem IA.
  // O modo completo continua disponível para diagnóstico pontual, nunca no cron.
  const fontes = modo === 'leve'
    ? RSS_FINANCEIRO.filter((f) => ['InfoMoney', 'Money Times', 'CNBC'].includes(f.nome))
    : RSS_FINANCEIRO;
  const categorias = modo === 'leve' ? ['general'] : ['general', 'forex', 'crypto'];
  const tarefas: { nome: string; executar: () => Promise<NoticiaUrgente[]> }[] = [
    ...fontes.map((f) => ({ nome: f.nome, executar: () => fonteRSS(f, fetcher) })),
    ...X_PERFIS.map((p) => ({ nome: 'X @' + p, executar: () => fonteX(p, fetcher) })),
    ...(chave ? categorias.map((c) => ({ nome: 'Finnhub ' + c, executar: () => fonteFinnhub(c, chave, fetcher) })) : []),
  ];
  const respostas = await Promise.allSettled(tarefas.map((t) => t.executar()));
  const falhas = respostas.flatMap((r, i) => r.status === 'rejected' ? [tarefas[i].nome] : []);
  const intervalo = janelaNoticias(agora).idadeMaxMs, ms = agora.getTime();
  const todos = respostas.flatMap((r) => r.status === 'fulfilled' ? r.value : []);
  const urgentes = todos.filter((x) =>
    x.publicado >= ms - intervalo && x.publicado <= ms + 120_000 && mancheteUrgente(x.titulo));
  urgentes.sort((a, b) => b.publicado - a.publicado);
  const unicos: NoticiaUrgente[] = [];
  for (const n of urgentes) if (n.assinatura && !unicos.some((x) => mesmaNoticia(x.assinatura, n.assinatura))) unicos.push(n);
  return { noticias: unicos, fontesOk: respostas.length - falhas.length, fontesFalhas: falhas, examinadas: todos.length };
}
async function hash(s: string): Promise<string> {
  const v = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  return [...v].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
async function hashCompleto(s: string): Promise<string> {
  const v = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  return [...v].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function tituloEmPortugues(n: NoticiaUrgente, fetcher: Fetcher): Promise<string> {
  if (!/(?:Finnhub|X @|CNBC|Reuters)/.test(n.fonte)) return n.titulo;
  try {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=' + encodeURIComponent(n.titulo);
    const r = await fetcher(url, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return n.titulo;
    const j = await r.json();
    const traduzido = Array.isArray(j?.[0]) ? j[0].map((x: any) => String(x?.[0] || '')).join('').trim() : '';
    return traduzido.length >= 10 ? tituloLimpo(traduzido) : n.titulo;
  } catch { return n.titulo; }
}
export async function dispararNoticias(op: {
  cliente: any; subs: any[]; enviar: (sub: any, payload: Record<string, unknown>, chave: string) => Promise<boolean>;
  token: string; agora?: Date; fetcher?: Fetcher;
}) {
  const agora = op.agora || new Date(), janela = janelaNoticias(agora);
  if (!janela.consultar) return { consultou: false, intervalo: janela.intervalo, enviados: 0 };
  if (!op.subs.length) return { consultou: false, intervalo: janela.intervalo, enviados: 0, semInscricoes: true };
  const dados = await coletarNoticias(op.token, agora, op.fetcher || fetch, 'leve');
  // Traduz uma vez por notícia (sem alterar a assinatura usada para deduplicar).
  const titulos = await Promise.all(dados.noticias.map((n) => tituloEmPortugues(n, op.fetcher || fetch)));
  const assinaturasPT = titulos.map(assinaturaNoticia);
  // Agrupa a mesma notícia também quando uma fonte a publicou em inglês e outra em português.
  const indices: number[] = [];
  for (let i = 0; i < dados.noticias.length; i++) {
    if (!indices.some((j) => mesmaNoticia(assinaturasPT[i], assinaturasPT[j]) ||
      mesmaNoticia(dados.noticias[i].assinatura, dados.noticias[j].assinatura))) indices.push(i);
  }
  // Reserva permanente por conta, compartilhada entre os aparelhos no mesmo ciclo.
  // A unicidade no Postgres impede dois cron jobs concorrentes de reenviar o mesmo evento.
  const reservas = new Map<string, Promise<boolean>>();
  let enviados = 0, falhasEnvio = 0;
  const resultados = await Promise.allSettled(op.subs.map(async (sub) => {
    // Falha fechada: se o histórico não puder ser lido, não envia (evita spam).
    const { data: anteriores, error } = await op.cliente.from('push_log')
      .select('chave,payload,status,em').like('chave', sub.id + '|urg|%')
      .gte('em', new Date(agora.getTime() - 48 * 3600_000).toISOString())
      .order('em', { ascending: false }).limit(250);
    if (error) throw Error('Histórico de notícias indisponível');
    const hoje = agora.toISOString().slice(0, 10);
    const jaEnviados = (anteriores || []).filter((x: any) =>
      x.status === 'enviado' && String(x.em || '').slice(0, 10) === hoje).length;
    // Limites de notificação por aparelho: 12 notícias/dia e 3 a cada ciclo, sem spam.
    if (jaEnviados >= 12) return { n: 0, erros: 0 };
    const assinaturas = (anteriores || []).flatMap((x: any) => [
      String(x.payload?.data?.assinatura || assinaturaNoticia(String(x.payload?.title || ''))),
      String(x.payload?.data?.assinatura_original || assinaturaNoticia(String(x.payload?.data?.titulo_original || ''))),
    ]).filter(Boolean);
    let n = 0, erros = 0;
    for (const i of indices) {
      if (n >= 3 || jaEnviados + n >= 12) break;
      const item = dados.noticias[i], assinatura = assinaturasPT[i];
      if (assinaturas.some((a: string) => mesmaNoticia(a, assinatura) || mesmaNoticia(a, item.assinatura))) continue;
      const identificador = assinatura + '|' + new Date(item.publicado).toISOString().slice(0, 10);
      const id = await hash(identificador);
      if (sub.user_id) {
        const hashLongo = await hashCompleto(identificador);
        const chave = String(sub.user_id) + '|' + hashLongo;
        if (!reservas.has(chave)) reservas.set(chave, (async () => {
          const { data, error: eReserva } = await op.cliente.from('noticias_urgentes_notificadas')
            .upsert({
              user_id: sub.user_id, noticia_hash: hashLongo,
              titulo: titulos[i].slice(0, 220), url: item.link,
              fonte: item.fonte, publicada_em: new Date(item.publicado).toISOString(),
            }, { onConflict: 'user_id,noticia_hash', ignoreDuplicates: true })
            .select('noticia_hash');
          if (eReserva) throw Error('Falha ao reservar notícia permanente');
          return !!data?.length;
        })());
        // Se o banco não puder confirmar a reserva, falha fechada em vez de gerar spam.
        if (!(await reservas.get(chave)!)) continue;
      }
      const tema = temaPrioritario(item.titulo);
      const nomes: Record<string,string> = {petroleo:'PETRÓLEO',minerio:'MINÉRIO',acoes:'AÇÕES',politica:'POLÍTICA / MERCADO'};
      const prefixo = nomes[tema] ? '[' + nomes[tema] + '] ' : '';
      const payload = {
        title: (prefixo + titulos[i]).slice(0, 120),
        body: ('Urgente · ' + item.fonte + ' · ' + item.link).slice(0, 500),
        tag: 'urg-' + id,
        data: { go: 'mercado', r: 'noticias', url: item.link, noticia_id: id, tema, assinatura, assinatura_original: item.assinatura, titulo_original: item.titulo },
      };
      try { if (await op.enviar(sub, payload, sub.id + '|urg|' + id)) n++; else erros++; }
      catch { erros++; }
      assinaturas.push(assinatura, item.assinatura);
    }
    return { n, erros };
  }));
  for (const r of resultados) {
    if (r.status === 'fulfilled') { enviados += r.value.n; falhasEnvio += r.value.erros; }
    else falhasEnvio++;
  }
  return {
    consultou: true, intervalo: janela.intervalo, fontesOk: dados.fontesOk,
    fontesFalhas: dados.fontesFalhas, examinadas: dados.examinadas,
    urgentes: indices.length, enviados, falhasEnvio,
  };
}
