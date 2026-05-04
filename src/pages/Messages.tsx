"use client";

import React, { useState, useEffect, useMemo } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ListSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

const Messages = () => {
  const navigate = useNavigate();
  const { chats, refreshChats } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        await refreshChats();
      } catch (error) {
        console.error("Failed to load chats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const filteredChats = useMemo(() => {
    return chats.filter(chat => 
      chat.name.toLowerCase().includes(search.toLowerCase()) ||
      chat.lastMsg.toLowerCase().includes(search.toLowerCase())
    );
  }, [chats, search]);

  const handleNewChat = () => {
    toast.info("Select a developer from Explore to start a new chat!");
    navigate('/explore');
  };

  return (
    <MobileLayout title="Messages">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 mr-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              className="w-full pl-9 pr-4 py-2 bg-accent/20 border border-border rounded-xl text-sm outline-none focus:ring-2 ring-primary/50" 
              placeholder="Search chats..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={handleNewChat}
            className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-1">
          {isLoading ? (
            <ListSkeleton count={6} />
          ) : filteredChats.length > 0 ? (
            filteredChats.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => navigate(`/chat/${chat.id}`)}
                className="flex items-center gap-4 p-3 hover:bg-accent/30 rounded-2xl cursor-pointer transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-14 w-14 border-2 border-border shadow-sm">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                  </Avatar>
                  {chat.isGroup && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-lg border-2 border-background">
                      <Users size={10} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-bold truncate">{chat.name}</h4>
                    <span className="text-[10px] text-muted-foreground font-medium">{chat.time}</span>
                  </div>
                  <p className={`text-sm truncate ${chat.unread > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {chat.lastMsg}
                  </p>
                </div>
                {chat.unread > 0 && (
                  <div className="w-5 h-5 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                    {chat.unread}
                  </div>
                )}
              </div>
            ))
          ) : (
            <EmptyState 
              icon={MessageSquare}
              title="No messages yet"
              description={search ? "No chats match your search." : "Start a conversation with other developers!"}
              actionLabel={search ? "Clear Search" : "Explore Projects"}
              actionPath={search ? undefined : "/explore"}
            />
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Messages;