const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('supabase/functions/email-semana/index.ts','utf8');
const i=source.indexOf('function semana()'),j=source.indexOf('const b64 =',i);
assert.ok(i>=0&&j>i);
const expression=source.slice(i,j)+'\nsemana()';
function periodo(relogio){
  const instante=Date.parse(relogio);
  class AgoraFixo extends Date { static now(){ return instante; } }
  return Array.from(vm.runInNewContext(expression,{Date:AgoraFixo}));
}
test('período termina no domingo anterior, não no sábado',()=>{
  assert.deepEqual(periodo('2026-11-17T15:00:00Z'),['2026-11-09','2026-11-15']);
});
test('segunda 00 UTC é domingo 21h em Brasília, com semana encerrando neste domingo',()=>{
  assert.deepEqual(periodo('2026-11-23T00:00:00Z'),['2026-11-16','2026-11-22']);
});
test('sábado não antecipa fechamento da semana em andamento',()=>{
  assert.deepEqual(periodo('2026-11-21T15:00:00Z'),['2026-11-09','2026-11-15']);
});
test('domingo à noite é a data fim correta',()=>{
  assert.deepEqual(periodo('2026-11-22T23:00:00Z'),['2026-11-16','2026-11-22']);
});
