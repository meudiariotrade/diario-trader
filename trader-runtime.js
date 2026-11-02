/* Inicialização: armazenamento de demonstração isolado e rede bloqueada no demo. */
(function(root){
  'use strict';
  const demo=new URLSearchParams(root.location?.search||'').get('demo')==='1';root.DIARIO_DEMO=demo;
  let nativeStorage;try{nativeStorage=root.localStorage}catch{}
  if(!demo){root.CLOUD_OK=1;root.APP_STORAGE=nativeStorage||{getItem:()=>null,setItem(){},removeItem(){}};root.APP_DEMO_READY=Promise.resolve();return}
  const prefix='diario-demo-v286:',memory=new Map;
  root.APP_STORAGE={
    getItem(key){try{return nativeStorage?.getItem(prefix+key)??memory.get(key)??null}catch{return memory.get(key)??null}},
    setItem(key,value){memory.set(key,String(value));try{nativeStorage?.setItem(prefix+key,String(value))}catch{}},
    removeItem(key){memory.delete(key);try{nativeStorage?.removeItem(prefix+key)}catch{}},
    clear(){for(const key of Object.keys(nativeStorage||{}))if(key.startsWith(prefix))nativeStorage.removeItem(key);memory.clear()}
  };
  root.CLOUD_OK=0;
  const nativeFetch=root.fetch.bind(root);
  root.fetch=(input,options={})=>{
    const url=new URL(typeof input==='string'?input:input.url,root.location.href),method=String(options.method||input?.method||'GET').toUpperCase();
    if(method==='GET'&&url.origin===root.location.origin&&/\.(js|css|ttf|otf|png|jpe?g|svg|webmanifest)$/.test(url.pathname))return nativeFetch(input,options);
    return Promise.reject(new Error('Modo demonstrativo: consultas externas e alterações na conta estão desativadas.'));
  };
  const policy=document.createElement('meta');policy.httpEquiv='Content-Security-Policy';
  policy.content="connect-src 'self'; frame-src 'none'; script-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; form-action 'none'";document.head.append(policy);
  const localDay=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const now=new Date(),date=localDay(now),previous=new Date(now);previous.setDate(previous.getDate()-2);const older=localDay(previous);
  const fixture={seed:1,mt:Date.now(),trades:[
    {id:'demo-trade-1',tipo:'D',ativo:'WIN · DEMO',side:'C',dt:older+'T10:00',dtx:older+'T10:30',entry:100000,stop:99900,exit:100200,qty:1,pt:0.2,cost:0,setup:'Rompimento demonstrativo',rules:'s',err:'Nenhum'},
    {id:'demo-trade-2',tipo:'D',ativo:'WIN · DEMO',side:'C',dt:date+'T10:00',dtx:date+'T10:20',entry:100000,stop:99900,exit:99900,qty:1,pt:0.2,cost:0,setup:'Exemplo de operação',rules:'n',err:'Não segui minha rotina'}],
    rules:[{id:'demo-rule-1',cat:0,t:'Ler o plano antes de operar',u:1},{id:'demo-rule-2',cat:1,t:'Definir o risco e a invalidação',u:1}],
    days:{[date]:{chk:{'demo-rule-1':true},plano:'DADOS FICTÍCIOS. Teste o diário, os modelos e o checklist sem alterar seus registros reais.',resumo:'',aprend:'',u:Date.now()},[older]:{chk:{'demo-rule-1':true,'demo-rule-2':true},resumo:'Sessão fictícia usada para explorar a revisão semanal.',aprend:'Registrar a decisão ajuda a revisar o processo.',u:1}},ax:{},del:{},books:[]};
  root.APP_DEMO_READY=new Promise(resolve=>{
    try{
      const request=root.indexedDB.open('diario-trader-demo-v286',1);
      request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('kv'))db.createObjectStore('kv');if(!db.objectStoreNames.contains('img'))db.createObjectStore('img')};
      request.onerror=()=>resolve();request.onsuccess=()=>{
        const db=request.result,tx=db.transaction('kv','readwrite'),store=tx.objectStore('kv'),read=store.get('s');
        read.onsuccess=()=>{if(!read.result)store.put(fixture,'s')};tx.oncomplete=()=>{db.close();resolve()};tx.onabort=()=>{db.close();resolve()};
      };
    }catch{resolve()}
  });
})(typeof window==='undefined'?globalThis:window);
