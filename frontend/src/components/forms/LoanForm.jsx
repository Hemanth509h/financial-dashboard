import React, { useState } from 'react';
import { Button } from '../ui/Button';
import './Form.css';

export const LoanForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {
    lenderName: '',
    totalAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'Active'
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
    if (!formData.lenderName) newErrors.lenderName = 'Lender name is required';
    if (!formData.totalAmount || formData.totalAmount <= 0) newErrors.totalAmount = 'Amount must be greater than 0';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit({
      ...formData,
      totalAmount: parseFloat(formData.totalAmount)
    });
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
        {errors.lenderName && <span className="error">{errors.lenderName}</span>}
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
        {errors.totalAmount && <span className="error">{errors.totalAmount}</span>}
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
        {errors.startDate && <span className="error">{errors.startDate}</span>}
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
        <Button type="submit" variant="primary">
          {initialData ? 'Update Loan' : 'Add Loan'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
