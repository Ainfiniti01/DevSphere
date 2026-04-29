"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Users } from 'lucide-react'; // Fixed: Added Users import
import { MOCK_CHATS } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';

const Messages = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout title="Messages">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 mr-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:ring-2 ring-indigo-500 outline-none" 
              placeholder="Search chats..." 
            />
          </div>
          <button className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-900/20">
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-1">
          {MOCK_CHATS.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="flex items-center gap-4 p-3 hover:bg-slate-900/50 rounded-2xl cursor-pointer transition-colors"
            >
              <div className="relative">
                <Avatar className="h-14 w-14 border-2 border-slate-800 shadow-sm">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.name}`} />
                  <AvatarFallback>{chat.name[0]}</AvatarFallback>
                </Avatar>
                {chat.isGroup && (
                  <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-lg border-2 border-[#0f172a]">
                    <Users size={10} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="font-bold text-slate-200 truncate">{chat.name}</h4>
                  <span className="text-[10px] text-slate-500 font-medium">{chat.time}</span>
                </div>
                <p className={`text-sm truncate ${chat.unread > 0 ? 'text-slate-100 font-semibold' : 'text-slate-500'}`}>
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