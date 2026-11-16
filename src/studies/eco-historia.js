/* v657 · História econômica brasileira pós-Plano Real (seção didática isolada). */
;(function(){
'use strict';
const L=window.EconomiaLab,S=L.state;
const PERIODOS=[
 ['1994','Plano Real','Introdução da URV como unidade de conta e do real como moeda, reduzindo a inflação inercial e reorganizando preços relativos.','Inflação inercial; indexação; URV; estabilização; âncora nominal.'],
 ['1999','Tripé macroeconômico','Transição para câmbio flutuante, regime de metas para a inflação e esforço de resultado primário do governo.','Câmbio flutuante; política monetária; metas; superávit primário.'],
 ['2003–2008','Expansão e commodities','Ciclo favorável de demanda externa e preços de commodities, ampliação do crédito e da renda doméstica.','Termos de troca; exportações; consumo; mercado de trabalho.'],
 ['2008–2009','Crise financeira global','Restrição internacional de crédito, recuo de comércio e respostas contracíclicas fiscais e monetárias.','Contágio; recessão global; multiplicador; liquidez.'],
 ['2015–2016','Recessão brasileira','Queda acentuada da atividade com desequilíbrios macroeconômicos, choques de expectativas e deterioração fiscal.','Hiato do produto; desemprego; resultado primário; política econômica.'],
 ['2020–2021','Pandemia','Choque simultâneo de oferta e demanda, transferências emergenciais, juros baixos e recuperação desigual.','Choques; inflação; emprego; transferência de renda; dívida pública.'],
 ['2023','Novo Arcabouço Fiscal','A Lei Complementar 200/2023 estabeleceu regime fiscal com limites de crescimento de despesa associados à receita, metas de resultado primário e mecanismos de ajuste.','Regras fiscais; resultado primário; sustentabilidade da dívida; limites de despesa.']
];
L.views.tempo=()=>{
 const p=PERIODOS[Math.max(0,Math.min(PERIODOS.length-1,S.evento))];
 const nav='<div class="eco-timeline" role="list">'+PERIODOS.map((x,i)=>'<button type="button" role="listitem" data-eco-btn="evento" data-v="'+i+'" class="'+(i===S.evento?'on':'')+'"><b>'+L.esc(x[0])+'</b><span>'+L.esc(x[1])+'</span></button>').join('')+'</div>';
 return L.card('Linha do tempo · ciclos e regimes da economia brasileira',nav)+
 L.card(L.esc(p[0])+' · '+L.esc(p[1]),L.note(p[2])+L.note('<b>Conceitos-chave de prova:</b> '+L.esc(p[3]))+
 L.note('Revisão histórica para estudo: ciclos não são explicados por uma única causa. Compare séries do IBGE, BCB e Ipea e bibliografia da faculdade.'));
};
L.events.evento=el=>{S.evento=+el.dataset.v;L.paint();};
})();
