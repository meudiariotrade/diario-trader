// Empacota exclusivamente os bundles conferidos contra as fontes da versão atual.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const acorn = require('acorn');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
const asset = /\.(html|js|css|png|jpe?g|webp|gif|svg|ico|ttf|otf|woff2?|wasm|webmanifest|mp3|mp4|wav|pdf)$/i;
function assetFiles(directory = 'assets') {
  const absolute = path.join(root,directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute,{withFileTypes:true}).flatMap(e => e.isDirectory() ? assetFiles(directory+'/'+e.name) : e.isFile() && asset.test(e.name) ? [directory+'/'+e.name] : []);
}

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
  for (const legacy of ['app.js', 'inicio.js', 'interface.js']) {
    if (fs.existsSync(path.join(root, legacy))) throw new Error('Entrada obsoleta restaurada: ' + legacy + '. Edite as fontes em src/.');
  }
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
  const files = reachableFiles(required).files;
  for (const file of files.filter(f => f.endsWith('.js'))) {
    new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
  }
  return files;
}
function reachableFiles(required=new Set()) {
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'publication.manifest.json'),'utf8'));
  const release=JSON.parse(fs.readFileSync(path.join(root,'release.config.json'),'utf8'));
  const reasons=new Map(),files=new Set(),candidates=fs.readdirSync(root).filter(f=>asset.test(f));
  function add(file,reason){localFile(file);if(!files.has(file)){files.add(file);reasons.set(file,reason)}}
  for(const file of manifest.entries)add(file,'Entrada oficial');
  for(const file of required)add(file,'HTML ou cache offline');
  for(const [file,reason]of Object.entries(manifest.dynamic))add(file,reason);
  for(const file of [...release.coreExtra,...release.lazy])add(file,'Recurso dinâmico declarado na versão');
  for(const [directory,reason]of Object.entries(manifest.directories))for(const file of assetFiles(directory))add(file,reason);
  const inspected=new Set();
  while([...files].some(file=>!inspected.has(file))){
    for(const file of [...files]){
      if(inspected.has(file))continue;inspected.add(file);if(!/\.(?:js|css|html|webmanifest)$/.test(file))continue;
      const text=fs.readFileSync(path.join(root,file),'utf8'),strings=[];
      function walk(node){if(!node||typeof node!=='object')return;if(node.type==='Literal'&&typeof node.value==='string')strings.push(node.value);if(node.type==='TemplateElement')strings.push(node.value.cooked||'');for(const [key,value]of Object.entries(node)){if(key==='value'&&node.type==='Literal')continue;if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value)}}
      if(file.endsWith('.js'))walk(acorn.parse(text,{ecmaVersion:'latest'}));else strings.push(text);
      for(const candidate of candidates){if(files.has(candidate))continue;const escaped=candidate.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const embedded=new RegExp('(?:url\\(\\s*[\\\'"]?|(?:src|href)=[\\\'"])'+escaped+'(?:[?\\\'"#)]|$)');if(strings.some(value=>value.split(/[?#]/)[0].replace(/^\.\//,'')===candidate||embedded.test(value)))add(candidate,'Referenciado por '+file)}
    }
  }
  return {files:[...files],reasons:Object.fromEntries(reasons)};
}
function publicationFiles(files, required) {
  return files.filter(file => !/^(?:nucleo|camadas|estilo)-v\d+\.(?:js|css)$/.test(file) || required.has(file));
}
function build() {
  const files = validate();
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output);
  for (const file of files) { fs.mkdirSync(path.dirname(path.join(output,file)),{recursive:true}); fs.copyFileSync(path.join(root, file), path.join(output, file)); }
  for (const file of fs.readdirSync(root).filter(f => /^LICENSE.*\.txt$/.test(f) || f === 'CNAME')) {
    fs.copyFileSync(path.join(root, file), path.join(output, file));
  }
  fs.writeFileSync(path.join(output, '.nojekyll'), '');
  const critical = ['index.html', 'sw.js', 'nucleo-v560.js', 'camadas-v560.js', 'estilo-v560.css', 'capa-v560.js', 'navegacao-simples.js','terminal-inicio.js','terminal-comandos.js','projeto-2027.js','aulas-recuperacao.js','version.js','sync-recovery.js','chunks.js','pdf-documentos.js'];
  const hashes = Object.fromEntries(critical.map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(output, file))).digest('hex')]));
  const release = JSON.parse(fs.readFileSync(path.join(root,'release.config.json'),'utf8'));
  fs.writeFileSync(path.join(output, 'publicacao.json'), JSON.stringify({ version:release.version, base:release.base, commit: process.env.GITHUB_SHA || null, files: hashes }));
  fs.writeFileSync(path.join(output,'recursos.json'),JSON.stringify(reachableFiles().reasons,null,2));
  console.log(`Publicação preparada: ${files.length} arquivos estáticos em _site/.`);
}
module.exports = { validate, build, localFile, publicationFiles, reachableFiles };
if (require.main === module) {
  if (process.argv.includes('--check')) console.log(`Recursos e sintaxe válidos: ${validate().length} arquivos estáticos.`);
  else build();
}
