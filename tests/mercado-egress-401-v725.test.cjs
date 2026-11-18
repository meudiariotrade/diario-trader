const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const core = fs.readFileSync('src/domains/core/07-conta-e-integracoes.js','utf8');
const layers = fs.readFileSync('src/domains/layers/01-navegacao-e-fluxos.js','utf8');

test('v725: chamadas da macro anexam Bearer quando existe sessão',()=>{
  assert.match(core,/function macroAuthHeaders\(config\)/);
  assert.match(core,/h\.Authorization = "Bearer " \+ SESS\.at/);
  assert.match(core,/edgeFetchAutenticado\(t\.url \+ "\/functions\/v1\/macro", \{\s*method: "POST",\s*headers: macroAuthHeaders\(t\)/);
  assert.match(core,/edgeFetchAutenticado\(e\.url \+ "\/functions\/v1\/macro", \{\s*method: "POST",\s*headers: macroAuthHeaders\(e\)/);
  assert.match(core,/edgeFetchAutenticado\(a\.url \+ "\/functions\/v1\/macro", \{\s*method: "POST",\s*headers: macroAuthHeaders\(a\)/);
  assert.match(layers,/modo: "agenda", semana: sem/);
  assert.match(layers,/edgeFetchAutenticado\(a0\.url \+ "\/functions\/v1\/macro"/);
  assert.match(layers,/Authorization: "Bearer " \+ SESS\.at/);
});
test('v725: falhas da macro limitam polling e setorial não tenta a cada 30 segundos',()=>{
  assert.match(core,/MDO\.errTs && Date\.now\(\) - MDO\.errTs < 2 \* 6e4/);
  assert.match(core,/if \(!t\.ok\) \{ MDO\.errTs = Date\.now\(\); return; \}/);
  assert.match(core,/SET\.err = String\(a\.message \|\| a\)\), \(SET\.ts = Date\.now\(\)\)/);
});
