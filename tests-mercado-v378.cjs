/* Regras oficiais 2026 + teste de integração visual sem conexão e sem dados privados. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=__dirname,cal=require('./calendario-mercado-v378.js');
let passed=0;let total=0;
const run=(label,fn)=>{total++;try{fn();console.log('OK ',label);passed++}catch(error){console.error('FALHA',label,error.stack);process.exitCode=1}};
const at=s=>new Date(s);
const examples={
 ordinary:at('2026-11-03T15:00:00Z'),b3Only:at('2026-11-20T15:00:00Z'),
 bothClosed:at('2026-09-07T15:00:00Z'),usClosed:at('2026-02-16T15:00:00Z'),
 brCarnaval:at('2026-02-17T15:00:00Z'),early:at('2026-12-24T15:00:00Z'),
 earlyClosed:at('2026-12-24T19:00:00Z'),premarket:at('2026-11-20T12:00:00Z')
};
const data=(time,shiftMs=2*60000,count=2)=>({ts:time.getTime(),itens:[
 {s:'VALE',regular:{px:12,chp:1.2,at:new Date(time.getTime()-shiftMs).toISOString()}},
 {s:'PBR',regular:{px:23,chp:-0.5,at:new Date(time.getTime()-shiftMs).toISOString()}},
 {s:'EWZ',regular:{px:32,chp:.4,at:new Date(time.getTime()-shiftMs).toISOString()}}
].slice(0,count)});
const view=row=>({regular:row.regular});
run('03/11/2026 é dia normal: NÃO exibir, apesar do último fechamento ser dia anterior',()=>{assert.equal(cal.assess(examples.ordinary).show,false);assert.equal(cal.assess(examples.ordinary).reason,'b3_sem_feriado')});
run('20/11/2026 B3 feriado e NYSE regular aberta: elegível',()=>{assert.equal(cal.assess(examples.b3Only).show,true)});
run('02/11/2026 Finados B3 fechada e NYSE aberta: elegível',()=>{assert.equal(cal.assess(at('2026-11-02T15:00:00Z')).show,true)});
run('07/09/2026 feriado simultâneo B3 e NYSE: ocultar',()=>{assert.equal(cal.assess(examples.bothClosed).reason,'nyse_feriado')});
run('16/02/2026 ambos fechados: ocultar',()=>{assert.equal(cal.assess(examples.usClosed).reason,'nyse_feriado')});
run('17/02/2026 Carnaval: B3 fechada NYSE aberta',()=>{assert.equal(cal.assess(examples.brCarnaval).show,true)});
run('24/12/2026 NYSE fechamento antecipado 13h ET respeitado',()=>{assert.equal(cal.assess(examples.early).show,true);assert.equal(cal.assess(examples.earlyClosed).show,false)});
run('Pré-mercado EUA não é confirmado como pregão regular aberto',()=>{assert.equal(cal.assess(examples.premarket).reason,'nyse_fora_da_sessao_regular')});
run('Não extrapolar feriados além do calendário oficial disponível',()=>{assert.equal(cal.assess(at('2027-11-20T15:00:00Z')).reason,'calendario_nao_verificado')});
run('Somente consulta recente com 2 ADRs de preço regular válido permite projeção',()=>{assert.equal(cal.visibility(examples.b3Only,data(examples.b3Only),view).show,true)});
run('Consulta ADR atrasada mais de 5 minutos bloqueia',()=>{const d=data(examples.b3Only);d.ts-=6*60000;assert.equal(cal.visibility(examples.b3Only,d,view).show,false)});
run('Negócios das ADRs com atraso maior que 30 minutos bloqueiam',()=>{assert.equal(cal.visibility(examples.b3Only,data(examples.b3Only,31*60000),view).show,false)});
run('Apenas uma ADR válida não é confirmação suficiente',()=>{assert.equal(cal.visibility(examples.b3Only,data(examples.b3Only,2*60000,1),view).show,false)});
run('Duas entradas repetidas de uma mesma ADR não contam como duas cotações',()=>{
 const d=data(examples.b3Only);d.itens[1]={...d.itens[0]};
 assert.equal(cal.visibility(examples.b3Only,d,view).show,false);
});
run('NYSE com cotação do pregão anterior NÃO autoriza projeção',()=>{const d=data(examples.b3Only);d.itens[0].regular.at='2026-11-19T20:59:00Z';d.itens[1].regular.at='2026-11-19T20:59:00Z';assert.equal(cal.visibility(examples.b3Only,d,view).show,false)});
run('Cotação futura e consulta no futuro não são aceitas',()=>{const d=data(examples.b3Only);d.ts+=1000*60*20;assert.equal(cal.visibility(examples.b3Only,d,view).show,false)});
function context(time,cot){
 const globals={};
 class DateAt extends Date{constructor(...args){super(...(args.length?args:[time.getTime()]))}static now(){return time.getTime()}}
 const doc={createElement:()=>({textContent:''}),head:{appendChild:()=>{}}};
 Object.assign(globals,{
  window:{TraderCalendario:cal,TraderAdr:{view}},Date:DateAt,document:doc,
  AD:{data:cot},SESS:{at:'test'},adrHtml:()=>'<section>ADRs existentes</section>',
  setTimeout:()=>0,setInterval:()=>0
 });
 const s=fs.readFileSync(path.join(root,'interface.js'),'utf8');
 const a=s.indexOf('/* módulo: adr-abertura.js */'),b=s.indexOf('/* módulo: terminal-radar.js */',a);
 assert(a>0&&b>a);vm.runInNewContext(s.slice(a,b),globals,{filename:'adr-abertura.js'});
 return globals;
}
run('Interface v378 não imprime Abertura teórica em 03/11',()=>{const ctx=context(examples.ordinary,data(examples.ordinary));assert(!ctx.adrHtml().includes('Abertura teórica'));assert.equal(ctx.window.TraderPreOpen.height(),0)});
run('Imagem do Panorama não reserva espaço para bloco teórico em dia normal',()=>{const ctx=context(examples.ordinary,data(examples.ordinary));assert.equal(ctx.window.TraderPreOpen.height(),0);assert.equal(ctx.window.TraderPreOpen.draw({fillText(){}},1080,100),0)});
run('Somente no feriado válido aparece cabeçalho de cálculo enquanto carrega',()=>{const ctx=context(examples.b3Only,data(examples.b3Only));assert(ctx.adrHtml().includes('Abertura teórica'));assert.equal(ctx.window.TraderPreOpen.visibility().show,true)});
run('No feriado com cotações vencidas a interface oculta a projeção',()=>{const ctx=context(examples.b3Only,data(examples.b3Only,40*60000));assert(!ctx.adrHtml().includes('Abertura teórica'))});
run('Regras B3 e NYSE não têm dependência de fetch e URL externa obrigatória',()=>{const js=fs.readFileSync(path.join(root,'calendario-mercado-v378.js'),'utf8');assert(!/\bfetch\s*\(/.test(js));assert(/2026-11-20/.test(js))});
run('Estilo editorial é decorativo e não reescreve indicadores financeiros',()=>{const js=fs.readFileSync(path.join(root,'editorial-financeiro-v378.js'),'utf8');assert(js.includes('ARTE EDITORIAL'));assert(!js.includes('enviarOrdem'));assert(!js.includes('fetch('))});
run('Arte editorial e CSS entregues como arquivos válidos',()=>{const image=fs.readFileSync(path.join(root,'editorial-mercado-v378.jpg'));assert.equal(image[0],0xff);assert.equal(image[1],0xd8);assert(fs.statSync(path.join(root,'editorial-financeiro-v378.css')).size>1000)});
run('Scripts carregados na ordem exigida antes da interface',()=>{const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(html.indexOf('calendario-mercado-v378.js?v=378')<html.indexOf('interface.js?v=378'));assert(html.includes('editorial-financeiro-v378.css?v=378'))});
run('Revista e jornal PDF incluem arte editorial opcional sem depender dela para funcionar',()=>{
 const code=fs.readFileSync(path.join(root,'interface.js'),'utf8');
 assert(code.includes("p.doc.embedJpg(await response.arrayBuffer())"));
 assert(code.includes('sem internet, o cabeçalho sólido original permanece legível'));
});
run('Histórico antigo do IBOV e dólar sem data do feriado são rejeitados',()=>{
 const code=fs.readFileSync(path.join(root,'interface.js'),'utf8');
 assert(code.includes('diasBase<1||diasBase>7'));
 assert(code.includes("diaBR(dHoje[0])!==hojeBR()"));
});
run('Imagem editorial preserva todos os pixels de conteúdo no novo canvas',()=>{
 const source=fs.readFileSync(path.join(root,'editorial-financeiro-v378.js'),'utf8');
 const calls=[];
 const ctx={drawImage(...args){calls.push(args)},save(){},restore(){},fillRect(){},fillText(){},createLinearGradient(){return {addColorStop(){}}}};
 const original={width:1080,height:1800,getContext(){return ctx}};
 const createCanvas=()=>({getContext(){return ctx},width:0,height:0});
 class FakeImage{constructor(){this.naturalWidth=0;this.naturalHeight=0;this.complete=false}}
 const win={imgDesenha(){return original},grDesenha(){return original},jrImagem(){return original}};
 vm.runInNewContext(source,{window:win,document:{createElement:createCanvas},Image:FakeImage});
 const output=win.imgDesenha();
 assert.equal(output.width,1080);
 assert.equal(output.height,1990);
 assert(calls.some(v=>v[0]===original&&v[1]===0&&v[2]===190),'Fonte original deve estar íntegra 190px abaixo do novo cabeçalho');
});
run('HTML publica os scripts na ordem correta, inclusive os estilos do Giro e Revista',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert(html.includes('editorial-financeiro-v378.css?v=378'));
 assert(html.indexOf('calendario-mercado-v378.js?v=378')<html.indexOf('interface.js?v=378'));
 assert(html.indexOf('interface.js?v=378')<html.indexOf('editorial-financeiro-v378.js?v=378'));
 assert(!html.includes('diagnostico-v375.js?v=375'));
});
console.log(`\n${passed}/${total} testes adicionais v378 aprovados.`);
