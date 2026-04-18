import React from 'react';
import { Button } from '../../components/ui/button';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Image from 'next/image';


export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white font-inter">
      
      {/* NAVBAR (Sama dengan Homepage) */}
      <Navbar />

      {/* HERO SECTION ABOUT */}
      <section className="pt-32 pb-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800">
              About SARAI
            </h1>
            <p className="text-slate-500 leading-relaxed text-lg">
              SARAI is an AI marketing platform that helps businesses turn data into meaningful insights. Powered by artificial intelligence, SARAI is designed to simplify data analysis and support faster, more accurate decision making.
            </p>
          </div>
          {/* Placeholder untuk Ilustrasi */}
          <div className="relative w-full aspect-video flex items-center justify-center">
            <img 
                src="/illustrations/Animation6.png" 
                alt="Success Animation" 
                className="w-full h-full object-cover"
              />
            {/* <span className="text-blue-300 font-medium">[ Illustration: Woman at Desk ]</span> */}
          </div>
        </div>
      </section>

      {/* QUOTE SECTION (CEO) */}
      <section className="pb-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto relative mt-10 md:mt-20">
          <div className="bg-[#597393] rounded-3xl p-8 md:p-14 flex flex-col md:flex-row items-center gap-8 md:pl-40 shadow-xl shadow-slate-200">
            
            {/* Foto CEO */}
            <div className="md:absolute left-[-2rem] top-1/2 md:-translate-y-1/2 w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white overflow-hidden bg-slate-300 shadow-lg flex-shrink-0">
               {/* Ntar tag <img src="/ceo.jpg" alt="CEO" /> nanti di sini */}
                <img 
                  src="/icons/Profile.png" 
                  alt="Success Animation" 
                  className="w-full h-full object-cover"
                />
            </div>
            
            <div className="text-white space-y-4 text-center md:text-left">
              <p className="text-xl md:text-2xl font-medium leading-relaxed">
                "At SARAI, we believe in transforming complex data into clear, actionable insights."
              </p>
              <div>
                <p className="font-bold">Jessica Grant</p>
                <p className="text-sm opacity-80">Founder & CEO</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STORY & MISSION SECTION */}
      <section className="py-24 bg-slate-50 px-6">
        <div className="max-w-6xl mx-auto space-y-24">
          
          {/* Our Story */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <p className="text-slate-600 leading-relaxed text-lg order-2 md:order-1">
              SARAI was developed as a solution to help businesses understand data more easily. In today's information rich digital age, many companies struggle to turn data into useful insights. That's why SARAI leverages AI technology to simplify the analysis process and support smarter decision making.
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#597393] order-1 md:order-2 text-left md:text-right">
              Our Story
            </h2>
          </div>

          {/* Our Mission */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <h2 className="text-4xl md:text-5xl font-bold text-[#597393]">
              Our Mission
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              Helping businesses get the most out of their data through smart, efficient, and user-friendly AI technology.
            </p>
          </div>

        </div>
      </section>

      {/* WHY CHOOSE SARAI SECTION */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto space-y-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#597393] text-center">
            Why Choose SARAI
          </h2>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Placeholder untuk Ilustrasi Kiri */}
            <div className="w-full aspect-square max-w-md mx-auto bg-blue-50 rounded-full border border-blue-100 flex items-center justify-center">
               <img 
                src="/illustrations/Animation5.png" 
                alt="Success Animation" 
                className="w-full h-full object-cover"
              />
               {/* <span className="text-blue-300 font-medium">[ Illustration: Woman & Lightbulb ]</span> */}
            </div>

            {/* Grid 4 Fitur Kanan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: 'Fast & Efficient', icon: '⏱️' },
                { title: 'Accurate Insights', icon: '🎯' },
                { title: 'Easy to Use', icon: '👆' },
                { title: 'Scalable for Business', icon: '🏢' },
              ].map((feature, idx) => (
                <div key={idx} className="p-6 border border-slate-200 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow bg-white">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
                    {feature.icon}
                  </div>
                  <span className="font-bold text-[#597393]">{feature.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer/>

    </div>
  );
}