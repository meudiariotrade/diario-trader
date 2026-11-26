// Somente requisições públicas ao Cloudflare: sem tokens e sem logs Supabase.
const market='https://diario-trader.lucianosilva43567.workers.dev',quant='https://diario-screeners-quant.lucianosilva43567.workers.dev';
const checks=[
 ['Scanner histórico',market+'/v1/diario?t=PETR4.SA&range=2y',j=>j.chart?.result?.[0]?.meta?.symbol==='PETR4.SA'&&j.chart.result[0].indicators?.quote?.[0]?.close?.filter(v=>Number.isFinite(v)&&v>0).length>=201],
 ['Logos',market+'/v1/logos?t=USDBRL',j=>!!Object.values(j.itens||{}).find(x=>Array.isArray(x?.urls)&&x.urls.length)],
 ['Séries BCB',market+'/v1/series?serie=selic&desde=2026',j=>j.sgs===432&&Array.isArray(j.pontos)&&j.pontos.length>0],
 ['Snapshot BR',quant+'/v1/screeners?market=BR&snapshot=1&universe=1',j=>j.ok===true&&j.market==='BR'&&j.universe_complete===true&&j.universe_rows?.length>=159],
 ['Snapshot EUA',quant+'/v1/screeners?market=US&snapshot=1&universe=1',j=>j.ok===true&&j.market==='US'&&j.universe_complete===true&&j.universe_rows?.length>=624],
 ['Fundamentos SEC',quant+'/v1/sec-fundamentos',j=>Object.keys(j.tickers||{}).length>0],
 ['Documentos CVM',quant+'/v1/cvm-provas',j=>j.ok===true&&j.emissores?.length>=100&&j.documentos?.length>=100],
 ['Documentos SEC',quant+'/v1/sec-documento?cik=0000320193',j=>j.ok===true&&j.cik==='0000320193'&&/^[0-9]{10}-[0-9]{2}-[0-9]{6}$/.test(j.accessionNumber||'')&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(j.reportDate||'')&&String(j.documentUrl||'').startsWith('https://www.sec.gov/Archives/edgar/data/320193/')]
];
(async()=>{const results=await Promise.allSettled(checks.map(async([name,url,valid])=>{const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(45000)});const j=await r.json();if(!r.ok||!valid(j))throw Error(name+' HTTP '+r.status+' contrato não validado');return name+' HTTP '+r.status+' OK'}));
for(const r of results)console.log(r.status==='fulfilled'?r.value:String(r.reason));if(results.some(r=>r.status==='rejected'))process.exitCode=1})().catch(e=>{console.error(e.message);process.exitCode=1});
