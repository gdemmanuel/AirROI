import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';

interface DailyCosts {
  date: string;
  totalCost: number;
  claudeCost: number;
  rentcastCost: number;
  totalCalls: number;
  claudeCalls: number;
  rentcastCalls: number;
  byModel: Record<string, { calls: number; cost: number; inputTokens: number; outputTokens: number }>;
  byRentCastEndpoint: Record<string, { calls: number; cost: number }>;
}

type TimeFrame = '7d' | '30d' | '90d' | 'all';

const ApiCostChart: React.FC = () => {
  const [costHistory, setCostHistory] = useState<DailyCosts[]>([]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostHistory();
    const interval = setInterval(fetchCostHistory, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchCostHistory = async () => {
    try {
      const res = await fetch('/api/admin/cost-history');
      if (res.ok) {
        const data = await res.json();
        setCostHistory(data);
      }
    } catch (e) {
      console.error('Failed to fetch cost history:', e);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    if (!costHistory.length) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeFrame) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        return costHistory.slice().reverse();
    }
    
    return costHistory
      .filter(day => new Date(day.date) >= cutoffDate)
      .reverse();
  };

  const getChartData = () => {
    const filtered = getFilteredData();
    return filtered.map(day => {
      const sonnetCost = day.byModel['claude-sonnet-4']?.cost || 0;
      const haikuCost = day.byModel['claude-3-5-haiku']?.cost || 0;
      
      return {
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: day.date,
        'Claude Sonnet-4': sonnetCost,
        'Claude Haiku': haikuCost,
        'RentCast': day.rentcastCost,
        'Total': day.totalCost,
      };
    });
  };

  const getTotalCosts = () => {
    const filtered = getFilteredData();
    const total = filtered.reduce((sum, day) => sum + day.totalCost, 0);
    const claude = filtered.reduce((sum, day) => sum + day.claudeCost, 0);
    const rentcast = filtered.reduce((sum, day) => sum + day.rentcastCost, 0);
    return { total, claude, rentcast };
  };

  const chartData = getChartData();
  const totals = getTotalCosts();

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-sm text-slate-500">Loading cost data...</p>
      </div>
    );
  }

  if (!costHistory.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={18} className="text-slate-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">API Cost Tracking</h3>
        </div>
        <p className="text-sm text-slate-500">No cost data available yet. Run some property analyses to see your API usage.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header with Time Frame Selector */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-slate-400" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">API Cost Tracking</h3>
          </div>
          
          {/* Time Frame Selector */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {[
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' },
              { value: 'all', label: 'All Time' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTimeFrame(value as TimeFrame)}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-all ${
                  timeFrame === value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 p-5 bg-slate-50 border-b border-slate-100">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-black mb-1">Total Cost</div>
          <div className="text-2xl font-black text-slate-900">${totals.total.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {timeFrame === '7d' ? 'Last 7 days' : timeFrame === '30d' ? 'Last 30 days' : timeFrame === '90d' ? 'Last 90 days' : 'All time'}
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-600 uppercase tracking-wider font-black mb-1">Claude API</div>
          <div className="text-2xl font-black text-blue-900">${totals.claude.toFixed(2)}</div>
          <div className="text-[10px] text-blue-600 mt-1">
            {((totals.claude / totals.total) * 100).toFixed(0)}% of total
          </div>
        </div>
        
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
          <div className="text-xs text-emerald-600 uppercase tracking-wider font-black mb-1">RentCast API</div>
          <div className="text-2xl font-black text-emerald-900">${totals.rentcast.toFixed(2)}</div>
          <div className="text-[10px] text-emerald-600 mt-1">
            {((totals.rentcast / totals.total) * 100).toFixed(0)}% of total
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              tick={{ fontSize: 11, fontWeight: 600 }}
            />
            <YAxis 
              stroke="#64748b"
              tick={{ fontSize: 11, fontWeight: 600 }}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <ChartTooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600
              }}
              formatter={(value: any) => [`$${value.toFixed(3)}`, '']}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  const fullDate = payload[0].payload.fullDate;
                  return new Date(fullDate).toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  });
                }
                return label;
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', fontWeight: 600 }}
            />
            
            {/* Stacked bars for API costs */}
            <Bar 
              dataKey="Claude Sonnet-4" 
              stackId="a"
              fill="#3b82f6" 
              name="Claude Sonnet-4"
            />
            <Bar 
              dataKey="Claude Haiku" 
              stackId="a"
              fill="#93c5fd" 
              name="Claude Haiku"
            />
            <Bar 
              dataKey="RentCast" 
              stackId="a"
              fill="#10b981" 
              name="RentCast"
            />
            
            {/* Total cost line */}
            <Line 
              type="monotone" 
              dataKey="Total" 
              stroke="#64748b" 
              strokeWidth={3}
              dot={{ fill: '#64748b', r: 5 }}
              name="Total Cost"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Note */}
      <div className="px-5 pb-5">
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <TrendingUp size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-900">
            <span className="font-bold">Stacked bars</span> show individual API costs per day. 
            <span className="font-bold ml-1">Gray line</span> shows total daily cost across all APIs.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiCostChart;
