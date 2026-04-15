import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Image from 'next/image';

export default function LandingPage() {
  return (
    

    <div className="min-h-screen bg-white font-inter">
      
      {/* NAVBAR (Khusus Publik) */}
      <Navbar/>


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
              <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-50">
                <img 
                  src="/background/Background2.png" 
                  alt="SARAI Dashboard Mockup" 
                  className="w-full h-auto object-cover"
                />
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

      {/* STATS SECTION */}
      <section className="py-20 bg-blue-600 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-blue-500/50">
            <div className="space-y-2">
              <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">99.9%</h3>
              <p className="text-blue-200 font-medium">Uptime Guarantee</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">50M+</h3>
              <p className="text-blue-200 font-medium">Queries Processed</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">&lt;10ms</h3>
              <p className="text-blue-200 font-medium">Average Latency</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">24/7</h3>
              <p className="text-blue-200 font-medium">Expert Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* BRANDS (TRUSTED BY) SECTION */}
      <section className="py-24 bg-white overflow-hidden px-6">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            Trusted by innovative companies worldwide
          </p>
        </div>
        
        {/* Container Utama (Masking) */}
        <div className="relative flex overflow-x-hidden">
          {/* Track Animasi */}
          <div className="animate-marquee flex items-center gap-16 md:gap-24 py-4">
            {/* --- DERET LOGO 1 --- */}
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="flex-shrink-0">
                {/* Placeholder Gambar PNG */}
                <div className="w-32 h-12 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <span className="text-xs font-bold text-slate-400">LOGO {item}</span>
                </div>
              </div>
            ))}

            {/* --- DERET LOGO 2 (DUPLIKAT UNTUK LOOPING) --- */}
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={`dup-${item}`} className="flex-shrink-0">
                <div className="w-32 h-12 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <span className="text-xs font-bold text-slate-400">LOGO {item}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Efek Fade di Kiri & Kanan biar halus pas muncul/hilang */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>
        </div>
      </section>


      {/* CALL TO ACTION (CTA) SECTION */}
      <section 
        className="relative w-full min-h-[500px] md:min-h-[600px] py-20 flex flex-col justify-center bg-cover bg-bottom bg-no-repeat"
        style={{ 
          backgroundImage: "url('/background/Background1.png')"
        }}
      >
        
        {/* CONTENT CONTAINER */}
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center max-w-4xl animate-in slide-in-from-bottom-10 duration-700">
          
          {/* Eyebrow Text + Icon */}
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-sm shadow-sm">
              📊 
            </div>
            <span className="text-[#597393] font-extrabold text-xl md:text-2xl tracking-wide">
              Let's try SARAI now!
            </span>
          </div>

          {/* Main Heading */}
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#3a526d] mb-8 leading-tight">
            Start Making Smarter Decisions Today
          </h2>

          {/* Subheading */}
          <p className="text-slate-600 text-lg md:text-xl mb-12 leading-relaxed max-w-2xl">
            Start using SARAI to turn data into insights that help improve your business performance
          </p>

          {/* Get Started Button */}
          <a href="/register">
            <button className="px-12 py-5 text-lg font-bold text-white bg-[#597393] hover:bg-[#4a627e] rounded-full shadow-xl shadow-slate-400/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              Get Started
            </button>
          </a>

        </div>
      </section>
      {/* ========================================= */}

      {/* FOOTER */}
      <Footer/>

    </div>
  );
}