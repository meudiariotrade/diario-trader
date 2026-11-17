const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const src = fs.readFileSync('supabase/functions/rotina-cron/index.ts','utf8');
test('rotina cron aceita compatibilidade apenas com segredo verificado',()=>{
  assert.match(src,/async function credencialCronValida\(req: Request\): Promise<boolean>/);
  assert.match(src,/if \(!recebido\) return false/);
  assert.match(src,/rpc\/diario_agendamento_chave/);
  assert.match(src,/typeof esperado === 'string' && iguais\(recebido, esperado\)/);
  assert.match(src,/if \(!\(await credencialCronValida\(req\)\)\) return out\(\{ error: 'Não autorizado' \}, 401\)/);
});
test('rotina de fechamento deduplica e nao refaz verificacoes a cada minuto',()=>{
  assert.match(src,/rotina_fechamento_pendentes/);
  assert.match(src,/push_log\?select=chave/);
  assert.match(src,/if \(j\?\.length\)/);
  assert.doesNotMatch(src,/setInterval\(/);
});
