const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('src/domains/core/07-conta-e-integracoes.js','utf8'),c={};vm.createContext(c);vm.runInContext(src.slice(src.indexOf('// v1016 — simulação'),src.indexOf('const AUREA_METODO_V1007')),c);
const modules=Promise.all([import('../cloudflare/diario-screeners/aurea-resumao-v904.mjs'),import('../cloudflare/diario-screeners/aurea-debate-v1013.mjs'),import('../cloudflare/diario-screeners/graham-fundamentos-v1014.mjs')]);
const cases=[
 ['livermore','gráfico VALE3 tendência pivô resistência','pivôs'],
 ['graham','valuation ticker: AAPL ROIC lucro','caixa'],
 ['munger','minha tese o que pode dar errado','premissa'],
 ['markowitz','minha carteira concentração rebalanceamento','concentração'],
 ['schwartz','Copom inflação emprego','inflação'],
 ['dalio','geopolítica dívida pública resultado primário','dívida'],
 ['helmer','vantagem competitiva 7 Powers ticker: NVDA','barreira'],
 ['dow','como funciona a duration','exemplo']
];
test('matriz de oito especialidades: rota natural, seleção explícita e método próprio no worker',async()=>{
 const [{metodoConselhoV1007}]=await modules;
 for(const [id,q,word] of cases){
  assert.equal(c.aureaRota(q).id,id,q);
  assert.equal(c.aureaRota('@'+id+' '+q).id,id,q);
  assert.ok(metodoConselhoV1007(id,q).toLowerCase().includes(word),id);
 }
 assert.equal(c.aureaRota('@dalio petróleo').tema,'commodities');
 assert.equal(c.aureaRota('@schwartz Treasury 2032').tema,'renda_fixa');
 assert.equal(c.aureaRota('como funciona uma trava de alta').id,'dow');
});
test('renda fixa: moeda e separadores de milhares não confundem capital; custos nunca são omitidos da ressalva',()=>{
 const now=Date.parse('2026-11-26T00:00:00Z'),q='LCA 2032-11-26 taxa: 10% a.a.';
 const a=c.aureaRendaFixaLocalV1016(q+' aporte: R$ 10.000,00 custos: 20',now);
 assert.equal(a.calculo.principal,10000);assert.ok(a.notas.some(x=>x.includes('mesmo se mencionados')));
 assert.equal(c.aureaRendaFixaLocalV1016(q+' aporte: US$ 10000',now).calculo,null);
 assert.equal(c.aureaRendaFixaLocalV1016(q+' aporte: 0',now).calculo,null);
 assert.equal(c.aureaRendaFixaLocalV1016(q+' aporte: 10mil',now).calculo,null);
});
test('Graham BR/EUA e setores: identificação não usa modelo industrial para bancos e REITs',async()=>{
 const [,,g]=await modules;
 for(const [q,sector,industry,market,tipo] of [['ITUB4','Financeiro','Bancos','BR','banco'],['ticker: JPM','Financials','Banks','US','banco'],['ticker: O','Real Estate','REIT','US','imobiliario'],['ticker: NVDA','Technology','Semiconductors','US','semicondutores'],['ticker: MSFT','Technology','Software','US','software']]){
  assert.equal(g.tickersGrahamV1014(q)[0].market,market);
  assert.equal(g.modeloGrahamV1014({sector,industry},market).tipo,tipo);
 }
});
test('simula passagem de todos os oito perfis e síntese sem votos fictícios (modelo injetado)',async()=>{
 const [,d]=await modules;const env={SCREENER_CACHE:{get:async()=>null,put:async()=>{}}};
 const request=body=>new Request('https://worker.example/v1/aurea-debate',{method:'POST',headers:{Origin:'https://meudiariotrade.github.io','Content-Type':'application/json'},body:JSON.stringify(body)});
 const raw={resumo:'Cenários hipotéticos para auditoria do contrato.',pareceres:cases.map(([id])=>({id,status:'parecer',argumento:'Hipótese simulada da lente '+id+'; não é recomendação.',base:'Fixture de regressão, sem dado real'}))};
 const synthesis={sintese:'Conclusão condicional dos pareceres simulados.',alternativo:'Cenário alternativo ainda não comprovado.',confirmacao:'Confirmar a hipótese com evidência observável.',invalidacao:'Invalidar se os dados contradisserem a hipótese.',convergencias:[{ids:['livermore','munger'],texto:'Ambos exigem confirmação antes de aceitar a hipótese.'}],divergencias:[],lacunas:['Dados reais não foram fornecidos']};
 let n=0;const deps={auth:async()=>'audit-fixture',generate:async(e,prompt,edition,validate)=>{n++;const resultado=n===1?raw:synthesis;assert.ok(validate(resultado));assert.equal(edition,'central');return {model:'fixture',text:JSON.stringify({resultado})}}};
 const r=await d.debateV1013(request({fase:'pareceres',pergunta:'Exercício de auditoria'}),env,deps);assert.equal(r.status,200);const j=await r.json();assert.equal(j.resultado.pareceres.length,8);assert.equal(j.resultado.pareceres.filter(p=>p.status==='parecer').length,8);
 const s=await d.debateV1013(request({fase:'debate',pergunta:'Exercício de auditoria',rodada:j.resultado}),env,deps);assert.equal(s.status,200);assert.equal((await s.json()).resultado.divergencias.length,0);assert.equal(n,2);assert.match(s.headers.get('cache-control'),/no-store/);
});
test('fallback por contrato: JSON válido mas incompleto não encerra a cadeia; reserva completa aceita',async()=>{
 const [{generate},d]=await modules;const old=global.fetch;let m=0,g=0;
 const good={resumo:'Parecer condicional com evidência insuficiente.',explicacao:['Conferir dados antes de concluir.']};
 try{global.fetch=async(url)=>{if(String(url).includes('mistral')){m++;return Response.json({choices:[{message:{content:JSON.stringify({resultado:{foo:'incompleto'}})}}]})}if(String(url).includes('groq')){g++;return Response.json({choices:[{message:{content:JSON.stringify({resultado:good})}}]})}throw Error('unexpected network')};
 const r=await generate({MISTRAL_API_KEY:'mock',GROQ_API_KEY:'mock'},'simulação','central',raw=>d.normalizarOpcoesParecerV1017(raw,'livermore'));assert.equal(m,1);assert.equal(g,1);assert.match(r.model,/Groq/);assert.equal(JSON.parse(r.text).resultado.resumo,good.resumo);
 }finally{global.fetch=old}
});
test('falha total não fabrica parecer e não chama fallback anônimo para consulta privada',async()=>{
 const [{generate}]=await modules;const old=global.fetch;const urls=[];
 try{global.fetch=async url=>{urls.push(String(url));return Response.json({}, {status:503})};const r=await generate({MISTRAL_API_KEY:'mock',GROQ_API_KEY:'mock',ALLOW_PUBLIC_AI_FALLBACK:'1'},'exercício','central');assert.equal(r.status,503);assert.ok(!r.text);assert.equal(urls.length,2);assert.ok(urls.every(x=>/mistral|groq/.test(x)))}finally{global.fetch=old}
});
