// Cloudflare Worker: Ticketmaster Discovery API proxy for TEST 222.html.
// Configure TICKETMASTER_API_KEY as a Worker secret. Never commit a real key.
const ORIGIN='https://iamrita5623.github.io';
const json=(value,status=200,extra={})=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':ORIGIN,'vary':'Origin','cache-control':'no-store',...extra}});
export default {
 async fetch(request,env,ctx){
  const u=new URL(request.url);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':ORIGIN,'access-control-allow-methods':'GET, OPTIONS','access-control-allow-headers':'Content-Type','access-control-max-age':'3600'}});
  if(request.method!=='GET')return json({error:'method_not_allowed'},405);
  if(u.pathname==='/api/health')return json({ok:true,provider:'ticketmaster',configured:!!env.TICKETMASTER_API_KEY});
  if(u.pathname!=='/api/events/search')return json({error:'not_found'},404);
  const q=(u.searchParams.get('q')||'').trim().slice(0,100);
  const country=u.searchParams.get('country')||'global';
  const limit=Math.min(20,Math.max(1,Number(u.searchParams.get('limit'))||20));
  if(q.length<2)return json({error:'query_too_short'},400);
  if(!['global','KR','JP','TW'].includes(country))return json({error:'invalid_country'},400);
  if(!env.TICKETMASTER_API_KEY)return json({error:'api_key_not_configured'},503);
  const endpoint=new URL('https://app.ticketmaster.com/discovery/v2/events.json');
  endpoint.searchParams.set('apikey',env.TICKETMASTER_API_KEY);
  endpoint.searchParams.set('keyword',q);
  endpoint.searchParams.set('size',String(limit));
  endpoint.searchParams.set('sort','date,desc');
  if(country!=='global')endpoint.searchParams.set('countryCode',country);
  try{
   const response=await fetch(endpoint.toString(),{headers:{accept:'application/json'},cf:{cacheTtl:300,cacheEverything:true}});
   if(!response.ok)return json({error:'provider_error',status:response.status},502);
   const data=await response.json();
   const events=Array.isArray(data._embedded?.events)?data._embedded.events:[];
   const results=events.map(e=>{
    const v=e._embedded?.venues?.[0]||{};
    const artists=(e._embedded?.attractions||[]).map(a=>({name:a.name})).filter(a=>a.name);
    const image=(e.images||[]).find(i=>i.ratio==='3_2')||e.images?.[0];
    return {id:'ticketmaster:'+e.id,title:e.name||'',date:e.dates?.start?.localDate||null,startTime:e.dates?.start?.localTime?.slice(0,5)||null,timezone:e.dates?.timezone||v.timezone||null,countryCode:v.country?.countryCode||null,city:v.city?.name||null,venue:{name:v.name||null,address:v.address?.line1||null,lat:v.location?.latitude?Number(v.location.latitude):null,lng:v.location?.longitude?Number(v.location.longitude):null},artists,poster:image?{url:image.url,usageAllowed:false}:null,source:{provider:'Ticketmaster',url:e.url||null},verification:'aggregated'};
   });
   return json({query:{q,country},results,nextCursor:null,provider:'Ticketmaster'});
  }catch(err){return json({error:'provider_unavailable'},502);}
 }
};
