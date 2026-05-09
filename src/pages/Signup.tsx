"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Gift, Link as LinkIcon } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inviterName, setInviterName] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    title: '',
    skills: '',
    location: '',
    portfolio_url: '',
    referralCode: ''
  });

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref }));
      localStorage.setItem('pending_referral_code', ref);
      
      const fetchInviter = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('name')
          .eq('referral_code', ref)
          .maybeSingle();
        if (data) setInviterName(data.name);
      };
      fetchInviter();
    } else {
      const pending = localStorage.getItem('pending_referral_code');
      if (pending) setFormData(prev => ({ ...prev, referralCode: pending }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: fullName },
          redirectTo: window.location.origin
        }
      });

      if (authError) throw authError;

      if (data.user) {
        // 1. Create Profile
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: fullName,
          display_name: fullName, // Ensure display_name is populated
          title: formData.title,
          skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ""),
          location: formData.location,
          portfolio_url: formData.portfolio_url,
          updated_at: new Date().toISOString()
        });

        // 2. Process Referral via Centralized RPC
        const finalRefCode = formData.referralCode || localStorage.getItem('pending_referral_code');
        if (finalRefCode) {
          await supabase.rpc('process_referral_signup', {
            p_referral_code: finalRefCode,
            p_new_user_id: data.user.id
          });
        }

        localStorage.removeItem('pending_referral_code');
        toast.success("Account created! Please check your email.");
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
        {inviterName && (
          <div className="mt-3 p-3 bg-primary/10 rounded-2xl flex items-center justify-center gap-2 text-primary text-sm font-bold">
            <Gift size={16} /> Invited by {inviterName}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>First Name</Label>
            <Input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="John" className="rounded-xl h-12" />
          </div>
          <div className="space-y-1.5">
            <Label>Last Name</Label>
            <Input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Doe" className="rounded-xl h-12" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" className="rounded-xl h-12" />
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <div className="relative">
            <Input type={showPassword ? "text" : "password"} required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="rounded-xl h-12 pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
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
          <Label>Referral Code (Optional)</Label>
          <div className="relative">
            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              value={formData.referralCode} 
              onChange={e => setFormData({...formData, referralCode: e.target.value})} 
              placeholder="Enter code" 
              className="rounded-xl h-12 pl-10" 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="San Francisco, CA" className="rounded-xl h-12" />
        </div>
        <div className="space-y-1.5">
          <Label>Portfolio URL (Optional)</Label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              value={formData.portfolio_url} 
              onChange={e => setFormData({...formData, portfolio_url: e.target.value})} 
              placeholder="https://yourportfolio.com" 
              className="rounded-xl h-12 pl-10" 
            />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full h-14 mt-6 text-lg font-bold rounded-2xl shadow-lg">
          {loading ? <Loader2 className="animate-spin" /> : "Complete Profile"}
        </Button>
      </form>
    </div>
  );
};

export default Signup;