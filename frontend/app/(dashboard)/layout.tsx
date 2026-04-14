import Sidebar from './components/Sidebar'; // Sesuaikan path ini kalau error

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar /> 

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
        
        {/* Isi Halaman Dashboard */}
        <main className="p-8 bg-slate-50 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}