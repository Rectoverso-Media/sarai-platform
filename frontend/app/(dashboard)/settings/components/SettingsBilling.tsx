"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../../lib/api';

// ─── Types ───────────────────────────────────────
interface UsageMetric {
  used: number;
  limit: number;
  percentage: number;
  isUnlimited: boolean;
}

interface BillingData {
  team: { id: string; name: string };
  subscription: {
    plan: string;
    planDisplayName: string;
    status: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    isTrialExpired: boolean;
    daysUntilTrialEnd: number | null;
  };
  usage: {
    queries: UsageMetric;
    aiTokens: UsageMetric;
    storageMB: UsageMetric;
    airbyteSyncs: UsageMetric;
  };
}

// ─── Helper ───────────────────────────────────────
function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toLocaleString('id-ID');
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; classes: string }> = {
    ACTIVE: { label: 'Aktif', classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    PAST_DUE: { label: 'Tagihan Tertunggak', classes: 'bg-red-500/20 text-red-400 border-red-500/30' },
    CANCELED: { label: 'Dibatalkan', classes: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    INACTIVE: { label: 'Tidak Aktif', classes: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    TRIAL_EXPIRED: { label: 'Trial Berakhir', classes: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  };
  const badge = map[status] ?? { label: status, classes: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-md border font-semibold flex items-center gap-1.5 ${badge.classes}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {badge.label}
    </span>
  );
}

// ─── Usage Bar Component ───────────────────────────
function UsageBar({ label, metric, icon }: { label: string; metric: UsageMetric; icon: string }) {
  const isWarning = metric.percentage >= 80 && !metric.isUnlimited;
  const isDanger = metric.percentage >= 95 && !metric.isUnlimited;

  const barColor = isDanger
    ? 'bg-red-500'
    : isWarning
      ? 'bg-amber-500'
      : 'bg-blue-500';

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-semibold text-slate-700 text-sm">{label}</span>
          {isWarning && !isDanger && (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
              ⚠ Hampir Penuh
            </span>
          )}
          {isDanger && (
            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold animate-pulse">
              🚨 Kritis
            </span>
          )}
        </div>
        <span className="text-sm font-mono text-slate-500">
          {metric.isUnlimited ? (
            <span className="text-emerald-600 font-bold">∞ Unlimited</span>
          ) : (
            <>
              <span className={`font-bold ${isDanger ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-800'}`}>
                {formatNumber(metric.used)}
              </span>
              {' / '}
              {formatNumber(metric.limit)}
              <span className="text-slate-400 ml-1">({metric.percentage}%)</span>
            </>
          )}
        </span>
      </div>
      {!metric.isUnlimited && (
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ease-out ${barColor}`}
            style={{ width: `${Math.min(metric.percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────
export default function SettingsBilling() {
  const [data, setData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const fetchBillingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/billing/subscription');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Gagal ambil billing data:', e);
      setError('Tidak dapat memuat data billing. Pastikan server backend berjalan.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  // ─── Redirect ke Stripe Checkout ────────────────
  const handleUpgrade = async (planName: 'PRO' | 'ENTERPRISE') => {
    setIsCheckingOut(true);
    try {
      const res = await apiFetch('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal membuat sesi checkout');
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // ─── Buka Stripe Customer Portal ────────────────
  const handleOpenPortal = async () => {
    setIsOpeningPortal(true);
    try {
      const res = await apiFetch('/billing/portal', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal membuka portal');
      }
      const { url } = await res.json();
      if (url) window.open(url, '_blank');
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsOpeningPortal(false);
    }
  };

  // ─── Loading Skeleton ────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-48" />
        <div className="h-36 bg-slate-200 rounded-2xl" />
        <div className="h-48 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  // ─── Error State ─────────────────────────────────
  if (error || !data) {
    return (
      <div className="max-w-4xl flex flex-col items-center justify-center py-16 gap-4">
        <span className="text-4xl">⚠️</span>
        <p className="text-slate-600 font-semibold">{error || 'Data tidak tersedia'}</p>
        <button
          onClick={fetchBillingData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { subscription, usage } = data;
  const isFree = subscription.plan === 'FREE';
  const isEnterprise = subscription.plan === 'ENTERPRISE';
  const isPastDue = subscription.status === 'PAST_DUE';
  const hasExpiringTrial = subscription.daysUntilTrialEnd !== null && subscription.daysUntilTrialEnd <= 7;

  return (
    <div className="max-w-4xl">
      {/* ─── Header ─────────────────────────────────── */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Billing & Quota</h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola paket langganan dan pantau penggunaan sumber daya tim.
          </p>
        </div>
        <button
          onClick={fetchBillingData}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* ─── Alert Banner: Payment Failed ────────────── */}
      {isPastDue && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🚨</span>
            <div>
              <p className="font-bold text-red-700 text-sm">Pembayaran Gagal</p>
              <p className="text-red-600 text-xs">Perbarui metode pembayaran agar layanan tidak terganggu.</p>
            </div>
          </div>
          <button
            onClick={handleOpenPortal}
            disabled={isOpeningPortal}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {isOpeningPortal ? 'Membuka...' : 'Perbaiki Sekarang'}
          </button>
        </div>
      )}

      {/* ─── Alert Banner: Trial Expiring ────────────── */}
      {hasExpiringTrial && !isPastDue && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⏰</span>
            <div>
              <p className="font-bold text-amber-700 text-sm">Trial Hampir Berakhir</p>
              <p className="text-amber-600 text-xs">
                Trial kamu akan berakhir dalam <strong>{subscription.daysUntilTrialEnd} hari</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleUpgrade('PRO')}
            disabled={isCheckingOut}
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {isCheckingOut ? 'Memuat...' : 'Upgrade Sekarang'}
          </button>
        </div>
      )}

      {/* ─── Plan Card + Quick Actions ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Current Plan Card */}
        <div className="md:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl select-none">💳</div>
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">Paket Saat Ini</p>
            <h3 className="text-xl font-black text-white mb-3">{subscription.planDisplayName}</h3>
            <div className="mb-4">{getStatusBadge(subscription.status)}</div>
            {subscription.currentPeriodEnd && (
              <p className="text-slate-400 text-xs">
                Perpanjang: {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}
            {subscription.trialEndsAt && !subscription.isTrialExpired && (
              <p className="text-amber-400 text-xs mt-1">
                ⏰ Trial hingga: {formatDate(subscription.trialEndsAt)}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* Upgrade Plan */}
          {!isEnterprise && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {isFree ? 'Upgrade ke Pro' : 'Upgrade ke Enterprise'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isFree
                    ? '50.000 query, 500K AI token, 100 Airbyte sync / bulan'
                    : 'Unlimited query, AI token, dan storage tanpa batas'}
                </p>
              </div>
              <button
                onClick={() => handleUpgrade(isFree ? 'PRO' : 'ENTERPRISE')}
                disabled={isCheckingOut}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg transition-colors text-sm shadow-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCheckingOut ? (
                  <><span className="animate-spin">⏳</span> Memuat...</>
                ) : (
                  '⚡ Upgrade'
                )}
              </button>
            </div>
          )}

          {/* Manage Subscription (Kartu, Cancel, dsb) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Kelola Langganan</h4>
              <p className="text-xs text-slate-500 mt-1">
                Update kartu kredit, lihat invoice, atau batalkan langganan.
              </p>
            </div>
            <button
              onClick={handleOpenPortal}
              disabled={isOpeningPortal || isFree}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-5 rounded-lg transition-colors text-sm shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              title={isFree ? 'Tidak tersedia untuk Free Plan' : ''}
            >
              {isOpeningPortal ? 'Membuka...' : '⚙️ Kelola'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Usage Metrics ─────────────────────────────── */}
      <h3 className="text-base font-bold text-slate-800 mb-4">
        Penggunaan Bulan Ini
        {subscription.currentPeriodEnd && (
          <span className="text-xs text-slate-400 font-normal ml-2">
            (Reset: {formatDate(subscription.currentPeriodEnd)})
          </span>
        )}
      </h3>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <UsageBar label="Eksekusi Query" metric={usage.queries} icon="🔍" />
        <UsageBar label="Token AI Assistant" metric={usage.aiTokens} icon="🤖" />
        <UsageBar label="Penyimpanan (MB)" metric={usage.storageMB} icon="💾" />
        <UsageBar label="Airbyte Syncs" metric={usage.airbyteSyncs} icon="🔄" />
      </div>

      {/* ─── Plan Comparison ─────────────────────────────── */}
      {isFree && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
          <h4 className="font-bold text-slate-800 mb-4 text-sm">Perbandingan Plan</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 font-semibold">
                  <th className="text-left py-2 pr-4">Fitur</th>
                  <th className="text-center py-2 px-4 text-slate-600">Free</th>
                  <th className="text-center py-2 px-4 text-blue-700 font-bold">Pro ⚡</th>
                  <th className="text-center py-2 px-4 text-purple-700 font-bold">Enterprise 🏢</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Query / bulan', '1.000', '50.000', '∞'],
                  ['AI Token / bulan', '10.000', '500.000', '∞'],
                  ['Storage (MB)', '500', '10.240', '∞'],
                  ['Airbyte Syncs', '5', '100', '∞'],
                  ['Priority Support', '❌', '✅', '✅'],
                  ['Custom Domain', '❌', '❌', '✅'],
                ].map(([feature, free, pro, enterprise]) => (
                  <tr key={feature} className="hover:bg-white/60">
                    <td className="py-2 pr-4 text-slate-600">{feature}</td>
                    <td className="text-center py-2 px-4 text-slate-500">{free}</td>
                    <td className="text-center py-2 px-4 text-blue-700 font-semibold">{pro}</td>
                    <td className="text-center py-2 px-4 text-purple-700 font-semibold">{enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => handleUpgrade('PRO')}
              disabled={isCheckingOut}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {isCheckingOut ? '⏳ Memuat...' : '⚡ Upgrade ke Pro'}
            </button>
            <button
              onClick={() => handleUpgrade('ENTERPRISE')}
              disabled={isCheckingOut}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {isCheckingOut ? '⏳ Memuat...' : '🏢 Coba Enterprise'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
