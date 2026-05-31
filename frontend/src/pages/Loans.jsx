import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoanForm } from '../components/forms/LoanForm';
import { RepaymentForm } from '../components/forms/RepaymentForm';
import { InterestForm } from '../components/forms/InterestForm';
import { api } from '../api';
import { Edit2, Trash2, Download, Plus, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/useAuth';

export const Loans = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
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
    }
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
          <button className="page-header-action-btn" onClick={handleExport} title="Export CSV">
            <Download size={18} />
          </button>
        </div>
        <div className="flex gap-sm">
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
              <Card key={loan._id} style={{ borderTop: '4px solid ' + (loan.status === 'Repaid' ? 'var(--success)' : 'var(--primary)') }}>
                <div className="flex justify-between items-center" style={{marginBottom: 'var(--space-md)'}}>
                  <div className="text-muted body-sm" style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>LENDER</div>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <Badge status={loan.status === 'Repaid' ? 'Paid' : 'Unpaid'} />
                    <button 
                      onClick={() => handleEditLoan(loan)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0 }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteLoan(loan._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 0 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h2 style={{marginBottom: 'var(--space-lg)', fontSize: '20px'}}>{loan.lenderName}</h2>
                
                <div className="flex justify-between" style={{marginBottom: 'var(--space-lg)'}}>
                  <div>
                    <div className="text-muted body-sm">Total Amount</div>
                    <div className="font-semibold" style={{fontSize: '20px'}}>{formatCurrency(loan.totalAmount)}</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div className="text-muted body-sm">Remaining</div>
                    <div className="font-semibold" style={{fontSize: '20px', color: loan.status === 'Repaid' ? 'var(--success)' : 'inherit'}}>
                      {formatCurrency(remaining)}
                    </div>
                  </div>
                </div>

                <div style={{marginBottom: 'var(--space-lg)'}}>
                  <div className="flex justify-between body-sm" style={{marginBottom: 'var(--space-xs)'}}>
                    <span className="text-muted">Repayment Progress</span>
                    <span className="font-semibold">{formatCurrency(loan.amountPaid)} paid</span>
                  </div>
                  <div style={{width: '100%', height: '8px', backgroundColor: 'var(--surface-container-low)', borderRadius: '4px', marginBottom: 'var(--space-xs)'}}>
                    <div style={{width: `${progress}%`, height: '100%', backgroundColor: progress === 100 ? 'var(--success)' : 'var(--primary)', borderRadius: '4px', transition: 'width 0.3s'}}></div>
                  </div>
                  <div className="flex justify-between body-sm" style={{fontSize: '12px'}}>
                    <span className="text-muted">{Math.round(progress)}% Complete</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <Button
                      variant="secondary"
                      style={{ flex: 1 }}
                      disabled={loan.status === 'Repaid'}
                      onClick={() => { setSelectedLoanForRepayment(loan); setShowRepaymentModal(true); }}
                    >
                      {loan.status === 'Repaid' ? 'Fully Repaid' : '+ Repayment'}
                    </Button>
                    <Button
                      variant="secondary"
                      style={{ flex: 1, color: 'var(--error)', borderColor: 'var(--error)' }}
                      onClick={() => { setSelectedLoanForInterest(loan); setShowInterestModal(true); }}
                    >
                      <TrendingUp size={14} style={{ marginRight: 4 }} /> Interest
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    style={{ width: '100%', backgroundColor: 'var(--surface-container-high)', border: 'none' }}
                    onClick={() => toggleExpandLoan(loan._id)}
                  >
                    {expandedLoan === loan._id ? 'Hide History' : 'View History'}
                  </Button>
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
            totalAmount: editingLoan.totalAmount,
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
