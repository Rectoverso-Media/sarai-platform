"use client";

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-md space-y-6">
        <div className="w-24 h-24 bg-blue-600/10 border border-blue-500/30 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-2xl shadow-blue-500/10 animate-bounce">
          🔍
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl font-black text-white tracking-tight">404</h1>
          <h2 className="text-lg font-bold text-slate-200">Halaman Tidak Ditemukan</h2>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed mx-auto">
            Maaf, kami tidak dapat menemukan halaman yang Anda cari. Halaman mungkin telah dipindahkan atau dihapus.
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20"
          >
            🏠 Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
