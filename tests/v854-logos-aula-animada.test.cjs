const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('v854: aula animada — o quadro depende só do tempo e revela os elementos em sequência',async()=>{
 const src=fs.readFileSync('src/studies/aula-animada.js','utf8');
 assert.equal(src,fs.readFileSync('bridge-video/aula_animada.js','utf8'),'app e Ponte Vídeo usam o mesmo motor');
 const {JSDOM}=(()=>{try{return require('jsdom')}catch{return {}}})();if(!JSDOM)return;
 const dom=new JSDOM('<svg><line x1="40" y1="1" x2="880" y2="1" stroke="#1E232E"/><polyline points="0,0 100,0 200,0"/><rect x="1" y="10" width="5" height="40"/><line x1="0" y1="5" x2="100" y2="5" stroke="#D4A017" stroke-dasharray="5 4"/><text x="1" y="1">a</text></svg>',{runScripts:'outside-only'});
 dom.window.eval(src);const A=dom.window.AulaAnimada,svg=dom.window.document.querySelector('svg');
 A.preparar(svg);const pl=svg.querySelector('polyline'),rect=svg.querySelector('rect');
 A.quadro(svg,0);assert.equal(pl.style.opacity,'0');
 A.quadro(svg,20);assert.equal(pl.getAttribute('points'),'0.0,0.0 100.0,0.0 200.0,0.0');assert.equal(rect.getAttribute('height'),'40');
});
test('v854: logos no Top 10, nos PDFs do ranking e do técnico e na avaliação histórica',()=>{
 assert.match(fs.readFileSync('src/shared/pdf-logos.js','utf8'),/embedPng/);
 const r=fs.readFileSync('src/analysis/screeners-relatorio.js','utf8');assert.match(r,/DiarioPDFLogos\?\.carregar/);assert.match(r,/L\.logo\(row\.ticker/);
 assert.match(fs.readFileSync('src/analysis/tecnico-pdf.js','utf8'),/DiarioPDFLogos\?\.carregar/);
 assert.match(fs.readFileSync('src/analysis/analises.js','utf8'),/scr-top-ten-company"><b>'\+logo\(row\.ticker/);
 assert.match(fs.readFileSync('src/studies/tecnica-aulas.js','utf8'),/AulaAnimada\.tocar/);
 assert.match(fs.readFileSync('bridge-video/tecnica_video.py','utf8'),/AulaAnimada\.quadro/);
});
