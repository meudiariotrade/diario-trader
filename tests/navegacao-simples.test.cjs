const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');

test('navegação simples: seis caminhos preservam ações, gráfico salvo e acesso avançado', {timeout:120000}, async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const app=p.locator('#app:not(.v503-fantasma)');
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 // v563: Início sem "Comece por aqui" e sem atalhos; o Terminal fica no menu.
 await expect(app.locator('.simple-actions')).toHaveCount(0);
 await expect(app.locator('.simple-day-review')).toHaveCount(0);
 await expect(app.locator('.simple-explore')).not.toHaveAttribute('open');
 await app.locator('.simple-explore>summary').click();
 await expect(app.locator('.simple-explore [data-dt393-route="estudos"],.simple-explore [data-dt393-route="est"]')).toBeVisible();
 await p.evaluate(()=>render());
 await expect(app.locator('.simple-explore')).toHaveAttribute('open');
 // Novo começo do Terminal preserva as preferências reais do GP.
 await p.evaluate(()=>{const state={a:'EWZ',b:'SPX',per:'6M',freq:'D',mode:'dual',ma:[],ev:true,table:false};localStorage.setItem('diario-v421-gp',JSON.stringify(state));localStorage.setItem('diario-v428-ctx',JSON.stringify({'T:GP':state}));});
 await p.reload();await p.locator('#splash').waitFor({state:'hidden'});
 await p.locator('[data-dt393-action="menu"]').first().click().then(()=>p.locator('#dt394-drawer [data-dt393-route="term"]').first().click());
 await expect(p.locator('body')).toHaveClass(/tf413-home/);
 await expect(app.locator('#terminal-inicio')).toBeVisible();
 await expect(app.locator('.simple-terminal-intro')).toHaveCount(0);
 await app.getByRole('button',{name:'Gráficos',exact:true}).click();
 await expect(app.locator('#v421-gp')).toBeVisible();
 assert.equal(await p.evaluate(()=>window.DIARIO_GP421.state().a),'EWZ');
 assert.equal(await p.evaluate(()=>window.DIARIO_GP421.state().per),'6M');
 await app.locator('.tf415-nav [data-tf415-nav="HOME"]').click();
 await expect(app.locator('#terminal-inicio')).toBeVisible();
 await app.getByRole('button',{name:'Gráficos',exact:true}).click();
 assert.equal(await p.evaluate(()=>window.DIARIO_GP421.state().a),'EWZ');
 assert.equal(await p.evaluate(()=>window.DIARIO_GP421.state().per),'6M');
 await app.locator('.tf415-nav [data-tf415-nav="HOME"]').click();
 await expect(app.locator('.simple-terminal-more')).toHaveCount(0);
 await p.evaluate(()=>document.querySelector('#app:not(.v503-fantasma) [data-tf415-nav="NEWSBR"]').click());
 await expect(app.locator('#tf413')).toHaveClass(/t428-p-NEWSBR/);
 // Mercado começa nas cotações; Agenda continua sendo uma ação direta.
 await p.getByRole('button',{name:'Mercado',exact:true}).last().click();
 await expect(app.locator('.dt395-native-mercado')).toHaveAttribute('data-m403-sub','cq');
 await expect(app.locator('.simple-comparison')).toHaveCount(1);
 await expect(app.locator('.simple-comparison .m409-chart-card')).toBeHidden();
 // v570: o menu Mais fica só com Análises e Movimentos; a comparação sai do menu.
 await app.locator('[data-mkt549="mais"]').click();
 await expect(app.locator('[data-mkt549-ir="comparar"]')).toBeHidden();
 await expect(app.locator('[data-mkt549-ir="lab"]')).toBeVisible();
 await app.locator('[data-mkt549="mais"]').click();
 await app.getByRole('button',{name:'Agenda',exact:true}).click();
 await expect(app.locator('.simple-market-about>summary')).toBeVisible();
 await expect(app.locator('.m404-overview')).toBeHidden();
 await expect(app.locator('#mkcal')).toBeHidden();
 await app.locator('.simple-calendar>summary').click();
 await expect(app.locator('#mkcal')).toBeVisible();
 await app.locator('.simple-market-about>summary').click();
 await expect(app.locator('.m404-overview')).toBeVisible();
 await p.getByRole('button',{name:'Início',exact:true}).last().click();
 await expect(app.locator('.simple-context')).toHaveCount(1);
 await app.locator('.simple-context [data-v4mkt="ag"]').click();
 await expect(app.locator('.dt395-native-mercado')).toHaveAttribute('data-m403-sub','ag');
 await p.getByRole('button',{name:'Início',exact:true}).last().click();
 await app.getByRole('button',{name:'Perguntar à IA',exact:true}).click();
 const questions=p.locator('#wf-chat-panel .simple-questions');
 await expect(questions).toBeVisible();
 await questions.getByRole('button').first().click();
 assert.match(await p.locator('#wf-chat-panel textarea').inputValue(),/agenda econômica/);
 // Escolher uma pergunta não envia nem cobra uma consulta.
 assert.equal(await p.locator('.wf-chat-message').count(),0);
 await p.locator('#wf-chat-panel [data-chat-close]').click();
 for(const width of [320,390,1440]){await p.setViewportSize({width,height:900});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Sem transbordamento em '+width)}
 assert.deepEqual(errors,[]);
 // Primeiro acesso, no banco real vazio: explorar ou configurar sem alterar salvamento.
 const first=await browser.newPage({viewport:{width:390,height:844}});
 await first.goto(base);await first.locator('#splash').waitFor({state:'hidden'});
 await expect(first.getByRole('button',{name:'Explorar aplicativo',exact:true})).toBeVisible();
 await expect(first.locator('#onb [data-onb="cap"]')).toBeHidden();
 await first.locator('.simple-risk>summary').click();
 await expect(first.locator('#onb [data-onb="cap"]')).toBeVisible();
 await first.locator('#onb [data-onb="cap"]').fill('50000');
 await first.locator('#onb [data-onb="pd"]').fill('250');
 await first.locator('#onb [data-onbx="ok"]').click();
 await expect(first.locator('#onb')).toHaveCount(0);
 assert.equal(await first.evaluate(()=>S.ax['ct.cap']),50000);
 assert.equal(await first.evaluate(()=>S.ax.trava.perdaDia),250);
 // Outra visita sem configuração pode explorar sem preencher o formulário.
 const explore=await browser.newPage();await explore.goto(base);await explore.locator('#splash').waitFor({state:'hidden'});
 await explore.getByRole('button',{name:'Explorar aplicativo',exact:true}).click();
 await expect(explore.locator('#onb')).toHaveCount(0);

}));
