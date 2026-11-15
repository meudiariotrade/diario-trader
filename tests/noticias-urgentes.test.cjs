const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs=require('node:fs');
const {stripTypeScriptTypes}=require('node:module');
const p='supabase/functions/notificar/noticias-urgentes.ts';
async function modulo(){
 const src=stripTypeScriptTypes(fs.readFileSync(p,'utf8'));
 return import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
}
test('filtro exclui conteúdo pessoal, mantém impactos e remove sufixo editorial',async()=>{
 const m=await modulo();
 assert.equal(m.limparTitulo('Fed anuncia decisão (Reuters)'), 'Fed anuncia decisão');
 assert.equal(m.urgente('Fed anuncia nova decisão sobre juros e o dólar'),true);
 assert.equal(m.urgente('Moneyist: My wife wants Fed shares to pay for wedding'),false);
 assert.equal(m.urgente('Horoscope and Bitcoin predictions for lovers'),false);
 assert.equal(m.urgente('Moda e viagens nas férias'),false);
});
test('RSS com CDATA conserva a URL, data e título limpo',async()=>{
 const m=await modulo();
 const s='<rss><channel><item><title><![CDATA[Petrobras anuncia reajuste (Reuters)]]></title><link>https://example.com/petrobras</link><pubDate>Mon, 16 Nov 2026 12:59:00 GMT</pubDate></item></channel></rss>';
 const l=m.parseRss(s,'Reuters');assert.equal(l.length,1);
 assert.equal(l[0].titulo,'Petrobras anuncia reajuste');assert.equal(l[0].fonte,'Reuters');assert.equal(l[0].url,'https://example.com/petrobras');
});
test('5 min no pregão, 15 min domingo e fora do horário',async()=>{
 const m=await modulo();
 assert.equal(m.ritmo(new Date('2026-11-16T13:00:00Z')).minutos,5);
 assert.equal(m.ritmo(new Date('2026-11-15T13:05:00Z')).minutos,15);
 assert.equal(m.ritmo(new Date('2026-11-15T13:05:00Z')).executar,false);
 assert.equal(m.ritmo(new Date('2026-11-15T13:15:00Z')).executar,true);
});
test('deduplicação por conta persiste entre dois ciclos e todas as fontes são paralelas',async()=>{
 const m=await modulo(),oldFetch=global.fetch,oldDeno=global.Deno;
 const agora=new Date('2026-11-16T13:00:00Z'),timestamp=Math.floor(agora.getTime()/1000);
 const rss='<rss><item><title>Fed announces a new interest rate decision (Reuters)</title><link>https://example.com/fed</link><pubDate>Mon, 16 Nov 2026 12:59:00 GMT</pubDate></item></rss>';
 const armazenadas=new Set();let enviados=0;
 global.Deno={env:{get:()=>''}};
 global.fetch=async url=>({ok:true,text:async()=>rss,json:async()=>[{headline:'Fed announces a new interest rate decision',url:'https://example.com/fed',datetime:timestamp-60}]});
 const db={
  rpc:async()=>({data:'token-servidor'}),
  from:(tab)=>{
   if(tab==='push_subs')return {select:()=>({limit:async()=>({data:[{id:'a',user_id:'u',sub:{},prefs:{}}],error:null})})};
   if(tab==='noticias_urgentes_notificadas')return {upsert:(row)=>({select:async()=>{
    const k=row.user_id+'|'+row.noticia_hash;
    if(armazenadas.has(k))return {data:[],error:null};
    armazenadas.add(k);return {data:[{noticia_hash:row.noticia_hash}],error:null};
   }})};
   throw Error('tabela inesperada: '+tab);
  }
 };
 try{
  const op={db,agora,enviar:async()=>{enviados++;return true}};
  const r1=await m.monitorarNoticias(op),r2=await m.monitorarNoticias(op);
  assert.equal(r1.novas,1);assert.equal(r1.enviados,1);
  assert.equal(r2.novas,0);assert.equal(enviados,1);
  assert.ok(r1.origens>=10);
 }finally{global.fetch=oldFetch;global.Deno=oldDeno}
});
