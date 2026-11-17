const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const PDFLib=require('../pdf-lib.min.js'),fontkit=require('../fontkit.umd.min.js');
function fixture(){
 const dia='2026-11-16',gerado='2026-11-17T00:00:00Z';
 const art=(n,editoria)=>({titulo:`Tema ${n}: análise ilustrativa com referências identificadas`,editoria,chapeu:'AMOSTRA SIMULADA',linha_fina:'Exemplo de estrutura editorial; os números e os cenários abaixo são fictícios.',fato:'Este conteúdo é uma fixture de validação de diagramação. A referência foi preservada em toda a edição para permitir comparação entre tela, tabelas e PDF.',interpretacao:'O exemplo separa a informação recebida da interpretação. A leitura depende da qualidade dos dados e pode ser enfraquecida por mudanças nos indicadores ou por ausência de confirmação em outros mercados.',cenario:'Se o mercado confirmar a condição descrita na sessão seguinte, a hipótese ganha suporte. Retorno à faixa de referência e divergência entre os ativos enfraquecem a interpretação; não há confirmação automática.',texto:'Texto alternativo para compatibilidade.',fonte_url:'https://www.bcb.gov.br/',periodo:dia,numeros:[{rotulo:'Métrica ilustrativa',valor:'123,45'}],por_que_importa:'Relaciona o evento com uma condição observável, sem afirmar causalidade nem prometer resultado.'});
 const e={dia,gerado,edicao:'tarde',nome:'Edição da noite',simulado:true,dados_coletados_em:'2026-11-16T23:30:00Z',manchete:art('principal','Mercados'),materias:[art('1','Empresas'),art('2','Empresas'),art('3','Macroeconomia'),art('4','Câmbio'),art('5','Internacional')],fontes:[{titulo:'Banco Central - fonte ilustrativa do teste',url:'https://www.bcb.gov.br/'}],cotacoes:[{k:'win',n:'Mini índice (WIN)',px:170845,d1:-1.91,contrato:'WINZ2026',fonte:'Fixture',referencia_em:'2026-11-16T21:30:00Z'},{k:'wdo',n:'Dólar futuro (WDO)',px:5806.5,d1:2.53,contrato:'WDOZ2026',fonte:'Fixture',referencia_em:'2026-11-16T21:30:00Z'},{k:'di29',n:'DI jan/29',px:15.013,d1:.342,fonte:'Fixture'}],agenda:[{evento:'Evento ilustrativo',data:'2026-11-17',horario:'09:00',pais:'Brasil',fonte_url:'https://www.bcb.gov.br/',consenso:'Indisponível',anterior:'Indisponível'}]};
 const market={sessoes:{win:{H:172540,L:170100,C:170845,completa:true,contrato:'WINZ2026',dia,fonte:'Fixture',referencia_em:gerado},wdo:{H:5810,L:5691,C:5806.5,completa:true,contrato:'WDOZ2026',dia,fonte:'Fixture',referencia_em:gerado}},macro:{ind:[{nome:'Selic ilustrativa',v:13.75,un:'% a.a.',periodo:dia}],focus:[]},graficos:{win:{contrato:'WINZ2026',dia,fonte:'Fixture',d:Array.from({length:40},(_,i)=>[Date.parse('2026-11-16T12:00:00Z')/1000+i*300,171000-i*5,171020-i*5,170980-i*5,171005-i*5])}}};
 return {e,market};
}
async function render(e,market){
 const w={DiarioFontes:async doc=>{doc.registerFontkit(fontkit);return {r:await doc.embedFont(fs.readFileSync('pdf-sans.ttf')),b:await doc.embedFont(fs.readFileSync('pdf-sans-bold.ttf'))}}};
 const c={window:w,globalThis:null,DiarioChunks:{functions:{}},rpLib:async()=>c.PDFLib,Uint8Array,ArrayBuffer,setTimeout,console,URL,Date,Map,Set,Intl};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('pdf-lib.min.js','utf8'),c);vm.runInContext(fs.readFileSync('supabase/functions/_shared/jornal-quality.js','utf8'),c);w.DiarioJornalQualidade=c.DiarioJornalQualidade;
 const prepared=c.DiarioJornalQualidade.prepare(e,market);vm.runInContext(fs.readFileSync('src/pdf-documentos.js','utf8'),c);
 const pdf=await c.DiarioChunks.functions.jvPdfBytes(prepared);return {...pdf,ops:w.__jornalPdfLayout,prepared};
}
test('PDF completo usa snapshot, fontes clicáveis, números íntegros e todos os elementos dentro da página',async()=>{
 const {e,market}=fixture(),r=await render(e,market);assert.ok(r.paginas>=4&&r.paginas<=8,'Páginas: '+r.paginas);
 for(const op of r.ops){assert.ok(op.x>=40&&op.x+op.width<=555.3,JSON.stringify(op));assert.ok(op.top>=20&&op.top+op.size<=822,JSON.stringify(op));}
 assert.ok(r.ops.some(op=>op.text.includes('+0,342 p.p.')));assert.ok(r.ops.some(op=>op.text.includes('5.806,5')));assert.ok(r.ops.some(op=>op.text.includes('AMOSTRA - DADOS SIMULADOS')));
 const doc=await PDFLib.PDFDocument.load(r.bytes);assert.ok(doc.getPages().some(p=>(p.node.Annots()?.size()||0)>0));
 fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/jornal-v714-amostra-simulada.pdf',r.bytes);
});
test('PDF com lacunas e divergências mantém os avisos e omite dados contraditórios',async()=>{
 const {e}=fixture();e.cotacoes=[{k:'ibov',px:169295,d1:-1.83}];e.manchete={titulo:'Ibovespa cai 5,1%',texto:'O Ibovespa cai 5,1%.'};const r=await render(e,{});assert.ok(r.ops.some(op=>op.text.includes('retido')));assert.ok(r.ops.some(op=>op.text.includes('Agenda')));assert.ok(r.ops.some(op=>op.text.includes('Níveis indisponíveis')));assert.ok(!r.ops.some(op=>op.text.includes('Ibovespa cai 5,1%')));
});
module.exports={fixture,render};
