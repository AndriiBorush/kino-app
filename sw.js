// Офлайн-кэш приложения. При каждом изменении файлов меняйте версию CACHE.
const CACHE = 'kino-v32';
const POSTERS = 'kino-posters';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== POSTERS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  // Обложки: сначала из памяти телефона. Сохраняет их само приложение (только для своих фильмов).
  if (url.startsWith('https://image.tmdb.org/')) {
    e.respondWith(caches.open(POSTERS).then(c => c.match(url)).then(r => r || fetch(e.request)));
    return;
  }
  // Файлы приложения — из кэша. Поиск TMDB не кэшируем.
  if (!url.startsWith(self.location.origin)) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
