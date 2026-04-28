import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Target, User, Bell, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMessagingInstance,
  getMessagingSupportInfo,
  registerFcmServiceWorker,
  VAPID_KEY,
} from '../firebase';
import { getToken } from 'firebase/messaging';

const SUPPORT_MESSAGES = {
  ssr: 'Notifications need a real browser environment.',
  'no-serviceworker': 'This browser does not support service workers.',
  'no-notification-api': 'This browser does not support notifications.',
  'no-pushmanager': 'This browser does not support web push.',
  'ios-needs-pwa-install':
    'On iPhone or iPad, install GigFinance to your Home Screen first (Share → Add to Home Screen), then open it from there to enable notifications.',
};

export const Settings = () => {
  const [settings, setSettings] = useState({
    monthlyGoal: 50000,
    currency: 'INR',
    userName: 'Hemanth',
    notifications: false,
    theme: localStorage.getItem('theme') || 'light',
  });
  const [pushSupport, setPushSupport] = useState({ supported: true });
  const [pushBusy, setPushBusy] = useState(false);
  const [fcmToken, setFcmToken] = useState(localStorage.getItem('fcmToken') || '');

  useEffect(() => {
    const savedGoal = localStorage.getItem('monthlyGoal');
    const savedName = localStorage.getItem('userName');
    const savedTheme = localStorage.getItem('theme') || 'light';

    if (savedGoal) setSettings((prev) => ({ ...prev, monthlyGoal: Number(savedGoal) }));
    if (savedName) setSettings((prev) => ({ ...prev, userName: savedName }));
    setSettings((prev) => ({ ...prev, theme: savedTheme }));

    document.documentElement.setAttribute('data-theme', savedTheme);

    setPushSupport(getMessagingSupportInfo());

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && fcmToken) {
      setSettings((prev) => ({ ...prev, notifications: true }));
    }
  }, [fcmToken]);

  const enablePushNotifications = async () => {
    setPushBusy(true);
    try {
      const support = getMessagingSupportInfo();
      setPushSupport(support);
      if (!support.supported) {
        toast.error(SUPPORT_MESSAGES[support.reason] || 'Notifications are not supported here.');
        return false;
      }

      // Check if permission is already blocked
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        const isAndroid = /Android/.test(navigator.userAgent);
        const helpMsg = isAndroid 
          ? 'Notifications are blocked. Go to Settings → Apps → [Your Browser] → Permissions → Notifications and enable it.'
          : 'Notifications are blocked. Reset your browser notification permissions in settings.';
        toast.error(helpMsg, { duration: 6000 });
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        const isAndroid = /Android/.test(navigator.userAgent);
        const helpMsg = isAndroid 
          ? 'Notifications blocked. Go to Settings → Apps → [Your Browser] → Permissions → Notifications.'
          : 'Notification permission denied. Check your browser settings.';
        toast.error(helpMsg, { duration: 6000 });
        return false;
      }

      const swRegistration = await registerFcmServiceWorker();
      if (!swRegistration) {
        toast.error('Could not register the notification service worker.');
        return false;
      }

      // Make sure the worker is fully active before asking FCM for a token —
      // otherwise getToken can hang or fail on slow mobile networks.
      if (swRegistration.installing || swRegistration.waiting) {
        await new Promise((resolve) => {
          const sw = swRegistration.installing || swRegistration.waiting;
          if (!sw) return resolve();
          sw.addEventListener('statechange', () => {
            if (sw.state === 'activated') resolve();
          });
        });
      }

      const messaging = await getMessagingInstance();
      if (!messaging) {
        toast.error('Notifications are not supported in this browser.');
        return false;
      }

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (!token) {
        toast.error('Could not get a notification token. Please try again.');
        return false;
      }

      console.log('FCM token:', token);
      localStorage.setItem('fcmToken', token);
      setFcmToken(token);
      toast.success('Push notifications enabled!');

      try {
        new Notification('GigFinance', {
          body: 'Push notifications have been enabled on this device.',
          icon: '/logo.png',
        });
      } catch {
        // Some browsers (notably iOS PWA) only allow notifications via the SW.
        swRegistration.showNotification('GigFinance', {
          body: 'Push notifications have been enabled on this device.',
          icon: '/logo.png',
        });
      }

      return true;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error(error?.message || 'Failed to enable notifications.');
      return false;
    } finally {
      setPushBusy(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'notifications') {
      if (checked) {
        const ok = await enablePushNotifications();
        setSettings((prev) => ({ ...prev, notifications: ok }));
        return;
      }
      setSettings((prev) => ({ ...prev, notifications: false }));
      return;
    }

    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const sendTestNotification = async () => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      toast.error('Please enable notifications first.');
      return;
    }
    try {
      const reg = await registerFcmServiceWorker();
      if (reg && reg.showNotification) {
        await reg.showNotification('GigFinance Test', {
          body: 'This is a test notification from your settings!',
          icon: '/logo.png',
          badge: '/logo.png',
        });
      } else {
        new Notification('GigFinance Test', {
          body: 'This is a test notification from your settings!',
          icon: '/logo.png',
        });
      }
      toast.success('Test notification sent!');
    } catch (err) {
      console.error(err);
      toast.error('Could not show test notification.');
    }
  };


  const handleSave = () => {
    localStorage.setItem('monthlyGoal', settings.monthlyGoal);
    localStorage.setItem('userName', settings.userName);
    localStorage.setItem('theme', settings.theme);

    document.documentElement.setAttribute('data-theme', settings.theme);

    toast.success('Settings saved successfully!');
    window.dispatchEvent(new Event('storage'));
  };

  const supportNote = !pushSupport.supported ? SUPPORT_MESSAGES[pushSupport.reason] : null;

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: 'var(--space-xl)' }}>
        <h1>Settings</h1>
        <p className="text-muted">Manage your profile and app preferences.</p>
      </header>

      <div className="content" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Profile Section */}
          <Card>
            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ backgroundColor: 'var(--primary-container)', color: 'var(--primary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
                <User size={24} />
              </div>
              <h3>Profile Settings</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div>
                <label className="body-sm font-semibold text-muted" style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Your Name</label>
                <input
                  type="text"
                  name="userName"
                  value={settings.userName}
                  onChange={handleChange}
                  className="form-input"
                  style={{ width: '100%', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)' }}
                />
              </div>
              <div>
                <label className="body-sm font-semibold text-muted" style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Currency</label>
                <select
                  name="currency"
                  value={settings.currency}
                  onChange={handleChange}
                  className="form-input"
                  style={{ width: '100%', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)' }}
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Financial Goals Section */}
          <Card>
            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ backgroundColor: 'var(--primary-container)', color: 'var(--primary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
                <Target size={24} />
              </div>
              <h3>Financial Goals</h3>
            </div>

            <div>
              <label className="body-sm font-semibold text-muted" style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Monthly Earnings Target</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }}>₹</span>
                <input
                  type="number"
                  name="monthlyGoal"
                  value={settings.monthlyGoal}
                  onChange={handleChange}
                  className="form-input"
                  style={{ width: '100%', padding: 'var(--space-sm) var(--space-sm) var(--space-sm) 28px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)' }}
                />
              </div>
              <p className="body-sm text-muted" style={{ marginTop: 'var(--space-xs)' }}>This will update the progress bar on your dashboard.</p>
            </div>
          </Card>

          {/* Preferences Section */}
          <Card>
            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
                <Bell size={24} />
              </div>
              <h3>Preferences</h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div style={{ minWidth: 0 }}>
                <div className="font-semibold">Push Notifications</div>
                <div className="body-sm text-muted">Receive alerts for loan repayments and payments.</div>
              </div>
              <input
                type="checkbox"
                name="notifications"
                checked={settings.notifications}
                onChange={handleChange}
                disabled={pushBusy || !pushSupport.supported}
                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
              />
            </div>

            {supportNote && (
              <p className="body-sm text-muted" style={{ marginTop: 'var(--space-sm)' }}>
                {supportNote}
              </p>
            )}

            {settings.notifications && (
              <div style={{ marginTop: 'var(--space-sm)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={sendTestNotification}
                  style={{ fontSize: '0.8rem', padding: 'var(--space-xs) var(--space-md)' }}
                >
                  Send Test Notification
                </Button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--outline-variant)' }}>
              <div>
                <div className="font-semibold">Dark Mode</div>
                <div className="body-sm text-muted">Use a dark theme for the dashboard.</div>
              </div>
              <select
                name="theme"
                value={settings.theme}
                onChange={handleChange}
                className="form-input"
                style={{ width: '120px', padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)' }}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
            <Button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: 'var(--space-sm) var(--space-xl)' }}>
              <Save size={18} /> Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
