/* v873/v874 — Análises+: Rankings completos, Radar & Distorções, Página do ativo e Teses.
 * Layout inspirado em telas de stock picking, na identidade escura do Diário (CLAUDE.md).
 * Tudo calculado no aparelho a partir do snapshot público do Screener (Cloudflare/IndexedDB).
 * Sem Supabase, sem polling: séries só sob ação do usuário ou 1x por entrada (cache 12 h). */
;(function(w,d){'use strict';
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=x=>x==null||x===''?null:Number.isFinite(Number(x))?Number(x):null;
const fmt=(n,dg=2)=>n==null||!Number.isFinite(Number(n))?'—':Number(n).toLocaleString('pt-BR',{minimumFractionDigits:dg,maximumFractionDigits:dg});
const pct=(n,dg=1)=>n==null?'—':fmt(n,dg)+'%';
const sinal=(n,dg=1)=>n==null?'—':(n>0?'+':'')+fmt(n,dg)+'%';
const brl=n=>n==null?'—':'R$ '+fmt(n,2);
const cmp=n=>n==null?'—':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',notation:'compact',maximumFractionDigits:2}).format(n);
const cor=n=>n==null?'':n>=0?'ap-g':'ap-r';
const logo=tk=>w.DiarioLogos?.html?.(tk,20)||'';
const ls={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const K_EXTRA='ap874-extra',URL_EXTRA='https://diario-trader.lucianosilva43567.workers.dev/v1/analises-plus',K_COLS='ap874-colunas',K_MODE='ap881-colmode',K_ROT='ap873-rotacao',K_TESES='diario-teses-v873',K_FILT='ap873-filtros';

/* ---------- estado ---------- */
const st={tab:'rankpro',rows:null,loading:false,erro:'',ref:null,tk:'',sub:'visao',per:'1A',ibov:false,showJusto:false,colMode:ls.get(K_MODE,'essencial'),
 f:Object.assign({q:'',preset:'',setor:'',porte:'',nota:0,liq:0,sort:'nota',dir:-1,pg:30,page:0},ls.get(K_FILT,{})),
 radarPorte:'',radarSetor:'',rot:ls.get(K_ROT,null),rotLoading:false,serie:{},teseEdit:null,excluir:''};
const ESSENTIAL_COLS=['nota','preco','justo','pl','dy','roe','div_liq_ebitda','crowded'];
const COLS=[
 ['nota','Nota Raio-X',1],['setor','Setor',1],['porte','Porte',1],['crowded','Crowded',1],['preco','Preço',1],
 ['graham','Justo Graham',1],['bazin','Justo Bazin',1],['gordon','Justo Gordon',1],['justo','Justo médio',1],['proprio','Teto próprio',1],
 ['pl','P/L',1],['pvp','P/VP',1],['ev_ebitda','EV/EBITDA',1],['dy','DY',1],['payout','Payout',0],['roe','ROE',1],['roic','ROIC',1],
 ['margem_liquida','Margem líq.',1],['fcf_yield','FCF yield',0],['div_liq_ebitda','DL/EBITDA',1],['momentum','Momentum 12m',1],['g1','Cresc. lucro',1],['cagr3','CAGR lucro 3a',0],['pegC','PEG',0],
 ['mm200','Dist. MM200',0],['rsi','RSI 14',0],['lpa','LPA',0],['vpa','VPA',0],['dpa','DPA',0],['liquidez','Liquidez diária',1],
 ['cap','Valor de mercado',1],['balanco','Balanço',0]];
let vis=ls.get(K_COLS,null)||COLS.filter(c=>c[2]).map(c=>c[0]);
const colsAtivas=()=>st.colMode==='essencial'?COLS.filter(c=>ESSENTIAL_COLS.includes(c[0])):COLS.filter(c=>vis.includes(c[0]));
const PRESETS={
 deep:{n:'Deep Value Raiz',d:'P/L < 10, P/VP < 1,5 e DL/EBITDA < 2,5',f:r=>r.pl>0&&r.pl<10&&r.pvp>0&&r.pvp<1.5&&(r.div_liq_ebitda==null||r.div_liq_ebitda<2.5)},
 div:{n:'Dividendos Saudáveis',d:'DY > 6%, payout < 90%, ROE > 12% e DL/EBITDA < 3',f:r=>r.dy>6&&(r.payout==null||r.payout<90)&&r.roe>12&&(r.div_liq_ebitda==null||r.div_liq_ebitda<3)},
 quality:{n:'Quality Compounders',d:'ROE > 15%, ROIC > 12%, margem > 10% e DL/EBITDA < 2',f:r=>r.roe>15&&r.roic>12&&r.margem_liquida>10&&(r.div_liq_ebitda==null||r.div_liq_ebitda<2)},
 small:{n:'Small Caps Ocultas',d:'Small/Micro, nota ≥ 2,5, crowded < 100% e liquidez > R$ 1 mi',f:r=>(r.porte==='Small'||r.porte==='Micro')&&r.nota>=2.5&&r.crowded!=null&&r.crowded<100&&r.liquidez>1e6}};

/* ---------- dados ---------- */
const median=a=>{const v=a.filter(x=>x!=null&&Number.isFinite(x)).sort((x,y)=>x-y);return v.length?v[Math.floor((v.length-1)/2)]:null};
function rankPct(rows,key,desc){const v=rows.filter(r=>r[key]!=null).sort((a,b)=>desc?a[key]-b[key]:b[key]-a[key]),n=v.length,m=new Map();v.forEach((r,i)=>m.set(r.ticker,n>1?i/(n-1):.5));return m}
function porte(cap){return cap==null?null:cap>=2e10?'Large':cap>=5e9?'Mid':cap>=1e9?'Small':'Micro'}
function enrich(raw,X){const CR=X?.crescimento||{};
 const rows=raw.filter(r=>r&&r.ticker).map(r=>{
  const preco=N(r.preco_referencia),pl=N(r.pl),pvp=N(r.pvp),dy=N(r.dividend_yield),cap=N(r.valor_mercado_brl),liq=N(r.liquidez_diaria_brl);
  const lpa=preco&&pl>0?preco/pl:null,vpa=preco&&pvp>0?preco/pvp:null,dpa=preco&&dy>0?preco*dy/100:null;
  const graham=lpa>0&&vpa>0?Math.sqrt(22.5*lpa*vpa):null,bazin=dpa?dpa/.06:null,gordon=dpa?dpa*1.04/(.10-.04):null;
  const met=[graham,bazin,gordon].filter(x=>x!=null),justo=met.length?met.reduce((a,b)=>a+b,0)/met.length:null;
  let proprio=null;try{proprio=w.DiarioScreenersInteligencia?.valuationBR?.(r,{yieldAceitavel:.07})?.methods?.proprio??null}catch{}
  return {raw:r,ticker:String(r.ticker).toUpperCase(),empresa:r.empresa||r.company_name||'',setor:r.setor||r.sector||'Outros',segmento:r.segmento||'',
   preco,pl,pvp,dy,cap,liquidez:liq,lpa,vpa,dpa,graham,bazin,gordon,justo,proprio,ev_ebitda:N(r.ev_ebitda),payout:N(r.payout_implicito),
   roe:N(r.roe),roic:N(r.roic),margem_liquida:N(r.margem_liquida),fcf_yield:N(r.fcf_yield),div_liq_ebitda:N(r.div_liq_ebitda??r.divida_liquida_ebitda),
   momentum:N(r.momentum_12_1),mm200:N(r.dist_mm200_pct),rsi:N(r.rsi_14),peg:N(r.peg_ratio),balanco:r.data_competencia_balanco||r.fundamentais_em||'',porte:porte(cap),
   giro:cap>0&&liq!=null?liq/cap:null,...(()=>{const c=CR[String(r.ticker).toUpperCase()];if(!c)return {};
   const pegC=pl>0&&c.cagr3>0&&!c.prejuizo4&&c.atualizado?pl/c.cagr3:null;return {g1:c.g1,cagr3:c.cagr3,pegC}})()};
 });
 const mg=median(rows.map(r=>r.giro));rows.forEach(r=>r.crowded=r.giro!=null&&mg?r.giro/mg*100:null);
 const P=(k,desc)=>rankPct(rows,k,desc);
 const pl=P('pl',false),pvp=P('pvp',false),ev=P('ev_ebitda',false),roe=P('roe',true),roic=P('roic',true),ml=P('margem_liquida',true),fcf=P('fcf_yield',true),
  dl=P('div_liq_ebitda',false),dy=P('dy',true),mo=P('momentum',true),m2=P('mm200',true);
 const av=(...ms)=>t=>{const v=ms.map(m=>m.get(t)).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length*4:null};
 const eixos={Valuation:av(pl,pvp,ev),Rentabilidade:av(roe,roic),Margens:av(ml,fcf),Endividamento:av(dl),Dividendos:av(dy),Momentum:av(mo,m2)};
 rows.forEach(r=>{if(!(r.pl>0))pl.delete(r.ticker);r.eixos={};for(const[k,f]of Object.entries(eixos))r.eixos[k]=f(r.ticker);
  const v=Object.values(r.eixos).filter(x=>x!=null);r.nota=v.length>=4?v.reduce((a,b)=>a+b,0)/v.length:null});
 const porSetor={};rows.forEach(r=>(porSetor[r.setor]=porSetor[r.setor]||[]).push(r));
 const medPL={};for(const[s,l]of Object.entries(porSetor))medPL[s]=median(l.map(r=>r.pl>0?r.pl:null));
 return {rows,porSetor,medPL,map:new Map(rows.map(r=>[r.ticker,r]))};
}
async function extra(){const c=ls.get(K_EXTRA,null);if(c&&Date.now()-c.at<12*3600000)return c.d;
 try{const r=await fetch(URL_EXTRA);if(!r.ok)throw 0;const j=await r.json();ls.set(K_EXTRA,{at:Date.now(),d:j});return j}catch{return c?.d||null}}
/* v875: cotações ao vivo da ponte do Profit (mesmo CQ.pf do app: {px,d1,em}); só leitura, sem rede extra. */
function pf(){try{return typeof CQ!=='undefined'&&CQ?.pf?CQ.pf:{}}catch{return {}}}
function aplicaProfit(){if(!st.rows)return 0;const P=pf();let n=0;for(const r of st.rows.rows){const q=P[r.ticker];if(q&&q.px>0){r.preco=q.px;r.d1=q.d1;r.profit=1;n++}else r.profit=0}
 st.nProfit=n;if(st.X){const ra=rotacaoArquivo(st.rows,st.X);if(ra)st.rot=ra}return n}
function rotacaoArquivo(D,X){const R=X?.retornos;if(!R||!Object.keys(R).length)return null;const s={};let data='';
 for(const[setor,l]of Object.entries(D.porSetor)){const v=l.filter(r=>r.cap&&R[r.ticker]);if(!v.length)continue;const o={n:l.length};
  const val=(r,k)=>k==='1D'&&r.profit&&r.d1!=null?r.d1:R[r.ticker]?.[k];for(const[k]of PER){const q=v.filter(r=>val(r,k)!=null),tw=q.reduce((a,r)=>a+r.cap,0);o[k]=tw?q.reduce((a,r)=>a+r.cap*val(r,k),0)/tw:null}
  v.forEach(r=>{if(R[r.ticker].data>data)data=R[r.ticker].data});s[setor]=o}
 return {at:Date.parse(X.gerado_em)||Date.now(),s,arquivo:1,data}}
async function carregar(force){
 if(st.rows&&!force)return;if(st.loading)return;st.loading=true;st.erro='';render();
 try{const fn=w.DiarioScreeners?.universo;if(!fn)throw Error('Screener ainda carregando');
  const res=await fn('br');if(!res?.rows?.length)throw Error('Snapshot do Screener indisponível');
  st.ref=res.reference;const X=await extra();st.X=X;st.rows=enrich(res.rows,X);const ra=rotacaoArquivo(st.rows,X);if(ra)st.rot=ra;
 }catch(e){st.erro=e.message||String(e)}st.loading=false;render();
}

/* v879: Entenda os dados — "?" em cada métrica abre um cartão explicando o que é, como calcula e como ler. */
const GLOS={
 nota:['Nota Raio-X','Uma nota de 0 a 4 que resume a empresa em 6 áreas: Valuation (se está barata), Rentabilidade, Margens, Endividamento, Dividendos e Momentum.','Em cada área, a empresa é comparada com todas as ações da bolsa e recebe uma posição (percentil). 4 = entre as melhores do mercado naquela área; 0 = entre as piores. A nota final é a média das áreas.','Acima de 3: muito boa no conjunto. Entre 2 e 3: mediana. Abaixo de 2: fraca. É um filtro para começar o estudo, não uma ordem de compra.'],
 setor:['Setor','O ramo de atuação da empresa (bancos, energia, varejo…).','Vem do cadastro do Screener.','Compare sempre a empresa com outras do mesmo setor: um P/L de 6 é barato no varejo, mas normal em bancos.'],
 porte:['Porte','Tamanho da empresa pelo valor de mercado.','Large: acima de R$ 20 bi · Mid: R$ 5 a 20 bi · Small: R$ 1 a 5 bi · Micro: abaixo de R$ 1 bi.','Empresas menores costumam oscilar mais e ter menos liquidez (mais difícil comprar/vender sem mexer no preço).'],
 crowded:['Crowded (negociação)','Mostra se a ação é muito ou pouco negociada para o tamanho dela.','Volume financeiro diário ÷ valor de mercado, comparado com a mediana da bolsa. 100% = normal.','Acima de 150%: ação "lotada", muita gente operando (mais volátil). Abaixo de 80%: fora do radar do mercado — pode haver oportunidade ou falta de interesse.'],
 preco:['Preço','Última cotação da ação.','Do snapshot do Screener ou, com a ponte ligada, ao vivo pelo Profit (aparece a variação do dia ao lado).','É a base de comparação com o preço justo.'],
 graham:['Preço justo de Graham','Quanto a ação valeria pelo método de Benjamin Graham, que junta lucro e patrimônio.','√(22,5 × LPA × VPA). LPA = lucro por ação; VPA = patrimônio por ação.','O % ao lado é a distância do preço atual: +30% = a ação está 30% abaixo do valor de Graham (desconto). Funciona mal em empresas de tecnologia e com prejuízo.'],
 bazin:['Preço justo de Bazin','Preço máximo para receber pelo menos 6% ao ano em dividendos (método de Décio Bazin).','Dividendos pagos por ação em 12 meses ÷ 6%.','Se o preço atual está abaixo, você compra com yield acima de 6%. Só faz sentido para empresas que pagam dividendos de forma estável.'],
 gordon:['Preço justo de Gordon','Valor da ação pelo fluxo de dividendos futuros que crescem com o tempo.','DPA × (1 + g) ÷ (k − g), com retorno exigido k = 10% e crescimento g = 4% ao ano.','Bom para pagadoras estáveis (energia, saneamento, bancos). Pequenas mudanças em k e g mudam muito o resultado — ajuste na página do ativo.'],
 justo:['Preço justo médio','Média dos três métodos: Graham, Bazin e Gordon.','(Graham + Bazin + Gordon) ÷ 3, usando os que existirem.','Visão rápida de desconto ou ágio. Positivo (verde) = preço atual abaixo do justo. Sempre confira se os lucros e dividendos são recorrentes.'],
 proprio:['Teto próprio (Novo Bazin)','O seu método: preço teto pelo lucro projetado.','(lucro projetado × payout ÷ nº de ações) ÷ yield desejado (7%).','Abaixo do teto = margem de segurança. Edite lucro, payout e yield na aba Dividendos da página do ativo.'],
 pl:['P/L (Preço/Lucro)','Quantos anos de lucro atual você paga pela empresa.','Preço da ação ÷ lucro por ação dos últimos 12 meses.','Menor = mais barato. P/L 5 = paga 5 anos de lucro. Negativo = empresa com prejuízo. Compare com o setor.'],
 pvp:['P/VP (Preço/Valor Patrimonial)','Quanto você paga por cada R$ 1 de patrimônio da empresa.','Preço ÷ patrimônio líquido por ação.','Abaixo de 1 = paga menos que o patrimônio (pode ser barganha ou empresa com problema). Bancos costumam ficar entre 1 e 2.'],
 ev_ebitda:['EV/EBITDA','Quantos anos de geração de caixa operacional pagam a empresa inteira (incluindo a dívida).','(Valor de mercado + dívida líquida) ÷ EBITDA.','Menor = mais barato. Abaixo de 6 costuma ser barato; acima de 12, caro. Não se aplica a bancos.'],
 dy:['DY (Dividend Yield)','Quanto a empresa pagou de dividendos em 12 meses, em % do preço.','Dividendos por ação 12m ÷ preço × 100.','Acima de 6% é alto. Cuidado com yields muito altos (acima de 15%): podem vir de um pagamento extraordinário que não se repete.'],
 payout:['Payout','Quanto do lucro virou dividendo.','Dividendos ÷ lucro × 100.','Entre 25% e 80% é saudável. Acima de 100% = pagou mais do que lucrou (não se sustenta).'],
 roe:['ROE (Retorno sobre o Patrimônio)','Quanto a empresa lucra com o dinheiro dos sócios.','Lucro líquido ÷ patrimônio líquido × 100.','Acima de 15% é bom; acima de 20%, excelente. Muito alto com muita dívida pode ser enganoso.'],
 roic:['ROIC (Retorno sobre o Capital Investido)','Quanto a empresa lucra com todo o capital aplicado no negócio (sócios + dívida).','Lucro operacional após impostos ÷ capital investido × 100.','Acima de 10% indica negócio que cria valor. É um dos melhores sinais de qualidade.'],
 margem_liquida:['Margem líquida','Quanto sobra de lucro a cada R$ 100 vendidos.','Lucro líquido ÷ receita × 100.','Quanto maior, melhor. Varia muito por setor: varejo tem margem baixa, software tem alta.'],
 fcf_yield:['FCF yield (rendimento do fluxo de caixa livre)','Caixa que sobra de verdade depois dos investimentos, em % do valor de mercado.','Fluxo de caixa livre ÷ valor de mercado × 100.','Acima de 8% é muito bom. Negativo = a empresa está queimando caixa.'],
 div_liq_ebitda:['DL/EBITDA (Dívida líquida/EBITDA)','Quantos anos de geração de caixa seriam precisos para pagar a dívida.','(Dívida − caixa) ÷ EBITDA.','Abaixo de 2 é confortável. Acima de 3,5 é risco elevado. Negativo = a empresa tem mais caixa que dívida (ótimo).'],
 momentum:['Momentum 12 meses','Quanto a ação subiu ou caiu no último ano (sem o último mês).','Variação do preço de 12 meses atrás até 1 mês atrás.','Positivo = tendência de alta. Ações com momentum forte tendem a continuar subindo por um tempo.'],
 g1:['Crescimento do lucro','Quanto o lucro anual cresceu do penúltimo para o último ano.','Lucro do último balanço anual (CVM) ÷ lucro do ano anterior − 1.','Acima de 10% = lucro crescendo bem. Lucro crescendo com P/L baixo costuma levar à reprecificação (alta) da ação.'],
 cagr3:['CAGR do lucro em 3 anos','Crescimento médio anual do lucro nos últimos 3 anos.','(Lucro último ano ÷ lucro de 3 anos antes)^(1/3) − 1.','Mostra se o crescimento é consistente, não só de um ano. Acima de 10% ao ano é forte.'],
 pegC:['PEG','Compara o preço (P/L) com a velocidade de crescimento do lucro.','P/L ÷ CAGR do lucro em 3 anos (%). Fica de fora quem teve prejuízo em algum dos 4 anos.','Abaixo de 1 = barato para o ritmo em que cresce. Acima de 2 = caro. Crescimento passado não garante o futuro.'],
 mm200:['Distância da média de 200 dias','Quanto o preço está acima ou abaixo da média dos últimos 200 pregões.','(Preço ÷ média de 200 dias − 1) × 100.','Acima de 0 = tendência de longo prazo de alta. Muito acima (+30%) = esticado. Abaixo = tendência de baixa.'],
 rsi:['RSI 14 (Índice de Força Relativa)','Mede se a ação subiu ou caiu demais em pouco tempo.','Média de altas vs quedas nos últimos 14 pregões, de 0 a 100.','Acima de 70 = sobrecomprada (pode corrigir). Abaixo de 30 = sobrevendida (pode repicar).'],
 lpa:['LPA (Lucro por Ação)','Quanto de lucro cabe a cada ação.','Lucro 12 meses ÷ nº de ações (estimado = preço ÷ P/L).','Usado no Graham e no P/L. Crescendo ano a ano é bom sinal.'],
 vpa:['VPA (Valor Patrimonial por Ação)','Quanto de patrimônio cabe a cada ação.','Patrimônio ÷ nº de ações (estimado = preço ÷ P/VP).','Usado no Graham e no P/VP.'],
 dpa:['DPA (Dividendo por Ação)','Quanto cada ação recebeu de dividendos em 12 meses.','Preço × DY.','Usado no Bazin e no Gordon.'],
 liquidez:['Liquidez diária','Quanto dinheiro é negociado por dia na ação.','Volume financeiro médio diário.','Abaixo de R$ 1 milhão/dia: difícil entrar e sair sem mexer no preço. Para swing, prefira acima de R$ 5 mi.'],
 cap:['Valor de mercado','Quanto a bolsa diz que a empresa inteira vale.','Preço × total de ações.','Define o porte (Large, Mid, Small, Micro).'],
 balanco:['Balanço','Data do último balanço usado nos números.','Do snapshot do Screener (CVM).','Se estiver antigo, os indicadores podem não refletir a situação atual.'],
 rot:['Rotação setorial','Mostra para onde o dinheiro está indo: quais setores sobem e quais caem.','Retorno de cada setor ponderado pelo valor de mercado das ações, em 1 dia, 7 dias, 1 mês, 6 meses, 12 meses e no ano. Verde = alta, vermelho = queda; cor mais forte = movimento maior.','Setores verdes em vários prazos estão em tendência de alta. Toque num setor para ver só as ações dele no Radar.'],
 op:['Oportunidades claras','Ações que aparecem em mais de um radar ao mesmo tempo.','Estão em Distorções de valuation e também em Reprecificação, PEG ou Small caps ignoradas, sem risco elevado.','Vários sinais juntos reduzem o alarme falso. É a melhor lista para começar a estudar.'],
 rep:['Reprecificação','Empresas com lucro crescendo e preço ainda baixo.','Crescimento do lucro > 10%, ROIC > 10% e P/L < 20.','O mercado pode ainda não ter percebido a melhora: possível alta de preço à frente.'],
 dist:['Distorções de valuation','Ações muito mais baratas que as do próprio setor.','P/L abaixo da metade da mediana do setor.','Pode ser barganha ou problema sério (lucro que vai cair). Investigue o motivo antes de comprar.'],
 peg:['PEG < 1','Ações baratas para o ritmo em que o lucro cresce.','P/L ÷ crescimento médio do lucro em 3 anos menor que 1.','Combina preço baixo com crescimento. Crescimento passado não garante o futuro.'],
 ign:['Small caps ignoradas','Empresas pequenas e pouco negociadas, mas com boa nota.','Small/Micro, Crowded < 80% e Nota Raio-X ≥ 2.','Pouca gente acompanha, então preços podem estar errados. Atenção à liquidez.'],
 ris:['Riscos elevados','Empresas com dívida alta ou piorando.','DL/EBITDA > 3,5x, ou queda de mais de 10% no ano com DL/EBITDA > 2x.','Lista de alerta: evite ou exija desconto muito maior. Ficam fora dos Top 20.'],
 eixos:['Eixos do Raio-X','As 6 áreas que formam a nota.','Valuation: P/L, P/VP, EV/EBITDA · Rentabilidade: ROE, ROIC · Margens: margem líquida, FCF yield · Endividamento: DL/EBITDA · Dividendos: DY · Momentum: momentum 12m e distância da MM200. Cada eixo vai de 0 a 4 (percentil no mercado).','Quanto mais o hexágono preenche o desenho, mais equilibrada é a empresa. Um eixo "murcho" mostra o ponto fraco.'],
 pos:['Posição no setor','Em que percentil a empresa está entre os pares do setor.','Percentual de pares que ela supera naquela métrica.','100º pct = melhor do setor; 50º = no meio; 0º = pior.']};
const q=k=>GLOS[k]?'<button type="button" class="ap-q" data-ap-q="'+k+'" aria-label="O que é '+E(GLOS[k][0])+'">?</button>':'';
function cartaoQ(k){const g=GLOS[k];if(!g)return '';return '<div class="ap-qbox" role="dialog" aria-label="'+E(g[0])+'"><div class="ap-qcard"><header><h4>'+E(g[0])+'</h4><button type="button" class="ap-link" data-ap-qx>Fechar ✕</button></header>'+
 '<p><b>O que é</b>'+E(g[1])+'</p><p><b>Como é calculado</b>'+E(g[2])+'</p><p><b>Como ler</b>'+E(g[3])+'</p><button type="button" class="ap-link" data-ap-guia>Ver todos os termos</button></div></div>'}
function viewGuia(){const grupos=[['Comece por aqui',['nota','justo','pl','dy','roe','div_liq_ebitda']],['Preço justo',['graham','bazin','gordon','proprio']],['Valuation (preço)',['pvp','ev_ebitda','pegC','lpa','vpa','dpa']],
 ['Qualidade e crescimento',['roic','margem_liquida','fcf_yield','payout','g1','cagr3']],['Técnico e mercado',['momentum','mm200','rsi','crowded','liquidez','cap','porte']],['Radar',['rot','op','rep','dist','peg','ign','ris']],['Página do ativo',['eixos','pos','balanco']]];
 return '<div class="ap-guia"><section class="ap-card"><h3>Entenda os dados</h3><p class="ap-mut">Como ler cada número das Análises, em linguagem simples. Em qualquer tela, toque no <span class="ap-q">?</span> ao lado de um termo para ver a explicação.</p>'+
 '<ol class="ap-passos"><li><b>Filtre:</b> em Rankings, escolha uma tela pronta (ex.: Dividendos Saudáveis).</li><li><b>Priorize:</b> ordene pela Nota Raio-X ou pelo Preço justo médio.</li><li><b>Investigue:</b> toque no ativo e veja Raio-X, preço justo e gráfico.</li><li><b>Registre:</b> crie uma Tese com alvo e critérios e acompanhe.</li></ol></section>'+
 grupos.map(([t,ks])=>'<section class="ap-card"><h3>'+t+'</h3><div class="ap-glos">'+ks.map(k=>{const g=GLOS[k];return '<details><summary>'+E(g[0])+'</summary><p><b>O que é</b>'+E(g[1])+'</p><p><b>Como é calculado</b>'+E(g[2])+'</p><p><b>Como ler</b>'+E(g[3])+'</p></details>'}).join('')+'</div></section>').join('')+'</div>'}

/* ---------- rankings ---------- */
function filtrados(){
 const f=st.f,q=f.q.trim().toUpperCase(),pr=PRESETS[f.preset];
 let l=st.rows.rows.filter(r=>(!q||r.ticker.includes(q)||r.empresa.toUpperCase().includes(q))&&(!f.setor||r.setor===f.setor)&&(!f.porte||r.porte===f.porte)&&
  (!f.nota||(r.nota??-1)>=f.nota)&&(!f.liq||(r.liquidez??0)>=f.liq)&&(!pr||pr.f(r)));
 const k=f.sort,dir=f.dir;
 l.sort((a,b)=>{let x=k==='ticker'||k==='setor'||k==='porte'?a[k]:valor(a,k),y=k==='ticker'||k==='setor'||k==='porte'?b[k]:valor(b,k);
  if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return(typeof x==='string'?x.localeCompare(y):x-y)*dir});
 return l;
}
function valor(r,k){if(['graham','bazin','gordon','justo','proprio'].includes(k))return r[k]&&r.preco?r[k]/r.preco-1:null;return k==='balanco'?(r.balanco?Date.parse(r.balanco):null):r[k]}
function justoCel(v,p){if(v==null)return '<td class="ap-n">—</td>';const u=p?(v/p-1)*100:null;return '<td class="ap-n"><span class="ap-est">~'+fmt(v)+'</span><small class="'+cor(u)+'">'+sinal(u,0)+'</small></td>'}
function notaCel(n){if(n==null)return '<td>—</td>';const p=Math.round(n/4*100);return '<td><span class="ap-nota" style="--p:'+p+'">'+fmt(n,2)+'</span></td>'}
function cel(r,k){
 switch(k){case 'nota':return notaCel(r.nota).replace('<td>','<td class="ap-c">');case 'setor':return '<td class="ap-up">'+E(r.setor)+'</td>';case 'porte':return '<td>'+E(r.porte||'—')+'</td>';
  case 'crowded':return '<td class="ap-n"><span class="ap-pill'+(r.crowded>150?' hot':'')+'">'+(r.crowded==null?'—':fmt(r.crowded,0)+'%')+'</span></td>';
  case 'preco':return '<td class="ap-n">'+brl(r.preco)+(r.profit&&r.d1!=null?'<small class="'+cor(r.d1)+'"> '+sinal(r.d1,2)+'</small>':'')+'</td>';case 'graham':case 'bazin':case 'gordon':case 'justo':case 'proprio':return justoCel(r[k],r.preco);
  case 'pl':case 'pvp':case 'ev_ebitda':case 'div_liq_ebitda':return '<td class="ap-n">'+(r[k]==null?'—':fmt(r[k],1)+'x')+'</td>';
  case 'g1':case 'cagr3':return '<td class="ap-n '+cor(r[k])+'">'+sinal(r[k])+'</td>';case 'pegC':return '<td class="ap-n">'+fmt(r.pegC,2)+'</td>';case 'dy':case 'payout':case 'roe':case 'roic':case 'margem_liquida':case 'fcf_yield':return '<td class="ap-n">'+pct(r[k])+'</td>';
  case 'momentum':case 'mm200':return '<td class="ap-n '+cor(r[k])+'">'+sinal(r[k])+'</td>';case 'rsi':return '<td class="ap-n">'+fmt(r.rsi,0)+'</td>';
  case 'lpa':case 'vpa':case 'dpa':return '<td class="ap-n">'+fmt(r[k])+'</td>';case 'liquidez':return '<td class="ap-n">'+cmp(r.liquidez)+'</td>';
  case 'cap':return '<td class="ap-n">'+cmp(r.cap)+'</td>';case 'balanco':return '<td>'+E(String(r.balanco).slice(0,10)||'—')+'</td>'}return '<td>—</td>'}
function cardMob(r){
 const u=r.justo&&r.preco?(r.justo/r.preco-1)*100:null,p=r.nota!=null?Math.round(r.nota/4*100):0;
 return '<article class="ap-mcard" data-ap-ativo="'+r.ticker+'">'+
  '<div class="ap-mc-top"><span class="ap-nota" style="--p:'+p+'">'+(r.nota==null?'—':fmt(r.nota,1))+'</span>'+
  '<div class="ap-mc-id"><b>'+logo(r.ticker)+r.ticker+'</b><small>'+E(r.empresa||r.setor)+'</small></div>'+
  '<div class="ap-mc-px"><b>'+brl(r.preco)+'</b>'+(r.profit&&r.d1!=null?'<small class="'+cor(r.d1)+'">'+sinal(r.d1,2)+'</small>':u!=null?'<small class="'+cor(u)+'">Justo '+sinal(u,0)+'</small>':'')+'</div></div>'+
  '<div class="ap-mc-met"><span>P/L <b>'+(r.pl==null?'—':fmt(r.pl,1)+'x')+'</b></span><span>DY <b>'+pct(r.dy)+'</b></span><span>ROE <b>'+pct(r.roe)+'</b></span><span>DL/EB <b>'+(r.div_liq_ebitda==null?'—':fmt(r.div_liq_ebitda,1)+'x')+'</b></span></div></article>';
}
function viewRank(){
 const f=st.f,l=filtrados(),tot=l.length,pg=f.pg,pages=Math.max(1,Math.ceil(tot/pg));if(f.page>=pages)f.page=0;
 const pag=l.slice(f.page*pg,f.page*pg+pg),setores=Object.keys(st.rows.porSetor).sort(),cols=colsAtivas();
 const nFilt=[f.preset,f.setor,f.porte,f.nota>0,f.liq>0,f.q.trim()].filter(Boolean).length;
 const desk=(w.innerWidth||1024)>=900;
 const TXT=['setor','porte','balanco'],th=(k,t)=>'<th data-ap-sort="'+k+'" class="'+(f.sort===k?'on ':'')+(TXT.includes(k)?'':k==='nota'?'ap-c':'ap-n')+'">'+t+(f.sort===k?(f.dir<0?' ▾':' ▴'):'')+q(k)+'</th>';
 const mobPresets='<div class="ap-mpresets" aria-label="Presets rápidos">'+Object.entries(PRESETS).map(([k,p])=>'<button type="button" class="ap-chip'+(f.preset===k?' on':'')+'" data-ap-preset="'+k+'">'+p.n+'</button>').join('')+'</div>';
 return '<div class="ap-rank"><aside class="ap-filtros"><details'+(desk?' open':'')+'><summary><span class="ap-fsum-l">Filtros'+(nFilt?' <span class="ap-fbadge">'+nFilt+'</span>':'')+'</span>'+(nFilt?'<button type="button" class="ap-link" data-ap-limpar>Limpar</button>':'')+'</summary>'+
  '<p class="ap-lbl">Screeners por gestor</p>'+Object.entries(PRESETS).map(([k,p])=>'<button type="button" class="ap-preset'+(f.preset===k?' on':'')+'" data-ap-preset="'+k+'"><b>'+p.n+'</b><small>'+p.d+'</small></button>').join('')+
  '<label class="ap-lbl">Setor<select data-ap-f="setor"><option value="">Todos</option>'+setores.map(s=>'<option'+(f.setor===s?' selected':'')+'>'+E(s)+'</option>').join('')+'</select></label>'+
  '<label class="ap-lbl">Porte<select data-ap-f="porte"><option value="">Todos</option>'+['Large','Mid','Small','Micro'].map(s=>'<option'+(f.porte===s?' selected':'')+'>'+s+'</option>').join('')+'</select></label>'+
  '<label class="ap-lbl">Nota Raio-X mínima <b>'+fmt(f.nota,1)+'</b><input type="range" min="0" max="4" step=".25" value="'+f.nota+'" data-ap-f="nota"></label>'+
  '<label class="ap-lbl">Liquidez diária mínima<select data-ap-f="liq">'+[[0,'Qualquer'],[1e5,'R$ 100 mil'],[1e6,'R$ 1 mi'],[5e6,'R$ 5 mi'],[2e7,'R$ 20 mi']].map(([v,t])=>'<option value="'+v+'"'+(Number(f.liq)===v?' selected':'')+'>'+t+'</option>').join('')+'</select></label>'+
  '</details></aside><section class="ap-tabela"><div class="ap-bar"><input type="search" placeholder="Buscar ticker ou empresa…" value="'+E(f.q)+'" data-ap-f="q" class="ap-busca">'+
  '<div class="ap-seg" role="group" aria-label="Modo de colunas"><button type="button" class="'+(st.colMode==='essencial'?'on':'')+'" data-ap-colmode="essencial">Essencial</button><button type="button" class="'+(st.colMode!=='essencial'?'on':'')+'" data-ap-colmode="completo">Completo</button></div>'+
  '<details class="ap-cols"><summary class="btn s">Colunas</summary><div>'+COLS.map(c=>'<label><input type="checkbox" data-ap-col="'+c[0]+'"'+(vis.includes(c[0])?' checked':'')+'> '+c[1]+'</label>').join('')+'</div></details>'+
  '<select data-ap-f="pg">'+[30,50,100].map(n=>'<option value="'+n+'"'+(pg===n?' selected':'')+'>'+n+'/pág</option>').join('')+'</select>'+
  (st.nProfit?'<span class="ap-tag st-ativa">Profit ao vivo · '+st.nProfit+'</span>':'')+'<button type="button" class="btn s ap-desk-only" data-ap-csv>CSV</button><span class="ap-mut ap-pag-info">'+(tot?f.page*pg+1:0)+'–'+Math.min(tot,f.page*pg+pg)+' de '+tot+'</span>'+
  '<button type="button" class="btn s" data-ap-page="-1"'+(f.page?'':' disabled')+'>‹</button><button type="button" class="btn s" data-ap-page="1"'+(f.page<pages-1?'':' disabled')+'>›</button></div>'+
  mobPresets+
  '<p class="ap-mut ap-leg">~ = estimado no aparelho (Graham · Bazin · Gordon) · Nota Raio-X 0–4 por percentis do mercado · Crowded = giro ÷ mediana</p>'+
  '<div class="ap-mcards">'+(pag.length?pag.map(cardMob).join(''):'<p class="ap-card ap-vazio ap-mut">Nenhum ativo passa nesses filtros.</p>')+'</div>'+
  '<div class="ap-scroll'+(st.colMode!=='essencial'?' ap-scroll-fade':'')+'"><table class="ap-t"><thead><tr><th class="ap-stk" data-ap-sort="ticker">Ativo</th>'+cols.map(c=>th(c[0],c[1])).join('')+'</tr></thead><tbody>'+
  (pag.length?pag.map(r=>'<tr data-ap-ativo="'+r.ticker+'"><td class="ap-stk">'+logo(r.ticker)+'<b>'+r.ticker+'</b><small>'+E(r.empresa)+'</small></td>'+cols.map(c=>cel(r,c[0])).join('')+'</tr>').join(''):
   '<tr><td colspan="'+(cols.length+1)+'" class="ap-vazio">Nenhum ativo passa nesses filtros.</td></tr>')+'</tbody></table></div></section></div>';
}
function csv(){const cols=colsAtivas(),l=filtrados(),q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const lin=[['Ticker','Empresa',...cols.map(c=>c[1])].map(q).join(';')].concat(l.map(r=>[r.ticker,r.empresa,...cols.map(c=>{const v=['setor','porte','balanco'].includes(c[0])?r[c[0]]:r[c[0]];return typeof v==='number'?String(Math.round(v*100)/100).replace('.',','):v})].map(q).join(';')));
 const a=d.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+lin.join('\n')],{type:'text/csv;charset=utf-8'}));a.download='rankings-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}

/* ---------- radar ---------- */
function listasRadar(){
 const D=st.rows,pf=st.radarPorte,sf=st.radarSetor,base=D.rows.filter(r=>(!pf||r.porte===pf)&&(!sf||r.setor===sf)&&r.preco);
 const risco=r=>(r.div_liq_ebitda!=null&&r.div_liq_ebitda>3.5)||(r.momentum!=null&&r.momentum<-10&&r.div_liq_ebitda!=null&&r.div_liq_ebitda>2);
 const dist=base.filter(r=>r.pl>0&&D.medPL[r.setor]&&r.pl<D.medPL[r.setor]*.5),rep=base.filter(r=>r.g1>10&&r.roic>10&&r.pl>0&&r.pl<20),
  peg=base.filter(r=>r.pegC>0&&r.pegC<1),ign=base.filter(r=>(r.porte==='Small'||r.porte==='Micro')&&r.crowded!=null&&r.crowded<80&&(r.nota??0)>=2),
  ris=base.filter(risco),sD=new Set(dist.map(r=>r.ticker)),outros=new Set([...rep,...peg,...ign].map(r=>r.ticker)),
  op=base.filter(r=>sD.has(r.ticker)&&outros.has(r.ticker)&&!risco(r)),ok=base.filter(r=>!risco(r));
 const top=(l,k,asc)=>l.filter(r=>r[k]!=null&&(k!=='pl'||r.pl>0)&&(k!=='dy'||r.dy>0)).sort((a,b)=>asc?a[k]-b[k]:b[k]-a[k]).slice(0,20);
 return {op,rep,dist,peg,ign,ris,tops:[['Top Value (P/L)','Menor P/L',top(ok,'pl',1),r=>fmt(r.pl,1)+'x'],['Top Quality (ROE)','Maior ROE',top(ok,'roe'),r=>pct(r.roe)],
  ['Top Yield','Maior dividend yield',top(ok,'dy'),r=>pct(r.dy)],['Top Crowded','Mais negociadas vs porte',top(ok,'crowded'),r=>fmt(r.crowded,0)+'%']]};
}
function cardsLista(t,desc,l,met,tone,k){
 if(!l.length)return '<section class="ap-lista ap-lista-empty'+(tone?' '+tone:'')+'"><h3>'+t+q(k)+' <span>(0)</span></h3><p class="ap-mut">Nenhum ativo detectado no filtro atual.</p></section>';
 return '<section class="ap-lista'+(tone?' '+tone:'')+'"><header><h3>'+t+q(k)+' <span>('+l.length+')</span></h3><p>'+desc+'</p></header><div class="ap-chips">'+
  l.slice(0,80).map(r=>'<button type="button" data-ap-ativo="'+r.ticker+'"><b>'+r.ticker+'</b><small>'+E(r.setor)+'</small><em>'+met(r)+'</em></button>').join('')+'</div></section>';
}
const PER=[['1D',1],['7D',5],['1M',21],['6M',126],['12M',252],['YTD',0]];
function retornos(cl){if(!cl?.length)return null;const u=cl[cl.length-1].c,ano=String(new Date().getFullYear()),o={};
 for(const[k,n]of PER){let b;if(k==='YTD'){const i=cl.findIndex(x=>x.d.startsWith(ano));b=i>0?cl[i-1].c:i===0?cl[0].c:null}else b=cl.length>n?cl[cl.length-1-n].c:null;o[k]=b?(u/b-1)*100:null}return o}
async function rotacao(){
 if(st.rotLoading||!st.rows||!w.DiarioTecnico?.serie)return;st.rotLoading=true;render();
 const set=[];for(const[s,l]of Object.entries(st.rows.porSetor)){l.filter(r=>r.cap&&r.liquidez>2e6).sort((a,b)=>b.cap-a.cap).slice(0,6).forEach(r=>set.push([s,r]))}
 const res={};let i=0;const worker=async()=>{while(i<set.length){const[s,r]=set[i++];try{const sr=await w.DiarioTecnico.serie(r.ticker,'br'),ret=retornos(sr?.closes);if(ret)(res[s]=res[s]||[]).push([r.cap,ret])}catch{}}};
 await Promise.all([1,2,3,4].map(worker));
 const out={};for(const[s,l]of Object.entries(res)){const o={n:st.rows.porSetor[s].length};for(const[k]of PER){const v=l.filter(x=>x[1][k]!=null),tw=v.reduce((a,x)=>a+x[0],0);o[k]=tw?v.reduce((a,x)=>a+x[0]*x[1][k],0)/tw:null}out[s]=o}
 st.rot={at:Date.now(),s:out};ls.set(K_ROT,st.rot);st.rotLoading=false;render();
}
function heat(v,max){if(v==null)return '';const a=Math.min(1,Math.abs(v)/(max||1))*.50+.07;return 'background:rgba('+(v>=0?'16,185,129':'239,68,68')+','+a.toFixed(2)+')'}
function viewRadar(){
 const R=listasRadar(),rot=st.rot?.s,mx={};
 if(rot)for(const[k]of PER)mx[k]=Math.max(...Object.values(rot).map(o=>Math.abs(o[k]??0)),.1);
 const lin=rot?Object.entries(rot).sort((a,b)=>(b[1]['1M']??-999)-(a[1]['1M']??-999)):[],forte=lin.slice(0,3),fraco=lin.slice(-3).reverse();
 return '<div class="ap-radar"><section class="ap-card ap-rot"><header><div><h3>Rotação setorial'+q('rot')+'</h3><p>Retorno por setor ponderado por valor de mercado'+(st.rot?.arquivo?' (fechamento de '+E(st.rot.data)+')':' (até 6 maiores líquidas de cada setor)')+'. Clique num setor para filtrar o Radar.</p></div>'+
  (st.rot?.arquivo?'':'<button type="button" class="btn s" data-ap-rot'+(st.rotLoading?' disabled':'')+'>'+(st.rotLoading?'Calculando…':rot?'Atualizar':'Calcular rotação')+'</button>')+'</header>'+
  (rot?'<div class="ap-rotgrid"><div class="ap-scroll"><table class="ap-t ap-heat"><thead><tr><th>Setor</th><th class="ap-n">Ações</th>'+PER.map(p=>'<th class="ap-n">'+p[0]+'</th>').join('')+'</tr></thead><tbody>'+
   lin.map(([s,o])=>'<tr data-ap-setor="'+E(s)+'" class="'+(st.radarSetor===s?'on':'')+'"><td>'+E(s)+'</td><td class="ap-n">'+o.n+'</td>'+PER.map(p=>'<td class="ap-n" style="'+heat(o[p[0]],mx[p[0]])+'">'+sinal(o[p[0]])+'</td>').join('')+'</tr>').join('')+
   '</tbody></table></div><aside class="ap-dest"><p class="ap-lbl">Mais fortes · mês</p>'+forte.map(([s,o])=>'<div><span>'+E(s)+'</span><b class="'+cor(o['1M'])+'">'+sinal(o['1M'])+'</b></div>').join('')+
   '<p class="ap-lbl">Mais fracos · mês</p>'+fraco.map(([s,o])=>'<div><span>'+E(s)+'</span><b class="'+cor(o['1M'])+'">'+sinal(o['1M'])+'</b></div>').join('')+
   '<p class="ap-mut">Atualizado em '+new Date(st.rot.at).toLocaleString('pt-BR')+(st.nProfit?' · 1D ao vivo ('+st.nProfit+' ativos)':'')+'</p>'+'</aside></div>':'<p class="ap-mut">'+(st.rotLoading?'Buscando séries diárias…':'Toque em "Calcular rotação" (usa o cache de cotações do Técnico).')+'</p>')+'</section>'+
  '<div class="ap-bar"><b>Radar &amp; Distorções</b>'+['','Large','Mid','Small','Micro'].map(p=>'<button type="button" class="ap-chip'+(st.radarPorte===p?' on':'')+'" data-ap-rporte="'+p+'">'+(p||'Todas')+'</button>').join('')+
  (st.radarSetor?'<button type="button" class="ap-chip on" data-ap-setor="">'+E(st.radarSetor)+' ✕</button>':'')+'</div>'+
  cardsLista('Oportunidades claras','Em Distorções de valuation e em pelo menos mais um radar (Reprecificação, PEG ou Ignoradas), sem risco elevado. Convergência reduz falsos positivos.',R.op,r=>'Nota '+fmt(r.nota,1),'dest','op')+
  cardsLista('Reprecificação (momentum)','Crescimento do lucro > 10% (último exercício CVM), ROIC > 10% e P/L < 20: momentum operacional forte com valuation ainda contido.',R.rep,r=>'Cresc. lucro '+sinal(r.g1,1),'','rep')+
  cardsLista('Distorções de valuation','P/L abaixo de 50% da mediana do setor. Desconto excessivo ou deterioração: analise caso a caso.',R.dist,r=>'P/L '+fmt(r.pl,1),'','dist')+
  cardsLista('PEG Ratio (< 1)','PEG = P/L ÷ crescimento anual médio do lucro nos últimos 3 anos (%). Fica de fora quem teve prejuízo em algum dos 4 anos ou está com balanço desatualizado.',R.peg,r=>'PEG '+fmt(r.pegC,2),'','peg')+
  cardsLista('Small caps ignoradas','Small e Micro com crowded < 80% e nota ≥ 2: pouca cobertura, possível ineficiência.',R.ign,r=>'Crowded '+fmt(r.crowded,0)+'%','','ign')+
  cardsLista('Riscos elevados','DL/EBITDA > 3,5x, ou momentum < −10% com DL/EBITDA > 2x.',R.ris,r=>'DL/EBITDA '+fmt(r.div_liq_ebitda,1),'risco','ris')+
  '<h3 class="ap-h">Rankings <small>Top 20 por métrica, sem riscos elevados</small></h3><div class="ap-tops">'+R.tops.map(([t,s,l,m])=>'<section class="ap-card"><h4>'+t+'</h4><p class="ap-mut">'+s+'</p><ol>'+
  l.map(r=>'<li data-ap-ativo="'+r.ticker+'"><b>'+r.ticker+'</b><span>'+m(r)+'</span></li>').join('')+'</ol></section>').join('')+'</div>'+
  '<p class="ap-mut">Filtros estatísticos para investigar, não recomendação de compra ou venda.</p></div>';
}

/* ---------- página do ativo ---------- */
/* v876: série diária com 3 fontes — Técnico (Cloudflare), cache do gráfico do Terminal (LVGC) e ponte local. */
function deCandles(cs){const f=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'});
 return (cs||[]).map(x=>{const t=Array.isArray(x)?Number(x[0]):Number(x.t??x.time),c=Number(Array.isArray(x)?x[4]:x.c??x.close),ms=t<1e12?t*1000:t;
  if(!Number.isFinite(ms)||!Number.isFinite(c))return null;try{return {d:f.format(new Date(ms)),c}}catch{return null}}).filter(Boolean)}
async function carregaSerie(tk,force){if(st.serie[tk]&&!force)return;st.serie[tk]={loading:1};render();const erros=[];
 for(const mk of ['BR','br']){try{const r=await w.DiarioTecnico?.serie?.(tk,mk);if(r?.closes?.length>1){st.serie[tk]={c:r.closes,src:r.source||'Técnico'};render();return}}catch(e){erros.push(e.message)}}
 try{for(const k of [tk+'|1d',tk+'|D',tk+'|1D']){const h=typeof LVGC==='object'?LVGC[k]:null,c=deCandles(h?.v?.candles);if(c.length>1){st.serie[tk]={c,src:'Gráfico do Terminal'};render();return}}}catch{}
 try{const c=deCandles(w.DiarioTecnicoFeeds?.getCandles?.(tk,'1d','BR'));if(c.length>1){st.serie[tk]={c,src:'Ponte local (Profit)'};render();return}}catch{}
 st.serie[tk]={c:[],erro:erros[0]||'sem dados nas 3 fontes'};render()}
function grafico(r){
 const s=st.serie[r.ticker];if(!s||s.loading)return '<div class="ap-graf ap-mut">Carregando cotações…</div>';if(!s.c.length)return '<div class="ap-graf ap-mut">Não consegui a série diária ('+E(s.erro||'')+'). <button type="button" class="btn s" data-ap-serie="'+E(r.ticker)+'">Tentar de novo</button> <button type="button" class="btn s" data-dt815="foco" data-tk="'+E(r.ticker)+'">Abrir no Terminal</button></div>';
 const n={'1M':21,'3M':63,'6M':126,'1A':252,'3A':756,'Máx':1e9}[st.per]||252,c=s.c.slice(-n),ib=st.ibov&&st.serie.BOVA11?.c?.length?st.serie.BOVA11.c:null;
 const W=760,H=270,P=42,ys=c.map(x=>x.c);let lines=[],lo,hi,aArr=null,bArr=null;
 if(ib){const m=new Map(ib.map(x=>[x.d,x.c])),b0=c.find(x=>m.has(x.d)),i0=b0?m.get(b0.d):null,p0=c[0].c;
  aArr=c.map(x=>(x.c/p0-1)*100);bArr=c.map(x=>m.has(x.d)&&i0?(m.get(x.d)/i0-1)*100:null);lo=Math.min(...aArr,...bArr.filter(x=>x!=null));hi=Math.max(...aArr,...bArr.filter(x=>x!=null));lines=[[aArr,'ap-l1'],[bArr,'ap-l2']]}
 else{lo=Math.min(...ys);hi=Math.max(...ys);if(st.showJusto&&r.justo){lo=Math.min(lo,r.justo);hi=Math.max(hi,r.justo)}lines=[[ys,'ap-l1']]}
 const pad=(hi-lo)*.08||1;lo-=pad;hi+=pad;const X=i=>P+(W-P-10)*i/Math.max(1,c.length-1),Y=v=>10+(H-34)*(1-(v-lo)/(hi-lo));
 const path=l=>{let o='',m=0;l.forEach((v,i)=>{if(v==null){m=0;return}o+=(m?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1);m=1});return o};
 const areaPath=!ib&&ys.length>1?path(ys)+' L'+X(ys.length-1).toFixed(1)+' '+(H-24)+' L'+X(0).toFixed(1)+' '+(H-24)+' Z':'';
 const gr=[0,.25,.5,.75,1].map(t=>lo+(hi-lo)*t),u=ys[ys.length-1],var_=(u/ys[0]-1)*100,mi=Math.min(...ys),ma=Math.max(...ys);
 st._g={c,ys,ib:!!ib,a:aArr,b:bArr,W,H,P,lo,hi,tk:r.ticker};
 return '<div class="ap-graf"><div class="ap-bar">'+['1M','3M','6M','1A','3A','Máx'].map(p=>'<button type="button" class="ap-chip'+(st.per===p?' on':'')+'" data-ap-per="'+p+'">'+p+'</button>').join('')+
  '<button type="button" class="ap-chip'+(st.ibov?' on':'')+'" data-ap-ibov>Comparar IBOV</button>'+
  (!ib&&r.justo?'<button type="button" class="ap-chip ap-justo-tg'+(st.showJusto?' on':'')+'" data-ap-justo>Justo médio (~'+fmt(r.justo)+')</button>':'')+'</div>'+
  '<div class="ap-stats"><div><span>Início '+E(c[0].d)+'</span><b>'+brl(ys[0])+'</b></div><div><span>Mínima</span><b>'+brl(mi)+'</b></div><div><span>Máxima</span><b>'+brl(ma)+'</b></div><div><span>No período</span><b class="'+cor(var_)+'">'+sinal(var_)+'</b></div></div>'+
  '<div class="ap-svgwrap"><svg viewBox="0 0 '+W+' '+H+'" class="ap-svg" role="img" aria-label="Cotação de '+r.ticker+'"><defs><linearGradient id="ap-ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--g)" stop-opacity=".22"/><stop offset="100%" stop-color="var(--g)" stop-opacity="0"/></linearGradient></defs>'+
  gr.map(v=>'<line x1="'+P+'" x2="'+(W-10)+'" y1="'+Y(v).toFixed(1)+'" y2="'+Y(v).toFixed(1)+'" class="ap-grid"/><text x="2" y="'+(Y(v)+4).toFixed(1)+'" class="ap-ax">'+(ib?fmt(v,0)+'%':fmt(v,v<10?2:0))+'</text>').join('')+
  (!ib&&st.showJusto&&r.justo?'<line x1="'+P+'" x2="'+(W-10)+'" y1="'+Y(r.justo).toFixed(1)+'" y2="'+Y(r.justo).toFixed(1)+'" class="ap-justo"/><text x="'+(W-12)+'" y="'+(Y(r.justo)-5).toFixed(1)+'" text-anchor="end" class="ap-ax ap-am">Justo médio ~'+fmt(r.justo)+'</text>':'')+
  (areaPath?'<path d="'+areaPath+'" fill="url(#ap-ag)"/>':'')+
  lines.map(([l,c2])=>'<path d="'+path(l)+'" class="'+c2+'"/>').join('')+
  '<g class="ap-xh" style="display:none"><line class="ap-xh-l" y1="10" y2="'+(H-24)+'"/><circle class="ap-xh-d" r="4"/></g>'+
  '<text x="'+P+'" y="'+(H-6)+'" class="ap-ax">'+E(c[0].d)+'</text><text x="'+(W-10)+'" y="'+(H-6)+'" text-anchor="end" class="ap-ax">'+E(c[c.length-1].d)+'</text></svg><div class="ap-tt" style="display:none"></div></div>'+
  (ib?'<p class="ap-mut"><span class="ap-k1"></span>'+r.ticker+' <span class="ap-k2"></span>BOVA11 · retorno acumulado no período</p>':'')+'</div>';
}
function radarSvg(r){const ks=Object.keys(r.eixos),C=130,R0=100,pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/ks.length;return[C+Math.cos(a)*R0*v,C+Math.sin(a)*R0*v]};
 const poly=v=>ks.map((k,i)=>pt(i,v(k)).map(x=>x.toFixed(1)).join(',')).join(' ');
 return '<svg viewBox="0 0 260 260" class="ap-radarsvg">'+[.25,.5,.75,1].map(t=>'<polygon points="'+poly(()=>t)+'" class="ap-grid"/>').join('')+
  '<polygon points="'+poly(k=>(r.eixos[k]??0)/4)+'" class="ap-area"/>'+ks.map((k,i)=>{const[x,y]=pt(i,1.16);return '<text x="'+x.toFixed(0)+'" y="'+y.toFixed(0)+'" text-anchor="middle" class="ap-ax">'+k+' '+(r.eixos[k]==null?'—':fmt(r.eixos[k],1))+'</text>'}).join('')+'</svg>'}
