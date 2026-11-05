/* Diário de Trader v386 — identidade visual híbrida com marcas reais de empresas brasileiras.
 * Logos de emissores da B3 via CDN de imagens da brapi.dev, com fallback local seguro. Não consulta cotações nem usa chaves de API.
 * A identidade visual nunca altera preços, percentuais, fontes, eventos ou operações.
 */
(function (root) {
  'use strict';
  const d = root.document;
  if (!d || root.TraderAssetIdentity) return;
  const specs = Object.create(null);
  const define = (symbols, group, mark, color, name, market) => {
    for (const symbol of symbols.split(' ')) specs[symbol] = Object.freeze({group, mark, color, name, market});
  };
  define('IBOV IBOVESPA BOVA11', 'indice','▥','#1158aa','Ibovespa / B3','BR');
  define('SMLL SMAL11', 'indice','▥','#154a98','Índice Small Caps','BR');
  define('SPX SP500 SPY ES1! ES', 'indice','500','#ba2038','S&P 500','US');
  define('DJI DJI30 DIA', 'indice','30','#1596c1','Dow Jones','US');
  define('IXIC NDX NASDAQ QQQ NQ1! USTEC NAS100', 'indice','NQ','#1a68bc','Nasdaq','US');
  define('NIKKEI NKY', 'indice','225','#b72a49','Nikkei 225','JP');
  define('DAX GER40', 'indice','DAX','#2d6d9a','DAX 40','DE');
  define('DXY', 'moeda','$','#00876d','Índice do dólar','US');
  define('USD/BRL USDBRL WDO WDOFUT WDO1! DOLFUT', 'moeda','$','#138b6b','Dólar','BR');
  define('EURUSD EUR/USD GBPUSD GBP/USD', 'moeda','FX','#128d70','Moedas','FX');
  define('WIN WINFUT WIN1! INDFUT', 'futuro','WIN','#1c4ba0','Índice futuro','BR');
  define('EWZ', 'etf','ETF','#435fc8','ETF Brasil','US');
  define('PETR3 PETR4 PBR PBR.A PBR-A', 'acao','P','#16844e','Petrobras','BR');
  define('VALE3 VALE', 'acao','V','#008f86','Vale','BR');
  define('ITUB4 ITUB3 ITUB', 'acao','I','#f27820','Itaú','BR');
  define('ITSA3 ITSA4', 'acao','I','#00579c','Itaúsa','BR');
  define('BBDC3 BBDC4 BBD BBDO', 'acao','B','#c92e3b','Bradesco','BR');
  define('BBAS3 BDORY', 'acao','BB','#1c68ad','Banco do Brasil','BR');
  define('BBSE3 BBSEY', 'acao','BS','#1a7cae','BB Seguridade','BR');
  define('WEGE3 WEGZY', 'acao','W','#0069a9','WEG','BR');
  define('MGLU3', 'acao','M','#0474e6','Magazine Luiza','BR');
  define('SUZB3 SUZ', 'acao','S','#168f7d','Suzano','BR');
  define('GGBR3 GGBR4 GGB', 'acao','G','#2767b8','Gerdau','BR');
  define('CSNA3 SID', 'acao','C','#3779ad','CSN','BR');
  define('ABEV3 ABEV', 'acao','A','#bc3026','Ambev','BR');
  define('ELET3 ELET6 EBR EBR.B EBR-B', 'acao','E','#1e87a5','Eletrobras','BR');
  define('EMBJ3 ERJ', 'acao','E','#246abd','Embraer','BR');
  define('SANB11 BSBR', 'acao','S','#df293e','Santander','BR');
  define('SBSP3 SBS', 'acao','S','#0077ac','Sabesp','BR');
  define('BPAC11', 'acao','BT','#244267','BTG Pactual','BR');
  define('B3SA3', 'acao','B3','#135dba','B3','BR');
  define('RAIL3', 'acao','R','#e88724','Rumo','BR');
  define('RADL3', 'acao','R','#17865d','RaiaDrogasil','BR');
  define('RENT3', 'acao','R','#188769','Localiza','BR');
  define('VIVT3 VIV', 'acao','V','#5339a4','Vivo','BR');
  define('TIMS3 TIMB', 'acao','T','#1451a0','TIM','BR');
  define('POMO4', 'acao','P','#235fa1','Marcopolo','BR');
  define('BTC BTCUSD BTCBRL BTC/BRL XBTUSD', 'cripto','₿','#e89409','Bitcoin','CR');
  define('ETH ETHUSD ETHBRL ETH/BRL', 'cripto','◆','#6558c6','Ethereum','CR');
  define('SOL SOLUSD SOLBRL', 'cripto','S','#754bd0','Solana','CR');
  define('OURO GOLD XAUUSD XAU/USD GC1!', 'commodity','Au','#a97c14','Ouro','GL');
  define('BRENT BRN OIL WTI CL1! PETROLEO', 'commodity','O','#a87925','Petróleo','GL');
  define('PRATA SILVER XAGUSD', 'commodity','Ag','#7587a0','Prata','GL');
  define('MINERIO IRONORE SGX', 'commodity','Fe','#996948','Minério','GL');
  define('DIFUT DI1', 'futuro','DI','#2856a6','Juros futuros','BR');
  // Classificações específicas prevalecem sobre apelidos de índices e ações.
  define('BOVA11 SMAL11 SPY DIA QQQ', 'etf','ETF','#485ec1','ETF listado','US');
  define('ES1! ES NQ1!', 'futuro','US','#2960b4','Futuros EUA','US');
  define('WIN WINFUT WIN1! INDFUT WDO WDOFUT WDO1! DOLFUT', 'futuro','BR','#2960b4','Futuros B3','BR');
  define('PBR PBR.A PBR-A', 'adr','P','#16844e','Petrobras ADR','US');
  define('VALE', 'adr','V','#008f86','Vale ADR','US');
  define('ITUB', 'adr','I','#f27820','Itaú ADR','US');
  define('BBD BBDO', 'adr','B','#c92e3b','Bradesco ADR','US');
  define('BDORY', 'adr','BB','#1c68ad','Banco do Brasil ADR','US');
  define('BBSEY', 'adr','BS','#1a7cae','BB Seguridade ADR','US');
  define('WEGZY', 'adr','W','#0069a9','WEG ADR','US');
  define('SUZ', 'adr','S','#168f7d','Suzano ADR','US');
  define('GGB', 'adr','G','#2767b8','Gerdau ADR','US');
  define('SID', 'adr','C','#3779ad','CSN ADR','US');
  define('ABEV', 'adr','A','#bc3026','Ambev ADR','US');
  define('ERJ', 'adr','E','#246abd','Embraer ADR','US');
  define('SBS', 'adr','S','#0077ac','Sabesp ADR','US');
  define('NIKKEI DAX FTSE HSI CAC40', 'indice','▥','#2276ac','Índice global','GL');
  define('AAPL', 'acao','A','#5c6b7b','Apple','US');
  define('MSFT', 'acao','M','#3475c7','Microsoft','US');
  define('NVDA', 'acao','N','#4d982e','Nvidia','US');
  define('GOOG GOOGL', 'acao','G','#3b76bb','Alphabet','US');
  define('AMZN', 'acao','A','#b06b18','Amazon','US');
  define('TSLA', 'acao','T','#ce333b','Tesla','US');
  define('META', 'acao','M','#0866ff','Meta Platforms','US');
  define('NFLX', 'acao','N','#e50914','Netflix','US');
  define('AMD', 'acao','AMD','#ed1c24','AMD','US');
  define('INTC', 'acao','I','#0071c5','Intel','US');
  define('V', 'acao','V','#1434cb','Visa','US');
  define('UBER', 'acao','UB','#121e28','Uber','US');
  define('ABNB', 'acao','AB','#ef5365','Airbnb','US');
  define('PYPL', 'acao','PY','#1c4fa1','PayPal','US');
  define('SPOT', 'acao','SP','#1db954','Spotify','US');
  define('MA', 'acao','MA','#d94822','Mastercard','US');
  define('QCOM', 'acao','QC','#2d69a5','Qualcomm','US');
  define('SHOP', 'acao','SH','#65a53b','Shopify','US');
  const labels = {'NASDAQ FUTURO':'NQ1!','S&P 500 FUTURO':'SPX','DÓLAR (USD/BRL)':'USDBRL','DOLAR (USD/BRL)':'USDBRL','NIKKEI (JAPÃO)':'NIKKEI','DAX (ALEMANHA)':'DAX','IBOVESPA':'IBOV','BITCOIN':'BTC','BITCOIN (USD)':'BTC','BITCOIN (BRL)':'BTCBRL','ETHEREUM':'ETH','PETRÓLEO BRENT':'BRENT','MINÉRIO SGX':'MINERIO','MINÉRIO DALIAN':'MINERIO','MINI ÍNDICE':'WIN','MINI DÓLAR':'WDO','OURO':'OURO'};
  const generic=Object.freeze({
    indice:{mark:'▥',color:'#1d66ab',name:'Índice'},acao:{mark:'A',color:'#2961ac',name:'Ação'},
    adr:{mark:'AD',color:'#6846b0',name:'ADR'},etf:{mark:'ETF',color:'#5b4caa',name:'ETF'},
    moeda:{mark:'FX',color:'#00856e',name:'Câmbio'},commodity:{mark:'Co',color:'#a57628',name:'Commodity'},
    futuro:{mark:'F',color:'#2463a4',name:'Futuro'},cripto:{mark:'₿',color:'#d98b13',name:'Cripto'},
    outro:{mark:'•',color:'#47657c',name:'Ativo'}
  });
  function normalize(value){
    const raw=String(value??'').trim().toUpperCase();
    if(!raw||raw.length>32||/\s/.test(raw))return '';
    const v=raw.includes(':')
      ? (/^[A-Z_]{2,15}:[A-Z0-9][A-Z0-9.\-!/]{0,23}$/.test(raw)?raw.slice(raw.indexOf(':')+1):'')
      : raw;
    if(!v||v.length>24||!/^[A-Z0-9][A-Z0-9.\-!/]*$/.test(v))return '';
    if(v.includes('/')&&!/^[A-Z]{2,7}\/[A-Z]{2,7}$/.test(v))return '';
    return v;
  }
  // Símbolos de pares cambiais: bandeiras nacionais reais (Noto Emoji), sem copiar marcas do TradingView.
  // Uma lista explícita evita confundir commodities, índices e criptomoedas com FX.
  const fiatCountries=Object.freeze({"USD":"US","CAD":"CA","AUD":"AU","NZD":"NZ","EUR":"EU","GBP":"GB","JPY":"JP","CHF":"CH","BRL":"BR","MXN":"MX","CNY":"CN","CNH":"CN","HKD":"HK","SGD":"SG","SEK":"SE","NOK":"NO","DKK":"DK","PLN":"PL","CZK":"CZ","HUF":"HU","TRY":"TR","ZAR":"ZA","INR":"IN","KRW":"KR","TWD":"TW","THB":"TH","IDR":"ID","MYR":"MY","PHP":"PH","VND":"VN","RUB":"RU","UAH":"UA","ILS":"IL","AED":"AE","SAR":"SA","QAR":"QA","KWD":"KW","BHD":"BH","OMR":"OM","EGP":"EG","NGN":"NG","KES":"KE","GHS":"GH","CLP":"CL","COP":"CO","ARS":"AR","PEN":"PE","UYU":"UY","PYG":"PY","BOB":"BO","CRC":"CR","DOP":"DO","JMD":"JM","ISK":"IS","BGN":"BG","RON":"RO","RSD":"RS","GEL":"GE","KZT":"KZ","PKR":"PK","BDT":"BD","MUR":"MU","MAD":"MA","TND":"TN"});
  const fiatNames=Object.freeze({"USD":"Dólar americano","CAD":"Dólar canadense","AUD":"Dólar australiano","NZD":"Dólar neozelandês","EUR":"Euro","GBP":"Libra esterlina","JPY":"Iene japonês","CHF":"Franco suíço","BRL":"Real brasileiro","MXN":"Peso mexicano","CNY":"Yuan chinês","CNH":"Yuan offshore","HKD":"Dólar de Hong Kong","SGD":"Dólar de Singapura","SEK":"Coroa sueca","NOK":"Coroa norueguesa","DKK":"Coroa dinamarquesa","PLN":"Złoty polonês","TRY":"Lira turca","ZAR":"Rand sul-africano","INR":"Rupia indiana","KRW":"Won sul-coreano","TWD":"Novo dólar taiwanês","THB":"Baht tailandês","RUB":"Rublo russo","AED":"Dirham dos Emirados Árabes"});
  function currencyPair(value){
    const raw=normalize(value);if(!raw)return null;
    const match=raw.match(/^([A-Z]{3})[\/-]?([A-Z]{3})$/);
    if(!match)return null;
    const base=match[1],quote=match[2];
    if(base===quote||!Object.hasOwn(fiatCountries,base)||!Object.hasOwn(fiatCountries,quote))return null;
    return Object.freeze({base,quote,baseCountry:fiatCountries[base],quoteCountry:fiatCountries[quote]});
  }
  function resolve(value,groupHint){
    const ticker=normalize(value); if(!ticker)return null;
    const pair=currencyPair(ticker);
    if(pair)return {ticker,group:'moeda',mark:'FX',color:'#087c75',market:'FX',
      name:(fiatNames[pair.base]||pair.base)+' / '+(fiatNames[pair.quote]||pair.quote),pair};
    if(specs[ticker]){const base=specs[ticker];const adr=groupHint==='adr';return {ticker,...base,...(adr?{group:'adr',market:'US'}:{})};}
    const hint=String(groupHint||'').toLowerCase();
    const group=hint==='adr'?'adr':hint==='etf'?'etf':/^[A-Z]{4,6}[0-9]{1,2}$/.test(ticker)?'acao':/^(?:[A-Z]{2,6})?(?:1!)$/.test(ticker)?'futuro':/^(?:BTC|ETH|SOL|XRP)/.test(ticker)?'cripto':/^(?:USD|EUR|GBP|JPY)/.test(ticker)?'moeda':hint==='fut'?'futuro':hint==='cmd'?'commodity':hint==='ind'?'indice':hint==='cripto'?'cripto':hint==='moeda'?'moeda':'outro';
    const base=generic[group];return {ticker,group,mark:ticker.length<=3?ticker:ticker.slice(0,2),color:base.color,name:ticker,market:''};
  }
  // URLs de logotipos fornecidas como referência pela brapi.dev (logourl).
  // Não confundir logo da companhia com selo oficial da classe ou da bolsa.
  // O navegador carrega a imagem sob demanda, sem token; falhas conservam o avatar local.
  const adrEmpresa=Object.freeze({
    'PBR':'PETR3','PBR.A':'PETR4','PBR-A':'PETR4',
    'VALE':'VALE3','ITUB':'ITUB4','BBD':'BBDC4','BBDO':'BBDC4',
    'BDORY':'BBAS3','BBSEY':'BBSE3','WEGZY':'WEGE3',
    'SUZ':'SUZB3','GGB':'GGBR4','SID':'CSNA3','ABEV':'ABEV3',
    'ERJ':'EMBJ3','SBS':'SBSP3','BSBR':'SANB11','VIV':'VIVT3',
    'TIMB':'TIMS3','EBR':'ELET3','EBR.B':'ELET6','EBR-B':'ELET6'
  });
  const knownBR=Object.freeze(new Set(['PETR3','PETR4','VALE3','ITUB4','ITUB3','ITSA3','ITSA4',
    'BBDC3','BBDC4','BBAS3','BBSE3','WEGE3','MGLU3','SUZB3','GGBR3','GGBR4',
    'CSNA3','ABEV3','ELET3','ELET6','EMBJ3','SANB11','SBSP3','BPAC11',
    'B3SA3','RAIL3','RADL3','RENT3','VIVT3','TIMS3','POMO4','BOVA11','SMAL11']));
  // Recursos locais: arte de marcas reais, entregue no mesmo domínio do app e no cache offline.
  // Fontes: Simple Icons 16.36.0 e Font Awesome Free 7.x; atribuições em LOGOTIPOS-LICENCAS-v386.md.
  const usMarks=Object.freeze({AAPL:'apple',MSFT:'microsoft',NVDA:'nvidia',GOOG:'google',GOOGL:'google',
    AMZN:'amazon',TSLA:'tesla',META:'meta',NFLX:'netflix',AMD:'amd',INTC:'intel',V:'visa',UBER:'uber',ABNB:'airbnb',PYPL:'paypal',SPOT:'spotify',MA:'mastercard',QCOM:'qualcomm',SHOP:'shopify'});
  // Flags rasterizadas e empacotadas com a versão. Não há chamada externa de imagem.
  const flagCache=Object.create(null),flagPromises=Object.create(null);
  function loadFlag(currency){
    const country=fiatCountries[currency];if(!country||typeof root.Image!=='function')return null;
    if(!flagCache[country]){
      const img=new root.Image();flagCache[country]=img;
      flagPromises[country]=new Promise(resolve=>{
        img.onload=()=>resolve(img.naturalWidth>0?img:null);
        img.onerror=()=>resolve(null);
      });
      img.src='logos/fx/'+country.toLowerCase()+'.png';
    }
    const cached=flagCache[country];
    return cached.complete&&cached.naturalWidth>0?cached:null;
  }
  const imageCache=Object.create(null);
  const imagePromises=Object.create(null);
  function cachedLocalImage(ticker){
    const key=normalize(ticker),asset=usMarks[key];
    if(!asset||typeof root.Image!=='function')return null;
    if(!imageCache[asset]){
      const img=new root.Image();imageCache[asset]=img;
      imagePromises[asset]=new Promise(resolve=>{
        img.onload=()=>resolve(img.naturalWidth>0?img:null);
        img.onerror=()=>resolve(null);
      });
      img.src='logos/us/'+asset+'.png';
    }
    const img=imageCache[asset];
    return img.complete&&img.naturalWidth>0?img:null;
  }
  // A exportação nunca deve depender indefinidamente de uma imagem.
  // Em redes lentas (especialmente no Safari/iPhone), prossegue com avatar textual.
  function withinDeadline(promise,ms=2200){
    if(typeof root.setTimeout!=='function')return Promise.resolve(promise);
    return new Promise(resolve=>{
      let finished=false;
      const finish=value=>{if(finished)return;finished=true;
        if(typeof root.clearTimeout==='function')root.clearTimeout(timer);
        resolve(value);
      };
      const timer=root.setTimeout(()=>finish(false),ms);
      Promise.resolve(promise).then(finish,()=>finish(false));
    });
  }
  async function preload(tickers){
    const names=Array.isArray(tickers)?tickers:Object.keys(usMarks);
    for(const ticker of names){
      cachedLocalImage(ticker);
      const pair=currencyPair(ticker);if(pair){loadFlag(pair.base);loadFlag(pair.quote)}
    }
    const jobs=names.map(t=>imagePromises[usMarks[normalize(t)]]).filter(Boolean);
    for(const ticker of names){
      const pair=currencyPair(ticker);
      if(pair)for(const currency of [pair.base,pair.quote]){
        const promise=flagPromises[fiatCountries[currency]];if(promise)jobs.push(promise);
      }
    }
    return withinDeadline(Promise.allSettled(jobs));
  }
  async function readyForExport(scope){
    if(!scope?.querySelectorAll)return;
    const imgs=Array.from(scope.querySelectorAll('.ta-avatar[data-logo-local="1"] .ta-logo'));
    const flags=Array.from(scope.querySelectorAll('.ta-avatar.ta-pair .ta-fx-img'));
    // Um único orçamento de espera para marcas e moedas; exportação sempre termina.
    return withinDeadline((async()=>{
      const ticks=imgs.map(img=>img.parentElement?.dataset?.ticker).filter(Boolean);
      const codes=flags.map(img=>img.dataset?.currency).filter(Boolean);
      for(const code of codes)loadFlag(code);
      await preload(ticks);
      await Promise.allSettled(codes.map(code=>flagPromises[fiatCountries[code]]).filter(Boolean));
      await Promise.allSettled([...imgs,...flags].map(img=>img.complete?Promise.resolve():new Promise(done=>{
        img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});
      })));
    })());
  }
  function logoInfo(ticker, hint){
    const norm=normalize(ticker);if(!norm)return null;
    const info=resolve(norm,hint);if(!info)return null;
    let issuer=adrEmpresa[norm]||norm;
    if(info.group==='acao'&&info.market==='US'&&Object.hasOwn(usMarks,norm))
      return Object.freeze({ticker:norm,issuer:norm,provider:'pacote-local',local:true,
        url:'logos/us/'+usMarks[norm]+'.png'});
    // ADRs remetem à companhia de origem. Índices, futuros, câmbio e commodities
    // não recebem o logo de uma empresa que não os representa.
    if (!knownBR.has(issuer)) return null;
    if (info.group!=='acao'&&info.group!=='adr'&&info.group!=='etf') return null;
    // Apenas símbolos declarados: nunca montar URL a partir de texto arbitrário da página.
    return Object.freeze({ticker:norm,issuer,provider:'brapi.dev',
      url:'https://icons.brapi.dev/icons/'+issuer+'.svg'});
  }
  function avatar(ticker, options={}){
    const info=resolve(ticker,options.group);if(!info)return null;
    const node=d.createElement('span');node.className='ta-avatar'+(options.small?' ta-small':'');
    node.dataset.group=info.group;node.dataset.market=info.market;node.dataset.ticker=info.ticker;
    node.style.setProperty('--ta-accent',info.color);
    node.title=info.name+' · '+info.ticker+' · '+(generic[info.group]?.name||'Ativo');
    node.setAttribute('aria-hidden','true');
    const mark=d.createElement('span');mark.className='ta-mark';mark.textContent=info.mark;
    node.append(mark);
    if(info.pair){
      node.classList.add('ta-pair');
      node.dataset.pairBase=info.pair.base;node.dataset.pairQuote=info.pair.quote;
      for(const [code,position] of [[info.pair.base,'base'],[info.pair.quote,'quote']]){
        const half=d.createElement('span');half.className='ta-fx-half ta-fx-'+position;
        const fallback=d.createElement('span');fallback.className='ta-fx-code';fallback.textContent=code;
        half.append(fallback);
        if(options.real!==false){
          const img=d.createElement('img');img.className='ta-fx-img';img.alt='';
          img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.dataset.currency=code;
          img.onload=()=>{if(img.naturalWidth>0)half.classList.add('ta-has-flag')};
          img.onerror=()=>{img.remove?.();half.classList.remove?.('ta-has-flag')};
          img.src='logos/fx/'+fiatCountries[code].toLowerCase()+'.png';half.append(img);
        }
        node.append(half);
      }
      node.dataset.logoLocal='1';
      return node;
    }
    if (options.real!==false){
      const logo=logoInfo(info.ticker,options.group);
      if (logo){
        const img=d.createElement('img');
        img.className='ta-logo';img.alt='';img.loading=logo.local?'eager':'lazy';img.decoding='async';
        img.referrerPolicy='no-referrer';
        if(logo.local)node.dataset.logoLocal='1';
        img.onload=()=>{if(img.naturalWidth>0)node.classList.add('ta-has-logo')};
        img.onerror=()=>{img.remove?.();node.classList.remove?.('ta-has-logo')};
        // O atributo src fica por último para não perder eventos de imagens em cache.
        img.src=logo.url;node.append(img);
        node.dataset.logoProvider=logo.provider;
      }
    }
    return node;
  }
  function getTicker(value){
    const fx=String(value||'').trim().toUpperCase().match(/^([A-Z]{3}[\/-]?[A-Z]{3})(?=\s|$)/);
    if(fx&&currencyPair(fx[1]))return fx[1];
    const match=String(value||'').trim().toUpperCase().match(/^([A-Z]{2,7}[0-9]{1,2}|[A-Z]{2,6}(?:\.[A-Z]|\-A)?|BTCBRL|USDBRL|NQ1!)(?=\s|$)/);
    if(!match)return null;const s=match[1];return specs[s]||/^[A-Z]{4,6}[0-9]{1,2}$/.test(s)?s:null;
  }
  function decorateAdr(scope){
    scope.querySelectorAll('.adr-quote[data-adr-symbol]:not([data-ta-done])').forEach(row=>{
      const symbol=row.dataset.adrSymbol,head=row.querySelector('.adr-quote-heading > div:first-child');
      if(!head)return;
      const badge=avatar(symbol,{group:symbol==='EWZ'?'etf':'adr'});if(!badge)return;
      const copy=d.createElement('span');copy.className='ta-copy';
      while(head.firstChild)copy.append(head.firstChild);
      head.append(badge,copy);head.classList.add('ta-brand');row.dataset.taDone='1';
    });
  }
  function decorateQuotes(scope){
    scope.querySelectorAll('.cqr:not([data-ta-done])').forEach(row=>{
      const fav=row.querySelector('[data-cqfav]'),ticker=fav?.dataset.cqfav||row.querySelector('.cqn>b')?.textContent||row.dataset.cqSymbol;
      const original=row.querySelector('.cqi');if(!original||!ticker)return;
      const badge=avatar(ticker);if(!badge)return;
      badge.classList.add('cqi');original.replaceWith(badge);row.dataset.taDone='1';
    });
    scope.querySelectorAll('.cqmap .cqt:not([data-ta-done])').forEach(tile=>{
      const label=tile.querySelector('b');const ticker=label?.textContent?.trim();const badge=avatar(ticker,{small:true});
      if(!badge)return;tile.prepend(badge);tile.dataset.taDone='1';
    });
  }
  function decoratePreOpen(scope){
    scope.querySelectorAll('.adr-ab-tab tbody tr:not([data-ta-done])').forEach(row=>{
      const b=row.querySelector('td:first-child > b');if(!b)return;
      const ticker=(b.textContent||'').trim()==='Ibovespa'?'IBOV':getTicker(b.textContent);
      const badge=avatar(ticker,{small:true});if(!badge)return;
      b.before(badge);row.dataset.taDone='1';row.classList.add('ta-open-row');
    });
  }
  function decoratePortfolio(scope){
    scope.querySelectorAll('.card > .top > b:first-child:not([data-ta-done])').forEach(label=>{
      const ticker=getTicker(label.firstChild?.textContent||label.textContent);
      if(!ticker)return;
      const badge=avatar(ticker,{small:true});if(!badge)return;
      label.prepend(badge);label.classList.add('ta-title');label.dataset.taDone='1';
    });
    scope.querySelectorAll('.pft tbody tr:not([data-ta-done])').forEach(row=>{
      const td=[...row.querySelectorAll('td')].find(c=>{const b=c.querySelector(':scope > b');return b&&!!getTicker(b.textContent)});
      if(!td)return;const b=td.querySelector(':scope > b');const badge=avatar(getTicker(b.textContent),{small:true});
      if(!badge)return;td.prepend(badge);td.classList.add('ta-cell');row.dataset.taDone='1';
    });
  }
  function decorateTrades(scope){
    scope.querySelectorAll('.card.row[data-a="edit"]:not([data-ta-done])').forEach(row=>{
      const name=row.querySelector('.fl > b'),t=getTicker(name?.textContent);if(!t)return;
      const thumbnail=row.querySelector('.th');if(!thumbnail||thumbnail.querySelector('img'))return;
      const badge=avatar(t);if(!badge)return;thumbnail.textContent='';thumbnail.append(badge);row.dataset.taDone='1';
    });
  }
  function decorateTerminal(scope){
    scope.querySelectorAll('.radar-quote:not([data-ta-done])').forEach(card=>{
      const name=card.querySelector(':scope > span');if(!name)return;
      const normalized=String(name.textContent||'').trim().toUpperCase();
      const ticker=labels[normalized]||getTicker(normalized)||null;if(!ticker)return;
      const badge=avatar(ticker,{small:true});if(!badge)return;
      name.prepend(badge);name.classList.add('ta-quote-title');card.dataset.taDone='1';
    });
  }
  function decorateReports(scope){
    scope.querySelectorAll('.pfrh h3:not([data-ta-done])').forEach(title=>{
      const match=String(title.textContent||'').match(/relat[oó]rio\s+individual\s*[·:-]\s*([A-Z][A-Z0-9.\-]{2,14})/i);
      if(!match)return;const badge=avatar(match[1],{small:true});if(!badge)return;
      title.prepend(badge);title.classList.add('ta-report-title');title.dataset.taDone='1';
    });
  }
  function decorateEditorial(scope){
    scope.querySelectorAll('.jrart .jrtit:not([data-ta-done]),#grbox h2:not([data-ta-done]),#grbox h3:not([data-ta-done])').forEach(title=>{
      const tokens=String(title.textContent||'').toUpperCase().match(/[A-Z]{2,7}[0-9]{0,2}|BTCBRL|USDBRL/g)||[];
      const symbol=tokens.find(t=>Object.hasOwn(specs,t));if(!symbol)return;
      const badge=avatar(symbol,{small:true});if(!badge)return;
      title.prepend(badge);title.classList.add('ta-editorial-title');title.dataset.taDone='1';
    });
  }
  function decorate(scope){
    if(!scope?.querySelectorAll)return;
    decorateAdr(scope);decorateQuotes(scope);decoratePreOpen(scope);
    decoratePortfolio(scope);decorateTrades(scope);decorateTerminal(scope);decorateReports(scope);decorateEditorial(scope);
  }
  let scheduled=false;
  function schedule(){
    if(scheduled)return;scheduled=true;
    (root.requestAnimationFrame||root.setTimeout)(()=>{
      scheduled=false;decorate(d.getElementById('app'));decorate(d.getElementById('sh'));
      const dialog=d.getElementById('research-workbench');if(dialog)decorate(dialog);
    },0);
  }
  function draw(ctx,ticker,x,y,size=34){
    const info=resolve(ticker);if(!info||!ctx||!Number.isFinite(x+y+size)||size<8)return false;
    ctx.save();const r=size/2,cx=x+r,cy=y+r;
    if(info.pair){
      const first=loadFlag(info.pair.base),second=loadFlag(info.pair.quote);
      if(first&&second&&typeof ctx.drawImage==='function'&&typeof ctx.clip==='function'){
        const badgeSize=size*.70,top=y+(size-badgeSize)/2;
        for(const [img,left] of [[first,x],[second,x+size-badgeSize]]){
          ctx.save();ctx.beginPath();ctx.arc(left+badgeSize/2,top+badgeSize/2,badgeSize/2,0,Math.PI*2);ctx.clip();
          ctx.drawImage(img,left,top,badgeSize,badgeSize);ctx.restore();
        }
        ctx.restore();return true;
      }
    }
    const logo=cachedLocalImage(info.ticker);
    if(logo&&typeof ctx.drawImage==='function'){
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
      ctx.save();ctx.beginPath();ctx.arc(cx,cy,r-1,0,Math.PI*2);ctx.clip();
      const pad=size*.12;ctx.drawImage(logo,x+pad,y+pad,size-pad*2,size-pad*2);
      ctx.restore();ctx.restore();return true;
    }
    ctx.fillStyle=info.color;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=Math.max(.8,size*.035);ctx.stroke();
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
    const label=info.mark;
    ctx.font=`800 ${Math.round(size*(label.length>2?.27:label.length>1?.38:.55))}px system-ui,Arial,sans-serif`;
    ctx.fillText(label,cx,cy+size*.01,size*.84);ctx.restore();return true;
  }
  const fromLabel=v=>{const raw=String(v||'').trim().toUpperCase();return labels[raw]||getTicker(raw)||normalize(raw)};
  const api=Object.freeze({resolve,normalize,fromLabel,currencyPair,avatar,decorate,draw,logoInfo,preload,readyForExport,known:()=>Object.keys(specs).length});
  root.TraderAssetIdentity=api;
  // Carregamento não essencial só depois da primeira pintura da interface.
  if(typeof root.Image==='function'){
    const warm=()=>preload([...Object.keys(usMarks),'USDCAD','AUDCAD','AUDUSD','EURUSD','GBPUSD','USDJPY','USDCHF','USDBRL','EURGBP']).catch(()=>{});
    if(typeof root.requestIdleCallback==='function')root.requestIdleCallback(warm,{timeout:2500});
    else if(typeof root.setTimeout==='function')root.setTimeout(warm,750);
  }
  if(root.TraderUI?.onRender){root.TraderUI.onRender('identidade-ativos-v386',schedule);root.TraderUI.onSheet('identidade-ativos-v386',schedule)}
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  // Preços e ADRs podem atualizar uma parte da tela sem chamar o render principal.
  const app=d.getElementById('app');if(root.MutationObserver&&app){
    const observer=new root.MutationObserver(changes=>{if(changes.some(c=>c.addedNodes.length||c.removedNodes.length))schedule()});
    observer.observe(app,{childList:true,subtree:true});
  }
})(window);
