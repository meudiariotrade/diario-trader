const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../supabase/functions/_shared/consistencia-tecnica.ts');
const N=require('../supabase/functions/_shared/narrativa-tecnica.ts');
const {textoTecnicoConfere}=require('../supabase/functions/analise/validacao.ts');
function fixture(ticker,precos){
 const [fechamento,mm20,mm50,mm200,mm10s,mm40s,rsi14,de,ate,profundidade,f38,f50,f61,ext100,ext1618,pivo,primaria,secundaria]=precos;
 const alta=ticker==='USDBRL';
 return {ticker,fatos:{fechamento,mm20,mm50,mm200,mm10s,mm40s,rsi14,tecnico:{
  dow:{primaria,secundaria,pivo:{v:pivo,tipo:alta?'topo anterior':ticker==='PETR4'?'fundo anterior':'topo anterior',dia:'2026-10-15'},topos:[{v:de},{v:pivo}],fundos:[{v:ate}]},
  perna:{direcao:alta?'alta':'baixa',de,ate,inicio:'2026-10-09',fim:'2026-11-03'},
  elliott:{tipo:profundidade<23.6?'impulso':'correção',fase:profundidade<23.6?'perna impulsiva em andamento (sem correção relevante)':'correção na zona clássica de Fibonacci (ABC ou onda 2)',profundidade,gatilho:ate,ext100,ext1618,invalida:de},
  fibo:[{f:.382,v:f38},{f:.5,v:f50},{f:.618,v:f61}],conf:[{valor:f38,com:['MM20','MM200','MM40s']},{valor:f50,com:['MM50','MM10s']}],
  pa:[{tipo:'pavio superior longo',dia:'2026-11-10'},{tipo:'inside bar',dia:'2026-11-11'}],seq:'sequência mista (sem direção clara nos 5 candles)',
  refAlta:['resistência',alta?ate:f38],refBaixa:['suporte',alta?5.43:ate],invalidacao:{v:de},
  pol:alta?{tipo:'resistência rompida',nivel:5.52}:null}}};
}
const entradas=[
 fixture('IBOV',[172458,181106.7,187294.42,181439.655,187648.7,181470.75,38.208597,209714,164447,19.5,181738.99,187080.5,192422.01,128005,100029.99,209714,'transição (topo mais alto, fundo mais baixo)','baixa']),
 fixture('USDBRL',[5.64,5.34,5.2,5.15,5.23,5.15,79.938302,4.94,5.67,3.6,5.39,5.31,5.22,6.36,6.81,5.1,'baixa','alta']),
 fixture('PETR4',[45.3,51.3505,50.9644,44.7275,51.441,45.22625,34.11,59.79,43.23,13.3,49.56,51.51,53.46,28.88,18.65,47.3,'alta','baixa']),
 fixture('VALE3',[63.5,63.418,68.991,77.65455,68.001,77.0735,44.222038,74.91,59.42,44.4,65.34,67.16,68.99,50.81,41.24,81.99,'transição','baixa']),
 fixture('ITUB4',[42.27,42.91,43.82,42.91,44.04,42.79,47.400344,50.85,38.11,34.9,42.98,44.48,45.98,29.82,21.95,50.85,'transição','baixa'])];
