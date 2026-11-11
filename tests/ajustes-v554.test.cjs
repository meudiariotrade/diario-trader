const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
test('v554: trava pelo pré-mercado, desfazer regra, GANHO/PERDA e aba Desempenho na planilha',{timeout:120000},async()=>withApp(async(browser,base)=>{
 const p=await browser.newPage({viewport:{width:390,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 // Horário fixo durante o pregão: o teste não pode depender do relógio de quem roda (as travas de pós-17h mudam a tela).
 await p.clock.setFixedTime(new Date('2026-11-11T15:00:00Z'));
 await p.goto(base+'/?demo=1');await p.locator('#splash').waitFor({state:'hidden'});
 const app=p.locator('#app:not(.v503-fantasma)');
 // Trava: conta sem trades não exige checklist; com trades, só os itens do pré-mercado contam.
 const trava=await p.evaluate(()=>{const cfg=(S.ax.trava??={});cfg.on=1;cfg.chk=1;const guard=S.trades;S.trades=[];const a=travaEstado().resolver.some(x=>x.id==='chk');S.trades=guard;
  S.rules=[{id:'a',t:'pre',phase:'pre'},{id:'b',t:'post',phase:'post'}];const td=pHoje().td;(S.days[td]??={}).chk={a:true};const b=travaEstado().resolver.some(x=>x.id==='chk');S.days[td].chk={};const c=travaEstado().resolver.find(x=>x.id==='chk')?.txt;return{a,b,c}});
 assert.deepEqual(trava,{a:false,b:false,c:'checklist do pré-mercado 0/1'});
 // Desfazer exclusão de regra.
 await p.evaluate(()=>{S.rules=[{id:'r1',cat:0,t:'Regra de teste'}];tab='regras';render()});
 await app.locator('[data-a="delrule"][data-id="r1"]').first().click();
 await expect(p.locator('#v554-undo')).toBeVisible();
 assert.equal(await p.evaluate(()=>S.rules.length),0);
 await p.locator('[data-v554-undo]').click();
 assert.equal(await p.evaluate(()=>S.rules[0]?.t),'Regra de teste');
 await expect(app.locator('[data-a="delrule"][data-id="r1"]').first()).toHaveAttribute('aria-label','Excluir regra');
 // Vocabulário.
 assert.match(await p.evaluate(()=>trBadge({pl:10})),/GANHO/);
 assert.match(await p.evaluate(()=>trBadge({pl:-10})),/PERDA/);
 // Planilha: aba Desempenho.
 const d=await p.evaluate(()=>{const s=DIARIO_V554_DESEMP(S.trades);return s&&{nome:s.nome,linhas:s.rows.filter(Boolean).map(r=>r[0].v)}});
 assert.equal(d.nome,'Desempenho');
 for(const k of ['Taxa de acerto','Payoff (ganho médio ÷ perda média)','Expectativa por trade (× risco)','Maior rebaixamento (R$)','Por setup','Por dia da semana']) assert.ok(d.linhas.includes(k),k);
 const ok=await p.evaluate(async()=>{const s=DIARIO_V554_DESEMP(S.trades);const out=await DIARIO_V507.livro([s]);return !!out&&(out.length||out.size)>1000});
 assert.equal(ok,true);
 assert.deepEqual(errors,[]);
}));
