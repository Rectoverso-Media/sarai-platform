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
// ... (kode atas tetap sama) ...

  // GANTI FUNGSI LOGOUT MENJADI NAVIGASI
  const goToProfile = () => {
    router.push('/settings');
  };

  return (
    <header className="h-16 border-b bg-white flex items-center px-8 justify-end sticky top-0 z-10 shadow-sm w-full">
      <div className="flex items-center gap-5">
        {/* ... (ikon lonceng notifikasi tetap sama) ... */}
        
        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* User Profile (Sekarang link ke Settings) */}
        <div 
          className="flex items-center gap-3 pl-2 group relative cursor-pointer" 
          onClick={goToProfile} 
          title="Buka Pengaturan Profil"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight">{userFullName}</p>
            <p className="text-[10px] text-blue-600 font-medium">Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-0.5 shadow-md group-hover:shadow-lg transition-all">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center font-bold text-blue-600 text-sm">
              {userInitials}
            </div>
          </div>
          {/* Ubah teks Tooltip */}
          <div className="absolute top-12 right-0 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Pengaturan Profil
          </div>
        </div>
      </div>
    </header>
  );
}