"use client";

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  details: string | null;
  ipAddress: string;
  createdAt: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchActor, setSearchActor] = useState('');
  const [searchAction, setSearchAction] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdminOrOwner, setIsAdminOrOwner] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stored = localStorage.getItem('userData');
      if (stored) {
        const user = JSON.parse(stored);
        if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
          setIsAdminOrOwner(false);
          setIsLoading(false);
          return;
        }
      }

      const res = await apiFetch('/audit/logs');
      if (res.status === 403) {
        setIsAdminOrOwner(false);
        setIsLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Gagal memuat log aktivitas');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
      // Fallback mocks
      setLogs([
        {
          id: '1',
          action: 'USER_LOGIN',
          actor: 'admin@sarai.ai',
          details: 'Sukses login melalui web portal.',
          ipAddress: '192.168.1.15',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          action: 'CREATE_DATA_SOURCE',
          actor: 'manager@sarai.ai',
          details: 'Menghubungkan Google Ads account ID 482-918-2819.',
          ipAddress: '10.0.4.152',
          createdAt: new Date(Date.now() - 1200000).toISOString(),
        },
        {
          id: '3',
          action: 'RUN_QUERY',
          actor: 'developer@sarai.ai',
          details: 'Mengeksekusi SQL: SELECT * FROM campaigns LIMIT 10',
          ipAddress: '182.253.18.91',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchActor = log.actor.toLowerCase().includes(searchActor.toLowerCase());
    const matchAction = log.action.toLowerCase().includes(searchAction.toLowerCase());
    return matchActor && matchAction;
  });

  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      header: 'Waktu (WIB)',
      render: (row) => new Date(row.createdAt).toLocaleString('id-ID'),
      width: '180px',
    },
    {
      key: 'action',
      header: 'Aksi / Event',
      render: (row) => (
        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded font-mono text-xs font-bold">
          {row.action}
        </span>
      ),
    },
    {
      key: 'actor',
      header: 'Aktor (Pengguna)',
      render: (row) => <span className="font-semibold text-slate-700">{row.actor}</span>,
    },
    {
      key: 'details',
      header: 'Keterangan Detail',
      render: (row) => <span className="text-slate-500 text-xs">{row.details || '—'}</span>,
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      render: (row) => <code className="text-[11px] text-slate-400 font-mono">{row.ipAddress}</code>,
    },
  ];

  if (!isAdminOrOwner) {
    return (
      <div className="p-8 animate-in fade-in duration-300">
        <EmptyState
          icon="🛡️"
          title="Akses Terbatas"
          description="Halaman Audit Log Keamanan ini hanya dapat diakses oleh Administrator atau Owner team."
        />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Audit Log Keamanan"
        description="Pantau riwayat aktivitas admin, modifikasi schema, penarikan data, dan autentikasi sistem."
      />

      <Card className="p-6 space-y-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
        {/* Search Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cari Aktor</span>
            <input
              type="text"
              placeholder="e.g. admin@sarai.ai"
              value={searchActor}
              onChange={(e) => setSearchActor(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cari Event</span>
            <input
              type="text"
              placeholder="e.g. USER_LOGIN, RUN_QUERY"
              value={searchAction}
              onChange={(e) => setSearchAction(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-10 bg-slate-100 animate-pulse rounded-lg" />
            <div className="h-48 bg-slate-100 animate-pulse rounded-lg" />
          </div>
        ) : error ? (
          <ErrorState onRetry={fetchLogs} />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon="🔎"
            title="Log tidak ditemukan"
            description="Tidak ada log aktivitas yang cocok dengan kriteria pencarian Anda."
          />
        ) : (
          <DataTable data={filteredLogs} columns={columns} />
        )}
      </Card>
    </div>
  );
}
