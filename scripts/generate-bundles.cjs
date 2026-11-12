const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { minify } = require('terser');
const root = path.resolve(__dirname,'..');
const config = JSON.parse(fs.readFileSync(path.join(root,'release.config.json'),'utf8'));
async function generate(check = false) {
  const outputs = {};
  for(const [output,inputs] of Object.entries(config.sources||{})) {
    const source=inputs.map(input=>fs.readFileSync(path.join(root,input),'utf8')).join('');
    if(check&&fs.readFileSync(path.join(root,output),'utf8')!==source)throw new Error('Agregado desatualizado: '+output);
    if(!check)fs.writeFileSync(path.join(root,output),source);
  }
  for (const [output,input] of Object.entries(config.bundles)) {
    const source = fs.readFileSync(path.join(root,input),'utf8');
    const digest = crypto.createHash('sha256').update(source).digest('hex');
    const resolved = source.replaceAll('__APP_VERSION__',String(config.version));
    const result = output.endsWith('.js') ? (await minify(resolved,{ compress:false,mangle:false,format:{comments:false} })).code : resolved;
    outputs[output] = '/* Gerado de ' + input + ' · SHA256 ' + digest + ' */\n' + result.replace(/\n+$/,'') + '\n';
  }
  outputs['version.js'] = 'window.DIARIO_RELEASE=Object.freeze(' + JSON.stringify({version:config.version,label:'v'+config.version,base:config.base}) + ');\n';
  for (const [output,input] of Object.entries(config.templates || {})) outputs[output] = fs.readFileSync(path.join(root,input),'utf8').replaceAll('__APP_VERSION__',String(config.version));
  outputs['deploy.txt']='v'+config.version+'\n';
  for(const file of ['package.json','package-lock.json']) {
    const json=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
    json.version=config.version+'.0.0'; if(json.packages?.[''])json.packages[''].version=json.version;
    outputs[file]=JSON.stringify(json,null,2)+'\n';
  }
  for (const [output,content] of Object.entries(outputs)) {
    const filename = path.join(root,output);
    if (check) { if (!fs.existsSync(filename) || fs.readFileSync(filename,'utf8') !== content) throw new Error('Bundle desatualizado: '+output+'. Execute npm run bundle.'); }
    else fs.writeFileSync(filename,content);
  }
  return Object.keys(outputs);
}
module.exports={generate};
if(require.main===module) generate(process.argv.includes('--check')).then(files=>console.log('Bundles '+(process.argv.includes('--check')?'conferidos':'gerados')+': '+files.join(', '))).catch(e=>{console.error(e.message);process.exitCode=1});
