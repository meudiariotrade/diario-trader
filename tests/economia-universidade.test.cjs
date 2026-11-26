const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
async function open(browser,base){
 const p=await browser.newPage({viewport:{width:390,height:844}});
 await p.route('https://**',route=>route.abort());
 await p.goto(base+'/?demo=1');
 await p.locator('#splash').waitFor({state:'hidden'});
 await p.evaluate(()=>{tab='estudos';ESV='liv';render()});
 return p;
}
test('Biblioteca preservada, quarta sub-aba Laboratório com quatorze ferramentas',{timeout:90000},async()=>withApp(async(b,base)=>{
 const p=await open(b,base),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const sub=p.locator('.v596-sub [data-dt397-view]');
 await expect(sub).toHaveText(['Livros','Planos de leitura','Prompts','Laboratório']);
 await expect(p.locator('[data-eco-launch]')).toHaveCount(0);
 await sub.nth(3).click();
 await expect(p.locator('.eco-head h2')).toHaveText('Laboratório de Economia');
 await expect(p.locator('.eco-nav [data-eco-tool]')).toHaveCount(14);
 for(const id of ['ficha','micro','flash','series','revisao']){
   await p.locator('.eco-nav [data-eco-tool="'+id+'"]').click();
   await expect(p.locator('#eco-body')).toBeVisible();
   assert.ok((await p.locator('#eco-body').innerText()).length>35,id);
 }
 await p.evaluate(()=>{ESV='rpy';render()});await expect(p.locator('#app')).toContainText('Replay');
 await p.evaluate(()=>{ESV='liv';render()});await expect(p.locator('#app')).toContainText('Livros');
 assert.deepEqual(errors,[]);
}));
test('Fichar texto local, gerar cards, revisar e preservar histórico JSON em navegador',{timeout:90000},async()=>withApp(async(b,base)=>{
 const p=await open(b,base);
 await p.locator('[data-dt397-view="eco"]').click();
 await p.locator('[data-eco-tool="ficha"]').click();
 await p.locator('[data-uni-title]').fill('Resumo de aula Keynes');
 await p.locator('[data-uni-text]').fill('O princípio da demanda efetiva considera que o nível de atividade pode permanecer abaixo do pleno emprego. O consumo aumenta com a renda, mas em proporção menor. O investimento depende de expectativas sobre a rentabilidade marginal do capital e da taxa de juros. A economia pode permanecer com desemprego involuntário. A escola keynesiana discute o papel de políticas fiscais.');
 // Reproduz render global enquanto o usuário preenche a ficha.
 await p.evaluate(()=>{const root=document.querySelector('.eco-root');render();if(root!==document.querySelector('.eco-root'))throw Error('Laboratório remontado durante edição');});
 await expect(p.locator('[data-uni-title]')).toHaveValue('Resumo de aula Keynes');
 await p.locator('[data-eco-btn="uniLocal"]').click();
 await expect(p.locator('.uni-ficha')).toContainText('Resumo de aula Keynes');
 await p.locator('[data-eco-btn="uniDeck"]').click();
 await expect(p.locator('[data-eco-tool="flash"]')).toHaveClass(/\bon\b/);
 await p.evaluate(()=>render());
 await expect(p.locator('[data-eco-tool="flash"]')).toHaveClass(/\bon\b/);
 await expect(p.locator('.uni-flash')).toBeVisible();
 await p.locator('[data-eco-btn="uniFlip"]').click();
 await p.locator('[data-eco-btn="uniAcerto"]').click();
 const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('diario-laboratorio-universitario-v1')));
 assert.ok(saved.fichas.some(x=>x.titulo==='Resumo de aula Keynes'));
 assert.ok(saved.cards.length>10);
 assert.equal(saved.revisoes.length,1);
 const importBuffer=Buffer.from(JSON.stringify({schema:1,fichas:[{id:'import-1',titulo:'Texto importado',disc:'Microeconomia',tese:'Uma tese.',conceitos:[],equacoes:[],questoes:[]}],cards:[],revisoes:[],consultas:[],resumos:[]}));
 await p.locator('[data-eco-history]').setInputFiles({name:'historico.json',mimeType:'application/json',buffer:importBuffer});
 await expect(p.locator('.eco-root')).toContainText('Histórico importado');
 const imported=await p.evaluate(()=>JSON.parse(localStorage.getItem('diario-laboratorio-universitario-v1')));
 assert.ok(imported.fichas.some(x=>x.id==='import-1'));
 assert.ok(imported.fichas.some(x=>x.titulo==='Resumo de aula Keynes'));
}));
test('Microeconomia: sliders, curvas, condições e respostas numéricas coerentes',{timeout:90000},async()=>withApp(async(b,base)=>{
 const p=await open(b,base);await p.locator('[data-dt397-view="eco"]').click();
 await p.locator('[data-eco-tool="micro"]').click();
 await expect(p.locator('.eco-plot')).toBeVisible();
 const c=await p.evaluate(()=>EconomiaLab.microEconomia.consumo());
 assert.ok(Math.abs(c.x-10)<1e-9);assert.ok(Math.abs(c.y-15)<1e-9);
 await p.locator('[data-eco-btn="uniMicroMode"][data-id="elas"]').click();
 await expect(p.locator('#uni-micro-results')).toContainText('Elasticidade-preço');
 await p.locator('[data-eco-btn="uniMicroMode"][data-id="firma"]').click();
 const f=await p.evaluate(()=>EconomiaLab.microEconomia.firma());
 assert.ok(f.cour<f.mon);
 await p.locator('[data-uni-micro-estrutura]').selectOption('cour');
 await expect(p.locator('#uni-micro-results')).toContainText('Cournot');
}));
test('Séries: normalizar BCB/IBGE e CSV após consulta direta simulada, sem proxy',{timeout:90000},async()=>withApp(async(b,base)=>{
 const p=await open(b,base);await p.locator('[data-dt397-view="eco"]').click();
 await p.locator('[data-eco-tool="series"]').click();
 await p.evaluate(()=>{
   const prev=window.fetch;
   window.fetch=(url,options)=>String(url).startsWith('https://api.bcb.gov.br/')
      ? Promise.resolve(new Response(JSON.stringify([{data:'14/11/2026',valor:'14.25'},{data:'15/11/2026',valor:'14.50'}]),{status:200,headers:{'Content-Type':'application/json'}}))
      : prev(url,options);
 });
 await p.locator('[data-eco-btn="uniConsultar"]').click();
 await expect(p.locator('[data-eco-btn="uniCSV"]')).toBeVisible();
 await expect(p.locator('.eco-grid-stats')).toContainText('14,50');
 const result=await p.evaluate(()=>{
  const util=EconomiaLab.uniSeries;
  const parsed=util.normalizaIBGE([{resultados:[{series:[{localidade:{id:'1',nome:'Brasil'},serie:{202601:'0.55',202602:'..',202603:'0.60'}}]}]}]);
  return {parsed,source:EconomiaLab.uni.data.consultas[0]};
 });
 assert.deepEqual(result.parsed,[{data:'202601',valor:0.55},{data:'202603',valor:0.6}]);
 assert.equal(result.source.fonte,'BCB');assert.equal(result.source.pontos.length,2);
 assert.match(result.source.url,/api\.bcb\.gov\.br\/dados\/serie\/bcdata\.sgs\.432\/dados\?/);
}));
test('Resumo de prova: Solow, MQO e impressão A4 armazenáveis em JSON',{timeout:90000},async()=>withApp(async(b,base)=>{
 const p=await open(b,base);await p.locator('[data-dt397-view="eco"]').click();
 await p.locator('[data-eco-tool="revisao"]').click();
 await expect(p.locator('.uni-a4')).toContainText('Modelo de Solow');
 await p.locator('[data-uni-rev-tema]').selectOption('mqo');
 await expect(p.locator('.uni-a4')).toContainText('Gauss–Markov');
 await p.locator('[data-eco-btn="uniSalvarResumo"]').click();
 const a=await p.evaluate(()=>EconomiaLab.uni.data.resumos);
 assert.equal(a.length,1);assert.equal(a[0].tema,'mqo');
 await expect(p.locator('.eco-storage [data-eco-btn="uniExport"]')).toBeVisible();
}));
