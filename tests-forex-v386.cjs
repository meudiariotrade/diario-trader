'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=__dirname,read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');let count=0;
const test=(name,fn)=>{fn();console.log('OK',name);count++};
class E{
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attrs={};this.style={setProperty(){}};this.className='';this.classList={add:n=>{this.className+=' '+n},remove:n=>{this.className=this.className.replace(' '+n,'')}};this.textContent='';this.complete=true;this.naturalWidth=128;}
 append(...c){this.children.push(...c)}
 setAttribute(k,v){this.attrs[k]=v}
}
class ImmediateImage{constructor(){this.complete=false;this.naturalWidth=0}set src(url){this.url=url;this.complete=true;this.naturalWidth=128;this.onload?.()}get src(){return this.url}}
const doc={readyState:'loading',createElement:t=>new E(t),addEventListener(){},getElementById(){return null}};
const hooks=[];const win={document:doc,Image:ImmediateImage,TraderUI:{onRender:(id,fn)=>hooks.push(id),onSheet:(id,fn)=>hooks.push(id)},requestIdleCallback(){},requestAnimationFrame(){}};
vm.runInNewContext(read('identidade-ativos-v386.js'),{window:win,document:doc,console});
const api=win.TraderAssetIdentity;
test('Reconhece todas as combinações entre códigos de moedas suportados',()=>{
 const pairs=['USDCAD','AUDCAD','AUDUSD','USDJPY','EURUSD','GBPJPY','EURCHF','USDCHF','USDBRL','EURBRL','NZDUSD','USDMXN','USDCNH','USDCNY','USDSGD','EURGBP','CHFJPY','ZARJPY','USDINR','USDKRW','USDTRY','USDAED','EURPLN','USDSEK','CADCHF','AUDNZD','NOKSEK','USDTWD'];
 for(const p of pairs){let r=api.resolve(p);assert.equal(r.group,'moeda',p);assert(r.pair?.baseCountry&&r.pair.quoteCountry,p);assert(api.currencyPair(p),p)}
 assert.equal(api.currencyPair('USD/CAD').base,'USD');assert.equal(api.currencyPair('AUD-CAD').quote,'CAD');assert.equal(api.currencyPair('OANDA:EURUSD').quote,'USD');
});
test('Bandeiras do par seguem a ordem base/cotação mesmo se invertido',()=>{
 const a=api.resolve('USDCAD').pair,b=api.resolve('CADUSD').pair;
 assert.equal(a.baseCountry,'US');assert.equal(a.quoteCountry,'CA');assert.equal(b.baseCountry,'CA');assert.equal(b.quoteCountry,'US');
 assert.equal(api.fromLabel('USD/CAD'),'USD/CAD');
});
test('Não confunde dólar índice, petróleo, bitcoin, ouro, futuros ou tickers acionários',()=>{
 for(const p of ['DXY','USOUSD','XAUUSD','XAGUSD','BTCUSD','ETHUSD','US100','US500','WIN','WDO','QQQ','SPY','USDUSD','EURAAA','AAABRL']){
  assert.equal(api.currencyPair(p),null,p);
 }
 assert.equal(api.resolve('BTCUSD').group,'cripto');assert.equal(api.resolve('XAUUSD').group,'commodity');
 assert.equal(api.resolve('USDUSD').group,'moeda'); // fallback antigo, mas sem duas bandeiras falsas
});
test('Rejeita separadores inválidos, código forjado e HTML',()=>{
 for(const input of ['USDC-AD','USD/CADA','USD/CD','CAD-AUD-USD','<svg>','https://example.org/USDCAD', 'USDCAD'.repeat(500)])assert.equal(api.currencyPair(input),null,input)
});
test('Avatar de câmbio tem 2 círculos com imagens locais, ticker e identificação',()=>{
 const a=api.avatar('AUDCAD');assert.equal(a.dataset.pairBase,'AUD');assert.equal(a.dataset.pairQuote,'CAD');assert(a.className.includes('ta-pair'));
 assert.equal(a.children.length,3);const parts=a.children.slice(1);assert.equal(parts[0].children[0].textContent,'AUD');assert.equal(parts[1].children[0].textContent,'CAD');
 assert(parts[0].children[1].src.endsWith('/au.png'));assert(parts[1].children[1].src.endsWith('/ca.png'));
 assert.equal(a.attrs['aria-hidden'],'true');assert(a.title.includes('AUDCAD'));
});
test('Fallback sem imagens preserva dois códigos e impede dependência externa',()=>{
 const x=api.avatar('USDJPY',{real:false});assert.equal(x.children[1].children.length,1);assert.equal(x.children[2].children.length,1);
 assert.equal(x.children[1].children[0].textContent,'USD');assert.equal(x.children[2].children[0].textContent,'JPY');
});
test('Canvas representa as duas bandeiras ao exportar imagem/PDF',()=>{
 let drawn=0,saves=0,restores=0;const ctx={save(){saves++},restore(){restores++},beginPath(){},arc(){},clip(){},drawImage(){drawn++}};
 assert(api.draw(ctx,'USDCAD',1,2,34));assert.equal(drawn,2);assert.equal(saves,restores);
});
test('Estilos asseguram dois círculos sobrepostos sem cobrir preços',()=>{
 const css=read('identidade-ativos-v386.css');for(const t of ['.ta-avatar.ta-pair','.ta-fx-half.ta-fx-quote','z-index:2','.ta-fx-half.ta-has-flag .ta-fx-img'])assert(css.includes(t),t)
});
test('Bandeiras estão contidas no próprio ZIP e com assinatura PNG válida',()=>{
 const map=JSON.parse(read('currency-symbols-v385.json'));let codes=Object.keys(map),countries=[...new Set(Object.values(map))];assert(codes.length>=50);assert(countries.length>=50);
 for(const c of countries){const file=path.join(ROOT,'logos/fx',c.toLowerCase()+'.png'),buf=fs.readFileSync(file);assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a',file);assert(buf.byteLength>450);}
});
test('PWA oferece bandeiras centrais offline e outras sob demanda com cache',()=>{
 const sw=read('sw.js');assert(sw.includes('diario-v386-mercado-identidade-01'));for(const f of ['us','ca','au','eu','gb','jp','br'])assert(sw.includes('"logos/fx/'+f+'.png"'),f);
 assert(sw.includes('const EXTRA='));assert(sw.includes('"logos/fx/eg.png"'));
});
test('Site carrega o módulo e mantém o tema do Terminal corrigido',()=>{
 const html=read('index.html');assert(html.includes('identidade-ativos-v386.js?v=386'));assert(html.includes('identidade-ativos-v386.css?v=386'));assert(html.includes('terminal-mobile-v385.css?v=386'));
});
test('Múltiplos parênteses e siglas em rótulos não criam logos não autorizados',()=>{
 assert.equal(api.currencyPair('DÓLAR / REAL'),null);assert.equal(api.currencyPair('XAU/USD'),null);assert.equal(api.currencyPair('USD/BRL').quote,'BRL');
});
console.log('\n'+count+'/'+count+' testes de pares cambiais v386 aprovados.');
