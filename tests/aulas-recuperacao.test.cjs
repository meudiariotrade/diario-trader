const{test}=require('node:test');const assert=require('node:assert/strict');const{expect}=require('playwright/test');const{withApp}=require('./helpers/app.cjs');
test('aulas: atualiza roteiro entre aparelhos, diferencia interrupção e respeita sessão e cache',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 await p.evaluate(()=>{
  window.DIARIO_DEMO=false;SESS={uid:'aula-user-a',at:'teste'};tok=async()=>{};window.aulaRequests=[];window.aulaDone=false;window.aulaDeny=false;window.videoRequests=0;const nativeFetch=window.fetch;window.fetch=(url,...args)=>{if(String(url).includes('/storage/v1/object/list/aulas-videos'))videoRequests++;return nativeFetch(url,...args)};
  rq=async(url,options={})=>{aulaRequests.push({url,method:options.method||'GET'});if(aulaDeny)throw Error('Sessão expirada. Entre na conta.');if(options.method)return new Response('{}');
   if(url.includes('select=roteiro'))return new Response(JSON.stringify([{roteiro:{cenas:[{titulo:'Cena nova',fala:['Roteiro atualizado.'],vis:{tipo:'titulo',t:'Nova'}},{titulo:'Segunda',fala:['Segunda cena.'],vis:{tipo:'titulo',t:'Segunda'}}]}}]));
   return new Response(JSON.stringify([{id:'aula-bob',livro:'Livro de teste',numero:2,titulo:aulaDone?'Roteiro concluído':'Gerando…',status:aulaDone?'pronta':'gerando',criado_em:'2026-11-01T00:00:00Z',atualizado_em:aulaDone?'2026-11-02T00:00:00Z':'2026-11-01T00:00:00Z',partes:[0],min:2}]));
  };
  localStorage.setItem('aulas-v318:aula-user-a:aulas-rot-v1:aula-bob',JSON.stringify({em:'2026-11-01T00:00:00Z',r:{cenas:[{titulo:'Roteiro antigo',fala:['Antigo'],vis:{tipo:'titulo',t:'Antigo'}}]}}));
  tab='estudos';ESV='aul';render();
 });
 await p.evaluate(()=>document.querySelector('[data-dt397-view="aul"]').click());
 await expect(p.locator('#aulas-sync')).toBeVisible();await expect(p.getByText('Aula 2 · geração sem atualização',{exact:true})).toBeVisible();
 await expect(p.getByRole('button',{name:'Ver roteiro parcial',exact:true})).toBeVisible();
 await p.evaluate(()=>{aulaDone=true});await p.getByRole('button',{name:'Atualizar aulas',exact:true}).click();
 await expect(p.locator('#app:not(.v503-fantasma) .au-item[data-auopen="aula-bob"]')).toContainText('Roteiro concluído');await expect(p.locator('.au-stale')).toHaveCount(0);
 await p.locator('#app:not(.v503-fantasma) .au-item[data-auopen="aula-bob"]').click();await expect(p.locator('#aup')).toBeVisible();assert.equal(await p.evaluate(()=>AULAS._dbg.P.a.r.cenas.length),2,'não reutiliza roteiro parcial de criação antiga');
 await p.locator('[data-aux]').click();await expect(p.locator('#aup')).toHaveClass(/au361-floating/);await p.evaluate(()=>DiarioAulasRecuperacao.refresh(true));assert.equal(await p.evaluate(()=>AULAS._dbg.P.on),1);await expect(p.locator('#aup')).toBeVisible();await p.locator('[data-au361close]').click();
 for(const width of [320,390,1440]){await p.setViewportSize({width,height:1000});assert.ok(await p.locator('#aulas-sync').evaluate(n=>n.getBoundingClientRect().right<=innerWidth));}
 await p.evaluate(()=>{aulaDeny=true});await p.getByRole('button',{name:'Atualizar aulas',exact:true}).click();await expect(p.locator('#aulas-sync [data-aulas-login]')).toBeVisible();await expect(p.locator('#aulas-sync')).toContainText('Entre na sua conta');
 const checks=await p.evaluate(()=>{
  const stale={id:'s',numero:1,status:'gerando',criado_em:'2026-01-01T00:00:00Z',partes:[0]};
  return {active:DiarioAulasRecuperacao.gerandoHtml(stale,{busy:true,meu:true}),fresh:DiarioAulasRecuperacao.gerandoHtml({...stale,atualizado_em:new Date().toISOString()},{busy:false,meu:false}),writes:aulaRequests.filter(r=>r.url.includes('/functions/v1/aulas'))};
 });assert.equal(checks.active,'');assert.equal(checks.fresh,'');assert.deepEqual(checks.writes,[],'consultar nunca dispara nova geração');
 assert.ok(await p.evaluate(()=>videoRequests>=1&&videoRequests<=2),'falha dos vídeos tem pausa, sem ciclo de requisições');
 await p.evaluate(()=>{SESS=null;AULAS.ensureOwner();render()});assert.deepEqual(await p.evaluate(()=>AULAS.getLista()),[]);assert.deepEqual(errors,[]);
}));
