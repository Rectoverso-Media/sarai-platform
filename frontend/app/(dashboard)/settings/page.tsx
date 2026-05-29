"use client";
import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
const [activeTab, setActiveTab] = useState('notifications');

  // State untuk Notifikasi (yang sudah kita buat kemarin)
  const [alerts, setAlerts] = useState({ inApp: true, email: true, slack: false, webhook: false });
  const [threshold, setThreshold] = useState({ errorRate: 5, queryDuration: 3000 });

  // --- TAMBAHAN BARU UNTUK AUDIT LOG ---
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Fungsi untuk ambil data dari Backend NestJS
  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      // Sesuaikan URL ini dengan port backend NestJS kamu (biasanya 3000)
      const res = await fetch('http://localhost:3001/audit/logs');
      if (!res.ok) throw new Error('Gagal mengambil data log');
      const data = await res.json();
      setAuditLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Otomatis fetch data HANYA ketika tab 'audit' aktif
  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  // Fungsi helper buat ngasih warna badge sesuai tipe aksi (Method)
  const getMethodBadge = (actionStr: string) => {
    const method = actionStr.split(' ')[0]; // Ambil kata pertama (POST/GET/dll)
    switch (method) {
      case 'POST': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold mr-2">POST</span>;
      case 'DELETE': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold mr-2">DELETE</span>;
      case 'PATCH': 
      case 'PUT': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold mr-2">{method}</span>;
      default: return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold mr-2">{method}</span>;
    }
  };


  const currentUser = {
    name: "Arif",
    role: "ADMIN" 
  };

  const tabs = [
    { id: 'profile', label: 'Profil User', icon: '👤' },
    { id: 'team', label: 'Manajemen Tim', icon: '👥' },
    { id: 'billing', label: 'Billing & Quota', icon: '💳' },
    { id: 'notifications', label: 'Notifikasi & Alert', icon: '🔔' },
    
    // TAB AUDIT HANYA MUNCUL JIKA ROLE ADALAH ADMIN ATAU OWNER
    ...(currentUser.role === 'ADMIN' || currentUser.role === 'OWNER' 
      ? [{ id: 'audit', label: 'Audit Log', icon: '🛡️' }] 
      : []
    ),
  ];

  return (
    <div className="p-8 min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-poppins font-black text-slate-800 tracking-tight">System Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Atur preferensi akun, integrasi *alert*, dan konfigurasi platform SARAI.
        </p>
      </div>

      {/* Main Content Layout: Sidebar Tabs + Content Area */}
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
          
          {/* JIKA TAB NOTIFIKASI AKTIF */}
          {activeTab === 'notifications' ? (
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Notifikasi & Alert Rules</h2>
              
              {/* Alert Channels Section */}
              <div className="mb-10">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Notification Channels</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* In-App Toggle */}
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <div>
                      <p className="font-semibold text-slate-700">In-App Alerts</p>
                      <p className="text-xs text-slate-500">Muncul di dashboard UI</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary" 
                      checked={alerts.inApp} 
                      onChange={() => setAlerts({...alerts, inApp: !alerts.inApp})}
                    />
                  </div>
                  {/* Email Toggle */}
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <div>
                      <p className="font-semibold text-slate-700">Email Alerts</p>
                      <p className="text-xs text-slate-500">Kirim ke email utama</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary" 
                      checked={alerts.email}
                      onChange={() => setAlerts({...alerts, email: !alerts.email})}
                    />
                  </div>
                  {/* Slack Toggle */}
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <div>
                      <p className="font-semibold text-slate-700">Slack Webhook</p>
                      <p className="text-xs text-slate-500">Kirim ke channel tim</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary" 
                      checked={alerts.slack}
                      onChange={() => setAlerts({...alerts, slack: !alerts.slack})}
                    />
                  </div>
                  {/* Custom Webhook Toggle */}
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <div>
                      <p className="font-semibold text-slate-700">Custom Webhook</p>
                      <p className="text-xs text-slate-500">Payload JSON eksternal</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary" 
                      checked={alerts.webhook}
                      onChange={() => setAlerts({...alerts, webhook: !alerts.webhook})}
                    />
                  </div>
                </div>
              </div>

              {/* Alert Rules / Threshold Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Alert Thresholds</h3>
                <div className="space-y-4">
                  
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 text-sm">Query Error Rate Alert (%)</label>
                    <div className="flex gap-4 items-center">
                      <input 
                        type="number" 
                        value={threshold.errorRate}
                        onChange={(e) => setThreshold({...threshold, errorRate: Number(e.target.value)})}
                        className="border border-slate-300 rounded-lg px-4 py-2 w-24 text-slate-700 focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-sm text-slate-500">Picu alert jika error query melebihi persentase ini dalam 1 jam.</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-slate-700 text-sm">Slow Query Threshold (ms)</label>
                    <div className="flex gap-4 items-center">
                      <input 
                        type="number" 
                        value={threshold.queryDuration}
                        onChange={(e) => setThreshold({...threshold, queryDuration: Number(e.target.value)})}
                        className="border border-slate-300 rounded-lg px-4 py-2 w-32 text-slate-700 focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-sm text-slate-500">Picu alert jika durasi eksekusi query melebihi batas milidetik ini.</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8 flex justify-end pt-6 border-t border-slate-100">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                  Save Preferences
                </button>
              </div>
            </div>
          ) : activeTab === 'audit' ? (
            /* TAB AUDIT LOG (DATA REAL-TIME) */
            <div className="max-w-4xl h-full flex flex-col">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">System Audit Logs</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Riwayat aktivitas mutasi data oleh pengguna di dalam platform.
                  </p>
                </div>
                <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  <span>⬇️</span> Download CSV
                </button>
              </div>

              {/* Tabel Log */}
              <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 bg-white">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-4">Waktu</th>
                      <th className="px-6 py-4">Aktor / User</th>
                      <th className="px-6 py-4">Aksi</th>
                      <th className="px-6 py-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingLogs ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                          <span className="animate-pulse">⏳ Mengambil data dari CCTV...</span>
                        </td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                          Belum ada aktivitas yang terekam.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => {
                        const actionUrl = log.action.split(' ').slice(1).join(' '); 
                        return (
                          <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-xs">
                              {new Date(log.createdAt).toLocaleString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-800 text-sm">
                              {log.actor}
                            </td>
                            <td className="px-6 py-4 text-sm flex items-center">
                              {getMethodBadge(log.action)}
                              <span className="text-slate-500 truncate max-w-[200px]" title={actionUrl}>
                                {actionUrl}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-slate-500">
                              {log.ipAddress}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* PLACEHOLDER UNTUK TAB LAINNYA */
            <div className="flex h-full items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="text-center">
                <span className="text-4xl">🚧</span>
                <h3 className="mt-4 text-lg font-semibold text-slate-700">Modul Sedang Dibangun</h3>
                <p className="text-sm text-slate-500 mt-1">Konfigurasi untuk {tabs.find(t => t.id === activeTab)?.label} akan segera tersedia.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );

}