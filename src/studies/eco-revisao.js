/* v661 · Formulário de prova em uma página A4; HTML/print nativo do navegador. */
;(function(){
'use strict';
const L=window.EconomiaLab,S=L.state,E=L.esc,N=L.note,C=L.card;
const THEMES={
 solow:{t:'Modelo de Solow',disc:'Macroeconomia',vars:[
 ['Y, K, L, A','Produto, capital, trabalho e tecnologia.'],['k=K/(AL)','Capital por trabalhador efetivo.'],['s, n, g, δ','Taxa de poupança, crescimento populacional, tecnologia e depreciação.']],
 eq:['Y=K^α(AL)^(1−α); f(k)=k^α, com 0<α<1.','Variação de k: k̇ = s·f(k) − (n+g+δ)·k.','Estado estacionário: s·f(k*)=(n+g+δ)k*.','Regra de ouro: f′(k_GR)=n+g+δ (consumo por trabalhador efetivo máximo).'],
 int:'Poupança maior eleva k* e o nível de produto por trabalhador; o crescimento sustentado do produto por trabalhador depende de progresso técnico exógeno no modelo básico.',
 traps:['Confundir nível de produto com taxa permanente de crescimento.','Regra de ouro maximiza consumo, não produto.','Com n, g ou δ maior, k* cai; a renda por pessoa cresce à taxa g no estado estacionário (com A crescente).']},
 islm:{t:'IS–LM–BP · Mundell–Fleming',disc:'Macroeconomia',vars:[
 ['Y, i, e','Produto, juros e câmbio (definir convenção de e).'],['M/P, G, T','Oferta real de moeda, gasto e tributos.'],['i*, ρ','Juro internacional e prêmio de risco.']],
 eq:['IS: Y=C(Y−T)+I(i)+G+NX(e,Y,Y*).','LM: M/P = L(Y,i).','BP com alta mobilidade: i≈i*+ρ.','Câmbio flexível: o ajuste de e afeta NX e desloca IS.'],
 int:'Sob câmbio flexível e alta mobilidade, expansão monetária tende a depreciar a moeda e elevar Y; expansão fiscal aprecia a moeda e perde eficácia pelo canal externo.',
 traps:['Resultado depende do regime cambial e da mobilidade de capitais.','Câmbio nominal, real e cotação USD/BRL não são sinônimos automáticos.','O modelo não garante predição numérica para câmbio ou Selic.']},
 mqo:{t:'MQO & Teorema de Gauss–Markov',disc:'Econometria / Estatística',vars:[
 ['Y, X, u','Variável dependente, regressora e termo de erro.'],['β₀, β₁','Intercepto e inclinação populacionais.'],['ŷ, û, R²','Valores ajustados, resíduos e ajuste amostral.']],
 eq:['Yᵢ=β₀+β₁Xᵢ+uᵢ.','β̂₁=Σ(Xᵢ−X̄)(Yᵢ−Ȳ) / Σ(Xᵢ−X̄)².','β̂₀=Ȳ−β̂₁X̄; R²=1−SQR/SQT.','E[u|X]=0; Var(u|X)=σ² e sem colinearidade perfeita → MQO BLUE sob hipóteses adequadas.'],
 int:'O estimador minimiza a soma de resíduos quadráticos. Gauss–Markov estabelece menor variância entre estimadores lineares não viesados sob suas hipóteses, não causalidade automática.',
 traps:['R² elevado não demonstra causalidade.','Normalidade dos erros não é requisito para BLUE.','Heterocedasticidade pode invalidar erros-padrão usuais; endogeneidade compromete não viés.']},
 jogos:{t:'Teoria dos Jogos · Nash e Cournot',disc:'Microeconomia',vars:[
 ['Jogadores, estratégias, payoffs','Agentes, ações disponíveis e suas utilidades/lucros.'],['a, b, c','Intercepto, inclinação de demanda P=a−bQ e custo marginal.'],['q₁, q₂','Quantidades das firmas 1 e 2.']],
 eq:['Nash: cada estratégia é melhor resposta à estratégia dos demais.','Cournot: πᵢ=[a−b(qᵢ+qⱼ)−c]qᵢ.','FOC: a−2bqᵢ−bqⱼ−c=0.','Equilíbrio simétrico com CMg constante: qᵢ=(a−c)/(3b); Q=2(a−c)/(3b).'],
 int:'No duopólio de Cournot, as firmas escolhem quantidades simultaneamente. Preço e produção ficam entre monopólio e concorrência perfeita no modelo padrão.',
 traps:['Equilíbrio de Nash não exige estratégia dominante.','Cournot determina quantidades; Bertrand, preços.','O resultado qᵢ=(a−c)/(3b) supõe custos marginais constantes e firmas simétricas.']},
 elas:{t:'Elasticidades: preço, renda e cruzada',disc:'Microeconomia',vars:[
 ['Q, P, Y','Quantidade, preço próprio e renda.'],['P_B','Preço de outro bem.'],['εp, εy, εxy','Elasticidade-preço, renda e cruzada.']],
 eq:['εp=(∂Q/∂P)·(P/Q).','εy=(∂Q/∂Y)·(Y/Q).','εxy=(∂Qₓ/∂Pᵧ)·(Pᵧ/Qₓ).','Receita total RT=P·Q; com |εp|>1, aumento de P reduz RT (ceteris paribus).'],
 int:'Elasticidade mede variação proporcional de Q ante variação proporcional de um determinante. Demanda elástica responde mais que proporcionalmente ao preço.',
 traps:['Elasticidade não é inclinação da curva.','Bem inferior: elasticidade-renda negativa; bens de luxo, em geral >1.','Elasticidade cruzada positiva sugere substitutos, negativa sugere complementares (ceteris paribus).']}
};
S.uniRevisaoTema='solow';S.uniRevisaoNotas='';S.uniRevisaoAtual=null;S.uniRevisaoAviso='';
const lay=(theme,notes='')=>{
 const t=THEMES[theme]||THEMES.solow;
 return '<article class="uni-a4" id="uni-a4" aria-label="Fórmulas de revisão de prova">'+
 '<header><small>CIÊNCIAS ECONÔMICAS · RESUMO DE PROVA</small><h2>'+E(t.t)+'</h2><p>'+E(t.disc)+' · '+new Date().toLocaleDateString('pt-BR')+'</p></header>'+
 '<section><h3>Variáveis e definições</h3><dl>'+t.vars.map(x=>'<div><dt>'+E(x[0])+'</dt><dd>'+E(x[1])+'</dd></div>').join('')+'</dl></section>'+
 '<section><h3>Equações e condições de equilíbrio</h3><ol>'+t.eq.map(x=>'<li>'+E(x)+'</li>').join('')+'</ol></section>'+
 '<section><h3>Intuição econômica</h3><p>'+E(t.int)+'</p></section>'+
 '<section><h3>Pegadinhas de prova</h3><ul>'+t.traps.map(x=>'<li>'+E(x)+'</li>').join('')+'</ul></section>'+
 (notes.trim()?'<section><h3>Minha observação</h3><p>'+E(notes.slice(0,600))+'</p></section>':'')+
 '<footer>Fórmulas sob as hipóteses do modelo. Consulte bibliografia e material da disciplina; esta ficha é material de revisão, não substitui a demonstração.</footer></article>';
};
L.revisionTemplates=THEMES;
function salvar(){
 const text=document.querySelector('[data-uni-rev-notas]')?.value||S.uniRevisaoNotas;
 S.uniRevisaoNotas=text.slice(0,600);
 const d={id:L.uni.uid(),tema:S.uniRevisaoTema,em:new Date().toISOString(),texto:S.uniRevisaoNotas};
 L.uni.data.resumos.unshift(d);L.uni.data.resumos=L.uni.data.resumos.slice(0,50);
 L.uni.save();S.uniRevisaoAtual=d.id;S.uniRevisaoAviso='Ficha salva no histórico local.';L.paint();
}
L.events.uniSalvarResumo=salvar;
L.events.uniAbrirResumo=el=>{
 const d=L.uni.data.resumos.find(x=>x.id===el.dataset.id);if(!d)return;
 S.uniRevisaoTema=d.tema in THEMES?d.tema:'solow';S.uniRevisaoNotas=d.texto||'';S.uniRevisaoAtual=d.id;L.paint();
};
L.events.uniImprimir=()=>{
 const doc=lay(S.uniRevisaoTema,document.querySelector('[data-uni-rev-notas]')?.value||S.uniRevisaoNotas);
 const win=window.open('','_blank');
 if(!win){S.uniRevisaoAviso='Permita a janela de impressão no navegador ou use Salvar no histórico.';L.paint();return;}
 const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Revisão — '+E(THEMES[S.uniRevisaoTema].t)+'</title>'+
 '<style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font:11pt/1.4 Arial,sans-serif;color:#161a22;background:white;margin:0}.uni-a4{max-width:185mm;margin:auto}header{border-bottom:2px solid #D4A017;padding-bottom:7mm}header small{letter-spacing:2px;font-size:8pt;color:#736026}header h2{margin:5px 0;font-size:20pt}header p{margin:0;color:#555}section{margin:5mm 0;break-inside:avoid}h3{color:#555;font-size:10pt;letter-spacing:.05em;text-transform:uppercase;margin:0 0 2mm;border-bottom:1px solid #ddd}p,li{margin:0 0 1.8mm}dl{margin:0}dl div{display:grid;grid-template-columns:38% 62%;padding:1.5mm 0;border-bottom:1px solid #eee}dt{font-weight:bold}dd{margin:0}ol,ul{margin:0;padding-left:6mm}footer{margin-top:6mm;padding-top:3mm;border-top:1px solid #ddd;font-size:8pt;color:#555}</style></head><body>'+doc+'<script>window.addEventListener("load",()=>{window.focus();window.print()})<\/script></body></html>';
 win.document.open();win.document.write(html);win.document.close();
};
document.addEventListener('change',e=>{
 if(typeof ESV==='undefined'||ESV!=='eco'||S.tool!=='revisao')return;
 if(e.target.matches('[data-uni-rev-tema]')){S.uniRevisaoTema=e.target.value;L.paint();}
},true);
L.views.revisao=()=>{
 const selected=THEMES[S.uniRevisaoTema]||THEMES.solow;
 return C('Formulário de revisão · 1 página A4',
 '<div class="eco-controls"><label>Tema de prova<select data-uni-rev-tema>'+Object.entries(THEMES).map(([id,t])=>'<option value="'+id+'"'+(S.uniRevisaoTema===id?' selected':'')+'>'+E(t.t)+'</option>').join('')+'</select></label>'+
 '<button type="button" data-eco-btn="uniSalvarResumo" class="eco-action">Salvar no histórico</button>'+
 '<button type="button" data-eco-btn="uniImprimir">Imprimir / Salvar PDF</button></div>'+
 '<label>Minha observação (opcional, até 600 caracteres)<textarea maxlength="600" data-uni-rev-notas rows="3" placeholder="Relembre algo da aula…">'+E(S.uniRevisaoNotas)+'</textarea></label>'+
 (S.uniRevisaoAviso?N(E(S.uniRevisaoAviso)):'')+
 N('O botão de impressão abre uma página isolada com estilo A4, sem menus do app. Escolha “Salvar como PDF” na impressão do navegador.'))+
 C('Prévia do formulário · '+E(selected.t),lay(S.uniRevisaoTema,S.uniRevisaoNotas))+
 C('Histórico local · '+L.uni.data.resumos.length,
 L.uni.data.resumos.length?'<div class="uni-saved">'+L.uni.data.resumos.map(x=>'<button data-eco-btn="uniAbrirResumo" data-id="'+E(x.id)+'" type="button"><b>'+E(THEMES[x.tema]?.t||x.tema)+'</b><small>'+E(x.em.slice(0,10))+'</small></button>').join('')+'</div>':N('Nenhuma ficha de revisão salva.'));
};
})();
