"use client";
import React, { useState, useEffect } from 'react';

// Data bawaan server-server SARAI
const initialNodes = [
  { id: 'ND-101', name: 'Core Engine Alpha', type: 'GPU Node', cpu: 45, ram: 60, status: 'Online', uptime: '14d 2h' },
  { id: 'ND-102', name: 'Core Engine Beta', type: 'GPU Node', cpu: 82, ram: 90, status: 'Warning', uptime: '14d 1h' },
  { id: 'ND-103', name: 'Data Pipeline 01', type: 'CPU Node', cpu: 20, ram: 45, status: 'Online', uptime: '30d 5h' },
  { id: 'ND-104', name: 'Analytics Worker', type: 'CPU Node', cpu: 0, ram: 0, status: 'Offline', uptime: 'Offline' },
  { id: 'ND-105', name: 'Model Training', type: 'GPU Node', cpu: 95, ram: 98, status: 'Critical', uptime: '2d 12h' },
  { id: 'ND-106', name: 'Cache Server', type: 'Memory Node', cpu: 10, ram: 85, status: 'Online', uptime: '60d 0h' },
];

export default function InfrastructurePage() {
  const [nodes, setNodes] = useState(initialNodes);

  // Efek Real-time (Biar CPU & RAM-nya gerak-gerak tiap 2 detik)
  useEffect(() => {
    const timer = setInterval(() => {
      setNodes(prevNodes => 
        prevNodes.map(node => {
          // Kalau offline, ya angkanya tetep 0
          if (node.status === 'Offline') return node;

          // Bikin angka acak naik/turun dikit (maksimal geser 5%)
          const cpuFlicker = Math.floor(Math.random() * 11) - 5; 
          const ramFlicker = Math.floor(Math.random() * 7) - 3;
          
          let newCpu = node.cpu + cpuFlicker;
          let newRam = node.ram + ramFlicker;

          // Batasin biar angkanya tetep masuk akal (0 - 100)
          if (newCpu > 100) newCpu = 100; if (newCpu < 5) newCpu = 5;
          if (newRam > 100) newRam = 100; if (newRam < 10) newRam = 10;

          // Ganti status otomatis kalau kepanasan
          let newStatus = node.status;
          if (newCpu > 90 || newRam > 90) newStatus = 'Critical';
          else if (newCpu > 75 || newRam > 75) newStatus = 'Warning';
          else newStatus = 'Online';

          return { ...node, cpu: newCpu, ram: newRam, status: newStatus };
        })
      );
    }, 2000); // Update tiap 2 detik

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-8 h-full flex flex-col space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-slate-800">Infrastructure</h1>
          <p className="text-slate-500 font-inter mt-1">
            Pantau status server, penggunaan resource, dan cluster AI secara real-time.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl font-bold transition-all text-sm shadow-sm">
            ⚙️ Cluster Settings
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all text-sm">
            + Deploy Node
          </button>
        </div>
      </div>

      {/* Grid Server Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nodes.map((node) => (
          <div key={node.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all group">
            
            {/* Card Header (Nama & Status) */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{node.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{node.id} • {node.type}</p>
              </div>
              
              {/* Badge Status */}
              <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5
                ${node.status === 'Online' ? 'bg-green-100 text-green-700' : ''}
                ${node.status === 'Warning' ? 'bg-amber-100 text-amber-700' : ''}
                ${node.status === 'Critical' ? 'bg-red-100 text-red-700' : ''}
                ${node.status === 'Offline' ? 'bg-slate-100 text-slate-500' : ''}
              `}>
                <div className={`w-2 h-2 rounded-full 
                  ${node.status === 'Online' ? 'bg-green-500 animate-pulse' : ''}
                  ${node.status === 'Warning' ? 'bg-amber-500' : ''}
                  ${node.status === 'Critical' ? 'bg-red-500 animate-ping' : ''}
                  ${node.status === 'Offline' ? 'bg-slate-400' : ''}
                `}></div>
                {node.status}
              </div>
            </div>

            {/* Resource Bars */}
            <div className="space-y-4">
              {/* CPU */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-500 uppercase tracking-wider">CPU</span>
                  <span className={`${node.cpu > 80 ? 'text-red-500' : 'text-slate-700'}`}>{node.cpu}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ease-out 
                      ${node.cpu > 85 ? 'bg-red-500' : node.cpu > 70 ? 'bg-amber-500' : 'bg-blue-500'}
                    `} 
                    style={{ width: `${node.cpu}%` }}
                  ></div>
                </div>
              </div>

              {/* RAM */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-500 uppercase tracking-wider">Memory</span>
                  <span className={`${node.ram > 80 ? 'text-red-500' : 'text-slate-700'}`}>{node.ram}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ease-out 
                      ${node.ram > 85 ? 'bg-red-500' : node.ram > 70 ? 'bg-amber-500' : 'bg-purple-500'}
                    `} 
                    style={{ width: `${node.ram}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Footer Card (Uptime & Action) */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
              <div className="text-xs font-medium text-slate-500">
                Uptime: <span className="text-slate-700">{node.uptime}</span>
              </div>
              <button className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">
                Restart
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}