"use client";
import React from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Column<T> {
  /** Key dari object data, atau 'actions' untuk kolom action */
  key: keyof T | 'actions';
  /** Label header kolom */
  header: string;
  /** Custom render cell (opsional). Jika tidak diisi, nilai field ditampilkan langsung */
  render?: (row: T) => React.ReactNode;
  /** Lebar kolom (CSS value, e.g. '200px', '20%') */
  width?: string;
  /** Alignment cell */
  align?: 'left' | 'center' | 'right';
  /** Jika true, kolom ini tidak ditampilkan di mobile */
  hideOnMobile?: boolean;
}

interface DataTableProps<T extends { id: string }> {
  /** Array data yang ditampilkan */
  data: T[];
  /** Definisi kolom */
  columns: Column<T>[];
  /** Key yang unik per row — default 'id' */
  rowKey?: keyof T;
  /** Apakah sedang loading? Menampilkan skeleton rows */
  isLoading?: boolean;
  /** Jumlah skeleton rows saat loading */
  skeletonRows?: number;
  /** Komponen EmptyState — ditampilkan saat data kosong */
  emptyState?: React.ReactNode;
  /** Callback saat row diklik */
  onRowClick?: (row: T) => void;
  /** Tambahkan kelas CSS ke `<table>` */
  className?: string;
  /** Teks caption/judul tabel (aksesibilitas) */
  caption?: string;
}

// ─── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div
            className={`h-4 bg-slate-100 animate-pulse rounded ${i === 0 ? 'w-3/4' : i === cols - 1 ? 'w-1/3' : 'w-1/2'}`}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

/**
 * DataTable — tabel data generik, type-safe, reusable.
 *
 * Usage:
 * ```tsx
 * const columns: Column<Query>[] = [
 *   { key: 'name', header: 'Name', render: (row) => <b>{row.name}</b> },
 *   { key: 'status', header: 'Status' },
 *   { key: 'actions', header: '', render: (row) => <DeleteButton id={row.id} />, align: 'right' },
 * ];
 *
 * <DataTable
 *   data={queries}
 *   columns={columns}
 *   isLoading={isLoading}
 *   emptyState={<EmptyState icon="🗂️" title="No queries yet" />}
 * />
 * ```
 */
export function DataTable<T extends { id: string }>({
  data,
  columns,
  rowKey = 'id' as keyof T,
  isLoading = false,
  skeletonRows = 4,
  emptyState,
  onRowClick,
  className = '',
  caption,
}: DataTableProps<T>) {
  const alignClass: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {caption && <caption className="sr-only">{caption}</caption>}

          {/* ── Header ─────────────────────────────────────────────────── */}
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest font-bold border-b border-slate-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-6 py-4 ${alignClass[col.align ?? 'left']} ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ───────────────────────────────────────────────────── */}
          <tbody className="text-sm text-slate-600 divide-y divide-slate-100">
            {isLoading ? (
              // Skeleton rows
              Array.from({ length: skeletonRows }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={columns.length}>
                  {emptyState ?? (
                    <div className="px-6 py-16 text-center">
                      <p className="text-slate-400 text-sm font-medium">Tidak ada data.</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((row) => (
                <tr
                  key={String(row[rowKey])}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`hover:bg-slate-50/80 transition-colors group ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-6 py-4 ${alignClass[col.align ?? 'left']} ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
                    >
                      {col.render
                        ? col.render(row)
                        : col.key !== 'actions'
                          ? String(row[col.key as keyof T] ?? '—')
                          : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Status Badge (common sub-component) ──────────────────────────────────────
type StatusVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'pending';

const STATUS_STYLES: Record<StatusVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
};

/**
 * StatusBadge — pill badge untuk status (Success, Failed, Pending, dll).
 *
 * Usage:
 * ```tsx
 * <StatusBadge variant="success" label="Active" dot />
 * <StatusBadge variant="error" label="Failed" />
 * ```
 */
export function StatusBadge({
  variant,
  label,
  dot = false,
  pulse = false,
  className = '',
}: {
  variant: StatusVariant;
  label: string;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full bg-current ${pulse ? 'animate-pulse' : ''}`}
        />
      )}
      {label}
    </span>
  );
}
