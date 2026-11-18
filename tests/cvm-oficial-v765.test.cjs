'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../scripts/cvm-official-batch.cjs'),sync=fs.readFileSync('supabase/functions/screeners-sync/index.ts','utf8');
const workflow=fs.readFileSync('.github/workflows/cvm-oficial.yml','utf8');
test('CSV CVM: aspas e decimal misto sem alterar escala',()=>{
 const rows=P.csvRecords('CNPJ_CIA;DENOM_SOCIAL;VL_CONTA\n11.111.111/0001-11;"CIA; EXEMPLO";1234.000000\n22.222.222/0001-22;OUTRA;2,25');
 assert.equal(rows[0].DENOM_SOCIAL,'CIA; EXEMPLO');
 assert.equal(P.cvmNumber(rows[0].VL_CONTA),1234);
 assert.equal(P.cvmNumber(rows[1].VL_CONTA),2.25);
 assert.equal(P.cvmNumber('1.234,50'),1234.5);
 assert.equal(P.cvmNumber('falha'),null);
});
test('Metadados CVM só aceitam data, documento e versão rastreáveis',()=>{
 const base={CNPJ_CIA:'11.111.111/0001-11',DT_REFER:'2026-09-30',DT_RECEB:'2026-11-15',ID_DOC:'123456',VERSAO:'2'};
 const d=P.candidate(base,'itr');
 assert.equal(d.cnpj,'11111111000111');
 assert.equal(d.documento_id,'123456');
 assert.equal(P.candidate({...base,DT_RECEB:'2026-04-01'},'itr'),null);
 assert.equal(P.candidate({...base,VERSAO:''},'itr'),null);
 assert.equal(P.better(d,{...d,publicado_em:'2026-11-16'}),true);
});
test('DRE: origem comprovada, mesmo CNPJ/versão e sem homologar TTM automaticamente',()=>{
 const d=P.candidate({CNPJ_CIA:'11.111.111/0001-11',DT_REFER:'2026-09-30',DT_RECEB:'2026-11-15',ID_DOC:'123456',VERSAO:'2'},'itr');
 const docs=new Map([[d.cnpj,d]]);
 const ok={CNPJ_CIA:'11.111.111/0001-11',DT_REFER:'2026-09-30',VERSAO:'2',
  DT_INI_EXERC:'2026-01-01',DT_FIM_EXERC:'2026-09-30',ORDEM_EXERC:'ÚLTIMO',MOEDA:'REAL',ESCALA_MOEDA:'MIL',CD_CONTA:'3.01',VL_CONTA:'9356000.000000000'};
 const n=P.applyDre(docs,'itr','DRE_con',[{...ok,VERSAO:'1'},ok,{...ok,CD_CONTA:'3.11',VL_CONTA:'-955000.000'}]);
 assert.equal(n,2);
 assert.equal(d.linhagem.receita_liquida_dre.valor_reportado,9356000);
 assert.equal(d.linhagem.receita_liquida_dre.valida_indicador_ttm,false);
 assert.equal(d.linhagem.receita_liquida_dre.documento_id,'123456');
 assert.equal(d.linhagem.lucro_prejuizo_dre.escala_moeda,'MIL');
 assert.equal(P.applyDre(docs,'itr','DRE_ind',[ok]),0);
});
test('Lote CVM usa GitHub uma vez por semana, não supabase nem laço de consultas',()=>{
 assert.match(workflow,/schedule:/);
 assert.match(workflow,/cron: '45 4 \* \* 6'/);
 assert.match(workflow,/contents: write/);
 assert.match(workflow,/node scripts\/cvm-official-batch.cjs/);
 assert.match(sync,/cvm-dre-/);
 assert.match(sync,/documento_id/);
 assert.doesNotMatch(sync,/setInterval\(/);
});
