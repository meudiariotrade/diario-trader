const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');

const root=fs.readFileSync('src/domains/layers/03-apresentacao.js','utf8');
const css=fs.readFileSync('src/app-theme.css','utf8');
const intel=fs.readFileSync('src/intelligence/etapa1.js','utf8');

test('v810 preserva cards nativos e seleção contextual sem navegar ou criar rotas',()=>{
  assert.match(root,/v810Seletor\(\$\)/);
  assert.match(root,/v810-hero/);
  assert.match(root,/v829-split/); // v829: grades viraram tela dividida
  assert.match(root,/v829DiaKpis/);
  assert.match(root,/data-v4auto="1"/);
  assert.match(root,/v810Manual=\{phase:i,anchor:c\?\.anchorDate,until:/);
  assert.match(root,/v810Manual=null;qt=null;xt\(\)/);
  assert.match(root,/v810Manual && \(now>=v810Manual\.until/);
  assert.match(root,/const be = \{ home: le, dia: ie, ops: de, stats: ue \}/);
  const v810=root.slice(root.indexOf('function v810Operacoes'),root.indexOf('function Ft()'));
  assert.doesNotMatch(v810,/fetch\(|supabase\./);
});
test('v810 usa dados reais de risco, checklists e operações sem números fictícios',()=>{
  assert.match(root,/v810Operacoes\(t,a\)/);
  assert.match(root,/const completas=encerradas\.length===validas\.length&&validas\.length>0/);
  assert.match(root,/typeof isOpen==="function"&&isOpen\(t\)/);
  assert.match(root,/Dados insuficientes/);
  assert.match(root,/Sem resultado realizado/);
  assert.match(root,/Resultado realizado/);
  assert.match(root,/planoIntegrado789\(t,e\)/);
  assert.match(root,/Et\(\)/);
  assert.match(root,/const agenda=f\(\(\)=>AG\.v\.flatMap/);
  assert.match(root,/MKT\.items/);
});
test('v810 ocupa toda a largura útil em desktop, safe mobile e valores tabulares',()=>{
  assert.match(css,/\/\* v810 — Início e Meu Dia/);
  assert.match(css,/\.v810-home-grid,\.v810-day-grid\)/);
  assert.match(css,/repeat\(auto-fit,minmax\(min\(100%,420px\),1fr\)\)/);
  assert.match(css,/max-width:none!important/);
  assert.match(css,/font-variant-numeric:tabular-nums/);
  assert.match(css,/@media \(max-width:640px\)/);
});
test('sessões B3 e EUA respeitam dia comum, feriado B3 e pós-pregão',()=>{
  const dom=new JSDOM('',{url:'https://app.test',runScripts:'outside-only'});
  const w=dom.window;
  w.eval(fs.readFileSync('src/shared/sessoes-mercado.js','utf8'));
  const time=(date,hour)=>new Date(date+'T'+hour+'-03:00').getTime();
  assert.equal(w.DiarioSessoes.context(time('2026-11-19','08:00:00')).phase,'pre');
  assert.equal(w.DiarioSessoes.context(time('2026-11-19','10:30:00')).phase,'during');
  assert.equal(w.DiarioSessoes.context(time('2026-11-19','19:30:00')).phase,'post');
  const holiday=w.DiarioSessoes.context(time('2026-11-20','12:00:00'));
  assert.equal(holiday.b3.state,'fechado');
  assert.equal(holiday.mode,'b3_fechada');
  assert.equal(holiday.us.tradable,true);
  const manual=w.DiarioSessoes.context(time('2026-11-19','10:30:00'),'post');
  assert.equal(manual.phase,'post');
  assert.equal(manual.manual,true);
  dom.window.close();
});
test('Central única em Meu Dia preserva o nó existente e desmonta ao sair',()=>{
  const dom=new JSDOM('<div id="app"><div class="dt393-native"><section class="v810-day-context"><div data-intel-content></div></section></div></div>',{url:'https://app.test',runScripts:'outside-only'});
  const w=dom.window;
  w.tab='dia';
  w.fetch=async()=>({ok:false,status:503});
  w.eval(intel);
  const el=w.document.querySelector('.v810-day-context');
  assert.equal(w.document.querySelectorAll('[data-intel-etapa1]').length,1);
  assert.equal(el.dataset.intelNative,'1');
  assert.match(el.textContent,/Orientação da sessão/);
  w.DiarioInteligenciaEtapa1.montar();
  assert.equal(w.document.querySelector('[data-intel-etapa1]'),el);
  w.tab='ops';
  w.DiarioInteligenciaEtapa1.montar();
  assert.equal(w.document.querySelector('[data-intel-etapa1]'),null);
  assert.equal(w.document.querySelector('.v810-day-context'),el);
  dom.window.close();
});
