/* v862 — Figuras do próprio PDF nas aulas do Mentor.
 * O PDF já fica guardado neste aparelho (EstudosLocal 'livro-pdf') quando a aula é gerada.
 * Para cada etapa, escolhe a página do trecho que mais combina com o texto da etapa e que tem figura
 * (imagem ou gráfico vetorial), recorta a figura e guarda o JPEG no aparelho. Nada vai para servidor. */
;(function(w){
'use strict';
const mem=new Map(),pend=new Map();
const STOP=new Set('para como entre sobre quando onde mais menos pelo pela pelos pelas este esta isso essa esse deve pode podem sendo também muito muitas muitos qual quais seus suas nossa nosso ainda depois antes porque então tendo cada mesmo mesma outro outra outros outras sempre etapa preço preços'.split(' '));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]+/g,' ');
const termos=t=>[...new Set(norm(t).split(/\s+/).filter(x=>x.length>=5&&!STOP.has(x)))];
function origem(l){const m=/^PDF (.+) · páginas (\d+)\D+(\d+)/.exec(String(l?.reference||''));return m?{nome:m[1],a:+m[2],b:+m[3]}:null}
async function livro(l){
 const o=origem(l);if(!o||!w.EstudosLocal)return null;
 const todos=(await w.EstudosLocal.all()).filter(r=>r.tipo==='livro-pdf'&&r.meta?.nome===o.nome&&r.blob instanceof Blob);
 const r=todos.find(x=>x.meta?.paginas===o.a+'–'+o.b)||todos[0];return r?{...o,blob:r.blob}:null;
}
const mult=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
// Mede a página: quantas imagens e caminhos vetoriais, e onde está a maior imagem (espaço PDF).
function medir(ops,OPS){
 let ctm=[1,0,0,1,0,0],pilha=[],imgs=0,paths=0,maior=null;
 for(let i=0;i<ops.fnArray.length;i++){const f=ops.fnArray[i],a=ops.argsArray[i];
  if(f===OPS.save)pilha.push(ctm);else if(f===OPS.restore)ctm=pilha.pop()||[1,0,0,1,0,0];
  else if(f===OPS.transform)ctm=mult(ctm,a);
  else if(f===OPS.constructPath)paths++;
  else if(f===OPS.paintImageXObject||f===OPS.paintInlineImageXObject||f===OPS.paintJpegXObject||f===OPS.paintImageMaskXObject){
   imgs++;const pts=[[0,0],[1,0],[0,1],[1,1]].map(([x,y])=>[ctm[0]*x+ctm[2]*y+ctm[4],ctm[1]*x+ctm[3]*y+ctm[5]]);
   const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),bb=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)],area=(bb[2]-bb[0])*(bb[3]-bb[1]);
   if(!maior||area>maior.area)maior={bb,area}}}
 return {imgs,paths,maior};
}
async function calcular(l){
 const src=await livro(l);if(!src)return [null,null,null,null];
 const lib=await w.ntLib(),pdf=await lib.getDocument({data:new Uint8Array(await src.blob.arrayBuffer()),isEvalSupported:false,enableScripting:false}).promise;
 try{
  const fim=Math.min(src.b,pdf.numPages),pags=[];
  for(let p=src.a;p<=fim;p++){const pg=await pdf.getPage(p),tc=await pg.getTextContent();pags.push({p,t:' '+norm(tc.items.map(x=>x.str||'').join(' '))+' '});pg.cleanup?.()}
  const usados=new Set(),saida=[];
  for(let s=0;s<4;s++){
   const tt=termos([l.stageNames?.[s],l.stages?.[s],...(l.visuals?.[s]?.items||[])].join(' '));
   const cand=pags.map(x=>({p:x.p,sc:tt.reduce((n,k)=>n+(x.t.includes(' '+k)?1:0),0)})).filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc).slice(0,6);
   let melhor=null;
   for(const c of cand){const pg=await pdf.getPage(c.p),ops=await pg.getOperatorList(),m=medir(ops,lib.OPS);
    const fig=m.imgs>0||m.paths>=40;if(!fig){pg.cleanup?.();continue}
    const nota=c.sc*(1+(m.imgs?1.5:0)+Math.min(m.paths/200,1))*(usados.has(c.p)?.4:1);
    if(!melhor||nota>melhor.nota)melhor={...c,nota,m,pg};else pg.cleanup?.()}
   if(!melhor){saida.push(null);continue}
   usados.add(melhor.p);
   const pg=melhor.pg,base=pg.getViewport({scale:1}),scale=Math.min(2.2,1400/base.width),vp=pg.getViewport({scale});
   const cv=document.createElement('canvas');cv.width=Math.ceil(vp.width);cv.height=Math.ceil(vp.height);
   const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
   await pg.render({canvasContext:ctx,viewport:vp}).promise;
   let out=cv;const mm=melhor.m.maior;
   if(mm){const T=vp.transform,ap=(x,y)=>[T[0]*x+T[2]*y+T[4],T[1]*x+T[3]*y+T[5]],q1=ap(mm.bb[0],mm.bb[1]),q2=ap(mm.bb[2],mm.bb[3]),r=[q1[0],q1[1],q2[0],q2[1]],x0=Math.min(r[0],r[2]),y0=Math.min(r[1],r[3]),x1=Math.max(r[0],r[2]),y1=Math.max(r[1],r[3]);
    if((x1-x0)*(y1-y0)>cv.width*cv.height*.08){const pad=cv.width*.03,cx=Math.max(0,x0-pad),cy=Math.max(0,y0-pad),cw=Math.min(cv.width,x1+pad)-cx,ch=Math.min(cv.height,y1+pad)-cy;
     out=document.createElement('canvas');out.width=Math.round(cw);out.height=Math.round(ch);out.getContext('2d').drawImage(cv,cx,cy,cw,ch,0,0,cw,ch)}}
   const blob=await new Promise(ok=>out.toBlob(ok,'image/jpeg',.86));pg.cleanup?.();
   if(!blob){saida.push(null);continue}
   await w.EstudosLocal.put('mentor-figura',l.id+':'+s,blob,{pagina:melhor.p,aula:l.id});
   saida.push({blob,pagina:melhor.p});
  }
  return saida;
 }finally{await pdf.destroy()}
}
async function todas(l){
 if(mem.has(l.id))return mem.get(l.id);if(pend.has(l.id))return pend.get(l.id);
 const job=(async()=>{
  let lista=await Promise.all([0,1,2,3].map(s=>w.EstudosLocal?.get('mentor-figura',l.id+':'+s).catch(()=>null)));
  let res=lista.map(r=>r?.blob?{blob:r.blob,pagina:r.meta?.pagina}:null);
  const marca='tp-fig-v862:'+l.id;let feito=false;try{feito=localStorage.getItem(marca)==='1'}catch{}
  if(!res.some(Boolean)&&!feito){res=await calcular(l).catch(e=>{console.warn('MentorFiguras:',e?.message||e);return [null,null,null,null]});try{localStorage.setItem(marca,'1')}catch{}}
  const out=res.map(x=>x?{url:URL.createObjectURL(x.blob),pagina:x.pagina}:null);mem.set(l.id,out);return out;
 })().finally(()=>pend.delete(l.id));
 pend.set(l.id,job);return job;
}
function pronta(l){return mem.get(l?.id)||null}
w.MentorFiguras={todas,pronta,origem,medir};
})(window);
