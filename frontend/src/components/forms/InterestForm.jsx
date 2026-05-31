import { useState } from 'react';
import { Button } from '../ui/Button';
import { AlertCircle, TrendingUp } from 'lucide-react';
import './Form.css';

export const InterestForm = ({ loan, onSubmit, onCancel, formatCurrency }) => {
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const remaining = loan ? loan.totalAmount - (loan.amountPaid || 0) : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.amount || Number(formData.amount) <= 0)
      errs.amount = 'Interest amount must be greater than 0';
    if (!formData.date) errs.date = 'Date is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await onSubmit({ ...formData, type: 'Interest', status: 'Success' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)', backgroundColor: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--error)' }}>
        <div className="body-sm" style={{ color: 'var(--error)', fontWeight: 600, marginBottom: 'var(--space-xs)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={14} /> Adding interest will increase the total owed
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
          <div>
            <div className="body-sm text-muted">Current Total</div>
            <div className="font-semibold">{formatCurrency ? formatCurrency(loan?.totalAmount) : loan?.totalAmount}</div>
          </div>
          <div>
            <div className="body-sm text-muted">Remaining</div>
            <div className="font-semibold" style={{ color: 'var(--error)' }}>{formatCurrency ? formatCurrency(remaining) : remaining}</div>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="amount">Interest Amount *</label>
        <input
          type="number"
          id="amount"
          name="amount"
          placeholder="0"
          min="1"
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
          autoFocus
        />
        {formData.amount && Number(formData.amount) > 0 && !errors.amount && (
          <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: 'rgba(239,68,68,0.08)', color: 'var(--error)', borderLeft: '4px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
            New total will be: <strong>{formatCurrency ? formatCurrency((loan?.totalAmount || 0) + Number(formData.amount)) : (loan?.totalAmount || 0) + Number(formData.amount)}</strong>
          </div>
        )}
        {errors.amount && (
          <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--error)', borderLeft: '4px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', gap: 8 }}>
            <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{errors.amount}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="date">Date *</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
        />
        {errors.date && (
          <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--error)', borderLeft: '4px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', gap: 8 }}>
            <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{errors.date}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="note">Note <span className="text-muted">(optional)</span></label>
        <input
          type="text"
          id="note"
          name="note"
          placeholder="e.g. Monthly interest @ 2%"
          maxLength={300}
          value={formData.note}
          onChange={handleChange}
        />
      </div>

      <div className="form-actions">
        <Button type="submit" variant="primary" loading={submitting}>
          {submitting ? 'Adding…' : 'Add Interest'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
