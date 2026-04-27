import React, { useEffect, useState } from 'react';
import { MetricTile } from '../components/ui/MetricTile';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { TrendingUp, ClipboardList, WalletCards, CheckCircle2, History } from 'lucide-react';
import { api } from '../api';
import './Dashboard.css';

export const Dashboard = () => {
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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data } = await api.getDashboardSummary();
        setSummary(data);
      } catch (error) {
        console.error('Failed to fetch summary', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getMonthName = (date = new Date()) => {
    return date.toLocaleString('default', { month: 'long' }).toUpperCase();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="dashboard-page">
      <header className="page-header mobile-stack" style={{marginBottom: 'var(--space-xl)', gap: 'var(--space-md)'}}>
        <div>
          <h1>Worker Dashboard</h1>
          <p className="text-muted">Welcome back. Here is your financial summary.</p>
        </div>
      </header>

      {loading ? (
        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
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
          subtext="↑ 12% from last month"
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
          title="TOTAL LOAN BALANCE"
          value={formatCurrency(summary.totalLoanBalance)}
          subtext="Next installment: ₹2,500"
          subtextColor="error"
          icon={WalletCards}
          iconBgColor="#ffe4e6"
        />
      </div>

      <div className="dashboard-grid">
        <Card className="recent-activity">
          <div className="section-header">
            <h3>Recent Activity</h3>
            <a href="#" className="text-primary body-sm font-semibold">View All</a>
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
                        <Badge status={activity.data.status} className="badge-default" />
                      </div>
                    </div>
                  );
                }
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
