import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import Link from "next/link"; 
import "./globals.css";

// Bold & Modern
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
});

// Body text
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SARAI Platform",
  description: "Platform for SARAI infrastructure and data visualization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <body className={`${poppins.variable} ${inter.variable} h-full antialiased font-inter`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-[#0F172A] text-slate-300 p-6 hidden md:flex flex-col border-r border-slate-800">
            <div className="flex items-center gap-3 mb-10 px-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">S</div>
              <h2 className="font-poppins font-bold text-xl tracking-tight text-white">SARAI <span className="text-blue-500 text-xs font-medium">v1.0</span></h2>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-4 px-2">Main Menu</p>
              
              {[
                { name: 'Dashboard', icon: '📊', href: '/', active: true },
                { name: 'Data Sources', icon: '🔌', href: '/data-sources', active: false }, 
                { name: 'Infrastructure', icon: '🌐', href: '/infrastructure', active: false },
                { name: 'Database', icon: '💾', href: '/team', active: false },
                { name: 'Security', icon: '🛡️', href: '#', active: false },
                { name: 'Settings', icon: '⚙️', href: '#', active: false },
              ].map((item) => (
                <Link 
                  key={item.name}
                  href={item.href} 
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group ${
                    item.active 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  {item.active && <div className="w-1.5 h-1.5 rounded-full bg-blue-200 shadow-[0_0_8px_rgba(191,219,254,0.8)]"></div>}
                </Link>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-800 px-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs border border-slate-600 uppercase font-bold text-white">R</div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate">Rif Arbawi</p>
                  <p className="text-xs text-slate-500 truncate">Frontend Dev</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Area */}
          <div className="flex-1 flex flex-col">
            {/* Navbar Atas */}
            <header className="h-16 border-b bg-white flex items-center px-8 justify-between sticky top-0 z-10 shadow-sm">
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    🔍
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search infrastructure, logs, or nodes..." 
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Right Side Icons */}
              <div className="flex items-center gap-5">
                {/* Notification Bell */}
                <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all">
                  <span className="text-xl">🔔</span>
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1"></div>

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight">Rif Arbawi</p>
                    <p className="text-[10px] text-blue-600 font-medium">Administrator</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-0.5 shadow-md">
                    <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center font-bold text-blue-600 text-sm">
                      RA
                    </div>
                  </div>
                </div>
              </div>
            </header>
            
            {/* Isi Halaman */}
            <main className="p-8 bg-slate-50 flex-1">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}