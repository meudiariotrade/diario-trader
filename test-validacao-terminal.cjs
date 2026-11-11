/* Testes DOM reais (JSDOM) da Central de Validação do Terminal.
 * Não consulta mercado nem banco; executa em memória com origem fictícia.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const script=fs.readFileSync('validacao-terminal.js','utf8');
const vc=new VirtualConsole();
const errors=[];
vc.on('jsdomError',e=>errors.push(e.message));
vc.on('error',e=>errors.push(String(e)));
const dom=new JSDOM('<!doctype html><html lang="pt-BR"><head><script src="camadas-v560.js?v=522"></script></head><body><main id="app"><section><div id="trgrid">Gráficos de teste</div></section></main></body></html>',{url:'https://example.test/diario-trader/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
const {window:w}=dom;
const doc=w.document,KEY='dt-validacao-terminal-2026-v1';
w.eval(script);
doc.dispatchEvent(new w.Event('DOMContentLoaded',{bubbles:true}));
const btn=doc.querySelector('.dtval-open');
assert(btn,'Acesso à central deve existir junto à grade do Terminal');
assert.equal(doc.querySelectorAll('.dtval-open').length,1,'Não duplicar botão do Terminal');
btn.click();
assert.equal(doc.querySelector('.dtval-root')?.hidden,false,'Central deve abrir');
assert(doc.querySelector('.dtval-kpis'),'Resumo e indicadores devem renderizar');
const get=()=>JSON.parse(w.localStorage.getItem(KEY));
const click=(a,id)=>{
 const selector='[data-dva="'+a+'"]'+(id?'[data-id="'+id+'"]':'');
 const elem=doc.querySelector('.dtval-root '+selector);
 assert(elem,'Ação não encontrada: '+selector);
 elem.click();
};
click('tab','navegacao');
assert(doc.querySelector('[data-dva="edit"][data-id="n3"]'),'Caso da sazonalidade existe');
click('edit','n3');
assert(doc.querySelector('[data-dva="incident"]'),'Botão de swipe involuntário aparece no caso de navegação');
// Não permitir validar sem resultado aprovado.
click('validated');
assert.equal(get(),null,'Bloqueio de validação não deve persistir resultado inconclusivo');
assert.match(doc.querySelector('#dtval-content').textContent,/selecione.*Passou/);
click('incident');
let state=get(),incident=state.cases.find(x=>x.id==='n3');
assert.equal(incident.incidents.length,1);
assert.equal(incident.testResult,'Falhou');
assert.equal(incident.status,'Em análise');
assert.equal(incident.incidents[0].to,'Configurações');
assert(state.history.some(h=>h.action==='Swipe acidental'));
assert(doc.querySelector('#dtval-content').textContent.includes('Ocorrências de troca acidental (1)'));
// Não permitir proteção corrigida enquanto o teste falha.
doc.querySelector('[name="protectionFixed"]').checked=true;
click('save');
state=get();assert.equal(state.cases.find(x=>x.id==='n3').protectionFixed,false);
assert.match(doc.querySelector('#dtval-content').textContent,/só pode ser confirmada/);
// Após teste Passou, a proteção e a validação podem ser registradas.
doc.querySelector('[name="testResult"]').value='Passou';
doc.querySelector('[name="protectionFixed"]').checked=true;
click('save');
state=get();
assert.equal(state.cases.find(x=>x.id==='n3').protectionFixed,true);
click('validated');
state=get();
assert.equal(state.cases.find(x=>x.id==='n3').status,'Validado');
assert(state.history.some(h=>h.id==='n3'&&h.action==='Validado'));
// Registro de erro yahoo404 com campos separados.
click('tab','dados');
click('edit','d1');
doc.querySelector('[name="asset"]').value='VIX';
doc.querySelector('[name="symbol"]').value='^VIX';
doc.querySelector('[name="source"]').value='Fonte informada durante teste';
doc.querySelector('[name="message"]').value='yahoo404';
doc.querySelector('[name="recovery"]').value='Reconsulta manual';
doc.querySelector('[name="platform"]').value='PC';
click('save');
state=get();
const vix=state.cases.find(x=>x.id==='d1');
assert.equal(vix.asset,'VIX');
assert.equal(vix.symbol,'^VIX');
assert.equal(vix.message,'yahoo404');
assert.equal(vix.source,'Fonte informada durante teste');
// Histórico e comparação são alimentados pelos testes reais salvos.
click('tab','historico');
assert(doc.querySelector('.dtval-table'), 'Tabela de comparação de versões renderizada');
assert.match(doc.querySelector('.dtval-table').textContent,/Swipes acidentais/);
assert.match(doc.querySelector('.dtval-table').textContent,/v560/);
// O seletor de versão deve afetar os eventos novos, não apagar os antigos.
click('tab','visao');
const vers=doc.querySelector('#dtval-version');
vers.value='523';vers.dispatchEvent(new w.Event('change',{bubbles:true}));
assert.equal(get().version,'523');
click('close');
assert.equal(doc.querySelector('.dtval-root').hidden,true,'Fechar não remove os registros');
btn.click();
assert.equal(doc.querySelector('.dtval-root').hidden,false);
assert.equal(get().cases.find(x=>x.id==='n3').incidents.length,1);
assert.equal(errors.length,0,'Sem exceções de console no DOM de teste: '+errors.join('; '));
// Compatibilidade com registros anteriores: acrescentar campos sem apagar observações.
const oldDom=new JSDOM('<!doctype html><html lang="pt-BR"><head><script src="camadas-v560.js?v=522"></script></head><body><main id="app"><div id="trgrid"></div></main></body></html>',{url:'https://example.test/diario-trader/',runScripts:'outside-only',pretendToBeVisual:true});
const oldWin=oldDom.window;
oldWin.localStorage.setItem(KEY,JSON.stringify({version:'522',history:[],cases:[{id:'n3',cat:'navegacao',title:'Sazonalidade',area:'Mercado / Sazonalidade',priority:'Crítica',status:'Pendente',steps:'Teste',notes:'Meu histórico anterior',images:[],testResult:'Inconclusivo',platform:'iPhone',createdAt:'2026-11-01T00:00:00.000Z',updatedAt:'2026-11-01T00:00:00.000Z'}]}));
oldWin.eval(script);
oldWin.document.dispatchEvent(new oldWin.Event('DOMContentLoaded',{bubbles:true}));
oldWin.document.querySelector('.dtval-open').click();
oldWin.document.querySelector('[data-dva="tab"][data-id="navegacao"]').click();
oldWin.document.querySelector('[data-dva="edit"][data-id="n3"]').click();
assert.equal(oldWin.document.querySelector('[name="gestureOrigin"]').value,'Mercado / Sazonalidade');
assert.equal(oldWin.document.querySelector('[name="gestureDestination"]').value,'Configurações');
oldWin.document.querySelector('[data-dva="incident"]').click();
const migrated=JSON.parse(oldWin.localStorage.getItem(KEY)).cases[0];
assert.equal(migrated.notes,'Meu histórico anterior');
assert.equal(migrated.incidents.length,1);
oldWin.close();
console.log('✅ Central: acesso, reprodução, incidentes, proteção, validação, VIX, versões, histórico, migração e persistência.');
w.close();