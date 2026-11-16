/* v657 · Banco universitário com fallback local e IA via modo quiz existente. */
;(function(){
'use strict';
const L=window.EconomiaLab,S=L.state;
const DB={
 macro:{nome:'Macroeconomia',temas:['Regra de Taylor','Mundell–Fleming','Multiplicador fiscal'],q:[
 ['Se a inflação esperada sobe, mantendo o restante constante na regra de Taylor, a taxa nominal recomendada:', ['Diminui','Aumenta','Não muda','Torna-se zero'],1,['Identifique a diferença πᵉ − meta.','A regra reage positivamente a inflação esperada e ao desvio da meta.','O juro nominal sugerido aumenta.']],
 ['No modelo Mundell–Fleming, sob câmbio flexível e mobilidade perfeita, expansão fiscal isolada tende a:', ['Apreciar a moeda','Depreciar a moeda','Zerar os juros externos','Elevar Y sem contrapartida externa'],0,['Maior gasto desloca a IS à direita.','A pressão por entradas de capital aprecia a moeda doméstica.','Exportações líquidas menores atenuam o impulso fiscal no produto.']],
 ['O que caracteriza uma ETTJ invertida?', ['Juros longos acima dos curtos','Juros curtos acima dos longos','Inflação negativa certa','Dívida pública inexistente'],1,['Compare taxas de prazos diferentes com mesma convenção.','Invertida significa taxa curta superior à longa.','Não equivale a certeza de recessão, pois há prêmios e expectativas.']]
 ]},
 micro:{nome:'Microeconomia',temas:['Elasticidade','Monopólio','Excedente e impostos'],q:[
 ['A demanda é elástica em preço (|ε| > 1). Um aumento de preço tende a:', ['Elevar receita total','Reduzir receita total','Manter receita','Impedir vendas'],1,['A quantidade cai mais que proporcionalmente à alta de preço.','Receita é preço vezes quantidade.','O efeito quantidade domina: receita tende a cair.']],
 ['No ótimo interior de um monopólio que maximiza lucro, ocorre:', ['RMg = CMg','Preço = CMg sempre','RMg = custo médio','Lucro = receita total'],0,['Defina lucro = receita total − custo total.','Derive em relação à quantidade produzida.','A condição de primeira ordem é RMg = CMg.']],
 ['Um imposto unitário em mercado competitivo geralmente:', ['Gera cunha entre preços pago e recebido','Aumenta necessariamente quantidade','É sempre suportado pelo produtor','Elimina perda de peso morto'],0,['O imposto distancia o preço do consumidor do preço do produtor.','A quantidade de equilíbrio tende a cair.','A incidência depende das elasticidades de oferta e demanda.']]
 ]},
 met:{nome:'Econometria / Estatística',temas:['MQO','CAPM','Teste de hipótese'],q:[
 ['O coeficiente angular de MQO simples com intercepto é:', ['Cov(X,Y)/Var(X)','Var(Y)/Var(X)','Correlação ao quadrado','Média(Y) − Média(X)'],0,['MQO minimiza a soma de resíduos quadráticos.','A inclinação é Σ(X−X̄)(Y−Ȳ) / Σ(X−X̄)².','Isto é covariância dividida por variância de X.']],
 ['R² = 0,64 implica:', ['Causalidade comprovada','64% da variação amostral de Y explicada pelo ajuste','64% de acerto futuro','Correlação sempre positiva'],1,['R² = 1 − SQRes/SQTot.','É proporção de variação de Y explicada na amostra.','Não implica causalidade nem previsão fora da amostra.']],
 ['Para estimar beta de uma ação contra o IBOV, recomenda-se usar:', ['Preços nominais separados','Retornos nas mesmas datas','Número de negócios','Valor médio de dividendos'],1,['Beta mede covariância entre retornos, relativa à variância de mercado.','Alinhe periodicidade e datas das observações.','Preços em nível podem gerar regressões espúrias.']]
 ]},
 br:{nome:'Economia Brasileira',temas:['Plano Real','Tripé pós-1999','Novo Arcabouço Fiscal'],q:[
 ['A URV na preparação do Plano Real foi principalmente:', ['Unidade de conta de transição','Moeda estrangeira','Taxa básica de juros','Imposto inflacionário'],0,['A economia tinha indexação e inflação inercial.','A URV criou referência de preços com transição coordenada.','Posteriormente o real passou a ser meio de pagamento.']],
 ['Após 1999, o tripé macroeconômico brasileiro é associado a:', ['Câmbio fixo, tabelamento e emissão','Metas de inflação, câmbio flutuante e compromisso fiscal','Subvenção, dolarização e juros congelados','Controle de capitais permanente'],1,['O câmbio passou a flutuar após a crise cambial.','Adotou-se metas de inflação e taxa de juros como instrumento.','A disciplina do resultado primário era o terceiro eixo.']],
 ['O resultado primário do setor público:', ['Inclui juros nominais','Exclui juros nominais','É igual ao saldo comercial','Mede o crescimento do PIB'],1,['Separe receitas e despesas primárias.','Pagamento de juros não compõe o resultado primário.','O resultado nominal incorpora os juros.']]
 ]}
};
L.quizDB=DB;
function atual(){
 const lista=S.questoes||DB[S.disc].q.map(q=>({q:q[0],o:q[1],c:q[2],passos:q[3],r:'Bibliografia de graduação'}));
 return {lista,q:lista[S.qidx%lista.length]};
}
L.views.quiz=()=>{
 const c=DB[S.disc];if(!c)S.disc='macro';
 const {lista,q}=atual(),resp=S.resp;
 const controls='<div class="eco-controls"><label>Disciplina<select data-eco-select="disc">'+Object.entries(DB).map(([k,v])=>'<option value="'+k+'"'+(S.disc===k?' selected':'')+'>'+L.esc(v.nome)+'</option>').join('')+'</select></label>'+
 '<label>Tópico<select data-eco-select="topico">'+DB[S.disc].temas.map(x=>'<option value="'+L.esc(x)+'"'+(S.topico===x?' selected':'')+'>'+L.esc(x)+'</option>').join('')+'</select></label>'+
 '<button type="button" class="eco-action" data-eco-btn="gerar"'+(S.loading?' disabled':'')+'>'+(S.loading?'Gerando…':'Gerar 5 questões com IA')+'</button></div>';
 const origem=S.questoes?'Roteador de IA do aplicativo · questões inéditas; confira a resolução.':'Questões autorais locais de treinamento universitário; não são enunciados oficiais da ANPEC.';
 const options=q.o.map((op,i)=>'<button type="button" data-eco-btn="responder" data-v="'+i+'" class="eco-option'+(resp!==null&&i===q.c?' certo':resp===i?' errado':'')+'"'+(resp!==null?' disabled':'')+'><b>'+'ABCD'[i]+'.</b> '+L.esc(op)+'</button>').join('');
 const feedback=resp===null?'':L.card(resp===q.c?'Resposta correta':'Resolução comentada',
  L.note('<b>Gabarito:</b> '+'ABCD'[q.c]+'. '+L.esc(q.o[q.c]))+
  (Array.isArray(q.passos)?q.passos.map((x,i)=>L.note('<b>Passo '+(i+1)+'.</b> '+L.esc(x))).join(''):
   L.note('<b>Passo 1.</b> Identifique o conceito pedido no enunciado.')+
   L.note('<b>Passo 2.</b> Fundamente: '+L.esc(q.e||'A justificativa não foi retornada pela IA.'))+
   L.note('<b>Passo 3.</b> Releia a bibliografia: '+L.esc(q.r||'Livro-texto da disciplina.'))) +
  '<button class="eco-action" data-eco-btn="proxima" type="button">Próxima questão</button>');
 return L.card('Questões universitárias · estilo ANPEC',controls+
 L.note(origem+(S.erro?' · IA indisponível, usando fallback: '+L.esc(S.erro):''))+
 '<div class="eco-question"><small>Questão '+(S.qidx+1)+' de '+lista.length+' · '+L.esc(DB[S.disc].nome)+'</small><h3>'+L.esc(q.q)+'</h3>'+options+'</div>')+feedback;
};
L.events.responder=el=>{S.resp=+el.dataset.v;L.paint();};
L.events.proxima=()=>{S.qidx=(S.qidx+1)%atual().lista.length;S.resp=null;L.paint();};
L.events.gerar=async()=>{
 if(S.loading)return;S.loading=true;S.erro='';L.paint();
 try{
  if(typeof anxCall!=='function')throw Error('Roteador de IA indisponível.');
  const result=await anxCall({modo:'quiz',curso:'Ciências Econômicas',materia:DB[S.disc].nome,
   topico:S.topico||DB[S.disc].temas[0],nivel:'graduação · preparação ANPEC',n:5});
  const perguntas=(result.questoes||[]).filter(q=>q&&q.q&&Array.isArray(q.o)&&q.o.length===4&&q.o.every(Boolean)&&Number.isInteger(+q.c)&&+q.c>=0&&+q.c<=3)
    .slice(0,5).map(q=>({q:String(q.q).slice(0,800),o:q.o.map(String),c:+q.c,e:String(q.e||'').slice(0,600),r:String(q.r||'').slice(0,200)}));
  if(!perguntas.length)throw Error('Nenhuma questão válida foi recebida.');
  S.questoes=perguntas;S.qidx=0;S.resp=null;
 }catch(e){S.erro=String(e.message||e).slice(0,160);S.questoes=null;}
 finally{S.loading=false;L.paint();}
};
const oldChange=L.events.change;
L.events.change=(k,v)=>{
 if(k==='disc'||k==='topico'){
  if(k==='disc'){if(!DB[v])return;S.disc=v;S.topico=DB[v].temas[0];}else S.topico=v;
  S.questoes=null;S.qidx=0;S.resp=null;S.erro='';L.paint();
 }else if(oldChange)oldChange(k,v);
};
})();
