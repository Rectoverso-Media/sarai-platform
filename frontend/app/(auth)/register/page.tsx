"use client";

import React, { useState } from 'react';
import Card from '../../../components/ui/Card'; 
import { Button } from '../../../components/ui/button'; 
import Link from 'next/link'; 
import toast from 'react-hot-toast'; 
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Radar pendeteksi token undangan
  const inviteToken = searchParams.get('inviteToken');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    // Validasi beda jalur: Kalau jalur undangan, cuma butuh password
    if (inviteToken) {
      if (!formData.password) return toast.error('Password must be filled!');
    } else {
      if (!formData.name || !formData.email || !formData.password) {
        return toast.error('All fields must be filled!');
      }
    }

    setIsLoading(true);

    try {
      if (inviteToken) {
        // JALUR 1: TERIMA UNDANGAN TIM
        const response = await fetch(`${API_URL}/auth/accept-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            token: inviteToken, 
            password: formData.password 
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('Account activated! Redirecting to login...');
          setTimeout(() => router.push('/login'), 1500);
        } else {
          toast.error(data.message || 'Failed to activate account');
        }

      } else {
        // JALUR 2: DAFTAR REGULER BIASA
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name, 
            email: formData.email,
            password: formData.password,
            role: 'ADMIN' // Default role buat pendaftar baru
          }),
        });

        const data = await response.json();

        if (response.ok || response.status === 201) {
          toast.success('Account created! Please check your email to verify your account.');
          setFormData({ name: '', email: '', password: '' });
          setTimeout(() => router.push('/login'), 2000);
        } else {
          toast.error(data.message || 'Failed to create account');
        }
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
        
        <div className="space-y-2">
          {/* Teks Header Dinamis */}
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
            {inviteToken ? 'Accept Invitation' : 'Create Account'}
          </h2>
          <p className="text-slate-500 text-sm">
            {inviteToken ? (
              'Create a new password to activate your team account.'
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 font-bold hover:underline transition-all">
                  Login here
                </Link>
              </>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          
          {/* Sembunyikan Input Nama & Email kalau ada inviteToken */}
          {!inviteToken && (
            <>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-slate-700">Full Name</label>
                <input 
                  id="name" type="text" value={formData.name} onChange={handleChange} 
                  placeholder="Enter your full name" 
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
                <input 
                  id="email" type="email" value={formData.email} onChange={handleChange}
                  placeholder="name@company.com" 
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                />
              </div>
            </>
          )}

          {/* Password selalu muncul */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
            <input 
              id="password" type="password" value={formData.password} onChange={handleChange}
              placeholder="Create a strong password" 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" disabled={isLoading}
              className="w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-600/20 transition-all"
            >
              {isLoading ? 'Processing...' : (inviteToken ? 'Activate Account' : 'Sign Up')}
            </Button>
          </div>
        </form>

        {/* Sembunyikan tombol Social Login kalau ini jalur undangan */}
        {!inviteToken && (
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Or register with</p>
            <div className="flex items-center justify-center gap-4">
              <a
                href={`${API_URL}/auth/google`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer font-bold text-slate-700 text-sm"
              >
                Google
              </a>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors font-bold text-slate-700 text-sm"
              >
                GitHub
              </button>
            </div>
          </div>
        )}
        
      </div>
    </Card>
  );
}