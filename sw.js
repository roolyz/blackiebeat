var C='bs1';
self.addEventListener('install',function(e){
 e.waitUntil(caches.open(C).then(function(c){return c.addAll(['./','./manifest.webmanifest','./icon.svg','./engine.js','./audio.js','./game.js','./loop.js']);}));
 self.skipWaiting();});
self.addEventListener('activate',function(){self.clients.claim();});
self.addEventListener('fetch',function(e){
 e.respondWith(caches.match(e.request).then(function(r){
  return r||fetch(e.request).then(function(res){
   return caches.open(C).then(function(c){
    if(e.request.method==='GET')c.put(e.request,res.clone());
    return res;});});
 }).catch(function(){return caches.match('./');}));});
