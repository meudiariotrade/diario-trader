/* v661 · Séries oficiais BCB/SGS e IBGE/agregados — requisições diretas no navegador. */
;(function(){
'use strict';
const L=window.EconomiaLab,S=L.state,E=L.esc,N=L.note,C=L.card;
const PRESETS=[
 ['sgs:432','Selic meta · % ao ano','BCB','% a.a.'],
 ['sgs:433','IPCA mensal · variação','BCB','% mensal'],
 ['sgs:4382','PIB nominal acumulado 12 meses','BCB','R$ milhões'],
 ['sgs:24369','Taxa de desocupação PNAD contínua','BCB / IBGE','%'],
 ['sgs:13762','Dívida bruta do governo geral / PIB','BCB','% PIB'],
 ['sgs:3698','Câmbio comercial USD/BRL médio mensal','BCB','R$/US$'],
 ['ibge:5932:6561:11255:90707','PIB real · variação interanual','IBGE','%'],
 ['ibge:7060:63:315:7169','IPCA · variação mensal','IBGE','%'],
 ['ibge:4099:4099','Desocupação PNAD trimestral','IBGE','%'],
 ['sgs:custom','SGS · código personalizado','BCB','valor da fonte'],
 ['ibge:custom','IBGE · agregado personalizado','IBGE','valor da fonte']
];
S.uniSerie='sgs:432';S.uniSGS='432';S.uniTabela='5932';S.uniVariavel='6561';S.uniClass='11255';S.uniCategoria='90707';S.uniJanela=36;S.uniSerieBusy=false;S.uniSerieErro='';S.uniSerieAtual=null;
const cleanCode=v=>/^\d{1,8}$/.test(String(v||''))?String(v):null;
function buscarUrl(){
 const preset=PRESETS.find(x=>x[0]===S.uniSerie)||PRESETS[0];
 let p=preset[0].split(':'),titulo=preset[1],fonte=preset[2],unidade=preset[3],url;
 if(p[0]==='sgs'){
  const cod=cleanCode(p[1]==='custom'?S.uniSGS:p[1]);if(!cod)throw Error('Informe um código SGS numérico.');
  const agora=new Date(),inicio=new Date(agora.getFullYear(),agora.getMonth()-Math.max(1,Math.min(120,S.uniJanela)),1);
  const fmt=d=>[String(d.getDate()).padStart(2,'0'),String(d.getMonth()+1).padStart(2,'0'),d.getFullYear()].join('/');
  url='https://api.bcb.gov.br/dados/serie/bcdata.sgs.'+cod+'/dados?formato=json&dataInicial='+encodeURIComponent(fmt(inicio))+'&dataFinal='+encodeURIComponent(fmt(agora));
  if(p[1]==='custom')titulo='SGS '+cod;
 }else{
  const t=cleanCode(p[1]==='custom'?S.uniTabela:p[1]),v=cleanCode(p[1]==='custom'?S.uniVariavel:p[2]);
  if(!t||!v)throw Error('Informe tabela e variável IBGE numéricas.');
  const maxPeriod=Math.max(1,Math.min(60,S.uniJanela));
  url='https://servicodados.ibge.gov.br/api/v3/agregados/'+t+'/periodos/-'+maxPeriod+'/variaveis/'+v+'?localidades=N1%5Ball%5D';
  const cl=cleanCode(p[1]==='custom'?S.uniClass:p[3]),cat=cleanCode(p[1]==='custom'?S.uniCategoria:p[4]);
  if(cl&&cat)url+='&classificacao='+cl+'%5B'+cat+'%5D';
  if(p[1]==='custom')titulo='IBGE '+t+' · variável '+v;
 }
 return {url,titulo,fonte,unidade};
}
function normalizaSGS(json){
 if(!Array.isArray(json))throw Error('SGS retornou formato inesperado.');
 return json.map(x=>({data:String(x?.data||''),valor:Number(String(x?.valor??'').replace(',','.'))}))
 .filter(x=>/^\d\d\/\d\d\/\d{4}$/.test(x.data)&&Number.isFinite(x.valor))
 .map(x=>({data:x.data.slice(6)+'-'+x.data.slice(3,5)+'-'+x.data.slice(0,2),valor:x.valor}))
 .sort((a,b)=>a.data.localeCompare(b.data));
}
function normalizaIBGE(json){
 if(!Array.isArray(json))throw Error('IBGE retornou formato inesperado.');
 const dados=[];
 for(const item of json)for(const result of item?.resultados||[])for(const s of result?.series||[]){
  const br=s?.localidade?.id===1||s?.localidade?.id==='1'||/Brasil/i.test(s?.localidade?.nome||'');
  if(!br)continue;
  for(const [period,raw] of Object.entries(s?.serie||{})){
   const val=Number(String(raw).replace(',','.'));
   if(!Number.isFinite(val)||!/^20\d{2}(?:0[1-9]|1[0-2])?$/.test(period))continue;
   dados.push({data:period,valor:val});
  }
 }
 const map=new Map(dados.map(x=>[x.data,x]));return [...map.values()].sort((a,b)=>a.data.localeCompare(b.data));
}
L.uniSeries={normalizaSGS,normalizaIBGE,buscarUrl};
function plot(pts){
 if(!pts.length)return '';
 const sample=pts.length>120?pts.filter((x,i)=>i%Math.ceil(pts.length/120)===0||i===pts.length-1):pts;
 let min=Math.min(...sample.map(x=>x.valor)),max=Math.max(...sample.map(x=>x.valor));
 if(min===max){min-=1;max+=1;}
 const points=sample.map((x,i)=>[52+550*i/(sample.length-1||1),173-(x.valor-min)/(max-min)*145]);
 return '<svg class="eco-plot" viewBox="0 0 650 208" role="img" aria-label="Histórico da série oficial consultada">'+
 '<path d="M52 173H602" stroke="#606b7a"/>'+
 '<polyline points="'+points.map(x=>x.map(y=>y.toFixed(2)).join(',')).join(' ')+'" fill="none" stroke="#D4A017" stroke-width="2.5"/>'+
 points.map((p,i)=>'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="2" fill="#D4A017"><title>'+E(sample[i].data)+' · '+E(sample[i].valor)+'</title></circle>').join('')+
 '<text x="53" y="195" font-size="12" fill="#9ba5b3">'+E(pts[0].data)+'</text>'+
 '<text x="510" y="195" font-size="12" fill="#9ba5b3">'+E(pts.at(-1).data)+'</text>'+
 '<text x="8" y="25" font-size="11" fill="#a1acbd">'+E(max.toFixed(2))+'</text>'+
 '<text x="8" y="170" font-size="11" fill="#a1acbd">'+E(min.toFixed(2))+'</text></svg>';
}
async function consultar(){
 if(S.uniSerieBusy)return;S.uniSerieBusy=true;S.uniSerieErro='';L.paint();
 try{
  const meta=buscarUrl();const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),25000);let r;
  try{r=await fetch(meta.url,{headers:{Accept:'application/json'},signal:controller.signal});}
  finally{clearTimeout(timer);}
  if(!r.ok)throw Error('Fonte oficial retornou HTTP '+r.status);
  const body=await r.json();
  const pts=(meta.fonte.startsWith('BCB')?normalizaSGS(body):normalizaIBGE(body)).slice(-500);
  if(!pts.length)throw Error('A fonte não retornou valores numéricos para a consulta. Confira código, variável e categoria.');
  const entry={id:L.uni.uid(),serie:meta.titulo,fonte:meta.fonte,unidade:meta.unidade,url:meta.url,em:new Date().toISOString(),pontos:pts};
  S.uniSerieAtual=entry;L.uni.data.consultas.unshift(entry);L.uni.data.consultas=L.uni.data.consultas.slice(0,20);L.uni.save();
 }catch(err){S.uniSerieErro='Não foi possível consultar diretamente a API: '+String(err.message||err).slice(0,180)+'. Verifique a conexão/CORS e abra o link oficial se necessário.';}
 finally{S.uniSerieBusy=false;L.paint();}
}
L.events.uniConsultar=consultar;
L.events.uniAbrirSerie=el=>{S.uniSerieAtual=L.uni.data.consultas.find(x=>x.id===el.dataset.id)||null;L.paint();};
L.events.uniCSV=()=>{
 const a=S.uniSerieAtual;if(!a?.pontos?.length)return;
 const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 // CSV pt-BR: separador ; e decimal vírgula, abre no Excel; R: read.csv2; Python: sep=';', decimal=','.
 const lines=['data;valor;fonte;serie;unidade',...a.pontos.map(x=>[quote(x.data),quote(x.valor.toString().replace('.',',')),quote(a.fonte),quote(a.serie),quote(a.unidade)].join(';'))];
 const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob);
 const el=document.createElement('a');el.href=url;el.download='serie-economica-'+a.serie.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').slice(0,55)+'.csv';
 document.body.appendChild(el);el.click();el.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
};
document.addEventListener('change',e=>{
 if(typeof ESV==='undefined'||ESV!=='eco'||S.tool!=='series')return;
 const t=e.target;if(!t.matches('[data-uni-serie-input]'))return;
 const key=t.dataset.uniSerieInput;if(key==='uniSerie')S.uniSerie=t.value;
 else if(key==='uniJanela')S.uniJanela=+t.value;
 else if(key in S)S[key]=t.value;
 L.paint();
},true);
L.views.series=()=>{
 const opt=PRESETS.map(x=>'<option value="'+E(x[0])+'"'+(S.uniSerie===x[0]?' selected':'')+'>'+E(x[1])+' · '+E(x[2])+'</option>').join('');
 const cur=S.uniSerieAtual,p=cur?.pontos||[],last=p.at(-1);
 const sgs=S.uniSerie==='sgs:custom',ibge=S.uniSerie==='ibge:custom';
 const fields=sgs?'<label>Código SGS<input data-uni-serie-input="uniSGS" type="text" inputmode="numeric" pattern="[0-9]*" value="'+E(S.uniSGS)+'"></label>':
 ibge?'<label>Tabela IBGE<input data-uni-serie-input="uniTabela" inputmode="numeric" value="'+E(S.uniTabela)+'"></label>'+
 '<label>Variável<input data-uni-serie-input="uniVariavel" inputmode="numeric" value="'+E(S.uniVariavel)+'"></label>'+
 '<label>Classificação (opcional)<input data-uni-serie-input="uniClass" inputmode="numeric" value="'+E(S.uniClass)+'"></label>'+
 '<label>Categoria (opcional)<input data-uni-serie-input="uniCategoria" inputmode="numeric" value="'+E(S.uniCategoria)+'"></label>':'';
 return C('Consultor de séries econômicas oficiais',
 '<div class="eco-controls"><label>Indicador<select data-uni-serie-input="uniSerie">'+opt+'</select></label>'+
 '<label>Janela (meses ou últimos períodos)<select data-uni-serie-input="uniJanela">'+[12,24,36,60].map(n=>'<option value="'+n+'"'+(S.uniJanela===n?' selected':'')+'>'+n+'</option>').join('')+'</select></label>'+fields+
 '<button type="button" class="eco-action" data-eco-btn="uniConsultar"'+(S.uniSerieBusy?' disabled':'')+'>'+(S.uniSerieBusy?'Consultando…':'Buscar série oficial')+'</button></div>'+
 N('Consulta diretamente no BCB/SGS ou IBGE Agregados v3, sem passar pelo Supabase. Não são criados dados de demonstração. Filtros personalizados aceitam apenas códigos numéricos.')+
 (S.uniSerieErro?N(E(S.uniSerieErro)):'') )+
 (cur?C('Série consultada · '+E(cur.serie),
 '<div class="eco-grid-stats">'+L.kpi('Último valor',L.f(last?.valor)+' '+E(cur.unidade))+
 L.kpi('Último período',E(last?.data||'—'))+L.kpi('Observações',String(p.length))+
 L.kpi('Fonte',E(cur.fonte))+'</div>'+plot(p)+
 N('Data da consulta: '+E(new Date(cur.em).toLocaleString('pt-BR'))+' · Fonte oficial: <a target="_blank" rel="noopener noreferrer" href="'+E(cur.url)+'">abrir API</a>')+
 '<div class="eco-controls"><button type="button" class="eco-action" data-eco-btn="uniCSV">Baixar CSV limpo</button></div>'+
 N('CSV UTF-8 com separador ; e decimal ,. No R: read.csv2(); em Python: pandas.read_csv(sep=";", decimal=","). Valores não são dessazonalizados pelo laboratório.')):'')+
 C('Histórico local de consultas · '+L.uni.data.consultas.length,
 L.uni.data.consultas.length?'<div class="uni-saved">'+L.uni.data.consultas.map(x=>'<button type="button" data-eco-btn="uniAbrirSerie" data-id="'+E(x.id)+'"><b>'+E(x.serie)+'</b><small>'+E(x.em.slice(0,10))+' · '+x.pontos.length+' pontos</small></button>').join('')+'</div>':N('Nenhuma consulta salva neste navegador.'));
};
})();
