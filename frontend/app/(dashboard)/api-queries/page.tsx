"use client";
import React, { useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";
import toast from "react-hot-toast";

type ApiQuery = {
  id: string;
  name: string;
  method: string;
  endpointUrl: string;
  authType: string;
  headers: any;
  bodyTemplate: any;
  responseMapping: any;
  executions: { statusCode: number; latencyMs: number; calledAt: string }[];
  createdAt: string;
};

const MethodBadge = ({ method }: { method: string }) => {
  const styles: Record<string, string> = {
    GET: "bg-blue-100 text-blue-700",
    POST: "bg-emerald-100 text-emerald-700",
    PUT: "bg-amber-100 text-amber-700",
    PATCH: "bg-purple-100 text-purple-700",
    DELETE: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-black px-2 py-0.5 rounded font-mono ${styles[method] || "bg-slate-100 text-slate-600"}`}>
      {method}
    </span>
  );
};

const StatusCodeBadge = ({ code }: { code: number }) => {
  const color = code >= 200 && code < 300 ? "text-emerald-600 bg-emerald-50" : code >= 400 ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{code}</span>;
};

export default function ApiQueriesPage() {
  const [queries, setQueries] = useState<ApiQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [resultModal, setResultModal] = useState<{ result: any; query: string } | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [editingQuery, setEditingQuery] = useState<ApiQuery | null>(null);

  const defaultForm = {
    name: "", endpointUrl: "", method: "GET",
    authType: "NONE", authToken: "",
    apiKeyName: "", apiKeyValue: "",
    basicUsername: "", basicPassword: "",
    headersRaw: "", responseMapping: "",
    bodyTemplate: "",
  };
  const [form, setForm] = useState(defaultForm);

  const fetchQueries = async () => {
    try {
      const res = await apiFetch("/api-queries");
      if (res.ok) setQueries(await res.json());
    } catch { toast.error("Gagal memuat API Queries"); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchQueries(); }, []);

  const buildPayload = () => {
    let headers: Record<string, string> = {};
    try { headers = form.headersRaw ? JSON.parse(form.headersRaw) : {}; } catch { }

    let authConfig: any = null;
    if (form.authType === "BEARER") authConfig = { token: form.authToken };
    else if (form.authType === "API_KEY") authConfig = { key: form.apiKeyName, value: form.apiKeyValue };
    else if (form.authType === "BASIC") authConfig = { username: form.basicUsername, password: form.basicPassword };

    let responseMapping: any = null;
    try { responseMapping = form.responseMapping ? JSON.parse(form.responseMapping) : null; } catch { }

    let bodyTemplate: any = null;
    try { bodyTemplate = form.bodyTemplate ? JSON.parse(form.bodyTemplate) : null; } catch { }

    return { name: form.name, endpointUrl: form.endpointUrl, method: form.method, headers, authType: form.authType, authConfig, responseMapping, bodyTemplate };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = toast.loading("Menyimpan...");
    try {
      const res = await apiFetch(editingQuery ? `/api-queries/${editingQuery.id}` : "/api-queries", {
        method: editingQuery ? "PATCH" : "POST",
        body: JSON.stringify(buildPayload()),
      });
      if (res.ok) {
        toast.success(editingQuery ? "API Query diperbarui!" : "API Query dibuat!", { id });
        setShowModal(false);
        setEditingQuery(null);
        setForm(defaultForm);
        fetchQueries();
      } else {
        const err = await res.json();
        toast.error(err.message || "Gagal menyimpan", { id });
      }
    } catch { toast.error("Koneksi gagal", { id }); }
  };

  const handleExecute = async (qId: string, name: string) => {
    setExecutingId(qId);
    const id = toast.loading(`Mengeksekusi "${name}"...`);
    try {
      const res = await apiFetch(`/api-queries/${qId}/execute`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`✅ Status ${data.statusCode} · ${data.latencyMs}ms`, { id });
        setResultModal({ result: data, query: name });
        fetchQueries();
      } else {
        toast.error(data.message || "Eksekusi gagal", { id });
      }
    } catch { toast.error("Koneksi gagal", { id }); }
    finally { setExecutingId(null); }
  };

  const handleDelete = async (qId: string) => {
    const id = toast.loading("Menghapus...");
    try {
      const res = await apiFetch(`/api-queries/${qId}`, { method: "DELETE" });
      if (res.ok) { toast.success("Dihapus!", { id }); fetchQueries(); }
      else toast.error("Gagal menghapus", { id });
    } catch { toast.error("Koneksi gagal", { id }); }
  };

  const openEdit = (q: ApiQuery) => {
    setEditingQuery(q);
    setForm({
      ...defaultForm,
      name: q.name, endpointUrl: q.endpointUrl, method: q.method,
      authType: q.authType || "NONE",
      headersRaw: q.headers ? JSON.stringify(q.headers, null, 2) : "",
      responseMapping: q.responseMapping ? JSON.stringify(q.responseMapping, null, 2) : "",
      bodyTemplate: q.bodyTemplate ? JSON.stringify(q.bodyTemplate, null, 2) : "",
    });
    setShowModal(true);
  };

  return (
    <div className="p-8 min-h-screen bg-slate-50">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-poppins font-black text-slate-800 tracking-tight">API Queries</h1>
          <p className="text-slate-500 text-sm mt-1">Custom HTTP request builder dengan multi-auth dan JSONPath response mapping.</p>
        </div>
        <button
          onClick={() => { setEditingQuery(null); setForm(defaultForm); setShowModal(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all"
        >
          + New API Query
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-widest font-bold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Nama</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">URL</th>
              <th className="px-6 py-4">Auth</th>
              <th className="px-6 py-4">Last Run</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-400 animate-pulse">Memuat...</td></tr>
            ) : queries.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center">
                <span className="text-4xl block mb-3">🌐</span>
                <p className="font-semibold text-slate-600">Belum ada API Query.</p>
              </td></tr>
            ) : queries.map((q) => {
              const lastExec = q.executions?.[0];
              return (
                <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{q.name}</td>
                  <td className="px-6 py-4"><MethodBadge method={q.method} /></td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono max-w-[180px] truncate" title={q.endpointUrl}>{q.endpointUrl}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{q.authType}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{lastExec ? new Date(lastExec.calledAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="px-6 py-4">{lastExec ? <StatusCodeBadge code={lastExec.statusCode} /> : <span className="text-xs text-slate-400">—</span>}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleExecute(q.id, q.name)} disabled={executingId === q.id}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
                        {executingId === q.id ? "..." : "▶ Run"}
                      </button>
                      <button onClick={() => openEdit(q)} className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Edit</button>
                      <button onClick={() => handleDelete(q.id)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">{editingQuery ? "✏️ Edit" : "🌐 New"} API Query</h2>
              <button onClick={() => { setShowModal(false); setEditingQuery(null); }} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Get Weather Data" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Endpoint URL</label>
                  <input required value={form.endpointUrl} onChange={(e) => setForm({ ...form, endpointUrl: e.target.value })} placeholder="https://api.example.com/data" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Method</label>
                  <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                    {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Auth Type</label>
                <select value={form.authType} onChange={(e) => setForm({ ...form, authType: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="NONE">None</option>
                  <option value="BEARER">Bearer Token</option>
                  <option value="API_KEY">API Key (Header)</option>
                  <option value="BASIC">Basic Auth</option>
                </select>
              </div>
              {form.authType === "BEARER" && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bearer Token</label>
                  <input value={form.authToken} onChange={(e) => setForm({ ...form, authToken: e.target.value })} placeholder="eyJhbGci..." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              )}
              {form.authType === "API_KEY" && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-bold text-slate-600 mb-1">Header Key</label><input value={form.apiKeyName} onChange={(e) => setForm({ ...form, apiKeyName: e.target.value })} placeholder="X-API-Key" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
                  <div><label className="block text-xs font-bold text-slate-600 mb-1">Value</label><input value={form.apiKeyValue} onChange={(e) => setForm({ ...form, apiKeyValue: e.target.value })} placeholder="sk-..." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
                </div>
              )}
              {form.authType === "BASIC" && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-bold text-slate-600 mb-1">Username</label><input value={form.basicUsername} onChange={(e) => setForm({ ...form, basicUsername: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
                  <div><label className="block text-xs font-bold text-slate-600 mb-1">Password</label><input type="password" value={form.basicPassword} onChange={(e) => setForm({ ...form, basicPassword: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Headers (JSON, opsional)</label>
                <textarea value={form.headersRaw} onChange={(e) => setForm({ ...form, headersRaw: e.target.value })} rows={2} placeholder='{"Content-Type": "application/json"}' className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
              </div>
              {["POST", "PUT", "PATCH"].includes(form.method) && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Body Template (JSON)</label>
                  <textarea value={form.bodyTemplate} onChange={(e) => setForm({ ...form, bodyTemplate: e.target.value })} rows={3} placeholder='{"key": "value"}' className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Response Mapping JSONPath (JSON, opsional)</label>
                <textarea value={form.responseMapping} onChange={(e) => setForm({ ...form, responseMapping: e.target.value })} rows={2} placeholder='{"total": "$.data.total", "items": "$.data.items"}' className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingQuery(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition-colors">Batal</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-colors">{editingQuery ? "Simpan Perubahan" : "Buat API Query"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[85vh] flex flex-col animate-in fade-in zoom-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">📦 Result — {resultModal.query}</h2>
              <button onClick={() => setResultModal(null)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <div className="flex gap-3 mb-4">
              <StatusCodeBadge code={resultModal.result.statusCode} />
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">{resultModal.result.latencyMs}ms</span>
              {resultModal.result.success ? <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">SUCCESS</span> : <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded font-bold">ERROR</span>}
            </div>
            {resultModal.result.mappedResult && (
              <div className="mb-3">
                <p className="text-xs font-bold text-slate-600 mb-1">Mapped Result (JSONPath)</p>
                <pre className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl overflow-auto max-h-32 font-mono">{JSON.stringify(resultModal.result.mappedResult, null, 2)}</pre>
              </div>
            )}
            <div className="flex-1 overflow-auto">
              <p className="text-xs font-bold text-slate-600 mb-1">Raw Response</p>
              <pre className="bg-slate-900 text-slate-100 text-xs p-4 rounded-xl overflow-auto font-mono">{JSON.stringify(resultModal.result.rawResponse, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
