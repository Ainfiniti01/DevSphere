"use client";

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_CHATS } from '@/data/mockData';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Send, Paperclip } from 'lucide-react';

const ChatScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const chat = MOCK_CHATS.find(c => c.id === id) || MOCK_CHATS[0];
  const [msg, setMsg] = useState('');

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] max-w-md mx-auto border-x border-slate-800">
      {/* Header */}
      <header className="px-4 py-3 border-b border-slate-800 flex items-center gap-3 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-slate-400">
          <ChevronLeft size={24} />
        </button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.name}`} />
          <AvatarFallback>{chat.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white truncate">{chat.name}</h4>
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.sender === 'Felix' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              m.sender === 'Felix' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none'
            }`}>
              {m.text}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 bg-[#0f172a]">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2">
          <button className="text-slate-500 p-1">
            <Paperclip size={20} />
          </button>
          <input 
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-600"
            placeholder="Type a message..."
          />
          <button className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-900/20">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;