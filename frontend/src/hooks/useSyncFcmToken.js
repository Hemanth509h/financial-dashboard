import { useEffect } from 'react';

export function useSyncFcmToken() {
  useEffect(() => {
    const syncToken = async () => {
      const fcmToken = localStorage.getItem('fcmToken');
      const permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';

      if (fcmToken && permission === 'granted') {
        try {
          await fetch('/api/notifications/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: fcmToken, deviceType: 'web' }),
          });
        } catch (err) {
          console.error('Failed to sync FCM token with backend', err);
        }
      }
    };

    syncToken();
  }, []);
}
