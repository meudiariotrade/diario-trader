'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../src/analysis/tecnico-engine.js');
const I=require('../src/analysis/screeners-inteligencia.js');
const bars=()=>Array.from({length:320},(_,i)=>{const p=110+Math.sin(i/7)*2;return{t:Date.UTC(2025,0,1+i),o:p-.1,h:p+1,l:p-1,c:p,v:100000}});
test('v787: grade macro usa 0%=fundo e 100%=topo, inclui negativos e expansões',()=>{
 const c=bars(),turns=[{i:83,p:80,d:-1},{i:154,p:140,d:1},
  {i:285,p:110,d:-1},{i:295,p:129,d:1}];
 const f=E.fibo(c,1,turns);
 assert.equal(f.macroConfirmed,true);
 assert.equal(f.anchor.from,80);assert.equal(f.anchor.to,140);
 const map=Object.fromEntries(f.levels.map(x=>[String(x.r),x.price]));
 assert.equal(map['0'],80);assert.equal(map['1'],140);
 assert.equal(map['-0.118'],72.92);assert.equal(map['-0.272'],63.68);
 assert.equal(map['-0.414'],55.16);assert.equal(map['-0.618'],42.92);
 assert.equal(map['1.618'],177.08);assert.equal(map['1.414'],164.84);
 assert.equal(map['1.272'],156.32);assert.equal(map['1.11'],146.6);
 assert.ok(f.defense[0]>=116&&f.defense[1]<=126);
 assert.equal(f.segments[1].role,'gatilho RMC/CISD — não redesenha grade macro');
});
test('v787: negativos não ficam abaixo do piso de R$ 0,01',()=>{
 const c=bars(),f=E.fibo(c,1,[{i:82,p:1,d:-1},{i:153,p:15,d:1}]);
 assert.equal(f.negativeBase[0].price,.01);
 assert.ok(f.levels.every(x=>x.price>=.01));
});
test('v787: ancoragem inválida não produz níveis projetados fictícios',()=>{
 const f=E.fibo(bars(),1,[]);
 assert.equal(f.macroConfirmed,false);assert.deepEqual(f.levels,[]);
});
const fixture=()=>({roe:23,roic:19,pl:9,ev_ebitda:6,fcf_yield:8,
 dividend_yield:5,payout_implicito:35,momentum_12_1:11,
 preco_referencia:8.5,lucro_projetado_brl:14613000000,total_acoes:5730834040,
 payout_projetado:25,dpa_12m:.84,dpa_media_consistente_5a:.75,lpa:3.5,vpa:15,
 valuation_insumos_conferidos:true});
test('v787: quatro métodos certificados entram em 20% do pilar Valuation (30% total)',()=>{
 const row=fixture(),val=I.valuationBR(row),groups=I.calculate('BR',row);
 assert.equal(val.scoreActive,true);assert.ok(val.compositeMargin!==null);
 const legacy=I.calculate('BR',{...row,valuation_insumos_conferidos:false});
 assert.ok(Math.abs(groups[1]-(legacy[1]*.8+val.scoreValuation*.2))<1e-8);
 assert.equal(I.diagnostics('BR',{...row,score_model_version:'v2.2-val'}).expectedVersion,'v2.2-val');
});
test('v787: sem prova completa mantém score anterior, sem inventar DPA/lucro',()=>{
 const row=fixture();delete row.dpa_media_consistente_5a;
 const v=I.valuationBR(row);
 assert.equal(v.scoreActive,false);
 const original=I.calculate('BR',{...row,valuation_insumos_conferidos:false})[1];
 assert.equal(I.calculate('BR',row)[1],original);
});
test('v787: fórmula própria aceita lucro TTM derivado de valuation somente com comprovação',()=>{
 const row=fixture();delete row.lucro_projetado_brl;
 row.valor_mercado_brl=90000000000;row.pl=10;
 const val=I.valuationBR(row);
 assert.equal(val.lucroBase,'lucro TTM implícito (valor de mercado / P/L)');
 assert.ok(Math.abs(val.methods.proprio-(90000000000/10*.25/5730834040/.07))<1e-10);
 const absent=I.valuationBR({...row,valuation_insumos_conferidos:false});
 assert.equal(absent.methods.proprio,null);
});
test('v787: SQL e JS explicitam mesmos pesos, limites e fontes do score',()=>{
 const sql=fs.readFileSync('supabase/migrations/20261119110000_analises_valor_composto_v787.sql','utf8');
 assert.match(sql,/v:=v\*0\.80\+v_val\*0\.20/);
 assert.match(sql,/composite:=\(m1\+m2\+m3\+m4\)\/4/);
 assert.match(sql,/greatest\(0,least\(100,50\+composite\)\)/);
 assert.match(sql,/valuation_insumos_conferidos/);
 assert.match(sql,/data_competencia_balanco|documento_balanco/);
 assert.doesNotMatch(sql,/\b(?:DROP|TRUNCATE|DELETE)\b/i);
});
test('v787: PDF deixa labels da grade em corredor lateral com separação real',()=>{
 const code=fs.readFileSync('src/analysis/tecnico-pdf.js','utf8');
 assert.match(code,/canvas\.width=1600;canvas\.height=1000/);
 assert.match(code,/const labelQueue=\[\]/);
 assert.match(code,/gap=22/);
 assert.match(code,/drawPriceLabels\(\)/);
 assert.match(code,/const labelX=right\+10,width=R-20/);
 assert.match(code,/^ *ctx\.fillRect\(labelX,p\.y-10,width,20\)/m);
});
