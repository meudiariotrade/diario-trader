'use strict';
// v847: histórico anual (DFP) de 10 exercícios por companhia aberta, direto dos CSV públicos da CVM.
// Roda no GitHub Actions; o app lê pela Cloudflare. Nenhum dado privado, nenhum acesso ao Supabase.
const fs=require('node:fs'),path=require('node:path'),{inflateRawSync}=require('node:zlib');
const BASE='https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC';
const OUT=path.resolve(__dirname,'../dados-publicos/cvm-historico.json');
const MAX_MEMBER=60_000_000,MAX_CSV=400_000_000;
const cnpj=x=>String(x||'').replace(/\D/g,'');
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();

function parseLine(line){const out=[];let cur='',q=false;
 for(let i=0;i<line.length;i++){const c=line[i];
  if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++}else q=!q}
  else if(c===';'&&!q){out.push(cur);cur=''}else cur+=c}
 out.push(cur);return out}
function* linhas(text){
 const ls=text.replace(/^﻿/,'').replace(/\r/g,'').split('\n'),h=parseLine(ls.shift()||'');
 for(const l of ls){if(!l)continue;const c=parseLine(l),r={};for(let i=0;i<h.length;i++)r[h[i]]=c[i]||'';yield r}
}
function numero(v){const raw=String(v||'').trim(),p=raw.includes(',')?raw.replace(/\./g,'').replace(',','.'):raw;
 if(!/^-?\d+(?:\.\d+)?$/.test(p))return null;const n=Number(p);return Number.isFinite(n)?n:null}
const escala=r=>String(r.ESCALA_MOEDA||'').toUpperCase()==='MIL'?1000:1;
const ultimo=r=>norm(r.ORDEM_EXERC).toUpperCase()==='ULTIMO';

async function range(url,header){
 const r=await fetch(url,{headers:{Range:header,'Accept-Encoding':'identity','User-Agent':'DiarioTrader-CVM-historico (public-financial-data; weekly)'},signal:AbortSignal.timeout(90_000)});
 if(r.status!==206)throw Error('CVM Range HTTP '+r.status+' '+url);
 return Buffer.from(await r.arrayBuffer());
}
/* Lê um CSV de dentro do ZIP da CVM sem baixar o ZIP inteiro (diretório central + membro). */
async function membro(url,arquivo){
 const tail=await range(url,'bytes=-65536');let p=-1;
 for(let i=tail.length-22;i>=0;i--)if(tail.readUInt32LE(i)===0x06054b50){p=i;break}
 if(p<0)throw Error('ZIP sem diretório central '+url);
 const size=tail.readUInt32LE(p+12),off=tail.readUInt32LE(p+16),dir=await range(url,'bytes='+off+'-'+(off+size-1));
 let m=null;
 for(let i=0;i+46<=dir.length;){
  if(dir.readUInt32LE(i)!==0x02014b50)break;
  const nl=dir.readUInt16LE(i+28),el=dir.readUInt16LE(i+30),cl=dir.readUInt16LE(i+32);
  const nome=dir.subarray(i+46,i+46+nl).toString('utf8').split('/').pop().toLowerCase();
  if(nome===arquivo.toLowerCase()){m={local:dir.readUInt32LE(i+42),comp:dir.readUInt32LE(i+20),met:dir.readUInt16LE(i+10)};break}
  i+=46+nl+el+cl;
 }
 if(!m||m.comp<=0||m.comp>MAX_MEMBER)throw Error('CSV ausente/grande: '+arquivo);
 const h=await range(url,'bytes='+m.local+'-'+(m.local+511));
 const st=m.local+30+h.readUInt16LE(26)+h.readUInt16LE(28);
 const pay=await range(url,'bytes='+st+'-'+(st+m.comp-1));
 const raw=m.met===8?inflateRawSync(pay,{maxOutputLength:MAX_CSV}):m.met===0?pay:null;
 if(!raw)throw Error('Compressão desconhecida');
 return new TextDecoder('windows-1252').decode(raw);
}

/* Mantém só a versão mais recente do documento de cada companhia no exercício. */
function versoes(text){const v=new Map();
 for(const r of linhas(text)){const c=cnpj(r.CNPJ_CIA),n=Number(r.VERSAO)||0;if(c.length===14&&n>(v.get(c)||0))v.set(c,n)}
 return v}
function conta(emp,ano){emp.anos[ano]=emp.anos[ano]||{};return emp.anos[ano]}

