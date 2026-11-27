const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const vm=require('vm');
const src=fs.readFileSync(__dirname+'/../src/domains/core/07-conta-e-integracoes.js','utf8');
const pick=n=>{const i=src.indexOf('function '+n+'(');let d=0,j=src.indexOf('{',i);for(;j<src.length;j++){if(src[j]=='{')d++;else if(src[j]=='}'){d--;if(!d)break;}}return src.slice(i,j+1);};
const ctx={};vm.createContext(ctx);vm.runInContext(['aureaObvV1051','aureaZigZagV1051'].map(pick).join('\n'),ctx);
function serie(way,seed=7){let s=seed;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};const bars=[];let prev=way[0][1];
 for(let k=0;k<way.length-1;k++){const [a,pa]=way[k],[b,pb]=way[k+1];for(let i=a;i<b;i++){const c=pa+(pb-pa)*(i-a)/(b-a)+(r()-.5)*1.2;const o=prev;bars.push({date:'d'+i,o,c,h:Math.max(o,c)+r()*.6,l:Math.min(o,c)-r()*.6,v:1e6});prev=c;}}return bars;}
test('v1051 pivôs seguem a estrutura (topos e fundos relevantes), não ruído',()=>{
 const z=ctx.aureaZigZagV1051(serie([[0,44],[22,37.5],[38,45.5],[52,41],[90,60],[120,40.2],[126,44.5]]));
 const fundos=z.filter(p=>p.tipo==='fundo').map(p=>+p.preco),topos=z.filter(p=>p.tipo==='topo').map(p=>+p.preco);
 assert.ok(fundos.some(v=>Math.abs(v-37.5)<1.5)&&fundos.some(v=>Math.abs(v-41)<1.5)&&fundos.some(v=>Math.abs(v-40.2)<1.5));
 assert.ok(topos.some(v=>Math.abs(v-45.5)<1.5)&&topos.some(v=>Math.abs(v-60)<1.5));
 assert.ok(z.length<=8);assert.equal(z[z.length-1].estado,'potencial');
});
test('v1051 OBV confirma o rompimento só quando passa do OBV do pivô',()=>{
 const mk=(c,v)=>({date:'x',o:c,h:c+.2,l:c-.2,c,v});
 const up=[40,42,44,46,48,50,47,44,42,44,46,48,51,52].map((c,i)=>mk(c,i>=10?5:1));
 const z=ctx.aureaZigZagV1051(up),t=z.find(p=>p.tipo==='topo'&&Math.abs(+p.preco-50.2)<.3);
 assert.ok(t);assert.equal(t.obv_rompimento,true);assert.match(t.obv_txt,/força/);
 const fraco=[40,42,44,46,48,50,47,44,42,44,46,48,51,52].map((c,i)=>mk(c,i>=10?0.1:1));
 const t2=ctx.aureaZigZagV1051(fraco).find(p=>p.tipo==='topo'&&Math.abs(+p.preco-50.2)<.3);
 assert.equal(t2.obv_rompimento,false);assert.match(t2.obv_txt,/fraco/);
});
