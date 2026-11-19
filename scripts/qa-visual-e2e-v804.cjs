'use strict';
// Auditoria visual de navegação em Chromium real usando SOMENTE demonstração isolada.
// Não cria nem exclui contas no Supabase e não executa ações de escrita.
// Mantenha a homologação de Auth/conta QA como etapa SEPARADA com teardown verificável.
const fs = require('node:fs');
const path = require('node:path');
const {withApp} = require('../tests/helpers/app.cjs');

const out = path.resolve('qa-output');
fs.mkdirSync(out,{recursive:true});
const specs=[
 ['inicio','Início','home'],
 ['meu-dia','Meu dia','dia'],
 ['mercado','Mercado','mercado'],
 ['operacoes','Operações','ops'],
 ['carteira','Carteira','carteiras'],
 ['terminal','Terminal','term'],
 ['estudos','Estudos','estudos'],
 ['analises-pesquisa','Análises - B3 & EUA','analises','pesquisa'],
 ['analises-br','Análises - Screener Brasil','analises','br'],
 ['analises-us','Análises - Screener EUA','analises','us'],
 ['analises-tecnico-br','Análises - Técnico Brasil','analises','tecnico-br'],
 ['analises-tecnico-world','Análises - Técnico EUA & Cripto','analises','tecnico-world']
];
function htmlEscape(s){return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function slug(s){return s.replace(/[^a-z0-9-]/gi,'-');}
async function measure(page) {
 return page.evaluate(()=>new Promise(resolve=>{
  const counts={};let mutationCount=0,rootReplacements=0,cls=0,layoutShifts=0;
  const app=document.querySelector('#app');
  const observer=new MutationObserver(list=>{
   for(const m of list){
    mutationCount++;
    const el=m.target.nodeType===1?m.target:m.target.parentElement;
    const candidate=el?.closest?.('[data-tech-root],.scr-kpi,.card,.an-screener-switch,nav,#app');
    const key=candidate?(candidate.id?'#'+candidate.id:(candidate.className&&typeof candidate.className==='string'?candidate.className.slice(0,75):candidate.tagName)):'outro';
    counts[key]=(counts[key]||0)+1;
    if(m.type==='childList'&&m.target===app)rootReplacements+=m.removedNodes.length;
   }
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,characterData:true,attributeFilter:['style','class','hidden','aria-busy']});
  let po;
  try{
   po=new PerformanceObserver(list=>{
    for(const x of list.getEntries())if(!x.hadRecentInput){cls+=x.value;layoutShifts++;}
   });
   po.observe({type:'layout-shift', buffered:false});
  }catch{}
  setTimeout(()=>{
   observer.disconnect();po?.disconnect();
   const root=document.documentElement;
   const viewport=root.clientWidth;
   const bad=[...document.querySelectorAll('body *')].filter(el=>{
    if(!(el instanceof HTMLElement)||el.hidden||getComputedStyle(el).display==='none')return false;
    const r=el.getBoundingClientRect(),st=getComputedStyle(el);
    return r.width>0 && (r.right>viewport+2||r.left< -2) && st.position!=='fixed' && st.position!=='absolute';
   }).slice(0,8).map(el=>({tag:el.tagName,cl:String(el.className).slice(0,70),text:(el.textContent||'').trim().slice(0,60)}));
   resolve({
    mutationCount,rootReplacements,cls:Math.round(cls*10000)/10000,layoutShifts,
    overflowPx:Math.max(0,root.scrollWidth-viewport),overflowElements:bad,
    invalidSvgPaths:[...document.querySelectorAll('svg path[d]')].filter(p=>!/^[Mm]/.test((p.getAttribute('d')||'').trim())).slice(0,8).map(p=>({d:p.getAttribute('d'),html:p.parentElement?.outerHTML.slice(0,400)})),
    topMutationTargets:Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5),
    cspMeta:[...document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]')].map(el=>el.content),
    visibleButtons:[...document.querySelectorAll('#app button')].filter(el=>el.getBoundingClientRect().height>0&&!el.disabled).length,
    appChildren:app?.children.length||0,renderedText:(app?.innerText||'').trim().slice(0,100)
   });
  },6000);
 }));
}
function statusOf(r){
 if(r.error||r.pageErrors.length||r.localHttpErrors.length||r.metrics?.overflowPx>1||r.metrics?.cls>0.1||!r.metrics?.appChildren||r.metrics?.invalidSvgPaths?.length)return 'FALHA/REVISÃO';
 if(r.consoleErrors.length)return 'ALERTA NO CONSOLE / REVISÃO';
 if(r.metrics?.rootReplacements>30||r.metrics?.mutationCount>600)return 'SUSPEITA DE RE-RENDER';
 return 'SEM FALHA DETECTADA (DEMO)';
}
async function go(page, spec){
 const [, ,route, sub]=spec;
 await page.evaluate(route=>{
  if(window.DiarioRotas?.navigate)window.DiarioRotas.navigate(route);
  else{window.tab=route;window.render?.();}
 },route);
 await page.waitForTimeout(400);
 if(sub){
  const nav=page.locator('#an-root nav.an-subs [data-an-sub="'+sub+'"]');
  await nav.waitFor({state:'attached',timeout:12000});
  await nav.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
  await nav.click({timeout:12000});
  await page.waitForTimeout(400);
 }
 await page.locator('#app').waitFor({state:'visible',timeout:12000});
}
async function renderPDF(browser, rows){
 const blocks=[];
 for(const r of rows){
  let src='';
  if(fs.existsSync(r.screenshot))src='data:image/png;base64,'+fs.readFileSync(r.screenshot).toString('base64');
  const data=r.metrics||{},issues=[...r.pageErrors,...r.localHttpErrors,...r.consoleErrors.slice(0,5),...(data.invalidSvgPaths||[]).slice(0,2).map(x=>'SVG inválido: '+x.html),...(r.error?[r.error]:[])];
  const detail=[
   'Erros de console: '+r.consoleErrors.length,
   'SVG inválidos: '+(data.invalidSvgPaths?.length||0),
   'Mutações: '+(data.mutationCount??'n/a'),
   'Substituições na raiz: '+(data.rootReplacements??'n/a'),
   'CLS 6s: '+(data.cls??'n/a'),
   'Overflow: '+(data.overflowPx??'n/a')+'px',
   'Erros JS: '+r.pageErrors.length,
   'HTTP local 4xx/5xx: '+r.localHttpErrors.length
  ].join(' | ');
  blocks.push('<section class="page"><h2>'+htmlEscape(r.viewport+' · '+r.title)+'</h2><p><b>'+htmlEscape(r.status)+'</b></p><p>'+htmlEscape(detail)+'</p>'+(src?'<img src="'+src+'">':'<p>Captura não disponível</p>')+'<p class="foot">Erros: '+htmlEscape(issues.join(' | ')||'Nenhum erro de JS/local registrado')+'</p></section>');
 }
 const overall=rows.filter(r=>r.status==='SEM FALHA DETECTADA (DEMO)').length;
 const intro='<section class="page"><h1>QA & Layout — Diário de Trader</h1><p>Auditoria E2E em Chromium real, tamanhos 1440×900 e 390×844. Data: '+htmlEscape(new Date().toISOString())+'</p><p>Referência: v805 de release.config.json; navegador servido pelo build da branch de QA.</p><h2>Escopo e limites</h2><p>'+overall+'/'+rows.length+' verificações sem falha detectada no modo DEMO. Nenhuma tela recebeu certificação «APROVADA 100%» sem login real, iPhone Safari físico e correção/reteste das ocorrências.</p><p>Foram capturadas mutações de DOM, CLS durante 6 segundos, exceções JavaScript, erros HTTP locais e overflow global. Cliques destrutivos, operação real e a criação/exclusão de conta de QA NÃO foram executados. O modo demonstração não acessa dados pessoais.</p></section>';
 const markup='<!doctype html><html><meta charset="utf-8"><style>@page{size:A4;margin:11mm}body{font-family:Arial,sans-serif;color:#152033}h1{font-size:26px}h2{font-size:16px;margin:8px 0}p{font-size:11px;line-height:1.45}.page{page-break-after:always;min-height:260mm;box-sizing:border-box}.page img{max-width:100%;max-height:220mm;object-fit:contain;border:1px solid #ccd1d7}.foot{font-size:9px;color:#555;word-break:break-word}</style><body>'+intro+blocks.join('')+'</body></html>';
 const p=await browser.newPage({viewport:{width:900,height:1200}});
 await p.setContent(markup,{waitUntil:'load'});
 await p.pdf({path:path.join(out,'relatorio-qa-layout-v805.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});
 await p.close();
}
async function main(){
 const results=[];
 await withApp(async (browser,base)=>{
  for(const [device,viewport,extra] of [
   ['Desktop',{width:1440,height:900},{}],
   ['iPhone emulado',{width:390,height:844},{isMobile:true,hasTouch:true,deviceScaleFactor:3}]
  ]){
   const context=await browser.newContext({...viewport,...extra,viewport,serviceWorkers:'block'});
   const page=await context.newPage();
   let active=null;const failures=[];
   page.on('pageerror',e=>{if(active)active.pageErrors.push(String(e.message).slice(0,230));});
   page.on('console',m=>{if(active&&m.type()==='error'){const loc=m.location();let source='';try{const u=new URL(loc.url);source=u.origin+u.pathname;}catch{source=loc.url||'fonte desconhecida';}active.consoleErrors.push(source+' linha '+loc.lineNumber+': '+m.text().replace(/token=[^&\s'\"]+/gi,'token=[oculto]').slice(0,250));}});
   page.on('response',r=>{if(active&&r.url().startsWith(base)&&r.status()>=400)active.localHttpErrors.push(r.status()+' '+r.url().slice(base.length));});
   page.on('requestfailed',req=>{if(active&&req.url().startsWith(base))failures.push(req.url());});
   await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>{window.__qaCsp=(window.__qaCsp||[]);window.__qaCsp.push({directive:e.violatedDirective,blocked:e.blockedURI,policy:e.originalPolicy.slice(0,600),source:e.sourceFile});}));
   await page.goto(base+'/?demo=1',{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#splash').waitFor({state:'hidden',timeout:20000});
   for(const spec of specs){
    const item={device,viewport:device,title:spec[1],key:spec[0],pageErrors:[],consoleErrors:[],cspViolations:[],localHttpErrors:[],screenshot:path.join(out,slug(device+'-'+spec[0])+'.png')};
    active=item;
    try{
     await go(page,spec);
     item.metrics=await measure(page);
     item.cspViolations=await page.evaluate(()=>{const a=window.__qaCsp||[];window.__qaCsp=[];return a.slice(0,50);});
     await page.screenshot({path:item.screenshot,fullPage:false,animations:'disabled',timeout:12000});
    }catch(e){
     item.error=String(e.message).slice(0,650);
     try{await page.screenshot({path:item.screenshot,fullPage:false,timeout:8000});}catch{}
    }
    item.status=statusOf(item);
    results.push(item);
    process.stdout.write('QA '+device+' '+spec[1]+' '+item.status+' CLS='+String(item.metrics?.cls??'n/a')+' overflow='+String(item.metrics?.overflowPx??'n/a')+'\n');
   }
   active=null;await context.close();
  }
  await renderPDF(browser,results);
 });
 const payload={generatedAt:new Date().toISOString(),mode:'isolated-demo-no-auth-write',releaseRequested:805,accountCreated:false,accountDeleted:false,browsers:'Chromium real; mobile emulated, not physical Safari',results};
 fs.writeFileSync(path.join(out,'resultado-qa-v805.json'),JSON.stringify(payload,null,2));
 console.log('Resultado final:',JSON.stringify({total:results.length,clean:results.filter(r=>r.status.startsWith('SEM FALHA')).length,failures:results.filter(r=>!r.status.startsWith('SEM FALHA')).map(r=>r.device+':'+r.title)}));
}
main().catch(e=>{console.error('Falha na execução QA:',e.stack||String(e));process.exitCode=1;});
