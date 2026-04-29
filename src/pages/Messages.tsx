"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus } from 'lucide-react';
import AnythingAIButton from '@/components/AnythingAIButton';

const MOCK_CHATS = [
  { id: 1, name: 'EcoTrack Team', lastMsg: 'Alex: I just pushed the new API...', time: '2m', unread: 3, isGroup: true },
  { id: 2, name: 'Sarah Miller', lastMsg: 'The designs look amazing!', time: '1h', unread: 0, isGroup: false },
  { id: 3, name: 'James Wilson', lastMsg: 'Are you available for a call?', time: '3h', unread: 0, isGroup: false },
  { id: 4, name: 'Nexus Founders', lastMsg: 'Welcome to the team!', time: '1d', unread: 0, isGroup: true },
];

const Messages = () => {
  return (
    <MobileLayout title="Messages">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 mr-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 ring-indigo-500 outline-none" placeholder="Search chats..." />
          </div>
          <button className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100">
            <Plus size={20} />
          </button>
        </div>

        <div className="mb-6">
          <AnythingAIButton className="w-full justify-center py-6 rounded-2xl" />
        </div>

        <div className="space-y-1">
          {MOCK_CHATS.map(chat => (
            <div key={chat.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors">
              <div className="relative">
                <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.name}`} />
                  <AvatarFallback>{chat.name[0]}</AvatarFallback>
                </Avatar>
                {chat.isGroup && (
                  <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-lg border-2 border-white">
                    <Users size={10} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="font-bold text-slate-900 truncate">{chat.name}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">{chat.time}</span>
                </div>
                <p className={`text-sm truncate ${chat.unread > 0 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                  {chat.lastMsg}
                </p>
              </div>
              {chat.unread > 0 && (
                <div className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {chat.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Messages;