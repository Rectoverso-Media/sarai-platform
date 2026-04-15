import React from 'react';
import Card from '../../../components/ui/Card'; 
import { Button } from '../../../components/ui/button'; 

export default function ForgotPasswordPage() {
  return (
    <Card className="w-full p-8 md:p-10 shadow-2xl shadow-blue-600/10 border border-slate-100 rounded-2xl bg-white/95 backdrop-blur-sm">
      <div className="space-y-8 text-center">
        
        {/* Header */}
        <div className="space-y-3">
          {/* Ikon Gembok */}
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner border border-blue-100">
            🔒
          </div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Forgot Password?</h2>
          <p className="text-slate-500 text-sm leading-relaxed px-4">
            No worries! Enter your email address below and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Input Form */}
        <form className="space-y-5 text-left">
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
            <input 
              id="email" 
              type="email" 
              placeholder="name@company.com" 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
            />
          </div>

          <div className="pt-2">
            <Button className="w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all">
              Send Reset Link
            </Button>
          </div>
        </form>

        {/* Back to Login Link */}
        <div className="pt-4">
          <a href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
            <span>←</span> Back to Login
          </a>
        </div>
        
      </div>
    </Card>
  );
}