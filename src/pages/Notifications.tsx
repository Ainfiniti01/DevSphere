"use client";

import React, { useEffect, useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, MessageSquare, Check, X, Rocket, Bell, Heart, MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, refreshNotifications, currentUser } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await refreshNotifications();
      setIsLoading(false);
    };
    init();
  }, []);

  const handleNotificationClick = async (notif: any) => {
    // Mark as read
    if (!notif.is_read && supabase) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
    }

    if (notif.type === 'request') {
      navigate(`/manage-team/${notif.project_id}`);
    } else if (notif.type === 'message') {
      navigate(`/chat/${notif.actor_id}`);
    } else if (notif.type === 'reply') {
      navigate(`/project/${notif.project_id}?comment=${notif.comment_id}`);
    } else if (notif.type === 'comment' || notif.type === 'like') {
      navigate(`/project/${notif.project_id}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={12} className="text-red-500 fill-red-500" />;
      case 'comment': return <MessageCircle size={12} className="text-blue-500" />;
      case 'reply': return <MessageSquare size={12} className="text-indigo-500" />;
      case 'request': return <UserPlus size={12} className="text-primary" />;
      default: return <Bell size={12} className="text-muted-foreground" />;
    }
  };

  return (
    <MobileLayout title="Notifications" showBack>
      <div className="px-4 py-4 space-y-6">
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`bg-card border border-border p-4 rounded-2xl shadow-sm cursor-pointer hover:bg-accent/10 transition-colors relative ${!notif.is_read ? 'border-primary/30 bg-primary/5' : ''}`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={notif.actor?.avatar_url} />
                      <AvatarFallback>{notif.actor?.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-border shadow-sm">
                      {getIcon(notif.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-bold">{notif.actor?.name}</span> {notif.content || 'interacted with you'}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(notif.created_at).toLocaleDateString()}</p>
                  </div>
                  {!notif.is_read && <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-accent/50 rounded-full flex items-center justify-center mb-4">
              <Bell className="text-muted-foreground" size={32} />
            </div>
            <h4 className="text-lg font-bold">No notifications</h4>
            <p className="text-sm text-muted-foreground mt-1">We'll let you know when something happens.</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Notifications;