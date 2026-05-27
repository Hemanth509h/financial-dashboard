import './Button.css';
import { Spinner } from './Loading';

export const Button = ({ children, variant = 'primary', className = '', loading = false, disabled, ...props }) => {
  return (
    <button className={`btn btn-${variant} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <Spinner size="sm" label="Loading" />}
      {children}
    </button>
  );
};
