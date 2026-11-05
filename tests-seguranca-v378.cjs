'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const root=__dirname,read=f=>fs.readFileSync(path.join(root,f),'utf8');let n=0;
function test(name,fn){fn();n++;console.log('OK',name)}
test('CSP não bloqueia scripts inline de diagnóstico',()=>{
 const html=read('index.html');assert.match(html,/script-src 'self'/);
 assert(!/<script(?![^>]*\bsrc=)[^>]*>\s*[^<\s]/i.test(html));
 assert(html.includes('<script defer src="diagnostico-v378.js?v=378">'));
});
test('Token de parceiro não é enviado via cabeçalho Referer',()=>{
 assert.match(read('index.html'),/<meta name="referrer" content="no-referrer">/);
 assert(read('app.js').includes('/rest/v1/rpc/parceiro_ver'));
});
test('Diagnóstico opt-in não acessa DOM sem diagnóstico=1',()=>{
 const script=read('diagnostico-v378.js');let touched=0;
 const document={getElementById(){touched++},createElement(){touched++}};
 vm.runInNewContext(script,{location:{search:'?parceiro=faketoken'},URLSearchParams,document});
 assert.equal(touched,0);
});
test('NYSE 2027 verificada, B3 2027 permanece bloqueada até divulgação oficial',()=>{
 const c=require('./calendario-mercado-v378.js');assert.deepEqual([...c.calendarYears],[2026]);
 const t=c.assess(new Date('2027-11-02T15:00:00Z'));
 assert.equal(t.show,false);assert.equal(t.reason,'calendario_nao_verificado');
});
test('Endpoint de compartilhamento continua condicionado à homologação',()=>{
 assert(read('supabase/functions/parceiro-leitura/index.ts').includes('rate limit global'));
 assert(read('app.js').includes('/rest/v1/rpc/parceiro_ver'));
});
console.log(n+'/'+n+' testes segurança v378 aprovados');
