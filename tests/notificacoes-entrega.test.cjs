const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const url = 'data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(fs.readFileSync('supabase/functions/notificar/entrega.ts','utf8'))).toString('base64');
function banco() { const calls = []; return { calls, rpc: async (fn,p) => { calls.push({fn,p}); return {data:fn==='push_reservar'?{reservado:true,lease:'lease-a'}:true}; }, from: () => ({delete: () => ({eq: async () => {calls.push({fn:'delete'})}})}) }; }
test('confirma enviado depois da aceitação e guarda falha transitória para retentar',async () => {
  const { entregar } = await import(url), db = banco(), row = {id:'a',sub:{}};
  await entregar(db,async()=>{assert.equal(db.calls.length,1)},row,{},'evento');
  assert.equal(db.calls[1].p.p_ok,true);
  db.calls.length = 0;
  assert.equal(await entregar(db,async()=>{throw Object.assign(new Error('indisponível'),{statusCode:503})},row,{},'evento'),false);
  assert.equal(db.calls[1].p.p_ok,false); assert.equal(db.calls[1].p.p_invalida,false);
});
test('reserva já ocupada impede envio concorrente e 410 cancela a inscrição',async () => {
  const { entregar } = await import(url), db = banco(); let n = 0;
  const ocupado={...db,rpc:async()=>({data:{reservado:false}})};
  assert.equal(await entregar(ocupado,async()=>n++,{id:'a'}, {}, 'evento'),false); assert.equal(n,0);
  await entregar(db,async()=>{throw {statusCode:410,message:'expirado'}},{id:'a'}, {},'evento');
  assert.ok(db.calls.some(c=>c.fn==='delete')); assert.equal(db.calls.at(-1).p.p_invalida,true);
});
