
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/index.css';
import { ReactQueryProvider } from './src/lib/queryClient';
import ErrorBoundary, { AppCrashFallback } from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/ToastContext';
import { ToastContainer } from './components/ui/Toast';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary fallback={<AppCrashFallback />}>
      <ToastProvider>
        <ReactQueryProvider>
          <App />
        </ReactQueryProvider>
        <ToastContainer />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
