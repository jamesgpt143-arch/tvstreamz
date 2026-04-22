// public/sw.js
self.addEventListener('install', (e) => {
  self.skipWaiting(); // I-force na i-install agad itong bagong pekeng worker
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Burahin lahat ng lumang naka-save na files
          return caches.delete(cacheName); 
        })
      );
    }).then(() => {
      // I-unregister ang sarili
      self.registration.unregister();
    }).then(() => {
      // I-force refresh ang browser ng user para makita ang bagong menu
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      });
    })
  );
});
