'use client';
import { useState } from 'react';

export default function DataSources() {
  // Dummy data sementara sebelum API ready
  const [sources] = useState([
    { id: 1, name: 'Google Ads', status: 'Connected', lastSync: '10 mins ago', color: 'bg-green-100 text-green-700' },
    { id: 2, name: 'Facebook Ads', status: 'Connected', lastSync: '1 hour ago', color: 'bg-green-100 text-green-700' },
    { id: 3, name: 'Google Analytics 4', status: 'Error', lastSync: 'Failed', color: 'bg-red-100 text-red-700' },
    { id: 4, name: 'Salesforce CRM', status: 'Not Connected', lastSync: '-', color: 'bg-slate-100 text-slate-500' },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-slate-800">Data Sources</h1>
          <p className="text-slate-500 font-inter">Kelola koneksi sumber data (Airbyte) untuk SARAI.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          + Add New Source
        </button>
      </div>

      {/* Grid Koneksi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sources.map((source) => (
          <div key={source.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-slate-700">{source.name}</h3>
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${source.color}`}>
                {source.status}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Last Sync: <span className="font-medium text-slate-600">{source.lastSync}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}