function raiox(r){const pares=st.rows.porSetor[r.setor]||[],M=[['P/L','pl',0,'x'],['P/VP','pvp',0,'x'],['EV/EBITDA','ev_ebitda',0,'x'],['DY','dy',1,'%'],['Payout','payout',null,'%'],['ROE','roe',1,'%'],['ROIC','roic',1,'%'],
  ['Margem líquida','margem_liquida',1,'%'],['FCF yield','fcf_yield',1,'%'],['DL/EBITDA','div_liq_ebitda',0,'x'],['Momentum 12m','momentum',1,'%'],['Dist. MM200','mm200',null,'%'],['RSI 14','rsi',null,'']];
 const pos=(k,hb)=>{if(hb==null||r[k]==null)return '—';const v=pares.map(p=>p[k]).filter(x=>x!=null&&(k!=='pl'||x>0));if(v.length<3)return '—';const melhor=v.filter(x=>hb?x<r[k]:x>r[k]).length;return Math.round(melhor/(v.length-1)*100)+'º pct'};
 return '<div class="ap-2"><section class="ap-card"><h3>Nota Raio-X'+q('eixos')+' <b class="ap-big">'+(r.nota==null?'—':fmt(r.nota,2))+'</b><small>/ 4</small></h3>'+radarSvg(r)+
  '<p class="ap-mut">Cada eixo = percentil do ativo no mercado (0–4). Cálculo próprio do app com o snapshot do Screener; não é recomendação.</p></section>'+
  '<section class="ap-card"><h3>Comparar com pares · '+E(r.setor)+' <small>('+pares.length+')</small></h3><div class="ap-scroll"><table class="ap-t"><thead><tr><th>Métrica</th><th>'+r.ticker+'</th><th>Mediana setor</th><th>Posição'+q('pos')+'</th></tr></thead><tbody>'+
  M.map(([t,k,hb,u])=>'<tr><td>'+t+'</td><td class="ap-n">'+(r[k]==null?'—':fmt(r[k],u==='x'?1:1)+u)+'</td><td class="ap-n">'+(()=>{const m=median(pares.map(p=>k==='pl'&&!(p.pl>0)?null:p[k]));return m==null?'—':fmt(m,1)+u})()+'</td><td class="ap-n">'+pos(k,hb===0?true:hb===1?false:null)+'</td></tr>').join('')+
  '</tbody></table></div></section></div>'}
