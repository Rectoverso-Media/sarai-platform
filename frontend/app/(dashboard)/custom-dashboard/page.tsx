"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../../../lib/api';
import toast from 'react-hot-toast';

import { Responsive, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import {
  BarChart, Bar, ResponsiveContainer, XAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, YAxis, CartesianGrid,
} from 'recharts';
import {
  LayoutDashboard, Plus, Save, Share2, Settings, X, Trash2, RefreshCw,
  TrendingUp, BarChart2, PieChart as PieIcon, Table, Hash, Type, Image, ChevronDown
} from 'lucide-react';

// ========================
// TYPES
// ========================
type WidgetType = 'kpi' | 'number' | 'bar' | 'line' | 'pie' | 'table' | 'text' | 'image';

interface WidgetConfig {
  dataSource?: 'traffic' | 'distribution' | 'performance' | 'summary' | 'custom';
  color?: string;
  value?: string;
  suffix?: string;
  text?: string;
  imageUrl?: string;
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
}

interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  config?: WidgetConfig;
}

interface DashboardMeta {
  id: string;
  name: string;
  description?: string;
  theme: string;
  autoRefreshSeconds?: number;
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const WIDGET_CATALOG: { type: WidgetType; label: string; icon: React.ReactNode; defaultW: number; defaultH: number; color: string }[] = [
  { type: 'kpi',    label: 'KPI Card',    icon: <TrendingUp size={14} />,  defaultW: 3, defaultH: 2, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { type: 'number', label: 'Number Card', icon: <Hash size={14} />,        defaultW: 3, defaultH: 2, color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { type: 'bar',    label: 'Bar Chart',   icon: <BarChart2 size={14} />,   defaultW: 6, defaultH: 4, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { type: 'line',   label: 'Line Chart',  icon: <TrendingUp size={14} />,  defaultW: 6, defaultH: 4, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { type: 'pie',    label: 'Pie Chart',   icon: <PieIcon size={14} />,     defaultW: 4, defaultH: 4, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { type: 'table',  label: 'Data Table',  icon: <Table size={14} />,       defaultW: 8, defaultH: 4, color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { type: 'text',   label: 'Text Block',  icon: <Type size={14} />,        defaultW: 4, defaultH: 2, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { type: 'image',  label: 'Image',       icon: <Image size={14} />,       defaultW: 4, defaultH: 4, color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

// ========================
// WIDGET CONFIG PANEL
// ========================
function WidgetConfigPanel({
  widget,
  onUpdate,
  onClose,
  onDelete,
}: {
  widget: DashboardWidget;
  onUpdate: (updated: DashboardWidget) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [local, setLocal] = useState<DashboardWidget>(widget);

  const update = (patch: Partial<DashboardWidget>) => {
    setLocal((prev) => ({ ...prev, ...patch }));
  };
  const updateConfig = (patch: Partial<WidgetConfig>) => {
    setLocal((prev) => ({ ...prev, config: { ...(prev.config ?? {}), ...patch } }));
  };

  const handleSave = () => {
    onUpdate(local);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[440px] max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-slate-500" />
            <h2 className="font-bold text-slate-800">Configure Widget</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Widget Title</label>
            <input
              type="text"
              value={local.title}
              onChange={(e) => update({ title: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>

          {/* Data Source — untuk chart widgets */}
          {['bar', 'line', 'pie'].includes(local.type) && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Data Source</label>
              <select
                value={local.config?.dataSource ?? 'traffic'}
                onChange={(e) => updateConfig({ dataSource: e.target.value as any })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
              >
                <option value="traffic">Query Traffic (Last 7 Days)</option>
                <option value="distribution">Data Source Distribution</option>
                <option value="performance">Query Performance (Hourly)</option>
              </select>
            </div>
          )}

          {/* Bar color */}
          {['bar', 'line'].includes(local.type) && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Chart Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={local.config?.color ?? '#3b82f6'}
                  onChange={(e) => updateConfig({ color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                />
                <span className="text-sm text-slate-600 font-mono">{local.config?.color ?? '#3b82f6'}</span>
              </div>
            </div>
          )}

          {/* KPI / Number — custom value */}
          {['kpi', 'number'].includes(local.type) && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Value / Metric Source</label>
                <select
                  value={local.config?.dataSource ?? 'summary'}
                  onChange={(e) => updateConfig({ dataSource: e.target.value as any })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
                >
                  <option value="summary">Auto (from Summary Stats)</option>
                  <option value="custom">Custom Value</option>
                </select>
              </div>
              {local.config?.dataSource === 'custom' && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Custom Value</label>
                  <input
                    type="text"
                    value={local.config?.value ?? ''}
                    onChange={(e) => updateConfig({ value: e.target.value })}
                    placeholder="e.g. 42, 99.9%"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Unit / Suffix</label>
                <input
                  type="text"
                  value={local.config?.suffix ?? ''}
                  onChange={(e) => updateConfig({ suffix: e.target.value })}
                  placeholder="e.g. GB, %, users"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </>
          )}

          {/* Text Block */}
          {local.type === 'text' && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Content</label>
                <textarea
                  value={local.config?.text ?? ''}
                  onChange={(e) => updateConfig({ text: e.target.value })}
                  rows={4}
                  placeholder="Write your markdown or plain text here..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Text Align</label>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => updateConfig({ textAlign: align })}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border capitalize transition-colors ${local.config?.textAlign === align ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Image */}
          {local.type === 'image' && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Image URL</label>
              <input
                type="url"
                value={local.config?.imageUrl ?? ''}
                onChange={(e) => updateConfig({ imageUrl: e.target.value })}
                placeholder="https://example.com/image.png"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          )}

          {/* Background Color */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Background Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={local.config?.backgroundColor ?? '#ffffff'}
                onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
              />
              <button onClick={() => updateConfig({ backgroundColor: undefined })} className="text-xs text-slate-500 hover:text-slate-700 underline">Reset to default</button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-semibold px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} /> Delete Widget
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm text-white font-semibold bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================
// WIDGET RENDERER
// ========================
function WidgetContent({
  widget,
  trafficData,
  distributionData,
  performanceData,
  summaryData,
}: {
  widget: DashboardWidget;
  trafficData: any[];
  distributionData: any[];
  performanceData: any[];
  summaryData: any;
}) {
  const chartData =
    widget.config?.dataSource === 'distribution' ? distributionData
    : widget.config?.dataSource === 'performance' ? performanceData
    : trafficData;

  const chartColor = widget.config?.color ?? '#3b82f6';

  const xKey =
    widget.config?.dataSource === 'performance' ? 'time'
    : widget.config?.dataSource === 'distribution' ? 'name'
    : 'day';

  const yKey =
    widget.config?.dataSource === 'performance' ? 'avgTime' : 'value';

  // KPI / Number Card
  if (widget.type === 'kpi' || widget.type === 'number') {
    let displayValue: string | number = widget.config?.value ?? '—';
    if (widget.config?.dataSource !== 'custom' && summaryData) {
      const keyMap: Record<string, string> = {
        'Total Data Sources': 'totalSources',
        'Total Queries': 'totalQueries',
        'Users': 'totalUsers',
        'Executions Today': 'executionsToday',
      };
      const mapped = keyMap[widget.title];
      if (mapped) displayValue = summaryData[mapped] ?? displayValue;
    }

    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-widest text-center">{widget.title}</span>
        <span className="text-4xl font-black text-slate-800 mt-2 tabular-nums">
          {displayValue}
          {widget.config?.suffix && <span className="text-lg font-medium text-slate-400 ml-1">{widget.config.suffix}</span>}
        </span>
        {widget.type === 'kpi' && (
          <span className="mt-2 text-xs text-emerald-500 font-semibold">↑ Live</span>
        )}
      </div>
    );
  }

  // Bar Chart
  if (widget.type === 'bar') {
    return (
      <div className="flex flex-col h-full w-full">
        <span className="text-slate-600 font-bold text-sm mb-2">{widget.title}</span>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.length > 0 ? chartData : [{ [xKey]: 'No Data', [yKey]: 0 }]}>
              <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey={yKey} fill={chartColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Line Chart
  if (widget.type === 'line') {
    return (
      <div className="flex flex-col h-full w-full">
        <span className="text-slate-600 font-bold text-sm mb-2">{widget.title}</span>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.length > 0 ? chartData : [{ [xKey]: '—', [yKey]: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey={yKey} stroke={chartColor} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Pie Chart
  if (widget.type === 'pie') {
    const pieData = widget.config?.dataSource === 'distribution' ? distributionData : chartData;
    return (
      <div className="flex flex-col h-full w-full">
        <span className="text-slate-600 font-bold text-sm mb-2">{widget.title}</span>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="45%" innerRadius="40%" outerRadius="65%" paddingAngle={4} dataKey="value">
                {pieData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Data Table
  if (widget.type === 'table') {
    const tableData = chartData.slice(0, 8);
    const cols = tableData.length > 0 ? Object.keys(tableData[0]) : [];
    return (
      <div className="flex flex-col h-full w-full overflow-hidden">
        <span className="text-slate-600 font-bold text-sm mb-2">{widget.title}</span>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50">
                {cols.map((col) => (
                  <th key={col} className="px-2 py-1.5 text-left font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  {cols.map((col) => (
                    <td key={col} className="px-2 py-1.5 border-b border-slate-100 text-slate-700">{String(row[col] ?? '—')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Text Block
  if (widget.type === 'text') {
    return (
      <div
        className="flex flex-col h-full w-full p-2 overflow-auto"
        style={{ textAlign: widget.config?.textAlign ?? 'left' }}
      >
        <span className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">{widget.title}</span>
        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
          {widget.config?.text || 'Click ⚙ to add content to this text block.'}
        </p>
      </div>
    );
  }

  // Image
  if (widget.type === 'image') {
    return (
      <div className="flex flex-col h-full w-full">
        <span className="text-slate-600 font-bold text-xs mb-1.5">{widget.title}</span>
        <div className="flex-1 overflow-hidden rounded-lg">
          {widget.config?.imageUrl ? (
            <img
              src={widget.config.imageUrl}
              alt={widget.title}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x200?text=Image+Error'; }}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
              <div className="text-center text-slate-400">
                <Image size={28} className="mx-auto mb-2" />
                <p className="text-xs">Add image URL in config</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div className="text-slate-400 text-xs flex items-center justify-center h-full">Unknown widget type</div>;
}

// ========================
// MAIN COMPONENT
// ========================
export default function CustomDashboardBuilder() {
  // ✅ All useState FIRST — Rules of Hooks
  const { width, containerRef, mounted } = useContainerWidth();

  // Widget & Layout state
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    { id: 'kpi-1', type: 'kpi', title: 'Total Data Sources', config: { dataSource: 'summary' } },
    { id: 'chart-1', type: 'bar', title: 'Traffic Overview', config: { dataSource: 'traffic', color: '#3b82f6' } },
  ]);
  const [layout, setLayout] = useState([
    { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2 },
    { i: 'chart-1', x: 3, y: 0, w: 6, h: 4 },
  ]);

  // Dashboard metadata
  const [currentDashboard, setCurrentDashboard] = useState<DashboardMeta | null>(null);
  const [dashboardList, setDashboardList] = useState<DashboardMeta[]>([]);
  const [showDashboardPicker, setShowDashboardPicker] = useState(false);

  // Chart data
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);

  // UI State
  const [configWidget, setConfigWidget] = useState<DashboardWidget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);

  // Auto-refresh ref
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ========================
  // DATA FETCHING
  // ========================
  const fetchChartData = useCallback(async () => {
    try {
      const [trafficRes, distRes, perfRes, summaryRes] = await Promise.all([
        apiFetch('/dashboard/stats/traffic'),
        apiFetch('/dashboard/stats/distribution'),
        apiFetch('/dashboard/stats/performance'),
        apiFetch('/dashboard/stats/summary'),
      ]);
      if (trafficRes.ok) setTrafficData(await trafficRes.json());
      if (distRes.ok) setDistributionData(await distRes.json());
      if (perfRes.ok) setPerformanceData(await perfRes.json());
      if (summaryRes.ok) setSummaryData(await summaryRes.json());
    } catch {
      // Silent fail for auto-refresh
    }
  }, []);

  // Load dashboards list + initial chart data
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const listRes = await apiFetch('/dashboard');
        if (listRes.ok) {
          const list = await listRes.json();
          setDashboardList(list);
          if (list.length > 0) {
            // Load first dashboard
            const first = list[0];
            setCurrentDashboard(first);
            const detailRes = await apiFetch(`/dashboard/${first.id}`);
            if (detailRes.ok) {
              const detail = await detailRes.json();
              if (detail.widgets?.length) setWidgets(detail.widgets);
              if (detail.layout?.length) setLayout(detail.layout);
            }
          }
        }
      } catch {
        // No dashboards yet, start fresh
      }
      await fetchChartData();
    };
    loadInitial();
  }, [fetchChartData]);

  // Auto-refresh setup
  useEffect(() => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    if (currentDashboard?.autoRefreshSeconds) {
      refreshIntervalRef.current = setInterval(fetchChartData, currentDashboard.autoRefreshSeconds * 1000);
    }
    return () => { if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current); };
  }, [currentDashboard?.autoRefreshSeconds, fetchChartData]);

  // ========================
  // DASHBOARD ACTIONS
  // ========================
  const createNewDashboard = async () => {
    const name = prompt('Dashboard name:');
    if (!name?.trim()) return;
    try {
      const res = await apiFetch('/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        const newDb = await res.json();
        setDashboardList((prev) => [newDb, ...prev]);
        setCurrentDashboard(newDb);
        setWidgets([]);
        setLayout([]);
        toast.success(`Dashboard "${newDb.name}" created!`);
        setShowDashboardPicker(false);
      }
    } catch {
      toast.error('Failed to create dashboard');
    }
  };

  const switchDashboard = async (db: DashboardMeta) => {
    try {
      const res = await apiFetch(`/dashboard/${db.id}`);
      if (res.ok) {
        const detail = await res.json();
        setCurrentDashboard(db);
        setWidgets(detail.widgets?.length ? detail.widgets : []);
        setLayout(detail.layout?.length ? detail.layout : []);
        setShowDashboardPicker(false);
      }
    } catch {
      toast.error('Failed to switch dashboard');
    }
  };

  const saveDashboard = async () => {
    if (!currentDashboard) {
      // No dashboard yet — create one
      const name = prompt('Save as (dashboard name):') ?? 'My Dashboard';
      try {
        const res = await apiFetch('/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        if (res.ok) {
          const newDb = await res.json();
          setCurrentDashboard(newDb);
          await saveLayout(newDb.id);
        }
      } catch {
        toast.error('Failed to create dashboard');
      }
      return;
    }
    await saveLayout(currentDashboard.id);
  };

  const saveLayout = async (dashboardId: string) => {
    setIsSaving(true);
    try {
      const cleanLayout = layout.map((l) => ({ ...l, y: l.y ?? 99 }));
      const res = await apiFetch(`/dashboard/${dashboardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets, layout: cleanLayout }),
      });
      if (res.ok) {
        toast.success('Dashboard saved!');
      } else {
        toast.error('Failed to save dashboard');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setIsSaving(false);
    }
  };

  const duplicateDashboard = async () => {
    if (!currentDashboard) return;
    try {
      const res = await apiFetch(`/dashboard/${currentDashboard.id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const copy = await res.json();
        setDashboardList((prev) => [copy, ...prev]);
        toast.success(`Duplicated as "${copy.name}"`);
      }
    } catch {
      toast.error('Failed to duplicate');
    }
  };

  const handleShare = async () => {
    if (!currentDashboard) {
      toast.error('Save your dashboard first before sharing');
      return;
    }
    try {
      const res = await apiFetch(`/dashboard/${currentDashboard.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiryDays: 30 }),
      });
      if (res.ok) {
        const { token } = await res.json();
        const shareUrl = `${window.location.origin}/shared/${token}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied! (valid 30 days)', { duration: 4000 });
      }
    } catch {
      toast.error('Failed to generate share link');
    }
  };

  // ========================
  // WIDGET ACTIONS
  // ========================
  const addWidget = (type: WidgetType) => {
    const catalog = WIDGET_CATALOG.find((c) => c.type === type)!;
    const newId = `${type}-${Date.now()}`;
    const newWidget: DashboardWidget = {
      id: newId,
      type,
      title: catalog.label,
      config: type === 'bar' || type === 'line' ? { dataSource: 'traffic', color: '#3b82f6' }
            : type === 'pie' ? { dataSource: 'distribution' }
            : type === 'kpi' || type === 'number' ? { dataSource: 'summary' }
            : {},
    };
    setWidgets((prev) => [...prev, newWidget]);
    setLayout((prev) => [...prev, { i: newId, x: 0, y: 99, w: catalog.defaultW, h: catalog.defaultH }]);
    setShowAddWidget(false);
  };

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setLayout((prev) => prev.filter((l) => l.i !== id));
  };

  const updateWidget = (updated: DashboardWidget) => {
    setWidgets((prev) => prev.map((w) => w.id === updated.id ? updated : w));
  };

  const handleLayoutChange = (newLayout: any) => setLayout(newLayout);

  // ========================
  // RENDER
  // ========================
  const themeClass = currentDashboard?.theme === 'dark'
    ? 'bg-slate-900'
    : currentDashboard?.theme === 'midnight'
    ? 'bg-slate-950'
    : 'bg-slate-50';

  return (
    <div className="p-6 h-full flex flex-col gap-4 animate-in fade-in">

      {/* ── HEADER BAR ── */}
      <div className="flex justify-between items-center bg-white rounded-2xl px-5 py-3.5 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={20} className="text-blue-600" />
          {/* Dashboard Picker */}
          <div className="relative">
            <button
              onClick={() => setShowDashboardPicker((v) => !v)}
              className="flex items-center gap-2 font-bold text-slate-800 hover:text-blue-600 transition-colors"
            >
              <span className="text-lg">{currentDashboard?.name ?? 'Select Dashboard'}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            {showDashboardPicker && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                <div className="p-2">
                  <button
                    onClick={createNewDashboard}
                    className="w-full text-left flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> New Dashboard
                  </button>
                </div>
                <div className="border-t border-slate-100">
                  {dashboardList.map((db) => (
                    <button
                      key={db.id}
                      onClick={() => switchDashboard(db)}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${currentDashboard?.id === db.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
                    >
                      <div className="font-medium">{db.name}</div>
                      {db.description && <div className="text-xs text-slate-400 mt-0.5">{db.description}</div>}
                    </button>
                  ))}
                  {dashboardList.length === 0 && (
                    <p className="px-4 py-3 text-sm text-slate-400">No dashboards yet. Create one!</p>
                  )}
                </div>
              </div>
            )}
          </div>
          {currentDashboard?.autoRefreshSeconds && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">
              <RefreshCw size={11} className="animate-spin" style={{ animationDuration: '3s' }} />
              Auto-refresh {currentDashboard.autoRefreshSeconds}s
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Add Widget */}
          <div className="relative">
            <button
              onClick={() => setShowAddWidget((v) => !v)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-semibold text-sm transition-colors"
            >
              <Plus size={15} /> Add Widget
            </button>
            {showAddWidget && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2">
                {WIDGET_CATALOG.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => addWidget(item.type)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold border mb-1 last:mb-0 transition-all hover:scale-[1.02] ${item.color}`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={duplicateDashboard} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors" title="Duplicate dashboard">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl font-semibold text-sm shadow-sm transition-colors"
          >
            <Share2 size={14} /> Share
          </button>

          <button
            onClick={saveDashboard}
            disabled={isSaving}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-sm transition-colors"
          >
            <Save size={14} /> {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── GRID CANVAS ── */}
      <div ref={containerRef} className={`${themeClass} rounded-2xl border border-slate-200 p-4 flex-1 min-h-[600px] overflow-hidden`}>
        {mounted && (
          <Responsive
            width={width}
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            onLayoutChange={handleLayoutChange}
            margin={[16, 16]}
            {...({ isDraggable: true, isResizable: true } as any)}
          >
            {widgets.map((widget) => (
              <div
                key={widget.id}
                style={{ backgroundColor: widget.config?.backgroundColor ?? '#ffffff' }}
                className="rounded-xl shadow-sm border border-slate-200 p-4 group cursor-grab active:cursor-grabbing flex flex-col relative overflow-hidden"
              >
                {/* Hover actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => setConfigWidget(widget)}
                    className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                    title="Configure"
                  >
                    <Settings size={12} />
                  </button>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => removeWidget(widget.id)}
                    className="w-7 h-7 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                    title="Remove"
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Resize handle indicator */}
                <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-r-2 border-b-2 border-slate-300 opacity-30 group-hover:opacity-70 transition-opacity pointer-events-none" />

                <WidgetContent
                  widget={widget}
                  trafficData={trafficData}
                  distributionData={distributionData}
                  performanceData={performanceData}
                  summaryData={summaryData}
                />
              </div>
            ))}
          </Responsive>
        )}
        {mounted && widgets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[500px] gap-4 text-slate-400">
            <LayoutDashboard size={48} className="opacity-30" />
            <p className="text-lg font-semibold">Empty Canvas</p>
            <p className="text-sm">Click <span className="font-bold text-slate-600">+ Add Widget</span> to start building</p>
          </div>
        )}
      </div>

      {/* ── WIDGET CONFIG MODAL ── */}
      {configWidget && (
        <WidgetConfigPanel
          widget={configWidget}
          onUpdate={(updated) => {
            updateWidget(updated);
            setConfigWidget(null);
          }}
          onClose={() => setConfigWidget(null)}
          onDelete={() => {
            removeWidget(configWidget.id);
            setConfigWidget(null);
          }}
        />
      )}
    </div>
  );
}