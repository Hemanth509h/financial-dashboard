import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Target, User, Moon, Save, Lock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/index.js';
import { useAuth } from '../context/AuthContext';

const serverFields = new Set(['_id', '__v', 'createdAt', 'updatedAt', 'userId']);
const repaymentServerFields = new Set(['_id', '__v', 'createdAt', 'updatedAt', 'loanId']);

const stripFields = (record, fields) =>
  Object.fromEntries(Object.entries(record).filter(([key]) => !fields.has(key)));

const getInitialSettings = (user) => ({
  name: user?.name || '',
  currency: user?.currency || 'INR',
  monthlyGoal: user?.monthlyGoal || 50000,
  theme: user?.theme || 'light',
});

export const Settings = () => {
  const { user, updateUser } = useAuth();

  const [settings, setSettings] = useState(() => getInitialSettings(user));

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', password: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.get('/auth/me');
      updateUser(res.data);
      setSettings(getInitialSettings(res.data));
      toast.success('Settings refreshed');
    } catch {
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((p) => ({ ...p, [name]: value }));
    if (name === 'theme') {
      document.documentElement.setAttribute('data-theme', value);
    }
  };

  const handleSave = async () => {
    setSavingProfile(true);
    try {
      const res = await api.updateProfile({
        name: settings.name,
        currency: settings.currency,
        monthlyGoal: Number(settings.monthlyGoal),
        theme: settings.theme,
      });
      updateUser(res.data);
      toast.success('Settings saved!');
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    if (passwordForm.password !== passwordForm.confirm) {
      return toast.error('Passwords do not match.');
    }
    if (passwordForm.password.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }
    setSavingPassword(true);
    try {
      await api.updateProfile({ currentPassword: passwordForm.currentPassword, password: passwordForm.password });
      setPasswordForm({ currentPassword: '', password: '', confirm: '' });
      toast.success('Password updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const currencySymbol = settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : '€';

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1>Settings</h1>
          <p className="text-muted">Manage your profile and app preferences.</p>
        </div>
        <button className="page-refresh-btn" onClick={handleRefresh} disabled={refreshing} title="Refresh">
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>
      </header>

      <div className="content" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

          {/* Profile Section */}
          <Card className="stat-card-top" style={{ '--card-accent-from': '#6366f1', '--card-accent-to': '#8b5cf6' }}>
            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                <User size={22} />
              </div>
              <div>
                <h3>Profile</h3>
                <div className="body-sm text-muted">{user?.email}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 'var(--space-md)' }}>
              <div>
                <label className="body-sm font-semibold text-muted" style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={settings.name}
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
          <Card className="stat-card-top" style={{ '--card-accent-from': '#10b981', '--card-accent-to': '#34d399' }}>
            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #10b981, #34d399)', color: 'white', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>
                <Target size={22} />
              </div>
              <div>
                <h3>Financial Goals</h3>
                <div className="body-sm text-muted">Set your monthly earnings target</div>
              </div>
            </div>
            <div>
              <label className="body-sm font-semibold text-muted" style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>Monthly Earnings Target</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }}>{currencySymbol}</span>
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

          {/* Preferences */}
          <Card className="stat-card-top" style={{ '--card-accent-from': '#64748b', '--card-accent-to': '#94a3b8' }}>
            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #334155, #64748b)', color: 'white', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(100,116,139,0.3)' }}>
                <Moon size={22} />
              </div>
              <div>
                <h3>Preferences</h3>
                <div className="body-sm text-muted">Appearance and display settings</div>
              </div>
            </div>
            <div className="mobile-stack" style={{ gap: 'var(--space-md)' }}>
              <div style={{ minWidth: 0 }}>
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

          <div className="mobile-card-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleSave} loading={savingProfile} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: 'var(--space-sm) var(--space-xl)' }}>
              <Save size={18} /> {savingProfile ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          {/* Change Password */}
          <Card className="stat-card-top" style={{ '--card-accent-from': '#ef4444', '--card-accent-to': '#f87171' }}>
            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: 'white', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>
                <Lock size={22} />
              </div>
              <div>
                <h3>Change Password</h3>
                <div className="body-sm text-muted">Update your account password</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {['currentPassword', 'password', 'confirm'].map((field) => (
                <div key={field}>
                  <label className="body-sm font-semibold text-muted" style={{ display: 'block', marginBottom: 'var(--space-xs)' }}>
                    {field === 'currentPassword' ? 'Current Password' : field === 'password' ? 'New Password' : 'Confirm New Password'}
                  </label>
                  <input
                    type="password"
                    value={passwordForm[field]}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, [field]: e.target.value }))}
                    className="form-input"
                    placeholder="••••••••"
                    style={{ width: '100%', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handlePasswordSave} loading={savingPassword} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} /> {savingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Export / Import Section */}
          <Card className="stat-card-top" style={{ '--card-accent-from': '#f59e0b', '--card-accent-to': '#fb923c' }}>
            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: 'white', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(245,158,11,0.3)' }}>
                <Download size={22} />
              </div>
              <div>
                <h3>Export &amp; Import Data</h3>
                <div className="body-sm text-muted">Back up or restore your data</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
    
        </div>
      </div>
    </div>
  );
};
