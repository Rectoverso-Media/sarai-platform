export default function SecurityPage() {
  return (
    <div className="p-8 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-poppins font-bold text-slate-800">Security & Logs</h1>
        <p className="text-slate-500 font-inter mt-1">
          Pantau aktivitas mencurigakan, akses tidak sah, dan log sistem SARAI di sini.
        </p>
      </div>

      <div className="mt-8 flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
        <div className="text-center">
          <span className="text-4xl">🛡️</span>
          <h3 className="mt-4 text-lg font-semibold text-slate-700">Modul Sedang Dibangun</h3>
          <p className="text-sm text-slate-500 mt-1">Sistem pemantauan log akan segera tersedia.</p>
        </div>
      </div>
    </div>
  );
}