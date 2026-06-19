"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Daftar Menu Sidebar sesuai dengan fitur yang tersedia
const menuItems = [
  { name: 'Dashboard', icon: '📊', path: '/dashboard' },
  { name: 'Data Sources', icon: '📂', path: '/data-sources' },
  { name: 'Queries', icon: '🪄', path: '/queries' },
  { name: 'Custom Dashboard', icon: '🖥️', path: '/custom-dashboard' },
  { name: 'Data Explorer', icon: '🔍', path: '/data-explorer' },
  { name: 'AI Chat', icon: '✨', path: '/ai-chat' },
  { name: 'AI Insights', icon: '🧠', path: '/ai-insights' },
  { name: 'Integrations', icon: '🔗', path: '/integrations' },
  { name: 'Infrastructure', icon: '🏗️', path: '/infrastructure' },
  { name: 'Team Management', icon: '👥', path: '/team' },
  { name: 'Security & Logs', icon: '🛡️', path: '/security' },
  { name: 'Billing', icon: '💳', path: '/billing' },
  { name: 'Settings', icon: '⚙️', path: '/settings' },
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean; setIsOpen?: (v: boolean) => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen?.(false)}
        />
      )}

      <aside className={`
        w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800
        fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transition-transform duration-300 shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Area */}
        <div className="p-6 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SARAI</span>
          </div>
          {/* Close button on mobile */}
          <button 
            onClick={() => setIsOpen?.(false)}
            className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            aria-label="Close Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen?.(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'hover:bg-slate-800 hover:text-white'}
                `}
              >
                <span className={`text-lg ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                  {item.icon}
                </span>
                {item.name}
                
                {/* Indikator dot kalau aktif */}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-blue-200 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>


        {/* Footer Sidebar */}
        <div className="p-6 border-t border-slate-800">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Plan</p>
            <p className="text-xs font-semibold text-white mt-1">Enterprise Dev</p>
            <div className="w-full bg-slate-700 h-1 rounded-full mt-2">
              <div className="bg-blue-500 w-3/4 h-full rounded-full"></div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