function calcs(r){const lucro=r.cap&&r.pl>0?r.cap/r.pl:null,acoes=r.cap&&r.preco?r.cap/r.preco:null;
 const inp=(k,v,l,s='any')=>'<label>'+l+'<input type="number" step="'+s+'" data-ap-calc="'+k+'" value="'+(v==null?'':Math.round(v*1e4)/1e4)+'"></label>';
 return '<div class="ap-calcs" data-preco="'+(r.preco||'')+'">'+
  '<section class="ap-card" data-calc="graham"><h4>Graham</h4><p class="ap-mut">√(22,5 × LPA × VPA)</p>'+inp('lpa',r.lpa,'LPA (R$)')+inp('vpa',r.vpa,'VPA (R$)')+'<p class="ap-res"></p></section>'+
  '<section class="ap-card" data-calc="bazin"><h4>Bazin</h4><p class="ap-mut">DPA ÷ yield mínimo</p>'+inp('dpa',r.dpa,'DPA 12m (R$)')+inp('y',6,'Yield mínimo (%)')+'<p class="ap-res"></p></section>'+
  '<section class="ap-card" data-calc="gordon"><h4>Gordon</h4><p class="ap-mut">DPA × (1+g) ÷ (k − g)</p>'+inp('dpa',r.dpa,'DPA 12m (R$)')+inp('k',10,'Retorno exigido k (%)')+inp('g',4,'Crescimento g (%)')+'<p class="ap-res"></p></section>'+
  '<section class="ap-card" data-calc="novo"><h4>Novo Bazin (seu método)</h4><p class="ap-mut">(lucro projetado × payout ÷ nº de ações) ÷ yield desejado</p>'+inp('l',lucro,'Lucro projetado (R$)')+inp('p',r.payout??50,'Payout (%)')+inp('a',acoes,'Nº de ações')+inp('y',7,'Yield desejado (%)')+'<p class="ap-res"></p></section></div>'+
  '<p class="ap-mut">Valores pré-preenchidos com o snapshot (lucro = valor de mercado ÷ P/L, últimos 12 meses). Edite para simular.</p>'}
