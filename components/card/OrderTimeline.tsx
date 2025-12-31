'use client';

import { useEffect, useState } from 'react';
import { fetchOrderStatus, OrderStatus, statusConfig } from '@/app/config/OrderStatus';

export default function OrderTimeline() {
  const [orders, setOrders] = useState<OrderStatus[]>([]);

  useEffect(() => {
    fetchOrderStatus().then(setOrders);
  }, []);

  return (
    <div className="p-6 bg-[var(--card-bg)] text-[var(--card-text)] rounded-xl shadow-md w-full border border-[var(--border-color)] max-w-md">
      <div className="flex flex-col relative">
        {orders.map((order, index) => {
          const status = statusConfig[order.status] || { label: order.status, colorClass: '' };

          return (
            <div key={order.id} className="flex items-start relative z-10 mb-6">
              {/* Circle + line container */}
              <div className="flex flex-col items-center mr-4 relative">
                {/* Circle */}
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full border border-[var(--border-color)]
                  ${status.colorClass || 'bg-white text-black'}`}
                >
                  {order.status === 'Completed' ? '✓' : index + 1}
                </div>

              </div>

              {/* Timeline content */}
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text)]">{order.title}</h3>
                <span
                  className={`inline-block px-2 py-1 mt-1 rounded-full text-sm ${status.colorClass}`}
                >
                  {status.label}
                </span>
                {order.date && (
                  <p className="text-xs text-[var(--form-text-caption)] mt-1">{order.date}</p>
                )}
                {order.estimated && (
                  <p className="text-xs text-[var(--form-text-caption)] mt-1">
                    Estimated: {order.estimated}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
