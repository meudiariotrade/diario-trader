/* Retomada de cotações: snapshot datado primeiro, streaming em seguida. */
(() => {
 'use strict';let last=0,pending=null;
 function symbols(){const cfg=window.TRM?.TS?.()||{},rows=S.cart?.lanc||[];return [...new Set([...(cfg.mon||[]).filter(s=>/^[A-Z.]{1,8}$/.test(s)&&!['WINFUT','WDOFUT','INDFUT','DOLFUT','BTC','ETH','SOL','IBOV','DXY','BRENT','WTI','OURO','PRATA','COBRE'].includes(s)),...rows.filter(r=>r.mk==='US').map(r=>r.tk),'EWZ','PBR','VALE','ITUB','BBD'])].slice(0,40)}
 function sockets(force=false){
  const api=window.TRM,t=api?.TR;if(!api||window.DIARIO_DEMO)return;if(!SESS?.at){t.fhAuto=[];api.trFinnhub([]);return}if(document.hidden||navigator.onLine===false)return;
  if(t.fh?.readyState===0&&Date.now()-(t.fhStarted||0)>15000)t.fh.close();
  t.fhAuto=symbols();api.trFinnhub(t.fhAuto);api.trBinance(['btcusdt','ethusdt'],'auto');
 }
 function seed(response){
  const api=window.TRM,t=api?.TR;if(!t||!response?.payload?.data||Date.now()-Date.parse(response.fetched_at)>15*60000)return;
  const rows=response.payload.data.map(r=>{const a=r.d||[];return {s:r.s,n:a[0]||r.s,px:typeof a[1]==='number'&&a[1]>0?a[1]:null,d1:a[2],dabs:a[3],atraso:true,moeda:a[5],horarioPreco:typeof a[6]==='number'&&a[6]>0&&a[6]<=Date.now()/1000+60?new Date(a[6]*1000).toISOString():null,fonte:'TradingView',coletaServidor:response.fetched_at,baseVariacao:'Referência diária do provedor',snapshot:true}});
  const match=tk=>{const key=String(tk).toUpperCase(),aliases={IBOV:'BMFBOVESPA:IBOV',SPX:'TVC:SPX',DXY:'TVC:DXY',BRENT:'TVC:UKOIL',WTI:'TVC:USOIL',OURO:'TVC:GOLD'};return rows.find(r=>r.s===(aliases[key]||key)||r.s.endsWith(':'+key))};
  const lists=[api.TS().mon||[],...rows.map(r=>[r.s.split(':')[1]])];
  for(const list of lists){if(!list.length)continue;const key='cot|'+JSON.stringify({s:list}),old=t.dados[key],at=Date.parse(response.fetched_at);if(old&&old.ts>=at)continue;t.dados[key]={ts:at,v:{em:response.fetched_at,fonte:'TradingView · coleta no servidor (snapshot)',itens:list.map(tk=>({...match(tk),pedido:tk,px:match(tk)?.px??null}))}};
 }
 }
 async function refresh(force=false){
  sockets(force);if(window.DIARIO_DEMO||document.hidden||navigator.onLine===false||!SESS?.at||pending||Date.now()-last<(force?2000:60000))return;
  last=Date.now();const owner=SESS.uid;
  pending=(async()=>{
   try{const r=await rq('/rest/v1/mercado_cache?id=eq.quotes&select=payload,fetched_at');const a=await r.json();if(SESS?.uid!==owner||document.hidden)return;seed(a[0]);if(tab==='term')render()}catch{/* cache auxiliar indisponível não interrompe as fontes principais */}
   if(SESS?.uid!==owner||document.hidden)return;
   await Promise.allSettled([window.TRM.trFn('cot',{s:window.TRM.TS().mon||[]},15000)]);
   if(SESS?.uid===owner&&!document.hidden&&tab==='term')render();
  })().finally(()=>pending=null);return pending;
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh(true);else{clearTimeout(window.TR?.fhRetry);try{window.TR?.fh?.close();window.TR?.ws?.close()}catch{}}});
 window.addEventListener('pageshow',()=>refresh(true));window.addEventListener('online',()=>refresh(true));
 window.TraderUI.onRender('cotacoes-conexao',()=>refresh());
 setInterval(()=>{sockets();refresh()},15000);
 window.QuoteConnection={refresh,sockets,seed};refresh(true);
})();
