import React from 'react';
import Card from '../../../components/ui/Card'; 
import { Button } from '../../../components/ui/button'; 

export default function LoginPage() {
  return (
    <Card className="w-full p-8 md:p-10 shadow-2xl shadow-blue-600/10 border border-slate-100 rounded-2xl bg-white/95 backdrop-blur-sm">
      <div className="space-y-8 text-center">
        
        {/* Header Form */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 text-sm">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-600 font-bold hover:underline transition-all">
              Sign up here
            </a>
          </p>
        </div>

        {/* Input Fields */}
        <form className="space-y-5 text-left">
          
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
            <input 
              id="email" 
              type="email" 
              placeholder="name@company.com" 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
              {/* Tambahan Link Forgot Password */}
              <a href="/forgot-password" className="text-xs font-bold text-blue-600 hover:underline transition-all">
                Forgot password?
              </a>
            </div>
            <input 
              id="password" 
              type="password" 
              placeholder="Enter your password" 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
            />
          </div>

          {/* Main Action Button */}
          <div className="pt-4">
            <Button className="w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all">
              Sign In
            </Button>
          </div>
        </form>

        {/* Social Sign-On */}
        <div className="space-y-6 pt-6 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Or continue with</p>
          <div className="flex items-center justify-center gap-4">
            <button type="button" className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="font-bold text-slate-700 text-sm">Google</span>
            </button>
            <button type="button" className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="font-bold text-slate-700 text-sm">GitHub</span>
            </button>
          </div>
        </div>
        
      </div>
    </Card>
  );
}