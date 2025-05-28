'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <p className="text-foreground">載入花札道場中...</p>
      {/* You can add a loading spinner here */}
    </div>
  );
}
