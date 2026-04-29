"use client";

import React, { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Lock, LogOut, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const PrivacySecurity = () => {
  const navigate = useNavigate();
  const { logout } = useApp();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });

  const handleUpdatePassword = async () => {
    if (!supabase) return;
    if (!passwords.new || !passwords.confirm) {
      toast.error("Please fill all fields");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      setPasswords({ new: '', confirm: '' });
    }
    setLoading(false);
  };

  return (
    <MobileLayout title="Privacy & Security" showBack>
      <div className="px-6 py-6 space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Lock size={16} /> Change Password
          </h3>
          <div className="space-y-3 bg-card p-4 rounded-2xl border border-border">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="rounded-xl" />
            </div>
            <Button onClick={handleUpdatePassword} disabled={loading} className="w-full mt-2 rounded-xl">
              {loading ? <Loader2 className="animate-spin" /> : "Update Password"}
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Shield size={16} /> Data Privacy
          </h3>
          <div className="space-y-4 bg-card p-4 rounded-2xl border border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your data is used only to improve your experience on DevSphere. We do not share your personal information with third parties.
            </p>
          </div>
        </section>

        <Button 
          variant="destructive" 
          className="w-full h-14 rounded-2xl gap-2 font-bold"
          onClick={() => {
            logout();
            navigate('/auth');
          }}
        >
          <LogOut size={20} /> Logout
        </Button>
      </div>
    </MobileLayout>
  );
};

export default PrivacySecurity;