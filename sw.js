// Service Worker -- Tools Monitoring Cipta Niaga Semesta
// PENTING: setiap kali file index.html/manifest/icon diganti dan
// diupload ulang ke GitHub, NAIKKAN angka versi di bawah ini (v9 -> v10,
// dst). Tanpa menaikkan versi, browser lama bisa tetap memakai cache
// lama dan tidak melihat update terbaru.
const CACHE_NAME = "dashboard-b259-v16";
const CORE_ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon-72-v3.png",
  "./icon-96-v3.png",
  "./icon-128-v3.png",
  "./icon-144-v3.png",
  "./icon-152-v3.png",
  "./icon-180-v3.png",
  "./icon-192-v3.png",
  "./icon-192-maskable-v3.png",
  "./icon-384-v3.png",
  "./icon-512-v3.png",
  "./icon-512-maskable-v3.png",
  "./favicon-32-v3.png",
  "./favicon-16-v3.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Strategi "network first, fallback ke cache": kalau ada internet,
// selalu ambil versi terbaru dari server (dan perbarui cache); kalau
// offline (atau server tak terjangkau), pakai versi tersimpan di cache
// supaya aplikasi tetap bisa dibuka tanpa koneksi.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
