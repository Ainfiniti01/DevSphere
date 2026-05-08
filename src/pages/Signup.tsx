"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Gift, CheckCircle2, Link as LinkIcon, MapPin, Briefcase, Code2 } from 'lucide-react';

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
      const savedRef = localStorage.getItem('pending_referral_code');
      if (savedRef) {
        setFormData(prev => ({ ...prev, referralCode: savedRef }));
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    try {
      // 1. Sign up the user
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
        // 2. Create/Update the profile with all details
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          name: formData.name,
          title: formData.title,
          skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ""),
          location: formData.location,
          portfolio_url: formData.portfolio_url,
          updated_at: new Date().toISOString()
        });

        if (profileError) throw profileError;

        // 3. Handle Referral Logic
        const finalRefCode = formData.referralCode || localStorage.getItem('pending_referral_code');
        if (finalRefCode) {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('referral_code', finalRefCode)
            .maybeSingle();

          if (referrer && referrer.id !== data.user.id) {
            await supabase.from('referrals').insert({
              referrer_id: referrer.id,
              referred_user_id: data.user.id,
              referral_code: finalRefCode,
              status: 'joined'
            });

            // Notify Referrer
            await supabase.from('notifications').insert({
              user_id: referrer.id,
              actor_id: data.user.id,
              type: 'request',
              content: `joined DevSphere using your referral link! You earned 10 points.`
            });

            // Award points via RPC
            await supabase.rpc('award_referral_points', {
              p_referrer_id: referrer.id,
              p_referred_user_id: data.user.id,
              p_points: 10,
              p_reason_key: 'Signup Reward'
            });
          }
        }

        localStorage.removeItem('pending_referral_code');
        toast.success("Account created! Please check your email to verify.");
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
        {inviterName && (
          <div className="mt-4 p-3 bg-primary/10 rounded-2xl flex items-center justify-center gap-2 text-primary text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <Gift size={16} /> Invited by {inviterName}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 flex-1 pb-10">
        <div className="space-y-1.5">
          <Label>Full Name</Label>
          <Input 
            required 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="John Doe" 
            className="rounded-xl h-12 bg-accent/20" 
          />
        </div>

        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input 
            type="email" 
            required 
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            placeholder="john@example.com" 
            className="rounded-xl h-12 bg-accent/20" 
          />
        </div>

        <div className="space-y-1.5">
          <Label>Password</Label>
          <div className="relative">
            <Input 
              type={showPassword ? "text" : "password"} 
              required 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              placeholder="••••••••"
              className="rounded-xl h-12 bg-accent/20 pr-10" 
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

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2"><Briefcase size={14} /> Professional Title</Label>
          <Input 
            required 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
            placeholder="e.g. Senior Developer, UI Engineer" 
            className="rounded-xl h-12 bg-accent/20" 
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2"><Code2 size={14} /> Skills (comma separated)</Label>
          <Input 
            required 
            value={formData.skills} 
            onChange={e => setFormData({...formData, skills: e.target.value})} 
            placeholder="React, TypeScript, Node.js" 
            className="rounded-xl h-12 bg-accent/20" 
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2"><MapPin size={14} /> Location</Label>
          <Input 
            required 
            value={formData.location} 
            onChange={e => setFormData({...formData, location: e.target.value})} 
            placeholder="San Francisco, CA" 
            className="rounded-xl h-12 bg-accent/20" 
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2"><LinkIcon size={14} /> Portfolio URL (Optional)</Label>
          <Input 
            value={formData.portfolio_url} 
            onChange={e => setFormData({...formData, portfolio_url: e.target.value})} 
            placeholder="https://myportfolio.com" 
            className="rounded-xl h-12 bg-accent/20" 
          />
        </div>

        <div className="space-y-1.5">
          <Label>Referral Code (Optional)</Label>
          <Input 
            value={formData.referralCode} 
            onChange={e => setFormData({...formData, referralCode: e.target.value})} 
            placeholder="Enter code if you have one" 
            className="rounded-xl h-12 bg-accent/20" 
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-14 mt-6 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20">
          {loading ? <Loader2 className="animate-spin mr-2" /> : "Complete Profile"}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account? <span onClick={() => navigate('/auth')} className="text-primary font-semibold cursor-pointer hover:underline">Sign in</span>
        </p>
      </form>
    </div>
  );
};

export default Signup;