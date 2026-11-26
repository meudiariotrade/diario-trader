const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=fs.readFileSync('src/domains/core/07-conta-e-integracoes.js','utf8'),part=core.slice(core.indexOf('// v1012 — Conferência'),core.indexOf('// fim v1012'));
const ctx={Date,Number,AbortSignal,URLSearchParams,window:{},fetch:async()=>{throw Error('no network')}};vm.createContext(ctx);vm.runInContext(part,ctx);
const check=ctx.aureaConferePivosV1012;
const date=i=>'2026-10-'+String(i+1).padStart(2,'0');
const highs=[12,11,10,12,13,15,14,13,12,10,9,10],lows=[9,8,6,8,9,10,9,8,7,5,4,5];
const rows=highs.map((h,i)=>({t:Date.parse(date(i)+'T00:00:00Z'),h,l:lows[i],o:h-1,c:i===9?5.5:h-1,v:100}));
const p={tipo:'topo',estado:'confirmado',data:date(5),preco:'15.00',x:.5,y:.3,motivo:'Topo visual'};
const g={referencia_ohlc:{tf:'1d',desde:date(0),ate:date(11)},pivos:[p]};
test('sem OHLC nunca promove o estado visual confirmado',()=>{const r=check(g,null)[0];assert.equal(r.estado,'potencial');assert.equal(r.estado_visual,'confirmado');assert.equal(r.validacao,'visual')});
test('extremo local e quebra por fechamento do fundo anterior confirmam estrutura',()=>{const r=check(g,rows)[0];assert.equal(r.validacao,'estrutura_ohlc');assert.equal(r.estado,'confirmado');assert.equal(r.nivel_rompido,6);assert.equal(r.data_rompimento.slice(0,10),date(9));assert.equal(r.x,p.x)});
test('ignora candles posteriores ao recorte e não aceita preço aproximado, datas ou pavios incorretos',()=>{
 assert.equal(check({...g,referencia_ohlc:{...g.referencia_ohlc,ate:date(8)}},rows)[0].validacao,'extremo_ohlc');
 assert.equal(check({...g,pivos:[{...p,preco:'~15'}]},rows)[0].validacao,'visual');
 assert.equal(check({...g,pivos:[{...p,preco:'15.50'}]},rows)[0].validacao,'divergente');
 assert.equal(check({...g,pivos:[{...p,data:date(4),preco:'13.00'}]},rows)[0].validacao,'divergente');
 assert.equal(ctx.aureaDataPivoV1012('2026-02-30','1d'),null);
 assert.equal(ctx.aureaDataPivoV1012('2026-10-06T10:00:00','1h'),null);
});
test('novo extremo antes do rompimento invalida confirmação; wick isolado não confirma',()=>{
 const a=rows.map(x=>({...x}));a[8].h=16;
 assert.notEqual(check(g,a)[0].validacao,'estrutura_ohlc');
 const b=rows.map(x=>({...x,c:Math.max(x.c,6.2)}));
 assert.equal(check(g,b)[0].validacao,'extremo_ohlc');
});
test('normalizador preserva data e referência por imagem, sem certificar valores',async()=>{
 const {normalizarPivosV1007,normalizarGraficosV1011}=await import('../cloudflare/diario-screeners/aurea-imagem-v1004.mjs');
 const x={...p,motivo:'Extremo de pavio visível no gráfico'};
 assert.equal(normalizarPivosV1007([x])[0].data,p.data);
 const ref={ticker:'VALE3',market:'BR',tf:'1d',base:'nominal',desde:date(0),ate:date(11)};
 const result=normalizarGraficosV1011({comparacao:'Comparação visual dos dois gráficos sem dados inventados.',graficos:[1,2].map(indice=>({indice,tipo:'grafico_parcial',ativo:'VALE3',periodo:'Diário',leitura:'Leitura parcial dos candles no gráfico.',pivos:[x],referencia_ohlc:ref}))},2);
 assert.equal(result.graficos[1].referencia_ohlc.ticker,'VALE3');
});
test('sem ticker explícito, nenhuma consulta externa e imagem permanece visual',async()=>{
 let calls=0;ctx.fetch=async()=>{calls++;throw Error('unexpected')};ctx.window={DiarioFeedContrato:{ticker:t=>t},DiarioHistoricoQualidade:{}};
 const r=await ctx.aureaValidarHistoricoV1012({...g,referencia_ohlc:{...g.referencia_ohlc,ticker:'VALE3',market:'BR',base:'nominal'}},'Analise este gráfico',new AbortController().signal);
 assert.equal(calls,0);assert.equal(r.pivos[0].validacao,'visual');
});

