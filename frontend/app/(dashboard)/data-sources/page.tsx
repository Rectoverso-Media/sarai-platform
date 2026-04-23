"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DataSourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi Fetch Data dari Airbyte Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Nembak ke jalur API Airbyte yang baru kita bikin
        const response = await fetch('http://localhost:3001/airbyte/sources');
        if (response.ok) {
          const result = await response.json();
          
          // Format ulang data dari Airbyte biar cocok sama tabel UI kamu
          const formattedData = (result.data || []).map((source: any) => ({
            id: source.sourceId,
            name: source.name,
            type: source.sourceName, // Airbyte nyebut tipe konektor (misal: Facebook Ads) sebagai sourceName
            host: "Airbyte Cloud",
            status: "Connected"
          }));
          
          setDataSources(formattedData);
        }
      } catch (error) {
        console.error("Gagal mengambil data Airbyte:", error);
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
        const response = await fetch(`http://localhost:3001/airbyte/sources/${id}`, {
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
                        className="text-slate-400 hover:text-red-600 font-medium text-sm transition-colors"
                      >
                        Delete
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
    </div>
  );
}