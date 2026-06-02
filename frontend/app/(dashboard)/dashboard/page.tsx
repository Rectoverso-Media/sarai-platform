"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function MainDashboard() {
  const [userName, setUserName] = useState('Admin');
  const [greeting, setGreeting] = useState('Good Morning');

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
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Tarik Data dari Backend secara bersamaan (Parallel Fetching)
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

        const [dsRes, nodesRes, distRes, trafficRes, perfRes] = await Promise.all([
          fetch(`${API_URL}/datasources`, { headers }),
          fetch(`${API_URL}/infrastructure`, { headers }),
          fetch(`${API_URL}/dashboard/stats/distribution`, { headers }),
          fetch(`${API_URL}/dashboard/stats/traffic`, { headers }),
          fetch(`${API_URL}/dashboard/stats/performance`, { headers })
        ]);

        if (dsRes.ok && nodesRes.ok) {
          const dsJson = await dsRes.json();
          const nodesJson = await nodesRes.json();

          const dsData = Array.isArray(dsJson) ? dsJson : (dsJson.data || []);
          const nodesData = Array.isArray(nodesJson) ? nodesJson : (nodesJson.data || []);

          setDsCount(dsData.length);
          
          const online = nodesData.filter((n: { status: string }) => n.status === 'Online').length;
          setNodesStats({ online, total: nodesData.length });

          const nodeAlerts = nodesData.filter((n: { status: string }) => n.status === 'Warning' || n.status === 'Critical' || n.status === 'Offline').length;
          const dsAlerts = dsData.filter((ds: { status: string }) => ds.status !== 'Connected' && ds.status !== 'Active').length;
          
          setAlertCount(nodeAlerts + dsAlerts);
        }

        if (distRes.ok) {
          const distData = await distRes.json();
          setSourceDistribution(distData);
        }

        if (trafficRes.ok) {
          const trafficJson = await trafficRes.json();
          setTrafficData(trafficJson);
        }

        if (perfRes.ok) {
          const perfData = await perfRes.json();
          setPerformanceData(perfData);
        }
      } catch (error) {
        console.error("Failed to sync dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="p-8 h-full flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">
            {greeting}, {userName}! 👋
          </h1>
          <p className="mt-2 text-blue-100 max-w-2xl text-sm leading-relaxed">
            {alertCount === 0 
              ? "Here's your SARAI system summary for today. All infrastructure nodes are running normally." 
              : `Attention: ${alertCount} system(s) require your review. Please check the warning logs below.`}
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
              <p className="text-xs text-slate-500 mt-1">Data volume pulled from all Data Sources (last 7 days).</p>
            </div>
            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-200 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Live
            </span>
          </div>
          
          <div className="w-full mt-2" style={{ minHeight: 260, height: 260 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }} 
                  tickFormatter={(value) => `${value}GB`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value} GB`, 'Volume']}
                />
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

        {/* 4. System Logs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-lg text-slate-800 mb-6">System Logs</h3>
          <div className="space-y-6 flex-1">
            <div className="flex gap-4">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0"></div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Dashboard Synced</p>
                <p className="text-xs text-slate-500 mt-1">Successfully loaded real-time metrics from {nodesStats.total} nodes and {dsCount} data sources.</p>
                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">Just now</p>
              </div>
            </div>
          </div>
          <button className="w-full py-2.5 mt-4 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
            View All Logs
          </button>
        </div>
      </div>

      {/* 5. Donut Chart & Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        
        {/* Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
          <h3 className="font-bold text-lg text-slate-800 mb-1">Data Source Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Proportion of connected database technologies.</p>
          
          <div className="w-full" style={{ minHeight: 280, height: 280 }}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={sourceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {sourceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value}%`, 'Proportion']}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-800">Query Performance Trend</h3>
              <p className="text-xs text-slate-500 mt-1">Average query execution time (milliseconds) per hour.</p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-200">
              Today
            </span>
          </div>

          <div className="w-full mt-2" style={{ minHeight: 260, height: 260 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={performanceData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(value) => `${value}ms`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value} ms`, 'Avg. Time']}
                />
                <Line 
                  type="monotone"
                  dataKey="avgTime" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 5, strokeWidth: 3, fill: 'white' }}
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