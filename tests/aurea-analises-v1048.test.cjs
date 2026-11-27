const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const vm=require('vm');
const src=fs.readFileSync(__dirname+'/../src/domains/core/07-conta-e-integracoes.js','utf8');
const pick=n=>{const i=src.indexOf('function '+n+'(');let d=0,j=src.indexOf('{',i);for(;j<src.length;j++){if(src[j]=='{')d++;else if(src[j]=='}'){d--;if(!d)break;}}return src.slice(i,j+1);};
const ap=src.slice(src.indexOf('const AUREA_APELIDOS_V1048'),src.indexOf('\n',src.indexOf('const AUREA_APELIDOS_V1048')));
const ctx={};vm.createContext(ctx);vm.runInContext(ap.replace('const ','var ')+'\n'+['aureaObvV1051','aureaZigZagV1051','aureaTickersV1048','aureaDossieCalcV1048','aureaDossieTextoV1048'].map(pick).join('\n'),ctx);
test('apelidos viram ticker sem confundir "vale a pena"',()=>{
 assert.deepEqual([...ctx.aureaTickersV1048('Estou pensando em comprar uma put de petr')],['PETR4']);
 assert.deepEqual([...ctx.aureaTickersV1048('Vale a pena comprar call agora?')],[]);
 assert.deepEqual([...ctx.aureaTickersV1048('put de vale para dezembro')],['VALE3']);
 assert.deepEqual([...ctx.aureaTickersV1048('e PETR3?')],['PETR3']);
});
test('dossiê calcula médias, IFR, volatilidade, suportes e resistências do histórico',()=>{
 const rows=[];let p=40;const t0=Date.UTC(2026,0,1)/1000;
 for(let i=0;i<260;i++){p=40+8*Math.sin(i/15)+i*0.01;rows.push([t0+i*86400,p,p+0.6,p-0.6,p,1000]);}
 const d=ctx.aureaDossieCalcV1048('PETR4',rows,'teste');
 assert.equal(d.ticker,'PETR4');assert.equal(d.medias.length,3);
 assert.ok(d.ifr14>=0&&d.ifr14<=100);assert.ok(d.vol_hist_20d_aa>0);
 assert.ok(d.resistencias.every(x=>x>d.fechamento));assert.ok(d.suportes.every(x=>x<d.fechamento));
 assert.ok(d.ultimos_pivos.length>=2);
 assert.match(ctx.aureaDossieTextoV1048(d),/DOSSIÊ TÉCNICO.*PETR4.*IFR14/);
 assert.equal(ctx.aureaDossieCalcV1048('X',rows.slice(0,10)),null);
});
test('pareceres mantêm números conferidos e trocam só os sem lastro',async()=>{
 const {normalizarOpcoesParecerV1017}=await import('../cloudflare/diario-screeners/aurea-debate-v1013.mjs');
 const fonte='DOSSIÊ fechamento 43,71 MM200 51,2 suportes 40,41';
 const r=normalizarOpcoesParecerV1017({resumo:'PETR4 em 43,71 abaixo da MM200 de 51,2; alvo 30.',explicacao:['Suporte 40,41'],veredito:{decisao:'aguardar',texto:'Aguardar perda de 40,41 antes da put.',direcao:'baixa',gatilho_preco:40.41,invalidacao_preco:99}},'livermore',fonte);
 assert.match(r.resumo,/43,71.*51,2/);assert.doesNotMatch(r.resumo,/alvo 30/);
 assert.equal(r.veredito.decisao,'aguardar');assert.equal(r.veredito.gatilho_preco,40.41);assert.equal(r.veredito.invalidacao_preco,null);
});
test('placar registra e confere gatilho antes da invalidação',()=>{
 const store={};const win={};const c={window:win,localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},Date,JSON,Number,Array};
 vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/../src/shared/aurea-placar.js','utf8'),c);
 const P=win.DiarioPlacarAurea;
 P.registrar({veredito:{direcao:'baixa',gatilho_preco:40,invalidacao_preco:46}},'livermore',{ticker:'PETR4',data:'2026-11-20',fechamento:43});
 const t=Date.UTC(2026,10,21)/1000;
 P.avaliar('PETR4',[[t,43,44,42,43],[t+86400,42,42.5,39.8,40.2]]);
 assert.deepEqual({...P.resumo('livermore')},{acertos:1,erros:0,abertos:0,total:1});
});
