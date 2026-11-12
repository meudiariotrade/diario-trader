const fs=require('node:fs'),path=require('node:path');
const {stripTypeScriptTypes}=require('node:module'),acorn=require('acorn');
const root=path.resolve(__dirname,'..'),inventory=JSON.parse(fs.readFileSync(path.join(root,'supabase/deployed-v562.json'),'utf8'));
const config=fs.readFileSync(path.join(root,'supabase/config.toml'),'utf8');let files=0;
for(const fn of inventory.functions){
  const dir=path.join(root,'supabase/functions',fn.name);
  if(!config.includes('[functions.'+fn.name+']\nverify_jwt = '+fn.verify_jwt))throw Error('Configuração de autenticação ausente: '+fn.name);
  for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.ts'))){
    const source=stripTypeScriptTypes(fs.readFileSync(path.join(dir,file),'utf8'),{mode:'transform'});
    const ast=acorn.parse(source,{ecmaVersion:'latest',sourceType:'module'});
    for(const node of ast.body)if(node.type==='ImportDeclaration'&&node.source.value.startsWith('.')&&!fs.existsSync(path.resolve(dir,node.source.value)))throw Error('Importação ausente em '+fn.name+': '+node.source.value);
    files++;
  }
}
console.log(inventory.functions.length+' funções e '+files+' arquivos TypeScript conferidos.');
