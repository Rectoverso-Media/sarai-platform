"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../../../lib/api';

// Frekuensi sync yang tersedia
const SYNC_FREQUENCIES = [
  { label: 'Manual only', value: 'manual', cron: null },
  { label: 'Every hour', value: 'cron', cron: '0 * * * *' },
  { label: 'Every 6 hours', value: 'cron', cron: '0 */6 * * *' },
  { label: 'Every 12 hours', value: 'cron', cron: '0 */12 * * *' },
  { label: 'Once a day', value: 'cron', cron: '0 0 * * *' },
  { label: 'Once a week', value: 'cron', cron: '0 0 * * 0' },
];

export default function DataSourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [dataSource, setDataSource] = useState<any>(null);
  const [syncData, setSyncData] = useState<any>(null);
  const [syncConfig, setSyncConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configEdited, setConfigEdited] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState(SYNC_FREQUENCIES[0]);
  const [activeTab, setActiveTab] = useState<'status' | 'config'>('status');
  const [error, setError] = useState<string | null>(null);

  // Fetch data source detail dari /datasources/:id
  const fetchDataSource = useCallback(async () => {
    try {
      const res = await apiFetch(`/datasources/${id}`);
      if (res.ok) {
        const result = await res.json();
        setDataSource(result.data);
      } else {
        setError('Data Source tidak ditemukan.');
      }
    } catch {
      setError('Gagal menghubungi server.');
    }
  }, [id]);

  // Fetch sync status dari Airbyte (via airbyteSourceId sebagai connectionId)
  const fetchSyncStatus = useCallback(async (airbyteId: string) => {
    try {
      const res = await apiFetch(`/airbyte/sources/${airbyteId}/sync-status`);
      if (res.ok) {
        const result = await res.json();
        setSyncData(result.data);
      }
    } catch {
      // Sync status tidak kritis — lanjut
      console.warn('Gagal mengambil sync status');
    }
  }, []);

  // Fetch sync configuration
  const fetchSyncConfig = useCallback(async (airbyteId: string) => {
    try {
      const res = await apiFetch(`/airbyte/connections/${airbyteId}/config`);
      if (res.ok) {
        const result = await res.json();
        setSyncConfig(result.data);
        // Set initial frequency selection
        if (result.data?.schedule) {
          const cronVal = result.data.schedule.cronExpression;
          const found = SYNC_FREQUENCIES.find((f) => f.cron === cronVal);
          if (found) setSelectedFrequency(found);
        }
      }
    } catch {
      console.warn('Gagal mengambil sync config — mungkin bukan Airbyte connection');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchDataSource();
      setIsLoading(false);
    };
    init();
  }, [fetchDataSource]);

  // Setelah dataSource loaded, fetch sync status & config
  useEffect(() => {
    if (dataSource?.airbyteSourceId && !dataSource.airbyteSourceId.startsWith('mock-id-')) {
      fetchSyncStatus(dataSource.airbyteSourceId);
      fetchSyncConfig(dataSource.airbyteSourceId);
    }
  }, [dataSource, fetchSyncStatus, fetchSyncConfig]);

  // Trigger manual sync
  const handleSyncNow = async () => {
    if (!dataSource?.airbyteSourceId || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await apiFetch(`/airbyte/connections/${dataSource.airbyteSourceId}/test`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('✅ Sync berhasil dipicu! Proses akan berjalan di latar belakang.');
        // Refresh sync status setelah beberapa detik
        setTimeout(() => fetchSyncStatus(dataSource.airbyteSourceId), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`❌ Gagal: ${err.message || 'Tidak dapat memicu sync.'}`);
      }
    } catch {
      alert('❌ Gagal menghubungi server.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Simpan konfigurasi sync
  const handleSaveConfig = async () => {
    if (!dataSource?.airbyteSourceId || isSavingConfig) return;
    setIsSavingConfig(true);
    try {
      const payload = {
        scheduleType: selectedFrequency.value,
        ...(selectedFrequency.cron ? { cronExpression: selectedFrequency.cron } : {}),
      };

      const res = await apiFetch(`/airbyte/connections/${dataSource.airbyteSourceId}/config`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('✅ Konfigurasi sync berhasil disimpan!');
        setConfigEdited(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`❌ Gagal: ${err.message || 'Tidak dapat menyimpan konfigurasi.'}`);
      }
    } catch {
      alert('❌ Gagal menghubungi server.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // ── Loading & Error States ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Memuat data source...</p>
        </div>
      </div>
    );
  }

  if (error || !dataSource) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="text-5xl">⚠️</div>
        <p className="text-red-500 font-semibold">{error || 'Data Source tidak ditemukan.'}</p>
        <Link href="/data-sources" className="text-blue-600 hover:underline text-sm font-medium">← Kembali ke Data Sources</Link>
      </div>
    );
  }

  // Trial info
  const isTrialExpired = dataSource.trialEndsAt && new Date(dataSource.trialEndsAt) < new Date();
  const trialDaysLeft = dataSource.trialDaysLeft;
  const isAirbyte = dataSource.sourceType === 'airbyte';
  const isMockSource = dataSource.airbyteSourceId?.startsWith('mock-id-');

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col space-y-8">

      {/* Breadcrumbs */}
      <nav className="flex text-sm text-slate-400 font-medium items-center gap-2">
        <Link href="/data-sources" className="hover:text-blue-600 transition-colors">Data Sources</Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-semibold">{dataSource.name}</span>
      </nav>

      {/* ── Header Card ──────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Connector icon placeholder */}
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl flex-shrink-0">
              {dataSource.sourceType === 'airbyte' ? '🔄' : dataSource.sourceType === 'database' ? '🗄️' : '🌐'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800">{dataSource.name}</h1>
                {/* Status badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  dataSource.status === 'Connected' ? 'bg-green-100 text-green-700' :
                  dataSource.status === 'Expired' ? 'bg-red-100 text-red-600' :
                  dataSource.status === 'Syncing' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {dataSource.status}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                <span className="font-medium">{dataSource.connectorName || dataSource.sourceType}</span>
                {dataSource.airbyteHost && <span> · {dataSource.airbyteHost}</span>}
              </p>
              <p className="text-slate-400 text-xs mt-0.5 font-mono">ID: {dataSource.id}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {isAirbyte && !isMockSource && (
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {isSyncing ? (
                  <><span className="animate-spin">⟳</span> Syncing...</>
                ) : (
                  <>🔄 Sync Now</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Trial Info Bar */}
        {dataSource.isTrialActive && dataSource.trialEndsAt && (
          <div className={`mt-4 p-3 rounded-xl flex items-center gap-3 text-sm ${
            isTrialExpired ? 'bg-red-50 border border-red-200' :
            trialDaysLeft <= 3 ? 'bg-amber-50 border border-amber-200' :
            'bg-blue-50 border border-blue-100'
          }`}>
            <span className="text-lg">{isTrialExpired ? '⛔' : trialDaysLeft <= 3 ? '⚠️' : '🗓️'}</span>
            <span className={`font-medium ${
              isTrialExpired ? 'text-red-700' : trialDaysLeft <= 3 ? 'text-amber-700' : 'text-blue-700'
            }`}>
              {isTrialExpired
                ? 'Trial telah berakhir. Upgrade plan Anda untuk melanjutkan akses.'
                : `Trial berakhir pada ${new Date(dataSource.trialEndsAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} — ${trialDaysLeft} hari lagi.`}
            </span>
          </div>
        )}
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Rows Synced</p>
          <h3 className="text-3xl font-bold text-blue-600">
            {syncData?.totalRowsExtracted != null
              ? syncData.totalRowsExtracted.toLocaleString('id-ID')
              : <span className="text-slate-300 text-2xl">—</span>}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Last Sync</p>
          <h3 className="text-lg font-bold text-slate-800">
            {syncData?.lastSync
              ? new Date(syncData.lastSync).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : <span className="text-slate-300">Belum pernah sync</span>}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Sync Schedule</p>
          <h3 className="text-lg font-bold text-slate-800">
            {syncConfig?.schedule?.scheduleType === 'cron'
              ? SYNC_FREQUENCIES.find((f) => f.cron === syncConfig.schedule.cronExpression)?.label ?? syncConfig.schedule.cronExpression
              : syncConfig?.schedule?.scheduleType === 'manual'
              ? 'Manual only'
              : <span className="text-slate-300">Tidak dikonfigurasi</span>}
          </h3>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-max mb-6">
          {(['status', 'config'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'status' ? '📋 Sync History' : '⚙️ Configuration'}
            </button>
          ))}
        </div>

        {/* ── Tab: Sync History ─────────────────────────────────────────── */}
        {activeTab === 'status' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800">Recent Sync History</h2>
            </div>
            <div className="p-6">
              {!isAirbyte || isMockSource ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-4xl mb-3">ℹ️</div>
                  <p className="font-semibold text-slate-600">Sync history tidak tersedia</p>
                  <p className="text-sm mt-1">Sync history hanya tersedia untuk Airbyte-connected sources.</p>
                </div>
              ) : !syncData ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-3xl">⏳</div>
                  <p className="text-slate-400 text-sm mt-2">Memuat sync history...</p>
                </div>
              ) : syncData.recentLogs?.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-4xl mb-3">🕐</div>
                  <p className="font-semibold text-slate-600">Belum ada sync</p>
                  <p className="text-sm mt-1">Klik tombol "Sync Now" untuk memulai sync pertama.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {syncData.recentLogs.map((log: any, index: number) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${log.status === 'Success' ? 'bg-green-500' : 'bg-amber-500'}`} />
                        {index !== syncData.recentLogs.length - 1 && (
                          <div className="w-0.5 flex-1 bg-slate-200 mt-2 min-h-[20px]" />
                        )}
                      </div>
                      <div className="pb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">
                            {new Date(log.time).toLocaleString('id-ID', {
                              day: 'numeric', month: 'long', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Configuration ────────────────────────────────────────── */}
        {activeTab === 'config' && (
          <div className="space-y-5">
            {/* Sync Schedule */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                🕐 Sync Schedule
              </h3>

              {!isAirbyte || isMockSource ? (
                <p className="text-sm text-slate-400 italic">
                  Konfigurasi sync hanya tersedia untuk Airbyte-connected sources.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    {SYNC_FREQUENCIES.map((freq) => (
                      <button
                        key={freq.label}
                        onClick={() => { setSelectedFrequency(freq); setConfigEdited(true); }}
                        className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${
                          selectedFrequency.label === freq.label
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {freq.label}
                        {freq.cron && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{freq.cron}</p>}
                      </button>
                    ))}
                  </div>

                  {configEdited && (
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => { setConfigEdited(false); }}
                        className="px-5 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 text-sm transition-all"
                      >
                        Discard
                      </button>
                      <button
                        onClick={handleSaveConfig}
                        disabled={isSavingConfig}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:bg-blue-400 text-sm transition-all flex items-center gap-2"
                      >
                        {isSavingConfig ? <><span className="animate-spin">⏳</span> Saving...</> : '💾 Save Configuration'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Connection Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">🔌 Connection Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Source Type', value: dataSource.sourceType },
                  { label: 'Connector', value: dataSource.connectorName || '—' },
                  { label: 'Airbyte Source ID', value: dataSource.airbyteSourceId || '—' },
                  { label: 'Created At', value: new Date(dataSource.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  { label: 'Trial Starts', value: dataSource.trialStartsAt ? new Date(dataSource.trialStartsAt).toLocaleDateString('id-ID') : '—' },
                  { label: 'Trial Ends', value: dataSource.trialEndsAt ? new Date(dataSource.trialEndsAt).toLocaleDateString('id-ID') : '—' },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="font-mono text-slate-700 text-sm break-all">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
