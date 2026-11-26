const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const mod=import('../cloudflare/diario-screeners/graham-fundamentos-v1014.mjs');
const now=new Date().toISOString(),day=now.slice(0,10);
const row={ticker:'VALE3',empresa:'Vale',setor:'Materiais',fundamentais_em:day,roe:12,roic:9,pl:8,pvp:1.2,preco_referencia:60,fcf_yield:7,lpa:7.5,vpa:50,dividend_yield:4,user_id:'private'};
const peer=(ticker,empresa,roe)=>({...row,ticker,empresa,roe});
const snap={market:'BR',universe_complete:true,last_update:now,universe_rows:[row,peer('ABCD3','A',10),peer('ABCD4','A',20),peer('EFGH3','B',14),peer('IJKL3','C',16),{...peer('MNOP3','D',99),setor:'Outro'}]};
test('tickers explícitos, sem inferir símbolo americano ou misturar mercados',async()=>{const {tickersGrahamV1014}=await mod;assert.deepEqual(tickersGrahamV1014('VALE3 e ticker: AAPL'),[{ticker:'VALE3',market:'BR'},{ticker:'AAPL',market:'US'}]);assert.deepEqual(tickersGrahamV1014('Apple'),[])});
test('base sanitizada, amostra setorial deduplicada, zero não vira ausência',async()=>{const {perfilGrahamV1014}=await mod;const p=perfilGrahamV1014({ticker:'VALE3',market:'BR'},{...snap,universe_rows:[{...row,roic:0},...snap.universe_rows.slice(1)]});assert.equal(p.metricas.roic,0);assert.equal(p.pares.length,3);assert.equal(p.defasado,false);assert.doesNotMatch(JSON.stringify(p),/user_id|private/);assert.ok(p.lacunas.some(x=>x.includes('Série histórica')));assert.equal(perfilGrahamV1014({ticker:'VALE3',market:'US'},snap),null)});
test('sem data de referência ou cache antigo não permite valuation e não usa pares',async()=>{const {perfilGrahamV1014}=await mod;const p=perfilGrahamV1014({ticker:'VALE3',market:'BR'},{...snap,universe_rows:[{...row,fundamentais_em:null}]});assert.equal(p.defasado,true);assert.equal(p.pares.length,0);assert.equal(p.dados.find(x=>x.id==='roe').data,null);assert.equal(perfilGrahamV1014({ticker:'VALE3',market:'BR'},snap,{stale:true}).defasado,true)});
test('dois tickers do mesmo mercado reutilizam uma leitura pública',async()=>{const {carregarGrahamV1014}=await mod;let calls=0;const p=await carregarGrahamV1014({}, {},'VALE3 ABCD3',async()=>{calls++;return Response.json(snap)});assert.equal(p.length,2);assert.equal(calls,1)});
test('cálculo local reaproveita fórmulas existentes e não produz preço justo para US/antigo',async()=>{const {perfilGrahamV1014}=await mod;const p=perfilGrahamV1014({ticker:'VALE3',market:'BR'},snap);const src=fs.readFileSync('src/domains/core/07-conta-e-integracoes.js','utf8'),part=src.slice(src.indexOf('// v1014 — reutiliza'),src.indexOf('async function ecoPergunta'));const ctx={window:{DiarioScreenersInteligencia:require('../src/analysis/screeners-inteligencia.js')}};vm.createContext(ctx);vm.runInContext(part,ctx);const [valid,stale,us]=ctx.aureaCalcularGrahamV1014([p,{...p,defasado:true},{...p,market:'US'}]);assert.equal(valid.comparacao.roe.mediana,14);assert.equal(valid.valuation.methods[0].id,'graham');assert.ok(Math.abs(valid.valuation.methods[0].valor-Math.sqrt(22.5*7.5*50))<1e-9);assert.equal(stale.valuation,null);assert.equal(us.valuation,null)});
test('normalizador não apresenta número de modelo como fato e mantém lacunas',async()=>{const {normalizarGrahamV1014}=await import('../cloudflare/diario-screeners/aurea-debate-v1013.mjs');const r=normalizarGrahamV1014({resumo:'A empresa tem ROE de 999%',explicacao:['Tese condicional ao caixa'],lacunas:['Dívida não informada']},[row]);assert.doesNotMatch(r.resumo,/999/);assert.equal(r.lacunas[0],'Dívida não informada');});

