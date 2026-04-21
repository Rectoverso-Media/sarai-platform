"use client"; 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '../../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Home() {
  const router = useRouter();

  const [userFirstName, setUserFirstName] = useState<string>('...');

  // State untuk grafik & stats
  const [chartData] = useState([
    { name: 'Sen', value: 400 }, { name: 'Sel', value: 300 }, { name: 'Rab', value: 500 },
    { name: 'Kam', value: 280 }, { name: 'Jum', value: 590 }, { name: 'Sab', value: 320 }, { name: 'Min', value: 480 },
  ]);
  const [stats, setStats] = useState({ cpu: 24, ram: 32 });

  useEffect(() => {
    const savedData = localStorage.getItem('userData');
    if (savedData) {
      const user = JSON.parse(savedData);
      setUserFirstName(user.name.split(' ')[0]); // Cuma ngambil nama depan buat sapaan
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setStats({
        cpu: Math.floor(Math.random() * (35 - 20 + 1)) + 20,
        ram: Math.floor(Math.random() * (40 - 30 + 1)) + 30
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-8 space-y-8 h-full">
      {/* Header Info */}
      <div>
        <h1 className="text-3xl font-poppins font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-500 font-inter mt-1">
          Selamat datang kembali, <span className="font-semibold text-blue-600">{userFirstName}</span>. Berikut ringkasan data hari ini.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Infrastructure" value="1,284" />
        <Card title="Active Nodes" value="98.2%" />
        <Card title="Alerts" value="12" />
      </div>

      {/* Infrastructure Health Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider">CPU Usage</span>
            <span className="text-slate-700 font-bold">{stats.cpu}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full transition-all duration-1000 ease-out" style={{ width: `${stats.cpu}%` }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Memory</span>
            <span className="text-slate-700 font-bold">{(16 * stats.ram / 100).toFixed(1)}GB / 16GB</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full transition-all duration-1000 ease-out" style={{ width: `${stats.ram}%` }}></div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mt-8">
        <h4 className="text-lg font-semibold mb-6 text-slate-700">Traffic Analysis (Weekly)</h4>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h4 className="text-lg font-semibold text-slate-800 font-poppins">Recent Activities</h4>
            <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest font-bold">
                <tr>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4">Source ID</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-600 divide-y divide-slate-100 font-inter">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">Database Backup</td>
                  <td className="px-6 py-4">DB-SR-01</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-[10px] font-bold">SUCCESS</span></td>
                  <td className="px-6 py-4 text-slate-400">2 mins ago</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">Unauthorized Access</td>
                  <td className="px-6 py-4">NODE-X4</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-[10px] font-bold">WARNING</span></td>
                  <td className="px-6 py-4 text-slate-400">15 mins ago</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">New User Registered</td>
                  <td className="px-6 py-4">USR-992</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold">INFO</span></td>
                  <td className="px-6 py-4 text-slate-400">1 hour ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}