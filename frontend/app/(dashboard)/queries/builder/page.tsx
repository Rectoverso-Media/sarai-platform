"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function QueryBuilderPage() {
  const router = useRouter();
  
  // State Form Utama
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rawSql, setRawSql] = useState('-- Tulis query SQL Anda di sini\nSELECT * \nFROM marketing_data \nLIMIT 100;');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [pollingStatus, setPollingStatus] = useState('');

  // State untuk Tab Mode (Visual vs Raw SQL)
  const [activeMode, setActiveMode] = useState<'visual' | 'sql'>('sql');

  // Fungsi untuk melempar query ke antrean BullMQ (Redis)
  const handleRunQuery = async () => {
    if (!rawSql || rawSql.trim() === '') return alert("Kode SQL tidak boleh kosong!");
    
    setIsExecuting(true);
    setQueryResult(null);
    setPollingStatus('Mengirim ke antrean...');

    try {
      const response = await fetch('http://localhost:3001/queries/test-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId: `TEST-${Date.now()}`, rawSql }),
      });
      const data = await response.json();

      if (response.ok) {
        setPollingStatus(`Mengantre (Job ID: ${data.jobId})...`);
        
        // Mulai proses Polling (Nanya ke backend tiap 1 detik)
        const pollInterval = setInterval(async () => {
          const statusRes = await fetch(`http://localhost:3001/queries/job-status/${data.jobId}`);
          const statusData = await statusRes.json();

          if (statusData.state === 'active') {
            setPollingStatus('Mesin sedang memproses data...');
          } else if (statusData.state === 'completed') {
            clearInterval(pollInterval); // Stop nanya
            setPollingStatus('');
            setQueryResult(statusData.result); // Simpan hasil tabelnya
            setIsExecuting(false);
          } else if (statusData.state === 'failed') {
            clearInterval(pollInterval);
            setPollingStatus('Gagal memproses query.');
            setIsExecuting(false);
          }
        }, 1000); // 1000ms = 1 detik

      }
    } catch (error) {
      console.error(error);
      setIsExecuting(false);
      setPollingStatus('Error koneksi.');
    }
  };


  // ==========================================
  // STATE & LOGIKA UNTUK VISUAL BUILDER
  // ==========================================
  const availableColumns = [
    { name: 'date', type: 'dimension' },
    { name: 'campaign_name', type: 'dimension' },
    { name: 'platform', type: 'dimension' },
    { name: 'clicks', type: 'metric' },
    { name: 'impressions', type: 'metric' },
    { name: 'spend', type: 'metric' },
  ];

  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<{col: string, agg: string}[]>([]);

  // Effect: Update rawSql otomatis saat user mainin Visual Builder
  useEffect(() => {
    if (activeMode !== 'visual') return; // Cuma update kalau lagi di mode visual

    let sql = 'SELECT\n';
    const selects = [];

    if (selectedDimensions.length > 0) selects.push(`  ${selectedDimensions.join(',\n  ')}`);
    if (selectedMetrics.length > 0) {
      const metricStrings = selectedMetrics.map(m => `  ${m.agg}(${m.col}) AS total_${m.col}`);
      selects.push(metricStrings.join(',\n'));
    }

    if (selects.length === 0) sql += '  *\n';
    else sql += selects.join(',\n') + '\n';

    sql += 'FROM\n  synced_data_table\n';

    if (selectedDimensions.length > 0 && selectedMetrics.length > 0) {
      sql += `GROUP BY\n  ${selectedDimensions.join(', ')}`;
    }

    setRawSql(sql);
  }, [selectedDimensions, selectedMetrics, activeMode]);

  const toggleDimension = (colName: string) => {
    setSelectedDimensions(prev => 
      prev.includes(colName) ? prev.filter(d => d !== colName) : [...prev, colName]
    );
  };

  const addMetric = (colName: string) => {
    setSelectedMetrics(prev => {
      const exists = prev.find(m => m.col === colName);
      return exists ? prev.filter(m => m.col !== colName) : [...prev, { col: colName, agg: 'SUM' }];
    });
  };
  // ==========================================


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
        body: JSON.stringify({ name, description, rawSql }),
      });

      if (response.ok) {
        alert('Query berhasil disimpan ke Database! 🚀');
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
          <button 
            onClick={handleRunQuery}
            disabled={isExecuting}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {isExecuting ? `⏳ ${pollingStatus}` : '▶️ Run Query (Test)'}
          </button>
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:bg-blue-400 transition-all">
            {isLoading ? 'Menyimpan...' : '💾 Save Query'}
          </button>
        </div>
      </div>
      {/* TAMPILAN HASIL QUERY */}
        {queryResult && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mt-6 animate-in slide-in-from-bottom-4">
            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <span>✅</span> Eksekusi Berhasil
              </h3>
              <span className="text-xs font-mono text-emerald-600 bg-white px-3 py-1 rounded-full border border-emerald-200">
                {queryResult.rows.length} rows returned
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    {queryResult.columns.map((col: string) => (
                      <th key={col} className="px-6 py-4">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                  {queryResult.rows.map((row: any[], rowIndex: number) => (
                    <tr key={rowIndex} className="hover:bg-slate-50/80 transition-colors">
                      {row.map((cell: any, cellIndex: number) => (
                        <td key={cellIndex} className="px-6 py-4">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Main Layout: Split Screen */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        
        {/* Kolom Kiri: Editor Area (Tabs) */}
        <div className="flex-1 rounded-2xl shadow-xl overflow-hidden flex flex-col bg-white border border-slate-200">
          
          {/* Custom Tab Switcher */}
          <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
            <button 
              onClick={() => setActiveMode('sql')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeMode === 'sql' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}>
              🧑‍💻 Raw SQL Editor
            </button>
            <button 
              onClick={() => setActiveMode('visual')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeMode === 'visual' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}>
              🪄 Visual Builder (No-Code)
            </button>
          </div>

          {/* KONTEN TAB: VISUAL BUILDER */}
          {activeMode === 'visual' && (
            <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-slate-50/50">
               {/* SECTION 1: DIMENSIONS */}
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <span className="text-blue-500">🏷️</span> Group By (Dimensions)
                </h2>
                <div className="flex flex-wrap gap-2">
                  {availableColumns.filter(c => c.type === 'dimension').map(col => {
                    const isSelected = selectedDimensions.includes(col.name);
                    return (
                      <button
                        key={col.name}
                        onClick={() => toggleDimension(col.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isSelected ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        {col.name} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: METRICS */}
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <span className="text-emerald-500">📊</span> Calculate (Metrics)
                </h2>
                <div className="flex flex-wrap gap-2">
                  {availableColumns.filter(c => c.type === 'metric').map(col => {
                    const isSelected = selectedMetrics.find(m => m.col === col.name);
                    return (
                      <button
                        key={col.name}
                        onClick={() => addMetric(col.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${isSelected ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        SUM({col.name}) {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LIVE PREVIEW BOX */}
              <div className="bg-[#1e1e1e] rounded-xl p-4 mt-4">
                <p className="text-xs text-slate-400 font-bold mb-2 uppercase">Live SQL Preview:</p>
                <pre className="text-emerald-400 font-mono text-xs overflow-x-auto">{rawSql}</pre>
              </div>
            </div>
          )}

          {/* KONTEN TAB: RAW SQL EDITOR */}
          <div className={activeMode === 'sql' ? 'flex flex-col flex-1' : 'hidden'}>
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
              className="w-full flex-1 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-6 outline-none resize-none leading-relaxed"
              spellCheck="false"
            />
          </div>
        </div>

        {/* Kolom Kanan: Pengaturan Query (Tetap Sama) */}
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