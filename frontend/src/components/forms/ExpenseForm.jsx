import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import './Form.css';

const categories = ['Food', 'Travel', 'Rent', 'Utilities', 'Supplies', 'Loan', 'Personal', 'Other'];
const paymentMethods = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'];

const ErrorMessage = ({ children }) => (
  <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderLeft: '4px solid var(--error)', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
    <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
    <span>{children}</span>
  </div>
);

export const ExpenseForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    amount: '',
    merchant: '',
    paymentMethod: 'Cash',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = 'Expense date is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
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

    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
        merchant: (formData.merchant || '').trim(),
        description: (formData.description || '').trim(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label htmlFor="date">Expense Date *</label>
        <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} />
        {errors.date && <ErrorMessage>{errors.date}</ErrorMessage>}
      </div>

      <div className="form-group">
        <label htmlFor="category">Category *</label>
        <select id="category" name="category" value={formData.category} onChange={handleChange}>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          {categories.slice(0, 6).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, category }))}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                border: '1px solid var(--outline-variant)',
                backgroundColor: formData.category === category ? 'var(--primary-container)' : 'var(--surface-container-low)',
                color: formData.category === category ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {category}
            </button>
          ))}
        </div>
        {errors.category && <ErrorMessage>{errors.category}</ErrorMessage>}
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount *</label>
        <input type="number" id="amount" name="amount" min="0" step="0.01" placeholder="0" value={formData.amount} onChange={handleChange} />
        {errors.amount && <ErrorMessage>{errors.amount}</ErrorMessage>}
      </div>

      <div className="form-group">
        <label htmlFor="merchant">Merchant</label>
        <input type="text" id="merchant" name="merchant" maxLength={120} placeholder="Shop, vendor, or person" value={formData.merchant || ''} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label htmlFor="paymentMethod">Payment Method</label>
        <select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          placeholder="Notes about this expense"
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
            boxSizing: 'border-box',
          }}
        />
        <div className="body-sm text-muted" style={{ marginTop: '4px', textAlign: 'right' }}>
          {(formData.description || '').length}/500
        </div>
      </div>

      <div className="form-actions">
        <Button type="submit" variant="primary" loading={submitting}>
          {submitting ? (initialData ? 'Updating...' : 'Adding...') : (initialData ? 'Update Expense' : 'Add Expense')}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
