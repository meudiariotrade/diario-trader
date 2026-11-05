'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const vm=require('node:vm'),imagePack=(function(){const box={};vm.runInNewContext(fs.readFileSync(path.join(root,'icon-pack-v389.js'),'utf8'),{window:box});return box.DiarioIconPack;})();
const localImage=path=>{const u=imagePack.url(path);assert(u&&u.startsWith('data:image/png;base64,'),path);return Buffer.from(u.split(',')[1],'base64')};

(async()=>{
 const {PDFDocument}=require(path.join(root,'pdf-lib.min.js'));
 const doc=await PDFDocument.create(); const page=doc.addPage([595,842]);
 const names=['apple','microsoft','nvidia','google','amazon','tesla','meta','netflix','amd','intel','visa','uber','airbnb','paypal','spotify','mastercard','qualcomm','shopify'];
 let i=0;
 for(const name of names){
  const bytes=localImage('logos/us/'+name+'.png');
  const img=await doc.embedPng(bytes);
  assert(img.width>0&&img.height>0,name);
  const x=45+(i%4)*130,y=730-Math.floor(i/4)*115;
  page.drawRectangle({x,y,width:82,height:82,color:require(path.join(root,'pdf-lib.min.js')).rgb(1,1,1)});
  page.drawImage(img,{x:x+9,y:y+9,width:64,height:64}); i++;
 }
 const bytes=await doc.save();assert(bytes.length>5000);assert.equal(Buffer.from(bytes.subarray(0,5)).toString(),'%PDF-');
 if(process.env.SAVE_SAMPLE==='1')fs.writeFileSync(path.join(root,'AMOSTRA-LOGOTIPOS-v386.pdf'),bytes);
 console.log('OK: 18 PNGs reais incorporados em PDF A4 offline.');
})().catch(e=>{console.error(e);process.exitCode=1});
