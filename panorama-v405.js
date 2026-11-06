/* Diário de Trader · Mercado Panorama v405.
   Exibe somente dados conhecidos da fonte macro/mercado já conectada.
   Não altera persistência, as consultas ou a execução no Profit Pro. */
(()=>{'use strict';
const doc=document;
const rootSel='#app .dt395-native-mercado';
const state={deep:false,refreshing:false};
const els=(parent,sel)=>Array.from(parent?.querySelectorAll(sel)||[]);
const el=(tag,cls,content)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=content;return n};
const finite=x=>(x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x)))?Number(x):null;
const fmt=(v,max=2)=>v===null?'—':new Intl.NumberFormat('pt-BR',{maximumFractionDigits:max,minimumFractionDigits:max===0?0:Math.min(2,max)}).format(v);
const pct=(v,juro)=>v===null?'—':`${v>0?'+':''}${fmt(v,juro?1:2)} ${juro?'pb':'%'}`;
const dateFmt=x=>{if(!x)return 'horário não informado';const d=typeof x==='number'?new Date(x<1e12?x*1000:x):new Date(x);if(!Number.isFinite(d.getTime()))return 'horário não informado';return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}).format(d)+' BRT'};
function source(){try{return typeof MDO!=='undefined'&&MDO?.v?MDO.v:null}catch{return null}}
function marketItems(data){const groups=data?.mercados?.grupos||[];if(!Array.isArray(groups))return [];
 return groups.flatMap(group=>Array.isArray(group?.itens)?group.itens.map(item=>({...item,grupo:String(group.g||'Mercado')})):[]).filter(i=>i&&i.s)}
const label=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
function byCodes(items,codes,patterns=[]){let found=items.find(r=>codes.includes(label(r.s)));if(!found)found=items.find(r=>patterns.some(p=>p.test(label(r.n))));return found||null}
const lookups={
 ibov:[['^BVSP','IBOV','IBOVESPA'],[/IBOVESPA/]],sp:[['^GSPC','SPX','SP500'],[/S&P.*500/]],nasdaq:[['^IXIC','^NDX','NDX','NAS100'],[/NASDAQ/]],usd:[['BRL=X','USDBRL=X','USD/BRL','USDBRL'],[/DOLAR.*REAL/,/USD.*BRL/]],
 ewz:[['EWZ'],[/EWZ/]],dxy:[['DX-Y.NYB','DXY','DX=F'],[/DOLLAR INDEX/,/DOLAR.*INDEX/]],
 spf:[['ES=F','SP500F','SPFUT','US500'],[/S&P.*FUT/,/S&P.*E-?MINI/]],nqf:[['NQ=F','USTEC','NQFUT'],[/NASDAQ.*FUT/,/NASDAQ.*E-?MINI/]],dowf:[['YM=F','DOWFUT'],[/DOW.*FUT/]],
 brent:[['BZ=F','BRENT','BRN'],[/BRENT/]],wti:[['CL=F','WTI'],[/WTI/,/PETROLEO WTI/]],gold:[['GC=F','GOLD','XAUUSD'],[/OURO/,/GOLD/]],iron:[['FE=F','IRON'],[/MINERIO/]],
 tenyear:[['^TNX','US10Y'],[/TREASURY.*10/,/10.*ANOS EUA/]],di:[['DI1','DI1F27','DI1F28','DIFUT','DI'],[/DI.*FUT/,/CURVA.*DI/]],selic:[['SELIC'],[/SELIC/]]
};
function get(items,key){const [codes,pat]=lookups[key];return byCodes(items,codes,pat)}
function status(item){if(!item||item.suspeito||finite(item.px)===null||finite(item.px)<=0)return {text:item?.suspeito?'Valor inconsistente':'Sem cotação',className:'missing'};return {text:'Com dado',className:'ready'}}
function itemRender(info={}){const {item,name,descriptor=''}=info;
 const n=el('div','m405-quote');const st=status(item);if(st.className==='missing')n.classList.add('is-missing');
 const left=el('div','m405-quote-left');const title=el('strong','m405-quote-name',name||item?.n||'Ativo');const desc=el('small','m405-quote-desc',descriptor||(item?item.s:'Fonte não disponível'));left.append(title,desc);
 const right=el('div','m405-quote-right');const val=finite(item?.px);const ok=st.className==='ready';const v=el('strong','m405-quote-value',ok?fmt(val,val>=1000?0:val>=10?2:4)+(item.juro?'%':''):'—');
 const ch=item?.juro?finite(item?.d1bp):finite(item?.d1);
 const delta=el('span','m405-quote-delta '+(ch===null||!ok?'neutral':ch>0?'up':ch<0?'down':'neutral'),ok?pct(ch,!!item.juro):st.text);
 right.append(v,delta);n.append(left,right);
 const sp=el('small','m405-quote-source');
 const infoSrc=String(item?.fonte||'').trim();const time=item?.horarioPreco||item?.em;
 sp.textContent=item?`${infoSrc||'Fonte individual não informada'} · ${dateFmt(time)}`:'Aguardando fonte conectada';
 if(!item)sp.classList.add('unavailable');n.append(sp);return n;
}
function panel(id,title,subtitle,className=''){
 const n=el('section','m405-card '+className);n.id=id;
 const h=el('header','m405-card-header');const group=el('div','m405-card-titles');group.append(el('h3','',title));if(subtitle)group.append(el('small','',subtitle));h.append(group);n.append(h);return {n,h};}
