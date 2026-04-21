"use client";
import React, { useState } from 'react';

// Mock data tim SARAI
const initialTeam = [
  { id: 1, name: 'Arif Bagus Wibowo', email: 'mas.arifbagus2407@gmail.com', role: 'Owner', status: 'Active', avatar: 'AB' },
  { id: 2, name: 'Yosia', email: 'yosia@rectoverso.media', role: 'Admin', status: 'Active', avatar: 'Y' },
  { id: 3, name: 'Budi Santoso', email: 'budi.s@sarai.ai', role: 'Developer', status: 'Away', avatar: 'BS' },
  { id: 4, name: 'Siti Aminah', email: 'siti.a@sarai.ai', role: 'Viewer', status: 'Active', avatar: 'SA' },
  { id: 5, name: 'Rangga Pratama', email: 'rangga@dev.io', role: 'Developer', status: 'Offline', avatar: 'RP' },
];

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeam = initialTeam.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col space-y-8">
      
      {/* Header & Invite Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-slate-800">Team Management</h1>
          <p className="text-slate-500 font-inter mt-1">
            Atur hak akses tim dan kelola kolaborator di dalam organisasi SARAI.
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all text-sm flex items-center gap-2">
          <span>+</span> Invite Member
        </button>
      </div>

      {/* Team Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Members</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{initialTeam.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Admins</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">2</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Developers</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">2</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Now</p>
          <p className="text-2xl font-bold text-green-600 mt-1">3</p>
        </div>
      </div>

      {/* User Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div className="relative w-full max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Cari anggota tim..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600 divide-y divide-slate-100 font-inter">
              {filteredTeam.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-blue-600">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border 
                      ${member.role === 'Owner' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        member.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                        member.role === 'Developer' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                        'bg-slate-50 text-slate-600 border-slate-200'}
                    `}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full 
                        ${member.status === 'Active' ? 'bg-green-500' : 
                          member.status === 'Away' ? 'bg-amber-500' : 'bg-slate-300'}
                      `}></div>
                      <span className="text-xs font-medium">{member.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-red-600 text-xs font-bold transition-colors opacity-0 group-hover:opacity-100">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}