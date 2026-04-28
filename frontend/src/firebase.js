import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBe-L9BLWphGtGF_fR52HPSViFNSvKV1gE",
  authDomain: "gigfinance-6008a.firebaseapp.com",
  projectId: "gigfinance-6008a",
  storageBucket: "gigfinance-6008a.firebasestorage.app",
  messagingSenderId: "456512691412",
  appId: "1:456512691412:web:843bed765f3de3d35aef41",
  measurementId: "G-6GCT95DJQB"
};

// VAPID public key for FCM Web Push (safe to expose in client).
export const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  "BFrHGlW2cmYg3Ho6i4sS5FimOzgbJnjO9FmDEd21eFJ9s4DIf4s5gJWCPMmxSTagNANuhVneCzDZ0dMKthzn_L0";

export const app = initializeApp(firebaseConfig);

// Analytics is only valid in browsers that support it.
export let analytics = null;
if (typeof window !== "undefined") {
  isAnalyticsSupported()
    .then((ok) => {
      if (ok) analytics = getAnalytics(app);
    })
    .catch(() => {});
}

/**
 * Detect whether the current environment can receive Web Push at all.
 * iOS Safari only allows push when the site is installed as a PWA (iOS 16.4+).
 */
export function getMessagingSupportInfo() {
  if (typeof window === "undefined") {
    return { supported: false, reason: "ssr" };
  }

  // Service workers require HTTPS (except for localhost)
  if (window.isSecureContext === false) {
    return { supported: false, reason: "insecure-context" };
  }

  if (!("serviceWorker" in navigator)) {
    return { supported: false, reason: "no-serviceworker" };
  }
  if (!("Notification" in window)) {
    return { supported: false, reason: "no-notification-api" };
  }
  if (!("PushManager" in window)) {
    return { supported: false, reason: "no-pushmanager" };
  }

  // iOS only supports web push when launched as an installed PWA.
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // Detect iPad Pro 'Desktop' mode
  
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
    
  if (isIOS && !isStandalone) {
    return { supported: false, reason: "ios-needs-pwa-install" };
  }

  return { supported: true };
}

/**
 * Register the dedicated FCM service worker. Firebase uses this worker (and not
 * the app's general sw.js) to deliver background push messages. We register it
 * explicitly so we can hand the registration to getToken() — which is what
 * makes push reliable on iOS PWA, Android Chrome, and desktop alike.
 */
let fcmRegistrationPromise = null;
export function registerFcmServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  if (!fcmRegistrationPromise) {
    fcmRegistrationPromise = navigator.serviceWorker
      .register("/firebase-messaging-sw.js", { scope: "/firebase-cloud-messaging-push-scope" })
      .catch((err) => {
        console.warn("FCM service worker registration failed", err);
        fcmRegistrationPromise = null;
        return null;
      });
  }
  return fcmRegistrationPromise;
}

/**
 * Returns a Firebase Messaging instance if the browser can support push,
 * otherwise null. Always await this — never call getMessaging() directly.
 */
let messagingPromise = null;
export function getMessagingInstance() {
  if (!messagingPromise) {
    messagingPromise = (async () => {
      const support = getMessagingSupportInfo();
      if (!support.supported) return null;
      try {
        const ok = await isMessagingSupported();
        if (!ok) return null;
        return getMessaging(app);
      } catch (err) {
        console.warn("Firebase messaging failed to initialize", err);
        return null;
      }
    })();
  }
  return messagingPromise;
}
export const SUPPORT_MESSAGES = {
  ssr: "Notifications need a real browser environment.",
  "no-serviceworker": "This browser does not support service workers.",
  "no-notification-api": "This browser does not support notifications.",
  "no-pushmanager": "This browser does not support web push.",
  "ios-needs-pwa-install":
    "On iPhone or iPad, install GigFinance to your Home Screen first (Share → Add to Home Screen), then open it from there to enable notifications.",
  "insecure-context":
    "Service workers require a secure connection (HTTPS). Please ensure you are using HTTPS to enable notifications.",
};

/**
 * Orchestrates the full flow to enable notifications:
 * 1. Checks support
 * 2. Checks/Requests permission
 * 3. Registers service worker
 * 4. Gets FCM token
 * 5. Shows a confirmation notification
 */
export async function enableNotifications() {
  const support = getMessagingSupportInfo();
  if (!support.supported) {
    throw new Error(SUPPORT_MESSAGES[support.reason] || "Notifications not supported.");
  }

  if (typeof Notification !== "undefined" && Notification.permission === "denied") {
    const isAndroid = /Android/.test(navigator.userAgent);
    throw new Error(
      isAndroid
        ? "Notifications are blocked. Go to Settings → Apps → [Browser] → Permissions → Notifications and enable it."
        : "Notifications are blocked. Reset your browser notification permissions in settings."
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied.");
  }

  const swRegistration = await registerFcmServiceWorker();
  if (!swRegistration) {
    throw new Error("Could not register the notification service worker.");
  }

  // Ensure SW is active
  if (swRegistration.installing || swRegistration.waiting) {
    await new Promise((resolve) => {
      const sw = swRegistration.installing || swRegistration.waiting;
      if (!sw) return resolve();
      sw.addEventListener("statechange", () => {
        if (sw.state === "activated") resolve();
      });
    });
  }

  const messaging = await getMessagingInstance();
  if (!messaging) {
    throw new Error("Firebase messaging failed to initialize.");
  }

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swRegistration,
  });

  if (!token) {
    throw new Error("Could not get a notification token.");
  }

  // Show confirmation
  const title = "GigFinance";
  const body = "Push notifications have been enabled on this device.";
  try {
    new Notification(title, { body, icon: "/logo.png" });
  } catch {
    swRegistration.showNotification(title, { body, icon: "/logo.png" });
  }

  return token;
}

/**
 * Sends a local test notification to verify the integration.
 */
export async function sendTestNotification() {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    throw new Error("Please enable notifications first.");
  }

  const reg = await registerFcmServiceWorker();
  const title = "GigFinance Test";
  const options = {
    body: "This is a test notification from your settings!",
    icon: "/logo.png",
    badge: "/logo.png",
  };

  if (reg && reg.showNotification) {
    await reg.showNotification(title, options);
  } else {
    new Notification(title, options);
  }
}

/**
 * Listens for messages when the app is in the foreground.
 * Returns an unsubscribe function.
 */
export async function onForegroundMessage(callback) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