function calcRun(root){if(!root)return;const p=Number(root.dataset.preco);root.querySelectorAll('[data-calc]').forEach(s=>{const g=k=>Number(s.querySelector('[data-ap-calc="'+k+'"]')?.value);let v=null;
 switch(s.dataset.calc){case 'graham':v=g('lpa')>0&&g('vpa')>0?Math.sqrt(22.5*g('lpa')*g('vpa')):null;break;case 'bazin':v=g('dpa')>0&&g('y')>0?g('dpa')/(g('y')/100):null;break;
  case 'gordon':v=g('dpa')>0&&g('k')>g('g')?g('dpa')*(1+g('g')/100)/((g('k')-g('g'))/100):null;break;case 'novo':v=g('l')>0&&g('a')>0&&g('y')>0?g('l')*(g('p')/100)/g('a')/(g('y')/100):null}
 const u=v&&p?(v/p-1)*100:null;s.querySelector('.ap-res').innerHTML=v==null?'<span class="ap-mut">Dados insuficientes</span>':'Preço justo <b>'+brl(v)+'</b> <span class="'+cor(u)+'">'+(u==null?'':(u>=0?'margem ':'acima em ')+fmt(Math.abs(u),1)+'%')+'</span>'})}
const KQ={'Nota Raio-X':'nota','P/L':'pl','P/VP':'pvp','DY':'dy','ROE':'roe','ROIC':'roic','DL/EBITDA':'div_liq_ebitda','Momentum 12m':'momentum','RSI 14':'rsi','Crowded':'crowded'};
function viewAtivo(){
 const r=st.rows.map.get(st.tk);if(!r)return '<p class="ap-mut">Ativo '+E(st.tk)+' fora do universo do Screener. <button type="button" class="ap-link" data-ap-voltar>Voltar</button></p>';
 const u=r.justo&&r.preco?(r.justo/r.preco-1)*100:null,tese=teses().find(t=>t.tk===r.ticker&&t.status==='ativa');
 const subs=[['visao','Visão geral'],['raiox','Raio-X'],['div','Dividendos e preço justo'],['empresa','Empresa']];
 let body='';
 if(st.sub==='visao')body='<div class="ap-2 ap-2w"><section class="ap-card"><h3>Cotação</h3>'+grafico(r)+'</section><section class="ap-card"><h3>Resumo</h3><div class="ap-kv">'+
  [['Nota Raio-X',r.nota==null?'—':fmt(r.nota,2)+' / 4'],['P/L',r.pl==null?'—':fmt(r.pl,1)+'x'],['P/VP',r.pvp==null?'—':fmt(r.pvp,2)+'x'],['DY',pct(r.dy)],['ROE',pct(r.roe)],['ROIC',pct(r.roic)],
   ['DL/EBITDA',r.div_liq_ebitda==null?'—':fmt(r.div_liq_ebitda,1)+'x'],['Momentum 12m',sinal(r.momentum)],['RSI 14',fmt(r.rsi,0)],['Crowded',r.crowded==null?'—':fmt(r.crowded,0)+'%']].map(([k,v])=>'<div><span>'+k+(KQ[k]?q(KQ[k]):'')+'</span><b>'+v+'</b></div>').join('')+'</div>'+
  '<h4>Preço justo'+q('justo')+'</h4><div class="ap-kv">'+[['Graham',r.graham],['Bazin',r.bazin],['Gordon',r.gordon],['Teto próprio',r.proprio]].map(([k,v])=>'<div><span>'+k+'</span><b>'+(v==null?'—':'~'+fmt(v)+' <small class="'+cor(r.preco?(v/r.preco-1):null)+'">'+sinal(r.preco?(v/r.preco-1)*100:null,0)+'</small>')+'</b></div>').join('')+'</div>'+
  '<h4>Minha tese</h4>'+(tese?'<p>Alvo <b>'+brl(tese.alvo)+'</b> · '+E(tese.texto).slice(0,160)+'</p>':'<p class="ap-mut">Sem tese para '+r.ticker+'.</p>')+'<button type="button" class="btn s" data-ap-novatese="'+r.ticker+'">'+(tese?'Editar tese':'Nova tese')+'</button></section></div>';
 else if(st.sub==='raiox')body=raiox(r);else if(st.sub==='div')body=calcs(r);
 else body='<section class="ap-card"><h3>'+E(r.empresa||r.ticker)+'</h3><div class="ap-kv">'+[['Setor',r.setor],['Segmento',r.segmento||'—'],['Porte',r.porte||'—'],['Valor de mercado',cmp(r.cap)],['Liquidez diária',cmp(r.liquidez)],
  ['Ações (estimado)',r.cap&&r.preco?fmt(r.cap/r.preco,0):'—'],['Lucro 12m (estimado)',r.cap&&r.pl>0?cmp(r.cap/r.pl):'—'],['Balanço de referência',String(r.balanco).slice(0,10)||'—'],['Fonte',r.raw.fonte_principal||r.raw.source||'Screener público']].map(([k,v])=>'<div><span>'+k+'</span><b>'+E(v)+'</b></div>').join('')+'</div>'+
  (r.raw.documento_balanco_url?'<p><a href="'+E(r.raw.documento_balanco_url)+'" target="_blank" rel="noopener">Abrir documento na CVM ↗</a></p>':'')+'</section>';
 return '<div class="ap-ativo"><div class="ap-bc" aria-label="Caminho"><button type="button" class="ap-link" data-ap-voltar>← Rankings</button><span>/</span><b>'+r.ticker+'</b></div>'+
  '<header class="ap-hero"><div class="ap-hero-l"><div class="ap-hero-t"><h2>'+logo(r.ticker)+r.ticker+'</h2><div class="ap-tags"><span class="ap-tag">'+E(r.setor)+'</span>'+(r.porte?'<span class="ap-tag">'+r.porte+' Cap</span>':'')+'</div></div><p class="ap-mut ap-hero-emp">'+E(r.empresa)+'</p>'+
  '<div class="ap-hk"><div><span>Cotação</span><b>'+brl(r.preco)+(r.profit&&r.d1!=null?' <small class="'+cor(r.d1)+'">'+sinal(r.d1,2)+'</small>':'')+'</b></div><div><span>Justo médio (3 métodos)</span><b>~'+fmt(r.justo)+' <small class="'+cor(u)+'">'+sinal(u,0)+'</small></b></div></div></div>'+
  '<div class="ap-acoes"><button type="button" class="ui-cta" data-noclaro data-dt815="foco" data-tk="'+r.ticker+'">Gráfico no Terminal</button><div class="ap-acoes-sec"><button type="button" class="btn s" data-hf-abrir="'+r.ticker+'" data-hf-market="BR">Histórico 10 anos</button><button type="button" class="btn s" data-ap-ia="'+r.ticker+'">Parecer de Graham</button></div></div></header>'+
  '<div class="ap-subs" role="tablist">'+subs.map(([k,t])=>'<button type="button" role="tab" data-ap-sub="'+k+'" class="'+(st.sub===k?'on':'')+'">'+t+'</button>').join('')+'</div>'+body+'</div>';
}

