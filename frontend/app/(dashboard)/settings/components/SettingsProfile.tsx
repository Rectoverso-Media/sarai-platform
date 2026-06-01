"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsProfile() {
  const router = useRouter();
  
  // State form profil
  const [profileForm, setProfileForm] = useState({
    name: 'Loading...',
    password: '',
    confirmPassword: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Ambil data nama dari localStorage saat pertama kali load
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (savedData.name) {
      setProfileForm(prev => ({ ...prev, name: savedData.name }));
    }
  }, []);

  // FUNGSI LOGOUT (Aman & Langsung Tendang ke Halaman Login)
  const handleLogout = () => {
    localStorage.removeItem('userData'); 
    document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"; 
    router.push('/login');
  };

  // FUNGSI SIMPAN PERUBAHAN KE BACKEND
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi kalau user mau ganti password
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      alert("Password dan Konfirmasi Password tidak cocok!");
      return;
    }

    setIsUpdating(true);
    try {
      const savedData = JSON.parse(localStorage.getItem('userData') || '{}');
      const currentUserId = savedData.id;

      if (!currentUserId) {
        alert("Sesi tidak valid, silakan login ulang.");
        return;
      }

      // Pastikan port NestJS kamu (misal 3001)
      const res = await fetch('http://localhost:3001/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          name: profileForm.name,
          // Kirim password HANYA jika field-nya diisi
          ...(profileForm.password && { password: profileForm.password }) 
        })
      });

      if (!res.ok) throw new Error('Gagal update profil');
      
      const updatedUser = await res.json();
      alert("Profil berhasil diperbarui!");
      
      // Update local storage biar nama di pojok kanan atas Header ikutan ganti
      localStorage.setItem('userData', JSON.stringify({ ...savedData, name: updatedUser.name }));
      
      // Kosongkan form password setelah berhasil
      setProfileForm({ ...profileForm, password: '', confirmPassword: '' });
      
      // Refresh UI
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Profil Pengguna</h2>
      
      <form onSubmit={handleUpdateProfile} className="space-y-6">
        
        {/* AVATAR SECTION */}
        <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-1 shadow-lg">
            <div className="w-full h-full bg-white rounded-xl flex items-center justify-center font-bold text-blue-600 text-2xl">
              {profileForm.name !== 'Loading...' ? profileForm.name.substring(0, 2).toUpperCase() : '??'}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Foto Profil</h3>
            <p className="text-xs text-slate-500 mb-3">Format JPG atau PNG, maksimal 2MB.</p>
            <div className="flex gap-2">
              <button type="button" className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                Ubah Foto
              </button>
            </div>
          </div>
        </div>

        {/* DATA DIRI SECTION */}
        <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-100">
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-2">
            <label className="font-semibold text-slate-700 text-sm">Nama Lengkap</label>
            <input 
              type="text" 
              value={profileForm.name}
              onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
              className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-2">
            <label className="font-semibold text-slate-700 text-sm">Alamat Email</label>
            <input 
              type="email" 
              defaultValue="arif@rectoverso.com" 
              disabled
              className="border border-slate-200 bg-slate-50 rounded-lg px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-400">Email tidak dapat diubah karena terikat pada tim.</p>
          </div>
        </div>

        {/* UBAH PASSWORD SECTION */}
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <h3 className="font-bold text-slate-700 text-sm mb-1">Keamanan Akun</h3>
            <p className="text-xs text-slate-500 mb-4">Kosongkan jika tidak ingin mengubah password.</p>
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-2">
            <label className="font-semibold text-slate-700 text-sm">Password Baru</label>
            <input 
              type="password"
              placeholder="Min. 8 karakter"
              value={profileForm.password}
              onChange={(e) => setProfileForm({...profileForm, password: e.target.value})}
              className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-2">
            <label className="font-semibold text-slate-700 text-sm">Konfirmasi Password Baru</label>
            <input 
              type="password"
              placeholder="Ketik ulang password baru"
              value={profileForm.confirmPassword}
              onChange={(e) => setProfileForm({...profileForm, confirmPassword: e.target.value})}
              className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* ACTION BUTTONS (LOGOUT & SAVE) */}
        <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-100">
          <button 
            type="button"
            onClick={handleLogout}
            className="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-sm"
          >
            Logout Akun
          </button>
          
          <button 
            type="submit"
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-sm disabled:opacity-50"
          >
            {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>

      </form>
    </div>
  );
}