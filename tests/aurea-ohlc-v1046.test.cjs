const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=fs.readFileSync('src/domains/core/07-conta-e-integracoes.js','utf8');
const ctx={Date,Number,AbortSignal,URLSearchParams,window:{}};vm.createContext(ctx);vm.runInContext(core.slice(core.indexOf('// v1012 — Conferência'),core.indexOf('// fim v1012')),ctx);
const values=[31,34,29,25,28,34,42,38,36,31,24,28,33,37,35,29,33,41,46,42,38,32,27,31,38,35,26,30];
const bars=values.map((o,i)=>{const c=o+((i%4)-1.5)*1.4;return {date:new Date(Date.UTC(2025,0,i+1)).toISOString().slice(0,10),t:Date.UTC(2025,0,i+1),o,c,h:Math.max(o,c)+1+i%3*.3,l:Math.min(o,c)-1-i%4*.2,v:100+i};});
const pixels=bars.slice(5,19).map((b,i)=>({x:20+i*14,hi:190-b.h*3,lo:190-b.l*3,bodyTop:190-Math.max(b.o,b.c)*3,bodyBottom:190-Math.min(b.o,b.c)*3}));
test('histórico sem datas no print calcula extremos sem inventar posição',async()=>{
 const g={identificacao_visual:{ticker:'PRIO3',market:'BR',periodo:'1D',origem:'ambos'},geometria_preco:{eixos:[],tempo:[]}};
 ctx.window={TRM:{trCandles(){throw Error('cache esperado')},TR:{dados:{'cd|PRIO3|1d':{v:{candles:bars.map(b=>[b.t/1000,b.o,b.h,b.l,b.c,b.v])}}}}}};
 await ctx.aureaValidarHistoricoV1012(g,'Analise PRIO3',new AbortController().signal);
 assert.equal(g.validacao_ohlc.status,'historico_sem_recorte');assert.ok(g.extremos_ohlc.some(p=>p.tipo==='topo'));assert.ok(g.extremos_ohlc.some(p=>p.tipo==='fundo'));assert.equal(g.pivos.length,0);
 assert.ok(g.extremos_ohlc.every(p=>p.x===undefined&&p.y===undefined));assert.ok(!JSON.stringify(g).includes('_ohlc1046'));
});
test('correspondência única sem eixo nem datas; cópia repetida é ambígua',()=>{
 const g={geometria_preco:{eixos:[],tempo:[]}};
 assert.equal(ctx.aureaCorresponderCandlesV1046(bars,pixels,g,260,200).start,5);
 assert.equal(ctx.aureaCorresponderCandlesV1046([...bars,...bars],pixels,g,260,200),null);
 assert.equal(ctx.aureaCorresponderCandlesV1046(bars,pixels.slice(0,4),g,260,200),null);
});

test('corpos preenchidos e vazados: leitura de pixels e associação de janela',()=>{
 const w=220,h=200,rgba=new Uint8ClampedArray(w*h*4).fill(255);
 const put=(x,y)=>{const j=(y*w+x)*4;rgba[j]=rgba[j+1]=rgba[j+2]=0;};
 for(let i=0;i<pixels.length;i++){const p=pixels[i],x=p.x,hi=Math.round(p.hi),lo=Math.round(p.lo),t=Math.round(p.bodyTop),b=Math.round(p.bodyBottom);for(let y=hi;y<=lo;y++)if(y<t||y>b)put(x,y);for(let y=t;y<=b;y++)for(let dx=-2;dx<=2;dx++)if(i%2||y===t||y===b||Math.abs(dx)===2)put(x+dx,y);}
 const g={geometria_preco:{x0:.04,x1:.96,y0:.05,y1:.8,candles:'preto_fundo_claro',eixos:[],tempo:[]}};
 const found=ctx.aureaLerCandlesV1046(g,rgba,w,h);assert.equal(found.length,pixels.length);
 assert.equal(ctx.aureaCorresponderCandlesV1046(bars,found,g,w,h).start,5);
 ctx.aureaRegistrarHistoricoV1046(g,bars,'fixture','1D','PRIO3');
 ctx.aureaMarcarHistoricoV1046(g,rgba,w,h);
 assert.ok(g.pivos.some(p=>p.tipo==='topo'));assert.ok(g.pivos.some(p=>p.tipo==='fundo'));
 assert.ok(g.pivos.every(p=>p.ancoragem_visual==='pixel_compativel'));
});
