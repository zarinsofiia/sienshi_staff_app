// components/card/StatsCard.tsx
'use client';
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string; // e.g. text-red-600
}

export function StatsCard({ title, value, subtitle, icon, color = "text-red-600" }: StatsCardProps) {
  return (
    <div className="p-4 bg-white shadow rounded-lg flex items-center justify-between">
      <div>
        <h4 className="text-gray-600 text-sm">{title}</h4>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {icon && <div className="text-3xl text-gray-400">{icon}</div>}
    </div>
  );
}
