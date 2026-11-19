/* v790 — Binance Spot miniTicker: stream público apenas na aba Técnico EUA & Cripto.
 * 1 WebSocket agregado, no máximo 4 pares; sem JWT, secrets, Supabase ou polling.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DiarioBinanceAnalises=api.create({contract:root.DiarioFeedContrato});
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 const allow=new Set(['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT']);
 const host='wss://stream.binance.com:9443/stream?streams=';
 function create({contract,WebSocketImpl=root.WebSocket}={}){
  let socket=null,connected=false,closedByApp=true,latest=new Map(),pairs=[];
  function start(requested=['BTCUSDT','ETHUSDT']){
   if(typeof WebSocketImpl!=='function'||!contract?.quote)return false;
   const next=[...new Set(requested)].filter(s=>allow.has(s)).slice(0,4);
   if(!next.length)return false;
   if(socket&&pairs.join(',')===next.join(','))return true;
   stop();closedByApp=false;pairs=next;
   try{
    const url=host+next.map(s=>s.toLowerCase()+'@miniTicker').join('/');
    const ws=new WebSocketImpl(url);socket=ws;
    ws.onopen=()=>{if(socket===ws)connected=true};
    ws.onmessage=e=>{
     if(socket!==ws||typeof e?.data!=='string'||e.data.length>3000)return;
     let data=null;
     try{const msg=JSON.parse(e.data);data=msg?.data||msg}catch{return}
     if(data?.e!=='24hrMiniTicker'||!allow.has(data.s)||!pairs.includes(data.s))return;
     const price=Number(data.c),open=Number(data.o),timestamp=Number(data.E);
     if(!Number.isFinite(price)||price<=0||!Number.isFinite(open)||open<=0)return;
     const quote=contract.quote({market:'CRYPTO',source:'binance',ticker:data.s,
      price,change_pct:(price/open-1)*100,timestamp});
     if(quote.valid)latest.set(data.s,{ticker:data.s,price,open,timestamp});
    };
    ws.onerror=()=>{if(socket===ws)connected=false};
    ws.onclose=()=>{if(socket===ws){connected=false;socket=null}};
    return true;
   }catch{socket=null;connected=false;return false}
  }
  function stop(){
   closedByApp=true;connected=false;
   const ws=socket;socket=null;pairs=[];
   if(ws){ws.onopen=null;ws.onmessage=null;ws.onerror=null;ws.onclose=null;try{ws.close()}catch{}}
  }
  function get(ticker){
   const tk=contract?.ticker?.(ticker,'CRYPTO'),d=tk?latest.get(tk):null;
   if(!d)return null;
   const q=contract.quote({market:'CRYPTO',source:'binance',
    ticker:tk,price:d.price,timestamp:d.timestamp,change_pct:(d.price/d.open-1)*100});
   return q.valid?q:null;
  }
  function status(){return {connected,active:!!socket,pairs:[...pairs],closedByApp};
  }
  return Object.freeze({start,stop,get,status});
 }
 return Object.freeze({create,VERSION:'v790'});
});
