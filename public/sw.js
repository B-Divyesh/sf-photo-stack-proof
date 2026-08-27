const VERSION = 'psp-v5'
const SHELL = `${VERSION}-shell`
const ASSETS = `${VERSION}-assets`
const SHELL_FILES = ['/', '/index.html', '/offline.html', '/offline.css', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png', '/media/proof-geometry-640.webp', '/media/proof-geometry.webp']
let lastNetworkFailed = false

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(SHELL_FILES)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => ![SHELL, ASSETS].includes(key)).map((key) => caches.delete(key)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      lastNetworkFailed = false
      const copy = response.clone()
      caches.open(SHELL).then((cache) => cache.put('/index.html', copy))
      return response
    }).catch(async () => {
      lastNetworkFailed = true
      return (await caches.match('/index.html')) || caches.match('/offline.html')
    }))
    return
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(ASSETS)
      await cache.put(event.request, response.clone())
    }
    return response
  })))
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'NETWORK_STATUS') event.source?.postMessage({ type: 'NETWORK_STATUS', offline: lastNetworkFailed })
})
