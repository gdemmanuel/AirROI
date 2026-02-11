import React from 'react';
import { Database, Globe, Sparkles, Clock, RefreshCw } from 'lucide-react';

type DataSource = 'rentcast' | 'web_search' | 'ai_estimate' | 'cached';

interface StatusBadgeProps {
  source: DataSource;
  timestamp?: Date | number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

const sourceConfig: Record<DataSource, { label: string; icon: React.ReactNode; color: string }> = {
  rentcast: {
    label: 'RentCast',
    icon: <Database size={12} />,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  web_search: {
    label: 'Web Search',
    icon: <Globe size={12} />,
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  ai_estimate: {
    label: 'AI Estimate',
    icon: <Sparkles size={12} />,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  cached: {
    label: 'Cached',
    icon: <Clock size={12} />,
    color: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

/**
 * StatusBadge - Shows data source and freshness
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  source,
  timestamp,
  onRefresh,
  isRefreshing = false,
  className = '',
}) => {
  const config = sourceConfig[source];
  
  const formatTime = (ts: Date | number) => {
    const date = ts instanceof Date ? ts : new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold 
                   rounded-full border ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
      
      {timestamp && (
        <span className="text-[10px] text-slate-400">
          {formatTime(timestamp)}
        </span>
      )}
      
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw 
            size={12} 
            className={`text-slate-400 hover:text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} 
          />
        </button>
      )}
    </div>
  );
};

/**
 * CacheStatusBadge - Shows if data is from cache or fresh
 */
interface CacheStatusBadgeProps {
  isCached: boolean;
  updatedAt?: number;
  className?: string;
}

export const CacheStatusBadge: React.FC<CacheStatusBadgeProps> = ({
  isCached,
  updatedAt,
  className = '',
}) => {
  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold 
                 rounded-full border ${
                   isCached
                     ? 'bg-slate-100 text-slate-600 border-slate-200'
                     : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                 } ${className}`}
    >
      {isCached ? <Clock size={10} /> : <RefreshCw size={10} />}
      {isCached ? 'Cached' : 'Fresh'}
      {updatedAt && (
        <span className="text-slate-400 ml-1">({formatTime(updatedAt)})</span>
      )}
    </span>
  );
};

/**
 * DataSourceIndicator - Shows where each data point comes from
 */
interface DataSourceIndicatorProps {
  sources: {
    adr?: 'rentcast' | 'web_search' | 'ai_estimate';
    occupancy?: 'rentcast' | 'web_search' | 'ai_estimate';
    rent?: 'rentcast' | 'ai_estimate';
  };
  className?: string;
}

export const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({
  sources,
  className = '',
}) => {
  const items = [
    { label: 'ADR', source: sources.adr },
    { label: 'Occupancy', source: sources.occupancy },
    { label: 'Rent', source: sources.rent },
  ].filter((item) => item.source);

  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item) => {
        const config = sourceConfig[item.source!];
        return (
          <span
            key={item.label}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] 
                       rounded-full border ${config.color}`}
          >
            {config.icon}
            <span className="font-medium">{item.label}:</span>
            <span>{config.label}</span>
          </span>
        );
      })}
    </div>
  );
};

export default StatusBadge;
