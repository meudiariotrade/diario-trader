'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const mod=()=>import('../cloudflare/diario-screeners/aurea-imagem-v1004.mjs');
test('v1043: níveis válidos passam, inválidos caem, máximo 8',async()=>{
 const {niveisAureaV1043}=await mod();
 const ok=niveisAureaV1043([{tipo:'pescoco',preco:173300,y:.46,rotulo:'rompido'},{tipo:'alvo',preco:182600,y:.32},{tipo:'xpto',preco:1,y:.1},{tipo:'suporte',preco:-1,y:.5},{tipo:'suporte',preco:164000,y:1.4}]);
 assert.equal(ok.length,2);assert.equal(ok[0].rotulo,'rompido');
 assert.equal(niveisAureaV1043(Array.from({length:12},()=>({tipo:'suporte',preco:1,y:.5}))).length,8);
});
test('v1043: padrão gráfico com números positivos ou null',async()=>{
 const {padraoAureaV1043}=await mod();
 assert.deepEqual(padraoAureaV1043({nome:'fundo duplo',pescoco:173300,altura:9300,alvo:182600,invalidacao:-5,confirmacao:'fechou acima do pescoço'}),{nome:'fundo duplo',pescoco:173300,altura:9300,alvo:182600,invalidacao:null,confirmacao:'fechou acima do pescoço'});
 assert.equal(padraoAureaV1043({}),null);
});
test('v1043: protocolo pede topos/fundos, níveis, padrão, alvo medido e proíbe notação R',()=>{
 const s=fs.readFileSync('cloudflare/diario-screeners/aurea-imagem-v1004.mjs','utf8');
 assert.match(s,/PROTOCOLO_V1043=/);assert.match(s,/pescoço ± altura/);assert.match(s,/Nunca use notação R/);
 assert.equal((s.match(/PROTOCOLO_V1021\+PROTOCOLO_V1043/g)||[]).length,2);
 const c=fs.readFileSync('src/domains/layers/01-navegacao-e-fluxos.js','utf8');
 assert.match(c,/v1043: linhas horizontais/);assert.match(c,/alvo medido/);
});
