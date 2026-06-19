"use client";

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header'; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen relative overflow-x-hidden">
      {/* Sidebar dengan toggle control */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} /> 

      <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
        {/* Header dengan tombol toggle */}
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Konten halaman */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
