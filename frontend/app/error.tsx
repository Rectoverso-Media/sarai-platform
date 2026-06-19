"use client";

import React, { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Catat log error ke external monitoring if needed
    console.error("ErrorBoundary caught an error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 space-y-6">
        <div className="w-16 h-16 bg-red-150 text-red-600 rounded-2xl flex items-center justify-center text-3xl mx-auto">
          ⚠️
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-800">Sistem Mengalami Kendala</h1>
          <p className="text-xs text-slate-400">Terjadi kesalahan tak terduga pada halaman ini.</p>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left overflow-x-auto max-h-40">
            <code className="text-[10px] text-red-600 font-mono break-all whitespace-pre-wrap">
              {error?.message || 'Unknown runtime error'}
            </code>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            🔄 Refresh Browser
          </button>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md"
          >
            ⚡ Coba Lagi (Reset)
          </button>
        </div>
      </div>
    </div>
  );
}
