// Adaptador da mesma fonte histórica do app. R$ milhões; publicação diária defasada.
export const FLOW_KEY='diario:fluxo:v1';
export function parseFluxo(html){
 const out=[],seen=new Set();
 const number=s=>{const m=/^(-?[\d.]+(?:,\d+)?)\s*(bi|mi|mil)?$/i.exec(s.replace(/−/g,'-'));if(!m)return null;const v=Number(m[1].replace(/\./g,'').replace(',','.'));return Number.isFinite(v)?v*(m[2]?.toLowerCase()==='bi'?1000:m[2]?.toLowerCase()==='mil'?0.001:1):null;};
 for(const tr of String(html||'').slice(0,600000).split(/<tr[\s>]/i).slice(1)){
  const cells=tr.split(/<\/t[dh]>/i).map(c=>c.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim()).filter(Boolean);
  const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(cells[0]||'');if(!m)continue;
  const d=m[3]+'-'+m[2]+'-'+m[1],values=cells.slice(1,6).map(number);
  if(seen.has(d)||values.length!==5||values.some(v=>v===null)||!Number.isFinite(Date.parse(d+'T12:00:00Z'))||new Date(d+'T12:00:00Z').toISOString().slice(0,10)!==d)continue;
  seen.add(d);out.push({d,est:values[0],inst:values[1],pf:values[2],ifin:values[3],out:values[4]});
 }
 return out.sort((a,b)=>b.d.localeCompare(a.d)).slice(0,65);
}
export async function coletarFluxo(fetcher=fetch,now=Date.now()){
 const r=await fetcher('https://www.dadosdemercado.com.br/fluxo',{headers:{Accept:'text/html','User-Agent':'DiarioTraderPublicFeed/1.0'},signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error('Fonte de fluxo indisponível');
 const linhas=parseFluxo(await r.text()).filter(x=>Date.parse(x.d+'T00:00:00Z')<=now);if(linhas.length<20)throw Error('Fluxo sem amostra suficiente');
 const ultimo=linhas[0],month=linhas.filter(x=>x.d.startsWith(ultimo.d.slice(0,7))),sign=Math.sign(ultimo.est);let seq=0;
 for(const x of linhas){if(sign&&Math.sign(x.est)===sign)seq++;else break;}
 return {linhas,ultimo,mes:month.reduce((s,r)=>s+r.est,0),dias_no_mes:month.length,dias_seguidos:seq,sentido:sign>0?'entrada':sign<0?'saída':'zero',atualizadoEm:new Date(now).toISOString(),fonte:'B3 via Dados de Mercado',url:'https://www.dadosdemercado.com.br/fluxo',obs:'R$ milhões; dados diários divulgados com defasagem, não intradiários. Acumulado da amostra disponível.'};
}
