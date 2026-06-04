"use client";
import { apiFetch } from '../../../../lib/api';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface QueryDetail {
  id: string;
  name: string;
  description?: string;
  rawSql?: string;
  streamName?: string;
  createdAt: string;
  updatedAt: string;
  schedules?: {
    id: string;
    cronExpression: string;
    isActive: boolean;
    lastRunAt?: string;
    nextRunAt?: string;
  } | null;
  executions?: Array<{
    id: string;
    status: string;
    durationMs?: number;
    rowsReturned?: number;
    errorMessage?: string;
    executedAt: string;
  }>;
}

interface QueryResult {
  fromCache: boolean;
  data: {
    columns: string[];
    rows: any[][];
    rowCount: number;
    durationMs: number;
    executedAt: string;
  } | null;
  message?: string;
}

type Tab = 'result' | 'history' | 'schedule';

const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Weekly (Monday)', value: '0 0 * * 1' },
];

export default function QueryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryId = params.id as string;

  const [query, setQuery] = useState<QueryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('result');
  const [isRunning, setIsRunning] = useState(false);

  // Result tab state
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);

  // Schedule tab state
  const [cronExp, setCronExp] = useState('0 0 * * *');
  const [isCronActive, setIsCronActive] = useState(true);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  const fetchQueryDetail = useCallback(async () => {
    try {
      const res = await apiFetch(`/queries/${queryId}`);
      if (res.ok) {
        const data = await res.json();
        setQuery(data.data);
        if (data.data.schedules) {
          setCronExp(data.data.schedules.cronExpression);
          setIsCronActive(data.data.schedules.isActive);
        }
      } else {
        router.push('/queries');
      }
    } catch (error) {
      console.error('Error fetching query:', error);
      router.push('/queries');
    } finally {
      setIsLoading(false);
    }
  }, [queryId, router]);

  const fetchResult = useCallback(async () => {
    setIsLoadingResult(true);
    try {
      const res = await apiFetch(`/queries/${queryId}/result`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (error) {
      console.error('Error fetching result:', error);
    } finally {
      setIsLoadingResult(false);
    }
  }, [queryId]);

  useEffect(() => {
    fetchQueryDetail();
  }, [fetchQueryDetail]);

  useEffect(() => {
    if (activeTab === 'result') {
      fetchResult();
    }
  }, [activeTab, fetchResult]);

  const handleRun = async () => {
    if (!query?.rawSql) return;
    setIsRunning(true);
    try {
      const res = await apiFetch(`/queries/${queryId}/execute`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        // Poll for result every 2 seconds (max 30s)
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          await fetchResult();
          if (attempts >= 15) clearInterval(poll);
          // Check if job returned a result via BullMQ job status
          if (data.jobId) {
            const statusRes = await apiFetch(`/queries/job-status/${data.jobId}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.state === 'completed' || statusData.state === 'failed') {
                clearInterval(poll);
                await fetchResult();
                await fetchQueryDetail();
                setIsRunning(false);
              }
            }
          }
        }, 2000);
        setTimeout(() => { clearInterval(poll); setIsRunning(false); }, 30000);
      } else {
        alert(`Gagal menjalankan query: ${data.message}`);
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Error running query:', error);
      setIsRunning(false);
    }
  };

  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      const res = await apiFetch(`/queries/${queryId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cronExpression: cronExp, isActive: isCronActive }),
      });
      if (res.ok) {
        setScheduleSaved(true);
        setTimeout(() => setScheduleSaved(false), 3000);
        fetchQueryDetail();
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Yakin ingin menghapus query "${query?.name}"?`)) return;
    try {
      const res = await apiFetch(`/queries/${queryId}`, { method: 'DELETE' });
      if (res.ok) router.push('/queries');
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!query) return null;

  const lastExec = query.executions?.[0];
  const statusColor: Record<string, string> = {
    SUCCESS: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    FAILED: 'text-red-600 bg-red-50 border-red-200',
    PENDING: 'text-amber-600 bg-amber-50 border-amber-200',
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/queries')}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-3 transition-colors"
          >
            ← Back to Queries
          </button>
          <h1 className="text-3xl font-bold text-slate-800">{query.name}</h1>
          {query.description && <p className="text-slate-500 mt-1">{query.description}</p>}
          <div className="flex items-center gap-3 mt-2">
            {query.streamName && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-mono font-medium">
                {query.streamName}
              </span>
            )}
            {lastExec && (
              <span className={`text-xs border px-2.5 py-1 rounded-full font-semibold ${statusColor[lastExec.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {lastExec.status === 'SUCCESS' ? `✓ ${lastExec.rowsReturned?.toLocaleString()} rows` : lastExec.status}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            id="run-query-detail-btn"
            onClick={handleRun}
            disabled={isRunning || !query.rawSql}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
              isRunning
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Running...
              </span>
            ) : (
              '▶ Run Query'
            )}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2.5 rounded-xl font-bold text-sm text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* ── SQL PREVIEW ───────────────────────────────────────────────────── */}
      {query.rawSql && (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">SQL</span>
            <span className="text-xs text-slate-500">
              Updated {new Date(query.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <pre className="px-5 py-4 text-sm text-slate-200 font-mono overflow-x-auto leading-relaxed">
            {query.rawSql}
          </pre>
        </div>
      )}

      {/* ── STATS ROW ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Last Rows Returned',
            value: lastExec?.rowsReturned != null ? lastExec.rowsReturned.toLocaleString() : '—',
            sub: lastExec?.durationMs != null ? `${lastExec.durationMs}ms` : null,
            color: 'border-l-4 border-l-blue-500',
          },
          {
            label: 'Total Executions',
            value: query.executions?.length.toString() ?? '0',
            sub: 'all time',
            color: 'border-l-4 border-l-purple-500',
          },
          {
            label: 'Schedule',
            value: query.schedules?.isActive ? 'Active' : 'Manual',
            sub: query.schedules?.cronExpression ?? 'No schedule set',
            color: `border-l-4 ${query.schedules?.isActive ? 'border-l-emerald-500' : 'border-l-slate-300'}`,
          },
        ].map((stat) => (
          <div key={stat.label} className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 ${stat.color}`}>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
            {stat.sub && <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── TABS ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          {([
            { id: 'result', label: 'Results' },
            { id: 'history', label: 'Execution History' },
            { id: 'schedule', label: 'Schedule' },
          ] as { id: Tab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── RESULTS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'result' && (
          <div className="p-6">
            {isLoadingResult ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-slate-100 animate-pulse rounded" />
                ))}
              </div>
            ) : result?.data ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700">{result.data.rowCount.toLocaleString()} rows</span>
                    <span className="text-xs text-slate-400">{result.data.durationMs}ms</span>
                    {result.fromCache && (
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                        Cached
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(result.data.executedAt).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {result.data.columns.map((col) => (
                          <th key={col} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.data.rows.slice(0, 100).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          {row.map((cell, j) => (
                            <td key={j} className="px-4 py-3 text-slate-600 font-mono text-xs whitespace-nowrap max-w-[200px] truncate">
                              {cell == null ? <span className="text-slate-300 italic">null</span> : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.data.rows.length > 100 && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
                      Showing 100 of {result.data.rowCount.toLocaleString()} rows
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🚀</div>
                <p className="font-semibold text-slate-700">Belum ada hasil tersimpan</p>
                <p className="text-sm text-slate-400 mt-1 mb-5">
                  {result?.message ?? 'Klik "Run Query" untuk mengeksekusi dan melihat hasilnya.'}
                </p>
                <button
                  onClick={handleRun}
                  disabled={isRunning || !query.rawSql}
                  className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Run Query Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="p-6">
            {!query.executions || query.executions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-4xl mb-3">📋</p>
                <p className="font-medium">Belum ada riwayat eksekusi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {query.executions.map((exec, i) => (
                  <div
                    key={exec.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${
                      exec.status === 'SUCCESS'
                        ? 'border-emerald-200 bg-emerald-50'
                        : exec.status === 'FAILED'
                        ? 'border-red-200 bg-red-50'
                        : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      exec.status === 'SUCCESS' ? 'bg-emerald-500' : exec.status === 'FAILED' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${
                          exec.status === 'SUCCESS' ? 'text-emerald-700' : exec.status === 'FAILED' ? 'text-red-700' : 'text-amber-700'
                        }`}>
                          {exec.status}
                        </span>
                        {exec.rowsReturned != null && (
                          <span className="text-xs text-slate-500">{exec.rowsReturned.toLocaleString()} rows</span>
                        )}
                        {exec.durationMs != null && (
                          <span className="text-xs text-slate-400">{exec.durationMs}ms</span>
                        )}
                      </div>
                      {exec.errorMessage && (
                        <p className="text-xs text-red-600 font-mono mt-1 truncate">{exec.errorMessage}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(exec.executedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SCHEDULE TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'schedule' && (
          <div className="p-6 space-y-6 max-w-lg">
            <div>
              <h3 className="font-bold text-slate-700 text-sm mb-3">Quick Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {CRON_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setCronExp(preset.value)}
                    className={`text-xs px-3 py-2.5 rounded-xl border text-left transition-colors ${
                      cronExp === preset.value
                        ? 'border-blue-400 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    {preset.label}
                    <span className="block font-mono text-[10px] opacity-60 mt-0.5">{preset.value}</span>
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
                id="cron-expression-input"
                value={cronExp}
                onChange={(e) => setCronExp(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
              <p className="text-xs text-slate-400 mt-1.5">Format: menit jam hari bulan hari-minggu</p>
            </div>

            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Enable Auto-run</h4>
                <p className="text-xs text-slate-500 mt-0.5">Query dijalankan otomatis sesuai jadwal</p>
              </div>
              <div
                onClick={() => setIsCronActive(!isCronActive)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isCronActive ? 'bg-blue-500' : 'bg-slate-300'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isCronActive ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </div>

            <button
              id="save-schedule-btn"
              onClick={handleSaveSchedule}
              disabled={isSavingSchedule}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                scheduleSaved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
              }`}
            >
              {scheduleSaved ? '✓ Schedule Saved!' : isSavingSchedule ? 'Saving...' : 'Save Schedule'}
            </button>

            {query.schedules?.lastRunAt && (
              <div className="text-xs text-slate-400 text-center">
                Last run: {new Date(query.schedules.lastRunAt).toLocaleString('id-ID')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
