'use client';

import { Bell } from 'lucide-react';
import React from 'react';

interface NotificationProps {
  /** Number to show inside the badge */
  count?: number;
  /** Optional click handler – if provided, the bell is clickable */
  onClick?: () => void;
}

export default function Notification({
  count = 0,
  onClick,
}: NotificationProps) {
  return (
    <button
      // Only add cursor pointer if a handler is supplied
      className={`p-2 rounded-lg transition-colors relative ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
      style={{
        backgroundColor: 'var(--card-bg)',
        color: 'var(--icon-color)',
      }}
      onMouseEnter={e =>
        (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)')
      }
      onMouseLeave={e =>
        (e.currentTarget.style.backgroundColor = 'var(--card-bg)')
      }
      // Fire only if onClick exists
      onClick={onClick}
      aria-label="Notifications"
      type="button"
    >
      <Bell className="w-5 h-5" />

      {count > 0 && (
        <span
          className="
            absolute -top-1 -right-1 w-4 h-4 text-xs rounded-full flex items-center justify-center bg-red-500 text-white
          "
          // style={{
          //   backgroundColor: 'var(--button-bg)',
          //   color: 'var(--text)',
          // }}
        >
          {count}
        </span>
      )}
    </button>
  );
}