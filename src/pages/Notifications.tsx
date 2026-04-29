"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, MessageSquare, Check, X, Rocket } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

const Notifications = () => {
  const { requests, setRequests, currentUser, setProjects, projects } = useApp();

  // Filter requests for projects owned by the current user
  const myProjectRequests = requests.filter(req => {
    const project = projects.find(p => p.id === req.projectId);
    return project?.creator.id === currentUser?.id && req.status === 'pending';
  });

  const handleRequest = (requestId: string, projectId: string, userId: string, accept: boolean) => {
    if (accept) {
      // Add user to project members
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return { ...p, members: [...(p.members || []), userId] };
        }
        return p;
      }));
      toast.success("Member accepted and added to team!");
    } else {
      toast.info("Request declined");
    }

    // Remove or update request status
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  return (
    <MobileLayout title="Notifications" showBack>
      <div className="px-4 py-4 space-y-6">
        {myProjectRequests.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Join Requests</h3>
            <div className="space-y-3">
              {myProjectRequests.map(req => (
                <div key={req.id} className="bg-card border border-border p-4 rounded-2xl shadow-sm">
                  <div className="flex gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={req.userAvatar} />
                      <AvatarFallback>{req.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-bold">{req.userName}</span> wants to join <span className="font-bold text-primary">{req.projectTitle}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Applied {new Date(req.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="bg-accent/30 p-3 rounded-xl mb-4">
                    <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-tighter">Reason</p>
                    <p className="text-xs italic">"{req.reason}"</p>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 h-10 rounded-xl bg-primary font-bold text-xs gap-1"
                      onClick={() => handleRequest(req.id, req.projectId, req.userId, true)}
                    >
                      <Check size={14} /> Accept
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10 rounded-xl font-bold text-xs gap-1"
                      onClick={() => handleRequest(req.id, req.projectId, req.userId, false)}
                    >
                      <X size={14} /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Recent Activity</h3>
          <div className="space-y-1">
            {[
              { id: 1, user: 'Sarah Miller', content: 'sent you a message', time: '1h ago', icon: MessageSquare, color: 'text-blue-500' },
              { id: 2, user: 'System', content: 'Your project "EcoTrack" is trending!', time: '3h ago', icon: Rocket, color: 'text-orange-500' },
            ].map(notif => (
              <div key={notif.id} className="flex items-center gap-4 p-3 hover:bg-accent/30 rounded-2xl transition-colors">
                <div className={`p-2 rounded-xl bg-accent ${notif.color}`}>
                  <notif.icon size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm"><span className="font-bold">{notif.user}</span> {notif.content}</p>
                  <p className="text-[10px] text-muted-foreground">{notif.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MobileLayout>
  );
};

export default Notifications;