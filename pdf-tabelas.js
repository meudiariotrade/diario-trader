/* Tabelas vetoriais paginadas: cabeçalho repetido e células longas divididas entre páginas. */
(function(root){
 'use strict';
 function draw(p,columns,rows,options={}){
  if(!columns.length)return;
  const size=Math.max(8.5,options.s||8.8),line=size*1.35,pad=5,C=p.C,left=p.M;
  const sum=columns.reduce((n,c)=>n+c.w,0),widths=columns.map(c=>c.w/sum*p.CW);
  function wrap(value,width,fontSize,font){
   const text=String(value??'–'),tokens=text.split(/(\s+)/).map(token=>{
    if(!token.trim()||p.wd(token,fontSize,font)<=width)return token;
    let result='',part='';for(const char of Array.from(token)){if(part&&p.wd(part+char,fontSize,font)>width){result+=part+' ';part=''}part+=char}return result+part;
   }).join('');
   return p.wrap(tokens,width,fontSize,font);
  }
  const headers=columns.map((c,i)=>wrap(String(c.l).toUpperCase(),widths[i]-2*pad,8,'b'));
  const headerLines=Math.min(3,Math.max(...headers.map(h=>h.length))),headerHeight=headerLines*line+2*pad;
  function header(){
   p.need(headerHeight+line+2*pad);p.rect(left,p.y,p.CW,headerHeight,{fill:C.dk});let x=left;
   columns.forEach((column,i)=>{headers[i].slice(0,3).forEach((text,j)=>p.t(text,x+pad,p.y+pad+j*line,{s:8,f:'b',c:C.wh,w:widths[i]-2*pad}));x+=widths[i]});p.y+=headerHeight;
  }
  header();
  rows.forEach((row,index)=>{
   const cells=columns.map((column,i)=>{
    const raw=row[i],cell=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{t:raw};
    const lines=wrap(cell.t,widths[i]-2*pad,cell.s||size,cell.f||'r').map(text=>({text,s:cell.s||size,f:cell.f||'r',c:cell.c||C.tx}));
    if(cell.sub)lines.push(...wrap(cell.sub,widths[i]-2*pad,size-1.2,'r').map(text=>({text,s:size-1.2,f:'r',c:C.mut})));
    return {...cell,lines};
   });
   const length=Math.max(1,...cells.map(c=>c.lines.length)),rowLine=Math.max(line,...cells.flatMap(c=>c.lines.map(l=>l.s*1.35)));let offset=0;
   while(offset<length){
    if(p.BOT-p.y<rowLine+2*pad){p.add();header()}
    const count=Math.max(1,Math.min(length-offset,Math.floor((p.BOT-p.y-2*pad)/rowLine))),height=count*rowLine+2*pad;
    if(index%2)p.rect(left,p.y,p.CW,height,{fill:C.cz});let x=left;
    cells.forEach((cell,i)=>{
     if(cell.fill)p.rect(x+1,p.y+1,widths[i]-2,height-2,{fill:cell.fill});
     cell.lines.slice(offset,offset+count).forEach((item,j)=>p.t(item.text,columns[i].al==='r'?x+widths[i]-pad:x+pad,p.y+pad+j*rowLine,{...item,w:widths[i]-2*pad,al:columns[i].al==='r'?'r':'l'}));
     x+=widths[i];
    });
    p.y+=height;p.ln(left,p.y,left+p.CW,p.y,{c:C.bd,w:.6});offset+=count;
   }
  });p.y+=8;
 }
 root.TraderPdfTable=Object.freeze({draw});
})(typeof window==='undefined'?globalThis:window);
