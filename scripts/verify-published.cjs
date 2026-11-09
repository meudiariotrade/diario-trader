// Só confirma uma entrega quando o site público serve o commit e os arquivos esperados.
const { createHash } = require('node:crypto');
async function verifyPublished(base, commit, request = fetch) {
  if (!/^https?:\/\//.test(base) || !/^[a-f0-9]{40}$/.test(commit || '')) throw new Error('URL ou commit da publicação inválido.');
  const root = base.endsWith('/') ? base : base + '/';
  const read = async file => {
    const url = new URL(file, root); url.searchParams.set('verificar', commit + '-' + Date.now());
    const response = await request(url.href, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(file + ': HTTP ' + response.status);
    return Buffer.from(await response.arrayBuffer());
  };
  const manifest = JSON.parse((await read('publicacao.json')).toString('utf8'));
  if (manifest.commit !== commit) throw new Error('O site ainda entrega outro commit.');
  const mandatory = ['index.html', 'sw.js', 'nucleo-v522.js', 'camadas-v522.js', 'navegacao-simples.js', 'navegacao-simples.css'];
  for (const file of mandatory) {
    const expected = manifest.files?.[file];
    if (!/^[a-f0-9]{64}$/.test(expected || '')) throw new Error('Hash ausente: ' + file);
    const hash = createHash('sha256').update(await read(file)).digest('hex');
    if (hash !== expected) throw new Error('Arquivo público divergente: ' + file);
  }
  return commit;
}
module.exports = { verifyPublished };
if (require.main === module) {
  (async () => {
    for (let attempt = 1; attempt <= 6; attempt++) {
      try { return await verifyPublished(process.env.PAGES_URL, process.env.GITHUB_SHA); }
      catch (error) {
        if (attempt === 6) throw error;
        console.log('Site ainda não corresponde à entrega: ' + error.message);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  })().then(commit => console.log('Publicação pública confirmada: ' + commit))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
