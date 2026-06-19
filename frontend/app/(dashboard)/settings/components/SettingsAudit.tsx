"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../../lib/api';

export default function SettingsAudit() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setIsLoadingLogs(true);
      setErrorMsg(null);
      try {
        const res = await apiFetch('/audit/logs');
        if (res.status === 401 || res.status === 403) {
          setErrorMsg('Akses ditolak. Hanya Admin/Owner yang dapat melihat Audit Log.');
          return;
        }
        if (!res.ok) throw new Error('Gagal mengambil data log');
        const data = await res.json();
        setAuditLogs(data);
      } catch (error) {
        console.error("Error fetching logs:", error);
        setErrorMsg('Tidak dapat terhubung ke server backend.');
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchAuditLogs();
  }, []);

  const getMethodBadge = (actionStr: string) => {
    const method = actionStr.split(' ')[0];
    switch (method) {
      case 'POST': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold mr-2">POST</span>;
      case 'DELETE': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold mr-2">DELETE</span>;
      case 'PATCH': 
      case 'PUT': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold mr-2">{method}</span>;
      default: return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold mr-2">{method}</span>;
    }
  };

  return (
    <div className="max-w-4xl h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Audit Logs</h2>
          <p className="text-sm text-slate-500 mt-1">
            Riwayat aktivitas mutasi data oleh pengguna di dalam platform
          </p>
        </div>
        <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <span>⬇️</span> Download CSV
        </button>
      </div>

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
            ) : errorMsg ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">🔒</span>
                    <p className="text-sm font-semibold text-slate-600">{errorMsg}</p>
                  </div>
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
  );
}
