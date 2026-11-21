'use strict';
const test=require('node:test'),assert=require('node:assert');
const fs=require('node:fs'),path=require('node:path');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const I=require('../src/analysis/screeners-inteligencia.js');

test('v858: botões de PDF não usam window.print (iPhone/PWA)',()=>{
 const an=R('src/analysis/analises.js'),hf=R('src/analysis/historico-fundamentos.js');
 assert.ok(!/w\.print\(\)/.test(an)&&!/w\.print\(\)/.test(hf));
 assert.match(an,/DiarioScreenersRelatorio\.share\(m\.toUpperCase\(\),\[row\]/);
 assert.match(hf,/DiarioHistoricoPDF\.salvar/);
 const pdf=R('src/analysis/historico-pdf.js');
 assert.match(pdf,/DiarioPDFiOS\.deliver/);
 assert.match(R('src/index.html'),/historico-pdf\.js/);
 assert.match(R('src/service-worker.js'),/"historico-pdf\.js"/);
});

test('v858: linhagem SEC com capex alternativo e Total Yield no retorno',()=>{
 const prova=(tag,unit,end,start,val,accn='0000000001-26-000001',filed='2026-02-01')=>({documento_id:accn,competencia:end,publicado_em:filed,periodo_inicio:start,namespace:'us-gaap',codigo_xbrl:tag,unidade:unit,valor_reportado:val});
 const row={revenue_growth_yoy:10,fcf_margin:20,linhagem_indicadores:{
  revenue_growth_yoy:[prova('Revenues','USD','2025-12-31','2025-01-01',110),prova('Revenues','USD','2024-12-31','2024-01-01',100,'0000000001-25-000001','2025-02-01')],
  fcf_margin:[prova('NetCashProvidedByUsedInOperatingActivities','USD','2025-12-31','2025-01-01',50),prova('PaymentsToAcquireProductiveAssets','USD','2025-12-31','2025-01-01',30),prova('Revenues','USD','2025-12-31','2025-01-01',100)]}};
 const a=I.auditLineage(row,'2026-11-21');
 assert.deepStrictEqual(a.verified.sort(),['fcf_margin','revenue_growth_yoy']);assert.ok(a.complete);
 const base={roic:20,roe:150,forward_pe:15,momentum_12_1:10,dividend_yield:0.5,payout_implicito:15};
 const sem=I.calculate('US',base)[3],com=I.calculate('US',{...base,total_shareholder_yield:6})[3];
 assert.ok(com>sem,'Total Yield do SEC precisa pesar no retorno ao acionista');
 assert.ok(!I.qualityFlags('US',base).some(f=>/ROE extremo/.test(f)),'ROE alto por recompra com ROIC normal não bloqueia');
 assert.ok(I.qualityFlags('BR',base).some(f=>/ROE extremo/.test(f)));
});

test('v858: fundamentos SEC via GitHub Actions, sem Supabase',()=>{
 const sc=R('scripts/sec-fundamentos.cjs'),wf=R('.github/workflows/sec-fundamentos.yml');
 assert.ok(!/supabase/i.test(sc.replace(/Supabase\./g,'')),'script não acessa Supabase');
 assert.match(sc,/PaymentsForRepurchaseOfCommonStock/);assert.match(sc,/ProceedsFromIssuanceOfCommonStock/);
 assert.match(wf,/node scripts\/sec-fundamentos\.cjs/);
 assert.match(R('src/analysis/analises.js'),/workers\.dev\/v1\/sec-fundamentos/);
 assert.match(R('cloudflare/diario-screeners/index.mjs'),/\/v1\/sec-fundamentos/);
});

test('v860: voz das aulas — ponte local no PC e voz neural na borda para o iPhone',()=>{
 const t=R('src/studies/tecnica-aulas.js'),srv=R('bridge-video/servidor_local.py'),wk=R('cloudflare/diario-screeners/index.mjs'),html=R('src/index.html');
 assert.match(t,/127\.0\.0\.1:8766\/voz/);assert.match(t,/workers\.dev\/v1\/voz/);assert.match(t,/iosAparelho\(\)/);
 assert.ok(!/speechSynthesis\.speak/.test(t),'sem voz robótica');
 assert.match(srv,/def _voz\(self\)/);assert.match(srv,/GET, POST, OPTIONS/);
 assert.match(wk,/\/v1\/voz/);assert.match(wk,/gemini-2\.5-flash-preview-tts/);assert.match(wk,/env\.GEMINI_API_KEY/);assert.ok(!/TrustedClientToken/.test(wk));
 assert.match(html,/connect-src 'self' data: http:\/\/127\.0\.0\.1:8766/);
});
