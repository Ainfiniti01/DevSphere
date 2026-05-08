"use client";

import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Lock, LogOut, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const PrivacySecurity = () => {
  const navigate = useNavigate();
  const { logout, currentUser, setCurrentUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [autoLogout, setAutoLogout] = useState('never');

  useEffect(() => {
    if (currentUser?.notification_settings?.auto_logout) {
      setAutoLogout(currentUser.notification_settings.auto_logout);
    }
  }, [currentUser]);

  const handleUpdatePassword = async () => {
    if (!supabase) return;
    if (!passwords.new || !passwords.confirm) {
      toast.error("Please fill all fields");
      return;
    }
    if (passwords.new.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setPasswords({ new: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoLogoutChange = async (value: string) => {
    if (!supabase || !currentUser) return;
    
    const newSettings = { 
      ...(currentUser.notification_settings || {}), 
      auto_logout: value 
    };
    
    setAutoLogout(value);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_settings: newSettings })
        .eq('id', currentUser.id);

      if (error) throw error;
      setCurrentUser({ ...currentUser, notification_settings: newSettings });
      toast.success(`Auto logout set to ${value === 'never' ? 'Never' : value + ' min'}`);
    } catch (err: any) {
      toast.error("Failed to update preference");
      setAutoLogout(currentUser?.notification_settings?.auto_logout || 'never');
    }
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
              <Input 
                type="password" 
                value={passwords.new} 
                onChange={e => setPasswords({...passwords, new: e.target.value})} 
                className="rounded-xl h-12" 
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input 
                type="password" 
                value={passwords.confirm} 
                onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
                className="rounded-xl h-12" 
                placeholder="••••••••"
              />
            </div>
            <Button onClick={handleUpdatePassword} disabled={loading} className="w-full h-12 mt-2 rounded-xl font-bold">
              {loading ? <Loader2 className="animate-spin" /> : "Update Password"}
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Shield size={16} /> Preferences
          </h3>
          <div className="space-y-4 bg-card p-4 rounded-2xl border border-border">
            <div className="flex items-center justify-between">
              <Label className="font-bold">Auto Logout</Label>
              <Select value={autoLogout} onValueChange={handleAutoLogoutChange}>
                <SelectTrigger className="w-[120px] h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your data is used only to improve your experience on DevSphere. We do not share your personal information with third parties.
              </p>
            </div>
          </div>
        </section>

        <Button 
          variant="destructive" 
          className="w-full h-14 rounded-2xl gap-2 font-bold shadow-sm"
          onClick={() => {
            logout();
            navigate('/auth');
          }}
        >
          <LogOut size={20} /> Sign Out
        </Button>
      </div>
    </MobileLayout>
  );
};

export default PrivacySecurity;