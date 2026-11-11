// Estudos históricos em índices dos EUA. Não usa dados pessoais nem produz sinais.
export type UsPoint = { d: string; v: number };
type Observation = { ano: number; valor: number; de: string; ate: string; fechamento_inicial: number; fechamento_final: number; tipo?: string; eleicao?: string };
const INSTRUMENTS = [
  { k: 'spx', n: 'S&P 500', ticker: '^GSPC' },
  { k: 'ndx', n: 'Nasdaq 100', ticker: '^NDX' },
  { k: 'dji', n: 'Dow Jones', ticker: '^DJI' },
  { k: 'rut', n: 'Russell 2000', ticker: '^RUT' },
];
export const US_WINDOWS = [
  { k: 'antes1', nome: 'Pregão anterior · D-2 a D-1', de: -2, ate: -1 },
  { k: 'dia0', nome: 'Dia da eleição · D-1 a D0', de: -1, ate: 0 },
  { k: 'antes5', nome: '5 pregões até a eleição', de: -5, ate: 0 },
  { k: 'antes21', nome: '21 pregões até a eleição', de: -21, ate: 0 },
  { k: 'antes', nome: '63 pregões até a eleição', de: -63, ate: 0 },
  { k: 'd1', nome: '1 pregão depois', de: 0, ate: 1 },
  { k: 'd5', nome: '5 pregões depois', de: 0, ate: 5 },
  { k: 'd21', nome: '21 pregões depois', de: 0, ate: 21 },
  { k: 'd63', nome: '63 pregões depois', de: 0, ate: 63 },
  { k: 'd126', nome: '126 pregões depois', de: 0, ate: 126 },
  { k: 'd252', nome: '252 pregões depois', de: 0, ate: 252 },
];
export const electionDate = (year: number) => {
  const first = new Date(Date.UTC(year, 10, 1));
  const day = 1 + (8 - first.getUTCDay()) % 7 + 1;
  return `${year}-11-${String(day).padStart(2, '0')}`;
};
export function usStats(rows: Observation[]) {
  const values = rows.map(row => row.valor).sort((a,b) => a-b), n = values.length;
  if (!n) return { n: 0, media: null, mediana: null, positivas: null, melhor: null, pior: null, desvio: null, observacoes: [] };
  const mean = values.reduce((a,b) => a+b,0)/n;
  return { n, media: mean, mediana: (values[Math.floor((n-1)/2)]+values[Math.floor(n/2)])/2,
    positivas: values.filter(x=>x>0).length/n*100, melhor: values[n-1], pior: values[0],
    desvio: n>1 ? Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/(n-1)) : null, observacoes: rows };
}
const daysBetween = (a: string,b: string) => (Date.parse(b)-Date.parse(a))/86400000;
export function usStudy(input: UsPoint[], today: string) {
  const unique = new Map<string,number>();
  input.forEach(p=>{if (/^\d{4}-\d{2}-\d{2}$/.test(p.d) && p.d<today && Number.isFinite(p.v) && p.v>0) unique.set(p.d,p.v)});
  const points = [...unique].sort(([a],[b])=>a.localeCompare(b)).map(([d,v])=>({d,v}));
  const dateIndex=new Map(points.map((point,index)=>[point.d,index]));
  const months = new Map<string,number[]>(), years = new Map<number,number[]>();
  points.forEach((p,i)=>{const m=p.d.slice(0,7), y=+p.d.slice(0,4);if(!months.has(m))months.set(m,[]);months.get(m)!.push(i);if(!years.has(y))years.set(y,[]);years.get(y)!.push(i)});
  const ret = (a: number,b: number,year: number): Observation => ({ano:year,valor:(points[b].v/points[a].v-1)*100,de:points[a].d,ate:points[b].d,fechamento_inicial:points[a].v,fechamento_final:points[b].v});
  const monthly: Observation[][] = Array.from({length:12},()=>[]);
  const annual: Observation[][] = Array.from({length:4},()=>[]);
  for(const [month,idx] of months) {
    if(month>=today.slice(0,7)||month<'1950-01'||idx.length<15||idx[0]===0)continue;
    const first=idx[0],last=idx[idx.length-1],prev=points[first-1];
    const [y,m]=month.split('-').map(Number);
    const expectedPrev=new Date(Date.UTC(y,m-1,0)).toISOString().slice(0,10);
    const expectedLast=new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);
    if(Math.abs(daysBetween(prev.d,expectedPrev))>7||Math.abs(daysBetween(points[last].d,expectedLast))>7)continue;
    monthly[m-1].push(ret(first-1,last,y));
  }
  for(const [y,idx] of years) {
    if(y<1950||y>=+today.slice(0,4)||idx.length<200||idx[0]===0)continue;
    const first=idx[0],last=idx[idx.length-1];
    if(Math.abs(daysBetween(points[first-1].d,`${y-1}-12-31`))>7||Math.abs(daysBetween(points[last].d,`${y}-12-31`))>7)continue;
    annual[(y-1)%4].push(ret(first-1,last,y));
  }
  const catalog = [];
  for(let year=1950;year<=+today.slice(0,4);year+=2) {
    const date=electionDate(year),exact=dateIndex.get(date)??-1,firstAfter=points.findIndex(p=>p.d>date);
    const previousIndex=exact>=0?exact-1:firstAfter>=0?firstAfter-1:points.length-1;
    const baseIndex=exact>=0?exact:previousIndex;
    const previous=points[previousIndex]||null,day=exact>=0?points[exact]:null,after=firstAfter>=0?points[firstAfter]:null,beforePrevious=points[previousIndex-1]||null;
    const usable=baseIndex>=0&&points[baseIndex].d<=date&&daysBetween(points[baseIndex].d,date)<=7;
    const daily=(from:UsPoint|null,to:UsPoint|null)=>from&&to&&daysBetween(from.d,to.d)<=7?(to.v/from.v-1)*100:null;
    catalog.push({ano:year,tipo:year%4===2?'midterm':'presidencial',data:date,concluida:date<today&&usable,base:usable?points[baseIndex]:null,
      anterior:usable?previous:null,dia:day,seguinte:usable?after:null,variacao_anterior:usable?daily(beforePrevious,previous):null,variacao_dia:daily(previous,day),variacao_seguinte:usable?daily(points[baseIndex],after):null});
  }
  const eventStudy = (type:string) => US_WINDOWS.map(window=>{
    const rows: Observation[]=[];
    for(const event of catalog.filter(e=>e.concluida&&(type==='todas'||e.tipo===type))) {
      let anchor=dateIndex.get(event.base!.d)??-1;
      if(window.k==='dia0'&&!event.dia)continue;
      if(window.k==='antes1')anchor=(dateIndex.get(event.anterior!.d)??-1)+1;
      const a=anchor+window.de,b=anchor+window.ate;
      if(a<0||b>=points.length)continue;
      let complete=true;for(let i=a+1;i<=b;i++)if(daysBetween(points[i-1].d,points[i].d)>7){complete=false;break}
      if(complete)rows.push({...ret(a,b,event.ano),tipo:event.tipo,eleicao:event.data});
    }
    return {...window,...usStats(rows)};
  });
  const events=eventStudy('midterm');
  return {de:points[0]?.d||null,ate:points[points.length-1]?.d||null,pontos:points.length,
    mensal:monthly.map((rows,i)=>({mes:i+1,...usStats(rows)})),
    ciclo:annual.map((rows,i)=>({fase:i+1,nome:['Pós-presidencial','Midterm','Pré-presidencial','Presidencial'][i],...usStats(rows)})),
    midterms:events,eleicoes:{midterm:events,presidencial:eventStudy('presidencial'),todas:eventStudy('todas')},catalogo:catalog};
}
async function usHistory(ticker: string): Promise<UsPoint[]> {
  let lastError: unknown;
  for(const origin of ['query1','query2']) {
    try {
      const url=`https://${origin}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?period1=${Math.floor(Date.UTC(1949,11,1)/1000)}&period2=${Math.floor(Date.now()/1000)}&interval=1d`;
      const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw new Error(`Histórico ${ticker}: HTTP ${response.status}`);
      const result=(await response.json())?.chart?.result?.[0];
      const stamps:number[]=result?.timestamp||[], prices:(number|null)[]=result?.indicators?.adjclose?.[0]?.adjclose||result?.indicators?.quote?.[0]?.close||[];
      const format=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
      const out=stamps.map((t,i)=>({d:format.format(new Date(t*1000)),v:prices[i] as number})).filter(p=>Number.isFinite(p.v)&&p.v>0);
      if(out.length<1000)throw new Error(`Histórico insuficiente para ${ticker}`);
      return out;
    }catch(error){lastError=error}
  }
  throw lastError;
}
let cached: { day:string;ts:number;value:unknown }|null=null;
let pending: Promise<unknown>|null=null;
export async function sazonalidadeUs() {
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if(cached?.day===today&&Date.now()-cached.ts<12*3600000)return cached.value;
  if(pending)return pending;
  pending=(async()=>{
    const results=await Promise.all(INSTRUMENTS.map(async asset=>{
      try{return {...asset,status:'ok',...usStudy(await usHistory(asset.ticker),today)}}
      catch(error){return {...asset,status:'error',erro:String((error as Error)?.message||error)}}
    }));
    if(!results.some(x=>x.status==='ok'))throw new Error('Históricos dos EUA indisponíveis. Tente novamente mais tarde.');
    const value={versao:'v285',gerado:new Date().toISOString(),hoje:today,ativos:results,
      proxima_midterm:Array.from({length:5},(_,i)=>+today.slice(0,4)+i).filter(y=>y%4===2).map(electionDate).find(d=>d>=today)||null,
      metodo:'Retornos percentuais dos índices em USD, sem custos, dividendos reinvestidos ou conversão cambial. Busca desde 1950, conforme disponibilidade real de cada índice; séries antigas podem ser retrospectivas do provedor e a composição muda ao longo do tempo. Meses e anos completos. O dia atual é excluído. Ciclo presidencial por ano civil; eleições em pregões a partir do fechamento do dia da eleição ou da última sessão anterior se não houve pregão em D0. D0 sem cotação não é preenchido. Janelas incompletas são excluídas. D-1 é o último pregão antes da eleição, D0 é o dia da eleição e D+1 o seguinte. A variação de D-1 usa D-2 como base. Não há classificação por partido vencedor nem inferência causal.',
      fontes:[{nome:'Yahoo Finance — séries históricas dos índices',url:'https://finance.yahoo.com/'},{nome:'FEC — calendário eleitoral',url:'https://www.fec.gov/introduction-campaign-finance/election-results-and-voting-information/'}]};
    // Falhas parciais recebem cache curto para recuperar índices ausentes.
    if(results.every(x=>x.status==='ok'))cached={day:today,ts:Date.now(),value};
    return value;
  })();
  try{return await pending}finally{pending=null}
}
