// Service Worker for handling push notifications

self.addEventListener('push', function (event) {
  if (!event.data) {
    console.log('Push notification received but no data');
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: 'billiard-tracker-notification',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Open App',
        },
        {
          action: 'close',
          title: 'Close',
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Billiard Tracker', options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
    event.waitUntil(
      self.registration.showNotification('Billiard Tracker', {
        body: event.data.text(),
        icon: '/icon-192.svg',
      })
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('notificationclose', function (event) {
  console.log('Notification closed:', event.notification.tag);
});
