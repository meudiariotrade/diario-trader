// Manifesto público autoral: nenhuma conta, sessão ou conteúdo privado dos livros.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function manifest(){
 const ctx={window:{}};vm.createContext(ctx);
 for(const file of ['conteudo','graficos'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/studies/tecnica-'+file+'.js'),'utf8'),ctx);
 const t=ctx.window.TecnicaPratica;
 return JSON.parse(JSON.stringify({schema:1,revision:'tecnica-v1',title:'Análise Técnica na Prática',lessons:t.lessons.map((l,i)=>({id:'tecnica-v1-'+l.id,slug:l.id,numero:i+1,title:l.title,summary:l.summary,reference:t.modules.find(m=>m.id===l.module).reference,stages:l.stages.map((text,j)=>({title:['Contexto','Gatilho de Entrada','Stop Técnico','Alvo Projetado'][j],text,svg:t.chart(l,j)}))}))}));
}
function write(){const dest=path.join(__dirname,'../public/tecnica-trilha.json');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(manifest()));}
module.exports={manifest,write};if(require.main===module)write();
