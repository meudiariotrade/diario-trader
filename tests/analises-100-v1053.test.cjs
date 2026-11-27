const test=require('node:test');const assert=require('node:assert');
const mod=import('../cloudflare/diario-screeners/graham-fundamentos-v1014.mjs');
const h={tickers:{ABCD3:'1'},empresas:{'1':{n:'ABC',s:'Ind',a:{2021:{rec:100,luc:10,pl:100,dvd:5,acoes:10,div:50,cx:10},2022:{rec:110,luc:11,pl:105,dvd:6,acoes:10},2023:{rec:120,luc:12,pl:110,dvd:6,acoes:10},2024:{rec:130,luc:13,pl:120,dvd:7,acoes:10},2025:{rec:140,luc:14,pl:130,dvd:8,acoes:10,div:60,cx:20}}}}};
test('v1053 histórico CVM gera LPA, VPA, DPA, dividendos, payout e crescimento',async()=>{
 const G=await mod,c=G.cvmPerfilV1053('ABCD3',h);
 assert.equal(c.ano,'2025');assert.equal(c.lpa,1.4);assert.equal(c.vpa,13);assert.equal(c.dpa,0.8);
 assert.equal(c.dividendos_anuais.length,5);assert.ok(c.cagr_receita_3a>8&&c.cagr_receita_3a<9);assert.equal(c.divida_liquida_pl,Math.round(40/130*10000)/10000);
 const p=G.enriquecerCvmV1053({market:'BR',metricas:{preco_referencia:20},dados:[],valuationInput:{preco_referencia:20},lacunas:['Crescimento sem indicador no snapshot','Série histórica não incluída; x','Valuation sem indicador no snapshot']},c);
 assert.equal(p.valuationInput.lpa,1.4);assert.equal(p.metricas.pl,14.29);assert.deepEqual(p.lacunas,[]);assert.ok(p.historico_cvm.serie.length===5);
});
test('v1053 pares aceitam até 7 dias de diferença e completam com o mercado',async()=>{
 const G=await mod,now=Date.parse('2026-11-27T12:00:00Z');
 const row=(t,setor,d)=>({ticker:t,setor,empresa:t,emissor_cnpj:t,fundamentais_em:d,roe:10,pl:8,pvp:1,preco_referencia:10});
 const snap={market:'BR',universe_complete:true,last_update:'2026-11-27T08:00:00Z',universe_rows:[row('AAAA3','X','2026-11-27'),row('BBBB3','X','2026-11-26'),row('CCCC3','X','2026-11-25'),row('DDDD3','X','2026-11-24'),row('EEEE3','Y','2026-11-27'),row('FFFF3','Y','2026-11-26')]};
 const p=G.perfilGrahamV1014({ticker:'AAAA3',market:'BR'},snap,{now});assert.equal(p.pares.length,3);assert.equal(p.amostra,'setor');
 const q=G.perfilGrahamV1014({ticker:'EEEE3',market:'BR'},snap,{now});assert.ok(q.pares.length>=3);assert.equal(q.amostra,'mercado');
});
test('v1053 SEC mescla crescimento, retorno ao acionista e remuneração em ações com linhagem',async()=>{
 const G=await mod,pr=[{documento_id:'0000000001-26-000001',competencia:'2025-12-31',publicado_em:'2026-02-01',valor_reportado:1}];
 const s=G.mesclarSecV1053({universe_rows:[{ticker:'XYZ',cik:'1'}]},{tickers:{XYZ:{cik:'0000000001',revenue_growth_yoy:5,stock_based_compensation:3,total_shareholder_yield:4,buyback_yield:2,retorno_exercicio:'2025-12-31',serie_receita:[{fim:'2025-12-31',valor:3},{fim:'2024-12-31',valor:2},{fim:'2023-12-31',valor:1}],linhagem_indicadores:{revenue_growth_yoy:pr,stock_based_compensation:pr,total_shareholder_yield:pr}}}});
 const r=s.universe_rows[0];assert.equal(r.revenue_growth_yoy,5);assert.equal(r.stock_based_compensation,3);assert.equal(r.buyback_yield,2);assert.equal(r.sec_facts_at,'2025-12-31');assert.equal(r.serie_receita_sec.length,3);
});
test('v1053 snapshot do KV vencido é trocado pelo do GitHub',async()=>{
 const G=await mod;
 const old={ok:true,market:'BR',universe_complete:true,last_update:'2026-11-24T00:00:00Z',universe_rows:[{ticker:'AAAA3',setor:'X',empresa:'A',emissor_cnpj:'1',fundamentais_em:'2026-11-24',roe:10,preco_referencia:10}]};
 const novo={...old,last_update:new Date().toISOString(),universe_rows:[{...old.universe_rows[0],fundamentais_em:new Date().toISOString().slice(0,10),roe:20}]};
 G.configurarGrahamV1053({github:async()=>novo,cvm:async()=>null});
 const p=await G.carregarGrahamV1014({},{},'AAAA3',async()=>new Response(JSON.stringify(old),{headers:{'X-Snapshot-Stale':'1'}}));
 assert.equal(p[0].metricas.roe,20);assert.equal(p[0].defasado,false);
 G.configurarGrahamV1053({github:undefined,cvm:undefined});
});
