"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import { useEffect } from 'react';

export default function AddDataSourcePage() {
  const router = useRouter();
  
  // State untuk alur UI
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State untuk nampung inputan form
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  // Nanti nilai ini akan kita mapping ke SourceDefinitionId asli dari Airbyte
  const [connectorId, setConnectorId] = useState('Salesforce (v0.1.2)');
  const [availableConnectors, setAvailableConnectors] = useState<any[]>([]);

  const categories = [
    { id: 'database', name: 'Standard Database', icon: '🗄️', desc: 'Direct connect to Postgres, MySQL, MongoDB.' },
    { id: 'airbyte', name: 'Managed Integration (Airbyte)', icon: '🔄', desc: 'Connect to 300+ SaaS like Salesforce, Sheets, Ads.' },
    { id: 'api', name: 'REST API / Webhook', icon: '🌐', desc: 'Connect via custom API endpoints.' },
  ];

  // mapping ID asli Airbyte (Contoh beberapa)
  const AIRBYTE_CONNECTOR_MAPPING: Record<string, string> = {
    'Salesforce': 'b112928d-9653-4874-a633-82a176882650',
    'Google Sheets': '71607597-9431-466c-9223-34e8f7a83d47',
    'Hubspot': '7442111c-1647-4c0b-adf4-da0e75f5a750',
  };

  // state untuk konfigurasi (dalam bentuk JSON string/object)
  const [config, setConfig] = useState('{}'); 
  const [selectedConnectorId, setSelectedConnectorId] = useState('');

  // const [selectedConnectorId, setSelectedConnectorId] = useState('');

  useEffect(() => {
    if (step === 2 && sourceType === 'airbyte') {
      fetch('http://localhost:3001/airbyte/connectors')
        .then(res => res.json())
        .then(data => setAvailableConnectors(data))
        .catch(err => console.error("Gagal load konektor", err));
    }
  }, [step, sourceType]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; 
    setIsLoading(true);

    let apiUrl = 'http://localhost:3001/datasources'; 
    let payload: any = { name, type: sourceType };

    if (sourceType === 'airbyte') {
      apiUrl = 'http://localhost:3001/airbyte/sources';
      payload = {
        name: name,
        sourceDefinitionId: selectedConnectorId, // 
        connectionConfiguration: config ? JSON.parse(config) : {} 
      };
    } else {
      payload.host = host;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Data Source berhasil ditambahkan! 🎉');
        router.push('/data-sources'); 
      } else {
        const err = await response.json();
        alert(`Gagal: ${err.message || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error("Error saving data:", error);
      alert('Terjadi kesalahan pada sistem navigasi atau server!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-slate-400 mb-8 font-medium">
        <Link href="/dashboard/data-sources" className="hover:text-blue-600 transition-colors">Data Sources</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">Add New Source</span>
      </nav>

      {/* Step 1: Select Type (KEMBALI KE KOTAK-KOTAK BESAR) */}
      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h1 className="text-3xl font-poppins font-bold text-slate-800">Select Source Type</h1>
            <p className="text-slate-500 mt-2">Pilih cara SARAI terhubung dengan data Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => { setSourceType(cat.id); setStep(2); }}
                className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-xl transition-all text-left group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
                <h3 className="font-bold text-slate-800 text-lg">{cat.name}</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Configuration */}
      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 animate-in zoom-in-95">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              {sourceType === 'airbyte' ? 'Configure Airbyte Integration' : 'Database Connection'}
            </h2>
            <button type="button" onClick={() => setStep(1)} className="text-sm text-slate-400 hover:text-slate-600 font-bold">← Change Type</button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Input Nama (Selalu Muncul) */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Display Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Google Ads Production" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                  required 
                />
              </div>
              
              {/* Dinamis: Dropdown Airbyte ATAU Input Host */}
              {sourceType === 'airbyte' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Connector Type</label>
                    
                    {/* DROPDOWN DINAMIS DARI BACKEND */}
                    <select 
                      value={selectedConnectorId}
                      onChange={(e) => setSelectedConnectorId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      required
                    >
                      <option value="">-- Select Official Connector --</option>
                      {availableConnectors.map((conn: any) => (
                        <option key={conn.sourceDefinitionId} value={conn.sourceDefinitionId}>
                          {conn.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Connection Credentials (JSON)</label>
                    <textarea 
                      value={config}
                      onChange={(e) => setConfig(e.target.value)}
                      placeholder='{ "api_key": "your-key-here" }'
                      className="w-full px-4 py-3 h-32 rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-400 italic">*Format disesuaikan dengan kebutuhan setiap konektor Airbyte.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Host Address</label>
                  <input 
                    type="text" 
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="localhost atau 192.168.x.x" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                    required={sourceType !== 'airbyte'} 
                  />
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? 'Saving...' : 'Test & Save Connection'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}