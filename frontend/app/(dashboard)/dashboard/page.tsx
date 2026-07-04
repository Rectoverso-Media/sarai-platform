"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('Selamat Pagi');
  const [userName, setUserName] = useState('Pengguna');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demo
  const stats = [
    {
      label: 'Total Pengeluaran',
      value: 'Rp 45.2 juta',
      change: '+12%',
      positive: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Total Konversi',
      value: '2,847',
      change: '+8%',
      positive: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'ROAS',
      value: '4.2x',
      change: '+15%',
      positive: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'from-violet-500 to-purple-500',
    },
    {
      label: 'Impresi',
      value: '1.2M',
      change: '+23%',
      positive: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-500',
    },
  ];

  const platforms = [
    { name: 'Google Ads', status: 'connected', lastSync: '5 menit lalu', icon: 'G', color: 'bg-[#4285F4]' },
    { name: 'Meta Ads', status: 'connected', lastSync: '15 menit lalu', icon: 'M', color: 'bg-[#1877F2]' },
    { name: 'Instagram', status: 'connected', lastSync: '1 jam lalu', icon: 'I', color: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]' },
    { name: 'TikTok', status: 'warning', lastSync: '3 jam lalu', icon: 'T', color: 'bg-[#000000]' },
    { name: 'Google Analytics', status: 'connected', lastSync: 'Baru saja', icon: 'A', color: 'bg-[#E37400]' },
  ];

  const recentReports = [
    { name: 'Laporan Mingguan', date: 'Hari ini, 08:00', status: 'completed', platform: 'Email + WhatsApp' },
    { name: 'Performance Ads', date: 'Kemarin, 09:00', status: 'completed', platform: 'WhatsApp' },
    { name: 'Monthly Summary', date: '3 hari lalu', status: 'completed', platform: 'Email' },
  ];

  const aiInsights = [
    {
      type: 'warning',
      title: 'Campaign "Promo Akhir Bulan" ROAS turun 30%',
      description: 'Pertimbangkan untuk review budget allocation campaign ini.',
      time: '2 jam lalu',
    },
    {
      type: 'success',
      title: 'Instagram outperform target!',
      description: 'Engagement rate 2x lebih tinggi dari rata-rata.',
      time: '5 jam lalu',
    },
    {
      type: 'info',
      title: 'Budget opportunity detected',
      description: 'Shift Rp 5 juta dari TikTok ke Google Ads bisa naikkan ROAS.',
      time: '1 hari lalu',
    },
  ];

  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Selamat Pagi');
    else if (hour < 15) setGreeting('Selamat Siang');
    else if (hour < 18) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');

    // Get user name from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserName(user.name?.split(' ')[0] || 'Pengguna');
      } catch {
        // ignore
      }
    }

    // Simulate loading
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-[#6366F1] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                {greeting}, {userName}! 👋
              </h1>
              <p className="text-white/80">
                Berikut ringkasan performa marketing Anda hari ini.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/platform/add"
                className="px-5 py-2.5 bg-white text-[#6366F1] font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Platform
              </Link>
            </div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute right-0 top-0 w-64 h-full bg-white/5 skew-x-12 translate-x-12" />
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                {stat.icon}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                stat.positive
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm text-[#64748B] mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-[#1E293B]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Performa per Platform</h2>
              <p className="text-sm text-[#64748B]">7 hari terakhir</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-medium bg-[#6366F1] text-white rounded-lg">7 Hari</button>
              <button className="px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-slate-100 rounded-lg transition-colors">30 Hari</button>
            </div>
          </div>

          {/* Chart Placeholder */}
          <div className="h-64 flex items-end gap-3">
            {[
              { day: 'Mon', google: 80, meta: 60, ig: 45 },
              { day: 'Tue', google: 90, meta: 75, ig: 55 },
              { day: 'Wed', google: 70, meta: 65, ig: 60 },
              { day: 'Thu', google: 85, meta: 80, ig: 50 },
              { day: 'Fri', google: 95, meta: 70, ig: 65 },
              { day: 'Sat', google: 60, meta: 55, ig: 70 },
              { day: 'Sun', google: 75, meta: 65, ig: 75 },
            ].map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center gap-1 h-48">
                  <div
                    className="w-4 bg-gradient-to-t from-[#4285F4] to-blue-400 rounded-t-md"
                    style={{ height: `${data.google}%` }}
                  />
                  <div
                    className="w-4 bg-gradient-to-t from-[#1877F2] to-blue-300 rounded-t-md"
                    style={{ height: `${data.meta}%` }}
                  />
                  <div
                    className="w-4 bg-gradient-to-t from-[#833AB4] to-pink-400 rounded-t-md"
                    style={{ height: `${data.ig}%` }}
                  />
                </div>
                <span className="text-xs text-[#94A3B8]">{data.day}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#4285F4]" />
              <span className="text-sm text-[#64748B]">Google Ads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#1877F2]" />
              <span className="text-sm text-[#64748B]">Meta Ads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#833AB4]" />
              <span className="text-sm text-[#64748B]">Instagram</span>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">AI Insights</h2>
              <p className="text-sm text-[#64748B]">Rekomendasi untuk Anda</p>
            </div>
            <span className="px-3 py-1 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white text-xs font-bold rounded-full">
              NEW
            </span>
          </div>

          <div className="space-y-4">
            {aiInsights.map((insight, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  insight.type === 'warning'
                    ? 'bg-amber-50 border-amber-200'
                    : insight.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    insight.type === 'warning'
                      ? 'bg-amber-100 text-amber-600'
                      : insight.type === 'success'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✨' : '💡'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#1E293B] text-sm mb-1">{insight.title}</h3>
                    <p className="text-xs text-[#64748B] mb-2">{insight.description}</p>
                    <p className="text-xs text-[#94A3B8]">{insight.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/ai-insights"
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-[#6366F1] hover:bg-indigo-50 rounded-xl transition-colors"
          >
            Lihat Semua Insights
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Connected Platforms */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Platform Terhubung</h2>
              <p className="text-sm text-[#64748B]">{platforms.length} platform aktif</p>
            </div>
            <Link
              href="/platform"
              className="text-sm font-semibold text-[#6366F1] hover:text-[#4F46E5] transition-colors"
            >
              Kelola
            </Link>
          </div>

          <div className="space-y-3">
            {platforms.map((platform, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {platform.icon}
                  </div>
                  <div>
                    <p className="font-medium text-[#1E293B]">{platform.name}</p>
                    <p className="text-xs text-[#64748B]">Sync: {platform.lastSync}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    platform.status === 'connected'
                      ? 'bg-[#10B981]'
                      : platform.status === 'warning'
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#EF4444]'
                  }`} />
                  <span className={`text-xs font-medium ${
                    platform.status === 'connected'
                      ? 'text-[#10B981]'
                      : platform.status === 'warning'
                      ? 'text-[#F59E0B]'
                      : 'text-[#EF4444]'
                  }`}>
                    {platform.status === 'connected' ? 'Terhubung' : 'Warning'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Laporan Terbaru</h2>
              <p className="text-sm text-[#64748B]">Auto-generated reports</p>
            </div>
            <Link
              href="/reports"
              className="text-sm font-semibold text-[#6366F1] hover:text-[#4F46E5] transition-colors"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="space-y-3">
            {recentReports.map((report, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#6366F1]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#6366F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[#1E293B]">{report.name}</p>
                    <p className="text-xs text-[#64748B]">{report.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-lg">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {report.status === 'completed' ? 'Selesai' : 'Pending'}
                  </span>
                  <p className="text-xs text-[#94A3B8] mt-1">{report.platform}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/reports/create"
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Buat Laporan Baru
          </Link>
        </div>
      </div>
    </div>
  );
}
