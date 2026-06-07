import { useEffect, useState } from 'react';
import { Archive, CalendarDays, ReceiptText, TrendingDown, TrendingUp, Wallet, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export const MonthlyHistory = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const { data } = await api.getMonthlyHistory();
      setMonths(data);
    } catch (error) {
      console.error('Failed to fetch monthly history', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
          <h1 style={{ marginBottom: '4px' }}>Monthly History</h1>
          <p className="text-muted">A snapshot of each previous month's earnings, expenses, and repayments.</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} title="Refresh data" className="page-refresh-btn">
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>
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
              <Card key={month.month} style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                {/* Month header strip */}
                <div style={{ background: 'linear-gradient(135deg, #134e4a 0%, var(--primary) 100%)', padding: 'var(--space-md) var(--space-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <CalendarDays size={20} />
                    </div>
                    <div>
                      <div style={{ color: 'white', fontWeight: '700', fontSize: '17px', letterSpacing: '-0.01em' }}>{month.label}</div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{month.workCount} work {month.workCount === 1 ? 'entry' : 'entries'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net After Expenses</div>
                    <div style={{ color: 'white', fontWeight: '700', fontSize: '22px', letterSpacing: '-0.02em' }}>{formatCurrency(month.earned - month.expenseTotal)}</div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', padding: 'var(--space-md) var(--space-lg)', gap: 'var(--space-md)' }}>
                  <div>
                    <div className="flex items-center gap-xs body-sm text-muted" style={{ marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <TrendingUp size={12} /> Expected
                    </div>
                    <div className="font-semibold" style={{ fontSize: '17px', color: 'var(--on-surface)' }}>
                      {formatCurrency(month.expectedEarnings)}
                    </div>
                    <div className="body-sm text-muted" style={{ fontSize: '11px' }}>Total billed</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-xs body-sm text-muted" style={{ marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <Wallet size={12} /> Pending
                    </div>
                    <div className="font-semibold" style={{ fontSize: '17px', color: month.pending > 0 ? 'var(--warning)' : 'var(--success)' }}>
                      {formatCurrency(month.pending)}
                    </div>
                    <div className="body-sm text-muted" style={{ fontSize: '11px' }}>Uncollected</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-xs body-sm text-muted" style={{ marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <ReceiptText size={12} /> Expenses
                    </div>
                    <div className="font-semibold" style={{ fontSize: '17px', color: 'var(--error)' }}>
                      {formatCurrency(month.expenseTotal)}
                    </div>
                    <div className="body-sm text-muted" style={{ fontSize: '11px' }}>{month.expenseCount} record{month.expenseCount !== 1 ? 's' : ''}</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-xs body-sm text-muted" style={{ marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <TrendingDown size={12} /> Repaid
                    </div>
                    <div className="font-semibold" style={{ fontSize: '17px', color: 'var(--error)' }}>
                      {formatCurrency(month.repaymentTotal)}
                    </div>
                    <div className="body-sm text-muted" style={{ fontSize: '11px' }}>{month.repaymentCount} payment{month.repaymentCount !== 1 ? 's' : ''}</div>
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
