#!/usr/bin/env node
/** v805: prepara manifesto local de materiais ORIGINAIS, sem enviar PDFs, JWT ou chaves. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve('docs/biblioteca-ia');
const allowed=new Set(['.md','.txt']);
function chunks(text){const parts=String(text).replace(/\r/g,'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);let out=[],buffer='';
 for(const p of parts){for(const part of (p.match(/[\s\S]{1,1050}/g)||[])){if(buffer&&buffer.length+part.length>1150){out.push(buffer);buffer=buffer.slice(-150)}buffer+=(buffer?' ':'')+part}}
 if(buffer)out.push(buffer);return out.slice(0,150).filter(x=>x.length>=50)}
const names=(await fs.readdir(root)).filter(n=>allowed.has(path.extname(n).toLowerCase()));
const manifest=[];for(const name of names){const content=await fs.readFile(path.join(root,name),'utf8');const blocks=chunks(content);
 manifest.push({file:name,title:name.replace(/\.(md|txt)$/i,'').replaceAll('-',' '),chunks:blocks.length,sha256:crypto.createHash('sha256').update(content).digest('hex')})}
await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify({schema:'v805',created_at:new Date().toISOString(),materials:manifest},null,2)+'\n');
console.log('Manifesto local:',manifest.length,'obras. Sem upload, sem Supabase, sem PDF de terceiro.');
