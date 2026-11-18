'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
test('Safari iOS reserva preview no gesto, compartilha quando possível e faz fallback seguro',async()=>{
 let location=null,clicked=0,closed=0;
 const ticket={closed:false,document:{body:{textContent:''}},location:{replace:u=>{location=u}},close:()=>{closed++}};
 const elements=[];
 const doc={body:{appendChild:x=>elements.push(x)},createElement:()=>({href:'',download:'',click:()=>clicked++,remove:()=>{}})};
 const navigator={userAgent:'Mozilla iPhone Safari',platform:'iPhone',maxTouchPoints:5,
  canShare:args=>Array.isArray(args.files),share:async()=>{throw Object.assign(new Error('sem gesto'),{name:'NotAllowedError'})}};
 class FileFake{constructor(bytes,name,opts){this.name=name;this.type=opts.type}}
 const mock={window:{open:()=>ticket},navigator,document:doc,File:FileFake,
  URL:{createObjectURL:()=> 'blob:pdf-testado',revokeObjectURL:()=>{}},
  setTimeout:()=>{},Blob,console};
 vm.runInNewContext(read('src/analysis/tecnico-pdf.js'),mock);
 const pdf=mock.window.DiarioPDFiOS,t=pdf.prepare();
 assert.equal(t,ticket);
 assert.match(ticket.document.body.textContent,/PDF/);
 const delivered=await pdf.deliver({blob:new Blob(['ok'],{type:'application/pdf'}),name:'relatorio.pdf',pages:2},'Dossiê',t);
 assert.equal(location,'blob:pdf-testado');
 assert.equal(delivered.preview,true);
 assert.equal(clicked,0);assert.equal(closed,0);
});
test('Pesquisa e screener nunca silenciam ao exportar sem candidato e recusam cache vencido',()=>{
 const src=read('src/analysis/analises.js');
 assert.match(src,/Nenhum ativo confirmado no cenário atual para gerar o PDF/);
 assert.match(src,/GLOBAL_OFFLINE_SLA=6\*3600000/);
 assert.match(src,/Modo Histórico \/ Desatualizado/);
 assert.match(src,/DiarioPesquisaPDF\.share/);
 for(const f of ['src/analysis/pesquisa-pdf.js','src/analysis/tecnico-pdf.js','src/analysis/screeners-relatorio.js'])
  assert.doesNotThrow(()=>new vm.Script(read(f),{filename:f}));
});
test('RS não usa percentil parcial e setup só promove risco-retorno >=1.5',()=>{
 const worker=read('src/analysis/tecnico-worker.js'),ui=read('src/analysis/tecnico-ui.js');
 assert.match(worker,/peers\.length===fixed\.size/);
 assert.match(worker,/const complete=/);
 assert.match(worker,/denominator:rs===null\?null:fixed\.size/);
 assert.match(ui,/x\.plan\.rr>=1\.5/);
 assert.match(ui,/barrasRecentes\(payload\.candles,asset,tf\)/);
 assert.match(ui,/s\.next\+\(more\?12:\(m==='br'\?60:80\)\)/);
});
test('identidade de fonte primária é obrigatória para selo e documentação não é data de coleta',()=>{
 const intel=read('src/analysis/screeners-inteligencia.js'),sql=read('supabase/migrations/20261118112043_analises_score_documentos_v763.sql');
 assert.match(intel,/documentoConfirmado/);assert.match(intel,/coverage>=70&&documentoConfirmado/);
 assert.match(sql,/quant_us_score_v2_guard/);assert.match(sql,/quant_screeners_documento_patch/);
 assert.match(sql,/data_competencia_balanco/);
});
test('Cloudflare não inventa OHLCV e Pesquisa nunca marca atualidade incondicional',()=>{
 const worker=read('cloudflare/diario-screeners/index.mjs'),motor=read('supabase/functions/pesquisa/motor.ts');
 assert.match(worker,/items\.length<250/);
 assert.match(worker,/lastAsOf/);
 assert.match(motor,/function validarNumerosIA/);
 assert.match(motor,/atualidade_confirmada:atualidade\.estado/);
 assert.doesNotMatch(motor,/atualidade_confirmada:true/);
});
