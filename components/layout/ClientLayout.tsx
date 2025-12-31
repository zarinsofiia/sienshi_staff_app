// app/components/layout/ClientLayout.tsx
'use client';

import { usePathname } from 'next/navigation';
import MainLayout from './MainLayout';
import { Toaster } from 'sonner';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const useMainLayout = pathname?.startsWith('/module');

  return (
    <>
      {useMainLayout ? <MainLayout>{children}</MainLayout> : children}
      <Toaster position="top-right" richColors />
    </>
  );
}