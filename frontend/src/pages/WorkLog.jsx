import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { WorkEntryForm } from '../components/forms/WorkEntryForm';
import { api } from '../api';
import { Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const WorkLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7));

  const fetchLogs = async () => {
    try {
      const { data } = await api.getWorkLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const logMonth = new Date(log.date).toISOString().split('T')[0].substring(0, 7);
    return logMonth === selectedMonth;
  });

  const monthlyStats = {
    totalDays: filteredLogs.length,
    totalEarnings: filteredLogs.reduce((sum, log) => sum + log.amount, 0),
    totalEarned: filteredLogs.reduce((sum, log) => {
      if (log.status === 'Paid') return sum + log.amount;
      return sum + (log.amountPaid || 0);
    }, 0)
  };

  const handleAddOrUpdate = async (formData) => {
    try {
      if (editingEntry) {
        await api.updateWorkLog(editingEntry._id, formData);
        toast.success('Work entry updated successfully!');
      } else {
        await api.createWorkLog(formData);
        toast.success('Work day logged successfully!');
      }
      fetchLogs();
      setShowModal(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Failed to save work entry', error);
      toast.error('Failed to save work entry. Please try again.');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this work entry?')) {
      try {
        await api.deleteWorkLog(id);
        toast.success('Work entry deleted successfully!');
        fetchLogs();
      } catch (error) {
        console.error('Failed to delete work entry', error);
        toast.error('Failed to delete work entry.');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEntry(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getSelectedMonthName = () => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long' });
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
          <h1 style={{marginBottom: 'var(--space-xs)'}}>Monthly Productivity</h1>
          <p className="text-muted">Showing all work records</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Add Work Day</Button>
      </header>

      <div className="content">
        {/* Monthly Stats */}
        <div className="responsive-grid responsive-grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
          <Card style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            <div className="body-sm text-muted">Days Worked in {getSelectedMonthName()}</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>{monthlyStats.totalDays}</div>
          </Card>
          <Card style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            <div className="body-sm text-muted">Expected Earnings in {getSelectedMonthName()}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
              {formatCurrency(monthlyStats.totalEarnings)}
            </div>
          </Card>
          <Card style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            <div className="body-sm text-muted">Already Earned in {getSelectedMonthName()}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>
              {formatCurrency(monthlyStats.totalEarned)}
            </div>
          </Card>
        </div>

        {/* Month Selector */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ 
              padding: 'var(--space-sm) var(--space-md)',
              border: '1px solid var(--outline)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Activity Log */}
        <Card className="activity-log-card">
          <div className="section-header" style={{paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--outline-variant)'}}>
            <h3>Activity Log</h3>
          </div>
          <div className="activity-list" style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', padding: 'var(--space-md) 0'}}>
            {loading ? (
              <div className="skeleton skeleton-text" style={{height: '64px', margin: 'var(--space-md)'}}></div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-muted" style={{padding: 'var(--space-md) 0'}}>No work logs found for this month.</p>
            ) : (
              Object.entries(groupLogsByMonth(filteredLogs)).map(([monthYear, logs]) => (
                <div key={monthYear}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-sm)', padding: '0 var(--space-xs)' }}>
                    <span className="text-muted body-sm font-semibold" style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                      {monthYear}
                    </span>
                    <span className="text-primary body-sm font-semibold">
                      Month Total: {formatCurrency(logs.reduce((sum, log) => sum + log.amount, 0))}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {logs.map((log) => (
                      <div key={log._id} className="activity-item" style={{padding: 'var(--space-md)', backgroundColor: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)'}}>
                        <div className="responsive-grid" style={{ gridTemplateColumns: 'auto 1fr auto', gap: 'var(--space-md)', alignItems: 'center' }}>
                          <div style={{width: '48px', height: '48px', backgroundColor: 'white', color: 'var(--primary)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, border: '1px solid var(--outline-variant)'}}>
                            <span style={{fontSize: '10px', textTransform: 'uppercase'}}>{new Date(log.date).toLocaleString('default', { month: 'short' })}</span>
                            <span>{new Date(log.date).getDate()}</span>
                          </div>
                          
                          <div style={{ overflow: 'hidden' }}>
                            <div className="font-semibold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.client}</div>
                            <div className="body-sm text-muted">{formatCurrency(log.amount)}</div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <Badge status={log.status} />
                            {log.amountPaid > 0 && log.amountPaid < log.amount && (
                              <div className="body-sm text-success font-semibold" style={{fontSize: '11px'}}>
                                Paid: {formatCurrency(log.amountPaid)}
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: '4px' }}>
                              <button 
                                onClick={() => handleEdit(log)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px' }}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(log._id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '4px' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={showModal} title={editingEntry ? 'Edit Work Entry' : 'Log a Work Day'} onClose={handleCloseModal}>
        <WorkEntryForm 
          initialData={editingEntry ? {
            date: editingEntry.date.split('T')[0],
            client: editingEntry.client,
            amount: editingEntry.amount,
            status: editingEntry.status
          } : undefined}
          onSubmit={handleAddOrUpdate}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};
