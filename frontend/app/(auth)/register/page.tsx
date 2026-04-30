"use client";

import React, { useState } from 'react';
import Card from '../../../components/ui/Card'; 
import { Button } from '../../../components/ui/button'; 
import Link from 'next/link'; // Pakai Link biar SPA
import toast from 'react-hot-toast'; // Buat notifikasi keren

export default function RegisterPage() {
  // "wadah" buat nyimpen ketikan user
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // state buat animasi loading
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi buat nangkep setiap ketikan di input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  // Fungsi yang jalan pas tombol "Sign Up" diklik
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Biar halaman nggak ngerefresh
    
    // Validasi kecil-kecilan
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('All coloumn must be filled!');
      return;
    }

    setIsLoading(true);

    try {
      // Nembak ke API keamanan yang baru
      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name, 
          email: formData.email,
          password: formData.password,
          role: 'ADMIN'
        }),
});

      const data = await response.json();

      if (response.ok || response.status === 201) {
        toast.success('Account has been created! Go to login page');
        // Kosongin form lagi kalau sukses
        setFormData({ name: '', email: '', password: '' });
      } else {
        // Kalau email udah dipakai atau ada error dari backend
        toast.error(data.message || 'Failed to create');
      }
    } catch (error) {
      toast.error('Disconnected from backend server!');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full p-8 md:p-10 shadow-2xl shadow-blue-600/10 border border-slate-100 rounded-2xl bg-white/95 backdrop-blur-sm">
      <div className="space-y-8 text-center">
        
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Create Account</h2>
          <p className="text-slate-500 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-bold hover:underline transition-all">
              Login here
            </Link>
          </p>
        </div>

        {/* Tambahin onSubmit di form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-semibold text-slate-700">Full Name</label>
            <input 
              id="name" 
              type="text" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Enter your full name" 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
            />
          </div>

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

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
            <input 
              id="password" 
              type="password" 
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password" 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
            />
          </div>

          <div className="pt-4">
            {/* Tombol dikasih disable dan animasi loading */}
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-600/20 transition-all"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </div>
        </form>

        <div className="space-y-6 pt-6 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Or register with</p>
          <div className="flex items-center justify-center gap-4">
            <button type="button" className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="font-bold text-slate-700 text-sm">Google</span>
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