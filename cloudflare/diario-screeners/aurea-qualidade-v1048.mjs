// v1048 — Qualidade dos pareceres da Áurea.
// Em vez de apagar o parágrafo inteiro quando há um número, confere cada número com os dados
// que a própria Áurea recebeu (dossiê técnico, fundamentos, simulações). Só o número sem
// lastro é substituído; o raciocínio é preservado.

const NUM_RX=/(?<![\w.,])-?\d{1,3}(?:\.\d{3})+(?:,\d+)?(?![\w])|(?<![\w.,])-?\d+(?:[.,]\d+)?(?![\w])/g;
const lerNumero=s=>{
 const t=String(s);
 const n=/^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(t)?t.replace(/\./g,'').replace(',','.'):t.replace(',','.');
 return Number(n);
};
export function numerosDaFonteV1048(fonte){
 const out=[];
 for(const m of String(fonte||'').matchAll(NUM_RX)){const n=lerNumero(m[0]);if(Number.isFinite(n))out.push(n);}
 return out;
}
const PERIODOS=new Set([5,9,10,14,20,21,50,100,200,252]);
export function conferirNumerosV1048(texto,fonte){
 const s=typeof texto==='string'?texto.trim():'';
 if(!s)return s;
 const base=Array.isArray(fonte)?fonte:numerosDaFonteV1048(fonte);
 return s.replace(NUM_RX,(m,off,full)=>{
  const n=lerNumero(m);if(!Number.isFinite(n))return m;
  const antes=full.slice(Math.max(0,off-4),off);
  if(/(?:MM|IFR|RSI|ATR|EMA|SMA)\s?$/i.test(antes))return m; // MM200, IFR14
  if(Number.isInteger(n)&&n>=1990&&n<=2100)return m; // ano
  if(Number.isInteger(n)&&Math.abs(n)<=12)return m; // contagens curtas
  if(PERIODOS.has(Math.abs(n))&&/\b(dias?|barras?|per[ií]odos?|semanas?|sess[õo]es|preg[õo]es)/i.test(full.slice(off,off+14)))return m;
  const a=Math.abs(n);
  const inteiro=!/[.,]\d{1,2}$/.test(m)||/^\d{1,3}(?:\.\d{3})+$/.test(m);
  const ok=base.some(b=>{const d=Math.abs(Math.abs(b)-a);return d<=Math.max(inteiro?.5:.051,Math.abs(b)*.01);});
  return ok?m:'(nº não conferido)';
 });
}

export const PROTOCOLO_EDITORIAL_V1057=' COMUNICAÇÃO EDITORIAL OBRIGATÓRIA: conduza toda análise no fluxo natural Fato relevante → interpretação → consequência → condição de confirmação ou invalidação, sem rótulos mecânicos repetitivos. Nunca mencione nomes de provedores ou fontes de cotação (Yahoo, TradingView, Brapi, Finnhub, Binance, Cloudflare, Twelve Data, Sina, Profit), modelos de IA (Gemini, Groq, Mistral, OpenRouter, IA gratuita), siglas OHLC/OHLCV, SHA-256, versões de fórmula, mesa proprietária ou avisos burocráticos.';

export const PROTOCOLO_VEREDITO_V1048=' VEREDITO OBRIGATÓRIO: responda primeiro à pergunta real do usuário (ex.: "vale a pena comprar put de PETR4?") em resultado.veredito: {"decisao":"favoravel|desfavoravel|aguardar|inconclusivo","texto":"2 frases diretas: o que fazer agora e por quê, citando preço, tendência e nível dos Dados","direcao":"alta|baixa|lateral|null","gatilho_preco":numero ou null,"invalidacao_preco":numero ou null}. gatilho_preco e invalidacao_preco só com níveis presentes nos Dados (suportes, resistências, pivôs, médias). Use os NÚMEROS do DOSSIÊ TÉCNICO e dos dados fornecidos como fatos: cite preço, médias, IFR, ATR, volatilidade histórica, suportes e resistências; não invente outros números. Opções: compare volatilidade histórica com a implícita só se a implícita for fornecida; sem ela, diga que a decisão depende dela e qual faixa tornaria a put cara. Quando houver leitura de OBV × pivôs, use-a: rompimento com o OBV rompendo o OBV do mesmo pivô mostra força; sem isso, trate como rompimento fraco. Considere theta (perda de valor com o tempo), prazo até o vencimento e distância do strike ao suporte mais próximo. Sem notação R; fale em R$, % ou "vezes o risco".'+PROTOCOLO_EDITORIAL_V1057;

export function normalizarVereditoV1048(raw,fonte){
 if(!raw||typeof raw!=='object')return null;
 const decisao=['favoravel','desfavoravel','aguardar','inconclusivo'].includes(raw.decisao)?raw.decisao:null;
 const texto=conferirNumerosV1048(typeof raw.texto==='string'?raw.texto.slice(0,600):'',fonte);
 if(!decisao||texto.length<15)return null;
 const base=numerosDaFonteV1048(fonte);
 const preco=x=>{const n=Number(x);return Number.isFinite(n)&&n>0&&base.some(b=>Math.abs(b-n)<=Math.max(.051,b*.005))?n:null;};
 return {decisao,texto,direcao:['alta','baixa','lateral'].includes(raw.direcao)?raw.direcao:null,gatilho_preco:preco(raw.gatilho_preco),invalidacao_preco:preco(raw.invalidacao_preco)};
}
