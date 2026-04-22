"use client";
import React, { useState, useEffect } from 'react';

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data dari API
  const fetchMembers = async () => {
    try {
      const response = await fetch('http://localhost:3001/team');
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Gagal ambil data tim:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  // Fungsi Tambah Member (Simpel via Prompt)
  const handleAddMember = async () => {
    const name = prompt("Nama Anggota:");
    const email = prompt("Email:");
    const role = prompt("Role (Owner/Admin/Developer/Viewer):", "Viewer");
    
    if (name && email && role) {
      try {
        await fetch('http://localhost:3001/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, role }),
        });
        fetchMembers();
      } catch (e) { console.error(e); }
    }
  };

  return (
    <div className="p-8 h-full flex flex-col space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-slate-800">Team Management</h1>
          <p className="text-slate-500 mt-1">Kelola akses dan peran kolaborator dalam project SARAI.</p>
        </div>
        <button 
          onClick={handleAddMember}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
        >
          + Invite Member
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-widest font-bold">
            <tr>
              <th className="px-6 py-4">Member</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={4} className="p-10 text-center text-slate-400">Loading members...</td></tr>
            ) : members.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md w-max border border-green-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-blue-600 text-xs font-bold">Edit Role</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}