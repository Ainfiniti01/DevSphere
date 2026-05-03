"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    title: '',
    skills: '',
    location: '',
    portfolio_url: ''
  });

  const REDIRECT_URL = 'http://10.118.61.248:32105';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error("Server connection not established. Please rebuild.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          },
          redirectTo: REDIRECT_URL
        }
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes("rate limit") || msg.includes("too many requests")) {
          toast.error("Too many requests. Please wait a few minutes before trying again.");
        } else {
          toast.error(authError.message || "An error occurred during signup");
        }
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name: formData.name,
            title: formData.title,
            skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ""),
            location: formData.location,
            portfolio_url: formData.portfolio_url,
            updated_at: new Date().toISOString()
          });

        if (profileError) console.error("Profile update error:", profileError);

        toast.success("Account created! Please check your email for confirmation.");
        navigate('/auth');
      }
    } catch (error: any) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
        <p className="text-muted-foreground mt-2">Join the developer community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className="space-y-1.5">
          <Label>Full Name</Label>
          <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" className="rounded-xl h-12" />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" className="rounded-xl h-12" />
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <div className="relative">
            <Input 
              type={showPassword ? "text" : "password"} 
              required 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              className="rounded-xl h-12 pr-10" 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Professional Title</Label>
          <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Senior Developer" className="rounded-xl h-12" />
        </div>
        <div className="space-y-1.5">
          <Label>Skills (comma separated)</Label>
          <Input required value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="React, Node.js" className="rounded-xl h-12" />
        </div>
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="San Francisco, CA" className="rounded-xl h-12" />
        </div>
        <div className="space-y-1.5">
          <Label>Portfolio URL (Optional)</Label>
          <Input value={formData.portfolio_url} onChange={e => setFormData({...formData, portfolio_url: e.target.value})} placeholder="https://yourportfolio.com" className="rounded-xl h-12" />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-14 mt-6 text-lg font-bold rounded-2xl shadow-lg">
          {loading ? <Loader2 className="animate-spin" /> : "Complete Profile"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Already have an account? <span onClick={() => navigate('/auth')} className="text-primary font-semibold cursor-pointer hover:underline">Log in</span>
      </p>
    </div>
  );
};

export default Signup;