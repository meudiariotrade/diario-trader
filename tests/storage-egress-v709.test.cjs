const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const rd=p=>fs.readFileSync(p,'utf8');

test('v709: arquivo PDF de resumos não passa pelo Supabase Storage',()=>{
 const core=rd('src/domains/core/04-analises-e-estudos.js');
 const local=rd('src/studies/resumo-local-v709.js');
 assert.doesNotMatch(core,/\/storage\/v1\/object\/livros\//);
 assert.match(core,/window\.ResumosLocais\.gerar\(e,t,a,o\)/);
 assert.match(core,/Object\.entries\(RS\.jobs\).*j\?\.local/s);
 assert.match(local,/EstudosLocal\.put\('livro-pdf'/);
 assert.match(local,/EstudosLocal\.put\('resumo-local'/);
 assert.match(local,/ntLib\(\)/);
 assert.doesNotMatch(local,/\/storage\/v1\//);
 assert.match(rd('supabase/functions/resumo/index.ts'),/texto_local_parte/);
 assert.match(rd('supabase/functions/resumo/index.ts'),/texto_local_final/);
});
test('v709: ponte gera e serve MP4 local, sem upload automático',()=>{
 const bridge=rd('bridge-video/ponte_video.py');
 assert.doesNotMatch(bridge,/\/storage\/v1\/object\/aulas-videos\//);
 assert.match(bridge,/\.diario-videos/);
 const server=rd('bridge-video/servidor_local.py');
 assert.match(server,/127\.0\.0\.1/);
 assert.match(server,/Range/);
 assert.match(server,/ALLOWED_ORIGIN/);
 const browser=rd('src/studies/tecnica-aulas.js');
 assert.match(browser,/127\.0\.0\.1:8766/);
 assert.match(browser,/EstudosLocal\.put\('mentor-video'/);
});
test('v709: credencial de gerenciamento não vai para configuração pública',()=>{
 const conf=rd('config.js'),bridge=rd('bridge-video/ponte_video.py');
 assert.doesNotMatch(conf,/sbp_[a-f0-9]{30,}/);
 assert.doesNotMatch(bridge,/sbp_[a-f0-9]{30,}/);
 const rel=JSON.parse(rd('release.config.json'));
 assert.ok(rel.version>=709);
 assert.ok(rel.sources['src/app-layers.js'].includes('src/studies/resumo-local-v709.js'));
});

test('v709: scripts Python da ponte possuem sintaxe válida',()=>{
 const {spawnSync}=require('node:child_process');
 const p=spawnSync('python3',['-m','py_compile','bridge-video/ponte_video.py','bridge-video/servidor_local.py','bridge-video/tecnica_video.py'],{encoding:'utf8'});
 if(p.error?.code==='ENOENT')return; // Ferramenta opcional fora do ambiente de deploy.
 assert.equal(p.status,0,p.stderr||p.stdout);
});
