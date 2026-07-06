import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { AlertCircle } from 'lucide-react';
import { api } from '../../api';
import './Form.css';

const defaultFormData = {
  date: new Date().toISOString().split('T')[0],
  client: 'Canteen',
  amount: '',
  description: '',
  status: 'Unpaid',
  applyToLoan: false,
  loanId: '',
  loanRepaymentAmount: '',
  loanRepaymentMethod: 'Work Log',
  loanRepaymentNote: ''
};

export const WorkEntryForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(() => ({ ...defaultFormData, ...(initialData || {}) }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loans, setLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

  useEffect(() => {
    const loadLoans = async () => {
      try {
        setLoadingLoans(true);
        const { data } = await api.getLoans();
        setLoans(data.filter((loan) => loan.status !== 'Repaid'));
      } catch (error) {
        console.error('Failed to load loans for repayment selection', error);
      } finally {
        setLoadingLoans(false);
      }
    };

    loadLoans();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = 'Work date is required';
    if (!formData.client) newErrors.client = 'Client/Project name is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than ₹0';
    }

    if (formData.applyToLoan) {
      if (!formData.loanId) {
        newErrors.loanId = 'Select a loan to repay';
      }

      const repaymentAmount = parseFloat(formData.loanRepaymentAmount || 0);
      const availableAmount = parseFloat(formData.amountPaid || formData.amount || 0);

      if (!formData.loanRepaymentAmount || repaymentAmount <= 0) {
        newErrors.loanRepaymentAmount = 'Repayment amount must be greater than ₹0';
      } else if (availableAmount > 0 && repaymentAmount > availableAmount) {
        newErrors.loanRepaymentAmount = `Cannot exceed the collected amount of ₹${availableAmount}`;
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const amount = parseFloat(formData.amount);
    let amountPaid = parseFloat(formData.amountPaid || 0);
    if (formData.status === 'Paid') amountPaid = amount;

    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        description: (formData.description || '').trim(),
        amount,
        amountPaid,
        ...(formData.applyToLoan ? {
          loanId: formData.loanId,
          loanRepaymentAmount: parseFloat(formData.loanRepaymentAmount || 0),
          loanRepaymentMethod: formData.loanRepaymentMethod || 'Work Log',
          loanRepaymentNote: (formData.loanRepaymentNote || '').trim() || `Repayment from ${formData.client} work log`
        } : {})
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label htmlFor="date">Work Date *</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
        />
        {errors.date && (
          <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderLeft: '4px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{errors.date}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="client">Client / Project *</label>
        <input
          type="text"
          id="client"
          name="client"
          placeholder="E.g., ABC Shop"
          value={formData.client}
          onChange={handleChange}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          <span className="body-sm text-muted" style={{ marginRight: '4px', alignSelf: 'center' }}>Quick Picks:</span>
          {['Canteen', 'Personal', 'Other'].map(suggestion => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, client: suggestion }))}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                border: '1px solid var(--outline-variant)',
                backgroundColor: formData.client === suggestion ? 'var(--primary-container)' : 'var(--surface-container-low)',
                color: formData.client === suggestion ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
        {errors.client && (
          <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderLeft: '4px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{errors.client}</span>
          </div>
        )}
      </div>



      <div className="form-group">
        <label htmlFor="amount">Expected Amount (₹) *</label>
        <input
          type="number"
          id="amount"
          name="amount"
          placeholder="0"
          min="0"
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
        />
        {errors.amount && (
          <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderLeft: '4px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{errors.amount}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          placeholder="Notes about this work (optional)"
          value={formData.description || ''}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--outline-variant)',
            backgroundColor: 'var(--surface-container-low)',
            color: 'var(--on-surface)',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
            minHeight: '72px',
            boxSizing: 'border-box'
          }}
        />
        <div className="body-sm text-muted" style={{ marginTop: '4px', textAlign: 'right' }}>
          {(formData.description || '').length}/500
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="Unpaid">Unpaid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      <div className="form-group" style={{ border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-md)', padding: '12px', backgroundColor: 'var(--surface-container-low)' }}>
        <label htmlFor="applyToLoan" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '8px' }}>
          <input
            type="checkbox"
            id="applyToLoan"
            name="applyToLoan"
            checked={Boolean(formData.applyToLoan)}
            onChange={handleChange}
          />
          Use this payment to repay a loan
        </label>
        <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>
          Choose a loan and repayment amount below whenever you want this work payment to reduce an existing balance.
        </div>

        <div style={{ display: 'grid', gap: '10px', opacity: formData.applyToLoan ? 1 : 0.75 }}>
          <div>
            <label htmlFor="loanId" className="body-sm" style={{ display: 'block', marginBottom: '4px' }}>Select loan</label>
            <select
              id="loanId"
              name="loanId"
              value={formData.loanId}
              onChange={handleChange}
              disabled={loadingLoans || !formData.applyToLoan}
            >
              <option value="">{loadingLoans ? 'Loading loans...' : 'Choose a loan'}</option>
              {loans.map((loan) => (
                <option key={loan._id} value={loan._id}>
                  {loan.lenderName} — Remaining {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.max(0, loan.totalAmount - (loan.amountPaid || 0)))}
                </option>
              ))}
            </select>
            {!loadingLoans && loans.length === 0 && (
              <div style={{ marginTop: '4px', color: 'var(--on-surface-variant)', fontSize: '12px' }}>
                No active loans found yet. Create one on the Loans page first.
              </div>
            )}
            {errors.loanId && (
              <div style={{ marginTop: '4px', color: 'var(--error)', fontSize: '12px' }}>{errors.loanId}</div>
            )}
          </div>

          <div>
            <label htmlFor="loanRepaymentAmount" className="body-sm" style={{ display: 'block', marginBottom: '4px' }}>Repayment amount</label>
            <input
              type="number"
              id="loanRepaymentAmount"
              name="loanRepaymentAmount"
              placeholder="0"
              min="0"
              step="0.01"
              value={formData.loanRepaymentAmount}
              onChange={handleChange}
              disabled={!formData.applyToLoan}
            />
            {errors.loanRepaymentAmount && (
              <div style={{ marginTop: '4px', color: 'var(--error)', fontSize: '12px' }}>{errors.loanRepaymentAmount}</div>
            )}
          </div>

          <div>
            <label htmlFor="loanRepaymentNote" className="body-sm" style={{ display: 'block', marginBottom: '4px' }}>Note (optional)</label>
            <input
              type="text"
              id="loanRepaymentNote"
              name="loanRepaymentNote"
              placeholder="e.g. Repayment from client payment"
              value={formData.loanRepaymentNote}
              onChange={handleChange}
              disabled={!formData.applyToLoan}
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <Button type="submit" variant="primary" loading={submitting}>
          {submitting ? (initialData ? 'Updating...' : 'Adding...') : (initialData ? 'Update Entry' : 'Add Work Day')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
