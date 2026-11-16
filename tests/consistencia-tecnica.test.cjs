const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../supabase/functions/_shared/consistencia-tecnica.ts');
const {textoTecnicoConfere}=require('../supabase/functions/analise/validacao.ts');
const {cobreMapa}=require('../supabase/functions/_shared/narrativa-tecnica.ts');
const {normaliza}=require('../supabase/functions/revista-ia/revista.ts');
const entrada=(ticker='ITUB4',fatos={})=>({ticker,fatos:{fechamento:42.27,mm20:42.91,mm50:43.82,mm200:42.91,mm10s:44.04,mm40s:42.79,rsi14:47.4,...fatos}});
const campo=(texto,ticker='ITUB4',caminho='ativos.ITUB4.dow')=>({texto,ticker,caminho});
const valida=(texto,e=entrada())=>C.validaNarrativa([campo(texto,e.ticker)],[C.fatosTecnicos(e)]);
const relatorio=(texto)=>({ativos:{ITUB4:{dow:texto,elliott:'Hipótese de Elliott com referências condicionais do mapa, sem confirmação de uma contagem específica.',pa:'Os candles e o RSI devem ser interpretados em conjunto com a estrutura, aguardando confirmação.',cenarios:'Os cenários dependem do fechamento e dos níveis do mapa; não há confirmação automática de continuidade.',fonte:'ia',trocados:0}}});

