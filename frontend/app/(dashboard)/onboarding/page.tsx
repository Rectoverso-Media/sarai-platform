"use client";
import React, { useState } from 'react';
import Link from 'next/link';

const steps = [
  {
    number: 1,
    title: 'Selamat Datang',
    description: 'Mari kita setup akun Anda',
    icon: '👋',
  },
  {
    number: 2,
    title: 'Hubungkan',
    description: 'Pilih platform marketing',
    icon: '🔗',
    platforms: [
      { name: 'Google Ads', color: '#4285F4' },
      { name: 'Meta Ads', color: '#1877F2' },
      { name: 'TikTok Ads', color: '#000000' },
      { name: 'Instagram', color: '#E4405F' },
      { name: 'Google Analytics', color: '#E37400' },
      { name: 'Shopee', color: '#EE4D2D' },
    ],
  },
  {
    number: 3,
    title: 'Paket',
    description: 'Pilih sesuai kebutuhan',
    icon: '📦',
  },
  {
    number: 4,
    title: 'Selesai!',
    description: 'Akun siap digunakan',
    icon: '🎉',
  },
];

const packages = [
  {
    name: 'Starter',
    price: '299rb',
    period: '/bulan',
    features: ['3 platform', '1 user', 'Daily sync', 'Basic dashboard'],
    popular: false,
  },
  {
    name: 'Pro',
    price: '599rb',
    period: '/bulan',
    features: ['10 platform', '5 users', 'Hourly sync', 'AI insights', 'WhatsApp report'],
    popular: true,
  },
  {
    name: 'Business',
    price: '1.299rb',
    period: '/bulan',
    features: ['Unlimited', 'Unlimited users', 'Real-time', 'API access', 'White-label'],
    popular: false,
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('pro');

  const togglePlatform = (name: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(name)
        ? prev.filter((p) => p !== name)
        : [...prev, name]
    );
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-indigo-50/30 to-[#F8FAFC]">
      {/* Header */}
      <header className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
            S
          </div>
          <span className="text-xl font-bold text-[#1E293B]">SARAI</span>
        </Link>
      </header>

      {/* Progress */}
      <div className="max-w-4xl mx-auto px-6 mb-12">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <React.Fragment key={step.number}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    currentStep >= step.number
                      ? 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {currentStep > step.number ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${
                  currentStep >= step.number ? 'text-[#1E293B]' : 'text-[#94A3B8]'
                }`}>
                  {step.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded-full transition-all ${
                    currentStep > step.number ? 'bg-[#6366F1]' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="relative h-64 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">{steps[0].icon}</div>
                  <h1 className="text-3xl font-bold mb-2">Selamat Datang di SARAI!</h1>
                  <p className="text-white/80 text-lg">Mari kita setup akun Anda dalam beberapa langkah mudah</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  { icon: '🔗', title: 'Hubungkan', desc: 'Koneksikan platform marketing Anda' },
                  { icon: '📊', title: 'Analisis', desc: 'AI menganalisis data secara otomatis' },
                  { icon: '💡', title: 'Insights', desc: 'Dapatkan rekomendasi bisnis' },
                ].map((item, i) => (
                  <div key={i} className="text-center p-4 bg-slate-50 rounded-2xl">
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <h3 className="font-semibold text-[#1E293B] mb-1">{item.title}</h3>
                    <p className="text-sm text-[#64748B]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Connect Platforms */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">{steps[1].icon}</div>
              <h2 className="text-2xl font-bold text-[#1E293B] mb-2">{steps[1].title}</h2>
              <p className="text-[#64748B]">Pilih platform marketing yang Anda gunakan</p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {steps[1].platforms?.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => togglePlatform(platform.name)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedPlatforms.includes(platform.name)
                      ? 'border-[#6366F1] bg-[#6366F1]/5'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: platform.color }}
                    >
                      {platform.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium text-[#1E293B]">{platform.name}</span>
                    </div>
                    {selectedPlatforms.includes(platform.name) && (
                      <div className="w-6 h-6 bg-[#6366F1] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-[#64748B]">
                {selectedPlatforms.length === 0
                  ? 'Pilih setidaknya 1 platform untuk melanjutkan'
                  : `${selectedPlatforms.length} platform dipilih`}
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Choose Package */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">{steps[2].icon}</div>
              <h2 className="text-2xl font-bold text-[#1E293B] mb-2">{steps[2].title}</h2>
              <p className="text-[#64748B]">Pilih paket yang sesuai dengan kebutuhan bisnis Anda</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {packages.map((pkg) => (
                <button
                  key={pkg.name}
                  onClick={() => setSelectedPackage(pkg.name.toLowerCase())}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    selectedPackage === pkg.name.toLowerCase()
                      ? 'border-[#6366F1] bg-[#6366F1]/5 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  } ${pkg.popular ? 'relative' : ''}`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#6366F1] text-white text-xs font-bold rounded-full">
                      Populer
                    </div>
                  )}
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-[#1E293B] mb-1">{pkg.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-bold text-[#1E293B]">Rp {pkg.price}</span>
                      <span className="text-[#64748B]">{pkg.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[#64748B]">
                        <svg className="w-4 h-4 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-[#64748B]">
              Semua paket termasuk <strong className="text-[#1E293B]">14 hari trial gratis</strong>. Tidak perlu kartu kredit.
            </p>
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
            <div className="text-7xl mb-6">{steps[3].icon}</div>
            <h2 className="text-3xl font-bold text-[#1E293B] mb-4">Selesai!</h2>
            <p className="text-[#64748B] text-lg mb-8">Akun Anda siap digunakan. Selamat menggunakan SARAI!</p>

            <div className="bg-slate-50 rounded-2xl p-6 mb-8 max-w-md mx-auto">
              <h3 className="font-semibold text-[#1E293B] mb-4">Ringkasan Setup:</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#6366F1]/10 flex items-center justify-center">
                    <span className="text-sm">🔗</span>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">Platform Terhubung</p>
                    <p className="text-xs text-[#64748B]">
                      {selectedPlatforms.length === 0 ? 'Tidak ada' : selectedPlatforms.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#6366F1]/10 flex items-center justify-center">
                    <span className="text-sm">📦</span>
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">Paket Dipilih</p>
                    <p className="text-xs text-[#64748B]">
                      {packages.find(p => p.name.toLowerCase() === selectedPackage)?.name} - Rp {packages.find(p => p.name.toLowerCase() === selectedPackage)?.price}/bulan
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-lg rounded-full shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all"
            >
              Buka Dashboard
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 text-[#64748B] font-medium hover:text-[#1E293B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Sebelumnya
          </button>

          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              disabled={currentStep === 2 && selectedPlatforms.length === 0}
              className="px-8 py-3 bg-[#6366F1] hover:bg-[#4F46E5] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all"
            >
              Lanjut →
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
