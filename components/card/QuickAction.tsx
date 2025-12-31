// components/card/QuickAction.tsx
'use client';
import React from 'react';

interface Action {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode; // optional icon
}

interface QuickActionProps {
  actions: Action[];
}

export function QuickAction({ actions }: QuickActionProps) {
  return (
    <div
      className="p-4 shadow rounded-lg border border-[var(--border-color)]"
      style={{
        backgroundColor: 'var(--card-bg)',
        color: 'var(--card-text)',
        
      }}
    >
      <h3 className="font-semibold mb-3">Quick Action</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={a.onClick}
            className="flex items-center justify-center gap-2 py-2 rounded-lg shadow transition-colors"
            style={{
              backgroundColor: 'var(--button-bg)',
              color: 'var(--button-text)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--button-hover-bg)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--button-bg)')
            }
          >
            {a.icon && <span className="text-lg">{a.icon}</span>}
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}