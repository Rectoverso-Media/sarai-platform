"use client";
import { useEffect } from 'react';
import React, { useState } from 'react';

// Bypass ESM error Next.js
import { Responsive, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Kita import sedikit Recharts untuk demonstrasi chart di dalam grid
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';



export default function CustomDashboardBuilder() {
  const { width, containerRef, mounted } = useContainerWidth();

  // Ambil layout dari DB saat halaman dimuat
  useEffect(() => {
    const loadDashboardFromDB = async () => {
      try {
        const res = await fetch('http://localhost:3001/queries/dashboard/load');
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
    const newId = `${type}-${Date.now()}`; // Bikin ID unik
    
    // Tambah ke daftar widget
    setWidgets([...widgets, { 
      id: newId, 
      type: type, 
      title: type === 'kpi' ? 'New Metric' : 'New Chart',
      value: type === 'kpi' ? '0' : undefined
    }]);

    // Tambah ke layout (otomatis ditaruh di bawah dengan y: Infinity)
    setLayout([...layout, { 
      i: newId, 
      x: 0, 
      y: Infinity, 
      w: type === 'kpi' ? 3 : 6, // Kalau KPI kecil, kalau Chart agak lebar
      h: type === 'kpi' ? 2 : 4 
    }]);
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
      const res = await fetch('http://localhost:3001/queries/dashboard/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets, layout }) // Kirim 2 state ini ke backend
      });
      if (res.ok) {
        alert('🎉 Layout berhasil disimpan ke Database!');
      }
    } catch (error) {
      alert('❌ Gagal menyimpan layout.');
    }
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
      const dummyData = [{ name: 'A', v: 40 }, { name: 'B', v: 30 }, { name: 'C', v: 60 }];
      return (
        <div className="flex flex-col h-full w-full">
          <span className="text-slate-600 font-bold text-sm mb-2">{widget.title}</span>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dummyData}>
                <XAxis dataKey="name" hide />
                <Tooltip />
                <Bar dataKey="v" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
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
          <button 
            onClick={() => addWidget('kpi')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
          >
            <span>+</span> KPI Card
          </button>
          <button 
            onClick={() => addWidget('bar')}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
          >
            <span>+</span> Bar Chart
          </button>
          <div className="w-px bg-slate-200 mx-2"></div>
          <button 
            onClick={saveDashboardToDB} // 👈 Panggil fungsi ini
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