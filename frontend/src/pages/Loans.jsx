import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoanForm } from '../components/forms/LoanForm';
import { RepaymentForm } from '../components/forms/RepaymentForm';
import { InterestForm } from '../components/forms/InterestForm';
import { api } from '../api';
import { Edit2, Trash2, Download, Plus, TrendingUp, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/useAuth';

export const Loans = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [selectedLoanForRepayment, setSelectedLoanForRepayment] = useState(null);
  const [editingRepayment, setEditingRepayment] = useState(null);
  const [expandedLoan, setExpandedLoan] = useState(null);
  const [repayments, setRepayments] = useState({});
  const [loadingRepayments, setLoadingRepayments] = useState({});
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [selectedLoanForInterest, setSelectedLoanForInterest] = useState(null);

  const handleExport = () => {
    if (loans.length === 0) {
      toast.error('No loans to export.');
      return;
    }
    const headers = ['Lender', 'Total Amount', 'Amount Paid', 'Remaining', 'Start Date', 'Status'];
    const csvData = loans.map(loan => [
      `"${loan.lenderName.replace(/"/g, '""')}"`,
      loan.totalAmount,
      loan.amountPaid,
      loan.totalAmount - loan.amountPaid,
      `"${new Date(loan.startDate).toLocaleDateString()}"`,
      loan.status
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'loans_summary.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Loans exported successfully!');
  };

  const toggleExpandLoan = async (loanId) => {
    if (expandedLoan === loanId) {
      setExpandedLoan(null);
      return;
    }
    
    setExpandedLoan(loanId);
    
    if (!repayments[loanId]) {
      setLoadingRepayments(prev => ({ ...prev, [loanId]: true }));
      try {
        const { data } = await api.getLoanRepayments(loanId);
        setRepayments(prev => ({ ...prev, [loanId]: data }));
      } catch (error) {
        console.error('Failed to fetch repayments', error);
      } finally {
        setLoadingRepayments(prev => ({ ...prev, [loanId]: false }));
      }
    }
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const { data } = await api.getLoans();
      setLoans(data);
    } catch (error) {
      console.error('Failed to fetch loans', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLoans();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLoans();
  }, []);

  const handleAddOrUpdateLoan = async (formData) => {
    try {
      if (editingLoan) {
        await api.updateLoan(editingLoan._id, formData);
        toast.success('Loan updated successfully!');
      } else {
        await api.createLoan(formData);
        toast.success('New loan added successfully!');
      }
      await fetchLoans();
      setShowLoanModal(false);
      setEditingLoan(null);
    } catch (error) {
      console.error('Failed to save loan', error);
      toast.error('Failed to save loan information.');
    }
  };

  const handleAddOrUpdateRepayment = async (formData) => {
    try {
      if (editingRepayment) {
        await api.updateLoanRepayment(selectedLoanForRepayment._id, editingRepayment._id, formData);
        toast.success('Repayment updated successfully!');
      } else {
        await api.addLoanRepayment(selectedLoanForRepayment._id, formData);
        toast.success('Repayment recorded successfully!');
      }
      await fetchLoans();
      
      const { data } = await api.getLoanRepayments(selectedLoanForRepayment._id);
      setRepayments(prev => ({ ...prev, [selectedLoanForRepayment._id]: data }));

      setShowRepaymentModal(false);
      setSelectedLoanForRepayment(null);
      setEditingRepayment(null);
    } catch (error) {
      console.error('Failed to save repayment', error);
      toast.error('Failed to record repayment.');
    }
  };

  const handleEditRepayment = (loan, repayment) => {
    setSelectedLoanForRepayment(loan);
    setEditingRepayment(repayment);
    setShowRepaymentModal(true);
  };

  const handleDeleteRepayment = async (loanId, repaymentId) => {
    if (confirm('Are you sure you want to delete this repayment?')) {
      try {
        await api.deleteLoanRepayment(loanId, repaymentId);
        toast.success('Repayment deleted successfully!');
        await fetchLoans();
        const { data } = await api.getLoanRepayments(loanId);
        setRepayments(prev => ({ ...prev, [loanId]: data }));
      } catch (error) {
        console.error('Failed to delete repayment', error);
        toast.error('Failed to delete repayment.');
      }
    }
  };

  const handleEditLoan = (loan) => {
    setEditingLoan(loan);
    setShowLoanModal(true);
  };

  const handleDeleteLoan = async (id) => {
    if (confirm('Are you sure you want to delete this loan?')) {
      try {
        await api.deleteLoan(id);
        toast.success('Loan deleted successfully!');
        await fetchLoans();
      } catch (error) {
        console.error('Failed to delete loan', error);
        toast.error('Failed to delete loan.');
      }
    }
  };

  const handleCloseLoanModal = () => {
    setShowLoanModal(false);
    setEditingLoan(null);
  };

  const handleCloseRepaymentModal = () => {
    setShowRepaymentModal(false);
    setSelectedLoanForRepayment(null);
    setEditingRepayment(null);
  };

  const handleAddInterest = async (formData) => {
    try {
      await api.addLoanInterest(selectedLoanForInterest._id, formData);
      toast.success('Interest charge added!');
      await fetchLoans();
      const { data } = await api.getLoanRepayments(selectedLoanForInterest._id);
      setRepayments(prev => ({ ...prev, [selectedLoanForInterest._id]: data }));
      setShowInterestModal(false);
      setSelectedLoanForInterest(null);
    } catch (error) {
      console.error('Failed to add interest', error);
      toast.error('Failed to add interest charge.');
    }
  };

  const handleCloseInterestModal = () => {
    setShowInterestModal(false);
    setSelectedLoanForInterest(null);
  };

  const formatCurrency = (amount) => {
    const locale = currency === 'INR' ? 'en-IN' : currency === 'USD' ? 'en-US' : 'en-EU';
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const groupRepaymentsByMonthAndWeek = (repaymentList) => {
    if (!repaymentList) return {};
    
    // Sort repayments latest first
    const sortedRepayments = [...repaymentList].sort((a, b) => new Date(b.date) - new Date(a.date));

    return sortedRepayments.reduce((groups, rep) => {
      const date = new Date(rep.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      // Calculate week of month
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const weekNum = Math.ceil((date.getDate() + startOfMonth.getDay()) / 7);
      const weekLabel = `Week ${weekNum}`;

      if (!groups[monthYear]) groups[monthYear] = {};
      if (!groups[monthYear][weekLabel]) groups[monthYear][weekLabel] = [];
      groups[monthYear][weekLabel].push(rep);
      return groups;
    }, {});
  };

  return (
    <div className="page">
      <header className="page-header mobile-stack" style={{marginBottom: 'var(--space-xl)', gap: 'var(--space-md)'}}>
        <div>
          <h1 style={{marginBottom: 'var(--space-xs)'}}>Loan Management</h1>
          <p className="text-muted">Overview of your liabilities and progress.</p>
        </div>
        <div className="mobile-header-actions">
          <button onClick={handleRefresh} disabled={refreshing} title="Refresh" className="page-header-action-btn">
            <RefreshCw size={18} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <button className="page-header-action-btn" onClick={handleExport} title="Export CSV">
            <Download size={18} />
          </button>
        </div>
        <div className="flex gap-sm" style={{ alignItems: 'center' }}>
          <button onClick={handleRefresh} disabled={refreshing} title="Refresh data" style={{ background: 'none', border: '1.5px solid var(--outline-variant)', borderRadius: '8px', padding: '7px 10px', cursor: refreshing ? 'not-allowed' : 'pointer', color: refreshing ? 'var(--primary)' : 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <Button variant="secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Export CSV
          </Button>
          <Button onClick={() => setShowLoanModal(true)}>+ Add New Loan</Button>
        </div>
      </header>
      
      <div className="content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
          {loading ? (
            <>
              <div className="skeleton skeleton-card" style={{ height: '300px' }}></div>
              <div className="skeleton skeleton-card" style={{ height: '300px' }}></div>
            </>
          ) : loans.length === 0 ? (
            <div style={{ padding: 'var(--space-xl) 0', textAlign: 'center', gridColumn: '1 / -1' }}>
              <p className="text-muted body-lg mb-4">No loans found. Click "Add New Loan" to get started.</p>
            </div>
          ) : null}
          
          {!loading && loans.map(loan => {
            const progress = loan.totalAmount > 0 ? (loan.amountPaid / loan.totalAmount) * 100 : 0;
            const remaining = loan.totalAmount - loan.amountPaid;
            
            return (
              <Card key={loan._id} style={{
                borderTop: '4px solid ' + (loan.status === 'Repaid' ? 'var(--success)' : 'var(--primary)'),
                padding: '0',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              }}>
                {/* Card Header */}
                <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--outline-variant)' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary, #999)' }}>LENDER</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Badge status={loan.status === 'Repaid' ? 'Paid' : 'Unpaid'} />
                      <button onClick={() => handleEditLoan(loan)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #aaa)', padding: '2px', borderRadius: '4px', display: 'flex', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary, #aaa)'}
                      ><Edit2 size={15} /></button>
                      <button onClick={() => handleDeleteLoan(loan._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary, #aaa)', padding: '2px', borderRadius: '4px', display: 'flex', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary, #aaa)'}
                      ><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.3px' }}>{loan.lenderName}</div>
                </div>

                {/* Stats Grid */}
                {(() => {
                  const principal = loan.principalAmount || loan.totalAmount;
                  const interestAdded = loan.totalAmount - principal;
                  const totalWithInterest = loan.totalAmount;
                  const remainingExclInterest = Math.max(0, remaining - interestAdded);
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--outline-variant)' }}>
                      {/* Loan Amount */}
                      <div style={{ padding: '14px 10px', textAlign: 'center', background: 'var(--surface-container-lowest, #fafafa)' }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary, #999)', marginBottom: '6px' }}>Loan Amount</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--on-surface)' }}>{formatCurrency(principal)}</div>
                      </div>

                      {/* Total w/ Interest */}
                      <div style={{ padding: '14px 10px', textAlign: 'center', background: interestAdded > 0 ? 'rgba(239,68,68,0.05)' : 'var(--surface-container-lowest, #fafafa)', borderLeft: '1px solid var(--outline-variant)', borderRight: '1px solid var(--outline-variant)' }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: interestAdded > 0 ? 'var(--error)' : 'var(--text-secondary, #999)', marginBottom: '6px' }}>
                          {interestAdded > 0 ? 'Total w/ Interest' : 'Interest'}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: interestAdded > 0 ? 'var(--error)' : 'var(--text-secondary, #bbb)' }}>
                          {interestAdded > 0 ? formatCurrency(totalWithInterest) : '—'}
                        </div>
                        {interestAdded > 0 && (
                          <div style={{ fontSize: '10px', color: 'var(--error)', opacity: 0.75, marginTop: '3px', fontWeight: 600 }}>+{formatCurrency(interestAdded)}</div>
                        )}
                      </div>

                      {/* Remaining (split into two) */}
                      <div style={{ padding: '14px 10px', textAlign: 'center', background: loan.status === 'Repaid' ? 'rgba(34,197,94,0.06)' : 'var(--surface-container-lowest, #fafafa)' }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary, #999)', marginBottom: '6px' }}>Remaining</div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: loan.status === 'Repaid' ? 'var(--success)' : 'var(--primary)' }}>{formatCurrency(remaining)}</div>
                        {interestAdded > 0 && (
                          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: '8.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary, #bbb)', marginBottom: '3px' }}>excl. interest</div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: loan.status === 'Repaid' ? 'var(--success)' : 'var(--on-surface)' }}>
                              {formatCurrency(remainingExclInterest)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Progress Section */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)', background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #888)' }}>Repayment Progress</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-surface)' }}>{formatCurrency(loan.amountPaid)} paid</span>
                  </div>
                  <div style={{ width: '100%', height: '7px', backgroundColor: 'var(--surface-container-low)', borderRadius: '99px', overflow: 'hidden', marginBottom: '6px' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 70%, var(--success)))', borderRadius: '99px', transition: 'width 0.4s ease' }}></div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary, #aaa)', fontWeight: 500 }}>{Math.round(progress)}% complete</div>
                </div>

                {/* Actions */}
                <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--surface)' }}>
                  {loan.monthlyInterest > 0 && loan.status !== 'Repaid' && (
                    <button
                      onClick={async () => {
                        try {
                          await api.addLoanInterest(loan._id, {
                            amount: loan.monthlyInterest,
                            date: new Date().toISOString().split('T')[0],
                            note: `Monthly interest — ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
                          });
                          toast.success(`${formatCurrency(loan.monthlyInterest)} interest added for ${new Date().toLocaleString('default', { month: 'long' })}!`);
                          await fetchLoans();
                          if (expandedLoan === loan._id) {
                            const { data } = await api.getLoanRepayments(loan._id);
                            setRepayments(prev => ({ ...prev, [loan._id]: data }));
                          }
                        } catch {
                          toast.error('Failed to add monthly interest.');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        backgroundColor: 'rgba(239,68,68,0.07)',
                        border: '1.5px dashed rgba(239,68,68,0.5)',
                        borderRadius: '8px',
                        color: 'var(--error)',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.07)'}
                    >
                      <TrendingUp size={14} />
                      Add This Month's Interest — {formatCurrency(loan.monthlyInterest)}
                    </button>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      disabled={loan.status === 'Repaid'}
                      onClick={() => { setSelectedLoanForRepayment(loan); setShowRepaymentModal(true); }}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: loan.status === 'Repaid' ? 'not-allowed' : 'pointer',
                        border: '1.5px solid var(--outline-variant)',
                        background: loan.status === 'Repaid' ? 'var(--surface-container-low)' : 'var(--surface)',
                        color: loan.status === 'Repaid' ? 'var(--text-secondary, #aaa)' : 'var(--on-surface)',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => { if (loan.status !== 'Repaid') { e.currentTarget.style.background = 'var(--surface-container-low)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}}
                      onMouseLeave={e => { e.currentTarget.style.background = loan.status === 'Repaid' ? 'var(--surface-container-low)' : 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--outline-variant)'; }}
                    >
                      {loan.status === 'Repaid' ? '✓ Fully Repaid' : '+ Repayment'}
                    </button>
                    <button
                      onClick={() => { setSelectedLoanForInterest(loan); setShowInterestModal(true); }}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                        border: '1.5px solid rgba(239,68,68,0.4)',
                        background: 'rgba(239,68,68,0.05)',
                        color: 'var(--error)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
                    >
                      <TrendingUp size={13} /> Interest
                    </button>
                  </div>

                  <button
                    onClick={() => toggleExpandLoan(loan._id)}
                    style={{
                      width: '100%', padding: '9px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                      border: 'none',
                      background: 'var(--surface-container-low)',
                      color: 'var(--text-secondary, #777)',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-container)'; e.currentTarget.style.color = 'var(--on-surface)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-container-low)'; e.currentTarget.style.color = 'var(--text-secondary, #777)'; }}
                  >
                    {expandedLoan === loan._id ? '↑ Hide History' : '↓ View History'}
                  </button>
                </div>

                {expandedLoan === loan._id && (
                  <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--outline-variant)' }}>
                    <h4 style={{ marginBottom: 'var(--space-md)' }}>History</h4>

                    {loadingRepayments[loan._id] ? (
                      <div className="skeleton skeleton-text" style={{ height: '40px' }}></div>
                    ) : repayments[loan._id] && repayments[loan._id].length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {Object.entries(groupRepaymentsByMonthAndWeek(repayments[loan._id])).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([monthYear, weeks]) => (
                          <div key={monthYear} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-xs)' }}>
                              <span className="text-muted body-sm font-bold" style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>
                                {monthYear}
                              </span>
                            </div>

                            {Object.entries(weeks).sort((a, b) => b[0].localeCompare(a[0])).map(([weekLabel, weekReps]) => {
                              const weekRepayments = weekReps.filter(r => r.type !== 'Interest');
                              return (
                                <div key={weekLabel}>
                                  <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-sm)', padding: '0 4px', borderLeft: '3px solid var(--primary)', paddingLeft: 'var(--space-sm)' }}>
                                    <span className="font-semibold body-sm text-primary">{weekLabel}</span>
                                    {weekRepayments.length > 0 && (
                                      <span className="text-muted body-sm">
                                        Repaid: {formatCurrency(weekRepayments.reduce((s, r) => s + r.amount, 0))}
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                                    {weekReps.map(rep => {
                                      const isInterest = rep.type === 'Interest';
                                      return (
                                        <div key={rep._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm)', backgroundColor: isInterest ? 'rgba(239,68,68,0.05)' : 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', border: `1px solid ${isInterest ? 'rgba(239,68,68,0.2)' : 'var(--outline-variant)'}` }}>
                                          <div style={{ flex: 1 }}>
                                            <div className="flex items-center gap-xs">
                                              {isInterest && <TrendingUp size={13} style={{ color: 'var(--error)', flexShrink: 0 }} />}
                                              <span className="font-semibold" style={{ color: isInterest ? 'var(--error)' : 'var(--success)', fontSize: '14px' }}>
                                                {isInterest ? '+ ' : '- '}{formatCurrency(rep.amount)}
                                              </span>
                                              <span className="body-sm text-muted" style={{ fontSize: '12px' }}>
                                                {isInterest ? 'Interest' : rep.method || 'Cash'}
                                              </span>
                                            </div>
                                            <div className="text-muted body-sm">{formatDate(rep.date)}</div>
                                            {rep.note && <div className="text-muted body-sm" style={{ fontSize: '12px', fontStyle: 'italic' }}>{rep.note}</div>}
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                            {!isInterest && <Badge status={rep.status || 'Success'} />}
                                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                              {!isInterest && (
                                                <button onClick={() => handleEditRepayment(loan, rep)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0 }}>
                                                  <Edit2 size={16} />
                                                </button>
                                              )}
                                              <button onClick={() => handleDeleteRepayment(loan._id, rep._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 0 }}>
                                                <Trash2 size={16} />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted" style={{ fontSize: '13px' }}>No history yet.</p>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      <Modal isOpen={showLoanModal} title={editingLoan ? 'Edit Loan' : 'Add a New Loan'} onClose={handleCloseLoanModal}>
        <LoanForm 
          initialData={editingLoan ? {
            lenderName: editingLoan.lenderName,
            totalAmount: editingLoan.principalAmount || editingLoan.totalAmount,
            principalAmount: editingLoan.principalAmount || editingLoan.totalAmount,
            totalAmountWithInterest: editingLoan.totalAmount,
            monthlyInterest: editingLoan.monthlyInterest || '',
            startDate: editingLoan.startDate.split('T')[0],
            status: editingLoan.status
          } : undefined}
          onSubmit={handleAddOrUpdateLoan}
          onCancel={handleCloseLoanModal}
        />
      </Modal>

      <Modal isOpen={showInterestModal} title="Add Interest Charge" onClose={handleCloseInterestModal}>
        {selectedLoanForInterest && (
          <InterestForm
            loan={selectedLoanForInterest}
            formatCurrency={formatCurrency}
            onSubmit={handleAddInterest}
            onCancel={handleCloseInterestModal}
          />
        )}
      </Modal>

      <Modal isOpen={showRepaymentModal} title={editingRepayment ? "Edit Repayment" : "Record a Loan Repayment"} onClose={handleCloseRepaymentModal}>
        {selectedLoanForRepayment && (
          <RepaymentForm 
            loan={selectedLoanForRepayment}
            initialData={editingRepayment ? {
              amount: editingRepayment.amount,
              date: editingRepayment.date.split('T')[0],
              method: editingRepayment.method || 'Cash',
              status: editingRepayment.status || 'Success'
            } : undefined}
            onSubmit={handleAddOrUpdateRepayment}
            onCancel={handleCloseRepaymentModal}
          />
        )}
      </Modal>

      {/* Mobile FAB */}
      <button className="mobile-fab" onClick={() => setShowLoanModal(true)} title="Add New Loan">
        <Plus size={24} />
      </button>
    </div>
  );
};
