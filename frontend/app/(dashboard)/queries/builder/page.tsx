"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function QueryBuilderPage() {
  const router = useRouter();
  
  // State Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rawSql, setRawSql] = useState('-- Tulis query SQL Anda di sini\nSELECT * \nFROM marketing_data \nLIMIT 100;');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rawSql) {
      alert("Nama dan Kode SQL tidak boleh kosong!");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          rawSql
        }),
      });

      if (response.ok) {
        alert('Query berhasil disimpan ke Database! 🚀');
        // Nanti kita arahkan ke halaman Daftar Query
        router.push('/queries'); 
      } else {
        alert('Gagal menyimpan query.');
      }
    } catch (error) {
      console.error("Error:", error);
      alert('Terjadi kesalahan koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <nav className="flex text-sm text-slate-400 font-medium mb-2">
            <Link href="/queries" className="hover:text-blue-600 transition-colors">Queries</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-800">Builder</span>
          </nav>
          <h1 className="text-3xl font-poppins font-bold text-slate-800">Query Builder</h1>
          <p className="text-slate-500 mt-1">Tulis dan simpan eksekusi SQL untuk pengolahan data.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">
            ▶️ Run Query (Test)
          </button>
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:bg-blue-400 transition-all"
          >
            {isLoading ? 'Menyimpan...' : '💾 Save Query'}
          </button>
        </div>
      </div>

      {/* Main Layout: Split Screen */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        
        {/* Kolom Kiri: SQL Editor Area */}
        <div className="flex-1 bg-[#1e1e1e] rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col">
          <div className="bg-[#2d2d2d] px-4 py-3 flex items-center gap-3 border-b border-[#404040]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-slate-400 font-mono text-sm ml-2">editor.sql</span>
          </div>
          
          <textarea
            value={rawSql}
            onChange={(e) => setRawSql(e.target.value)}
            className="w-full flex-1 bg-transparent text-[#d4d4d4] font-mono text-sm p-6 outline-none resize-none leading-relaxed"
            spellCheck="false"
          />
        </div>

        {/* Kolom Kanan: Pengaturan Query */}
        <div className="w-full lg:w-[350px] space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>⚙️</span> Query Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Query Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Rekap Ads Q1"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Penjelasan singkat tujuan query ini..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data Source Target</label>
                <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none">
                  <option>PostgreSQL (SARAI Warehouse)</option>
                  <option disabled>BigQuery (Coming Soon)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}