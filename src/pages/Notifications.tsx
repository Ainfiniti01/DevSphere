"use client";

import React, { useEffect, useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, MessageSquare, Check, X, Rocket, Bell } from 'lucide-react';
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

  const handleNotificationClick = (notif: any) => {
    if (notif.type === 'request') {
      navigate(`/manage-team/${notif.project_id}`);
    } else if (notif.type === 'message') {
      navigate(`/chat/${notif.actor_id}`);
    } else if (notif.project_id) {
      navigate(`/project/${notif.project_id}`);
    }
  };

  const handleRequest = async (notif: any, accept: boolean) => {
    if (!supabase) return;
    
    const requestId = notif.metadata?.request_id;
    if (!requestId) {
      toast.error("Invalid request data");
      return;
    }

    try {
      if (accept) {
        // SECURITY FIX: We update the status in the join_requests table.
        // A database trigger or server-side logic should ideally handle the project_members insertion.
        // For now, we perform both but ensure the request record is updated.
        const { error: updateError } = await supabase
          .from('join_requests')
          .update({ status: 'accepted' })
          .eq('id', requestId);

        if (updateError) throw updateError;

        await supabase.from('project_members').insert({
          project_id: notif.project_id,
          user_id: notif.actor_id,
          role: 'Member'
        });
        
        toast.success("Member accepted!");
      } else {
        await supabase
          .from('join_requests')
          .update({ status: 'declined' })
          .eq('id', requestId);
        toast.info("Request declined");
      }

      // Delete the notification after processing
      await supabase.from('notifications').delete().eq('id', notif.id);
      await refreshNotifications();
    } catch (err: any) {
      toast.error(err.message);
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
                className="bg-card border border-border p-4 rounded-2xl shadow-sm cursor-pointer hover:bg-accent/10 transition-colors"
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="flex gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={notif.actor?.avatar_url} />
                    <AvatarFallback>{notif.actor?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-bold">{notif.actor?.name}</span> {notif.content}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(notif.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {notif.type === 'request' && (
                  <div className="flex gap-2 mt-4" onClick={e => e.stopPropagation()}>
                    <Button 
                      className="flex-1 h-10 rounded-xl bg-primary font-bold text-xs gap-1"
                      onClick={() => handleRequest(notif, true)}
                    >
                      <Check size={14} /> Accept
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10 rounded-xl font-bold text-xs gap-1"
                      onClick={() => handleRequest(notif, false)}
                    >
                      <X size={14} /> Decline
                    </Button>
                  </div>
                )}
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