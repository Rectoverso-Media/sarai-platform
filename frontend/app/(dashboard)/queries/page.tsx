"use client";
import { apiFetch } from '../../../lib/api';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ExecutionStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | null;

interface QueryItem {
  id: string;
  name: string;
  description?: string;
  rawSql?: string;
  streamName?: string;
  teamId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  schedules?: { isActive: boolean; cronExpression: string } | null;
  executions?: Array<{ status: string; durationMs?: number; rowsReturned?: number; executedAt: string }>;
}

const StatusBadge = ({ status }: { status: ExecutionStatus }) => {
  if (!status) return <span className="text-xs text-slate-400 italic">Never run</span>;
  const styles: Record<string, string> = {
    SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    FAILED: 'bg-red-50 text-red-700 border-red-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
  };
  const labels: Record<string, string> = { SUCCESS: '✓ Success', FAILED: '✗ Failed', PENDING: '⋯ Pending' };
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${styles[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {labels[status] ?? status}
    </span>
  );
};

export default function QueriesListPage() {
  const router = useRouter();
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());

  // ── Schedule Modal ────────────────────────────────────────────────────────
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<QueryItem | null>(null);
  const [cronExp, setCronExp] = useState('0 0 * * *');
  const [isCronActive, setIsCronActive] = useState(true);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // ── Create Modal ──────────────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [syncedTables, setSyncedTables] = useState<{ streamName: string; recordCount: number }[]>([]);
  const [newQuery, setNewQuery] = useState({ name: '', description: '', rawSql: '', streamName: '' });
  const [isCreating, setIsCreating] = useState(false);

  const fetchQueries = useCallback(async () => {
    try {
      const res = await apiFetch('/queries');
      if (res.ok) {
        const result = await res.json();
        setQueries(result.data || []);
      }
    } catch (error) {
      console.error('Gagal mengambil data queries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSyncedTables = useCallback(async () => {
    try {
      const res = await apiFetch('/queries/synced-tables');
      if (res.ok) {
        const result = await res.json();
        setSyncedTables(result.data || []);
      }
    } catch (error) {
      console.error('Gagal fetch synced tables:', error);
    }
  }, []);

  useEffect(() => {
    fetchQueries();
    fetchSyncedTables();
  }, [fetchQueries, fetchSyncedTables]);

  const handleRun = async (id: string) => {
    setRunningIds((prev) => new Set([...prev, id]));
    try {
      const res = await apiFetch(`/queries/${id}/execute`, { method: 'POST' });
      const result = await res.json();
      if (res.ok) {
        // Refresh list setelah 2 detik untuk update status
        setTimeout(() => fetchQueries(), 2000);
      } else {
        alert(`Gagal menjalankan query: ${result.message}`);
      }
    } catch (error) {
      console.error('Error executing query:', error);
      alert('Gagal terhubung ke engine eksekusi!');
    } finally {
      setRunningIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus query "${name}"?`)) return;
    try {
      const res = await apiFetch(`/queries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQueries((prev) => prev.filter((q) => q.id !== id));
      } else {
        alert('Gagal menghapus query.');
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const openScheduleModal = (query: QueryItem) => {
    setSelectedQuery(query);
    setCronExp(query.schedules?.cronExpression ?? '0 0 * * *');
    setIsCronActive(query.schedules?.isActive ?? true);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!selectedQuery) return;
    setIsSavingSchedule(true);
    try {
      const res = await apiFetch(`/queries/${selectedQuery.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cronExpression: cronExp, isActive: isCronActive }),
      });
      if (res.ok) {
        setIsScheduleModalOpen(false);
        fetchQueries();
      } else {
        alert('Gagal menyimpan jadwal.');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleCreateQuery = async () => {
    if (!newQuery.name.trim()) return alert('Nama query wajib diisi!');
    setIsCreating(true);
    try {
      const res = await apiFetch('/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuery),
      });
      if (res.ok) {
        setIsCreateModalOpen(false);
        setNewQuery({ name: '', description: '', rawSql: '', streamName: '' });
        fetchQueries();
      } else {
        alert('Gagal membuat query.');
      }
    } catch (error) {
      console.error('Error creating query:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const CRON_PRESETS = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every 6 hours', value: '0 */6 * * *' },
    { label: 'Every day at midnight', value: '0 0 * * *' },
    { label: 'Every week (Monday)', value: '0 0 * * 1' },
  ];

  return (
    <div className="p-8 h-full flex flex-col space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Saved Queries</h1>
          <p className="text-slate-500 mt-1">SQL queries tersimpan untuk mengekstrak insight dari synced data.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/queries/builder"
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm"
          >
            Visual Builder
          </Link>
          <button
            id="create-query-btn"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2 text-sm"
          >
            <span className="text-lg leading-none">+</span> New Query
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Queries', value: queries.length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Scheduled', value: queries.filter((q) => q.schedules?.isActive).length, color: 'bg-purple-50 text-purple-700 border-purple-100' },
          { label: 'Synced Streams', value: syncedTables.length, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        ].map((stat) => (
          <div key={stat.label} className={`flex items-center gap-4 p-4 rounded-xl border ${stat.color}`}>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium opacity-75 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">Query</th>
                <th className="px-6 py-4 border-b border-slate-100">Stream / Source</th>
                <th className="px-6 py-4 border-b border-slate-100">Last Status</th>
                <th className="px-6 py-4 border-b border-slate-100">Schedule</th>
                <th className="px-6 py-4 border-b border-slate-100">Last Run</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600 divide-y divide-slate-100">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-slate-100 animate-pulse rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : queries.length > 0 ? (
                queries.map((query) => {
                  const lastExec = query.executions?.[0];
                  const isRunning = runningIds.has(query.id);
                  return (
                    <tr key={query.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 max-w-[280px]">
                        <p className="font-bold text-slate-800">{query.name}</p>
                        {query.rawSql && (
                          <code className="text-[10px] text-slate-400 font-mono truncate block mt-1">
                            {query.rawSql.substring(0, 60)}...
                          </code>
                        )}
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{query.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        {query.streamName ? (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono font-medium">
                            {query.streamName}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No stream</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isRunning ? (
                          <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-full font-semibold animate-pulse">
                            ⋯ Queued
                          </span>
                        ) : (
                          <StatusBadge status={(lastExec?.status as ExecutionStatus) ?? null} />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {query.schedules?.isActive ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-xs font-mono text-slate-600">{query.schedules.cronExpression}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Manual</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {lastExec
                          ? new Date(lastExec.executedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            id={`run-query-${query.id}`}
                            onClick={() => handleRun(query.id)}
                            disabled={isRunning || !query.rawSql}
                            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isRunning ? '⋯' : '▶ Run'}
                          </button>
                          <button
                            id={`view-query-${query.id}`}
                            onClick={() => router.push(`/queries/${query.id}`)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            View
                          </button>
                          <button
                            id={`schedule-query-${query.id}`}
                            onClick={() => openScheduleModal(query)}
                            className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                          >
                            Schedule
                          </button>
                          <button
                            id={`delete-query-${query.id}`}
                            onClick={() => handleDelete(query.id, query.name)}
                            className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="text-5xl mb-4">🗂️</div>
                    <p className="font-semibold text-slate-700 text-lg">Belum ada query tersimpan</p>
                    <p className="text-sm text-slate-400 mt-1 mb-5">Buat query SQL pertama untuk menganalisa data synced dari Airbyte.</p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors"
                    >
                      + Create First Query
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE QUERY MODAL ────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-bold text-slate-800">Create New Query</h2>
              <p className="text-sm text-slate-500 mt-1">Buat SQL query baru untuk synced data Anda.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Query Name *</label>
                <input
                  type="text"
                  id="new-query-name"
                  value={newQuery.name}
                  onChange={(e) => setNewQuery({ ...newQuery, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="mis: Monthly Revenue Summary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Description</label>
                <input
                  type="text"
                  value={newQuery.description}
                  onChange={(e) => setNewQuery({ ...newQuery, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Deskripsi singkat query ini"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Data Stream {syncedTables.length > 0 && <span className="font-normal text-slate-400">({syncedTables.length} tersedia)</span>}
                </label>
                {syncedTables.length > 0 ? (
                  <select
                    value={newQuery.streamName}
                    onChange={(e) => setNewQuery({ ...newQuery, streamName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  >
                    <option value="">Pilih stream (opsional)</option>
                    {syncedTables.map((t) => (
                      <option key={t.streamName} value={t.streamName}>
                        {t.streamName} ({t.recordCount.toLocaleString()} records)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                    Belum ada data synced. Sync data source Airbyte terlebih dahulu.
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">SQL Query</label>
                <textarea
                  id="new-query-sql"
                  value={newQuery.rawSql}
                  onChange={(e) => setNewQuery({ ...newQuery, rawSql: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                  placeholder={'SELECT "recordData"->>\'field_name\' as field\nFROM synced_data\nWHERE "streamName" = \'your_stream\'\nLIMIT 100'}
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                id="create-query-submit-btn"
                onClick={handleCreateQuery}
                disabled={isCreating}
                className="flex-1 py-2.5 font-bold text-white bg-blue-600 rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create Query'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEDULE MODAL ───────────────────────────────────────────────── */}
      {isScheduleModalOpen && selectedQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              <h2 className="text-xl font-bold text-slate-800">Set Schedule</h2>
              <p className="text-sm text-slate-500 mt-1 truncate">Target: {selectedQuery.name}</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  {CRON_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setCronExp(preset.value)}
                      className={`text-xs px-3 py-2 rounded-lg border text-left transition-colors ${
                        cronExp === preset.value
                          ? 'border-purple-400 bg-purple-50 text-purple-700 font-semibold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-purple-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cron Expression</label>
                <input
                  type="text"
                  value={cronExp}
                  onChange={(e) => setCronExp(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  placeholder="0 0 * * *"
                />
                <p className="text-xs text-slate-400 mt-1.5">Format: menit jam hari bulan hari-minggu</p>
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Active</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Aktifkan eksekusi otomatis</p>
                </div>
                <div
                  onClick={() => setIsCronActive(!isCronActive)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isCronActive ? 'bg-purple-500' : 'bg-slate-300'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isCronActive ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="flex-1 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule}
                className="flex-1 py-2.5 font-bold text-white bg-purple-600 rounded-xl shadow-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
              >
                {isSavingSchedule ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}