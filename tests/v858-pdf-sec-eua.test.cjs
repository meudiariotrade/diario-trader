'use strict';
const test=require('node:test'),assert=require('node:assert');
const fs=require('node:fs'),path=require('node:path');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const I=require('../src/analysis/screeners-inteligencia.js');

test('v858: botões de PDF não usam window.print (iPhone/PWA)',()=>{
 const an=R('src/analysis/analises.js'),hf=R('src/analysis/historico-fundamentos.js');
 assert.ok(!/w\.print\(\)/.test(an)&&!/w\.print\(\)/.test(hf));
 assert.match(an,/DiarioPDFiOS\?\.deliver|DiarioPDFiOS\.deliver/);
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

test('v862: modo vídeo do Mentor — avatar no quadro, figuras do PDF e tela cheia',()=>{
 const t=R('src/studies/tecnica-aulas.js'),f=R('src/studies/mentor-figuras.js');
 assert.match(t,/function player\(l\)/);assert.match(t,/tp-wave/);assert.match(t,/data-tp-action="tela"/);assert.match(t,/tp-fs-host/);
 assert.match(f,/EstudosLocal\.put\('mentor-figura'/);assert.match(f,/getOperatorList/);assert.ok(!/fetch\(/.test(f),'figuras nunca saem do aparelho');
 assert.match(R('release.config.json'),/src\/studies\/mentor-figuras\.js/);
});

test('v863: aulas tradicionais com voz por IA por cena e volta à voz do aparelho se falhar',()=>{
 const n=R('src/domains/layers/01-navegacao-e-fluxos.js'),v=R('src/studies/aulas-voz-ia.js');
 assert.match(n,/E\(G, "local"\) === "ia" && window\.AulaVozIA/);assert.match(n,/data-au348mode="ia"/);assert.match(n,/aulas-ia-v863/);
 assert.match(v,/workers\.dev\/v1\/voz/);assert.match(v,/caches\.open/);
 assert.match(R('release.config.json'),/src\/studies\/aulas-voz-ia\.js/);
});

test('v865: apagar aulas — Mentor (aparelho) e tradicionais (lista, inclusive travadas)',()=>{
 const t=R('src/studies/tecnica-aulas.js'),p=R('src/studies/tecnica-pdf.js'),n=R('src/domains/layers/01-navegacao-e-fluxos.js');
 assert.match(t,/data-tp-del=/);assert.match(t,/confirm\(/);assert.match(p,/async function remover\(id\)/);
 assert.match(n,/data-audelid="\$\{i\(Z\.id\)\}"/);assert.match(n,/data-audelid="\$\{i\(t\.id\)\}"/);
 assert.match(n,/\/rest\/v1\/aulas\?id=eq\." \+ encodeURIComponent\(id\)/);
});

test('v866: color linking por painel (screener e técnico), sem servidor',()=>{
 const c=R('src/shared/color-link.js'),a=R('src/analysis/analises.js'),t=R('src/analysis/tecnico-ui.js'),h=R('src/index.html');
 assert.match(c,/registrar/);assert.match(c,/data-cl-src/);assert.ok(!/fetch\(/.test(c));
 assert.match(a,/registrar\('scr-'\+m/);assert.match(a,/data-cl-src="scr-'\+m\+'"/);
 assert.match(t,/registrar\('tec-'\+m/);assert.match(t,/data-cl-src="tec-'\+m\+'"/);
 assert.ok(h.indexOf('color-link.js')<h.indexOf('analises.js')||h.indexOf('analises.js')<0);
});

test('v868: ficha do ativo (drill-down), vigia, comparar, abertura e risco sem Supabase',()=>{
 const f=R('src/shared/ficha-ativo.js'),p=R('src/shared/painel-carteira.js'),h=R('src/index.html');
 assert.match(f,/function abrir\(tk\)/);assert.match(f,/pointerdown/);assert.match(f,/dt-vigia-v868/);assert.match(f,/compHtml/);
 assert.ok(!/supabase/i.test(f)&&!/supabase/i.test(p.replace(/Nenhuma consulta ao Supabase/,'')),'sem Supabase');
 assert.match(p,/Perda provável/);assert.match(p,/data-fa-abrir/);
 assert.match(h,/ficha-ativo\.js/);assert.match(h,/painel-carteira\.js/);
});

test('v869: Estudos — ticker oculto só na aba, player escuro com equalizador e aulas na conta',()=>{
 const v=R('src/studies/estudos-visual.js'),t=R('src/studies/tecnica-aulas.js'),p=R('src/studies/tecnica-pdf.js'),e=R('supabase/functions/aulas/index.ts'),n=R('src/domains/layers/01-navegacao-e-fluxos.js');
 assert.match(v,/body\.aba-estudos \.dt393-ticker/);assert.match(v,/tab==='estudos'/);
 assert.match(t,/tp-wave/);assert.match(t,/tp-prog/);assert.match(t,/getByteFrequencyData/);assert.ok(!/class="tp-pres/.test(t),'sem avatar estático');
 assert.match(p,/acao:'mentor_pdf'/);assert.match(p,/await migrarDaNuvem\(\)/);
 assert.match(e,/b\.acao === 'retomar'/);assert.match(n,/data-auretomar/);
});
