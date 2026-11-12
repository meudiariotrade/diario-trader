const fs=require('node:fs'),path=require('node:path'),acorn=require('acorn');
const root=path.resolve(__dirname,'../..');
function layer(file){
  const source=fs.readFileSync(path.join(root,'camadas-v560.js'),'utf8');
  for(const node of acorn.parse(source,{ecmaVersion:'latest'}).body){
    if(node.type==='TryStatement'&&source.slice(node.handler.start,node.handler.end).includes('falha em '+file))return source.slice(node.block.start+1,node.block.end-1);
  }
  throw new Error('Camada ausente: '+file);
}
function normalized(source){return JSON.parse(JSON.stringify(acorn.parse(source,{ecmaVersion:'latest'}),(key,value)=>['start','end','raw','shorthand'].includes(key)?undefined:value));}
module.exports={layer,normalized};
