"use client";
import React, { useState, useEffect } from 'react';

export default function InfrastructurePage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi Ambil Data dari Backend
  const fetchNodes = async () => {
    try {
      const response = await fetch('http://localhost:3001/infrastructure');
      if (response.ok) {
        const data = await response.json();
        
        // Kita tambahkan state CPU dan RAM bohongan ke data asli untuk efek visual
        const nodesWithMetrics = data.map((node: any) => ({
          ...node,
          cpu: Math.floor(Math.random() * 40) + 10,
          ram: Math.floor(Math.random() * 50) + 20,
        }));
        setNodes(nodesWithMetrics);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Panggil fetchNodes saat halaman pertama kali dibuka
  useEffect(() => {
    fetchNodes();
  }, []);

  // Efek Real-time (Biar CPU & RAM-nya gerak-gerak tiap 2 detik)
  useEffect(() => {
    if (nodes.length === 0) return;

    const timer = setInterval(() => {
      setNodes(prevNodes => 
        prevNodes.map(node => {
          if (node.status === 'Offline') return node;

          const cpuFlicker = Math.floor(Math.random() * 11) - 5; 
          const ramFlicker = Math.floor(Math.random() * 7) - 3;
          
          let newCpu = Math.max(5, Math.min(100, node.cpu + cpuFlicker));
          let newRam = Math.max(10, Math.min(100, node.ram + ramFlicker));

          let newStatus = node.status;
          if (newCpu > 90 || newRam > 90) newStatus = 'Critical';
          else if (newCpu > 75 || newRam > 75) newStatus = 'Warning';
          else newStatus = 'Online';

          return { ...node, cpu: newCpu, ram: newRam, status: newStatus };
        })
      );
    }, 2000);

    return () => clearInterval(timer);
  }, [nodes.length]); // Re-run effect kalau jumlah node berubah

  // Fungsi Bikin Node Baru (Deploy)
  const handleDeploy = async () => {
    const name = prompt("Masukkan nama server AI baru:", "AI Worker " + Math.floor(Math.random() * 100));
    if (!name) return;

    // Pilih tipe random biar seru
    const types = ['GPU Node', 'CPU Node', 'Memory Node'];
    const randomType = types[Math.floor(Math.random() * types.length)];

    try {
      const response = await fetch('http://localhost:3001/infrastructure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type: randomType }),
      });

      if (response.ok) {
        fetchNodes(); // Refresh data setelah berhasil bikin
      }
    } catch (error) {
      console.error("Gagal deploy:", error);
    }
  };

  // Fungsi Hapus Node
  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin mematikan dan menghapus server ini secara permanen?")) {
      try {
        const response = await fetch(`http://localhost:3001/infrastructure/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setNodes(prev => prev.filter(n => n.id !== id));
        }
      } catch (error) {
        console.error("Gagal menghapus:", error);
      }
    }
  };

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
          {/* Tombol Deploy sekarang aktif */}
          <button 
            onClick={handleDeploy}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all text-sm"
          >
            + Deploy Node
          </button>
        </div>
      </div>

      {/* Tampilan Loading */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 font-bold">
          ⏳ Memindai infrastruktur server...
        </div>
      ) : nodes.length === 0 ? (
        /* Tampilan Kosong */
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 text-slate-500 p-8 text-center">
          <span className="text-4xl mb-4">🏗️</span>
          <h3 className="font-bold text-slate-700 text-lg">Belum Ada Node yang Berjalan</h3>
          <p className="text-sm mt-1">Klik "Deploy Node" di kanan atas untuk menyalakan server AI pertamamu.</p>
        </div>
      ) : (
        /* Grid Server Nodes */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes.map((node) => (
            <div key={node.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all group">
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{node.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{node.id.substring(0,8)} • {node.type}</p>
                </div>
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

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-500 uppercase tracking-wider">CPU</span>
                    <span className={`${node.cpu > 80 ? 'text-red-500' : 'text-slate-700'}`}>{node.cpu}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ease-out ${node.cpu > 85 ? 'bg-red-500' : node.cpu > 70 ? 'bg-amber-500' : 'bg-blue-500'}`} 
                      style={{ width: `${node.cpu}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-500 uppercase tracking-wider">Memory</span>
                    <span className={`${node.ram > 80 ? 'text-red-500' : 'text-slate-700'}`}>{node.ram}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ease-out ${node.ram > 85 ? 'bg-red-500' : node.ram > 70 ? 'bg-amber-500' : 'bg-purple-500'}`} 
                      style={{ width: `${node.ram}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="text-xs font-medium text-slate-500">
                  Uptime: <span className="text-slate-700">{node.uptime}</span>
                </div>
                {/* Tombol Delete */}
                <button 
                  onClick={() => handleDelete(node.id)}
                  className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  Terminate
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}