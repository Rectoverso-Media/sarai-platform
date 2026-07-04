"use client";
import React, { useState } from 'react';
import Link from 'next/link';

// Platform logos as SVG components
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const MetaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path fill="#000" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <defs>
      <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80"/>
        <stop offset="25%" stopColor="#F77737"/>
        <stop offset="50%" stopColor="#F56040"/>
        <stop offset="75%" stopColor="#FD1D1D"/>
        <stop offset="100%" stopColor="#E1306C"/>
      </linearGradient>
    </defs>
    <path fill="url(#ig-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const ShopeeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path fill="#EE4D2D" d="M6.6 2.5L1.2 5.5 7 9l-1.5 4h10.3l2.7 4L24 5.5l-5.4-3H6.6zm.8 2h9.3l.6 1-3.2 1 3.8 1.5L11.8 11l.6 1.5h-5l4.2 1.5-1 3-3-1-3 1-1-3 4.2-1.5h-5l.6-1.5-5.8-3.5-3.2 1 .6-1.5z"/>
  </svg>
);

const GAIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path fill="#E37400" d="M16.5 5c-.28 0-.55.04-.81.1L11.47 1.3a.45.45 0 0 0-.67.38V21.5l6.38-6.38c.14-.14.33-.22.53-.22h8.26a.45.45 0 0 0 0-.9h-9.5zM3 3.5h7v17H3V3.5z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8">
    <path fill="#1DA1F2" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll for navbar
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const platforms = [
    { name: 'Google Ads', icon: <GoogleIcon />, color: 'hover:shadow-[#4285F4]/25' },
    { name: 'Meta Ads', icon: <MetaIcon />, color: 'hover:shadow-[#1877F2]/25' },
    { name: 'TikTok Ads', icon: <TikTokIcon />, color: 'hover:shadow-black/25' },
    { name: 'Instagram', icon: <InstagramIcon />, color: 'hover:shadow-pink-500/25' },
    { name: 'Shopee', icon: <ShopeeIcon />, color: 'hover:shadow-[#EE4D2D]/25' },
    { name: 'Google Analytics', icon: <GAIcon />, color: 'hover:shadow-[#E37400]/25' },
    { name: 'LinkedIn', icon: <LinkedInIcon />, color: 'hover:shadow-[#0A66C2]/25' },
    { name: 'Twitter/X', icon: <TwitterIcon />, color: 'hover:shadow-[#1DA1F2]/25' },
  ];

  const features = [
    {
      icon: '🔗',
      title: 'Hubungkan Platform',
      description: 'Satu klik untuk connect Google Ads, Meta, TikTok, dan platform lainnya. Tanpa ribet.',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      icon: '⚡',
      title: 'Auto Sync',
      description: 'Data tersinkronisasi otomatis setiap jam. Pagi ini dapat laporan kemarin otomatis.',
      color: 'from-sky-500 to-blue-500',
    },
    {
      icon: '✨',
      title: 'AI Insights',
      description: 'AI jelaskan data dalam Bahasa Indonesia. "Campaign X turun 30%, cek budget-nya."',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: '📊',
      title: 'Dashboard实时',
      description: 'Lihat semua metrics di satu dashboard. Mobile-friendly, cek di HP juga bisa.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: '📱',
      title: 'Report ke WhatsApp',
      description: 'Report mingguan otomatis ke WhatsApp. Serah ke AI, lo focus ke strategy.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: '🔒',
      title: 'Aman & Terpercaya',
      description: 'Data lo di-encrypt, server di Singapore. Privacy first, trust matters.',
      color: 'from-slate-600 to-slate-700',
    },
  ];

  const testimonials = [
    {
      name: 'Budi Santoso',
      role: 'Marketing Manager',
      company: 'PT Maju Bersama',
      quote: 'Dulu 2 jam/hari buat export data. Sekarang tinggal buka HP, semua udah ready. Hemat 40+ jam/bulan!',
      avatar: 'BS',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      name: 'Siti Rahayu',
      role: 'Owner Agency',
      company: 'Creative Digital Agency',
      quote: 'SARAI bantu kami bikin report ke 12 client jadi 10 menit. Tim kami bisa fokus ke kreativitas.',
      avatar: 'SR',
      color: 'from-sky-500 to-blue-500',
    },
    {
      name: 'Ahmad Wijaya',
      role: 'Head of Marketing',
      company: 'Startup E-commerce',
      quote: 'AI insights-nya akurat. Tau campaign mana yang perform, mana yang bocor budget. ROI naik 40%.',
      avatar: 'AW',
      color: 'from-emerald-500 to-teal-500',
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '299',
      period: '/bulan',
      description: 'Cocok untuk bisnis kecil atau personal',
      features: [
        '3 platform terhubung',
        '1 user',
        'Daily sync',
        'Basic dashboard',
        'Email report',
        'Support via chat',
      ],
      cta: 'Mulai Gratis 14 Hari',
      popular: false,
    },
    {
      name: 'Pro',
      price: '599',
      period: '/bulan',
      description: 'Untuk agency atau tim marketing',
      features: [
        '10 platform terhubung',
        '5 users',
        'Hourly sync',
        'Advanced dashboard',
        'WhatsApp + Email report',
        'AI insights',
        'Priority support',
      ],
      cta: 'Mulai Sekarang',
      popular: true,
    },
    {
      name: 'Business',
      price: '1.299',
      period: '/bulan',
      description: 'Untuk perusahaan dengan tim besar',
      features: [
        'Unlimited platform',
        'Unlimited users',
        'Real-time sync',
        'Custom dashboard',
        'API access',
        'White-label report',
        'Dedicated support',
      ],
      cta: 'Hubungi Sales',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ═══════════════════════════════════════════════════════════════════
          NAVBAR
      ═══════════════════════════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg shadow-slate-200/50'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30 group-hover:shadow-xl group-hover:shadow-indigo-500/40 transition-all">
                S
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#1E293B] to-[#6366F1] bg-clip-text text-transparent">
                SARAI
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#fitur" className="text-[#64748B] hover:text-[#6366F1] font-medium transition-colors">
                Fitur
              </a>
              <a href="#platform" className="text-[#64748B] hover:text-[#6366F1] font-medium transition-colors">
                Platform
              </a>
              <a href="#harga" className="text-[#64748B] hover:text-[#6366F1] font-medium transition-colors">
                Harga
              </a>
              <a href="#testimoni" className="text-[#64748B] hover:text-[#6366F1] font-medium transition-colors">
                Testimoni
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-[#64748B] hover:text-[#6366F1] font-medium transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-6 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
              >
                Daftar Gratis
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#64748B] hover:text-[#6366F1]"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200">
              <div className="flex flex-col gap-4">
                <a href="#fitur" className="text-[#64748B] font-medium py-2">Fitur</a>
                <a href="#platform" className="text-[#64748B] font-medium py-2">Platform</a>
                <a href="#harga" className="text-[#64748B] font-medium py-2">Harga</a>
                <a href="#testimoni" className="text-[#64748B] font-medium py-2">Testimoni</a>
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
                  <Link href="/login" className="text-center py-3 text-[#64748B] font-medium">
                    Masuk
                  </Link>
                  <Link href="/register" className="text-center py-3 bg-[#6366F1] text-white font-semibold rounded-full">
                    Daftar Gratis
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#6366F1]/10 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-40 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#0EA5E9]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#6366F1]/10 rounded-full mb-8">
              <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
              <span className="text-sm font-medium text-[#6366F1]">Platform Automasi Reporting #1 di Indonesia</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#1E293B] leading-tight mb-6">
              Automasi Reporting,
              <br />
              <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
                Mulai 5 Menit
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto mb-10 leading-relaxed">
              Tidak perlu lagi export data manual 2 jam tiap hari.
              SARAI menghubungkan semua platform marketing Anda dan memberikan
              <span className="text-[#6366F1] font-semibold"> AI insights</span> dalam Bahasa Indonesia.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold text-lg rounded-full shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all hover:-translate-y-1"
              >
                Mulai Gratis 14 Hari
              </Link>
              <Link
                href="/demo"
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-[#1E293B] font-semibold text-lg rounded-full border-2 border-slate-200 hover:border-[#6366F1] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Lihat Demo
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Tanpa kartu kredit</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Cancel kapan saja</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Setup 5 menit</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-16 md:mt-20 relative">
            <div className="relative mx-auto max-w-5xl">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-transparent to-transparent z-10 pointer-events-none" />

              {/* Dashboard Mockup */}
              <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-200 overflow-hidden">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded-md px-3 py-1 text-xs text-slate-500">
                      app.sarai.id/dashboard
                    </div>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 bg-gradient-to-br from-slate-50 to-white">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[
                      { label: 'Total Spend', value: 'Rp 45.2jt', change: '+12%', positive: true },
                      { label: 'Total Konversi', value: '2,847', change: '+8%', positive: true },
                      { label: 'ROAS', value: '4.2x', change: '+15%', positive: true },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                        <p className="text-xs text-[#64748B] mb-1">{stat.label}</p>
                        <p className="text-xl font-bold text-[#1E293B]">{stat.value}</p>
                        <p className={`text-xs font-medium ${stat.positive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {stat.change}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Chart Placeholder */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-[#1E293B]">Performa per Platform</span>
                      <span className="text-xs text-[#64748B]">7 hari terakhir</span>
                    </div>
                    <div className="h-32 flex items-end gap-2">
                      {[65, 45, 80, 55, 90, 70, 85].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-[#6366F1] to-[#8B5CF6] rounded-t-md" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-[#94A3B8]">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          LOGOS SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-[#94A3B8] mb-8">
            Terhubung dengan platform favorit Anda
          </p>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-6 md:gap-8">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className={`flex items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1 ${platform.color}`}
                title={platform.name}
              >
                {platform.icon}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURES SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="fitur" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#6366F1]/10 text-[#6366F1] text-sm font-semibold rounded-full mb-4">
              Fitur Unggulan
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">
              Semua yang Anda butuhkan untuk
              <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent"> data-driven decisions</span>
            </h2>
            <p className="text-lg text-[#64748B]">
              Dari connect hingga insights, SARAI handle semuanya. Anda fokus ke strategy, kami handle data-nya.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-[#1E293B] mb-3">{feature.title}</h3>
                <p className="text-[#64748B] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6366F1]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#8B5CF6]/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 bg-white/10 text-white/80 text-sm font-semibold rounded-full mb-4">
              Cara Kerja
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Mulai dalam 3 langkah sederhana
            </h2>
            <p className="text-lg text-white/70">
              Tidak perlu technical expertise. Siapapun bisa setup dalam 5 menit.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#0EA5E9]" />

            {[
              {
                step: '01',
                title: 'Hubungkan Platform',
                description: 'Login dengan Google atau email. Klik connect untuk platform yang Anda gunakan. Tidak perlu coding.',
                icon: '🔗',
              },
              {
                step: '02',
                title: 'Atur Jadwal Sync',
                description: 'Pilih jam berapa data di-sync. Daily, hourly, atau real-time. Tergantung paket yang Anda pilih.',
                icon: '⚙️',
              },
              {
                step: '03',
                title: 'Terima Insights',
                description: 'Dashboard otomatis terisi. AI memberikan insights dalam Bahasa Indonesia. Report ke WhatsApp siap.',
                icon: '📊',
              },
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/30">
                    {item.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-white text-[#1E293B] text-xs font-bold rounded-full flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-white/70 max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          TESTIMONIALS SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="testimoni" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#6366F1]/10 text-[#6366F1] text-sm font-semibold rounded-full mb-4">
              Testimoni
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">
              Dipercaya oleh bisnis Indonesia
            </h2>
            <p className="text-lg text-[#64748B]">
              Ribuan bisnis sudah hemat waktu dan dapat insight lebih baik dengan SARAI.
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm relative">
                {/* Quote Icon */}
                <div className="absolute -top-4 left-8 w-8 h-8 bg-[#6366F1] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>

                <p className="text-[#64748B] leading-relaxed mb-6 mt-4">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-[#1E293B]">{testimonial.name}</p>
                    <p className="text-sm text-[#64748B]">{testimonial.role}</p>
                    <p className="text-xs text-[#94A3B8]">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PRICING SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="harga" className="py-20 md:py-32 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#6366F1]/10 text-[#6366F1] text-sm font-semibold rounded-full mb-4">
              Harga
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">
              Pilih paket yang sesuai kebutuhan Anda
            </h2>
            <p className="text-lg text-[#64748B]">
              Semua paket include 14 hari trial. Cancel kapan saja tanpa biaya tambahan.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-3xl p-8 border-2 transition-all ${
                  plan.popular
                    ? 'border-[#6366F1] shadow-xl shadow-indigo-500/10 scale-105'
                    : 'border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#6366F1] text-white text-sm font-bold rounded-full shadow-lg">
                    Populer
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-[#1E293B] mb-2">{plan.name}</h3>
                  <p className="text-sm text-[#64748B]">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#1E293B]">Rp {plan.price}</span>
                  <span className="text-[#64748B]">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-[#64748B]">
                      <svg className="w-5 h-5 text-[#10B981] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`block w-full py-4 text-center font-bold rounded-xl transition-all ${
                    plan.popular
                      ? 'bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-[#1E293B]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FAQ SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Apakah data saya aman di SARAI?',
                a: 'Ya, keamanan data adalah prioritas kami. Semua data di-encrypt, server kami di Singapore dengan standar enterprise. Kami tidak pernah menjual atau membagikan data Anda ke pihak ketiga.',
              },
              {
                q: 'Bagaimana jika saya tidak punya technical knowledge?',
                a: 'SARAI designed untuk non-technical users. Interface kami sederhana dan dalam Bahasa Indonesia. Kebanyakan customer bisa setup dalam 5 menit tanpa bantuan IT.',
              },
              {
                q: 'Bisakah saya cancel kapan saja?',
                a: 'Ya, Anda bisa cancel subscription kapan saja. Tidak ada biaya tersembunyi, tidak ada lock-in contract. Jika cancel di tengah bulan, Anda tetap bisa akses hingga akhir periode.',
              },
              {
                q: 'Platform apa saja yang didukung?',
                a: 'Kami mendukung Google Ads, Meta Ads (Facebook/Instagram), TikTok Ads, Google Analytics 4, Instagram, LinkedIn, Twitter, dan banyak lagi. Daftar lengkap bisa dilihat di halaman platform kami.',
              },
              {
                q: 'Apakah bisa dapat report otomatis ke WhatsApp?',
                a: 'Ya! Paket Pro dan Business include WhatsApp report. Anda bisa atur jadwal report mingguan atau harian, dan AI akan generate insights untuk Anda.',
              },
            ].map((faq, i) => (
              <details key={i} className="group bg-white rounded-xl border border-slate-100">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-[#1E293B]">
                  {faq.q}
                  <svg className="w-5 h-5 text-[#64748B] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-6 text-[#64748B] leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Siap hemat 40+ jam per bulan?
          </h2>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Bergabung dengan 1,000+ bisnis Indonesia yang sudah menggunakan SARAI untuk automasi reporting mereka.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-10 py-4 bg-white text-[#6366F1] font-bold text-lg rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
            >
              Mulai Gratis Sekarang
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold text-lg rounded-full border-2 border-white/30 transition-all"
            >
              Jadwalkan Demo
            </Link>
          </div>

          <p className="mt-8 text-white/60 text-sm">
            14 hari trial gratis • Tidak perlu kartu kredit • Setup 5 menit
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-[#0F172A] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-bold">
                  S
                </div>
                <span className="text-xl font-bold">SARAI</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Platform automasi reporting #1 di Indonesia. Bantu bisnis Indonesia hemat waktu dan dapat insights lebih baik.
              </p>
              <div className="flex gap-3">
                {['twitter', 'instagram', 'linkedin'].map((social) => (
                  <a key={social} href="#" className="w-10 h-10 rounded-full bg-slate-800 hover:bg-[#6366F1] flex items-center justify-center transition-colors">
                    <span className="sr-only">{social}</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Produk</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#fitur" className="hover:text-white transition-colors">Fitur</a></li>
                <li><a href="#harga" className="hover:text-white transition-colors">Harga</a></li>
                <li><a href="#platform" className="hover:text-white transition-colors">Platform</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrasi</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Perusahaan</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Karir</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kontak</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kebijakan Cookie</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              © {new Date().getFullYear()} SARAI. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
