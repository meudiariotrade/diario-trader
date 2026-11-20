/** Fontes do Jornal: requisições limitadas, sem URLs fornecidas pelo cliente. */
const HOSTS = new Set(['www.moneytimes.com.br','moneytimes.com.br','agenciabrasil.ebc.com.br','www.bcb.gov.br','www.ibge.gov.br','agenciadenoticias.ibge.gov.br','www.federalreserve.gov','www.bls.gov','www.bea.gov','www.gov.br']);
export function fontePermitida(value: string) {
  try { const u=new URL(value); return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&HOSTS.has(u.hostname)?u.href:''; } catch {return '';}
}
async function leituraLimitada(url:string, max=750000) {
  const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(8000)});
  if(!r.ok||Number(r.headers.get('content-length')||0)>max)throw Error('Fonte indisponível');
  const reader=r.body?.getReader();if(!reader)throw Error('Sem conteúdo');
  const chunks:Uint8Array[]=[],decoder=new TextDecoder();let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw Error('Fonte excede limite');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
  return chunks.map(x=>decoder.decode(x,{stream:true})).join('')+decoder.decode();
}
function plain(s:string){return s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();}
export function textoArtigo(html:string) {
  // Apenas corpo de artigo, nunca menu/rodapé da página inteira.
  for(const hit of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{
    const stack=[JSON.parse(hit[1])];while(stack.length){const x=stack.pop();if(Array.isArray(x)){stack.push(...x);continue;}if(x&&typeof x==='object'){if(typeof x.articleBody==='string')return plain(x.articleBody).slice(0,12000);if(x['@graph'])stack.push(x['@graph']);}}
  }catch{/* JSON-LD inválido */}
  const body=html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1];
  return body?Array.from(body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi),x=>plain(x[1])).filter(x=>x.length>50).join('\n').slice(0,12000):'';
}
export async function fontesJornal(mans:any[]) {
  const seen=new Set<string>(),selected=mans.filter(x=>{const u=fontePermitida(x.url);if(!u||seen.has(u))return false;seen.add(u);return true;}).slice(0,6);
  const result=await Promise.allSettled(selected.map(async m=>{const texto=textoArtigo(await leituraLimitada(m.url));if(texto.length<180)throw Error('Corpo não recuperado');return {titulo:m.t,url:m.url,publicado_em:m.d,consultado_em:new Date().toISOString(),texto};}));
  return result.flatMap(r=>r.status==='fulfilled'?[r.value]:[]);
}
/** Localiza o trecho declarado. Isso comprova a citação, não toda a interpretação. */
export function confereEvidencia(m:any,docs:any[]) {
  const norm=(x:any)=>String(x||'').normalize('NFKC').replace(/\s+/g,' ').trim();
  const doc=docs.find(x=>x.url===m.fonte_url),trecho=norm(m.evidencia_trecho);
  if(!doc)return {estado:'pendente',motivo:'Corpo da fonte específica não recuperado.'};
  if(trecho.length<40||trecho.length>240||!norm(doc.texto).includes(trecho))return {estado:'pendente',motivo:'Trecho de evidência ausente ou não localizado na fonte.'};
  return {estado:'trecho_localizado',motivo:'Citação localizada no corpo recuperado; interpretação requer leitura crítica.',consultado_em:doc.consultado_em};
}
const BLS='https://www.bls.gov/schedule/news_release/bls.ics';
/** Converte horário civil de uma zona IANA, incluindo mudanças de horário de verão. */
export function instanteCivil(date:string,time:string,zone:string) {
  const target=Date.parse(date+'T'+time+':00Z');let instant=target;
  for(let i=0;i<3;i++){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(instant).map(x=>[x.type,x.value]));const shown=Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);instant+=target-shown;}
  return new Date(instant).toISOString();
}
export function agendaBLS(ics:string) {
  const result:any[]=[];
  for(const hit of ics.replace(/\r?\n[ \t]/g,'').matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)){
    const event=hit[1],dt=event.match(/^DTSTART(?:;TZID=([^:\r\n]+))?:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)/m),title=event.match(/^SUMMARY:(.*)$/m)?.[1]?.trim();
    if(!dt||!title||/^STATUS:CANCELLED/m.test(event))continue;
    const zone=dt[1]==='US-Eastern'?'America/New_York':dt[1];if(!dt[8]&&!['America/New_York','US-Eastern'].includes(dt[1]||''))continue;
    const date=`${dt[2]}-${dt[3]}-${dt[4]}`,time=`${dt[5]}:${dt[6]}`,instant=dt[8]?date+'T'+time+':00Z':instanteCivil(date,time,zone);
    const br=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instant)),p=Object.fromEntries(br.map(x=>[x.type,x.value]));
    result.push({data:`${p.year}-${p.month}-${p.day}`,horario:`${p.hour}:${p.minute}`,instante_em:instant,pais:'EUA',evento:title.replace(/\\,/g,',').replace(/\\n/g,' '),fonte_url:BLS,por_que:'Divulgação programada no calendário oficial do BLS. O agendamento não confirma o resultado.',consenso:'',anterior:''});
  }return result;
}
export function agendaIBGE(data:any,url:string) {
  return (data?.items||[]).flatMap((x:any)=>{const d=String(x.data_divulgacao||'').match(/^(\d{2})\/(\d{2})\/(\d{4})/);if(!d||!x.titulo)return [];
    // A API não explicita o fuso de data_divulgacao: preservar só a data, sem inferir hora.
    return [{data:`${d[3]}-${d[2]}-${d[1]}`,horario:'',pais:'Brasil',evento:String(x.titulo).slice(0,140),periodo:[x.mes_referencia_inicio,x.ano_referencia_inicio].filter(Boolean).join('/'),fonte_url:url,por_que:'Data programada pelo IBGE; horário não confirmado nesta fonte.',consenso:'',anterior:''}];});
}
/* v840: calendário econômico com impacto, consenso e anterior (o mesmo da aba Agenda, coletado na Cloudflare).
   Volta a dar ao Jornal a agenda completa; IBGE e BLS ficam como complemento. */
