import Sidebar from './components/Sidebar';
import Header from './components/Header'; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar /> 

      <div className="flex-1 flex flex-col bg-slate-50">
        <Header />

        {/* Konten tiap halaman (Data Sources, Team, dll) masuk ke sini */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}