/* Mescla de campos do diário com relógios por campo e recuperação de conflitos. */
(function(root) {
  'use strict';
  const copy=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const ignored=new Set(['_fc','_conflicts','_resolved','u']);
  const safePath=p=>Array.isArray(p)&&p.length>0&&p.length<30&&p.every(k=>typeof k==='string'&&!['__proto__','prototype','constructor'].includes(k));
  let baseline=null, device='local';
  try {device=root.localStorage?.getItem('diario-device-v285')||('d'+Date.now().toString(36)+Math.random().toString(36).slice(2));root.localStorage?.setItem('diario-device-v285',device)}catch{}
  function leaves(value,path=[],out={}) {
    if(value&&typeof value==='object'&&!Array.isArray(value)) {
      Object.keys(value).forEach(k=>{if(!ignored.has(k)&&!['__proto__','prototype','constructor'].includes(k))leaves(value[k],path.concat(k),out)});
    }else if(path.length)out[JSON.stringify(path)]=copy(value);
    return out;
  }
  const clock=(day,key)=>{const c=day?._fc?.[key];return typeof c==='number'?{at:c,by:'legacy',base:0}:c&&typeof c==='object'?c:{at:day?.u||0,by:'legacy',base:0}};
  const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  function write(day,path,value,present=true) {
    if(!safePath(path))return;
    let node=day;for(const key of path.slice(0,-1)){if(!node[key]||typeof node[key]!=='object'||Array.isArray(node[key]))node[key]={};node=node[key]}
    if(present)node[path.at(-1)]=copy(value);else delete node[path.at(-1)];
  }
  const reset=days=>{for(const day of Object.values(days||{})){if(!day||typeof day!=='object')continue;for(const key of Object.keys(leaves(day)))if(!own(day._fc||{},key))(day._fc??={})[key]={at:day.u||0,by:'legacy',base:0}}baseline=copy(days||{})};
  function observe(days){if(baseline===null)reset(days)}
  function stamp(days,now=Date.now()) {
    const before=baseline||{};
    for(const [date,day] of Object.entries(days||{})) {
      const a=leaves(before[date]||{}),b=leaves(day),keys=new Set([...Object.keys(a),...Object.keys(b)]);
      for(const key of keys)if(!equal(a[key],b[key])||own(a,key)!==own(b,key)) {
        const previous=clock(before[date],key),at=Math.max(now,(previous.at||0)+1);
        (day._fc??={})[key]={at,by:device,base:previous.at||0,baseBy:previous.by,ancestors:[`${previous.at||0}|${previous.by}`,...(previous.ancestors||[])].slice(0,32)};day.u=Math.max(day.u||0,at);
      }
    }
    reset(days);
  }
  function mergeDay(a={},b={}) {
    const av=leaves(a),bv=leaves(b),out={u:Math.max(a.u||0,b.u||0),_fc:{}};
    out._resolved={...(a._resolved||{})};
    for(const [id,at] of Object.entries(b._resolved||{}))out._resolved[id]=Math.max(out._resolved[id]||0,+at||0);
    const conflicts=new Map([...(a._conflicts||[]),...(b._conflicts||[])].filter(x=>x&&x.id).map(x=>[x.id,copy(x)]));
    const keys=new Set([...Object.keys(av),...Object.keys(bv),...Object.keys(a._fc||{}),...Object.keys(b._fc||{})]);
    for(const key of keys) {
      let path;try{path=JSON.parse(key)}catch{continue}if(!safePath(path))continue;
      const ac=clock(a,key),bc=clock(b,key),ap=own(av,key),bp=own(bv,key);
      // Um campo ausente em um registro legado não apaga um campo existente.
      const aHas=ap||own(a._fc||{},key),bHas=bp||own(b._fc||{},key);
      const aWins=!bHas||(aHas&&((ac.at||0)>(bc.at||0)||((ac.at||0)===(bc.at||0)&&String(ac.by)>=String(bc.by))));
      const c=aWins?ac:bc;out._fc[key]=copy(c);write(out,path,aWins?av[key]:bv[key],aWins?ap:bp);
      if(aHas&&bHas&&(!equal(av[key],bv[key])||ap!==bp)) {
        const descends=(x,y)=>(x.base||0)===(y.at||0)&&(!x.baseBy||x.baseBy===y.by)||(x.ancestors||[]).includes(`${y.at||0}|${y.by}`);
        const descendant=descends(ac,bc)||descends(bc,ac);
        const concurrent=ac.by!==bc.by&&!descendant;
        const legacy=ac.by==='legacy'||bc.by==='legacy';
        if(!descendant&&(concurrent||legacy)) {
          const versions=[{value:copy(av[key]),present:ap,at:ac.at||0,by:ac.by},{value:copy(bv[key]),present:bp,at:bc.at||0,by:bc.by}].sort((x,y)=>x.at-y.at||String(x.by).localeCompare(String(y.by)));
          const id=JSON.stringify([path,...versions.map(x=>[x.at,x.by,x.value,x.present])]);
          conflicts.set(id,{id,path,versions});
        }
      }
    }
    out._conflicts=[...conflicts.values()].filter(x=>!out._resolved[x.id]);
    return out;
  }
  function mergeDays(local={},remote={}) {
    const out={};for(const date of new Set([...Object.keys(local),...Object.keys(remote)])) {
      if(!local[date])out[date]=copy(remote[date]);else if(!remote[date])out[date]=copy(local[date]);else out[date]=mergeDay(local[date],remote[date]);
    }
    reset(out);return out;
  }
  function resolve(day,id,index) {
    const conflict=(day._conflicts||[]).find(x=>x.id===id),version=conflict?.versions[index];
    if(!conflict||!version)return false;
    write(day,conflict.path,version.value,version.present);
    (day._resolved??={})[id]=Date.now();day._conflicts=day._conflicts.filter(x=>x.id!==id);return true;
  }
  root.DiarioDados={observe,reset,stamp,mergeDays,resolve};
})(typeof window==='undefined'?globalThis:window);
