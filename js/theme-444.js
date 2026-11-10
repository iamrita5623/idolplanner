/* 444 V6: coordinated palette; each surface has its own readable tonal role. */
(function(){
'use strict';
function parse(s){var m=/^#([0-9a-f]{6})$/i.exec(s);return m?[0,2,4].map(function(i){return parseInt(m[1].slice(i,i+2),16)}):null}
function hex(a){return '#'+a.map(function(x){return Math.round(Math.max(0,Math.min(255,x))).toString(16).padStart(2,'0')}).join('')}
function mix(a,b,t){return a.map(function(x,i){return x*(1-t)+b[i]*t})}
function lum(a){return a.map(function(x){x/=255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4)}).reduce(function(v,x,i){return v+x*[.2126,.7152,.0722][i]},0)}
function ratio(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function readable(bg){return ratio(bg,[255,255,255])>=ratio(bg,[24,28,38])?[255,255,255]:[24,28,38]}
function ensure(bg,base,target){var x=bg.slice();for(var i=0;i<45&&ratio(x,base)<target;i++)x=mix(x,[0,0,0],.93);return x}
function init(){
var app=document.getElementById('app');if(!app)return;
var previous='';
function apply(){
var raw=getComputedStyle(app).getPropertyValue('--primary-color').trim(),p=parse(raw);
if(!p||raw===previous)return;previous=raw;
var white=[255,255,255],dark=[24,28,38];
var accent=ensure(p,white,4.5);
var action=p.slice(),ink=readable(action);
for(var i=0;i<45&&ratio(action,ink)<4.5;i++){action=mix(action,ink===white?[0,0,0]:white,.94);ink=readable(action)}
var header=ensure(p,white,7);
var page=mix(p,white,.975),card=mix(p,white,.935),soft=mix(p,white,.89),line=mix(p,white,.77);
var muted=ensure(mix(p,dark,.56),card,4.5);
var vars={'--rita-page':hex(page),'--rita-card':hex(card),'--rita-soft':hex(soft),'--rita-line':hex(line),
'--rita-ink':hex(dark),'--rita-muted':hex(muted),'--rita-placeholder':hex(muted),
'--rita-accent':hex(accent),'--rita-action-bg':hex(action),'--rita-on-primary':hex(ink),
'--rita-header-bg':hex(header),'--rita-on-header':'#ffffff','--rita-on-control':hex(dark)};
Object.keys(vars).forEach(function(k){app.style.setProperty(k,vars[k])});
}
apply();new MutationObserver(apply).observe(app,{attributes:true,attributeFilter:['style']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
