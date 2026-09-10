// Service Worker — PMO Push Notifications

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Theta PMO', body: event.data.text(), url: '/deviation-dashboard' };
  }

  const { title = 'Theta PMO', body = '', url = '/deviation-dashboard' } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      vibrate: [200, 100, 200],
      tag: 'pmo-push',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/deviation-dashboard';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client) client.navigate(target);
            return;
          }
        }
        if (clients.openWindow) return clients.openWindow(target);
      })
  );
});
