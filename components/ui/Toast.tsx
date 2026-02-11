import React from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useToast, ToastVariant } from './ToastContext';

const variantStyles: Record<ToastVariant, { bg: string; icon: React.ReactNode; border: string }> = {
  success: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-600',
    icon: <CheckCircle size={20} />,
  },
  error: {
    bg: 'bg-rose-500',
    border: 'border-rose-600',
    icon: <AlertCircle size={20} />,
  },
  warning: {
    bg: 'bg-amber-500',
    border: 'border-amber-600',
    icon: <AlertTriangle size={20} />,
  },
  info: {
    bg: 'bg-blue-500',
    border: 'border-blue-600',
    icon: <Info size={20} />,
  },
};

/**
 * ToastContainer - Renders all active toasts
 * Place this component once at the root of your app
 */
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const style = variantStyles[toast.variant];
        return (
          <div
            key={toast.id}
            className={`${style.bg} ${style.border} border text-white px-4 py-3 rounded-xl shadow-lg 
                       flex items-center gap-3 animate-in slide-in-from-right-5 fade-in duration-300`}
            role="alert"
          >
            <div className="flex-shrink-0">{style.icon}</div>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Standalone toast function for use outside React components
 * Note: Requires ToastProvider to be mounted
 */
export { useToast } from './ToastContext';
