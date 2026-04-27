import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: 'var(--space-xl)',
          textAlign: 'center',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--error)'
        }}>
          <AlertCircle 
            size={48} 
            color="var(--error)" 
            style={{ marginBottom: 'var(--space-md)' }}
          />
          <h2 style={{ marginBottom: 'var(--space-sm)', color: 'var(--on-surface)' }}>
            Something went wrong
          </h2>
          <p style={{ 
            color: 'var(--on-surface-variant)', 
            marginBottom: 'var(--space-lg)',
            maxWidth: '500px'
          }}>
            We encountered an error while rendering this page. 
            Please try refreshing or contact support if the problem persists.
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              width: '100%',
              textAlign: 'left',
              marginBottom: 'var(--space-lg)',
              padding: 'var(--space-md)',
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: 'var(--space-sm)' }}>
                Error Details (Dev Only)
              </summary>
              <pre style={{ 
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && '\n\n' + this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <Button onClick={this.handleReset} style={{ marginRight: 'var(--space-sm)' }}>
            Try Again
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => window.location.href = '/'}
          >
            Go to Dashboard
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
