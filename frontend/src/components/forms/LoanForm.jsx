import { useState } from 'react';
import { Button } from '../ui/Button';
import { AlertCircle } from 'lucide-react';
import './Form.css';

export const LoanForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {
    lenderName: '',
    totalAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'Active'
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
        totalAmount: parseFloat(formData.totalAmount)
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
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
