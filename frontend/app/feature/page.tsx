import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export default function FeaturePage() {
  return (
    <div className="min-h-screen bg-slate-50/50 font-inter">
      
      {/* NAVBAR */}
      <Navbar />

      {/* HERO HEADER SECTION */}
      <section className="pt-40 pb-20 px-6 bg-gradient-to-b from-blue-50/50 to-transparent text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-[#4A627E] leading-tight">
            Powerful Features Built for Data Driven Marketing
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed max-w-2xl mx-auto">
            Unlock the full potential of your data with SARAI's AI-powered tools designed to simplify analysis, automate workflows, and deliver actionable insights that drive better business decisions.
          </p>
        </div>
      </section>

      {/* INTRO SECTION */}
      <section className="py-12 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-[#4A627E]">
            All in One AI Marketing Platform
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            SARAI offers a range of features designed to help businesses manage data efficiently. From data integration to AI-powered analytics, each feature is designed to provide convenience and maximum results within a single integrated platform.
          </p>
        </div>
      </section>

      {/* MAIN FEATURES (ZIG-ZAG LAYOUT) */}
      <section className="py-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-32">
          
          {/* Feature 1: Image Left, Text Right */}
          <div className="grid md:grid-cols-2 gap-12 items-center group">
            {/* 👇 Ditambah padding (p-8 md:p-12) biar ilustrasi nggak nabrak pinggir */}
            <div className="w-full aspect-[4/3] bg-white rounded-[2rem] flex items-center justify-center border border-slate-100 p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
               <img 
                  src="/illustrations/DataIntegrationIlustration.png" 
                  alt="Data Integration" 
                  // 👇 object-contain & efek hover scale biar hidup
                  className="w-full h-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
                />
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-[#4A627E]">Seamless Data Integration</h3>
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
          <div className="grid md:grid-cols-2 gap-12 items-center group">
            <div className="space-y-6 order-2 md:order-1">
              <h3 className="text-2xl font-bold text-[#4A627E]">Advanced AI Powered Analysis</h3>
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
            {/* 👇 Ditambah padding (p-8 md:p-12) */}
            <div className="w-full aspect-[4/3] bg-white rounded-[2rem] flex items-center justify-center border border-slate-100 p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 order-1 md:order-2">
                <img 
                  src="/illustrations/AIAnalysisIlustration.png" 
                  alt="AI Analysis" 
                  className="w-full h-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
                />
            </div>
          </div>

          {/* Feature 3: Image Left, Text Right */}
          <div className="grid md:grid-cols-2 gap-12 items-center group">
            {/* 👇 Ditambah padding (p-8 md:p-12) */}
            <div className="w-full aspect-[4/3] bg-white rounded-[2rem] flex items-center justify-center border border-slate-100 p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
               <img 
                  src="/illustrations/AutomationIlustration.png" 
                  alt="Marketing Automation" 
                  className="w-full h-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
                />
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-[#4A627E]">Smart Marketing Automation</h3>
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

      {/* BENTO GRID: MORE POWERFUL CAPABILITIES */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold text-[#4A627E]">More Powerful Capabilities</h2>
            <p className="text-slate-500">
              SARAI not only offers basic features, but also comes equipped with a range of advanced capabilities to support your evolving business needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[200px]">
            
            {/* Card 1 (Tall) */}
            <div className="md:row-span-2 rounded-[2rem] bg-[#f3e8ff] p-8 flex flex-col items-center justify-between border border-[#ebd5ff] hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group">
              <h3 className="text-xl font-bold text-[#4A627E] text-center">Scalable<br/>Infrastructure</h3>
              <div className="w-full h-40 rounded-xl mt-4 flex items-center justify-center p-2">
                {/* 👇 Ubah object-cover jadi object-contain */}
                <img 
                  src="/illustrations/Animation2.png" 
                  alt="Scalable Infrastructure" 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Card 2 (Wide) */}
            <div className="md:col-span-2 rounded-[2rem] bg-[#ffe4e6] p-8 flex items-center justify-between border border-[#fecdd3] hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group">
              <h3 className="text-xl font-bold text-[#4A627E] max-w-[150px]">Secure Data Handling</h3>
              <div className="w-40 h-32 rounded-xl flex items-center justify-center p-2">
                <img 
                  src="/illustrations/Animation1.png" 
                  alt="Secure Data" 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Card 3 (Small) */}
            <div className="rounded-[2rem] bg-[#e0f2fe] p-8 flex flex-col justify-between border border-[#bae6fd] hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group">
              <h3 className="text-lg font-bold text-[#4A627E]">User Friendly Interface</h3>
              <div className="w-full h-24 mt-2 flex items-center justify-center p-2">
                <img 
                  src="/illustrations/Animation3.png" 
                  alt="User Friendly" 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Card 4 (Small) */}
            <div className="rounded-[2rem] bg-[#dcfce7] p-8 flex flex-col justify-between border border-[#bbf7d0] hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group">
              <h3 className="text-lg font-bold text-[#4A627E]">Customizable Dashboard</h3>
              <div className="w-full h-24 mt-2 flex items-center justify-center p-2">
                <img 
                  src="/illustrations/Animation4.png" 
                  alt="Customizable Dashboard" 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PILLS SECTION: BUSINESS GROWTH */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-[#4A627E]">How SARAI Helps Your Business Grow</h2>
            <p className="text-slate-500">
              By using SARAI, businesses can improve operational efficiency and make more informed decisions based on accurate data.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            
            {/* 👇 Ikon Pills diubah w-12 h-12 dan dikasih padding p-2.5 biar ikonnya utuh nggak kepotong buletan */}
            <div className="bg-white px-8 py-5 rounded-full border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-pointer">
              <div className="w-12 h-12 flex-shrink-0 rounded-full bg-purple-100 flex items-center justify-center p-2.5">
                <img src="/icons/Icon 1.png" alt="icon" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-[#4A627E]">Improve Decision Making</span>
            </div>

            <div className="bg-white px-8 py-5 rounded-full border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-pointer">
              <div className="w-12 h-12 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center p-2.5">
                <img src="/icons/Icon 3.png" alt="icon" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-[#4A627E]">Gain competitive advantage</span>
            </div>

            <div className="bg-white px-8 py-5 rounded-full border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-pointer">
              <div className="w-12 h-12 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center p-2.5">
                <img src="/icons/Icon 2.png" alt="icon" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-[#4A627E]">Increase Marketing Performance</span>
            </div>

            <div className="bg-white px-8 py-5 rounded-full border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-pointer">
              <div className="w-12 h-12 flex-shrink-0 rounded-full bg-pink-100 flex items-center justify-center p-2.5">
                <img src="/icons/Icon 4.png" alt="icon" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-[#4A627E]">Save Time and Resources</span>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />

    </div>
  );
}
