/* CSV de negócios: identidade estável compatível com a ponte, sem inferir agressão. */
(function(root){
 'use strict';
 const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const aliases={id:['tradeid','idnegocio','numeronegocio','numerodonegocio','negocio','id'],ticker:['ticker','ativo','codigo'],stamp:['tradedat','datahora','timestamp'],date:['data','date'],time:['hora','horario','time'],price:['price','preco','valor'],quantity:['quantity','quantidade','qtd'],side:['side','agressao','agressor','tipodeagressao'],buyer:['buyer','compradora','comprador','corretoracompradora'],seller:['seller','vendedora','vendedor','corretoravendedora']};
 function csv(text){
  if(typeof text!=='string'||text.length>5*1024*1024)throw Error('Use um CSV de até 5 MB. Divida exportações maiores por ativo e data.');
  text=text.replace(/^\uFEFF/,'');const first=text.split(/\r?\n/,1)[0],scores=[';',',','\t'].map(d=>[d,first.split(d).length]);const sep=scores.sort((a,b)=>b[1]-a[1])[0][0];
  const lines=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===sep&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))lines.push(row);row=[];cell=''}else cell+=c;if(lines.length>5001)throw Error('Máximo de 5.000 negócios por arquivo.');}
  if(quoted)throw Error('CSV com aspas sem fechamento. Exporte novamente o arquivo.');row.push(cell);if(row.some(x=>x.trim()))lines.push(row);if(lines.length>5001)throw Error('Máximo de 5.000 negócios por arquivo.');if(lines.length<2)throw Error('O arquivo precisa de cabeçalho e linhas de negócios.');
  const headers=lines.shift().map(normalize);if(new Set(headers).size!==headers.length)throw Error('Há nomes de colunas repetidos no CSV.');
  const columns=Object.fromEntries(Object.entries(aliases).map(([k,a])=>[k,a.map(v=>headers.indexOf(v)).find(v=>v>=0)??-1]));
  const missing=['id','ticker','price','quantity'].filter(k=>columns[k]<0);if(columns.stamp<0&&(columns.date<0||columns.time<0))missing.push('data e hora');
  if(missing.length)throw Error('Colunas obrigatórias não encontradas: '+missing.map(k=>({id:'ID do negócio (não ID da ordem)',ticker:'Ativo',price:'Preço',quantity:'Quantidade'})[k]||k).join(', ')+'. Exporte o Times & Trades, não o relatório das suas ordens.');
  return {columns,lines};
 }
 function timestamp(raw){
  const text=String(raw||'').trim(),br=text.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](.+)$/);let iso=br?`${br[3]}-${br[2]}-${br[1]}T${br[4]}`:text.replace(' ','T');
  iso=iso.replace(/,(\d{1,6})/g,'.$1');if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})?$/.test(iso))return null;
  if(+iso.slice(11,13)>23||+iso.slice(14,16)>59||+iso.slice(17,19)>59)return null;
  const date=iso.slice(0,10);if(Number.isNaN(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)return null;
  if(!/(?:Z|[+-]\d{2}:\d{2})$/.test(iso))iso+='-03:00';const n=Date.parse(iso);return Number.isFinite(n)?new Date(n).toISOString():null;
 }
 async function parse(text,now=Date.now()){
  const {columns:c,lines}=csv(text),records=new Map(),invalid=[];let duplicate=0;
  for(let i=0;i<lines.length;i++){
   const cells=lines[i],get=k=>c[k]>=0?String(cells[c[k]]??'').trim():'',id=get('id'),ticker=get('ticker').toUpperCase(),price=root.CarteiraCalculo.num(get('price')),quantity=root.CarteiraCalculo.num(get('quantity')),traded_at=timestamp(get('stamp')||get('date')+' '+get('time'));
   if(!id||id.length>160||!/^[A-Z0-9.]{1,18}$/.test(ticker)||!(price>0&&price<1e12)||!(quantity>0&&quantity<1e15)||!traded_at||Date.parse(traded_at)<Date.parse('2000-01-01')||Date.parse(traded_at)>now+300000){invalid.push(i+2);continue}
   const session=new Date(Date.parse(traded_at)-3*3600000).toISOString().slice(0,10),identity=ticker+'|'+session+'|'+id;
   const digest=await root.crypto.subtle.digest('SHA-256',new TextEncoder().encode(identity)),trade_id=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
   const side=normalize(get('side')),row={trade_id,ticker,traded_at,price,quantity,side:['buy','compra','comprador','compradora','agressaocompra'].includes(side)?'buy':['sell','venda','vendedor','vendedora','agressaovenda'].includes(side)?'sell':'unknown',buyer:get('buyer').slice(0,100)||null,seller:get('seller').slice(0,100)||null,source:'Profit CSV'};
   if(records.has(trade_id)){if(JSON.stringify(records.get(trade_id))!==JSON.stringify(row))throw Error('O mesmo ID de negócio aparece com dados diferentes na linha '+(i+2)+'. Confira a exportação.');duplicate++}records.set(trade_id,row);
  }
  if(!records.size)throw Error('Nenhuma linha válida. Confira ID do negócio, ativo, data completa, preço e quantidade.');
  return {records:[...records.values()],invalid,duplicate,total:lines.length};
 }
 root.FluxoImportacao={parse,csv,timestamp};
})(typeof window==='undefined'?globalThis:window);
