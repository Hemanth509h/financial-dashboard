import { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Target, User, Moon, Save, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/index.js';

const getInitialSettings = () => {
  return {
    monthlyGoal: localStorage.getItem('monthlyGoal') || 50000,
    currency: localStorage.getItem('currency') || 'INR',
    userName: localStorage.getItem('userName') || 'Hemanth',
    theme: localStorage.getItem('theme') || 'light',
  };
};

export const Settings = () => {
  const [settings, setSettings] = useState(getInitialSettings);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const [workLogsRes, loansRes] = await Promise.all([
        api.getWorkLogs(),
        api.getLoans(),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        settings: {
          userName: settings.userName,
          currency: settings.currency,
          monthlyGoal: settings.monthlyGoal,
        },
        workLogs: workLogsRes.data,
        loans: loansRes.data,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gigfinance-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch {
      toast.error('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.workLogs && !data.loans) {
        toast.error('Invalid export file.');
        return;
      }

      let workLogsImported = 0;
      let loansImported = 0;

      if (Array.isArray(data.workLogs)) {
        for (const entry of data.workLogs) {
          const { _id, __v, createdAt, updatedAt, ...fields } = entry;
          await api.createWorkLog(fields);
          workLogsImported++;
        }
      }

      if (Array.isArray(data.loans)) {
        for (const loan of data.loans) {
          const { _id, __v, createdAt, updatedAt, repayments, ...loanFields } = loan;
          const res = await api.createLoan(loanFields);
          const newLoanId = res.data._id;
          loansImported++;

          if (Array.isArray(repayments)) {
            for (const repayment of repayments) {
              const { _id, __v, createdAt, updatedAt, loanId, ...rFields } = repayment;
              await api.addLoanRepayment(newLoanId, rFields);
            }
          }
        }
      }

      toast.success(`Imported ${workLogsImported} work logs and ${loansImported} loans.`);
    } catch {
      toast.error('Failed to import. Make sure the file is a valid GigFinance export.');
    } finally {
      setImporting(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('monthlyGoal', settings.monthlyGoal);
    localStorage.setItem('userName', settings.userName);
    localStorage.setItem('currency', settings.currency);
    localStorage.setItem('theme', settings.theme);
    
    document.documentElement.setAttribute('data-theme', settings.theme);
    toast.success('Settings saved successfully!');
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="page">
      <header className="page-header" style={{ marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1>Settings</h1>
          <p className="text-muted">Manage your profile and app preferences.</p>
        </div>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 'var(--space-md)' }}>
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
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }}>{settings.currency === 'INR' ? '₹' : settings.currency === 'USD' ? '$' : '€'}</span>
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
                <Moon size={24} />
              </div>
              <h3>Preferences</h3>
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

          {/* Export / Import Section */}
          <Card>
            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ backgroundColor: 'var(--primary-container)', color: 'var(--primary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
                <Download size={24} />
              </div>
              <h3>Export &amp; Import Data</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div className="mobile-stack" style={{ gap: 'var(--space-md)' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="font-semibold">Download All Data</div>
                  <div className="body-sm text-muted">Export all your work logs and loans as a JSON file.</div>
                </div>
                <Button onClick={handleExport} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                  <Download size={16} /> {exporting ? 'Exporting…' : 'Export'}
                </Button>
              </div>

              <div style={{ borderTop: '1px solid var(--outline-variant)' }} />

              <div className="mobile-stack" style={{ gap: 'var(--space-md)' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="font-semibold">Restore from File</div>
                  <div className="body-sm text-muted">Import a previously exported JSON file to restore your data.</div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImport}
                />
                <Button onClick={() => fileInputRef.current?.click()} disabled={importing} style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                  <Upload size={16} /> {importing ? 'Importing…' : 'Import'}
                </Button>
              </div>
            </div>
          </Card>

          <div className="mobile-card-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
            <Button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: 'var(--space-sm) var(--space-xl)' }}>
              <Save size={18} /> Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
