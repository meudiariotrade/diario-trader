const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
test('Plano operacional: regras por fase, parâmetros em Regras, nomes antigos migrados e conflitos fora da tela',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 const r=await p.evaluate(()=>{const ids=PlanoOperacional.RULES.map(x=>x[0]);const got=S.rules.filter(x=>ids.includes(x.id));return{n:got.length,total:ids.length,fases:[...new Set(got.map(x=>x.phase))].sort()}});
 assert.equal(r.n,r.total);assert.deepEqual(r.fases,['during','post','pre']);
 // Não duplica e respeita regra apagada.
 await p.evaluate(()=>{S.ax.planoOp=0;S.rules=S.rules.filter(x=>x.id!=='po-pre-margem');(S.del??={})['po-pre-margem']=Date.now();PlanoOperacional.seed()});
 assert.equal(await p.evaluate(()=>S.rules.filter(x=>x.id==='po-pre-stop').length),1);
 assert.equal(await p.evaluate(()=>S.rules.some(x=>x.id==='po-pre-margem')),false);
 await p.evaluate(()=>{tab='regras';render()});
 await expect(p.locator('.po-regras')).toContainText('Folga do stop em barra');await expect(p.locator('#app')).not.toContainText('Projeto');await expect(p.locator('#app')).not.toContainText('2027');
 for(const width of [320,1440]){await p.setViewportSize({width,height:900});assert.ok(await p.locator('.po-regras').evaluate(n=>n.getBoundingClientRect().right<=innerWidth+1))}
 // Setup antigo vira o novo nome sem perder a operação.
 const novo=await p.evaluate(()=>{S.trades[0].setup='Projeto Os 10% — 2027 · Índice';S.ax['chk.setups']['Projeto Os 10% — 2027 · Dólar']=['Conferi o offset de 15 pontos.'];Projeto2027.ensure();return{t:S.trades[0].setup,old:Object.keys(S.ax['chk.setups']).some(k=>/Projeto/.test(k)),d:chkDe(Projeto2027.names.dolar).length}});
 assert.equal(novo.t,'Índice · padrão clássico + ações de peso');assert.equal(novo.old,false);assert.equal(novo.d,11);
 // Conflito interno de sincronização é resolvido e o aviso não aparece.
 await p.evaluate(()=>{const d=Object.keys(S.days)[0];S.days[d]._conflicts=[{id:'x',path:['_rulesSnapshot','at'],versions:[{value:1,present:true,at:1,by:'a'},{value:2,present:true,at:2,by:'b'}]}];tab='dia';render()});
 await expect(p.locator('.diary-conflicts')).toHaveCount(0);
 assert.equal(await p.evaluate(()=>Object.values(S.days).some(d=>(d._conflicts||[]).length)),false);
 assert.deepEqual(errors,[]);
}));
