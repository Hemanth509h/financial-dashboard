import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBe-L9BLWphGtGF_fR52HPSViFNSvKV1gE",
  authDomain: "gigfinance-6008a.firebaseapp.com",
  projectId: "gigfinance-6008a",
  storageBucket: "gigfinance-6008a.firebasestorage.app",
  messagingSenderId: "456512691412",
  appId: "1:456512691412:web:843bed765f3de3d35aef41",
  measurementId: "G-6GCT95DJQB"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Initialize Messaging
// Note: messaging is only supported in browsers that support Service Workers and Notification API
export let messaging = null;

if (typeof window !== "undefined" && 'Notification' in window) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn("Firebase messaging failed to initialize", error);
  }
}
