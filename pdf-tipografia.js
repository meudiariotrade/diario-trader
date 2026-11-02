/* Fontes locais e incorporadas no PDF; carregadas somente ao exportar. */
(function(root){
  'use strict';
  let kit=null,bytes=null;
  function library(){
    if(root.fontkit)return Promise.resolve(root.fontkit);
    if(!kit)kit=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='fontkit.umd.min.js';
      script.onload=()=>root.fontkit?resolve(root.fontkit):reject(Error('Fontkit não iniciou'));
      script.onerror=()=>reject(Error('Fontkit indisponível'));document.head.append(script);
    }).catch(error=>{kit=null;throw error});
    return kit;
  }
  root.DiarioFontes=async function(doc){
    doc.registerFontkit(await library());
    const names={r:'sans',b:'sans-bold',i:'sans-italic',serif:'serif-bold',serifItalic:'serif-italic'};
    if(!bytes)bytes=Promise.all(Object.entries(names).map(async([key,name])=>{
      const response=await fetch(`pdf-${name}.ttf`,{signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw Error('Fonte indisponível: '+name);
      return [key,new Uint8Array(await response.arrayBuffer())];
    })).catch(error=>{bytes=null;throw error});
    const fonts={};for(const [key,data] of await bytes)fonts[key]=await doc.embedFont(data,{subset:true});
    return fonts;
  };
})(typeof window==='undefined'?globalThis:window);
