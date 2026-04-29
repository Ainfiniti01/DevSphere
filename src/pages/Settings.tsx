"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronRight, Shield, Bell, Eye, CreditCard, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useApp();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate('/auth');
  };

  return (
    <MobileLayout title="Settings">
      <div className="px-4 py-6 space-y-6">
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <button className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors border-b border-border">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-accent rounded-xl text-foreground"><Bell size={20} /></div>
              <div className="text-left">
                <h4 className="font-bold text-sm">Notifications</h4>
                <p className="text-[11px] text-muted-foreground">Manage alerts and sounds</p>
              </div>
            </div>
            <Switch defaultChecked />
          </button>

          <button className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors border-b border-border">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-accent rounded-xl text-foreground"><Shield size={20} /></div>
              <div className="text-left">
                <h4 className="font-bold text-sm">Privacy & Security</h4>
                <p className="text-[11px] text-muted-foreground">Password and data usage</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>

          <div className="w-full flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-accent rounded-xl text-foreground"><Eye size={20} /></div>
              <div className="text-left">
                <h4 className="font-bold text-sm">Appearance</h4>
                <p className="text-[11px] text-muted-foreground">Dark mode / Light mode</p>
              </div>
            </div>
            <Switch 
              checked={theme === 'dark'} 
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} 
            />
          </div>

          <button className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-accent rounded-xl text-foreground"><CreditCard size={20} /></div>
              <div className="text-left">
                <h4 className="font-bold text-sm">Subscription</h4>
                <p className="text-[11px] text-muted-foreground">Manage your pro plan</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">COMING SOON</span>
          </button>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 text-destructive font-bold bg-destructive/10 rounded-2xl hover:bg-destructive/20 transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </MobileLayout>
  );
};

export default Settings;