/* Contas usadas (CVM, DFP consolidado; individual se a companhia não tem consolidado):
   receita 3.01 · lucro 3.11 · ativo 1 · caixa 1.01.01 + 1.01.02 · PL (grupo 2.xx "Patrimônio Líquido")
   · dívida bruta = empréstimos (2.01.04 + 2.02.01) · dividendos/JCP pagos (6.03.* no DFC) · ações (composição do capital). */
function aplicaDRE(text,emps,ano,grupo){const v=versoes(text);
 for(const r of linhas(text)){const c=cnpj(r.CNPJ_CIA);if(!ultimo(r)||Number(r.VERSAO)!==v.get(c)||r.DT_FIM_EXERC.slice(0,4)!==String(ano))continue;
  const e=emps.get(c);if(!e||(grupo==='ind'&&e.grupo[ano]==='con'))continue;const a=conta(e,ano),n=numero(r.VL_CONTA);if(n==null)continue;
  const ds=norm(r.DS_CONTA);
  /* Bancos e seguradoras usam outra numeração na DRE: o lucro vem pela descrição da conta de nível 2. */
  const k=r.CD_CONTA==='3.01'?'rec':r.CD_CONTA==='3.11'?'luc':/^3\.\d{2}$/.test(r.CD_CONTA)&&/^lucro.{0,25}(liquido|prejuizo).{0,40}periodo/.test(ds)?'luc2':null;if(!k)continue;
  a[k]=n*escala(r);e.grupo[ano]=grupo;}
 for(const e of emps.values()){const a=e.anos[ano];if(a&&a.luc==null&&a.luc2!=null)a.luc=a.luc2;if(a)delete a.luc2}
}
function aplicaBP(text,emps,ano,grupo,lado){const v=versoes(text);
 for(const r of linhas(text)){const c=cnpj(r.CNPJ_CIA);if(!ultimo(r)||Number(r.VERSAO)!==v.get(c)||r.DT_REFER.slice(0,4)!==String(ano))continue;
  const e=emps.get(c);if(!e||e.grupo[ano]!==grupo)continue;const a=conta(e,ano),n=numero(r.VL_CONTA);if(n==null)continue;
  const x=n*escala(r),cd=r.CD_CONTA,ds=norm(r.DS_CONTA);
  if(lado==='A'){if(cd==='1')a.at=x;else if(cd==='1.01.01'||cd==='1.01.02')a.cx=(a.cx||0)+x;}
  else{if(/^2\.\d{2}$/.test(cd)&&/^patrimonio liquido/.test(ds))a.pl=x;
   else if((cd==='2.01.04'||cd==='2.02.01')&&/emprestimo/.test(ds))a.div=(a.div||0)+x;}
 }
}
function aplicaDFC(text,emps,ano,grupo){const v=versoes(text),achados=new Map();
 for(const r of linhas(text)){const c=cnpj(r.CNPJ_CIA);if(!ultimo(r)||Number(r.VERSAO)!==v.get(c)||r.DT_FIM_EXERC.slice(0,4)!==String(ano))continue;
  const e=emps.get(c);if(!e||e.grupo[ano]!==grupo)continue;
  if(!/^6\.03\./.test(r.CD_CONTA)||!/dividend|juros sobre (o )?capital|jcp/.test(norm(r.DS_CONTA)))continue;
  const n=numero(r.VL_CONTA);if(n==null)continue;
  (achados.get(c)||achados.set(c,[]).get(c)).push({cd:r.CD_CONTA,x:Math.abs(n*escala(r))});}
 for(const [c,ls] of achados){const folhas=ls.filter(a=>!ls.some(b=>b!==a&&b.cd.startsWith(a.cd+'.')));
  conta(emps.get(c),ano).dvd=folhas.reduce((s,a)=>s+a.x,0)}
}
function aplicaCapital(text,emps,ano){const v=versoes(text);
 for(const r of linhas(text)){const c=cnpj(r.CNPJ_CIA),e=emps.get(c);if(!e||Number(r.VERSAO)!==v.get(c))continue;
  const tot=numero(r.QT_ACAO_TOTAL_CAP_INTEGR),tes=numero(r.QT_ACAO_TOTAL_TESOURO)||0;
  if(tot>0)conta(e,ano).acoes=tot-tes;}
 /* Parte das companhias informa a composição do capital em milhares: corrige pelo valor patrimonial por ação. */
 for(const e of emps.values()){const a=e.anos[ano];if(a?.acoes>0&&a.pl>0&&a.pl/a.acoes>1000)a.acoes*=1000}
}
/* FCA: código de negociação → CNPJ (ex.: PETR4 → 33000167000101). */
function aplicaTickers(text,tickers){
 for(const r of linhas(text)){const c=cnpj(r.CNPJ_Companhia),t=String(r.Codigo_Negociacao||'').trim().toUpperCase();
  if(c.length===14&&/^[A-Z]{4}\d{1,2}$/.test(t))tickers[t]=c;}
}

