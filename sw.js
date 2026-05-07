const CACHE_NAME = 'yaeyama-guide-v1';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'icons/icon-192.jpg',
  'icons/icon-512.jpg'
];

// インストール時：必要なファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// フェッチ：キャッシュ優先、なければネットワーク、それも失敗したらオフラインフォールバック
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request).catch(() => {
        // ナビゲーション要求ならオフラインでもメインページを表示
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('オフライン状態です', { status: 404, statusText: 'Offline' });
      });
    })
  );
});

// アクティベート：古いキャッシュの削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    })
  );
  self.clients.claim();
});