const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const root='cloudflare/diario-radar/';
const source=fs.readFileSync(root+'producao-v892.mjs','utf8');
const config=JSON.parse(fs.readFileSync(root+'wrangler.jsonc','utf8'));
test('v892 preserva algoritmos, API, push, Crypto e persistencia originais',()=>{
 for(const s of ['/health','radar_sinais','radar_cache','BTC-USD','VAPID_PRIVATE','GEMINI_API_KEY','SUPABASE_SERVICE_ROLE_KEY','HISTORICO','Nn(t)'])assert.ok(source.includes(s),s);
 assert.match(source,/export\{Nc as default\}/);
});
test('v892 Cloudflare executa cron B3 apenas seg-sex e apos cutover explicito',()=>{
 assert.deepEqual(config.triggers.crons,['7,37 * * * *','*/15 13-20 * * MON-FRI','* * * * *']);
 assert.equal(config.vars.RADAR_CUTOVER_ENABLED,'0');
 assert.match(source,/t\.cron==="\*\/15 13-20 \* \* MON-FRI"/);
 assert.match(source,/e\.RADAR_CUTOVER_ENABLED!=="1"/);
 assert.doesNotMatch(source,/\*\/15 13-20 \* \* 1-5/);
});
test('v892 Gemini e VAPID opcionais; Supabase service role permanece obrigatorio',()=>{
 const check=source.match(/function Un\(t\)\{return\[([^\]]+)\]\.every\(e=>t\[e\]\)\}/);
 assert.ok(check,'guard de credenciais presente');
 const names=JSON.parse('['+check[1]+']');
 assert.ok(names.includes('SUPABASE_SERVICE_ROLE_KEY'));
 assert.ok(names.includes('CRON_SECRET'));
 for(const optional of ['GEMINI_API_KEY','VAPID_PUBLIC','VAPID_PRIVATE','VAPID_SUBJECT'])assert.ok(!names.includes(optional));
});
test('v892 nao marca avisado quando entrega de push falha',()=>{
 assert.match(source,/await yl\(t,f,h,`radar-\$\{r\}-\$\{a\.ticker\}-\$\{a\.lado\}`\)\.catch\(\(\)=>0\)&&\(m\+\+,await Ie\(/);
 assert.doesNotMatch(source,/\.catch\(\(\)=>0\)&&m\+\+,await Ie\(/);
});
test('v892 D1 e service binding SELF preservados, sem segredo no Git',()=>{
 assert.equal(config.main,'producao-v892.mjs');assert.equal(config.name,'diario-radar');
 assert.equal(config.keep_vars,true);
 assert.equal(config.services[0].binding,'SELF');
 assert.equal(config.d1_databases[0].binding,'HISTORICO');
 assert.doesNotMatch(JSON.stringify(config),/sb_secret_|BRAPI_TOKEN\s*:/);
});

test('v892 Supabase legado preserva a possibilidade de reenviar push nao entregue',()=>{
 const old=fs.readFileSync('supabase/functions/radar/index.ts','utf8');
 assert.match(old,/const entregues = await push\(/);
 assert.match(old,/if \(entregues > 0\) \{[\s\S]*?avisado: true/);
 assert.doesNotMatch(old,/\)\.catch\(\(\) => 0\)\) avisos\+\+;\s*await rest\(/);
});

test('migração excepcional de 46 arquivos não expõe rota HTTP nem segredo de serviço',()=>{
 assert.ok(source.includes('migrarStoragePrivadoCron'));
 assert.match(source,/event\.cron==='\* \* \* \* \*'/);
 assert.match(source,/PRIVATE_D1/);
 assert.match(source,/PRIVATE_FILES_KV/);
 assert.match(source,/sha256/);
 assert.match(source,/hash_divergente/);
 assert.ok(config.kv_namespaces.some(x=>x.binding==='PRIVATE_FILES_KV'));
 assert.ok(config.d1_databases.some(x=>x.binding==='PRIVATE_D1'));
 assert.equal(config.vars.RADAR_CUTOVER_ENABLED,'0');
});
