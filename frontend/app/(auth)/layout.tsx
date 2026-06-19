import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // BUAT BACKGROUND FULL-SCREEN
    <div className="min-h-screen w-full bg-[url('/bg-auth.png')] bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 md:p-6 font-inter">
      
      {/* KONTROL LEBAR(Biar form gak melar) */}
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        
        {/* Logo atau Nama Web di atas kotak form */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
            SARAI<span className="text-blue-600">.</span>
          </h1>
        </div>

        {/* LUBANG AJAIB(Tempat Login/Register/Forgot) */}
        {children}

      </div>
    </div>
  );
}
