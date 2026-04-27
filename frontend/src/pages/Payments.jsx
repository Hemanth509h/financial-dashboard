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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showWorkEntryModal, setShowWorkEntryModal] = useState(false);
  const [editingWorkEntry, setEditingWorkEntry] = useState(null);

  const fetchPendingLogs = async () => {
    try {
      const { data } = await api.getWorkLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch work logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLogs();
  }, []);

  const pendingLogs = logs.filter(log => log.status === 'Unpaid' || log.status === 'Partially Paid');
  
  const totalPending = pendingLogs.reduce((sum, log) => sum + (log.amount - log.amountPaid), 0);
  const paidLogs = logs.filter(log => log.status === 'Paid');

  const handleRecordPayment = async (formData) => {
    try {
      await api.updateWorkLog(selectedEntry._id, formData);
      fetchPendingLogs();
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
        fetchPendingLogs();
      } catch (error) {
        console.error('Failed to delete work entry', error);
      }
    }
  };

  const handleUpdateWorkEntry = async (formData) => {
    try {
      await api.updateWorkLog(editingWorkEntry._id, formData);
      fetchPendingLogs();
      setShowWorkEntryModal(false);
      setEditingWorkEntry(null);
    } catch (error) {
      console.error('Failed to save work entry', error);
    }
  };

  const handleCloseWorkEntryModal = () => {
    setShowWorkEntryModal(false);
    setEditingWorkEntry(null);
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
    <div className="page">
      <header className="page-header mobile-stack" style={{marginBottom: 'var(--space-xl)', gap: 'var(--space-md)'}}>
        <div>
          <p className="text-muted" style={{textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em', marginBottom: 'var(--space-xs)'}}>Tracking Overview</p>
          <h1 style={{marginBottom: 'var(--space-xs)'}}>Pending Payments</h1>
          <p className="text-muted">Review and manage outstanding balances for your recent work entries.</p>
        </div>
      </header>
      
      <div className="content">
        {/* Total Pending Card */}
        {pendingLogs.length > 0 && (
          <Card style={{ 
            padding: 'var(--space-lg)',
            marginBottom: 'var(--space-xl)',
            borderLeft: '4px solid var(--warning)',
            backgroundColor: 'rgba(255, 193, 7, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <CreditCard size={32} color="var(--warning)" />
              <div>
                <div className="text-muted body-sm">Total Outstanding</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--warning)' }}>
                  {formatCurrency(totalPending)}
                </div>
                <div className="body-sm text-muted">{pendingLogs.length} {pendingLogs.length === 1 ? 'entry' : 'entries'} awaiting payment</div>
              </div>
            </div>
          </Card>
        )}

        {/* Pending Entries List */}
        <Card className="activity-log-card">
          <div className="section-header" style={{paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--outline-variant)', marginBottom: 'var(--space-md)'}}>
            <h3>Work Entries Pending Payment</h3>
          </div>

          <div className="activity-list" style={{display: 'flex', flexDirection: 'column'}}>
            {loading ? (
              <p>Loading...</p>
            ) : pendingLogs.length === 0 ? (
              <p className="text-muted" style={{padding: 'var(--space-md) 0'}}>No pending payments. All caught up!</p>
            ) : null}
            
            {pendingLogs.map((log) => {
              const remaining = log.amount - log.amountPaid;
              const isPartiallyPaid = log.amountPaid > 0;
              
              return (
                <div 
                  key={log._id} 
                  className="activity-item"
                  style={{
                    padding: 'var(--space-md)',
                    marginBottom: 'var(--space-md)',
                    backgroundColor: 'var(--surface-container-low)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--outline-variant)'
                  }}
                >
                  <div className="responsive-grid responsive-grid-3" style={{ marginBottom: 'var(--space-md)' }}>
                    <div>
                      <div className="body-sm text-muted">Work Date</div>
                      <div className="font-semibold">{formatDate(log.date)}</div>
                    </div>
                    <div>
                      <div className="body-sm text-muted">Client / Project</div>
                      <div>
                        <div className="font-semibold">{log.client}</div>
                      </div>
                    </div>
                    <div className="mobile-left" style={{textAlign: 'right'}}>
                      <div className="body-sm text-muted">Status</div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 'var(--space-md)' }} className="mobile-justify-start">
                        <Badge status={log.status} />
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                          <button 
                            onClick={() => handleEditWorkEntry(log)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0 }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteWorkEntry(log._id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 0 }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="responsive-grid responsive-grid-3" style={{ marginBottom: 'var(--space-md)' }}>
                    <div style={{ backgroundColor: 'white', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)' }}>
                      <div className="body-sm text-muted">Expected</div>
                      <div className="font-semibold">{formatCurrency(log.amount)}</div>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)' }}>
                      <div className="body-sm text-muted">Received</div>
                      <div className="font-semibold" style={{ color: isPartiallyPaid ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {formatCurrency(log.amountPaid || 0)}
                      </div>
                    </div>
                    <div style={{ backgroundColor: 'white', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)' }}>
                      <div className="body-sm text-muted">Outstanding</div>
                      <div className="font-semibold" style={{ color: 'var(--error)' }}>
                        {formatCurrency(remaining)}
                      </div>
                    </div>
                  </div>

                  {isPartiallyPaid && (
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                      <div className="body-sm text-muted" style={{ marginBottom: 'var(--space-xs)' }}>Payment Progress</div>
                      <div style={{width: '100%', height: '6px', backgroundColor: 'white', borderRadius: '4px'}}>
                        <div style={{
                          width: `${(log.amountPaid / log.amount) * 100}%`,
                          height: '100%',
                          backgroundColor: 'var(--primary)',
                          borderRadius: '4px'
                        }}></div>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => handleOpenPaymentModal(log)}
                    style={{ width: '100%' }}
                  >
                    + Record Payment
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Payment History List */}
      <div className="content" style={{ marginTop: 'var(--space-xl)' }}>
        {paidLogs.length > 0 && (
          <Card className="activity-log-card">
            <div className="section-header" style={{paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--outline-variant)', marginBottom: 'var(--space-md)'}}>
              <h3>Payment History</h3>
            </div>

            <div className="activity-list" style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-md)'}}>
              {Object.entries(groupLogsByMonth(paidLogs)).map(([monthYear, logs]) => (
                <div key={monthYear}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-xs)', padding: '0 var(--space-xs)' }}>
                    <span className="text-muted body-sm font-semibold" style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                      {monthYear}
                    </span>
                    <span className="text-primary body-sm font-semibold">
                      Total Received: {formatCurrency(logs.reduce((sum, log) => sum + (log.amountPaid || log.amount), 0))}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {logs.map((log) => (
                      <div 
                        key={log._id} 
                        className="activity-item"
                        style={{
                          padding: 'var(--space-md)',
                          backgroundColor: 'var(--surface-container-low)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--outline-variant)'
                        }}
                      >
                        <div className="responsive-grid responsive-grid-3" style={{ gap: 'var(--space-lg)' }}>
                          <div>
                            <div className="body-sm text-muted">Work Date</div>
                            <div className="font-semibold">{formatDate(log.date)}</div>
                          </div>
                          <div>
                            <div className="body-sm text-muted">Client / Project</div>
                            <div>
                              <div className="font-semibold">{log.client}</div>
                            </div>
                          </div>
                          <div style={{textAlign: 'right'}}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
                              <div style={{textAlign: 'right'}}>
                                <div className="body-sm text-muted">Amount Paid</div>
                                <div className="font-semibold" style={{ color: 'var(--success)' }}>
                                  {formatCurrency(log.amountPaid || log.amount)}
                                </div>
                                <div className="body-sm text-muted">on {log.datePaid ? formatDate(log.datePaid) : 'Unknown'}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: '4px' }}>
                                <button 
                                  onClick={() => handleEditWorkEntry(log)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0 }}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteWorkEntry(log._id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 0 }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
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
