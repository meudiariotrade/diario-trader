const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function carregar(extra={}){
 const store={};const ctx={window:{},document:{addEventListener(){},querySelector:()=>null,getElementById:()=>null},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},crypto:{randomUUID:()=>'00000000-0000-4000-8000-000000000001'},
  SESS:{uid:'u1'},Date,JSON,Math,Number,String,Object,Array,Map,Set,...extra};
 ctx.window=ctx;vm.runInNewContext(fs.readFileSync('src/ai/cerebro-estudos.js','utf8'),ctx);return ctx;
}
test('v845: diário, regras e placar viram trechos do Cérebro sem notação R',()=>{
 const S={trades:[{id:'a',dt:'2026-11-18T10:00',ativo:'WINZ26',side:'C',entry:125000,stop:124800,exit:124700,setup:'Pullback',emo:'Ansioso',rules:'n',err:'Stop movido',nota:'Mexi no stop'}],
  rules:[{id:1,cat:'Pré-mercado',t:'Conferir agenda econômica'},{id:2,cat:'Pré-mercado',t:'Definir perda máxima do dia em R$ 300'}]};
 const ctx=carregar({S,calc:()=>({pl:-60})});const E=ctx.DiarioCerebroEstudos;
 const t=E.textoTrade(S.trades[0]);assert.match(t,/^ERRO DO DIÁRIO/);assert.match(t,/Stop movido/);assert.match(t,/R\$ -60,00/);assert.doesNotMatch(t,/\d+R\b/);
 const r=E.regrasTextos();assert.equal(r.length,1);assert.match(r[0],/MINHAS REGRAS — Pré-mercado/);
 const a=E.textoAcerto({tk:'VALE3',dia:'2026-11-01',px:60,now:66,ret:10,dir:1,dias:12,val:'BARATO',vies:'ALTA',refs:['Super Trader']});assert.match(a,/ACERTO DA IA — VALE3/);assert.ok(a.length<=1400);
});
test('v845: plano de leitura respeita os turnos e sequência de estudo conta dias seguidos',()=>{
 const ctx=carregar({tcod:k=>k.endsWith('1')?'F':'8'});const E=ctx.DiarioCerebroEstudos;
 assert.equal(E.minutosDia('2026-11-21'),60);assert.equal(E.minutosDia('2026-11-22'),25);
 const hoje=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'}),ontem=new Date(Date.parse(hoje+'T12:00:00Z')-864e5).toISOString().slice(0,10);
 assert.equal(E.sequencia({horas:{[hoje]:10,[ontem]:5}}),2);
 const svg=E.mapaSvg({centro:'Risco',nos:[{id:'a',rotulo:'Stop'},{id:'b',rotulo:'Alvo'}],ligacoes:[{de:'a',para:'b',relacao:'define'}]});assert.match(svg,/<svg class="ce845-mapa"/);assert.match(svg,/define/);
});
test('v845: servidor do Cérebro gera estudo só com trechos, mede cobertura, exclui um trecho e pesa por qualidade e validade',()=>{
 const s=fs.readFileSync('supabase/functions/conhecimento-ia/index.ts','utf8');
 for(const m of ['pergunta','explicar','comparar','mapa','simulado','resumo','aula_erro','glossario','materia','perguntar','trade'])assert.match(s,new RegExp(m+":'"));
 assert.match(s,/Use SOMENTE os trechos fornecidos/);assert.match(s,/Nunca use a notação R/);
 assert.match(s,/b\.acao==='cobertura'/);assert.match(s,/b\.acao==='remover_trecho'/);assert.match(s,/owner_id=eq\.'\+uid\+'&titulo_obra=eq\./);
 assert.match(s,/0\.8\+0\.4\*/);assert.match(s,/1-dias\/365/);
 const c=fs.readFileSync('src/ai/cerebro-ia.js','utf8');assert.match(c,/data-brain-del-hit/);assert.match(c,/acao:'buscar',consulta:q,pesos/);assert.match(c,/DiarioCerebroEstudos\.html\(\)/);assert.match(c,/async function importar\(f/);
 const e=fs.readFileSync('src/ai/cerebro-estudos.js','utf8');assert.doesNotMatch(e,/setInterval/);assert.match(e,/speechSynthesis/);assert.match(e,/Apostila CNPI-T/);assert.match(e,/Super Trader/);
 assert.match(fs.readFileSync('src/index.html','utf8'),/cerebro-estudos\.js/);assert.match(fs.readFileSync('src/service-worker.js','utf8'),/"cerebro-estudos\.js"/);
});
