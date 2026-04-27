import React, { useMemo, useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#71717a'];

export const ClientPieChart = ({ data }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Take top 5 clients and group others
    const sorted = [...data].sort((a, b) => b.totalEarned - a.totalEarned);
    const top5 = sorted.slice(0, 5);
    const others = sorted.slice(5);
    
    const result = top5.map(client => ({
      name: client.name,
      value: client.totalEarned
    }));
    
    if (others.length > 0) {
      result.push({
        name: 'Others',
        value: others.reduce((sum, c) => sum + c.totalEarned, 0)
      });
    }
    
    return result;
  }, [data]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      maximumFractionDigits: 0 
    }).format(value);
  };

  if (!isMounted) {
    return <div style={{ width: '100%', height: 300 }}></div>;
  }

  if (chartData.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)' }}>
        No client data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [formatCurrency(value), 'Earnings']}
            contentStyle={{ 
              backgroundColor: 'var(--surface-bright)', 
              borderRadius: '8px', 
              border: '1px solid var(--outline-variant)',
              color: 'var(--on-surface)'
            }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
