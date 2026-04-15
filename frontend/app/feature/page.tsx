import React from 'react';

export default function FeaturePage() {
  return (
    <div className="min-h-screen bg-slate-50/50 font-inter">
      
      {/* NAVBAR */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
            <span className="text-2xl font-bold text-slate-800 tracking-tight">SARAI</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="/" className="hover:text-blue-600 transition-colors">Home</a>
            <a href="/about" className="hover:text-blue-600 transition-colors">About</a>
            <a href="/feature" className="text-blue-600 font-bold">Feature</a>
            <a href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <a href="/login" className="px-6 py-2.5 text-sm font-medium text-white bg-[#597393] hover:bg-[#4a627e] rounded-full transition-colors">
              Login
            </a>
            <button className="px-6 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-full transition-colors">
              Try Demo
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO HEADER SECTION */}
      <section className="pt-40 pb-20 px-6 bg-gradient-to-b from-blue-50/50 to-transparent text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-[#597393] leading-tight">
            Powerful Features Built for Data Driven Marketing
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed max-w-2xl mx-auto">
            Unlock the full potential of your data with SARAI's AI-powered tools designed to simplify analysis, automate workflows, and deliver actionable insights that drive better business decisions.
          </p>
        </div>
      </section>

      {/* 3. INTRO SECTION */}
      <section className="py-12 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-[#597393]">
            All in One AI Marketing Platform
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            SARAI offers a range of features designed to help businesses manage data efficiently. From data integration to AI-powered analytics, each feature is designed to provide convenience and maximum results within a single integrated platform.
          </p>
        </div>
      </section>

      {/* 4. MAIN FEATURES (ZIG-ZAG LAYOUT) */}
      <section className="py-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-32">
          
          {/* Feature 1: Image Left, Text Right */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="w-full aspect-[4/3] bg-slate-100 rounded-[2rem] flex items-center justify-center border border-slate-200">
               <span className="text-slate-400 font-medium">[ Illustration: Devices & Data ]</span>
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-[#597393]">Seamless Data Integration</h3>
              <p className="text-slate-500 leading-relaxed">
                Integrate seamlessly with marketing platforms, analytics tools, and internal databases into a single centralized system. With SARAI, you can oversee and manage data more efficiently without having to switch between platforms.
              </p>
              <div className="space-y-3">
                <p className="font-bold text-slate-800">Key Highlights:</p>
                <ul className="space-y-2 text-slate-500">
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Connect multiple data sources</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Real-time data synchronization</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Unified dashboard view</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Easy data management</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature 2: Text Left, Image Right */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 order-2 md:order-1">
              <h3 className="text-2xl font-bold text-[#597393]">Advanced AI Powered Analysis</h3>
              <p className="text-slate-500 leading-relaxed">
                SARAI uses artificial intelligence to automatically process data and provide actionable insights. The system is capable of identifying patterns, trends, and opportunities that might be overlooked by manual analysis.
              </p>
              <div className="space-y-3">
                <p className="font-bold text-slate-800">Key Highlights:</p>
                <ul className="space-y-2 text-slate-500">
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Automated data processing</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Predictive insights</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Pattern recognition</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Real-time analytics</li>
                </ul>
              </div>
            </div>
            <div className="w-full aspect-[4/3] bg-slate-100 rounded-[2rem] flex items-center justify-center border border-slate-200 order-1 md:order-2">
               <span className="text-slate-400 font-medium">[ Illustration: AI Robot & Charts ]</span>
            </div>
          </div>

          {/* Feature 3: Image Left, Text Right */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="w-full aspect-[4/3] bg-slate-100 rounded-[2rem] flex items-center justify-center border border-slate-200">
               <span className="text-slate-400 font-medium">[ Illustration: Workflow Automation ]</span>
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-[#597393]">Smart Marketing Automation</h3>
              <p className="text-slate-500 leading-relaxed">
                Automate various marketing processes to increase team efficiency and productivity. SARAI helps reduce manual work so teams can focus on strategy and business development.
              </p>
              <div className="space-y-3">
                <p className="font-bold text-slate-800">Key Highlights:</p>
                <ul className="space-y-2 text-slate-500">
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Workflow automation</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Task scheduling</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Campaign optimization</li>
                  <li className="flex items-center gap-2"><span className="text-blue-500">•</span> Performance tracking</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. BENTO GRID: MORE POWERFUL CAPABILITIES */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold text-[#597393]">More Powerful Capabilities</h2>
            <p className="text-slate-500">
              SARAI not only offers basic features, but also comes equipped with a range of advanced capabilities to support your evolving business needs.
            </p>
          </div>

          {/* CSS Grid (Bento Box Style) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[200px]">
            
            {/* Card 1 (Tall) */}
            <div className="md:row-span-2 rounded-[2rem] bg-[#f3e8ff] p-8 flex flex-col items-center justify-between border border-[#ebd5ff]">
              <h3 className="text-xl font-bold text-slate-800 text-center">Scalable<br/>Infrastructure</h3>
              <div className="w-full h-40 bg-white/50 rounded-xl mt-4 flex items-center justify-center text-sm text-purple-400 font-medium">
                [ Illustration ]
              </div>
            </div>

            {/* Card 2 (Wide) */}
            <div className="md:col-span-2 rounded-[2rem] bg-[#ffe4e6] p-8 flex items-center justify-between border border-[#fecdd3]">
              <h3 className="text-xl font-bold text-slate-800 max-w-[150px]">Secure Data Handling</h3>
              <div className="w-40 h-32 bg-white/50 rounded-xl flex items-center justify-center text-sm text-rose-400 font-medium">
                [ Illustration ]
              </div>
            </div>

            {/* Card 3 (Small) */}
            <div className="rounded-[2rem] bg-[#e0f2fe] p-8 flex flex-col justify-between border border-[#bae6fd]">
              <h3 className="text-lg font-bold text-slate-800">User Friendly Interface</h3>
              <div className="w-full h-24 bg-white/50 rounded-xl mt-2 flex items-center justify-center text-sm text-sky-400 font-medium">
                [ UI Graphic ]
              </div>
            </div>

            {/* Card 4 (Small) */}
            <div className="rounded-[2rem] bg-[#dcfce7] p-8 flex flex-col justify-between border border-[#bbf7d0]">
              <h3 className="text-lg font-bold text-slate-800">Customizable Dashboard</h3>
              <div className="w-full h-24 bg-white/50 rounded-xl mt-2 flex items-center justify-center text-sm text-green-400 font-medium">
                [ Dashboard Graphic ]
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. PILLS SECTION: BUSINESS GROWTH */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-[#597393]">How SARAI Helps Your Business Grow</h2>
            <p className="text-slate-500">
              By using SARAI, businesses can improve operational efficiency and make more informed decisions based on accurate data.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white px-8 py-5 rounded-full border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">📊</div>
              <span className="font-bold text-slate-800">Improve Decision Making</span>
            </div>
            <div className="bg-white px-8 py-5 rounded-full border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">🚀</div>
              <span className="font-bold text-slate-800">Gain competitive advantage</span>
            </div>
            <div className="bg-white px-8 py-5 rounded-full border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">📈</div>
              <span className="font-bold text-slate-800">Increase Marketing Performance</span>
            </div>
            <div className="bg-white px-8 py-5 rounded-full border border-slate-200 shadow-sm flex items-center gap-4 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">⏱️</div>
              <span className="font-bold text-slate-800">Save Time and Resources</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-[#597393] text-white pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-center text-2xl font-bold mb-16">Contact</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            <div className="col-span-2 md:col-span-1 flex justify-center md:justify-start">
              <div className="w-32 h-32 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20"></div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white">Follow Us</h4>
              <ul className="space-y-4 text-slate-200 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Youtube</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white">Resources</h4>
              <ul className="space-y-4 text-slate-200 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integration</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutorials</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white">Help & Legal</h4>
              <ul className="space-y-4 text-slate-200 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/20 text-center text-slate-300 text-xs">
            <p>© SARAI</p>
          </div>
        </div>
      </footer>

    </div>
  );
}