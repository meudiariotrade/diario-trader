'use strict';
/* v802 — diagnóstico estático não destrutivo e sem consultar Logs/Analytics. */
const fs=require('node:fs');
const path=require('node:path');
const SOURCE_FILES=["src/analysis/feed-contract-v787.js","src/analysis/feed-profit-v788.js","src/analysis/binance-stream-v790.js","src/analysis/feed-finnhub-v791.js","src/analysis/corporate-candles-v792.js","src/analysis/source-health-v793.js","src/analysis/historico-qualidade-v794.js","src/analysis/economatica-fatos-v795.js","src/analysis/snapshot-contract-v800.js","src/analysis/backtest-gates-v801.js"];
const forbidden=[
 [/service[_-]?role|SUPABASE_SERVICE_ROLE/i,'Credencial privilegiada não pode aparecer em fonte pública'],
 [/\b(?:setInterval|setTimeout)\s*\(/,'Timer/polling não permitido no adaptador de feed'],
 [/\b(?:eval|Function)\s*\(/,'Execução dinâmica não permitida'],
 [/\/functions\/v1\/(?:screeners-quant|pesquisa)/,'Feed público não deve chamar Supabase diretamente']
];
function audit(base=process.cwd()){
 const errors=[],config=JSON.parse(fs.readFileSync(path.join(base,'release.config.json'),'utf8')),
  html=fs.readFileSync(path.join(base,'src/index.html'),'utf8'),
  sw=fs.readFileSync(path.join(base,'src/service-worker.js'),'utf8');
 for(const file of SOURCE_FILES){
  const code=fs.readFileSync(path.join(base,file),'utf8');
  for(const [pattern,reason] of forbidden)
   if(pattern.test(code))errors.push({file,reason});
  if(file==='src/analysis/binance-stream-v790.js'){
   if(!/function stop\(\)/.test(code)||!/ws\.close\(\)/.test(code))
    errors.push({file,reason:'WebSocket sem encerramento explícito'});
  }else if(/\bnew\s+WebSocket\s*\(/.test(code)||/\bfetch\s*\(/.test(code))
   errors.push({file,reason:'Módulo de dados deveria consumir somente caches já disponíveis'});
  const dest=Object.keys(config.bundles).find(k=>config.bundles[k]===file);
  if(!dest)errors.push({file,reason:'Sem bundle configurado'});
  else if(!sw.includes('"'+dest+'"'))
   errors.push({file,reason:'Ausente de cache offline'});
 }
 for(const scriptName of ['feed-contract-v787.js','feed-profit-v788.js','binance-stream-v790.js',
  'feed-finnhub-v791.js','source-health-v793.js','historico-qualidade-v794.js',
  'snapshot-contract-v800.js']){
  if(!html.includes('src="'+scriptName+'?v=__APP_VERSION__"'))
   errors.push({file:'src/index.html',reason:'Script crítico fora da página: '+scriptName});
 }
 const scriptOrder=['feed-contract-v787.js','feed-profit-v788.js','binance-stream-v790.js',
  'feed-finnhub-v791.js','source-health-v793.js'];
 const positions=scriptOrder.map(n=>html.indexOf('src="'+n+'?v=__APP_VERSION__"'));
 if(positions.some((n,i)=>i>0&&n<=positions[i-1]))
  errors.push({file:'src/index.html',reason:'Ordem de inicialização de contratos e adaptadores incorreta'});
 return {ok:errors.length===0,version:config.version,checked:SOURCE_FILES.length,errors};
}
if(require.main===module){
 const r=audit();
 process.stdout.write(JSON.stringify({ok:r.ok,version:r.version,checked:r.checked,errors:r.errors},null,2)+'\n');
 if(!r.ok)process.exitCode=1;
}
module.exports={audit,SOURCE_FILES};
