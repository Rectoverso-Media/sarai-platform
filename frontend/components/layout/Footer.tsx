import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#597393] text-white pt-20 pb-10 px-6 font-inter">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Footer */}
        <h3 className="text-center text-2xl font-bold mb-16">Contact</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {/* Brand Box */}
          <div className="col-span-2 md:col-span-1 flex justify-center md:justify-start">
            <div className="w-32 h-32 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <span className="font-bold text-xl tracking-widest">SARAI</span>
            </div>
          </div>

          {/* Links: Follow Us */}
          <div>
            <h4 className="font-bold mb-6 text-white">Follow Us</h4>
            <ul className="space-y-4 text-slate-200 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Youtube</a></li>
            </ul>
          </div>

          {/* Links: Resources */}
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

          {/* Links: Help & Legal */}
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

        {/* Copyright */}
        <div className="pt-8 border-t border-white/20 text-center text-slate-300 text-xs">
          <p>© {new Date().getFullYear()} SARAI Analytics Platform. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
}