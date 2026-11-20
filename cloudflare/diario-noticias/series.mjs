/* v823 — Séries do Banco Central (SGS) na Cloudflare (gerado de supabase/functions/series/index.ts, só a parte de dados). */
                                                                                                      
const SERIES                      = {
  selic:      { sgs: 432,   nome: 'Selic meta',               unidade: '% a.a.', freq: 'diaria', passo: true },
  cdi:        { sgs: 4389,  nome: 'CDI anualizado',           unidade: '% a.a.', freq: 'diaria', passo: true },
  ipca:       { sgs: 433,   nome: 'IPCA mensal',              unidade: '% no mês', freq: 'mensal' },
  ipca12:     { sgs: 13522, nome: 'IPCA 12 meses',            unidade: '%',      freq: 'mensal' },
  igpm:       { sgs: 189,   nome: 'IGP-M mensal',             unidade: '% no mês', freq: 'mensal' },
  ibcbr:      { sgs: 24364, nome: 'IBC-Br (dessazonalizado)', unidade: 'índice', freq: 'mensal' },
  desemprego: { sgs: 24369, nome: 'Desemprego (PNAD)',        unidade: '%',      freq: 'mensal' },
  ptax:       { sgs: 1,     nome: 'Dólar PTAX (venda)',       unidade: 'R$',     freq: 'diaria' },
};
// ===== Banco Central =====
const UA = 'Mozilla/5.0 (compatible; diario-trader/1.0)';
const cache = new Map                                    ();
const fmt = (d      ) => `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
const epoch = (br        ) => { const [d, m, y] = String(br).split('/'); const t = Date.UTC(+y, +m - 1, +d, 15) / 1000; return Number.isFinite(t) ? t : NaN; };

async function serie(def     , desde        )                      {
  const hoje = new Date(), partes                 = [];
  // a API do SGS aceita no máximo 10 anos por pedido
  for (let y = desde; y <= hoje.getUTCFullYear(); y += 9) partes.push([new Date(Date.UTC(y, 0, 1)), new Date(Math.min(Date.UTC(y + 8, 11, 31), hoje.getTime()))]);
  const blocos = await Promise.all(partes.map(async ([a, b]) => {
    const r = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${def.sgs}/dados?formato=json&dataInicial=${fmt(a)}&dataFinal=${fmt(b)}`, { headers: { Accept: 'application/json', 'User-Agent': UA }, signal: AbortSignal.timeout(20_000) });
    if (r.status === 404) return [];
    if (!r.ok) throw new Error('Banco Central: série ' + def.sgs + ' respondeu ' + r.status);
    const j = await r.json();
    return (Array.isArray(j) ? j : []).map((x     ) => [epoch(x.data), parseFloat(String(x.valor).replace(',', '.'))]);
  }));
  const agora = Date.now() / 1000 + 86400;
  let pts = blocos.flat().filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]) && p[0] <= agora).sort((a, b) => a[0] - b[0]);
  // remove datas repetidas
  pts = pts.filter((p, i, a) => i === a.length - 1 || a[i + 1][0] !== p[0]);
  // séries em degrau (Selic, CDI): guarda só as mudanças e o último ponto
  if (def.passo) pts = pts.filter((p, i, a) => i === 0 || i === a.length - 1 || p[1] !== a[i - 1][1]);
  return pts.slice(-4000);
}

export async function seriePublica(id,desdeIn){
  const def=SERIES[String(id||'').toLowerCase().slice(0,20)];
  if(!def)return {status:400,body:{error:'Série não disponível.',disponiveis:Object.keys(SERIES)}};
  const ano=new Date().getUTCFullYear(),desde=Math.max(2000,Math.min(ano,Math.trunc(+desdeIn||ano-5)));
  const pontos=await serie(def,desde);
  if(!pontos.length)return {status:404,body:{error:'O Banco Central não retornou dados para essa série.'}};
  return {status:200,body:{serie:String(id).toLowerCase(),sgs:def.sgs,nome:def.nome,unidade:def.unidade,freq:def.freq,fonte:'Banco Central do Brasil (SGS)',consultadoEm:new Date().toISOString(),pontos}};
}
