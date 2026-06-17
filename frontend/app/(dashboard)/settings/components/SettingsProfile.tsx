"use client";
import { apiFetch } from '../../../../lib/api';
import { getCurrentUser, logout } from '../../../../lib/auth';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function SettingsProfile() {
  const router = useRouter();

  // ─── Ambil user dari JWT — BUKAN localStorage('userData') ──────────────────
  const [currentUser, setCurrentUser] = useState<{ sub: string; name: string; email: string; role: string } | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast_, setToast_] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Decode JWT saat mount — tidak bergantung pada localStorage userData
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      // Token tidak ada atau expired → tendang ke login
      router.replace('/login');
      return;
    }
    setCurrentUser(user);
    setNameInput(user.name);
  }, [router]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast_) {
      const t = setTimeout(() => setToast_(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast_]);

  // ─── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    logout(); // Hapus access_token + cleanup
    router.push('/login');
  }, [router]);

  // ─── Update profil ───────────────────────────────────────────────────────────
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameInput.trim()) {
      setToast_({ type: 'error', msg: 'Nama tidak boleh kosong.' });
      return;
    }

    if (password && password.length < 8) {
      setToast_({ type: 'error', msg: 'Password minimal 8 karakter.' });
      return;
    }

    if (password && password !== confirmPassword) {
      setToast_({ type: 'error', msg: 'Password dan konfirmasi tidak cocok.' });
      return;
    }

    setIsUpdating(true);
    try {
      // userId di-extract dari JWT di BACKEND via req.user.sub
      // Frontend TIDAK perlu kirim userId di body — ini yang menyebabkan bug lama
      const body: Record<string, string> = { name: nameInput.trim() };
      if (password) body.password = password;

      const res = await apiFetch('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Gagal update profil');
      }

      const updatedUser = await res.json();

      setToast_({ type: 'success', msg: 'Profil berhasil diperbarui!' });

      // Update local state — TIDAK perlu localStorage.setItem('userData')
      // Header akan mendapat data fresh saat next token refresh atau re-mount
      setCurrentUser(prev => prev ? { ...prev, name: updatedUser.name } : null);
      setPassword('');
      setConfirmPassword('');

      // Dispatch custom event agar Header bisa update nama tanpa reload
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: { name: updatedUser.name } }));

    } catch (error: any) {
      console.error(error);
      setToast_({ type: 'error', msg: error.message || 'Terjadi kesalahan saat menyimpan.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const avatarInitials = currentUser.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '??';

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Profil Pengguna</h2>

      {/* Toast Notification */}
      {toast_ && (
        <div
          className={`mb-5 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold animate-fade-in ${
            toast_.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          <span>{toast_.type === 'success' ? '✅' : '⚠️'}</span>
          {toast_.msg}
        </div>
      )}

      <form onSubmit={handleUpdateProfile} className="space-y-6">

        {/* AVATAR SECTION */}
        <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-1 shadow-lg flex-shrink-0">
            <div className="w-full h-full bg-white rounded-xl flex items-center justify-center font-bold text-blue-600 text-2xl">
              {avatarInitials}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{currentUser.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
            <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold border border-blue-200">
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* DATA DIRI SECTION */}
        <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-100">
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-2">
            <label className="font-semibold text-slate-700 text-sm" htmlFor="profile-name">
              Nama Lengkap
            </label>
            <input
              id="profile-name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-2">
            <label className="font-semibold text-slate-700 text-sm">
              Alamat Email
            </label>
            {/* 
              Email dari JWT — read-only, BUKAN hardcoded.
              Email tidak bisa diubah karena terikat akun tim.
            */}
            <input
              type="email"
              value={currentUser.email}
              disabled
              readOnly
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
            <label className="font-semibold text-slate-700 text-sm" htmlFor="profile-password">
              Password Baru
            </label>
            <input
              id="profile-password"
              type="password"
              placeholder="Min. 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-2">
            <label className="font-semibold text-slate-700 text-sm" htmlFor="profile-confirm-password">
              Konfirmasi Password Baru
            </label>
            <input
              id="profile-confirm-password"
              type="password"
              placeholder="Ketik ulang password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className={`border rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-1 transition-colors ${
                confirmPassword && password !== confirmPassword
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[11px] text-red-500 font-medium">Password tidak cocok</p>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUpdating && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>

      </form>
    </div>
  );
}