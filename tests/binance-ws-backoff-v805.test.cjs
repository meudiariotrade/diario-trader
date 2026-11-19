'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

function setup({demo=false,hidden=false,online=true}={}){
  const source=fs.readFileSync('src/domains/core/17-fontes-e-balancos.js','utf8');
  const marker=source.indexOf('No modo demonstração nunca abrir rede externa');
  assert.ok(marker>0,'Proibição de rede em modo demo');
  const start=source.lastIndexOf('  function J(E, P) {',marker);
  const end=source.indexOf('\n  function se(E) {',marker);
  assert.ok(start>0&&end>start,'Localização exata da função de conexão Binance');
  const state={},sockets=[],messages=[];
  let now=100000;
  class Clock extends Date{static now(){return now}}
  class Socket{
    constructor(url){this.url=url;this.readyState=0;sockets.push(this);}
    close(){this.readyState=3;this.onclose?.();}
  }
  const J=new Function('e','v','Ie','WebSocket','window','document','navigator','Date',
    source.slice(start,end)+'\nreturn J;')(state,(...a)=>messages.push(a),()=>{},Socket,
    {DIARIO_DEMO:demo},{get hidden(){return hidden;}},{get onLine(){return online;}},Clock);
  return {state,sockets,messages,J,advance(ms){now+=ms}};
}
test('v805: Terminal não abre WS na demonstração isolada',()=>{
  const s=setup({demo:true});
  for(let i=0;i<100;i++)s.J(['btcusdt'],'terminal');
  assert.equal(s.sockets.length,0);
});
test('v805: falha de WS impõe backoff entre renders',()=>{
  const s=setup();
  s.J(['btcusdt'],'terminal');assert.equal(s.sockets.length,1);
  s.sockets[0].onerror();
  for(let i=0;i<160;i++)s.J(['btcusdt'],'terminal');
  assert.equal(s.sockets.length,1,'não repetir 160 vezes em sequência');
  s.advance(3000);
  s.J(['btcusdt'],'terminal');
  assert.equal(s.sockets.length,2,'retenta após cooldown');
  s.sockets[1].onopen();
  assert.equal(s.state.binFailures,0,'sucesso limpa falhas');
  assert.equal(s.state.binRetryAt,0,'sucesso limpa bloqueio');
});
test('v805: suspensão offline e aba em segundo plano',()=>{
  for(const opts of [{hidden:true},{online:false}]){
    const s=setup(opts);
    s.J(['btcusdt'],'terminal');
    assert.equal(s.sockets.length,0);
  }
});
