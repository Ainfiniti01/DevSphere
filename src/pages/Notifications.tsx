"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, UserPlus, Star, Rocket } from 'lucide-react';

const NOTIFS = [
  { id: 1, type: 'request', user: 'Sarah Miller', content: 'requested to join EcoTrack', time: '2m ago', icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 2, type: 'message', user: 'James Wilson', content: 'sent you a message', time: '1h ago', icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 3, type: 'update', user: 'Nexus', content: 'posted a new project update', time: '3h ago', icon: Rocket, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 4, type: 'badge', user: 'System', content: 'You earned the "Early Adopter" badge!', time: '1d ago', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const Notifications = () => {
  return (
    <MobileLayout title="Notifications">
      <div className="px-4 py-4 space-y-1">
        {NOTIFS.map(notif => (
          <div key={notif.id} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors border-b border-slate-50 last:border-0">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.user}`} />
                <AvatarFallback>{notif.user[0]}</AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 p-1 rounded-lg border-2 border-white ${notif.bg} ${notif.color}`}>
                <notif.icon size={12} />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-900">
                <span className="font-bold">{notif.user}</span> {notif.content}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{notif.time}</p>
              
              {notif.type === 'request' && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="bg-indigo-600 h-8 px-4 rounded-lg text-xs">Accept</Button>
                  <Button size="sm" variant="outline" className="h-8 px-4 rounded-lg text-xs">Decline</Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </MobileLayout>
  );
};

export default Notifications;