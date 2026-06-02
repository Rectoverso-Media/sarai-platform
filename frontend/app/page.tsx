import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-inter">
      
      {/* NAVBAR (Khusus Publik) */}
      <Navbar/>

      {/* Spacer untuk fixed navbar */}
      <div className="w-full h-20 md:h-20 bg-transparent" aria-hidden="true"></div>

      {/* HERO SECTION */}
      <section 
        className="relative w-full aspect-[14/9] md:aspect-[16/9] flex flex-col justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background/Background2.png')" }}
      >
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center px-6">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-[#4A627E] leading-[1.1]">
              Turn Data Into <br />
              <span className="text-[#4A627E]">Smart Decisions</span>
            </h1>
            <p className="text-slate-500 leading-relaxed max-w-lg text-lg">
              SARAI is an advanced data platform designed to help you analyze, understand, and predict your business trends effortlessly.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link 
                href="/register"
                className="px-8 py-3.5 bg-[#4A627E] hover:bg-blue-700 text-white rounded-full font-medium transition-colors shadow-lg shadow-blue-600/20 inline-block"
              >
                Get Started
              </Link>
              <Link
                href="/register"
                className="px-8 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full font-medium transition-colors flex items-center gap-2"
              >
                <span>▶</span> Try Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section 
        className="relative py-24 px-6 border-y border-slate-100 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('/background/bg-steps-placeholder.png')",
          backgroundColor: "rgba(248, 250, 252, 0.95)",
          backgroundBlendMode: "overlay"
        }}
      >
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-[#4A627E] mb-4">How It Works</h2>
            <p className="text-slate-500 text-lg">Three simple steps to transform your raw data into actionable insights.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-slate-200 via-[#4A627E] to-slate-200 opacity-50 z-0"></div>

            <div className="relative text-center z-10 group">
              <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 mb-6 group-hover:-translate-y-2 transition-all duration-300">1</div>
              <h3 className="text-xl font-bold text-[#4A627E] mb-3">Connect Data</h3>
              <p className="text-slate-500">Integrate your databases and APIs with our secure platform.</p>
            </div>

            <div className="relative text-center z-10 group">
              <div className="w-24 h-24 mx-auto bg-[#4A627E] rounded-2xl shadow-lg shadow-blue-600/30 border border-blue-500/20 flex items-center justify-center text-3xl font-bold text-white mb-6 group-hover:-translate-y-2 transition-all duration-300">2</div>
              <h3 className="text-xl font-bold text-[#4A627E] mb-3">Analyze & Process</h3>
              <p className="text-slate-500">Our engine cleans, structures, and analyzes your data.</p>
            </div>

            <div className="relative text-center z-10 group">
              <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 mb-6 group-hover:-translate-y-2 transition-all duration-300">3</div>
              <h3 className="text-xl font-bold text-[#4A627E] mb-3">Get Insights</h3>
              <p className="text-slate-500">View real-time dashboards and make data-driven decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION — 8 Fitur Utama SARAI sesuai brief */}
      <section 
        id="feature" 
        className="relative py-24 px-6 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('/background/bg-features-placeholder.png')",
          backgroundColor: "rgba(248, 250, 252, 0.8)",
          backgroundBlendMode: "overlay"
        }}
      >
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
            <p className="text-sm font-semibold text-[#4A627E] uppercase tracking-widest mb-3">Platform Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#4A627E]">
              Everything You Need to Turn Data Into Decisions
            </h2>
            <p className="text-slate-500 mt-4 text-lg">8 powerful features designed to unify your marketing data and drive business growth.</p>
          </div>
          
          {/* Grid 8 Fitur */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1: Connect */}
            <div className="p-7 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🔌</div>
              <h3 className="font-bold text-slate-800 mb-2">Connect</h3>
              <p className="text-slate-500 text-sm leading-relaxed">600+ connectors to ads, analytics, CRM, and more via Airbyte.</p>
            </div>

            {/* Feature 2: Query */}
            <div className="p-7 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🪄</div>
              <h3 className="font-bold text-slate-800 mb-2">Query</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Visual query builder with metrics, filters, and scheduled runs.</p>
            </div>

            {/* Feature 3: Blend */}
            <div className="p-7 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🔀</div>
              <h3 className="font-bold text-slate-800 mb-2">Blend</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Join data from multiple sources with custom formulas and calculations.</p>
            </div>

            {/* Feature 4: Visualize */}
            <div className="p-7 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📊</div>
              <h3 className="font-bold text-slate-800 mb-2">Visualize</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Interactive dashboards with 8 widget types and drag-drop layout.</p>
            </div>

            {/* Feature 5: Analyze (AI) */}
            <div className="p-7 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.15)] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">✨</div>
              <h3 className="font-bold text-slate-800 mb-2">Analyze AI</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Chat with AI for real-time insights, trend analysis, and forecasting.</p>
            </div>

            {/* Feature 6: Export */}
            <div className="p-7 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📤</div>
              <h3 className="font-bold text-slate-800 mb-2">Export</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Auto-export to Google Sheets, Excel, Looker Studio, and Power BI.</p>
            </div>

            {/* Feature 7: Manage */}
            <div className="p-7 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">👥</div>
              <h3 className="font-bold text-slate-800 mb-2">Manage</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Multi-tenant team management with 4 access levels and collaboration.</p>
            </div>

            {/* Feature 8: Scale */}
            <div className="p-7 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🚀</div>
              <h3 className="font-bold text-slate-800 mb-2">Scale</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Flexible subscription with usage tracking and quota management.</p>
            </div>

          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-20 px-6 bg-[#4A627E]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/20">
            <div className="space-y-2">
              <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">600+</h3>
              <p className="text-blue-200 font-medium">Data Connectors</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">95%</h3>
              <p className="text-blue-200 font-medium">AI Accuracy</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">3X</h3>
              <p className="text-blue-200 font-medium">Faster Processing</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">99.9%</h3>
              <p className="text-blue-200 font-medium">Uptime Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* BRANDS SECTION */}
      <section className="py-24 bg-white overflow-hidden px-6 relative z-10">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            Trusted by innovative companies worldwide
          </p>
        </div>
        <div className="relative flex overflow-x-hidden">
          <div className="animate-marquee flex items-center gap-16 md:gap-24 py-4">
            {[1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6].map((item, idx) => (
              <div key={idx} className="flex-shrink-0">
                <div className="w-32 h-12 flex items-center justify-center hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">
                  <img 
                    src={`/logos/Logo-${item}.png`} 
                    alt={`Trusted Company ${item}`} 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section 
        className="relative w-full aspect-[4/3] md:aspect-[21/9] flex flex-col items-center justify-center bg-cover bg-bottom bg-no-repeat"
        style={{ backgroundImage: "url('/background/Background1.png')" }}
      >
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center max-w-4xl">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-sm shadow-sm">📊</div>
            <span className="text-[#597393] font-extrabold text-xl md:text-2xl tracking-wide">Let's try SARAI now!</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#3a526d] mb-8 leading-tight">
            Start Making Smarter Decisions Today
          </h2>
          <p className="text-slate-600 text-lg md:text-xl mb-12 leading-relaxed max-w-2xl">
            Start using SARAI to turn data into insights that help improve your business performance
          </p>
          <Link href="/register">
            <button id="cta-get-started" className="px-12 py-5 text-lg font-bold text-white bg-[#597393] hover:bg-[#4a627e] rounded-full shadow-xl shadow-slate-400/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              Get Started — It's Free
            </button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <Footer/>

    </div>
  );
}