import React, { useState } from 'react';
import { Button } from '../ui/Button';
import './Form.css';

export const WorkEntryForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {
    date: new Date().toISOString().split('T')[0],
    client: 'Canteen',
    amount: '',
    status: 'Unpaid'
  });

  const [errors, setErrors] = useState({});

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
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.client) newErrors.client = 'Client/Project name is required';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const amount = parseFloat(formData.amount);
    let amountPaid = formData.amountPaid || 0;
    if (formData.status === 'Paid') amountPaid = amount;

    onSubmit({
      ...formData,
      amount,
      amountPaid
    });
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
        {errors.date && <span className="error">{errors.date}</span>}
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
        {errors.client && <span className="error" style={{ marginTop: '4px', display: 'block' }}>{errors.client}</span>}
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
        {errors.amount && <span className="error">{errors.amount}</span>}
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

      <div className="form-actions">
        <Button type="submit" variant="primary">
          {initialData ? 'Update Entry' : 'Add Work Day'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
