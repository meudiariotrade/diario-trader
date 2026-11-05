/* Diário de Trader v378 — arte editorial ilustrativa para imagens de compartilhamento.
   Não altera dados, cotações, fontes, notícias ou recomendações. */
(function(){
 'use strict';
 if(typeof document==='undefined'||typeof Image==='undefined')return;
 const picture=new Image();let state='unloaded',job=null;
 const src='editorial-mercado-v378.jpg?v=378';
 function ensure(){
  if(state==='loaded'||state==='failed')return Promise.resolve(state==='loaded');
  if(job)return job;
  state='loading';job=new Promise(resolve=>{
   let closed=false;const done=ok=>{if(closed)return;closed=true;state=ok?'loaded':'failed';resolve(ok)};
   picture.onload=()=>done(!!picture.naturalWidth);picture.onerror=()=>done(false);
   picture.src=src;
   if(picture.complete&&picture.naturalWidth)done(true);
  });return job;
 }
 // Acrescentar o cabeçalho, em vez de pintar sobre os números do Panorama.
 // Dados, fontes e horários da captura original permanecem pixel a pixel intactos.
 function header(source,title,sub){
  if(!source||!source.getContext)return source;
  const height=190,w=source.width,h=source.height;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h+height;
  const ctx=canvas.getContext('2d');if(!ctx)return source;
  ctx.drawImage(source,0,height);
  ctx.save();ctx.fillStyle='#091725';ctx.fillRect(0,0,w,height);
  if(state==='loaded'&&picture.naturalWidth&&picture.naturalHeight){
   const targetRatio=w/height,sourceRatio=picture.naturalWidth/picture.naturalHeight;
   const sw=sourceRatio>targetRatio?picture.naturalHeight*targetRatio:picture.naturalWidth;
   const sh=sourceRatio>targetRatio?picture.naturalHeight:picture.naturalWidth/targetRatio;
   const sx=picture.naturalWidth-sw,sy=(picture.naturalHeight-sh)/2;
   ctx.drawImage(picture,sx,sy,sw,sh,0,0,w,height);
  }
  const grad=ctx.createLinearGradient(0,0,w*.87,0);
  grad.addColorStop(0,'rgba(7,18,31,.98)');grad.addColorStop(.55,'rgba(7,18,31,.83)');grad.addColorStop(1,'rgba(7,18,31,.17)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,height);
  ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillStyle='#8de7c4';ctx.font='700 18px system-ui';
  ctx.fillText('DIÁRIO DE TRADER  /  INTELIGÊNCIA DE MERCADO',46,40,w-82);
  ctx.fillStyle='#f6f9ff';ctx.font='700 '+Math.max(25,Math.min(40,w*.037))+'px system-ui';
  ctx.fillText(title,46,98,w*.78);
  ctx.fillStyle='#c1d0e1';ctx.font='20px system-ui';ctx.fillText(sub,46,137,w*.78);
  ctx.fillStyle='#7eb8a5';ctx.font='15px system-ui';ctx.fillText('ARTE EDITORIAL • IMAGEM ILUSTRATIVA',46,169,w*.8);
  ctx.restore();return canvas;
 }
 function wrap(name,title,sub){
  if(typeof window[name]!=='function')return;
  const old=window[name];window[name]=function(...args){
   const c=old.apply(this,args);return header(c,title,typeof sub==='function'?sub(args):sub);
  };
 }
 // Compartilhamentos carregam a arte apenas sob demanda, sem custo na abertura do app.
 if(typeof window.imgDados==='function'){
  const old=window.imgDados;window.imgDados=async function(...args){
   const [result]=await Promise.all([old.apply(this,args),ensure()]);return result;
  };
 }
 wrap('imgDesenha','Panorama do mercado','Brasil + EUA  ·  preços e sessões identificados');
 wrap('grDesenha','Giro do mercado','Resumo jornalístico  ·  números, contexto e fontes');
 wrap('jrImagem','Jornal do Pregão','Edição do dia  ·  informação verificada e contextualizada');
 window.TraderEditorialV376=Object.freeze({ensure,isReady:()=>state==='loaded'});
})();
