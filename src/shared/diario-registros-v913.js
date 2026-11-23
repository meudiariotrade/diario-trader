/* v913 — acesso privado por JWT às coleções sob controle do dispositivo.
 * Dados privados não passam por GitHub, cache público nem bancos legados.
 */
(function(){
 'use strict';
 const ROOT='https://diario-sync.lucianosilva43567.workers.dev/v1/records/';
 // Só ativar tabelas nas quais o próprio app controla os escritores.
 // Radar, email, push, corretora e IA ficam fora até migrar seus escritores.
 const DEVICE_TABLES=new Set(['carteira_cfg','estado_diario','fluxo_acoes','fluxo_negocios',
   'limpeza_backup','profit_prints','atalhos_tokens','aulas_glossario_tts']);
 function route(path){
  if(typeof path!=='string'||!path.startsWith('/rest/v1/'))return null;
  const m=/^\/rest\/v1\/([a-z_]+)(\?.*)?$/.exec(path);
  if(!m||!DEVICE_TABLES.has(m[1]))return null;
  return ROOT+m[1]+(m[2]||'');
 }
 const can=path=>!!route(path);
 async function request(path,init,token){
  const url=route(path);
  if(!url)throw Error('Coleção não autorizada no Cloudflare D1.');
  if(!token||token.length<30)throw Error('Entre na sua conta para usar dados privados.');
  const headers=new Headers(init?.headers||{});
  headers.delete('apikey');
  headers.set('Authorization','Bearer '+token);
  headers.set('Accept','application/json');
  if(init?.body!=null&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  const res=await fetch(url,{
    ...init,method:init?.method||'GET',headers,mode:'cors',credentials:'omit',
    cache:'no-store',redirect:'manual',
    signal:init?.signal||(typeof AbortSignal.timeout==='function'?AbortSignal.timeout(20000):undefined)
  });
  if(!res.ok){
   const body=await res.clone().json().catch(()=>({}));
   const e=new Error(body.error||'Cloudflare D1 HTTP '+res.status);
   e.status=res.status;throw e;
  }
  return res;
 }
 window.DiarioD1Registros=Object.freeze({can,request,tables:[...DEVICE_TABLES],versao:913});
})();