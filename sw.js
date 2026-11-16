// Service worker: deixa o app abrir mesmo sem internet (só a tela; as vendas sempre vêm do servidor).
const CACHE = 'rifa-v1';
const ARQUIVOS = ['./', 'index.html', 'vendedor.html', 'style.css', 'app.js', 'manifest.json', 'manifest-vendedor.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/vendedor-192.png', 'icons/vendedor-512.png', 'icons/apple-touch-icon.png', 'icons/apple-touch-icon-vendedor.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  // API e outros sites: sempre direto na rede, nunca do cache
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('api.php')) return;
  // Rede primeiro (pega sempre a versão nova); se estiver sem internet, usa a cópia guardada
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch: true}))
  );
});
