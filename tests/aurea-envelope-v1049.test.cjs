const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const vm=require('vm');
const src=fs.readFileSync(__dirname+'/../src/domains/core/07-conta-e-integracoes.js','utf8');
const pick=n=>{const i=src.indexOf('function '+n+'(');let d=0,j=src.indexOf('{',i);for(;j<src.length;j++){if(src[j]=='{')d++;else if(src[j]=='}'){d--;if(!d)break;}}return src.slice(i,j+1);};
const ctx={};vm.createContext(ctx);vm.runInContext(['aureaEnvelopeV1049'].map(pick).join('\n'),ctx);
function cena(seed,errado){
 let s=seed*9301;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};
 const bars=[];let c=40;for(let i=0;i<220;i++){const o=c;c=c*(1+(rnd()-.5)*.05);bars.push({date:'d'+i,o,c,h:Math.max(o,c)*(1+rnd()*.015),l:Math.min(o,c)*(1-rnd()*.015)});}
 const W=600,H=900,d=new Uint8ClampedArray(W*H*4).fill(242);for(let i=3;i<d.length;i+=4)d[i]=255;
 const px=(x,y)=>{const j=(y*W+x)*4;d[j]=d[j+1]=d[j+2]=20;};
 for(let x=10;x<400;x++)for(let y=20;y<40;y++)if((x+y)%3===0)px(x,y); // cabeçalho
 const vis=bars.slice(-90),hi=Math.max(...vis.map(b=>b.h)),lo=Math.min(...vis.map(b=>b.l)),Y=p=>Math.round(150+(hi-p)/(hi-lo)*600),st=470/89;
 vis.forEach((b,i)=>{const x=Math.round(10+i*st);for(let y=Y(b.h);y<=Y(b.l);y++)px(x,y);for(let y=Y(Math.max(b.o,b.c));y<=Y(Math.min(b.o,b.c));y++){px(x-1,y);px(x+1,y);}});
 if(errado)for(const b of bars){b.h*=1+Math.sin(b.h*7)*.03;b.l*=1-Math.cos(b.l*5)*.03;}
 return {d,W,H,bars,X:i=>(10+(i-(220-90))*st)/W};
}
test('v1049 casa o recorte do print com o histórico pelo contorno dos pavios',()=>{
 const c=cena(3,false),ev=ctx.aureaEnvelopeV1049({geometria_preco:{x0:0,y0:0,x1:1,y1:1}},c.d,c.W,c.H,c.bars);
 assert.ok(ev);assert.equal(ev.n-ev.extra,90);assert.ok(Math.abs(ev.x(150)-c.X(150))*c.W<=1.5);
});
test('v1049 recusa histórico que não corresponde ao desenho',()=>{
 const c=cena(3,true);assert.equal(ctx.aureaEnvelopeV1049({geometria_preco:null},c.d,c.W,c.H,c.bars),null);
});
