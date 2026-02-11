import React from 'react';
import { Loader2 } from 'lucide-react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  message?: string;
  className?: string;
  color?: 'rose' | 'indigo' | 'slate' | 'white';
  fullScreen?: boolean;
}

const sizeClasses: Record<SpinnerSize, { spinner: string; text: string }> = {
  sm: { spinner: 'w-4 h-4', text: 'text-xs' },
  md: { spinner: 'w-8 h-8', text: 'text-sm' },
  lg: { spinner: 'w-12 h-12', text: 'text-base' },
  xl: { spinner: 'w-16 h-16', text: 'text-lg' },
};

const colorClasses: Record<string, string> = {
  rose: 'text-rose-500',
  indigo: 'text-indigo-500',
  slate: 'text-slate-500',
  white: 'text-white',
};

/**
 * LoadingSpinner - Reusable loading indicator
 * 
 * @param size - sm, md, lg, xl
 * @param message - Optional loading message
 * @param color - rose, indigo, slate, white
 * @param fullScreen - Centers in full viewport
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className = '',
  color = 'rose',
  fullScreen = false,
}) => {
  const { spinner, text } = sizeClasses[size];
  const colorClass = colorClasses[color];

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`animate-spin ${spinner} ${colorClass}`} />
      {message && (
        <p className={`${text} ${colorClass} font-medium animate-pulse`}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
};

/**
 * PanelLoadingState - Loading state for analysis panels
 * Consistent styling across all advanced analysis panels
 */
interface PanelLoadingStateProps {
  message?: string;
  color?: 'rose' | 'indigo';
}

export const PanelLoadingState: React.FC<PanelLoadingStateProps> = ({
  message = 'Loading...',
  color = 'rose',
}) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className={`animate-spin w-12 h-12 border-4 border-${color}-500 border-t-transparent rounded-full mb-4`} />
    <p className={`text-${color}-500 font-semibold animate-pulse`}>{message}</p>
  </div>
);

/**
 * InlineSpinner - Small inline spinner for buttons
 */
interface InlineSpinnerProps {
  size?: number;
  className?: string;
}

export const InlineSpinner: React.FC<InlineSpinnerProps> = ({
  size = 16,
  className = 'text-current',
}) => <Loader2 size={size} className={`animate-spin ${className}`} />;

export default LoadingSpinner;
