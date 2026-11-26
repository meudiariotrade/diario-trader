const {test}=require('node:test');
const assert=require('node:assert/strict');
const visual=import('../cloudflare/diario-screeners/livermore-visual.mjs');
const worker=import('../cloudflare/diario-screeners/aurea-imagem-v1004.mjs');

test('imagem simples, teoria de Dow e escolha explícita de conselheiros',async()=>{
  const {lentesSolicitadas}=await visual;
  assert.deepEqual(lentesSolicitadas('PETR4: preço, OBV e teoria de Dow'),[]);
  assert.deepEqual(lentesSolicitadas('Inclua Graham e Munger, sem Dalio'),['graham','munger']);
});

test('leitura visual compara altura de extremos e ordem dos rompimentos nos dois sentidos',async()=>{
  const {indicadoresVisuais}=await visual;
  for(const tipo of ['topo','fundo']){
    for(const [preco,obv,esperado] of [[3,3,'mesma barra'],[null,2,'Possível antecipação'],[2,null,'Possível divergência'],[4,2,'o preço confirmou depois'],[2,4,'depois'],[null,null,'preservados']]){
      const registro={legenda:'OBV',extremos:[{tipo,anterior:[.3,.7],recente:[.6,.8]}],eventos:[{tipo,referencia:'extremos do último movimento',preco,obv}]};
      const r=indicadoresVisuais({indicadores_visuais:{obv:registro}});
      assert.ok(r.obv.includes(esperado));assert.ok(r.obv.includes('descendentes'));
      assert.equal(r.medias,'');
    }
  }
});

test('média com curva e legenda; OBV e períodos ausentes ficam vazios',async()=>{
  const {indicadoresVisuais}=await visual;
  const dados={medias:[{periodo:20,legenda:'MME 20',inclinacao:'descendente',posicao:'abaixo'},{periodo:200,legenda:'linha azul'}]};
  const r=indicadoresVisuais({indicadores_visuais:dados});
  assert.match(r.medias,/MME 20.*descendente.*abaixo/);assert.doesNotMatch(r.medias,/200/);assert.equal(r.obv,'');
});

test('parecer de Livermore não deixa a média inventada reaparecer no cenário ou no resumo',async()=>{
  const {parecer}=await worker;
  const raw={tipo:'grafico_parcial',tecnico:'O último topo permanece intacto.',resumo:'Movimento de reação. Rompimento da média de 20.',estrutura:{lacuna:'Escala nominal ilegível.',principal:'Repique até o topo anterior. Preço busca a MM50.'},confluencias_visuais:{obv:'Altista',medias:'Acima da MM20'},critico:'O risco é perder o fundo.'};
  const r=parecer(JSON.stringify(raw),null,1,false,[]);
  assert.deepEqual(r.visoes.map(v=>v.escola),['Livermore · Técnico']);
  assert.doesNotMatch(JSON.stringify(r),/MM50|MM20|média de 20|Altista/i);
  assert.deepEqual(parecer(JSON.stringify(raw),null,1,false,['munger']).visoes.map(v=>v.escola),['Livermore · Técnico','Munger · Crítico de teses']);
});
