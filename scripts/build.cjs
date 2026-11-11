// A publicação atual já contém bundles gerados. Empacota-os sem tentar regenerar fontes históricos.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
const asset = /\.(html|js|css|png|jpe?g|webp|gif|svg|ico|ttf|otf|woff2?|wasm|webmanifest|mp3|mp4|wav|pdf)$/i;

function localFile(value) {
  if (/^(?:https?:|data:|blob:|#)/i.test(value)) return null;
  const relative = decodeURIComponent(value.split(/[?#]/)[0]).replace(/^\.\//, '');
  const filename = path.resolve(root, relative);
  if (!filename.startsWith(root + path.sep) || !fs.statSync(filename, { throwIfNoEntry: false })?.isFile()) {
    throw new Error('Recurso local ausente ou inválido: ' + value);
  }
  return relative;
}
function validate() {
  const required = new Set();
  const html = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
  const scripts = [...html.window.document.querySelectorAll('script[src]')].map(e => e.getAttribute('src'));
  if (new Set(scripts.map(src => src.split(/[?#]/)[0])).size !== scripts.length) throw new Error('Script duplicado no index.html.');
  const references = [...html.window.document.querySelectorAll('script[src],link[href],img[src]')]
    .map(e => e.getAttribute('src') || e.getAttribute('href'));
  references.forEach(ref => { const file = localFile(ref); if (file) required.add(file); });
  html.window.close();
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  for (const key of ['CORE', 'EXTRA']) {
    const match = sw.match(new RegExp('const ' + key + '=(\\[[^;]+\\]);'));
    if (!match) throw new Error('Lista de cache não encontrada: ' + key);
    const entries = JSON.parse(match[1]);
    if (new Set(entries).size !== entries.length) throw new Error('Recurso duplicado no cache: ' + key);
    entries.forEach(ref => { const file = localFile(ref); if (file) required.add(file); });
    if (key === 'CORE') for (const src of scripts.map(s => s.split('?')[0])) {
      if (!entries.includes(src)) throw new Error('Script de entrada fora do cache essencial: ' + src);
    }
  }
  // Histórico permanece no repositório. Publica bundles antigos apenas se forem referenciados.
  const files = publicationFiles(fs.readdirSync(root).filter(f => asset.test(f)), required);
  for (const file of files.filter(f => f.endsWith('.js'))) {
    new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
  }
  return files;
}
function publicationFiles(files, required) {
  return files.filter(file => !/^(?:nucleo|camadas|estilo)-v\d+\.(?:js|css)$/.test(file) || required.has(file));
}
function build() {
  const files = validate();
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output);
  for (const file of files) fs.copyFileSync(path.join(root, file), path.join(output, file));
  for (const file of fs.readdirSync(root).filter(f => /^LICENSE.*\.txt$/.test(f) || f === 'CNAME')) {
    fs.copyFileSync(path.join(root, file), path.join(output, file));
  }
  fs.writeFileSync(path.join(output, '.nojekyll'), '');
  const critical = ['index.html', 'sw.js', 'nucleo-v560.js', 'camadas-v560.js', 'estilo-v560.css', 'capa-v560.js', 'navegacao-simples.js','terminal-inicio.js','terminal-comandos.js','projeto-2027.js','aulas-recuperacao.js'];
  const hashes = Object.fromEntries(critical.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(output, file))).digest('hex')]));
  fs.writeFileSync(path.join(output, 'publicacao.json'), JSON.stringify({ commit: process.env.GITHUB_SHA || null, files: hashes }));
  console.log(`Publicação preparada: ${files.length} arquivos estáticos em _site/.`);
}
module.exports = { validate, build, localFile, publicationFiles };
if (require.main === module) {
  if (process.argv.includes('--check')) console.log(`Recursos e sintaxe válidos: ${validate().length} arquivos estáticos.`);
  else build();
}
