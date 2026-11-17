const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{stripTypeScriptTypes}=require('node:module');
function backend(){
 const c={console,URL,Date,Map,Set,Intl,Response,Request,AbortSignal,TextEncoder,TextDecoder,crypto:globalThis.crypto,fetch:async()=>{throw Error('Rede inesperada')},Deno:{env:{get:()=>''},serve(){}}};vm.createContext(c);vm.runInContext(fs.readFileSync('supabase/functions/_shared/jornal-quality.js','utf8'),c);
 vm.runInContext(stripTypeScriptTypes(fs.readFileSync('supabase/functions/analise/validacao.ts','utf8').replace(/\bexport /g,'')),c);
 vm.runInContext(stripTypeScriptTypes(fs.readFileSync('supabase/functions/analise/jornal-fontes.ts','utf8').replace(/\bexport /g,'')),c);
 const src=fs.readFileSync('supabase/functions/analise/index.ts','utf8').replace(/^import .*$/gm,'').replace(/^export \{.*\};$/gm,'').replace(/\bexport /g,'');vm.runInContext(stripTypeScriptTypes(src),c);return c;
}
test('montagem ignora texto enviado pelo cliente e usa somente partes do mesmo snapshot',async()=>{
 const c=backend(),db=new Map(),E={dia:'2026-11-16',ed:'tarde'},P={prep_id:'1794870000000',coletado_em:'2026-11-16T23:00:00Z',q:[{k:'ibov',n:'Ibovespa',px:169295,d1:-1.83}],mans:[],mercado:{}};
 c.db=db;vm.runInContext('cacheGet=async k=>db.has(k)?{dados:db.get(k)}:null; cachePut=async(k,d)=>db.set(k,d);',c);
 const art={titulo:'Ibovespa recua 1,83%',texto:'O Ibovespa recua 1,83%.'};db.set('jornal:2026-11-16:tarde:pA:v717:'+P.prep_id,{r:{manchete:art,__ia:'Fixture',__pesquisa_web:false}});
 db.set('jornal:2026-11-16:tarde:pB1:v717:1794860000000',{r:{materias:[{titulo:'Parte de outro snapshot',texto:'Não pode entrar.'}]}});
 c.E=E;c.P=P;const r=await vm.runInContext("jrJuntaSalva(E,P,{A:{manchete:{titulo:'Texto adulterado',texto:'Não pode entrar.'}}})",c);
 assert.equal(r.manchete.titulo,art.titulo);assert.equal(r.materias.length,0);assert.equal(r.parcial,true);assert.equal(r.pesquisa_web,false);assert.equal(r.prep_id,P.prep_id);assert.equal(r.cotacoes[0].px,169295);
});
test('sem uma parte persistida da referência solicitada, a edição não é montada com conteúdo do navegador',async()=>{const c=backend();vm.runInContext('cacheGet=async()=>null;',c);await assert.rejects(vm.runInContext("jrJuntaSalva({dia:'2026-11-16',ed:'tarde'},{prep_id:'1794870000000'},{A:{manchete:{titulo:'Fake',texto:'Fake'}}})",c),/nenhuma parte/);});
test('extensões da interface carregam sem reatribuir constantes do jornal antigo',()=>{const c={console,URL,Date,Map,Set,document:{addEventListener(){},head:{append(){}},createElement(){return {}}},vJornal(){return ''},jrPinta(){},jrCorpo(){return ''},jrVer(){},jrMateria(){return ''},window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync('supabase/functions/_shared/jornal-quality.js','utf8'),c);c.window.DiarioJornalQualidade=c.DiarioJornalQualidade;vm.runInContext('const jrChip=()=>"";const jrNumF=()=>"";',c);vm.runInContext(fs.readFileSync('src/journal/editorial.js','utf8'),c);assert.equal(typeof c.window.DiarioJornalEditorial.edition,'function');});

test('segunda leitura retém causa não comprovada mesmo quando a citação é real',async()=>{
 const c=backend();c.fixture={manchete:{titulo:'Movimento atribuído a causa sem prova',texto:'O mercado mudou por causa da decisão do banco.',fonte_url:'https://www.bcb.gov.br/noticia',evidencia_trecho:'O banco manteve a decisão durante a reunião de política monetária.'}};
 c.P={prep_id:'1794870000000',q:[],mans:[],fontes_primarias:[{url:c.fixture.manchete.fonte_url,titulo:'Banco'}],pedido:'Fixture',documentos:[{url:c.fixture.manchete.fonte_url,texto:c.fixture.manchete.evidencia_trecho}]};
 vm.runInContext('cachePut=async()=>{};fontesJornal=async()=>[];modelosReserva=async()=>["fixture"];gemini=async(sys)=>sys.startsWith("Você é revisor factual")?{pareceres:[{indice:0,situacao:"insuficiente",motivo:"A fonte descreve a decisão, sem comprovar a causa do movimento."}]}:structuredClone(fixture);',Object.assign(c,{structuredClone}));
 const r=await vm.runInContext('jrParteGera({dia:"2026-11-16",ed:"tarde"},P,"A",Date.now()+60000)',c);assert.match(r.manchete.revisao,/causa/);assert.equal(r.manchete.conferencia_fonte.estado,'trecho_localizado');
});
test('segunda leitura sustentada ainda exige uma citação literal da fonte correspondente',async()=>{
 const c=backend();c.fixture={manchete:{titulo:'Decisão do banco',texto:'O banco manteve a decisão durante a reunião de política monetária.',fonte_url:'https://www.bcb.gov.br/noticia'}};
 c.P={prep_id:'1794870000000',q:[],mans:[],fontes_primarias:[{url:c.fixture.manchete.fonte_url,titulo:'Banco'}],pedido:'Fixture',documentos:[{url:c.fixture.manchete.fonte_url,texto:c.fixture.manchete.texto}]};
 vm.runInContext('cachePut=async()=>{};fontesJornal=async()=>[];modelosReserva=async()=>["fixture"];gemini=async(sys)=>sys.startsWith("Você é revisor factual")?{pareceres:[{indice:0,situacao:"sustentado",motivo:"Decisão descrita pela fonte.",evidencia_trecho:fixture.manchete.texto}]}:structuredClone(fixture);',Object.assign(c,{structuredClone}));
 const r=await vm.runInContext('jrParteGera({dia:"2026-11-16",ed:"tarde"},P,"A",Date.now()+60000)',c);assert.equal(r.manchete.revisao,undefined);assert.equal(r.manchete.conferencia_fonte.estado,'revisado_ia');
});