const ruim=(texto,ticker='ITUB4',bloco='dow')=>C.validaNarrativa([{caminho:`ativos.${ticker}.${bloco}`,ticker,texto}],[C.fatosTecnicos(entradas.find(e=>e.ticker===ticker))]);
test('frase exata do PDF4 e variações singulares/plurais são conferidas',()=>{
 const frases=[
  'No gráfico semanal, o preço posiciona-se entre a média de 10 períodos em 44,04 e a de 40 períodos em 42,79, ao passo que o diário exibe as médias em configuração de baixa.',
  'No semanal, o preço está entre a média móvel de 10 semanas e a média móvel de 40 semanas.',
  'No gráfico semanal o preço está entre as médias de 10 e 40 períodos, mantendo indefinição.',
  'Sem alinhamento com o diário, no semanal o fechamento se encontra entre as MM10s e MM40s.',
  'O fechamento está entre MM10s e MM40s.',
  'No semanal, o preço está acima das duas médias.'
 ];
 for(const s of frases)assert.ok(ruim(s).some(p=>p.regra==='posicao_medias'),s);
});
test('negação local, comparação verdadeira e referência insuficiente não viram erro',()=>{
 for(const s of ['No semanal, o preço não está entre as médias de 10 e 40 períodos.',
  'Não é correto dizer que o preço está entre as médias de 10 e 40 semanas.',
  'No semanal, o preço está abaixo da MM10s e da MM40s.'])assert.equal(ruim(s).filter(p=>p.regra==='posicao_medias').length,0,s);
 assert.equal(ruim('No semanal, o preço está entre a média de 10 períodos e uma resistência não identificada.').length,0);
 const e=entradas.find(e=>e.ticker==='PETR4');assert.ok(!C.validaNarrativa([{caminho:'ativos.PETR4.dow',ticker:'PETR4',texto:'No semanal, o preço está entre as MM10s e MM40s.'}],[C.fatosTecnicos(e)]).length);
});
test('compara a média citada, não presume sempre as duas primeiras',()=>{
 assert.ok(ruim('No diário, o preço está entre as MM20 e MM200.').length);
 assert.ok(ruim('No diário, o preço está acima da MM200.').length);
 assert.ok(!ruim('No diário, o preço está abaixo da MM200.').length);
});
test('reservas dos cinco ativos preservam mapa, ficam até 1500 caracteres e passam nos validadores',()=>{
 for(const e of entradas)for(const bloco of ['dow','elliott','pa','cenarios']){
  const c=`ativos.${e.ticker}.${bloco}`,f=C.fatosTecnicos(e),t=N.reservaTecnica(e,c,f);
  assert.ok(t.length>=40&&t.length<=1500,`${e.ticker}/${bloco}: ${t.length}`);
  assert.match(t,/[.!?]$/);assert.ok(N.cobreMapa(e,c,t),`${e.ticker}/${bloco}: cobertura`);
  assert.ok(textoTecnicoConfere(t,e.fatos),`${e.ticker}/${bloco}: números: ${t}`);
  assert.deepEqual(C.validaNarrativa([{caminho:c,ticker:e.ticker,texto:t}],[f]),[],`${e.ticker}/${bloco}: coerência`);
 }
});
test('Elliott continua específico e hipotético, com âncoras, Fibonacci, extensões e confluência',()=>{
 for(const e of entradas){
  const t=N.reservaTecnica(e,`ativos.${e.ticker}.elliott`,C.fatosTecnicos(e)),m=e.fatos.tecnico;
  for(const v of [m.perna.de,m.perna.ate,...m.fibo.map(q=>q.v),m.elliott.ext100,m.elliott.ext1618])assert.ok(N.contemValor(t,v),e.ticker+' '+v);
  assert.match(t,/hipótese|preliminar/);assert.match(t,/proximidade|faixas/);
 }
});
test('Dow reconhece pivô já atravessado e não promete reversão completa',()=>{
 for(const ticker of ['USDBRL','PETR4']){const e=entradas.find(e=>e.ticker===ticker),t=N.reservaTecnica(e,`ativos.${ticker}.dow`,C.fatosTecnicos(e));assert.match(t,/já ultrapassou/);assert.match(t,/confirmação estrutural adicional/);}
});
test('reserva de momentum mantém padrões, contexto e precisão de exibição',()=>{
 const e=entradas.find(e=>e.ticker==='IBOV'),t=N.reservaTecnica(e,'ativos.IBOV.pa',C.fatosTecnicos(e));
 assert.match(t,/inside bar/);assert.match(t,/pavio superior longo/);assert.match(t,/38,21/);assert.ok(!t.includes('38,208597'));assert.match(t,/momentum enfraquecido/);
 assert.ok(ruim('O RSI 14 está em 34,1 (neutro), sem excesso de força para nenhum lado.','PETR4','pa').some(p=>p.regra==='rsi_equilibrio_indevido'));
 assert.ok(!ruim('O RSI 14 em 34,11 está abaixo da linha central; isso não comprova equilíbrio.','PETR4','pa').length);
});
test('projeção não vira percurso certo e ressalva genérica não substitui o mapa',()=>{
 assert.ok(ruim('O fechamento abaixo da média direcionará os preços ao teste do fundo.','VALE3','cenarios').some(p=>p.regra==='percurso_nao_garantido'));
 const e=entradas[1];assert.equal(N.cobreMapa(e,'ativos.USDBRL.elliott','A leitura de Elliott permanece hipótese do mapa técnico. Consulte os níveis e âncoras do mapa antes de avaliar continuidade.'),false);
});
test('falha de IA conserva frases válidas e repara apenas a relação errada',async()=>{
 const e=entradas.at(-1),antes='A estrutura maior permanece em transição. No gráfico semanal, o preço está entre a média de 10 períodos e a de 40 períodos. A tendência secundária segue pressionada.';
 const rel={ativos:{ITUB4:{dow:antes}}};
 await C.revisaTecnica(rel,[e],{revista:true,ate:Date.now(),chamar:async()=>{throw Error('não chamar')}});
 assert.ok(rel.ativos.ITUB4.dow.startsWith('A estrutura maior permanece em transição.'));
 assert.ok(rel.ativos.ITUB4.dow.endsWith('A tendência secundária segue pressionada.'));
 assert.match(rel.ativos.ITUB4.dow,/abaixo/);assert.ok(!rel.ativos.ITUB4.dow.includes('entre a média'));
});
test('reserva integral é específica quando o revisor aponta várias falhas',async()=>{
 const e=entradas[1],texto='Uma descrição sem os níveis de Fibonacci que deveria ser corrigida preservando o mapa.';
 const rel={ativos:{USDBRL:{elliott:texto}}};let n=0;
 const r=await C.revisaTecnica(rel,[e],{revista:true,ate:Date.now()+40000,
  chamar:async()=>{n++;throw Error('indisponível')},validar:(c,t)=>N.cobreMapa(e,c.caminho,t)&&textoTecnicoConfere(t,e.fatos)});
 assert.equal(r.reservas,1);assert.ok(N.cobreMapa(e,'ativos.USDBRL.elliott',rel.ativos.USDBRL.elliott));assert.match(rel.ativos.USDBRL.elliott,/5,67/);
});
test('datas editoriais válidas não são preços inventados; datas inválidas continuam sendo rejeitadas',()=>{
 const e=entradas[0];
 assert.ok(textoTecnicoConfere('Perna de 209.714,00 (09/10) a 164.447,00 (03/11).',e.fatos));
 assert.ok(textoTecnicoConfere('Dentro da sessão de 13/11, o fechamento foi 172.458,00.',e.fatos));
 assert.ok(!textoTecnicoConfere('A referência indevida de 31/02 precisa de revisão.',{}));
 assert.ok(!textoTecnicoConfere('Preço inventado em 777,77, mesmo em 03/11.',e.fatos));
});
test('sem IA, os vinte blocos dos cinco ativos continuam específicos e coerentes',async()=>{
 const ativos=Object.fromEntries(entradas.map(e=>[e.ticker,{
  dow:'No semanal o preço está entre a média de 10 períodos e a de 40 períodos.',
  elliott:'A leitura de Elliott permanece hipótese do mapa técnico. Consulte os níveis e âncoras do mapa.',
  pa:'O RSI está neutro e sem excesso de força para nenhum lado; não foram descritos os padrões do ativo.',
  cenarios:'O movimento direcionará os preços ao fundo seguinte sem identificar gatilho ou invalidação.'}]));
 const rel={ativos};await C.revisaTecnica(rel,entradas,{revista:true,ate:Date.now(),chamar:async()=>{throw Error('Não chamar')},
  validar:(c,t)=>{const e=entradas.find(e=>e.ticker===c.ticker);return N.cobreMapa(e,c.caminho,t)&&textoTecnicoConfere(t,e.fatos)}});
 for(const e of entradas)for(const k of ['dow','elliott','pa','cenarios']){
  const t=rel.ativos[e.ticker][k],c=`ativos.${e.ticker}.${k}`;
  assert.ok(N.cobreMapa(e,c,t),c);assert.ok(textoTecnicoConfere(t,e.fatos),c);
  assert.deepEqual(C.validaNarrativa([{ticker:e.ticker,caminho:c,texto:t}],[C.fatosTecnicos(e)]),[],c);
 }
});
test('se até a reserva não passa no contrato, não retorna um bloco não validado',async()=>{
 const e=entradas[0];await assert.rejects(C.revisaTecnica({ativos:{IBOV:{dow:'Um texto com informações não validadas e sem os números exigidos.'}}},[e],
  {revista:true,ate:Date.now(),chamar:async()=>{},validar:()=>false}),/Reserva técnica incompatível/);
});
test('não confunde relação entre médias ou preço histórico com fechamento atual',()=>{
 assert.ok(!ruim('No semanal, a MM20 está entre as MM10s e MM40s.').length);
 assert.ok(!ruim('Na semana passada, o preço estava entre as médias de 10 e 40 semanas.').length);
 assert.ok(!ruim('A hipótese não confirma uma onda impulsiva e mantém os cenários abertos.','ITUB4','elliott').length);
});
