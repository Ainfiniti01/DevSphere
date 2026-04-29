"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, MessageSquare, Rocket, Volume2 } from 'lucide-react';

const NotificationSettings = () => {
  return (
    <MobileLayout title="Notifications">
      <div className="px-6 py-6 space-y-6">
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Bell size={20} /></div>
              <div>
                <h4 className="font-bold text-sm">Push Notifications</h4>
                <p className="text-[11px] text-muted-foreground">Receive notifications on your device</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><MessageSquare size={20} /></div>
              <div>
                <h4 className="font-bold text-sm">Messages</h4>
                <p className="text-[11px] text-muted-foreground">Direct and group chat messages</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Rocket size={20} /></div>
              <div>
                <h4 className="font-bold text-sm">Project Activity</h4>
                <p className="text-[11px] text-muted-foreground">Join requests and status updates</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Volume2 size={20} /></div>
              <div>
                <h4 className="font-bold text-sm">Sound</h4>
                <p className="text-[11px] text-muted-foreground">Notification sounds on/off</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default NotificationSettings;