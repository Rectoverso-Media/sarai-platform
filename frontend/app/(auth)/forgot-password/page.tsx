"use client";

import React, { useState } from 'react';
import Card from '../../../components/ui/Card'; 
import { Button } from '../../../components/ui/button'; 

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSumbit = (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSubmitted(true); 
  };

  return (
    <Card className="w-full p-8 md:p-10 shadow-2xl shadow-blue-600/10 border border-slate-100 rounded-2xl bg-white/95 backdrop-blur-sm">
      
      {!isSubmitted ? (
        // TAMPILAN 1: FORM INPUT EMAIL + ILUSTRASI
        // 
        
        // {/* SISI KIRI: ILUSTRASI (Hanya muncul di layar PC/Tablet) */}
        //   <div className="hidden md:flex md:w-1/2 flex-col items-start space-y-8">
        //     <div className="w-full aspect-square bg-blue-100/30 rounded-[3rem] border border-blue-200/50 flex items-center justify-center overflow-hidden shadow-inner">
        //       <span className="text-blue-400 font-medium text-center px-10">
        //         [ Masukkan Ilustrasi Orang & Kunci di sini ]
        //         <br />
        //         <span className="text-xs opacity-60">(Latar belakang pudar sesuai desain)</span>
        //       </span>
        //     </div>
            
        //     <a href="/login" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-all">
        //       <span className="text-lg">←</span> Back to Login
        //     </a>
        //   </div>

        //   {/* SISI KANAN: FORM (Pake Card Biar Rapi) */}
        //   <div className="w-full md:w-1/2">
        //     <Card className="p-8 md:p-12 shadow-2xl shadow-blue-900/10 border border-slate-100 rounded-[2.5rem] bg-white/95 backdrop-blur-md">
        //       <div className="space-y-8">
                
        //         {/* Judul & Deskripsi */}
        //         <div className="space-y-3">
        //           <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
        //             Forgot <br />
        //             Your Password?
        //           </h2>
        //           <p className="text-slate-500 text-sm leading-relaxed">
        //             Don't worry! Enter your registered email below to receive password reset instructions.
        //           </p>
        //         </div>

        //         {/* Form Input */}
        //         <form onSubmit={handleSumbit} className="space-y-6">
        //           <div className="space-y-2">
        //             <label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
        //             <input 
        //               id="email" 
        //               type="email" 
        //               required
        //               placeholder="Enter your email" 
        //               className="block w-full px-5 py-4 border border-slate-200 rounded-2xl text-sm transition-all bg-slate-50/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder:text-slate-400" 
        //             />
        //           </div>

        //           <Button type="submit" className="w-full py-7 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl shadow-blue-600/20 transition-all">
        //             Reset Password
        //           </Button>
        //         </form>

        //         {/* Back Button (Hanya muncul di Mobile) */}
        //         <div className="md:hidden pt-4 text-center">
        //           <a href="/login" className="text-sm font-bold text-slate-500">
        //             ← Back to Login
        //           </a>
        //         </div>

        //       </div>
        //     </Card>
        //   </div>


        <div className="space-y-6 animate-in fade-in duration-500">
          
          {/* Ilustrasi UI/UX (Ditaruh di atas biar kotaknya tetap rapi) */}
          <div className="w-full h-40 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-center mb-2 overflow-hidden relative">
            <span className="text-blue-300 font-medium text-sm">
              [ Masukkan Gambar Ilustrasi Orang & Kunci di sini ]
            </span>
            {/* Nanti ganti kodingan di atas pakai tag image: <img src="/ilustrasi-forgot.png" className="h-full object-contain" /> */}
          </div>

          {/* Header Form */}
          <div className="space-y-1 text-left">
            <h2 className="text-3xl font-bold text-slate-700 tracking-tight leading-snug">
              Forgot <br />
              Your Password ?
            </h2>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSumbit} className="space-y-5 text-left pt-2">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-600">Email</label>
              <input 
                id="email" 
                type="email" 
                required
                placeholder="Enter email address" 
                className="block w-full px-4 py-3 border border-slate-300 rounded-xl text-sm transition-all bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#597393] outline-none" 
              />
            </div>

            <div className="pt-2">
              {/* Warna tombol disesuaikan dengan warna biru pudar di desain */}
              <Button type="submit" className="w-full py-6 text-base font-bold text-white bg-[#5f748d] hover:bg-[#4a5c72] rounded-xl shadow-lg transition-all">
                Reset Password
              </Button>
            </div>
          </form>

          {/* Back Button (Tengah bawah sesuai desain) */}
          <div className="pt-4 flex justify-center">
            <a href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
              <span>&lt;</span> Back
            </a>
          </div>
        </div>

      ) : (

        // TAMPILAN SUCCESS MESSAGE (Pesan Terkirim)
        <div className="space-y-8 text-center animate-in zoom-in-95 duration-500">
          <div className="space-y-4">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner border border-green-100">
              ✉️
            </div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Check your email</h2>
            <p className="text-slate-500 text-sm leading-relaxed px-4">
              We've sent a password reset link to your email. Please check your inbox and spam folder.
            </p>
          </div>

          <div className="pt-6 space-y-4">
            <a href="/login" className="block">
              <Button className="w-full py-6 text-base font-bold text-white bg-[#5f748d] hover:bg-[#4a5c72] rounded-xl transition-all">
                Return to Login
              </Button>
            </a>
            
            <p className="text-sm text-slate-500">
              Didn't receive the email?{' '}
              <button onClick={() => setIsSubmitted(false)} className="text-blue-600 font-bold hover:underline">
                Click to resend
              </button>
            </p>
          </div>
        </div>
      )}

    </Card>
  );
}