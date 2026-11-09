const{test}=require('node:test');const assert=require('node:assert/strict');const{JSDOM}=require('jsdom');const fs=require('node:fs');
test('Movimentos, Insiders e Fluxo só consultam e montam no Panorama; movimentos recolhíveis preservam itens',async()=>{
 const dom=new JSDOM('<main id="app"><nav class="m403-primary-tabs"></nav></main>',{url:'https://example.test/',runScripts:'outside-only'}),w=dom.window,d=w.document;
 w.setInterval=()=>0;w.setTimeout=()=>0;w.tab='mercado';w.MKT={tab:'ag'};w.SESS={uid:'fixture',at:'fixture'};w.tok=async()=>{};w.cfg=()=>({url:'https://example.test',key:'fixture'});w.S={trades:[],ativos:[]};let requests=0;
 w.fetch=async url=>{requests++;return{ok:true,json:async()=>String(url).includes('/movimentos?')?Array.from({length:10},(_,i)=>({ativo:'Teste '+i,variacao:5,criado:new Date().toISOString(),motivo:'Motivo '+i,manchetes:[]})):[]}};
 const source=fs.readFileSync('camadas-v522.js','utf8');
 for(const file of ['extras-v518.js','extras-v519.js','extras-v520.js']){const marker='\n}catch(e){console.error("[v522] falha em '+file+'",e)}',end=source.indexOf(marker);assert.ok(end>0);const start=source.lastIndexOf('\ntry{',end);w.eval(source.slice(start,end+marker.length));}
 for(const page of ['ag','nt','lab','jr','ls']){w.MKT.tab=page;await w.DIARIO_V518.cartao();await w.DIARIO_V519.insCartao();await w.DIARIO_V520.cartao();assert.equal(requests,0,page);assert.equal(d.querySelectorAll('#v518-mov,#v519-ins,#v520-fa').length,0,page)}
 w.MKT.tab='cq';await w.DIARIO_V518.cartao();await w.DIARIO_V519.insCartao();await w.DIARIO_V520.cartao();
 const card=d.getElementById('v518-mov');assert.equal(card.tagName,'DETAILS');assert.equal(card.open,false);assert.match(card.querySelector(':scope>summary').textContent,/Movimentos fortes/);assert.equal(card.querySelectorAll('.v518-it').length,10);card.open=true;assert.match(card.textContent,/Motivo 9/);assert.equal(d.getElementById('v519-ins').tagName,'DETAILS');assert.equal(d.getElementById('v520-fa').tagName,'DETAILS');assert.equal(requests,3);
 dom.window.close();
});
