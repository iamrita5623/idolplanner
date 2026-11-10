/* 444-only theme tokens. No changes to app state, storage or shared scripts. */
(function(){
 'use strict';
 function rgb(s){var m=s.match(/^#([0-9a-f]{6})$/i);if(m){return [0,2,4].map(function(i){return parseInt(m[1].slice(i,i+2),16)})}var n=s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);return n?[+n[1],+n[2],+n[3]]:null}
 function lum(v){return v.map(function(x){x/=255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4)}).reduce(function(a,x,i){return a+x*[.2126,.7152,.0722][i]},0)}
 function init(){
  var app=document.getElementById('app');if(!app)return;
  var last='';
  function update(){
   var raw=getComputedStyle(app).getPropertyValue('--primary-color').trim(),color=rgb(raw);
   if(!color||raw===last)return;last=raw;
   var light=lum(color)>.179,ink=light?'#172033':'#ffffff';
   app.style.setProperty('--rita-on-primary',ink);
   app.style.setProperty('--rita-on-header',ink);
   app.style.setProperty('--rita-on-control',light?'#172033':'#172033');
  }
  update();
  new MutationObserver(update).observe(app,{attributes:true,attributeFilter:['style']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
