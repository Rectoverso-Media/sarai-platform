"use client";
import { apiFetch } from '../../../lib/api';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function QueriesListPage() {
  const [queries, setQueries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<any>(null);
  const [cronExp, setCronExp] = useState('0 0 * * *');
  const [isCronActive, setIsCronActive] = useState(true);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  // Ambil data dari Backend NestJS
  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const response = await apiFetch('/queries');
      if (response.ok) {
        const result = await response.json();
        setQueries(result.data || []);
      }
    } catch (error) {
      console.error("Gagal mengambil data queries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openScheduleModal = (query: any) => {
    setSelectedQuery(query);
    setCronExp('0 0 * * *'); // Default tiap jam 12 malam
    setIsCronActive(true);
    setIsScheduleModalOpen(true);
  };

  

  // Fungsi Hapus Data
  const handleDelete = async (id: string) => {
    const isConfirmed = window.confirm("Yakin ingin menghapus Query ini?");
    if (isConfirmed) {
      try {
        const response = await fetch(`/queries/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setQueries(queries.filter(q => q.id !== id));
          alert("Query berhasil dihapus! 🗑️");
        } else {
          alert("Gagal menghapus query.");
        }
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  // Fungsi Menjalankan Query
  const handleRun = async (id: string, name: string) => {
    // Kita pakai window.confirm biar user yakin mau nge-run
    const isConfirmed = window.confirm(`Jalankan eksekusi untuk query "${name}"?`);
    
    if (isConfirmed) {
      try {
        // Tembak API execute yang baru kita bikin
        const response = await fetch(`/queries/${id}/execute`, {
          method: 'POST',
        });
        
        const result = await response.json();

        if (response.ok) {
          // Tampilkan alert hasil eksekusi bergaya profesional
          alert(
            `✅ EKSEKUSI BERHASIL!\n\n` +
            `⏱️ Durasi Proses: ${result.executionLog.durationMs} ms\n` +
            `📊 Data Ditarik: ${result.executionLog.rowsReturned} baris\n\n` +
            `🔍 Preview Data Pertama:\n` +
            `Campaign: ${result.previewData[0].campaign_name}\n` +
            `Spend: Rp ${result.previewData[0].spend.toLocaleString('id-ID')}`
          );
        } else {
          alert(`❌ Gagal mengeksekusi: ${result.message}`);
        }
      } catch (error) {
        console.error("Error executing query:", error);
        alert("Gagal terhubung ke engine eksekusi!");
      }
    }
  };

  // FUNGSI SIMPAN JADWAL KE BACKEND
  const handleSaveSchedule = async () => {
    if (!selectedQuery) return;
    setIsSavingSchedule(true);

    try {
      const response = await fetch(`/queries/${selectedQuery.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cronExpression: cronExp,
          isActive: isCronActive,
        }),
      });

      if (response.ok) {
        alert(`Jadwal untuk "${selectedQuery.name}" berhasil diaktifkan! ⏰`);
        setIsScheduleModalOpen(false);
      } else {
        alert('Gagal menyimpan jadwal.');
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col space-y-8 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-slate-800">Saved Queries</h1>
          <p className="text-slate-500 mt-1">Daftar resep SQL yang telah disimpan untuk mengekstrak insight.</p>
        </div>
        <Link 
          href="/queries/builder" 
          className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Create New Query
        </Link>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">Query Name & Desc</th>
                <th className="px-6 py-4 border-b border-slate-100">SQL Preview</th>
                <th className="px-6 py-4 border-b border-slate-100">Last Modified</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600 divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold animate-pulse">
                    ⏳ Memuat data queries...
                  </td>
                </tr>
              ) : queries.length > 0 ? (
                queries.map((query) => (
                  <tr key={query.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-base">{query.name}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-xs">{query.description || 'Tidak ada deskripsi'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="bg-slate-800 text-slate-300 font-mono text-[10px] p-2 rounded max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                        {query.rawSql || '-- Visual Builder Data'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {new Date(query.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleRun(query.id, query.name)}
                        className="text-green-600 hover:text-green-700 font-bold text-sm bg-green-50 px-3 py-1 rounded-md transition-colors">
                        ▶ Run
                      </button>
                      <button 
                        onClick={() => openScheduleModal(query)}
                        className="text-purple-600 hover:text-purple-700 font-bold text-sm bg-purple-50 px-3 py-1 rounded-md transition-colors mr-1">
                        📅 Schedule
                      </button>
                      <button className="text-slate-400 hover:text-blue-600 font-medium text-sm transition-colors px-2">
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(query.id)}
                        className="text-slate-400 hover:text-red-600 font-medium text-sm transition-colors px-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                    <div className="text-4xl mb-3">🗂️</div>
                    <p className="font-semibold text-slate-700">Belum ada Query tersimpan</p>
                    <p className="text-sm mt-1 mb-4">Mulai bangun query pertama Anda untuk menganalisa data.</p>
                    <Link href="/queries/builder" className="text-blue-600 font-bold text-sm hover:underline">
                      Create Query →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SCHEDULE POP-UP  */}
      {isScheduleModalOpen && selectedQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">Set Automation Schedule</h2>
              <p className="text-sm text-slate-500 mt-1 line-clamp-1">Target: {selectedQuery.name}</p>
            </div>

            {/* Body Modal */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cron Expression</label>
                <input 
                  type="text" 
                  value={cronExp}
                  onChange={(e) => setCronExp(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  placeholder="0 0 * * *"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Format standar CRON. Contoh: <code className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-purple-600 font-mono">0 0 * * *</code> (Setiap Tengah Malam).
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Schedule Status</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Aktifkan atau matikan eksekusi otomatis.</p>
                </div>
              
                <div 
                  onClick={() => setIsCronActive(!isCronActive)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${isCronActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                  <div 
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isCronActive ? 'translate-x-6' : 'translate-x-0'}`}
                  ></div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button 
                onClick={() => setIsScheduleModalOpen(false)}
                className="flex-1 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              
              <button 
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule}
                className="flex-1 py-2.5 flex justify-center items-center gap-2 font-bold text-white bg-blue-600 rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                {isSavingSchedule ? '⏳ Saving...' : '💾 Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    
    
  );
}