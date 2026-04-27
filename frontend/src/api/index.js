import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  // Dashboard
  getDashboardSummary: () => axios.get(`${API_URL}/dashboard/summary`),
  getAnalytics: () => axios.get(`${API_URL}/dashboard/analytics`),
  
  // Work Logs
  getWorkLogs: () => axios.get(`${API_URL}/work-logs`),
  createWorkLog: (data) => axios.post(`${API_URL}/work-logs`, data),
  updateWorkLog: (id, data) => axios.patch(`${API_URL}/work-logs/${id}`, data),
  deleteWorkLog: (id) => axios.delete(`${API_URL}/work-logs/${id}`),

  // Loans
  getLoans: () => axios.get(`${API_URL}/loans`),
  createLoan: (data) => axios.post(`${API_URL}/loans`, data),
  updateLoan: (id, data) => axios.patch(`${API_URL}/loans/${id}`, data),
  deleteLoan: (id) => axios.delete(`${API_URL}/loans/${id}`),
  getLoanRepayments: (id) => axios.get(`${API_URL}/loans/${id}/repayments`),
  addLoanRepayment: (id, data) => axios.post(`${API_URL}/loans/${id}/repayments`, data),
  updateLoanRepayment: (loanId, repaymentId, data) => axios.patch(`${API_URL}/loans/${loanId}/repayments/${repaymentId}`, data),
  deleteLoanRepayment: (loanId, repaymentId) => axios.delete(`${API_URL}/loans/${loanId}/repayments/${repaymentId}`),
  getClientAnalytics: () => axios.get(`${API_URL}/dashboard/clients`),
};
