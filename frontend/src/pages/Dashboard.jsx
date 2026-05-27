import { useEffect, useState } from 'react';
import { MetricTile } from '../components/ui/MetricTile';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AnalyticsChart } from '../components/ui/AnalyticsChart';
import { TrendingUp, ClipboardList, WalletCards, CheckCircle2, History, Target, ArrowRight, TrendingDown } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export const Dashboard = () => {
  const { user } = useAuth();
  const monthlyGoal = Number(user?.monthlyGoal) || 50000;
  const currency = user?.currency || 'INR';

  const [summary, setSummary] = useState({
    totalEarnedThisMonth: 0,
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

  useEffect(() => {
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
        setSummary({ ...summaryRes.data, totalEarnedThisMonth });
        setAnalytics(analyticsRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
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
          <h1>Worker Dashboard</h1>
          <p className="text-muted">Welcome back. Here is your financial summary.</p>
        </div>
        <div className="flex gap-sm">
          <Button variant="secondary" onClick={() => window.location.href = '/work-log'}>Log Work</Button>
          <Button variant="secondary" onClick={() => window.location.href = '/loans'}>Record Repayment</Button>
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
      <div className="dashboard-metrics">
        <MetricTile 
          title={`EARNED IN ${getMonthName()}`}
          value={formatCurrency(summary.totalEarnedThisMonth)}
          subtext={`Goal: ${formatCurrency(monthlyGoal)}`}
          subtextColor="primary"
          icon={TrendingUp}
          iconBgColor="#d1fae5"
        />
        <MetricTile 
          title="PENDING PAYMENTS"
          value={formatCurrency(summary.pendingPayments)}
          subtext={`${summary.pendingCount} entries awaiting payment`}
          subtextColor="pending"
          icon={ClipboardList}
          iconBgColor="#fef3c7"
        />
        <MetricTile 
          title="LOAN BALANCE"
          value={formatCurrency(summary.totalLoanBalance)}
          subtext={`Repaid ${Math.round(loanProgress)}% of total`}
          subtextColor={summary.totalLoanBalance === 0 ? 'success' : 'error'}
          icon={WalletCards}
          iconBgColor="#ffe4e6"
        />
        <MetricTile 
          title="REPAID THIS MONTH"
          value={formatCurrency(summary.totalRepaidThisMonth)}
          subtext={summary.totalRepaidThisMonth > 0 ? 'Great progress!' : 'No repayments yet'}
          subtextColor="primary"
          icon={TrendingDown}
          iconBgColor="#f3e8ff"
        />
      </div>

      <div className="dashboard-grid">
        <Card className="analytics-section">
          <div className="section-header">
            <h3>Earnings vs. Repayments</h3>
            <div className="flex items-center gap-sm">
               <div className="flex items-center gap-xs body-sm text-muted">
                 <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)' }}></span> Earnings
               </div>
               <div className="flex items-center gap-xs body-sm text-muted">
                 <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--error)' }}></span> Repayments
               </div>
            </div>
          </div>
          <AnalyticsChart data={analytics} />
        </Card>

        <Card className="goal-progress-card">
          <div className="section-header">
            <h3>Monthly Goal</h3>
            <Target size={20} className="text-primary" />
          </div>
          <div className="goal-content" style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
            <div className="goal-value font-semibold" style={{ fontSize: '32px', marginBottom: 'var(--space-xs)', color: 'var(--on-surface)' }}>
              {Math.round(goalProgress)}%
            </div>
            <div className="text-muted body-sm" style={{ marginBottom: 'var(--space-lg)' }}>
              {formatCurrency(summary.totalEarnedThisMonth)} / {formatCurrency(monthlyGoal)}
            </div>
            
            <div style={{ width: '100%', height: '12px', backgroundColor: 'var(--surface-container-low)', borderRadius: '6px', overflow: 'hidden', marginBottom: 'var(--space-lg)' }}>
              <div 
                style={{ 
                  width: `${goalProgress}%`, 
                  height: '100%', 
                  backgroundColor: 'var(--primary)', 
                  transition: 'width 1s ease-out',
                  borderRadius: '6px'
                }}
              ></div>
            </div>
            
            <p className="body-sm text-muted">
              {goalProgress >= 100 
                ? "Congratulations! You've hit your goal! 🎉" 
                : `You need ${formatCurrency(monthlyGoal - summary.totalEarnedThisMonth)} more to reach your target.`}
            </p>
          </div>
        </Card>

        <Card className="recent-activity">
          <div className="section-header">
            <h3>Recent Activity</h3>
            <a href="/work-log" className="text-primary body-sm font-semibold flex items-center gap-xs">
              View All <ArrowRight size={14} />
            </a>
          </div>
          <div className="activity-list">
            {summary.recentActivity && summary.recentActivity.length > 0 ? (
              summary.recentActivity.map((activity, index) => {
                if (activity.type === 'work') {
                  return (
                    <div className="activity-item" key={index}>
                      <div className="flex items-center">
                        <div className="activity-icon"><CheckCircle2 size={20} /></div>
                        <div className="activity-details">
                          <div className="font-semibold">Log Work: {activity.data.client}</div>
                          <div className="body-sm text-muted">{formatDate(activity.date)}</div>
                        </div>
                      </div>
                      <div className="activity-amount">
                        <div className="font-semibold text-primary">+ {formatCurrency(activity.data.amount)}</div>
                        <Badge status={activity.data.status} />
                      </div>
                    </div>
                  );
                } else if (activity.type === 'repayment') {
                  return (
                    <div className="activity-item" key={index}>
                      <div className="flex items-center">
                        <div className="activity-icon" style={{backgroundColor: '#ffe4e6', color: 'var(--error)'}}><History size={20} /></div>
                        <div className="activity-details">
                          <div className="font-semibold">Repayment: {activity.data.loanId?.lenderName || 'Loan'}</div>
                          <div className="body-sm text-muted">{formatDate(activity.date)}</div>
                        </div>
                      </div>
                      <div className="activity-amount">
                        <div className="font-semibold text-error">- {formatCurrency(activity.data.amount)}</div>
                        <Badge status={activity.data.status || 'Success'} className="badge-default" />
                      </div>
                    </div>
                  );
                }
                return null;
              })
            ) : (
              <p className="text-muted" style={{padding: 'var(--space-md) 0'}}>No recent activity.</p>
            )}
          </div>
        </Card>
      </div>
      </>
      )}
    </div>
  );
};
