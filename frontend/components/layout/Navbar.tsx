"use client";
import React from 'react';
import { usePathname } from 'next/navigation'; 
import Link from 'next/link'; 

export default function Navbar() {
  const pathname = usePathname(); 

  // Fungsi kecil buat ngecek menu mana yang lagi aktif
  const isActive = (path: string) => pathname === path;

  // Daftar menu biar gampang ngeditnya
  const navMenus = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Feature', path: '/feature' },
    { name: 'Pricing', path: '/pricing' },
  ];

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          {/* Ganti src-nya sama file logo asli */}
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
            <img 
              src="/logo.png" 
              alt="SARAI Logo" 
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <span className="text-2xl font-extrabold text-[#4A627E] tracking-tight group-hover:text-blue-600 transition-colors">
            SARAI
          </span>
        </Link>

        {/* Menu Tengah (Otomatis nebelin teks sesuai URL) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navMenus.map((menu) => (
            <Link 
              key={menu.name}
              href={menu.path} 
              className={`transition-all duration-300 ${
                isActive(menu.path) 
                  ? 'text-[#4A627E] font-bold drop-shadow-sm' 
                  : 'text-slate-500 hover:text-[#4A627E] hover:-translate-y-0.5'
              }`}
            >
              {menu.name}
            </Link>
          ))}
        </nav>

        {/* Tombol Kanan (Sembunyi di HP, Muncul di PC) */}
        <div className="hidden md:flex items-center gap-4">
          <Link 
            href="/login" 
            className="px-6 py-2.5 text-sm font-bold text-white bg-[#4A627E] hover:bg-[#384b61] rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            Login
          </Link>
          <button className="px-6 py-2.5 text-sm font-bold text-[#4A627E] border-2 border-[#4A627E]/20 hover:border-[#4A627E] hover:bg-slate-50 rounded-full transition-all duration-300">
            Try Demo
          </button>
        </div>

        {/* Tombol Hamburger buat tampilan HP */}
        <button className="md:hidden p-2 text-slate-500 hover:text-[#4A627E] transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

      </div>
    </header>
  );
}