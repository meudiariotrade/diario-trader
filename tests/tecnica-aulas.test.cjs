const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const sources=['conteudo','voz','roteiros','graficos','pdf','aulas','estilos'];
const ID='12345678-1234-4234-8234-123456789abc';
function fixture(uid='conta-a'){
 return {id:ID,user_id:uid,roteiro:{tipo:'mentor-pdf-v1',mentor:{
  title:'Conceito do PDF',summary:'Aula gerada exclusivamente com o PDF enviado.',
  stageNames:['Contexto','Aplicação','Risco','Revisão'],
  stages:['MM200 no contexto original.','Aplicação da MM200.','Avaliação de risco.','Revisão do material.'],
  visuals:Array.from({length:4},(_,i)=>({title:'Etapa '+i,items:['Diagrama do conceito','Leitura guiada']})),
  roteiroVoz:{abertura:'Vamos estudar o material.',etapas:['A MM200 mostra o contexto.','Aplicação prática da MM200.','Reconheça riscos.','Revise o conteúdo.']},
  questions:Array.from({length:3},()=>({q:'Qual conceito é correto?',options:['A','B','C'],answer:0,why:'A resposta é A.'}))
 }}};
}
function app(){
 const dom=new JSDOM('<main id="app"></main>',{url:'https://example.test/diario-trader/',runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
 w.eval("var tab='estudos',ESV='aul',SESS={uid:'conta-a'};function vEstudos(){return '<h1>Estudos</h1><div id=\"aulas-antigas\">Aulas tradicionais preservadas</div>'};function render(){document.getElementById('app').innerHTML=vEstudos()}");
 w.TextDecoder=TextDecoder;
 w.HTMLElement.prototype.scrollIntoView=function(){};
 w.HTMLMediaElement.prototype.load=function(){};
 w.HTMLMediaElement.prototype.pause=function(){};
 w.HTMLMediaElement.prototype.play=()=>Promise.resolve();
 w.speechSynthesis={getVoices:()=>[{lang:'pt-BR'}],cancel(){this.cancelled=true;},speak(u){this.last=u;}};
 w.SpeechSynthesisUtterance=function(text){this.text=text;};
 for(const name of sources)w.eval(fs.readFileSync(path.join(__dirname,'../src/studies/tecnica-'+name+'.js'),'utf8'));
 w.render();
 const close=w.close.bind(w);
 w.close=()=>{w.TecnicaPratica.view.dispose();close();};
 return dom;
}
const click=(w,selector)=>{const element=w.document.querySelector(selector);assert.ok(element,'Elemento ausente: '+selector);element.click();};
const mentor=w=>click(w,'[data-tp-aula-sub="mentor"]');
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
test('sub-abas mantêm as aulas tradicionais intactas e não montam dois painéis',()=>{
 const d=app(),w=d.window;
 assert.ok(w.document.querySelector('#aulas-antigas'));
 assert.equal(w.document.querySelector('#tp-root'),null);
 assert.equal(w.document.querySelectorAll('.tp-aulas-nav [role=tab]').length,2);
 mentor(w);
 assert.ok(w.document.querySelector('#tp-root'));
 assert.equal(w.document.querySelector('#aulas-antigas'),null);
 assert.match(w.document.querySelector('.tp-empty').textContent,/PDF/);
 assert.equal(w.document.querySelectorAll('[data-tp-lesson]').length,0);
 click(w,'[data-tp-aula-sub="tradicionais"]');
 assert.ok(w.document.querySelector('#aulas-antigas'));
 assert.equal(w.document.querySelector('#tp-root'),null);
 w.ESV='liv';w.render();assert.equal(w.document.querySelector('.tp-aulas-nav'),null);
 w.close();
});
test('18 aulas de demonstração foram removidas; a ponte exporta lista vazia',()=>{
 const d=app(),w=d.window;
 assert.equal(w.TecnicaPratica.lessons.length,0);
 assert.equal(w.TecnicaPratica.modules.length,0);
 assert.equal(require('../scripts/export-tecnica.cjs').manifest().lessons.length,0);
 w.close();
});
test('PDF do usuário cria aula com SVG e quiz, sem renderizar HTML executável',()=>{
 const d=app(),w=d.window;mentor(w);
 const row=fixture(),l=w.TecnicaPratica.pdf.insert(row);
 assert.equal(l.pdf,true);
 w.TecnicaPratica.view.refresh();
 assert.equal(w.document.querySelectorAll('[data-tp-lesson]').length,1);
 click(w,'[data-tp-lesson]');
 assert.ok(w.document.querySelector('[data-tp-image]').src.endsWith('/avatar-mentor.png'));
 click(w,'[data-tp-action="visual"]');
 assert.equal(w.document.querySelectorAll('.tp-chart svg').length,1);
 assert.match(w.document.querySelector('.tp-script').textContent,/MM200/);
 assert.equal(w.document.querySelectorAll('.tp-check fieldset').length,3);
 w.close();
});
test('nenhuma aula do usuário anterior permanece na nova conta',()=>{
 const d=app(),w=d.window;mentor(w);w.TecnicaPratica.pdf.insert(fixture());w.TecnicaPratica.view.refresh();
 assert.equal(w.document.querySelectorAll('[data-tp-lesson]').length,1);
 w.SESS={uid:'outra-conta'};w.render();
 assert.equal(w.TecnicaPratica.lessons.length,0);
 assert.ok(w.document.querySelector('.tp-empty'));
 w.close();
});
test('Gerador aceita 150 páginas por trecho e rejeita 151, mantendo extração local',async()=>{
 const d=app(),w=d.window;mentor(w);w.SESS.at='token';
 w.tok=async()=>{};
 w.cfg=()=>({url:'https://example.supabase.co',key:'publica'});
 w.crypto.randomUUID=()=>ID;
 const bytes=new TextEncoder().encode('%PDF-1.7 fixture'),fake={name:'material.pdf',size:bytes.length,type:'application/pdf',arrayBuffer:async()=>bytes.buffer};
 const input=w.document.querySelector('[data-tp-pdf-file]');
 Object.defineProperty(input,'files',{value:[fake]});input.dispatchEvent(new w.Event('change',{bubbles:true}));
 const theme=w.document.querySelector('[data-tp-pdf-theme]');theme.value='Leitura técnica';theme.dispatchEvent(new w.Event('input',{bubbles:true}));
 const last=w.document.querySelector('[data-tp-pdf-last]');last.value='150';last.dispatchEvent(new w.Event('input',{bubbles:true}));
 const pdf={numPages:150,getPage:async()=>({getTextContent:async()=>({items:[{str:'Trecho explicativo com conteúdo suficiente. '.repeat(9)}]}),cleanup(){}}),destroy:async()=>{}};
 w.ntLib=async()=>({getDocument:()=>({promise:Promise.resolve(pdf),destroy(){}})});
 let payload;
 w.fetch=async(url,opt)=>url.includes('/rest/')?{ok:true,json:async()=>[]}:(payload=JSON.parse(opt.body),{ok:true,json:async()=>({aula:fixture(),local:true})});
 await w.TecnicaPratica.pdf.generate();
 assert.equal(payload.acao,'mentor_pdf');
 assert.equal(payload.paginas,'1–150');
 assert.match(payload.texto,/Página 150/);
 assert.ok(payload.texto.length<=120000);
 assert.equal(w.TecnicaPratica.lessons.length,1);
 const newLast=w.document.querySelector('[data-tp-pdf-last]');newLast.value='151';newLast.dispatchEvent(new w.Event('input',{bubbles:true}));
 await assert.rejects(()=>w.TecnicaPratica.pdf.generate(),/150 páginas/);
 w.close();
});
test('dicionário normaliza cada etapa só na voz e não substitui a ponte por voz robótica',async()=>{
 const d=app(),w=d.window;mentor(w);w.TecnicaPratica.pdf.insert(fixture());w.TecnicaPratica.view.refresh();click(w,'[data-tp-lesson]');
 w.DIARIO_PONTE_VIDEO={vozUrl:'http://127.0.0.1:9999/tts'};
 let sent;
 w.fetch=async(_url,opt)=>{sent=JSON.parse(opt.body);throw Error('Ponte desligada');};
 click(w,'[data-tp-action="listen"]');await flush();
 assert.equal(sent.lang,'pt-BR');
 assert.match(sent.text,/média móvel de duzentos períodos/);
 assert.doesNotMatch(sent.text,/MM200/);
 assert.match(w.document.querySelector('.tp-script').textContent,/MM200/);
 assert.equal(w.speechSynthesis.last,undefined);
 assert.match(w.document.querySelector('.tp-status').textContent,/Não consegui gerar a voz/i);
 w.close();
});
test('voz válida da ponte avança somente após terminar o áudio',async()=>{
 const d=app(),w=d.window;mentor(w);w.TecnicaPratica.pdf.insert(fixture());w.TecnicaPratica.view.refresh();click(w,'[data-tp-lesson]');
 w.DIARIO_PONTE_VIDEO={vozUrl:'http://127.0.0.1:9999/tts'};
 let a,revoked=0;
 w.URL.createObjectURL=()=> 'blob:voz';
 w.URL.revokeObjectURL=()=>{revoked++};
 w.Audio=function(){a=this;this.play=async()=>{this.onplaying?.();};this.pause=()=>{};this.load=()=>{};this.removeAttribute=()=>{};};
 w.fetch=async()=>({ok:true,headers:{get:()=> 'audio/wav'},blob:async()=>({size:180})});
 click(w,'[data-tp-action="listen"]');await flush();
 assert.equal(w.document.querySelector('[aria-current=step]').dataset.tpStep,'0');
 a.onended();await flush();
 assert.equal(w.document.querySelector('[aria-current=step]').dataset.tpStep,'1');
 assert.ok(revoked);
 assert.equal(w.speechSynthesis.last,undefined);
 w.close();
});
test('glossário por conta permanece editável e os recursos do avatar existem',()=>{
 const d=app(),w=d.window;mentor(w);
 assert.equal(w.DiarioVoz.normalizarTextoParaVoz('WIN e RSI'),'mini índice e índice de força relativa');
 w.DiarioVoz.save({XYZ:'xis especial'});
 assert.equal(w.DiarioVoz.normalizarTextoParaVoz('XYZ'),'xis especial');
 w.SESS={uid:'conta-b'};
 assert.equal(w.DiarioVoz.normalizarTextoParaVoz('XYZ'),'XYZ');
 for(const name of ['avatar-mentor.png','avatar-mentor-chart.png','avatar-talking.mp4'])
  assert.ok(fs.existsSync(path.join(__dirname,'../public',name)));
 w.close();
});
