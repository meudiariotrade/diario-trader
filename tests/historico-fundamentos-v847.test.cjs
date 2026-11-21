const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('v847: CVM DFP → receita, lucro, PL, caixa, dívida, dividendos e ações (versão mais recente, escala MIL)',()=>{
 const m=require('../scripts/cvm-historico.cjs');
 const H='CNPJ_CIA;DT_REFER;VERSAO;MOEDA;ESCALA_MOEDA;ORDEM_EXERC;DT_INI_EXERC;DT_FIM_EXERC;CD_CONTA;DS_CONTA;VL_CONTA\n';
 const L=(v,cd,ds,val,o='ÚLTIMO')=>'33.000.167/0001-01;2024-12-31;'+v+';REAL;MIL;'+o+';2024-01-01;2024-12-31;'+cd+';'+ds+';'+val+'\n';
 const emps=new Map([['33000167000101',{anos:{},grupo:{}}]]);
 m.aplicaDRE(H+L(1,'3.01','Receita',100)+L(2,'3.01','Receita',200)+L(2,'3.11','Lucro',50)+L(2,'3.11','Lucro',40,'PENÚLTIMO'),emps,2024,'con');
 m.aplicaBP(H+L(2,'1','Ativo Total',1000)+L(2,'1.01.01','Caixa',30)+L(2,'1.01.02','Aplicações',20),emps,2024,'con','A');
 m.aplicaBP(H+L(2,'2.03','Patrimônio Líquido Consolidado',400)+L(2,'2.01.04','Empréstimos e Financiamentos',60)+L(2,'2.02.01','Empréstimos e Financiamentos',90),emps,2024,'con','P');
 m.aplicaDFC(H+L(2,'6.03.05','Dividendos e JCP pagos',-15)+L(2,'6.03.05.01','Dividendos pagos',-10)+L(2,'6.03.05.02','Juros sobre o capital próprio pagos',-5),emps,2024,'con');
 m.aplicaCapital('CNPJ_CIA;VERSAO;QT_ACAO_TOTAL_CAP_INTEGR;QT_ACAO_TOTAL_TESOURO\n33.000.167/0001-01;1;1000;10\n',emps,2024);
 assert.deepEqual(emps.get('33000167000101').anos[2024],{rec:200000,luc:50000,at:1000000,cx:50000,pl:400000,div:150000,dvd:15000,acoes:990});
 const t={};m.aplicaTickers('CNPJ_Companhia;Codigo_Negociacao\n33.000.167/0001-01;PETR4\n33.000.167/0001-01;;\n',t);assert.deepEqual(t,{PETR4:'33000167000101'});
});
test('v847: cálculo no aparelho — ROE, margem, DY, dívida líquida, valor intrínseco e CAGR',()=>{
 const H=require('../src/analysis/historico-fundamentos.js');
 const anos={};for(let a=2016;a<=2025;a++){const i=a-2016;anos[a]={rec:1000+100*i,luc:100+20*i,pl:1000,cx:50,div:250,dvd:50,acoes:100}}
 const t0=Date.UTC(2016,0,31)/1000,meses=[...Array(120)].map((_,k)=>[t0+k*30.44*86400,10+k*0.1,10+k*0.12]);
 const c=H.calcular({anos},{meses,dividendos:[[Date.UTC(2025,5,1)/1000,1]]});
 const u=c.serie.at(-1);
 assert.equal(c.serie.length,10);assert.ok(Math.abs(u.roe-0.28)<1e-9);assert.ok(Math.abs(u.margem-280/1900)<1e-9);
 assert.equal(u.dl,200);assert.ok(Math.abs(u.intrinseco-Math.sqrt(22.5*280*1000)/100)<1e-9);
 assert.ok(Math.abs(c.crescimento.lucros-(Math.pow(280/100,1/9)-1))<1e-9);assert.ok(c.crescimento.totalReturn>c.crescimento.valorMercado);
 assert.ok(c.historico.roe<c.atual.roe);assert.match(H.velocimetro('roe',.2,.1,'ROE'),/<svg[^>]*hf-gauge/);
});
test('v847: rotas públicas na Cloudflare, workflow semanal no GitHub e recursos da ficha',()=>{
 const w=fs.readFileSync('cloudflare/diario-screeners/index.mjs','utf8');assert.match(w,/\/v1\/cvm-historico/);assert.match(w,/\/v1\/historico-preco/);assert.match(w,/range=10y&interval=1mo&events=div/);
 const y=fs.readFileSync('.github/workflows/cvm-historico.yml','utf8');assert.match(y,/node scripts\/cvm-historico\.cjs/);assert.match(y,/dados-publicos\/cvm-historico\.json/);
 const a=fs.readFileSync('src/analysis/analises.js','utf8');
 for(const r of [/data-hf-abrir/,/function tecnicoFicha/,/OBS_KEY='dt-observar-v847'/,/'observados','Só observados'/,/data-scr-sim/,/async function abaixoDoTeto/,/an847-mais/,/do setor /])assert.match(a,r);
 const f=fs.readFileSync('src/analysis/historico-fundamentos.js','utf8');assert.doesNotMatch(f,/supabase\.co|functions\/v1|setInterval/);assert.match(f,/diario:render/);
 assert.match(fs.readFileSync('src/index.html','utf8'),/historico-fundamentos\.js/);
});
