/* App shell cache: the app opens without internet; family data syncs through Firestore's own offline cache. */
const V='nujoomi-v6';
const SHELL=['./','index.html','app.css?v=2','extra.css?v=5','app.js?v=6','config.js?v=2','manifest.webmanifest','icons/icon-192.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  const shell=u.origin===location.origin;
  const font=/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(!shell&&!font)return;
  /* network first so updates arrive quickly, cache as the fallback when offline */
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:false}).then(r=>r||caches.match('index.html'))));
});
