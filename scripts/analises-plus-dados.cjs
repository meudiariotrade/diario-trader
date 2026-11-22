// v874 — Dados públicos do Análises+: crescimento do lucro (CVM/DFP) e retornos por ticker (Yahoo, diário).
// Gera dados-publicos/analises-plus.json. Sem Supabase. O app agrega os setores no aparelho.
const fs=require('node:fs');
const hist=JSON.parse(fs.readFileSync('dados-publicos/cvm-historico.json','utf8'));
const out={versao:1,gerado_em:new Date().toISOString(),fonte:{lucro:'CVM DFP (cvm-historico.json)',precos:'Yahoo Finance chart 1d'},crescimento:{},retornos:{}};
const anoAtual=new Date().getFullYear();
for(const[tk,cnpj]of Object.entries(hist.tickers||{})){
  const a=hist.empresas?.[cnpj]?.a;if(!a)continue;
  const anos=Object.keys(a).map(Number).filter(y=>Number.isFinite(a[y]?.luc)).sort((x,y)=>x-y);if(anos.length<2)continue;
  const u=anos[anos.length-1],L=y=>a[y]?.luc,g1=L(u-1)>0&&L(u)!=null?(L(u)/L(u-1)-1)*100:null;
  const q=[u-3,u-2,u-1,u].map(L),ok4=q.every(v=>v!=null),prej=ok4&&q.some(v=>v<=0);
  const cagr3=ok4&&!prej?(Math.pow(q[3]/q[0],1/3)-1)*100:null;
  out.crescimento[tk]={ano:u,g1:g1==null?null:+g1.toFixed(2),cagr3:cagr3==null?null:+cagr3.toFixed(2),prejuizo4:prej,atualizado:u>=anoAtual-1};
}
const PER=[['1D',1],['7D',5],['1M',21],['6M',126],['12M',252]];
async function serie(tk){
  for(const h of['query1.finance.yahoo.com','query2.finance.yahoo.com']){
    try{const r=await fetch('https://'+h+'/v8/finance/chart/'+tk+'.SA?range=2y&interval=1d',{headers:{'user-agent':'Mozilla/5.0'}});if(!r.ok)continue;
      const j=await r.json(),res=j?.chart?.result?.[0],t=res?.timestamp||[],c=res?.indicators?.quote?.[0]?.close||[];
      return t.map((x,i)=>[x*1000,c[i]]).filter(x=>Number.isFinite(x[1]))}catch{}}
  return null;
}
(async()=>{
  const tks=Object.keys(hist.tickers||{});let i=0,ok=0;const ano=String(anoAtual);
  await Promise.all(Array.from({length:6},async()=>{while(i<tks.length){const tk=tks[i++];const s=await serie(tk);if(!s||s.length<2)continue;
    const u=s[s.length-1][1],o={};for(const[k,n]of PER){const b=s.length>n?s[s.length-1-n][1]:null;o[k]=b?+((u/b-1)*100).toFixed(2):null}
    const iy=s.findIndex(x=>new Date(x[0]).getUTCFullYear()===anoAtual);const by=iy>0?s[iy-1][1]:iy===0?s[0][1]:null;o.YTD=by?+((u/by-1)*100).toFixed(2):null;
    o.data=new Date(s[s.length-1][0]).toISOString().slice(0,10);out.retornos[tk]=o;ok++}}));
  out.resumo={crescimento:Object.keys(out.crescimento).length,retornos:ok,tickers:tks.length};
  if(ok<tks.length*.5)throw Error('Poucas séries: '+ok+'/'+tks.length);
  fs.writeFileSync('dados-publicos/analises-plus.json',JSON.stringify(out));console.log(out.resumo);
})().catch(e=>{console.error(e.message);process.exitCode=1});