/* ---------- teses ---------- */
const teses=()=>ls.get(K_TESES,[]);
function viewTeses(){
 const l=teses(),ed=st.teseEdit,map=st.rows?.map;
 const form=ed?'<section class="ap-card ap-form"><h3>'+(ed.id?'Editar tese':'Nova tese')+'</h3><div class="ap-fgrid">'+
  [['tk','Ativo','text',ed.tk],['entrada','Preço de entrada (R$)','number',ed.entrada],['alvo','Preço-alvo (R$)','number',ed.alvo],['stop','Invalida abaixo de (R$)','number',ed.stop],['horizonte','Horizonte','text',ed.horizonte||'12 meses']].map(([k,t,ty,v])=>'<label>'+t+'<input type="'+ty+'" step="any" data-ap-tf="'+k+'" value="'+E(v??'')+'"></label>').join('')+
  '<label>Status<select data-ap-tf="status">'+['ativa','realizada','invalidada'].map(s=>'<option'+(ed.status===s?' selected':'')+'>'+s+'</option>').join('')+'</select></label></div>'+
  '<label>Tese (por que comprar)<textarea rows="3" data-ap-tf="texto" placeholder="Ex.: ROE alto, dívida controlada, desconto vs pares">'+E(ed.texto||'')+'</textarea></label>'+
  '<label>Critérios para acompanhar (1 por linha)<textarea rows="3" data-ap-tf="criterios" placeholder="ROE > 15%&#10;DL/EBITDA < 2x">'+E(ed.criterios||'')+'</textarea></label>'+
  '<label>Riscos<textarea rows="2" data-ap-tf="riscos">'+E(ed.riscos||'')+'</textarea></label><div class="ap-bar"><button type="button" class="ui-cta" data-noclaro data-ap-tsalvar>Salvar tese</button><button type="button" class="btn s" data-ap-tcancel>Cancelar</button></div></section>':'';
 const card=t=>{const r=map?.get(t.tk),p=r?.preco,prog=p&&t.entrada&&t.alvo&&t.alvo!==t.entrada?Math.max(0,Math.min(100,(p-t.entrada)/(t.alvo-t.entrada)*100)):null,up=p&&t.alvo?(t.alvo/p-1)*100:null;
  return '<article class="ap-card ap-tese"><header><h4 data-ap-ativo="'+E(t.tk)+'">'+logo(t.tk)+E(t.tk)+'</h4><span class="ap-tag st-'+E(t.status)+'">'+E(t.status)+'</span></header>'+
   '<div class="ap-kv"><div><span>Atual</span><b>'+brl(p)+'</b></div><div><span>Entrada</span><b>'+brl(N(t.entrada))+'</b></div><div><span>Alvo</span><b>'+brl(N(t.alvo))+' <small class="'+cor(up)+'">'+sinal(up,0)+'</small></b></div><div><span>Horizonte</span><b>'+E(t.horizonte||'—')+'</b></div></div>'+
   (prog!=null?'<div class="ap-prog"><i style="width:'+prog.toFixed(0)+'%"></i></div><p class="ap-mut">'+fmt(prog,0)+'% do caminho até o alvo'+(t.stop&&p&&p<t.stop?' · <b class="ap-r">abaixo do ponto de invalidação</b>':'')+'</p>':'')+
   (t.texto?'<p>'+E(t.texto)+'</p>':'')+(t.criterios?'<ul>'+String(t.criterios).split('\n').filter(Boolean).map(c=>'<li>'+E(c)+'</li>').join('')+'</ul>':'')+(t.riscos?'<p class="ap-mut">Riscos: '+E(t.riscos)+'</p>':'')+
   '<div class="ap-bar ap-tese-actions"><button type="button" class="btn s ap-btn-acc" data-ap-ia="'+E(t.tk)+'" data-ap-membro="munger">Testar com Munger</button><button type="button" class="btn s" data-ap-tedit="'+t.id+'">Editar</button><button type="button" class="btn s ap-del" data-ap-tdel="'+t.id+'">'+(st.excluir===t.id?'Confirmar exclusão':'Excluir')+'</button></div></article>'};
 return '<div class="ap-teses"><header class="ap-bar ap-teses-head"><div><h3>Minhas teses</h3><p class="ap-mut">'+l.length+' tese(s) · salvas neste aparelho (inclua no backup)</p></div>'+(ed?'':'<button type="button" class="ui-cta" data-noclaro data-ap-novatese="">+ Nova tese</button>')+'</header>'+form+
  (l.length?'<div class="ap-tgrid">'+l.sort((a,b)=>(a.status==='ativa'?0:1)-(b.status==='ativa'?0:1)).map(card).join('')+'</div>':ed?'':'<section class="ap-card ap-vazio"><h4>Nenhuma tese documentada</h4><p class="ap-mut">Faça o valuation na página do ativo, registre aqui o preço-alvo e os critérios e acompanhe a evolução.</p></section>')+'</div>';
}

