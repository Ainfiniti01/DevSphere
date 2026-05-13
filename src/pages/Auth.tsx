"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Chrome, AlertCircle, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { useApp } from '@/context/AppContext';
import appIcon from '../../assets/images/icon.jpeg';

const Auth = () => {
  const navigate = useNavigate();
  const { currentUser, authLoading } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const REDIRECT_URL = window.location.origin;

  useEffect(() => {
    // Only redirect if we are absolutely sure the user is logged in and auth is not loading
    if (!authLoading && currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error("Server connection not established.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("rate limit") || msg.includes("too many requests")) {
          setErrorMsg("Too many requests. Please wait a few minutes.");
        } else if (msg.includes("invalid login credentials")) {
          setErrorMsg("Invalid email or password.");
        } else {
          setErrorMsg(error.message);
        }
        toast.error("Login failed");
      } else if (data.user) {
        toast.success("Welcome back!");
        // The AppContext will pick up the session change and update currentUser
        // The useEffect above will handle the navigation to '/'
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${REDIRECT_URL}/reset-password`,
      });

      if (error) {
        toast.error(error.message || "Failed to send reset link");
        return;
      }
      
      toast.success("Password reset link sent!");
      setIsResetMode(false);
    } catch (error: any) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: REDIRECT_URL }
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col px-8 py-12">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg overflow-hidden">
            <img src={appIcon} alt="DevSphere" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold">DevSphere</h1>
          <p className="text-muted-foreground mt-2">
            {isResetMode ? "Reset your password" : "Sign in to continue"}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-destructive text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {isResetMode ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input 
                id="reset-email" 
                type="email" 
                placeholder="name@example.com" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="h-12 rounded-xl"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg rounded-xl font-bold" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
            </Button>
            <button 
              type="button" 
              onClick={() => setIsResetMode(false)}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <ArrowLeft size={16} /> Back to Login
            </button>
          </form>
        ) : (
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button 
                  type="button" 
                  onClick={() => setIsResetMode(true)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 rounded-xl pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-lg rounded-xl font-bold" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
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
        )}
      </div>
      
      {!isResetMode && (
        <p className="text-center text-sm text-muted-foreground mt-8">
          Don't have an account? <span onClick={() => navigate('/signup')} className="text-primary font-semibold cursor-pointer hover:underline">Sign up</span>
        </p>
      )}
    </div>
  );
};

export default Auth;