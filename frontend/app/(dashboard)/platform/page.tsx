"use client";
import React, { useState } from 'react';
import Link from 'next/link';

// Platform data
const availablePlatforms = [
  { id: 'google-ads', name: 'Google Ads', category: 'Advertising', icon: 'G', color: '#4285F4' },
  { id: 'meta-ads', name: 'Meta Ads', category: 'Advertising', icon: 'M', color: '#1877F2' },
  { id: 'tiktok-ads', name: 'TikTok Ads', category: 'Advertising', icon: 'T', color: '#000000' },
  { id: 'instagram', name: 'Instagram', category: 'Social', icon: 'I', color: '#E4405F' },
  { id: 'facebook', name: 'Facebook', category: 'Social', icon: 'F', color: '#1877F2' },
  { id: 'google-analytics', name: 'Google Analytics', category: 'Analytics', icon: 'A', color: '#E37400' },
  { id: 'shopee', name: 'Shopee', category: 'E-Commerce', icon: 'S', color: '#EE4D2D' },
  { id: 'tokopedia', name: 'Tokopedia', category: 'E-Commerce', icon: 'T', color: '#03A64A' },
  { id: 'twitter', name: 'Twitter/X', category: 'Social', icon: 'X', color: '#1DA1F2' },
  { id: 'linkedin', name: 'LinkedIn', category: 'Social', icon: 'L', color: '#0A66C2' },
];

const connectedPlatforms = [
  { id: 'google-ads', name: 'Google Ads', status: 'connected', lastSync: '5 menit lalu', account: 'campaigns@perusahaan.com' },
  { id: 'meta-ads', name: 'Meta Ads', status: 'connected', lastSync: '15 menit lalu', account: 'Business Manager PT Maju' },
  { id: 'instagram', name: 'Instagram', status: 'connected', lastSync: '1 jam lalu', account: '@perusahaan.id' },
];

export default function PlatformPage() {
  const [activeTab, setActiveTab] = useState<'connected' | 'available'>('connected');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Platform</h1>
          <p className="text-[#64748B]">Kelola koneksi platform marketing Anda</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Platform
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('connected')}
          className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
            activeTab === 'connected'
              ? 'text-[#6366F1]'
              : 'text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          Terhubung ({connectedPlatforms.length})
          {activeTab === 'connected' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366F1]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
            activeTab === 'available'
              ? 'text-[#6366F1]'
              : 'text-[#64748B] hover:text-[#1E293B]'
          }`}
        >
          Tersedia ({availablePlatforms.length})
          {activeTab === 'available' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366F1]" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'connected' ? (
        <div className="space-y-4">
          {connectedPlatforms.map((platform) => (
            <div
              key={platform.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: availablePlatforms.find(p => p.id === platform.id)?.color || '#6366F1' }}
                  >
                    {platform.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1E293B]">{platform.name}</h3>
                    <p className="text-sm text-[#64748B]">{platform.account}</p>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
                        Terakhir sync: {platform.lastSync}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 rounded-lg transition-colors">
                    Refresh
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-[#6366F1] hover:bg-indigo-50 rounded-lg transition-colors">
                    Pengaturan
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors">
                    Putuskan
                  </button>
                </div>
              </div>
            </div>
          ))}

          {connectedPlatforms.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#1E293B] mb-2">Belum ada platform terhubung</h3>
              <p className="text-[#64748B] mb-6">Hubungkan platform marketing Anda untuk memulai tracking</p>
              <button
                onClick={() => setActiveTab('available')}
                className="px-6 py-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold rounded-xl transition-colors"
              >
                Tambah Platform
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {availablePlatforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => {
                setSelectedPlatform(platform.id);
                setShowAddModal(true);
              }}
              className="bg-white rounded-xl border border-slate-200 p-6 text-left hover:shadow-lg hover:border-[#6366F1]/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[#1E293B] group-hover:text-[#6366F1] transition-colors">
                    {platform.name}
                  </h3>
                  <p className="text-xs text-[#94A3B8]">{platform.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Hubungkan
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add Platform Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false);
              setSelectedPlatform(null);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
            <button
              onClick={() => {
                setShowAddModal(false);
                setSelectedPlatform(null);
              }}
              className="absolute top-4 right-4 p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
                +
              </div>
              <h2 className="text-xl font-bold text-[#1E293B]">Hubungkan Platform</h2>
              <p className="text-[#64748B] mt-1">
                Pilih platform yang ingin Anda hubungkan
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availablePlatforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    selectedPlatform === platform.id
                      ? 'border-[#6366F1] bg-[#6366F1]/5'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-[#1E293B]">{platform.name}</h3>
                    <p className="text-sm text-[#64748B]">{platform.category}</p>
                  </div>
                  {selectedPlatform === platform.id && (
                    <div className="w-6 h-6 bg-[#6366F1] rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedPlatform(null);
                }}
                className="flex-1 py-3 text-[#64748B] font-medium hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                disabled={!selectedPlatform}
                className="flex-1 py-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hubungkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
