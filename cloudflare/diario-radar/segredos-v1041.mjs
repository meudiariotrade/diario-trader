/**
 * v1041 — Chaves do app guardadas na Cloudflare (D1 HISTORICO), trazidas uma única vez do Vault do Supabase.
 * Autorizado pelo dono do app em 27/11/2026: "Worker busca sozinho".
 * - Só as chaves da lista abaixo; nunca devolve valores por HTTP (o status mostra só nomes).
 * - A cópia usa a chave de serviço que o Worker já tem e a função public.segredos_cloudflare_v1041,
 *   executável apenas pelo service_role. Depois de copiadas, o Worker não consulta mais o Supabase.
 * - Não lê Logs/Analytics do Supabase.
 */
export const SEGREDOS_V1041=Object.freeze([
 'diario_vapid_public','diario_vapid_private','diario_vapid_subject','diario_resend_api_key'
]);
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const memoria=new Map();
let tabelaOk=false;

async function garantirTabela(env){
 if(tabelaOk)return;
 await env.HISTORICO.prepare(
  'CREATE TABLE IF NOT EXISTS cf_segredos_v1041 (nome TEXT PRIMARY KEY, valor TEXT NOT NULL, origem TEXT NOT NULL, em INTEGER NOT NULL)'
 ).run();
 tabelaOk=true;
}

export async function nomesGuardados(env){
 await garantirTabela(env);
 const r=await env.HISTORICO.prepare('SELECT nome, em FROM cf_segredos_v1041 ORDER BY nome').all();
 return (r.results||[]).map(x=>({nome:String(x.nome),em:Number(x.em)||0}));
}

/** Valor de uma chave (memória → D1). Retorna null se ainda não foi copiada. */
export async function segredoV1041(env,nome){
 if(!SEGREDOS_V1041.includes(nome))throw new Error('Chave não autorizada: '+nome);
 if(memoria.has(nome))return memoria.get(nome);
 if(!env.HISTORICO)return null;
 await garantirTabela(env);
 const r=await env.HISTORICO.prepare('SELECT valor FROM cf_segredos_v1041 WHERE nome=?').bind(nome).first();
 const v=r&&typeof r.valor==='string'&&r.valor?r.valor:null;
 if(v)memoria.set(nome,v);
 return v;
}

/** Copia do Vault só o que ainda falta. Idempotente; não faz nada quando tudo já está na Cloudflare. */
export async function copiarSegredosV1041(env,fetcher=fetch,agora=Date.now()){
 if(!env.HISTORICO)return {copiou:0,motivo:'D1 indisponível'};
 const ja=new Set((await nomesGuardados(env)).map(x=>x.nome));
 const faltam=SEGREDOS_V1041.filter(n=>!ja.has(n));
 if(!faltam.length)return {copiou:0,motivo:'completo'};
 const base=String(env.SUPABASE_URL||''),key=env.SUPABASE_SERVICE_ROLE_KEY;
 if(!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(base)||typeof key!=='string'||key.length<30)
  return {copiou:0,motivo:'sem credencial de serviço'};
 const res=await fetcher(base+'/rest/v1/rpc/segredos_cloudflare_v1041',{
  method:'POST',
  headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Accept:'application/json'},
  body:'{}',redirect:'manual',signal:AbortSignal.timeout(15000)
 });
 if(!res.ok)return {copiou:0,motivo:'Vault HTTP '+res.status};
 const lista=await res.json();
 if(!Array.isArray(lista))return {copiou:0,motivo:'resposta inválida'};
 let n=0;
 for(const item of lista){
  const nome=String(item&&item.nome||''),valor=String(item&&item.valor||'');
  if(!faltam.includes(nome)||!valor)continue;
  await env.HISTORICO.prepare(
   'INSERT INTO cf_segredos_v1041 (nome, valor, origem, em) VALUES (?,?,?,?) ON CONFLICT(nome) DO UPDATE SET valor=excluded.valor, origem=excluded.origem, em=excluded.em'
  ).bind(nome,valor,'supabase-vault',agora).run();
  memoria.set(nome,valor);n++;
 }
 return {copiou:n,motivo:n===faltam.length?'completo':'parcial'};
}

/** GET /v1/segredos/status — só nomes e datas; nunca valores. */
export async function statusSegredosV1041(env){
 if(!env.HISTORICO)return Response.json({ok:false,erro:'D1 indisponível'},{status:503,headers});
 try{
  const g=await nomesGuardados(env),tem=new Set(g.map(x=>x.nome));
  return Response.json({ok:true,servico:'segredos-v1041',guardadas:g,
   faltando:SEGREDOS_V1041.filter(n=>!tem.has(n))},{headers});
 }catch{return Response.json({ok:false,erro:'Não foi possível ler o D1'},{status:503,headers})}
}
