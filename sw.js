// サービスワーカー キャッシュ名
const CACHE_NAME = 'yaeyama-guide-v1';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json'
];

// インストール時：コアファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// フェッチ処理：キャッシュがあればそれを返し、なければネットワーク、それもダメならオフラインフォールバック
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // アイコンファイルがリクエストされたら動的に生成する（実ファイルがなくてもOK）
  if (url.pathname === '/icons/icon-192.jpg' || url.pathname === '/icons/icon-512.jpg') {
    event.respondWith(generateIconResponse(url.pathname.includes('512') ? 512 : 192));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request).catch(() => {
        // ナビゲーション時はオフラインでもメインページを表示
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('オフラインではこのコンテンツは利用できません', { status: 404 });
      });
    })
  );
});

// 動的アイコン生成（192x192 または 512x512、ジャケット画像）
async function generateIconResponse(size) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  // グラデーション背景
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#1e3a8a');
  grad.addColorStop(1, '#0f766e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size / 3.5}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏝️', size/2, size/2 - size/12);
  ctx.font = `${size/10}px system-ui, sans-serif`;
  ctx.fillStyle = '#facc15';
  ctx.fillText('ISLANDS', size/2, size*0.75);
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
  return new Response(blob, {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'max-age=86400' }
  });
}

// 古いキャッシュの削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    })
  );
  self.clients.claim();
});