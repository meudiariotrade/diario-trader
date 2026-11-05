/* Testes automatizados da v379 — sem internet, credenciais ou alteração de dados reais. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=__dirname,load=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=load('interface.js');
const a=source.indexOf('/* módulo: carteira-periodos.js');
const b=source.indexOf('/* módulo: carteira-factsheet.js',a);
assert(a>=0&&b>a,'O motor trimestral deve estar disponível no pacote principal.');
const context=vm.createContext({});vm.runInContext(source.slice(a,b),context,{filename:'carteira-periodos.js'});
const P=context.CarteiraPeriodos;assert(P?.calculate,'Motor financeiro não inicializou.');
const tests=[];const test=(name,fn)=>tests.push([name,fn]);
const row=(periodo,receita,lucro,moeda='BRL')=>({periodo,receita,lucro,moeda});
const src=(rows,moeda='BRL',origem='Yahoo Finance')=>({rows,moeda,origem});
test('3T, YTD e TTM usam janelas distintas e consecutivas',()=>{
 const x=P.calculate([src([row('2025-12-31',40,4),row('2026-03-31',10,1),row('2026-06-30',20,2),row('2026-09-30',30,3)])],'2026-11-04');
 assert.equal(x.latest.periodo,'2026-09-30');assert.equal(x.ytd.receita.value,60);assert.equal(x.ttm.receita.value,100);
 assert.equal(x.ytd.lucro.value,6);assert.equal(x.ttm.lucro.value,10);
 assert.equal(x.ytd.periodos.length,3);assert.equal(x.ttm.periodos.length,4);
});
test('Completar receita ausente com outra fonte sem sobrescrever lucro',()=>{
 const x=P.calculate([src([row('2026-09-30',null,7)]),src([row('2026-09-30',18,null)])],'2026-11-04');
 assert.equal(x.latest.receita,18);assert.equal(x.latest.lucro,7);assert.equal(x.conflicts.length,0);
});
test('Divergências reais são bloqueadas e impedem agregação enganosa',()=>{
 const x=P.calculate([src([row('2026-09-30',20,2)]),src([row('2026-09-30',28,2)])],'2026-11-04');
 assert.equal(x.latest.receita,null);assert.equal(x.latest.lucro,2);assert.equal(x.conflicts.length,1);
 assert.match(x.ytd.receita.reason,/Divergência/);
});
test('Moedas incompatíveis não são somadas nem convertidas silenciosamente',()=>{
 const x=P.calculate([src([row('2026-09-30',20,2)]),src([row('2026-06-30',40,3,'USD')],'USD')],'2026-11-04');
 assert.equal(x.rejected.length,1);assert.equal(x.ytd.receita.value,null);
});
test('Nenhuma moeda inferida quando ela não foi informada',()=>{
 const x=P.calculate([src([row('2026-09-30',20,2,null)],null)],'2026-11-04');
 assert.equal(x.latest,null);assert.equal(x.ytd.receita.value,null);
});
test('Trimestre posterior à data de referência é excluído',()=>{
 const x=P.calculate([src([row('2026-12-31',99,9),row('2026-09-30',3,1)])],'2026-11-04');
 assert.equal(x.latest.periodo,'2026-09-30');
});
test('Zero é número válido, não lacuna',()=>{
 const x=P.calculate([src([row('2026-03-31',0,0)])],'2026-04-10');
 assert.equal(x.ytd.receita.value,0);assert.equal(x.ytd.lucro.value,0);
});
test('4T por diferença anual - 9M apenas na mesma moeda',()=>{
 const x=P.calculate([src([row('2025-03-31',10,1),row('2025-06-30',20,2),row('2025-09-30',30,3),row('2026-03-31',5,1)])],
 '2026-04-10',[{ano:'2025',receita:100,lucro:20,moeda:'BRL',origem:'Yahoo Finance'}]);
 const q4=x.quarters.find(q=>q.periodo==='2025-12-31');
 assert.equal(q4.receita,40);assert.equal(q4.lucro,14);assert.equal(q4.derivados.length,2);
 assert.equal(x.ttm.receita.value,95);assert.equal(x.ttm.lucro.value,20);
});
test('Não calcular 4T sem todos os nove meses ou com moeda diferente',()=>{
 const rows=[row('2025-03-31',10,1),row('2025-06-30',20,2)];
 const a=P.calculate([src(rows)],'2026-04-10',[{ano:'2025',receita:100,lucro:20,moeda:'BRL'}]);
 const b=P.calculate([src([...rows,row('2025-09-30',30,3)])],'2026-04-10',[{ano:'2025',receita:100,lucro:20,moeda:'USD'}]);
 assert(!a.quarters.find(q=>q.periodo==='2025-12-31'));
 assert(!b.quarters.find(q=>q.periodo==='2025-12-31'));
});
test('Não sobrescrever 4T divulgado nem valores divergentes',()=>{
 const x=P.calculate([src([row('2025-03-31',10,1),row('2025-06-30',20,2),row('2025-09-30',30,3),row('2025-12-31',42,9)])],
 '2026-01-05',[{ano:'2025',receita:100,lucro:20,moeda:'BRL'}]);
 assert.equal(x.latest.receita,null);assert.equal(x.latest.lucro,null);assert.equal(x.derived.length,0);assert.equal(x.reconciliations.length,2);
});
test('Nada é projetado para períodos ausentes',()=>{
 const x=P.calculate([src([row('2026-09-30',30,3)])],'2026-11-04');
 assert.equal(x.ytd.receita.value,null);assert.equal(x.ttm.lucro.value,null);
 assert.equal(x.ytd.receita.missing.length,2);
});
test('PDF discrimina derivados, divergências, ausências, fonte e moeda',()=>{
 for(const phrase of ['DIVERGÊNCIA ENTRE FONTES','4T calculado por diferença','LACUNA DE COBERTURA','Yahoo Finance','Conferir CVM/RI'])
   assert(source.includes(phrase),`Texto de transparência ausente: ${phrase}`);
});
test('Cache e arquivos essenciais correspondem à v386',()=>{
 const sw=load('sw.js'),html=load('index.html'),manifest=load('manifest.webmanifest');
 assert(sw.includes('diario-v386-mercado-identidade-01'));assert(!sw.includes('cache:\'reload\''));
 assert(!sw.includes('const CORE=["./"'));assert(sw.includes('cache:\'no-cache\''));
 for(const file of ['recursos.js','inicio.js','app.js','interface.js','calendario-mercado-v379.js','editorial-financeiro-v379.js'])assert(html.includes(file+'?v=386'));
 for(const file of ['pdf-lib.min.js','fontkit.umd.min.js','fontes-pdf.js','card-colecao-sazonal.jpg'])assert(sw.includes(file));
 assert(manifest.includes('v=386'));
 assert(load('app.js').includes('const APP_VER="v386"'));
 assert(load('app.js').includes('i.startsWith("diario-"+APP_VER+"-")'));
});
test('Fonte trimestral só é usada se divulgação não for posterior à referência',()=>{
 const older=src([row('2026-03-31',9,1)]);
 const future=src([{...row('2026-06-30',20,4),data_divulgacao:'2026-08-10'}]);
 const x=P.calculate([older,future],'2026-07-01');
 assert.equal(x.latest.periodo,'2026-03-31');
 assert.match(x.rejected[0].motivo,/posterior/);
});
test('Data explícita de divulgação é registrada para rastreabilidade',()=>{
 const x=P.calculate([src([{...row('2026-09-30',13,3),publicado_em:'2026-10-30'}])],'2026-11-04');
 assert.equal(x.latest.divulgadoEm,'2026-10-30');assert.equal(x.publicacoesNaoInformadas,0);
});
test('Data não fornecida NÃO é inferida a partir do encerramento',()=>{
 const x=P.calculate([src([row('2026-09-30',13,3)])],'2026-11-04');
 assert.equal(x.latest.divulgadoEm,null);assert.equal(x.publicacoesNaoInformadas,1);
});
test('Trimestre explicitamente acumulado não entra em YTD ou TTM',()=>{
 const x=P.calculate([src([{...row('2026-03-31',60,9),tipo_periodo:'YTD'},row('2026-06-30',20,4)])],'2026-11-04');
 assert.equal(x.latest.periodo,'2026-06-30');assert.equal(x.ytd.receita.value,null);
 assert.match(x.rejected[0].motivo,/acumulado/);
});
test('Anuais de fontes distintas conflitantes impedem 4T derivado',()=>{
 const q=[row('2025-03-31',10,1),row('2025-06-30',20,2),row('2025-09-30',30,3)];
 const annual=[{ano:'2025',receita:100,lucro:20,moeda:'BRL',origem:'A'},
               {ano:'2025',receita:110,lucro:20,moeda:'BRL',origem:'B'}];
 const x=P.calculate([src(q)],'2026-01-15',annual);
 assert.equal(x.quarters.find(p=>p.periodo==='2025-12-31')?.receita,null);
 assert.equal(x.annualConflicts.length,1);
 assert.equal(x.quarters.find(p=>p.periodo==='2025-12-31')?.lucro,14);
 assert.equal(x.ttm.receita.value,null);
 assert.match(x.ttm.receita.reason,/Divergência nos anuais/);
});
test('4T já informado incompatível com anual é sinalizado sem sobrescrever',()=>{
 const q=[row('2025-03-31',10,1),row('2025-06-30',20,2),row('2025-09-30',30,3),row('2025-12-31',50,4)];
 const x=P.calculate([src(q)],'2026-01-15',[{ano:'2025',receita:100,lucro:10,moeda:'BRL'}]);
 assert.equal(x.latest.receita,null);assert.equal(x.derived.length,0);assert.equal(x.ttm.receita.value,null);assert.match(x.ttm.receita.reason,/anual e trimestres/);
 assert.equal(x.reconciliations.length,1);
 assert.equal(x.reconciliations[0].somaTrimestres,110);
});
test('Anual reconciliado com quatro trimestres não gera falso alerta',()=>{
 const q=[row('2025-03-31',10,1),row('2025-06-30',20,2),row('2025-09-30',30,3),row('2025-12-31',40,4)];
 const x=P.calculate([src(q)],'2026-01-15',[{ano:'2025',receita:100,lucro:10,moeda:'BRL'}]);
 assert.equal(x.reconciliations.length,0);
});
test('Anual publicado após referência não é usado para derivar 4T',()=>{
 const q=[row('2025-03-31',10,1),row('2025-06-30',20,2),row('2025-09-30',30,3)];
 const x=P.calculate([src(q)],'2026-01-15',[{ano:'2025',receita:100,lucro:10,moeda:'BRL',publicado_em:'2026-03-01'}]);
 assert(!x.quarters.find(r=>r.periodo==='2025-12-31'));
});
test('Confirmações de dois registros equivalentes não criam divergência',()=>{
 const x=P.calculate([src([row('2026-09-30',10,1)],'BRL','A'),src([row('2026-09-30',10,1)],'BRL','B')],'2026-11-04');
 assert.equal(x.conflicts.length,0);assert.equal(x.latest.confirmacoes.receita.length,2);
});
test('Fonte sem moeda não anula fonte válida e futura',()=>{
 const x=P.calculate([src([row('2026-06-30',10,1,null)],null),src([row('2026-09-30',20,2)])],'2026-11-04');
 assert.equal(x.latest.periodo,'2026-09-30');assert.equal(x.rejected.length,1);
});
test('Dados salvos duplicados de um ticker são considerados no PDF',()=>{
 assert(source.includes('.balancos_trimestrais_da_fonte.filter('));
 assert(source.includes('for(const source of matchingSources)'));
});
test('PDF informa divergência anual e data de divulgação ausente',()=>{
 for(const phrase of ['DIVERGÊNCIA EM DADOS ANUAIS','DIVERGÊNCIA ENTRE ANUAL E QUATRO TRIMESTRES','DATAS DE DIVULGAÇÃO','RASTREABILIDADE DO ÚLTIMO TRIMESTRE'])
   assert(source.includes(phrase),'Ausente: '+phrase);
});
test('Scripts são deferidos em ordem e inicialização espera DOMContentLoaded',()=>{
 const html=load('index.html');
 const tags=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(tags,['recursos.js?v=386','inicio.js?v=386','app.js?v=386','calendario-mercado-v379.js?v=386','interface.js?v=386','editorial-financeiro-v379.js?v=386','diagnostico-v386.js?v=386','identidade-ativos-v386.js?v=386','terminal-mobile-v385.js?v=386']);
 assert(load('inicio.js').includes("root.document?.readyState!=='complete'"));
});
test('Fronteira de segurança: nenhum segredo privilegiado nos arquivos públicos',()=>{
 const names=['recursos.js','inicio.js','app.js','interface.js','estudos.js','arte.js','ingles.js','cnpi.js'];
 const secrets=[/sb_secret_[A-Za-z0-9_-]{10,}/,/sk-(?:proj-)?[A-Za-z0-9_-]{15,}/,
   /AKIA[0-9A-Z]{16}/,/AIza[0-9A-Za-z_-]{30,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/];
 for(const name of names){const content=load(name);
   assert(!content.includes('SUPABASE_SERVICE_ROLE_KEY'),name+' contém referência a chave privilegiada');
   for(const pattern of secrets)assert(!pattern.test(content),name+' contém texto com formato de segredo');
 }
});
test('Política CSP e cache preservam limitações de origem',()=>{
 const html=load('index.html'),sw=load('sw.js');
 for(const rule of ["object-src 'none'","base-uri 'self'","form-action 'self'"])
   assert(html.includes(rule),'CSP ausente: '+rule);
 assert(sw.includes("if(url.origin!==location.origin)"));
 assert(sw.includes('if(!url.pathname.startsWith(scope.pathname))return;'));
});
test('Pacote conserva bibliotecas PDF sob demanda e imagens JPEG',()=>{
 assert(load('inicio.js').includes("script.src='fontkit.umd.min.js'"));
 for(const f of ['fontes-pdf.js','fontkit.umd.min.js','pdf-lib.min.js','card-colecao-sazonal.jpg','card-halloween-touro.jpg'])
   assert(fs.statSync(path.join(root,f)).size>0);
});
test('Moeda do trimestre mais recente prevalece sobre a fonte histórica',()=>{
 const old=src([row('2025-03-31',30,3,'USD')],'USD','Histórico');
 const recent=src([row('2026-09-30',18,2,'BRL')],'BRL','Mais recente');
 const x=P.calculate([old,recent],'2026-11-04');
 assert.equal(x.moeda,'BRL');assert.equal(x.latest.periodo,'2026-09-30');
 assert.equal(x.latest.receita,18);assert.equal(x.rejected.length,1);
});
test('Data de referência ISO timestamp não deixa passar trimestres futuros',()=>{
 const x=P.calculate([src([row('2026-12-31',99,99),row('2026-09-30',10,1)])],'2026-11-04T22:00:00-03:00');
 assert.equal(x.latest.periodo,'2026-09-30');
});
test('Divulgação de anual posterior à referência bloqueia 4T derivado',()=>{
 const x=P.calculate([src([row('2025-03-31',1,1),row('2025-06-30',2,2),row('2025-09-30',3,3)])],
 '2026-01-05',[{ano:'2025',receita:100,lucro:100,moeda:'BRL',data_divulgacao:'2026-02-20'}]);
 assert(!x.quarters.some(q=>q.periodo==='2025-12-31'));assert.equal(x.derived.length,0);
});
test('Trimestre com divulgação posterior ao dia de referência não entra',()=>{
 const x=P.calculate([src([Object.assign(row('2026-09-30',5,2),{published_at:'2026-11-20'}),row('2026-06-30',1,1)])],'2026-11-04');
 assert.equal(x.latest.periodo,'2026-06-30');assert(x.rejected.some(r=>r.motivo.includes('posterior')));
});
test('O PDF consolidado inclui auditoria para ativos com e sem trimestres',()=>{
 for(const pattern of ['MAPA DE COBERTURA DO TRIMESTRE ENCERRADO','financeCoverage=d.positions.map',
  'Financeiro','financeStats.current','aguardando coleta / publicação','NÃO afirma que a empresa esteja atrasada']){
   if(pattern==='Financeiro')continue;
   assert(source.includes(pattern),'Falta indicador de cobertura: '+pattern);
 }
});
test('O mapa de cobertura não equipara encerramento a divulgação oficial',()=>{
 assert(source.includes('não infere publicação a partir da data de encerramento'));
 assert(source.includes('não confirmada')||source.includes('não informada'));
});
test('O cache CDN tem limite, sem armazenar no-store, privado ou opaco',()=>{
 const sw=load('sw.js');
 for(const p of ["CDN_LIMIT=40","cache.keys()","cache.delete(old)","response.type!=='opaque'","response.headers.get('cache-control')","no-store|private"])
  assert(sw.includes(p),'Proteção de cache ausente: '+p);
});
test('Service Worker restringe navegação e cache ao escopo do app',()=>{
 const sw=load('sw.js');
 assert(sw.includes('url.origin!==location.origin'));
 assert(sw.includes('url.pathname.startsWith(scope.pathname)'));
 assert(sw.includes('cache.match(\'index.html\')'));
});
test('Rotinas do Terminal somente sugerem layouts de consulta sem execução',()=>{
 const start=source.indexOf('/* v369 — Rotinas sugeridas por fase');
 assert(start>0);
 const s=source.slice(start);
 for(const phrase of ['Termina'+'lOrganizador322.apply','preserva os layouts personalizados','Auto: desligado','Auto: pausado','Rotina: '])
 assert(s.includes(phrase),'Rotina incompleta: '+phrase);
 assert(!/enviarOrdem|placeOrder|sendOrder/i.test(s));
});
test('Sugestões por horário de Brasília são explícitas e fins de semana não são pregão',()=>{
 const start=source.indexOf('/* v369 — Rotinas sugeridas por fase');
 const ctx=vm.createContext({window:{TraderUI:{onRender:()=>{}},TRM:null},document:{readyState:'loading',addEventListener:()=>{},querySelector:()=>null,hidden:false},setInterval:()=>{},localStorage:{getItem:()=>null},Intl,Date});
 vm.runInContext(source.slice(start),ctx);
 const run=iso=>vm.runInContext(`window.TerminalFases369.phaseAtBR(new Date('${iso}'))`,ctx);
 assert.equal(run('2026-11-04T10:00:00Z'),'pre');
 assert.equal(run('2026-11-04T15:00:00Z'),'live');
 assert.equal(run('2026-11-04T22:00:00Z'),'post');
 assert.equal(run('2026-11-07T15:00:00Z'),'post');
});
test('Modo automático é opcional e isolado por identificador da conta',()=>{
 const start=source.indexOf('/* v369 — Rotinas sugeridas por fase');
 const s=source.slice(start);
 assert(s.includes("localStorage.getItem(k)==='1'"));
 assert(s.includes('base+owner()'));
 assert(s.includes("s.ws.startsWith('ws321_auto_')"));
 assert(s.includes('setAutomatic(enabled)'));
});
test('Dados financeiros não estão embutidos no ZIP',()=>{
 for(const name of ['interface.js','app.js','index.html']){
   const s=load(name);
   assert(!/-----BEGIN (?:OPENSSH|RSA|EC) PRIVATE KEY-----/.test(s));
   assert(!/sb_secret_[a-z0-9_-]{15,}/i.test(s));
 }
});
test('Compatibilidade de testes e CI validam a suíte nova',()=>{
 const ci=load('.github/workflows/validar-v386.yml');
 assert(ci.includes('node scripts/preflight-v386.cjs'));
 assert(ci.includes('node tests-v386.cjs'));
 assert(ci.includes('pull_request'));
});
test('Auditor de arquivos antigos funciona sem excluir nada',()=>{
 const child=require('node:child_process'),os=require('node:os');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'auditoria-v369-'));
 try{
  fs.writeFileSync(path.join(tmp,'card-natal-touro.png'),'png-teste');
  fs.writeFileSync(path.join(tmp,'index.html'),'<img src="card-natal-touro.jpg">');
  const tool=path.join(root,'scripts/auditar-assets-v369.cjs');
  const first=child.spawnSync(process.execPath,[tool,tmp],{encoding:'utf8'});
  assert.equal(first.status,0,first.stderr);
  const one=JSON.parse(first.stdout).arquivos.find(a=>a.arquivo==='card-natal-touro.png');
  assert.equal(one.candidato_a_revisao,true);
  assert.equal(fs.existsSync(path.join(tmp,'card-natal-touro.png')),true);
  fs.writeFileSync(path.join(tmp,'index.html'),'<img src="card-natal-touro.png">');
  const second=child.spawnSync(process.execPath,[tool,tmp],{encoding:'utf8'});
  assert.equal(second.status,0,second.stderr);
  const two=JSON.parse(second.stdout).arquivos.find(a=>a.arquivo==='card-natal-touro.png');
  assert.equal(two.candidato_a_revisao,false);
 } finally {fs.rmSync(tmp,{recursive:true,force:true})}
});

test('Referência inválida bloqueia balanços futuros sem inventar corte',()=>{
 for(const asOf of ['data-invalida','2026-02-31','',null]){
  const x=P.calculate([src([row('2026-09-30',30,3)])],asOf);
  assert.equal(x.referenciaInvalida,true);
  assert.equal(x.latest,null);
  assert.match(x.ytd.receita.reason,/referência inválida/i);
 }
});
test('Referência válida mantém último trimestre e janela TTM',()=>{
 const x=P.calculate([src([row('2025-12-31',40,4),row('2026-03-31',10,1),row('2026-06-30',20,2),row('2026-09-30',30,3)])],'2026-11-04');
 assert.equal(x.referenciaInvalida,false);
 assert.equal(x.ttm.receita.value,100);
});
const offHandler=()=>{
 const app=load('app.js'),start=app.indexOf('if(a==="off"){if(!confirm("Parar de compartilhar?'),end=app.indexOf('if(a==="fam"){',start);
 assert(start>0&&end>start,'O controle de compartilhamento não foi encontrado.');
 const body=app.slice(start,end);
 return new Function('a','o','SESS','rq','S','save','render','toast','confirm','encodeURIComponent','return (async()=>{'+body+'})();');
};
test('Revogação remota falha: link continua visível e há alerta explícito',async()=>{
 const run=offHandler(),S={ax:{parc:{token:'token-teste'}}},o=S.ax.parc;
 let saved=0,painted=0,notified='';
 await run('off',o,{uid:'d036af48-0be0-412d-8400-c4cf60d81eb9'},async()=>{throw Error('offline')},S,()=>saved++,()=>painted++,t=>notified=t,()=>true,encodeURIComponent);
 assert.equal(S.ax.parc,o);assert.equal(saved,0);assert(painted>0);
 assert.match(o.err,/continuar ativo/i);assert.match(notified,/continuar ativo/i);
});
test('Revogação confirmada no servidor remove o link local',async()=>{
 const run=offHandler(),S={ax:{parc:{token:'token-teste'}}},o=S.ax.parc;
 let url='',method='',saved=0,painted=0,notified='';
 await run('off',o,{uid:'aa bb'},async(u,opts)=>{url=u;method=opts.method;return {ok:true,async json(){return [{user_id:'aa bb',token:'token-teste'}]}}},S,()=>saved++,()=>painted++,t=>notified=t,()=>true,encodeURIComponent);
 assert.equal(url,'/rest/v1/parceiro?user_id=eq.aa%20bb&token=eq.token-teste');assert.equal(method,'DELETE');
 assert.equal(S.ax.parc,undefined);assert.equal(saved,1);assert.equal(painted,1);assert.match(notified,/revogado/i);
});
test('Cancelar revogação não dispara requisição',async()=>{
 const run=offHandler(),S={ax:{parc:{token:'token-teste'}}},o=S.ax.parc;
 await run('off',o,{uid:'abc'},async()=>{throw Error('Não deveria chamar o backend')},S,()=>{throw Error('não deve salvar')},()=>{},()=>{},()=>false,encodeURIComponent);
 assert.equal(S.ax.parc,o);
});
test('Deslogado não pode ocultar um link ainda ativo',async()=>{
 const run=offHandler(),S={ax:{parc:{token:'token-teste'}}},o=S.ax.parc;
 await run('off',o,null,async()=>{throw Error('não deve enviar')},S,()=>{throw Error('não deve salvar')},()=>{},()=>{},()=>true,encodeURIComponent);
 assert.equal(S.ax.parc,o);assert.match(o.err,/Entre na sua conta/i);
});
test('Ativar rotina automática não sobrescreve workspace personalizado',()=>{
 const start=source.indexOf('/* v369 — Rotinas sugeridas por fase');assert(start>=0);
 let selected='meu-workspace',suggested=null,toggle=null,applied=[],notifications=[];const storage={};
 const bar={querySelector(q){return q==='[data-t369-suggest]'?suggested:q==='[data-t369-auto]'?toggle:null;},appendChild(b){if(b.dataset.t369Suggest)suggested=b;else if(b.dataset.t369Auto)toggle=b;}};
 const createElement=()=>({dataset:{},addEventListener(type,fn){this['on_'+type]=fn},setAttribute(){},type:'',className:''});
 const win={TRM:{TS:()=>({ws:selected})},TraderUI:{onRender:()=>{}},TerminalOrganizador322:{apply:x=>applied.push(x)},toast:m=>notifications.push(m)};
 const doc={querySelector:q=>q==='.trbar'?bar:null,createElement,readyState:'complete',hidden:false};
 const ctx=vm.createContext({window:win,document:doc,SESS:{uid:'usuario-demo'},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},Intl,Date,setInterval:()=>{}});
 vm.runInContext(source.slice(start),ctx);
 assert(toggle?.on_click);
 toggle.on_click();assert.equal(applied.length,0);assert.equal(toggle.textContent,'Auto: pausado');
 assert(notifications.some(s=>/Workspace personalizado/i.test(s)));
 selected='ws321_auto_pre';toggle.on_click();toggle.on_click();
 assert.equal(applied.length,1,'Ao retornar à rotina automática, pode aplicar uma sugestão.');
});
test('Cache CDN: respeita no-store, não guarda respostas opacas e limita a 40 objetos',async()=>{
 const sw=load('sw.js'),handlers={},stored=new Map();let cachePuts=0,fetchCount=0;
 const cache={async match(req){return stored.get(req.url||req)||null},async put(req,res){cachePuts++;stored.set(req.url||req,res)},async keys(){return [...stored.keys()].map(url=>({url}))},async delete(req){return stored.delete(req.url||req)}};
 const self={registration:{scope:'https://example.org/diario/'},addEventListener:(type,handler)=>handlers[type]=handler};
 let responseOptions={};
 const fetch=async()=>{fetchCount++;return responseOptions.opaque?{ok:true,type:'opaque',headers:new Headers(),clone(){return this}}:new Response('ok',{headers:{'cache-control':responseOptions.cacheControl||'public, max-age=86400'}})};
 vm.runInNewContext(sw,{self,URL,Request,Response,Headers,caches:{open:async()=>cache},location:{origin:'https://example.org'},fetch});
 const request=async path=>{const event={request:new Request('https://cdnjs.cloudflare.com/'+path),respondWith(p){this.promise=p}};handlers.fetch(event);await event.promise};
 responseOptions={cacheControl:'no-store'};await request('no-store.js');assert.equal(cachePuts,0);
 responseOptions={opaque:true};await request('opaque.js');assert.equal(cachePuts,0);
 responseOptions={};for(let i=0;i<46;i++)await request('assets/asset-'+i+'.js');
 assert.equal(stored.size,40);assert.equal(cachePuts,46);assert.equal(fetchCount,48);
});
test('Scripts da v386 permanecem versionados e não duplicam módulos por engano',()=>{
 const html=load('index.html');const tags=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(tags.length,9);assert(tags.every(t=>t.includes('v=386')));
 const sw=load('sw.js');assert(sw.includes('diario-v386-mercado-identidade-01'));
 assert(load('app.js').includes('APP_VER="v386"'));
 assert(load('.github/workflows/validar-v386.yml').includes('node tests-v386.cjs'));
});

test('Auditor binário identifica cópias idênticas e nunca remove arquivos',()=>{
 const os=require('node:os'),child=require('node:child_process');const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'duplas-v379-'));
 try{
  fs.writeFileSync(path.join(tmp,'card-natal-touro.png'),Buffer.from('PARES'));
  fs.writeFileSync(path.join(tmp,'natal-touro.png'),Buffer.from('PARES'));
  fs.writeFileSync(path.join(tmp,'index.html'),'<img src="card-natal-touro.png">');
  const cmd=child.spawnSync(process.execPath,[path.join(root,'scripts/auditar-limpeza-v379.cjs'),tmp],{encoding:'utf8'});
  assert.equal(cmd.status,0,cmd.stderr);
  const a=JSON.parse(cmd.stdout),pair=a.duplas.find(x=>x.nome==='natal-touro');
  assert.equal(a.duplicatas_binarias,1);assert.equal(pair.bytes_duplicados_comprovados,5);
  assert.equal(pair.copia_alternativa_sem_referencia_direta,true);
  assert.equal(a.executou_exclusoes,false);
  assert(fs.existsSync(path.join(tmp,'natal-touro.png')));
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
});


test('HTTP 204 ou DELETE sem linha removida NÃO confirma revogação',async()=>{
 const run=offHandler(),S={ax:{parc:{token:'token-teste'}}},o=S.ax.parc;
 let saved=0,notification='';
 await run('off',o,{uid:'usr-01'},async()=>({ok:true,async json(){return []}}),S,()=>saved++,()=>{},x=>notification=x,()=>true,encodeURIComponent);
 assert.equal(S.ax.parc,o);assert.equal(saved,0);assert.match(notification,/continuar ativo/i);
});
test('Resposta de outra linha não revoga token da interface',async()=>{
 const run=offHandler(),S={ax:{parc:{token:'token-teste'}}},o=S.ax.parc;
 let saved=0;
 await run('off',o,{uid:'usr-01'},async()=>({ok:true,async json(){return [{user_id:'usr-01',token:'token-diferente'}]}}),S,()=>saved++,()=>{},()=>{},()=>true,encodeURIComponent);
 assert.equal(S.ax.parc,o);assert.equal(saved,0);
});
test('JSON inválido da API mantém link e alerta',async()=>{
 const run=offHandler(),S={ax:{parc:{token:'token-teste'}}},o=S.ax.parc;
 await run('off',o,{uid:'usr-01'},async()=>({ok:true,async json(){throw Error('sem JSON')}}),S,()=>{},()=>{},()=>{},()=>true,encodeURIComponent);
 assert.equal(S.ax.parc,o);assert.match(o.err,/continuar ativo/i);
});
test('Revogação envia filtro do token e exige retorno de representação',async()=>{
 const run=offHandler(),S={ax:{parc:{token:'abc-123'}}},o=S.ax.parc;
 let called;
 await run('off',o,{uid:'usr-01'},async(u,opt)=>{called={u,opt};return {async json(){return [{user_id:'usr-01',token:'abc-123'}]}}},S,()=>{},()=>{},()=>{},()=>true,encodeURIComponent);
 assert(called.u.includes('&token=eq.abc-123'));
 assert.equal(called.opt.headers.Prefer,'return=representation');
 assert.equal(S.ax.parc,undefined);
});
test('Data de publicação explícita inválida bloqueia trimestre',()=>{
 const x=P.calculate([src([{...row('2026-09-30',55,7),publicado_em:'2026-02-30'}])],'2026-11-04');
 assert.equal(x.latest,null);assert.match(x.rejected[0].motivo,/divulgação inválida/i);
});
test('Data de publicação inválida na fonte bloqueia seus registros',()=>{
 const source=src([row('2026-06-30',20,2)]);source.data_divulgacao='2026-99-99';
 const x=P.calculate([source],'2026-11-04');
 assert.equal(x.latest,null);assert.match(x.rejected[0].motivo,/data de divulgação inválida/i);
});
test('Dados anuais com publicação explicitamente inválida não podem derivar 4T',()=>{
 const q=[row('2025-03-31',10,1),row('2025-06-30',20,2),row('2025-09-30',30,3)];
 const x=P.calculate([src(q)],'2026-04-01',[{ano:'2025',receita:100,lucro:10,moeda:'BRL',publicado_em:'2026-04-31'}]);
 assert(!x.quarters.find(r=>r.periodo==='2025-12-31'));
});
test('Sem data de divulgação, não inventar data; data válida continua aceita',()=>{
 const x=P.calculate([src([row('2026-06-30',10,1),{...row('2026-09-30',20,2),publicado_em:'2026-11-03'}])],'2026-11-04');
 assert.equal(x.latest.periodo,'2026-09-30');assert.equal(x.latest.divulgadoEm,'2026-11-03');
 assert.equal(x.publicacoesNaoInformadas,1);
});
test('Preflight do pacote executa sem rede nem modificar arquivos',()=>{
 const child=require('node:child_process');const run=child.spawnSync(process.execPath,[path.join(root,'scripts/preflight-v386.cjs')],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);assert.match(run.stdout,/Preflight v386/);
});


test('Mesmo com tipo trimestral, escopo YTD prevalece e bloqueia soma',()=>{
 const r={...row('2026-06-30',150,12),tipo_periodo:'trimestre',escopo:'YTD'};
 const x=P.calculate([src([row('2026-03-31',70,5),r])],'2026-11-04');
 assert.equal(x.latest.periodo,'2026-03-31');assert(x.rejected.some(a=>/acumulado/.test(a.motivo)));
});
test('Timestamp ISO com timezone é permitido e data com sufixo arbitrário é bloqueada',()=>{
 const x=P.calculate([src([{...row('2026-09-30',21,3),publicado_em:'2026-10-30T12:00:00-03:00'}])],'2026-11-04');
 assert.equal(x.latest.periodo,'2026-09-30');
 const y=P.calculate([src([{...row('2026-09-30',21,3),publicado_em:'2026-10-30 informação não verificada'}])],'2026-11-04');
 assert.equal(y.latest,null);assert.match(y.rejected[0].motivo,/inválida/i);
});
test('Data de referência inválida não autoriza nenhum trimestre',()=>{
 const x=P.calculate([src([row('2026-09-30',9,2)])],'2026-11-04texto');
 assert.equal(x.latest,null);
});
test('Consulta privada não permite cache nem conteúdo detalhado sem token',()=>{
 const code=fs.readFileSync(path.join(root,'supabase/functions/parceiro-leitura/index.ts'),'utf8');
 assert(code.includes('Cache-Control'));assert(code.includes('no-store'));assert(code.includes('limite de requisições'));
 assert(code.includes('SUPABASE_SERVICE_ROLE_KEY'));
 assert(!load('index.html').includes('SUPABASE_SERVICE_ROLE_KEY'));
});


test('Auditoria manual confronta números esperados sem rede e falha em divergência',()=>{
 const child=require('node:child_process');const sample=path.join(root,'amostras/exemplo-balancos-v379.json');
 const good=child.spawnSync(process.execPath,[path.join(root,'scripts/validar-balancos-v379.cjs'),sample],{encoding:'utf8'});
 assert.equal(good.status,0,good.stderr);const data=JSON.parse(good.stdout);assert.equal(data.resultado,'OK');assert.equal(data.ficticio,true);
 const tmp=path.join(require('node:os').tmpdir(),'balancos-inconsistentes-v379-'+process.pid+'.json');
 try{const bad=JSON.parse(fs.readFileSync(sample,'utf8'));bad.expected.ttmReceita=123456;fs.writeFileSync(tmp,JSON.stringify(bad));
  const check=child.spawnSync(process.execPath,[path.join(root,'scripts/validar-balancos-v379.cjs'),tmp],{encoding:'utf8'});
  assert.equal(check.status,1);assert.match(check.stdout,/DIVERGENCIA/);
 }finally{try{fs.unlinkSync(tmp)}catch{}}
});
test('Diagnóstico local só carrega sob demanda e não expõe dados de carteira',()=>{
 const html=load('index.html'),diag=load('diagnostico-v386.js');
 assert(html.includes('<script defer src="diagnostico-v386.js?v=386"'));assert(diag.includes("qs.get('diagnostico')!=='1'"));
 assert(diag.includes('performance.getEntriesByType'));assert(diag.includes('versao:\'v386\''));
 assert(!diag.includes('localStorage'));assert(!diag.includes('fetch('));
});
test('Limpeza de cache CDN antigo em ativação preserva cache ativo',async()=>{
 const sw=load('sw.js'),handlers={};const removed=[];
 const self={registration:{scope:'https://example.org/diario/'},addEventListener:(k,fn)=>handlers[k]=fn,
   clients:{claim:async()=>{},matchAll:async()=>[]}};
 const caches={keys:async()=>['diario-v372-confianca-01','diario-v386-mercado-identidade-01','diario-cdn-v372','diario-cdn-v386'],delete:async name=>{removed.push(name)}};
 vm.runInNewContext(sw,{self,caches,URL,Request,Response,location:{origin:'https://example.org'}});
 const event={waitUntil(p){this.p=p}};handlers.activate(event);await event.p;
 assert(removed.includes('diario-v372-confianca-01'));assert(removed.includes('diario-cdn-v372'));
 assert(!removed.includes('diario-cdn-v386'));assert(!removed.includes('diario-v386-mercado-identidade-01'));
});
test('Script de diagnóstico externo está em CORE e respeita a CSP',()=>{
 const sw=load('sw.js');assert(sw.includes('"diagnostico-v386.js"'));
 assert(sw.includes("CDN='diario-cdn-v386'"));
});


test('Diagnóstico de qualidade do Terminal não inventa cotações nem dados em tempo real',()=>{
 const script=source.slice(source.indexOf('/* v375 — qualidade observável'));assert(script.length>500);
 const fakeDoc={readyState:'loading',addEventListener(){},querySelector(){return null}};
 const win={};vm.runInNewContext(script,{window:win,document:fakeDoc,Date,Number,JSON});
 const noData=win.TerminalQualidade374.inspect(null);
 assert.equal(noData.registros,0);assert.match(noData.alerta,/Nenhuma/);
 const state=win.TerminalQualidade374.inspect({status:'consulta antiga',timestamp:'2026-11-04T21:00:00Z',rows:[{px:0,atraso:true},{px:115,atraso:false},{px:null}]});
 assert.equal(state.registros,3);assert.equal(state.precosValidos,1);assert.equal(state.atrasadosDeclarados,1);
 assert.equal(state.precosAusentes,2);assert.match(state.alerta,/Confira/);
 assert(!script.includes('enviarOrdem'));assert(!script.includes('fetch('));
});
test('Integridade do release detecta alteração de arquivo sem mudar a distribuição',()=>{
 const child=require('node:child_process');const tool=path.join(root,'scripts/conferir-integridade-v386.cjs');
 const r=child.spawnSync(process.execPath,[tool],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/Integridade v386/);
 const m=JSON.parse(load('RELEASE-MANIFEST-v386.json'));assert(m.arquivos['app.js'].sha256);assert(m.arquivos['interface.js'].bytes>0);
});
test('Terminal e relatórios mantêm separação de consulta e execução',()=>{
 assert(source.includes('TerminalQualidade374'));assert(source.includes('Sem execução de ordens'));
 assert(source.includes('LACUNA DE COBERTURA'));assert(source.includes('RASTREABILIDADE DO ÚLTIMO TRIMESTRE'));
});
test('Ferramenta do iPhone usa script externo compatível com CSP e execução opt-in',()=>{
 const html=load('index.html'),diag=load('diagnostico-v386.js');
 assert(html.includes('<script defer src="diagnostico-v386.js?v=386"'));
 assert(!/<script(?![^>]*\bsrc=)[^>]*>\s*[^<\s]/.test(html));
 assert(diag.includes("qs.get('diagnostico')!=='1'"));
});


// Testes adicionais da etapa final — verificações executadas sobre os módulos reais.
test('Divergência entre anual e 4T bloqueia somente o indicador incompatível',()=>{
 const q=[row('2025-03-31',10,1),row('2025-06-30',20,2),row('2025-09-30',30,3),row('2025-12-31',50,4)];
 const x=P.calculate([src(q)],'2026-01-15',[{ano:'2025',receita:100,lucro:10,moeda:'BRL'}]);
 assert.equal(x.latest.receita,null);assert.equal(x.latest.lucro,4);
 assert.equal(x.ttm.receita.value,null);assert.equal(x.ttm.lucro.value,10);
 assert.match(x.ttm.receita.reason,/anual e trimestres/);
});
test('4T reconciliado preserva o valor divulgado',()=>{
 const q=[row('2025-03-31',10,1),row('2025-06-30',20,2),row('2025-09-30',30,3),row('2025-12-31',40,4)];
 const x=P.calculate([src(q)],'2026-01-15',[{ano:'2025',receita:100,lucro:10,moeda:'BRL'}]);
 assert.equal(x.latest.receita,40);assert.equal(x.latest.lucro,4);
 assert.equal(x.ttm.receita.value,100);assert.equal(x.ttm.lucro.value,10);
});
test('Falha de conciliação explícita no PDF, não ocultada em números',()=>{
 assert(source.includes('NÃO entra no YTD/TTM até conferência'));
 assert(source.includes('reconciliationConflicting.length'));
});
test('Endpoint de leitura interrompe stream acima de 1 KB mesmo sem Content-Length',()=>{
 const edge=load('supabase/functions/parceiro-leitura/index.ts');
 assert(edge.includes('reader.read()'));
 assert(edge.includes('reader.cancel()'));
 assert(edge.includes('size>1024'));
 assert(edge.includes('Referrer-Policy'));
 assert(edge.includes('no-store'));
 assert(!edge.includes('console.log(token)'));
});
test('Biblioteca real de PDF consegue salvar um documento local sem dados pessoais',async()=>{
 const PDF=require(path.join(root,'pdf-lib.min.js'));
 const pdf=await PDF.PDFDocument.create();pdf.addPage([250,200]);
 const bytes=await pdf.save();assert(bytes.length>300);assert.equal(Buffer.from(bytes).subarray(0,5).toString(),'%PDF-');
});
test('Parceiro usa Edge Function primeiro e preserva fallback somente se não implantada',()=>{
 const app=load('app.js');
 assert(app.includes('/functions/v1/parceiro-leitura'));
 assert(app.includes('/rest/v1/rpc/parceiro_ver'));
 assert(app.includes('endpointAusente=error&&error.status===404'));
 assert(app.includes('if(!endpointAusente)throw error'));
});

async function main(){let passed=0;
for(const [name,fn] of tests){try{await fn();passed++;console.log('OK ',name)}catch(e){console.error('FALHOU',name);throw e}}
console.log(`\n${passed}/${tests.length} testes v386 aprovados.`);

}
main().catch(e=>{console.error(e);process.exitCode=1});
