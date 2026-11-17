const {test}=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'),vm=require('node:vm');
require('../supabase/functions/_shared/jornal-quality.js');
const Q=globalThis.DiarioJornalQualidade;
function noticia(t, texto, extras={}){
 return {editoria:'Mercados',titulo:t, texto, fonte_url:'https://www.b3.com.br/pt_br/',...extras};
}
function ed(){
 return {dia:'2026-11-17',edicao:'manha',gerado:'2026-11-17T11:00:00Z',
   dados_coletados_em:'2026-11-17T10:55:00Z',
   manchete:noticia('Ibovespa recua 1,83%', 'O Ibovespa recua 1,83%.'),
   materias:[],em_poucas_linhas:['Ibovespa recua 1,83% no último fechamento.'],
   cinco_coisas:[{titulo:'Ibovespa recua 1,83%',texto:'Último fechamento confirmado da edição.'}],
   analise:{titulo:'Cenário macroeconômico',texto:'A curva de juros deve ser acompanhada com atenção. Dados de câmbio e juros têm horários específicos.'},
   agenda:[],cotacoes:[
      {k:'ibov',n:'Ibovespa',px:169295,d1:-1.83,fonte:'B3',dia_referencia:'2026-11-16'},
      {k:'brent',n:'Petróleo Brent',px:91.35,d1:-0.30,fonte:'Fonte de mercado',dia_referencia:'2026-11-16'},
      {k:'minerio',n:'Minério de ferro SGX',px:89.95,d1:-0.17,fonte:'Fonte de mercado',dia_referencia:'2026-11-16'},
      {k:'di29',n:'DI Jan/29',px:15.013,d1:0.34,fonte:'B3',dia_referencia:'2026-11-16'},
      {k:'dolar',n:'Dólar Comercial',px:5.784,d1:0.01,fonte:'BCB',dia_referencia:'2026-11-16'},
      {k:'nasdaq',n:'Nasdaq',px:24509.76,d1:-2.49,fonte:'NYSE',dia_referencia:'2026-11-16'},
   ]};
}
test('v729: divergência em uma matéria não apaga cinco coisas, notas e análise independentes',()=>{
 const e=ed();
 e.manchete.texto='O Ibovespa encerrou aos 160.000 pontos.'; // divergente com 169.295
 const r=Q.prepare(e);
 assert.match(r.manchete.titulo,/retido/);
 assert.equal(r.em_poucas_linhas.length,1);
 assert.equal(r.cinco_coisas.length,1);
 assert.ok(r.analise?.texto.includes('A curva de juros'));
});
test('v729: material divergente na nota é eliminado, outras notas são preservadas',()=>{
 const e=ed();e.manchete.texto='Ibovespa aos 160.000 pontos.';
 e.em_poucas_linhas.push('Ibovespa encerrou aos 160.000 pontos.');
 const r=Q.prepare(e);
 assert.equal(r.em_poucas_linhas.length,1);
});
test('v729: mantém motor visual do Jornal restaurado v721',()=>{
 const pdf=fs.readFileSync('src/pdf-documentos.js','utf8');
 assert.match(pdf,/motor visual original v713/);
 assert.match(pdf,/Jornal do Pregão/);
});
test('v729: reconstrói editorias de CONTEXTO verificável quando a IA não traz artigos aprovados',()=>{
 const fake=()=>'', env={console,URL,Date,Map,Set,document:{addEventListener(){},head:{append(){}},createElement(){return {}}},vJornal:fake,jrPinta:fake,jrCorpo:fake,jrVer:fake,jrMateria:fake,window:{},setTimeout(){}};
 vm.createContext(env);
 vm.runInContext(fs.readFileSync('supabase/functions/_shared/jornal-quality.js','utf8'),env);
 env.window.DiarioJornalQualidade=env.DiarioJornalQualidade;
 vm.runInContext(fs.readFileSync('src/journal/editorial.js','utf8'),env);
 const result=env.window.DiarioJornalEditorial.presentation(ed());
 assert.ok(result.materias.length>=3);
 assert.ok(result.materias.every(x=>x.contexto_snapshot||x.fonte_url));
 assert.ok(result.materias.some(x=>/Petróleo/.test(x.titulo)));
 assert.ok(result.materias.every(x=>!x.texto.includes('160.000')));
 assert.equal(result.snapshot.cotacoes[0].px,169295);
});
