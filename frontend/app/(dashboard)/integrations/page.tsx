"use client";

import React, { useState, useEffect } from "react";
import { apiFetch, API_URL } from "@/lib/api";

type Integration = {
  id: string;
  name: string;
  provider: string;
  createdAt: string;
};

type Provider = {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiresCredentials?: boolean;
  odataEndpoint?: boolean;
};

type TestResult = {
  connected: boolean;
  message: string;
  odataUrl?: string;
  metadataUrl?: string;
};

const PROVIDER_COLORS: Record<string, string> = {
  google_sheets: "from-emerald-500 to-green-600",
  excel: "from-green-600 to-teal-700",
  looker_studio: "from-blue-500 to-indigo-600",
  power_bi: "from-yellow-500 to-orange-600",
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [formName, setFormName] = useState("");
  const [formApiKey, setFormApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [showExportModal, setShowExportModal] = useState<"sheets" | "excel" | null>(null);
  const [exportQueryId, setExportQueryId] = useState("");
  const [sheetId, setSheetId] = useState("");
  const [tabName, setTabName] = useState("SARAI Export");
  const [exportMode, setExportMode] = useState<"replace" | "append">("replace");
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [intRes, provRes] = await Promise.all([
        apiFetch("/integrations"),
        apiFetch("/integrations/providers"),
      ]);
      if (intRes.ok) setIntegrations(await intRes.json());
      if (provRes.ok) setProviders(await provRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddIntegration = async () => {
    if (!selectedProvider || !formName.trim()) return;
    setSaving(true);
    const res = await apiFetch("/integrations", {
      method: "POST",
      body: JSON.stringify({
        name: formName,
        provider: selectedProvider.id,
        apiKey: formApiKey || undefined,
      }),
    });
    if (res.ok) {
      await fetchData();
      setShowAddModal(false);
      setFormName("");
      setFormApiKey("");
      setSelectedProvider(null);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus integrasi ini?")) return;
    await apiFetch(`/integrations/${id}`, { method: "DELETE" });
    setIntegrations((prev) => prev.filter((i) => i.id !== id));
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    const res = await apiFetch(`/integrations/${id}/test`, { method: "POST" });
    if (res.ok) {
      const result = await res.json();
      setTestResults((prev) => ({ ...prev, [id]: result }));
    }
    setTestingId(null);
  };

  const handleExportSheets = async () => {
    if (!sheetId.trim()) return;
    setExporting(true);
    setExportResult(null);
    const res = await apiFetch("/integrations/sheets/export", {
      method: "POST",
      body: JSON.stringify({
        sheetId,
        tabName,
        queryId: exportQueryId || undefined,
        mode: exportMode,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setExportResult(`✅ ${data.message}`);
    } else {
      const err = await res.json().catch(() => ({}));
      setExportResult(`❌ Gagal: ${err.message || "Unknown error"}`);
    }
    setExporting(false);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    setExportResult(null);
    const res = await apiFetch("/integrations/excel/export", {
      method: "POST",
      body: JSON.stringify({
        queryId: exportQueryId || undefined,
        sheetName: tabName,
        filename: `sarai-export-${Date.now()}`,
      }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sarai-export-${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setExportResult("✅ File Excel berhasil didownload!");
    } else {
      const err = await res.json().catch(() => ({}));
      setExportResult(`❌ Gagal: ${err.message || "Unknown error"}`);
    }
    setExporting(false);
  };

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <span className="text-2xl">🔗</span> Integration Management
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Kelola koneksi ke platform output: Google Sheets, Excel, Looker Studio, Power BI
        </p>
      </div>

      {/* Provider Cards (Catalog) */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
          Platform yang Didukung
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {providers.map((provider) => {
            const connected = integrations.some((i) => i.provider === provider.id);
            const color = PROVIDER_COLORS[provider.id] || "from-slate-500 to-slate-600";
            return (
              <div
                key={provider.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl mb-3`}
                >
                  {provider.icon}
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">{provider.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {provider.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      connected
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {connected ? "Terhubung" : "Belum dikonfigurasi"}
                  </span>
                  {provider.odataEndpoint && (
                    <span className="text-xs text-blue-500 font-medium">OData</span>
                  )}
                </div>
                {/* Quick action buttons */}
                {provider.id === "google_sheets" && (
                  <button
                    onClick={() => setShowExportModal("sheets")}
                    className="mt-3 w-full text-xs py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
                  >
                    Export ke Sheets →
                  </button>
                )}
                {provider.id === "excel" && (
                  <button
                    onClick={() => setShowExportModal("excel")}
                    className="mt-3 w-full text-xs py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
                  >
                    Download .xlsx →
                  </button>
                )}
                {provider.id === "looker_studio" && (
                  <a
                    href={`${BACKEND_URL}/odata`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block w-full text-xs py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-center"
                  >
                    OData Endpoint →
                  </a>
                )}
                {provider.id === "power_bi" && (
                  <a
                    href={`${BACKEND_URL}/odata/SyncedData`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block w-full text-xs py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors font-medium text-center"
                  >
                    Connect Power BI →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* OData Connection Info */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 mb-8 text-white">
        <h2 className="font-semibold mb-1 flex items-center gap-2">
          <span>⚡</span> OData Endpoint (Looker Studio & Power BI)
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Gunakan URL berikut untuk menghubungkan Looker Studio atau Power BI secara langsung:
        </p>
        <div className="space-y-2">
          {[
            { label: "Data URL", url: `${BACKEND_URL}/odata/SyncedData` },
            { label: "Metadata", url: `${BACKEND_URL}/odata/$metadata` },
            { label: "Service Doc", url: `${BACKEND_URL}/odata` },
          ].map(({ label, url }) => (
            <div key={label} className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-2">
              <span className="text-xs text-slate-400 w-24">{label}:</span>
              <code className="text-xs text-emerald-400 flex-1 mx-3 truncate">{url}</code>
              <button
                onClick={() => navigator.clipboard.writeText(url)}
                className="text-xs text-slate-400 hover:text-white transition-colors flex-shrink-0"
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Connected Integrations List */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">
            Integrasi Terdaftar ({integrations.length})
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            + Tambah Integrasi
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Memuat...</div>
        ) : integrations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-4xl mb-3">🔗</p>
            <p className="text-slate-500 text-sm">
              Belum ada integrasi yang ditambahkan.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              Tambah integrasi pertama →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {integrations.map((integration) => {
              const provider = providers.find((p) => p.id === integration.provider);
              const color = PROVIDER_COLORS[integration.provider] || "from-slate-400 to-slate-500";
              const testResult = testResults[integration.id];
              return (
                <div key={integration.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl flex-shrink-0`}>
                    {provider?.icon || "🔗"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">{integration.name}</p>
                    <p className="text-xs text-slate-500">
                      {provider?.name || integration.provider} •{" "}
                      {new Date(integration.createdAt).toLocaleDateString("id-ID")}
                    </p>
                    {testResult && (
                      <p className={`text-xs mt-1 ${testResult.connected ? "text-emerald-600" : "text-red-500"}`}>
                        {testResult.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTest(integration.id)}
                      disabled={testingId === integration.id}
                      className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
                    >
                      {testingId === integration.id ? "Testing..." : "Test"}
                    </button>
                    <button
                      onClick={() => handleDelete(integration.id)}
                      className="text-xs px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add Integration */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-slate-800 mb-4">Tambah Integrasi Baru</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProvider(p)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${
                        selectedProvider?.id === p.id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span className="font-medium">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nama Integrasi</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="contoh: Google Sheets Marketing"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              {selectedProvider?.requiresCredentials && (
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    API Key / Credential (opsional)
                  </label>
                  <input
                    type="password"
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder="Masukkan API key..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Untuk Google Sheets, gunakan env vars GOOGLE_CLIENT_EMAIL & GOOGLE_PRIVATE_KEY di server.
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleAddIntegration}
                disabled={!selectedProvider || !formName.trim() || saving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Menyimpan..." : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Export ke Sheets */}
      {showExportModal === "sheets" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span>📊</span> Export ke Google Sheets
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Spreadsheet ID *</label>
                <input
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  placeholder="Dari URL: docs.google.com/spreadsheets/d/[ID]/..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nama Tab/Sheet</label>
                <input
                  value={tabName}
                  onChange={(e) => setTabName(e.target.value)}
                  placeholder="SARAI Export"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Query ID (opsional)</label>
                <input
                  value={exportQueryId}
                  onChange={(e) => setExportQueryId(e.target.value)}
                  placeholder="UUID query — kosongkan untuk export DataSources"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Mode</label>
                <div className="flex gap-2">
                  {(["replace", "append"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setExportMode(m)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                        exportMode === m
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {m === "replace" ? "🔄 Replace" : "➕ Append"}
                    </button>
                  ))}
                </div>
              </div>
              {exportResult && (
                <div className={`p-3 rounded-xl text-sm ${exportResult.startsWith("✅") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {exportResult}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowExportModal(null); setExportResult(null); }} className="flex-1 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
                Tutup
              </button>
              <button onClick={handleExportSheets} disabled={!sheetId.trim() || exporting} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {exporting ? "Mengekspor..." : "Export Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Export ke Excel */}
      {showExportModal === "excel" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span>📗</span> Export ke Excel (.xlsx)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nama Sheet</label>
                <input
                  value={tabName}
                  onChange={(e) => setTabName(e.target.value)}
                  placeholder="SARAI Export"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Query ID (opsional)</label>
                <input
                  value={exportQueryId}
                  onChange={(e) => setExportQueryId(e.target.value)}
                  placeholder="UUID query — kosongkan untuk export DataSources"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              {exportResult && (
                <div className={`p-3 rounded-xl text-sm ${exportResult.startsWith("✅") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {exportResult}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowExportModal(null); setExportResult(null); }} className="flex-1 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
                Tutup
              </button>
              <button onClick={handleExportExcel} disabled={exporting} className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                {exporting ? "Membuat file..." : "Download .xlsx"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
