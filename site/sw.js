/* Same-origin, cache-first offline asset access. Does not persist Linux disk writes. */
const CACHE = 'pocketlinux-assets-v1';
const SHELL = ['index.html', 'app.js', 'app.css', 'manifest.webmanifest', 'icon.svg', 'asset-list.json'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL.map(s => new URL(s, self.registration.scope)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('pocketlinux-') && name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request) ||
      (request.mode === 'navigate' && url.pathname === new URL(self.registration.scope).pathname
        ? await cache.match(new URL('index.html', self.registration.scope)) : undefined);
    if (hit) return hit;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      // Store fetched VM blocks as they are read, allowing repeat use offline.
      event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
    }
    return response;
  })());
});
