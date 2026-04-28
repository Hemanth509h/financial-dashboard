import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

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
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
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
