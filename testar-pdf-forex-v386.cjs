'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const vm=require('node:vm'),imagePack=(function(){const box={};vm.runInNewContext(fs.readFileSync(path.join(root,'icon-pack-v389.js'),'utf8'),{window:box});return box.DiarioIconPack;})();
const localImage=path=>{const u=imagePack.url(path);assert(u&&u.startsWith('data:image/png;base64,'),path);return Buffer.from(u.split(',')[1],'base64')};

const map=JSON.parse(fs.readFileSync(path.join(root,'currency-symbols-v385.json'),'utf8'));
const pairs=['USDCAD','AUDCAD','AUDUSD','EURUSD','GBPJPY','USDCHF','USDBRL','NZDUSD','USDMXN','EURGBP','USDJPY','EURCHF'];
(async()=>{
 const {PDFDocument,StandardFonts,rgb}=require(path.join(root,'pdf-lib.min.js'));
 const doc=await PDFDocument.create();const page=doc.addPage([595,842]);
 const font=await doc.embedFont(StandardFonts.HelveticaBold),small=await doc.embedFont(StandardFonts.Helvetica);
 page.drawRectangle({x:0,y:0,width:595,height:842,color:rgb(.04,.075,.13)});
 page.drawText('DIARIO DE TRADER  |  IDENTIDADE FOREX',{x:42,y:786,size:18,font,color:rgb(.91,.97,1)});
 page.drawText('Bandeiras reais, empacotadas offline. Exemplo visual sem cotacoes.',{x:42,y:760,size:10,font:small,color:rgb(.57,.73,.81)});
 let n=0;
 for(const pair of pairs){
  const col=n%2,row=Math.floor(n/2),x=42+col*259,y=671-row*106;
  page.drawRectangle({x,y,width:243,height:88,color:rgb(.095,.165,.24)});
  for(let j=0;j<2;j++){
   const currency=pair.slice(j*3,j*3+3),country=map[currency];assert(country,currency);
   const file='logos/fx/'+country.toLowerCase()+'.png';
   const img=await doc.embedPng(localImage(file));assert(img.width>=64&&img.height>=64);
   page.drawImage(img,{x:x+18+j*34,y:y+19,width:49,height:49});
  }
  page.drawText(pair,{x:x+125,y:y+45,size:14,font,color:rgb(.95,.98,1)});
  page.drawText(pair.slice(0,3)+' / '+pair.slice(3),{x:x+126,y:y+23,size:9,font:small,color:rgb(.65,.79,.86)});
  n++;
 }
 const bytes=await doc.save();assert(Buffer.from(bytes.subarray(0,5)).toString()==='%PDF-');assert(bytes.length>8000);
 if(process.env.SAVE_SAMPLE==='1')fs.writeFileSync(path.join(root,'AMOSTRA-PARES-FOREX-v386.pdf'),bytes);
 console.log('OK: 12 pares de moedas com ambas as bandeiras reais incorporadas ao PDF.');
})().catch(e=>{console.error(e);process.exitCode=1});
