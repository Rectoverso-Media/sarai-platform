"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

export default function MainDashboard() {
  const [userName, setUserName] = useState('Admin');
  const [greeting, setGreeting] = useState('Selamat Pagi');

  // State untuk nyimpen angka dari database
  const [dsCount, setDsCount] = useState(0);
  const [nodesStats, setNodesStats] = useState({ online: 0, total: 0 });
  const [alertCount, setAlertCount] = useState(0);

  const [sourceDistribution, setSourceDistribution] = useState<{name: string, value: number}[]>([]);
  const [trafficData, setTrafficData] = useState<{day: string, value: number}[]>([]);
  const [performanceData, setPerformanceData] = useState<{time: string, avgTime: number}[]>([]);

  useEffect(() => {
    // Atur Nama & Ucapan
    const storedData = localStorage.getItem('userData');
    if (storedData) setUserName(JSON.parse(storedData).name || 'Admin');

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Selamat Pagi');
    else if (hour < 18) setGreeting('Selamat Siang');
    else setGreeting('Selamat Malam');

    // Tarik Data dari Backend secara bersamaan (Parallel Fetching)
    const fetchDashboardData = async () => {
      try {
        const [dsRes, nodesRes, distRes, trafficRes, perfRes] = await Promise.all([
          fetch('http://localhost:3001/datasources'),
          fetch('http://localhost:3001/infrastructure'),
          fetch('http://localhost:3001/dashboard/stats/distribution'),
          fetch('http://localhost:3001/dashboard/stats/traffic'),
          fetch('http://localhost:3001/dashboard/stats/performance')
        ]);

        if (dsRes.ok && nodesRes.ok && distRes.ok && trafficRes.ok) {
          const dsJson = await dsRes.json();
          const nodesJson = await nodesRes.json();
          const distData = await distRes.json();
          const trafficJson = await trafficRes.json();
          const perfData = await perfRes.json();

          const dsData = Array.isArray(dsJson) ? dsJson : (dsJson.data || []);
          const nodesData = Array.isArray(nodesJson) ? nodesJson : (nodesJson.data || []);

          setDsCount(dsData.length);
          
          const online = nodesData.filter((n: any) => n.status === 'Online').length;
          setNodesStats({ online, total: nodesData.length });

          const nodeAlerts = nodesData.filter((n: any) => n.status === 'Warning' || n.status === 'Critical' || n.status === 'Offline').length;
          const dsAlerts = dsData.filter((ds: any) => ds.status !== 'Connected' && ds.status !== 'Active').length;
          
          setAlertCount(nodeAlerts + dsAlerts);
          setSourceDistribution(distData);
          setTrafficData(trafficJson); 
          setPerformanceData(perfData);
        }
      } catch (error) {
        console.error("Gagal sinkronisasi data dashboard:", error);
      }
    };

    fetchDashboardData();
  }, []);

  // const trafficData = [
  //   { day: 'Mon', value: 45 }, { day: 'Tue', value: 52 }, 
  //   { day: 'Wed', value: 38 }, { day: 'Thu', value: 65 }, 
  //   { day: 'Fri', value: 85 }, { day: 'Sat', value: 40 }, 
  //   { day: 'Sun', value: 30 }
  // ];

  // Data dummy untuk Pie Chart
  // const sourceDistribution = [
  //   { name: 'PostgreSQL', value: 45 },
  //   { name: 'MySQL', value: 25 },
  //   { name: 'MongoDB', value: 20 },
  //   { name: 'API REST', value: 10 },
  // ];
  
  // Kode warna estetik untuk tiap chart pie
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  // Data dummy untuk Line Chart (Waktu eksekusi query dalam milidetik)
  // const performanceData = [
  //   { time: '09:00', avgTime: 120 },
  //   { time: '10:00', avgTime: 150 },
  //   { time: '11:00', avgTime: 450 }, // Sempat loncat (lemot)
  //   { time: '12:00', avgTime: 200 },
  //   { time: '13:00', avgTime: 180 },
  //   { time: '14:00', avgTime: 160 },
  //   { time: '15:00', avgTime: 210 },
  // ];

  return (
    <div className="p-8 h-full flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-poppins font-bold">
            {greeting}, {userName}! 👋
          </h1>
          <p className="mt-2 text-blue-100 max-w-2xl text-sm leading-relaxed">
            {alertCount === 0 
              ? "Ini adalah ringkasan sistem SARAI hari ini. Seluruh node infrastruktur berjalan normal, dan aliran data stabil." 
              : `Perhatian: Terdapat ${alertCount} sistem yang memerlukan pengecekan. Silakan tinjau log peringatan di bawah.`}
          </p>
          <div className="mt-6 flex gap-4">
            <Link href="/data-sources/add" className="bg-white text-blue-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm">
              + Add Data Source
            </Link>
            <Link href="/infrastructure" className="bg-blue-600/50 border border-blue-400/30 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600/70 transition-colors backdrop-blur-sm">
              View Infrastructure
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-full bg-white/5 skew-x-12 translate-x-12 backdrop-blur-md"></div>
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/30 rounded-full blur-3xl"></div>
      </div>

      {/* 2. Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl">🗄️</div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Sources</p>
            <h2 className="text-3xl font-black text-slate-800 mt-1">{dsCount}</h2>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">⚡</div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Nodes Online</p>
            <h2 className="text-3xl font-black text-slate-800 mt-1">
              {nodesStats.online} <span className="text-sm font-medium text-slate-400 ml-1">/ {nodesStats.total}</span>
            </h2>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${alertCount > 0 ? 'bg-red-100' : 'bg-amber-100'}`}>
            {alertCount > 0 ? '🚨' : '⚠️'}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">System Alerts</p>
            <h2 className={`text-3xl font-black mt-1 ${alertCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {alertCount} <span className="text-sm font-medium text-green-500 ml-2">{alertCount === 0 ? 'All clear' : 'Action Needed'}</span>
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* 3. Traffic Monitor Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Data Ingestion Traffic</h3>
              <p className="text-xs text-slate-500 mt-1">Volume data yang ditarik dari semua Data Sources (7 hari terakhir).</p>
            </div>
            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-200 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Live
            </span>
          </div>
          
          {/* Wadah Grafik Recharts */}
          <div className="flex-1 w-full h-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                {/* Garis bantu horizontal */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                
                {/* Sumbu X (Hari) */}
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                  dy={10}
                />
                
                {/* Sumbu Y (Nilai) */}
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }} 
                  tickFormatter={(value) => `${value}GB`}
                />
                
                {/* Kotak Info saat di-hover */}
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value} GB`, 'Volume']}
                />
                
                {/* Batangnya */}
                <Bar 
                  dataKey="value" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Recent Activity Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-lg text-slate-800 mb-6">System Logs</h3>
          <div className="space-y-6 flex-1">
            <div className="flex gap-4">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0"></div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Dashboard Synced</p>
                <p className="text-xs text-slate-500 mt-1">Berhasil memuat metrik real-time dari {nodesStats.total} node dan {dsCount} sumber data.</p>
                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">Just now</p>
              </div>
            </div>
          </div>
          <button className="w-full py-2.5 mt-4 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
            View All Logs
          </button>
        </div>
      </div>

      {/* 5. Baris Baru: Donut Chart & Placeholder Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        
        {/* Kotak Kiri: Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
          <h3 className="font-bold text-lg text-slate-800 mb-1">Data Source Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Proporsi teknologi database yang terhubung.</p>
          
          <div className="flex-1 w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceDistribution}
                  cx="50%" // Posisi tengah X
                  cy="50%" // Posisi tengah Y
                  innerRadius={80} // Ini yang bikin jadi bentuk Donut (bolong di tengah)
                  outerRadius={110}
                  paddingAngle={5} // Jarak antar potongan
                  dataKey="value"
                  animationDuration={1500}
                >
                  {sourceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value}%`, 'Proporsi']}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kotak Kanan: Placeholder untuk fitur selanjutnya */}
        {/* 👇 Kotak Kanan: DIISI DENGAN LINE CHART PERFORMA 👇 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Query Performance Trend</h3>
              <p className="text-xs text-slate-500 mt-1">Rata-rata waktu eksekusi query (milidetik) per jam.</p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-200">
              Today
            </span>
          </div>

          <div className="flex-1 w-full h-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                {/* Garis bantu background */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                
                {/* Sumbu X (Waktu) */}
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  padding={{ left: 20, right: 20 }}
                />
                
                {/* Sumbu Y (Milidetik) */}
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(value) => `${value}ms`}
                />
                
                {/* Tooltip saat hover */}
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value} ms`, 'Avg. Time']}
                />
                
                {/* Garis Grafiknya (Warna Emerald agar kontras) */}
                <Line 
                  type="monotone" // Bikin garisnya melengkung halus
                  dataKey="avgTime" 
                  stroke="#10b981" 
                  strokeWidth={3} // Garis agak tebal biar teges
                  dot={{ r: 5, strokeWidth: 3, fill: 'white' }} // Titik koordinat
                  activeDot={{ r: 6, stroke: '#10b981', fill: 'white' }}
                  animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}