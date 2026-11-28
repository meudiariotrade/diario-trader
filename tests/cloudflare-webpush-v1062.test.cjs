'use strict';
// v1062: Web Push com Web Crypto (substitui npm:web-push quando as rotinas rodam no Worker).
const test = require('node:test'), assert = require('node:assert/strict');
const { webcrypto: { subtle } } = require('node:crypto');
const mod = () => import('../cloudflare/diario-radar/webpush-v1062.mjs');
const te = new TextEncoder(), td = new TextDecoder();

async function chavesVapid(m) {
  const k = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pub = new Uint8Array(await subtle.exportKey('raw', k.publicKey));
  const d = (await subtle.exportKey('jwk', k.privateKey)).d;
  return { pub: m.b64uEncode(pub), pri: d, verify: k.publicKey };
}
async function aparelho(m) {
  const k = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const pub = new Uint8Array(await subtle.exportKey('raw', k.publicKey));
  const auth = crypto.getRandomValues(new Uint8Array(16));
  return { k, p256dh: m.b64uEncode(pub), auth: m.b64uEncode(auth), pubRaw: pub, authRaw: auth };
}
async function hkdf(salt, ikm, info, n) {
  const k = await subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, n * 8));
}
const junta = (...p) => { const o = new Uint8Array(p.reduce((s, x) => s + x.length, 0)); let i = 0; for (const x of p) { o.set(x, i); i += x.length; } return o; };
// Lado do navegador (RFC 8291): decifra o corpo aes128gcm.
async function decifra(corpo, ua) {
  const salt = corpo.slice(0, 16), rs = new DataView(corpo.buffer, corpo.byteOffset).getUint32(16), idlen = corpo[20];
  const asPub = corpo.slice(21, 21 + idlen), cifrado = corpo.slice(21 + idlen);
  assert.equal(rs, 4096); assert.equal(idlen, 65);
  const asKey = await subtle.importKey('raw', asPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: asKey }, ua.k.privateKey, 256));
  const ikm = await hkdf(ua.authRaw, ecdh, junta(te.encode('WebPush: info\0'), ua.pubRaw, asPub), 32);
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const k = await subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']);
  const claro = new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: nonce }, k, cifrado));
  assert.equal(claro[claro.length - 1], 2, 'delimitador do último registro');
  return td.decode(claro.slice(0, -1));
}

test('v1062: payload criptografado é lido pelo aparelho (RFC 8291)', async () => {
  const m = await mod(), ua = await aparelho(m);
  const msg = JSON.stringify({ title: 'Petróleo ▲ +3,1%', body: 'Teste de acentuação e emoji 🧾' });
  const corpo = await m.encryptPayload(msg, ua.p256dh, ua.auth);
  assert.equal(await decifra(corpo, ua), msg);
});

test('v1062: sendNotification envia VAPID válido, TTL/Urgency e repassa 410 como statusCode', async () => {
  const m = await mod(), vap = await chavesVapid(m), ua = await aparelho(m);
  m.default.setVapidDetails('mailto:alertas@example.com', vap.pub, vap.pri);
  const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: ua.p256dh, auth: ua.auth } };
  const old = global.fetch; const chamadas = [];
  global.fetch = async (url, init) => { chamadas.push({ url, init }); return new Response('', { status: chamadas.length === 1 ? 201 : 410 }); };
  try {
    const r = await m.default.sendNotification(sub, '{"title":"oi"}', { TTL: 900, urgency: 'high' });
    assert.equal(r.statusCode, 201);
    const { url, init } = chamadas[0];
    assert.equal(url, sub.endpoint);
    assert.equal(init.headers.TTL, '900'); assert.equal(init.headers.Urgency, 'high');
    assert.equal(init.headers['Content-Encoding'], 'aes128gcm');
    assert.equal(await decifra(init.body, ua), '{"title":"oi"}');
    const [, tk, kk] = /^vapid t=([^,]+), k=(.+)$/.exec(init.headers.Authorization);
    assert.equal(kk, vap.pub);
    const [h, p, s] = tk.split('.');
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
    assert.equal(claims.aud, 'https://fcm.googleapis.com'); assert.equal(claims.sub, 'mailto:alertas@example.com');
    assert.ok(claims.exp > Date.now() / 1000 && claims.exp <= Date.now() / 1000 + 24 * 3600);
    assert.equal(JSON.parse(Buffer.from(h, 'base64url').toString()).alg, 'ES256');
    const ok = await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, vap.verify, Buffer.from(s, 'base64url'), te.encode(h + '.' + p));
    assert.equal(ok, true, 'assinatura ES256 confere com a chave pública VAPID');
    await assert.rejects(() => m.default.sendNotification(sub, 'x', { TTL: 60 }), (e) => e.statusCode === 410);
  } finally { global.fetch = old; }
});

test('v1062: recusa chaves VAPID inválidas e inscrição sem https', async () => {
  const m = await mod();
  assert.throws(() => m.setVapidDetails('alertas', 'x', 'y'), /subject/);
  assert.throws(() => m.setVapidDetails('mailto:a@b.c', m.b64uEncode(new Uint8Array(10)), m.b64uEncode(new Uint8Array(32))), /65 bytes/);
  await assert.rejects(() => m.sendNotification({ endpoint: 'http://x' }, 'a'), /https/);
});

test('v1062: confere byte a byte com o vetor oficial do RFC 8291 (Apêndice A)', async () => {
  const m = await mod();
  const asPub = m.b64uDecode('BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8');
  const jwk = { kty: 'EC', crv: 'P-256', x: m.b64uEncode(asPub.slice(1, 33)), y: m.b64uEncode(asPub.slice(33)), d: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw', ext: true };
  const privateKey = await subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const publicKey = await subtle.importKey('raw', asPub, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
  const corpo = await m.encryptPayload('When I grow up, I want to be a watermelon',
    'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', 'BTBZMqHH6r4Tts7J_aSIgg',
    { localKeys: { privateKey, publicKey }, salt: m.b64uDecode('DGv6ra1nlYgDCS1FRnbzlw') });
  assert.equal(m.b64uEncode(corpo), 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN');
});
