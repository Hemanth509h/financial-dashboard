import React, { useState } from 'react';
import { Button } from '../ui/Button';
import './Form.css';

export const PaymentForm = ({ workEntry, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    amountPaid: workEntry?.amountPaid || '',
    datePaid: new Date().toISOString().split('T')[0],
    status: workEntry?.status || 'Paid'
  });

  const [errors, setErrors] = useState({});

  const remainingAmount = workEntry ? workEntry.amount - (workEntry.amountPaid || 0) : 0;

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
    if (!formData.amountPaid || formData.amountPaid <= 0) {
      newErrors.amountPaid = 'Amount must be greater than 0';
    }
    if (parseFloat(formData.amountPaid) > remainingAmount) {
      newErrors.amountPaid = `Cannot exceed remaining amount of ₹${remainingAmount}`;
    }
    if (!formData.datePaid) newErrors.datePaid = 'Payment date is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const totalAmountPaid = (workEntry.amountPaid || 0) + parseFloat(formData.amountPaid);
    onSubmit({
      amountPaid: totalAmountPaid,
      datePaid: formData.datePaid,
      status: totalAmountPaid >= workEntry.amount ? 'Paid' : 'Partially Paid'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)', backgroundColor: 'var(--surface-container-low)', borderRadius: 'var(--radius-sm)' }}>
        <div style={{ marginBottom: 'var(--space-sm)' }}>
          <span className="body-sm text-muted">Expected Amount</span>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)' }}>
            ₹{workEntry?.amount?.toLocaleString()}
          </div>
        </div>
        <div style={{ marginBottom: 'var(--space-sm)' }}>
          <span className="body-sm text-muted">Already Paid</span>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            ₹{workEntry?.amountPaid?.toLocaleString() || 0}
          </div>
        </div>
        <div>
          <span className="body-sm text-muted">Remaining</span>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--error)' }}>
            ₹{remainingAmount.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="amountPaid">Amount to Record (₹) *</label>
        <input
          type="number"
          id="amountPaid"
          name="amountPaid"
          placeholder="0"
          min="0"
          max={remainingAmount}
          step="0.01"
          value={formData.amountPaid}
          onChange={handleChange}
        />
        {errors.amountPaid && <span className="error">{errors.amountPaid}</span>}
        {formData.amountPaid && parseFloat(formData.amountPaid) > 0 && parseFloat(formData.amountPaid) < remainingAmount && (
          <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-sm)', backgroundColor: 'rgba(255, 193, 7, 0.1)', color: '#b28900', borderLeft: '4px solid var(--warning)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
            <strong>Partial Payment:</strong> You are recording less than the remaining amount. This entry will be marked as "Partially Paid" and remain in your pending list.
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="datePaid">Payment Date *</label>
        <input
          type="date"
          id="datePaid"
          name="datePaid"
          value={formData.datePaid}
          onChange={handleChange}
        />
        {errors.datePaid && <span className="error">{errors.datePaid}</span>}
      </div>

      <div className="form-actions">
        <Button type="submit" variant="primary">
          Record Payment
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
