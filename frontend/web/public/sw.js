// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received')

  let data = {
    title: 'Burrow',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    burrowId: null,
  }

  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e)
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.burrowId || 'notification',
    requireInteraction: false,
    data: {
      burrowId: data.burrowId,
      url: data.burrowId ? `/burrows/${data.burrowId}` : '/',
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked')

  event.notification.close()

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a window open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // If not, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})

self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed', event.notification.tag)
})
