"use client";
import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../../lib/api";
import toast from "react-hot-toast";

type Transfer = {
  id: string;
  name: string;
  targetType: string;
  configData: any;
  source: { id: string; name: string; sourceType: string } | null;
  executions: { status: string; executedAt: string; recordsMoved: number }[];
  createdAt: string;
};

type SourceOption = { id: string; name: string; type: string };

const WriteModeBadge = ({ mode }: { mode: string }) => {
  const styles: Record<string, string> = {
    append: "bg-blue-100 text-blue-700",
    replace: "bg-amber-100 text-amber-700",
    update: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${styles[mode] || "bg-slate-100 text-slate-600"}`}>
      {mode?.toUpperCase() || "APPEND"}
    </span>
  );
};

const StatusBadge = ({ status }: { status?: string }) => {
  if (!status) return <span className="text-xs text-slate-400">—</span>;
  const styles: Record<string, string> = {
    SUCCESS: "bg-emerald-100 text-emerald-700",
    FAILED: "bg-red-100 text-red-700",
    RUNNING: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
};

const defaultForm = {
  name: "",
  sourceId: "",
  sourceType: "datasource",
  queryId: "",
  blendId: "",
  targetType: "Google Sheets",
  spreadsheetId: "",
  sheetName: "Sheet1",
  writeMode: "append",
  scheduleExpression: "",
};

export default function DataTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  // Source dropdown options
  const [dataSources, setDataSources] = useState<SourceOption[]>([]);
  const [queries, setQueries] = useState<SourceOption[]>([]);
  const [blends, setBlends] = useState<SourceOption[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  const fetchTransfers = useCallback(async () => {
    try {
      const res = await apiFetch("/data-transfers");
      if (res.ok) setTransfers(await res.json());
    } catch {
      toast.error("Gagal memuat data transfers");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSourceOptions = async () => {
    setLoadingSources(true);
    try {
      const [dsRes, qRes, bRes] = await Promise.all([
        apiFetch("/datasources"),
        apiFetch("/queries"),
        apiFetch("/blends"),
      ]);
      if (dsRes.ok) {
        const data = await dsRes.json();
        setDataSources((data.data || data).map((d: any) => ({ id: d.id, name: d.name, type: d.sourceType || d.connectorName })));
      }
      if (qRes.ok) {
        const data = await qRes.json();
        setQueries((data.data || data).map((q: any) => ({ id: q.id, name: q.name, type: "Query" })));
      }
      if (bRes.ok) {
        const data = await bRes.json();
        setBlends((Array.isArray(data) ? data : data.data || []).map((b: any) => ({ id: b.id, name: b.name, type: "Blend" })));
      }
    } catch {
      // Fallback: sumber options tidak berpengaruh ke fungsi utama
    } finally {
      setLoadingSources(false);
    }
  };

  useEffect(() => { fetchTransfers(); }, [fetchTransfers]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(defaultForm);
    fetchSourceOptions();
    setShowModal(true);
  };

  const openEditModal = (t: Transfer) => {
    const cfg = t.configData || {};
    setEditingId(t.id);
    setForm({
      name: t.name,
      sourceId: t.source?.id || "",
      sourceType: cfg.sourceType || "datasource",
      queryId: cfg.queryId || "",
      blendId: cfg.blendId || "",
      targetType: t.targetType || "Google Sheets",
      spreadsheetId: cfg.spreadsheetId || "",
      sheetName: cfg.sheetName || "Sheet1",
      writeMode: cfg.writeMode || "append",
      scheduleExpression: cfg.scheduleExpression || "",
    });
    fetchSourceOptions();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(editingId ? "Menyimpan perubahan..." : "Menyimpan konfigurasi transfer...");
    try {
      const url = editingId ? `/data-transfers/${editingId}` : "/data-transfers";
      const method = editingId ? "PATCH" : "POST";
      const res = await apiFetch(url, { method, body: JSON.stringify(form) });
      if (res.ok) {
        toast.success(editingId ? "Transfer diperbarui!" : "Transfer berhasil dibuat!", { id: toastId });
        setShowModal(false);
        fetchTransfers();
      } else {
        const err = await res.json();
        toast.error(err.message || "Gagal menyimpan", { id: toastId });
      }
    } catch {
      toast.error("Koneksi ke server gagal", { id: toastId });
    }
  };

  const handleRun = async (transferId: string, name: string) => {
    setRunningId(transferId);
    const toastId = toast.loading(`Menjalankan transfer "${name}"...`);
    try {
      const res = await apiFetch(`/data-transfers/${transferId}/run`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`✅ ${data.message}`, { id: toastId });
        fetchTransfers();
      } else {
        toast.error(data.message || "Transfer gagal", { id: toastId });
      }
    } catch {
      toast.error("Koneksi gagal", { id: toastId });
    } finally {
      setRunningId(null);
    }
  };

  const handleDownloadExcel = async (transferId: string, name: string) => {
    setDownloadingId(transferId);
    const toastId = toast.loading("Menyiapkan file Excel...");
    try {
      const res = await apiFetch(`/data-transfers/${transferId}/export-excel`);
      if (!res.ok) throw new Error("Gagal");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}-export.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Excel berhasil diunduh!", { id: toastId });
    } catch {
      toast.error("Gagal mengunduh Excel", { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (transferId: string, name: string) => {
    if (!confirm(`Hapus transfer "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    const toastId = toast.loading("Menghapus transfer...");
    try {
      const res = await apiFetch(`/data-transfers/${transferId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Transfer dihapus!", { id: toastId });
        fetchTransfers();
      } else {
        toast.error("Gagal menghapus", { id: toastId });
      }
    } catch {
      toast.error("Koneksi gagal", { id: toastId });
    }
  };

  const sourceOptions: SourceOption[] =
    form.sourceType === "query" ? queries :
    form.sourceType === "blend" ? blends :
    dataSources;

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-poppins font-black text-slate-800 tracking-tight">
            Data Transfers
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Push hasil query & blend ke Google Sheets atau Excel secara otomatis.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <span className="text-lg">+</span> New Transfer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Transfers", value: transfers.length, icon: "🔄" },
          {
            label: "Sukses (30 hari)",
            value: transfers.filter((t) => t.executions?.[0]?.status === "SUCCESS").length,
            icon: "✅",
          },
          { label: "Terjadwal", value: transfers.filter((t) => (t.configData as any)?.scheduleExpression).length, icon: "⏰" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-2xl">{stat.icon}</span>
            <p className="text-2xl font-black text-slate-800 mt-2">{stat.value}</p>
            <p className="text-xs text-slate-500 font-semibold">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-widest font-bold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Nama</th>
              <th className="px-6 py-4">Sumber</th>
              <th className="px-6 py-4">Target</th>
              <th className="px-6 py-4">Write Mode</th>
              <th className="px-6 py-4">Jadwal</th>
              <th className="px-6 py-4">Last Run</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                  <span className="animate-pulse">Memuat data...</span>
                </td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <span className="text-4xl block mb-3">🔄</span>
                  <p className="font-semibold text-slate-600">Belum ada transfer.</p>
                  <p className="text-sm text-slate-400 mt-1">Klik "+ New Transfer" untuk memulai.</p>
                </td>
              </tr>
            ) : (
              transfers.map((t) => {
                const cfg = t.configData || {};
                const lastExec = t.executions?.[0];
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{t.name}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {t.source?.name || "—"}
                      <span className="ml-1 text-slate-400">({cfg.sourceType || "datasource"})</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-600">{t.targetType}</span>
                      <br />
                      <span className="text-[10px] text-slate-400 font-mono">{cfg.sheetName || "Sheet1"}</span>
                    </td>
                    <td className="px-6 py-4"><WriteModeBadge mode={cfg.writeMode} /></td>
                    <td className="px-6 py-4">
                      {cfg.scheduleExpression ? (
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{cfg.scheduleExpression}</span>
                      ) : (
                        <span className="text-xs text-slate-300">Manual</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {lastExec ? new Date(lastExec.executedAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={lastExec?.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleRun(t.id, t.name)}
                          disabled={runningId === t.id}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {runningId === t.id ? "Running..." : "▶ Run"}
                        </button>
                        <button
                          onClick={() => handleDownloadExcel(t.id, t.name)}
                          disabled={downloadingId === t.id}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {downloadingId === t.id ? "..." : "⬇ Excel"}
                        </button>
                        <button
                          onClick={() => openEditModal(t)}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "✏️ Edit Transfer" : "🔄 New Data Transfer"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Transfer</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Daily Sales to Sheets"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tipe Sumber</label>
                  <select
                    value={form.sourceType}
                    onChange={(e) => setForm({ ...form, sourceType: e.target.value, sourceId: "", queryId: "", blendId: "" })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="datasource">Data Source</option>
                    <option value="query">Query Result</option>
                    <option value="blend">Blend Result</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Write Mode</label>
                  <select
                    value={form.writeMode}
                    onChange={(e) => setForm({ ...form, writeMode: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="append">Append — tambah di bawah</option>
                    <option value="replace">Replace — hapus & tulis ulang</option>
                    <option value="update">Update — update baris existing</option>
                  </select>
                </div>
              </div>

              {/* Source Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {form.sourceType === "query" ? "Query" : form.sourceType === "blend" ? "Blend" : "Data Source"}
                </label>
                <select
                  required
                  value={form.sourceType === "query" ? form.queryId : form.sourceType === "blend" ? form.blendId : form.sourceId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (form.sourceType === "query") setForm({ ...form, queryId: val, sourceId: val });
                    else if (form.sourceType === "blend") setForm({ ...form, blendId: val, sourceId: val });
                    else setForm({ ...form, sourceId: val });
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">{loadingSources ? "Memuat..." : `Pilih ${form.sourceType}...`}</option>
                  {sourceOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.name} ({opt.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Google Spreadsheet ID</label>
                <input
                  required
                  value={form.spreadsheetId}
                  onChange={(e) => setForm({ ...form, spreadsheetId: e.target.value })}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Sheet / Tab Name</label>
                  <input
                    value={form.sheetName}
                    onChange={(e) => setForm({ ...form, sheetName: e.target.value })}
                    placeholder="Sheet1"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Jadwal Cron <span className="text-slate-400 font-normal">(opsional)</span>
                  </label>
                  <input
                    value={form.scheduleExpression}
                    onChange={(e) => setForm({ ...form, scheduleExpression: e.target.value })}
                    placeholder="0 * * * * (tiap jam)"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-colors">
                  {editingId ? "Simpan Perubahan" : "Buat Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
