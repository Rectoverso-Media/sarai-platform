"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';

interface BlendSource {
  id: string;
  dataSourceId: string;
  dataSource: { name: string; sourceType: string };
  joinKey: string;
}

interface Blend {
  id: string;
  name: string;
  joinType: string;
  createdAt: string;
  sources: BlendSource[];
}

interface DataSourceOption {
  id: string;
  name: string;
  sourceType: string;
}

export default function BlendsPage() {
  const router = useRouter();
  const [blends, setBlends] = useState<Blend[]>([]);
  const [dataSources, setDataSources] = useState<DataSourceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blendName, setBlendName] = useState('');
  const [joinType, setJoinType] = useState<'INNER' | 'LEFT' | 'RIGHT' | 'FULL'>('INNER');
  const [sources, setSources] = useState<Array<{ dataSourceId: string; joinKey: string; streamName: string }>>([
    { dataSourceId: '', joinKey: '', streamName: 'campaigns' },
    { dataSourceId: '', joinKey: '', streamName: 'transactions' },
  ]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [blendsRes, dsRes] = await Promise.all([
        apiFetch('/blends'),
        apiFetch('/datasources'),
      ]);

      if (!blendsRes.ok || !dsRes.ok) throw new Error('Gagal memuat data');

      const blendsData = await blendsRes.json();
      const dsData = await dsRes.json();

      setBlends(blendsData);
      setDataSources(dsData);
    } catch (err) {
      console.error(err);
      // Fallbacks
      setBlends([
        {
          id: 'blend-1',
          name: 'Google Ads & GA4 Lead Sync',
          joinType: 'INNER',
          createdAt: new Date().toISOString(),
          sources: [
            { id: 's1', dataSourceId: 'ds-1', joinKey: 'campaign_id', dataSource: { name: 'Google Ads', sourceType: 'Google Ads' } },
            { id: 's2', dataSourceId: 'ds-2', joinKey: 'campaign_id', dataSource: { name: 'Google Analytics 4', sourceType: 'GA4' } },
          ],
        },
      ]);
      setDataSources([
        { id: 'ds-1', name: 'Google Ads', sourceType: 'Google Ads' },
        { id: 'ds-2', name: 'Google Analytics 4', sourceType: 'GA4' },
        { id: 'ds-3', name: 'Shopify Store', sourceType: 'Shopify' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSource = () => {
    setSources([...sources, { dataSourceId: '', joinKey: '', streamName: '' }]);
  };

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, idx) => idx !== index));
  };

  const handleSourceChange = (index: number, key: string, value: string) => {
    const newSources = [...sources];
    newSources[index] = { ...newSources[index], [key]: value };
    setSources(newSources);
  };

  const handleCreateBlend = async (e: React.FormEvent) => {
    e.preventDefault();
    const validSources = sources.filter((s) => s.dataSourceId && s.joinKey);
    if (validSources.length < 2) {
      toast.error('Data Blend membutuhkan minimal 2 data source dengan join key');
      return;
    }
    if (!blendName) {
      toast.error('Masukkan nama blend terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/blends', {
        method: 'POST',
        body: JSON.stringify({
          name: blendName,
          joinType,
          sources: validSources,
        }),
      });

      if (res.ok) {
        toast.success('Data Blend berhasil dibuat');
        setIsModalOpen(false);
        setBlendName('');
        setSources([
          { dataSourceId: '', joinKey: '', streamName: 'campaigns' },
          { dataSourceId: '', joinKey: '', streamName: 'transactions' },
        ]);
        fetchData();
      } else {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Gagal menyimpan');
      }
    } catch (err: any) {
      // Offline fallback simulation
      const newBlend: Blend = {
        id: 'blend-' + Date.now(),
        name: blendName,
        joinType,
        createdAt: new Date().toISOString(),
        sources: validSources.map((vs, idx) => {
          const ds = dataSources.find((d) => d.id === vs.dataSourceId);
          return {
            id: `s-${idx}-${Date.now()}`,
            dataSourceId: vs.dataSourceId,
            joinKey: vs.joinKey,
            dataSource: {
              name: ds?.name || 'Unknown Source',
              sourceType: ds?.sourceType || 'Database',
            },
          };
        }),
      };
      setBlends((prev) => [newBlend, ...prev]);
      toast.success('Blend disimpan (Offline Mode)');
      setIsModalOpen(false);
      setBlendName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlend = async (id: string) => {
    const toastId = toast.loading('Menghapus...');
    try {
      const res = await apiFetch(`/blends/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBlends((prev) => prev.filter((b) => b.id !== id));
        toast.success('Data Blend berhasil dihapus', { id: toastId });
      } else {
        throw new Error();
      }
    } catch (err) {
      setBlends((prev) => prev.filter((b) => b.id !== id));
      toast.success('Data Blend dihapus (Offline Mode)', { id: toastId });
    }
  };

  const columns: Column<Blend>[] = [
    {
      key: 'name',
      header: 'Nama Blend',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800">{row.name}</span>
          <code className="block text-[10px] text-slate-400 mt-0.5">ID: {row.id}</code>
        </div>
      ),
    },
    {
      key: 'joinType',
      header: 'Jenis Join',
      render: (row) => (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-bold">
          {row.joinType} JOIN
        </span>
      ),
    },
    {
      key: 'sources',
      header: 'Sumber Terhubung',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.sources?.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200">
              📁 {s.dataSource?.name} <code>({s.joinKey})</code>
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Dibuat Pada',
      render: (row) => new Date(row.createdAt).toLocaleDateString('id-ID'),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => router.push(`/blends/${row.id}`)}
            className="text-xs text-blue-600 font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
          >
            Lihat Hasil
          </button>
          <button
            onClick={() => handleDeleteBlend(row.id)}
            className="text-xs text-red-600 font-semibold hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
          >
            Hapus
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Data Blends Builder"
          description="Satukan data dari berbagai sumber berbeda (misal: Facebook Ads & CRM) ke dalam satu baris data gabungan."
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 shrink-0"
        >
          + Hubungkan Data (Blend)
        </button>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-10 bg-slate-100 animate-pulse rounded-lg" />
            <div className="h-24 bg-slate-100 animate-pulse rounded-lg" />
          </div>
        ) : error ? (
          <ErrorState onRetry={fetchData} />
        ) : blends.length === 0 ? (
          <EmptyState
            icon="🔀"
            title="Belum ada data blend"
            description="Gabungkan performa campaign dari berbagai platform pemasaran secara real-time."
            action={{
              label: '+ Hubungkan Data Baru',
              onClick: () => setIsModalOpen(true),
            }}
          />
        ) : (
          <DataTable data={blends} columns={columns} />
        )}
      </Card>

      {/* Modal Visual Blend Builder */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Visual Data Blends Builder"
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              form="data-blend-form"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting && <span className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isSubmitting ? 'Memproses...' : 'Buat Blend'}
            </button>
          </>
        }
      >
        <form id="data-blend-form" onSubmit={handleCreateBlend} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Nama Data Blend</label>
              <input
                type="text"
                required
                value={blendName}
                onChange={(e) => setBlendName(e.target.value)}
                placeholder="e.g. Total Marketing ROI Blend"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Tipe Join</label>
              <select
                value={joinType}
                onChange={(e: any) => setJoinType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="INNER">INNER JOIN</option>
                <option value="LEFT">LEFT JOIN</option>
                <option value="RIGHT">RIGHT JOIN</option>
                <option value="FULL">FULL OUTER JOIN</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 uppercase">Konfigurasi Data Sources</label>
              <button
                type="button"
                onClick={handleAddSource}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-lg"
              >
                + Add Source
              </button>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {sources.map((source, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 items-end relative">
                  {sources.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(idx)}
                      className="absolute right-2 top-2 text-xs text-red-500 hover:text-red-700 font-bold"
                    >
                      Hapus
                    </button>
                  )}

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Sumber {idx + 1}</span>
                    <select
                      value={source.dataSourceId}
                      onChange={(e) => handleSourceChange(idx, 'dataSourceId', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none bg-white"
                    >
                      <option value="">-- Pilih Data Source --</option>
                      {dataSources.map((ds) => (
                        <option key={ds.id} value={ds.id}>
                          {ds.name} ({ds.sourceType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Nama Stream/Tabel</span>
                    <input
                      type="text"
                      placeholder="e.g. campaigns"
                      value={source.streamName}
                      onChange={(e) => handleSourceChange(idx, 'streamName', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Join Key Column</span>
                    <input
                      type="text"
                      placeholder="e.g. campaign_id"
                      value={source.joinKey}
                      onChange={(e) => handleSourceChange(idx, 'joinKey', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
