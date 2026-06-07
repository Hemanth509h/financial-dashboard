import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PaymentForm } from '../components/forms/PaymentForm';
import { WorkEntryForm } from '../components/forms/WorkEntryForm';
import { api } from '../api';
import { CreditCard, Edit2, Trash2, Search, X, RefreshCw } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredLogs = logs.filter(log => {
    if (!log) return false;
    return log.client.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
      if (!log || !log.date) return groups;
      try {
        const date = new Date(log.date);
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

      {/* Search Bar */}
      <div className="search-container" style={{ marginBottom: 'var(--space-lg)', maxWidth: 'none' }}>
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search client names..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{ maxWidth: '400px', width: '100%' }}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
          >
            <X size={14} />
          </button>
        )}
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
                
                return (
                  <Card key={log._id} style={{ padding: 'var(--space-sm)', overflow: 'hidden', borderLeft: `4px solid ${isPartiallyPaid ? 'var(--primary)' : 'var(--warning)'}` }}>
                    <div className="flex justify-between items-start mobile-card-row" style={{ marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <div className="font-semibold" style={{ fontSize: '15px', lineHeight: '1.2' }}>{log.client}</div>
                        <div className="body-sm text-muted" style={{ fontSize: '11px' }}>{formatDate(log.date)}</div>
                      </div>
                      <div className="flex flex-col items-end gap-xs mobile-card-actions">
                        <div className="flex gap-xs mobile-card-actions">
                          <button 
                            onClick={() => handleOpenPaymentModal(log)} 
                            title="Record Payment"
                            style={{ background: 'var(--primary)', border: 'none', padding: '6px', borderRadius: '6px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <CreditCard size={14} />
                          </button>
                          <button onClick={() => handleEditWorkEntry(log)} style={{ background: 'var(--surface-container)', border: 'none', padding: '6px', borderRadius: '6px', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteWorkEntry(log._id)} style={{ background: 'var(--surface-container)', border: 'none', padding: '6px', borderRadius: '6px', color: 'var(--error)', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <Badge status={log.status} />
                      </div>
                    </div>

                    <div className="payment-stats-grid" style={{ 
                      backgroundColor: 'var(--surface-container-low)', 
                      padding: '8px', 
                      borderRadius: 'var(--radius-sm)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      alignItems: 'center'
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
                  </Card>
                )
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
                        {weekLogs.map(log => (
                          <Card key={log._id} style={{ padding: 'var(--space-sm)' }}>
                            <div className="flex justify-between items-center mobile-card-row">
                              <div style={{ flex: 1 }}>
                                <div className="font-semibold" style={{ fontSize: '15px' }}>{log.client}</div>
                                <div className="body-sm text-muted" style={{ fontSize: '11px' }}>Paid {log.datePaid ? formatDate(log.datePaid) : formatDate(log.date)}</div>
                              </div>
                              <div className="flex flex-col items-end gap-xs mobile-card-actions">
                                <div className="font-semibold" style={{ color: 'var(--success)', fontSize: '14px' }}>{formatCurrency(log.amountPaid || log.amount)}</div>
                                <div className="flex gap-xs">
                                  <button onClick={() => handleEditWorkEntry(log)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><Edit2 size={12} /></button>
                                  <button onClick={() => handleDeleteWorkEntry(log._id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={12} /></button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
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
              status: editingWorkEntry.status
            }}
            onSubmit={handleUpdateWorkEntry}
            onCancel={handleCloseWorkEntryModal}
          />
        )}
      </Modal>
    </div>
  );
};