const CAL_URL='https://br.tradingview.com/economic-calendar/';
export function agendaCalendario(ev:any[]) {
  const pais:Record<string,string>={BR:'Brasil',US:'EUA',EU:'Zona do Euro',CN:'China',GB:'Reino Unido',JP:'Japão',DE:'Alemanha'};
  return (Array.isArray(ev)?ev:[]).flatMap((e:any)=>{
    const t=Date.parse(e?.em||'');if(!Number.isFinite(t)||!e?.t||!pais[e.p]||(e.imp??-1)<0)return [];
    const l=new Date(t-3*3600000),data=l.toISOString().slice(0,10),horario=l.toISOString().slice(11,16);
    return [{data,horario,pais:pais[e.p],evento:String(e.t).slice(0,140),periodo:String(e.per||''),fonte_url:CAL_URL,impacto:e.imp>=1?'alto':'médio',
      consenso:String(e.proj||''),anterior:String(e.ant||''),realizado:String(e.atual||''),por_que:''}];
  });
}
export async function agendaJornal(dia:string) {
  const ate=new Date(Date.parse(dia+'T12:00:00Z')+14*86400000).toISOString().slice(0,10),ibge=`https://servicodados.ibge.gov.br/api/v3/calendario/?qtd=100&de=${dia}&ate=${ate}`;
  const cal=(s:number)=>fetch('https://diario-trader.lucianosilva43567.workers.dev/v1/agenda?semana='+s,{signal:AbortSignal.timeout(8000)}).then(r=>r.ok?r.json():Promise.reject(new Error(String(r.status)))).then(j=>agendaCalendario(j?.eventos||[]));
  const results=await Promise.allSettled([leituraLimitada(BLS).then(agendaBLS),leituraLimitada(ibge).then(x=>agendaIBGE(JSON.parse(x),ibge)),Promise.all([cal(0),cal(1).catch(()=>[])]).then(x=>x.flat())]);
  const vistos=new Set<string>(),todos=results.flatMap(r=>r.status==='fulfilled'?r.value:[]).filter(x=>x.data>=dia&&x.data<=ate);
  const peso=(x:any)=>x.impacto==='alto'?0:x.impacto==='médio'?1:2;
  const itens=todos.sort((a,b)=>peso(a)-peso(b)||(a.data+(a.horario||'99:99')).localeCompare(b.data+(b.horario||'99:99')))
    .filter(x=>{const k=x.data+'|'+String(x.evento).toLowerCase().slice(0,40);if(vistos.has(k))return false;vistos.add(k);return true;}).slice(0,25)
    .sort((a,b)=>(a.data+(a.horario||'99:99')).localeCompare(b.data+(b.horario||'99:99')));
  const nomes=['Calendário BLS','Calendário IBGE','Calendário econômico'],urls=[BLS,ibge,CAL_URL];
  return {itens,fontes:results.flatMap((r,i)=>r.status==='fulfilled'?[{titulo:nomes[i],url:urls[i]}]:[]),lacunas:results.flatMap((r,i)=>r.status==='rejected'?[nomes[i]+': não recuperado.']:[])};
}
