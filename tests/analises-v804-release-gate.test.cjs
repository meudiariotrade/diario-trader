'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {verify}=require('../scripts/analises-release-gate-v804.cjs');
test('v804: bundles presentes e gates de segurança/financeiro ativos',()=>{
 const r=verify();
 assert.equal(r.version,804);
 assert.equal(r.codeGate,true,JSON.stringify(r.failures));
 assert.equal(r.checks,10);
 assert.equal(r.integratedScenarios,7);
});
test('v804: não declarar homologação externa sem licença e auditoria real',()=>{
 const r=verify();
 for(const key of ['windowsProfitDLL','economaticaMcp','cvmSecComplete','quoteLatency'])
  assert.match(r.externalHomologation[key],/PENDENTE/);
 assert.match(r.conclusion,/externos permanecem condicionais/);
});