function button(label,action){const b=el('button','m405-action',label);b.type='button';b.dataset.m405Action=action;return b;}
function listTo(container,items){for(const item of items)container.append(itemRender(item));}
function headers(data,items){const sources=data?.mercados?.fontes;
 const total=sources&&Number.isFinite(+sources.tv)&&Number.isFinite(+sources.yahoo)?`${sources.tv} TradingView · ${sources.yahoo} Yahoo`:'Origem: função macro';
 const stamp=data?.mercados?.em||data?.em;return `${dateFmt(stamp)} · ${total}`;}
function build(root,mode){const unified=mode==='cq';const d=source(),a=marketItems(d),dashboard=el('section','m405-dashboard');dashboard.id='m405-panorama';dashboard.setAttribute('aria-label','Painel profissional de Panorama do Mercado');
 const hero=el('header','m405-hero');const top=el('div','m405-hero-top');const left=el('div','m405-hero-title');
 left.append(el('small','m405-eyebrow','MERCADO  /  BRASIL + EUA'));left.append(el('h2','', unified?'Cotações e panorama':'Panorama global'));left.append(el('p','', 'Um painel de consulta para acompanhar o que move a B3 e os Estados Unidos.'));
 const refresh=button('↻  Atualizar','refresh');refresh.classList.add('m405-refresh');top.append(left,refresh);hero.append(top);
 const statusbar=el('div','m405-data-status');const led=el('i',d?'has-data':'no-data');led.setAttribute('aria-hidden','true');statusbar.append(led,el('span','',d?headers(d,a):'Sem dados da fonte macro · nenhuma cotação simulada'));
 hero.append(statusbar);
 if(d?.mercados?.fontes?.suspeitos?.length)hero.append(el('small','m405-invalid','A fonte sinalizou cotações inconsistentes. Elas aparecem indisponíveis.'));
 const quick=el('div','m405-quick-ticks');[['ibov','IBOV'],['sp','S&P 500'],['nasdaq','Nasdaq'],['usd','USD/BRL']].forEach(([k,name])=>{const item=get(a,k);const box=el('div','m405-quick-item');box.append(el('small','',name));box.append(el('strong','',status(item).className==='ready'?fmt(finite(item.px),finite(item.px)>=1000?0:2):'—'));const change=item?.juro?finite(item.d1bp):finite(item?.d1);box.append(el('span','m405-tick-change '+(change===null?'neutral':change>0?'up':change<0?'down':'neutral'),status(item).className==='ready'?pct(change,!!item.juro):'Sem cotação'));quick.append(box)});hero.append(quick);
 const nav=el('nav','m405-section-nav');nav.setAttribute('aria-label','Ir para seção do panorama');[['m405-global','Radar Global'],['m405-adrs','EWZ e ADRs'],['m405-futures','Futuros'],['m405-commodities','Commodities'],['m405-rates','Juros']].forEach(([id,name])=>{const bt=button(name,'jump');bt.dataset.m405Target=id;nav.append(bt)});
 dashboard.append(hero);if(!unified)dashboard.append(nav);
 const grid=el('div','m405-grid');
 const global=panel('m405-global','Radar global','Principais bolsas, dólar e apetite ao risco','m405-global');
 listTo(global.n,[{item:get(a,'ibov'),name:'Ibovespa',descriptor:'Brasil · B3'}, {item:get(a,'sp'),name:'S&P 500',descriptor:'Estados Unidos'}, {item:get(a,'nasdaq'),name:'Nasdaq',descriptor:'Tecnologia EUA'}, {item:get(a,'dxy'),name:'DXY',descriptor:'Índice do dólar'}]);
 const adr=panel('m405-adrs','Brasil em Nova York','ETF EWZ e ADRs brasileiras','m405-adrs');
 listTo(adr.n,[{item:get(a,'ewz'),name:'EWZ',descriptor:'ETF Brasil · NYSE'}]);
 const adrSet=[['PBR','Petrobras'],['VALE','Vale'],['ITUB','Itaú'],['BBD','Bradesco'],['ABEV','Ambev'],['GGB','Gerdau'],['SID','CSN'],['SUZ','Suzano'],['BSBR','Santander'],['WEGZY','WEG']];
 const available=adrSet.map(([code,name])=>({name,item:byCodes(a,[code],[])})).filter(x=>x.item);if(available.length)listTo(adr.n,available.slice(0,6));
 else adr.n.append(el('p','m405-empty-note','As ADRs detalhadas ficam na lista conectada do Monitor. Nenhum preço será preenchido sem fonte.'));
 adr.h.append(button('Abrir lista ↗','adrs'));
 const futures=panel('m405-futures','Futuros e câmbio','Pré-mercado e sessão americana','m405-futures');
 listTo(futures.n,[{item:get(a,'spf'),name:'S&P 500 futuro',descriptor:'E-mini / contínuo'}, {item:get(a,'nqf'),name:'Nasdaq futuro',descriptor:'E-mini Nasdaq'}, {item:get(a,'dowf'),name:'Dow futuro',descriptor:'E-mini Dow'}, {item:get(a,'usd'),name:'USD/BRL',descriptor:'Câmbio spot'}]);
 const commodities=panel('m405-commodities','Commodities','Impacto sobre Vale, Petrobras e inflação','m405-commodities');
 listTo(commodities.n,[{item:get(a,'brent'),name:'Petróleo Brent'}, {item:get(a,'wti'),name:'Petróleo WTI'}, {item:get(a,'iron'),name:'Minério de ferro'}, {item:get(a,'gold'),name:'Ouro'}]);
 const rates=panel('m405-rates','Juros e curva DI','Selic, Treasuries e contratos DI','m405-rates');
 const selicBrasil=Array.isArray(d?.brasil?.ind)?d.brasil.ind.find(i=>/SELIC/i.test(label(i.nome))):null;
 const selic=selicBrasil?{s:'SELIC',n:'Selic',px:finite(selicBrasil.v),fonte:'Banco Central',horarioPreco:d?.brasil?.em,juro:true,d1bp:null}:get(a,'selic');
 listTo(rates.n,[{item:selic,name:'Selic',descriptor:'Taxa de referência'}, {item:get(a,'di'),name:'DI futuro',descriptor:'Curva de juros brasileira'}, {item:get(a,'tenyear'),name:'Treasury 10 anos',descriptor:'Juros EUA'}]);
 rates.h.append(button('Abrir curva DI ↗','rates'));
 grid.append(global.n,adr.n,futures.n,commodities.n,rates.n);
 const info=el('aside','m405-footer-note');info.append(el('strong','', 'Dados e fontes'));info.append(el('p','', 'As cotações dependem dos serviços configurados. Os horários e a origem exibidos são os informados pela fonte; não há garantia de tempo real.'));
 if(unified){
  const exp=el('details','m406-radar-details');exp.id='m406-radar-details';
  exp.open=!!state.radar;
  exp.append(el('summary','m406-radar-summary','▤  Abrir radar completo · EWZ, ADRs, futuros, commodities e juros'));
  exp.append(nav,grid,info);
  exp.addEventListener('toggle',()=>{state.radar=exp.open});
  dashboard.append(exp);
  const quote=Array.from(root.children).find(node=>node.classList?.contains('market-monitor'));
  if(quote){quote.id='m406-quotes';quote.setAttribute('aria-label','Cotações, gráficos e lista de ativos')}
  const toolbar=root.querySelector(':scope > .m403-section-header');toolbar?toolbar.after(dashboard):root.prepend(dashboard);
  root.classList.add('m405-panorama','m406-unified');root.dataset.m405Version='405-cq';return;
 }
 const deep=el('details','m405-deep');deep.open=state.deep;deep.id='m405-details';const sum=el('summary','', 'Explorar análises detalhadas, mapa de calor, setores e curva DI');deep.append(sum);
 // Guarda os componentes reais dentro do mesmo Panorama, sem repetir blocos acima.
 for(const node of [...root.children]){
  if(node===dashboard||node.classList?.contains('m403-section-header')||node.classList?.contains('m404-overview')||node.classList?.contains('m405-dashboard')||node.classList?.contains('warn'))continue;
  if(node.matches?.('.platform-area.m403-oldheading,.workbench-header.m403-oldheading,.mujump')){node.hidden=true;deep.append(node);continue}
  deep.append(node);
 }
 dashboard.append(grid,info,deep);
 const oldOverview=root.querySelector(':scope > .m404-overview');if(oldOverview)oldOverview.hidden=true;
 const toolbar=root.querySelector(':scope > .m403-section-header');toolbar?toolbar.after(dashboard):root.prepend(dashboard);
 root.classList.add('m405-panorama');root.dataset.m405Version='405';
 deep.addEventListener('toggle',()=>{state.deep=deep.open});
}
function mount(){const root=doc.querySelector(rootSel);let sub='';try{sub=typeof MKT==='object'?MKT.tab:''}catch{};
 if(!root||!['mu','cq'].includes(sub)||root.dataset.m405Version===(sub==='cq'?'405-cq':'405'))return;
 build(root,sub);
}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;try{mount()}catch(e){console.error('Panorama v405: ',e)}},95)}
if(window.TraderUI?.onRender)window.TraderUI.onRender('panorama-v405',()=>queueMicrotask(()=>{try{mount()}catch(err){console.warn('Mercado: panorama',err)}}));
function init(){const app=doc.getElementById('app');if(app){const observer=new MutationObserver(mutations=>{const changed=mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.dt395-native-mercado,.m404-overview')||n.querySelector?.('.dt395-native-mercado,.m404-overview'))));if(changed)schedule()});observer.observe(app,{childList:true,subtree:true})}schedule()}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
doc.addEventListener('click',ev=>{const target=ev.target.closest('[data-m405-action]');if(!target)return;const root=target.closest('.m405-dashboard');if(!root)return;
 ev.preventDefault();const action=target.dataset.m405Action;
 if(action==='jump'){doc.getElementById(target.dataset.m405Target)?.scrollIntoView({behavior:'smooth',block:'start'});return}
 if(action==='refresh'){
  const native=doc.querySelector(`${rootSel} [data-mdo="rf"]`);if(native){native.click()}else {try{if(typeof mdoCarrega==='function'){const task=mdoCarrega(true);Promise.resolve(task).finally(schedule)}}catch(e){console.warn('Panorama atualizar',e)}}return;
 }
 if(action==='adrs'){const native=doc.querySelector(`${rootSel} [data-market-adrs]`);if(native){native.click()}else doc.querySelector('#m406-quotes')?.scrollIntoView({behavior:'smooth',block:'start'});return}
 if(action==='rates'||action==='sectors'){
  const details=root.querySelector('.m405-deep,.m406-radar-details');if(details)details.open=true;
  const next=action==='rates'?doc.querySelector('#mujr'):doc.querySelector('[data-m404-section="Desempenho setorial"]');if(next)setTimeout(()=>next.scrollIntoView({behavior:'smooth',block:'start'}),100);
 }
 });
})();