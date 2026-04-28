# GigFinance

Personal financial dashboard for gig workers — track work entries, payments, and loans, with optional Web Push notifications via Firebase Cloud Messaging.

## Stack

- **Frontend:** React 19 + Vite, React Router, Recharts, Firebase (FCM) — `frontend/`
- **Backend:** Node.js + Express + Mongoose (MongoDB) — `backend/`
- **Database:** MongoDB. In development, an in-memory MongoDB is started automatically when `MONGODB_URI` is not set. In production, `MONGODB_URI` is required.

## Replit setup

- **Frontend workflow** runs `cd frontend && npm run dev` on port **5000** (the only public port). Vite is configured with `host: '0.0.0.0'` and `allowedHosts: true` so the Replit proxy/iframe works.
- **Backend workflow** runs `cd backend && node server.js` on port **3001**, bound to `0.0.0.0`.
- The frontend dev server proxies `/api` → `http://localhost:3001`.

## Deployment

Configured for Autoscale. Build runs `npm install` + `vite build` for the frontend and `npm install` for the backend; runtime starts the backend with `NODE_ENV=production PORT=5000`, and the backend serves the built frontend from `frontend/dist` plus the API.

`MONGODB_URI` must be set as a secret before publishing — production refuses to fall back to in-memory storage.

## Firebase Cloud Messaging

- Web push is initialized via `frontend/src/firebase.js` (`getMessagingInstance`, `registerFcmServiceWorker`, `getMessagingSupportInfo`).
- The dedicated `frontend/public/firebase-messaging-sw.js` is registered explicitly with scope `/firebase-cloud-messaging-push-scope` so it doesn't conflict with the app shell `sw.js`.
- The app shell `sw.js` excludes Firebase/FCM URLs from its fetch handler.
- Foreground messages are handled by `frontend/src/hooks/useForegroundMessages.jsx`, used by `App.jsx`.
- iOS Safari only supports web push when the site is installed as a PWA (iOS 16.4+); the Settings page surfaces this requirement.
- The VAPID key can be overridden via `VITE_FIREBASE_VAPID_KEY` at build time.
