"use client";
import { apiFetch } from '../../../lib/api';
import React, { useState, useEffect } from 'react';

export default function SecurityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await apiFetch('/security');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Gagal ambil log:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  // Fungsi buat ngetes nambah log manual
  const handleSimulateLog = async () => {
    try {
      await apiFetch('/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'MANUAL_TEST', 
          actor: 'Developer', // Nanti ini bisa diganti ambil dari user yang lagi login
          details: 'Melakukan simulasi test koneksi keamanan via Dashboard.',
          ipAddress: '10.0.0.42'
        }),
      });
      fetchLogs(); // Refresh tabel setelah nambah
    } catch (e) {
      console.error(e);
    }
  };

  // Helper untuk warna ikon berdasarkan action
  const getActionColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('TERMINATE')) return 'bg-red-500';
    if (action.includes('CREATE') || action.includes('DEPLOY') || action.includes('ADD')) return 'bg-green-500';
    if (action.includes('LOGIN')) return 'bg-blue-500';
    return 'bg-slate-400';
  };

  return (
    <div className="p-8 h-full flex flex-col space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-slate-800">Security & Audit Logs</h1>
          <p className="text-slate-500 mt-1">Pantau seluruh aktivitas pengguna dan sistem secara real-time.</p>
        </div>
        <button 
          onClick={handleSimulateLog}
          className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2"
        >
          <span>??</span> Simulate Test Log
        </button>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex-1">
        {isLoading ? (
          <div className="text-center text-slate-400 py-10 font-bold">Memuat log sistem...</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-slate-400 py-10">
            <span className="text-4xl block mb-3">???</span>
            <p className="font-bold">Belum ada aktivitas tercatat.</p>
            <p className="text-sm mt-1">Klik tombol Simulate Test Log di atas untuk mencoba.</p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {logs.map((log) => (
              <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                
                {/* Ikon Timeline */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${getActionColor(log.action)} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                
                {/* Kartu Log */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-sm">{log.action}</span>
                    <time className="text-[10px] font-bold text-slate-400 uppercase">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </time>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {log.details || 'Tidak ada detail tambahan.'}
                  </p>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                    <span className="text-[10px] font-bold bg-white px-2 py-1 border border-slate-200 rounded text-slate-500 flex items-center gap-1.5">
                      ?? {log.actor}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      IP: {log.ipAddress}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
