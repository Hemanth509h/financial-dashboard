import { useEffect, useState } from 'react';
import { Download, Edit2, Plus, RefreshCw, Search, Trash2, X, ReceiptText, Tags, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { MetricTile } from '../components/ui/MetricTile';
import { Modal } from '../components/ui/Modal';
import { ExpenseForm } from '../components/forms/ExpenseForm';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const categoryOptions = ['All', 'Food', 'Travel', 'Rent', 'Utilities', 'Supplies', 'Loan', 'Personal', 'Other'];

export const Expenses = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7));
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const formatCurrency = (amount) => {
    const locale = currency === 'INR' ? 'en-IN' : currency === 'USD' ? 'en-US' : 'en-EU';
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data } = await api.getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to fetch expenses', error);
      toast.error('Failed to load expenses.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExpenses();
  }, []);

  const filteredExpenses = expenses.filter((expense) => {
    const expenseMonth = new Date(expense.date).toISOString().split('T')[0].substring(0, 7);
    const query = searchQuery.toLowerCase();
    const matchesMonth = expenseMonth === selectedMonth;
    const matchesSearch = !query
      || expense.category.toLowerCase().includes(query)
      || (expense.merchant || '').toLowerCase().includes(query)
      || (expense.description || '').toLowerCase().includes(query);
    const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
    return matchesMonth && matchesSearch && matchesCategory;
  });

  const monthlyStats = {
    count: filteredExpenses.length,
    total: filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    topCategory: 'None',
  };

  const categoryTotals = filteredExpenses.reduce((totals, expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + Number(expense.amount || 0);
    return totals;
  }, {});
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) monthlyStats.topCategory = `${topCategory[0]} · ${formatCurrency(topCategory[1])}`;

  const getSelectedMonthName = () => {
    const [year, month] = selectedMonth.split('-');
    return new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  };

  const groupExpensesByDate = (expenseList) => {
    return [...expenseList]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .reduce((groups, expense) => {
        const key = new Date(expense.date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        if (!groups[key]) groups[key] = [];
        groups[key].push(expense);
        return groups;
      }, {});
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const handleExport = () => {
    if (filteredExpenses.length === 0) {
      toast.error('No expenses to export for this month.');
      return;
    }
    const headers = ['Date', 'Category', 'Merchant', 'Payment Method', 'Amount', 'Description'];
    const rows = filteredExpenses.map((expense) => [
      `"${new Date(expense.date).toLocaleDateString()}"`,
      `"${expense.category.replace(/"/g, '""')}"`,
      `"${(expense.merchant || '').replace(/"/g, '""')}"`,
      `"${expense.paymentMethod}"`,
      expense.amount,
      `"${(expense.description || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully!');
  };

  const handleAddOrUpdate = async (formData) => {
    try {
      if (editingExpense) {
        await api.updateExpense(editingExpense._id, formData);
        toast.success('Expense updated successfully!');
      } else {
        await api.createExpense(formData);
        toast.success('Expense added successfully!');
      }
      await fetchExpenses();
      setShowModal(false);
      setEditingExpense(null);
    } catch (error) {
      console.error('Failed to save expense', error);
      toast.error('Failed to save expense. Please try again.');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.deleteExpense(id);
      toast.success('Expense deleted successfully!');
      await fetchExpenses();
    } catch (error) {
      console.error('Failed to delete expense', error);
      toast.error('Failed to delete expense.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExpense(null);
  };

  return (
    <div className="page">
      <header className="page-header mobile-stack" style={{ marginBottom: 'var(--space-xl)', gap: 'var(--space-md)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-xs)' }}>Daily Expenses</h1>
          <p className="text-muted">Track spending by day, category, and payment method.</p>
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
          <button onClick={handleRefresh} disabled={refreshing} title="Refresh data" style={{ background: 'none', border: '1.5px solid var(--outline-variant)', borderRadius: '8px', padding: '7px 10px', cursor: refreshing ? 'not-allowed' : 'pointer', color: refreshing ? 'var(--primary)' : 'var(--on-surface-variant)', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <Button variant="secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Export CSV
          </Button>
          <Button onClick={() => setShowModal(true)}>+ Add Expense</Button>
        </div>
      </header>

      <div className="content">
        <div className="responsive-grid responsive-grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
          <MetricTile title={`${getSelectedMonthName()} Spend`} value={formatCurrency(monthlyStats.total)} subtext={`${monthlyStats.count} expense records`} icon={ReceiptText} gradientFrom="#7f1d1d" gradientTo="#ef4444" subtextColor="error" />
          <MetricTile title="Top Category" value={monthlyStats.topCategory} subtext="Highest spend area" icon={Tags} gradientFrom="#0c4a6e" gradientTo="#0284c7" subtextColor="primary" />
          <MetricTile title="Average Daily" value={formatCurrency(monthlyStats.total / Math.max(1, new Date().getDate()))} subtext="Based on selected records" icon={Wallet} gradientFrom="#3f3f46" gradientTo="#71717a" subtextColor="muted" />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', alignItems: 'center' }}>
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input type="text" placeholder="Search expenses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="filter-group">
            {categoryOptions.map((category) => (
              <button key={category} className={`filter-chip ${categoryFilter === category ? 'active' : ''}`} onClick={() => setCategoryFilter(category)}>
                {category}
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
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <div style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', border: '1px solid var(--outline-variant)', background: 'var(--surface-bright)' }} className="activity-log-card">
          <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '18px 20px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -25, top: -25, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ReceiptText size={18} color="#fff" />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Expense Log</div>
            </div>
          </div>

          <div style={{ padding: 'var(--space-md) var(--space-md) 0' }}>
            <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', padding: 'var(--space-md) 0' }}>
              {loading ? (
                <div className="skeleton skeleton-text" style={{ height: '64px', margin: 'var(--space-md)' }}></div>
              ) : filteredExpenses.length === 0 ? (
                <p className="text-muted" style={{ padding: 'var(--space-md) 0' }}>No expenses found for this month.</p>
              ) : (
                Object.entries(groupExpensesByDate(filteredExpenses)).map(([dateLabel, dayExpenses]) => (
                  <div key={dateLabel}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-sm)', padding: '0 var(--space-xs)', borderLeft: '3px solid var(--error)', paddingLeft: 'var(--space-sm)' }}>
                      <span className="font-semibold body-sm text-primary">{dateLabel}</span>
                      <span className="text-muted body-sm">
                        Daily Total: {formatCurrency(dayExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0))}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                      {dayExpenses.map((expense) => (
                        <div key={expense._id} className="work-log-item" style={{ padding: 'var(--space-md)', backgroundColor: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)' }}>
                          <div className="responsive-grid work-log-entry-grid" style={{ gridTemplateColumns: 'auto 1fr auto', gap: 'var(--space-md)', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #7f1d1d, #ef4444)', color: 'white', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, boxShadow: '0 2px 8px rgba(239,68,68,0.25)' }}>
                              <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.05em' }}>{new Date(expense.date).toLocaleString('default', { month: 'short' })}</span>
                              <span style={{ fontSize: '18px', lineHeight: 1.1 }}>{new Date(expense.date).getDate()}</span>
                            </div>

                            <div style={{ overflow: 'hidden' }}>
                              <div className="font-semibold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{expense.merchant || expense.category}</div>
                              <div className="body-sm text-muted">{expense.category} · {expense.paymentMethod}</div>
                              {expense.description && <div className="body-sm text-muted" style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expense.description}</div>}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <div className="font-semibold" style={{ color: 'var(--error)' }}>- {formatCurrency(expense.amount)}</div>
                              <Badge status={expense.category} />
                              <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: '4px' }}>
                                <button onClick={() => handleEdit(expense)} title="Edit expense" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px' }}>
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(expense._id)} title="Delete expense" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '4px' }}>
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
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} title={editingExpense ? 'Edit Expense' : 'Add Daily Expense'} onClose={handleCloseModal}>
        <ExpenseForm
          initialData={editingExpense ? {
            date: editingExpense.date.split('T')[0],
            category: editingExpense.category,
            amount: editingExpense.amount,
            merchant: editingExpense.merchant || '',
            paymentMethod: editingExpense.paymentMethod || 'Cash',
            description: editingExpense.description || '',
          } : undefined}
          onSubmit={handleAddOrUpdate}
          onCancel={handleCloseModal}
        />
      </Modal>

      <button className="mobile-fab" onClick={() => setShowModal(true)} title="Add Expense">
        <Plus size={24} />
      </button>
    </div>
  );
};
