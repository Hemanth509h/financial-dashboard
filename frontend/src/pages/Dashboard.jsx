import { useEffect, useState } from 'react';
import { MetricTile } from '../components/ui/MetricTile';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AnalyticsChart } from '../components/ui/AnalyticsChart';
import { TrendingUp, ClipboardList, WalletCards, CheckCircle2, History, Target, ArrowRight, TrendingDown, RefreshCw, ReceiptText, Banknote, CircleCheckBig } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export const Dashboard = () => {
  const { user } = useAuth();
  const monthlyGoal = Number(user?.monthlyGoal) || 50000;
  const currency = user?.currency || 'INR';

  const [summary, setSummary] = useState({
    totalEarnedThisMonth: 0,
    totalExpensesThisMonth: 0,
    netIncomeThisMonth: 0,
    pendingPayments: 0,
    pendingCount: 0,
    totalLoanBalance: 0,
    totalLoanGoal: 0,
    totalLoanPaid: 0,
    totalRepaidThisMonth: 0,
    recentActivity: []
  });

  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [summaryRes, analyticsRes, workLogsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getAnalytics(),
        api.getWorkLogs()
      ]);
      const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7);
      const totalEarnedThisMonth = workLogsRes.data
        .filter((log) => new Date(log.date).toISOString().split('T')[0].substring(0, 7) === currentMonth)
        .reduce((sum, log) => {
          if (log.status === 'Paid') return sum + Number(log.amount || 0);
          return sum + Number(log.amountPaid || 0);
        }, 0);
      setSummary({
        ...summaryRes.data,
        totalEarnedThisMonth,
        netIncomeThisMonth: totalEarnedThisMonth - Number(summaryRes.data.totalExpensesThisMonth || 0),
      });
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    const locale = currency === 'INR' ? 'en-IN' : currency === 'USD' ? 'en-US' : 'en-EU';
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  };

  const getMonthName = (date = new Date()) => {
    return date.toLocaleString('default', { month: 'long' }).toUpperCase();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const goalProgress = Math.min((summary.totalEarnedThisMonth / monthlyGoal) * 100, 100);
  const loanProgress = summary.totalLoanGoal > 0 ? (summary.totalLoanPaid / summary.totalLoanGoal) * 100 : 0;

  return (
    <div className="dashboard-page">
      <header className="page-header mobile-stack" style={{marginBottom: 'var(--space-xl)', gap: 'var(--space-md)'}}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Worker Dashboard</h1>
          <p className="text-muted">Welcome back — here's your financial snapshot.</p>
        </div>
        <div className="flex gap-sm" style={{ alignItems: 'center' }}>
          <button onClick={handleRefresh} disabled={refreshing} title="Refresh data" className="page-refresh-btn">
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <Button variant="secondary" onClick={() => window.location.href = '/work-log'}>Log Work</Button>
          <Button onClick={() => window.location.href = '/expenses'}>Add Expense</Button>
        </div>
      </header>

      {loading ? (
        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'var(--space-md)' }}>
             <div className="skeleton skeleton-card"></div>
             <div className="skeleton skeleton-card"></div>
             <div className="skeleton skeleton-card"></div>
             <div className="skeleton skeleton-card"></div>
          </div>
          <div className="skeleton skeleton-card" style={{ height: '300px' }}></div>
        </div>
      ) : (
        <>
      <section className="loan-overview" aria-labelledby="loan-overview-title">
        <div className="loan-overview-heading">
          <div>
            <p className="loan-overview-eyebrow">Your borrowing snapshot</p>
            <h2 id="loan-overview-title">Loan Overview</h2>
          </div>
          <a href="/loans" className="loan-overview-link">Manage loans <ArrowRight size={15} /></a>
        </div>
        <div className="loan-overview-grid">
          <div className="loan-summary-card loan-summary-card--borrowed">
            <div className="loan-summary-banner">
              <div className="loan-summary-icon"><Banknote size={24} /></div>
              <span>Total borrowed</span>
            </div>
            <div className="loan-summary-value">
              <strong>{formatCurrency(summary.totalLoanGoal)}</strong>
              <span>Principal sum</span>
            </div>
          </div>
          <div className="loan-summary-card loan-summary-card--balance">
            <div className="loan-summary-banner">
              <div className="loan-summary-icon"><WalletCards size={24} /></div>
              <span>Outstanding balance</span>
            </div>
            <div className="loan-summary-value">
              <strong>{formatCurrency(summary.totalLoanBalance)}</strong>
              <span>Including interest additions</span>
            </div>
          </div>
          <div className="loan-summary-card loan-summary-card--progress">
            <div className="loan-summary-banner">
              <div className="loan-summary-icon"><CircleCheckBig size={24} /></div>
              <span>Total progress</span>
            </div>
            <div className="loan-summary-value">
              <strong>{Math.round(loanProgress)}%</strong>
              <span>Repaid {formatCurrency(summary.totalLoanPaid)} in total</span>
              <div className="loan-summary-progress" aria-label={`${Math.round(loanProgress)} percent repaid`}>
                <div style={{ width: `${Math.min(loanProgress, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-metrics">
        <MetricTile
          title={`Earned in ${getMonthName()}`}
          value={formatCurrency(summary.totalEarnedThisMonth)}
          subtext={`Goal: ${formatCurrency(monthlyGoal)}`}
          subtextColor="primary"
          icon={TrendingUp}
          gradientFrom="#134e4a"
          gradientTo="#10b981"
        />
        <MetricTile
          title="Expenses This Month"
          value={formatCurrency(summary.totalExpensesThisMonth)}
          subtext={`Net: ${formatCurrency(summary.netIncomeThisMonth)}`}
          subtextColor={summary.netIncomeThisMonth >= 0 ? 'success' : 'error'}
          icon={ReceiptText}
          gradientFrom="#9a3412"
          gradientTo="#f97316"
        />
        <MetricTile
          title="Pending Payments"
          value={formatCurrency(summary.pendingPayments)}
          subtext={`${summary.pendingCount} entries awaiting payment`}
          subtextColor="pending"
          icon={ClipboardList}
          gradientFrom="#78350f"
          gradientTo="#f59e0b"
        />
        <MetricTile
          title="Loan Balance"
          value={formatCurrency(summary.totalLoanBalance)}
          subtext={`Repaid ${Math.round(loanProgress)}% of total`}
          subtextColor={summary.totalLoanBalance === 0 ? 'success' : 'error'}
          icon={WalletCards}
          gradientFrom="#7f1d1d"
          gradientTo="#ef4444"
        />
        <MetricTile
          title="Repaid This Month"
          value={formatCurrency(summary.totalRepaidThisMonth)}
          subtext={summary.totalRepaidThisMonth > 0 ? 'Great progress!' : 'No repayments yet'}
          subtextColor="primary"
          icon={TrendingDown}
          gradientFrom="#4c1d95"
          gradientTo="#8b5cf6"
        />
      </div>

      <div className="dashboard-grid">

        {/* ── Analytics Card ── */}
        <div className="analytics-section" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', border: '1px solid var(--outline-variant)', background: 'var(--surface-bright)' }}>
          <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)', padding: '18px 20px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', right: 40, top: 55, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <TrendingUp size={18} color="#fff" />
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Earnings, Expenses, Repayments</div>
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block' }}></span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Earnings</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316', display: 'inline-block' }}></span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Expenses</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', display: 'inline-block' }}></span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Repayments</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: '16px 20px 20px' }}>
            <AnalyticsChart data={analytics} />
          </div>
        </div>

        {/* ── Monthly Goal Card ── */}
        <div className="goal-progress-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', border: '1px solid var(--outline-variant)', background: 'var(--surface-bright)' }}>
          <div style={{ background: 'linear-gradient(135deg, #134e4a 0%, #10b981 100%)', padding: '18px 20px 42px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -25, top: -25, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                <Target size={18} color="#fff" />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Monthly Goal</div>
            </div>
          </div>
          <div style={{ padding: '0 16px', marginTop: '-28px', position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'var(--surface-bright)', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', padding: '16px 20px', border: '1px solid var(--outline-variant)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: '30px', fontWeight: 900, color: 'var(--on-surface)', letterSpacing: '-0.04em', lineHeight: 1 }}>{Math.round(goalProgress)}%</div>
                  <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: 4 }}>{formatCurrency(summary.totalEarnedThisMonth)} of {formatCurrency(monthlyGoal)}</div>
                </div>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--surface-container-high)', borderRadius: '99px', overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ width: `${goalProgress}%`, height: '100%', background: goalProgress >= 100 ? 'linear-gradient(90deg, #059669, #10b981)' : 'linear-gradient(90deg, var(--primary), #34d399)', transition: 'width 1s ease-out', borderRadius: '99px', boxShadow: '0 0 8px rgba(16,185,129,0.35)' }} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', margin: 0 }}>
                {goalProgress >= 100 ? "🎉 Goal reached this month!" : `${formatCurrency(monthlyGoal - summary.totalEarnedThisMonth)} more to hit your target`}
              </p>
            </div>
          </div>
          <div style={{ height: 16 }} />
        </div>

        {/* ── Recent Activity Card ── */}
        <div className="recent-activity" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', border: '1px solid var(--outline-variant)', background: 'var(--surface-bright)' }}>
          <div style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)', padding: '18px 20px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -25, top: -25, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <History size={18} color="#fff" />
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Recent Activity</div>
              </div>
              <a href="/work-log" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                View All <ArrowRight size={12} />
              </a>
            </div>
          </div>
          <div style={{ padding: '4px 0 0' }}>
            {summary.recentActivity && summary.recentActivity.length > 0 ? (
              summary.recentActivity.map((activity, index) => {
                const isWork = activity.type === 'work';
                const isExpense = activity.type === 'expense';
                return (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: index < summary.recentActivity.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '10px', background: isWork ? 'linear-gradient(135deg, #134e4a, #10b981)' : isExpense ? 'linear-gradient(135deg, #9a3412, #f97316)' : 'linear-gradient(135deg, #7f1d1d, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isWork ? <CheckCircle2 size={18} color="#fff" /> : isExpense ? <ReceiptText size={18} color="#fff" /> : <History size={18} color="#fff" />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--on-surface)' }}>{isWork ? activity.data.client : isExpense ? (activity.data.merchant || activity.data.category) : activity.data.loanId?.lenderName || 'Loan'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>{isWork ? 'Work entry' : isExpense ? 'Expense' : 'Repayment'} · {formatDate(activity.date)}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: isWork ? 'var(--primary)' : 'var(--error)' }}>{isWork ? '+' : '-'} {formatCurrency(activity.data.amount)}</div>
                      <Badge status={isWork ? activity.data.status : isExpense ? activity.data.category : (activity.data.status || 'Success')} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>No recent activity yet.</p>
            )}
          </div>
        </div>

      </div>
      </>
      )}
    </div>
  );
};
