/* Serviço de pronúncia de Aulas. Nunca modifica o texto de leitura. */
;(function(){'use strict';
const defaults=Object.freeze({MM200:'média móvel de duzentos períodos',MM50:'média móvel de cinquenta períodos',MM20:'média móvel de vinte períodos',MME9:'média móvel exponencial de nove períodos',OCOI:'ombro cabeça ombro invertido',OCO:'ombro cabeça ombro',RSI:'índice de força relativa',MACD:'méqui dê',VWAP:'preço médio ponderado pelo volume',VSA:'análise de volume e spread',RVOL:'volume relativo',WIN:'mini índice',WDO:'mini dólar',B3:'bê três',ETF:'ê tê éfe',SMA:'média móvel simples',EMA:'média móvel exponencial'});
const owner=()=>typeof SESS!=='undefined'&&SESS?.uid?String(SESS.uid):'visitante',key=()=> 'diario:voz:glossario:v1:'+owner();
function validate(data){const out=Object.create(null);if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Dicionário inválido.');const entries=Object.entries(data);if(entries.length>200)throw Error('Use no máximo 200 termos.');for(const [k,v]of entries){const term=k.trim(),value=String(v).replace(/\s+/g,' ').trim();if(!term||term.length>40||!value||value.length>180||/[\n\r=]/.test(term))throw Error('Use termos de até 40 caracteres e pronúncias de até 180.');out[term.toLocaleUpperCase('pt-BR')]=value;}return out;}
function dictionary(){try{return {...defaults,...validate(JSON.parse(localStorage.getItem(key())||'{}'))};}catch{return {...defaults};}}
function normalizarTextoParaVoz(texto,dicionario=dictionary()){
 const map=validate(dicionario),keys=Object.keys(map).sort((a,b)=>b.length-a.length);if(!keys.length)return String(texto??'');
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const regex=new RegExp('(^|[^\\p{L}\\p{N}_])('+keys.map(escape).join('|')+')(?=$|[^\\p{L}\\p{N}_])','giu');
 return String(texto??'').replace(regex,(_,before,term)=>before+map[term.toLocaleUpperCase('pt-BR')]);
}
function save(data){const value=validate(data);localStorage.setItem(key(),JSON.stringify(value));if(owner()!=='visitante'){localStorage.setItem(dirtyKey(owner()),'1');cloudSync(true).catch(()=>{});}return value;}

/* Glossário TTS por conta: sincronização automática e fila offline v668. */
const dirtyKey=uid=>'diario:voz:pendente:v668:'+uid;
let cloudPromise=null,cloudLast=0,cloudOwner='',cloudRetryAfter=0;
function cloudStatus(message){const el=typeof document!=='undefined'?document.querySelector('#tp-root [data-tp-dict-status]'):null;if(el)el.textContent=message;}
async function cloudSync(force=false){
 const uid=owner();
 if(uid==='visitante'||typeof SESS==='undefined'||!SESS?.at||typeof fetch!=='function')return;
 if(cloudOwner!==uid){cloudOwner=uid;cloudLast=0;cloudRetryAfter=0;}
 if(cloudPromise)return cloudPromise;
 const pendente=localStorage.getItem(dirtyKey(uid))==='1';
 if(Date.now()<cloudRetryAfter)return;
 if(!pendente&&Date.now()-cloudLast<15*60*1000)return;
 cloudPromise=(async()=>{
  try{
   if(typeof tok==='function')await tok();
   if(owner()!==uid||!SESS?.at)return;
   const c=cfg(),endpoint=c.url+'/rest/v1/aulas_glossario_tts',headers={apikey:c.key,Authorization:'Bearer '+SESS.at,'Content-Type':'application/json'};
   const res=await fetch(endpoint+'?select=user_id,termos,revisao&user_id=eq.'+encodeURIComponent(uid)+'&limit=1',{headers,signal:AbortSignal.timeout(4000)});
   if(!res.ok)throw Error('Falha ao carregar o glossário.');
   const rows=await res.json();if(!Array.isArray(rows))throw Error('Glossário inválido.');
   if(owner()!==uid)return;
   const row=rows.find(r=>r.user_id===uid),local=localStorage.getItem(key());
   if(localStorage.getItem(dirtyKey(uid))==='1'||(!row&&local!==null)){
    const termos=validate(JSON.parse(local||'{}')),snapshot=JSON.stringify(termos);
    const put=await fetch(endpoint+'?on_conflict=user_id',{method:'POST',headers:{...headers,Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({user_id:uid,termos,revisao:Math.max(1,Number(row?.revisao||0)+1)}),signal:AbortSignal.timeout(4000)});
    if(!put.ok)throw Error('Falha ao salvar na nuvem.');
    if(owner()!==uid)return;
    if(JSON.stringify(validate(JSON.parse(localStorage.getItem(key())||'{}')))===snapshot){
     localStorage.removeItem(dirtyKey(uid));
     cloudStatus('Sincronizado. A ponte receberá o dicionário na próxima consulta.');
    }
   }else if(row){
    const termos=validate(row.termos);
    localStorage.setItem(key(),JSON.stringify(termos));
    const input=document.querySelector('#tp-root [data-tp-dictionary]');
    if(input&&document.activeElement!==input)input.value=Object.entries({...defaults,...termos}).map(([k,v])=>k+' = '+v).join('\n');
   }
   cloudLast=Date.now();cloudRetryAfter=0;
  }catch{
   cloudRetryAfter=Date.now()+5*60*1000;
   if(owner()===uid&&localStorage.getItem(dirtyKey(uid))==='1')cloudStatus('Salvo neste aparelho. Envio pendente; nova tentativa após a pausa de rede.');
  }
 })();
 try{await cloudPromise;}finally{cloudPromise=null;}
}

const T=window.TecnicaPratica;window.DiarioVoz={defaults,dictionary,validate,save,normalizarTextoParaVoz};T.normalizarTextoParaVoz=normalizarTextoParaVoz;
T.voiceControls=()=>{cloudSync().catch(()=>{});return `<details class="tp-voice-dict"><summary>Dicionário de Voz</summary><p>Um termo por linha: SIGLA = como deve ser falada. A pronúncia é salva por conta na nuvem e sincronizada automaticamente com a ponte do PC.</p><label>Termos e pronúncias<textarea data-tp-dictionary rows="7" spellcheck="false">${T.escape(Object.entries(dictionary()).map(([k,v])=>k+' = '+v).join('\n'))}</textarea></label><div class="tp-controls"><button type="button" data-tp-dict="save">Salvar dicionário</button><button type="button" data-tp-dict="reset">Restaurar padrão</button></div><p role="status" data-tp-dict-status></p></details>`;};
if(typeof document==='undefined')return;
// Sem polling: tenta ao reabrir a página (TTL 15 min) ou ao editar o glossário.
window.addEventListener('online',()=>{cloudRetryAfter=0;cloudSync(true).catch(()=>{});});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&document.querySelector('#tp-root'))cloudSync().catch(()=>{});});
document.addEventListener('click',e=>{const b=e.target.closest?.('#tp-root [data-tp-dict]');if(!b)return;e.preventDefault();const box=b.closest('.tp-voice-dict'),input=box.querySelector('textarea'),status=box.querySelector('[data-tp-dict-status]');try{if(b.dataset.tpDict==='reset'){save({});input.value=Object.entries(defaults).map(([k,v])=>k+' = '+v).join('\n');status.textContent='Pronúncias padrão restauradas e sincronizando.';return;}const entries=Object.create(null);for(const line of input.value.split(/\r?\n/)){if(!line.trim())continue;const i=line.indexOf('=');if(i<1)throw Error('Use SIGLA = pronúncia em cada linha.');entries[line.slice(0,i).trim()]=line.slice(i+1).trim();}const data=validate(entries);save(data);status.textContent='Dicionário salvo. Sincronização automática ativada.';if(b.dataset.tpDict==='export'){const url=URL.createObjectURL(new Blob([JSON.stringify({schema:1,terms:{...defaults,...data}},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='dicionario-voz.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Salvo. Copie dicionario-voz.json para a pasta da ponte no PC.';}}catch(err){status.textContent=err.message||'Não foi possível salvar neste navegador.';}});
})();
