"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    title: '',
    skills: '',
    location: '',
    portfolio: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error("Server connection not established. Please rebuild.");
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          name: formData.name,
          title: formData.title,
          skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ""),
          location: formData.location,
          portfolio_url: formData.portfolio
        });

        if (profileError) throw profileError;
        
        toast.success("Account created! Please check your email for confirmation.");
        navigate('/auth');
      }
    } catch (error: any) {
      toast.error(error.message);
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
          <Input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="rounded-xl h-12" />
        </div>
        <div className="space-y-1.5">
          <Label>Professional Title</Label>
          <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Senior Developer" className="rounded-xl h-12" />
        </div>
        <div className="space-y-1.5">
          <Label>Skills (comma separated)</Label>
          <Input required value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="React, TypeScript" className="rounded-xl h-12" />
        </div>
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="San Francisco, CA" className="rounded-xl h-12" />
        </div>
        <div className="space-y-1.5">
          <Label>Portfolio URL (Optional)</Label>
          <Input value={formData.portfolio} onChange={e => setFormData({...formData, portfolio: e.target.value})} placeholder="https://myportfolio.com" className="rounded-xl h-12" />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-14 mt-6 text-lg font-bold rounded-2xl shadow-lg">
          {loading ? "Creating Account..." : "Complete Profile"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Already have an account? <span onClick={() => navigate('/auth')} className="text-primary font-semibold cursor-pointer hover:underline">Log in</span>
      </p>
    </div>
  );
};

export default Signup;