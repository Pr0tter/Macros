// Service worker: app werkt offline én ververst zichzelf.
// Strategie: "network-first" voor eigen bestanden — als je online bent krijg je
// altijd de nieuwste versie, offline valt hij terug op de opgeslagen versie.
// Gevolg: om te updaten hoef je enkel index.html op GitHub te vervangen.
const CACHE = 'macros-v5';
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
  const url = new URL(req.url);

  if(url.origin === self.location.origin){
    // Eigen bestanden: probeer netwerk (nieuwste), val bij offline terug op cache.
    e.respondWith(
      fetch(req).then(res=>{
        const kopie = res.clone();
        caches.open(CACHE).then(c=>c.put(req, kopie)).catch(()=>{});
        return res;
      }).catch(()=> caches.match(req).then(hit=> hit || caches.match('./index.html')))
    );
  } else {
    // Externe bestanden (bv. lettertypes): eerst cache, anders netwerk.
    e.respondWith(caches.match(req).then(hit=> hit || fetch(req).catch(()=> hit)));
  }
});
