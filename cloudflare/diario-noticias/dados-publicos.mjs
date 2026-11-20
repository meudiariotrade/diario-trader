/* v811 — Agenda econômica e Medo & Ganância coletados na borda (Cloudflare), com o MESMO cálculo
   das Edge Functions do Supabase, para que o app pare de chamar o Supabase para dados públicos.
   Trechos transpilados de supabase/functions/macro/index.ts (sha256 8a1ed993372dd198…) e
   supabase/functions/sentimento/index.ts (sha256 6d111498ea753dbe…). Não editar à mão: mudar lá e reexportar. */
// ===== agenda (macro/index.ts) =====
// Agenda econômica da semana (calendário do TradingView), em português e no horário de Brasília.
export const AG_PAISES = ['BR', 'US', 'CN', 'EU', 'DE', 'GB', 'JP', 'CA'];
export const AG_NOME = { BR: 'Brasil', US: 'EUA', CN: 'China', EU: 'Zona do Euro', DE: 'Alemanha', GB: 'Reino Unido', JP: 'Japão', CA: 'Canadá' };
const BRT = -3 * 3600_000;
/** Janela da semana: do domingo (eventos de "antes da semana", como a China) ao sábado. No sábado já mostra a próxima. */
export function janelaSemana(agoraMs = Date.now(), desloc = 0) {
    const l = new Date(agoraMs + BRT); // relógio de Brasília em campos UTC
    const dow = l.getUTCDay();
    const ini = Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate()) - (dow === 6 ? -1 : dow) * 86400_000 + desloc * 7 * 86400_000;
    return { de: new Date(ini - BRT).toISOString(), ate: new Date(ini + 6 * 86400_000 - BRT).toISOString() };
}
// Traduções mais comuns (ordem importa: o mais específico primeiro)
const TR = [
    [/\bNAHB Housing Market In(dex|dx)\b/i, 'Confiança das construtoras (NAHB)'],
    [/\bIGP-10 Inflation Index\b/i, 'IGP-10'], [/\bIGP-M Inflation Index\b/i, 'IGP-M'], [/\bIGP-DI Inflation Index\b/i, 'IGP-DI'],
    [/\bMid-?month CPI\b|\bIPCA-15\b|\bIPCA Inflation Index \(mid-?month\)/i, 'IPCA-15'],
    [/\bIPCA Inflation Index\b/i, 'IPCA'],
    [/\bInterest Rate Decision\b/i, 'Decisão de juros'],
    [/\bCore Inflation Rate\b|\bCore CPI\b/i, 'Núcleo da inflação (CPI)'],
    [/\bInflation Rate\b|\bCPI\b/i, 'Inflação ao consumidor (CPI)'],
    [/\bCore PCE Price Index\b/i, 'Núcleo do PCE'], [/\bPCE Price Index\b/i, 'Inflação PCE'],
    [/\bPPI\b/i, 'Inflação ao produtor (PPI)'],
    [/\bGDP Growth Rate\b|\bGDP\b/i, 'PIB'],
    [/\bRetail Sales\b/i, 'Vendas no varejo'],
    [/\bIndustrial Production\b/i, 'Produção industrial'],
    [/\bFixed Asset Investment\b/i, 'Investimento em ativos fixos'],
    [/\bLoan Prime Rate\b/i, 'LPR (juro de referência)'],
    [/\bUnemployment Rate\b/i, 'Taxa de desemprego'],
    [/\bInitial Jobless Claims\b/i, 'Pedidos de auxílio-desemprego'], [/\bContinuing Jobless Claims\b/i, 'Pedidos contínuos de auxílio-desemprego'],
    [/\bNon ?Farm Payrolls\b/i, 'Payroll (empregos fora do agro)'],
    [/\bADP Employment Change\b/i, 'ADP: emprego privado'],
    [/\bAverage Earnings\b/i, 'Salários médios'], [/\bClaimant Count Change\b/i, 'Pedidos de seguro-desemprego'], [/\bEmployment Change\b/i, 'Variação do emprego'],
    [/\bBuilding Permits\b/i, 'Licenças de construção'], [/\bHousing Starts\b/i, 'Construção de casas iniciadas'],
    [/\bPending Home Sales\b/i, 'Vendas pendentes de imóveis'], [/\bExisting Home Sales\b/i, 'Vendas de imóveis usados'], [/\bNew Home Sales\b/i, 'Vendas de imóveis novos'],
    [/\bMichigan Consumer Sentiment\b/i, 'Sentimento do consumidor (Michigan)'], [/\bMichigan Inflation Expectations\b/i, 'Expectativa de inflação (Michigan)'],
    [/\bInflation Expectations\b/i, 'Expectativa de inflação'],
    [/\bConsumer Confidence\b/i, 'Confiança do consumidor'], [/\bBusiness Confidence\b/i, 'Confiança empresarial'],
    [/\bZEW Economic Sentiment Index\b|\bZEW Economic Sentiment\b/i, 'ZEW: sentimento econômico'],
    [/\bIfo Business Climate\b/i, 'Ifo: clima de negócios'],
    [/\bManufacturing PMI\b/i, 'PMI industrial'], [/\bServices PMI\b/i, 'PMI de serviços'], [/\bComposite PMI\b/i, 'PMI composto'],
    [/\bISM Manufacturing\b/i, 'ISM industrial'], [/\bISM Services\b|\bISM Non-Manufacturing\b/i, 'ISM de serviços'],
    [/\b(CB )?Leading (Economic )?Index\b/i, 'Indicadores antecedentes (LEI)'],
    [/\bTrade Balance\b/i, 'Balança comercial'], [/\bCurrent Account\b/i, 'Conta corrente'],
    [/\bCrude Oil (Inventories|Stocks Change)\b|\bEIA Crude Oil Stocks Change\b/i, 'Estoques de petróleo (EIA)'],
    [/\bDurable Goods Orders\b/i, 'Encomendas de bens duráveis'], [/\bPersonal Income\b/i, 'Renda pessoal'], [/\bPersonal Spending\b/i, 'Gastos pessoais'],
    [/\bFOMC Minutes\b/i, 'Ata do FOMC'], [/\bCopom Minutes\b/i, 'Ata do Copom'], [/\bMonetary Policy Meeting Minutes\b/i, 'Ata de política monetária'],
    [/\bSpeech\b|\bSpeaks\b/i, 'discurso'],
    [/\bBCB Focus Market Readout\b|\bFocus Market Readout\b/i, 'Relatório Focus'],
    [/\bIBC-Br\b.*$/i, 'IBC-Br (prévia do PIB)'],
    [/\bTax Revenue\b/i, 'Arrecadação federal'], [/\bBudget Balance\b/i, 'Resultado fiscal'],
];
const PER = [[/\bQoQ\b/g, 'tri/tri'], [/\bYoY\b/g, 'anual'], [/\bMoM\b/g, 'mensal'], [/\bPrel(iminary)?\b/gi, 'prévia'], [/\bFinal\b/g, 'final'], [/\bFlash\b/gi, 'prévia']];
export function traduz(t) {
    let s = String(t || '').replace(/\*+\s*$/, '').replace(/\s+/g, ' ').trim();
    for (const [re, pt] of TR)
        if (re.test(s)) {
            s = s.replace(re, pt);
            break;
        }
    for (const [re, pt] of PER)
        s = s.replace(re, pt);
    return s;
}
/** Rotina que só polui a agenda: leilões de títulos, inspeções de grãos, sondas, Redbook. */
export const ROTINA = /\bBill Auc|\bAuction\b|\bAuc\b|Inspected|Baker Hughes|Rig Count|Redbook|MBA (Mortgage|Purchase)|Mortgage (Applications|Rate)|\bAPI (Crude|Weekly)|Cushing|Gasoline (Inventories|Stocks)|Distillate|Heating Oil|Natural Gas Stor|Refinery|Treasury Bill|Bond Auction|Note Auction|Bund Auction|Gilt Auction|JGB Auction|CFTC|Commitments of Traders|Speculative Net/i;
const fmt = (v, unit, scale) => v == null || v === '' ? undefined : `${typeof v === 'number' ? v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : v}${scale || ''}${unit ? (unit === '%' ? '%' : ' ' + unit) : ''}`;
export function normalizaAgenda(raw, de, ate) {
    const arr = Array.isArray(raw?.result) ? raw.result : Array.isArray(raw) ? raw : [];
    const out = [];
    const vistos = new Set();
    for (const x of arr) {
        const p = String(x?.country || '').toUpperCase(), em = x?.date;
        if (!AG_PAISES.includes(p) || !em || isNaN(Date.parse(em)))
            continue;
        const orig = String(x.title || x.indicator || '').trim();
        if (!orig)
            continue;
        const k = p + '|' + orig + '|' + em;
        if (vistos.has(k))
            continue;
        vistos.add(k);
        const imp = typeof x.importance === 'number' ? Math.max(-1, Math.min(1, x.importance)) : -1;
        out.push({ id: String(x.id ?? k), p, t: traduz(orig), orig, em: new Date(em).toISOString(), imp, per: x.period || undefined,
            ant: fmt(x.previous, x.unit, x.scale), proj: fmt(x.forecast, x.unit, x.scale), atual: fmt(x.actual, x.unit, x.scale), rotina: ROTINA.test(orig) || undefined });
    }
    // Focus do Banco Central: toda segunda às 8h25 (às vezes não vem no calendário)
    for (let d = Date.parse(de); d < Date.parse(ate); d += 86400_000) {
        const l = new Date(d + BRT);
        if (l.getUTCDay() !== 1)
            continue;
        const dia = l.toISOString().slice(0, 10);
        if (out.some((e) => e.p === 'BR' && /focus/i.test(e.orig + e.t) && new Date(Date.parse(e.em) + BRT).toISOString().slice(0, 10) === dia))
            continue;
        out.push({ id: 'focus-' + dia, p: 'BR', t: 'Relatório Focus', orig: 'Focus', em: new Date(Date.parse(dia + 'T08:25:00-03:00')).toISOString(), imp: 0, extra: true });
    }
    return out.sort((a, b) => a.em.localeCompare(b.em) || b.imp - a.imp);
}
// ===== sentimento (sentimento/index.ts) =====
// Função SENTIMENTO — arquivo único para colar no editor do Supabase (Edge Functions → sentimento → index.ts)
export const rotulo = (v) => v == null ? 'sem dado' : v < 25 ? 'Medo extremo' : v < 45 ? 'Medo' : v <= 55 ? 'Neutro' : v <= 75 ? 'Ganância' : 'Ganância extrema';
const r0 = (x) => Math.round(Math.max(0, Math.min(100, x)));
const sma = (a, n, i) => { if (i + 1 < n)
    return null; let s = 0; for (let k = i - n + 1; k <= i; k++)
    s += a[k]; return s / n; };
