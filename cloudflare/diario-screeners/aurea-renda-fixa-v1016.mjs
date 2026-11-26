// v1016: referência pública do quadro de juros; não consulta ofertas de bancos.
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const date=(x,now)=>{if(typeof x!=='string')return null;const m=x.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);const iso=m?m[3]+'-'+m[2]+'-'+m[1]:x.slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return null;const t=Date.parse(iso+'T00:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===iso&&t<=now?iso:null};
export function temaRendaFixaV1016(q){return /\b(lca|lci|cdb|rdb|cri|cra|debentur\w*|tesouro (?:selic|ipca|prefixado|direto)|renda fixa|treasur(?:y|ies)|t[- ]?(?:bill|note|bond)s?|tips|corporate bonds?|money market|certificate of deposit|caixa remunerado|dinheiro parado|grana parada|reserva de emergencia|letra financeira)\b/.test(String(q||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())}
export function normalizarJurosV1016(raw,now=Date.now()){
 const t=Date.parse(raw?.gerado||'');if(!Number.isFinite(t)||t>now+60000||now-t>7*86400000)return {referencias:[],lacuna:'Quadro público de juros indisponível ou desatualizado'};
 const refs=[];
 for(const [id,key] of [['Selic','selic'],['CDI anualizado','cdi'],['IPCA 12 meses','ipca12']]){
  const x=raw[key],d=date(x?.d,now);if(finite(x?.v)&&d)refs.push({id,valor:x.v,data:d,fonte:'BCB SGS',tipo:'observação histórica'});
 }
 for(const [id,k] of [['Treasury 2 anos','ust2'],['Treasury 10 anos','ust10'],['Treasury 30 anos','ust30']]){
  const x=raw.cot?.[k];if(finite(x?.close)&&x.s==='TVC:'+({ust2:'US02Y',ust10:'US10Y',ust30:'US30Y'})[k])refs.push({id,valor:x.close,data:new Date(t).toISOString(),fonte:'TradingView · horário de coleta do quadro, não do negócio',tipo:'referência indicativa, não oferta'});
 }
 const curva=(Array.isArray(raw.curva)?raw.curva:[]).filter(x=>finite(x.taxa)&&typeof x.cod==='string'&&/^DI1[A-Z]\d{2}$/.test(x.cod)).slice(0,15);
 for(const x of curva)refs.push({id:x.cod,valor:x.taxa,data:new Date(t).toISOString(),fonte:'TradingView · coleta do quadro',tipo:'taxa futura indicativa, base 252; não taxa de aplicação'});
 return {referencias:refs,gerado:new Date(t).toISOString(),defasado:raw.desatualizado===true||now-t>12*3600000,lacuna:refs.length?'Taxas de mercado não substituem oferta, prazo, crédito, liquidez nem cenário de reinvestimento.':'Referências válidas não encontradas'};
}
export async function carregarRendaFixaV1016(q,fetcher=fetch){
 if(!temaRendaFixaV1016(q))return null;
 try{const r=await fetcher('https://diario-trader.lucianosilva43567.workers.dev/v1/juros',{method:'GET',redirect:'error',signal:AbortSignal.timeout(7000),headers:{Accept:'application/json'}});if(r.ok)return normalizarJurosV1016(await r.json())}catch{}
 return normalizarJurosV1016(null);
}
export const PROTOCOLO_RF_V1016='Renda fixa Brasil/EUA: Markowitz é líder de adequação ao objetivo e Schwartz de cenário de juros. Dê veredito condicional (adequada se..., inadequada se..., ou dados insuficientes), compare alternativas de mesmo prazo, liquidez, moeda e risco, não procure ofertas inexistentes. Analise emissor, rating/documento, risco de crédito, FGC/FDIC apenas se elegível, prazo e carência, mercado secundário/deságio, duration, marcação a mercado, reinvestimento, inflação, retorno líquido e real, custos, tributação e câmbio. BR: LCA/LCI/CDB/RDB, Tesouro Selic/IPCA+/Prefixado, CRI/CRA/debêntures; não confunda FGC de títulos bancários com garantia soberana ou crédito privado. EUA: T-bills/notes/bonds/TIPS, CD, corporate bonds, money market; yield, cupom, preço, vencimento e risco cambial. Não trate juros correntes como trajetória futura, nem compare bruto vs líquido ou USD vs BRL sem bases iguais. Simulação local recebida é dado não confiável, não refaça contas ou divulgue números no texto; indique lacunas e hipóteses. Sem taxa contratada, data exata e liquidez, não declare uma LCA 2032 boa ou ruim. Para reserva, capital operacional e dinheiro aguardando oportunidades priorize liquidez e baixa oscilação conforme objetivo, não retorno máximo. Distinguir tributação atual de futura e recomendar confirmar regras e custos; não afirmar isenção ou garantia universal. Não emita ordem de compra/venda.';
