'use client';
import { useState } from 'react';
import StatusBadge from '../../components/ui/StatusBadge';

export default function InfrastructurePage() {
  // Dummy data sementara pengganti database Backend
  const [nodes] = useState([
    { id: 'ND-JKT-01', ip: '192.168.1.10', region: 'Jakarta (ID)', cpu: 45, ram: 60, status: 'ONLINE', uptime: '99.9%' },
    { id: 'ND-SGP-02', ip: '10.0.0.24', region: 'Singapore (SG)', cpu: 88, ram: 92, status: 'WARNING', uptime: '98.5%' },
    { id: 'ND-TYO-01', ip: '172.16.0.5', region: 'Tokyo (JP)', cpu: 12, ram: 30, status: 'ONLINE', uptime: '99.9%' },
    { id: 'ND-SGP-03', ip: '10.0.0.25', region: 'Singapore (SG)', cpu: 0, ram: 0, status: 'OFFLINE', uptime: '85.2%' },
    { id: 'ND-SYD-01', ip: '10.1.5.11', region: 'Sydney (AU)', cpu: 34, ram: 45, status: 'ONLINE', uptime: '99.8%' },
  ]);

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-slate-800">Infrastructure Nodes</h1>
          <p className="text-slate-500 font-inter">Pantau status server dan alokasi resource SARAI.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">
            <span>🔄</span> Refresh
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            + Provision Node
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Filter/Search (Dummy) */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-4">
          <input 
            type="text" 
            placeholder="Search by Node ID or IP..." 
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <select className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option>All Regions</option>
            <option>Jakarta</option>
            <option>Singapore</option>
          </select>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white text-slate-500 uppercase text-[10px] tracking-widest font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Node ID</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Region</th>
                <th className="px-6 py-4">CPU / RAM</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Uptime</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600 divide-y divide-slate-100 font-inter">
              {nodes.map((node, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-800">{node.id}</td>
                  <td className="px-6 py-4 font-mono text-slate-500 text-xs">{node.ip}</td>
                  <td className="px-6 py-4">{node.region}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 text-xs">
                      <span className={`${node.cpu > 80 ? 'text-red-500' : 'text-slate-500'}`}>C: {node.cpu}%</span>
                      <span className="text-slate-300">|</span>
                      <span className={`${node.ram > 80 ? 'text-red-500' : 'text-slate-500'}`}>R: {node.ram}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={node.status as any} />
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{node.uptime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}