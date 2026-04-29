"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronRight, Shield, Bell, Eye, CreditCard, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();

  const sections = [
    { icon: Bell, label: 'Notifications', desc: 'Manage alerts and sounds' },
    { icon: Shield, label: 'Privacy & Security', desc: 'Password and data usage' },
    { icon: Eye, label: 'Appearance', desc: 'Dark mode and themes' },
    { icon: CreditCard, label: 'Subscription', desc: 'Manage your pro plan' },
  ];

  return (
    <MobileLayout title="Settings">
      <div className="px-4 py-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          {sections.map((item, i) => (
            <button key={item.label} className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${i !== sections.length - 1 ? 'border-b border-slate-50' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                  <item.icon size={20} />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-sm text-slate-900">{item.label}</h4>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold">Push Notifications</Label>
              <p className="text-[11px] text-slate-500">Receive alerts for new messages</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold">Public Profile</Label>
              <p className="text-[11px] text-slate-500">Allow others to find you</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>

        <button 
          onClick={() => navigate('/auth')}
          className="w-full flex items-center justify-center gap-2 p-4 text-red-600 font-bold bg-red-50 rounded-2xl hover:bg-red-100 transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </MobileLayout>
  );
};

export default Settings;