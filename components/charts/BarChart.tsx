// components/charts/BarChart.tsx
'use client';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  data: { name: string; value: number }[];
  barColor?: string;
}

export default function BarChart({ data, barColor = '#10b981' }: BarChartProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <ReBarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="name" stroke="var(--text)" />
          <YAxis stroke="var(--text)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--popover-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text)',
            }}
          />
          <Bar dataKey="value" fill={barColor} />
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}