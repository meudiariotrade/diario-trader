/* Linha do tempo de eventos públicos; nunca recebe carteira, watchlist ou tokens privados. */
const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const banned = new Set('de da do das dos e a o as os em no na nos nas por para com que apos sobre sob um uma ao aos diz segundo afirma mercado acao acoes bolsa hoje agora nova novo nesta deste este esta mais menos alta baixa sobe caem cai avanca recua brasil eua estados unidos'.split(' '));
const words = value => new Set(norm(value).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !banned.has(w)));
const toDate = value => Number.isFinite(Date.parse(value || '')) ? Date.parse(value) : 0;
const safe = value => String(value || '').slice(0, 240);
export function tickersAfetados(title, cat) {
  const value = ' ' + norm(title).replace(/[^a-z0-9]/g, ' ') + ' ';
  const match = re => re.test(value);
  const direct = new Set();
  const indirect = new Set();
  for (const [name, re] of [
    ['PETR4', /\b(petr4|petr3|petrobras|pbr)\b/], ['VALE3', /\b(vale3|vale|iron ore|minerio)\b/],
    ['ITUB4', /\b(itub4|itau unibanco)\b/], ['BBDC4', /\b(bbdc4|bradesco)\b/],
    ['AAPL', /\baapl|apple\b/], ['MSFT', /\bmsft|microsoft\b/],
  ]) if (match(re)) direct.add(name);
  if (cat === 'petroleo' && match(/\b(brent|wti|petroleo|opep|opec)\b/)) indirect.add('PETR4');
  if (cat === 'minerio') indirect.add('VALE3');
  if (cat === 'petroleo' || cat === 'minerio' || cat === 'politica_economica') indirect.add('WIN');
  if (cat === 'politica_economica' && match(/\b(cpi|fed|fomc|payroll|ipca|copom|selic|juros|inflacao|treasury|dolar)\b/)) indirect.add('WDO');
  if (cat === 'politica_economica' && match(/\b(copom|selic|ipca|inflacao)\b/)) indirect.add('DI');
  for (const ticker of direct) indirect.delete(ticker);
  return {diretos:[...direct],hipoteses:[...indirect]};
}
function score(a,b) {
  const x=words(a),y=words(b),shared=[...x].filter(t=>y.has(t)).length;
  return shared<2 ? 0 : shared / Math.max(1,new Set([...x,...y]).size);
}
function idStable(title,stamp) {
  let h=2166136261;for(const ch of norm(title)+'|'+new Date(stamp).toISOString().slice(0,10)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
  return 'evt-'+(h>>>0).toString(16);
}
function prioridade(title,tema,fonte) {
  const n=norm(title);
  if (/\b(fato relevante|material fact|8 k|earnings|balanco|resultado trimestral|cpi|fomc|copom|payroll|decisao do fed)\b/.test(n)) return 'alta';
  if (fonte==='SEC' || fonte==='CVM') return 'alta';
  return tema==='politica_economica'?'media':'normal';
}
function fonteValida(item) {
  return item && typeof item.l==='string' && /^https:\/\//.test(item.l) && toDate(item.d)>0;
}
export function agruparEventos(itens=[], anteriores=[], agora=Date.now()) {
  const eventos = Array.isArray(anteriores) ? anteriores.filter(e => e && e.id && e.titulo && toDate(e.ultimaAtualizacao)>agora-48*3600000 && toDate(e.ultimaAtualizacao)<=agora+300000).slice(0,75).map(e => ({
    id:safe(e.id),titulo:safe(e.titulo),tema:safe(e.tema),prioridade:safe(e.prioridade),
    primeiraPublicacao:e.primeiraPublicacao,ultimaAtualizacao:e.ultimaAtualizacao,
    fontes:Array.isArray(e.fontes)?e.fontes.slice(-8).filter(f=>f&&f.url&&f.publicadoEm):[],
    tickers:Array.isArray(e.tickers)?e.tickers.slice(0,12):[],
    relacoes:e.relacoes||{diretos:[],hipoteses:[]},
  })) : [];
  const sorted=(Array.isArray(itens)?itens:[]).filter(fonteValida).filter(x=>toDate(x.d)>=agora-48*3600000 && toDate(x.d)<=agora+300000).sort((a,b)=>toDate(a.d)-toDate(b.d));
  for (const item of sorted) {
    let e=eventos.find(v=>v.fontes.some(f=>f.url===item.l));
    if(!e) {
      e=eventos.find(v=>v.tema===item.tema && Math.abs(toDate(v.ultimaAtualizacao)-toDate(item.d))<=10*3600000 && score(v.titulo,item.t)>=0.64);
    }
    if (!e) {
      const relation=tickersAfetados(item.t,item.tema);
      e={id:idStable(item.t,toDate(item.d)),titulo:safe(item.t),tema:safe(item.tema),
        prioridade:prioridade(item.t,item.tema,item.fonte),
        primeiraPublicacao:item.d,ultimaAtualizacao:item.d,fontes:[],tickers:[...relation.diretos,...relation.hipoteses],
        relacoes:relation};
      eventos.push(e);
    }
    if (!e.fontes.some(f=>f.url===item.l)) {
      e.fontes.push({nome:safe(item.fonte),url:item.l,publicadoEm:item.d});
      e.fontes=e.fontes.slice(-8);
    }
    if (toDate(item.d)>toDate(e.ultimaAtualizacao)) {
      e.ultimaAtualizacao=item.d;
      if(e.fontes.length>1)e.titulo=safe(item.t);
    }
    const rel=tickersAfetados(item.t,item.tema);
    e.relacoes={diretos:[...new Set([...(e.relacoes?.diretos||[]),...rel.diretos])].slice(0,12),
      hipoteses:[...new Set([...(e.relacoes?.hipoteses||[]),...rel.hipoteses])].filter(t=>!rel.diretos.includes(t)).slice(0,12)};
    e.tickers=[...new Set([...e.relacoes.diretos,...e.relacoes.hipoteses])].slice(0,15);
    if(prioridade(item.t,item.tema,item.fonte)==='alta')e.prioridade='alta';
  }
  return eventos.sort((a,b)=>toDate(b.ultimaAtualizacao)-toDate(a.ultimaAtualizacao)).slice(0,65)
    .map(e=>({...e,quantidadeFontes:e.fontes.length,nota:'Canais de impacto são hipóteses econômicas, não causalidade demonstrada.'}));
}
