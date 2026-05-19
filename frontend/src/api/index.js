import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const get = (path) => axios.get(`${API_URL}${path}`);
const post = (path, data) => axios.post(`${API_URL}${path}`, data);
const patch = (path, data) => axios.patch(`${API_URL}${path}`, data);
const del = (path) => axios.delete(`${API_URL}${path}`);

export const api = {
  // Dashboard
  getDashboardSummary: () => get('/dashboard/summary'),
  getAnalytics: () => get('/dashboard/analytics'),
  getClientAnalytics: () => get('/dashboard/clients'),
  getMonthlyHistory: () => get('/dashboard/monthly-history'),

  // Work Logs
  getWorkLogs: () => get('/work-logs'),
  createWorkLog: (data) => post('/work-logs', data),
  updateWorkLog: (id, data) => patch(`/work-logs/${id}`, data),
  deleteWorkLog: (id) => del(`/work-logs/${id}`),

  // Loans
  getLoans: () => get('/loans'),
  createLoan: (data) => post('/loans', data),
  updateLoan: (id, data) => patch(`/loans/${id}`, data),
  deleteLoan: (id) => del(`/loans/${id}`),
  getLoanRepayments: (id) => get(`/loans/${id}/repayments`),
  addLoanRepayment: (id, data) => post(`/loans/${id}/repayments`, data),
  updateLoanRepayment: (loanId, repaymentId, data) =>
    patch(`/loans/${loanId}/repayments/${repaymentId}`, data),
  deleteLoanRepayment: (loanId, repaymentId) =>
    del(`/loans/${loanId}/repayments/${repaymentId}`),
};
