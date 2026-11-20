/* Mosaic service worker: lets the web app open offline and be installed (Chromebooks, desktop Chrome, Android).
   Pages are fetched fresh when online; everything else is served from cache and refreshed in the background. */
const V = 'mosaic-sw-2';
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(['app.html', 'ui.css', 'manifest.webmanifest']).catch(() => {})).then(() => self.skipWaiting())) });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())) });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/downloads/') || /\/downloads\//.test(u.pathname) || u.pathname.endsWith('/sw.js')) return;
  const page = r.mode === 'navigate' || (r.headers.get('accept') || '').includes('text/html');
  e.respondWith(caches.open(V).then(async c => {
    if (page) {
      try { const res = await fetch(r); if (res.ok) c.put(r, res.clone()); return res }
      catch (err) { return (await c.match(r, { ignoreSearch: true })) || (await c.match('app.html')) || Response.error() }
    }
    const hit = await c.match(r), net = fetch(r).then(res => { if (res.ok && res.type === 'basic') c.put(r, res.clone()); return res }).catch(() => hit);
    return hit || net;
  }));
});
