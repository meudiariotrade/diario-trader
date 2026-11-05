/* iOS v385: keyboard-safe mobile dock. No polling and no market data access. */
(function(){'use strict';
 if(!window.document||!document.body)return;
 const vv=window.visualViewport;
 const focusable=()=>{const a=document.activeElement;return !!a&&!!a.matches&&a.matches('input,textarea,[contenteditable="true"]')};
 function sync(){const keyboard=!!vv&&focusable()&&vv.height<window.innerHeight*0.78;
  document.body.classList.toggle('dt384-keyboard-open',keyboard);
 }
 document.addEventListener('focusin',sync,{passive:true});
 document.addEventListener('focusout',sync,{passive:true});
 window.addEventListener('resize',sync,{passive:true});
 vv?.addEventListener('resize',sync,{passive:true});
 vv?.addEventListener('scroll',sync,{passive:true});
 sync();
})();
