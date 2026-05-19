import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { WorkEntryForm } from '../components/forms/WorkEntryForm';
import { api } from '../api';
import { Edit2, Trash2, Download, Search, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export const WorkLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export for this month.');
      return;
    }
    const headers = ['Date', 'Client', 'Amount', 'Amount Paid', 'Status'];
    const csvData = filteredLogs.map(log => [
      `"${new Date(log.date).toLocaleDateString()}"`,
      `"${log.client.replace(/"/g, '""')}"`,
      log.amount,
      log.amountPaid || 0,
      log.status
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `work_logs_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully!');
  };

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const logMonth = new Date(log.date).toISOString().split('T')[0].substring(0, 7);
    const matchesMonth = logMonth === selectedMonth;

    const matchesSearch = log.client.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

    return matchesMonth && matchesSearch && matchesStatus;
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

  const groupLogsByMonthAndWeek = (logList) => {
    if (!logList) return {};

    // Sort logs latest first
    const sortedLogs = [...logList].sort((a, b) => new Date(b.date) - new Date(a.date));

    return sortedLogs.reduce((groups, log) => {
      const date = new Date(log.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });

      // Calculate week of month
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const weekNum = Math.ceil((date.getDate() + startOfMonth.getDay()) / 7);
      const weekLabel = `Week ${weekNum}`;

      if (!groups[monthYear]) groups[monthYear] = {};
      if (!groups[monthYear][weekLabel]) groups[monthYear][weekLabel] = [];

      groups[monthYear][weekLabel].push(log);
      return groups;
    }, {});
  };

  return (
    <div className="page">
      <header className="page-header mobile-stack" style={{ marginBottom: 'var(--space-xl)', gap: 'var(--space-md)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-xs)' }}>Monthly Productivity</h1>
          <p className="text-muted">Showing all work records</p>
        </div>
        <div className="mobile-header-actions">
          <button className="page-header-action-btn" onClick={handleExport} title="Export CSV">
            <Download size={18} />
          </button>
        </div>
        <div className="flex gap-sm">
          <Button variant="secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Export CSV
          </Button>
          <Button onClick={() => setShowModal(true)}>+ Add Work Day</Button>
        </div>
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

        {/* Filters & Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', alignItems: 'center' }}>
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
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

          <div className="filter-group">
            {['All', 'Paid', 'Unpaid', 'Partially Paid'].map(status => (
              <button
                key={status}
                className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="month-filter" style={{ marginLeft: 'auto' }}>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '0.6rem 1rem',
                border: '1px solid var(--outline-variant)',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                background: 'var(--surface-container-low)',
                color: 'var(--on-surface)',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* Activity Log */}
        <Card className="activity-log-card">
          <div className="section-header" style={{ paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--outline-variant)' }}>
            <h3>Activity Log</h3>
          </div>
          <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', padding: 'var(--space-md) 0' }}>
            {loading ? (
              <div className="skeleton skeleton-text" style={{ height: '64px', margin: 'var(--space-md)' }}></div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-muted" style={{ padding: 'var(--space-md) 0' }}>No work logs found for this month.</p>
            ) : (
              Object.entries(groupLogsByMonthAndWeek(filteredLogs)).sort((a, b) => {
                // Assuming format "Month Year" like "October 2026"
                // For "filteredLogs" it's usually within one month anyway, 
                // but good to have for robustness.
                return new Date(b[0]) - new Date(a[0]);
              }).map(([monthYear, weeks]) => (
                <div key={monthYear} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                  <div className="flex justify-between items-center" style={{ padding: '0 var(--space-xs)' }}>
                    <span className="text-muted body-sm font-bold" style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>
                      {monthYear}
                    </span>
                  </div>

                  {Object.entries(weeks).sort((a, b) => b[0].localeCompare(a[0])).map(([weekLabel, weekLogs]) => (
                    <div key={weekLabel}>
                      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-sm)', padding: '0 var(--space-xs)', borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-sm)' }}>
                        <span className="font-semibold body-sm text-primary">{weekLabel}</span>
                        <span className="text-muted body-sm">
                          Weekly Total: {formatCurrency(weekLogs.reduce((sum, log) => sum + log.amount, 0))}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {weekLogs.map((log) => (
                          <div key={log._id} className="work-log-item" style={{ padding: 'var(--space-md)', backgroundColor: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)' }}>
                            <div className="responsive-grid work-log-entry-grid" style={{ gridTemplateColumns: 'auto 1fr auto', gap: 'var(--space-md)', alignItems: 'center' }}>
                              <div style={{ width: '48px', height: '48px', backgroundColor: 'white', color: 'var(--primary)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, border: '1px solid var(--outline-variant)' }}>
                                <span style={{ fontSize: '10px', textTransform: 'uppercase' }}>{new Date(log.date).toLocaleString('default', { month: 'short' })}</span>
                                <span>{new Date(log.date).getDate()}</span>
                              </div>

                              <div style={{ overflow: 'hidden' }}>
                                <div className="font-semibold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.client}</div>
                                <div className="body-sm text-muted">{formatCurrency(log.amount)}</div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                <Badge status={log.status} />
                                {log.amountPaid > 0 && log.amountPaid < log.amount && (
                                  <div className="body-sm text-success font-semibold" style={{ fontSize: '11px' }}>
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
                  ))}
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

      {/* Mobile FAB */}
      <button className="mobile-fab" onClick={() => setShowModal(true)} title="Add Work Day">
        <Plus size={24} />
      </button>
    </div>
  );
};
