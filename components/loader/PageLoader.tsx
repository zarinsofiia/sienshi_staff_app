'use client';

import React from 'react';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/70 z-50">
      <div className="flex flex-col items-center">
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"></div>
        {/* Optional text */}
        <p className="mt-4 text-gray-700 text-lg sm:text-xl font-medium">
          Loading content...
        </p>
      </div>
    </div>
  );
}