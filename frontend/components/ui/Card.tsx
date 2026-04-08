import React from 'react';

type CardProps = {
  title?: string;
  value?: string | number;
  children?: React.ReactNode; // Kalau mau masukin isi custom (kayak grafik)
  className?: string; // Kalau mau nambahin class tambahan khusus
};

export default function Card({ title, value, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 ${className}`}>
      {/* Kalau ada title dan value (Buat tipe kartu angka / Stats Card) */}
      {title && value !== undefined && (
        <>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">{value}</h3>
        </>
      )}

      {/* Kalau isinya custom (Buat tabel, grafik, dll) */}
      {children}
    </div>
  );
}