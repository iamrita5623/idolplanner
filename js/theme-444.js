/* 444 only: compute a single accessible palette from Vue's --primary-color.
   No storage writes, no app state changes and no global style overrides. */
(function(){
 'use strict';
 function parseHex(s){var m=/^#([a-f\d]{6})$/i.exec(s);return m?[0,2,4].map(function(i){return parseInt(m[1].slice(i,i+2),16)}):null}
 function luminance(c){return c.map(function(x){x/=255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4)}).reduce(function(a,x,i){return a+x*[.2126,.7152,.0722][i]},0)}
 function contrast(a,b){var x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
 function mix(a,b,t){return a.map(function(x,i){return Math.round(x*(1-t)+b[i]*t)})}
 function hex(a){return '#'+a.map(function(x){return Math.max(0,Math.min(255,x)).toString(16).padStart(2,'0')}).join('')}
 function choose(bg){var dark=[23,27,37],white=[255,255,255];return contrast(bg,dark)>=contrast(bg,white)?hex(dark):hex(white)}
 function init(){
  var app=document.getElementById('app');if(!app)return;
  var last='';
  function update(){
   var raw=getComputedStyle(app).getPropertyValue('--primary-color').trim();
   var primary=parseHex(raw);if(!primary||raw===last)return;last=raw;
   var white=[255,255,255],dark=[23,27,37],p=primary;
   var action=p.slice(),onAction=choose(action);
   for(var n=0;n<16&&contrast(action,parseHex(onAction))<4.5;n++){
    action=mix(action,onAction==='#ffffff'?[0,0,0]:white,.92);
    onAction=choose(action);
   }
   var card=white,soft=mix(p,white,.965),control=mix(p,white,.89);
   var tokens={
    '--rita-page':hex(mix(p,white,.975)),
    '--rita-card':hex(card),
    '--rita-card-soft':hex(soft),
    '--rita-control':hex(control),
    '--rita-control-hover':hex(mix(p,white,.83)),
    '--rita-line':hex(mix(p,white,.81)),
    '--rita-ink':hex(dark),
    '--rita-muted':hex([77,79,92]),
    '--rita-placeholder':hex([102,104,118]),
    '--rita-action-bg':hex(action),
    '--rita-on-primary':onAction,
    '--rita-on-header':onAction,
    '--rita-on-control':choose(control),
    '--rita-accent-ink':hex((function(){var a=p.slice(),on=choose(white);for(var k=0;k<25&&contrast(white,a)<4.5;k++)a=mix(a,[0,0,0],.9);return a})())
   };
   /* Text on very light or desaturated tinted surfaces must remain readable. */
   if(contrast(card,parseHex(tokens['--rita-ink']))<4.5)tokens['--rita-ink']=hex(dark);
   if(contrast(card,parseHex(tokens['--rita-muted']))<4.5)tokens['--rita-muted']=hex(mix(dark,[70,70,80],.15));
   if(contrast(card,parseHex(tokens['--rita-placeholder']))<4.5)tokens['--rita-placeholder']=tokens['--rita-muted'];
   Object.keys(tokens).forEach(function(k){app.style.setProperty(k,tokens[k])});
  }
  update();
  new MutationObserver(update).observe(app,{attributes:true,attributeFilter:['style']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
