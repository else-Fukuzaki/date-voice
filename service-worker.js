// オフライン対応のキャッシュ。
// 戦略は「ネットワーク優先（network-first）」：
//   オンライン時は常に最新を取得して表示し、ついでにキャッシュも更新する。
//   オフライン時のみキャッシュから返す。
// これにより、アプリを更新しても古い版に固まらない。
const CACHE = 'kyou-v3'
const ASSETS = [
  '.',
  'index.html',
  'style.css',
  'js/main.js',
  'js/dateText.js',
  'js/speak.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return // GET 以外（あれば）は素通し

  event.respondWith(
    fetch(req)
      .then((res) => {
        // 取得成功 → 次回のオフライン用にキャッシュを更新（正常応答のみ）
        if (res && res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
        }
        return res
      })
      .catch(() => caches.match(req)) // オフライン時はキャッシュから返す
  )
})