/* ---------- render ---------- */
function corpo(){
 if(st.erro&&!st.rows)return '<section class="ap-card ap-vazio"><p>'+E(st.erro)+'</p><button type="button" class="btn s" data-ap-recarregar>Tentar de novo</button></section>';
 if(!st.rows)return '<section class="ap-card ap-vazio"><p class="ap-mut">Carregando universo do Screener Brasil…</p></section>';
 if(st.tk&&st.tab!=='guia')return viewAtivo();
 return st.tab==='guia'?viewGuia():st.tab==='radar'?viewRadar():st.tab==='teses'?viewTeses():viewRank();
}
function view(tab){if(tab)st.tab=tab;css();return '<div id="ap-root" class="ap">'+corpo()+'</div>'}
function render(){const el=d.getElementById('ap-root');if(!el)return;aplicaProfit();const sc=el.querySelector('.ap-scroll')?.scrollLeft;el.innerHTML=corpo()+(st.q?cartaoQ(st.q):'');if(sc)el.querySelector('.ap-scroll')&&(el.querySelector('.ap-scroll').scrollLeft=sc);
 calcRun(el.querySelector('.ap-calcs'));if(st.tk&&st.sub==='visao'){carregaSerie(st.tk);if(st.ibov)carregaSerie('BOVA11')}
 if(st.tab==='radar'&&st.rows&&!st.rotLoading&&!st.tk&&!st.rot?.arquivo&&(!st.rot||Date.now()-st.rot.at>12*3600000)&&!st._rotTentou){st._rotTentou=1;rotacao()}}
function enter(tab){if(tab)st.tab=tab;st._rotTentou=0;if(tab!=='ativo'&&!st._abrindo)st.tk='';st._abrindo=0;carregar().then(render);render()}
function abrir(tk){st.tk=String(tk||'').toUpperCase();st.sub='visao';st._abrindo=1}
const salvaF=()=>ls.set(K_FILT,{...st.f,q:'',page:0});

d.addEventListener('click',ev=>{const t=ev.target.closest?.('[data-ap-q],[data-ap-qx],[data-ap-guia],.ap-qbox,[data-ap-voltar],[data-ap-ativo],[data-ap-sort],[data-ap-preset],[data-ap-limpar],[data-ap-page],[data-ap-csv],[data-ap-rot],[data-ap-rporte],[data-ap-setor],[data-ap-sub],[data-ap-per],[data-ap-ibov],[data-ap-justo],[data-ap-colmode],[data-ap-novatese],[data-ap-tsalvar],[data-ap-tcancel],[data-ap-tedit],[data-ap-tdel],[data-ap-ia],[data-ap-recarregar],[data-ap-faltam],[data-ap-serie]');
 if(!t||!t.closest('#ap-root'))return;const ds=t.dataset;
 if('apQ' in ds){ev.preventDefault();ev.stopPropagation();st.q=ds.apQ;render();return}
 if('apGuia' in ds){st.q='';d.querySelector('[data-an-sub="guia"]')?.click();return}
 if('apQx' in ds||t.classList?.contains('ap-qbox')){if(ev.target.closest('.ap-qcard')&&!('apQx' in ds))return;st.q='';render();return}
 if('apIa' in ds){w.DiarioAnalises?.command?.('ANALISE '+ds.apIa,ds.apMembro||'graham');d.querySelector('[data-an-sub="pesquisa"]')?.click();return}
 if('apRecarregar' in ds){carregar(true);return}
 if('apSerie' in ds){carregaSerie(ds.apSerie,true);return}
 if('apFaltam' in ds){const R=st.X?.retornos||{},P=pf(),l=st.rows.rows.filter(r=>!R[r.ticker]&&!P[r.ticker]).map(r=>r.ticker);navigator.clipboard?.writeText(l.join('\n'));t.textContent=l.length+' tickers copiados';return}
 if('apVoltar' in ds){st.tk='';}
 else if('apAtivo' in ds&&!ev.target.closest('button[data-ap-tedit],button[data-ap-tdel]')){st.tk=ds.apAtivo;st.sub='visao';st.showJusto=false;w.DiarioBarraContexto?.definirFoco?.(ds.apAtivo);d.getElementById('ap-root')?.scrollIntoView({block:'start'})}
 else if('apSort' in ds){const k=ds.apSort;if(st.f.sort===k)st.f.dir*=-1;else{st.f.sort=k;st.f.dir=['ticker','setor','porte','pl','pvp','ev_ebitda','div_liq_ebitda'].includes(k)?1:-1}salvaF()}
 else if('apPreset' in ds){st.f.preset=st.f.preset===ds.apPreset?'':ds.apPreset;st.f.page=0;salvaF()}
 else if('apLimpar' in ds){ev.preventDefault();Object.assign(st.f,{q:'',preset:'',setor:'',porte:'',nota:0,liq:0,page:0});salvaF()}
 else if('apPage' in ds)st.f.page+=Number(ds.apPage);
 else if('apCsv' in ds){csv();return}
 else if('apRot' in ds){rotacao();return}
 else if('apRporte' in ds)st.radarPorte=ds.apRporte;
 else if('apSetor' in ds)st.radarSetor=st.radarSetor===ds.apSetor?'':ds.apSetor;
 else if('apSub' in ds)st.sub=ds.apSub;else if('apPer' in ds)st.per=ds.apPer;else if('apIbov' in ds)st.ibov=!st.ibov;
 else if('apJusto' in ds)st.showJusto=!st.showJusto;
 else if('apColmode' in ds){st.colMode=ds.apColmode;ls.set(K_MODE,st.colMode)}
 else if('apNovatese' in ds){const ex=teses().find(x=>x.tk===ds.apNovatese&&x.status==='ativa'),r=st.rows?.map.get(ds.apNovatese);st.teseEdit=ex?{...ex}:{tk:ds.apNovatese,entrada:r?.preco?Math.round(r.preco*100)/100:'',alvo:r?.justo?Math.round(r.justo*100)/100:'',status:'ativa'};st.tk='';st.tab='teses';d.querySelector('[data-an-sub="teses"]:not(.selected)')?.click()}
 else if('apTedit' in ds)st.teseEdit={...teses().find(x=>x.id===ds.apTedit)};
 else if('apTcancel' in ds)st.teseEdit=null;
 else if('apTdel' in ds){if(st.excluir===ds.apTdel){ls.set(K_TESES,teses().filter(x=>x.id!==ds.apTdel));st.excluir=''}else st.excluir=ds.apTdel}
 else if('apTsalvar' in ds){const f=st.teseEdit,tk=String(f.tk||'').trim().toUpperCase();if(!tk){d.querySelector('[data-ap-tf="tk"]')?.focus();return}
  const t={...f,tk,id:f.id||Date.now().toString(36),entrada:N(f.entrada),alvo:N(f.alvo),stop:N(f.stop),atualizada:new Date().toISOString()},l=teses().filter(x=>x.id!==t.id);l.push(t);ls.set(K_TESES,l);st.teseEdit=null}
 render()});
d.addEventListener('click',ev=>{const b=ev.target.closest?.('[data-ap-abrir]');if(b)abrir(b.dataset.apAbrir)},true);
d.addEventListener('input',ev=>{const t=ev.target;if(!t.closest?.('#ap-root'))return;
 if(t.dataset.apCalc!=null){calcRun(t.closest('.ap-calcs'));return}
 if(t.dataset.apTf){st.teseEdit[t.dataset.apTf]=t.value;return}
 if(t.dataset.apF==='q'){st.f.q=t.value;st.f.page=0;clearTimeout(st._q);st._q=setTimeout(()=>{const p=t.selectionStart;render();const i=d.querySelector('#ap-root [data-ap-f="q"]');if(i){i.focus();i.setSelectionRange(p,p)}},250)}
 else if(t.dataset.apF==='nota'){st.f.nota=Number(t.value);t.previousElementSibling&&(t.previousElementSibling.textContent=fmt(st.f.nota,1))}});
d.addEventListener('change',ev=>{const t=ev.target;if(!t.closest?.('#ap-root'))return;
 if(t.dataset.apCol){st.colMode='completo';ls.set(K_MODE,'completo');vis=t.checked?[...new Set([...vis,t.dataset.apCol])]:vis.filter(x=>x!==t.dataset.apCol);vis=COLS.map(c=>c[0]).filter(k=>vis.includes(k));ls.set(K_COLS,vis);render();d.querySelector('#ap-root .ap-cols')?.setAttribute('open','');return}
 if(t.dataset.apTf){st.teseEdit[t.dataset.apTf]=t.value;return}
 const k=t.dataset.apF;if(!k||k==='q')return;st.f[k]=k==='setor'||k==='porte'?t.value:Number(t.value);st.f.page=0;salvaF();render()});
function xhMove(ev){const svg=ev.target.closest?.('#ap-root .ap-svg'),g=st._g;if(!svg||!g||!g.c?.length)return;
 const pt=ev.touches?ev.touches[0]:ev,rc=svg.getBoundingClientRect();if(!rc.width)return;
 const rx=(pt.clientX-rc.left)/rc.width*g.W,frac=Math.max(0,Math.min(1,(rx-g.P)/(g.W-g.P-10)));
 const idx=Math.round(frac*(g.c.length-1)),x=g.P+(g.W-g.P-10)*idx/Math.max(1,g.c.length-1);
 const v=g.ib?g.a[idx]:g.ys[idx],y=10+(g.H-34)*(1-(v-g.lo)/(g.hi-g.lo));
 const xh=svg.querySelector('.ap-xh'),tt=svg.parentElement?.querySelector('.ap-tt');if(!xh||!tt)return;
 xh.style.display='';xh.querySelector('.ap-xh-l')?.setAttribute('x1',x.toFixed(1));xh.querySelector('.ap-xh-l')?.setAttribute('x2',x.toFixed(1));
 const dot=xh.querySelector('.ap-xh-d');dot?.setAttribute('cx',x.toFixed(1));dot?.setAttribute('cy',y.toFixed(1));
 const dt=g.c[idx].d.split('-').reverse().join('/');
 tt.innerHTML='<span>'+E(dt)+'</span> · <b>'+(g.ib?sinal(v,1):brl(v))+'</b>';
 tt.style.display='block';const lp=Math.min(78,Math.max(6,(x/g.W)*100));tt.style.left=lp.toFixed(1)+'%';}
d.addEventListener('mousemove',xhMove);d.addEventListener('touchmove',xhMove,{passive:true});
d.addEventListener('mouseleave',ev=>{const w2=ev.target.closest?.('#ap-root .ap-svgwrap');if(!w2)return;const xh=w2.querySelector('.ap-xh'),tt=w2.querySelector('.ap-tt');if(xh)xh.style.display='none';if(tt)tt.style.display='none'},true);

