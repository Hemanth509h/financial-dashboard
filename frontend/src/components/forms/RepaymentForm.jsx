import React, { useState } from 'react';
import { Button } from '../ui/Button';
import './Form.css';

export const RepaymentForm = ({ loan, initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'Cash',
    status: 'Success'
  });

  const [errors, setErrors] = useState({});

  const oldAmount = initialData ? parseFloat(initialData.amount) : 0;
  const remainingBalance = loan ? loan.totalAmount - (loan.amountPaid || 0) + oldAmount : 0;

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
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (parseFloat(formData.amount) > remainingBalance) {
      newErrors.amount = `Cannot exceed remaining balance of ₹${remainingBalance}`;
    }
    if (!formData.date) newErrors.date = 'Payment date is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)', backgroundColor: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)' }}>
        <div style={{ marginBottom: 'var(--space-sm)' }}>
          <span className="body-sm text-muted">Total Loan Amount</span>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)' }}>
            ₹{loan?.totalAmount?.toLocaleString()}
          </div>
        </div>
        <div style={{ marginBottom: 'var(--space-sm)' }}>
          <span className="body-sm text-muted">Paid So Far</span>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            ₹{loan?.amountPaid?.toLocaleString() || 0}
          </div>
        </div>
        <div>
          <span className="body-sm text-muted">Remaining Balance</span>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--error)' }}>
            ₹{remainingBalance.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="amount">Repayment Amount (₹) *</label>
        <input
          type="number"
          id="amount"
          name="amount"
          placeholder="0"
          min="0"
          max={remainingBalance}
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
        />
        {errors.amount && <span className="error">{errors.amount}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="date">Payment Date *</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
        />
        {errors.date && <span className="error">{errors.date}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="method">Payment Method</label>
        <select
          id="method"
          name="method"
          value={formData.method}
          onChange={handleChange}
        >
          <option value="Cash">Cash</option>
          <option value="UPI Transfer">UPI Transfer</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Auto-Debit">Auto-Debit</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="form-actions">
        <Button type="submit" variant="primary">
          Record Repayment
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
