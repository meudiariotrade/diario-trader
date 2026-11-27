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

test('v1021 IBOV visual permite histórico exato sem ticker digitado, sem alterar contrato global',async()=>{
 const feed={ticker:t=>t==='IBOV'?null:t,series:()=>({valid:true,candles:rows})};let calls=0;
 ctx.window={DiarioFeedContrato:feed,DiarioHistoricoQualidade:{audit:(p,o)=>({valid:o.contract.ticker('IBOV','BR')==='IBOV',source:'fixture'})}};
 ctx.fetch=async url=>{calls++;assert.match(url,/ticker=IBOV/);return {ok:true,json:async()=>({candles:rows,as_of:date(11)})}};
 const x={...g,pivos:[],referencia_ohlc:{...g.referencia_ohlc,ticker:'IBOV',market:'BR',base:'nominal'},identificacao_visual:{ticker:'IBOV',market:'BR',periodo:'1D',origem:'ambos'}};
 const r=await ctx.aureaValidarHistoricoV1012(x,'Analise este gráfico',new AbortController().signal);assert.equal(calls,1);assert.equal(r.validacao_ohlc.status,'conferido');assert.ok(r.extremos_ohlc.length);assert.equal(feed.ticker('IBOV','BR'),null);
 const y={...x,pivos:[],referencia_ohlc:{...x.referencia_ohlc},identificacao_visual:{...x.identificacao_visual,periodo:'15m'}};
 await ctx.aureaValidarHistoricoV1012(y,'Analise este gráfico',new AbortController().signal);assert.equal(calls,1);
});
test('v1021 cálculo independente de médias e OBV não usa barras posteriores ao recorte',()=>{
 const history=Array.from({length:220},(_,i)=>({t:Date.UTC(2025,0,i+1),o:100+i,h:101+i,l:99+i,c:100+i,v:10}));
 const d=i=>new Date(history[i].t).toISOString().slice(0,10);
 const r=ctx.aureaIndicadoresHistoricosV1021({referencia_ohlc:{tf:'1d',desde:d(190),ate:d(209)},extremos_ohlc:[]},history);
 assert.deepEqual(Array.from(r.medias,x=>x.n),[20,50,200]);assert.equal(r.medias[0].valor,299.5);assert.equal(r.medias[2].inclinacao,'ascendente');
});

test('v1023 mantém a geometria do painel sem graduações utilizáveis',async()=>{
 const {geometriaAureaV1021}=await import('../cloudflare/diario-screeners/aurea-imagem-v1004.mjs');
 const painel={x0:.02,y0:.15,x1:.85,y1:.65,candles:'preto_fundo_claro'};
 assert.deepEqual(geometriaAureaV1021(painel),{...painel,eixos:[]});
 assert.deepEqual(geometriaAureaV1021({...painel,eixos:[{y:.2,preco:10},{y:.4,preco:50},{y:.6,preco:20}]}).eixos,[]);
 assert.equal(geometriaAureaV1021({...painel,y1:.2}),null);
});

test('v1023 encontra pavios cinza sem eixo e não promove preço ou estrutura',()=>{
 const w=400,h=600,pixels=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,fundo=210-Math.floor(x/30);
  pixels.set([fundo,fundo,fundo,255],i);
 }
 const riscar=(x,y,cor)=>pixels.set([...cor,255],(y*w+x)*4);
 for(let y=200;y<=228;y++)riscar(120,y,[163,161,158]);
 for(let y=250;y<=280;y++)riscar(165,y,[158,157,155]);
 for(let x=190;x<240;x++)riscar(x,235,[140,140,140]);
 for(let y=230;y<260;y++)riscar(260,y,[210,95,90]);
 for(let y=460;y<490;y++)riscar(170,y,[100,100,100]);
 const geometria_preco={x0:.03,y0:.1,x1:.85,y1:.68,candles:'preto_fundo_claro',eixos:[]};
 const pivo=(x,y,tipo='topo',validacao='visual')=>({tipo,x:x/w,y:y/h,validacao,estado:'potencial',preco:'~184412'});
 const piv=[pivo(121,202),pivo(164,278,'fundo'),pivo(215,235),pivo(260,230),pivo(170,460),pivo(121,202,'topo','divergente'),pivo(121,202)];
 const out=ctx.aureaAncorarPivosV1021({geometria_preco,pivos:piv},pixels,w,h);
 assert.deepEqual(Array.from(out,x=>x.ancoragem_visual),['pavio_visual','pavio_visual','nao_conferida','nao_conferida','nao_conferida','nao_conferida','nao_conferida']);
 assert.equal(out[0].x,120/w);assert.equal(out[0].y,200/h);assert.equal(out[1].y,280/h);
 assert.equal(out[0].preco,'');assert.equal(out[0].preco_eixo_aprox,undefined);
 assert.equal(out[0].validacao,'visual');assert.equal(out[0].estado,'potencial');
});