/** Posição percentual de x dentro da amostra (0 = menor valor do período, 100 = maior). */
export function percentil(amostra, x) {
    const a = amostra.filter((v) => isFinite(v));
    if (a.length < 20 || !isFinite(x))
        return null;
    const menores = a.filter((v) => v < x).length, iguais = a.filter((v) => v === x).length;
    return r0(((menores + iguais / 2) / a.length) * 100);
}
export function rsi(c, i, n = 14) {
    if (i < n)
        return null;
    let g = 0, l = 0;
    for (let k = 1; k <= n; k++) {
        const d = c[k] - c[k - 1];
        if (d >= 0)
            g += d;
        else
            l -= d;
    }
    g /= n;
    l /= n;
    for (let k = n + 1; k <= i; k++) {
        const d = c[k] - c[k - 1];
        g = (g * (n - 1) + Math.max(d, 0)) / n;
        l = (l * (n - 1) + Math.max(-d, 0)) / n;
    }
    return l === 0 ? 100 : 100 - 100 / (1 + g / l);
}
const ret = (c, i, n) => (i >= n && c[i - n] > 0 ? c[i] / c[i - n] - 1 : NaN);
const vol = (c, i, n = 20) => { if (i < n)
    return NaN; const r = []; for (let k = i - n + 1; k <= i; k++)
    r.push(Math.log(c[k] / c[k - 1])); const m = r.reduce((a, b) => a + b, 0) / n; return Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / (n - 1)) * Math.sqrt(252); };
