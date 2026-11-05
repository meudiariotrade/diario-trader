'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=__dirname,read=f=>fs.readFileSync(path.join(root,f),'utf8');
let count=0;
function check(label,fn){fn();count++;console.log('OK ',label)}
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attrs={};this.style={setProperty:(k,v)=>{this.style[k]=v}};this.className='';this.classList={add:(...names)=>{this.className+=' '+names.join(' ')}};this.textContent='';this.title='';this.parent=null}
 get firstChild(){return this.children[0]||null}
 append(...children){for(const c of children){if(c.parent)c.parent.children.splice(c.parent.children.indexOf(c),1);c.parent=this;this.children.push(c)}}
 prepend(c){if(c.parent)c.parent.children.splice(c.parent.children.indexOf(c),1);c.parent=this;this.children.unshift(c)}
 before(c){this.parent?.children.splice(this.parent.children.indexOf(this),0,c);c.parent=this.parent}
 replaceWith(c){if(!this.parent)return;const ix=this.parent.children.indexOf(this);this.parent.children[ix]=c;c.parent=this.parent;this.parent=null}
 setAttribute(k,v){this.attrs[k]=v}
 querySelector(){return null}
 querySelectorAll(){return []}
}
const doc={readyState:'loading',createElement:tag=>new Element(tag),addEventListener(){},getElementById(){return null}};
const renderHooks=[],sheetHooks=[];
const win={document:doc,TraderUI:{onRender:(id,fn)=>renderHooks.push({id,fn}),onSheet:(id,fn)=>sheetHooks.push({id,fn})},requestAnimationFrame(){}};
vm.runInNewContext(read('identidade-ativos-v385.js'),{window:win,document:doc,console});
const api=win.TraderAssetIdentity;
check('API expõe identidade sem expor tokens no navegador',()=>{assert(api);assert(api.known()>=95);for(const word of ['fetch(','XMLHttpRequest','service_role','localStorage','sessionStorage','navigator.geolocation'])assert(!read('identidade-ativos-v385.js').includes(word),word)});
check('Ações Brasil preservam sua marca estilizada distinta',()=>{const a=api.resolve('PETR4'),b=api.resolve('ITSA4'),c=api.resolve('MGLU3');assert.equal(a.name,'Petrobras');assert.equal(a.mark,'P');assert.equal(b.name,'Itaúsa');assert.notEqual(a.color,b.color);assert.notEqual(c.color,b.color)});
check('Alias de ADR corresponde ao emissor e mantém classe ADR',()=>{assert.match(api.resolve('PBR').name,/Petrobras/);assert.equal(api.resolve('WEGZY','adr').group,'adr');assert.match(api.resolve('BDORY','adr').name,/Banco do Brasil/);assert.equal(api.resolve('EWZ').group,'etf')});
check('Índices, moedas, futuros e cripto classificados',()=>{for(const [t,g] of [['IBOV','indice'],['SMLL','indice'],['SPX','indice'],['DXY','moeda'],['NQ1!','futuro'],['WDOFUT','futuro'],['BTCBRL','cripto'],['ETH','cripto'],['OURO','commodity']])assert.equal(api.resolve(t).group,g,t)});
check('Contratos futuros, ETFs e ADRs preservam classe de negociação',()=>{
 for(const t of ['WIN','WDO','NQ1!','ES1!'])assert.equal(api.resolve(t).group,'futuro',t);
 for(const t of ['BOVA11','SMAL11','SPY','QQQ'])assert.equal(api.resolve(t).group,'etf',t);
 for(const t of ['PBR','VALE','ITUB','WEGZY','SID'])assert.equal(api.resolve(t).group,'adr',t);
});
check('Títulos de cotações recebem aliases corretos',()=>{assert.equal(api.fromLabel('Nasdaq futuro'),'NQ1!');assert.equal(api.fromLabel('Petróleo Brent'),'BRENT');assert.equal(api.fromLabel('Ibovespa'),'IBOV')});
check('Ticker desconhecido recebe fallback sem dependência de terceiros',()=>{const t=api.resolve('ABCD3');assert.equal(t.group,'acao');assert.equal(t.mark,'AB');assert.equal(api.resolve('ZZZ').group,'outro')});
check('Não aceita HTML, código ou valores ilimitados como ticker',()=>{for(const s of ['<img onerror=alert(1)>','https://site.tld/token','A'.repeat(400),'PBR<script>'])assert.equal(api.resolve(s),null)});
check('Avatar DOM usa apenas textContent, sem HTML injetado',()=>{const a=api.avatar('PETR4');assert.equal(a.children[0].textContent,'P');assert(a.title.includes('Petrobras'));assert.equal(a.attrs['aria-hidden'],'true');assert.equal(a.dataset.group,'acao')});
check('Renderizador canvas desenha símbolo e restaura estado',()=>{const ops=[];const ctx={save:()=>ops.push('save'),restore:()=>ops.push('restore'),beginPath:()=>{},arc:()=>ops.push('arc'),fill:()=>ops.push('fill'),stroke:()=>{},fillText:(text)=>ops.push('text:'+text)};assert(api.draw(ctx,'BTC',10,20,30));assert.deepEqual(ops.slice(0,2),['save','arc']);assert(ops.includes('text:₿'));assert.equal(ops.at(-1),'restore');assert.equal(api.draw(ctx,'<svg>',10,20,30),false)});
check('Adaptador registra hooks de render e sheet',()=>{assert(renderHooks.some(h=>h.id==='identidade-ativos-v385'));assert(sheetHooks.some(h=>h.id==='identidade-ativos-v385'))});
check('ADR renderizada recebe avatar sem apagar ticker, nome nem preço',()=>{
 const quote=new Element('article');quote.dataset.adrSymbol='PBR';const head=new Element('div');const title=new Element('b');title.textContent='PBR';const subtitle=new Element('small');subtitle.textContent='Petrobras';head.append(title,subtitle);
 quote.querySelector=s=>s==='.adr-quote-heading > div:first-child'?head:null;
 const scope={querySelectorAll:selector=>selector.startsWith('.adr-quote')?[quote]:[]};api.decorate(scope);
 assert.equal(quote.dataset.taDone,'1');assert.equal(head.children[0].dataset.group,'adr');assert.equal(head.children[1].children[0],title);assert.equal(head.children[1].children[1],subtitle);
});
check('Lista de cotações troca somente ícone, preservando dados',()=>{
 const row=new Element('div'),original=new Element('span'),parent=new Element('div');parent.append(original);
 const fav=new Element('button');fav.dataset.cqfav='VALE3';row.querySelector=s=>s==='[data-cqfav]'?fav:s==='.cqi'?original:null;
 const scope={querySelectorAll:selector=>selector.startsWith('.cqr')?[row]:[]};api.decorate(scope);
 assert.equal(row.dataset.taDone,'1');assert.equal(parent.children[0].title.includes('Vale'),true);
});
check('Prévia HTML de relatório individual recebe símbolo sem alterar título',()=>{
 const title=new Element('h3');title.textContent='Relatório individual · PETR4';
 const scope={querySelectorAll:selector=>selector.startsWith('.pfrh h3')?[title]:[]};api.decorate(scope);
 assert.equal(title.dataset.taDone,'1');assert.equal(title.children[0].dataset.group,'acao');assert.equal(title.textContent,'Relatório individual · PETR4');
});
check('Jornal com ticker conhecido recebe avatar; títulos genéricos ficam intactos',()=>{
 const title=new Element('h2');title.textContent='PETR4 divulga resultados';
 const generic=new Element('h2');generic.textContent='Mercado abre em alta';
 const scope={querySelectorAll:selector=>selector.startsWith('.jrart .jrtit')?[title,generic]:[]};api.decorate(scope);
 assert.equal(title.dataset.taDone,'1');assert.equal(title.children[0].dataset.group,'acao');assert.equal(generic.children.length,0);
});
check('App carrega CSS e JS no fim, sem script inline',()=>{const html=read('index.html');assert(html.includes('identidade-ativos-v385.css?v=385'));assert(html.includes('<script defer src="identidade-ativos-v385.js?v=385"'));assert(html.indexOf('interface.js?v=385')<html.indexOf('identidade-ativos-v385.js?v=385'))});
check('SW pré-cache inclui ambos arquivos e versão própria',()=>{const sw=read('sw.js');assert(sw.includes('diario-v385-'));for(const f of ['identidade-ativos-v385.js','identidade-ativos-v385.css'])assert(sw.includes('"'+f+'"'))});
check('Panorama e feriado utilizam símbolos apenas no desenho',()=>{const app=read('app.js'),interfaceJS=read('interface.js');assert(app.includes('TraderAssetIdentity?.draw(n,"EWZ"'));assert(app.includes('TraderAssetIdentity?.draw(n,Pt.s'));assert(interfaceJS.includes('TraderAssetIdentity?.draw(ctx,l.loc'));assert(app.includes('const APP_VER="v385"'))});
check('B3 usa endereço documentado para a logo real',()=>{
 const x=api.logoInfo('PETR4'); assert.equal(x.issuer,'PETR4');assert.equal(x.url,'https://icons.brapi.dev/icons/PETR4.svg');
 assert.equal(api.logoInfo('VALE3').issuer,'VALE3');assert.equal(api.logoInfo('ITUB4').issuer,'ITUB4');
});
check('ADRs apontam para o emissor brasileiro correto',()=>{
 assert.equal(api.logoInfo('PBR').issuer,'PETR3');assert.equal(api.logoInfo('PBR.A').issuer,'PETR4');
 assert.equal(api.logoInfo('WEGZY').issuer,'WEGE3');assert.equal(api.logoInfo('VALE').issuer,'VALE3');
});
check('Índices e futuros não recebem logo corporativa indevida',()=>{
 for(const s of ['IBOV','DXY','SPX','NQ1!','WIN','WDO','BRENT','BTC','ZZZZ3'])assert.equal(api.logoInfo(s),null,s);
});
check('Avatar corporativo inclui imagem sob demanda e mantém fallback',()=>{
 const x=api.avatar('VALE3');assert(x.children.some(y=>y.tagName==='img'&&y.src.endsWith('/VALE3.svg')));
 assert(x.children.some(y=>y.className==='ta-mark'));
 assert.equal(x.dataset.logoProvider,'brapi.dev');
});
check('Avatar com opção real=false não consulta imagens externas',()=>{
 const x=api.avatar('PETR4',{real:false});assert.equal(x.children.length,1);
});
check('Marcas americanas reais são obtidas localmente sem token',()=>{
 const names=['AAPL','MSFT','NVDA','GOOG','GOOGL','AMZN','TSLA','META','NFLX','AMD','INTC','V','UBER','ABNB','PYPL','SPOT','MA','QCOM','SHOP'];
 for(const ticker of names){const logo=api.logoInfo(ticker);assert(logo&&logo.local&&logo.provider==='pacote-local',ticker);
  assert(logo.url.startsWith('logos/us/'),ticker);assert(fs.existsSync(path.join(root,logo.url)),ticker);}
 assert.equal(api.logoInfo('SPY'),null);assert.equal(api.logoInfo('QQQ'),null);
});
check('SVGs reais foram rasterizados em PNG, cada um com formato íntegro',()=>{
 for(const asset of fs.readdirSync(path.join(root,'logos/us'))){
  const png=fs.readFileSync(path.join(root,'logos/us',asset));assert.equal(png.slice(0,8).toString('hex'),'89504e470d0a1a0a',asset);}
});
check('Capturas PDF priorizam logotipos locais e mantêm fallback para remoto',()=>{
 const css=read('identidade-ativos-v385.css');assert(css.includes('#pdfbody .ta-avatar:not([data-logo-local="1"])'));
 const app=read('app.js');assert(app.includes('readyForExport?.(o.root)'));assert(app.includes('readyForExport?.(document.getElementById("pdfbody"))'));
 assert(app.includes('embedPng(await reply.arrayBuffer())'));assert(app.includes('t.assetLogo&&t.pg.drawImage'));
});
check('PDF profissional de carteira incorpora imagem por ativo quando local',()=>{
 const source=read('interface.js');assert(source.includes('const pdfIssuerMarks=new Map()'));
 assert(source.includes('if(issuerMark)p.pg.drawImage(issuerMark'));
 assert(source.includes('p.doc.embedPng(await response.arrayBuffer())'));
});
check('Service Worker mantém offline os logotipos americanos',()=>{
 const sw=read('sw.js');for(const slug of ['apple','microsoft','nvidia','google','amazon','tesla','meta','netflix','amd','intel','visa','uber','airbnb','paypal','spotify','mastercard','qualcomm','shopify'])assert(sw.includes('"logos/us/'+slug+'.png"'));
});
console.log('\n'+count+'/'+count+' testes de identidade v385 aprovados.');
