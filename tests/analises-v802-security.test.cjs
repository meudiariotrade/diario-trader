'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),
 os=require('node:os'),path=require('node:path');
const {audit,SOURCE_FILES}=require('../scripts/analises-security-v802.cjs');
test('v802: fontes de mercado sem credentials/timers/rede Supabase e com cache offline',()=>{
 const r=audit();
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.ok(r.checked>=10);
});
test('v802: detectar segredo/timer introduzido em módulo sem analisar Logs do Supabase',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'diario-audit-v802-'));
 try{
  for(const p of ['release.config.json','src/index.html','src/service-worker.js',...SOURCE_FILES]){
   const folder=path.join(dir,path.dirname(p));fs.mkdirSync(folder,{recursive:true});
   const code=fs.readFileSync(p,'utf8');
   fs.writeFileSync(path.join(dir,p),p==='src/analysis/feed-profit-v788.js'?code+'\nsetInterval(()=>{},1000);':code);
  }
  const r=audit(dir);assert.equal(r.ok,false);
  assert.ok(r.errors.some(x=>x.file==='src/analysis/feed-profit-v788.js'&&/Timer/.test(x.reason)));
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
