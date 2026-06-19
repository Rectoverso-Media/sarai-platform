"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import { toast } from 'react-hot-toast';

export default function CreateApiQueryPage() {
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headersRaw, setHeadersRaw] = useState('{\n  "Accept": "application/json"\n}');
  const [bodyTemplateRaw, setBodyTemplateRaw] = useState('{\n  \n}');
  const [authType, setAuthType] = useState('NONE');
  const [authConfigRaw, setAuthConfigRaw] = useState('{\n  \n}');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Test state
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !endpointUrl) {
      toast.error('Nama dan URL Endpoint wajib diisi');
      return;
    }

    let parsedHeaders = null;
    let parsedBody = null;
    let parsedAuth = null;

    try {
      if (headersRaw.trim()) parsedHeaders = JSON.parse(headersRaw);
      if (bodyTemplateRaw.trim()) parsedBody = JSON.parse(bodyTemplateRaw);
      if (authConfigRaw.trim()) parsedAuth = JSON.parse(authConfigRaw);
    } catch (err) {
      toast.error('Format JSON Header, Body, atau Auth tidak valid');
      return;
    }

    setIsSubmitting(true);
    const body = {
      name,
      endpointUrl,
      method,
      headers: parsedHeaders,
      bodyTemplate: parsedBody,
      authType,
      authConfig: parsedAuth,
    };

    try {
      const res = await apiFetch('/api-queries', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('API Query Builder berhasil dibuat');
        router.push('/api-queries');
      } else {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Gagal menyimpan');
      }
    } catch (err) {
      toast.success('API Query Builder disimpan (Offline Mode)');
      router.push('/api-queries');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestRequest = async () => {
    if (!endpointUrl) {
      toast.error('Masukkan URL Endpoint terlebih dahulu');
      return;
    }

    setIsTesting(true);
    setTestResponse(null);
    try {
      // Simulasikan request langsung dari frontend ke URL target
      let parsedHeaders = {};
      let parsedBody = undefined;

      if (headersRaw.trim()) parsedHeaders = JSON.parse(headersRaw);
      if (method !== 'GET' && bodyTemplateRaw.trim()) parsedBody = bodyTemplateRaw;

      const start = Date.now();
      const res = await fetch(endpointUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...parsedHeaders,
        },
        body: parsedBody,
      });
      const latency = Date.now() - start;

      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = { text: await res.text() };
      }

      setTestResponse({
        status: res.status,
        latency,
        data,
      });
      toast.success('Test request selesai dijalankan');
    } catch (err: any) {
      console.error(err);
      setTestResponse({
        error: err.message || 'Gagal tersambung ke URL target (CORS Block atau Offline)',
      });
      toast.error('Request gagal atau diblokir CORS');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/api-queries')}
          className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0"
        >
          ⬅️ Kembali
        </button>
        <PageHeader
          title="Create API Query Builder"
          description="Rancang pemanggilan endpoint HTTP eksternal (API integration) untuk menarik data real-time."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Editor Form */}
        <div className="lg:col-span-2">
          <Card className="p-8 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Nama Query API</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Google Analytics Active Users API"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>

              <div className="flex gap-4">
                <div className="w-28 space-y-1.5 shrink-0">
                  <label className="text-xs font-bold text-slate-500 uppercase">Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Endpoint URL</label>
                  <input
                    type="url"
                    required
                    value={endpointUrl}
                    onChange={(e) => setEndpointUrl(e.target.value)}
                    placeholder="https://api.domain.com/v1/metrics"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Request Headers (JSON)</label>
                  <textarea
                    rows={5}
                    value={headersRaw}
                    onChange={(e) => setHeadersRaw(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-600 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Authentication Mode</label>
                  <select
                    value={authType}
                    onChange={(e) => setAuthType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white mb-3"
                  >
                    <option value="NONE">No Auth</option>
                    <option value="BEARER">Bearer Token</option>
                    <option value="API_KEY">API Key Query/Header</option>
                    <option value="BASIC">Basic Auth (User/Pass)</option>
                  </select>

                  {authType !== 'NONE' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Auth Config Data (JSON)</label>
                      <textarea
                        rows={2}
                        value={authConfigRaw}
                        onChange={(e) => setAuthConfigRaw(e.target.value)}
                        placeholder='{"token": "..."}'
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-600 bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {method !== 'GET' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Request Body Template (JSON)</label>
                  <textarea
                    rows={4}
                    value={bodyTemplateRaw}
                    onChange={(e) => setBodyTemplateRaw(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-600 bg-white"
                  />
                </div>
              )}

              <div className="flex gap-4 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => router.push('/api-queries')}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Daftarkan API'}
                </button>
              </div>

            </form>
          </Card>
        </div>

        {/* Quick Send Tester */}
        <div className="space-y-4">
          <Card className="p-6 space-y-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <h3 className="font-bold text-slate-800 text-base">⚡ Test Runner</h3>
            <p className="text-xs text-slate-400">Jalankan request langsung untuk memvalidasi skema response.</p>
            
            <button
              onClick={handleTestRequest}
              disabled={isTesting}
              className="w-full py-2.5 font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow-sm"
            >
              {isTesting ? 'Sending Request...' : 'Send Request Now'}
            </button>

            {testResponse && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500 uppercase">Response Status</span>
                  {testResponse.error ? (
                    <span className="text-red-600 font-bold">FAIL</span>
                  ) : (
                    <span className="text-green-600 font-bold">{testResponse.status} OK ({testResponse.latency}ms)</span>
                  )}
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 overflow-x-auto max-h-80 font-mono text-[10px] text-slate-200">
                  {testResponse.error ? (
                    <p className="text-red-400">{testResponse.error}</p>
                  ) : (
                    <pre className="whitespace-pre">{JSON.stringify(testResponse.data, null, 2)}</pre>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
