'use strict';
// Dados oficiais CVM: uma coleta semanal no GitHub Actions (não trafega ZIP via Supabase).
// Seleciona só as contas 3.01 / 3.11 do documento ITR/DFP mais recente com CNPJ e versão coincidentes.
const fs=require('node:fs'),path=require('node:path'),{inflateRawSync}=require('node:zlib');
const ANO=new Date().getUTCFullYear();
const DATA_DIR=path.resolve(__dirname,'../dados-publicos');
const MAX_ZIP_MEMBER=25_000_000, MAX_CSV=150_000_000;
const DATA_BASE='https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC';
const VALID_DATE=/^\d{4}-\d{2}-\d{2}$/;
const now=new Date().toISOString().slice(0,10);
const cnpj=x=>String(x||'').replace(/\D/g,'');
function parseLine(line){
 const out=[];let current='',quoted=false;
 for(let i=0;i<line.length;i++){
  const c=line[i];
  if(c==='"'){if(quoted&&line[i+1]==='"'){current+='"';i++}else quoted=!quoted}
  else if(c===';'&&!quoted){out.push(current);current=''}else current+=c;
 }
 out.push(current);return out;
}
function csvRecords(text,allowed=null){
 const lines=text.replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');
 const header=parseLine(lines.shift()||'');
 const ci=header.indexOf('CNPJ_CIA');
 if(ci<0)throw Error('CSV sem CNPJ_CIA');
 const rows=[];
 for(const line of lines){
  if(!line)continue;
  // Pré-filtro evita criar milhares de objetos para empresas não utilizadas.
  if(allowed&&!allowed.has(cnpj(line.slice(0,line.indexOf(';')))))continue;
  const cols=parseLine(line),row={};
  for(let i=0;i<header.length;i++)row[header[i]]=cols[i]||'';
  rows.push(row);
 }
 return rows;
}
function cvmNumber(value){
 const raw=String(value||'').trim();
 const parsed=raw.includes(',')?raw.replace(/\./g,'').replace(',','.'):raw;
 if(!/^-?\d+(?:\.\d+)?$/.test(parsed))return null;
 const v=Number(parsed);return Number.isFinite(v)?v:null;
}
async function range(url,header){
 const r=await fetch(url,{headers:{Range:header,'Accept-Encoding':'identity', 'User-Agent':'DiarioTrader-CVM-2026 (public-financial-data; weekly)'},
  signal:AbortSignal.timeout(40_000)});
 if(r.status!==206)throw Error('CVM Range HTTP '+r.status+' '+url);
 const b=Buffer.from(await r.arrayBuffer());
 if(b.length>MAX_ZIP_MEMBER)throw Error('CVM Range excedeu cota');
 return b;
}
async function member(kind,part,year=ANO){
 const stem=kind+'_cia_aberta_',archive=stem+year+'.zip',filename=stem+(part?part+'_':'')+year+'.csv';
 const url=DATA_BASE+'/'+kind.toUpperCase()+'/DADOS/'+archive;
 const tail=await range(url,'bytes=-65536');
 let p=-1;
 for(let i=tail.length-22;i>=0;i--)if(tail.readUInt32LE(i)===0x06054b50){p=i;break}
 if(p<0)throw Error('CVM ZIP sem diretorio central');
 const size=tail.readUInt32LE(p+12),offset=tail.readUInt32LE(p+16);
 if(size<=0||size>200_000)throw Error('CVM ZIP diretorio fora do limite');
 const dir=await range(url,'bytes='+offset+'-'+(offset+size-1));
 let match=null;
 for(let i=0;i+46<=dir.length;){
  if(dir.readUInt32LE(i)!==0x02014b50)break;
  const nl=dir.readUInt16LE(i+28),el=dir.readUInt16LE(i+30),cl=dir.readUInt16LE(i+32);
  const name=dir.subarray(i+46,i+46+nl).toString('utf8').split('/').pop().toLowerCase();
  if(name===filename.toLowerCase()){
   match={local:dir.readUInt32LE(i+42),compressed:dir.readUInt32LE(i+20),method:dir.readUInt16LE(i+10)};
   break;
  }
  i+=46+nl+el+cl;
 }
 if(!match||match.compressed<=0||match.compressed>MAX_ZIP_MEMBER)throw Error('CVM CSV não encontrado/maior que limite: '+filename);
 const hdr=await range(url,'bytes='+match.local+'-'+(match.local+511));
 if(hdr.readUInt32LE(0)!==0x04034b50)throw Error('CVM ZIP header inválido');
 const st=match.local+30+hdr.readUInt16LE(26)+hdr.readUInt16LE(28);
 const payload=await range(url,'bytes='+st+'-'+(st+match.compressed-1));
 const raw=match.method===8?inflateRawSync(payload,{maxOutputLength:MAX_CSV}):match.method===0?payload:null;
 if(!raw)throw Error('CVM método de compressão desconhecido');
 if(raw.byteLength>MAX_CSV)throw Error('CVM CSV grande demais');
 // CVM divulga arquivos com code page Windows-1252.
 return {name:filename,url,body:new TextDecoder('windows-1252').decode(raw)};
}
function candidate(x,kind,year=ANO){
 const C=cnpj(x.CNPJ_CIA),date=x.DT_REFER,received=String(x.DT_RECEB||x.DT_ENTREGA||'').slice(0,10);
 const id=String(x.ID_DOC||x.NUM_SEQ_DOC||'').trim(),versao=String(x.VERSAO||'').trim();
 if(C.length!==14||!VALID_DATE.test(date)||date>now||!VALID_DATE.test(received)||received<date||received>now
  ||!/^\d{1,18}$/.test(id)||!/^\d{1,6}$/.test(versao))return null;
 return {cnpj:C,competencia:date,formulario:kind.toUpperCase(),documento_id:id,
  documento_url:DATA_BASE+'/'+kind.toUpperCase()+'/DADOS/'+kind+'_cia_aberta_'+year+'.zip',
  publicado_em:received,versao,linhagem:{}};
}
function better(a,b){
 if(!a)return true;
 const old=[a.competencia,a.publicado_em,Number(a.versao),Number(a.documento_id)];
 const newer=[b.competencia,b.publicado_em,Number(b.versao),Number(b.documento_id)];
 for(let i=0;i<old.length;i++){if(newer[i]>old[i])return true;if(newer[i]<old[i])return false}
 return false;
}
function applyDre(documents,kind,part,rows,year=ANO){
 let updated=0;
 for(const row of rows){
  const C=cnpj(row.CNPJ_CIA),d=documents.get(C);
  if(!d||d.formulario!==kind.toUpperCase()||!d.versao||row.VERSAO!==d.versao
   ||row.DT_REFER!==d.competencia||row.DT_FIM_EXERC!==d.competencia)continue;
  const ordem=String(row.ORDEM_EXERC||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  if(ordem!=='ULTIMO'||!['REAL','BRL'].includes(String(row.MOEDA||'').toUpperCase()))continue;
  const key=row.CD_CONTA==='3.01'?'receita_liquida_dre':row.CD_CONTA==='3.11'?'lucro_prejuizo_dre':null;
  if(!key||d.linhagem[key])continue;
  if(part==='DRE_ind'&&d.grupo_dre==='consolidado')continue;
  const n=cvmNumber(row.VL_CONTA);
  if(n===null)continue;
  const grupo=part==='DRE_con'?'consolidado':'individual';
  if(d.grupo_dre&&d.grupo_dre!==grupo)continue;
  d.grupo_dre=grupo;
  d.linhagem[key]={tipo:'conta_contabil_oficial',fonte:'CVM',documento_id:d.documento_id,
   competencia:d.competencia,publicado_em:d.publicado_em,arquivo:kind+'_cia_aberta_'+part+'_'+year+'.csv',
   demonstracao:'DRE '+grupo,codigo_conta:row.CD_CONTA,valor_reportado:n,
   valor_original_csv:String(row.VL_CONTA),escala_moeda:row.ESCALA_MOEDA||null,
   periodo_inicio:row.DT_INI_EXERC||null,periodo_fim:row.DT_FIM_EXERC,valida_indicador_ttm:false};
  updated++;
 }
 return updated;
}
async function run(){
 const docs=new Map(),sources=[],prepared=[];
 for(const kind of ['itr','dfp']){
  const archive=await member(kind,'');
  const records=csvRecords(archive.body);
  for(const x of records){
   const next=candidate(x,kind);
   if(next&&better(docs.get(next.cnpj),next))docs.set(next.cnpj,next);
  }
  sources.push({arquivo:archive.name,url:archive.url,linhas:records.length});
  prepared.push(kind);
 }
 if(docs.size<100)throw Error('Insuficiência de documentos oficiais CVM; não substituir snapshot');
 const all=new Set(docs.keys());
 let proofs=0;
 for(const kind of prepared){
  const relevant=new Set([...docs].filter(([,d])=>d.formulario===kind.toUpperCase()).map(([C])=>C));
  if(!relevant.size)continue;
  for(const part of ['DRE_con','DRE_ind']){
   const file=await member(kind,part);
   const rows=csvRecords(file.body,relevant);
   const n=applyDre(docs,kind,part,rows);
   proofs+=n;sources.push({arquivo:file.name,url:file.url,linhas_filtradas:rows.length,evidencias:n});
  }
 }
 const entries=[...docs.values()].map(({grupo_dre,...rest})=>rest).sort((a,b)=>a.cnpj.localeCompare(b.cnpj));
 const evidenced=entries.filter(x=>Object.keys(x.linhagem).length);
 if(evidenced.length<50)throw Error('Amostra insuficiente de contas DRE; manter versão anterior: '+evidenced.length);
 const result={versao:1,ano:ANO,gerado_em:new Date().toISOString(),proveniencia:'CVM · ITR/DFP/DRE',
  limites:{indicador_ttm_homologado:false,associacao_ticker:'CNPJ exclusivo confirmado no cadastro CVM'},fontes:sources,
  resumo:{documentos:entries.length,empresas_com_dre:evidenced.length,contas:proofs},documentos:entries};
 fs.mkdirSync(DATA_DIR,{recursive:true});
 const dest=path.join(DATA_DIR,'cvm-dre-'+ANO+'.json');fs.writeFileSync(dest,JSON.stringify(result)+'\n');
 console.log(JSON.stringify({saida:dest,bytes:fs.statSync(dest).size,...result.resumo,fontes:sources.length}));
 return result;
}
if(require.main===module)run().catch(err=>{console.error(err);process.exitCode=1});
module.exports={parseLine,csvRecords,cvmNumber,candidate,better,applyDre};
