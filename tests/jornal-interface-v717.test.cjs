const {test}=require('node:test'),assert=require('node:assert/strict'),{withApp}=require('./helpers/app.cjs');
test('Jornal no celular e desktop captura Profit uma vez, separa edição e isola a conta',{timeout:120000},async()=>withApp(async(browser,base)=>{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.goto(base+'/?demo=1');await page.locator('#splash').waitFor({state:'hidden'});
  await page.evaluate(()=>{
   SESS={uid:'jornal-fixture',at:'teste',exp:Date.now()+3600000,projectUrl:cfg()?.url};
   window.__jornalRequests=0;window.__jornalDay=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
   const parts=Object.fromEntries(new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(x=>[x.type,x.value]));
   window.rq=async()=>{window.__jornalRequests++;return new Response(JSON.stringify([{ticker:'WINZ26',ult:'170935',abe:'173505',max:'174000',min:'170000',hor:`${parts.hour}:${parts.minute}:${parts.second}`,dat:`${parts.day}/${parts.month}/${parts.year}`}]))};
   tab='mercado';MKT.tab='jr';JRN.arq=null;JRN.v={dia:window.__jornalDay,edicao:'manha',prep_id:'fixture717',gerado:new Date().toISOString(),manchete:{titulo:'Fixture de interface',texto:'Referências simuladas para validar a captura privada.'},materias:[],cotacoes:[{k:'win',n:'WIN',px:170845,contrato:'WINZ26'}],agenda:[],fontes:[]};
   document.getElementById('app').innerHTML='<div id="jrbox"></div>';jrPinta();
  });
  for(const [ed,label] of [['manha','Preparação para a abertura'],['meio','Pregão em andamento'],['tarde','Balanço da sessão']]){
   await page.evaluate(ed=>{JRN.v.edicao=ed;jrPinta()},ed);
   assert.ok((await page.locator('#jrbox .jr-editorial-details').textContent()).includes(label));
  }
  assert.equal(await page.evaluate(()=>window.__jornalRequests),0);
  assert.equal(await page.locator('#jrbox .jr-quality').count(),0);
  assert.equal(await page.locator('#jrbox .jr-evidence').count(),0);
  await page.locator('#jrbox .jr-editorial-details > summary').click();
  const capture=page.locator('#jrbox [data-jr-profit-capture]');
  assert.ok((await capture.boundingBox()).height>=44,JSON.stringify(await capture.evaluate(el=>({height:el.getBoundingClientRect().height,minHeight:getComputedStyle(el).minHeight,classes:el.className}))));
  await capture.click();await page.waitForFunction(()=>window.__jornalRequests===1&&!!window.DiarioJornalEditorial.edition(JRN.v).profit_local);
  const values=await page.evaluate(()=>{const e=window.DiarioJornalEditorial.edition(JRN.v);return {publicPrice:e.snapshot.cotacoes[0].px,profit:e.profit_local.cotacoes[0].px,stored:!!JRN.v.profit_local}});
  assert.deepEqual(values,{publicPrice:170845,profit:170935,stored:false});
  await page.evaluate(()=>{SESS={...SESS,uid:'outra-conta'};jrPinta()});
  assert.equal(await page.evaluate(()=>!!window.DiarioJornalEditorial.edition(JRN.v).profit_local),false);
  assert.equal(await page.evaluate(()=>window.__jornalRequests),1);
  await page.close();
 }
}));
