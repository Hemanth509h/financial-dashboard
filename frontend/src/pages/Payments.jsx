import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PaymentForm } from '../components/forms/PaymentForm';
import { WorkEntryForm } from '../components/forms/WorkEntryForm';
import { api } from '../api';
import { CreditCard, Edit2, Trash2 } from 'lucide-react';

export const Payments = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showWorkEntryModal, setShowWorkEntryModal] = useState(false);
  const [editingWorkEntry, setEditingWorkEntry] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data } = await api.getWorkLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch work logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const pendingLogs = logs.filter(log => log.status === 'Unpaid' || log.status === 'Partially Paid');
  const paidLogs = logs.filter(log => log.status === 'Paid');
  
  const totalPending = pendingLogs.reduce((sum, log) => sum + (log.amount - log.amountPaid), 0);
  const totalReceived = paidLogs.reduce((sum, log) => sum + (log.amountPaid || log.amount), 0);
  const collectionRate = logs.length > 0 ? (paidLogs.length / logs.length) * 100 : 0;

  const handleRecordPayment = async (formData) => {
    try {
      await api.updateWorkLog(selectedEntry._id, formData);
      fetchLogs();
      setShowPaymentModal(false);
      setSelectedEntry(null);
    } catch (error) {
      console.error('Failed to record payment', error);
    }
  };

  const handleOpenPaymentModal = (entry) => {
    setSelectedEntry(entry);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedEntry(null);
  };

  const handleEditWorkEntry = (entry) => {
    setEditingWorkEntry(entry);
    setShowWorkEntryModal(true);
  };

  const handleDeleteWorkEntry = async (id) => {
    if (confirm('Are you sure you want to delete this work entry?')) {
      try {
        await api.deleteWorkLog(id);
        fetchLogs();
      } catch (error) {
        console.error('Failed to delete work entry', error);
      }
    }
  };

  const handleUpdateWorkEntry = async (formData) => {
    try {
      await api.updateWorkLog(editingWorkEntry._id, formData);
      fetchLogs();
      setShowWorkEntryModal(false);
      setEditingWorkEntry(null);
    } catch (error) {
      console.error('Failed to save work entry', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const groupLogsByMonth = (logList) => {
    if (!logList) return {};
    return logList.reduce((groups, log) => {
      const date = new Date(log.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(log);
      return groups;
    }, {});
  };

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <header className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>Payments Ledger</h1>
          <p className="text-muted">Track your earnings and pending collections.</p>
        </div>
      </header>

      {/* Metrics Banner */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: 'var(--space-sm)',
        marginBottom: 'var(--space-xl)'
      }}>
        <div style={{ backgroundColor: 'var(--warning)', color: 'white', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}>
          <div className="body-sm" style={{ opacity: 0.9 }}>Total Pending</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{formatCurrency(totalPending)}</div>
        </div>
        <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
          <div className="body-sm" style={{ opacity: 0.9 }}>Total Collected</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{formatCurrency(totalReceived)}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)' }}>
          <div className="body-sm text-muted">Success Rate</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px', color: 'var(--on-surface)' }}>{Math.round(collectionRate)}%</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
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
            backgroundColor: activeTab === 'pending' ? 'white' : 'transparent',
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
            backgroundColor: activeTab === 'history' ? 'white' : 'transparent',
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
                
                return (
                  <Card key={log._id} style={{ padding: '0', overflow: 'hidden', borderLeft: `6px solid ${isPartiallyPaid ? 'var(--primary)' : 'var(--warning)'}` }}>
                    <div style={{ padding: 'var(--space-md)' }}>
                      <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-md)' }}>
                        <div>
                          <div className="font-semibold" style={{ fontSize: '18px' }}>{log.client}</div>
                          <div className="body-sm text-muted">{formatDate(log.date)}</div>
                        </div>
                        <div className="flex flex-col items-end gap-xs">
                          <Badge status={log.status} />
                          <div className="flex gap-xs" style={{ marginTop: '4px' }}>
                            <button onClick={() => handleEditWorkEntry(log)} style={{ background: 'var(--surface-container)', border: 'none', padding: '6px', borderRadius: '6px', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteWorkEntry(log._id)} style={{ background: 'var(--surface-container)', border: 'none', padding: '6px', borderRadius: '6px', color: 'var(--error)', cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="payment-stats-grid" style={{ 
                        backgroundColor: 'var(--surface-container-low)', 
                        padding: 'var(--space-sm)', 
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-md)'
                      }}>
                        <div>
                          <div className="body-sm text-muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Amount</div>
                          <div className="font-semibold">{formatCurrency(log.amount)}</div>
                        </div>
                        <div>
                          <div className="body-sm text-muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Received</div>
                          <div className="font-semibold" style={{ color: isPartiallyPaid ? 'var(--primary)' : 'inherit' }}>{formatCurrency(log.amountPaid || 0)}</div>
                        </div>
                        <div>
                          <div className="body-sm text-muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Balance</div>
                          <div className="font-semibold" style={{ color: 'var(--error)' }}>{formatCurrency(remaining)}</div>
                        </div>
                      </div>

                      {isPartiallyPaid && (
                        <div style={{ marginBottom: 'var(--space-md)' }}>
                          <div className="flex justify-between items-center" style={{ marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>Collected {Math.round((log.amountPaid / log.amount) * 100)}%</span>
                          </div>
                          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--surface-container-high)', borderRadius: '2px' }}>
                            <div style={{ width: `${(log.amountPaid / log.amount) * 100}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '2px' }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleOpenPaymentModal(log)}
                      style={{ 
                        width: '100%', 
                        padding: '14px', 
                        border: 'none', 
                        borderTop: '1px solid var(--outline-variant)',
                        backgroundColor: 'white',
                        color: 'var(--primary)',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <CreditCard size={16} />
                      Record Payment
                    </button>
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
              Object.entries(groupLogsByMonth(paidLogs)).map(([monthYear, monthLogs]) => (
                <div key={monthYear}>
                  <div className="flex justify-between items-end" style={{ marginBottom: 'var(--space-md)', padding: '0 4px' }}>
                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--on-surface-variant)', letterSpacing: '0.05em' }}>{monthYear}</h3>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary)' }}>{formatCurrency(monthLogs.reduce((sum, l) => sum + (l.amountPaid || l.amount), 0))}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {monthLogs.map((log) => (
                      <Card key={log._id} style={{ padding: 'var(--space-md)' }}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">{log.client}</div>
                            <div className="body-sm text-muted">Paid on {log.datePaid ? formatDate(log.datePaid) : formatDate(log.date)}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="font-semibold" style={{ color: 'var(--success)' }}>{formatCurrency(log.amountPaid || log.amount)}</div>
                            <div className="flex gap-xs" style={{ marginTop: '4px', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleEditWorkEntry(log)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><Edit2 size={12} /></button>
                              <button onClick={() => handleDeleteWorkEntry(log._id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={12} /></button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
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
