'use client';

import { useState, useEffect } from 'react';
import PageHeader from '../../components/ui/PageHeader';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
}

export default function TeamPage() {
  // 1. STATE UNTUK DATA & LOADING
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. STATE UNTUK MODAL & FORM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Developer' });

  // Ambil data Mock API
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/team`)
      .then((res) => res.json())
      .then((data) => {
        setMembers(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Gagal narik data:", err);
        setIsLoading(false);
      });
  }, []);

  // 3. FUNGSI HANDLE SUBMIT FORM
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah halaman ke-refresh pas disubmit
    
    // Bikin member baru secara lokal (Nanti di Phase 2 ini diganti jadi fetch POST)
    const newMember: TeamMember = {
      id: Date.now(), // Bikin ID acak sementara
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: 'Pending', // Default status untuk member baru
      avatar: formData.name.substring(0, 2).toUpperCase(), // Ambil 2 huruf pertama
    };

    // Masukin ke daftar member yang ada di layar
    setMembers([newMember, ...members]);
    
    // Tutup modal dan bersihkan form
    setIsModalOpen(false);
    setFormData({ name: '', email: '', role: 'Developer' });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Team Management" 
        description="Kelola akses dan peran anggota di workspace SARAI."
        actionButton={
          // Tombol ini sekarang bisa diklik buat buka Modal!
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>✉️</span> Invite Member
          </button>
        }
      />

      {/* BAGIAN LIST MEMBER */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-700">
            Active Members {isLoading ? '...' : `(${members.length})`}
          </h3>
          <input 
            type="text" 
            placeholder="Search members..." 
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading ? (
            [1, 2, 3].map((skeleton) => (
              <div key={skeleton} className="p-4 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    <div className="h-3 w-48 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
              </div>
            ))
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Belum ada anggota tim.</div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {member.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                    {member.role}
                  </span>
                  <span className={`text-xs font-bold ${member.status === 'Active' ? 'text-green-500' : 'text-amber-500'}`}>
                    {member.status}
                  </span>
                  <button className="text-slate-400 hover:text-slate-600 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    •••
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL POPUP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Invite New Member</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body/Form */}
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="john@rectoverso.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Developer">Developer</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}