/** Alinha uma série secundária pelas datas da principal (último valor conhecido). */
export function alinha(base, outra) {
    if (!outra || !outra.t.length)
        return null;
    const m = new Map();
    outra.t.forEach((d, i) => m.set(d, outra.c[i]));
    let ult = NaN;
    return base.t.map((d) => { const v = m.get(d); if (v != null && isFinite(v))
        ult = v; return ult; });
}
/** Calcula o índice em cada um dos últimos `dias` pregões (percentil contra os 252 pregões anteriores a cada dia). */
function indice(defs, n, dias) {
    const hist = [];
    for (let i = Math.max(0, n - dias); i < n; i++) {
        const comps = defs.map((d) => {
            const x = d.valor(i);
            let nota = null;
            if (isFinite(x)) {
                if (d.direto)
                    nota = r0(x);
                else {
                    const am = [];
                    for (let k = Math.max(0, i - 252); k < i; k++) {
                        const v = d.valor(k);
                        if (isFinite(v))
                            am.push(v);
                    }
                    const p = percentil(am, x);
                    nota = p == null ? null : d.inverte ? 100 - p : p;
                }
            }
            return { id: d.id, nome: d.nome, nota, leitura: isFinite(x) ? d.leitura(x) : 'sem dado' };
        });
        const ok = comps.filter((c) => c.nota != null);
        hist.push({ i, v: ok.length >= 3 ? r0(ok.reduce((s, c) => s + c.nota, 0) / ok.length) : null, comps });
    }
    return hist;
}
const pct = (x, d = 1) => (x * 100).toFixed(d).replace('.', ',') + '%';
const num = (x, d = 1) => x.toFixed(d).replace('.', ',');
/** B3: momento do Ibovespa, força (RSI), volatilidade, posição na faixa de 52 semanas e porto seguro (Ibovespa × dólar). */
export function indiceB3(ibov, dolar, dias = 30) {
    const c = ibov.c, h = ibov.h || c, l = ibov.l || c, usd = alinha(ibov, dolar);
    const defs = [
        { id: 'momento', nome: 'Momento (Ibovespa × média de 125 dias)', valor: (i) => { const m = sma(c, 125, i); return m ? c[i] / m - 1 : NaN; }, leitura: (v) => `${v >= 0 ? '+' : ''}${pct(v)} da média` },
        { id: 'forca', nome: 'Força (RSI 14)', valor: (i) => rsi(c, i) ?? NaN, direto: true, leitura: (v) => 'RSI ' + num(v, 0) },
        { id: 'vol', nome: 'Volatilidade (20 dias)', valor: (i) => vol(c, i), inverte: true, leitura: (v) => pct(v) + ' ao ano' },
        { id: 'faixa', nome: 'Posição na faixa de 52 semanas', valor: (i) => { if (i < 20)
                return NaN; const a = Math.max(0, i - 251), mx = Math.max(...h.slice(a, i + 1)), mn = Math.min(...l.slice(a, i + 1)); return mx > mn ? ((c[i] - mn) / (mx - mn)) * 100 : NaN; }, direto: true, leitura: (v) => num(v, 0) + '% da faixa' },
        ...(usd ? [{ id: 'porto', nome: 'Porto seguro (Ibovespa × dólar em 20 dias)', valor: (i) => ret(c, i, 20) - ret(usd, i, 20), leitura: (v) => `${v >= 0 ? '+' : ''}${pct(v)} a favor da bolsa` }] : []),
    ];
    return fecha(indice(defs, c.length, dias), ibov.t);
}
/** EUA (cálculo próprio, reserva quando a CNN não responde): S&P 500, VIX, RSI, faixa, ações × Treasuries e high yield × Treasuries. */
export function indiceEUA(spx, vix, tlt, hyg, ief, dias = 30) {
    const c = spx.c, h = spx.h || c, l = spx.l || c, V = alinha(spx, vix), T = alinha(spx, tlt), H = alinha(spx, hyg), I = alinha(spx, ief);
    const defs = [
        { id: 'momento', nome: 'Momento (S&P 500 × média de 125 dias)', valor: (i) => { const m = sma(c, 125, i); return m ? c[i] / m - 1 : NaN; }, leitura: (v) => `${v >= 0 ? '+' : ''}${pct(v)} da média` },
        { id: 'forca', nome: 'Força (RSI 14)', valor: (i) => rsi(c, i) ?? NaN, direto: true, leitura: (v) => 'RSI ' + num(v, 0) },
        { id: 'faixa', nome: 'Posição na faixa de 52 semanas', valor: (i) => { if (i < 20)
                return NaN; const a = Math.max(0, i - 251), mx = Math.max(...h.slice(a, i + 1)), mn = Math.min(...l.slice(a, i + 1)); return mx > mn ? ((c[i] - mn) / (mx - mn)) * 100 : NaN; }, direto: true, leitura: (v) => num(v, 0) + '% da faixa' },
        ...(V ? [{ id: 'vix', nome: 'Volatilidade (VIX)', valor: (i) => V[i], inverte: true, leitura: (v) => 'VIX ' + num(v) }] : []),
        ...(T ? [{ id: 'porto', nome: 'Porto seguro (ações × Treasuries em 20 dias)', valor: (i) => ret(c, i, 20) - ret(T, i, 20), leitura: (v) => `${v >= 0 ? '+' : ''}${pct(v)} a favor das ações` }] : []),
        ...(H && I ? [{ id: 'junk', nome: 'Apetite por risco (high yield × Treasuries)', valor: (i) => ret(H, i, 20) - ret(I, i, 20), leitura: (v) => `${v >= 0 ? '+' : ''}${pct(v, 2)} em 20 dias` }] : []),
    ];
    return fecha(indice(defs, c.length, dias), spx.t);
}
function fecha(h, t) {
    const u = h[h.length - 1], val = (k) => { const x = h[h.length - 1 - k]; return x ? x.v : null; };
    return { valor: u ? u.v : null, rotulo: rotulo(u ? u.v : null), data: u ? t[u.i] : null, componentes: u ? u.comps : [], ontem: val(1), semana: val(5), mes: val(21), hist: h.map((x) => ({ d: t[x.i], v: x.v })) };
}
/** Lê a resposta do Yahoo (chart) em séries diárias. */
export function serieYahoo(j) {
    const r = j?.chart?.result?.[0], ts = r?.timestamp || [], q = r?.indicators?.quote?.[0] || {};
    const out = { t: [], c: [], h: [], l: [] };
    ts.forEach((x, i) => { const c = q.close?.[i], h = q.high?.[i], l = q.low?.[i]; if (typeof c === 'number' && c > 0) {
        out.t.push(new Date(x * 1000 - 3 * 3600e3).toISOString().slice(0, 10));
        out.c.push(c);
        out.h.push(typeof h === 'number' ? h : c);
        out.l.push(typeof l === 'number' ? l : c);
    } });
    return out.c.length ? out : null;
}
/** alternative.me (cripto) → formato comum. */
export function lerCripto(j) {
    const d = Array.isArray(j?.data) ? j.data : [];
    const pts = d.map((x) => ({ d: new Date(+x.timestamp * 1000).toISOString().slice(0, 10), v: +x.value })).filter((x) => isFinite(x.v)).reverse();
    if (!pts.length)
        return null;
    const u = pts[pts.length - 1], k = (n) => (pts[pts.length - 1 - n] ? pts[pts.length - 1 - n].v : null);
    return { valor: u.v, rotulo: rotulo(u.v), data: u.d, ontem: k(1), semana: k(7), mes: k(30), hist: pts.slice(-30), componentes: [] };
}
/** CNN (EUA) → formato comum. */
export function lerCNN(j) {
    const f = j?.fear_and_greed, h = j?.fear_and_greed_historical?.data;
    if (!f || !isFinite(+f.score))
        return null;
    const pts = (Array.isArray(h) ? h : []).map((x) => ({ d: new Date(+x.x).toISOString().slice(0, 10), v: Math.round(+x.y) })).filter((x) => isFinite(x.v));
    const ult = new Map();
    pts.forEach((p) => ult.set(p.d, p.v));
    const comp = (k, nome) => { const x = j?.[k]; return x && isFinite(+x.score) ? { id: k, nome, nota: Math.round(+x.score), leitura: String(x.rating || '') } : null; };
    const comps = [comp('market_momentum_sp500', 'Momento do S&P 500'), comp('stock_price_strength', 'Força das ações (máximas × mínimas)'), comp('stock_price_breadth', 'Amplitude (volume em alta × baixa)'), comp('put_call_options', 'Opções put/call'), comp('market_volatility_vix', 'Volatilidade (VIX)'), comp('safe_haven_demand', 'Porto seguro'), comp('junk_bond_demand', 'Apetite por high yield')].filter(Boolean);
    const v = Math.round(+f.score);
    return { valor: v, rotulo: rotulo(v), data: f.timestamp ? String(f.timestamp).slice(0, 10) : null, ontem: isFinite(+f.previous_close) ? Math.round(+f.previous_close) : null, semana: isFinite(+f.previous_1_week) ? Math.round(+f.previous_1_week) : null, mes: isFinite(+f.previous_1_month) ? Math.round(+f.previous_1_month) : null, hist: [...ult.entries()].map(([d, v]) => ({ d, v })).slice(-30), componentes: comps };
}
// ===== segurança =====
// seguranca.ts — login obrigatório, limite de uso por pessoa e comparação de segredo em tempo constante.
// Copiado em cada função (cada função do Supabase é publicada sozinha). Testes em seguranca.test.ts.
// ===== coleta na borda =====
const UA_DADOS='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
export async function coletarAgenda(fetcher=fetch,agora=Date.now(),desloc=0){
  const {de,ate}=janelaSemana(agora,desloc);
  const u=`https://economic-calendar.tradingview.com/events?from=${encodeURIComponent(de)}&to=${encodeURIComponent(ate)}&countries=${AG_PAISES.join(',')}`;
  const r=await fetcher(u,{headers:{'User-Agent':UA_DADOS,Accept:'application/json',Origin:'https://www.tradingview.com',Referer:'https://www.tradingview.com/'},signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw Error('Calendário do TradingView respondeu '+r.status);
  const eventos=normalizaAgenda(await r.json(),de,ate);
  if(eventos.length<2)throw Error('Agenda vazia');
  return {de,ate,eventos,em:new Date(agora).toISOString(),fonte:'TradingView',borda:true};
}
async function yahooSerie(fetcher,sym){
  try{const r=await fetcher(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=2y&interval=1d`,{headers:{'User-Agent':UA_DADOS},signal:AbortSignal.timeout(12000)});
    return r.ok?serieYahoo(await r.json()):null;}catch{return null;}
}
async function getJson(fetcher,url,headers={}){
  const r=await fetcher(url,{headers:{'User-Agent':UA_DADOS,Accept:'application/json',...headers},signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw Error(String(r.status));return r.json();
}
export async function coletarSentimento(fetcher=fetch,agora=Date.now()){
  const erros=[];
  const [ibov,usd,spx,vix,tlt,hyg,ief]=await Promise.all(['^BVSP','BRL=X','^GSPC','^VIX','TLT','HYG','IEF'].map(s=>yahooSerie(fetcher,s)));
  const b3=ibov?{...indiceB3(ibov,usd),fonte:'Cálculo do app (Ibovespa e dólar, Yahoo Finance)'}:null;
  if(!b3)erros.push('B3: Yahoo sem dados');
  let eua=null;
  try{const de=new Date(agora-40*864e5).toISOString().slice(0,10);
    const c=lerCNN(await getJson(fetcher,`https://production.dataviz.cnn.io/index/fearandgreed/graphdata/${de}`,{Referer:'https://edition.cnn.com/',Origin:'https://edition.cnn.com'}));
    if(c)eua={...c,fonte:'CNN Fear & Greed'};}catch(e){erros.push('CNN: '+e.message);}
  if(!eua&&spx)eua={...indiceEUA(spx,vix,tlt,hyg,ief),fonte:'Cálculo do app (S&P 500, VIX, Treasuries e high yield; a CNN não respondeu)'};
  let cripto=null;
  try{const c=lerCripto(await getJson(fetcher,'https://api.alternative.me/fng/?limit=31'));if(c)cripto={...c,fonte:'alternative.me'};}catch(e){erros.push('Cripto: '+e.message);}
  if(!b3&&!eua&&!cripto)throw Error('Sentimento sem fontes: '+erros.join('; '));
  return {b3,eua,cripto,gerado:new Date(agora).toISOString(),erros,borda:true};
}
/* Frequência: agenda a cada 30 min em dia útil (06h–22h) e a cada 3 h no resto; sentimento a cada 30 min
   em dia útil (09h–19h) e a cada 6 h no resto. Uma coleta serve todos os usuários. */
export function agendaAgora(date){const b=globalThis.DiarioSessoes.local(+date,'America/Sao_Paulo');
  return b.weekend||b.minute<360||b.minute>=1320?b.minute%180===0:b.minute%30===0;}
export function sentimentoAgora(date){const b=globalThis.DiarioSessoes.local(+date,'America/Sao_Paulo');
  return b.weekend||b.minute<540||b.minute>=1140?b.minute%360===0:b.minute%30===0;}
