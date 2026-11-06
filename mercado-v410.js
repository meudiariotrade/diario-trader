/* v412 — Uma única transação de layout no Mercado, sem saltos pós-paint. */
(()=>{'use strict';
 const d=document;
 const market=()=>{try{return tab==='mercado'}catch{return false}};
 const bar=()=>d.querySelector('#app .dt395-native-mercado .m403-primary-tabs');
 let last=null;
 if(window.TraderUI?.onRender){
  window.TraderUI.onRender('mercado-v410',{
   before(){
    if(!market())return null;
    const app=d.getElementById('app'),nav=bar();
    if(!app||!nav)return null;
    const rect=nav.getBoundingClientRect();
    const snap={y:window.scrollY,navTop:rect.top,app,previousMin:app.style.minHeight};
    // A nova subpágina pode ser mais curta; preserve o espaço anterior enquanto
    // os componentes são recriados, evitando que o Safari compacte o scroll.
    app.style.minHeight=Math.max(app.offsetHeight,window.innerHeight)+'px';
    return snap;
   },
   after(snap){
    if(!snap)return;
    const next=bar();
    if(next){
     const delta=next.getBoundingClientRect().top-snap.navTop;
     const target=Math.max(0,snap.y+delta);
     if(Math.abs(window.scrollY-target)>1)window.scrollTo({top:target,behavior:'instant'});
    }
    snap.app.style.minHeight=snap.previousMin;
   }
  });
 }
 window.MercadoNavegacao410={version:'v412',get pending(){return false}};
})();
