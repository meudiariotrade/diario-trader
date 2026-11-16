const {test}=require('node:test');
const assert=require('node:assert/strict');
const {withApp}=require('./helpers/app.cjs');
const {expect}=require('playwright/test');

async function open(browser,base,width=1440){
  const p=await browser.newPage({viewport:{width,height:900}});
  await p.route('https://**',r=>r.abort());
  await p.goto(base+'/?demo=1');
  await p.locator('#splash').waitFor({state:'hidden'});
  return p;
}

test('Mercado desktop: barômetro sob Notícias, DXY único e horário do tick Finnhub sem repetir a fonte',{timeout:90000},async()=>withApp(async(browser,base)=>{
  const p=await open(browser,base);
  await p.clock.setFixedTime(new Date('2026-11-16T01:15:07.000Z')); // domingo 22:15:07 em Brasília; forex aberto
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.evaluate(()=>{
    tab='mercado';MKT.tab='cq';CQ.aba='fx';CQ.vis='lista';CQ.search='';
    M606.v={em:new Date().toISOString(),di:[],terminal:[
      {g:'idx',k:'FTSE 100',n:'Reino Unido',s:'TVC:UKX',px:9850,d1:.2,dp:0,ss:'ice'},
      {g:'em',k:'USD/MXN',n:'México',s:'FX:USDMXN',px:18.7,d1:0.2,dp:4,ss:'fx24'},
      {g:'fut',k:'WIN',n:'Mini índice',s:'BMFBOVESPA:WIN1!',px:168000,d1:0.1,dp:0,ss:'b3'},
      {g:'tsy',k:'US10Y',n:'Treasury 10a',s:'TVC:US10Y',px:4.2,d1:.01,dp:3,ss:'nyse'}
    ]};
    CQ.d.fx={em:new Date().toISOString(),itens:[
      {c:'USD/BRL',n:'Dólar real',s:'FX:USDBRL',px:5.16,d1:.18,dp:4,_aba:'fx'},
      {c:'DXY',n:'Dollar index',s:'TVC:DXY',px:100.5,d1:.12,dp:2,_aba:'fx'},
      {c:'DX-Y.NYB',n:'Dollar index duplicado',s:'DX-Y.NYB',px:100.5,d1:.12,dp:2,_aba:'fx'},
      {c:'EUR/USD',n:'Euro dólar',s:'FX:EURUSD',px:1.17,d1:.1,dp:5,_aba:'fx'}
    ]};
    FH_TODOS.add('OANDA:USD_BRL');
    FH.q['OANDA:USD_BRL']={s:'OANDA:USD_BRL',px:5.2,em:Date.now(),dir:0};
    FH.modo='ws';
    render();
  });
  await expect(p.locator('.m623-term')).toBeVisible();
  const result=await p.locator('.m623-term').evaluate(el=>{
    const cols=[...el.querySelectorAll(':scope > .m623-col')];
    const titles=col=>[...col.children].map(n=>n.querySelector('h3')?.textContent?.trim()).filter(Boolean);
    const moeda=[...cols[1].querySelectorAll('.m623-sec')].find(n=>n.querySelector('h3')?.textContent==='Moedas');
    const dxy=[...moeda.querySelectorAll('.m623-n b')].filter(n=>['DXY','DX-Y.NYB'].includes(n.textContent.trim()));
    return {cols:cols.length,left:titles(cols[0]),center:titles(cols[1]),dxy:dxy.length,
      order:[...cols[0].children].map(n=>n.querySelector('h3')?.textContent?.trim()).filter(Boolean)};
  });
  assert.equal(result.cols,3);
  assert.equal(result.dxy,1,'DXY e DX-Y.NYB representam um só indicador');
  assert.equal(result.left.indexOf('US Market Barometer'),result.left.indexOf('Notícias')+1);
  assert.ok(!result.center.includes('US Market Barometer'));
  await expect(p.locator('.m623-col').nth(1).locator('.m623-r[data-fh="OANDA:USD_BRL"] time')).toHaveText('22:15:07');
  await expect(p.locator('.m623-col').nth(1).locator('.m623-r[data-fh="OANDA:USD_BRL"] .m623-dot.on')).toHaveCount(1);
  await expect(p.locator('.m623-col').nth(1).locator('.fh-selo')).toContainText('Finnhub · Tempo real');
  await expect(p.locator('.m623-r[data-fh="OANDA:USD_BRL"]')).not.toContainText('Finnhub · Tempo real');
  await p.clock.setFixedTime(new Date('2026-11-16T01:15:12.000Z'));
  await p.evaluate(()=>fhGuarda('OANDA:USD_BRL',5.2)); // preço igual, horário do tick novo
  await expect(p.locator('.m623-r[data-fh="OANDA:USD_BRL"] time')).toHaveText('22:15:12');
  assert.deepEqual(errors,[]);
}));

test('Compartilhar: Automático usa hoje, mas mantém data antiga da operação e resumos',{timeout:90000},async()=>withApp(async(browser,base)=>{
  const p=await open(browser,base,390);
  await p.clock.setFixedTime(new Date('2026-11-27T23:15:07.000Z')); // Black Friday, 20:15 BRT
  await p.evaluate(()=>{
    window.card660=[];
    const original=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText=function(value,...args){window.card660.push(String(value));return original.call(this,value,...args)};
    S.trades=[{id:'older-660',ativo:'WINV26',tipo:'D',side:'C',entry:'207905',exit:'207410',qty:'3',pv:'0.2',dt:'2026-11-13T11:13',dtx:'2026-11-13T11:45'}];
    S.ops=[];SHR.scope='operation';SHR.modo='preco';SHR.at=1;SHR.setup=false;
    TraderSeasonCards.setTheme('auto');
    return shrAbre('older-660');
  });
  await p.locator('.season-picker small').waitFor({state:'visible'});
  assert.equal(await p.evaluate(()=>TraderSeasonCards.theme()),'blackfriday');
  await expect(p.locator('.season-picker small')).toContainText('Automático · Black Friday');
  await expect(p.locator('.season-picker small')).toContainText('referência 27/11/2026');
  const texts=await p.evaluate(()=>card660);
  assert.ok(texts.includes('Automático · Black Friday'),'selo da imagem também deve usar hoje');
  assert.ok(texts.includes('13/11/2026'),'data do trade não pode ser reescrita');
  await p.locator('[data-shrx]').click();
}));
