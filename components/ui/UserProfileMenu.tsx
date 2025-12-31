'use client';

import { User } from 'lucide-react';

interface UserProfileMenuProps {
  name: string;
  status?: string;
}

export default function UserProfileMenu({ name, status = "Online" }: UserProfileMenuProps) {
  return (
    <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors">
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <User className="w-4 h-4 text-white" />
      </div>
      <div className="hidden sm:block">
        <p className="text-sm font-medium text-gray-700">{name}</p>
        <p className="text-xs text-gray-500">{status}</p>
      </div>
    </div>
  );
}
