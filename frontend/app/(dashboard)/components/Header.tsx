"use client"; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  // State untuk Profil User
  const [userFullName, setUserFullName] = useState<string>('Loading...');
  const [userInitials, setUserInitials] = useState<string>('??');

  useEffect(() => {
    const savedData = localStorage.getItem('userData');
    if (savedData) {
      const user = JSON.parse(savedData);
      setUserFullName(user.name);
      
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        setUserInitials((nameParts[0][0] + nameParts[1][0]).toUpperCase());
      } else {
        setUserInitials(nameParts[0].substring(0, 2).toUpperCase());
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userData'); 
    
    // Hapus Cookie dengan cara bikin dia expired
    document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"; 
    
    // Tendang ke Login
    router.push('/login');
  };

  return (
    <header className="h-16 border-b bg-white flex items-center px-8 justify-between sticky top-0 z-10 shadow-sm">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
            🔍
          </span>
          <input 
            type="text" 
            placeholder="Search infrastructure, logs, or nodes..." 
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-5">
        <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all">
          <span className="text-xl">🔔</span>
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* User Profile (Clickable for Logout) */}
        <div className="flex items-center gap-3 pl-2 group relative cursor-pointer" onClick={handleLogout} title="Click to Logout">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight">{userFullName}</p>
            <p className="text-[10px] text-blue-600 font-medium">Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-0.5 shadow-md group-hover:shadow-lg transition-all">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center font-bold text-blue-600 text-sm">
              {userInitials}
            </div>
          </div>
          <div className="absolute top-12 right-0 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Logout
          </div>
        </div>
      </div>
    </header>
  );
}