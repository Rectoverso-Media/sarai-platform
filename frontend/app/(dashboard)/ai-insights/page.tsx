"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

type InsightType = "TREND_ANALYSIS" | "ANOMALY_DETECTION" | "PERIOD_COMPARISON" | "FORECAST";

type InsightResult = {
  id: string;
  insightType: InsightType;
  insightText: string;
  metadata: any;
  generatedAt: string;
  config?: { frequency: string };
};

const TYPE_CONFIG: Record<InsightType, { label: string; icon: string; color: string; bgColor: string; borderColor: string }> = {
  TREND_ANALYSIS: {
    label: "Trend Analysis",
    icon: "📈",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  ANOMALY_DETECTION: {
    label: "Anomaly Detection",
    icon: "🔍",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  PERIOD_COMPARISON: {
    label: "Period Comparison",
    icon: "📊",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  FORECAST: {
    label: "Forecast",
    icon: "🔮",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
};

export default function AiInsightsPage() {
  const [insights, setInsights] = useState<InsightResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<InsightType | "ALL">("ALL");

  const fetchInsights = async () => {
    setLoading(true);
    const [insRes, sumRes] = await Promise.all([
      apiFetch("/insights?limit=20"),
      apiFetch("/insights/summary"),
    ]);
    if (insRes.ok) setInsights(await insRes.json());
    if (sumRes.ok) setSummary(await sumRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchInsights(); }, []);

  const generateInsight = async (type: string) => {
    setGenerating(type);
    await apiFetch(`/insights/generate/${type}`, { method: "POST" });
    await fetchInsights();
    setGenerating(null);
  };

  const generateAll = async () => {
    setGenerating("all");
    await apiFetch("/insights/generate/all", { method: "POST" });
    await fetchInsights();
    setGenerating(null);
  };

  const filtered = activeFilter === "ALL"
    ? insights
    : insights.filter((i) => i.insightType === activeFilter);

  const latestByType: Record<string, InsightResult> = {};
  insights.forEach((i) => {
    if (!latestByType[i.insightType]) latestByType[i.insightType] = i;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span>✨</span> AI Insights
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Analisis otomatis oleh SARAI: 4 tipe insight yang di-generate terjadwal setiap hari
          </p>
        </div>
        <button
          onClick={generateAll}
          disabled={!!generating}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
        >
          {generating === "all" ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "⚡"
          )}
          Generate All
        </button>
      </div>

      {/* Summary Cards — 1 terbaru per tipe */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {(Object.keys(TYPE_CONFIG) as InsightType[]).map((type) => {
          const cfg = TYPE_CONFIG[type];
          const latest = latestByType[type];
          const typeKey = type.toLowerCase().replace("_", "-").replace("_", "-");
          const endpointMap: Record<string, string> = {
            TREND_ANALYSIS: "trend",
            ANOMALY_DETECTION: "anomaly",
            PERIOD_COMPARISON: "period",
            FORECAST: "forecast",
          };
          return (
            <div
              key={type}
              className={`${cfg.bgColor} border ${cfg.borderColor} rounded-2xl p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{cfg.icon}</span>
                <button
                  onClick={() => generateInsight(endpointMap[type])}
                  disabled={!!generating}
                  className={`text-xs px-2 py-1 rounded-lg border ${cfg.borderColor} ${cfg.color} hover:opacity-80 disabled:opacity-40 transition-all font-medium`}
                >
                  {generating === endpointMap[type] ? "..." : "↻ Generate"}
                </button>
              </div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${cfg.color} mb-1`}>
                {cfg.label}
              </p>
              {latest ? (
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {latest.insightText.substring(0, 100)}...
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada insight</p>
              )}
              {latest && (
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(latest.generatedAt).toLocaleDateString("id-ID")}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["ALL", ...Object.keys(TYPE_CONFIG)] as (InsightType | "ALL")[]).map((f) => {
          const cfg = f !== "ALL" ? TYPE_CONFIG[f as InsightType] : null;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                activeFilter === f
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cfg ? `${cfg.icon} ${cfg.label}` : "🗂️ Semua"}
            </button>
          );
        })}
      </div>

      {/* Insights List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          Memuat insights...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-4">✨</p>
          <p className="text-slate-600 font-medium">Belum ada insights untuk filter ini</p>
          <p className="text-slate-400 text-sm mt-1">
            Klik &quot;Generate All&quot; untuk membuat insights pertama
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((insight) => {
            const cfg = TYPE_CONFIG[insight.insightType];
            return (
              <div
                key={insight.id}
                className={`bg-white rounded-2xl border ${cfg.borderColor} p-6 hover:shadow-sm transition-all`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg w-9 h-9 ${cfg.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      {cfg.icon}
                    </span>
                    <div>
                      <span
                        className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(insight.generatedAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                  {insight.metadata && (
                    <div className="flex gap-3 flex-shrink-0">
                      {insight.insightType === "ANOMALY_DETECTION" && (
                        <>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Error Rate</p>
                            <p className={`text-sm font-bold ${insight.metadata.errorRate > 10 ? "text-red-600" : "text-emerald-600"}`}>
                              {insight.metadata.errorRate?.toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Failure Rate</p>
                            <p className={`text-sm font-bold ${insight.metadata.failureRate > 15 ? "text-red-600" : "text-emerald-600"}`}>
                              {insight.metadata.failureRate?.toFixed(1)}%
                            </p>
                          </div>
                        </>
                      )}
                      {insight.insightType === "TREND_ANALYSIS" && (
                        <>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Query Trend</p>
                            <p className={`text-sm font-bold ${insight.metadata.queryTrendPct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {insight.metadata.queryTrendPct >= 0 ? "+" : ""}{insight.metadata.queryTrendPct?.toFixed(1)}%
                            </p>
                          </div>
                        </>
                      )}
                      {insight.insightType === "FORECAST" && insight.metadata.nextWeekForecast && (
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Proyeksi</p>
                          <p className="text-sm font-bold text-purple-600">
                            ~{insight.metadata.nextWeekForecast} query
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mt-4">
                  {insight.insightText}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