let cssOk=false;function css(){if(cssOk)return;cssOk=true;const s=d.createElement('style');s.id='ap873-css';s.textContent=`
.ap{--b:var(--surface-1,#12151E);--b2:var(--surface-2,#181C28);--ln:var(--border,rgba(255,255,255,.08));--am:var(--accent,#C9A66B);--am-soft:rgba(201,166,107,.14);--g:var(--up,#34D399);--r:var(--down,#F87171);--mu:var(--text-muted,#94A3B8);--tx:var(--text,#F1F5F9);color:var(--tx);font-variant-numeric:tabular-nums;display:flex;flex-direction:column;gap:16px;min-width:0}
html[data-v427-tema=claro] .ap{--b:#FAF8F3;--b2:#F0ECE2;--ln:rgba(28,25,23,.14);--am:#8B6524;--am-soft:rgba(139,101,36,.12);--g:#15803D;--r:#B91C1C;--mu:#57534E;--tx:#1C1917}
.ap .ap-g{color:var(--g)}.ap .ap-r{color:var(--r)}.ap .ap-am{fill:var(--am)}.ap-mut{color:var(--mu);font-size:12px;margin:4px 0}
.ap-card{background:var(--b);border:1px solid var(--ln);border-radius:6px;padding:16px;min-width:0}.ap-card h3,.ap-card h4{margin:0 0 8px;font-size:14px;color:var(--tx)}
.ap-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.ap-bar h3{margin:0}.ap-h{font-size:15px;margin:8px 0 0}.ap-h small{color:var(--mu);font-weight:400}
.ap-link{background:none;border:0;color:var(--am);cursor:pointer;padding:0;font:inherit;font-size:12.5px;font-weight:500}.ap-link:hover{text-decoration:underline}
html body #app #ap-root .ui-cta{background:var(--am)!important;color:#0A0B0F!important;border:1px solid transparent!important;border-radius:6px!important;padding:8px 14px!important;font-weight:700!important;font-size:13px!important;cursor:pointer;min-height:38px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px;white-space:nowrap}
html[data-v427-tema=claro] body #app #ap-root .ui-cta{background:#8B6524!important;color:#FFFDF9!important}
html body #app #ap-root .ap-btn-acc{border-color:var(--am)!important;color:var(--am)!important;background:var(--am-soft)!important}
html body #app #ap-root .ap-hero h2{margin:0!important;font-size:28px!important;font-weight:800!important;letter-spacing:-.02em!important;text-transform:none!important;display:flex!important;align-items:center!important;gap:8px!important;color:var(--tx)!important}
html body #app #ap-root .ap-bc{display:flex!important;align-items:center!important;gap:8px!important;font-size:12.5px!important;color:var(--mu)!important;margin-bottom:-4px!important}
html body #app #ap-root .ap-subs{display:flex!important;gap:6px!important;border-bottom:1px solid var(--ln)!important;overflow-x:auto!important;scrollbar-width:none}
.ap-rank{display:grid;grid-template-columns:248px minmax(0,1fr);gap:16px}
.ap-filtros details{background:var(--b);border:1px solid var(--ln);border-radius:6px;padding:12px;position:sticky;top:8px}
#ap-root .ap-filtros summary{font-weight:600;font-size:13px;cursor:pointer;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:8px;list-style:none}
.ap-filtros summary::-webkit-details-marker{display:none}
.ap-fsum-l{display:inline-flex;align-items:center;gap:6px}
#ap-root .ap-filtros summary [data-ap-limpar]{margin-left:auto}
.ap-fbadge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--am);color:#0A0B0F;font-size:10.5px;font-weight:700}
html[data-v427-tema=claro] .ap-fbadge{color:#FFFDF9}
.ap-lbl{display:block;color:var(--mu);font-size:11px;text-transform:uppercase;letter-spacing:.04em;margin:12px 0 6px}
.ap-lbl select,.ap-lbl input{display:block;width:100%;margin-top:6px;text-transform:none}.ap-lbl b{color:var(--tx)}
.ap select,.ap input[type=search],.ap input[type=number],.ap input[type=text],.ap textarea{background:var(--b2);border:1px solid var(--ln);color:var(--tx);border-radius:6px;padding:8px 10px;font:inherit;font-size:13px;min-height:36px;box-sizing:border-box}
.ap input[type=range]{accent-color:var(--am)}
.ap-preset{display:block;width:100%;text-align:left;background:var(--b2);border:1px solid var(--ln);border-left:3px solid transparent;border-radius:6px;color:var(--tx);padding:8px 10px;margin-bottom:6px;cursor:pointer;transition:border-color .15s,background .15s}
.ap-preset.on{border-color:var(--am);border-left-color:var(--am);background:var(--am-soft)}.ap-preset b{display:block;font-size:13px}.ap-preset small{color:var(--mu);font-size:11px}
.ap-tabela{min-width:0;display:flex;flex-direction:column;gap:8px}.ap-busca{flex:1;min-width:160px}.ap-leg{margin:0}
.ap-seg{display:inline-flex;border:1px solid var(--ln);border-radius:6px;overflow:hidden;background:var(--b2);flex:0 0 auto}
.ap-seg button{background:none;border:0;color:var(--mu);padding:0 10px;height:32px;font:inherit;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap}
.ap-seg button.on{background:var(--am-soft);color:var(--am);font-weight:700}
.ap-cols{position:relative}.ap-cols>div{position:absolute;z-index:20;right:0;top:110%;background:var(--b);border:1px solid var(--ln);border-radius:6px;padding:10px;display:grid;grid-template-columns:repeat(2,minmax(140px,1fr));gap:4px 12px;font-size:12px;width:340px;box-shadow:0 12px 28px rgba(0,0,0,.35)}
.ap-scroll{overflow-x:auto;min-width:0;border:1px solid var(--ln);border-radius:6px;position:relative}
.ap-scroll-fade{-webkit-mask-image:linear-gradient(90deg,#000 94%,transparent 100%);mask-image:linear-gradient(90deg,#000 94%,transparent 100%)}
.ap-t{width:100%;border-collapse:collapse;font-size:12.5px;white-space:nowrap}
.ap-t th{position:sticky;top:0;background:var(--b2);color:var(--mu);font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;text-align:left;padding:9px 10px;cursor:pointer;font-weight:600}
.ap-t th.on{color:var(--am)}.ap-t td{padding:8px 10px;border-top:1px solid var(--ln);background:var(--b)}.ap-t tbody tr{cursor:pointer}.ap-t tbody tr:hover td{background:var(--b2)}
.ap-n{text-align:right}.ap-t th.ap-stk,.ap-t td.ap-stk{position:sticky;left:0;z-index:2;min-width:155px}.ap-t th.ap-stk{z-index:3}.ap-stk img{vertical-align:middle;margin-right:6px}.ap-stk small{display:block;color:var(--mu);max-width:155px;overflow:hidden;text-overflow:ellipsis}
.ap-up{text-transform:uppercase;font-size:11px;color:var(--mu)}.ap-est{display:block}.ap-t small{font-size:10.5px}.ap-vazio{text-align:center;padding:24px}
.ap-nota{display:inline-grid;place-items:center;width:32px;height:32px;border-radius:50%;font-size:11px;font-weight:700;color:var(--tx);background:radial-gradient(closest-side,var(--b) 76%,transparent 78%),conic-gradient(var(--am) calc(var(--p)*1%),var(--b2) 0)}
.ap-pill{border:1px solid var(--ln);border-radius:10px;padding:2px 8px;font-size:11px;display:inline-block}
.ap-pill.hot{border-color:rgba(248,113,113,.45);background:rgba(248,113,113,.12);color:#FCA5A5}
html[data-v427-tema=claro] .ap-pill.hot{border-color:rgba(185,28,28,.35);background:rgba(185,28,28,.09);color:#991B1B;font-weight:600}
.ap-chip{background:var(--b2);border:1px solid var(--ln);color:var(--tx);border-radius:6px;padding:6px 11px;font-size:12px;cursor:pointer;min-height:32px;white-space:nowrap}
.ap-chip.on{border-color:var(--am);color:var(--am);background:var(--am-soft);font-weight:600}
.ap-mpresets{display:none;gap:6px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:2px}
.ap-mpresets::-webkit-scrollbar{display:none}
.ap-mcards{display:none;flex-direction:column;gap:8px}
.ap-mcard{background:var(--b);border:1px solid var(--ln);border-radius:8px;padding:11px 12px;display:flex;flex-direction:column;gap:8px;cursor:pointer}
.ap-mc-top{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:center}
.ap-mc-id b{display:flex;align-items:center;gap:6px;font-size:14px;color:var(--tx)}.ap-mc-id small{display:block;color:var(--mu);font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ap-mc-px{text-align:right}.ap-mc-px b{display:block;font-size:14px;color:var(--tx)}.ap-mc-px small{display:block;font-size:11px;font-weight:600}
.ap-mc-met{display:flex;justify-content:space-between;gap:8px;padding-top:7px;border-top:1px solid var(--ln);font-size:11.5px;color:var(--mu)}.ap-mc-met b{color:var(--tx);font-weight:600}
.ap-rot header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.ap-rot header p{color:var(--mu);font-size:12px;margin:4px 0 12px}
.ap-lista header{display:flex;flex-direction:column;gap:3px;margin-bottom:10px}.ap-lista header p{color:var(--mu);font-size:12px;margin:0}
.ap-lista-empty{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 16px!important}.ap-lista-empty p{margin:0}
.ap-rotgrid{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:16px}.ap-heat td{font-weight:600}.ap-heat tr.on td:first-child{color:var(--am)}
.ap-dest div{display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid var(--ln)}
.ap-lista{background:var(--b);border:1px solid var(--ln);border-radius:6px;padding:16px}.ap-lista.dest{border-left:3px solid var(--am)}.ap-lista.risco{border-left:3px solid var(--r)}.ap-lista h3{margin:0;font-size:14px}.ap-lista h3 span{color:var(--mu);font-weight:400}
.ap-chips{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.ap-chips button{text-align:left;background:var(--b2);border:1px solid var(--ln);border-radius:6px;color:var(--tx);padding:9px 10px;cursor:pointer;min-height:44px}
.ap-chips b{display:block;font-size:13px}.ap-chips small{display:block;color:var(--mu);font-size:10.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ap-chips em{font-style:normal;font-size:11px;color:var(--am);font-weight:600}
.ap-tops{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}.ap-tops ol{margin:0;padding-left:22px;font-size:12.5px}.ap-tops li{display:flex;justify-content:space-between;padding:4px 0;cursor:pointer;border-bottom:1px solid var(--ln)}.ap-tops li span{color:var(--mu)}
.ap-bc{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--mu);margin-bottom:-6px}.ap-bc b{color:var(--tx)}
.ap-hero{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:16px 24px;align-items:center;background:var(--b);border:1px solid var(--ln);border-radius:8px;padding:18px 20px}
.ap-hero-t{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.ap-hero h2{margin:0;font-size:28px;font-weight:800;letter-spacing:-.02em;display:flex;align-items:center;gap:8px;color:var(--tx)}
.ap-tags{display:flex;gap:6px;flex-wrap:wrap}.ap-hero-emp{margin:4px 0 12px;font-size:13px}
.ap-tag{font-size:10.5px;text-transform:uppercase;letter-spacing:.03em;border:1px solid var(--ln);background:var(--b2);border-radius:4px;padding:2px 7px;color:var(--mu);font-weight:600}.ap-tag.st-ativa{color:var(--g);border-color:rgba(52,211,153,.35)}.ap-tag.st-invalidada{color:var(--r);border-color:rgba(248,113,113,.35)}
.ap-hk{display:flex;gap:28px;flex-wrap:wrap}.ap-hk span,.ap-kv span,.ap-stats span{display:block;color:var(--mu);font-size:11px}.ap-hk b{font-size:22px;color:var(--tx)}.ap-hk small{font-size:12.5px;font-weight:600}
.ap-acoes{display:flex;flex-direction:column;gap:8px}.ap-acoes .ui-cta{width:100%}.ap-acoes-sec{display:flex;flex-direction:column;gap:6px}.ap-acoes-sec .btn{width:100%;justify-content:center}
.ap-subs{display:flex;gap:6px;border-bottom:1px solid var(--ln);overflow-x:auto;scrollbar-width:none}.ap-subs::-webkit-scrollbar{display:none}
.ap-subs button{background:none;border:0;border-bottom:2px solid transparent;color:var(--mu);padding:10px 12px;cursor:pointer;font:inherit;font-size:13px;white-space:nowrap;min-height:40px}.ap-subs button.on{color:var(--tx);border-bottom-color:var(--am);font-weight:600}
.ap-2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}.ap-2w{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}
.ap-kv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px;margin-bottom:14px}.ap-kv b{font-size:14px;color:var(--tx)}.ap-kv small{font-size:11px}
.ap-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0}.ap-svgwrap{position:relative}.ap-svg{width:100%;height:auto;display:block;cursor:crosshair}
.ap-grid{stroke:var(--ln);fill:none}.ap-ax{fill:var(--mu);font-size:10px}.ap-l1{fill:none;stroke:var(--g);stroke-width:2}.ap-l2{fill:none;stroke:var(--mu);stroke-width:1.3;stroke-dasharray:3 3}.ap-justo{stroke:var(--am);stroke-width:1.4;stroke-dasharray:6 4}
.ap-xh-l{stroke:var(--am);stroke-width:1;stroke-dasharray:3 3;opacity:.75}.ap-xh-d{fill:var(--am);stroke:var(--b);stroke-width:2}
.ap-tt{position:absolute;top:8px;transform:translateX(-50%);background:var(--b2);border:1px solid var(--am);color:var(--tx);padding:4px 9px;border-radius:6px;font-size:11.5px;pointer-events:none;white-space:nowrap;box-shadow:0 6px 16px rgba(0,0,0,.35)}
.ap-justo-tg{margin-left:auto}
.ap-k1,.ap-k2{display:inline-block;width:12px;height:2px;background:var(--g);margin:0 4px 3px 8px}.ap-k2{background:var(--mu)}
.ap-radarsvg{width:100%;max-width:340px;display:block;margin:auto}.ap-area{fill:rgba(201,166,107,.20);stroke:var(--am);stroke-width:1.8}.ap-big{font-size:22px;margin-left:8px}
.ap-calcs{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.ap-calcs label,.ap-form label{display:block;font-size:12px;color:var(--mu);margin-bottom:8px}.ap-calcs input,.ap-form input,.ap-form select,.ap-form textarea{display:block;width:100%;margin-top:4px}
.ap-res{font-size:13px;margin:8px 0 0}.ap-res b{font-size:16px}.ap-fgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0 12px}
.ap-teses-head{justify-content:space-between}.ap-tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.ap-tese header{display:flex;justify-content:space-between;align-items:center}.ap-tese h4{cursor:pointer;display:flex;gap:6px;align-items:center}.ap-tese ul{margin:6px 0;padding-left:18px;font-size:12.5px}
.ap-tese-actions{margin-top:10px;padding-top:10px;border-top:1px solid var(--ln)}.ap-tese-actions .ap-del{margin-left:auto}
.ap-prog{height:5px;background:var(--b2);border-radius:3px;overflow:hidden}.ap-prog i{display:block;height:100%;background:var(--am);border-radius:3px}
.ap-del{color:var(--r)!important;border-color:rgba(248,113,113,.3)!important}
html[data-v427-tema=claro] .ap-del{color:#B91C1C!important;border-color:rgba(185,28,28,.3)!important}
.ap-q{display:inline-grid;place-items:center;width:15px;height:15px;margin-left:5px;border-radius:50%;border:1px solid var(--mu);background:transparent;color:var(--mu);font-size:10px;font-weight:700;line-height:1;cursor:pointer;padding:0;vertical-align:middle;text-transform:none}
.ap-q:hover{border-color:var(--am);color:var(--am)}.ap-t th .ap-q{position:relative}
.ap-qbox{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px}
.ap-qcard{background:var(--b);border:1px solid var(--ln);border-radius:8px;max-width:440px;width:100%;padding:18px;max-height:80vh;overflow:auto}.ap-qcard header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.ap-qcard h4{margin:0;font-size:15px}
.ap-qcard p,.ap-glos p{margin:8px 0;font-size:13px;line-height:1.55}.ap-qcard p b,.ap-glos p b{display:block;color:var(--am);font-size:11px;text-transform:uppercase;letter-spacing:.04em}
.ap-glos details{border-top:1px solid var(--ln);padding:8px 0}.ap-glos summary{cursor:pointer;font-weight:600;font-size:13px;min-height:32px;display:flex;align-items:center}.ap-passos{font-size:13px;line-height:1.7;padding-left:20px}
#ap-root button.ap-q,#ap-root span.ap-q{all:unset;box-sizing:border-box;display:inline-flex!important;align-items:center;justify-content:center;width:14px!important;height:14px!important;min-height:0!important;min-width:0!important;margin:0 0 0 4px!important;padding:0!important;border:1px solid currentColor!important;border-radius:50%!important;background:transparent!important;box-shadow:none!important;color:var(--mu)!important;font:700 9px/1 system-ui,sans-serif!important;cursor:pointer;vertical-align:1px;opacity:.45;transition:opacity .15s,color .15s}
#ap-root .ap-t th button.ap-q{opacity:.28}
#ap-root .ap-t th:hover button.ap-q,#ap-root button.ap-q:hover{opacity:1!important;color:var(--am)!important}
#ap-root .ap-t th{white-space:nowrap;vertical-align:middle;text-align:left}#ap-root .ap-t th.ap-n,#ap-root .ap-t td.ap-n{text-align:right!important}#ap-root .ap-t th.ap-c,#ap-root .ap-t td.ap-c{text-align:center!important}
#ap-root .ap-t td{text-align:left;vertical-align:middle}#ap-root .ap-t td.ap-up{text-align:left!important}
#ap-root .ap-nota{width:30px;height:30px;font-size:10.5px}
#ap-root .ap-bar .btn,#ap-root .ap-bar select,#ap-root .ap-cols>summary{min-height:34px!important;height:34px;padding:0 10px!important;font-size:12.5px!important;line-height:32px;width:auto!important;flex:0 0 auto}
#ap-root .ap-bar .ap-busca{flex:1 1 160px;min-height:34px;height:34px}
#ap-root .ap-leg{font-size:11px;line-height:1.4}
@media(max-width:900px){
 .ap-qbox{align-items:flex-end;padding:0}.ap-qcard{max-width:none;border-radius:10px 10px 0 0;padding-bottom:calc(16px + env(safe-area-inset-bottom))}
 .ap-rank,.ap-2,.ap-2w,.ap-rotgrid,.ap-hero{grid-template-columns:minmax(0,1fr)}
 .ap-filtros details{position:static}.ap-filtros details:not([open]){padding:10px 12px}
 .ap-mpresets{display:flex}
 .ap-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ap-hk{gap:18px}
 .ap-acoes-sec{display:grid;grid-template-columns:1fr 1fr;gap:8px}
 .ap input,.ap select,.ap textarea{font-size:16px}.ap-cols>div{width:280px}
 .ap-justo-tg{margin-left:0}
 #ap-root .ap-bar .ap-busca{font-size:16px}#ap-root .ap-leg,.ap-desk-only{display:none}
 #ap-root .ap-t td.ap-stk{min-width:120px}#ap-root .ap-stk small{max-width:120px}#ap-root .ap-t td,#ap-root .ap-t th{padding:6px 8px}
}
@media(max-width:767px){
 .ap-mcards{display:flex}.ap-rank .ap-scroll,.ap-seg,.ap-cols{display:none}
 .ap-hero{padding:14px}.ap-hero h2{font-size:24px}.ap-hk b{font-size:19px}
 .ap-lista-empty{flex-direction:column;align-items:flex-start;gap:4px}
}
`;d.head.appendChild(s)}

