var C='bs2';
self.addEventListener('install',function(){self.skipWaiting();});
self.addEventListener('activate',function(e){
 e.waitUntil(caches.keys().then(function(k){
  return Promise.all(k.map(function(n){return caches.delete(n);}));
 }).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){
 e.respondWith(fetch(e.request).then(function(res){
  var copy=res.clone();
  caches.open(C).then(function(c){c.put(e.request,copy);});
  return res;
 }).catch(function(){
  return caches.match(e.request).then(function(r){return r||caches.match('./');});
 }));});
