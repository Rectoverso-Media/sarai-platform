"use client";
import React, { useState } from 'react';
import Link from 'next/link';

const mockReports = [
  {
    id: 1,
    name: 'Laporan Mingguan Ads',
    type: 'Otomatic',
    schedule: 'Setiap Senin 08:00',
    platforms: ['Google Ads', 'Meta Ads'],
    lastRun: 'Hari ini, 08:00',
    status: 'completed',
    channels: ['email', 'whatsapp'],
  },
  {
    id: 2,
    name: 'Performance TikTok & IG',
    type: 'Manual',
    schedule: '-',
    platforms: ['TikTok', 'Instagram'],
    lastRun: 'Kemarin, 09:00',
    status: 'completed',
    channels: ['whatsapp'],
  },
  {
    id: 3,
    name: 'Monthly Summary',
    type: 'Otomatic',
    schedule: 'Tanggal 1 setiap bulan',
    platforms: ['Google Ads', 'Meta Ads', 'Google Analytics'],
    lastRun: '3 hari lalu',
    status: 'completed',
    channels: ['email'],
  },
  {
    id: 4,
    name: 'Daily Performance Check',
    type: 'Otomatic',
    schedule: 'Setiap hari 07:00',
    platforms: ['Google Ads', 'Meta Ads', 'TikTok'],
    lastRun: 'Scheduled',
    status: 'pending',
    channels: ['whatsapp'],
  },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'auto' | 'manual'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredReports = activeTab === 'all'
    ? mockReports
    : mockReports.filter(r => r.type.toLowerCase() === activeTab);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Laporan</h1>
          <p className="text-[#64748B]">Kelola dan buat laporan otomatis</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Buat Laporan Baru
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Laporan', value: '4', icon: '📊', color: 'from-blue-500 to-blue-600' },
          { label: 'Auto Reports', value: '3', icon: '⚡', color: 'from-emerald-500 to-teal-500' },
          { label: 'Runs This Week', value: '12', icon: '✅', color: 'from-violet-500 to-purple-500' },
          { label: 'Next Scheduled', value: '08:00', icon: '🕐', color: 'from-amber-500 to-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-sm text-[#64748B]">{stat.label}</p>
            <p className="text-2xl font-bold text-[#1E293B]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'auto', label: 'Otomatis' },
          { id: 'manual', label: 'Manual' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-[#6366F1] text-white'
                : 'text-[#64748B] hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#6366F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-[#1E293B]">{report.name}</h3>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      report.type === 'Otomatis'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {report.type}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {report.schedule}
                    </span>
                    <span>•</span>
                    <span>Run terakhir: {report.lastRun}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {report.platforms.map((platform) => (
                      <span key={platform} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Status */}
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  report.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-amber-50 text-amber-600'
                }`}>
                  {report.status === 'completed' ? '✓ Selesai' : '⏳ Scheduled'}
                </span>

                {/* Channels */}
                <div className="flex items-center gap-1">
                  {report.channels.includes('email') && (
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center" title="Email">
                      <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                  )}
                  {report.channels.includes('whatsapp') && (
                    <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center" title="WhatsApp">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button className="p-2 text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-[#1E293B] mb-6">Buat Laporan Baru</h2>

            <form className="space-y-6">
              {/* Report Name */}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                  Nama Laporan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Laporan Mingguan Ads"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1]"
                />
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                  Pilih Platform
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Google Ads', 'Meta Ads', 'TikTok', 'Instagram', 'Google Analytics', 'LinkedIn'].map((platform) => (
                    <label key={platform} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:border-[#6366F1]/50 has-[:checked]:border-[#6366F1] has-[:checked]:bg-[#6366F1]/5">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#6366F1]" />
                      <span className="text-sm text-[#1E293B]">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                  Jadwal
                </label>
                <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1]">
                  <option>Harian - Setiap pagi 07:00</option>
                  <option> Mingguan - Setiap Senin 08:00</option>
                  <option>Bulanan - Tanggal 1 setiap bulan</option>
                  <option>Manual - Jalankan sesuai kebutuhan</option>
                </select>
              </div>

              {/* Delivery Channel */}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                  Channel Pengiriman
                </label>
                <div className="flex gap-3">
                  <label className="flex-1 flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-[#6366F1]/50 has-[:checked]:border-[#6366F1] has-[:checked]:bg-[#6366F1]/5">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#6366F1]" />
                    <div>
                      <span className="text-sm font-medium text-[#1E293B]">Email</span>
                      <p className="text-xs text-[#64748B]">Kirim ke email Anda</p>
                    </div>
                  </label>
                  <label className="flex-1 flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:border-[#6366F1]/50 has-[:checked]:border-[#6366F1] has-[:checked]:bg-[#6366F1]/5">
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-300 text-[#6366F1]" />
                    <div>
                      <span className="text-sm font-medium text-[#1E293B]">WhatsApp</span>
                      <p className="text-xs text-[#64748B]">Kirim ke WhatsApp Anda</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 text-[#64748B] font-medium hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all"
                >
                  Buat Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
