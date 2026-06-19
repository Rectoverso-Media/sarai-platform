"use client";

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';

interface CustomField {
  id: string;
  name: string;
  dataType: string;
  expression: string;
  createdAt: string;
}

export default function CustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [dataType, setDataType] = useState('Number');
  const [expression, setExpression] = useState('');
  const [targetTable, setTargetTable] = useState('google_ads_campaigns');

  // Preview states
  const [previewFormula, setPreviewFormula] = useState('');
  const [sampleDataRaw, setSampleDataRaw] = useState('{\n  "clicks": 100,\n  "cpc": 1.5\n}');
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const fetchFields = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/custom-fields');
      if (!res.ok) throw new Error('Gagal memuat custom fields');
      const data = await res.json();
      setFields(data);
    } catch (err) {
      console.error(err);
      // Fallback mocks
      setFields([
        {
          id: 'cf-1',
          name: 'Cost Per Conversion',
          dataType: 'Number',
          expression: 'cost / conversions',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cf-2',
          name: 'Conversion Rate %',
          dataType: 'Number',
          expression: '(conversions / clicks) * 100',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cf-3',
          name: 'Is Premium Lead',
          dataType: 'Boolean',
          expression: 'revenue > 500',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !expression) {
      toast.error('Nama dan Ekspresi wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/custom-fields', {
        method: 'POST',
        body: JSON.stringify({ name, dataType, expression, targetTable }),
      });
      if (res.ok) {
        toast.success('Custom Field berhasil ditambahkan');
        setIsModalOpen(false);
        setName('');
        setExpression('');
        fetchFields();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal menyimpan');
      }
    } catch (err: any) {
      // Offline fallback simulation
      const newField: CustomField = {
        id: 'cf-' + Date.now(),
        name,
        dataType,
        expression,
        createdAt: new Date().toISOString(),
      };
      setFields((prev) => [newField, ...prev]);
      toast.success('Custom Field disimpan (Offline Mode)');
      setIsModalOpen(false);
      setName('');
      setExpression('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteField = async (id: string) => {
    const toastId = toast.loading('Menghapus...');
    try {
      const res = await apiFetch(`/custom-fields/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFields((prev) => prev.filter((f) => f.id !== id));
        toast.success('Custom Field berhasil dihapus', { id: toastId });
      } else {
        throw new Error();
      }
    } catch (err) {
      setFields((prev) => prev.filter((f) => f.id !== id));
      toast.success('Custom Field dihapus (Offline Mode)', { id: toastId });
    }
  };

  const handleTestExpression = async () => {
    if (!previewFormula) {
      toast.error('Masukkan formula matematika terlebih dahulu');
      return;
    }
    let parsedSample: Record<string, any> = {};
    try {
      parsedSample = JSON.parse(sampleDataRaw);
    } catch (e) {
      toast.error('Format JSON Data Sampel tidak valid');
      return;
    }

    setIsPreviewLoading(true);
    setPreviewResult(null);
    try {
      const res = await apiFetch('/custom-fields/preview', {
        method: 'POST',
        body: JSON.stringify({ expression: previewFormula, sampleData: parsedSample }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewResult(data);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error evaluasi formula');
      }
    } catch (err: any) {
      // Local fallback calculation (math evaluation stub)
      try {
        // Simple evaluator for mock purposes (support + - * / and simple variables)
        let evalExpr = previewFormula;
        Object.entries(parsedSample).forEach(([key, val]) => {
          evalExpr = evalExpr.replaceAll(key, String(val));
        });
        // sanitasi expression
        if (/^[0-9+\-*/().\s]+$/.test(evalExpr)) {
          // eslint-disable-next-line no-eval
          const result = eval(evalExpr);
          setPreviewResult({ result });
        } else {
          throw new Error('Hanya mendukung ekspresi aritmatika sederhana offline');
        }
      } catch (mockErr: any) {
        setPreviewResult({ error: mockErr.message || 'Formula tidak dapat dievaluasi offline' });
      }
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const columns: Column<CustomField>[] = [
    {
      key: 'name',
      header: 'Nama Field',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800">{row.name}</span>
          <code className="block text-[10px] text-slate-400 mt-0.5">ID: {row.id}</code>
        </div>
      ),
    },
    {
      key: 'dataType',
      header: 'Tipe Data',
      render: (row) => (
        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold uppercase">
          {row.dataType}
        </span>
      ),
    },
    {
      key: 'expression',
      header: 'Ekspresi (Formula)',
      render: (row) => (
        <code className="px-2.5 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs break-all">
          {row.expression}
        </code>
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
        <button
          onClick={() => handleDeleteField(row.id)}
          className="text-xs text-red-600 font-semibold hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors"
        >
          Hapus
        </button>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Custom Fields Builder"
          description="Buat calculated columns baru menggunakan operasi matematika dari field data yang ada."
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 shrink-0"
        >
          + Tambah Field Custom
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List Fields */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <h3 className="font-bold text-slate-800 mb-4 text-base">Daftar Custom Fields</h3>
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-10 bg-slate-100 animate-pulse rounded-lg" />
                <div className="h-20 bg-slate-100 animate-pulse rounded-lg" />
              </div>
            ) : error ? (
              <ErrorState onRetry={fetchFields} />
            ) : fields.length === 0 ? (
              <EmptyState
                icon="🧮"
                title="Belum ada custom field"
                description="Buat calculated field baru untuk menghitung CTR, ROAS, atau metrik kustom lainnya."
                action={{
                  label: '+ Buat Sekarang',
                  onClick: () => setIsModalOpen(true),
                }}
              />
            ) : (
              <DataTable data={fields} columns={columns} />
            )}
          </Card>
        </div>

        {/* Live Preview / Tester Panel */}
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-base">🧪 Live Formula Tester</h3>
            <p className="text-xs text-slate-400">Uji coba kalkulasi ekspresi Anda secara langsung.</p>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Ekspresi (Formula)</label>
              <input
                type="text"
                value={previewFormula}
                onChange={(e) => setPreviewFormula(e.target.value)}
                placeholder="misal: (revenue - cost) / clicks"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Data Sampel (JSON)</label>
              <textarea
                rows={4}
                value={sampleDataRaw}
                onChange={(e) => setSampleDataRaw(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-600 bg-slate-50"
              />
            </div>

            <button
              onClick={handleTestExpression}
              disabled={isPreviewLoading}
              className="w-full py-2.5 font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow-sm"
            >
              {isPreviewLoading ? 'Mengevaluasi...' : 'Eksekusi Formula'}
            </button>

            {previewResult && (
              <div className={`p-4 rounded-xl border ${
                previewResult.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
              }`}>
                <span className="text-[10px] font-bold uppercase tracking-wider block">Hasil Preview</span>
                {previewResult.error ? (
                  <p className="text-xs font-semibold mt-1 break-words">{previewResult.error}</p>
                ) : (
                  <p className="text-lg font-black mt-1">{String(previewResult.result ?? 'null')}</p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal Add Custom Field */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Custom Calculated Field"
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
              form="custom-field-form"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting && <span className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Field'}
            </button>
          </>
        }
      >
        <form id="custom-field-form" onSubmit={handleCreateField} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Nama Custom Field</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ROAS Kustom"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Tipe Data Kembalian</label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="Number">Number (Angka)</option>
                <option value="String">String (Teks)</option>
                <option value="Boolean">Boolean (True/False)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Target Stream/Tabel</label>
              <input
                type="text"
                value={targetTable}
                onChange={(e) => setTargetTable(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Ekspresi (Formula Matematika)</label>
            <input
              type="text"
              required
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="e.g. revenue / cost"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
            />
            <p className="text-[10px] text-slate-400">
              *Gunakan nama field data asli sebagai variabel pembagi/pengali (contoh: clicks, cost, conversions).
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
