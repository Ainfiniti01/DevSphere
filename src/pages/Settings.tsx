"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Switch } from "@/components/ui/switch";
import { ChevronRight, Shield, Bell, Eye, CreditCard, LogOut, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useApp();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate('/auth');
  };

  if (!mounted) return null;

  return (
    <MobileLayout title="Settings">
      <div className="px-6 py-6 space-y-6">
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          {/* Edit Profile */}
          <button 
            onClick={() => navigate('/edit-profile')}
            className="w-full flex items-center justify-between p-5 hover:bg-accent transition-colors border-b border-border"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><UserCircle size={20} /></div>
              <div className="text-left">
                <h4 className="font-bold text-sm">Edit Profile</h4>
                <p className="text-[11px] text-muted-foreground">Update your personal information</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>

          {/* Notifications */}
          <button 
            onClick={() => navigate('/settings/notifications')}
            className="w-full flex items-center justify-between p-5 hover:bg-accent transition-colors border-b border-border"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Bell size={20} /></div>
              <div className="text-left">
                <h4 className="font-bold text-sm">Notifications</h4>
                <p className="text-[11px] text-muted-foreground">Manage alerts and sounds</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>

          {/* Privacy */}
          <button 
            onClick={() => navigate('/settings/privacy')}
            className="w-full flex items-center justify-between p-5 hover:bg-accent transition-colors border-b border-border"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Shield size={20} /></div>
              <div className="text-left">
                <h4 className="font-bold text-sm">Privacy & Security</h4>
                <p className="text-[11px] text-muted-foreground">Password and data usage</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>

          {/* Appearance */}
          <div className="w-full flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Eye size={20} /></div>
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

          {/* Subscription */}
          <button 
            onClick={() => navigate('/settings/subscription')}
            className="w-full flex items-center justify-between p-5 hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><CreditCard size={20} /></div>
              <div className="text-left">
                <h4 className="font-bold text-sm">Subscription</h4>
                <p className="text-[11px] text-muted-foreground">Manage your pro plan</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">PRO</span>
          </button>
        </div>

        <Button 
          variant="destructive"
          onClick={handleLogout}
          className="w-full h-14 flex items-center justify-center gap-2 font-bold rounded-2xl shadow-sm"
        >
          <LogOut size={20} />
          Sign Out
        </Button>
      </div>
    </MobileLayout>
  );
};

export default Settings;