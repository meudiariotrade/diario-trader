const {test}=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/domains/core/04-analises-e-estudos.js','utf8');
const start=source.indexOf('const MK_TEMA_MERCADO'),end=source.indexOf('function mkLimpaTitulo',start);
const ts=source.indexOf('const MK_TRADUCOES'),te=source.indexOf('async function mkLoad',ts);
assert.ok(start>0&&end>start&&ts>0&&te>ts);
const c=vm.createContext({mkNorm:t=>String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),URL,AbortSignal,Map,Set,Promise,fetch:async()=>{throw Error('fora do ar')}});
vm.runInContext(source.slice(start,end)+source.slice(ts,te),c);
const check=t=>vm.runInContext('mkNoticiaDeMercado('+JSON.stringify(t)+')',c);
test('bloqueia colunas pessoais e saude nao economica',()=>{
for(const s of ['The Moneyist: my wife needs a loan','Dear Penny: how much do I need to retire at 50?','My husband sold his house','Wedding trends in 2026','Weekly horoscope for Scorpio','Mpox symptoms on the rise'])assert.equal(check(s),false,s);
});
test('mantem economia, bolsa e saude com efeito nos negocios',()=>{
for(const s of ['Fed holds rates steady','Petrobras tem alta de lucro no terceiro trimestre','Nvidia shares rally after earnings','Bitcoin supera marca historica','Mpox vaccine maker shares jump in market'])assert.equal(check(s),true,s);
});
test('traducao com falha nao altera noticia nem tags',async()=>{
const entrada=[{t:'Fed holds rates steady',a:'Reuters',c:['juros'],l:'https://example.org',d:new Date().toISOString()}];
const traducao=await vm.runInContext('mkTraduzLote',c)(entrada);
assert.equal(traducao[0].t,entrada[0].t);
assert.deepEqual(traducao[0].c,entrada[0].c);
});
test('identifica manchetes inglesas e nao reprocessa portugues',()=>{
assert.equal(vm.runInContext('mkTituloIngles({t:"Markets rally after Fed decision",a:"Reuters"})',c),true);
assert.equal(vm.runInContext('mkTituloIngles({t:"Bolsa tem alta com decisao do Fed",a:"Reuters"})',c),false);
});
