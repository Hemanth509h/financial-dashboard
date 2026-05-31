import { useState } from 'react';
import { Button } from '../ui/Button';
import { AlertCircle } from 'lucide-react';
import './Form.css';

export const LoanForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(() => {
    if (!initialData) {
      return {
        lenderName: '',
        totalAmount: '',
        monthlyInterest: '',
        startDate: new Date().toISOString().split('T')[0],
        status: 'Active',
      };
    }
    return {
      ...initialData,
      // Always show the original principal (not the interest-inflated totalAmount)
      totalAmount: initialData.principalAmount || initialData.totalAmount,
    };
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.lenderName || formData.lenderName.trim() === '') {
      newErrors.lenderName = 'Lender name is required';
    }
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'Loan amount must be greater than ₹0';
    }
    if (!formData.startDate) newErrors.startDate = 'Loan start date is required';
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
    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        monthlyInterest: formData.monthlyInterest ? parseFloat(formData.monthlyInterest) : 0,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isEditing = !!initialData;
  const principalAmount = initialData?.principalAmount || initialData?.totalAmount;
  const totalWithInterest = initialData?.totalAmount;
  const hasInterest = isEditing && totalWithInterest > principalAmount;

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="form">

      {isEditing && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 'var(--space-lg)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--outline-variant)' }}>
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--surface-container-low)' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #888)', marginBottom: '4px' }}>Loan Amount</div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{formatAmount(principalAmount)}</div>
          </div>
          <div style={{ padding: '10px 14px', backgroundColor: hasInterest ? 'rgba(239,68,68,0.07)' : 'var(--surface-container-low)', borderLeft: '1px solid var(--outline-variant)' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: hasInterest ? 'var(--error)' : 'var(--text-secondary, #888)', marginBottom: '4px' }}>Total w/ Interest</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: hasInterest ? 'var(--error)' : 'var(--text-secondary, #aaa)' }}>
              {hasInterest ? formatAmount(totalWithInterest) : '—'}
            </div>
            {hasInterest && (
              <div style={{ fontSize: '10px', color: 'var(--error)', opacity: 0.8, marginTop: '2px' }}>+{formatAmount(totalWithInterest - principalAmount)} interest</div>
            )}
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="lenderName">Lender Name *</label>
        <input
          type="text"
          id="lenderName"
          name="lenderName"
          placeholder="E.g., XYZ Bank"
          value={formData.lenderName}
          onChange={handleChange}
        />
        {errors.lenderName && (
          <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderLeft: '4px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{errors.lenderName}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="totalAmount">Loan Amount (₹) *</label>
        <input
          type="number"
          id="totalAmount"
          name="totalAmount"
          placeholder="0"
          min="0"
          step="0.01"
          value={formData.totalAmount}
          onChange={handleChange}
        />
        {errors.totalAmount && (
          <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderLeft: '4px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{errors.totalAmount}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="monthlyInterest">Monthly Interest Amount <span className="text-muted">(optional)</span></label>
        <input
          type="number"
          id="monthlyInterest"
          name="monthlyInterest"
          placeholder="0 — set once, add each month with one tap"
          min="0"
          step="0.01"
          value={formData.monthlyInterest}
          onChange={handleChange}
        />
        <p className="text-muted body-sm" style={{ marginTop: '4px', fontSize: '12px' }}>
          If set, a one-tap button appears on the loan card to add this amount as interest each month.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="startDate">Loan Start Date *</label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
        />
        {errors.startDate && (
          <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderLeft: '4px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{errors.startDate}</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="Active">Active</option>
          <option value="Repaid">Fully Repaid</option>
        </select>
      </div>

      <div className="form-actions">
        <Button type="submit" variant="primary" loading={submitting}>
          {submitting ? (initialData ? 'Updating...' : 'Adding...') : (initialData ? 'Update Loan' : 'Add Loan')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
