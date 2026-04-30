"use client";
import React, { useState, useEffect } from 'react';
import Card from '../../../components/ui/Card'; 
import { Button } from '../../../components/ui/button'; 
import Link from 'next/link'; 
import toast from 'react-hot-toast'; 
import { useRouter } from 'next/navigation'; 

export default function LoginPage() {

  // Fungsi penangkap token & status verifikasi dari URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      
      // 1. Penangkap Google OAuth (Udah ada dari sebelumnya)
      const token = urlParams.get('token');
      const userDataStr = urlParams.get('userData');

      if (token && userDataStr) {
        localStorage.setItem('access_token', token);
        localStorage.setItem('userData', userDataStr);
        document.cookie = "isLoggedIn=true; path=/";
        window.history.replaceState({}, document.title, "/login");
        window.location.href = '/dashboard';
      }

      // 2. Penangkap Verifikasi Email (BARU DITAMBAHKAN)
      if (urlParams.get('verified') === 'true') {
        // Tampilkan notifikasi hijau
        toast.success('Email berhasil diverifikasi! Silakan Login.');
        // Bersihkan URL biar toast nggak muncul terus-terusan kalau di-refresh
        window.history.replaceState({}, document.title, "/login");
      }
    }
  }, []);
  const router = useRouter();

  // Wadah buat nyimpen ketikan email & password
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // State buat animasi loading
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi nangkep ketikan
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  // Fungsi pas tombol "Sign In" diklik
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Email or password must be filled!');
      return;
    }

    setIsLoading(true);

    try {
      // Nembak ke API /auth/login yang bener
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Login successful!');
        // Simpan Token KTP Digital
        localStorage.setItem('access_token', data.access_token);
        // Simpan data user (backend ngasih nama variabelnya "user", bukan "data")
        localStorage.setItem('userData', JSON.stringify(data.user));
        // Cookie (KTP buat Satpam Server)
        document.cookie = "isLoggedIn=true; path=/";
        // Pindah ke halaman dashboard
        // router.push('/dashboard'); 
        window.location.href = '/dashboard';
      } else {
        // Kalau email nggak ada atau password salah (Error 401/400 dari backend)
        toast.error(data.message || 'Email or password is wrong!');
      }
    } catch (error) {
      toast.error('Unable to connect to server!');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full p-8 md:p-10 shadow-2xl shadow-blue-600/10 border border-slate-100 rounded-2xl bg-white/95 backdrop-blur-sm">
      <div className="space-y-8 text-center">
        
        {/* Header Form */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 font-bold hover:underline transition-all">
              Sign up here
            </Link>
          </p>
        </div>

        {/* onSubmit di form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
            <input 
              id="email" 
              type="email" 
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com" 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
              <Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:underline transition-all">
                Forgot password?
              </Link>
            </div>
            <input 
              id="password" 
              type="password" 
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password" 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
            />
          </div>

          {/* Main Action Button */}
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-600/20 transition-all"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </div>
        </form>

        {/* Social Sign-On */}
        <div className="space-y-6 pt-6 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Or continue with</p>
          <div className="flex items-center justify-center gap-4">
            <button type="button" className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
              <a href="http://localhost:3001/auth/google" className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                <span className="font-bold text-slate-700 text-sm">Google</span>
              </a>
            </button>
            <button type="button" className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="font-bold text-slate-700 text-sm">GitHub</span>
            </button>
          </div>
        </div>
        
      </div>
    </Card>
  );
}