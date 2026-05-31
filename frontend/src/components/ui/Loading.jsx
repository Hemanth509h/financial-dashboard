import { useEffect, useState } from 'react';
import './Loading.css';

export const Spinner = ({ size = 'md', label = 'Loading' }) => (
  <span className={`spinner spinner-${size}`} role="status" aria-label={label} />
);

export const LoadingText = ({ children = 'Loading...' }) => (
  <span className="loading-text">
    <Spinner size="sm" />
    <span>{children}</span>
  </span>
);

export const PageLoading = ({ label = 'Loading...' }) => (
  <div className="page-loading">
    <Spinner size="lg" label={label} />
    <span>{label}</span>
  </div>
);

export const SplashScreen = () => {
  const [seconds, setSeconds] = useState(0);
  const [showSlowNote, setShowSlowNote] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    const slowTimer = setTimeout(() => setShowSlowNote(true), 4000);
    return () => {
      clearInterval(timer);
      clearTimeout(slowTimer);
    };
  }, []);

  return (
    <div className="splash-screen">
      <div className="splash-card">
        <img src="/logo.png" alt="GigFinance" className="splash-logo" />
        <h1 className="splash-title">GigFinance</h1>
        <Spinner size="lg" />
        <p className="splash-status">
          {showSlowNote
            ? `Starting up… ${seconds}s (first load can take up to 50 seconds)`
            : 'Loading your dashboard…'}
        </p>
        {showSlowNote && (
          <p className="splash-note">
            The server wakes up on first visit. Please wait a moment.
          </p>
        )}
      </div>
    </div>
  );
};
