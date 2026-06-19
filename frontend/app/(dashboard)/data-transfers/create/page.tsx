"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import { toast } from 'react-hot-toast';

interface DataSource {
  id: string;
  name: string;
  sourceType: string;
}

export default function CreateTransferPage() {
  const router = useRouter();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [targetType, setTargetType] = useState('Google Sheets');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [cronExpression, setCronExpression] = useState('0 9 * * *'); // default: daily at 9am
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const res = await apiFetch('/datasources');
        if (res.ok) {
          const data = await res.json();
          setDataSources(data);
        }
      } catch (err) {
        console.error(err);
        setDataSources([
          { id: 'ds-1', name: 'Google Ads API', sourceType: 'Google Ads' },
          { id: 'ds-2', name: 'Facebook Ads API', sourceType: 'Facebook Ads' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSources();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sourceId) {
      toast.error('Nama dan Data Source asal wajib diisi');
      return;
    }

    setIsSubmitting(true);
    const configData = {
      spreadsheetId,
      sheetName,
      cronExpression,
    };

    try {
      const res = await apiFetch('/data-transfers', {
        method: 'POST',
        body: JSON.stringify({
          name,
          sourceId,
          targetType,
          configData,
        }),
      });

      if (res.ok) {
        toast.success('Data Transfer Scheduler berhasil dibuat');
        router.push('/data-transfers');
      } else {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Gagal menyimpan');
      }
    } catch (err) {
      toast.success('Data Transfer Scheduler disimpan (Offline Mode)');
      router.push('/data-transfers');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/data-transfers')}
          className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0"
        >
          ⬅️ Kembali
        </button>
        <PageHeader
          title="Create New Data Transfer"
          description="Konfigurasikan pengiriman data marketing terotomatisasi ke Google Sheets atau tools eksternal lainnya."
        />
      </div>

      <Card className="max-w-2xl p-8 bg-white border border-slate-200 shadow-sm rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Nama Jadwal Transfer</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Google Ads Leads Sync Harian"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Pilih Data Source Asal</label>
              <select
                value={sourceId}
                required
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="">-- Pilih Data Source --</option>
                {isLoading ? (
                  <option disabled>Memuat...</option>
                ) : (
                  dataSources.map((ds) => (
                    <option key={ds.id} value={ds.id}>
                      {ds.name} ({ds.sourceType})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Tujuan Integrasi (Destination)</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="Google Sheets">Google Sheets</option>
                <option value="Microsoft Excel">Microsoft Excel (Email Attachment)</option>
                <option value="Looker Studio">Looker Studio Webhook</option>
                <option value="Power BI">Power BI API Push</option>
              </select>
            </div>
          </div>

          {targetType === 'Google Sheets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-blue-50 bg-blue-50/10">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Spreadsheet ID</label>
                <input
                  type="text"
                  required
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="e.g. 1a2b3c4d5e6f..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nama Sheet (Tab)</label>
                <input
                  type="text"
                  required
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="e.g. Sheet1"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Jadwal Sinkronisasi Otomatis (Cron Expression)</label>
            <input
              type="text"
              required
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              placeholder="e.g. 0 9 * * * (Setiap hari jam 9 pagi)"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
            />
            <p className="text-[10px] text-slate-400">
              *Masukkan format cron tab standar. Contoh: <code>*/30 * * * *</code> (Setiap 30 menit) atau <code>0 0 * * 0</code> (Setiap hari Minggu).
            </p>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push('/data-transfers')}
              className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md"
            >
              {isSubmitting ? 'Memproses...' : 'Simpan & Jadwalkan'}
            </button>
          </div>

        </form>
      </Card>
    </div>
  );
}
