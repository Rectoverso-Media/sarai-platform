"use client";
import { apiFetch } from '../../../../lib/api';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Tipe connector dari catalog
interface Connector {
  sourceDefinitionId: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  isTrial: boolean;
  supportsOAuth: boolean;
}

// Kategori connector
const ALL_CATEGORIES = ['All', 'CRM', 'Ads', 'Database', 'Analytics', 'Finance', 'Storage', 'Marketing', 'E-Commerce'];

const SOURCE_TYPE_CARDS = [
  {
    id: 'airbyte',
    name: 'Managed Integration',
    subtitle: 'Airbyte-powered',
    icon: '🔄',
    desc: 'Connect to 300+ SaaS apps like Salesforce, Google Ads, Shopify, and more — no code needed.',
    color: 'from-blue-500 to-indigo-600',
    badge: '300+ connectors',
  },
  {
    id: 'database',
    name: 'Direct Database',
    subtitle: 'PostgreSQL, MySQL, MongoDB',
    icon: '🗄️',
    desc: 'Connect directly to your own database with host credentials for full control.',
    color: 'from-emerald-500 to-teal-600',
    badge: 'Low latency',
  },
  {
    id: 'api',
    name: 'REST API / Webhook',
    subtitle: 'Custom HTTP endpoints',
    icon: '🌐',
    desc: 'Pull data from any REST API or receive real-time data via webhooks.',
    color: 'from-violet-500 to-purple-600',
    badge: 'Flexible',
  },
];

