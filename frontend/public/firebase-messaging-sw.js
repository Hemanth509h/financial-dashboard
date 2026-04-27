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

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // Make sure you have a logo.png in public
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
