import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/app-header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-8 bg-background text-foreground">
        {children}
      </main>
    </div>
  );
}
