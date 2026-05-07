const CACHE_NAME = 'yaeyama-guide-v1';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'icons/icon-192.jpg',
  'icons/icon-512.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      try {
        await cache.addAll(urlsToCache);
      } catch (err) {
        console.error('キャッシュ追加エラー:', err);
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // ナビゲーションリクエスト（HTMLページ）は特別に処理
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('index.html');
      })
    );
    return;
  }

  // それ以外のリソース（画像、CSS、JSなど）はキャッシュファースト
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then(networkResponse => {
        // 成功したレスポンスをキャッシュに追加（オプション）
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // オフラインで画像などがない場合はプレースホルダーを返しても良い
        if (url.pathname.endsWith('.jpg') || url.pathname.endsWith('.png')) {
          // 必要に応じて透過な画像などを返す
          return new Response('', { status: 404, statusText: 'Offline' });
        }
        return new Response('オフライン状態です', { status: 404 });
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    })
  );
  self.clients.claim();
});