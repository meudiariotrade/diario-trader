'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=__dirname,read=p=>fs.readFileSync(path.join(root,p),'utf8');let n=0;
const test=(name,fn)=>{fn();n++;console.log('OK',name)};
test('HTML contém CSP e nenhum script inline executável',()=>{
 const html=read('index.html');assert(html.includes("script-src 'self'"));
 assert(!/<script(?![^>]*\bsrc=)[^>]*>\s*[^<\s]/i.test(html));
});
test('Arquivos JS e CSS incluídos por HTML existem no ZIP',()=>{
 const html=read('index.html');for(const match of html.matchAll(/<script[^>]*src="([^"]+)"/g)){
  const f=match[1].split('?')[0];if(!/^https?:/.test(f))assert(fs.statSync(path.join(root,f)).isFile(),f);
 }
 for(const match of html.matchAll(/<link[^>]*href="([^"]+)"/g)){
  const f=match[1].split('?')[0];if(!/^https?:/.test(f))assert(fs.existsSync(path.join(root,f)),f);
 }
});
test('Diagnostic script is in core cache, with no inline bootstrap',()=>{
 const sw=read('sw.js'),html=read('index.html');assert(sw.includes('"diagnostico-v380.js"'));
 assert(html.includes('defer src="diagnostico-v380.js?v=380"'));
});
test('Diagnóstico mantém dados pessoais fora do JSON',()=>{
 const js=read('diagnostico-v380.js');for(const x of ['localStorage','sessionStorage','getItem(', 'document.cookie','carteira_relatorios'])assert(!js.includes(x),x);
 assert(js.includes("qs.get('diagnostico')!=='1'"));
});
test('Compartilhamento de diagnóstico oferece API nativa e cópia local',()=>{
 const js=read('diagnostico-v380.js');assert(js.includes('navigator.canShare'));assert(js.includes('navigator.share'));
 assert(js.includes('navigator.clipboard.writeText'));
});
test('Revogação URL é retardada para Safari e dados continuam locais',()=>{
 const js=read('diagnostico-v380.js');assert(js.includes('setTimeout(()=>URL.revokeObjectURL(url),30000)'));
 assert(!js.includes('fetch('));assert(!js.includes('sendBeacon('));
});
test('Nenhum arquivo de produção inclui código para execução de ordens pelo Terminal',()=>{
 const js=read('diagnostico-v380.js')+read('calendario-mercado-v379.js')+read('editorial-financeiro-v379.js');
 assert(!js.includes('enviarOrdem'));assert(!js.includes('submitOrder'));
});
test('2026-11-03 é pregão normal e 2026-11-20 só exibe após validações',()=>{
 const c=require('./calendario-mercado-v379.js');const normal=c.assess('2026-11-03T15:00:00Z');assert(!normal.show);
 const holiday=c.assess('2026-11-20T15:00:00Z');assert(holiday.show);
 const noQuotes=c.visibility(new Date('2026-11-20T15:00:00Z'),{ts:0,itens:[]},()=>null);assert.equal(noQuotes.show,false);
});
test('B3 desconhecida em 2027 permanece oculta por segurança',()=>{
 const c=require('./calendario-mercado-v379.js');assert.equal(c.assess('2027-11-02T15:00:00Z').reason,'calendario_nao_verificado');
});
test('CSP/Política de referência protegem o token de compartilhamento',()=>{
 const html=read('index.html');assert(html.includes('content="no-referrer"'));
 assert(html.includes("object-src 'none'"));assert(html.includes("base-uri 'self'"));
});
console.log(n+'/'+n+' testes finais de homologação v380 aprovados');
