"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Chrome, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error("Server connection not established. Please rebuild the app.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMsg("Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMsg("Please confirm your email address.");
        } else {
          setErrorMsg(error.message);
        }
        toast.error("Login failed");
      } else {
        toast.success("Welcome back!");
        navigate('/');
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin }
    });
    if (error) toast.error(error.message);
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

        {errorMsg && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-destructive text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <Button type="submit" className="w-full h-12 text-lg rounded-xl font-bold" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="button" className="h-12 gap-2 rounded-xl" onClick={() => handleOAuth('google')}><Chrome size={20} /> Google</Button>
            <Button variant="outline" type="button" className="h-12 gap-2 rounded-xl" onClick={() => handleOAuth('github')}><Github size={20} /> GitHub</Button>
          </div>
        </form>
      </div>
      
      <p className="text-center text-sm text-muted-foreground mt-8">
        Don't have an account? <span onClick={() => navigate('/signup')} className="text-primary font-semibold cursor-pointer hover:underline">Sign up</span>
      </p>
    </div>
  );
};

export default Auth;