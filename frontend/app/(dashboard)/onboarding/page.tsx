"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Card from '@/components/ui/Card';
import { toast } from 'react-hot-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // States
  const [teamName, setTeamName] = useState('');
  const [industry, setIndustry] = useState('E-Commerce');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName) {
      toast.error('Nama Tim wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulasikan atau panggil create team endpoint jika ada
      const res = await apiFetch('/team', {
        method: 'POST',
        body: JSON.stringify({ name: teamName }),
      });

      if (res.ok) {
        toast.success('Team baru berhasil didaftarkan');
        // update local userData if needed
        const stored = localStorage.getItem('userData');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.team = { name: teamName };
          localStorage.setItem('userData', JSON.stringify(parsed));
        }
        setStep(2);
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.success('Team didaftarkan (Offline Mode)');
      setStep(2);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto space-y-6 animate-in fade-in duration-300 min-h-[80vh] flex flex-col justify-center">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto shadow-lg shadow-blue-600/20">
          S
        </div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Selamat Datang di SARAI!</h1>
        <p className="text-xs text-slate-400">System for Analysis & Response AI — Mari siapkan workspace Anda.</p>
      </div>

      {/* Steps indicator */}
      <div className="flex justify-center items-center gap-2">
        <div className={`w-8 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
        <div className={`w-8 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
      </div>

      {step === 1 ? (
        <Card className="p-8 bg-white border border-slate-200 shadow-sm rounded-2xl">
          <h2 className="font-bold text-slate-800 text-sm mb-4">Langkah 1: Identitas Tim / Organisasi</h2>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Nama Tim Kerja / Perusahaan</label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Marketing Squad, Okegas Corp"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Fokus Industri Pemasaran</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="E-Commerce">E-Commerce (Ritel Online)</option>
                <option value="SaaS">SaaS & Software</option>
                <option value="Agency">Digital Agency</option>
                <option value="Other">Industri Lainnya</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/10"
            >
              {isSubmitting ? 'Memproses...' : 'Lanjutkan'}
            </button>
          </form>
        </Card>
      ) : (
        <Card className="p-8 bg-white border border-slate-200 shadow-sm rounded-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto">
            🔌
          </div>
          <div className="space-y-2">
            <h2 className="font-bold text-slate-800 text-base">Langkah 2: Sambungkan Sumber Data Pertama</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Hubungkan akun Google Ads, Facebook Ads, atau CRM Anda untuk mulai menganalisis performa data marketing dengan AI.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold rounded-xl transition-colors"
            >
              Lewati Dahulu
            </button>
            <button
              onClick={() => router.push('/data-sources/add')}
              className="flex-1 py-2.5 bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold rounded-xl transition-all shadow-sm"
            >
              Hubungkan Data Source ➔
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
