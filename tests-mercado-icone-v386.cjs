/* Verifica o HTML que o Mercado realmente entrega no primeiro desenho, sem depender de MutationObserver. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const app=fs.readFileSync(__dirname+'/app.js','utf8');
const start=app.indexOf('cqLinha=function(t,e){');
const end=app.indexOf('};function cqMapa',start);
assert(start>0&&end>start,'Componente real de cotação não localizado');
const snippet=app.slice(start,end+2);
let assertions=0;
function runIdentity(source,identity){
 const ctx={
  cqLinha:null, CQ_COR:{eua:'#3ba0b2',moeda:'#267f6d'},
  cqPf:()=>null,cqEhFav:()=>false,cqAls:()=>[],
  cqNum:v=>String(v),cotacaoReferencia:()=>'',
  esc:value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),
  cls:()=>'', window:{TraderAssetIdentity:identity}
 };
 vm.runInNewContext(snippet,ctx);
 return ctx.cqLinha(source,source._aba||'eua');
}
const icon={avatar:symbol=>({classList:{add(v){this.classes=v}},outerHTML:`<span class="ta-avatar cqi" data-test="${symbol}"><img src="logos/us/apple.png"></span>`})};
const a=runIdentity({s:'NASDAQ:AAPL',c:'AAPL',n:'Apple',_aba:'eua',px:200,d1:1},icon);
assert.match(a,/data-ta-done="1"/);assert.match(a,/data-test="NASDAQ:AAPL"/);assert.match(a,/logos\/us\/apple.png/);assert.match(a,/>AAPL</);assert.match(a,/>200</);assertions++;
const b=runIdentity({s:'FX_IDC:USDBRL',c:'USD\/BRL',n:'Dólar americano',_aba:'moeda',px:5.3,d1:-.2}, {avatar:s=>({classList:{add(){}},outerHTML:`<span class="ta-avatar ta-pair cqi" data-test="${s}"><img src="logos/fx/us.png"><img src="logos/fx/br.png"></span>`})});
assert.match(b,/FX_IDC:USDBRL/);assert.match(b,/ta-pair/);assert.match(b,/logos\/fx\/us.png/);assert.match(b,/logos\/fx\/br.png/);assert.match(b,/>5\.3</);assertions++;
const c=runIdentity({s:'NASDAQ:MSFT',c:'MSFT',n:'Microsoft',_aba:'eua',px:10,d1:0},null);
assert.match(c,/class="cqi"/);assert.doesNotMatch(c,/data-ta-done="1"/);assert.match(c,/>MSFT</);assertions++;
let count=0;
const direct={avatar:s=>{count++;return {classList:{add(){}},outerHTML:`<span class="ta-avatar cqi" data-token="${s}"></span>`}}};
for(let k=0;k<3;k++){const html=runIdentity({s:'NASDAQ:NVDA',c:'NVDA',n:'Nvidia',_aba:'eua',px:250+k,d1:2},direct);assert.match(html,/data-token="NASDAQ:NVDA"/)}
assert.equal(count,3,'A renderização deve recriar o símbolo após atualizações de preços');assertions++;
// Testar a semântica real do resolvedor de tickers com prefixos de fornecedores.
class E{constructor(t){this.tagName=t;this.className='';this.dataset={};this.children=[];this.style={setProperty(){}};this.classList={add(){}}}append(x){this.children.push(x)}setAttribute(){}}
const document={readyState:'loading',createElement:t=>new E(t),getElementById:()=>null,addEventListener(){}};
const window={document,requestAnimationFrame(){}};
vm.runInNewContext(fs.readFileSync(__dirname+'/identidade-ativos-v386.js','utf8'),{window,document});
for(const [marketTicker,expected] of [['NASDAQ:AAPL','apple.png'],['NASDAQ:MSFT','microsoft.png'],['NASDAQ:NVDA','nvidia.png'],['NASDAQ:AMZN','amazon.png']]){
 const badge=window.TraderAssetIdentity.avatar(marketTicker);assert(badge.children.some(c=>c.src?.endsWith(expected)));assertions++;
}
for(const [marketTicker,base,quote] of [['FX_IDC:USDBRL','USD','BRL'],['FX_IDC:EURBRL','EUR','BRL'],['FX_IDC:AUDUSD','AUD','USD']]){
 const badge=window.TraderAssetIdentity.avatar(marketTicker);assert.equal(badge.dataset.pairBase,base);assert.equal(badge.dataset.pairQuote,quote);assert.equal(badge.children.filter(c=>c.className?.includes('ta-fx-half')).length,2);assertions++;
}
console.log(`${assertions}/${assertions} testes do renderizador Mercado v386 aprovados.`);