test('A/B: ITUB4 e IBOV abaixo de ambas; igualdade não é entre',()=>{
 for(const e of [entrada(),entrada('IBOV',{fechamento:172458,mm10s:187648.7,mm40s:181470.75})]){
  const f=C.fatosTecnicos(e);assert.equal(f.series[1].par_medias,'abaixo de ambas');
  assert.ok(valida('No gráfico semanal o preço está entre as médias.',e).some(x=>x.regra==='posicao_medias'));
 }
 assert.equal(C.fatosTecnicos(entrada('ITUB4',{fechamento:44.04})).series[1].par_medias,'sobre uma ou ambas');
});
test('C/D: pivôs já atravessados não provam reversão ou data do primeiro rompimento',()=>{
 for(const [ticker,px,nivel,tipo,direcao] of [['PETR4',45.3,47.3,'fundo anterior','abaixo'],['USDBRL',5.64,5.1,'topo anterior','acima']]){
  const e=entrada(ticker,{fechamento:px,tecnico:{dow:{pivo:{v:nivel,tipo}}}}),f=C.fatosTecnicos(e);
  assert.equal(f.gatilhos[0].condicao_satisfeita,true);assert.equal(f.gatilhos[0].primeiro_rompimento,'não determinado');
  assert.ok(valida(`Se fechar ${direcao} de ${nivel.toFixed(2).replace('.',',')}, o pivô será rompido.`,e).some(x=>x.regra==='gatilho_ja_satisfeito'));
  assert.deepEqual(valida('O pivô já foi atravessado; o dilema de Pring ainda exige confirmação adicional.',e),[]);
 }
});
test('E/F: sem inclinação ou trajetória não inventa evolução; rsi5 é reconhecido',()=>{
 assert.ok(valida('As médias estão inclinadas negativamente.').some(x=>x.regra==='inclinacao_ausente'));
 assert.ok(valida('O RSI encontra-se estabilizado em 34,11.',entrada('ITUB4',{rsi14:34.11})).some(x=>x.regra==='trajetoria_rsi_ausente'));
 assert.deepEqual(valida('O RSI em 34,11 indica fraqueza no contexto de queda.',entrada('ITUB4',{rsi14:34.11})),[]);
 assert.equal(C.fatosTecnicos(entrada('ITUB4',{tecnico:{rsi5:30}})).capacidades.rsi_historico,true);
});
test('G/H/I: inside bar, Elliott e polaridade não recebem certeza indevida',()=>{
 assert.ok(valida('A inside bar confirma a compressão da volatilidade.').length);
 assert.deepEqual(valida('Uma inside bar não confirma compressão persistente.'),[]);
 assert.ok(valida('A retração de 3,6% comprova impulso com alto grau de convicção.').length);
 assert.ok(valida('A resistência rompida agora atua como suporte confirmado.').length);
 assert.deepEqual(valida('A resistência rompida é potencial suporte, ainda sem reteste confirmado.'),[]);
});
test('J/K: snapshot, null e metadados incompatíveis não produzem comparações',()=>{
 let f=C.fatosTecnicos(entrada('WIN',{cobertura:'snapshot'}));assert.equal(f.cobertura,'snapshot');assert.equal(f.series[0].par_medias,'indeterminada');
 assert.ok(valida('A tendência semanal segue em alta.',entrada('WIN',{cobertura:'snapshot'})).length);
 f=C.fatosTecnicos(entrada('ITUB4',{fechamento:null}));assert.equal(f.series[0].fechamento,null);assert.equal(f.series[0].par_medias,'indeterminada');
 const e={ticker:'WIN',moeda:'BRL',multitempo:{diario:{ticker:'IBOV',fechamento:42,media_rapida:{n:20,valor:40},media_lenta:{n:50,valor:39}}}};
 assert.equal(C.fatosTecnicos(e).series[0].par_medias,'indeterminada');
 const t={ticker:'PETR4',contrato:'A',multitempo:{diario:{fechamento:42,media_rapida:{n:20,valor:40,contrato:'B'},media_lenta:{n:50,valor:39}}}};
 assert.equal(C.fatosTecnicos(t).series[0].medias[0].valor,null);
});
test('adaptador Análises usa fechamento do horizonte, não preço intradiário',()=>{
 const e={ticker:'PETR4',preco_atual:50,multitempo:{diario:{fechamento:45.3,media_rapida:{n:20,valor:51.35,inclinacao:'caindo'},media_lenta:{n:50,valor:50.96}}},leitura_dow_do_trader:{diario:{pivo:{tipo:'baixa',nivel:47.3}}}};
 const orig=JSON.stringify(e),f=C.fatosTecnicos(e);assert.equal(f.gatilhos[0].condicao_satisfeita,true);assert.equal(f.series[0].fechamento,45.3);assert.equal(f.series[0].medias[0].inclinacao,'caindo');assert.equal(JSON.stringify(e),orig);
});
test('validador numérico existente admite pt-BR e arredondamento, rejeita preços inventados',()=>{
 assert.ok(textoTecnicoConfere('Fechamento de 172.458,00; RSI 38,2.',{fechamento:172458,rsi14:38.21}));
 assert.ok(!textoTecnicoConfere('O suporte está em 999,99.',{fechamento:42.27}));
});
test('fluxo válido chama revisão uma vez e preserva o contrato integral',async()=>{
 const r=relatorio('No semanal, o preço está abaixo de ambas as médias, conforme os valores apresentados no mapa.'),orig=JSON.stringify(r);let n=0;
 const x=await C.revisaTecnica(r,[entrada()],{revista:true,ate:Date.now()+40000,chamar:async()=>{n++;return {problemas:[]}}});
 assert.equal(n,1);assert.equal(x.revisado,true);assert.equal(JSON.stringify(r),orig);
});
test('corrige somente bloco afetado; 1 revisão + 1 correção; revalida números',async()=>{
 const r=relatorio('No gráfico semanal o preço está entre as médias de 10 e 40 períodos, mantendo indefinição.'),outros=JSON.stringify([r.ativos.ITUB4.pa,r.ativos.ITUB4.elliott]);let n=0;
 const x=await C.revisaTecnica(r,[entrada()],{revista:true,ate:Date.now()+40000,
  chamar:async()=>++n===1?{problemas:[]}:{correcoes:[{caminho:'ativos.ITUB4.dow',texto:'No gráfico semanal, o fechamento em 42,27 está abaixo da MM10s em 44,04 e da MM40s em 42,79.'}]},
  validar:(c,t)=>textoTecnicoConfere(t,entrada().fatos)});
 assert.equal(n,2);assert.equal(x.reservas,0);assert.match(r.ativos.ITUB4.dow,/abaixo/);assert.equal(JSON.stringify([r.ativos.ITUB4.pa,r.ativos.ITUB4.elliott]),outros);
 assert.deepEqual(Object.keys(r.ativos.ITUB4),['dow','elliott','pa','cenarios','fonte','trocados']);
});
test('problema semântico exige caminho, trecho literal e evidência; protege enums',async()=>{
 const r={ativos:[{ticker:'ITUB4',vies:'ALTA',resumo:'A recuperação tem estrutura definida e precisa de confirmação adicional para o cenário.',plano_de_trade:{entrada:42,stop:40}}],conclusao:{recomendacao:'COMPRAR'},alertas:[]};let n=0;
 await C.revisaTecnica(r,[{ticker:'ITUB4'}],{ate:Date.now()+40000,chamar:async()=>{n++;return {problemas:[{caminho:'ativos.0.vies',ticker:'ITUB4',trecho:'ALTA',regra:'x',evidencia:'y'}]}}});
 assert.equal(n,1);assert.equal(r.ativos[0].vies,'ALTA');assert.equal(r.ativos[0].plano_de_trade.entrada,42);assert.match(r.alertas[0],/indisponível/);
});
test('L: revisão indisponível não libera contradição comprovada; reserva não recopia base',async()=>{
 const r=relatorio('No gráfico semanal o preço está entre as médias de 10 e 40 períodos, mantendo indefinição.');let n=0;
 const x=await C.revisaTecnica(r,[entrada()],{revista:true,ate:Date.now()+40000,chamar:async()=>{n++;throw Error('sem provedor')}});
 assert.equal(n,2);assert.equal(x.revisado,false);assert.equal(x.reservas,1);assert.match(r.ativos.ITUB4.dow,/abaixo/);assert.ok(!r.ativos.ITUB4.dow.includes('entre as'));
});
test('L: prazo esgotado não inicia IA; rejeita correção fora da lista e número novo',async()=>{
 for(const tipo of ['prazo','campo','numero','truncado']){
  const r=relatorio('No gráfico semanal o preço está entre as médias de 10 e 40 períodos, mantendo indefinição.');let n=0;
  const x=await C.revisaTecnica(r,[entrada()],{revista:true,ate:Date.now()+(tipo==='prazo'?0:40000),
   chamar:async()=>++n===1?{problemas:[]}:{correcoes:[{caminho:tipo==='campo'?'ativos.ITUB4.fonte':'ativos.ITUB4.dow',texto:tipo==='truncado'?'A leitura precisa de confirmação adicional pois o preço encontra-se abaixo de':'O preço está abaixo das duas médias e o suporte imediato está em 999,99.'}]},validar:(c,t)=>textoTecnicoConfere(t,entrada().fatos)});
  assert.equal(x.reservas,1);if(tipo==='prazo')assert.equal(n,0);assert.ok(!r.ativos.ITUB4.dow.includes('999,99'));assert.equal(r.ativos.ITUB4.fonte,'ia');
 }
});
test('suspeita semântica válida é corrigida sem modificar blocos não apontados',async()=>{
 const texto='O movimento perde força apesar da recuperação, exigindo cuidado com novas conclusões.';
 const r=relatorio(texto);let n=0;
 const x=await C.revisaTecnica(r,[entrada()],{revista:true,ate:Date.now()+40000,chamar:async()=>++n===1?
  {problemas:[{caminho:'ativos.ITUB4.dow',ticker:'ITUB4',trecho:texto,regra:'momento_sem_trajetoria',evidencia:'Não há evolução do indicador para afirmar perda de força.'}]}:
  {correcoes:[{caminho:'ativos.ITUB4.dow',texto:'O fechamento permanece abaixo das médias semanais; a trajetória do momentum não foi demonstrada.'}]}});
 assert.equal(x.reservas,0);assert.equal(x.revisado,true);assert.match(r.ativos.ITUB4.dow,/não foi demonstrada/);
});
test('resposta parcial/incompleta do revisor não conta como revisão concluída',async()=>{
 for(const resposta of [{},{problemas:{a:1}},{incompleto:true,problemas:[]},{problemas:[{caminho:'ativos.ITUB4.dow',ticker:'ITUB4',trecho:'não existe',regra:'x',evidencia:'y'}]}]){
  const x=await C.revisaTecnica(relatorio('O fechamento está abaixo das médias semanais e a estrutura exige confirmação adicional.'),[entrada()],{revista:true,ate:Date.now()+40000,chamar:async()=>resposta});assert.equal(x.revisado,false);
 }
});
test('normalização não trunca frase ou condição acima de 1500 caracteres',()=>{
 const e={...entrada(),base:{dow:'Base factual completa de reserva para a leitura da estrutura e das médias.',elliott:'Base factual completa de reserva para Fibonacci e Elliott.',pa:'Base factual completa de reserva para price action e RSI.',cenarios:'Base factual completa de reserva para os cenários condicionais.'}};
 const r=normaliza({ativos:{ITUB4:{dow:'A'.repeat(1600)}}},[e]);assert.equal(r.ITUB4.dow,e.base.dow);
});

