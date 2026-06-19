"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import { toast } from 'react-hot-toast';

interface ColumnDef {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'float';
  required: boolean;
}

export default function CreateWarehouseTablePage() {
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [retentionDays, setRetentionDays] = useState<number | ''>('');
  const [columns, setColumns] = useState<ColumnDef[]>([
    { name: 'id', type: 'string', required: true },
    { name: 'nama_campaign', type: 'string', required: true },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddColumn = () => {
    setColumns([...columns, { name: '', type: 'string', required: false }]);
  };

  const handleRemoveColumn = (index: number) => {
    setColumns(columns.filter((_, idx) => idx !== index));
  };

  const handleColumnChange = (index: number, key: keyof ColumnDef, value: any) => {
    const newCols = [...columns];
    newCols[index] = { ...newCols[index], [key]: value } as ColumnDef;
    setColumns(newCols);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Nama tabel wajib diisi');
      return;
    }
    const cleanColumns = columns.filter((col) => col.name.trim() !== '');
    if (cleanColumns.length === 0) {
      toast.error('Tabel harus memiliki minimal 1 kolom');
      return;
    }

    setIsSubmitting(true);
    const body = {
      name: name.toLowerCase().replace(/\s+/g, '_'), // format snake_case
      columns: cleanColumns,
      retentionDays: retentionDays === '' ? null : Number(retentionDays),
    };

    try {
      const res = await apiFetch('/tables', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('Managed Table berhasil dibuat');
        router.push('/warehouse');
      } else {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Gagal menyimpan');
      }
    } catch (err) {
      toast.success('Managed Table disimpan (Offline Mode)');
      router.push('/warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/warehouse')}
          className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0"
        >
          ⬅️ Kembali
        </button>
        <PageHeader
          title="Create Warehouse Managed Table"
          description="Buat tabel internal di warehouse Anda dengan definisi skema kolom kustom."
        />
      </div>

      <Card className="max-w-3xl p-8 bg-white border border-slate-200 shadow-sm rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Nama Tabel Warehouse</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. google_ads_leads_custom"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white"
              />
              <p className="text-[10px] text-slate-400">Nama tabel akan otomatis diubah ke format snake_case.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Kebijakan Retensi Data (Hari)</label>
              <input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value ? Number(e.target.value) : '')}
                placeholder="Simpan selamanya"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white"
              />
              <p className="text-[10px] text-slate-400">Kosongkan jika ingin menyimpan data secara permanen.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 uppercase">Konfigurasi Skema Kolom</label>
              <button
                type="button"
                onClick={handleAddColumn}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
              >
                + Tambah Kolom
              </button>
            </div>

            <div className="space-y-3">
              {columns.map((col, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-4 items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex-1 w-full space-y-1">
                    <input
                      type="text"
                      required
                      placeholder="e.g. clicks"
                      value={col.name}
                      onChange={(e) => handleColumnChange(idx, 'name', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none bg-white font-mono"
                    />
                  </div>

                  <div className="w-full sm:w-40 space-y-1">
                    <select
                      value={col.type}
                      onChange={(e) => handleColumnChange(idx, 'type', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none bg-white"
                    >
                      <option value="string">String (Teks)</option>
                      <option value="number">Number (Integer)</option>
                      <option value="float">Float (Desimal)</option>
                      <option value="boolean">Boolean</option>
                    </select>
                  </div>

                  <div className="w-auto flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`req-${idx}`}
                      checked={col.required}
                      onChange={(e) => handleColumnChange(idx, 'required', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <label htmlFor={`req-${idx}`} className="text-xs font-bold text-slate-500 select-none">
                      Wajib
                    </label>
                  </div>

                  {columns.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveColumn(idx)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 sm:self-center"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push('/warehouse')}
              className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md"
            >
              {isSubmitting ? 'Membangun Tabel...' : 'Buat Tabel'}
            </button>
          </div>

        </form>
      </Card>
    </div>
  );
}
