"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: '📊', href: '/dashboard' },
    { name: 'Data Sources', icon: '🔌', href: '/data-sources' }, 
    { name: 'Infrastructure', icon: '🌐', href: '/infrastructure' },
    { name: 'Team', icon: '👥', href: '/team' },
    { name: 'Security', icon: '🛡️', href: '#' },
    { name: 'Settings', icon: '⚙️', href: '#' },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] text-slate-300 p-6 hidden md:flex flex-col border-r border-slate-800">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">S</div>
        <h2 className="font-poppins font-bold text-xl tracking-tight text-white">SARAI <span className="text-blue-500 text-xs font-medium">v1.0</span></h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-4 px-2">Main Menu</p>
        
        {menuItems.map((item) => {
          // INI DIA LOGIKA GPS-NYA!
          const isActive = pathname === item.href;

          return (
            <Link 
              key={item.name}
              href={item.href} 
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-200 shadow-[0_0_8px_rgba(191,219,254,0.8)]"></div>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800 px-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs border border-slate-600 uppercase font-bold text-white">R</div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">User Admin</p>
            <p className="text-xs text-slate-500 truncate">Web Developer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}