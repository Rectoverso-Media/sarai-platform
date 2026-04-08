'use client';
import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';

export default function TeamPage() {
  // Dummy data anggota tim
  const [members] = useState([
    { id: 1, name: 'Arif Bagus', email: 'arif@rectoverso.com', role: 'Administrator', status: 'Active', avatar: 'AB' },
    { id: 2, name: 'Yusuf Backend', email: 'yusuf@rectoverso.com', role: 'Developer', status: 'Active', avatar: 'YB' },
    { id: 3, name: 'Kak Hassan', email: 'hassan@rectoverso.com', role: 'Project Manager', status: 'Active', avatar: 'KH' },
    { id: 4, name: 'Sarah Marketing', email: 'sarah@client.com', role: 'Viewer', status: 'Pending', avatar: 'SM' },
  ]);

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

      {/* Team List Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-700">Active Members ({members.length})</h3>
          <input 
            type="text" 
            placeholder="Search members..." 
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {member.avatar}
                </div>
                {/* Info */}
                <div>
                  <p className="font-semibold text-slate-800">{member.name}</p>
                  <p className="text-sm text-slate-500">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Role Badge */}
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                  {member.role}
                </span>
                
                {/* Status */}
                <span className={`text-xs font-bold ${member.status === 'Active' ? 'text-green-500' : 'text-amber-500'}`}>
                  {member.status}
                </span>

                {/* Action Menu (Dummy) */}
                <button className="text-slate-400 hover:text-slate-600 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  •••
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}