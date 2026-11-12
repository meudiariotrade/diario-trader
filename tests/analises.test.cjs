const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../analises-modelo.js'),D=require('../dominios.js');
test('comandos preservam acentos, comparação e limites; rejeitam injeção e ativos inválidos',()=>{
 assert.equal(M.command('TÉCNICO PETR4').modo,'TECNICO');assert.deepEqual(M.command('COMPARE PETR4 x VALE3').tickers,['PETR4','VALE3']);assert.equal(M.command('MODO PROVA CT1').modulo,'CT1');assert.equal(M.command('EXPLIQUE WACC').conceito,'WACC');
 for(const bad of ['ANALISE','COMPARE PETR4','TÉCNICO <script>','ANALISE PETR4;DROP','AGENDA'.repeat(500)])assert.throws(()=>M.command(bad));
});
test('variações, CAGR, DCF e risco preservam bases inválidas como ausência',()=>{
 assert.equal(M.change(120,100),20);assert.equal(M.change(-80,-100),20);assert.equal(M.change(20,0),null);assert.equal(M.cagr(-10,20,4),null);assert.ok(Math.abs(M.cagr(100,146.41,4)-10)<1e-9);
 const p=M.plan(100,95,115);assert.equal(p.vezes_risco,3);assert.equal(p.risco_pct,5);assert.equal(M.plan(100,105,115),null);
 assert.equal(M.dcf({fcf:100,growth:.05,wacc:.08,terminal:.09,shares:100}),null);assert.ok(M.dcf({fcf:100,growth:.05,wacc:.12,terminal:.03,shares:100}).preco>0);
});
test('renderização de relatórios escapa HTML e só permite links HTTPS',()=>{
 const h=M.markdown('# PETR4\n| Item | Valor |\n|---|---|\n| Receita | 100 |\n<script>alert(1)</script>\n[Fonte](https://bcb.gov.br/)\n[ruim](javascript:alert(1))');assert.ok(h.includes('<table>'));assert.ok(!h.includes('<script>'));assert.ok(h.includes('https://bcb.gov.br/'));assert.ok(!h.includes('href="javascript:'));assert.equal(M.safeUrl('https://a:b@exemplo.test'),null);
});
test('consulta livre e estados obrigatórios/opcionais têm contratos diferentes',()=>{
 const day={estado:3,cl:{p_limite:true,p_meta:true,p_stop:true},ckok:true};const s=D.dayState(day,[{id:'a'},{id:'b'}]);assert.equal(s.consultaLivre,true);assert.equal(s.preparo.completo,true);assert.equal(s.regras.marcadas,0);assert.equal(s.revisao.completa,false);assert.equal(D.route('diario'),'ops:historico');assert.equal(D.route('checklist'),'dia:pre');
});
test('catálogo preserva contrato futuro, ausência de preço, atraso e filas',()=>{
 assert.equal(D.asset('WIN').yahoo,null);assert.equal(D.asset('PETR4').yahoo,'PETR4.SA');assert.equal(D.quality({valor:100,em:new Date().toISOString()}),'indisponível');assert.equal(D.quality({valor:100,em:new Date(Date.now()-2*86400000).toISOString(),fonte:'Profit'}),'antigo');assert.equal(D.jobState({status:'feito'}).estado,'concluído');assert.equal(D.jobState({status:'erro'}).retomavel,true);
});
test('nota parcial não exclui operações nem vira apuração conferida; confirmação invalida após edição',()=>{
 const trades=[{id:'a',dt:'2026-10-01',exit:10},{id:'b',dt:'2026-10-02',exit:20}],notes=[{id:'n',d:'2026-10-01',trade_ids:['a']}];let s=D.fiscalCoverage('2026-10',trades,notes);assert.equal(s.estado,'importação parcial');assert.deepEqual(s.semVinculo,['b']);const confirmed={fingerprint:s.fingerprint};assert.equal(D.fiscalCoverage('2026-10',trades,notes,confirmed).conferida,true);assert.equal(D.fiscalCoverage('2026-10',[...trades,{id:'c',dt:'2026-10-03'}],notes,confirmed).conferida,false);
});
