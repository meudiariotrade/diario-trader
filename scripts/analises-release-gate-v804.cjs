'use strict';
/* v804 — gate de release apenas offline. Nunca confunde CI com licença de provedor. */
const fs=require('node:fs'),path=require('node:path');
const {run:integration}=require('./analises-homologacao-v803.cjs');
const {audit:security}=require('./analises-security-v802.cjs');
const CRITICAL=[
 'feed-contract-v787.js','feed-profit-v788.js','binance-stream-v790.js',
 'feed-finnhub-v791.js','corporate-candles-v792.js','source-health-v793.js',
 'historico-qualidade-v794.js','economatica-fatos-v795.js',
 'snapshot-contract-v800.js','backtest-gates-v801.js'
];
function verify(root=process.cwd()){
 const failures=[],load=p=>fs.readFileSync(path.join(root,p),'utf8'),
  config=JSON.parse(load('release.config.json')),
  html=load('src/index.html'),sw=load('src/service-worker.js'),
  claude=load('CLAUDE.md');
 if(config.version!==804)failures.push('Versão final diferente de 804');
 for(const name of CRITICAL){
  if(!config.bundles[name])failures.push('Bundle ausente: '+name);
  if(!sw.includes('"'+name+'"'))failures.push('Sem precache: '+name);
 }
 for(const name of ['feed-contract-v787.js','historico-qualidade-v794.js','snapshot-contract-v800.js'])
  if(!html.includes('src="'+name+'?v=__APP_VERSION__"'))
   failures.push('Contrato ausente do HTML: '+name);
 if(!claude.includes('Log Query')||!claude.includes('PROIBIDO'))
  failures.push('Política de preservação dos Logs/Analytics não localizada');
 let safe=null,cases=null;
 if(root===process.cwd()){
  safe=security(root);
  if(!safe.ok)failures.push('Auditoria estática dos feeds falhou');
  try{cases=integration();if(!cases.ok)failures.push('Cenários integrados falharam')}
  catch(e){failures.push('Cenários integrados: '+String(e.message||e))}
 }
 return {version:config.version,codeGate:failures.length===0,failures,
  checks:CRITICAL.length,securityChecked:!!safe,integratedScenarios:cases?.checks||0,
  externalHomologation:{
   windowsProfitDLL:'PENDENTE: licença e validação local Windows',
   economaticaMcp:'PENDENTE: contrato/licença/OAuth/redistribuição',
   cvmSecComplete:'PENDENTE: auditoria de todas as métricas dos emissores',
   quoteLatency:'PENDENTE: teste de latência em pregão real',
   cloudflareDeploy:'VALIDAÇÃO INDEPENDENTE: Worker e Pages não usam o mesmo deploy'
  },
  conclusion:failures.length?'NÃO PUBLICAR':'APTO A CI; módulos externos permanecem condicionais'};
}
if(require.main===module){
 const result=verify();process.stdout.write(JSON.stringify(result,null,2)+'\n');
 if(!result.codeGate)process.exitCode=1;
}
module.exports={verify,CRITICAL};
