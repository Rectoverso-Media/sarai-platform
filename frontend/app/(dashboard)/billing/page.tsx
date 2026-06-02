"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Halaman /billing redirect ke /settings karena billing ada di Settings page
export default function BillingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings');
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-slate-500 text-sm">Mengalihkan ke halaman Settings...</p>
    </div>
  );
}
