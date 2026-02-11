import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-rose-50 border border-rose-100 rounded-2xl">
          <div className="bg-rose-100 p-4 rounded-full mb-4">
            <AlertTriangle size={32} className="text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-slate-600 mb-4 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-4 text-xs text-slate-500 max-w-full overflow-auto">
              <summary className="cursor-pointer hover:text-slate-700">
                Stack trace
              </summary>
              <pre className="mt-2 p-2 bg-slate-100 rounded text-[10px] overflow-x-auto">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * App-level crash fallback - shown when the entire app crashes
 */
export const AppCrashFallback: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-8">
    <div className="bg-rose-500/20 p-6 rounded-full mb-6">
      <AlertTriangle size={48} className="text-rose-400" />
    </div>
    <h1 className="text-2xl font-bold mb-2">Application Error</h1>
    <p className="text-slate-400 mb-6 text-center max-w-md">
      Something went wrong and the application couldn't recover. 
      Please refresh the page to try again.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-semibold"
    >
      <RefreshCw size={20} />
      Refresh Page
    </button>
  </div>
);

export default ErrorBoundary;