function handlerRevista(gerar, cache=[]){
 const fs=require('node:fs'),vm=require('node:vm'),{stripTypeScriptTypes}=require('node:module');
 let handler;const requisicoes=[];
 const src=stripTypeScriptTypes(fs.readFileSync(require('node:path').join(__dirname,'../supabase/functions/revista-ia/index.ts'),'utf8'),{mode:'transform'})
  .replace(/^import .*;\s*$/gm,'').replace(/^export\s+(?=(?:async\s+)?(?:const|function|let))/gm,'');
 const contexto={...C,SYS_REVISTA:'GERACAO_INICIAL',normaliza,cobreMapa,BLOCOS:['dow','elliott','pa','cenarios'],textoTecnicoConfere,
  gerarTexto:gerar,jsonDe:JSON.parse,Request,Response,Headers,AbortSignal,URL,TextEncoder,crypto:require('node:crypto').webcrypto,
  console:{warn(){},info(){}},Deno:{env:{get:k=>({SUPABASE_URL:'https://projeto.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'svc'})[k]},serve:fn=>{handler=fn}},
  fetch:async(url,opt={})=>{requisicoes.push({url,opt});if(url.endsWith('/auth/v1/user'))return Response.json({id:opt.headers.Authorization.includes('outro')?'usuario-b':'usuario-a'});
   if(opt.method==='POST')return new Response(null,{status:201});return Response.json(cache);}};
 vm.runInNewContext(src,contexto);return {handler,requisicoes};
}
const dadosRevista=()=>({corte:'2026-11-13',ativos:[{...entrada(),base:{...relatorio('No gráfico semanal o preço está entre as médias de 10 e 40 períodos, mantendo indefinição.').ativos.ITUB4}}]});
const reqRevista=(body,token='aaa.bbb.ccc')=>new Request('https://projeto.test/functions/v1/revista-ia',{method:'POST',headers:{'Content-Type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
test('Edge revista: autenticação, JSON público, cache versionado/isolado e fatos internos',async()=>{
 let n=0;const h=handlerRevista(async(sys,pacote)=>{
  n++;
  if(sys.startsWith('GERACAO_INICIAL')){assert.ok(pacote.includes('fatos_relacionais'));const a=relatorio('No semanal, o fechamento 42,27 está abaixo da MM10s em 44,04 e da MM40s em 42,79; ainda requer confirmação estrutural.').ativos; a.ITUB4.pa='O RSI14 em 47,40 está abaixo da linha central; candles e estrutura requerem confirmação adicional.'; return {texto:JSON.stringify({ativos:a}),rotulo:'modelo simulado'};}
  assert.equal(sys,C.SYS_REVISAO);return {texto:JSON.stringify({problemas:[]})};
 });
 let r=await h.handler(reqRevista(dadosRevista(),''));assert.equal(r.status,401);assert.equal(n,0);
 r=await h.handler(reqRevista(dadosRevista()));assert.equal(r.status,200);const j=await r.json();assert.equal(n,2);
 assert.deepEqual(Object.keys(j).sort(),['ativos','corte','gerado','modelo']);assert.deepEqual(Object.keys(j.ativos.ITUB4).sort(),['cenarios','dow','elliott','fonte','pa','trocados']);
 assert.ok(!JSON.stringify(j).includes('fatos_relacionais'));assert.ok(!JSON.stringify(j).includes('versao'));
 const chaves=h.requisicoes.filter(x=>x.url.includes('chave=eq.')).map(x=>decodeURIComponent(x.url));assert.ok(chaves[0].includes(C.VERSAO_CONSISTENCIA+':usuario-a'));
 await h.handler(reqRevista(dadosRevista(),'outro.bbb.ccc'));
 const nova=h.requisicoes.filter(x=>x.url.includes('chave=eq.')).map(x=>decodeURIComponent(x.url)).at(-1);assert.match(nova,/usuario-b/);
 const alterados=dadosRevista();alterados.ativos[0].fatos.fechamento=43;await h.handler(reqRevista(alterados));
 const ultima=h.requisicoes.filter(x=>x.url.includes('chave=eq.')).map(x=>decodeURIComponent(x.url)).at(-1);assert.notEqual(ultima,chaves[0]);
});
test('Edge revista: nenhuma IA disponível ainda valida a reserva, sem cache de resultado não revisado',async()=>{
 const h=handlerRevista(async()=>{throw Error('provedor indisponível')});
 const r=await h.handler(reqRevista(dadosRevista()));assert.equal(r.status,200);const j=await r.json();assert.match(j.ativos.ITUB4.dow,/abaixo/);assert.ok(!j.ativos.ITUB4.dow.includes('entre as médias'));
 assert.ok(!h.requisicoes.some(x=>x.opt.method==='POST'&&x.url.includes('analise_cache')));
});
test('revisor que não responde é interrompido pelo prazo local',async()=>{
 let chamadas=0,leituras=0;const r=relatorio('No gráfico semanal o preço está entre as médias de 10 e 40 períodos, mantendo indefinição.');
 const resultado=await C.revisaTecnica(r,[entrada()],{revista:true,ate:20000,agora:()=>++leituras<=2?1000:25000,chamar:async()=>{chamadas++;return new Promise(()=>{});}});
 assert.equal(chamadas,1);assert.equal(resultado.revisado,false);assert.equal(resultado.reservas,1);assert.match(r.ativos.ITUB4.dow,/abaixo/);
});
