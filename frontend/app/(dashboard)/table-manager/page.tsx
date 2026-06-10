"use client";
import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../../../lib/api";
import toast from "react-hot-toast";

type ManagedTable = {
  id: string;
  name: string;
  columns: { name: string; type: string; required?: boolean }[] | null;
  rowCount: number;
  createdAt: string;
};

type TableRow = { id: string; [key: string]: any };
type PagedRows = { data: TableRow[]; total: number; page: number; totalPages: number };

export default function TableManagerPage() {
  const [tables, setTables] = useState<ManagedTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<ManagedTable | null>(null);
  const [rows, setRows] = useState<PagedRows | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [showRowModal, setShowRowModal] = useState<{ mode: "create" | "edit"; row?: TableRow } | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [rowFormData, setRowFormData] = useState<Record<string, string>>({});
  const csvRef = useRef<HTMLInputElement>(null);

  const [tableForm, setTableForm] = useState({
    name: "",
    columns: [{ name: "", type: "string", required: false }],
  });

  const fetchTables = async () => {
    try {
      const res = await apiFetch("/tables");
      if (res.ok) setTables(await res.json());
    } catch { toast.error("Gagal memuat tabel"); }
    finally { setIsLoading(false); }
  };

  const fetchRows = async (tableId: string, page = 1) => {
    try {
      const res = await apiFetch(`/tables/${tableId}/rows?page=${page}&limit=50`);
      if (res.ok) { setRows(await res.json()); setCurrentPage(page); }
    } catch { toast.error("Gagal memuat baris data"); }
  };

  useEffect(() => { fetchTables(); }, []);

  const openTable = (t: ManagedTable) => {
    setSelectedTable(t);
    setSelectedRowIds(new Set());
    fetchRows(t.id, 1);
  };

  // ── CREATE TABLE ──────────────────────────────────────────────────────────
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = toast.loading("Membuat tabel...");
    try {
      const res = await apiFetch("/tables", {
        method: "POST",
        body: JSON.stringify({ name: tableForm.name, columns: tableForm.columns.filter((c) => c.name) }),
      });
      if (res.ok) {
        toast.success("Tabel berhasil dibuat!", { id });
        setShowCreateTableModal(false);
        setTableForm({ name: "", columns: [{ name: "", type: "string", required: false }] });
        fetchTables();
      } else {
        const err = await res.json();
        toast.error(err.message || "Gagal", { id });
      }
    } catch { toast.error("Koneksi gagal", { id }); }
  };

  const handleDeleteTable = async (tableId: string, tableName: string) => {
    if (!confirm(`Hapus tabel "${tableName}" beserta semua datanya? Tindakan ini tidak dapat dibatalkan.`)) return;
    const id = toast.loading(`Menghapus "${tableName}"...`);
    try {
      const res = await apiFetch(`/tables/${tableId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Tabel dihapus!", { id });
        if (selectedTable?.id === tableId) { setSelectedTable(null); setRows(null); }
        fetchTables();
      } else toast.error("Gagal menghapus", { id });
    } catch { toast.error("Koneksi gagal", { id }); }
  };

  // ── ROW OPERATIONS ────────────────────────────────────────────────────────
  const getColumns = () => selectedTable?.columns?.filter((c) => c.name) || (rows?.data?.[0] ? Object.keys(rows.data[0]).filter((k) => k !== "id").map((k) => ({ name: k, type: "string", required: false })) : []);

  const handleSaveRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    const isEdit = showRowModal?.mode === "edit";
    const rowId = showRowModal?.row?.id;
    const id = toast.loading(isEdit ? "Menyimpan perubahan..." : "Menambah baris...");
    try {
      const res = await apiFetch(
        isEdit ? `/tables/${selectedTable.id}/rows/${rowId}` : `/tables/${selectedTable.id}/rows`,
        { method: isEdit ? "PATCH" : "POST", body: JSON.stringify(rowFormData) }
      );
      if (res.ok) {
        toast.success(isEdit ? "Baris diperbarui!" : "Baris ditambahkan!", { id });
        setShowRowModal(null);
        setRowFormData({});
        fetchRows(selectedTable.id, currentPage);
        fetchTables();
      } else toast.error("Gagal menyimpan", { id });
    } catch { toast.error("Koneksi gagal", { id }); }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!confirm("Hapus baris ini?")) return;
    if (!selectedTable) return;
    const id = toast.loading("Menghapus baris...");
    try {
      const res = await apiFetch(`/tables/${selectedTable.id}/rows/${rowId}`, { method: "DELETE" });
      if (res.ok) { toast.success("Dihapus!", { id }); fetchRows(selectedTable.id, currentPage); fetchTables(); }
      else toast.error("Gagal menghapus", { id });
    } catch { toast.error("Koneksi gagal", { id }); }
  };

  const handleBatchDelete = async () => {
    if (!selectedTable || selectedRowIds.size === 0) return;
    const id = toast.loading(`Menghapus ${selectedRowIds.size} baris...`);
    try {
      const res = await apiFetch(`/tables/${selectedTable.id}/rows/batch-delete`, {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selectedRowIds) }),
      });
      if (res.ok) {
        toast.success(`${selectedRowIds.size} baris dihapus!`, { id });
        setSelectedRowIds(new Set());
        fetchRows(selectedTable.id, currentPage);
        fetchTables();
      } else toast.error("Gagal batch delete", { id });
    } catch { toast.error("Koneksi gagal", { id }); }
  };

  const toggleRowSelect = (rowId: string) => {
    const next = new Set(selectedRowIds);
    next.has(rowId) ? next.delete(rowId) : next.add(rowId);
    setSelectedRowIds(next);
  };

  const toggleSelectAll = () => {
    if (!rows) return;
    if (selectedRowIds.size === rows.data.length) setSelectedRowIds(new Set());
    else setSelectedRowIds(new Set(rows.data.map((r) => r.id)));
  };

  // ── CSV ───────────────────────────────────────────────────────────────────
  const handleImportCsv = async () => {
    if (!selectedTable || !csvRef.current?.files?.[0]) { toast.error("Pilih file CSV terlebih dahulu"); return; }
    const id = toast.loading("Mengimport CSV...");
    const formData = new FormData();
    formData.append("file", csvRef.current.files[0]);
    try {
      const rawRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/tables/${selectedTable.id}/import`,
        { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }, body: formData }
      );
      const data = await rawRes.json();
      if (rawRes.ok) {
        toast.success(`✅ ${data.inserted} baris diimport!`, { id });
        fetchRows(selectedTable.id, 1);
        fetchTables();
        if (csvRef.current) csvRef.current.value = "";
      } else toast.error(data.message || "Import gagal", { id });
    } catch { toast.error("Koneksi gagal", { id }); }
  };

  const handleExportCsv = async () => {
    if (!selectedTable) return;
    const id = toast.loading("Menyiapkan CSV...");
    try {
      const res = await apiFetch(`/tables/${selectedTable.id}/export`);
      if (res.ok) {
        const data = await res.json();
        const csv: string = data.csv || "";
        const rowCount: number = data.rowCount || 0;
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || `${selectedTable.name}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(rowCount > 0 ? `CSV berhasil diunduh! (${rowCount} baris)` : "CSV diunduh (tabel kosong — header saja)", { id });
      } else toast.error("Gagal export CSV", { id });
    } catch { toast.error("Koneksi gagal", { id }); }
  };

  const columns = getColumns();

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-poppins font-black text-slate-800 tracking-tight">Table Manager</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola tabel dengan dynamic schema, CRUD row, batch operations, dan import/export CSV.</p>
        </div>
        <button onClick={() => setShowCreateTableModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all">
          + New Table
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar — Table List */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tables ({tables.length})</p>
            </div>
            {isLoading ? (
              <div className="p-4 text-center text-slate-400 text-sm animate-pulse">Loading...</div>
            ) : tables.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">Belum ada tabel</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tables.map((t) => (
                  <div key={t.id} onClick={() => openTable(t)}
                    className={`p-3 cursor-pointer transition-colors hover:bg-slate-50 flex justify-between items-center ${selectedTable?.id === t.id ? "bg-blue-50 border-l-2 border-blue-500" : ""}`}
                  >
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                      <p className="text-[11px] text-slate-400">{t.rowCount} rows</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTable(t.id, t.name); }}
                      className="text-red-400 hover:text-red-600 text-xs">🗑</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main — Table Data */}
        <div className="flex-1">
          {!selectedTable ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl h-64 flex items-center justify-center text-center">
              <div>
                <span className="text-5xl">📋</span>
                <p className="mt-3 font-semibold text-slate-600">Pilih tabel dari panel kiri</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Toolbar */}
              <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800">{selectedTable.name}</p>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{rows?.total || 0} rows</span>
                  {selectedRowIds.size > 0 && (
                    <button onClick={handleBatchDelete} className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                      🗑 Delete {selectedRowIds.size} selected
                    </button>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors">
                    ⬆ Import CSV
                    <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleImportCsv} />
                  </label>
                  <button onClick={handleExportCsv} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors">
                    ⬇ Export CSV
                  </button>
                  <button
                    onClick={() => { setRowFormData({}); setShowRowModal({ mode: "create" }); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-bold rounded-lg transition-colors"
                  >
                    + Add Row
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-auto max-h-[60vh]">
                {!rows || rows.data.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-3xl mb-2">📭</p>
                    <p className="font-semibold">Tabel kosong</p>
                    <p className="text-sm mt-1">Tambah baris baru atau import CSV</p>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 w-10">
                          <input type="checkbox" checked={selectedRowIds.size === rows.data.length && rows.data.length > 0}
                            onChange={toggleSelectAll} className="rounded" />
                        </th>
                        {columns.map((col) => <th key={col.name} className="px-4 py-3">{col.name}</th>)}
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.data.map((row) => (
                        <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${selectedRowIds.has(row.id) ? "bg-blue-50" : ""}`}>
                          <td className="px-4 py-2.5">
                            <input type="checkbox" checked={selectedRowIds.has(row.id)} onChange={() => toggleRowSelect(row.id)} className="rounded" />
                          </td>
                          {columns.map((col) => (
                            <td key={col.name} className="px-4 py-2.5 text-xs text-slate-600 max-w-[150px] truncate" title={String(row[col.name] ?? "")}>
                              {String(row[col.name] ?? "—")}
                            </td>
                          ))}
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => {
                                  const data: Record<string, string> = {};
                                  columns.forEach((c) => { data[c.name] = String(row[c.name] ?? ""); });
                                  setRowFormData(data);
                                  setShowRowModal({ mode: "edit", row });
                                }}
                                className="text-slate-400 hover:text-blue-600 text-xs font-bold transition-colors px-2 py-1 hover:bg-blue-50 rounded"
                              >
                                Edit
                              </button>
                              <button onClick={() => handleDeleteRow(row.id)} className="text-slate-400 hover:text-red-600 text-xs font-bold transition-colors px-2 py-1 hover:bg-red-50 rounded">
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {rows && rows.totalPages > 1 && (
                <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span>Page {rows.page} of {rows.totalPages} · {rows.total} total rows</span>
                  <div className="flex gap-2">
                    <button disabled={currentPage <= 1} onClick={() => fetchRows(selectedTable.id, currentPage - 1)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold disabled:opacity-40 transition-colors">← Prev</button>
                    <button disabled={currentPage >= rows.totalPages} onClick={() => fetchRows(selectedTable.id, currentPage + 1)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold disabled:opacity-40 transition-colors">Next →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Table Modal */}
      {showCreateTableModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">📋 New Managed Table</h2>
              <button onClick={() => setShowCreateTableModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Tabel</label>
                <input required value={tableForm.name} onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })} placeholder="e.g. customers" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-600">Kolom Schema</label>
                  <button type="button" onClick={() => setTableForm({ ...tableForm, columns: [...tableForm.columns, { name: "", type: "string", required: false }] })} className="text-xs text-blue-600 font-bold hover:text-blue-700">+ Kolom</button>
                </div>
                <div className="space-y-2">
                  {tableForm.columns.map((col, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input value={col.name} onChange={(e) => { const cols = [...tableForm.columns]; cols[idx] = { ...cols[idx], name: e.target.value }; setTableForm({ ...tableForm, columns: cols }); }}
                        placeholder="nama_kolom" className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20" />
                      <select value={col.type} onChange={(e) => { const cols = [...tableForm.columns]; cols[idx] = { ...cols[idx], type: e.target.value }; setTableForm({ ...tableForm, columns: cols }); }}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                      </select>
                      {tableForm.columns.length > 1 && <button type="button" onClick={() => setTableForm({ ...tableForm, columns: tableForm.columns.filter((_, i) => i !== idx) })} className="text-red-400 hover:text-red-600 font-bold">×</button>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateTableModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition-colors">Batal</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-colors">Buat Tabel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Row Modal */}
      {showRowModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">{showRowModal.mode === "create" ? "➕ Add Row" : "✏️ Edit Row"}</h2>
              <button onClick={() => { setShowRowModal(null); setRowFormData({}); }} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleSaveRow} className="space-y-3">
              {columns.length === 0 ? (
                <p className="text-sm text-slate-500">Tabel belum punya schema kolom. Import CSV terlebih dahulu atau tambah data langsung.</p>
              ) : (
                columns.map((col) => (
                  <div key={col.name}>
                    <label className="block text-xs font-bold text-slate-600 mb-1">{col.name} <span className="text-slate-400 font-normal">({col.type})</span></label>
                    <input
                      type={col.type === "number" ? "number" : "text"}
                      value={rowFormData[col.name] || ""}
                      onChange={(e) => setRowFormData({ ...rowFormData, [col.name]: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                ))
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowRowModal(null); setRowFormData({}); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition-colors">Batal</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-colors">
                  {showRowModal.mode === "create" ? "Tambah" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