export default function AddDataSourcePage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConnectors, setIsLoadingConnectors] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [config, setConfig] = useState('{}');
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [connectorSearch, setConnectorSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Connectors from backend
  const [availableConnectors, setAvailableConnectors] = useState<Connector[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch connector catalog ketika masuk step 2 airbyte
  useEffect(() => {
    if (step === 2 && sourceType === 'airbyte') {
      setIsLoadingConnectors(true);
      apiFetch('/airbyte/connectors')
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setAvailableConnectors(list);
        })
        .catch((err) => {
          console.error('Gagal load konektor', err);
          setAvailableConnectors([]);
        })
        .finally(() => setIsLoadingConnectors(false));
    }
  }, [step, sourceType]);

  // Filter connector berdasarkan search & kategori
  const filteredConnectors = availableConnectors.filter((conn) => {
    const matchSearch =
      conn.name.toLowerCase().includes(connectorSearch.toLowerCase()) ||
      conn.category?.toLowerCase().includes(connectorSearch.toLowerCase());
    const matchCategory = activeCategory === 'All' || conn.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    let endpoint = '/datasources';
    let payload: any = { name, type: sourceType };

    if (sourceType === 'airbyte') {
      endpoint = '/airbyte/sources';
      payload = {
        name,
        sourceDefinitionId: selectedConnector?.sourceDefinitionId,
        connectionConfiguration: (() => {
          try { return JSON.parse(config); } catch { return {}; }
        })(),
      };
    } else {
      payload.host = host;
    }

    try {
      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccessMessage(`✅ "${name}" berhasil ditambahkan! Mengarahkan ke halaman Data Sources...`);
        setTimeout(() => router.push('/data-sources'), 1800);
      } else {
        const err = await response.json();
        alert(`Gagal: ${err.message || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Terjadi kesalahan pada sistem atau server!');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (successMessage) {
    return (
      <div className="p-8 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl animate-bounce">✅</div>
        <h2 className="text-2xl font-bold text-slate-800">Berhasil!</h2>
        <p className="text-slate-500">{successMessage}</p>
        <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full animate-[progress_1.8s_linear_forwards]" style={{ width: '100%', animation: 'none', background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-slate-400 mb-8 font-medium items-center gap-2">
        <Link href="/data-sources" className="hover:text-blue-600 transition-colors">Data Sources</Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-semibold">Add New Source</span>
      </nav>

      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-10">
        {[
          { n: 1, label: 'Choose Type' },
          { n: 2, label: sourceType === 'airbyte' ? 'Pick Connector' : 'Configure' },
          ...(sourceType === 'airbyte' ? [{ n: 3, label: 'Credentials' }] : []),
        ].map((s, i, arr) => (
          <React.Fragment key={s.n}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-colors
              ${step === s.n ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' :
                step > s.n ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs">
                {step > s.n ? '✓' : s.n}
              </span>
              {s.label}
            </div>
            {i < arr.length - 1 && <div className="flex-1 h-0.5 bg-slate-200 rounded-full max-w-[60px]" />}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1: Pilih Tipe Source ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Choose Source Type</h1>
            <p className="text-slate-500 mt-2">Bagaimana SARAI akan terhubung dengan data Anda?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SOURCE_TYPE_CARDS.map((card) => (
              <button
                key={card.id}
                onClick={() => { setSourceType(card.id); setStep(2); }}
                className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-blue-400 shadow-sm hover:shadow-xl transition-all text-left group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-5 rounded-full -translate-y-8 translate-x-8 group-hover:opacity-10 transition-opacity`} />
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{card.icon}</div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{card.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">{card.subtitle}</p>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold border border-blue-100 whitespace-nowrap ml-2">{card.badge}</span>
                </div>
                <p className="text-sm text-slate-500 mt-3 leading-relaxed">{card.desc}</p>
                <div className="mt-4 text-blue-600 text-sm font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Select <span>→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2 (Airbyte): Pilih Connector ─────────────────────────────── */}
      {step === 2 && sourceType === 'airbyte' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Pick a Connector</h1>
              <p className="text-slate-500 mt-1">Pilih platform yang ingin Anda sambungkan.</p>
            </div>
            <button onClick={() => { setStep(1); setSelectedConnector(null); }} className="text-sm text-slate-400 hover:text-slate-700 font-semibold flex items-center gap-1 mt-1">
              ← Back
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search connectors..."
                value={connectorSearch}
                onChange={(e) => setConnectorSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeCategory === cat
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Connector Grid */}
          {isLoadingConnectors ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-slate-100 rounded-2xl h-28 animate-pulse" />
              ))}
            </div>
          ) : filteredConnectors.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-3">🔌</div>
              <p className="font-semibold text-slate-600">Connector tidak ditemukan</p>
              <p className="text-sm mt-1">Coba ubah kata kunci atau kategori.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[420px] overflow-y-auto pr-1 pb-1">
              {filteredConnectors.map((conn) => (
                <button
                  key={conn.sourceDefinitionId}
                  onClick={() => { setSelectedConnector(conn); setStep(3); }}
                  className={`bg-white border-2 rounded-2xl p-4 text-left hover:shadow-lg transition-all group relative
                    ${selectedConnector?.sourceDefinitionId === conn.sourceDefinitionId
                      ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'border-transparent hover:border-blue-300'}`}
                >
                  {conn.isTrial && (
                    <span className="absolute top-2 right-2 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold border border-amber-200">TRIAL</span>
                  )}
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{conn.icon ?? '🔌'}</div>
                  <p className="font-bold text-slate-800 text-sm leading-tight">{conn.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{conn.category}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2 (Database/API): Config Form ────────────────────────────── */}
      {step === 2 && sourceType !== 'airbyte' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                {sourceType === 'database' ? '🗄️ Database Connection' : '🌐 API Configuration'}
              </h1>
              <p className="text-slate-500 mt-1">Isi detail koneksi untuk data source Anda.</p>
            </div>
            <button onClick={() => setStep(1)} className="text-sm text-slate-400 hover:text-slate-700 font-semibold">← Back</button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Production PostgreSQL"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Host Address</label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="localhost atau 192.168.x.x"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                    required
                  />
                </div>
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
                  {isLoading ? '⏳ Saving...' : 'Test & Save Connection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Step 3 (Airbyte): Credentials Form ───────────────────────────── */}
      {step === 3 && sourceType === 'airbyte' && selectedConnector && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-3xl">
                {selectedConnector.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{selectedConnector.name}</h1>
                <p className="text-slate-400 text-sm">{selectedConnector.category} · {selectedConnector.isTrial ? '🟡 Trial' : '🟢 Full Access'}</p>
              </div>
            </div>
            <button onClick={() => setStep(2)} className="text-sm text-slate-400 hover:text-slate-700 font-semibold mt-2">← Change Connector</button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <p className="text-sm text-slate-500 mb-6 leading-relaxed bg-blue-50 border border-blue-100 rounded-xl p-4">
              <span className="font-bold text-blue-700">ℹ️ Tentang {selectedConnector.name}:</span>{' '}
              {selectedConnector.description}
            </p>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`e.g. ${selectedConnector.name} Production`}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Connection Credentials (JSON)</label>
                <textarea
                  value={config}
                  onChange={(e) => setConfig(e.target.value)}
                  placeholder={`{\n  "api_key": "your-api-key-here",\n  "start_date": "2024-01-01"\n}`}
                  rows={7}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all resize-none"
                />
                <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                  <p className="text-xs text-amber-700">
                    Format JSON disesuaikan dengan kebutuhan konektor <strong>{selectedConnector.name}</strong>.
                    Lihat <span className="underline">dokumentasi Airbyte</span> untuk field yang diperlukan.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !name}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin">⏳</span> Connecting...
                    </>
                  ) : (
                    '🔗 Test & Save Connection'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}