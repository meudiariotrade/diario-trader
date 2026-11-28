/**
 * v1062 — Web Push com Web Crypto (RFC 8291 aes128gcm + VAPID RFC 8292), sem APIs do Node.
 * Substitui `npm:web-push@3.6.7` quando as funções do Supabase rodam no Worker (alias no wrangler.jsonc).
 * Mesma interface usada pelo código: setVapidDetails(subject, public, private) e
 * sendNotification(subscription, payload, {TTL, urgency, topic}); em erro HTTP lança WebPushError
 * com `statusCode` (404/410 = inscrição vencida, o chamador apaga).
 */
const te = new TextEncoder();

export function b64uDecode(s) {
  const t = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export function b64uEncode(buf) {
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function concat(...partes) {
  const n = partes.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of partes) { out.set(p, o); o += p.length; }
  return out;
}
async function hkdf(salt, ikm, info, bytes) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, bytes * 8));
}

export class WebPushError extends Error {
  constructor(message, statusCode, headers, body, endpoint) {
    super(message);
    this.name = 'WebPushError';
    this.statusCode = statusCode;
    this.headers = headers;
    this.body = body;
    this.endpoint = endpoint;
  }
}

let vapid = null;
let chaveAssinatura = null;

export function setVapidDetails(subject, publicKey, privateKey) {
  const s = String(subject || '');
  if (!/^(mailto:|https:\/\/)/i.test(s)) throw new Error('VAPID subject deve começar com mailto: ou https://');
  const pub = b64uDecode(publicKey), pri = b64uDecode(privateKey);
  if (pub.length !== 65 || pub[0] !== 4) throw new Error('VAPID public key deve ter 65 bytes (P-256 não comprimida).');
  if (pri.length !== 32) throw new Error('VAPID private key deve ter 32 bytes.');
  vapid = { subject: s, publicKey: String(publicKey), pub, pri };
  chaveAssinatura = null;
}

async function chavePrivadaVapid() {
  if (chaveAssinatura) return chaveAssinatura;
  const { pub, pri } = vapid;
  const jwk = { kty: 'EC', crv: 'P-256', x: b64uEncode(pub.slice(1, 33)), y: b64uEncode(pub.slice(33, 65)), d: b64uEncode(pri), ext: true };
  chaveAssinatura = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  return chaveAssinatura;
}

/** JWT ES256 do VAPID para a origem do endpoint (validade de 12 h). */
export async function vapidJwt(endpoint, agoraSeg = Math.floor(Date.now() / 1000)) {
  if (!vapid) throw new Error('Chame setVapidDetails antes de enviar.');
  const aud = new URL(endpoint).origin;
  const cab = b64uEncode(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const corpo = b64uEncode(te.encode(JSON.stringify({ aud, exp: agoraSeg + 12 * 3600, sub: vapid.subject })));
  const dados = cab + '.' + corpo;
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, await chavePrivadaVapid(), te.encode(dados));
  return dados + '.' + b64uEncode(sig);
}

/** Criptografa o payload no formato aes128gcm (um registro). */
export async function encryptPayload(payload, p256dh, auth, opcoes = {}) {
  const uaPub = b64uDecode(p256dh), authSecret = b64uDecode(auth);
  if (uaPub.length !== 65 || authSecret.length < 16) throw new Error('Inscrição de push com chaves inválidas.');
  const local = opcoes.localKeys || await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', local.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, local.privateKey, 256));
  const ikm = await hkdf(authSecret, ecdh, concat(te.encode('WebPush: info\0'), uaPub, asPub), 32);
  const salt = opcoes.salt || crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const texto = typeof payload === 'string' ? te.encode(payload) : new Uint8Array(payload || []);
  const claro = concat(texto, new Uint8Array([2]));
  const k = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, k, claro));
  const rs = 4096;
  const cab = new Uint8Array(16 + 4 + 1 + asPub.length);
  cab.set(salt, 0);
  new DataView(cab.buffer).setUint32(16, rs);
  cab[20] = asPub.length;
  cab.set(asPub, 21);
  return concat(cab, cifrado);
}

export async function sendNotification(subscription, payload, options = {}) {
  const endpoint = String(subscription?.endpoint || '');
  if (!/^https:\/\//.test(endpoint)) throw new Error('Inscrição de push sem endpoint https.');
  const ttl = Number.isFinite(Number(options.TTL)) ? Math.max(0, Math.floor(Number(options.TTL))) : 2419200;
  const headers = {
    TTL: String(ttl),
    Authorization: 'vapid t=' + await vapidJwt(endpoint) + ', k=' + vapid.publicKey,
  };
  if (options.urgency && /^(very-low|low|normal|high)$/.test(options.urgency)) headers.Urgency = options.urgency;
  if (options.topic) headers.Topic = String(options.topic).slice(0, 32);
  let body;
  if (payload != null && payload !== '') {
    const k = subscription?.keys || {};
    body = await encryptPayload(payload, k.p256dh, k.auth);
    headers['Content-Type'] = 'application/octet-stream';
    headers['Content-Encoding'] = 'aes128gcm';
  } else headers['Content-Length'] = '0';
  const r = await fetch(endpoint, { method: 'POST', headers, body, signal: AbortSignal.timeout(15000) });
  const texto = await r.text().catch(() => '');
  if (r.status < 200 || r.status > 299)
    throw new WebPushError('Received unexpected response code', r.status, Object.fromEntries(r.headers), texto, endpoint);
  return { statusCode: r.status, body: texto, headers: Object.fromEntries(r.headers) };
}

export function generateVAPIDKeys() {
  throw new Error('Geração de chaves VAPID não é feita no Worker.');
}

const webpush = { setVapidDetails, sendNotification, generateVAPIDKeys, WebPushError };
export default webpush;
