// Офлайн-кэш приложения. При каждом изменении файлов меняйте версию CACHE.
const CACHE = 'kino-v51';
const POSTERS = 'kino-posters';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './oscars.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
// На этом же адресе живут «Финансы» и «Конвертер» — удаляем только свои старые версии, чужие кэши не трогаем
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('kino-v') && k !== CACHE).map(k => caches.delete(k))))
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
  // Файлы приложения — из кэша. Если кэш кто-то стёр, при интернете он сам восстановится.
  if (!url.startsWith(self.registration.scope)) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