test('v1021 calibração de eixo linear e log por três marcas; rejeita escala incompatível',()=>{
 const f=ctx.aureaCalibrarEixoV1021;
 const a=f({eixos:[{y:.2,preco:100},{y:.4,preco:80},{y:.6,preco:60}]});assert.equal(a.modo,'linear');assert.ok(Math.abs(a.y(90)-.3)<1e-8);
 const b=f({eixos:[{y:.2,preco:100},{y:.4,preco:50},{y:.6,preco:25}]});assert.equal(b.modo,'log');assert.ok(Math.abs(b.y(50)-.4)<1e-8);
 assert.equal(f({eixos:[{y:.2,preco:100},{y:.4,preco:99},{y:.6,preco:25}]}),null);
});
test('v1021 pixels: candle preto aceito; OBV, linha horizontal, média colorida e vazio não ganham marcador',()=>{
 const w=400,h=800,d=new Uint8ClampedArray(w*h*4).fill(255);
 const set=(x,y,r=0,g=0,b=0)=>{const i=(y*w+x)*4;d[i]=r;d[i+1]=g;d[i+2]=b;};
 for(let y=240;y<=290;y++){set(160,y);if(y>=253&&y<=275){set(159,y);set(161,y);}}
 for(let x=205;x<310;x++)set(x,320);
 for(let y=340;y<380;y++)set(230,y,220,20,20);
 for(let y=620;y<670;y++){set(170,y);set(169,y);set(171,y);}
 const geom={x0:.02,y0:.15,x1:.85,y1:.65,candles:'preto_fundo_claro',eixos:[{y:.2,preco:100},{y:.4,preco:80},{y:.6,preco:60}]};
 const p=(x,y,preco,tipo='topo')=>({tipo,x:x/w,y:y/h,preco:String(preco)});
 const g={geometria_preco:geom,pivos:[p(160,240,90),p(160,290,83.75,'fundo'),p(250,320,80),p(230,340,77.5),p(170,620,42.5),p(300,280,85)]};
 const out=ctx.aureaAncorarPivosV1021(g,d,w,h);assert.deepEqual(Array.from(out,x=>x.ancoragem_visual),['pixel_compativel','pixel_compativel','nao_conferida','nao_conferida','nao_conferida','nao_conferida']);
 assert.equal(ctx.aureaAncorarPivosV1021({...g,geometria_preco:null},d,w,h)[0].ancoragem_visual,'nao_conferida');
});
test('v1021 calcula extremos do recorte a partir do OHLC sem coordenadas inventadas',()=>{
 const out=ctx.aureaExtremosHistoricosV1021(g,rows);assert.ok(out.some(x=>x.tipo==='topo'&&x.preco==='15'&&x.validacao==='estrutura_ohlc'));assert.ok(out.every(x=>x.x===undefined&&x.y===undefined));assert.equal(ctx.aureaExtremosHistoricosV1021(g,rows.slice(1)).length,0);
});
test('v1021 contrato conserva identificação, confluências e geometria separada',async()=>{
 const {parecer}=await import('../cloudflare/diario-screeners/aurea-imagem-v1004.mjs');
 const r=parecer(JSON.stringify({tipo:'grafico_parcial',resumo:'Tese',tecnico:'Leitura',fundamentalista:'Lacuna',critico:'Contraponto',estrutura:{lacuna:'Dados insuficientes'},identificacao_visual:{ticker:'IBOV',market:'BR',periodo:'1D',origem:'marca_dagua'},confluencias_visuais:{obv:'Rompimento antes do preço é antecipação possível'},geometria_preco:{x0:.02,y0:.15,x1:.85,y1:.65,candles:'preto_fundo_claro',eixos:[{y:.2,preco:100},{y:.4,preco:80},{y:.6,preco:60}]},pivos:[]}),null);
 assert.equal(r.identificacao_visual.ticker,'IBOV');assert.match(r.confluencias_visuais.obv,/antecipação/);assert.equal(r.geometria_preco.eixos.length,3);
});
