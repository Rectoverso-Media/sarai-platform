"use client";
import { apiFetch } from '../../../lib/api';
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

  // Fetch data sources dari database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiFetch('/datasources');
        if (response.ok) {
          const result = await response.json();
          const formattedData = (result.data || []).map((source: any) => ({
            id: source.id,
            name: source.name,
            type: source.connectorName || source.sourceType,
            host: source.airbyteHost || 'Airbyte Connection',
            status: source.status,
            isTrialActive: source.isTrialActive,
            trialEndsAt: source.trialEndsAt,
          }));
          setDataSources(formattedData);
        }
      } catch (error) {
        console.error('Gagal mengambil data dari database:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Hapus data source — menggunakan apiFetch agar header Authorization dikirim
  const handleDelete = async (id: string) => {
    const isConfirmed = window.confirm('Yakin ingin menghapus Data Source ini? Koneksi data akan terputus.');

    if (isConfirmed) {
      try {
        const response = await apiFetch(`/datasources/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setDataSources((prevData) => prevData.filter((source) => source.id !== id));
        } else {
          const err = await response.json().catch(() => ({}));
          alert(`Gagal menghapus: ${err.message || 'Terjadi kesalahan di server.'}`);
        }
      } catch (error) {
        console.error('Error deleting data:', error);
        alert('Gagal menghubungi server.');
      }
    }
  };

  const filteredSources = dataSources.filter(
    (source) =>
      source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Buka modal export Google Sheets
  const openExportModal = (source: any) => {
    setExportTarget(source);
    setSheetId('');
    setSheetTabName('Sheet1');
    setIsExportModalOpen(true);
  };

  // Eksekusi export ke Google Sheets
  const handleExportToSheets = async () => {
    if (!sheetId || !sheetTabName) {
      alert('Harap isi Spreadsheet ID dan Nama Tab!');
      return;
    }

    setIsExporting(true);

    try {
      const columnsToExport = ['ID', 'Nama Data Source', 'Status'];
      const rowsToExport = [
        [1, exportTarget?.name || 'Airbyte Source', 'Active'],
        [2, 'Data Dummy 2', 'Pending'],
      ];

      const response = await apiFetch('/queries/export/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId,
          tabName: sheetTabName,
          columns: columnsToExport,
          rows: rowsToExport,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('🎉 YAY! ' + result.message);
        setIsExportModalOpen(false);
      } else {
        alert('❌ Gagal: ' + (result.message || 'Terjadi kesalahan di server.'));
      }
    } catch (error) {
      console.error(error);
      alert('❌ Gagal menghubungi server backend.');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper: render status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; dot: string }> = {
      Connected: { bg: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
      Trial: { bg: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
      Expired: { bg: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
      Syncing: { bg: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    };
    const cfg = statusConfig[status] ?? statusConfig['Connected'];
    return (
      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center w-max gap-1.5 ${cfg.bg}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'Syncing' ? 'animate-pulse' : ''}`} />
        {status}
      </span>
    );
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
        <Link
          href="/data-sources/add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 text-sm"
        >
          <span className="text-lg leading-none">+</span> Add Data Source
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-full max-w-xs">
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
                <th className="px-6 py-4 border-b border-slate-100">Trial Ends</th>
                <th className="px-6 py-4 border-b border-slate-100">Status</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600 divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-bold">
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> Memuat data...
                    </div>
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
                    <td className="px-6 py-4 text-xs">
                      {source.trialEndsAt ? (
                        <span className={`font-semibold ${
                          new Date(source.trialEndsAt) < new Date()
                            ? 'text-red-500'
                            : new Date(source.trialEndsAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
                            ? 'text-amber-500'
                            : 'text-slate-600'
                        }`}>
                          {new Date(source.trialEndsAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{renderStatusBadge(source.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/data-sources/${source.id}`}
                          className="text-slate-400 hover:text-blue-600 font-medium text-sm transition-colors"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => openExportModal(source)}
                          className="text-emerald-600 hover:text-emerald-700 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-md transition-colors border border-emerald-200"
                        >
                          📤 Export
                        </button>
                        <button
                          onClick={() => handleDelete(source.id)}
                          className="text-slate-400 hover:text-red-600 font-medium text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
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

      {/* Modal Export Google Sheets */}
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
                <p className="text-[11px] text-slate-400 mt-1">
                  Dapatkan ID ini dari URL Google Sheets Anda. Jadikan Service Account sebagai Editor.
                </p>
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
                className="flex-1 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleExportToSheets}
                disabled={isExporting || !sheetId}
                type="button"
                className="flex-1 py-2.5 flex justify-center items-center gap-2 font-bold text-white bg-emerald-600 rounded-xl shadow-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition-colors"
              >
                {isExporting ? '⏳ Sending...' : 'Run Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
