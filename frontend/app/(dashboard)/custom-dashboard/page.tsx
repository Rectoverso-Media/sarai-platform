"use client";
import { useEffect } from 'react';
import React, { useState } from 'react';

// Bypass ESM error Next.js
import { Responsive, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { 
  BarChart, Bar, ResponsiveContainer, XAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, YAxis, CartesianGrid
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];


export default function CustomDashboardBuilder() {
  const { width, containerRef, mounted } = useContainerWidth();
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  // Ambil layout dari DB 
  useEffect(() => {
    const loadDashboardFromDB = async () => {
      try {
        const res = await fetch('http://localhost:3001/dashboard/dashboard/load');
        if (res.ok) {
          const data = await res.json();
          // Kalau ada data dari DB, timpa state awal dengan data dari DB
          if (data && data.widgets && data.layout) {
            setWidgets(data.widgets);
            setLayout(data.layout);
          }
        }
      } catch (error) {
        console.error('Gagal memuat layout:', error);
      }
    };
    loadDashboardFromDB();
  }, []);

  // Ambil data untuk mengisi widget grafik
  useEffect(() => {
    const fetchWidgetData = async () => {
      try {
        const res = await fetch('http://localhost:3001/dashboard/stats/traffic');
        if (res.ok) {
          const data = await res.json();
          setTrafficData(data); // Simpan ke state
        }
      } catch (error) {
        console.error('Gagal memuat data widget:', error);
      }
    };
    
    fetchWidgetData();
  }, []);

  useEffect(() => {
    const fetchWidgetData = async () => {
      try {
        // Tarik 3 API sekaligus pakai Promise.all biar ngebut
        const [trafficRes, distRes, perfRes] = await Promise.all([
          fetch('http://localhost:3001/dashboard/stats/traffic'),
          fetch('http://localhost:3001/dashboard/stats/distribution'),
          fetch('http://localhost:3001/dashboard/stats/performance')
        ]);

        if (trafficRes.ok) setTrafficData(await trafficRes.json());
        if (distRes.ok) setDistributionData(await distRes.json());
        if (perfRes.ok) setPerformanceData(await perfRes.json());
        
      } catch (error) {
        console.error('Gagal memuat data widget:', error);
      }
    };
    
    fetchWidgetData();
  }, []);

  // 1. STATE UNTUK DAFTAR WIDGET (Data apa yang dirender)
  const [widgets, setWidgets] = useState([
    { id: 'kpi-1', type: 'kpi', title: 'Total Data Sources', value: '12' },
    { id: 'chart-1', type: 'bar', title: 'Traffic Overview' }
  ]);

  // 2. STATE UNTUK LAYOUT GRID (Posisi & Ukuran)
  const [layout, setLayout] = useState([
    { i: 'kpi-1', x: 0, y: 0, w: 3, h: 2 },
    { i: 'chart-1', x: 3, y: 0, w: 6, h: 4 }
  ]);

  // Fungsi Tambah Widget Baru
  const addWidget = (type: string) => {
    const newId = `${type}-${Date.now()}`;
    
    let title = 'New Widget';
    let w = 4, h = 4;

    if (type === 'kpi') { title = 'New Metric'; w = 3; h = 2; }
    else if (type === 'bar') { title = 'Traffic Overview'; w = 6; h = 4; }
    else if (type === 'line') { title = 'Query Performance'; w = 6; h = 4; } // Ukuran Line Chart
    else if (type === 'pie') { title = 'Source Distribution'; w = 4; h = 4; } // Ukuran Pie Chart

    setWidgets([...widgets, { id: newId, type: type, title: title }]);
    setLayout([...layout, { i: newId, x: 0, y: 99, w: w, h: h }]);
  };

  // Fungsi Hapus Widget
  const removeWidget = (idToRemove: string) => {
    setWidgets(widgets.filter(w => w.id !== idToRemove));
    setLayout(layout.filter(l => l.i !== idToRemove));
  };

  const handleLayoutChange = (newLayout: any) => {
    setLayout(newLayout);
  };

  // Fungsi untuk menembak API Save
  const saveDashboardToDB = async () => {
    try {
      // Pastikan tidak ada nilai null/Infinity yang bocor sebelum dikirim ke DB
      const cleanLayout = layout.map(l => ({
        ...l,
        y: (l.y === null || l.y === undefined) ? 99 : l.y
      }));

      const res = await fetch('http://localhost:3001/dashboard/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets, layout: cleanLayout })
      });

      if (res.ok) {
        alert('🎉 Layout berhasil disimpan ke Database!');
      } else {
        const errText = await res.text();
        alert(`❌ Gagal menyimpan! Backend bilang: ${errText}`);
      }
    } catch (error) {
      alert(`❌ Error koneksi ke server: ${error}`);
    }
  };

  // Fungsi untuk Copy Link Share
  const handleShare = () => {
    // bikin halaman '/shared' setelah ini
    const shareUrl = `${window.location.origin}/shared`; 
    navigator.clipboard.writeText(shareUrl);
    alert('🔗 Link Dashboard Publik berhasil disalin ke Clipboard! Coba paste di tab baru.');
  };

  // Fungsi untuk me-render isi widget berdasarkan tipenya
  const renderWidgetContent = (widget: any) => {
    if (widget.type === 'kpi') {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <span className="text-slate-400 font-bold text-xs uppercase">{widget.title}</span>
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
              {/* Gunakan trafficData */}
              <BarChart data={trafficData.length > 0 ? trafficData : [{ day: 'Loading', value: 0 }]}>
                {/* Tampilkan nama harinya di sumbu X biar jelas */}
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
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
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
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
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    
    return <div>Tipe widget tidak dikenal</div>;
  };

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in">
      
      {/* HEADER & TOOLBAR (Widget Menu) */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-slate-800">Builder Mode</h1>
          <p className="text-slate-500 text-xs mt-1">Tambahkan widget, lalu atur posisinya.</p>
        </div>
        
        {/* Menu Add Widget */}
        <div className="flex gap-3">
          <button type="button"
            onClick={() => addWidget('kpi')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2">
            <span>+</span> KPI Card
          </button>
          <button type="button"
            onClick={() => addWidget('line')}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2">
            <span>+</span> Line Chart
          </button>
          <button type="button"
            onClick={() => addWidget('pie')}
            className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2">
            <span>+</span> Pie Chart
          </button>
          <button type="button"
            onClick={() => addWidget('bar')}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2">
            <span>+</span> Bar Chart
          </button>
          
          <div className="w-px bg-slate-200 mx-2"></div>
          <button type="button"
            onClick={handleShare} 
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
            🔗 Share
          </button>
          <button type="button"
            onClick={saveDashboardToDB} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-colors">
            💾 Save
          </button>
        </div>
      </div>

      {/* KANVAS GRID */}
      <div ref={containerRef} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[600px] overflow-hidden">
        {mounted && (
          <Responsive
            width={width} 
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60} 
            onLayoutChange={handleLayoutChange}
            margin={[24, 24]} 
            {...({ isDraggable: true, isResizable: true } as any)}
          >
            {widgets.map((widget) => (
              <div 
                key={widget.id} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 group cursor-grab active:cursor-grabbing flex flex-col relative"
              >
                {/* Tombol Hapus Widget (Muncul saat di-hover) */}
                <button 
                  onClick={() => removeWidget(widget.id)}
                  onMouseDown={(e) => e.stopPropagation()} // Mencegah drag saat ngeklik tombol hapus
                  className="absolute top-2 right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 z-10"
                >
                  ✕
                </button>
                
                {/* Indikator Resize */}
                <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-slate-300 opacity-50 group-hover:opacity-100"></div>

                {/* Konten Dynamic */}
                {renderWidgetContent(widget)}
              </div>
            ))}
          </Responsive>
        )}
      </div>
    </div>
  );
}