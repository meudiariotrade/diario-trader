'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const I=require('../src/analysis/screeners-inteligencia.js');
const fn=I.financialSubtype;

test('v770: BCO abreviado e bancos financeiros explícitos têm regra própria',()=>{
  for(const company of ['BCO BRASIL S.A.','BCO BRADESCO S.A.','BCO BTG PACTUAL S.A.','BCO SANTANDER (BRASIL) S.A.','JPMorgan Chase & Co.','Morgan Stanley','Goldman Sachs Group, Inc.','Wells Fargo & Company','Citigroup Inc.','Capital One Financial Corp','PNC Financial Services Group, Inc.'])
    assert.equal(fn({setor:'Finance',empresa:company}),true,company);
  for(const company of ['Chubb Limited','Progressive Corporation','Allstate Corporation','Travelers Companies, Inc.'])
    assert.equal(fn({setor:'Finance',empresa:company}),true,company);
});
test('v770: Finance genérico não transforma REIT, gestora ou locadora em banco',()=>{
  for(const company of ['LOCALIZA RENT A CAR S.A.','BLACKROCK, INC.','Welltower Inc.','Prologis, Inc.','Visa Inc. Class A','Berkshire Hathaway Inc. Class B'])
    assert.equal(fn({setor:'Finance',empresa:company}),false,company);
  assert.equal(fn({setor:'Industrials',empresa:'BCO BRASIL S.A.'}),false);
});
test('v770: migration aditiva preserva v769 e reconhece abreviações SQL',()=>{
  const sql=fs.readFileSync('supabase/migrations/20261118200500_analises_subtipos_financeiros_v770.sql','utf8');
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.quant_v2_score/);
  assert.match(sql,/banking\|bco\|jpmorgan/);
  assert.match(sql,/quant_v2_recalcular_lote\('BR'/);
  assert.match(sql,/quant_v2_recalcular_lote\('US'/);
  assert.match(sql,/snapshot_refresh\('BR'\)/);
  assert.match(sql,/snapshot_refresh\('US'\)/);
  assert.doesNotMatch(sql,/\b(?:DROP|TRUNCATE|DELETE)\b/i);
});
