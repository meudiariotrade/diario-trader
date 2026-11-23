'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {validate,main,serverWritten,countRoutes}=require('../scripts/auditar-egress-v938.cjs');
test('v938: origens públicas não voltam ao Supabase e dados de servidores não vão ao D1 prematuramente',()=>{
 const safe=validate();
 for(const key of Object.keys(serverWritten))assert.equal(safe.includes(key),false,key);
 assert.ok(safe.includes('carteira_cfg'));
 assert.ok(safe.includes('aulas_glossario_tts'));
});
test('v938: levantamento estático cobre chamadas de funções e tabelas sem rede',()=>{
 const report=main();
 assert.ok(report.funcoes_restantes>=8);
 assert.ok(report.tabelas_restantes>=8);
 assert.ok(report.arquivos_src_inspecionados>30);
 assert.equal(report.metodo,'inspecao_estatica_sem_rede');
 assert.ok(report.funcoes.analise,'IA legada deve aparecer na auditoria');
 assert.ok(report.tabelas.operacoes_profit,'ponte Profit deve aparecer na auditoria');
});
test('v938: o contador de rotas não confunde caminho de arquivo com conteúdo',()=>{
 const file=path.join(__dirname,'../src/shared/mercado-cloudflare-v894.js');
 const out=countRoutes([file],/\/functions\/v1\/([a-zA-Z0-9_-]+)/g);
 assert.equal(typeof out,'object');
 assert.ok(Object.values(out).every(x=>x.ocorrencias>0&&x.arquivos.every(y=>y.startsWith('src/'))));
});
