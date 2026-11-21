const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('v855: PDF grande → páginas mais ligadas ao tema até 120 mil caracteres; mentor com gestos na aula',()=>{
 const s=fs.readFileSync('src/studies/tecnica-pdf.js','utf8'),i=s.indexOf('const LIMITE_LEITURA'),j=s.indexOf('T.pdfControls=');
 const f=new Function(s.slice(i,j)+';return {selecionarPorTema,LIMITE_AULA,LIMITE_LEITURA}')();
 assert.equal(f.LIMITE_AULA,120000);assert.ok(f.LIMITE_LEITURA>=600000);
 let t='';for(let p=1;p<=200;p++)t+='\n[Página '+p+']\n'+(p%10===0?'Onda 3 de impulso de Elliott e retração de Fibonacci. ':'Contabilidade e balanço patrimonial. ').repeat(40);
 const r=f.selecionarPorTema(t,'Ondas de elliot',120000);assert.ok(r.length<=120000);assert.match(r,/\[Página 10\]/);assert.doesNotMatch(r,/\[Página 11\]/);
 assert.match(fs.readFileSync('supabase/functions/aulas/index.ts','utf8'),/texto\.length>120000/);
 assert.match(fs.readFileSync('src/studies/tecnica-aulas.js','utf8'),/\(playing\|\|visual\)&&!videoFailed/);
});
test('v857: aula de PDF recupera JSON solto e tenta de novo com trecho menor',()=>{
 const s=fs.readFileSync('supabase/functions/aulas/index.ts','utf8');
 assert.match(s,/const solto=/);assert.match(s,/texto\.slice\(0,60000\)/);assert.match(s,/Responda SOMENTE com o objeto JSON/);
});
