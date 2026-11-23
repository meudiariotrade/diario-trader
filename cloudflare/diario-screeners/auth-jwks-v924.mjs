/* Auth v924: verifica ES256 do Supabase com JWKS público. Sem /auth/v1/user
 * por parecer; tokens e dados privados nunca são cacheados.
 * Para endpoints que exigem revogação imediata, use getUser no servidor.
 */
const jwksCache = new Map();
const JWKS_TTL_MS = 5 * 60 * 1000;
/* Chave PUBLICA atual do Auth (JWKS oficial, 23/11/2026).
 * Guardada no Worker para impedir que uma falha da rede Cloudflare→Auth
 * derrube todas as IAs. NÃO contém chave privada ou credencial.
 * Em rotação: consulta o endpoint oficial quando o kid não confere.
 * SUPABASE_PUBLIC_JWKS permite atualizar a lista sem alterar o código.
 */
const PINNED_ORIGIN='https://vdzwydizostutukppcsj.supabase.co';
const PINNED_JWKS={keys:[{
  alg:'ES256',crv:'P-256',ext:true,key_ops:['verify'],
  kid:'bd1ebc61-e9a4-43f6-a347-f57c68862b1d',kty:'EC',use:'sig',
  x:'1s5iQgypBE3qNBeKmEmq12lKdAjm0y5ERJUW7Sl9g8k',
  y:'5ZX7mF8vWRyrXfZKH0aVANsaRpYlDkA4FmEQPk4rA1E'
}]};
function filtrarChaves(jwks){
  return Array.isArray(jwks?.keys)&&jwks.keys.length<=20
    ? jwks.keys.filter(k=>k&&k.kty==='EC'&&k.crv==='P-256'&&k.alg==='ES256'&&
      /^[A-Za-z0-9_-]{1,128}$/.test(k.kid||'')&&
      typeof k.x==='string'&&typeof k.y==='string'&&
      (!k.use||k.use==='sig')&&(!k.key_ops||k.key_ops.includes('verify')))
    : [];
}
function chavesLocais(origin,env){
  if(env?.SUPABASE_PUBLIC_JWKS){
    try{const local=filtrarChaves(JSON.parse(env.SUPABASE_PUBLIC_JWKS));
      if(local.length)return local;
    }catch{}
  }
  return origin===PINNED_ORIGIN?filtrarChaves(PINNED_JWKS):[];
}


function bytes(part) {
  if (!/^[A-Za-z0-9_-]{1,8192}$/.test(part) || part.length % 4 === 1) throw Error('JWT inválido');
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64 + '='.repeat((4 - b64.length % 4) % 4));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
function jsonPart(part) { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes(part))); }
function supabaseOrigin(env) {
  if (!env?.SUPABASE_URL) return null;
  const url = new URL(env.SUPABASE_URL);
  return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
    /^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname) ? url.origin : null;
}
async function publicKeys(origin, force = false, env = null) {
  const prev = jwksCache.get(origin);
  if (!force && prev?.keys && prev.until > Date.now()) return prev.keys;
  if (prev?.pending) return prev.pending;
  if (!force) {
    const local=chavesLocais(origin,env);
    if(local.length)return local;
  }
  const pending = (async () => {
    const response = await fetch(origin + '/auth/v1/.well-known/jwks.json', {
      method: 'GET', redirect: 'manual', headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(9000)
    });
    if (!response.ok) throw Error('JWKS indisponível');
    const body = await response.json();
    const keys=filtrarChaves(body);
    if (!keys.length) throw Error('Sem chave pública ES256');
    jwksCache.set(origin, { keys, until: Date.now() + JWKS_TTL_MS });
    return keys;
  })();
  jwksCache.set(origin, { ...prev, pending });
  try { return await pending; }
  catch (err) {
    const offline=chavesLocais(origin,env);
    if(offline.length)return offline;
    throw err;
  }
  finally {
    const current = jwksCache.get(origin);
    if (current?.pending === pending) jwksCache.set(origin, { ...current, pending: null });
  }
}

export async function autenticarUsuario(env, request) {
  const match = /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') || '');
  const jwt = match?.[1] || '';
  if (jwt.length < 40 || jwt.length > 4096) return null;
  const origin = supabaseOrigin(env);
  if (!origin) return null;
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  let header, claims, signature;
  try { header = jsonPart(parts[0]); claims = jsonPart(parts[1]); signature = bytes(parts[2]); }
  catch { return null; }
  if (header?.alg !== 'ES256' || !/^[A-Za-z0-9_-]{1,128}$/.test(header.kid || '') ||
      signature.length !== 64) return null;
  const now = Math.floor(Date.now() / 1000);
  const hasAudience = claims?.aud === 'authenticated' ||
    (Array.isArray(claims?.aud) && claims.aud.includes('authenticated'));
  if (claims?.iss !== origin + '/auth/v1' || !hasAudience || claims.role !== 'authenticated' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(claims.sub || '') ||
      !Number.isSafeInteger(claims.exp) || claims.exp <= now ||
      (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) || claims.nbf > now + 30)) ||
      (claims.iat !== undefined && (!Number.isSafeInteger(claims.iat) || claims.iat > now + 30))) return null;

  let keys = await publicKeys(origin,false,env);
  let candidate = keys.find(k => k.kid === header.kid);
  if (!candidate) {
    keys = await publicKeys(origin,true,env);
    candidate = keys.find(k => k.kid === header.kid);
  }
  if (!candidate) return null;
  const publicKey = await crypto.subtle.importKey('jwk', candidate,
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  const verified = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' },
    publicKey, signature, new TextEncoder().encode(parts[0] + '.' + parts[1]));
  return verified ? claims.sub : null;
}
