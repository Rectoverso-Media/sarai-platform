"use client";

import React, { useState, useEffect } from 'react';
import Card from '../../../components/ui/Card'; 
import { Button } from '../../../components/ui/button'; 
// import Image from 'next/image';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State baru untuk form dan token
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');

  // Tangkap token dari URL pas halaman pertama kali dibuka
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        setToken(urlToken);
      } else {
        toast.error('Link tidak valid atau token hilang!');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    // 1. Validasi: Pastikan password dan confirm password sama
    if (password !== confirmPassword) {
      toast.error('Password dan Confirm Password tidak cocok!');
      return;
    }

    // 2. Validasi: Pastikan panjang password minimal 8 karakter
    if (password.length < 8) {
      toast.error('Password minimal 8 karakter!');
      return;
    }

    if (!token) {
      toast.error('Sesi tidak valid. Silakan minta link reset lagi.');
      return;
    }

    setIsLoading(true);

    try {
      // 3. Tembak API NestJS
      const response = await fetch('http://localhost:3001/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (response.ok) {
        setIsSubmitted(true); // Ganti UI ke halaman sukses animasi
        toast.success('Password berhasil direset!');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Gagal mereset password');
      }
    } catch (error) {
      toast.error('Terputus dari server backend!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-8 md:p-10 shadow-2xl shadow-blue-600/10 border border-slate-100 rounded-2xl bg-white/95 backdrop-blur-sm">
      
      {!isSubmitted ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="space-y-3 text-center">
            {/* Ikon Perisai/Kunci */}
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner border border-blue-100">
              🛡️
            </div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Create New Password</h2>
            <p className="text-slate-500 text-sm leading-relaxed px-2">
              Your new password must be different from previous used passwords.
            </p>
          </div>

          
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            
            {/* Input New Password */}
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-semibold text-slate-700">New Password</label>
              <input 
                id="new-password" 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Must be at least 8 characters" 
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
              />
            </div>

            {/* Input Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-semibold text-slate-700">Confirm Password</label>
              <input 
                id="confirm-password" 
                type="password" 
                required
                value={confirmPassword}  
                onChange={(e) => setConfirmPassword(e.target.value)}  
                placeholder="Both passwords must match" 
                className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={isLoading} className="w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all">
                {isLoading ? 'Saving...' : 'Save New Password'}
              </Button>
            </div>
          </form>

        </div>

      ) : (

        // TAMPILAN 2: SUCCESS MESSAGE (Password Diubah)

        <div className="space-y-8 text-center animate-in zoom-in-95 duration-500">
          <div className="space-y-4">
            {/* Ikon Checklist Hijau */}
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center overflow-hidden shadow-inner border border-green-100 p-2">
              <img 
                src="/illustrations/GIF-Successfully.gif" 
                alt="Success Animation" 
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Password Reset!</h2>
            <p className="text-slate-500 text-sm leading-relaxed px-4">
              Your password has been successfully changed. You can now log in with your new password.
            </p>
          </div>

          <div className="pt-6">
            <a href="/login" className="block">
              <Button className="w-full py-4 text-base font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-all">
                Continue to Login
              </Button>
            </a>
          </div>
        </div>

      )}

    </Card>
  );
}