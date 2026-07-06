import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PaymentForm } from '../components/forms/PaymentForm';
import { WorkEntryForm } from '../components/forms/WorkEntryForm';
import { api } from '../api';
import { CreditCard, Edit2, Trash2, RefreshCw, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const Payments = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showWorkEntryModal, setShowWorkEntryModal] = useState(false);
  const [editingWorkEntry, setEditingWorkEntry] = useState(null);
  const [expandedLogs, setExpandedLogs] = useState({});

  const toggleExpand = (id) => {
    setExpandedLogs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data } = await api.getWorkLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch work logs', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
  }, []);

  const filteredLogs = logs;

  const pendingLogs = filteredLogs.filter(log => log && (log.status === 'Unpaid' || log.status === 'Partially Paid'));
  const paidLogs = filteredLogs.filter(log => log && log.status === 'Paid');

  const isCurrentMonth = (dateValue) => {
    if (!dateValue) return false;
    const date = new Date(dateValue);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  const now = new Date();
  const currentMonthWorkLogs = logs.filter((log) => isCurrentMonth(log.date));

  const totalPending = currentMonthWorkLogs
    .filter(l => l.status !== 'Paid')
    .reduce((sum, log) => sum + (Number(log.amount || 0) - Number(log.amountPaid || 0)), 0);

  // "Collected" = amount actually received for work done this month
  const totalReceived = currentMonthWorkLogs
    .filter(l => l.status === 'Paid' || l.status === 'Partially Paid')
    .reduce((sum, log) => {
      const paid = Number(log.amountPaid || 0);
      return sum + (paid > 0 ? paid : Number(log.amount || 0));
    }, 0);
  
  const totalValue = totalReceived + totalPending;
  const collectionRate = totalValue > 0 ? (totalReceived / totalValue) * 100 : 0;

  const handleRecordPayment = async (formData) => {
    if (!selectedEntry) return;
    try {
      await api.updateWorkLog(selectedEntry._id, formData);
      toast.success('Payment recorded successfully!');
      await fetchLogs();
      setShowPaymentModal(false);
      setSelectedEntry(null);
    } catch (error) {
      console.error('Failed to record payment', error);
      toast.error('Failed to record payment.');
    }
  };

  const handleOpenPaymentModal = (entry) => {
    if (!entry) return;
    setSelectedEntry(entry);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedEntry(null);
  };

  const handleEditWorkEntry = (entry) => {
    if (!entry) return;
    setEditingWorkEntry(entry);
    setShowWorkEntryModal(true);
  };

  const handleDeleteWorkEntry = async (id) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this work entry?')) {
      try {
        await api.deleteWorkLog(id);
        toast.success('Work entry deleted successfully!');
        await fetchLogs();
      } catch (error) {
        console.error('Failed to delete work entry', error);
        toast.error('Failed to delete work entry.');
      }
    }
  };

  const handleUpdateWorkEntry = async (formData) => {
    if (!editingWorkEntry) return;
    try {
      await api.updateWorkLog(editingWorkEntry._id, formData);
      toast.success('Work entry updated successfully!');
      await fetchLogs();
      setShowWorkEntryModal(false);
      setEditingWorkEntry(null);
    } catch (error) {
      console.error('Failed to save work entry', error);
      toast.error('Failed to save work entry.');
    }
  };

  const handleCloseWorkEntryModal = () => {
    setShowWorkEntryModal(false);
    setEditingWorkEntry(null);
  };

  const formatCurrency = (amount) => {
    const value = Number(amount || 0);
    const locale = currency === 'INR' ? 'en-IN' : currency === 'USD' ? 'en-US' : 'en-EU';
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Invalid Date';
    }
  };

  const groupLogsByMonthAndWeek = (logList) => {
    if (!logList || !Array.isArray(logList)) return {};
    
    // Sort logs latest first
    const sortedLogs = [...logList].sort((a, b) => new Date(b.datePaid || b.date) - new Date(a.datePaid || a.date));

    return sortedLogs.reduce((groups, log) => {
      if (!log) return groups;
      try {
        const date = new Date(log.datePaid || log.date);
        if (isNaN(date.getTime())) return groups;
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        // Calculate week of month
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const weekNum = Math.ceil((date.getDate() + startOfMonth.getDay()) / 7);
        const weekLabel = `Week ${weekNum}`;

        if (!groups[monthYear]) groups[monthYear] = {};
        if (!groups[monthYear][weekLabel]) groups[monthYear][weekLabel] = [];
        groups[monthYear][weekLabel].push(log);
      } catch {
        return groups;
      }
      return groups;
    }, {});
  };

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <header className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Payments Ledger</h1>
          <p className="text-muted">Track your earnings and pending collections.</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} title="Refresh data" className="page-refresh-btn">
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>
      </header>

      {/* Metrics Banner — loan-card style */}
      <div className="payments-summary-grid">

        {/* Pending */}
        <div style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', border: '1px solid var(--outline-variant)', background: 'var(--surface-bright)' }}>
          <div style={{ background: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)', padding: '14px 16px 36px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -18, top: -18, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
              <div style={{ width: 32, height: 32, borderRadius: '9px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                <svg width="15" height="15" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pending</div>
            </div>
          </div>
          <div style={{ padding: '0 12px', marginTop: '-24px', position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'var(--surface-bright)', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '12px 16px', border: '1px solid var(--outline-variant)' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.03em', lineHeight: 1 }}>{formatCurrency(totalPending)}</div>
              <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: 4 }}>This month</div>
            </div>
          </div>
          <div style={{ height: 12 }} />
        </div>

        {/* Collected */}
        <div style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', border: '1px solid var(--outline-variant)', background: 'var(--surface-bright)' }}>
          <div style={{ background: 'linear-gradient(135deg, #134e4a 0%, #10b981 100%)', padding: '14px 16px 36px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -18, top: -18, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
              <div style={{ width: 32, height: 32, borderRadius: '9px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                <svg width="15" height="15" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Collected</div>
            </div>
          </div>
          <div style={{ padding: '0 12px', marginTop: '-24px', position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'var(--surface-bright)', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '12px 16px', border: '1px solid var(--outline-variant)' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#10b981', letterSpacing: '-0.03em', lineHeight: 1 }}>{formatCurrency(totalReceived)}</div>
              <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: 4 }}>This month</div>
            </div>
          </div>
          <div style={{ height: 12 }} />
        </div>

        {/* Success Rate */}
        <div style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', border: '1px solid var(--outline-variant)', background: 'var(--surface-bright)' }}>
          <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)', padding: '14px 16px 36px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -18, top: -18, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
              <div style={{ width: 32, height: 32, borderRadius: '9px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                <svg width="15" height="15" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Success Rate</div>
            </div>
          </div>
          <div style={{ padding: '0 12px', marginTop: '-24px', position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'var(--surface-bright)', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '12px 16px', border: '1px solid var(--outline-variant)' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: collectionRate >= 80 ? '#10b981' : collectionRate >= 50 ? '#f59e0b' : '#ef4444', letterSpacing: '-0.03em', lineHeight: 1 }}>{Math.round(collectionRate)}%</div>
              <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: 4 }}>Collection rate</div>
            </div>
          </div>
          <div style={{ height: 12 }} />
        </div>

      </div>

      {/* Tab Navigation */}
      <div className="payment-tabs" style={{ 
        display: 'flex', 
        backgroundColor: 'var(--surface-container)', 
        padding: '4px', 
        borderRadius: '12px',
        marginBottom: 'var(--space-lg)',
        maxWidth: '400px'
      }}>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ 
            flex: 1, 
            padding: '10px', 
            borderRadius: '10px', 
            border: 'none',
            backgroundColor: activeTab === 'pending' ? 'var(--surface-bright)' : 'transparent',
            boxShadow: activeTab === 'pending' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
            fontWeight: activeTab === 'pending' ? '600' : '500',
            color: activeTab === 'pending' ? 'var(--primary)' : 'var(--on-surface-variant)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Pending ({pendingLogs.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ 
            flex: 1, 
            padding: '10px', 
            borderRadius: '10px', 
            border: 'none',
            backgroundColor: activeTab === 'history' ? 'var(--surface-bright)' : 'transparent',
            boxShadow: activeTab === 'history' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
            fontWeight: activeTab === 'history' ? '600' : '500',
            color: activeTab === 'history' ? 'var(--primary)' : 'var(--on-surface-variant)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          History
        </button>
      </div>

      <div className="content">
        {loading ? (
          <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
            <div className="skeleton skeleton-card" style={{ height: '100px', marginBottom: 'var(--space-md)' }}></div>
            <div className="skeleton skeleton-card" style={{ height: '100px' }}></div>
          </div>
        ) : activeTab === 'pending' ? (
          /* Pending View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {pendingLogs.length === 0 ? (
              <Card style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <p className="text-muted">No pending payments. You're all caught up!</p>
              </Card>
            ) : (
              pendingLogs.map((log) => {
                const remaining = log.amount - log.amountPaid;
                const isPartiallyPaid = log.amountPaid > 0;
                const isExpanded = !!expandedLogs[log._id];
                
                return (
                  <Card 
                    key={log._id} 
                    onClick={() => toggleExpand(log._id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpand(log._id);
                      }
                    }}
                    style={{ 
                      padding: 'var(--space-md)', 
                      overflow: 'hidden', 
                      borderLeft: `4px solid ${isPartiallyPaid ? 'var(--primary)' : 'var(--warning)'}`,
                      borderTop: isExpanded ? '1px solid var(--primary)' : '1px solid var(--outline-variant)',
                      borderRight: isExpanded ? '1px solid var(--primary)' : '1px solid var(--outline-variant)',
                      borderBottom: isExpanded ? '1px solid var(--primary)' : '1px solid var(--outline-variant)',
                      backgroundColor: isExpanded ? 'var(--surface-container)' : 'var(--surface-bright)',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      outline: 'none',
                      boxShadow: isExpanded ? '0 4px 20px rgba(0, 0, 0, 0.08)' : 'none'
                    }}
                  >
                    <div className="flex justify-between items-center mobile-card-row" style={{ gap: 'var(--space-md)' }}>
                      <div style={{ flex: 1 }}>
                        <div className="font-semibold" style={{ fontSize: '15px', lineHeight: '1.2' }}>{log.client}</div>
                        <div className="body-sm text-muted" style={{ fontSize: '11px' }}>{formatDate(log.date)}</div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <div className="flex flex-col items-end gap-xs mobile-card-actions">
                          <div className="flex gap-xs mobile-card-actions">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenPaymentModal(log); }} 
                              title="Record Payment"
                              style={{ background: 'var(--primary)', border: 'none', padding: '6px', borderRadius: '6px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <CreditCard size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleEditWorkEntry(log); }} style={{ background: 'var(--surface-container)', border: 'none', padding: '6px', borderRadius: '6px', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteWorkEntry(log._id); }} style={{ background: 'var(--surface-container)', border: 'none', padding: '6px', borderRadius: '6px', color: 'var(--error)', cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <Badge status={log.status} />
                        </div>

                        <div style={{ color: isExpanded ? 'var(--primary)' : 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}>
                          <ChevronDown 
                            size={20} 
                            style={{ 
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)' 
                            }} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="payment-stats-grid" style={{ 
                      backgroundColor: 'var(--surface-container-low)', 
                      padding: '8px', 
                      borderRadius: 'var(--radius-sm)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      alignItems: 'center',
                      marginTop: '10px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div className="body-sm text-muted" style={{ fontSize: '9px', textTransform: 'uppercase' }}>Amount</div>
                        <div className="font-semibold" style={{ fontSize: '13px' }}>{formatCurrency(log.amount)}</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid var(--outline-variant)', borderRight: '1px solid var(--outline-variant)' }}>
                        <div className="body-sm text-muted" style={{ fontSize: '9px', textTransform: 'uppercase' }}>Recv.</div>
                        <div className="font-semibold" style={{ fontSize: '13px', color: isPartiallyPaid ? 'var(--primary)' : 'inherit' }}>{formatCurrency(log.amountPaid || 0)}</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'right' }}>
                        <div className="body-sm text-muted" style={{ fontSize: '9px', textTransform: 'uppercase' }}>Bal.</div>
                        <div className="font-semibold" style={{ fontSize: '13px', color: 'var(--error)' }}>{formatCurrency(remaining)}</div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div 
                        style={{ 
                          marginTop: 'var(--space-md)', 
                          paddingTop: 'var(--space-md)', 
                          borderTop: '1px dashed var(--outline-variant)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--space-md)',
                          animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-md)' }}>
                          <div>
                            <span className="text-muted body-sm" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Date</span>
                            <span className="font-semibold body-sm">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                          <div>
                            <span className="text-muted body-sm" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Details</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                              <span className="body-sm text-muted">Expected: {formatCurrency(log.amount)}</span>
                              <span className="body-sm text-success" style={{ fontWeight: '500' }}>
                                Amount Received: {formatCurrency(log.amountPaid || 0)}
                              </span>
                              <span className="body-sm text-error" style={{ fontWeight: '500' }}>
                                Remaining Balance: {formatCurrency(remaining)}
                              </span>
                            </div>
                          </div>
                          {log.datePaid && (
                            <div>
                              <span className="text-muted body-sm" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Payment Date</span>
                              <span className="font-semibold body-sm">{new Date(log.datePaid).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <span className="text-muted body-sm" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Description</span>
                          <p className="body-sm" style={{ 
                            margin: 0, 
                            padding: '10px 12px', 
                            backgroundColor: 'var(--surface-container-low)', 
                            borderRadius: 'var(--radius-sm)', 
                            whiteSpace: 'pre-wrap', 
                            wordBreak: 'break-word',
                            color: log.description ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                            fontStyle: log.description ? 'normal' : 'italic',
                            borderLeft: '3px solid var(--primary)',
                            lineHeight: '1.4'
                          }}>
                            {log.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          /* History View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {paidLogs.length === 0 ? (
              <Card style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                <p className="text-muted">No payment history yet.</p>
              </Card>
            ) : (
              Object.entries(groupLogsByMonthAndWeek(paidLogs)).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([monthYear, weeks]) => (
                <div key={monthYear} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                  <div className="flex justify-between items-end" style={{ marginBottom: 'var(--space-md)', padding: '0 4px' }}>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--on-surface-variant)', letterSpacing: '0.05em' }}>{monthYear}</h3>
                  </div>
                  
                  {Object.entries(weeks).sort((a, b) => b[0].localeCompare(a[0])).map(([weekLabel, weekLogs]) => (
                    <div key={weekLabel}>
                      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-sm)', padding: '0 4px', borderLeft: '3px solid var(--success)', paddingLeft: 'var(--space-sm)' }}>
                        <span className="font-semibold body-sm text-success">{weekLabel}</span>
                        <span className="text-muted body-sm">
                          Weekly Received: {formatCurrency(weekLogs.reduce((sum, l) => sum + (l.amountPaid || l.amount), 0))}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {weekLogs.map((log) => {
                          const isExpanded = !!expandedLogs[log._id];
                          return (
                            <Card 
                              key={log._id} 
                              onClick={() => toggleExpand(log._id)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  toggleExpand(log._id);
                                }
                              }}
                              style={{ 
                                padding: 'var(--space-md)', 
                                borderTop: isExpanded ? '1px solid var(--primary)' : '1px solid var(--outline-variant)',
                                borderRight: isExpanded ? '1px solid var(--primary)' : '1px solid var(--outline-variant)',
                                borderBottom: isExpanded ? '1px solid var(--primary)' : '1px solid var(--outline-variant)',
                                borderLeft: isExpanded ? '4px solid var(--success)' : '1px solid var(--outline-variant)',
                                backgroundColor: isExpanded ? 'var(--surface-container)' : 'var(--surface-bright)',
                                cursor: 'pointer',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                outline: 'none',
                                boxShadow: isExpanded ? '0 4px 20px rgba(0, 0, 0, 0.08)' : 'none'
                              }}
                            >
                              <div className="flex justify-between items-center mobile-card-row" style={{ gap: 'var(--space-md)' }}>
                                <div style={{ flex: 1 }}>
                                  <div className="font-semibold" style={{ fontSize: '15px' }}>{log.client}</div>
                                  <div className="body-sm text-muted" style={{ fontSize: '11px' }}>Paid {log.datePaid ? formatDate(log.datePaid) : formatDate(log.date)}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                  <div className="flex flex-col items-end gap-xs mobile-card-actions">
                                    <div className="font-semibold" style={{ color: 'var(--success)', fontSize: '14px' }}>{formatCurrency(log.amountPaid || log.amount)}</div>
                                    <div className="flex gap-xs">
                                      <button onClick={(e) => { e.stopPropagation(); handleEditWorkEntry(log); }} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><Edit2 size={12} /></button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteWorkEntry(log._id); }} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={12} /></button>
                                    </div>
                                  </div>
                                  <div style={{ color: isExpanded ? 'var(--primary)' : 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}>
                                    <ChevronDown 
                                      size={20} 
                                      style={{ 
                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                                        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)' 
                                      }} 
                                    />
                                  </div>
                                </div>
                              </div>

                              {isExpanded && (
                                <div 
                                  style={{ 
                                    marginTop: 'var(--space-md)', 
                                    paddingTop: 'var(--space-md)', 
                                    borderTop: '1px dashed var(--outline-variant)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--space-md)',
                                    animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-md)' }}>
                                    <div>
                                      <span className="text-muted body-sm" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Work Date</span>
                                      <span className="font-semibold body-sm">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted body-sm" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Details</span>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                                        <span className="body-sm text-muted">Expected: {formatCurrency(log.amount)}</span>
                                        <span className="body-sm text-success" style={{ fontWeight: '500' }}>
                                          Amount Paid: {formatCurrency(log.amountPaid || log.amount)}
                                        </span>
                                      </div>
                                    </div>
                                    {log.datePaid && (
                                      <div>
                                        <span className="text-muted body-sm" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Paid</span>
                                        <span className="font-semibold body-sm">{new Date(log.datePaid).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <span className="text-muted body-sm" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Description</span>
                                    <p className="body-sm" style={{ 
                                      margin: 0, 
                                      padding: '10px 12px', 
                                      backgroundColor: 'var(--surface-container-low)', 
                                      borderRadius: 'var(--radius-sm)', 
                                      whiteSpace: 'pre-wrap', 
                                      wordBreak: 'break-word',
                                      color: log.description ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                                      fontStyle: log.description ? 'normal' : 'italic',
                                      borderLeft: '3px solid var(--success)',
                                      lineHeight: '1.4'
                                    }}>
                                      {log.description || 'No description provided.'}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showPaymentModal} title="Record a Payment" onClose={handleClosePaymentModal}>
        {selectedEntry && (
          <PaymentForm 
            workEntry={selectedEntry}
            onSubmit={handleRecordPayment}
            onCancel={handleClosePaymentModal}
          />
        )}
      </Modal>

      <Modal isOpen={showWorkEntryModal} title="Edit Work Entry" onClose={handleCloseWorkEntryModal}>
        {editingWorkEntry && (
          <WorkEntryForm 
            initialData={{
              date: editingWorkEntry.date.split('T')[0],
              client: editingWorkEntry.client,
              amount: editingWorkEntry.amount,
              status: editingWorkEntry.status,
              description: editingWorkEntry.description || '',
              amountPaid: editingWorkEntry.amountPaid || 0,
              datePaid: editingWorkEntry.datePaid ? editingWorkEntry.datePaid.split('T')[0] : ''
            }}
            onSubmit={handleUpdateWorkEntry}
            onCancel={handleCloseWorkEntryModal}
          />
        )}
      </Modal>
    </div>
  );
};
