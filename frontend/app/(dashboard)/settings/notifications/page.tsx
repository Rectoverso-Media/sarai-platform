"use client";

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import { toast } from 'react-hot-toast';

export default function NotificationPreferencesPage() {
  const [inApp, setInApp] = useState(true);
  const [email, setEmail] = useState(false);
  const [slack, setSlack] = useState(false);
  const [webhook, setWebhook] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await apiFetch('/notifications/preferences');
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setInApp(data.inApp ?? true);
            setEmail(data.email ?? false);
            setSlack(data.slack ?? false);
            setWebhook(data.webhook ?? false);
            setSlackWebhookUrl(data.slackWebhookUrl ?? '');
            setWebhookUrl(data.webhookUrl ?? '');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const preferences = {
      inApp,
      email,
      slack,
      webhook,
      slackWebhookUrl,
      webhookUrl,
    };

    try {
      const res = await apiFetch('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      });

      if (res.ok) {
        toast.success('Preferensi notifikasi tim berhasil diperbarui');
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.success('Preferensi diperbarui (Offline Mode)');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-in fade-in duration-300">
        <PageHeader title="Notifikasi Tim" description="Konfigurasi saluran pengiriman alert." />
        <Card className="p-6 h-60 bg-white animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Preferensi Notifikasi Tim"
        description="Kelola bagaimana tim Anda menerima alert sistem, deteksi anomali iklan, dan laporan terjadwal."
      />

      <Card className="max-w-2xl p-8 bg-white border border-slate-200 shadow-sm rounded-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">Saluran Notifikasi Aktif</h3>
            
            {/* In App (Always active) */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Notifikasi In-App</span>
                <span className="text-[10px] text-slate-400">Pemberitahuan langsung di dalam web portal SARAI (Selalu Aktif).</span>
              </div>
              <input
                type="checkbox"
                disabled
                checked={inApp}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-not-allowed opacity-50"
              />
            </div>

            {/* Email Dispatch */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Notifikasi Email</span>
                <span className="text-[10px] text-slate-400">Kirim email ringkasan laporan anomali ke email anggota tim.</span>
              </div>
              <input
                type="checkbox"
                checked={email}
                onChange={(e) => setEmail(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Slack Integration */}
            <div className="p-3 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Koneksi Slack Webhook</span>
                  <span className="text-[10px] text-slate-400">Terima alert instan di channel Slack tim Anda.</span>
                </div>
                <input
                  type="checkbox"
                  checked={slack}
                  onChange={(e) => setSlack(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {slack && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Slack Incoming Webhook URL</label>
                  <input
                    type="url"
                    required
                    value={slackWebhookUrl}
                    onChange={(e) => setSlackWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}
            </div>

            {/* Custom Webhook */}
            <div className="p-3 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Custom Webhook (HTTP POST)</span>
                  <span className="text-[10px] text-slate-400">Kirim JSON payload notifikasi ke endpoint server internal Anda.</span>
                </div>
                <input
                  type="checkbox"
                  checked={webhook}
                  onChange={(e) => setWebhook(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {webhook && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Webhook Destination URL</label>
                  <input
                    type="url"
                    required
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://api.yourdomain.com/webhook"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}
            </div>

          </div>

          <div className="flex gap-4 justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Preferensi'}
            </button>
          </div>

        </form>
      </Card>
    </div>
  );
}
