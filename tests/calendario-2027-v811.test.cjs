const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const sandbox={Intl,Date,Set,Map,Object,Number,String,Math};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('src/shared/sessoes-mercado.js','utf8'),sandbox);
const S=sandbox.DiarioSessoes,t=s=>Date.parse(s);
test('cobertura declarada 2026–2027',()=>{assert.equal(S.coverage,'2026-2027');});
test('virada do ano: depois de 30/12/2026 a próxima sessão B3 é 04/01/2027',()=>{
  const b=S.session('B3',t('2026-12-30T21:30Z'));assert.equal(b.nextDate,'2027-01-04');
  assert.equal(S.tradingDay('B3','2026-12-31'),false);assert.equal(S.tradingDay('B3','2027-01-01'),false);
});
test('Carnaval 2027 fechado e Quarta de Cinzas abre às 13h',()=>{
  for(const d of ['2027-02-08','2027-02-09'])assert.equal(S.tradingDay('B3',d),false);
  const cinzas=S.session('B3',t('2027-02-10T15:30Z'));assert.equal(cinzas.special,true);assert.equal(cinzas.open,780);assert.equal(cinzas.state,'pre');
  assert.equal(S.session('B3',t('2027-02-10T16:30Z')).state,'regular');
});
test('feriados B3 2027 em dia útil e os que caem no sábado',()=>{
  for(const d of ['2027-03-26','2027-04-21','2027-05-27','2027-09-07','2027-10-12','2027-11-02','2027-11-15','2027-12-24','2027-12-31'])assert.equal(S.tradingDay('B3',d),false,d);
  for(const d of ['2027-01-25','2027-07-09'])assert.equal(S.tradingDay('B3',d),true,d+' feriado só de São Paulo não fecha a B3');
});
test('NYSE 2027: feriados, observados e encerramento antecipado',()=>{
  for(const d of ['2027-01-18','2027-02-15','2027-05-31','2027-06-18','2027-07-05','2027-09-06','2027-11-25','2027-12-24'])assert.equal(S.tradingDay('US',d),false,d);
  const c=S.context(t('2027-07-05T16:00Z'));assert.equal(c.b3.tradable,true);assert.match(c.warning,/EUA fechados/);
  assert.equal(S.session('NYSE',t('2027-11-26T17:00Z')).early,true);
});
test('2028 continua fora da cobertura (não inventa sessão)',()=>{assert.equal(S.session('B3',t('2028-03-01T15:00Z')).state,'desconhecido');});
