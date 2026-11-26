const {test}=require('node:test'),assert=require('node:assert/strict');
const {withApp}=require('./helpers/app.cjs'),{expect}=require('playwright/test');
test('Áurea mobile mantém compositor visível com resposta longa e limpa ao fechar',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 await p.evaluate(()=>window.TraderChat.open());
 const panel=p.locator('#wf-chat-panel');await expect(panel).toBeVisible();
 const composer=panel.locator('.wf-chat-composer'),history=panel.locator('.wf-chat-history');
 await expect(composer).toBeVisible();
 await p.evaluate(()=>{const h=document.querySelector('#wf-chat-panel .wf-chat-history');h.innerHTML='<article>'+('Resposta extensa. '.repeat(1000))+'</article>';});
 const bounds=await p.evaluate(()=>{const f=document.querySelector('#wf-chat-panel form').getBoundingClientRect(),h=document.querySelector('#wf-chat-panel .wf-chat-history'),r=h.getBoundingClientRect();return {formBottom:f.bottom,historyBottom:r.bottom,view:window.visualViewport?.height||innerHeight,scroll:h.scrollHeight,client:h.clientHeight}});
 assert.ok(bounds.formBottom<=bounds.view+2);assert.ok(bounds.historyBottom<=bounds.formBottom);assert.ok(bounds.scroll>bounds.client);
 const png=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=120;c.height=80;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,120,80);return c.toDataURL('image/png').split(',')[1]});
 await panel.locator('[name="photo"]').setInputFiles({name:'grafico.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await expect(panel.locator('.wf-chat-attachment')).toBeVisible();
 await panel.locator('textarea').fill('Minha tese sobre VALE3');
 await panel.locator('[data-chat-close]').click();await expect(panel).toBeHidden();
 await p.evaluate(()=>window.TraderChat.open());
 await expect(panel.locator('textarea')).toHaveValue('');
 await expect(panel.locator('.wf-chat-attachment')).toBeHidden();
 await expect(panel.locator('.wf-chat-empty')).toBeVisible();
 await p.close();
}));

test('v1007: marca pivôs sobre a imagem original e mostra cenário e invalidação',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});await p.evaluate(()=>window.TraderChat.open());
 const url=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=200;c.height=400;return c.toDataURL('image/png')});
 await p.evaluate(url=>{ECO.l=[{id:'pivos',q:'Analise o gráfico',em:new Date().toISOString(),por:'conselho',imagem:url,r:{resumo:'Correção em andamento',estrutura:{periodo:'Diário',confirmacao:'Perda do fundo',invalidacao:'Superação do topo'},pivos:[{tipo:'topo',estado:'confirmado',x:.4,y:.2,preco:'65,00',motivo:'Rompimento do fundo anterior'},{tipo:'fundo',estado:'potencial',x:.6,y:.7,preco:'58,00',motivo:'Reação em confirmação'}]}}];ecoPaint();},url);
 const panel=p.locator('#wf-chat-panel');
 await expect(panel.locator('[data-aurea-pivo]')).toHaveCount(2);
 await expect(panel.locator('.wf-chat-sent-image img')).toHaveAttribute('src',url);
 await expect(panel.locator('.wf-chat-history')).toContainText('Superação do topo');
 await panel.locator('[data-chat-close]').click();await p.close();
}));

test('v1019 opções recolhidas, consentimento individual e anexos compactos',{timeout:90000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});await p.evaluate(()=>window.TraderChat.open());
 const panel=p.locator('#wf-chat-panel'),opts=panel.locator('.wf-chat-options');
 await expect(opts.locator('[name="bookContext"]')).toBeHidden();await expect(opts.locator('[data-chat-option-count]')).toHaveText('Nenhuma ativa');
 const compact=await panel.locator('form').evaluate(el=>el.getBoundingClientRect().height);
 await opts.locator('summary').click();await opts.locator('[name="bookContext"]').check();await opts.locator('[name="privateContext"]').check();
 await expect(opts.locator('[data-chat-option-count]')).toHaveText('2 ativas');
 await opts.locator('[name="debateContext"]').check();await expect(opts.locator('[name="privateContext"]')).not.toBeChecked();
 await opts.locator('summary').click();await expect(opts.locator('[name="bookContext"]')).toBeHidden();await expect(opts.locator('[data-chat-option-count]')).toHaveText('2 ativas');
 assert.ok(compact<180,'compositor recolhido não deve ocupar metade da tela');
 await panel.locator('[data-chat-close]').click();await p.evaluate(()=>window.TraderChat.open());await expect(opts.locator('[data-chat-option-count]')).toHaveText('Nenhuma ativa');
 await p.close();
}));
