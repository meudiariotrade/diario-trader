const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const vm=require('vm');
const src=fs.readFileSync(__dirname+'/../src/domains/core/07-conta-e-integracoes.js','utf8');
const pick=n=>{const i=src.indexOf('function '+n+'(');let d=0,j=src.indexOf('{',i);for(;j<src.length;j++){if(src[j]=='{')d++;else if(src[j]=='}'){d--;if(!d)break;}}return src.slice(i,j+1);};
const ctx={};vm.createContext(ctx);vm.runInContext(['aureaCalibrarEixoV1021','aureaPrecoVisualV1021','aureaEncaixarPivosV1044','aureaEscalaV1044','aureaPosicionarNiveisV1044'].map(pick).join('\n'),ctx);
test('v1044 encaixa pivôs no pavio e reposiciona níveis pela escala dos pivôs',()=>{
 const w=200,h=200,d=new Uint8ClampedArray(w*h*4).fill(245);
 const pinta=(x,y0,y1)=>{for(let y=y0;y<=y1;y++){const i=(y*w+x)*4;d[i]=d[i+1]=d[i+2]=20;d[i+3]=255;}};
 for(let i=3;i<d.length;i+=4)d[i]=255;
 pinta(50,40,90);pinta(150,60,160); // topo em y=40 (preço 100), fundo em y=160 (preço 70)
 const g={geometria_preco:null,pivos:[{tipo:'topo',estado:'potencial',x:.25,y:.27,preco:'~100',ancoragem_visual:'nao_conferida'},{tipo:'fundo',estado:'potencial',x:.75,y:.75,preco:'70',ancoragem_visual:'nao_conferida'}],niveis:[{tipo:'suporte',preco:80,y:.1}]};
 g.pivos=ctx.aureaEncaixarPivosV1044(g,d,w,h);
 assert.deepEqual(g.pivos.map(p=>[p.ancoragem_visual,Math.round(p.x*w),Math.round(p.y*h)]),[['pavio_visual',50,40],['pavio_visual',150,160]]);
 ctx.aureaPosicionarNiveisV1044(g);
 assert.ok(Math.abs(g.niveis[0].y*h-120)<1.5);
});
