const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('src/shared/inteligencia-etapa2-dados.js','utf8');
const window={};vm.runInNewContext(source,{window});const m=window.DiarioInteligenciaEtapa2Dados;
const trade=(changes={})=>({id:'1',ativo:'WINZ26',tipo:'D',side:'C',entry:140000,exit:140100,
  stop:139900,qty:1,pv:0.2,dt:'2026-11-19T09:30',dtx:'2026-11-19T09:44',
  rules:'s',setup:'Pullback',...changes});
test('v808: auditoria não altera trades e exclui abertas',()=>{
 const original=[trade(),trade({id:'2',stop:'',rules:'n'}),trade({id:'3',exit:'',dtx:''})];
 const before=JSON.stringify(original);
 const aud=m.auditarOperacoes(original,{isOpen:t=>!t.exit,pnl:t=>t.id==='1'?100:-50,r:t=>t.id==='1'?1:-0.5});
 assert.equal(aud.n,2);assert.equal(aud.comResultado,2);
 assert.equal(aud.graves,1);assert.equal(aud.pendencias,1);
 assert.equal(JSON.stringify(original),before);
});
test('v808: flags por estratégia, stop invertido e disciplina são auditáveis',()=>{
 const item=trade({setup:'',stop:140200,rules:'n'});
 const r=m.auditarOperacoes([item],{isOpen:()=>false}).registros[0];
 assert.equal(r.grave,true);
 assert.ok(r.falhas.some(x=>x.texto.includes('Stop informado')));
 assert.ok(r.falhas.some(x=>x.texto.includes('não seguiu')));
 assert.ok(r.falhas.some(x=>x.texto.includes('Estratégia')));
});
test('v808: todos os grupos mostram n e exigem cinco trades para taxa',()=>{
 const a=m.auditarOperacoes([trade({id:'1'}),trade({id:'2',dt:'2026-11-19T10:30'})],{
  isOpen:()=>false,pnl:()=>20}).registros;
 const g=m.resumoCondicoes(a,'regime');
 assert.equal(g[0].n,2);assert.equal(g[0].amostraSuficiente,false);assert.equal(g[0].taxaAcerto,null);
 const many=m.resumoCondicoes([...a,...a,...a],'regime');
 assert.equal(many[0].n,6);assert.equal(many[0].amostraSuficiente,true);assert.equal(many[0].taxaAcerto,100);
});
test('v808: carteira mantém moedas independentes, setor comprovado e risco temático hipotético',()=>{
 const p=m.exposicaoCarteira({
   BR:{pos:[{tk:'PETR4',v:200,cl:'AC'},{tk:'ITUB4',v:100,cl:'AC'}]},
   US:{pos:[{tk:'AAPL',v:50,cl:'AC'}]}
 },{'BR:PETR4':{setor:'Petróleo',empresa:'Petróleo Brasileiro S.A.'},'BR:ITUB4':{setor:'Bancos'}});
 assert.equal(p[0].moeda,'BRL');assert.equal(p[1].moeda,'USD');
 assert.equal(p[0].total,300);assert.equal(p[1].total,50);
 assert.equal(Math.round(p[0].maiorEmpresa.pct),67);
 assert.ok(p[0].fatoresHipoteticos.some(f=>f.nome.includes('Energia')));
 assert.ok(p[1].setores.some(x=>x.nome.includes('não identificado')));
});
test('v808: só exibe mudanças quando as referências são realmente distintas',()=>{
 const a=m.extrairFundamentos({ticker:'PETR4',roe:20,divida_liquida_ebitda:2},'2026-Q3');
 const b=m.extrairFundamentos({ticker:'PETR4',roe:15,divida_liquida_ebitda:3},'2026-Q2');
 assert.equal(m.mudaFundamentos(a,a).comparavel,false);
 const r=m.mudaFundamentos(b,a);
 assert.equal(r.comparavel,true);
 assert.ok(r.mudancas.some(x=>x.indicador==='roe'&&x.efeito==='deterioração'));
 assert.ok(r.mudancas.some(x=>x.indicador==='divida_liquida_ebitda'&&x.efeito==='pressão potencial'));
 assert.equal(m.mudaFundamentos(a,null).comparavel,false);
});
test('v808: estudos distingue mecânica econômica de causalidade',()=>{
 assert.match(m.temaEstudo({titulo:'Copom eleva Selic'}).tema,/Política monetária/);
 assert.match(m.temaEstudo({titulo:'IPCA surpreende mercado'}).mecanica,/expectativas/i);
});
