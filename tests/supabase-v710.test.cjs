const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const txt=p=>fs.readFileSync(p,'utf8');
const ref='vdzwydizostutukppcsj';
const key='sb_publishable_LjeuewTU7OjYrNiRzM2nJQ_iAa9UCkC';
test('v710: URL e chave publica no frontend e ponte',()=>{
 const config=txt('config.js'),bridge=txt('bridge-video/ponte_video.py');
 assert.ok(config.includes('https://'+ref+'.supabase.co'));
 assert.ok(config.includes(key));
 assert.ok(bridge.includes('https://'+ref+'.supabase.co'));
 assert.ok(bridge.includes(key));
 assert.ok(txt('supabase/config.toml').includes('project_id = "'+ref+'"'));
 assert.equal(JSON.parse(txt('release.config.json')).version,710);
 assert.doesNotMatch(config,/sbp_[a-f0-9]{30,}|SUPABASE_SERVICE_ROLE_KEY/);
});
test('v710: tokens de sessao separados por projeto',()=>{
 const src=txt('src/domains/core/02-estado-e-persistencia.js');
 assert.match(src,/projectUrl: cfg\(\)\?\.url/);
 assert.match(src,/SESS\.projectUrl!==principal/);
});
test('v710: migration historica compila para o novo ref, sem segredos literais',()=>{
 const dir='supabase/migrations',paths=fs.readdirSync(dir).filter(p=>p.endsWith('.sql'));
 assert.ok(paths.length>=20);
 for(const file of paths){
  const s=txt(dir+'/'+file);
  assert.doesNotMatch(s,/wbpsmszecpzioaijfnsl/,'Referencia antiga na migration '+file);
 }
 assert.match(txt(dir+'/20261112193356_baseline_v580.sql'),/9223372036854775807/);
 assert.match(txt(dir+'/20261117010000_crons_desativados_v710.sql'),/active := false/);
 assert.match(txt(dir+'/20261117012000_permissoes_seguras_v710.sql'),/revoke truncate, references, trigger/i);
});
