import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { onMessage } from 'firebase/messaging';
import { getMessagingInstance, registerFcmServiceWorker } from '../firebase';

export function useForegroundMessages() {
  useEffect(() => {
    let unsubscribe;
    let cancelled = false;

    (async () => {
      await registerFcmServiceWorker();
      const messaging = await getMessagingInstance();
      if (cancelled || !messaging) return;

      unsubscribe = onMessage(messaging, (payload) => {
        const data = payload.data || {};
        const notification = payload.notification || {};
        const title = notification.title || data.title || 'New Notification';
        const body = notification.body || data.body || '';

        toast(
          () => (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <strong style={{ marginBottom: '4px' }}>{title}</strong>
              {body ? <span className="body-sm text-muted">{body}</span> : null}
            </div>
          ),
          { duration: 5000, icon: '🔔' }
        );
      });
    })();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);
}
