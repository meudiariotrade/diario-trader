const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const intel=require('../src/analysis/screeners-inteligencia.js');
const graph=require('../src/analysis/screeners-grafico.js');
const app=fs.readFileSync('src/analysis/analises.js','utf8');
const pdf=fs.readFileSync('src/analysis/screeners-relatorio.js','utf8');
const html=fs.readFileSync('src/index.html','utf8');

test('Score BR: pesos batem com a fórmula de produção e grupos são explicáveis',()=>{
 const row={ticker:'PETR4',empresa:'Empresa Exemplo',roe:18,roic:14,pl:10,ev_ebitda:7,fcf_yield:6,
  dividend_yield:6,payout_implicito:45,momentum_12_1:12,
  fundamentais_em:'2026-11-17',tecnicos_em:'2026-11-17',updated_at:'2026-11-17',score_model_version:'v2.0'};
 const scores=intel.calculate('BR',row);
 const groups=intel.weights.BR;
 row.score_quant_br=+scores.reduce((a,v,i)=>a+v*groups[i].weight/100,0).toFixed(2);
 const d=intel.diagnostics('BR',row,Date.parse('2026-11-17T22:00:00Z'));
 assert.equal(d.validated,true);
 assert.ok(d.difference<=.01);
 assert.equal(d.parts.length,4);
 assert.deepEqual(groups.map(x=>x.weight),[30,30,25,15]);
 assert.equal(+d.parts.reduce((sum,x)=>sum+x.points,0).toFixed(1),+row.score_quant_br.toFixed(1));
 assert.match(d.level,/Cálculo confere/);
});

test('Score EUA ausente não vira nota fictícia ou recomendação',()=>{
 const d=intel.diagnostics('US',{ticker:'AAPL',company_name:'Exemplo',roic:22,forward_pe:18,dividend_yield:1,eps_growth_yoy:12},Date.now());
 assert.equal(d.score,null);
 assert.equal(d.validated,false);
 assert.ok(d.missing.includes('Distância MM200'));
 assert.match(d.interpretation,/Não é possível/);
 assert.ok(d.risks.some(r=>/Score indisponível|fundamentos/.test(r)));
 assert.deepEqual(intel.weights.US.map(x=>x.weight),[30,30,25,15]);
});

test('Gráfico: trocar ROE x Payout para ROE x P/VP altera par e elimina distorção por outlier',()=>{
 const pts=Array.from({length:60},(_,i)=>({
  ticker:'X'+i,roe:i===0?-193:i===59?86:10+(i%22),payout:20+(i%30),pvp:.6+(i%10)*.12,
  roic:8+(i%12),ev_ebitda:4+(i%10),dy:3+(i%6),div_liq_ebitda:1+(i%3),momentum:12
 }));
 let s={chart:'roe-payout',zoom:1,panX:0,panY:0,data:{scatter:pts}};
 const before=graph.prepare('br',s);
 assert.equal(before.pair[1],'ROE × Payout');
 assert.ok(before.xmin>-193,'Outlier não pode determinar todo o eixo');
 s.chart='roe-pvp';
 const after=graph.prepare('br',s);
 assert.equal(after.pair[1],'ROE × P/VP');
 const full=after.xmax-after.xmin;
 s.zoom=2;
 const zoom=graph.prepare('br',s);
 assert.ok(zoom.xmax-zoom.xmin<full*.60,'Zoom precisa mudar escala, não número de pontos');
 s.panX=.5;
 const pan=graph.prepare('br',s);
 assert.notEqual(pan.xmin,zoom.xmin);
 const markup=graph.plot('br',s,()=>null);
 assert.match(markup,/data-scr-zoom="in"/);
 assert.match(markup,/data-scr-pan="left"/);
 assert.match(markup,/data-scr-point=/);
});

test('Interface: até 10 ações e PDF de snapshot local preservando Pesquisa',()=>{
 new vm.Script(app);new vm.Script(pdf);
 assert.match(app,/s\.selected\.length>=10/);
 assert.match(app,/s\.selectedRows\[tk\]/);
 assert.match(app,/data-scr-pdf/);
 assert.match(app,/data-scr-detail/);
 assert.match(app,/DiarioScreenersRelatorio\.share/);
 assert.match(app,/Screener Brasil/);
 assert.match(app,/Screener EUA/);
 assert.doesNotMatch(pdf,new RegExp('supabase\\.co|/functions/v1|SERVICE_ROLE_KEY|fetch\\(.https:'));

 assert.match(pdf,/pdf-sans\.ttf/);
 assert.match(pdf,/pdf-lib\.min\.js/);
});
test('Módulos carregam antes de Análises e versão foi incrementada',()=>{
 const pos=['screeners-inteligencia.js','screeners-grafico.js','screeners-relatorio.js','analises.js'].map(x=>html.indexOf('src="'+x+'?v=__APP_VERSION__"'));
 assert.ok(pos.every(x=>x>=0)&&pos.every((x,i)=>!i||x>pos[i-1]));
 const release=JSON.parse(fs.readFileSync('release.config.json','utf8'));
 assert.ok(release.version>=748);
});
