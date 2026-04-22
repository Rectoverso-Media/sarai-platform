"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MainDashboard() {
  const [userName, setUserName] = useState('Admin');
  const [greeting, setGreeting] = useState('Selamat Pagi');

  // State untuk nyimpen angka dari database
  const [dsCount, setDsCount] = useState(0);
  const [nodesStats, setNodesStats] = useState({ online: 0, total: 0 });
  const [alertCount, setAlertCount] = useState(0);

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
        const [dsRes, nodesRes] = await Promise.all([
          fetch('http://localhost:3001/datasources'),
          fetch('http://localhost:3001/infrastructure')
        ]);

        if (dsRes.ok && nodesRes.ok) {
          const dsData = await dsRes.json();
          const nodesData = await nodesRes.json();

          // Hitung total Data Sources
          setDsCount(dsData.length);

          // Hitung Nodes yang Online vs Total Nodes
          const online = nodesData.filter((n: any) => n.status === 'Online').length;
          setNodesStats({ online, total: nodesData.length });

          // Hitung Peringatan (Kalo ada node mati/kritis atau data source offline)
          const nodeAlerts = nodesData.filter((n: any) => n.status === 'Warning' || n.status === 'Critical' || n.status === 'Offline').length;
          const dsAlerts = dsData.filter((ds: any) => ds.status !== 'Connected').length;
          setAlertCount(nodeAlerts + dsAlerts);
        }
      } catch (error) {
        console.error("Gagal sinkronisasi data dashboard:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const trafficData = [
    { day: 'Mon', value: 45 }, { day: 'Tue', value: 52 }, 
    { day: 'Wed', value: 38 }, { day: 'Thu', value: 65 }, 
    { day: 'Fri', value: 85 }, { day: 'Sat', value: 40 }, 
    { day: 'Sun', value: 30 }
  ];

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

      {/* 2. Quick Stats Grid (Sekarang terhubung ke Database!) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl">🗄️</div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Sources</p>
            <h2 className="text-3xl font-black text-slate-800 mt-1">{dsCount}</h2>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">⚡</div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Nodes Online</p>
            <h2 className="text-3xl font-black text-slate-800 mt-1">
              {nodesStats.online} <span className="text-sm font-medium text-slate-400 ml-1">/ {nodesStats.total}</span>
            </h2>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Data Ingestion Traffic</h3>
              <p className="text-xs text-slate-500 mt-1">Volume data yang ditarik dari semua Data Sources (7 hari terakhir).</p>
            </div>
            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-200 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Live
            </span>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 pt-4">
            {trafficData.map((data, i) => (
              <div key={i} className="flex flex-col items-center w-full group">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-blue-600 mb-2">
                  {data.value}GB
                </span>
                <div className="w-full max-w-[40px] bg-slate-100 rounded-t-md overflow-hidden relative" style={{ height: '200px' }}>
                  <div className="absolute bottom-0 w-full bg-blue-500 group-hover:bg-blue-600 transition-all duration-500" style={{ height: `${data.value}%` }}></div>
                </div>
                <span className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-wider">{data.day}</span>
              </div>
            ))}
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
    </div>
  );
}