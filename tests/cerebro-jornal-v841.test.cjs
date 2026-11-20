const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('v841: Cérebro grava lições do placar, mede acerto por fonte e usa o visual novo',()=>{
 const src=fs.readFileSync('src/ai/cerebro-ia.js','utf8');
 assert.match(src,/async function licoes\(force\)/);assert.match(src,/acao:'indexar',obra_id:st\.obra,titulo_obra:'Lições da IA/);
 assert.match(src,/function porFonte\(\)/);assert.match(src,/class="cb842|class="cb841/);assert.doesNotMatch(src,/#D4A017/);
 const ctx={window:{},document:{addEventListener(){},querySelector:()=>null},localStorage:{getItem:()=>null,setItem(){}},crypto:{randomUUID:()=>'00000000-0000-4000-8000-000000000000'},indexedDB:{},console};ctx.window=ctx;
 ctx.jvpLinhas=()=>[{tk:'PETR4',dia:'2026-10-30',px:52.68,now:45.3,ret:-14,dir:1,dias:21,ok:false,val:'BARATO',vies:'ALTA',refs:['Manual Mestre Institucional']},{tk:'BBAS3',dia:'2026-10-30',px:16.5,now:17,ret:3,dir:1,dias:21,ok:true,refs:['Manual Mestre Institucional']}];
 vm.runInNewContext(src,ctx);const C=ctx.DiarioCerebroIA;
 const t=C.textoLicao(ctx.jvpLinhas()[0]);assert.match(t,/LIÇÃO DA IA — PETR4/);assert.match(t,/a leitura errou/);assert.ok(t.length>=50&&t.length<=1400);
 const f=C.porFonte();assert.equal(f[0].titulo,'Manual Mestre Institucional');assert.equal(f[0].n,2);assert.equal(f[0].ok,1);
});
test('v841: IA da análise técnica, fundamentalista, Economista e Pesquisa consultam o Cérebro por tema',()=>{
 const a=fs.readFileSync('supabase/functions/analise/index.ts','utf8');
 assert.match(a,/contextoPrivadoTrading\(req, tksRag/);assert.match(a,/contextoPrivadoTrading\(req, 'macro '/);assert.match(a,/referencias_cerebro: refsCerebro/);
 const p=fs.readFileSync('supabase/functions/pesquisa/index.ts','utf8');assert.match(p,/consulta:consultaCerebro\(job\.comando\)/);assert.match(p,/similarity\)>=0\.35/);
 assert.match(fs.readFileSync('supabase/functions/pesquisa/motor.ts','utf8'),/Referências do Cérebro usadas/);
 assert.match(fs.readFileSync('src/domains/core/16-rotina-e-disciplina.js','utf8'),/refs: \[\.\.\.new Set/);
});
test('v841: Jornal com medo e ganância cripto, fluxo do EWZ, setores, placar da semana e seus ativos',()=>{
 require('../supabase/functions/_shared/jornal-quality.js');const Q=globalThis.DiarioJornalQualidade;
 const t=Q.prepare({dia:'2026-11-20',edicao:'tarde',cotacoes:[],manchete:{titulo:'x',texto:'y'},materias:[]},{tecnico:{itens:[],fng:{v:22,classe:'Medo extremo'},ewz:{spot:28.5,vies:'vendedor',netC:-1,netP:2},setores_eua:[{sym:'XLK',nome:'Tecnologia',d1:-4.2,m1:-8}]}}).snapshot.tecnico;
 assert.equal(t.fng.v,22);assert.equal(t.ewz.vies,'vendedor');assert.equal(t.setores_eua[0].sym,'XLK');
 const d=fs.readFileSync('supabase/functions/analise/jornal-dados.ts','utf8');
 assert.match(d,/api\.alternative\.me\/fng/);assert.match(d,/v1\/ewz/);assert.match(d,/'XLK','Tecnologia'/);assert.match(d,/columns:\['name','close','change','time','sector'\]/);
 const pdf=fs.readFileSync('src/pdf-documentos.js','utf8');assert.match(pdf,/Setores do S&P 500 hoje/);assert.match(pdf,/Fluxo de opções do EWZ/);assert.match(pdf,/jvpSemana/);
 const ed=fs.readFileSync('src/journal/editorial.js','utf8');assert.match(ed,/Seus ativos · preço teto/);assert.match(ed,/Sentimento, fluxo e setores/);
});
test('v841: Cérebro não herda as colunas de Estudos no PC',()=>{assert.match(fs.readFileSync('src/app-theme.css','utf8'),/#dt393-workspace>div:has\(\[data-brain-root\]\)\{column-count:auto!important\}/);});
