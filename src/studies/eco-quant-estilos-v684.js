/* v684 · Complementos visuais apenas do Laboratório quantitativo/ABNT. */
;(function(){
'use strict';
if(document.getElementById('eco-quant-style-v684'))return;
const css=[
'.eco-root .eco-body>.eco-card:has(.eco-qweights),.eco-root .eco-body>.eco-card:has(.eco-q-plot),.eco-root .eco-body>.eco-card:has(.eco-qresults){grid-column:1/-1}',
'.eco-qweights,.eco-qform{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px 12px;min-width:0}',
'.eco-qweights label,.eco-qform label{min-width:0;overflow-wrap:normal}',
'.eco-qline{border-top:1px solid #1E232E;display:flex;justify-content:space-between;gap:12px;align-items:center;padding:9px 0;font-size:12px;color:#a9b4c2}',
'.eco-qline b{color:#E8EAF0;white-space:nowrap;font-variant-numeric:tabular-nums}',
'.eco-q-plot{width:100%;max-height:320px;margin:14px 0 8px}',
'.eco-qscroll{max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;margin-top:12px}',
'.eco-qtable{border-collapse:collapse;width:100%;min-width:510px;font-size:11px;font-variant-numeric:tabular-nums}',
'.eco-qtable caption,.eco-abnt-table figcaption{text-align:left;color:#aeb8c7;padding:8px 0;font-size:11px}',
'.eco-qtable td,.eco-qtable th{padding:8px 10px;border-bottom:1px solid #1E232E;text-align:right;white-space:nowrap}',
'.eco-qtable th:first-child,.eco-qtable td:first-child{text-align:left}',
'.eco-qtable th{color:#D4A017;font-weight:700}',
'.eco-qresults{border-top:1px solid #1E232E;margin:16px 0;padding-top:12px;min-width:0}',
'.eco-qresults h4{color:#D4A017;font-size:12px;margin:9px 0 4px}',
'.eco-qresults p{overflow-wrap:anywhere;font-size:12px;line-height:1.7}',
'.eco-abnt-paper{background:#f9faf8;color:#171b20;max-width:880px;padding:24px 30px;font:12pt/1.5 "Times New Roman",serif;overflow-wrap:anywhere}',
'.eco-abnt-paper header{text-align:center;padding:12px 0 32px;border:0}',
'.eco-abnt-paper h2{color:#171b20!important;font-size:17pt;text-transform:uppercase;margin:30px 0}',
'.eco-abnt-paper h3{color:#171b20;font-size:13pt;margin:26px 0 12px;text-transform:uppercase}',
'.eco-abnt-paper p{color:#171b20;text-align:justify}',
'.eco-abnt-paper .eco-abnt-text{white-space:pre-wrap;text-align:justify;text-indent:1.25cm}',
'.eco-abnt-paper footer,.eco-abnt-table small{display:block;color:#484d54;font-size:10pt;margin-top:15px}',
'.eco-abnt-table table{border-collapse:collapse;width:100%;font-size:10pt;color:#171b20}',
'.eco-abnt-table th,.eco-abnt-table td{padding:5px;border-bottom:1px solid #888;text-align:left}',
'.eco-abnt-table figcaption{color:#171b20;font-size:10pt}',
'.eco-root [data-eco-btn="abntExport"],.eco-root [data-eco-btn="abntPrint"],.eco-root [data-eco-btn="abntCopy"],.eco-root [data-eco-btn="abntSeries"],.eco-root [data-eco-btn="abntCSV"]{min-height:44px;padding:8px 11px;color:#dae0e9;background:#181C26;border:1px solid #303948;border-radius:4px}',
'@media(max-width:760px){.eco-qweights,.eco-qform{grid-template-columns:repeat(2,minmax(0,1fr))}.eco-abnt-paper{padding:14px;font-size:11pt}.eco-abnt-paper h2{font-size:14pt}}',
'@media(max-width:380px){.eco-qweights,.eco-qform{grid-template-columns:1fr}}',
'@media print{@page{size:A4;margin:3cm 2cm 2cm 3cm}body:has(.eco-abnt-paper) *{visibility:hidden!important}body:has(.eco-abnt-paper) .eco-abnt-paper,body:has(.eco-abnt-paper) .eco-abnt-paper *{visibility:visible!important}body:has(.eco-abnt-paper) .eco-abnt-paper{position:absolute;top:0;left:0;width:100%;max-width:none;border:0;background:white;padding:0;margin:0;font-size:12pt;color:#111}body:has(.eco-abnt-paper) .eco-abnt-table{break-inside:avoid}}'
].join('\n');
const style=document.createElement('style');style.id='eco-quant-style-v684';style.textContent=css;document.head.appendChild(style);
})();
