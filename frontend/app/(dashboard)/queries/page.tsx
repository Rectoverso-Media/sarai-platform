"use client";
import { apiFetch } from '../../../lib/api';
import { Modal, ModalFooter, DataTable, EmptyState, StatusBadge } from '@/components/ui';
import type { Column } from '@/components/ui';
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

const STATUS_VARIANT_MAP: Record<string, 'success' | 'error' | 'pending' | 'neutral'> = {
  SUCCESS: 'success',
  FAILED: 'error',
  PENDING: 'pending',
};

const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every week (Monday)', value: '0 0 * * 1' },
];

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

  // ── Column Definitions ─────────────────────────────────────────────────────
  const columns: Column<QueryItem>[] = [
    {
      key: 'name',
      header: 'Query',
      render: (row) => (
        <div className="max-w-[280px]">
          <p className="font-bold text-slate-800">{row.name}</p>
          {row.rawSql && (
            <code className="text-[10px] text-slate-400 font-mono truncate block mt-1">
              {row.rawSql.substring(0, 60)}...
            </code>
          )}
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'streamName',
      header: 'Stream / Source',
      render: (row) =>
        row.streamName ? (
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono font-medium">
            {row.streamName}
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">No stream</span>
        ),
    },
    {
      key: 'executions',
      header: 'Last Status',
      render: (row) => {
        const lastExec = row.executions?.[0];
        const isRunning = runningIds.has(row.id);
        if (isRunning) {
          return (
            <StatusBadge variant="info" label="⋯ Queued" dot pulse />
          );
        }
        if (!lastExec) return <span className="text-xs text-slate-400 italic">Never run</span>;
        const variant = STATUS_VARIANT_MAP[lastExec.status] ?? 'neutral';
        const labels: Record<string, string> = { success: '✓ Success', error: '✗ Failed', pending: '⋯ Pending', neutral: lastExec.status };
        return <StatusBadge variant={variant} label={labels[variant]} />;
      },
    },
    {
      key: 'schedules',
      header: 'Schedule',
      render: (row) =>
        row.schedules?.isActive ? (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs font-mono text-slate-600">{row.schedules.cronExpression}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Manual</span>
        ),
    },
    {
      key: 'updatedAt',
      header: 'Last Run',
      render: (row) => {
        const lastExec = row.executions?.[0];
        return (
          <span className="text-xs text-slate-500">
            {lastExec
              ? new Date(lastExec.executedAt).toLocaleString('id-ID', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })
              : '—'}
          </span>
        );
      },
      hideOnMobile: true,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => {
        const isRunning = runningIds.has(row.id);
        return (
          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              id={`run-query-${row.id}`}
              onClick={(e) => { e.stopPropagation(); handleRun(row.id); }}
              disabled={isRunning || !row.rawSql}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? '⋯' : '▶ Run'}
            </button>
            <button
              id={`view-query-${row.id}`}
              onClick={(e) => { e.stopPropagation(); router.push(`/queries/${row.id}`); }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              View
            </button>
            <button
              id={`schedule-query-${row.id}`}
              onClick={(e) => { e.stopPropagation(); openScheduleModal(row); }}
              className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              Schedule
            </button>
            <button
              id={`delete-query-${row.id}`}
              onClick={(e) => { e.stopPropagation(); handleDelete(row.id, row.name); }}
              className="px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
          </div>
        );
      },
    },
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

      {/* ── DataTable (shared component) ────────────────────────────────────── */}
      <DataTable
        data={queries}
        columns={columns}
        isLoading={isLoading}
        caption="Saved SQL Queries"
        emptyState={
          <EmptyState
            icon="🗂️"
            title="Belum ada query tersimpan"
            description="Buat query SQL pertama untuk menganalisa data synced dari Airbyte."
            action={{ label: '+ Create First Query', onClick: () => setIsCreateModalOpen(true) }}
          />
        }
      />

      {/* ── CREATE QUERY MODAL (shared Modal component) ──────────────────────── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Query"
        description="Buat SQL query baru untuk synced data Anda."
        accentColor="blue"
        size="lg"
        footer={
          <ModalFooter
            onCancel={() => setIsCreateModalOpen(false)}
            onConfirm={handleCreateQuery}
            confirmLabel="Create Query"
            cancelLabel="Cancel"
            isLoading={isCreating}
            confirmVariant="blue"
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Query Name *
            </label>
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
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Description
            </label>
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
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              SQL Query
            </label>
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
      </Modal>

      {/* ── SCHEDULE MODAL (shared Modal component) ──────────────────────────── */}
      <Modal
        isOpen={isScheduleModalOpen && !!selectedQuery}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Set Schedule"
        description={selectedQuery ? `Target: ${selectedQuery.name}` : ''}
        accentColor="purple"
        size="md"
        footer={
          <ModalFooter
            onCancel={() => setIsScheduleModalOpen(false)}
            onConfirm={handleSaveSchedule}
            confirmLabel="Save Schedule"
            cancelLabel="Cancel"
            isLoading={isSavingSchedule}
            confirmVariant="purple"
          />
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Quick Presets
            </label>
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
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Cron Expression
            </label>
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
      </Modal>
    </div>
  );
}