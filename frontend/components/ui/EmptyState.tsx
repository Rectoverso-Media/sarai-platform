"use client";
import React from 'react';

interface EmptyStateProps {
  /** Emoji atau icon element (string emoji atau JSX) */
  icon?: React.ReactNode;
  /** Judul utama */
  title: string;
  /** Deskripsi tambahan */
  description?: string;
  /** Tombol CTA opsional */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  /** Ukuran padding wrapper */
  size?: 'sm' | 'md' | 'lg';
  /** Kelas tambahan untuk wrapper */
  className?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'py-10',
  md: 'py-16',
  lg: 'py-24',
};

const ICON_SIZE_CLASSES: Record<string, string> = {
  sm: 'text-3xl mb-3',
  md: 'text-5xl mb-4',
  lg: 'text-6xl mb-5',
};

/**
 * EmptyState — komponen standar untuk tampilan "tidak ada data".
 *
 * Usage:
 * ```tsx
 * // Sederhana
 * <EmptyState icon="🗂️" title="Belum ada query" />
 *
 * // Lengkap dengan action button
 * <EmptyState
 *   icon="📭"
 *   title="Belum ada anggota tim"
 *   description="Undang rekan kerjamu untuk berkolaborasi di SARAI."
 *   action={{ label: '+ Invite Member', onClick: handleInvite }}
 * />
 *
 * // Sebagai EmptyState di DataTable
 * <DataTable
 *   emptyState={<EmptyState icon="🔍" title="Tidak ada hasil" size="sm" />}
 *   ...
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 ${SIZE_CLASSES[size]} ${className}`}
    >
      {icon && (
        <div className={ICON_SIZE_CLASSES[size]}>
          {typeof icon === 'string' ? (
            <span role="img" aria-hidden="true">{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}

      <h3 className="font-bold text-slate-700 text-base leading-tight">{title}</h3>

      {description && (
        <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">{description}</p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className={`mt-6 px-5 py-2.5 font-bold rounded-xl text-sm transition-all ${
            action.variant === 'secondary'
              ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── Variants ──────────────────────────────────────────────────────────────────

/**
 * EmptyState khusus untuk kondisi error/network failed.
 */
export function ErrorState({
  title = 'Gagal memuat data',
  description = 'Pastikan server backend berjalan dan coba refresh halaman.',
  onRetry,
  className = '',
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon="⚠️"
      title={title}
      description={description}
      action={onRetry ? { label: '🔄 Coba Lagi', onClick: onRetry, variant: 'secondary' } : undefined}
      className={className}
    />
  );
}

/**
 * EmptyState untuk halaman/fitur yang sedang dalam pembangunan.
 */
export function UnderConstructionState({
  featureName,
  className = '',
}: {
  featureName?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 ${className}`}
    >
      <EmptyState
        icon="🚧"
        title="Modul Sedang Dibangun"
        description={featureName
          ? `Konfigurasi untuk ${featureName} akan segera tersedia.`
          : 'Fitur ini sedang dalam pengembangan.'}
        size="md"
      />
    </div>
  );
}
