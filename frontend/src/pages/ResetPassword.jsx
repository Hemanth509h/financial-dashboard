import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import './Auth.css';

export const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data } = await api.resetPassword(email, password);
      setMessage(data.message || 'Your password has been reset successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="GigFinance" />
          <h2>GigFinance</h2>
        </div>

        <div className="auth-title">Reset your password</div>
        <div className="auth-subtitle">Enter your email and a new password to reset your account.</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label>New password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading && <span className="auth-spinner" aria-hidden="true" />}
            <span>{loading ? 'Resetting...' : 'Reset password'}</span>
          </button>
        </form>

        <div className="auth-switch">
          Remembered your password? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};
