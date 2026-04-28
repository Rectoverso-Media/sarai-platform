"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DataSourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<any>(null);
  const [sheetId, setSheetId] = useState('');
  const [sheetTabName, setSheetTabName] = useState('Sheet1');
  const [isExporting, setIsExporting] = useState(false);

  // Fungsi Fetch Data dari Database (Prisma)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3001/datasources');
        if (response.ok) {
          const result = await response.json();
          
          // Mapping data sesuai kolom di Prisma Schema
          const formattedData = (result.data || []).map((source: any) => ({
            id: source.id,                           // FIX: Di database namanya id
            name: source.name,
            type: source.connectorName || source.sourceType, // Tampilkan nama konektor kalau ada, kalau nggak tipe sumbernya
            host: source.airbyteHost || "Airbyte Connection",
            status: source.status                    // FIX: Ambil status asli dari database (Connected/Trial)
          }));
          
          setDataSources(formattedData);
        }
      } catch (error) {
        console.error("Gagal mengambil data dari database:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Logika Hapus Data (Disiapkan untuk API Airbyte)
  const handleDelete = async (id: string) => {
    const isConfirmed = window.confirm("Yakin ingin menghapus Data Source ini? Koneksi data akan terputus.");
    
    if (isConfirmed) {
      try {
        // Nanti bikin endpoint DELETE ini di NestJS
        const response = await fetch(`http://localhost:3001/datasources/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setDataSources((prevData) => prevData.filter((source) => source.id !== id));
          alert("Data berhasil dihapus dari Airbyte! 🗑️");
        } else {
          alert("Gagal menghapus data dari server.");
        }
      } catch (error) {
        console.error("Error deleting data:", error);
      }
    }
  };

  const filteredSources = dataSources.filter(source => 
    source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // FUNGSI BUKA MODAL
  const openExportModal = (source: any) => {
    setExportTarget(source);
    setSheetId(''); // Kosongkan input
    setSheetTabName('Sheet1');
    setIsExportModalOpen(true);
  };

  // FUNGSI EKSEKUSI EXPORT KE BACKEND
  const handleExportToSheets = async () => {
    if (!sheetId || !sheetTabName) {
      alert("Harap isi Spreadsheet ID dan Nama Tab!");
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Simulasi mengambil data yang mau diekspor (Nantinya ini bisa dari hasil query builder)
      const columnsToExport = ["ID", "Nama Data Source", "Status"];
      const rowsToExport = [
        [1, exportTarget?.name || "Airbyte Source", "Active"],
        [2, "Data Dummy 2", "Pending"]
      ];

      // Memanggil API NestJS yang baru kita buat
      const response = await fetch('http://localhost:3001/queries/export/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetId: sheetId,
          tabName: sheetTabName,
          columns: columnsToExport,
          rows: rowsToExport,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("🎉 YAY! " + result.message);
        setIsExportModalOpen(false);
      } else {
        alert("❌ Gagal: " + (result.message || "Terjadi kesalahan di server."));
      }
    } catch (error) {
      console.error(error);
      alert("❌ Gagal menghubungi server backend.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-slate-800">Data Sources</h1>
          <p className="text-slate-500 font-inter mt-1">
            Kelola koneksi database dan integrasi API yang terhubung ke engine SARAI.
          </p>
        </div>
        <Link href="/data-sources/add" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 text-sm">
          <span className="text-lg leading-none">+</span> Add Data Source
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-full max-w-xs group">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search data sources..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="text-sm font-medium text-slate-500">
            Showing <span className="text-slate-800">{filteredSources.length}</span> sources
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">ID</th>
                <th className="px-6 py-4 border-b border-slate-100">Source Name</th>
                <th className="px-6 py-4 border-b border-slate-100">Type</th>
                <th className="px-6 py-4 border-b border-slate-100">Host / Endpoint</th>
                <th className="px-6 py-4 border-b border-slate-100">Status</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600 divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold">
                    ⏳ Memuat data dari Airbyte...
                  </td>
                </tr>
              ) : filteredSources.length > 0 ? (
                filteredSources.map((source) => (
                  <tr key={source.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {source.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{source.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold border border-slate-200">
                        {source.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{source.host}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center w-max gap-1.5
                        ${source.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}
                      `}>
                        <div className={`w-1.5 h-1.5 rounded-full ${source.status === 'Connected' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                        {source.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/data-sources/${source.id}`} className="text-slate-400 hover:text-blue-600 font-medium text-sm transition-colors">
                        View Details
                      </Link>
                      <button 
                        onClick={() => handleDelete(source.id)}
                        className="text-slate-400 hover:text-red-600 font-medium text-sm transition-colors">
                        Delete
                      </button>
                      <button 
                        onClick={() => openExportModal(source)}
                        className="text-emerald-600 hover:text-emerald-700 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-md transition-colors mr-2 border border-emerald-200">
                        📤 Export to Sheets
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="font-semibold text-slate-700">Belum ada Data Source terhubung</p>
                    <p className="text-sm mt-1">Klik tombol Add Data Source di kanan atas untuk mulai menarik data.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EXPORT GOOGLE SHEETS */}
      {isExportModalOpen && exportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-emerald-50/30">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="text-emerald-600">📊</span> Export to Google Sheets
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Kirim data <span className="font-bold text-emerald-600">{exportTarget.name}</span> langsung ke dokumen Anda.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Spreadsheet ID</label>
                <input 
                  type="text" 
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  placeholder="Contoh: 1aBcD_efGhI_JkLmNoP..."
                />
                <p className="text-[11px] text-slate-400 mt-1">Dapatkan ID ini dari URL Google Sheets Anda. Jangan lupa jadikan Service Account sebagai Editor.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Sheet / Tab Name</label>
                <input 
                  type="text" 
                  value={sheetTabName}
                  onChange={(e) => setSheetTabName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  placeholder="Sheet1"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                type="button"
                className="flex-1 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Batal
              </button>
              
              <button 
                onClick={handleExportToSheets}
                disabled={isExporting || !sheetId}
                type="button"
                className="flex-1 py-2.5 flex justify-center items-center gap-2 font-bold text-black bg-emerald-600 rounded-xl shadow-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition-colors">
                {isExporting ? '⏳ Sending...' : 'Run Export'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}