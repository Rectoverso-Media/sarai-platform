"use client";
import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../../../lib/api";
import toast from "react-hot-toast";

type WTable = {
  id: string;
  tableName: string;
  schema: { name: string; type: string }[];
  retentionDays: number | null;
  rowCount: number;
  createdAt: string;
};

type PagedData = { data: any[]; total: number; page: number; totalPages: number };

export default function WarehousePage() {
  const [tables, setTables] = useState<WTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<WTable | null>(null);
  const [tableData, setTableData] = useState<PagedData | null>(null);
  const [dataPage, setDataPage] = useState(1);
  const [importModal, setImportModal] = useState<"query" | "blend" | "csv" | null>(null);
  const [importInput, setImportInput] = useState("");
  const csvFileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ tableName: "", retentionDays: "", columns: [{ name: "", type: "string" }] });

  const fetchTables = async () => {
    try {
      const res = await apiFetch("/warehouse/tables");
      if (res.ok) setTables(await res.json());
    } catch { toast.error("Gagal memuat warehouse tables"); }
    finally { setIsLoading(false); }
  };

  const fetchTableData = async (tableId: string, page = 1) => {
    try {
      const res = await apiFetch(`/warehouse/tables/${tableId}/data?page=${page}&limit=50`);
      if (res.ok) { setTableData(await res.json()); setDataPage(page); }
    } catch { toast.error("Gagal memuat data"); }
  };

  useEffect(() => { fetchTables(); }, []);

  const openTable = (t: WTable) => { setSelectedTable(t); fetchTableData(t.id, 1); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = toast.loading("Membuat tabel warehouse...");
    try {
      const res = await apiFetch("/warehouse/tables", {
        method: "POST",
        body: JSON.stringify({
          tableName: form.tableName,
          schema: form.columns.filter((c) => c.name),
          retentionDays: form.retentionDays ? parseInt(form.retentionDays) : null,
        }),
      });
      if (res.ok) {
        toast.success("Tabel berhasil dibuat!", { id });
        setShowCreateModal(false);
        setForm({ tableName: "", retentionDays: "", columns: [{ name: "", type: "string" }] });
        fetchTables();
      } else {
        const err = await res.json();
        toast.error(err.message || "Gagal membuat tabel", { id });
      }
    } catch { toast.error("Koneksi gagal", { id }); }
  };

  const handleDelete = async (tableId: string, tableName: string) => {
    const id = toast.loading(`Menghapus "${tableName}"...`);
    try {
      const res = await apiFetch(`/warehouse/tables/${tableId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Tabel dihapus!", { id });
        if (selectedTable?.id === tableId) setSelectedTable(null);
        fetchTables();
      } else toast.error("Gagal menghapus", { id });
    } catch { toast.error("Koneksi gagal", { id }); }
  };

  const handleImport = async () => {
    if (!selectedTable) return;
    const id = toast.loading("Mengimport data...");
    try {
      let res: Response;
      if (importModal === "query") {
        res = await apiFetch(`/warehouse/tables/${selectedTable.id}/import/query`, { method: "POST", body: JSON.stringify({ queryId: importInput }) });
      } else if (importModal === "blend") {
        res = await apiFetch(`/warehouse/tables/${selectedTable.id}/import/blend`, { method: "POST", body: JSON.stringify({ blendId: importInput }) });
      } else {
        const file = csvFileRef.current?.files?.[0];
        if (!file) { toast.error("Pilih file CSV terlebih dahulu", { id }); return; }
        const formData = new FormData();
        formData.append("file", file);
        const rawRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/warehouse/tables/${selectedTable.id}/import/csv`,
          { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }, body: formData }
        );
        res = rawRes;
      }
      const data = await res.json();
      if (res.ok) {
        toast.success(`✅ ${data.inserted} baris berhasil diimport!`, { id });
        setImportModal(null);
        setImportInput("");
        fetchTables();
        fetchTableData(selectedTable.id, 1);
      } else toast.error(data.message || "Import gagal", { id });
    } catch { toast.error("Koneksi gagal", { id }); }
  };

  const addColumn = () => setForm({ ...form, columns: [...form.columns, { name: "", type: "string" }] });
  const removeColumn = (idx: number) => setForm({ ...form, columns: form.columns.filter((_, i) => i !== idx) });
  const updateColumn = (idx: number, field: "name" | "type", val: string) => {
    const cols = [...form.columns];
    cols[idx] = { ...cols[idx], [field]: val };
    setForm({ ...form, columns: cols });
  };

  const tableColumns = tableData?.data?.[0] ? Object.keys(tableData.data[0]).filter((k) => k !== "id") : [];

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-poppins font-black text-slate-800 tracking-tight">Data Warehouse</h1>
          <p className="text-slate-500 text-sm mt-1">Simpan hasil query dan blend ke tabel warehouse dengan retention otomatis.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all">
          + New Table
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Tables", value: tables.length, icon: "🗄️" },
          { label: "Total Rows", value: tables.reduce((sum, t) => sum + t.rowCount, 0).toLocaleString(), icon: "📊" },
          { label: "With Retention", value: tables.filter((t) => t.retentionDays).length, icon: "🔄" },
          { label: "Kolom Terdefinisi", value: tables.reduce((sum, t) => sum + (t.schema?.length || 0), 0), icon: "📋" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-2xl">{s.icon}</span>
            <p className="text-xl font-black text-slate-800 mt-1">{s.value}</p>
            <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Table List */}
        <div className="col-span-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100"><p className="font-bold text-slate-700 text-sm">Warehouse Tables</p></div>
          {isLoading ? (
            <div className="p-6 text-center text-slate-400 animate-pulse">Loading...</div>
          ) : tables.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">Belum ada tabel.<br />Klik "+ New Table"</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tables.map((t) => (
                <div
                  key={t.id}
                  onClick={() => openTable(t)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${selectedTable?.id === t.id ? "bg-blue-50 border-l-2 border-blue-500" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{t.tableName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.rowCount.toLocaleString()} rows · {t.schema?.length || 0} kolom</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {t.retentionDays && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">{t.retentionDays}d</span>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.tableName); }}
                        className="text-red-400 hover:text-red-600 text-xs transition-colors">🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table Data View */}
        <div className="col-span-2">
          {!selectedTable ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl h-full flex items-center justify-center text-center p-8">
              <div>
                <span className="text-5xl">🗄️</span>
                <p className="mt-3 font-semibold text-slate-600">Pilih tabel dari panel kiri</p>
                <p className="text-sm text-slate-400 mt-1">Data dan opsi import akan muncul di sini</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800">{selectedTable.tableName}</p>
                  <p className="text-xs text-slate-400">{tableData?.total.toLocaleString() || 0} total rows</p>
                </div>
                <div className="flex gap-2">
                  {(["query", "blend", "csv"] as const).map((type) => (
                    <button key={type} onClick={() => setImportModal(type)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors capitalize">
                      ⬆ {type === "csv" ? "CSV" : `from ${type}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {!tableData || tableData.data.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-3xl mb-2">📭</p>
                    <p className="font-semibold">Tabel masih kosong</p>
                    <p className="text-xs mt-1">Import data dari Query, Blend, atau file CSV</p>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider font-bold sticky top-0">
                      <tr>
                        {tableColumns.map((col) => <th key={col} className="px-4 py-3">{col}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tableData.data.map((row, i) => (
                        <tr key={row.id || i} className="hover:bg-slate-50">
                          {tableColumns.map((col) => (
                            <td key={col} className="px-4 py-2.5 text-xs text-slate-600 max-w-[120px] truncate" title={String(row[col] ?? "")}>
                              {String(row[col] ?? "—")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {tableData && tableData.totalPages > 1 && (
                <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span>Page {tableData.page} of {tableData.totalPages}</span>
                  <div className="flex gap-2">
                    <button disabled={dataPage <= 1} onClick={() => fetchTableData(selectedTable.id, dataPage - 1)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold disabled:opacity-40">← Prev</button>
                    <button disabled={dataPage >= tableData.totalPages} onClick={() => fetchTableData(selectedTable.id, dataPage + 1)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold disabled:opacity-40">Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Table Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">🗄️ New Warehouse Table</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Tabel</label>
                <input required value={form.tableName} onChange={(e) => setForm({ ...form, tableName: e.target.value })} placeholder="e.g. sales_data" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Retention (hari, kosongkan = selamanya)</label>
                <input type="number" value={form.retentionDays} onChange={(e) => setForm({ ...form, retentionDays: e.target.value })} placeholder="e.g. 30" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-600">Kolom</label>
                  <button type="button" onClick={addColumn} className="text-xs text-blue-600 font-bold hover:text-blue-700">+ Tambah Kolom</button>
                </div>
                <div className="space-y-2">
                  {form.columns.map((col, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input value={col.name} onChange={(e) => updateColumn(idx, "name", e.target.value)} placeholder="nama_kolom" className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20" />
                      <select value={col.type} onChange={(e) => updateColumn(idx, "type", e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                      </select>
                      {form.columns.length > 1 && <button type="button" onClick={() => removeColumn(idx)} className="text-red-400 hover:text-red-600 font-bold">×</button>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition-colors">Batal</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-colors">Buat Tabel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">⬆ Import {importModal === "csv" ? "CSV" : `from ${importModal}`}</h2>
              <button onClick={() => setImportModal(null)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              {importModal === "csv" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Pilih File CSV</label>
                  <input ref={csvFileRef} type="file" accept=".csv" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">{importModal === "query" ? "Query" : "Blend"} ID</label>
                  <input value={importInput} onChange={(e) => setImportInput(e.target.value)} placeholder={`ID dari ${importModal}`} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setImportModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition-colors">Batal</button>
                <button onClick={handleImport} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-colors">Import</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
