"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

function EmbedDashboardContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

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
      setError('No share token provided. Use ?token=YOUR_TOKEN');
      setIsLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        const dashRes = await fetch(`${API_URL}/dashboard/public/${token}`);
        if (!dashRes.ok) {
          if (dashRes.status === 403) setError('This share link has expired.');
          else if (dashRes.status === 404) setError('Share link is invalid.');
          else setError('Failed to load dashboard.');
          setIsLoading(false);
          return;
        }

        const dashData = await dashRes.json();
        setDashboard(dashData);
        if (dashData.widgets?.length) setWidgets(dashData.widgets);
        if (dashData.layout?.length) setLayout(dashData.layout);

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
          <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">{widget.title}</span>
          <span className="text-2xl font-black text-slate-800 mt-1.5">
            {value}
            {widget.config?.suffix && <span className="text-sm font-medium text-slate-400 ml-1">{widget.config.suffix}</span>}
          </span>
        </div>
      );
    }

    if (widget.type === 'bar') return (
      <div className="flex flex-col h-full w-full">
        <span className="text-slate-600 font-bold text-xs mb-1.5">{widget.title}</span>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.length ? chartData : [{ [xKey]: '—', [yKey]: 0 }]}>
              <XAxis dataKey={xKey} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px', border: 'none' }} />
              <Bar dataKey={yKey} fill={color} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );

    if (widget.type === 'line') return (
      <div className="flex flex-col h-full w-full">
        <span className="text-slate-600 font-bold text-xs mb-1.5">{widget.title}</span>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.length ? chartData : [{ [xKey]: '—', [yKey]: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px', border: 'none' }} />
              <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );

    if (widget.type === 'pie') {
      const pieData = dataSource === 'distribution' ? distributionData : chartData;
      return (
        <div className="flex flex-col h-full w-full">
          <span className="text-slate-600 font-bold text-xs mb-1.5">{widget.title}</span>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="40%" innerRadius="30%" outerRadius="55%" paddingAngle={3} dataKey="value">
                  {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px', border: 'none' }} />
                <Legend verticalAlign="bottom" height={24} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '9px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (widget.type === 'table') {
      const tableData = chartData.slice(0, 6);
      const cols = tableData.length > 0 ? Object.keys(tableData[0]) : [];
      return (
        <div className="flex flex-col h-full w-full overflow-hidden text-[11px]">
          <span className="text-slate-600 font-bold text-xs mb-1">{widget.title}</span>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  {cols.map((c) => <th key={c} className="px-1.5 py-1 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {cols.map((c) => <td key={c} className="px-1.5 py-1 border-b border-slate-100 text-slate-700">{String(row[c] ?? '—')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (widget.type === 'text') return (
      <div className="flex flex-col h-full w-full p-0.5 overflow-auto text-xs" style={{ textAlign: widget.config?.textAlign ?? 'left' }}>
        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1 block">{widget.title}</span>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{widget.config?.text ?? ''}</p>
      </div>
    );

    if (widget.type === 'image') return (
      <div className="flex flex-col h-full w-full">
        <span className="text-slate-400 font-bold text-[10px] mb-1 block">{widget.title}</span>
        <div className="flex-1 overflow-hidden rounded-lg">
          {widget.config?.imageUrl
            ? <img src={widget.config.imageUrl} alt={widget.title} className="w-full h-full object-cover" />
            : <div className="flex items-center justify-center h-full bg-slate-50 rounded-lg text-slate-300 text-[10px]">No image</div>
          }
        </div>
      </div>
    );

    return null;
  };

  if (isLoading) return (
    <div className="h-screen bg-transparent flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="h-screen bg-transparent flex items-center justify-center p-4 text-center">
      <div className="max-w-xs">
        <AlertTriangle size={32} className="mx-auto text-red-400 mb-2" />
        <p className="text-xs text-slate-500 font-semibold">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent p-0 flex flex-col">
      <div ref={containerRef} className="w-full flex-1">
        {mounted && widgets.length > 0 ? (
          <Responsive
            width={width}
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={55}
            margin={[12, 12]}
            {...({ isDraggable: false, isResizable: false } as any)}
          >
            {widgets.map((widget) => (
              <div
                key={widget.id}
                style={{ backgroundColor: widget.config?.backgroundColor ?? '#ffffff' }}
                className="rounded-xl border border-slate-100 p-3 flex flex-col relative overflow-hidden shadow-sm"
              >
                {renderWidget(widget)}
              </div>
            ))}
          </Responsive>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-slate-400 gap-2">
            <LayoutDashboard size={30} className="opacity-30" />
            <p className="text-xs font-semibold">No widgets defined.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmbedDashboardPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-transparent flex items-center justify-center"><div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>}>
      <EmbedDashboardContent />
    </Suspense>
  );
}
