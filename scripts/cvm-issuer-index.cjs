'use strict';
// v772 — Catálogo compacto CNPJ ↔ razão social CVM, filtrado aos documentos ITR/DFP.
const fs=require('node:fs'),path=require('node:path');
const year=new Date().getUTCFullYear();
const dir=path.resolve(__dirname,'../dados-publicos');
const source='https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv';
function csvSplit(line){const out=[];let s='',quoted=false;
 for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){
  if(quoted&&line[i+1]==='"'){s+='"';i++}else quoted=!quoted;
 }else if(ch===';'&&!quoted){out.push(s);s=''}else s+=ch}
 out.push(s);return out;
}
const cnpj=x=>String(x||'').replace(/\D/g,'');
async function main(){
 const proof=JSON.parse(fs.readFileSync(path.join(dir,'cvm-dre-'+year+'.json'),'utf8'));
 if(proof?.ano!==year||!Array.isArray(proof.documentos)||proof.documentos.length<100)
  throw Error('Espelho CVM ITR/DFP indisponível');
 const allowed=new Set(proof.documentos.map(x=>cnpj(x.cnpj)).filter(x=>x.length===14));
 const r=await fetch(source,{headers:{Accept:'text/csv','User-Agent':'DiarioTrader-CVM/772 (public-research; weekly)'},signal:AbortSignal.timeout(25000)});
 if(!r.ok)throw Error('Cadastro CVM HTTP '+r.status);
 const bytes=new Uint8Array(await r.arrayBuffer());
 if(bytes.length>9_000_000)throw Error('Cadastro CVM acima do limite 9MB');
 const raw=new TextDecoder('windows-1252').decode(bytes).replace(/^\uFEFF/,'').replace(/\r/g,'');
 const lines=raw.split('\n'),header=csvSplit(lines.shift()||'');
 const ci=header.indexOf('CNPJ_CIA'),social=header.indexOf('DENOM_SOCIAL'),trading=header.indexOf('DENOM_COMERC');
 if(ci<0||social<0||trading<0)throw Error('Cadastro oficial CVM sem colunas obrigatórias');
 const map=new Map();
 for(const line of lines){
  if(!line)continue;
  const fields=csvSplit(line),id=cnpj(fields[ci]);
  if(!allowed.has(id))continue;
  const socialName=String(fields[social]||'').trim(),commercialName=String(fields[trading]||'').trim();
  if(!socialName)continue;
  const curr=map.get(id)||new Set();
  for(const name of [socialName,commercialName])if(name)curr.add(name);
  map.set(id,curr);
 }
 const rows=[...map].map(([id,names])=>({cnpj:id,nomes:[...names].sort()})).sort((a,b)=>a.cnpj.localeCompare(b.cnpj));
 if(rows.length<100)throw Error('Cobertura CAD/CVM insuficiente: '+rows.length);
 const result={versao:1,ano:year,gerado_em:new Date().toISOString(),
  proveniencia:'CVM Cadastro de Companhias Abertas + ITR/DFP com CNPJ oficial',
  fonte_cadastro:source,fonte_documentos:'dados-publicos/cvm-dre-'+year+'.json',
  identificacao:'CNPJ único; nome nunca suficiente quando há ambiguidade',
  quantidade:rows.length,emissores:rows};
 const out=path.join(dir,'cvm-emissores-'+year+'.json');
 fs.writeFileSync(out,JSON.stringify(result)+'\n');
 process.stdout.write('CVM emissores com prova: '+rows.length+' em '+out+'\n');
}
if(require.main===module)main().catch(e=>{console.error(String(e));process.exitCode=1});
module.exports={csvSplit,cnpj};
