"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '../../lib/auth';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [userInitials, setUserInitials] = useState<string>('??');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserName(user.name || 'User');

      const nameParts = (user.name || 'U').split(' ');
      if (nameParts.length >= 2) {
        setUserInitials((nameParts[0][0] + nameParts[1][0]).toUpperCase());
      } else {
        setUserInitials(nameParts[0].substring(0, 2).toUpperCase());
      }
    }
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('userData');
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 lg:px-6 justify-between sticky top-0 z-20">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Page Title (Optional) */}
        <div className="hidden sm:block">
          <h2 className="text-lg font-semibold text-[#1E293B]">Dashboard</h2>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Quick Actions */}
        <button className="hidden sm:flex p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 rounded-lg transition-colors relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Notification Dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full" />
        </button>

        {/* Help */}
        <button className="hidden sm:flex p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2" />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-sm shadow-md">
              {userInitials}
            </div>

            {/* User Info - Desktop */}
            <div className="hidden lg:block text-left">
              <p className="text-sm font-semibold text-[#1E293B] leading-tight">
                {userName || 'User'}
              </p>
              <p className="text-xs text-[#64748B]">Pro Trial</p>
            </div>

            {/* Chevron */}
            <svg className="hidden lg:block w-4 h-4 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 z-50">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="font-semibold text-[#1E293B]">{userName || 'User'}</p>
                  <p className="text-sm text-[#64748B]">Akun Premium Trial</p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <Link
                    href="/settings"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Pengaturan Akun
                  </Link>

                  <Link
                    href="/billing"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Billing & Langganan
                  </Link>

                  <Link
                    href="/platform"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Kelola Platform
                  </Link>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 my-2" />

                {/* Help */}
                <div className="py-2">
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 py-2.5 text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pusat Bantuan
                  </a>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 my-2" />

                {/* Logout */}
                <div className="py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-[#EF4444] hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Keluar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
