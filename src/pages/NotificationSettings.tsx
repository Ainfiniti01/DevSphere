"use client";

import React, { useState, useEffect } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Switch } from "@/components/ui/switch";
import { Bell, MessageSquare, Rocket, Volume2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const NotificationSettings = () => {
  const { currentUser, setCurrentUser } = useApp();
  const [settings, setSettings] = useState({
    push: true,
    messages: true,
    projects: true,
    sound: true
  });

  useEffect(() => {
    if (currentUser?.notification_settings) {
      setSettings(currentUser.notification_settings);
    }
  }, [currentUser]);

  const updateSetting = async (key: string, value: boolean) => {
    if (!supabase || !currentUser) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    const { error } = await supabase
      .from('profiles')
      .update({ notification_settings: newSettings })
      .eq('id', currentUser.id);

    if (error) {
      toast.error("Failed to update settings");
      setSettings(settings); // Revert
    } else {
      setCurrentUser({ ...currentUser, notification_settings: newSettings });
    }
  };

  return (
    <MobileLayout title="Notifications" showBack>
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
            <Switch checked={settings.push} onCheckedChange={v => updateSetting('push', v)} />
          </div>

          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><MessageSquare size={20} /></div>
              <div>
                <h4 className="font-bold text-sm">Messages</h4>
                <p className="text-[11px] text-muted-foreground">Direct and group chat messages</p>
              </div>
            </div>
            <Switch checked={settings.messages} onCheckedChange={v => updateSetting('messages', v)} />
          </div>

          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Rocket size={20} /></div>
              <div>
                <h4 className="font-bold text-sm">Project Activity</h4>
                <p className="text-[11px] text-muted-foreground">Join requests and status updates</p>
              </div>
            </div>
            <Switch checked={settings.projects} onCheckedChange={v => updateSetting('projects', v)} />
          </div>

          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Volume2 size={20} /></div>
              <div>
                <h4 className="font-bold text-sm">Sound</h4>
                <p className="text-[11px] text-muted-foreground">Notification sounds on/off</p>
              </div>
            </div>
            <Switch checked={settings.sound} onCheckedChange={v => updateSetting('sound', v)} />
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default NotificationSettings;