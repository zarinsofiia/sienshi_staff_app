// components/card/CustomerList.tsx
'use client';
import React from 'react';

interface Customer {
  name: string;
  phone: string;
  package: string;
  date: string;
}

interface CustomerListProps {
  customers: Customer[];
}

export function CustomerList({ customers }: CustomerListProps) {
  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h3 className="font-semibold mb-3">New Customer</h3>
      {customers.map((c, i) => (
        <div key={i} className="border-b py-2">
          <p className="font-medium">{c.name}</p>
          <p className="text-xs text-gray-500">{c.phone}</p>
          <p className="text-sm">{c.package}</p>
          <p className="text-xs text-red-600">{c.date}</p>
        </div>
      ))}
    </div>
  );
}