async function main(){
 const agora=new Date(),fim=agora.getUTCFullYear()-1,inicio=fim-9,emps=new Map(),tickers={},falhas=[];
 const cad=await (await fetch('https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv',{signal:AbortSignal.timeout(60_000)})).arrayBuffer();
 for(const r of linhas(new TextDecoder('windows-1252').decode(cad))){const c=cnpj(r.CNPJ_CIA);
  if(c.length===14&&/ATIVO/i.test(r.SIT||''))emps.set(c,{nome:String(r.DENOM_SOCIAL||'').trim().slice(0,120),setor:String(r.SETOR_ATIV||'').trim().slice(0,80),anos:{},grupo:{}})}
 for(const a of [fim+1,fim,fim-1]){try{aplicaTickers(await membro(BASE+'/FCA/DADOS/fca_cia_aberta_'+a+'.zip','fca_cia_aberta_valor_mobiliario_'+a+'.csv'),tickers)}catch(e){falhas.push('FCA '+a+': '+e.message)}}
 for(let ano=inicio;ano<=fim;ano++){
  const url=BASE+'/DFP/DADOS/dfp_cia_aberta_'+ano+'.zip',arq=p=>'dfp_cia_aberta_'+p+'_'+ano+'.csv';
  for(const [g,fn] of [['con','DRE_con'],['ind','DRE_ind']]){try{aplicaDRE(await membro(url,arq(fn)),emps,ano,g)}catch(e){falhas.push(ano+' '+fn+': '+e.message)}}
  for(const [g,s] of [['con','_con'],['ind','_ind']]){
   for(const [lado,p] of [['A','BPA'],['P','BPP']]){try{aplicaBP(await membro(url,arq(p+s)),emps,ano,g,lado)}catch(e){falhas.push(ano+' '+p+s+': '+e.message)}}
   for(const p of ['DFC_MI','DFC_MD']){try{aplicaDFC(await membro(url,arq(p+s)),emps,ano,g)}catch(e){falhas.push(ano+' '+p+s+': '+e.message)}}
  }
  try{aplicaCapital(await membro(url,arq('composicao_capital')),emps,ano)}catch(e){if(ano>=2020)falhas.push(ano+' capital: '+e.message)}
  console.log('DFP',ano,'ok');
 }
 const empresas={};
 for(const [c,e] of emps){const anos={};
  for(const [a,v] of Object.entries(e.anos))if(v.rec!=null||v.luc!=null||v.pl!=null)anos[a]=Object.fromEntries(Object.entries(v).map(([k,x])=>[k,Math.round(x)]));
  if(Object.keys(anos).length>=2)empresas[c]={n:e.nome,s:e.setor,a:anos}}
 const usados=Object.fromEntries(Object.entries(tickers).filter(([,c])=>empresas[c]));
 if(Object.keys(empresas).length<150||Object.keys(usados).length<150)throw Error('Histórico incompleto: '+Object.keys(empresas).length+' empresas, '+Object.keys(usados).length+' tickers. '+falhas.slice(0,5).join(' | '));
 const out={versao:1,gerado_em:agora.toISOString(),exercicios:[inicio,fim],fonte:'CVM · DFP (DRE, BPA, BPP, DFC, composição do capital) + FCA (códigos de negociação) + cadastro',
  unidade:'reais (escala MIL convertida)',campos:{rec:'receita 3.01',luc:'lucro 3.11',at:'ativo total',cx:'caixa + aplicações (1.01.01/1.01.02)',pl:'patrimônio líquido',div:'empréstimos e financiamentos (2.01.04 + 2.02.01)',dvd:'dividendos e JCP pagos (DFC 6.03)',acoes:'ações em circulação (total − tesouraria)'},
  advertencias:falhas.slice(0,40),tickers:usados,empresas};
 fs.writeFileSync(OUT,JSON.stringify(out));
 console.log('cvm-historico:',Object.keys(empresas).length,'empresas,',Object.keys(usados).length,'tickers,',(fs.statSync(OUT).size/1e6).toFixed(2),'MB');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exit(1)});
module.exports={parseLine,linhas,numero,aplicaDRE,aplicaBP,aplicaDFC,aplicaCapital,aplicaTickers,versoes};
