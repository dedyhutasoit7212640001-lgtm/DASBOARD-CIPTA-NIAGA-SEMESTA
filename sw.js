// Service Worker Dashboard Omset LBP B259
// Strategi: cache-first untuk file inti (bisa dibuka offline setelah
// pertama kali diinstal), selalu coba update dari jaringan di
// background supaya versi terbaru terpasang saat online lagi.
const CACHE_NAME = "dashboard-b259-v1";
const CORE_FILES = [
  "./index.html",
  "./manifest.json",
  "./pwa_icons/icon-72.png",
  "./pwa_icons/icon-96.png",
  "./pwa_icons/icon-128.png",
  "./pwa_icons/icon-144.png",
  "./pwa_icons/icon-152.png",
  "./pwa_icons/icon-180.png",
  "./pwa_icons/icon-192.png",
  "./pwa_icons/icon-384.png",
  "./pwa_icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
