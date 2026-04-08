import React from 'react';

type PageHeaderProps = {
  title: string;
  description: string;
  actionButton?: React.ReactNode; // Tombol opsional (bisa ada, bisa nggak)
};

export default function PageHeader({ title, description, actionButton }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-poppins font-bold text-slate-800">{title}</h1>
        <p className="text-slate-500 font-inter">{description}</p>
      </div>
      
      {/* Kalau ada actionButton yg dikirin, baru kita tampilin kotak ini */}
      {actionButton && (
        <div className="flex gap-3">
          {actionButton}
        </div>
      )}
    </div>
  );
}