"use client";

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Switch } from "@/components/ui/switch";
import { Bell, MessageSquare, Rocket, Volume2, Play } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { notificationService, NotificationSoundType } from '@/utils/NotificationService';

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

    if (value) {
      if (key === 'messages') notificationService.play('message', true);
      if (key === 'projects') notificationService.play('project', true);
      if (key === 'sound' || key === 'push') notificationService.play('system', true);
    }

    const { error } = await supabase
      .from('profiles')
      .update({ notification_settings: newSettings })
      .eq('id', currentUser.id);

    if (error) {
      toast.error("Failed to update settings");
      setSettings(settings);
    } else {
      setCurrentUser({ ...currentUser, notification_settings: newSettings });
    }
  };

  const playPreview = (type: NotificationSoundType) => {
    notificationService.play(type, true);
  };

  return (
    <AppLayout title="Notifications" showBack>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Bell size={20} /></div>
              <div>
                <h4 className="font-bold text-sm">Push Notifications</h4>
                <p className="text-[11px] text-muted-foreground">Receive notifications on your device</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary"
                onClick={() => playPreview('system')}
              >
                <Play size={14} fill="currentColor" />
              </Button>
              <Switch checked={settings.push} onCheckedChange={v => updateSetting('push', v)} />
            </div>
          </div>

          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><MessageSquare size={20} /></div>
              <div>
                <h4 className="font-bold text-sm">Messages</h4>
                <p className="text-[11px] text-muted-foreground">Direct and group chat messages</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary"
                onClick={() => playPreview('message')}
              >
                <Play size={14} fill="currentColor" />
              </Button>
              <Switch checked={settings.messages} onCheckedChange={v => updateSetting('messages', v)} />
            </div>
          </div>

          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Rocket size={20} /></div>
              <div>
                <h4 className="font-bold text-sm">Project Activity</h4>
                <p className="text-[11px] text-muted-foreground">Join requests and status updates</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary"
                onClick={() => playPreview('project')}
              >
                <Play size={14} fill="currentColor" />
              </Button>
              <Switch checked={settings.projects} onCheckedChange={v => updateSetting('projects', v)} />
            </div>
          </div>

          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Volume2 size={20} /></div>
              <div>
                <h4 className="font-bold text-sm">Sound</h4>
                <p className="text-[11px] text-muted-foreground">Notification sounds on/off</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary"
                onClick={() => playPreview('system')}
              >
                <Play size={14} fill="currentColor" />
              </Button>
              <Switch checked={settings.sound} onCheckedChange={v => updateSetting('sound', v)} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotificationSettings;