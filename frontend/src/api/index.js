import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('gf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const get = (path) => client.get(path);
const post = (path, data) => client.post(path, data);
const patch = (path, data) => client.patch(path, data);
const del = (path) => client.delete(path);

export const api = {
  // Auth
  register: (email, password, name) => post('/auth/register', { email, password, name }),
  login: (email, password) => post('/auth/login', { email, password }),
  forgotPassword: (email) => post('/auth/forgot-password', { email }),
  resetPassword: (email, password) => post('/auth/reset-password', { email, password }),
  getMe: () => get('/auth/me'),
  updateProfile: (data) => patch('/auth/profile', data),

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
