const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=fs.readFileSync('src/domains/core/07-conta-e-integracoes.js','utf8');
const ctx={Date,Number,AbortSignal,URLSearchParams,window:{}};vm.createContext(ctx);vm.runInContext(core.slice(core.indexOf('// v1012 — Conferência'),core.indexOf('// fim v1012')),ctx);
const values=[31,34,29,25,28,34,42,38,36,31,24,28,33,37,35,29,33,41,46,42,38,32,27,31,38,35,26,30];
const bars=values.map((o,i)=>{const c=o+((i%4)-1.5)*1.4;return {date:new Date(Date.UTC(2025,0,i+1)).toISOString().slice(0,10),t:Date.UTC(2025,0,i+1),o,c,h:Math.max(o,c)+1+i%3*.3,l:Math.min(o,c)-1-i%4*.2,v:100+i};});
const pixels=bars.slice(5,19).map((b,i)=>({x:20+i*14,hi:190-b.h*3,lo:190-b.l*3,bodyTop:190-Math.max(b.o,b.c)*3,bodyBottom:190-Math.min(b.o,b.c)*3}));

test('v1047 aceita espaço vazio à direita e lacunas de candles em grade regular',()=>{
 const sparse=pixels.filter((p,i)=>i!==4&&i!==9);
 const grid=ctx.aureaGradeVisivelV1047(sparse);
 assert.equal(grid.size,14);
 assert.equal(ctx.aureaCasarGradeV1047(bars,grid,{geometria_preco:{eixos:[],tempo:[]}},360,200).start,5);
 assert.equal(ctx.aureaCasarGradeV1047([...bars,...bars],grid,{geometria_preco:{eixos:[],tempo:[]}},360,200),null);
});
test('v1047 não exibe extremos globais nem níveis sem recorte confirmado',()=>{
 const g={niveis:[{preco:33,y:.7}]};
 ctx.aureaRegistrarHistoricoV1046(g,bars,'fixture','1D','PRIO3');
 assert.ok(g.extremos_ohlc.length>0);
 ctx.aureaFinalizarRecorteV1047(g);
 assert.equal(g.extremos_ohlc.length,0);assert.equal(g.pivos.length,0);assert.equal(g.niveis.length,0);
 assert.equal(g.validacao_ohlc.recorte_homologado,false);
});
test('v1047 recorte limita datas e marcadores, nível exige escala real',()=>{
 const g={geometria_preco:{x0:.05,x1:.9,y0:.05,y1:.9,eixos:[{y:.2,preco:50},{y:.4,preco:40},{y:.6,preco:30}]},validacao_ohlc:{historico_disponivel:true,status:'conferido',imagem_correspondida:true,desde:bars[5].date,ate:bars[18].date},extremos_ohlc:[{data:bars[2].date},{data:bars[7].date}],pivos:[{data:bars[7].date,x:.3,y:.4,ancoragem_visual:'pixel_compativel'},{data:bars[2].date,x:.3,y:.4,ancoragem_visual:'pixel_compativel'},{data:bars[8].date,x:.4,y:.97,ancoragem_visual:'pixel_compativel'}],niveis:[{preco:40,y:.8},{preco:100,y:.1}]};
 ctx.aureaFinalizarRecorteV1047(g);
 assert.equal(g.extremos_ohlc.length,1);assert.equal(g.pivos.length,1);assert.equal(g.validacao_ohlc.recorte_homologado,true);
 assert.equal(g.niveis.length,1);assert.ok(Math.abs(g.niveis[0].y-.4)<1e-8);
});

test('v1047 não marca candle individual que diverge da grade aceita',()=>{
 const points=pixels.map((p,i)=>i===4?{...p,hi:p.hi-4,lo:p.lo-4,bodyTop:p.bodyTop-4,bodyBottom:p.bodyBottom-4}:p);
 const grid=ctx.aureaGradeVisivelV1047(points);
 const match=ctx.aureaCasarGradeV1047(bars,grid,{geometria_preco:{eixos:[],tempo:[]}},360,200);
 assert.equal(match.start,5);assert.ok(!match.validSlots.includes(4));
});
