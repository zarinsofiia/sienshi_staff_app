// components/card/PieChart.tsx
'use client';
import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip
} from 'recharts';

interface ServiceData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: ServiceData[];
}

export function Pie_Chart({ data }: PieChartProps) {
  return (
    <div className="p-4 bg-white shadow rounded-lg h-80">
      <h3 className="font-semibold mb-3">Top Services Subscribed</h3>
      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || "#dc2626"} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
