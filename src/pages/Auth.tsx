"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Chrome } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useApp();
  const [email, setEmail] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login
    setCurrentUser({
      id: 'u1',
      name: 'Felix Zhang',
      email: email,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      title: 'Senior Fullstack Developer',
      skills: ['React', 'TypeScript', 'Node.js'],
      location: 'San Francisco'
    });
    toast.success("Welcome back!");
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col px-8 py-12">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground text-3xl font-bold">D</span>
          </div>
          <h1 className="text-3xl font-bold">DevSphere</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" className="w-full h-12 text-lg">Sign In</Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-12 gap-2"><Chrome size={20} /> Google</Button>
            <Button variant="outline" className="h-12 gap-2"><Github size={20} /> GitHub</Button>
          </div>
        </form>
      </div>
      
      <p className="text-center text-sm text-muted-foreground mt-8">
        Don't have an account? <span onClick={() => navigate('/signup')} className="text-primary font-semibold cursor-pointer">Sign up</span>
      </p>
    </div>
  );
};

export default Auth;