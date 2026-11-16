/* v657 · Estilos institucionais exclusivos do Laboratório de Economia em Estudos. */
;(function(){
'use strict';
if(document.getElementById('estudos-eco-style-v657'))return;
const css=[
'.eco-launch{display:block;max-width:100%;margin:9px 0 14px;min-height:44px;border:1px solid #5b431c;border-radius:4px;background:#181C26;padding:10px 12px;color:#e6bc60;text-align:left;cursor:pointer;font-size:13px}',
'.eco-root{--eco-bg:#0A0C10;--eco-panel:#11141B;--eco-hover:#181C26;--eco-line:#1E232E;--eco-gold:#D4A017;color:#dee4ed;margin:10px 0 40px;min-width:0;font-variant-numeric:tabular-nums}',
'.eco-root *{box-sizing:border-box}.eco-head{display:block;border-bottom:1px solid var(--eco-line);padding:14px 0 18px}',
'.eco-head small{font-size:10px;color:var(--eco-gold);letter-spacing:1.3px}.eco-head h2{font-size:23px;margin:6px 0;color:#f1f3f6}.eco-head p{font-size:13px;color:#a6b1bd;margin:0}',
'.eco-root nav.eco-nav{display:flex!important;gap:5px;padding:12px 0;border-bottom:1px solid var(--eco-line);flex-wrap:wrap}',
'.eco-nav>button{border:1px solid transparent;background:transparent;color:#b5bfcf;border-radius:4px;padding:8px 11px;min-height:44px;font-size:12px;cursor:pointer}',
'.eco-nav>button.on{border-color:#5b431c;background:var(--eco-hover);color:#e8bc57}.eco-nav>button:hover{background:var(--eco-hover)}',
'.eco-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px;min-width:0}',
'.eco-card{min-width:0;border-top:1px solid var(--eco-line);background:var(--eco-panel);padding:16px}',
'.eco-card h3{font-size:14px;line-height:1.5;margin:0 0 10px;text-align:left;color:#f0f3f6;font-weight:680}',
'.eco-note{margin:10px 0;font-size:12px;line-height:1.6;color:#b3bdcb}.eco-note b{color:#dfe4ec}',
'.eco-grid-stats{display:grid;grid-column:1/-1;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--eco-line);background:var(--eco-panel)}',
'.eco-kpi{min-width:0;padding:12px;border-right:1px solid var(--eco-line);border-bottom:1px solid var(--eco-line)}.eco-kpi small{color:#a6b0bf;display:block;font-size:11px}',
'.eco-kpi b{display:block;color:#f4f6f8;margin-top:6px;font-size:17px;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
'.eco-slider{display:block;margin:12px 0 18px}.eco-slider>span{display:flex;justify-content:space-between;gap:12px;font-size:12px}',
'.eco-slider output{white-space:nowrap;color:var(--eco-gold);font-weight:700;font-variant-numeric:tabular-nums}',
'.eco-slider input{display:block;width:100%;height:25px;margin-top:9px;accent-color:var(--eco-gold);cursor:pointer}',
'.eco-plot{display:block;width:100%;max-width:100%;height:auto;max-height:280px;min-width:0}',
'.eco-controls{display:flex;flex-wrap:wrap;align-items:end;gap:9px}.eco-controls label{flex:1 1 135px;min-width:0;font-size:11px;color:#b6bfcc}',
'.eco-controls select{display:block;width:100%;height:44px;padding:6px 10px;margin-top:4px;border:1px solid #313947;border-radius:4px;background:var(--eco-hover);color:#ebedf1;font-size:16px}',
'.eco-action{border:1px solid #76551b;background:#242218;color:#f1c45a;padding:10px 12px;min-height:44px;border-radius:4px;cursor:pointer}',
'.eco-action:disabled{opacity:.5;cursor:default}.eco-question{margin-top:18px;padding-top:10px;border-top:1px solid var(--eco-line)}',
'.eco-question small{color:#9daab9;font-size:11px}.eco-question h3{font-size:16px;line-height:1.55}',
'.eco-option{display:block;width:100%;background:#181C26;border:1px solid #303947;padding:12px 14px;text-align:left;border-radius:4px;color:#e3e8ef;min-height:44px;margin:7px 0;cursor:pointer}',
'.eco-option.certo{border-color:#10B981;color:#a6efd6}.eco-option.errado{border-color:#EF4444;color:#ffd0d0}',
'.eco-timeline{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));border-top:1px solid #2b3542}',
'.eco-timeline>button{display:flex;min-height:88px;gap:7px;flex-direction:column;align-items:start;text-align:left;background:transparent;border:0;border-left:1px solid #303947;color:#c2cbda;padding:12px;cursor:pointer}',
'.eco-timeline>button.on{background:var(--eco-hover)}.eco-timeline b{color:var(--eco-gold)}.eco-timeline span{font-size:12px}',
'.eco-ouro{color:#D4A017}.eco-verde{color:#10B981}',
'@media(max-width:760px){.eco-body{grid-template-columns:1fr}.eco-grid-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.eco-nav{flex-wrap:nowrap;overflow-x:auto;overscroll-behavior-x:contain}.eco-nav>button{flex:0 0 auto;white-space:nowrap}.eco-card{padding:12px}.eco-head h2{font-size:20px}}'
].join('\n');
const e=document.createElement('style');e.id='estudos-eco-style-v657';e.textContent=css;document.head.appendChild(e);
})();
