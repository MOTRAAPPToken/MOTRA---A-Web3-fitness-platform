import { Component } from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card error-boundary">
          <div className="error-boundary__icon">⚠️</div>
          <h2 className="error-boundary__title">
            Something went wrong
          </h2>
          <p className="error-boundary__message">
            We encountered an error while loading the application. Please refresh the page and try again.
          </p>
          <button 
            className="btn-primary error-boundary__button"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
