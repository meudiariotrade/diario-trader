/* v310 — arte reutilizável, números desenhados pelo código, sem consumo de IA ao compartilhar. */
(function(root){
 'use strict';
 const base=root.TraderExportBrand;if(!base)return;
 const C=base.IMAGE,KEY='diario-share-theme-v309',options=[['auto','Automático'],['mercado','Mercado'],['natal','Natal'],['halloween','Halloween'],['carnaval','Carnaval'],['futebol','Futebol'],['pascoa','Páscoa'],['junina','Festa Junina'],['verao','Verão'],['reveillon','Réveillon'],['classico','Clássico']];
 const paths={mercado:'cards-art/mercados-brasil-eua.png',natal:'cards-art/natal-touro.png',halloween:'cards-art/halloween-touro.png'};
 const atlas={carnaval:[0,0],futebol:[1,0],pascoa:[2,0],junina:[0,1],verao:[1,1],reveillon:[2,1]};
 for(const id of Object.keys(atlas))paths[id]='cards-art/colecao-sazonal.png';
 const images=new Map(),jobs=new Map();let chosen='auto',failure='';
 try{const value=APP_STORAGE.getItem(KEY);if(options.some(([key])=>key===value))chosen=value}catch{}
 const finite=x=>typeof x==='number'&&Number.isFinite(x),number=(v,d=2)=>finite(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
 const percent=v=>finite(v)?(v>0?'+':'')+number(v)+'%':'—';
 // Computus gregoriano: feriados móveis calculados sem rede e sem mudar a data do usuário.
 function easter(year){
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),v=h+l-7*m+114;
  return Date.UTC(year,Math.floor(v/31)-1,v%31+1);
 }
 function automatic(date=new Date()){
  if(!Number.isFinite(date.getTime()))return 'mercado';
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(date),part=key=>Number(parts.find(p=>p.type===key)?.value),year=part('year'),month=part('month'),day=part('day'),delta=Math.round((Date.UTC(year,month-1,day)-easter(year))/86400000);
  if(month===12&&day>=26||month===1&&day<=6)return 'reveillon';
  if(month===12)return 'natal';
  if(month===10&&day>=15)return 'halloween';
  if(delta>=-51&&delta<=-46)return 'carnaval';
  if(delta>=-7&&delta<=0)return 'pascoa';
  if(month===6)return 'junina';
  if(month<=2||month===3&&day<=20)return 'verao';
  return 'mercado';
 }
 const theme=()=>chosen==='auto'?automatic():chosen;
 const themeName=id=>({mercado:'Mercado',natal:'Natal',halloween:'Halloween',carnaval:'Carnaval',futebol:'Futebol',pascoa:'Páscoa',junina:'Festa Junina',verao:'Verão',reveillon:'Réveillon',classico:'Clássico'})[id]||'Mercado';
 function setTheme(value){if(!options.some(([key])=>key===value))return false;chosen=value;try{APP_STORAGE.setItem(KEY,value)}catch{}return true}
 function load(id){
  const path=paths[id];if(!path)return Promise.resolve(null);if(images.has(path))return Promise.resolve(images.get(path));if(jobs.has(path))return jobs.get(path);
  const job=new Promise(resolve=>{
   const image=new Image();let done=false;const finish=ok=>{if(done)return;done=true;clearTimeout(timer);if(ok){images.set(path,image);failure=''}else failure='Arte indisponível. A imagem foi montada com fundo simples.';resolve(ok?image:null)};
   const timer=setTimeout(()=>finish(false),10000);image.onload=()=>finish(true);image.onerror=()=>finish(false);image.src=path;
  }).finally(()=>jobs.delete(path));jobs.set(path,job);return job;
 }
 function text(ctx,value,x,y,size=26,color=C.tx,weight=500,max=968,align='left'){
  ctx.font=weight+' '+size+'px system-ui,-apple-system,"Segoe UI",Arial,sans-serif';ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';let label=String(value??'');
  if(ctx.measureText(label).width>max){const chars=Array.from(label);while(chars.length&&ctx.measureText(chars.join('')+'…').width>max)chars.pop();label=chars.join('')+'…'}ctx.fillText(label,x,y);
 }
 function rect(ctx,x,y,w,h,color,r=18){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
 function background(ctx,id){
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,1350);const art=images.get(paths[id]);
  if(art){if(atlas[id]){const [col,row]=atlas[id],sw=art.naturalWidth/3,sh=art.naturalHeight/2;ctx.drawImage(art,col*sw+1,row*sh+1,sw-2,sh-2,0,0,1080,1350)}else if(id==='mercado')ctx.drawImage(art,0,110,1080,720);else ctx.drawImage(art,0,0,1080,1350)}
  // O contraste protege os números sem alterar a arte nem a cor de ganhos/perdas.
  const shade=ctx.createLinearGradient(0,0,800,0);shade.addColorStop(0,'rgba(11,17,25,.84)');shade.addColorStop(.68,'rgba(11,17,25,.48)');shade.addColorStop(1,'rgba(11,17,25,0)');ctx.fillStyle=shade;ctx.fillRect(0,0,1080,1350);
  rect(ctx,0,990,1080,360,'rgba(11,17,25,.96)',0);
 }
 function make(){const c=document.createElement('canvas');c.width=1080;c.height=1350;return {c,ctx:c.getContext('2d')}}
 function stamp(ctx,id){
  text(ctx,'DIÁRIO DE TRADER',56,66,24,C.ac,750);
  rect(ctx,830,34,194,44,'rgba(11,17,25,.8)',22);text(ctx,themeName(id),927,64,21,C.tx,650,174,'center');
 }
 function dateLabel(value){const s=String(value||'');return /^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4)+(s.length>=16?' · '+s.slice(11,16):''):s||'Data não informada'}
 function bottom(ctx,left){
  ctx.fillStyle=C.line;ctx.fillRect(56,1238,968,1);text(ctx,left,56,1280,20,C.mut,400);
  text(ctx,root.DIARIO_DEMO?'DEMONSTRAÇÃO / DADOS FICTÍCIOS':'DIÁRIO DE TRADER · Registro pessoal',56,1320,19,root.DIARIO_DEMO?C.am:C.ac,650);
 }
 function prices(ctx,left,right){
  rect(ctx,48,838,984,146,'rgba(18,28,40,.95)');text(ctx,left[0],74,884,23,C.mut);text(ctx,left[1],74,945,42,C.tx,700,440);
  ctx.fillStyle=C.line;ctx.fillRect(532,864,1,96);text(ctx,right[0],558,884,23,C.mut);text(ctx,right[1],558,945,42,C.tx,700,440);
 }
 function tradeCanvas(t,id=theme()){
  const data=shrDados(t),mode=typeof SHR!=='undefined'&&SHR.modo||'preco',value=shrPct(t,data,mode),color=finite(value)?value>=0?C.g:C.r:C.mut,{c,ctx}=make();background(ctx,id);stamp(ctx,id);
  text(ctx,t.ativo||t.tk||'Ativo não informado',56,221,58,C.tx,750,700);text(ctx,[data.tp,data.lado].filter(Boolean).join(' · '),56,269,27,C.mut,500,620);
  text(ctx,data.op?'EM ANDAMENTO · REFERÊNCIA':'OPERAÇÃO ENCERRADA',56,312,21,C.mut,650,620);
  text(ctx,percent(value),56,444,98,color,750,710);text(ctx,mode==='conta'?'Variação sobre a conta':'Variação do preço na operação',56,494,24,C.mut,500,550);
  if(typeof SHR!=='undefined'&&SHR.rs&&finite(data.c?.pl)){
   text(ctx,'Resultado financeiro',56,587,23,C.mut,500,500);text(ctx,typeof mT==='function'?mT(t,data.c.pl):number(data.c.pl),56,649,46,data.c.pl>=0?C.g:C.r,700,500);
  }
  const price=v=>{const n=typeof numN==='function'?numN(v):Number(v);return v!==null&&v!==undefined&&v!==''&&finite(n)?number(n,Math.abs(n)>=10000?0:2):'—'};
  prices(ctx,['Entrada informada',price(t.entry)],[data.op?'Referência disponível':'Saída informada',price(data.op?data.px:t.exit)]);
  text(ctx,'SETUP',56,1042,20,C.mut,650);text(ctx,t.setup||'Não informado',56,1090,29,C.tx,600);
  text(ctx,dateLabel(data.op?t.dt:t.dtx||t.dt),56,1158,23,C.mut,500);
  bottom(ctx,data.op?'Operação aberta: o resultado pode mudar.':'Resultado individual; não representa o desempenho da conta.');return c;
 }
 function periodCanvas(data,id=theme()){
  const {c,ctx}=make();background(ctx,id);stamp(ctx,id);text(ctx,data.tit||'Meu desempenho',56,219,48,C.tx,750,850);text(ctx,data.sub||'Período não informado',56,270,27,C.mut,500,720);
  text(ctx,percent(data.pct),56,444,98,finite(data.pct)?data.pct>=0?C.g:C.r:C.mut,750,710);text(ctx,'Sobre o capital de referência cadastrado',56,494,24,C.mut,500,550);
  // A opção de dinheiro do compartilhamento permanece explícita e desmarcável.
  if(typeof SHR!=='undefined'&&SHR.rs&&finite(data.M?.P)){text(ctx,'Resultado financeiro',56,587,23,C.mut,500,500);text(ctx,typeof money==='function'?money(data.M.P):number(data.M.P),56,649,46,data.M.P>=0?C.g:C.r,700,500)}
  prices(ctx,['Operações encerradas',finite(data.M?.n)?String(data.M.n):'—'],['Acerto',finite(data.M?.acerto)?number(data.M.acerto*100,1)+'%':'—']);
  text(ctx,'REGRAS SEGUIDAS',56,1042,20,C.mut,650);text(ctx,finite(data.seq)?data.seq+' dia(s) seguidos':'Não informado',56,1090,29,C.tx,600);
  if(data.best?.t?.ativo)text(ctx,'Melhor operação: '+data.best.t.ativo,56,1158,23,C.mut,500);
  bottom(ctx,'Resultado calculado com os registros e o capital informados.');return c;
 }
 function panoramaHeader(c){
  const ctx=c.getContext('2d'),w=c.width,h=(c.__folga&&typeof IMG_FOLGA!=='undefined'?IMG_FOLGA.top:0)+150,art=images.get(paths.mercado);
  ctx.save();ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);if(art)ctx.drawImage(art,0,0,w,h);
  const shade=ctx.createLinearGradient(0,0,w*.72,0);shade.addColorStop(0,'rgba(11,17,25,.94)');shade.addColorStop(.76,'rgba(11,17,25,.6)');shade.addColorStop(1,'rgba(11,17,25,0)');ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
  text(ctx,root.DIARIO_DEMO?'DIÁRIO DE TRADER / DADOS FICTÍCIOS':'DIÁRIO DE TRADER / BRASIL + EUA',48,40,20,C.ac,700,w-96);
  text(ctx,'Panorama do mercado',48,94,42,C.tx,750,w*.65);
  const dt=new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});text(ctx,dt+' · Brasília',48,134,23,C.mut,500,w*.64);
  text(ctx,'B3 · BRASIL',w-48,37,17,'#dce9f7',700,220,'right');text(ctx,'NYSE · NASDAQ',w-48,65,17,'#dce9f7',650,220,'right');
  const bias=typeof MDO!=='undefined'&&MDO.v?.mercados?.pre?.vies;
  if(bias){rect(ctx,48,157,225,39,'rgba(18,28,40,.92)',19);text(ctx,'Viés '+bias,160,184,22,bias==='positivo'?C.g:bias==='negativo'?C.r:C.am,650,200,'center')}
  ctx.fillStyle=C.line;ctx.fillRect(48,h-1,w-96,1);ctx.restore();
 }
 async function blob(c){return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('Falha ao criar a imagem.')),'image/png'))}
 if(typeof shrGera==='function')shrGera=async function(t){const id=theme();await load(id);return blob(tradeCanvas(t,id))};
 if(typeof shrGeraPer==='function')shrGeraPer=async function(d){const id=theme();await load(id);return blob(periodCanvas(d,id))};
 if(typeof imgDados==='function'){const original=imgDados;imgDados=async function(){await Promise.all([original.apply(this,arguments),load('mercado')])}}
 function mount(){
  const panel=document.querySelector('#shrov .sh');if(!panel||panel.querySelector('.season-picker'))return;
  const box=document.createElement('section');box.className='season-picker';box.setAttribute('aria-label','Tema da imagem');const label=document.createElement('b');label.textContent='Estilo do card';box.append(label);
  const buttons=document.createElement('div');buttons.className='season-buttons';
  for(const [id,name]of options){const button=document.createElement('button');button.type='button';button.textContent=name;button.setAttribute('aria-pressed',String(id===chosen));button.addEventListener('click',async()=>{setTheme(id);if(typeof SHR!=='undefined'&&SHR.id)await shrAbre(SHR.id)});buttons.append(button)}
  box.append(buttons);const note=document.createElement('small');note.textContent=(chosen==='auto'?'Agora: '+themeName(theme())+'. O estilo acompanha a época do ano em Brasília. Futebol é uma escolha manual.':'Tema escolhido: '+themeName(theme())+'.')+(failure?' '+failure:'');box.append(note);
  const image=panel.querySelector('img');if(image)image.before(box);else panel.append(box);
 }
 if(typeof shrAbre==='function'){const original=shrAbre;shrAbre=async function(id){await original.apply(this,arguments);if(typeof SHR!=='undefined'&&SHR.id===id)mount()}}
 root.TraderExportBrand=Object.freeze({...base,panoramaHeader,tradeCanvas,periodCanvas});
 root.TraderSeasonCards=Object.freeze({automatic,theme,setTheme,load,tradeCanvas,periodCanvas,mount,paths});
 const style=document.createElement('style');style.textContent='.season-picker{padding:14px;margin:12px 0;border:1px solid var(--bd);border-radius:12px;background:var(--card);color:var(--tx)}.season-picker>b{font-size:13px}.season-buttons{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:6px;margin:10px 0;max-height:148px;overflow-y:auto;overscroll-behavior:contain;padding:2px}.season-buttons button{min-height:40px;padding:8px 11px;border:1px solid var(--bd);border-radius:9px;background:var(--bg);color:var(--mut);font:600 12px system-ui;cursor:pointer}.season-buttons button[aria-pressed=true]{border-color:var(--ac);color:var(--ac);background:var(--surface-raised)}.season-picker small{display:block;font-size:11px;line-height:1.6;color:var(--mut)}';document.head.appendChild(style);
 load('mercado');
})(window);
