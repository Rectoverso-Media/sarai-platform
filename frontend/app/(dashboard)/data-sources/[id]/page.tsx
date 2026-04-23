"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function DataSourceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [syncData, setSyncData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        const response = await fetch(`http://localhost:3001/airbyte/sources/${id}/sync-status`);
        if (response.ok) {
          const result = await response.json();
          setSyncData(result.data);
        }
      } catch (error) {
        console.error("Gagal mengambil status sync:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSyncStatus();
  }, [id]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">⏳ Menghubungkan ke Airbyte Node...</div>;
  }

  if (!syncData) {
    return <div className="p-8 text-center text-red-500">❌ Data Source tidak ditemukan.</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-slate-400 font-medium">
        <Link href="/data-sources" className="hover:text-blue-600 transition-colors">Data Sources</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">Connection Details</span>
      </nav>

      {/* Header Info */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-poppins font-bold text-slate-800">Connection Details</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${syncData.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {syncData.status}
            </span>
          </div>
          <p className="text-slate-500 font-mono text-sm">ID: {syncData.sourceId}</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">
            ⚙️ Settings
          </button>
          <button className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
            🔄 Sync Now
          </button>
        </div>
      </div>

      {/* Statistik Cepat */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-bold mb-1">Total Rows Extracted</p>
          <h3 className="text-4xl font-poppins font-bold text-blue-600">
            {syncData.totalRowsExtracted.toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-bold mb-1">Last Sync Completed</p>
          <h3 className="text-xl font-bold text-slate-800">
            {new Date(syncData.lastSync).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </h3>
          <p className="text-xs text-slate-400 mt-1">{new Date(syncData.lastSync).toLocaleDateString('id-ID')}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-bold mb-1">Next Scheduled Sync</p>
          <h3 className="text-xl font-bold text-slate-800">
            {new Date(syncData.nextSync).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </h3>
          <p className="text-xs text-slate-400 mt-1">Automated interval: 1 Hour</p>
        </div>
      </div>

      {/* Sync Logs Timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Recent Sync History</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {syncData.recentLogs.map((log: any, index: number) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mt-1.5 ${log.status === 'Success' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  {index !== syncData.recentLogs.length - 1 && (
                    <div className="w-0.5 h-full bg-slate-200 mt-2"></div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {new Date(log.time).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(log.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className={`text-sm mt-1 ${log.status === 'Success' ? 'text-slate-600' : 'text-yellow-600 font-medium'}`}>
                    {log.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}