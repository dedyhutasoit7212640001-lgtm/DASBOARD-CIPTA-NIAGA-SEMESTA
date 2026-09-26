// Service Worker -- Tools Monitoring Cipta Niaga Semesta
// PENTING: setiap kali file index.html/manifest/icon diganti dan
// diupload ulang ke GitHub, NAIKKAN angka versi di bawah ini (v9 -> v10,
// dst). Tanpa menaikkan versi, browser lama bisa tetap memakai cache
// lama dan tidak melihat update terbaru.
const CACHE_NAME = "dashboard-b259-v18";
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
    caches.open(CACHE_NAME).then((cache) =>
      // PENTING: sebelumnya pakai cache.addAll(CORE_ASSETS) -- itu ATOMIK,
      // artinya kalau SATU SAJA file gagal di-fetch (mis. lupa upload salah
      // satu ikon versi baru, nama file typo/beda huruf besar-kecil, dst),
      // SELURUH proses install GAGAL dan TIDAK ADA satupun yg ke-cache --
      // akibatnya PWA tidak bisa dipakai offline sama sekali, padahal cuma
      // 1 dari 15 file yg bermasalah. Ganti jadi per-file (Promise.allSettled)
      // supaya file yg berhasil TETAP ke-cache walau ada 1-2 yg gagal.
      Promise.allSettled(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("SW: gagal precache (dilewati, tidak menggagalkan install):", url, err);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// PENTING (fix "aplikasi harus online dulu buat dibuka"): strategi LAMA
// pakai "network first" -- tiap kali dibuka, SELALU coba ambil dari
// internet dulu (baru fallback ke cache kalau gagal). Itu artinya SETIAP
// kali buka aplikasi harus menunggu jaringan lebih dulu (lambat/hang kalau
// sinyal lemah), dan kalau requestnya gagal dgn cara yg "diam" (mis.
// captive-portal wifi kantor/hotel, proxy, DNS lambat) bukan gagal total,
// browser bisa menunggu lama sebelum akhirnya fallback ke cache -- terasa
// spt "harus online".
//
// Ganti ke "cache first, update belakang layar" (stale-while-revalidate):
// kalau file SUDAH pernah ke-cache (setelah install di atas), langsung
// pakai itu -- aplikasi terbuka SEKETIKA baik online maupun offline, TANPA
// menunggu jaringan sama sekali. Di belakang layar (tanpa bikin user
// menunggu), diam-diam cek versi terbaru dari server & perbarui cache utk
// kunjungan BERIKUTNYA. Update konten tetap terjamin lewat CACHE_NAME:
// setiap kali file diganti & versi dinaikkan, activate() di atas
// menghapus cache lama & install ini mengisi ulang dari nol.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const req = event.request;
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => null);
      if (cached) {
        // Sudah ada di cache -> balas INSTAN dgn ini, biarkan networkFetch
        // jalan sendiri di belakang layar (tidak ditunggu) utk memperbarui
        // cache demi kunjungan berikutnya.
        return cached;
      }
      // Belum ada di cache (mis. request pertama kali / asset baru) --
      // baru di sini menunggu jaringan, dgn fallback ke index.html utk
      // permintaan navigasi kalau jaringan benar2 tidak tersedia.
      return networkFetch.then((response) => response || caches.match("./index.html"));
    })
  );
});
