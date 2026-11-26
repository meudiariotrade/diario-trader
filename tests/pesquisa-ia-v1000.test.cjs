'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const env=k=>({PESQUISA_CLOUDFLARE:'1',GEMINI_API_KEY:'fake'})[k];
const data=()=>({dados:{ABBV:{ticker:'ABBV',nome:'AbbVie',mercado:'EUA',moeda:'USD',preco:294.48,hora:new Date().toISOString(),fontes:[],trimestral:{},anual:{}}},fontes:[],consultado_em:new Date().toISOString()});
const calc={tecnico:[{ticker:'ABBV',estudo:{dailyTrend:'alta',weeklyTrend:'indefinida',rsi:52,tech:{},opcoes:{}},valuation:{preco:294.48,graham:200,margens:{},premissas:{}},candles:250}],calculado_em:new Date().toISOString()};
const narrative='A estrutura diária apresenta uma tendência de alta, enquanto a leitura semanal permanece indefinida. O momentum está neutro. A avaliação deve considerar as referências disponíveis nas tabelas, sem confundir estimativa de valor com retorno garantido.';
test('reproduz Gemini indisponível e resposta com 0 e 100; reserva independente validada para ANALISE',async()=>{
 const {redigir}=await import('../supabase/functions/pesquisa/motor.ts');
 let chamadas=0;
 const fetcher=async u=>{chamadas++;if(String(u).includes('gemini-3.8'))return Response.json({error:{message:'high demand'}},{status:503});return Response.json({candidates:[{content:{parts:[{text:narrative+' RSI varia entre 0 e 100.'}]}}]})};
 const r=await redigir({modo:'ANALISE',texto:'ANALISE ABBV',tickers:['ABBV']},data(),calc,env,fetcher,async()=>narrative);
 assert.ok(chamadas>=2);assert.match(r.modelo,/Cloudflare Workers AI/);assert.equal(r.ia_erro,null);assert.ok(!r.texto.includes('high demand'));
});
test('reserva inválida mantém síntese determinística, sem expor mensagens de provedores',async()=>{
 const {redigir}=await import('../supabase/functions/pesquisa/motor.ts');
 const r=await redigir({modo:'TECNICO',texto:'TECNICO ABBV',tickers:['ABBV']},data(),calc,env,async()=>Response.json({error:{message:'secret provider debug'}},{status:503}),async()=>narrative+' preço 999');
 assert.match(r.modelo,/sem IA/);assert.ok(r.ia_erro);assert.match(r.texto,/Estrutura diária: alta/);assert.doesNotMatch(r.texto,/secret provider debug|preço 999|HTTP 503/);
});
test('indicadores e ticker não liberam preços arbitrários',async()=>{
 const {semIdentificadoresPesquisa}=await import('../supabase/functions/pesquisa/motor.ts');
 assert.doesNotMatch(semIdentificadoresPesquisa('1. PETR4 e MM200','PETR4 MM200',['PETR4']),/\d/);
 assert.match(semIdentificadoresPesquisa('RSI 14 e preço 100','RSI 14',[]),/100/);
});
