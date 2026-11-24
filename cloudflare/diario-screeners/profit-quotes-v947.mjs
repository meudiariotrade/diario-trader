import {autenticarUsuario} from './auth-jwks-v924.mjs';
const LIMIT=160000, MAX=250, TTL=7*86400000;
const ORIGIN='https://meudiariotrade.github.io';
const HEAD={'Cache-Control':'private, no-store, max-age=0','Vary':'Origin','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Max-Age':'600'};
const json=(v,status=200)=>Response.json(v,{status,headers:HEAD});
const ticker=/^[A-Z0-9]{1,20}$/;
export function negocio(row,now=Date.now()){
 const d=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(row?.dat||'').trim()),h=/^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(row?.hor||'').trim());
 if(!d||!h||+h[1]>23||+h[2]>59||+(h[3]||0)>59)return null;
 const local=Date.UTC(+d[3],+d[2]-1,+d[1],+h[1],+h[2],+(h[3]||0)),check=new Date(local),t=local+10800000;
 return check.getUTCFullYear()===+d[3]&&check.getUTCMonth()===+d[2]-1&&check.getUTCDate()===+d[1]&&t<=now+60000&&t>=now-TTL?t:null;
}
export function validarLote(body,now=Date.now()){
 if(!body||!Number.isSafeInteger(body.sent_at)||Math.abs(now-body.sent_at)>60000||!Array.isArray(body.cotacoes)||body.cotacoes.length<1||body.cotacoes.length>MAX)return null;
 const rows=[];
 for(const r of body.cotacoes){
  const tk=String(r?.ticker||'').toUpperCase();
  if(!ticker.test(tk)||typeof r.ult!=='number'||!Number.isFinite(r.ult)||r.ult<=0||r.ult>1e12||negocio(r,now)===null)continue;
  const o={ticker:tk,ult:r.ult,dat:String(r.dat).trim(),hor:String(r.hor).trim(),updated_at:new Date(now).toISOString()};
  for(const k of ['var','abe','max','min','neg','fec'])if(typeof r[k]==='number'&&Number.isFinite(r[k])&&Math.abs(r[k])<=1e12)o[k]=r[k];
  rows.push(o);
 }
 return rows.length?{sent_at:body.sent_at,cotacoes:rows}:null;
}
export function mesclar(old,rows,now=Date.now()){
 const map=new Map();
 for(const r of [...(old||[]),...rows]){
  const t=negocio(r,now);if(t===null)continue;
  const p=map.get(r.ticker);
  if(!p||t>=p.t)map.set(r.ticker,{r,t});
 }
 return [...map.values()].sort((a,b)=>b.t-a.t).slice(0,MAX).map(x=>x.r);
}
async function bounded(request){
 const n=Number(request.headers.get('content-length')||0);
 if(n>LIMIT||!request.body)throw Error('tamanho');
 const reader=request.body.getReader();let size=0;const chunks=[];
 try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>LIMIT){await reader.cancel();throw Error('tamanho')}chunks.push(value)}}finally{reader.releaseLock()}
 const data=new Uint8Array(size);let pos=0;for(const c of chunks){data.set(c,pos);pos+=c.length}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));
}
// Um objeto SQLite privado por sub autenticado. A transação de leitura e escrita é síncrona.
export class ProfitQuotesV947{
 constructor(state){this.sql=state.storage.sql;this.sql.exec('CREATE TABLE IF NOT EXISTS snapshot (id INTEGER PRIMARY KEY, sent_at INTEGER NOT NULL, received_at INTEGER NOT NULL, rows_json TEXT NOT NULL)')}
 async fetch(req){
  const now=Date.now(),p=this.sql.exec('SELECT sent_at, received_at, rows_json FROM snapshot WHERE id=1').toArray()[0];
  if(req.method==='GET'){
   if(!p||now-p.received_at>TTL)return json({ok:false},404);
   return json({ok:true,received_at:new Date(p.received_at).toISOString(),cotacoes:JSON.parse(p.rows_json).filter(r=>negocio(r,now)!==null)});
  }
  if(req.method!=='POST')return json({ok:false},405);
  let body;try{body=await bounded(req)}catch{return json({ok:false},400)}
  const batch=validarLote(body,Date.now());if(!batch)return json({ok:false},400);
  // Releitura após await: uma escrita concorrente pode ter acontecido.
  const prev=this.sql.exec('SELECT sent_at, received_at, rows_json FROM snapshot WHERE id=1').toArray()[0],at=Date.now();
  if(prev&&batch.sent_at<=prev.sent_at)return json({ok:false,error:'replay'},409);
  if(prev&&at-prev.received_at<1000)return json({ok:false,error:'frequencia'},429);
  const rows=mesclar(prev?JSON.parse(prev.rows_json):[],batch.cotacoes,at);
  this.sql.exec('INSERT INTO snapshot (id,sent_at,received_at,rows_json) VALUES (1,?,?,?) ON CONFLICT(id) DO UPDATE SET sent_at=excluded.sent_at,received_at=excluded.received_at,rows_json=excluded.rows_json',batch.sent_at,at,JSON.stringify(rows));
  return json({ok:true,accepted:batch.cotacoes.length});
 }
}
export async function profitQuotes(request,env){
 const origin=request.headers.get('Origin');
 if(origin&&origin!==ORIGIN)return json({ok:false},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:HEAD});
 if(!['GET','POST'].includes(request.method))return json({ok:false},405);
 if(new URL(request.url).search)return json({ok:false},400);
 let uid;try{uid=await autenticarUsuario(env,request)}catch{return json({ok:false},503)}
 if(!uid)return json({ok:false},401);
 if(!env.PROFIT_QUOTES)return json({ok:false},503);
 // O corpo e o caminho nunca escolhem o proprietário.
 const stub=env.PROFIT_QUOTES.get(env.PROFIT_QUOTES.idFromName(uid));
 try{return await stub.fetch('https://profit.internal/snapshot',{method:request.method,headers:{'content-type':'application/json',...(request.headers.has('content-length')?{'content-length':request.headers.get('content-length')}: {})},...(request.method==='POST'?{body:request.body}: {})})}
 catch{return json({ok:false},503)}
}
