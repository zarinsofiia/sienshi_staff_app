'use client';

import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

interface Tab {
  label: string;
  path: string;
}

interface TabsHeaderProps {
  tabs: Tab[];
}

export default function TabsHeader({ tabs }: TabsHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="border-b border-gray-200 mb-4 flex space-x-8">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            className={`pb-2 text-base font-semibold transition-colors relative
              ${isActive ? 'text-black' : 'text-red-500 hover:text-black'}`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-red-500"></span>
            )}
          </button>
        );
      })}
    </div>
  );
}
