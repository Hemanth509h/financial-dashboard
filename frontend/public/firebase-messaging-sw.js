/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBe-L9BLWphGtGF_fR52HPSViFNSvKV1gE",
  authDomain: "gigfinance-6008a.firebaseapp.com",
  projectId: "gigfinance-6008a",
  storageBucket: "gigfinance-6008a.firebasestorage.app",
  messagingSenderId: "456512691412",
  appId: "1:456512691412:web:843bed765f3de3d35aef41",
  measurementId: "G-6GCT95DJQB"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Activate this worker immediately on install/update so push works on first
// load without requiring a manual reload.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Build a notification from either a `notification` payload (auto-shown on
// most platforms) or a `data` payload (we have to show it ourselves). Calling
// showNotification here is what makes data-only messages visible on iOS PWA
// and Android, where many backends send data-only payloads.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message', payload);

  const data = payload.data || {};
  const notification = payload.notification || {};

  const title = notification.title || data.title || 'GigFinance';
  const options = {
    body: notification.body || data.body || '',
    icon: notification.icon || '/logo.png',
    badge: '/logo.png',
    tag: data.tag || notification.tag || 'gigfinance-message',
    renotify: true,
    data: {
      url: data.url || data.click_action || notification.click_action || '/',
      ...data,
    },
  };

  self.registration.showNotification(title, options);
});

// Focus an existing tab when the user taps a notification, or open a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl).catch(() => {});
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});
