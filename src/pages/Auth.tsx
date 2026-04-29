"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Chrome, ArrowRight } from 'lucide-react';
import { toast } from "sonner";

const Auth = () => {
  const [step, setStep] = useState<'login' | 'role'>('login');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('role');
  };

  const selectRole = (role: string) => {
    toast.success(`Welcome as a ${role}!`);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto flex flex-col px-8 py-12">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white text-3xl font-bold">D</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">DevSphere</h1>
          <p className="text-slate-500 mt-2">Where innovators build the future.</p>
        </div>

        {step === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg">
              Sign In
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500">Or continue with</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-12 gap-2">
                <Chrome size={20} /> Google
              </Button>
              <Button variant="outline" className="h-12 gap-2">
                <Github size={20} /> GitHub
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-center">Choose your path</h2>
            <div className="grid gap-4">
              <button 
                onClick={() => selectRole('Developer')}
                className="p-6 border-2 border-slate-100 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left group"
              >
                <h3 className="font-bold text-lg group-hover:text-indigo-600">Developer</h3>
                <p className="text-sm text-slate-500">Build projects, showcase skills, and find collaborators.</p>
              </button>
              <button 
                onClick={() => selectRole('Investor')}
                className="p-6 border-2 border-slate-100 rounded-2xl hover:border-emerald-600 hover:bg-emerald-50 transition-all text-left group"
              >
                <h3 className="font-bold text-lg group-hover:text-emerald-600">Investor / Founder</h3>
                <p className="text-sm text-slate-500">Discover talent, fund startups, and lead innovation.</p>
              </button>
            </div>
          </div>
        )}
      </div>
      
      <p className="text-center text-sm text-slate-500 mt-8">
        Don't have an account? <span className="text-indigo-600 font-semibold cursor-pointer">Sign up</span>
      </p>
    </div>
  );
};

export default Auth;