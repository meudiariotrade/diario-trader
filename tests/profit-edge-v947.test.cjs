'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const mod=()=>import('../cloudflare/diario-screeners/profit-quotes-v947.mjs');
const now=Date.parse('2026-11-24T15:00:00Z');
const row={ticker:'PETR4',ult:41.30,dat:'24/11/2026',hor:'11:59:59',var:0.3};
test('lote privado preserva negócio, não aceita reenvio com relógio inválido ou campo de usuário',async()=>{
 const {validarLote}=await mod();
 const b=validarLote({sent_at:now,cotacoes:[{...row,user_id:'outro',updated_at:'inventado'}]},now);
 assert.equal(b.cotacoes[0].dat,row.dat);assert.equal(b.cotacoes[0].hor,row.hor);
 assert.equal(b.cotacoes[0].updated_at,new Date(now).toISOString());assert.equal(b.cotacoes[0].user_id,undefined);
 assert.equal(validarLote({sent_at:now-61000,cotacoes:[row]},now),null);
 assert.equal(validarLote({sent_at:now,cotacoes:[{...row,dat:'31/11/2026'}]},now),null);
 assert.equal(validarLote({sent_at:now,cotacoes:[{...row,hor:null}]},now),null);
});
test('merge não permite substituir negócio novo por fechamento velho',async()=>{
 const {mesclar}=await mod();
 const rows=mesclar([row],[{...row,ult:10,hor:'09:00:00'},{...row,ticker:'VALE3'}],now);
 assert.equal(rows.find(x=>x.ticker==='PETR4').ult,41.3);assert.equal(rows.length,2);
});
test('rota sem autenticação não abre objeto, dados nunca entram no cache público',async()=>{
 const {profitQuotes}=await mod();
 const env={PROFIT_QUOTES:{idFromName(){throw Error('não deve acessar objeto')}}};
 const res=await profitQuotes(new Request('https://worker.test/v1/profit-quotes'),env);
 assert.equal(res.status,401);assert.match(res.headers.get('cache-control'),/private.*no-store/);
 const invalid=await profitQuotes(new Request('https://worker.test/v1/profit-quotes',{headers:{Origin:'https://outro.test'}}),env);
 assert.equal(invalid.status,403);
});
test('roteamento usa sub JWT autenticado, não aceita proprietário arbitrário',async()=>{
 const {profitQuotes}=await mod();
 const key=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 const jwk=await crypto.subtle.exportKey('jwk',key.publicKey);
 Object.assign(jwk,{kid:'test-v947',alg:'ES256',use:'sig'});
 const origin='https://test-project.supabase.co';
 const uid='12345678-1234-1234-1234-123456789abc';
 const b64=x=>Buffer.from(x).toString('base64url');
 const data=b64(JSON.stringify({alg:'ES256',kid:jwk.kid}))+'.'+b64(JSON.stringify({sub:uid,iss:origin+'/auth/v1',aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+600}));
 const sig=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key.privateKey,new TextEncoder().encode(data));
 const auth='Bearer '+data+'.'+b64(sig);
 let selected;
 const env={SUPABASE_URL:origin,SUPABASE_PUBLIC_JWKS:JSON.stringify({keys:[jwk]}),PROFIT_QUOTES:{idFromName(x){selected=x;return x},get(){return {fetch:async()=>new Response('ok')}}}};
 assert.equal((await profitQuotes(new Request('https://worker.test/v1/profit-quotes',{headers:{Authorization:auth}}),env)).status,200);
 assert.equal(selected,uid);
 selected=null;
 assert.equal((await profitQuotes(new Request('https://worker.test/v1/profit-quotes?user_id=other',{headers:{Authorization:auth}}),env)).status,400);
 assert.equal(selected,null);
});

test('PWA prioriza Cloudflare, preserva a reserva e não consulta Supabase em segundos',async()=>{
 const fs=require('node:fs'),vm=require('node:vm');
 const source=fs.readFileSync('profit-cotacoes-v552.js','utf8');
 let tick=Date.parse('2026-11-24T15:00:00Z'),edgeCalls=0,supa=0,healthy=true;
 class Clock extends Date{constructor(...args){super(...(args.length?args:[tick]))}static now(){return tick}}
 const doc={hidden:true,body:{},addEventListener(){},querySelector(){return null}};
 const c={window:null,document:doc,Date:Clock,AbortSignal,AbortController,URL,SESS:{uid:'A',at:'token'},CQ:{pf:{},saved:{},pfTs:0,cloudTs:0},codFut:x=>x+'Z26',cqPonte:async()=>{},cqPinta(){},MutationObserver:class{observe(){}},requestAnimationFrame(){},tab:'live',MKT:{tab:'cq'},
 fetch:async()=>{edgeCalls++;return {ok:healthy,json:async()=>({ok:true,received_at:new Date(tick).toISOString(),cotacoes:[{...row,updated_at:new Date(tick).toISOString()}]})}},
 rq:async()=>{supa++;return {json:async()=>[{...row,ult:25,hor:'11:00:00',updated_at:new Date(tick).toISOString()}]}}};
 c.window=c;vm.createContext(c);vm.runInContext(source,c);
 await c.cqPonte();assert.equal(c.CQ.pf.PETR4.px,41.30);assert.equal(supa,0);
 await c.cqPonte();assert.equal(edgeCalls,1);
 tick+=5000;await c.cqPonte();assert.equal(edgeCalls,2);assert.equal(supa,0);
 healthy=false;tick+=5000;await c.cqPonte();assert.equal(supa,1);assert.equal(c.CQ.saved.PETR4.px,41.30);assert.equal(c.CQ.pf.PETR4,undefined);
 tick+=5000;await c.cqPonte();assert.equal(supa,1);assert.equal(edgeCalls,3);
});
