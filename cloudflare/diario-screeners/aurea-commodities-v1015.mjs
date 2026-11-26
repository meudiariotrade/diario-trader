// v1015 — especialização por commodity; fonte existente, sem novas APIs.
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const map=[
 ['BRENT',/\bbrent\b/,'energia','petróleo Brent','ICEEUR:BRN1!'],
 ['WTI',/\bwti\b/,'energia','petróleo WTI','NYMEX:CL1!'],
 ['NG',/\b(gas natural|henry hub)\b/,'energia','gás natural','NYMEX:NG1!'],
 ['FEF',/\b(minerio|iron ore)\b/,'industrial','minério Singapura','SGX:FEF1!'],
 ['DCE',/\b(dalian|dce)\b/,'industrial','minério Dalian','DCE:I1!'],
 ['OURO',/\b(ouro|gold|xauusd)\b/,'precioso','ouro','TVC:GOLD'],
 ['PRATA',/\b(prata|silver|xagusd)\b/,'precioso','prata','TVC:SILVER'],
 ['COBRE',/\b(cobre|copper)\b/,'industrial','cobre','COMEX:HG1!'],
 ['SOJA',/\b(soja|soybeans?)\b/,'agricola','soja','CBOT:ZS1!'],
 ['MILHO',/\b(milho|corn)\b/,'agricola','milho','CBOT:ZC1!'],
 ['TRIGO',/\b(trigo|wheat)\b/,'agricola','trigo','CBOT:ZW1!'],
 ['CAFÉ',/\b(cafe|coffee)\b/,'agricola','café','ICEUS:KC1!'],
 ['AÇÚCAR',/\b(acucar|sugar)\b/,'agricola','açúcar','ICEUS:SB1!'],
 ['ALGODÃO',/\b(algodao|cotton)\b/,'agricola','algodão','ICEUS:CT1!'],
 ['BOI',/\b(boi vivo|live cattle|boi gordo)\b/,'pecuaria','boi vivo Chicago','CME:LE1!']
];
const rules={energia:['Oferta OPEP+ e não OPEP, estoques EIA, demanda, refino e transporte','Curva de futuros, sazonalidade e riscos de abastecimento'],precioso:['Juros reais, USD, fluxos de ETFs e reservas de bancos centrais','Proteção em cenários de estresse, sem presumir correlação constante'],industrial:['China, atividade industrial, estoques, produção e custos marginais','Qualidade do minério, praça, unidade, moeda e frete'],agricola:['Safra, clima, estoques, exportações e calendário de colheita','USDA/Conab quando fornecidos, base local e câmbio'],pecuaria:['Ciclo pecuário, oferta de animais, custo de ração, demanda e exportação','Chicago não equivale ao boi gordo B3; explicitar base e moeda']};
export function alvosCommoditiesV1015(q){
 const n=norm(q),general=/\b(commodit(?:y|ies|ies|es)|commodities|commodit)\b/.test(n);
 const out=map.filter(x=>x[1].test(n));
 if(/\b(petroleo|crude oil|oil)\b/.test(n)&&!out.some(x=>['BRENT','WTI'].includes(x[0])))out.unshift(...map.slice(0,2));
 if(general&&!out.length)return map;
 return out;
}
const number=x=>typeof x==='number'&&Number.isFinite(x);
const str=(x,n)=>typeof x==='string'?x.slice(0,n):'';
function time(x,now){let t=typeof x==='number'?(x<1e11?x*1000:x):typeof x==='string'?Date.parse(x):NaN;return Number.isFinite(t)&&t>946684800000&&t<=now+60000?t:null}
export function normalizarCommoditiesV1015(q,data,now=Date.now()){
 const rows=Array.isArray(data?.itens)?data.itens:[],targets=alvosCommoditiesV1015(q);
 return targets.map(([id,rx,grupo,nome,symbol])=>{
  const row=rows.find(x=>x?.c===id&&x.s===symbol),p=row&&number(row.px)&&row.px>0?row:null;
  const t=time(p?.horarioPreco,now),valid=p&&t&&now-t<=7*86400000;
  return {id,nome,grupo,criterios:rules[grupo],cotacao:valid?{preco:p.px,unidade:str(p.un,32),simbolo:symbol,contrato:str(p.simboloFonte,45)||symbol,fonte:str(p.fonte,60)||'TradingView',data:new Date(t).toISOString(),defasada:now-t>900000,modo:str(p.modoAtualizacao,40)||'não confirmado',variacao_pct:number(p.d1)?p.d1:null,base_variacao:str(p.baseVariacao,60)||'não confirmada'}:null,lacunas:['Oferta, demanda, estoques, curva, notícias e sazonalidade exigem dados datados; não foram inferidos da cotação','Cotação isolada não confirma tendência ou níveis técnicos; solicitar série OHLC ou gráfico',...(valid?[]:['Cotação com símbolo e horário de origem não confirmados'])]};
 });
}
export async function carregarCommoditiesV1015(q,fetcher=fetch){
 if(!alvosCommoditiesV1015(q).length)return [];
 try{const r=await fetcher('https://diario-trader.lucianosilva43567.workers.dev/v1/macro?modo=cotacoes&aba=cmd',{method:'GET',redirect:'error',signal:AbortSignal.timeout(8000),headers:{Accept:'application/json'}});if(r.ok)return normalizarCommoditiesV1015(q,await r.json())}catch{}
 return normalizarCommoditiesV1015(q,null);
}
export const PROTOCOLO_COMMODITIES_V1015='Commodities: Schwartz é líder macro (oferta/demanda, estoques, produção, consumo, curva, sazonalidade, calendário); Dalio trata ciclo, China, geopolítica, dólar e juros reais; Livermore só define níveis e tendência se houver OHLC/gráfico, não inventa suporte ou pivô. Diferencie spot, futuro contínuo e vencimento, moeda/unidade e praça, Brent/WTI e SGX/Dalian; não troque a referência. Diferencie fatos datados, hipóteses, lacunas; estoques EIA, OPEP, USDA, Conab, China e clima são fatores a investigar, não fatos atuais sem fonte. Forneça tese, mecanismo causal, cenários de alta/base/baixa, gatilhos, invalidação e implicações condicionais para setores e ativos BR/EUA, sem ordem de compra/venda. Não use cotação sem horário como atual, nem variação sem base confirmada. Se perfil ausente, análise conceitual e condicional. Não invente números; tabelas do app contêm referências.';
