import React from 'react';

type BadgeProps = {
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'SUCCESS' | 'ERROR';
  label?: string; // Teks opsional kalau mau beda dari statusnya
};

export default function StatusBadge({ status, label }: BadgeProps) {
  // Logika warna berdasarkan status
  const getBadgeStyle = () => {
    switch (status) {
      case 'ONLINE':
      case 'SUCCESS':
        return 'bg-green-100 text-green-700';
      case 'WARNING':
        return 'bg-amber-100 text-amber-700';
      case 'OFFLINE':
      case 'ERROR':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-500';
    }
  };

  const getDotStyle = () => {
    switch (status) {
      case 'ONLINE':
      case 'SUCCESS':
        return 'bg-green-500';
      case 'WARNING':
        return 'bg-amber-500';
      case 'OFFLINE':
      case 'ERROR':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide flex items-center w-max gap-1.5 ${getBadgeStyle()}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${getDotStyle()}`}></div>
      {label || status}
    </span>
  );
}