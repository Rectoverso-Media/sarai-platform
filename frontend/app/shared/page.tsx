"use client";
import React, { useState, useEffect } from 'react';
import { Responsive, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line, YAxis, CartesianGrid } from 'recharts';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function PublicSharedDashboard() {
  const { width, containerRef, mounted } = useContainerWidth();

  const [widgets, setWidgets] = useState<any[]>([]);
  const [layout, setLayout] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  // FETCH DATA & LAYOUT SEKALIGUS SAAT HALAMAN DIBUKA
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [layoutRes, trafficRes, distRes, perfRes] = await Promise.all([
          fetch('http://localhost:3001/dashboard/load'),
          fetch('http://localhost:3001/dashboard/stats/traffic'),
          fetch('http://localhost:3001/dashboard/stats/distribution'),
          fetch('http://localhost:3001/dashboard/stats/performance')
        ]);

        if (layoutRes.ok) {
          const layoutData = await layoutRes.json();
          if (layoutData) {
            setWidgets(layoutData.widgets);
            setLayout(layoutData.layout);
          }
        }
        if (trafficRes.ok) setTrafficData(await trafficRes.json());
        if (distRes.ok) setDistributionData(await distRes.json());
        if (perfRes.ok) setPerformanceData(await perfRes.json());
        
      } catch (error) {
        console.error('Gagal memuat dashboard publik:', error);
      }
    };
    fetchAllData();
  }, []);

  const renderWidgetContent = (widget: any) => {
    if (widget.type === 'kpi') {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <span className="text-slate-400 font-bold text-xs uppercase text-center">{widget.title}</span>
          <span className="text-3xl font-black text-slate-800 mt-2">{widget.value || '100'}</span>
        </div>
      );
    }
    
    if (widget.type === 'bar') {
      return (
        <div className="flex flex-col h-full w-full">
          <span className="text-slate-600 font-bold text-sm mb-2">{widget.title}</span>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficData.length > 0 ? trafficData : [{ day: 'Load', value: 0 }]}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (widget.type === 'line') {
      return (
        <div className="flex flex-col h-full w-full">
          <span className="text-slate-600 font-bold text-sm mb-2">{widget.title}</span>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData.length > 0 ? performanceData : [{ time: '00:00', avgTime: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Line type="monotone" dataKey="avgTime" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (widget.type === 'pie') {
      return (
        <div className="flex flex-col h-full w-full">
          <span className="text-slate-600 font-bold text-sm mb-2">{widget.title}</span>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        {/* HEADER PUBLIK */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-poppins font-black text-slate-800 tracking-tight">Sarai Analytics</h1>
            <p className="text-slate-500 text-sm mt-1">Public Shared Dashboard • Live View</p>
          </div>
          <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-xs font-bold animate-pulse">
            LIVE
          </div>
        </div>

        {/* KANVAS READ-ONLY */}
        <div ref={containerRef} className="bg-white border border-slate-200 rounded-3xl p-6 min-h-[600px] shadow-xl shadow-slate-200/50">
          {mounted && widgets.length > 0 ? (
            <Responsive
              width={width} 
              className="layout"
              layouts={{ lg: layout }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={60} 
              margin={[24, 24]} 
              /* MODE READ-ONLY */
              {...({ isDraggable: false, isResizable: false } as any)}
            >
              {widgets.map((widget) => (
                <div 
                  key={widget.id} 
                  className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col relative"
                  // Hapus class shadow/hover biar keliatan clean & tidak interaktif
                >
                  {renderWidgetContent(widget)}
                </div>
              ))}
            </Responsive>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              {mounted ? "Loading dashboard data..." : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}