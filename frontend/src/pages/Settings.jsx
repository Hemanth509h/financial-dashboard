import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Target, User, Bell, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMessagingSupportInfo,
  enableNotifications,
  sendTestNotification as triggerTestNotification,
  SUPPORT_MESSAGES,
} from '../firebase';

export const Settings = () => {
  const [settings, setSettings] = useState({
    monthlyGoal: 50000,
    currency: 'INR',
    userName: 'Hemanth',
    notifications: false,
    notificationTime: '09:00',
    theme: localStorage.getItem('theme') || 'light',
  });
  const [pushSupport, setPushSupport] = useState({ supported: true });
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    const savedGoal = localStorage.getItem('monthlyGoal');
    const savedName = localStorage.getItem('userName');
    const savedTheme = localStorage.getItem('theme') || 'light';

    if (savedGoal) setSettings((prev) => ({ ...prev, monthlyGoal: Number(savedGoal) }));
    if (savedName) setSettings((prev) => ({ ...prev, userName: savedName }));
    setSettings((prev) => ({ ...prev, theme: savedTheme }));

    document.documentElement.setAttribute('data-theme', savedTheme);
    setPushSupport(getMessagingSupportInfo());

    // Fetch notification settings from backend
    const fetchNotificationSettings = async () => {
      try {
        const res = await fetch('/api/notifications/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(prev => ({ ...prev, notificationTime: data.notificationTime }));
        }
      } catch (err) {
        console.error('Failed to fetch notification settings', err);
      }
    };
    fetchNotificationSettings();

    // Sync notification checkbox with current permission and token state
    const fcmToken = localStorage.getItem('fcmToken');
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && fcmToken) {
      setSettings((prev) => ({ ...prev, notifications: true }));
    }
  }, []);

  const handleNotificationToggle = async (checked) => {
    if (checked) {
      setPushBusy(true);
      try {
        const token = await enableNotifications();
        localStorage.setItem('fcmToken', token);
        
        // Register token on backend
        await fetch('/api/notifications/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, deviceType: 'web' }),
        });

        setSettings((prev) => ({ ...prev, notifications: true }));
        toast.success('Push notifications enabled!');
      } catch (error) {
        console.error('Failed to enable notifications:', error);
        toast.error(error.message || 'Failed to enable notifications.');
        setSettings((prev) => ({ ...prev, notifications: false }));
      } finally {
        setPushBusy(false);
      }
    } else {
      setSettings((prev) => ({ ...prev, notifications: false }));
      // Optional: Logic to unregister or disable on backend
    }
  };

  const handleSendTest = async () => {
    try {
      await triggerTestNotification();
      toast.success('Test notification sent!');
    } catch (err) {
      toast.error(err.message || 'Could not show test notification.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'notifications') {
      handleNotificationToggle(checked);
      return;
    }
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    localStorage.setItem('monthlyGoal', settings.monthlyGoal);
    localStorage.setItem('userName', settings.userName);
    localStorage.setItem('theme', settings.theme);
    document.documentElement.setAttribute('data-theme', settings.theme);

    // Save notification time to backend
    try {
      await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationTime: settings.notificationTime }),
      });
    } catch (err) {
      console.error('Failed to save notification settings', err);
    }

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
                  onClick={handleSendTest}
                  style={{ fontSize: '0.8rem', padding: 'var(--space-xs) var(--space-md)' }}
                >
                  Send Test Notification
                </Button>
              </div>
            )}

            {settings.notifications && (
              <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="font-semibold">Daily Metrics Report</div>
                    <div className="body-sm text-muted">Set what time you want to receive your daily summary.</div>
                  </div>
                  <input
                    type="time"
                    name="notificationTime"
                    value={settings.notificationTime}
                    onChange={handleChange}
                    className="form-input"
                    style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)' }}
                  />
                </div>
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
