'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const cvm=require('../scripts/cvm-official-batch.cjs');
const fixture=()=>{
 const id='12345678000190';
 const doc={cnpj:id,formulario:'ITR',documento_id:'12345',
  competencia:'2026-09-30',publicado_em:'2026-11-10',versao:'1',
  grupo_dre:'consolidado',linhagem:{}};
 const row={CNPJ_CIA:'12.345.678/0001-90',DT_REFER:'2026-09-30',DT_FIM_EXERC:'2026-09-30',
  VERSAO:'1',ORDEM_EXERC:'ÚLTIMO',MOEDA:'REAL',ESCALA_MOEDA:'MIL',CD_CONTA:'1.01',VL_CONTA:'1.234,56'};
 return {docs:new Map([[id,doc]]),row,doc};
};
test('v785: contas BPA preservam escala, documento, competência e grupo',()=>{
 const f=fixture();
 assert.equal(cvm.applyStatement(f.docs,'itr','BPA_con',[f.row]),1);
 const p=f.doc.linhagem.ativo_circulante_bpa;
 assert.equal(p.valor_reportado,1234.56);
 assert.equal(p.escala_moeda,'MIL');
 assert.equal(p.documento_id,'12345');
 assert.equal(p.competencia,'2026-09-30');
 assert.equal(p.valida_indicador_ttm,false);
 assert.equal(cvm.applyStatement(f.docs,'itr','BPA_con',[f.row]),0);
});
test('v785: nunca mesclar demonstrações individuais e consolidadas',()=>{
 const f=fixture();
 assert.equal(cvm.applyStatement(f.docs,'itr','BPP_ind',[{...f.row,CD_CONTA:'2.03'}]),0);
 assert.equal(cvm.applyStatement(f.docs,'itr','BPP_con',[{...f.row,CD_CONTA:'2.03'}]),1);
 assert.equal(f.doc.linhagem.patrimonio_liquido_bpp.valor_reportado,1234.56);
});
test('v785: DFC investimento total não equivale a CAPEX',()=>{
 const f=fixture();
 assert.equal(cvm.applyStatement(f.docs,'itr','DFC_MI_con',[{...f.row,CD_CONTA:'6.02'}]),1);
 assert.match(f.doc.linhagem.fluxo_investimento_total_dfc.observacao,/não é CAPEX/);
});
test('v785: versão, data, moeda e escala fora de prova são rejeitadas',()=>{
 const f=fixture();
 assert.equal(cvm.applyStatement(f.docs,'itr','BPA_con',[{...f.row,VERSAO:'2'}]),0);
 assert.equal(cvm.applyStatement(f.docs,'itr','BPA_con',[{...f.row,DT_REFER:'2026-03-31'}]),0);
 assert.equal(cvm.applyStatement(f.docs,'itr','BPA_con',[{...f.row,MOEDA:'USD'}]),0);
 assert.equal(Object.keys(f.doc.linhagem).length,0);
});
test('v785: mantém DRE original e espelho separado em arquivos públicos',()=>{
 const code=fs.readFileSync('scripts/cvm-official-batch.cjs','utf8');
 assert.match(code,/cvm-dre-/);assert.match(code,/cvm-demonstracoes-/);
 assert.match(code,/const dreOnly=/);assert.match(code,/const extraOnly=/);
 assert.doesNotMatch(code,/\/rest\/v1\/|supabase\.co/i);
});
