"use client";

import React from 'react';
import { usePathname } from 'next/navigation'; 

export default function Navbar() {
  const pathname = usePathname(); 

  // Fungsi kecil buat ngecek menu mana yang lagi aktif
  const isActive = (path: string) => pathname === path;

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">SARAI</span>
        </div>

        {/* Menu Tengah (Otomatis nebelin teks sesuai URL) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a 
            href="/" 
            className={`transition-colors ${isActive('/') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}
          >
            Home
          </a>
          <a 
            href="/about" 
            className={`transition-colors ${isActive('/about') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}
          >
            About
          </a>
          <a 
            href="/feature" 
            className={`transition-colors ${isActive('/feature') ? 'text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600'}`}
          >
            Feature
          </a>
          <a 
            href="/pricing" 
            className="text-slate-600 hover:text-blue-600 transition-colors"
          >
            Pricing
          </a>
        </nav>

        {/* Tombol Kanan */}
        <div className="flex items-center gap-4">
          <a href="/login" className="px-6 py-2.5 text-sm font-medium text-white bg-[#597393] hover:bg-[#4a627e] rounded-full transition-colors">
            Login
          </a>
          <button className="px-6 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-full transition-colors">
            Try Demo
          </button>
        </div>

      </div>
    </header>
  );
}