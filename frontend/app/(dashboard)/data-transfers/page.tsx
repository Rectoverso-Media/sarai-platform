"use client";
import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../../../lib/api";
import toast from "react-hot-toast";

type Transfer = {
  id: string;
  name: string;
  targetType: string;
  configData: any;
  source: { name: string; sourceType: string } | null;
  executions: { status: string; executedAt: string; recordsMoved: number }[];
  createdAt: string;
};

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

export default function DataTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    sourceId: "",
    sourceType: "datasource",
    queryId: "",
    blendId: "",
    targetType: "Google Sheets",
    spreadsheetId: "",
    sheetName: "Sheet1",
    writeMode: "append",
  });

  const fetchTransfers = async () => {
    try {
      const res = await apiFetch("/data-transfers");
      if (res.ok) setTransfers(await res.json());
    } catch {
      toast.error("Gagal memuat data transfers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTransfers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = toast.loading("Menyimpan konfigurasi transfer...");
    try {
      const res = await apiFetch("/data-transfers", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Transfer berhasil dibuat!", { id });
        setShowModal(false);
        fetchTransfers();
      } else {
        const err = await res.json();
        toast.error(err.message || "Gagal membuat transfer", { id });
      }
    } catch {
      toast.error("Koneksi ke server gagal", { id });
    }
  };

  const handleRun = async (transferId: string, name: string) => {
    setRunningId(transferId);
    const id = toast.loading(`Menjalankan transfer "${name}"...`);
    try {
      const res = await apiFetch(`/data-transfers/${transferId}/run`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`✅ ${data.message}`, { id });
        fetchTransfers();
      } else {
        toast.error(data.message || "Transfer gagal", { id });
      }
    } catch {
      toast.error("Koneksi gagal", { id });
    } finally {
      setRunningId(null);
    }
  };

  const handleDownloadExcel = async (transferId: string, name: string) => {
    setDownloadingId(transferId);
    const id = toast.loading("Menyiapkan file Excel...");
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
      toast.success("Excel berhasil diunduh!", { id });
    } catch {
      toast.error("Gagal mengunduh Excel", { id });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (transferId: string) => {
    const id = toast.loading("Menghapus transfer...");
    try {
      const res = await apiFetch(`/data-transfers/${transferId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Transfer dihapus!", { id });
        fetchTransfers();
      } else {
        toast.error("Gagal menghapus", { id });
      }
    } catch {
      toast.error("Koneksi gagal", { id });
    }
  };

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
          onClick={() => setShowModal(true)}
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
          { label: "Target GSheets", value: transfers.filter((t) => t.targetType === "Google Sheets").length, icon: "📊" },
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
              <th className="px-6 py-4">Last Run</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                  <span className="animate-pulse">Memuat data...</span>
                </td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
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
                          onClick={() => handleDelete(t.id)}
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-in fade-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">🔄 New Data Transfer</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
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
                    onChange={(e) => setForm({ ...form, sourceType: e.target.value })}
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
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Source ID (DataSource / Query / Blend)</label>
                <input
                  required
                  value={form.sourceId}
                  onChange={(e) => setForm({ ...form, sourceId: e.target.value })}
                  placeholder="ID dari sumber data"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
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
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Sheet / Tab Name</label>
                <input
                  value={form.sheetName}
                  onChange={(e) => setForm({ ...form, sheetName: e.target.value })}
                  placeholder="Sheet1"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition-colors">
                  Batal
                </button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-colors">
                  Buat Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
