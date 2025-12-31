// components/charts/LineChart.tsx
'use client';
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface LineChartProps {
  data: { name: string; value: number }[];
  lineColor?: string;
}

export default function LineChart({ data, lineColor = '#3b82f6' }: LineChartProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <ReLineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ stroke: lineColor, fill: lineColor }}
          />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}