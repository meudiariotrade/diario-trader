// A publicação atual já contém bundles gerados. Empacota-os sem tentar regenerar fontes históricos.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
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
  const html = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
  const scripts = [...html.window.document.querySelectorAll('script[src]')].map(e => e.getAttribute('src'));
  if (new Set(scripts.map(src => src.split(/[?#]/)[0])).size !== scripts.length) throw new Error('Script duplicado no index.html.');
  const references = [...html.window.document.querySelectorAll('script[src],link[href],img[src]')]
    .map(e => e.getAttribute('src') || e.getAttribute('href'));
  references.forEach(localFile);
  html.window.close();
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  for (const key of ['CORE', 'EXTRA']) {
    const match = sw.match(new RegExp('const ' + key + '=(\\[[^;]+\\]);'));
    if (!match) throw new Error('Lista de cache não encontrada: ' + key);
    const entries = JSON.parse(match[1]);
    if (new Set(entries).size !== entries.length) throw new Error('Recurso duplicado no cache: ' + key);
    entries.forEach(localFile);
    if (key === 'CORE') for (const src of scripts.map(s => s.split('?')[0])) {
      if (!entries.includes(src)) throw new Error('Script de entrada fora do cache essencial: ' + src);
    }
  }
  const files = fs.readdirSync(root).filter(f => asset.test(f));
  for (const file of files.filter(f => f.endsWith('.js'))) {
    new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
  }
  return files;
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
  console.log(`Publicação preparada: ${files.length} arquivos estáticos em _site/.`);
}
module.exports = { validate, build, localFile };
if (require.main === module) {
  if (process.argv.includes('--check')) console.log(`Recursos e sintaxe válidos: ${validate().length} arquivos estáticos.`);
  else build();
}
