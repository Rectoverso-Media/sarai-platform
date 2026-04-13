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
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true); // State untuk loading

  // Ngefetch data dari API bohongan kita pas halaman pertama kali dibuka
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/team`)
      .then((res) => res.json())
      .then((data) => {
        setMembers(data);
        setIsLoading(false); // Matikan loading setelah data dapet
      })
      .catch((err) => {
        console.error("Gagal narik data:", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader 
        title="Team Management" 
        description="Kelola akses dan peran anggota di workspace SARAI."
        actionButton={
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            <span>✉️</span> Invite Member
          </button>
        }
      />

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
          {/* LOGIKA LOADING: Kalau true tampilkan Skeleton, kalau false tampilkan Data */}
          {isLoading ? (
            // SKELETON LOADER 
            [1, 2, 3].map((skeleton) => (
              <div key={skeleton} className="p-4 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    <div className="h-3 w-48 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                  <div className="h-4 w-12 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))
          ) : (
            // DATA ASLI 
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
    </div>
  );
}