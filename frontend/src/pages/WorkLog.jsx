import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { WorkEntryForm } from '../components/forms/WorkEntryForm';
import { api } from '../api';
import { Edit2, Trash2, Plus, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const WorkLog = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7));
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
      console.error('Failed to fetch logs', error);
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
      await fetchLogs();
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
        await fetchLogs();
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
    const locale = currency === 'INR' ? 'en-IN' : currency === 'USD' ? 'en-US' : 'en-EU';
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
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
          <button onClick={handleRefresh} disabled={refreshing} title="Refresh" className="page-header-action-btn">
            <RefreshCw size={18} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>
        <div className="flex gap-sm" style={{ alignItems: 'center' }}>
          <button onClick={handleRefresh} disabled={refreshing} title="Refresh data" style={{ background: 'none', border: '1.5px solid var(--outline-variant)', borderRadius: '8px', padding: '7px 10px', cursor: refreshing ? 'not-allowed' : 'pointer', color: refreshing ? 'var(--primary)' : 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <Button onClick={() => setShowModal(true)}>+ Add Work Day</Button>
        </div>
      </header>

      <div className="content">
        {/* Monthly Stats */}
        <div className="responsive-grid responsive-grid-3" style={{ marginBottom: 'var(--space-xl)' }}>

          {/* Days Worked */}
          <div style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', border: '1px solid var(--outline-variant)', background: 'var(--surface-bright)' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)', padding: '14px 16px 36px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -20, top: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Days Worked</div>
              </div>
            </div>
            <div style={{ padding: '0 12px', marginTop: '-24px', position: 'relative', zIndex: 1 }}>
              <div style={{ background: 'var(--surface-bright)', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '12px 16px', border: '1px solid var(--outline-variant)' }}>
                <div style={{ fontSize: '34px', fontWeight: 900, color: '#3b82f6', letterSpacing: '-0.04em', lineHeight: 1 }}>{monthlyStats.totalDays}</div>
                <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: 4 }}>{getSelectedMonthName()}</div>
              </div>
            </div>
            <div style={{ height: 12 }} />
          </div>

          {/* Expected Earnings */}
          <div style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', border: '1px solid var(--outline-variant)', background: 'var(--surface-bright)' }}>
            <div style={{ background: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)', padding: '14px 16px 36px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -20, top: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Expected</div>
              </div>
            </div>
            <div style={{ padding: '0 12px', marginTop: '-24px', position: 'relative', zIndex: 1 }}>
              <div style={{ background: 'var(--surface-bright)', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '12px 16px', border: '1px solid var(--outline-variant)' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.03em', lineHeight: 1 }}>{formatCurrency(monthlyStats.totalEarnings)}</div>
                <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: 4 }}>Total billed</div>
              </div>
            </div>
            <div style={{ height: 12 }} />
          </div>

          {/* Already Collected */}
          <div style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', border: '1px solid var(--outline-variant)', background: 'var(--surface-bright)' }}>
            <div style={{ background: 'linear-gradient(135deg, #134e4a 0%, #10b981 100%)', padding: '14px 16px 36px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -20, top: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
                <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                  <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Collected</div>
              </div>
            </div>
            <div style={{ padding: '0 12px', marginTop: '-24px', position: 'relative', zIndex: 1 }}>
              <div style={{ background: 'var(--surface-bright)', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '12px 16px', border: '1px solid var(--outline-variant)' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#10b981', letterSpacing: '-0.03em', lineHeight: 1 }}>{formatCurrency(monthlyStats.totalEarned)}</div>
                <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: 4 }}>Already received</div>
              </div>
            </div>
            <div style={{ height: 12 }} />
          </div>

        </div>


        {/* Activity Log */}
        <div style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', border: '1px solid var(--outline-variant)', background: 'var(--surface-bright)' }} className="activity-log-card">
          <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '18px 20px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -25, top: -25, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ position: 'absolute', right: 50, top: 45, width: 55, height: 55, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Activity Log</div>
            </div>
          </div>
          <div style={{ padding: 'var(--space-md) var(--space-md) 0' }}>
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
                        {weekLogs.map((log) => {
                          const isExpanded = !!expandedLogs[log._id];
                          return (
                            <div 
                              key={log._id} 
                              className="work-log-item" 
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
                                backgroundColor: isExpanded ? 'var(--surface-container)' : 'var(--surface-container-low)', 
                                borderRadius: 'var(--radius-md)', 
                                border: isExpanded ? '1px solid var(--primary)' : '1px solid var(--outline-variant)',
                                cursor: 'pointer',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                outline: 'none',
                                boxShadow: isExpanded ? '0 4px 20px rgba(0, 0, 0, 0.08)' : 'none'
                              }}
                            >
                              <div className="responsive-grid work-log-entry-grid" style={{ gridTemplateColumns: 'auto 1fr auto auto', gap: 'var(--space-md)', alignItems: 'center' }}>
                                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--primary), #34d399)', color: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }}>
                                  <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.05em' }}>{new Date(log.date).toLocaleString('default', { month: 'short' })}</span>
                                  <span style={{ fontSize: '18px', lineHeight: 1.1 }}>{new Date(log.date).getDate()}</span>
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
                                      onClick={(e) => { e.stopPropagation(); handleEdit(log); }}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px' }}
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDelete(log._id); }}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '4px' }}
                                    >
                                      <Trash2 size={16} />
                                    </button>
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
                                      <span className="text-muted body-sm" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Earnings & Status</span>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                          <Badge status={log.status} />
                                          <span className="font-semibold body-sm">Expected: {formatCurrency(log.amount)}</span>
                                        </div>
                                        {log.amountPaid > 0 && (
                                          <span className="body-sm text-success" style={{ fontWeight: '500' }}>
                                            Amount Paid: {formatCurrency(log.amountPaid)}
                                          </span>
                                        )}
                                        {log.amount - log.amountPaid > 0 && log.amountPaid > 0 && (
                                          <span className="body-sm text-error" style={{ fontWeight: '500' }}>
                                            Balance: {formatCurrency(log.amount - log.amountPaid)}
                                          </span>
                                        )}
                                        {log.status !== 'Paid' && (
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              try {
                                                const formData = {
                                                  ...log,
                                                  status: 'Paid',
                                                  amountPaid: log.amount,
                                                  datePaid: new Date().toISOString().split('T')[0]
                                                };
                                                await api.updateWorkLog(log._id, formData);
                                                toast.success('Marked entry as Paid!');
                                                fetchLogs();
                                              } catch (err) {
                                                toast.error('Failed to update status.');
                                              }
                                            }}
                                            style={{ 
                                              alignSelf: 'flex-start',
                                              padding: '4px 10px', 
                                              fontSize: '11px', 
                                              borderRadius: '16px', 
                                              backgroundColor: 'var(--primary-container)', 
                                              color: 'var(--on-primary-container)',
                                              border: '1px solid var(--primary)',
                                              cursor: 'pointer',
                                              marginTop: '6px',
                                              fontWeight: '600',
                                              transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.backgroundColor = 'var(--primary)';
                                              e.currentTarget.style.color = '#ffffff';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.backgroundColor = 'var(--primary-container)';
                                              e.currentTarget.style.color = 'var(--on-primary-container)';
                                            }}
                                          >
                                            Quick Mark Paid
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    {log.datePaid && (
                                      <div>
                                        <span className="text-muted body-sm" style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Paid</span>
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
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} title={editingEntry ? 'Edit Work Entry' : 'Log a Work Day'} onClose={handleCloseModal}>
        <WorkEntryForm
          initialData={editingEntry ? {
            date: editingEntry.date.split('T')[0],
            client: editingEntry.client,
            amount: editingEntry.amount,
            status: editingEntry.status,
            description: editingEntry.description || '',
            amountPaid: editingEntry.amountPaid || 0,
            datePaid: editingEntry.datePaid ? editingEntry.datePaid.split('T')[0] : ''
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
