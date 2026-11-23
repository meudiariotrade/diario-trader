#!/usr/bin/env node
'use strict';
/* v938 — auditoria estática de dependências. Nunca conecta a rede, banco,
 * Logs / Analytics, Supabase ou Cloudflare. Somente percorre arquivos de código.
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const publicas=['ewz','macro','precos','candles','juros','sentimento','adrs','noticias'];
const serverWritten={
 notas_inbox:'inbound-btg-note',
 operacoes_profit:'notificar/ponte Profit',
 opcoes_grade:'ponte Profit (notificar lê)',
 carteira_relatorios:'analise',
 weekly_reports:'email-semana',
 aulas:'aulas',
 aulas_fila:'aulas',
 aulas_audio_jobs:'aulas-voz',
 aulas_imagens_jobs:'aulas-visuais',
 analises_trabalhos:'pesquisa',
 push_subs:'notificar, aulas, email e radar',
 radar_cfg:'radar',
 radar_sinais:'radar',
 resumos:'resumo'
};
function walk(directory){
 const out=[];
 for(const name of fs.readdirSync(directory)){
  const full=path.join(directory,name);
  const stat=fs.statSync(full);
  if(stat.isDirectory()){if(!['node_modules','dist','build','artifacts','.git'].includes(name))out.push(...walk(full));}
  else if(/\.(?:js|mjs|cjs)$/.test(name))out.push(full);
 }
 return out;
}
function countRoutes(files,re){
 const m=new Map();
 for(const file of files){
  const rel=path.relative(root,file).split(path.sep).join('/');
  const content=fs.readFileSync(file,'utf8');
  for(const hit of content.matchAll(re)){
   const key=hit[1],a=m.get(key)||{quantidade:0,arquivos:new Set()};
   a.quantidade++;a.arquivos.add(rel);m.set(key,a);
  }
 }
 return Object.fromEntries([...m.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>
  [k,{ocorrencias:v.quantidade,arquivos:[...v.arquivos].sort()}]));
}
function validate(){
 const bridge=read('src/shared/mercado-cloudflare-v894.js');
 const records=read('src/shared/diario-registros-v913.js');
 const cloud=read('cloudflare/diario-sync/index.mjs');
 const conf=JSON.parse(read('cloudflare/diario-radar/wrangler.jsonc'));
 const mode=read('cloudflare/diario-screeners/aurea-resumao-v904.mjs');
 const m=bridge.match(/const FUNCOES=new Set\(\[([^\]]+)\]\)/);
 assert.ok(m,'Ponte de leituras públicas do Cloudflare desapareceu');
 const allowed=new Set([...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]));
 for(const f of publicas)assert.ok(allowed.has(f),'Fonte pública perdeu roteamento Cloudflare: '+f);
 assert.match(bridge,/semFallbackSupabase:true/,'Fonte pública não pode voltar ao Supabase em erro');
 assert.match(bridge,/credentials:'omit'/,'Não enviar credenciais para fontes públicas');
 const tableSet=records.match(/const DEVICE_TABLES=new Set\(\[([\s\S]*?)\]\)/);
 assert.ok(tableSet,'Lista de tabelas D1 do dispositivo desapareceu');
 const device=new Set([...tableSet[1].matchAll(/'([^']+)'/g)].map(x=>x[1]));
 for(const name of Object.keys(serverWritten))
  assert.ok(!device.has(name),'Tabela escrita no servidor não pode virar D1 exclusiva sem cutover: '+name);
 assert.match(records,/headers\.delete\('apikey'\)/,'D1 não deve encaminhar apikey');
 assert.match(cloud,/RECORD_READ_ONLY=new Set\(\['diario_backup','cotacoes'\]\)/,
  'Dados com escritor externo não podem ser atualizados pelo cliente D1');
 assert.equal(conf.vars.AGENDA_CUTOVER_ENABLED,'1','A agenda Cloudflare ativa não pode ser desligada silenciosamente');
 assert.match(mode,/edition==='public'&&env\.ALLOW_PUBLIC_AI_FALLBACK==='1'/,
  'Não habilitar IA anônima para dados pessoais');
 return [...device].sort();
}
function main(){
 const safe=validate(),dir=path.join(root,'src'),files=walk(dir);
 const functions=countRoutes(files,/\/functions\/v1\/([a-zA-Z0-9_-]+)/g);
 const tables=countRoutes(files,/\/rest\/v1\/([a-z_]+)/g);
 const version=JSON.parse(read('release.config.json')).version;
 const report={versao:version,metodo:'inspecao_estatica_sem_rede',timestamp_utc:new Date().toISOString(),
  arquivos_src_inspecionados:files.length,
  funcoes_restantes:Object.keys(functions).length,
  tabelas_restantes:Object.keys(tables).length,
  funcoes,tabelas,
  protegidas_d1_dispositivo:safe,
  tabelas_bloqueadas_ate_migrar_escritores:serverWritten,
  importante:'Ocorrências estáticas incluem rotas interceptadas no navegador; não medem egress real'};
 if(process.argv.includes('--json')){
  const dir=path.join(root,'artifacts');fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'auditoria-egress-v938.json'),JSON.stringify(report,null,2)+'\n');
 }
 console.log('Auditoria estática v'+version+': '+files.length+' arquivos; '+
  Object.keys(functions).length+' funções Edge e '+Object.keys(tables).length+' tabelas referenciadas.');
 console.log('Tabelas com escritores legados protegidas do cutover antecipado: '+Object.keys(serverWritten).length+'.');
 return report;
}
if(require.main===module)main();
module.exports={main,validate,countRoutes,walk,serverWritten};
