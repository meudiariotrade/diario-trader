const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const vm=require('vm');
const src=fs.readFileSync(__dirname+'/../src/domains/core/07-conta-e-integracoes.js','utf8');
const pick=n=>{const i=src.indexOf('function '+n+'(');let d=0,j=src.indexOf('{',i);for(;j<src.length;j++){if(src[j]=='{')d++;else if(src[j]=='}'){d--;if(!d)break;}}return src.slice(i,j+1);};
test('v1050 agrupa suportes e resistências a menos de 1 ATR',()=>{
 const ctx={};vm.createContext(ctx);vm.runInContext(['aureaObvV1051','aureaZigZagV1051','aureaDossieCalcV1048'].map(pick).join('\n'),ctx);
 const rows=[];let p=40;const t0=Date.UTC(2026,0,1)/1000;
 for(let i=0;i<260;i++){p=45+6*Math.sin(i/9)+Math.sin(i*1.7)*.3;rows.push([t0+i*86400,p,p+.7,p-.7,p,1]);}
 const d=ctx.aureaDossieCalcV1048('PETR4',rows);
 for(const l of [d.resistencias,d.suportes])for(let i=1;i<l.length;i++)assert.ok(Math.abs(l[i]-l[i-1])>=d.atr14-1e-9);
});
test('v1050 fase grafico do debate aceita revisão e confere números',async()=>{
 const src2=fs.readFileSync(__dirname+'/../cloudflare/diario-screeners/aurea-debate-v1013.mjs','utf8');
 assert.match(src2,/'opcoes','grafico'\]\.includes\(fase\)/);
 assert.match(src2,/Livermore · Técnico com histórico real/);
});
test('v1050 leitura visual sem números vai como referência e revisão substitui veredito',()=>{
 assert.match(src,/LEITURA VISUAL ANTERIOR, sem números/);
 assert.match(src,/resposta\.revisao_v1050=rv\.resultado/);
});