test('Terminal HP: marca a máxima diária no pavio usando somente o histórico do ativo identificado',async()=>{
 const g={identificacao_visual:{ticker:'PRIO3',market:'BR',periodo:'1D',origem:'ambos'},
  geometria_preco:{x0:.05,x1:.95,y0:.1,y1:.8,candles:'preto_fundo_claro',eixos:[{y:.2,preco:20},{y:.4,preco:15},{y:.6,preco:10}],tempo:[{x:.2,data:date(0)},{x:.75,data:date(11)}]}};
 const payload={candles:rows.map(b=>[b.t/1000,b.o,b.h,b.l,b.c]),fonte:'fixture'};
 let calls=0;
 const terminal={TR:{dados:{}},async trCandles(t,tf){calls++;assert.equal(t,'PRIO3');assert.equal(tf,'1d');this.TR.dados['cd|PRIO3|1d']={v:payload}}};
 ctx.window={TRM:terminal};
 assert.equal(await ctx.aureaHistoricoTerminal(g,new AbortController().signal),true);
 const p=g.pivos.find(p=>p.tipo==='topo'&&p.data===date(5));
 assert.equal(p.preco,'15');assert.ok(Math.abs(p.x-.45)<1e-8);assert.equal(p.y,.4);
 const w=400,h=800,pixels=new Uint8ClampedArray(w*h*4).fill(255);
 for(let y=320;y<350;y++)for(let x=y<328?180:179;x<=(y<328?180:181);x++)pixels.fill(0,(y*w+x)*4,(y*w+x)*4+3);
 assert.equal(ctx.aureaAncorarPivosV1021(g,pixels,w,h).find(p=>p.data===date(5)).ancoragem_visual,'pixel_compativel');
 g.geometria_preco.tempo=[{x:.2,data:date(0)}];
 assert.equal(await ctx.aureaHistoricoTerminal(g,new AbortController().signal),false);assert.equal(calls,1);
});

test('Terminal HP: o mensal usa o pavio mais alto do mês e preserva o período',async()=>{
 const dates=Array.from({length:12},(_,i)=>'2025-'+String(i+1).padStart(2,'0'));
 const candles=dates.flatMap((month,i)=>[1,2].map(day=>[Date.parse(month+'-0'+day+'T12:00:00Z')/1000,10,day===1?12:i===5?19:14,8,11]));
 ctx.window={TRM:{trCandles(){throw Error('cache esperado')},TR:{dados:{'cd|PRIO3|1d':{v:{candles}}}}}};
 const g={identificacao_visual:{ticker:'PRIO3',market:'BR',periodo:'1M',origem:'cabecalho'},geometria_preco:{x0:.05,x1:.95,y0:.1,y1:.8,candles:'preto_fundo_claro',eixos:[{y:.2,preco:20},{y:.4,preco:15},{y:.6,preco:10}],tempo:[{x:.2,data:dates[1]},{x:.8,data:dates[10]}]}};
 assert.equal(await ctx.aureaHistoricoTerminal(g,new AbortController().signal),true);
 assert.equal(g.validacao_ohlc.tf,'1M');assert.equal(g.pivos.find(p=>p.data===dates[5]).preco,'19');
});

test('foto diária sem escala e datas: gráfico do Terminal e imagem chegam a topos e fundos por OHLC',async()=>{
 const w=420,h=420,px=new Uint8ClampedArray(w*h*4).fill(255),history=[];
 for(let i=0;i<36;i++){
  const low=38+i*.27+5*Math.sin(i*.83)+2*Math.cos(i*.37),high=low+2+(i*7%9)*.3;
  history.push([Date.UTC(2025,0,i+1)/1000,low+.5,high,low,high-.5]);
  const x=42+i*9,u=Math.round(710-11*high),l=Math.round(710-11*low);
  for(let y=u;y<=l;y++)for(let col=x-(y>u+4&&y<l-4?2:0);col<=x+(y>u+4&&y<l-4?2:0);col++){
   const k=4*(y*w+col);px[k]=px[k+1]=px[k+2]=15;
  }
 }
 const g={identificacao_visual:{ticker:'PRIO3',periodo:'1D',market:'BR',origem:'marca_dagua'},
  geometria_preco:{x0:.05,y0:.09,x1:.94,y1:.93,candles:'preto_fundo_claro',eixos:[],tempo:[]},pivos:[]};
 let reads=0;
 ctx.window={TRM:{tec:{velas:(tk,tf)=>{reads++;assert.equal(tk,'PRIO3');assert.equal(tf,'1d');return {L:history}}}}};
 ctx.Image=class{naturalWidth=w;naturalHeight=h;async decode(){}};
 ctx.document={createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:px})})})};
 const signal=new AbortController().signal;
 const resposta=await ctx.aureaValidarHistoricoV1012(g,'Analise',signal);
 await ctx.aureaValidarImagemV1021(resposta,[{url:'fixture'}],signal);
 assert.ok(reads>0);assert.equal(g.validacao_ohlc.source,'Terminal · gráfico');assert.equal(g.validacao_ohlc.status,'conferido');
 for(const tipo of ['topo','fundo'])assert.ok(g.pivos.some(p=>p.tipo===tipo&&p.ancoragem_visual==='pixel_compativel'&&history.some(v=>v[tipo==='topo'?2:3]===Number(p.preco))));
 const bars=history.map(v=>({h:v[2],l:v[3]}));
 assert.equal(ctx.aureaAlinharPavios(g,[...bars,...bars],px,w,h),null);
});
