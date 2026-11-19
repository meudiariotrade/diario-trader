'use strict';
// Executado em runner descartável. Nunca usa credenciais da conta principal.
const fs=require('node:fs'),crypto=require('node:crypto'),{chromium}=require('playwright');
const vm=require('node:vm'), cfg={window:{}};vm.runInNewContext(fs.readFileSync('config.js','utf8'),cfg);
const SB=cfg.window.SUPA_URL,KEY=cfg.window.SUPA_KEY,BASE=process.env.QA_BASE_URL||'https://meudiariotrade.github.io/diario-trader/';
const OUT='qa-results';fs.mkdirSync(OUT,{recursive:true});
if(process.argv.includes('--prepare')){
 const {execFileSync}=require('node:child_process');
 const email='qa-e2e-'+process.env.GITHUB_RUN_ID+'@example.com',password=crypto.randomBytes(24).toString('base64url')+'aA1!',id=crypto.randomUUID();
 const hash=execFileSync('python3',['-c',"import crypt,sys; print(crypt.crypt(sys.stdin.read(),crypt.mksalt(crypt.METHOD_BLOWFISH)))"],{input:password,encoding:'utf8'}).trim();
 fs.writeFileSync('.qa-credentials.json',JSON.stringify({email,password,id}),{mode:0o600});fs.mkdirSync('qa-provision',{recursive:true});fs.writeFileSync('qa-provision/request.json',JSON.stringify({id,email,hash,run:process.env.GITHUB_RUN_ID}));process.exit(0);
}
const {email,password,id:qaId}=JSON.parse(fs.readFileSync('.qa-credentials.json','utf8'));
const report={started:new Date().toISOString(),base:BASE,account:{email},screens:[],limitations:['iPhone: emulação Chromium 390x844 com toque; não é Safari em aparelho físico.','Janela de observação de 6 segundos por tela; não certifica ausência de problemas intermitentes.','Ações destrutivas e geração paga de IA não são disparadas para testar botões.']};
let token,browser;
const save=()=>fs.writeFileSync(OUT+'/results.json',JSON.stringify(report,null,2));
async function auth(path,body){const r=await fetch(SB+path,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const j=await r.json();return {ok:r.ok,status:r.status,j};}
async function route(page,id){
 const buttons=page.locator('[data-dt393-route="'+id+'"]');
 for(const b of await buttons.all())if(await b.isVisible()){await b.click();await page.waitForTimeout(450);return;}
 const menu=page.getByRole('button',{name:'Abrir menu do aplicativo',exact:true});
 if(await menu.isVisible())await menu.click();else await page.locator('#pcmenub').click();
 for(const b of await buttons.all())if(await b.isVisible()){await b.click();await page.waitForTimeout(450);return;}
 throw Error('Rota não acessível por controle visível: '+id);
}
async function dismiss(page){
 const open=page.getByRole('button',{name:'Abrir o diário',exact:true});if(await open.isVisible())await open.click();
 await page.waitForTimeout(1200);
 for(const sel of ['[data-onbx="pular"]','#m550-guia [data-m550="pular"]']){const b=page.locator(sel);if(await b.isVisible())await b.click();}
}
async function observe(page){
 return page.evaluate(()=>new Promise(resolve=>{
  const started=performance.now(), map=new Map(), buckets=Array(6).fill(0);let count=0,rootReplacements=0;
  const label=n=>{const e=n?.nodeType===1?n:n?.parentElement;return e?(e.id?'#'+e.id:e.tagName.toLowerCase()+'.'+String(e.className||'').split(' ').slice(0,2).join('.')):'unknown'};
  const observer=new MutationObserver(list=>{for(const m of list){count++;const sec=Math.min(5,Math.floor((performance.now()-started)/1000));buckets[sec]++;const key=label(m.target)+':'+m.type+(m.attributeName?':'+m.attributeName:'');map.set(key,(map.get(key)||0)+1);if(m.type==='childList'&&m.removedNodes.length&&m.addedNodes.length&&m.target.id==='app')rootReplacements++;}});
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});
  let shifts=[],po;try{po=new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)shifts.push({t:e.startTime,v:e.value,sources:e.sources?.map(s=>label(s.node))});});po.observe({type:'layout-shift',buffered:false});}catch{}
  setTimeout(()=>{observer.disconnect();po?.disconnect();let cls=0,session=0,first=0,last=0;for(const s of shifts){if(s.t-last>1000||s.t-first>5000){session=s.v;first=s.t;}else session+=s.v;last=s.t;cls=Math.max(cls,session);}
   const de=document.documentElement;
   const overflow=[...document.querySelectorAll('#app *')].filter(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&(r.right>innerWidth+2||r.left< -2)&&!n.closest('[hidden]')}).slice(0,30).map(n=>({node:label(n),text:n.textContent.slice(0,100),right:n.getBoundingClientRect().right}));
   const narrow=[...document.querySelectorAll('#app button,#app h1,#app h2,#app h3,#app label')].filter(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.width<45&&n.textContent.trim().length>8&&r.height>r.width*2}).map(n=>({node:label(n),text:n.textContent.slice(0,80)}));
   resolve({durationMs:performance.now()-started,mutations:count,buckets,hotspots:[...map].sort((a,b)=>b[1]-a[1]).slice(0,20),rootReplacements,cls,shifts,width:innerWidth,clientWidth:de.clientWidth,scrollWidth:de.scrollWidth,overflow,narrow,buttons:document.querySelectorAll('#app button').length});
  },6000);
 }));
}
async function audit(page,device,id,name,sub,events){
 const result={device,id,name,sub,status:'PENDENTE',errors:[],console:[],network:[]};report.screens.push(result);const from=events.length;
 try{
  await route(page,id);if(sub)await page.locator('[data-an-sub="'+sub+'"]').click();
  await page.waitForTimeout(1500);
  result.heading=await page.locator('#app').innerText().then(x=>x.slice(0,1400));
  result.metrics=await observe(page);
  result.screenshot=device+'-'+(sub||id)+'.png';await page.screenshot({path:OUT+'/'+result.screenshot,fullPage:false});
  result.fullScreenshot=device+'-'+(sub||id)+'-full.png';await page.screenshot({path:OUT+'/'+result.fullScreenshot,fullPage:true});
  const controls=await page.locator('#app button:visible').evaluateAll(bs=>bs.map(b=>({text:b.textContent.trim().slice(0,90),disabled:b.disabled,attrs:[...b.attributes].filter(a=>a.name.startsWith('data-')).map(a=>[a.name,a.value])})));result.controls=controls;
  result.events=events.slice(from);result.errors=result.events.filter(e=>e.type==='pageerror');result.console=result.events.filter(e=>e.type==='console');result.network=result.events.filter(e=>e.type==='http'||e.type==='requestfailed');
  result.status=result.errors.length||result.metrics.scrollWidth>result.metrics.clientWidth||result.metrics.cls>0.1||result.metrics.rootReplacements>5||result.metrics.narrow.length?'REPROVADA':'REVISÃO VISUAL';
 }catch(e){result.status='BLOQUEADA';result.error=String(e);await page.screenshot({path:OUT+'/'+device+'-'+(sub||id)+'-blocked.png'}).catch(()=>{});}
 console.log('QA_SCREEN',JSON.stringify({device,name,status:result.status,metrics:result.metrics&&{mutations:result.metrics.mutations,cls:result.metrics.cls,width:result.metrics.scrollWidth,root:result.metrics.rootReplacements},error:result.error}));save();
}
(async()=>{
 try{
  report.account.id=qaId;save();console.log('QA_ACCOUNT_PENDING',JSON.stringify(report.account));
  for(let i=0;!token&&i<24;i++){await new Promise(r=>setTimeout(r,10000));const login=await auth('/auth/v1/token?grant_type=password',{email,password});if(login.ok)token=login.j.access_token;}
  if(!token)throw Error('Conta QA aguardando confirmação específica; nenhum usuário principal foi acessado.');
  report.account.authenticated=true;save();console.log('QA_AUTHENTICATED',report.account.id);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox']});
  for(const [device,width,height,mobile] of [['desktop',1440,900,false],['iphone',390,844,true]]){
   const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?3:1,timezoneId:'America/Sao_Paulo'});
   const page=await context.newPage(),events=[];
   page.on('pageerror',e=>events.push({type:'pageerror',message:e.message}));page.on('console',m=>{if(m.type()==='error')events.push({type:'console',message:m.text().slice(0,1000)})});
   page.on('response',r=>{if(r.status()>=400)events.push({type:'http',status:r.status(),url:r.url().replace(/([?&](?:token|key|apikey)=)[^&]+/gi,'$1REDACTED')})});page.on('requestfailed',r=>events.push({type:'requestfailed',url:r.url().split('?')[0],message:r.failure()?.errorText}));
   await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:60000});
   const cover=page.getByRole('button',{name:'Abrir o diário',exact:true});if(await cover.isVisible())await cover.click();await page.waitForTimeout(2000);
   const enter=page.getByRole('button',{name:'Já tenho conta — entrar e sincronizar',exact:true});if(await enter.isVisible())await enter.click();else{await dismiss(page);await route(page,'conta');}
   await page.locator('#ce').fill(email);await page.locator('#cp').fill(password);await page.locator('[data-a="auth"]').click();
   await page.waitForFunction(()=>typeof SESS!=='undefined'&&!!SESS?.uid,{timeout:45000});
   const actual=await page.evaluate(()=>SESS?.uid);if(actual!==report.account.id)throw Error('Conta divergente: auditoria interrompida.');
   await dismiss(page);report[device]={version:await page.evaluate(()=>window.DIARIO_RELEASE),loginEvents:events.splice(0)};save();
   for(const [id,name] of [['home','Início'],['mercado','Mercado'],['ops','Operações'],['carteiras','Carteira'],['term','Terminal'],['estudos','Estudos']])await audit(page,device,id,name,null,events);
   for(const [sub,name] of [['pesquisa','B3 & EUA'],['br','Screener Brasil'],['us','Screener EUA'],['tecnico-br','Técnico Brasil'],['tecnico-world','Técnico EUA & Cripto']])await audit(page,device,'analises',name,sub,events);
   await context.close();
  }
 }catch(e){report.fatal=String(e);console.error('QA_FATAL',report.fatal);}
 finally{
  if(browser)await browser.close();
  if(token&&report.account.id){try{const r=await fetch(SB+'/functions/v1/conta',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({acao:'excluir',senha:password,confirma:'EXCLUIR'}),signal:AbortSignal.timeout(110000)});report.cleanup={status:r.status,body:await r.json()};console.log('QA_CLEANUP',JSON.stringify(report.cleanup));}catch(e){report.cleanup={error:String(e)}}}
  report.finished=new Date().toISOString();save();
 }
 if(report.fatal||report.screens.some(s=>s.status==='REPROVADA'||s.status==='BLOQUEADA'))process.exitCode=1;
})();
