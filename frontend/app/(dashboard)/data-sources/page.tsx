"use client";
import React, { useState } from 'react';

// ngetes UI sebelum nanti ditembak ke Backend
const initialDataSources = [
  { id: 'DS-001', name: 'Production DB', type: 'PostgreSQL', host: 'db-prod.sarai.internal', status: 'Connected', lastSync: '2 mins ago' },
  { id: 'DS-002', name: 'User Analytics', type: 'MongoDB', host: 'mongo-cluster-01', status: 'Connected', lastSync: '10 mins ago' },
  { id: 'DS-003', name: 'Legacy CRM', type: 'MySQL', host: '192.168.1.105', status: 'Offline', lastSync: '2 days ago' },
  { id: 'DS-004', name: 'External Weather', type: 'REST API', host: 'api.weather.com/v1', status: 'Connected', lastSync: 'Just now' },
  { id: 'DS-005', name: 'Financial Records', type: 'PostgreSQL', host: 'db-finance.sarai.net', status: 'Warning', lastSync: '1 hour ago' },
];

export default function DataSourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Logika buat nyari data di tabel berdasarkan nama atau tipe
  const filteredSources = initialDataSources.filter(source => 
    source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col space-y-8">
      
      {/* Header Halaman & Tombol Add */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-slate-800">Data Sources</h1>
          <p className="text-slate-500 font-inter mt-1">
            Kelola koneksi database dan integrasi API yang terhubung ke engine SARAI.
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 text-sm">
          <span className="text-lg leading-none">+</span> Add Data Source
        </button>
      </div>

      {/* Area Tabel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        
        {/* Toolbar (Search Bar di atas tabel) */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-full max-w-xs group">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
              🔍
            </span>
            <input 
              type="text" 
              placeholder="Search data sources..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="text-sm font-medium text-slate-500">
            Showing <span className="text-slate-800">{filteredSources.length}</span> sources
          </div>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">ID</th>
                <th className="px-6 py-4 border-b border-slate-100">Source Name</th>
                <th className="px-6 py-4 border-b border-slate-100">Type</th>
                <th className="px-6 py-4 border-b border-slate-100">Host / Endpoint</th>
                <th className="px-6 py-4 border-b border-slate-100">Status</th>
                <th className="px-6 py-4 border-b border-slate-100">Last Sync</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600 divide-y divide-slate-100 font-inter">
              {filteredSources.length > 0 ? (
                filteredSources.map((source) => (
                  <tr key={source.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{source.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{source.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold border border-slate-200">
                        {source.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{source.host}</td>
                    <td className="px-6 py-4">
                      {/* Badge Status Dinamis */}
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center w-max gap-1.5
                        ${source.status === 'Connected' ? 'bg-green-100 text-green-700' : ''}
                        ${source.status === 'Offline' ? 'bg-slate-100 text-slate-500' : ''}
                        ${source.status === 'Warning' ? 'bg-amber-100 text-amber-700' : ''}
                      `}>
                        <div className={`w-1.5 h-1.5 rounded-full 
                          ${source.status === 'Connected' ? 'bg-green-500' : ''}
                          ${source.status === 'Offline' ? 'bg-slate-400' : ''}
                          ${source.status === 'Warning' ? 'bg-amber-500' : ''}
                        `}></div>
                        {source.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs font-medium">{source.lastSync}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-blue-600 font-medium text-sm transition-colors opacity-0 group-hover:opacity-100">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                /* Tampilan kalau hasil pencarian nggak ketemu */
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="text-4xl mb-3">🕵️‍♂️</div>
                    <p className="font-semibold text-slate-700">Data tidak ditemukan</p>
                    <p className="text-sm mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
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