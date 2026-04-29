"use client";

import React, { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Lock, LogOut } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';

const PrivacySecurity = () => {
  const navigate = useNavigate();
  const { logout } = useApp();
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const handleUpdatePassword = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error("Please fill all fields");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    toast.success("Password updated successfully!");
    setPasswords({ current: '', new: '', confirm: '' });
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
              <Label>Current Password or Email</Label>
              <Input type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="rounded-xl" />
            </div>
            <Button onClick={handleUpdatePassword} className="w-full mt-2 rounded-xl">Update Password</Button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Shield size={16} /> Preferences
          </h3>
          <div className="space-y-4 bg-card p-4 rounded-2xl border border-border">
            <div className="flex items-center justify-between">
              <Label>Auto Logout</Label>
              <Select defaultValue="never">
                <SelectTrigger className="w-[120px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your data is used only to improve your experience on DevSphere. We do not share your personal information with third parties.
              </p>
            </div>
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