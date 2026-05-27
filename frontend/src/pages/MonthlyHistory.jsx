import { useEffect, useState } from 'react';
import { Archive, CalendarDays, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export const MonthlyHistory = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.getMonthlyHistory();
        setMonths(data);
      } catch (error) {
        console.error('Failed to fetch monthly history', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatCurrency = (amount) => {
    const locale = currency === 'INR' ? 'en-IN' : currency === 'USD' ? 'en-US' : 'en-EU';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  return (
    <div className="page">
      <header className="page-header mobile-stack" style={{ marginBottom: 'var(--space-xl)', gap: 'var(--space-md)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-xs)' }}>Monthly History</h1>
          <p className="text-muted">Previous months are stored here while the current month starts fresh.</p>
        </div>
      </header>

      <div className="content">
        {loading ? (
          <div className="responsive-grid responsive-grid-3">
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
            <div className="skeleton skeleton-card"></div>
          </div>
        ) : months.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <Archive size={32} className="text-primary" style={{ marginBottom: 'var(--space-md)' }} />
            <p className="text-muted">No previous month data yet.</p>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {months.map((month) => (
              <Card key={month.month} style={{ padding: 'var(--space-lg)' }}>
                <div className="flex justify-between items-center mobile-stack" style={{ gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                  <div className="flex items-center gap-md">
                    <div style={{ backgroundColor: 'var(--primary-container)', color: 'var(--primary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
                      <CalendarDays size={22} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '20px', marginBottom: '2px' }}>{month.label}</h2>
                      <p className="text-muted body-sm">{month.workCount} work entries</p>
                    </div>
                  </div>
                </div>

                <div className="responsive-grid responsive-grid-3">
                  <div>
                    <div className="flex items-center gap-xs body-sm text-muted" style={{ marginBottom: '4px' }}>
                      <TrendingUp size={14} /> Earned
                    </div>
                    <div className="font-semibold" style={{ fontSize: '20px', color: 'var(--primary)' }}>
                      {formatCurrency(month.earned)}
                    </div>
                    <div className="body-sm text-muted">Expected {formatCurrency(month.expectedEarnings)}</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-xs body-sm text-muted" style={{ marginBottom: '4px' }}>
                      <Wallet size={14} /> Pending
                    </div>
                    <div className="font-semibold" style={{ fontSize: '20px', color: month.pending > 0 ? 'var(--warning)' : 'var(--success)' }}>
                      {formatCurrency(month.pending)}
                    </div>
                    <div className="body-sm text-muted">End of month balance</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-xs body-sm text-muted" style={{ marginBottom: '4px' }}>
                      <TrendingDown size={14} /> Loan Repaid
                    </div>
                    <div className="font-semibold" style={{ fontSize: '20px', color: 'var(--error)' }}>
                      {formatCurrency(month.repaymentTotal)}
                    </div>
                    <div className="body-sm text-muted">{month.repaymentCount} repayments</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
