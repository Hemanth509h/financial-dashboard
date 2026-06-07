import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({ baseURL: API_URL });

const CACHE_TTL = 30_000;
const cache = new Map();

function cachedGet(path) {
  const entry = cache.get(path);
  if (entry && Date.now() - entry.ts < CACHE_TTL) {
    return Promise.resolve(entry.data);
  }
  return client.get(path).then((res) => {
    cache.set(path, { ts: Date.now(), data: res });
    return res;
  });
}

function invalidate(...prefixes) {
  for (const key of cache.keys()) {
    if (prefixes.some((p) => key.startsWith(p))) cache.delete(key);
  }
}

function invalidateAll() {
  cache.clear();
}

const post = (path, data) => client.post(path, data);
const patch = (path, data) => client.patch(path, data);
const del = (path) => client.delete(path);

export const api = {
  // Auth
  register: (email, password, name) => post('/auth/register', { email, password, name }),
  login: (email, password) => post('/auth/login', { email, password }),
  forgotPassword: (email) => post('/auth/forgot-password', { email }),
  resetPassword: (email, password) => post('/auth/reset-password', { email, password }),
  getMe: () => client.get('/auth/me'),
  updateProfile: (data) => {
    invalidateAll();
    return patch('/auth/profile', data);
  },

  // Dashboard
  getDashboardSummary: () => cachedGet('/dashboard/summary'),
  getAnalytics: () => cachedGet('/dashboard/analytics'),
  getClientAnalytics: () => cachedGet('/dashboard/clients'),
  getMonthlyHistory: () => cachedGet('/dashboard/monthly-history'),

  // Work Logs
  getWorkLogs: () => cachedGet('/work-logs'),
  createWorkLog: (data) => {
    invalidate('/work-logs', '/dashboard');
    return post('/work-logs', data);
  },
  updateWorkLog: (id, data) => {
    invalidate('/work-logs', '/dashboard');
    return patch(`/work-logs/${id}`, data);
  },
  deleteWorkLog: (id) => {
    invalidate('/work-logs', '/dashboard');
    return del(`/work-logs/${id}`);
  },

  // Expenses
  getExpenses: () => cachedGet('/expenses'),
  createExpense: (data) => {
    invalidate('/expenses', '/dashboard');
    return post('/expenses', data);
  },
  updateExpense: (id, data) => {
    invalidate('/expenses', '/dashboard');
    return patch(`/expenses/${id}`, data);
  },
  deleteExpense: (id) => {
    invalidate('/expenses', '/dashboard');
    return del(`/expenses/${id}`);
  },

  // Loans
  getLoans: () => cachedGet('/loans'),
  createLoan: (data) => {
    invalidate('/loans', '/dashboard');
    return post('/loans', data);
  },
  updateLoan: (id, data) => {
    invalidate('/loans', '/dashboard');
    return patch(`/loans/${id}`, data);
  },
  deleteLoan: (id) => {
    invalidate('/loans', '/dashboard');
    return del(`/loans/${id}`);
  },
  getLoanRepayments: (id) => cachedGet(`/loans/${id}/repayments`),
  addLoanRepayment: (id, data) => {
    invalidate('/loans', '/dashboard');
    return post(`/loans/${id}/repayments`, data);
  },
  addLoanInterest: (id, data) => {
    invalidate('/loans', '/dashboard');
    return post(`/loans/${id}/repayments`, { ...data, type: 'Interest' });
  },
  updateLoanRepayment: (loanId, repaymentId, data) => {
    invalidate('/loans', '/dashboard');
    return patch(`/loans/${loanId}/repayments/${repaymentId}`, data);
  },
  deleteLoanRepayment: (loanId, repaymentId) => {
    invalidate('/loans', '/dashboard');
    return del(`/loans/${loanId}/repayments/${repaymentId}`);
  },
};
