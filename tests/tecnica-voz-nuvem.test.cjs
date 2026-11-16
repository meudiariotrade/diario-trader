const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const src=fs.readFileSync(path.join(__dirname,'../src/studies/tecnica-voz.js'),'utf8');
const flush=()=>new Promise(resolve=>setTimeout(resolve,25));
function setup(fetcher) {
 const dom=new JSDOM('<div id="tp-root"><p data-tp-dict-status></p><textarea data-tp-dictionary></textarea></div>',{url:'https://example.test/',runScripts:'dangerously'});
 const w=dom.window;
 w.SESS={uid:'11111111-1111-4111-8111-111111111111',at:'token-a'};
 w.TecnicaPratica={escape:s=>s};
 w.cfg=()=>({url:'https://example.supabase.co',key:'public-key'});
 w.tok=async()=>{};
 w.fetch=fetcher;
 w.eval(src);
 return w;
}
test('glossário: salva na conta e envia para Supabase sem exportar JSON',async()=>{
 const requests=[];
 const w=setup(async(url,opt={})=>{requests.push({url:String(url),method:opt.method||'GET',body:opt.body,headers:opt.headers});return {ok:true,json:async()=>[]};});
 w.DiarioVoz.save({XYZ:'xis especial'});
 await flush();
 const sent=requests.find(x=>x.method==='POST');
 assert.ok(sent,'envio do dicionário pendente');
 assert.equal(JSON.parse(sent.body).user_id,w.SESS.uid);
 assert.equal(JSON.parse(sent.body).termos.XYZ,'xis especial');
 assert.equal(sent.headers.Authorization,'Bearer token-a');
 assert.equal(w.localStorage.getItem('diario:voz:pendente:v668:'+w.SESS.uid),null);
 w.close();
});
test('glossário: erro de rede preserva pendência e reenvia ao reconectar',async()=>{
 let offline=true,posts=0;
 const w=setup(async(url,opt={})=>{
  if(offline)throw Error('offline');
  if(opt.method==='POST')posts++;
  return {ok:true,json:async()=>[]};
 });
 const uid=w.SESS.uid;
 w.DiarioVoz.save({OCO:'pronúncia nova'});
 await flush();
 assert.equal(w.localStorage.getItem('diario:voz:pendente:v668:'+uid),'1');
 offline=false;
 w.dispatchEvent(new w.Event('online'));
 await flush();
 assert.equal(posts,1);
 assert.equal(w.localStorage.getItem('diario:voz:pendente:v668:'+uid),null);
 w.close();
});
test('glossário: download não contamina outra conta',async()=>{
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 const w=setup(async()=>({ok:true,json:async()=>[{user_id:a,termos:{XYZ:'segredo da conta a'},revisao:1}]}));
 w.SESS={uid:b,at:'token-b'};
 w.TecnicaPratica.voiceControls();
 await flush();
 assert.equal(w.DiarioVoz.dictionary().XYZ,undefined);
 assert.equal(w.localStorage.getItem('diario:voz:glossario:v1:'+b),null);
 w.close();
});
