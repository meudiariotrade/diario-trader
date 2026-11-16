const {test}=require('node:test');
const assert=require('node:assert/strict');
const {expect}=require('playwright/test');
const {withApp}=require('./helpers/app.cjs');
async function open(browser,base){
 const p=await browser.newPage({viewport:{width:390,height:844}});
 await p.route('https://**',r=>r.abort());
 await p.goto(base+'/?demo=1');
 await p.locator('#splash').waitFor({state:'hidden'});
 await p.evaluate(()=>{tab='estudos';ESV='eco';render();});
 return p;
}
test('v684: Laboratório mantém dez módulos e acrescenta quatro sem afetar a Biblioteca',{timeout:90000},async()=>withApp(async(b,base)=>{
 const p=await open(b,base);
 await expect(p.locator('.eco-nav [data-eco-tool]')).toHaveCount(14);
 for(const tool of ['port','real','back','abnt']){
  await p.locator('[data-eco-tool="'+tool+'"]').click();
  await expect(p.locator('#eco-body')).toBeVisible();
  assert.ok((await p.locator('#eco-body').innerText()).length>120);
 }
 await p.evaluate(()=>{ESV='liv';render();});
 await expect(p.locator('#app')).toContainText('Livros');
 await expect(p.locator('.eco-root')).toHaveCount(0);
 await p.close();
}));
test('v684: Markowitz, CDI, breakeven e backtest com séries observadas injetadas',{timeout:90000},async()=>withApp(async(b,base)=>{
 const p=await open(b,base);
 const x=await p.evaluate(()=>{
  const L=EconomiaLab,Q=L.quant.Q,s=L.state.series;
  const days=[];for(let i=0;i<240;i++){const d=new Date(Date.UTC(2026,0,1+i));if(d.getUTCDay()>0&&d.getUTCDay()<6)days.push(d.toISOString().slice(0,10));}
  for(const [k,idx] of L.quant.A.filter(x=>x!=='CDI').map((x,i)=>[x,i])){
   let val=20+idx*8;
   s[k]=days.map((d,i)=>{val*=(1+.0002+Math.sin(i/13+idx)*.005);return {d,p:val};});
  }
  Q.cdi=days.map(d=>({d,taxa:.05}));Q.ts=Date.now();
  const m=L.quant.markowitz(L.quant.prices());
  const candles=days.map((d,i)=>{const c=100+Math.sin(i/4)*8+i*.035;return {d,o:c-.4,h:c+1.3,l:c-1.5,c};});
  const bt=L.quant.backtest(candles,{regra:'break',stop:1.5,alvo:3,unidade:'%',lado:'ambos'});
  return {n:m?.p.n,weights:m?.chosen.w,variances:m?.p.cov,efficient:m?.efficient.length,
    markowitzVol:m?.chosen.vol,btTrades:bt?.trades.length,drawdown:bt?.drawdown,pnlValid:bt?.trades.every(t=>Number.isFinite(t.pnl)),
    sample:Q.cdi.length,breakeven:L.quant.inflation(12,6),
    td:L.quant.tdParse({response:{TrsrBdTradgList:[{TrsrBd:{nm:'Tesouro IPCA+ 2035',mtrtyDt:'2035-05-15',anulInvstmtRate:6.4}}]}})};
 });
 assert.equal(x.n,171);assert.ok(Math.abs(x.weights.reduce((a,b)=>a+b,0)-1)<1e-9);
 assert.equal(x.variances.length,6);assert.ok(x.markowitzVol>0);
 assert.ok(x.efficient>=1);assert.ok(x.btTrades>0);assert.ok(x.drawdown>=0);assert.equal(x.pnlValid,true);
 assert.equal(x.breakeven.approx,6);assert.ok(x.breakeven.exact>5&&x.breakeven.exact<6);
 assert.equal(x.td[0].rate,6.4);
 await p.locator('[data-eco-tool="port"]').click();
 await expect(p.locator('.eco-qtable')).toContainText('PETR4');
 await p.locator('[data-quant-weight="0"]').fill('35');
 await p.locator('[data-quant-weight="0"]').dispatchEvent('change');
 await expect(p.locator('.eco-grid-stats')).toContainText('Sharpe');
 await p.locator('[data-eco-tool="back"]').click();
 await expect(p.locator('[data-quant-field="regra"]')).toBeVisible();
 await p.close();
}));
test('v684: ABNT 6023:2025 e importação de tabela BCB/IBGE permanecem locais',{timeout:90000},async()=>withApp(async(b,base)=>{
 const p=await open(b,base);
 const result=await p.evaluate(()=>{
  const L=EconomiaLab;
  const book={tipo:'livro',autores:'José da Silva; Maria Pereira',titulo:'Economia aplicada',ano:'2024',cidade:'São Paulo',editora:'Editora Acadêmica',modo:'indireta'};
  return {ref:L.abnt.formatRef(book),cite:L.abnt.citation(book),
   direct:L.abnt.citation({...book,modo:'direta',pagina:'35'}),
   rows:L.abnt.csvRows('data;valor\n2026-01;1,2\n2026-02;2,4')};
 });
 assert.match(result.ref,/SILVA, José da; PEREIRA, Maria/);
 assert.match(result.cite,/\(Silva; Pereira, 2024\)/);
 assert.match(result.direct,/p\. 35/);
 const institution=await p.evaluate(()=>EconomiaLab.abnt.citation({tipo:'site',org:'Banco Central do Brasil',ano:'2026',titulo:'Selic'}));
 assert.equal(institution,'(Banco Central do Brasil, 2026)');
 assert.equal(result.rows.length,3);
 await p.evaluate(()=>{
  EconomiaLab.uni.data.consultas.push({id:'ibge-test',serie:'IPCA histórico',fonte:'IBGE',url:'https://ibge.gov.br/serie',em:'2026-11-15',unidade:'%',pontos:[{data:'202601',valor:.4},{data:'202602',valor:.2}]});
 });
 await p.locator('[data-eco-tool="abnt"]').click();
 await p.locator('[data-abnt-source]').selectOption('ibge-test');
 await expect(p.locator('[data-abnt-source]')).toHaveValue('ibge-test');
 assert.equal(await p.evaluate(()=>EconomiaLab.state.abnt.abntSource),'ibge-test');
 await p.locator('[data-eco-btn="abntSeries"]').click();
 await expect(p.locator('.eco-abnt-table')).toHaveCount(1);
 await expect(p.locator('.eco-abnt-table')).toContainText('202602');
 await p.locator('[data-abnt-field="tcc"]').fill('Análise do IPCA');
 await expect.poll(()=>p.evaluate(()=>JSON.parse(localStorage.getItem('diario-laboratorio-abnt-v684'))?.tcc)).toBe('Análise do IPCA');
 await p.locator('[data-eco-btn="abntSave"]').click();
 await expect(p.locator('.eco-abnt-paper h2')).toHaveText('Análise do IPCA');
 const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('diario-laboratorio-abnt-v684')));
 assert.equal(saved.tcc,'Análise do IPCA');
 assert.equal(saved.tabela.rows.length,3);
 await p.close();
}));
