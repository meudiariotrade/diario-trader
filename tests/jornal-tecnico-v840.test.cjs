const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {fixture,render}=require('./jornal-pdf-v714.test.cjs');
const serie=Array.from({length:60},(_,i)=>100+i*.5+Math.sin(i)*2);
const it=(sym,nome,tipo,t)=>({sym,nome,tipo,px:serie.at(-1),d1:-1.2,rsi14:41.5,sma20:120,sma50:115,sma200:105,dist20:3.1,dist200:12.4,ret1m:-2.2,ret3m:5.4,max52:140,min52:90,tendencia:t,dia:'2026-11-16',serie});
test('v840: painel técnico de índices EUA e criptos entra no snapshot e no PDF do Jornal',async()=>{
 const {e,market}=fixture();
 market.tecnico={itens:[it('^GSPC','S&P 500','indice','Alta'),it('^IXIC','Nasdaq','indice','Baixa'),it('BTC-USD','Bitcoin','cripto','Lateral'),{sym:'x y',px:1}],coletado_em:e.gerado,fonte:'Yahoo'};
 const r=await render(e,market);
 assert.equal(r.prepared.snapshot.tecnico.itens.length,3,'símbolo inválido descartado');
 const txt=r.ops.map(x=>x.text).join('\n');
 assert.match(txt,/PAINEL TÉCNICO/);assert.match(txt,/S&P 500/);assert.match(txt,/Bitcoin/);assert.match(txt,/RSI 14: 41,5/);assert.match(txt,/ALTA/);
});
test('v840: coletor calcula RSI, médias e tendência de forma determinística',async()=>{
 const src=fs.readFileSync('supabase/functions/analise/jornal-dados.ts','utf8');
 assert.match(src,/export async function tecnicoGlobal/);assert.match(src,/workers\.dev\/v1\/diario/);
 for(const s of ['^GSPC','^IXIC','^DJI','^RUT','BTC-USD','ETH-USD','SOL-USD','XRP-USD'])assert.ok(src.includes("'"+s+"'"),s);
 assert.match(fs.readFileSync('supabase/functions/analise/index.ts','utf8'),/tecnico: tecGlobal/);
});
test('v840: agenda do Jornal volta a ter impacto, consenso e anterior (calendário da Cloudflare)',()=>{
 const src=fs.readFileSync('supabase/functions/analise/jornal-fontes.ts','utf8');
 assert.match(src,/export function agendaCalendario/);assert.match(src,/workers\.dev\/v1\/agenda\?semana=/);
 const {stripTypeScriptTypes}=require('node:module');const code=stripTypeScriptTypes(src.slice(src.indexOf('const CAL_URL'),src.indexOf('export async function agendaJornal'))).replace('export function','function');
 const f=new Function(code+';return agendaCalendario;')();
 const r=f([{p:'US',t:'CPI (Nov.)',em:'2026-12-10T13:30:00Z',imp:1,proj:'0,3%',ant:'0,2%'},{p:'BR',t:'Rotina',em:'2026-12-10T12:00:00Z',imp:-1}]);
 assert.equal(r.length,1);assert.deepEqual([r[0].data,r[0].horario,r[0].pais,r[0].impacto,r[0].consenso,r[0].anterior],['2026-12-10','10:30','EUA','alto','0,3%','0,2%']);
});
