"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Gift, Link as LinkIcon, MapPin, Briefcase, User, Github, Chrome } from 'lucide-react';

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
    bio: '',
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

  const handleOAuth = async (provider: 'google' | 'github') => {
  if (!supabase) {
    toast.error("Server connection not established.");
    return;
  }

  setLoading(true);

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  } catch (error: any) {
    toast.error(error.message || "Unable to start authentication.");
    setLoading(false);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
  toast.error("Please meet all password requirements.");
  return;
}

if (formData.password !== confirmPassword) {
  toast.error("Your passwords do not match.");
  return;
}
    if (!supabase) return;

    setLoading(true);
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s !== "");

      // Pass ALL profile data into metadata so the DB trigger can handle it
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { 
            full_name: fullName,
            title: formData.title,
            skills: skillsArray,
            bio: formData.bio,
            location: formData.location,
            portfolio_url: formData.portfolio_url
          },
          redirectTo: window.location.origin
        }
      });

      if (authError) throw authError;

      if (data.user) {
        // Process Referral via Centralized RPC
        const finalRefCode = formData.referralCode || localStorage.getItem('pending_referral_code');
        if (finalRefCode) {
          await supabase.rpc('process_referral_signup', {
            p_referral_code: finalRefCode,
            p_new_user_id: data.user.id
          });
        }

        localStorage.removeItem('pending_referral_code');
        toast.success("Account created! Please check your email to confirm.");
        navigate('/auth');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordChecks = [
  {
    label: "At least one uppercase letter (A-Z)",
    valid: /[A-Z]/.test(formData.password),
  },
  {
    label: "At least one lowercase letter (a-z)",
    valid: /[a-z]/.test(formData.password),
  },
  {
    label: "At least one symbol (!@#$...)",
    valid: /[^A-Za-z0-9]/.test(formData.password),
  },
  {
    label: "At least one digit (0-9)",
    valid: /[0-9]/.test(formData.password),
  },
];

const isPasswordValid = passwordChecks.every((check) => check.valid);

const [confirmPassword, setConfirmPassword] = useState("");

const passwordsMatch =
  confirmPassword.length > 0 &&
  formData.password === confirmPassword;

  return (
    <div className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Join DevSphere</h1>
        <p className="text-muted-foreground mt-2">Build your developer identity</p>
        {inviterName && (
          <div className="mt-4 p-3 bg-primary/10 rounded-2xl flex items-center justify-center gap-2 text-primary text-sm font-bold border border-primary/20">
            <Gift size={16} /> Invited by {inviterName}
          </div>
        )}
      </div>

      <div className="space-y-4 mb-8">
  <div className="grid grid-cols-2 gap-3">
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      className="h-12 gap-2 rounded-xl"
      onClick={() => handleOAuth('google')}
    >
      <Chrome size={20} />
      Google
    </Button>

    <Button
      type="button"
      variant="outline"
      disabled={loading}
      className="h-12 gap-2 rounded-xl"
      onClick={() => handleOAuth('github')}
    >
      <Github size={20} />
      GitHub
    </Button>
  </div>

  <div className="relative flex items-center">
    <div className="flex-grow border-t border-border" />
    <span className="px-3 text-xs uppercase text-muted-foreground">
      Or sign up with email
    </span>
    <div className="flex-grow border-t border-border" />
  </div>
</div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1 pb-10">
        <div className="space-y-4">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Account</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="John" className="rounded-xl h-12 bg-accent/10" />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Doe" className="rounded-xl h-12 bg-accent/10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" className="rounded-xl h-12 bg-accent/10" />
          </div>
          <div className="space-y-1.5">
  <Label>Password</Label>

  <div className="relative">
    <Input
      type={showPassword ? "text" : "password"}
      required
      value={formData.password}
      onChange={(e) =>
        setFormData({ ...formData, password: e.target.value })
      }
      className="rounded-xl h-12 pr-10 bg-accent/10"
      autoComplete="new-password"
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>

  {/* Live password requirements */}
{formData.password.length > 0 && (
  <div className="space-y-2 pt-2">
    {passwordChecks.map((check) => (
      <div
        key={check.label}
        className={`flex items-center gap-2 text-xs transition-colors ${
          check.valid ? "text-green-500" : "text-muted-foreground"
        }`}
      >
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
            check.valid
              ? "border-green-500 bg-green-500 text-white"
              : "border-muted-foreground/40"
          }`}
        >
          {check.valid ? "✓" : ""}
        </span>

        <span>{check.label}</span>
      </div>
    ))}
  </div>
)}
</div>

<div className="space-y-1.5">
  <Label>Confirm Password</Label>

  <div className="relative">
    <Input
      type={showPassword ? "text" : "password"}
      required
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      className={`rounded-xl h-12 pr-10 bg-accent/10 ${
        confirmPassword.length > 0
          ? passwordsMatch
            ? "border-green-500 focus-visible:ring-green-500"
            : "border-red-500 focus-visible:ring-red-500"
          : ""
      }`}
      autoComplete="new-password"
      placeholder="Re-enter your password"
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </div>

  {confirmPassword.length > 0 && (
    <p
      className={`text-xs ${
        passwordsMatch ? "text-green-500" : "text-red-500"
      }`}
    >
      {passwordsMatch
        ? "✓ Passwords match"
        : "✗ Passwords do not match"}
    </p>
  )}
</div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Professional</h3>
          <div className="space-y-1.5">
            <Label>Professional Title</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Senior Fullstack Developer" className="rounded-xl h-12 pl-10 bg-accent/10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Skills (comma separated)</Label>
            <Input required value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="React, Node.js, TypeScript" className="rounded-xl h-12 bg-accent/10" />
          </div>
          <div className="space-y-1.5">
            <Label>Bio / About</Label>
            <Textarea required value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Tell us about your journey..." className="rounded-xl min-h-[100px] bg-accent/10" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Location & Links</h3>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="San Francisco, CA" className="rounded-xl h-12 pl-10 bg-accent/10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Portfolio URL (Optional)</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                value={formData.portfolio_url} 
                onChange={e => setFormData({...formData, portfolio_url: e.target.value})} 
                placeholder="https://yourportfolio.com" 
                className="rounded-xl h-12 pl-10 bg-accent/10" 
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full h-14 mt-6 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20">
          {loading ? <Loader2 className="animate-spin" /> : "Complete Profile"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8 pb-10">
        Already have an account? <span onClick={() => navigate('/auth')} className="text-primary font-semibold cursor-pointer hover:underline">Log in</span>
      </p>
    </div>
  );
};

export default Signup;