function briefing(){
 if(!st.rows)return null;
 aplicaProfit();
 const rows=st.rows.rows.filter(r=>r.preco>0);
 const risco=r=>(r.div_liq_ebitda!=null&&r.div_liq_ebitda>3.5)||(r.momentum!=null&&r.momentum<-10&&r.div_liq_ebitda!=null&&r.div_liq_ebitda>2);
 const margem=r=>r.justo&&r.preco?(r.justo/r.preco-1)*100:null;
 const liqOk=rows.filter(r=>r.liquidez==null||r.liquidez>=5e5);
 const pool=liqOk.length>=6?liqOk:rows;
 const avaliar=pool.filter(r=>!risco(r)&&r.nota!=null).map(r=>({r,m:margem(r),sc:(r.nota||0)*25+Math.max(-30,Math.min(80,margem(r)||0))*.35+(r.dy>6?8:0)+(r.roe>15?8:0)}))
  .sort((a,b)=>b.sc-a.sc).slice(0,4).map(({r,m})=>({
   ticker:r.ticker,empresa:r.empresa,setor:r.setor,preco:r.preco,nota:r.nota,pl:r.pl,dy:r.dy,roe:r.roe,dl:r.div_liq_ebitda,margem:m,
   motivo:['Nota '+fmt(r.nota,2)+'/4',r.pl>0?'P/L '+fmt(r.pl,1)+'x':null,r.roe!=null?'ROE '+pct(r.roe):null,r.dy>0?'DY '+pct(r.dy):null,m!=null&&m>0?'Margem '+sinal(m,0):null].filter(Boolean).join(' · ')
  }));
 const cautela=pool.filter(r=>risco(r)||(margem(r)!=null&&margem(r)<-35)).sort((a,b)=>(b.div_liq_ebitda??0)-(a.div_liq_ebitda??0)).slice(0,4).map(r=>{
  const m=margem(r),raz=[];
  if(r.div_liq_ebitda!=null&&r.div_liq_ebitda>3.5)raz.push('DL/EBITDA '+fmt(r.div_liq_ebitda,1)+'x (alavancagem elevada)');
  else if(r.momentum!=null&&r.momentum<-10&&r.div_liq_ebitda>2)raz.push('Queda '+sinal(r.momentum,0)+' com DL/EBITDA '+fmt(r.div_liq_ebitda,1)+'x');
  if(m!=null&&m<-35)raz.push('Preço '+fmt(Math.abs(m),0)+'% acima do justo médio');
  if(!raz.length)raz.push('Sinal de risco fundamentalista');
  return {ticker:r.ticker,empresa:r.empresa,setor:r.setor,preco:r.preco,nota:r.nota,dl:r.div_liq_ebitda,margem:m,motivo:raz.join(' · ')};
 });
 const rotLin=st.rot?.s?Object.entries(st.rot.s).filter(([,o])=>o['1M']!=null).sort((a,b)=>b[1]['1M']-a[1]['1M']):[];
 const setoresFortes=rotLin.slice(0,3).map(([s,o])=>({setor:s,m1:o['1M']}));
 const setoresFracos=rotLin.slice(-3).reverse().map(([s,o])=>({setor:s,m1:o['1M']}));
 const alta=pool.filter(r=>(r.momentum!=null&&r.momentum>0)&&(r.mm200==null||r.mm200>-2)&&(r.rsi==null||r.rsi<72))
  .sort((a,b)=>((b.momentum||0)+(b.mm200||0)*.5)-((a.momentum||0)+(a.mm200||0)*.5)).slice(0,4).map(r=>({
   ticker:r.ticker,empresa:r.empresa,setor:r.setor,preco:r.preco,momentum:r.momentum,mm200:r.mm200,rsi:r.rsi,
   motivo:[r.momentum!=null?'Momentum '+sinal(r.momentum,1):null,r.mm200!=null?'MM200 '+sinal(r.mm200,1):null,r.rsi!=null?'RSI '+fmt(r.rsi,0):null].filter(Boolean).join(' · ')
  }));
 const tecAlertas=pool.filter(r=>(r.rsi!=null&&(r.rsi>=70||r.rsi<=35))||(r.mm200!=null&&(r.mm200>=28||r.mm200<=-12))||(r.momentum!=null&&r.momentum<=-15))
  .sort((a,b)=>Math.abs(b.mm200??b.momentum??0)-Math.abs(a.mm200??a.momentum??0)).slice(0,4).map(r=>{
   const tag=r.rsi!=null&&r.rsi>=70?'Sobrecomprado (RSI '+fmt(r.rsi,0)+')':r.rsi!=null&&r.rsi<=35?'Sobrevendido · possível repique (RSI '+fmt(r.rsi,0)+')':r.mm200!=null&&r.mm200>=28?'Esticado acima da MM200 ('+sinal(r.mm200,0)+')':'Tendência fraca ('+(r.momentum!=null?'Mom '+sinal(r.momentum,0):'MM200 '+sinal(r.mm200,0))+')';
   return {ticker:r.ticker,empresa:r.empresa,setor:r.setor,preco:r.preco,momentum:r.momentum,mm200:r.mm200,rsi:r.rsi,motivo:tag};
  });
 return {total:rows.length,ref:st.ref,graham:{avaliar,cautela,setoresFortes,setoresFracos},livermore:{alta,alertas:tecAlertas}};
}
function avaliarAtivo(tk){
 if(!st.rows)return null;
 aplicaProfit();
 const clean=String(tk||'').trim().toUpperCase();
 const r=st.rows.rows.find(x=>String(x.ticker||'').toUpperCase()===clean);
 if(!r)return null;
 const mg=r.justo&&r.preco?(r.justo/r.preco-1)*100:null;
 // Graham — Fundamentalista
 let gPts=0;const gFatos=[];
 if(r.nota!=null){gFatos.push('Nota '+fmt(r.nota,2)+'/4');gPts+=r.nota>=2.6?2:r.nota>=1.8?1:-1}
 if(r.pl>0){gFatos.push('P/L '+fmt(r.pl,1)+'x');gPts+=r.pl<=12?1:r.pl>25?-1:0}
 if(r.roe!=null){gFatos.push('ROE '+pct(r.roe));gPts+=r.roe>=15?1:r.roe<8?-1:0}
 if(r.dy>0){gFatos.push('DY '+pct(r.dy));if(r.dy>=6)gPts+=1}
 if(mg!=null){gFatos.push((mg>=0?'Margem +':'Acima do justo ')+fmt(Math.abs(mg),0)+'%');gPts+=mg>=10?1:mg<-20?-1:0}
 if(r.div_liq_ebitda!=null){gFatos.push('DL/EBITDA '+fmt(r.div_liq_ebitda,1)+'x');if(r.div_liq_ebitda>3.5)gPts-=2}
 const gVer=gPts>=3?'Favorável':gPts<=0?'Cautela':'Neutro';
 // Livermore — Técnico
 let lPts=0;const lFatos=[];
 if(r.mm200!=null){lFatos.push('MM200 '+sinal(r.mm200,1));lPts+=r.mm200>0&&r.mm200<25?1:r.mm200<=-8||r.mm200>=30?-1:0}
 if(r.momentum!=null){lFatos.push('Momentum '+sinal(r.momentum,1));lPts+=r.momentum>2?1:r.momentum<-10?-1:0}
 if(r.rsi!=null){lFatos.push('RSI '+fmt(r.rsi,0));lPts+=r.rsi>=45&&r.rsi<=68?1:r.rsi>=72||r.rsi<=30?-1:0}
 const lVer=lPts>=2?'Favorável':lPts<=-1?'Cautela':'Neutro';
 // Munger — Riscos ocultos
 const riscos=[];
 if(r.div_liq_ebitda!=null&&r.div_liq_ebitda>3)riscos.push('Alavancagem alta (DL/EBITDA '+fmt(r.div_liq_ebitda,1)+'x) pressiona em juros elevados.');
 if(mg!=null&&mg<-15)riscos.push('Negocia '+fmt(Math.abs(mg),0)+'% acima do justo médio — margem de segurança comprimida.');
 if(r.momentum!=null&&r.momentum<-10)riscos.push('Queda recente ('+sinal(r.momentum,0)+') pode esconder deterioração operacional ("faca caindo").');
 if(r.rsi!=null&&r.rsi>=70)riscos.push('RSI esticado ('+fmt(r.rsi,0)+') aumenta risco de realização no curto prazo.');
 if(r.liquidez!=null&&r.liquidez<5e5)riscos.push('Liquidez diária reduzida pode dificultar saída sem spread.');
 if(r.roe!=null&&r.roe<10)riscos.push('Retorno sobre patrimônio baixo (ROE '+pct(r.roe)+') abaixo do custo de capital.');
 if(!riscos.length)riscos.push('Sem alertas numéricos críticos nos dados carregados — valide governança e fatos relevantes antes de decidir.');
 const mVer=riscos.length>=3?'Cautela':riscos.length===2?'Neutro':'Favorável';
 const votos=[gVer,lVer,mVer];
 const fav=votos.filter(v=>v==='Favorável').length,cau=votos.filter(v=>v==='Cautela').length,neu=votos.filter(v=>v==='Neutro').length;
 const resumo=fav>=2?'Consenso construtivo ('+fav+'/3 favoráveis), mas valide riscos com Munger e fatos relevantes.':cau>=2?'Conselho em modo defensivo ('+cau+'/3 em cautela) — exige margem de segurança extra.':'Visões divididas no Conselho — bom caso para aprofundar antes de alocar.';
 const fearSetting={
  definir:riscos[0],
  prevenir:r.mm200!=null&&r.mm200<0?'Aguardar retomada da tendência ou entrar com posição fracionada e stop técnico definido.':'Definir stop/invalidação antes da entrada e limitar o peso na carteira.',
  reparar:'Se a tese ou suporte quebrar, encerrar sem fazer preço médio para trás e revisar o diário antes do próximo aporte.',
  inacao:mg!=null&&mg>15?'Custo da inação: ficar paralisado pode fazer perder uma margem de segurança de '+fmt(mg,0)+'% — se o risco é temporário e limitado, teste com mão pequena.':'Evitar negação otimista: só aja com assimetria clara entre ganho provável e perda limitada.'
 };
 return {
  ticker:r.ticker,empresa:r.empresa,setor:r.setor,preco:r.preco,nota:r.nota,margem:mg,
  graham:{veredito:gVer,pts:gPts,fatos:gFatos},
  livermore:{veredito:lVer,pts:lPts,fatos:lFatos},
  munger:{veredito:mVer,riscos:riscos.slice(0,3)},
  fearSetting,
  aurea:{fav,neu,cau,resumo}
 };
}
function dueloAtivos(t1,t2){
 const a=avaliarAtivo(t1),b=avaliarAtivo(t2);
 if(!a||!b)return null;
 const win=(x,y)=>x>y?a.ticker:y>x?b.ticker:'Empate';
 let mkNota='Compare peso setorial na sua Carteira antes de escolher.';
 try{
  const calc=typeof w.carCalc==='function'?w.carCalc():null;
  const pos=[...(calc?.BR?.pos||[]),...(calc?.US?.pos||[])];
  if(pos.length){
   const pesoSetor=sec=>pos.filter(p=>String(p.setor||'').toLowerCase()===String(sec||'').toLowerCase()).reduce((s,p)=>s+(Number(p.peso)||0),0);
   const pa=pesoSetor(a.setor),pb=pesoSetor(b.setor);
   const jaA=pos.some(p=>String(p.tk||'').toUpperCase()===a.ticker),jaB=pos.some(p=>String(p.tk||'').toUpperCase()===b.ticker);
   if(pa!==pb)mkNota=(pa<pb?a.ticker:b.ticker)+' diversifica melhor sua carteira ('+a.setor+': '+fmt(pa,1)+'% vs '+b.setor+': '+fmt(pb,1)+'%).';
   else if(jaA!==jaB)mkNota=(jaA?b.ticker:a.ticker)+' traz um ativo novo que ainda não está na sua carteira.';
   else mkNota='Ambos têm exposição parecida na sua carteira atual ('+fmt(pa,1)+'%).';
  }
 }catch(_){}
 return {a,b,vencedorGraham:win(a.graham.pts,b.graham.pts),vencedorLivermore:win(a.livermore.pts,b.livermore.pts),markowitz:mkNota};
}
async function garantirDados(){await carregar();return briefing()}

w.DiarioAnalisesPlus={view,enter,abrir,briefing,avaliarAtivo,dueloAtivos,garantirDados,TABS:['rankpro','radar','teses','guia','ativo']};
})(window,document);
