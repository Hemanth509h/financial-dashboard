import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './Auth.css';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setResetLoading(true);
    try {
      const { data } = await api.forgotPassword(form.email);
      setResetMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to process password recovery. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="GigFinance" />
          <h2>GigFinance</h2>
        </div>
        <div className="auth-title">{showForgotPassword ? 'Reset your password' : 'Welcome back'}</div>
        <div className="auth-subtitle">
          {showForgotPassword ? 'Enter your email to start password recovery' : 'Sign in to your account to continue'}
        </div>

        <form className="auth-form" onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {resetMessage && <div className="auth-success">{resetMessage}</div>}
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
              autoFocus
            />
          </div>
          {!showForgotPassword && (
            <div className="auth-field">
              <div className="auth-label-row">
                <label>Password</label>
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => {
                    setError('');
                    setResetMessage('');
                    setShowForgotPassword(true);
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          )}
          <button className="auth-btn" type="submit" disabled={loading || resetLoading}>
            {(loading || resetLoading) && <span className="auth-spinner" aria-hidden="true" />}
            <span>{showForgotPassword ? (resetLoading ? 'Requesting...' : 'Request password reset') : (loading ? 'Signing in...' : 'Sign in')}</span>
          </button>
        </form>

        <div className="auth-switch">
          {showForgotPassword ? (
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setError('');
                setResetMessage('');
                setShowForgotPassword(false);
              }}
            >
              Back to sign in
            </button>
          ) : (
            <>
              Don't have an account?{' '}
              <Link to="/register">Create one</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
