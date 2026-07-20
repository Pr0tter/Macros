// Service worker: cachet de app zodat hij offline werkt en installeerbaar is.
const CACHE = 'macros-v3';
const BESTANDEN = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(BESTANDEN)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', (e)=>{
  const req = e.request;
  if(req.method !== 'GET') return;
  // Eigen bestanden: cache-first. Externe (fonts): probeer netwerk, val terug op cache.
  if(new URL(req.url).origin === self.location.origin){
    e.respondWith(
      caches.match(req).then(hit=> hit || fetch(req).then(res=>{
        const kopie = res.clone();
        caches.open(CACHE).then(c=>c.put(req, kopie)).catch(()=>{});
        return res;
      }).catch(()=> caches.match('./index.html')))
    );
  } else {
    e.respondWith(fetch(req).catch(()=> caches.match(req)));
  }
});
