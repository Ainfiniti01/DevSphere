"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Gift, CheckCircle2 } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inviterName, setInviterName] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
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
      
      // Fetch inviter name for a nice UI touch
      const fetchInviter = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('name')
          .eq('referral_code', ref)
          .maybeSingle();
        if (data) setInviterName(data.name);
      };
      fetchInviter();
    }
  }, [searchParams]);

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
          data: { full_name: formData.name },
          redirectTo: window.location.origin
        }
      });

      if (authError) throw authError;

      if (data.user) {
        // 1. Create Profile
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

        if (profileError) throw profileError;

        // 2. Handle Referral Logic
        const finalRefCode = formData.referralCode || localStorage.getItem('pending_referral_code');
        if (finalRefCode) {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', finalRefCode)
            .maybeSingle();

          if (referrer && referrer.id !== data.user.id) {
            // Create referral record
            await supabase.from('referrals').insert({
              referrer_id: referrer.id,
              referred_user_id: data.user.id,
              referral_code: finalRefCode,
              status: 'joined'
            });

            // Award Signup Points (+10)
            await supabase.rpc('award_referral_points', {
              p_referrer_id: referrer.id,
              p_referred_user_id: data.user.id,
              p_points: 10,
              p_reason_key: 'Signup Reward'
            });
          }
        }

        localStorage.removeItem('pending_referral_code');
        toast.success("Account created! Please check your email.");
        navigate('/auth');
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
        {inviterName ? (
          <div className="mt-3 p-3 bg-primary/10 rounded-2xl flex items-center justify-center gap-2 text-primary text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <Gift size={16} />
            Invited by {inviterName}
          </div>
        ) : (
          <p className="text-muted-foreground mt-2">Join the developer community</p>
        )}
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
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2">
            Referral Code <span className="text-[10px] font-normal text-muted-foreground">(Optional)</span>
          </Label>
          <div className="relative">
            <Input 
              value={formData.referralCode} 
              onChange={e => setFormData({...formData, referralCode: e.target.value})} 
              placeholder="DEV-XXXXX" 
              className={`rounded-xl h-12 pl-10 ${formData.referralCode ? 'border-primary bg-primary/5' : ''}`}
            />
            <Gift className={`absolute left-3 top-1/2 -translate-y-1/2 ${formData.referralCode ? 'text-primary' : 'text-muted-foreground'}`} size={18} />
            {formData.referralCode && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" size={18} />}
          </div>
          {formData.referralCode && <p className="text-[10px] text-primary font-bold px-1">Referral code applied!</p>}
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