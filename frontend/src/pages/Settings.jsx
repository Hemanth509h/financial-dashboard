import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Target, CircleDollarSign, User, Bell, Shield, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export const Settings = () => {
  const [settings, setSettings] = useState({
    monthlyGoal: 50000,
    currency: 'INR',
    userName: 'Hemanth',
    notifications: true,
    theme: localStorage.getItem('theme') || 'light'
  });

  useEffect(() => {
    const savedGoal = localStorage.getItem('monthlyGoal');
    const savedName = localStorage.getItem('userName');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    if (savedGoal) setSettings(prev => ({ ...prev, monthlyGoal: Number(savedGoal) }));
    if (savedName) setSettings(prev => ({ ...prev, userName: savedName }));
    setSettings(prev => ({ ...prev, theme: savedTheme }));
    
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = () => {
    localStorage.setItem('monthlyGoal', settings.monthlyGoal);
    localStorage.setItem('userName', settings.userName);
    localStorage.setItem('theme', settings.theme);
    
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    toast.success('Settings saved successfully!');
    // Trigger a storage event for other tabs/components
    window.dispatchEvent(new Event('storage'));
  };

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
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="font-semibold">Push Notifications</div>
                <div className="body-sm text-muted">Receive alerts for loan repayments and payments.</div>
              </div>
              <input 
                type="checkbox" 
                name="notifications"
                checked={settings.notifications}
                onChange={handleChange}
                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
              />
            </div>

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
