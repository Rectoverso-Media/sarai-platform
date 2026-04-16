import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-inter">
      
      {/* NAVBAR (Khusus Publik) */}
      <Navbar/>

      {/* Dummy navbar (Spacer) */}
      <div className="w-full h-20 md:h-20 bg-transparent" aria-hidden="true"></div>

      {/* HERO SECTION (Fleksibel dengan Aspect)   */}
      <section 
        className="relative w-full aspect-[14/9] md:aspect-[16/9] flex flex-col justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background/Background2.png')" }}
      >
        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center px-6">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-800 leading-[1.1]">
              Turn Data Into <br />
              <span className="text-blue-600">Smart Decisions</span>
            </h1>
            <p className="text-slate-500 leading-relaxed max-w-lg text-lg">
              SARAI is an advanced data platform designed to help you analyze, understand, and predict your business trends effortlessly.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors shadow-lg shadow-blue-600/20">
                Get Started
              </button>
              <button className="px-8 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full font-medium transition-colors flex items-center gap-2">
                <span></span> Try Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES SECTION (Natural Height)        */}
      <section 
        id="feature" 
        className="relative py-24 px-6 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('/background/bg-features-placeholder.png')",
          backgroundColor: "rgba(255, 255, 255, 0.9)", // Kaca film putih 90% biar konten kebaca
          backgroundBlendMode: "overlay"
        }}
      >
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Why Choose SARAI?</h2>
            <p className="text-slate-500 text-lg">Powerful features designed to give you complete control and visibility.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <div className="mx-auto w-20 h-20 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300">
                <img 
                  src="/icons/DataIntegrationIcon.png" 
                  alt="Analytics Icon" 
                  className="w-12 h-12 object-contain" 
                />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Real-time Analytics</h3>
              <p className="text-slate-500 leading-relaxed">Monitor your system performance in real-time with ultra-low latency data streaming.</p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <div className="mx-auto w-20 h-20 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 text-2xl group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300">
                <img 
                  src="/icons/AIAnalysisIcon.png" 
                  alt="Analytics Icon" 
                  className="w-12 h-12 object-contain" 
                />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Advanced Security</h3>
              <p className="text-slate-500 leading-relaxed">Enterprise-grade encryption and automated threat detection to keep your data safe.</p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <div className="mx-auto w-20 h-20 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 text-2xl group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300">
                <img 
                  src="/icons/AutomationIcon.png" 
                  alt="Analytics Icon" 
                  className="w-12 h-12 object-contain" 
                />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Lightning Fast</h3>
              <p className="text-slate-500 leading-relaxed">Optimized queries and automated indexing ensure your dashboards load instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION (Natural Height)    */}
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
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">How It Works</h2>
            <p className="text-slate-500 text-lg">Three simple steps to transform your raw data into actionable insights.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-slate-200 via-blue-500 to-slate-200 opacity-50 z-0"></div>

            <div className="relative text-center z-10 group">
              <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 mb-6 group-hover:text-blue-600 group-hover:-translate-y-2 transition-all duration-300">1</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Connect Data</h3>
              <p className="text-slate-500">Integrate your databases and APIs with our secure platform.</p>
            </div>

            <div className="relative text-center z-10 group">
              <div className="w-24 h-24 mx-auto bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 border border-blue-500 flex items-center justify-center text-3xl font-bold text-white mb-6 group-hover:-translate-y-2 transition-all duration-300">2</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Analyze & Process</h3>
              <p className="text-slate-500">Our engine cleans, structures, and analyzes your data.</p>
            </div>

            <div className="relative text-center z-10 group">
              <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 mb-6 group-hover:text-blue-600 group-hover:-translate-y-2 transition-all duration-300">3</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Get Insights</h3>
              <p className="text-slate-500">View real-time dashboards and make data-driven decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION (Premium Dark Blue)        */}
      <section 
        className="relative py-20 px-6 bg-cover bg-center bg-fixed bg-no-repeat"
        style={{ 
          // Cocok dikasih gambar node map / jaring-jaring teknologi
          backgroundImage: "url('/background/bg-tech-placeholder.png')",
          backgroundColor: "rgba(37, 99, 235, 0.9)", // Warna blue-600 transparansi 90%
          backgroundBlendMode: "multiply" // Bikin efek gambarnya nge-blend elegan sama warna biru
        }}
      >
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-blue-400/30">
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

      {/* BRANDS SECTION (Dibiarkan Putih Bersih)  */}
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
                <div className="w-32 h-12 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  <span className="text-xs font-bold text-slate-400">LOGO {item}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>
        </div>
      </section>

      {/* CTA SECTION (Fleksibel dengan Aspect)    */}
      <section 
        // Di-upgrade pakai aspect rasio biar super mulus!
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
          <a href="/register">
            <button className="px-12 py-5 text-lg font-bold text-white bg-[#597393] hover:bg-[#4a627e] rounded-full shadow-xl shadow-slate-400/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              Get Started
            </button>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <Footer/>

    </div>
  );
}