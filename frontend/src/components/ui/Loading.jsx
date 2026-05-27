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
