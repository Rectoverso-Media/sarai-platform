"use client";
import React, { useEffect, useCallback, useId } from 'react';

interface ModalProps {
  /** Controlled: apakah modal ditampilkan */
  isOpen: boolean;
  /** Callback saat modal harus ditutup (klik backdrop / tombol X / Esc) */
  onClose: () => void;
  /** Judul modal di header */
  title: string;
  /** Deskripsi singkat di bawah title (opsional) */
  description?: string;
  /** Warna accent untuk header gradient */
  accentColor?: 'blue' | 'purple' | 'emerald' | 'red' | 'amber' | 'slate';
  /** Max width modal */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Footer actions (biasanya Cancel + Submit buttons) */
  footer?: React.ReactNode;
  /** Content utama */
  children: React.ReactNode;
  /** Jika true, klik backdrop tidak menutup modal */
  disableBackdropClose?: boolean;
}

const ACCENT_CLASSES: Record<string, string> = {
  blue: 'from-blue-50 to-indigo-50',
  purple: 'from-purple-50 to-indigo-50',
  emerald: 'from-emerald-50 to-teal-50',
  red: 'from-red-50 to-rose-50',
  amber: 'from-amber-50 to-yellow-50',
  slate: 'from-slate-50 to-slate-100',
};

const SIZE_CLASSES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

/**
 * Modal — komponen dialog reusable.
 * 
 * Usage:
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Create New Query"
 *   accentColor="blue"
 *   footer={
 *     <>
 *       <button onClick={() => setIsOpen(false)}>Cancel</button>
 *       <button onClick={handleSubmit}>Submit</button>
 *     </>
 *   }
 * >
 *   <div>Form content here</div>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  accentColor = 'blue',
  size = 'md',
  footer,
  children,
  disableBackdropClose = false,
}: ModalProps) {
  const titleId = useId();

  // Tutup dengan Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll saat modal buka
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const accentGradient = ACCENT_CLASSES[accentColor] ?? ACCENT_CLASSES.blue;
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={disableBackdropClose ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-100 w-full ${sizeClass} overflow-hidden flex flex-col`}
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b border-slate-100 bg-gradient-to-r ${accentGradient} flex items-start justify-between gap-4`}>
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-800 leading-tight">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Tombol Cancel dan Submit standar untuk footer Modal.
 * Bisa dipakai langsung sebagai value prop `footer`.
 */
export function ModalFooter({
  onCancel,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  isLoading = false,
  confirmVariant = 'blue',
  disabled = false,
}: {
  onCancel: () => void;
  onConfirm?: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  confirmVariant?: 'blue' | 'red' | 'purple' | 'emerald';
  disabled?: boolean;
}) {
  const variantClasses: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20',
    red: 'bg-red-600 hover:bg-red-700 shadow-red-600/20',
    purple: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
  };

  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
      >
        {cancelLabel}
      </button>
      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading || disabled}
          className={`flex-1 py-2.5 font-bold text-white rounded-xl shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${variantClasses[confirmVariant] ?? variantClasses.blue}`}
        >
          {isLoading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {isLoading ? 'Loading...' : confirmLabel}
        </button>
      )}
    </>
  );
}
