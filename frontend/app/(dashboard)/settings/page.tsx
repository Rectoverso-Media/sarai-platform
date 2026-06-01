"use client";
import React, { useState } from 'react';
import SettingsProfile from './components/SettingsProfile';
import SettingsAudit from './components/SettingsAudit';
import SettingsNotifications from './components/SettingsNotifications';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile'); // Default ke profile aja biar bagus

  // Nanti ambil dari Context/Global State
  const currentUser = {
    name: "Arif",
    role: "ADMIN" 
  };

  const tabs = [
    { id: 'profile', label: 'Profil User', icon: '👤' },
    { id: 'team', label: 'Manajemen Tim', icon: '👥' },
    { id: 'billing', label: 'Billing & Quota', icon: '💳' },
    { id: 'notifications', label: 'Notifikasi & Alert', icon: '🔔' },
    ...(currentUser.role === 'ADMIN' || currentUser.role === 'OWNER' 
      ? [{ id: 'audit', label: 'Audit Log', icon: '🛡️' }] 
      : []
    ),
  ];

  // Fungsi untuk me-render komponen berdasarkan tab yang aktif
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <SettingsProfile />;
      case 'audit':
        return <SettingsAudit />;
      case 'notifications':
        return <SettingsNotifications />;
      default:
        // Placeholder untuk tab yang belum dibuat (Tim, Billing)
        return (
          <div className="flex h-full items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="text-center">
              <span className="text-4xl">🚧</span>
              <h3 className="mt-4 text-lg font-semibold text-slate-700">Modul Sedang Dibangun</h3>
              <p className="text-sm text-slate-500 mt-1">Konfigurasi untuk {tabs.find(t => t.id === activeTab)?.label} akan segera tersedia.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-8 min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-poppins font-black text-slate-800 tracking-tight">System Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Atur preferensi akun, integrasi alert, dan konfigurasi platform SARAI.
        </p>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-1 gap-8">
        
        {/* Sidebar Nav */}
        <div className="w-64 flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-transparent text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          {renderContent()}
        </div>
        
      </div>
    </div>
  );
}