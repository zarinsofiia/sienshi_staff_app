// components/card/PaymentList.tsx
'use client';
import React from 'react';

interface Payment {
  id: string;
  name: string;
  amount: number;
  expDate: string;
}

interface PaymentListProps {
  items: Payment[];
  onShowAll?: () => void;
}

export function PaymentList({ items, onShowAll }: PaymentListProps) {
  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h3 className="font-semibold mb-3">Overdue Payment</h3>
      {items.map((p) => (
        <div key={p.id} className="border-b py-2 flex justify-between items-start">
          <div>
            <p className="text-sm font-medium">{p.name}</p>
            <p className="text-lg text-red-600 font-bold">RM {p.amount.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Exp Date: {p.expDate}</p>
          </div>
          <button className="text-xs text-blue-500">See more</button>
        </div>
      ))}
      {onShowAll && (
        <button onClick={onShowAll} className="mt-2 text-sm text-red-600 font-semibold">
          Show All
        </button>
      )}
    </div>
  );
}