test('modelos diferentes para bancos, REITs, software e semicondutores',async()=>{
 const {modeloGrahamV1014}=await mod;
 assert.equal(modeloGrahamV1014({sector:'Financials',industry:'Banks'},'US').tipo,'banco');
 assert.equal(modeloGrahamV1014({sector:'Real Estate',company_name:'Example REIT'},'US').tipo,'imobiliario');
 assert.equal(modeloGrahamV1014({sector:'Technology',industry:'Software'},'US').tipo,'software');
 assert.equal(modeloGrahamV1014({sector:'Technology',industry:'Semiconductors'},'US').tipo,'semicondutores');
 assert.match(modeloGrahamV1014({sector:'Technology'},'US').juros,/Fed Funds e Treasury/);
 assert.match(modeloGrahamV1014({setor:'Materiais'},'BR').juros,/Selic/);
});
test('EUA: desconto relativo não é margem intrínseca; múltiplos negativos e setores incompatíveis não entram',async()=>{
 const {perfilGrahamV1014}=await mod;
 const us={ticker:'AAPL',company_name:'Apple',sector:'Technology',fundamentais_em:day,forward_pe:20,ev_fcf:25,peg_ratio:-1,fcf_margin:22,sec_facts_at:day};
 const peers=[{...us,ticker:'AAA',company_name:'A',forward_pe:30},{...us,ticker:'BBB',company_name:'B',forward_pe:40},{...us,ticker:'CCC',company_name:'C',forward_pe:50},{...us,ticker:'DDD',company_name:'D',industry:'Software',forward_pe:90}];
 const p=perfilGrahamV1014({ticker:'AAPL',market:'US'},{market:'US',universe_complete:true,last_update:now,universe_rows:[us,...peers]});
 assert.equal(p.pares.length,3);assert.equal(p.dados.find(x=>x.id==='peg_ratio').utilizavel,false);
 assert.doesNotMatch(p.dados.find(x=>x.id==='fcf_margin').fonte,/SEC EDGAR/);
 const src=fs.readFileSync('src/domains/core/07-conta-e-integracoes.js','utf8'),part=src.slice(src.indexOf('// v1014 — reutiliza'),src.indexOf('async function ecoPergunta'));
 const ctx={window:{DiarioScreenersInteligencia:require('../src/analysis/screeners-inteligencia.js')}};vm.createContext(ctx);vm.runInContext(part,ctx);
 const [r]=ctx.aureaCalcularGrahamV1014([p]);assert.equal(r.valuation,null);assert.equal(r.relative.find(x=>x.id==='forward_pe').diferenca_pct,-50);assert.equal(r.derived.find(x=>x.id==='fcf_ev').valor,4);assert.ok(!r.relative.some(x=>x.id==='peg_ratio'));
});
test('roteamento direto ticker americano e protocolos BR/EUA em todas as lentes Graham',()=>{
 const s=fs.readFileSync('src/domains/core/07-conta-e-integracoes.js','utf8'),r=fs.readFileSync('cloudflare/diario-screeners/aurea-resumao-v904.mjs','utf8');
 const part=s.slice(s.indexOf('function aureaRota('),s.indexOf('const AUREA_METODO_V1007'));
 const c={};vm.createContext(c);vm.runInContext(part,c);assert.equal(c.aureaRota('Analise ticker: AAPL').id,'graham');assert.match(r,/FFO\/AFFO/);assert.match(s,/recompras líquidas/);
});
