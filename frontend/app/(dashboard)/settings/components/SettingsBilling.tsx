"use client";
import React from 'react';

export default function SettingsBilling() {
  // Data statis sementara sebelum disambung ke backend/Stripe
  const currentPlan = {
    name: 'Pro Tier',
    price: 'Rp 499.000',
    cycle: 'bulan',
    status: 'Active',
    renewalDate: '15 Juni 2026'
  };

  const usage = {
    queries: { used: 8500, limit: 10000, label: 'Eksekusi Query' },
    aiTokens: { used: 45000, limit: 100000, label: 'Token AI Assistant' },
    storage: { used: 12, limit: 50, label: 'Penyimpanan (GB)' },
  };

  const calculatePercentage = (used: number, limit: number) => {
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Billing & Quota</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola paket langganan dan pantau penggunaan sumber daya.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* CURRENT PLAN CARD */}
        <div className="md:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">💳</div>
          <div className="relative z-10">
            <p className="text-slate-400 text-sm font-semibold mb-1">Paket Saat Ini</p>
            <h3 className="text-2xl font-black text-white mb-4">{currentPlan.name}</h3>
            <div className="mb-6">
              <span className="text-3xl font-bold">{currentPlan.price}</span>
              <span className="text-slate-400 text-sm"> / {currentPlan.cycle}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> {currentPlan.status}
              </span>
              <span className="text-slate-400">Perpanjang: {currentPlan.renewalDate}</span>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div>
              <h4 className="font-bold text-slate-800">Ubah Paket Berlangganan</h4>
              <p className="text-sm text-slate-500 mt-1">Upgrade untuk mendapatkan limit query dan token AI yang lebih besar.</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-sm whitespace-nowrap">
              Upgrade Paket
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div>
              <h4 className="font-bold text-slate-800">Metode Pembayaran</h4>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">•••• 4242</span>
                Masa berlaku 12/28
              </p>
            </div>
            <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-6 rounded-lg transition-colors text-sm shadow-sm whitespace-nowrap">
              Update Kartu
            </button>
          </div>
        </div>
      </div>

      {/* USAGE METRICS (Deliverable 2) */}
      <h3 className="text-lg font-bold text-slate-800 mb-4">Penggunaan Bulan Ini</h3>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        
        {Object.entries(usage).map(([key, data]) => {
          const percent = calculatePercentage(data.used, data.limit);
          const isWarning = percent > 80;
          
          return (
            <div key={key}>
              <div className="flex justify-between items-end mb-2">
                <span className="font-semibold text-slate-700 text-sm">{data.label}</span>
                <span className="text-sm font-mono text-slate-500">
                  <span className={isWarning ? 'text-red-600 font-bold' : 'text-slate-800 font-bold'}>
                    {data.used.toLocaleString('id-ID')}
                  </span> 
                  {' '} / {data.limit.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${isWarning ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
        
      </div>
    </div>
  );
}