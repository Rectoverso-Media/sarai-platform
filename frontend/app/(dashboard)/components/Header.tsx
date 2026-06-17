"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '../../../lib/auth';

export default function Header() {
  const router = useRouter();

  const [userFullName, setUserFullName] = useState<string>('');
  const [userInitials, setUserInitials] = useState<string>('??');
  const [notifCount] = useState<number>(0);

  const loadUserFromToken = () => {
    // Decode JWT — BUKAN localStorage('userData')
    const user = getCurrentUser();
    if (!user) return;

    setUserFullName(user.name);

    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      setUserInitials((nameParts[0][0] + nameParts[1][0]).toUpperCase());
    } else {
      setUserInitials(nameParts[0].substring(0, 2).toUpperCase());
    }
  };

  useEffect(() => {
    loadUserFromToken();

    // Listen for profile-updated event dari SettingsProfile
    // agar nama di header ikut berubah tanpa page reload
    const handleProfileUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ name: string }>).detail;
      if (detail?.name) {
        setUserFullName(detail.name);
        const nameParts = detail.name.split(' ');
        if (nameParts.length >= 2) {
          setUserInitials((nameParts[0][0] + nameParts[1][0]).toUpperCase());
        } else {
          setUserInitials(nameParts[0].substring(0, 2).toUpperCase());
        }
      }
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, []);

  const goToProfile = () => {
    router.push('/settings');
  };

  return (
    <header className="h-16 border-b bg-white flex items-center px-8 justify-end sticky top-0 z-10 shadow-sm w-full">
      <div className="flex items-center gap-5">

        {/* Notification Bell */}
        <Link
          href="/settings"
          id="notification-bell"
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          aria-label="Notifications"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {notifCount}
            </span>
          )}
        </Link>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* User Profile */}
        <div
          className="flex items-center gap-3 pl-2 group relative cursor-pointer"
          onClick={goToProfile}
          title="Open Profile Settings"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {userFullName || 'User'}
            </p>
            <p className="text-[10px] text-blue-600 font-medium">Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-0.5 shadow-md group-hover:shadow-lg transition-all">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center font-bold text-blue-600 text-sm">
              {userInitials}
            </div>
          </div>
          <div className="absolute top-12 right-0 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Profile Settings
          </div>
        </div>
      </div>
    </header>
  );
}