import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoanForm } from '../components/forms/LoanForm';
import { RepaymentForm } from '../components/forms/RepaymentForm';
import { InterestForm } from '../components/forms/InterestForm';
import { api } from '../api';
import { Edit2, Trash2, Plus, TrendingUp, RefreshCw, ChevronDown, Banknote, WalletCards, CircleCheckBig } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Loans.css';

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
  const [expandedRepayments, setExpandedRepayments] = useState({});

  const toggleExpandRepayment = (id) => {
    setExpandedRepayments(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
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

  const activeLoans = loans.filter((loan) => loan.status === 'Active');
  const loanSummary = activeLoans.reduce((totals, loan) => ({
    totalLoanGoal: totals.totalLoanGoal + Number(loan.totalAmount || 0),
    totalLoanBalance: totals.totalLoanBalance + Math.max(0, Number(loan.totalAmount || 0) - Number(loan.amountPaid || 0)),
    totalLoanPaid: totals.totalLoanPaid + Number(loan.amountPaid || 0),
  }), { totalLoanGoal: 0, totalLoanBalance: 0, totalLoanPaid: 0 });
  const loanProgress = loanSummary.totalLoanGoal > 0
    ? (loanSummary.totalLoanPaid / loanSummary.totalLoanGoal) * 100
    : 0;

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
        </div>
        <div className="flex gap-sm" style={{ alignItems: 'center' }}>
          <button onClick={handleRefresh} disabled={refreshing} title="Refresh data" style={{ background: 'none', border: '1.5px solid var(--outline-variant)', borderRadius: '8px', padding: '7px 10px', cursor: refreshing ? 'not-allowed' : 'pointer', color: refreshing ? 'var(--primary)' : 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}>
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <Button onClick={() => setShowLoanModal(true)}>+ Add New Loan</Button>
        </div>
      </header>

      {!loading && (
        <section className="loan-overview" aria-labelledby="loan-overview-title">
          <div className="loan-overview-heading">
            <p className="loan-overview-eyebrow">Your borrowing snapshot</p>
            <h2 id="loan-overview-title">Loan Overview</h2>
          </div>
          <div className="loan-overview-grid">
            <div className="loan-summary-card loan-summary-card--borrowed">
              <div className="loan-summary-banner">
                <div className="loan-summary-icon"><Banknote size={24} /></div>
                <span>Total borrowed</span>
              </div>
              <div className="loan-summary-value">
                <strong>{formatCurrency(loanSummary.totalLoanGoal)}</strong>
                <span>Principal sum</span>
              </div>
            </div>
            <div className="loan-summary-card loan-summary-card--balance">
              <div className="loan-summary-banner">
                <div className="loan-summary-icon"><WalletCards size={24} /></div>
                <span>Outstanding balance</span>
              </div>
              <div className="loan-summary-value">
                <strong>{formatCurrency(loanSummary.totalLoanBalance)}</strong>
                <span>Including interest additions</span>
              </div>
            </div>
            <div className="loan-summary-card loan-summary-card--progress">
              <div className="loan-summary-banner">
                <div className="loan-summary-icon"><CircleCheckBig size={24} /></div>
                <span>Total progress</span>
              </div>
              <div className="loan-summary-value">
                <strong>{Math.round(loanProgress)}%</strong>
                <span>Repaid {formatCurrency(loanSummary.totalLoanPaid)} in total</span>
                <div className="loan-summary-progress" aria-label={`${Math.round(loanProgress)} percent repaid`}>
                  <div style={{ width: `${Math.min(loanProgress, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      
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
            const principal = loan.principalAmount || loan.totalAmount;
            const interestAdded = loan.totalAmount - principal;
            const remainingExclInterest = Math.max(0, remaining - interestAdded);
            const isRepaid = loan.status === 'Repaid';
            const initial = loan.lenderName?.charAt(0)?.toUpperCase() || '?';

            return (
              <Card key={loan._id} style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', border: '1px solid var(--outline-variant)' }}>

                {/* ── Gradient Header Banner ── */}
                <div style={{
                  background: isRepaid
                    ? 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)'
                    : 'linear-gradient(135deg, #134e4a 0%, var(--primary) 100%)',
                  padding: '20px 20px 52px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* decorative circle */}
                  <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                  <div style={{ position: 'absolute', right: 30, top: 50, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                    {/* Avatar + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color: '#fff', flexShrink: 0, backdropFilter: 'blur(4px)' }}>
                        {initial}
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Lender</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.1 }}>{loan.lenderName}</div>
                      </div>
                    </div>

                    {/* Actions + Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: isRepaid ? 'rgba(134,239,172,0.25)' : 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>
                        {isRepaid ? '✓ Repaid' : 'Active'}
                      </span>
                      <button onClick={() => handleEditLoan(loan)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff', padding: '6px', borderRadius: '8px', display: 'flex', backdropFilter: 'blur(4px)' }}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteLoan(loan._id)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff', padding: '6px', borderRadius: '8px', display: 'flex', backdropFilter: 'blur(4px)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Remaining Hero Card (floats over banner) ── */}
                <div style={{ padding: '0 20px', marginTop: '-32px', position: 'relative', zIndex: 1 }}>
                  <div style={{ background: 'var(--surface)', borderRadius: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', gap: 0, border: '1px solid var(--outline-variant)' }}>
                    {/* Remaining total */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary, #999)', marginBottom: 6 }}>Remaining</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: isRepaid ? '#16a34a' : 'var(--primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>{formatCurrency(remaining)}</div>
                      {interestAdded > 0 && (
                        <div style={{ marginTop: 5, fontSize: '11px', color: 'var(--text-secondary, #aaa)', fontWeight: 500 }}>
                          excl. interest: <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{formatCurrency(remainingExclInterest)}</span>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', background: 'var(--outline-variant)', margin: '0 16px', flexShrink: 0 }} />

                    {/* Paid */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary, #999)', marginBottom: 6 }}>Paid</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a', letterSpacing: '-0.5px', lineHeight: 1 }}>{formatCurrency(loan.amountPaid)}</div>
                      <div style={{ marginTop: 5, fontSize: '11px', color: 'var(--text-secondary, #aaa)', fontWeight: 500 }}>{Math.round(progress)}% complete</div>
                    </div>
                  </div>
                </div>

                {/* ── Loan Details Row ── */}
                <div style={{ padding: '16px 20px 0', display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, background: 'var(--surface-container-low)', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary, #aaa)', marginBottom: 4 }}>Principal</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--on-surface)' }}>{formatCurrency(principal)}</div>
                  </div>
                  <div style={{ flex: 1, background: interestAdded > 0 ? 'rgba(239,68,68,0.06)' : 'var(--surface-container-low)', borderRadius: '10px', padding: '10px 12px', border: interestAdded > 0 ? '1px solid rgba(239,68,68,0.15)' : 'none' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: interestAdded > 0 ? 'var(--error)' : 'var(--text-secondary, #aaa)', marginBottom: 4 }}>Interest Added</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: interestAdded > 0 ? 'var(--error)' : 'var(--text-secondary, #ccc)' }}>{interestAdded > 0 ? `+${formatCurrency(interestAdded)}` : '—'}</div>
                  </div>
                  {loan.startDate && (
                    <div style={{ flex: 1, background: 'var(--surface-container-low)', borderRadius: '10px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary, #aaa)', marginBottom: 4 }}>Since</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-surface)' }}>{formatDate(loan.startDate)}</div>
                    </div>
                  )}
                </div>

                {/* ── Progress Bar ── */}
                <div style={{ padding: '14px 20px 0' }}>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--surface-container-low)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: isRepaid ? '#16a34a' : 'linear-gradient(90deg, var(--primary) 0%, #10b981 100%)', borderRadius: '99px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>

                {/* ── Monthly Interest Quick-Add ── */}
                {loan.monthlyInterest > 0 && !isRepaid && (
                  <div style={{ padding: '12px 20px 0' }}>
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
                      style={{ width: '100%', padding: '9px 14px', background: 'rgba(239,68,68,0.06)', border: '1.5px dashed rgba(239,68,68,0.4)', borderRadius: '10px', color: 'var(--error)', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <TrendingUp size={13} />
                      Add {new Date().toLocaleString('default', { month: 'long' })} Interest — {formatCurrency(loan.monthlyInterest)}
                    </button>
                  </div>
                )}

                {/* ── Action Buttons ── */}
                <div style={{ padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* Primary: Repayment */}
                    <button
                      disabled={isRepaid}
                      onClick={() => { setSelectedLoanForRepayment(loan); setShowRepaymentModal(true); }}
                      style={{
                        flex: 2,
                        padding: '11px 14px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: isRepaid ? 'not-allowed' : 'pointer',
                        border: 'none',
                        background: isRepaid ? 'var(--surface-container-low)' : 'var(--primary)',
                        color: isRepaid ? 'var(--text-secondary, #aaa)' : '#fff',
                        boxShadow: isRepaid ? 'none' : '0 2px 8px rgba(0,0,0,0.15)',
                      }}
                    >
                      {isRepaid ? '✓ Fully Repaid' : '+ Record Repayment'}
                    </button>

                    {/* Secondary: Interest */}
                    <button
                      onClick={() => { setSelectedLoanForInterest(loan); setShowInterestModal(true); }}
                      style={{ flex: 1, padding: '11px 10px', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', border: '1.5px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.06)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                    >
                      <TrendingUp size={13} /> Interest
                    </button>
                  </div>

                  {/* View History */}
                  <button
                    onClick={() => toggleExpandLoan(loan._id)}
                    style={{ width: '100%', padding: '9px', borderRadius: '10px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', border: '1px solid var(--outline-variant)', background: 'transparent', color: 'var(--text-secondary, #888)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                  >
                    {expandedLoan === loan._id ? '▲ Hide History' : '▼ View History'}
                  </button>
                </div>

                {expandedLoan === loan._id && (
                  <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--outline-variant)',padding:'25px' }}>
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
                                      const isExpanded = !!expandedRepayments[rep._id];
                                      return (
                                        <div 
                                          key={rep._id} 
                                          onClick={() => toggleExpandRepayment(rep._id)}
                                          role="button"
                                          tabIndex={0}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                              e.preventDefault();
                                              toggleExpandRepayment(rep._id);
                                            }
                                          }}
                                          style={{ 
                                            display: 'flex', 
                                            flexDirection: 'column',
                                            padding: 'var(--space-md)', 
                                            backgroundColor: isExpanded ? 'var(--surface-container)' : (isInterest ? 'rgba(239,68,68,0.05)' : 'var(--surface-container-lowest)'), 
                                            borderRadius: 'var(--radius-sm)', 
                                            border: isExpanded ? '1px solid var(--primary)' : `1px solid ${isInterest ? 'rgba(239,68,68,0.2)' : 'var(--outline-variant)'}`,
                                            cursor: 'pointer',
                                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                            outline: 'none',
                                            boxShadow: isExpanded ? '0 4px 20px rgba(0, 0, 0, 0.08)' : 'none'
                                          }}
                                        >
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {isInterest && <TrendingUp size={13} style={{ color: 'var(--error)', flexShrink: 0 }} />}
                                                <span className="font-semibold" style={{ color: isInterest ? 'var(--error)' : 'var(--success)', fontSize: '14px' }}>
                                                  {isInterest ? '+ ' : '- '}{formatCurrency(rep.amount)}
                                                </span>
                                              </div>
                                              <div className="text-muted body-sm" style={{ fontSize: '11px' }}>{formatDate(rep.date)}</div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                                {!isInterest && <Badge status={rep.status || 'Success'} />}
                                                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                                                  {!isInterest && (
                                                    <button onClick={(e) => { e.stopPropagation(); handleEditRepayment(loan, rep); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px' }}>
                                                      <Edit2 size={14} />
                                                    </button>
                                                  )}
                                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteRepayment(loan._id, rep._id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '4px' }}>
                                                    <Trash2 size={14} />
                                                  </button>
                                                </div>
                                              </div>

                                              <div style={{ color: isExpanded ? 'var(--primary)' : 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}>
                                                <ChevronDown 
                                                  size={16} 
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
                                                gap: 'var(--space-sm)',
                                                animation: 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                width: '100%'
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-md)' }}>
                                                <div>
                                                  <span className="text-muted body-sm" style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</span>
                                                  <span className="font-semibold body-sm">{new Date(rep.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                </div>
                                                <div>
                                                  <span className="text-muted body-sm" style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction Type</span>
                                                  <span className="font-semibold body-sm">{isInterest ? 'Interest Addition' : 'Repayment Payment'}</span>
                                                </div>
                                                {!isInterest && (
                                                  <div>
                                                    <span className="text-muted body-sm" style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Method</span>
                                                    <span className="font-semibold body-sm">{rep.method || 'Cash'}</span>
                                                  </div>
                                                )}
                                              </div>

                                              {rep.note && (
                                                <div style={{ marginTop: '4px' }}>
                                                  <span className="text-muted body-sm" style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Note</span>
                                                  <p className="body-sm" style={{ 
                                                    margin: 0, 
                                                    padding: '8px 10px', 
                                                    backgroundColor: 'var(--surface-container-low)', 
                                                    borderRadius: 'var(--radius-sm)', 
                                                    whiteSpace: 'pre-wrap', 
                                                    wordBreak: 'break-word',
                                                    color: 'var(--on-surface)',
                                                    borderLeft: `3px solid ${isInterest ? 'var(--error)' : 'var(--success)'}`,
                                                    lineHeight: '1.4'
                                                  }}>
                                                    {rep.note}
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          )}
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
            );
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
              status: editingRepayment.status || 'Success',
              workEntryId: editingRepayment.workEntryId || ''
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
