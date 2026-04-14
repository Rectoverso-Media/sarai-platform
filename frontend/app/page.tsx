import React from 'react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-inter">
      
      {/* NAVBAR (Khusus Publik) */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
            <span className="text-2xl font-bold text-slate-800 tracking-tight">SARAI</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
            <a href="#feature" className="hover:text-blue-600 transition-colors">Feature</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="px-6 py-2.5 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-full transition-colors">
              Login
            </button>
            <button className="px-6 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-full transition-colors">
              Try Demo
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 via-white to-blue-50 min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-800 leading-[1.1]">
              Turn Data Into <br />
              <span className="text-blue-600">Smart Decisions</span>
            </h1>
            <p className="text-slate-500 leading-relaxed max-w-lg text-lg">
              SARAI is an advanced data platform designed to help you analyze, understand, and predict your business trends effortlessly. Empower your team to make data-driven decisions that propel performance and achieve better results.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <button className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors shadow-lg shadow-blue-600/20">
                Get Started
              </button>
              <button className="px-8 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full font-medium transition-colors flex items-center gap-2">
                <span>▶</span> Watch Video
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-blue-400 blur-[80px] opacity-20 rounded-full"></div>
            <div className="relative w-full aspect-[4/3] bg-white border border-slate-100 rounded-2xl shadow-2xl flex items-center justify-center p-4">
              <div className="w-full h-full bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">
                [ Placeholder Dashboard Mockup.png ]
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="feature" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Why Choose SARAI?</h2>
            <p className="text-slate-500 text-lg">Powerful features designed to give you complete control and visibility over your data infrastructure.</p>
          </div>
          
          {/* Features Grid (3 Cards) */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group cursor-pointer">
              {/* Placeholder 3D Asset */}
              <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 text-2xl group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300">
                📊 
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Real-time Analytics</h3>
              <p className="text-slate-500 leading-relaxed">Monitor your system performance in real-time with ultra-low latency data streaming.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group cursor-pointer">
              <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 text-2xl group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300">
                🛡️
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Advanced Security</h3>
              <p className="text-slate-500 leading-relaxed">Enterprise-grade encryption and automated threat detection to keep your data safe.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group cursor-pointer">
              <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 text-2xl group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300">
                ⚡
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Lightning Fast</h3>
              <p className="text-slate-500 leading-relaxed">Optimized queries and automated indexing ensure your dashboards load instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-24 bg-slate-50 px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">How It Works</h2>
            <p className="text-slate-500 text-lg">Three simple steps to transform your raw data into actionable insights.</p>
          </div>

          {/* Steps Container */}
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Garis Penghubung (Hanya muncul di Desktop) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-slate-200 via-blue-500 to-slate-200 opacity-50 z-0"></div>

            {/* Step 1 */}
            <div className="relative text-center z-10 group">
              <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 mb-6 group-hover:text-blue-600 group-hover:-translate-y-2 transition-all duration-300">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Connect Data</h3>
              <p className="text-slate-500">Integrate your databases and APIs with our secure platform.</p>
            </div>

            {/* Step 2 (Aktif / Di-highlight) */}
            <div className="relative text-center z-10 group">
              <div className="w-24 h-24 mx-auto bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 border border-blue-500 flex items-center justify-center text-3xl font-bold text-white mb-6 group-hover:-translate-y-2 transition-all duration-300">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Analyze & Process</h3>
              <p className="text-slate-500">Our engine cleans, structures, and analyzes your data.</p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center z-10 group">
              <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 mb-6 group-hover:text-blue-600 group-hover:-translate-y-2 transition-all duration-300">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Get Insights</h3>
              <p className="text-slate-500">View real-time dashboards and make data-driven decisions.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}