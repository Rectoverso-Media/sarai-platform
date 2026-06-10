"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Responsive, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, YAxis, CartesianGrid,
} from 'recharts';
import { LayoutDashboard, AlertTriangle, Clock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function PublicSharedDashboard() {
  const params = useParams();
  const token = params?.token as string;

  const { width, containerRef, mounted } = useContainerWidth();

  const [dashboard, setDashboard] = useState<any>(null);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [layout, setLayout] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('No share token provided.');
      setIsLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        // Ambil dashboard via token (public endpoint — tidak butuh auth)
        const dashRes = await fetch(`${API_URL}/dashboard/public/${token}`);
        if (!dashRes.ok) {
          if (dashRes.status === 403) setError('This share link has expired.');
          else if (dashRes.status === 404) setError('Share link is invalid or has been revoked.');
          else setError('Failed to load dashboard.');
          setIsLoading(false);
          return;
        }

        const dashData = await dashRes.json();
        setDashboard(dashData);
        if (dashData.widgets?.length) setWidgets(dashData.widgets);
        if (dashData.layout?.length) setLayout(dashData.layout);

        // Stats endpoints — bisa diakses public karena tidak ada data sensitif di sini
        const [trafficRes, distRes, perfRes, summaryRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/stats/traffic`),
          fetch(`${API_URL}/dashboard/stats/distribution`),
          fetch(`${API_URL}/dashboard/stats/performance`),
          fetch(`${API_URL}/dashboard/stats/summary`),
        ]);

        if (trafficRes.ok) setTrafficData(await trafficRes.json());
        if (distRes.ok) setDistributionData(await distRes.json());
        if (perfRes.ok) setPerformanceData(await perfRes.json());
        if (summaryRes.ok) setSummaryData(await summaryRes.json());

      } catch {
        setError('Connection failed. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [token]);

  // =====================
  // WIDGET RENDERER (read-only version)
  // =====================
  const renderWidget = (widget: any) => {
    const dataSource = widget.config?.dataSource ?? 'traffic';
    const chartData =
      dataSource === 'distribution' ? distributionData
      : dataSource === 'performance' ? performanceData
      : trafficData;

    const xKey = dataSource === 'performance' ? 'time' : dataSource === 'distribution' ? 'name' : 'day';
    const yKey = dataSource === 'performance' ? 'avgTime' : 'value';
    const color = widget.config?.color ?? '#3b82f6';

    if (widget.type === 'kpi' || widget.type === 'number') {
      let value = widget.config?.value ?? '—';
      if (dataSource !== 'custom' && summaryData) {
        const keyMap: Record<string, string> = {
          'Total Data Sources': 'totalSources', 'Total Queries': 'totalQueries',
          'Users': 'totalUsers', 'Executions Today': 'executionsToday',
        };
        const k = keyMap[widget.title];
        if (k) value = summaryData[k] ?? value;
      }
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-widest">{widget.title}</span>
          <span className="text-4xl font-black text-slate-800 mt-2 tabular-nums">
            {value}
            {widget.config?.suffix && <span className="text-lg font-medium text-slate-400 ml-1">{widget.config.suffix}</span>}
          </span>
        </div>
      );
    }

    if (widget.type === 'bar') return (
      <div className="flex flex-col h-full w-full">
        <span className="text-slate-600 font-bold text-sm mb-2">{widget.title}</span>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.length ? chartData : [{ [xKey]: '—', [yKey]: 0 }]}>
              <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
              <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );

    if (widget.type === 'line') return (
      <div className="flex flex-col h-full w-full">
        <span className="text-slate-600 font-bold text-sm mb-2">{widget.title}</span>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.length ? chartData : [{ [xKey]: '—', [yKey]: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
              <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );

    if (widget.type === 'pie') {
      const pieData = dataSource === 'distribution' ? distributionData : chartData;
      return (
        <div className="flex flex-col h-full w-full">
          <span className="text-slate-600 font-bold text-sm mb-2">{widget.title}</span>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius="40%" outerRadius="65%" paddingAngle={4} dataKey="value">
                  {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

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
                  {cols.map((c) => <th key={c} className="px-2 py-1.5 text-left font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {cols.map((c) => <td key={c} className="px-2 py-1.5 border-b border-slate-100 text-slate-700">{String(row[c] ?? '—')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (widget.type === 'text') return (
      <div className="flex flex-col h-full w-full p-1 overflow-auto" style={{ textAlign: widget.config?.textAlign ?? 'left' }}>
        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1.5">{widget.title}</span>
        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{widget.config?.text ?? ''}</p>
      </div>
    );

    if (widget.type === 'image') return (
      <div className="flex flex-col h-full w-full">
        <span className="text-slate-400 font-bold text-xs mb-1.5">{widget.title}</span>
        <div className="flex-1 overflow-hidden rounded-lg">
          {widget.config?.imageUrl
            ? <img src={widget.config.imageUrl} alt={widget.title} className="w-full h-full object-cover" />
            : <div className="flex items-center justify-center h-full bg-slate-50 rounded-lg text-slate-300 text-xs">No image</div>
          }
        </div>
      </div>
    );

    return null;
  };

  // =====================
  // ERROR STATES
  // =====================
  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Loading dashboard…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        {error.includes('expired') ? <Clock size={48} className="mx-auto text-amber-400 mb-4" /> : <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />}
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {error.includes('expired') ? 'Link Expired' : 'Link Not Found'}
        </h1>
        <p className="text-slate-500">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-7xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">{dashboard?.name ?? 'Shared Dashboard'}</h1>
              {dashboard?.description && <p className="text-slate-500 text-sm mt-0.5">{dashboard.description}</p>}
              <p className="text-slate-400 text-xs mt-0.5">Shared via Sarai Analytics · Read-only</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Live View
            </div>
          </div>
        </div>

        {/* Canvas — READ ONLY */}
        <div ref={containerRef} className="bg-white border border-slate-200 rounded-3xl p-6 min-h-[600px] shadow-xl">
          {mounted && widgets.length > 0 ? (
            <Responsive
              width={width}
              className="layout"
              layouts={{ lg: layout }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={60}
              margin={[16, 16]}
              {...({ isDraggable: false, isResizable: false } as any)}
            >
              {widgets.map((widget) => (
                <div
                  key={widget.id}
                  style={{ backgroundColor: widget.config?.backgroundColor ?? '#ffffff' }}
                  className="rounded-xl border border-slate-100 p-4 flex flex-col relative overflow-hidden shadow-sm"
                >
                  {renderWidget(widget)}
                </div>
              ))}
            </Responsive>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] text-slate-400 gap-3">
              <LayoutDashboard size={40} className="opacity-30" />
              <p className="font-medium">{mounted ? 'This dashboard is empty' : 'Loading…'}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-400">
          Powered by <span className="font-bold text-slate-600">Sarai Platform</span> · This link is read-only and may expire.
        </div>
      </div>
    </div>
  );
}