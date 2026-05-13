"use client";

import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Users, MessageSquare, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ListSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Messages = () => {
  const navigate = useNavigate();
  const { chats, refreshChats, currentUser, deleteChat, leaveGroup } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setSearchUser] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshChats();
    setIsRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await refreshChats();
        if (supabase && currentUser?.id) {
          const { data } = await supabase
            .from('profiles')
            .select('id, name, avatar_url, title, display_name')
            .neq('id', currentUser.id)
            .limit(20);
          setUsers(data || []);
        }
      } catch (error) {
        console.error("Failed to load initial message data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (currentUser?.id) {
      init();
    }
  }, [currentUser?.id]);

  const filteredChats = useMemo(() => {
    return chats.filter(chat => 
      (chat.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (chat.lastMsg || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [chats, search]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.title || '').toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const handleDelete = async (chat: any) => {
    if (chat.isOwner) return;
    setIsDeleting(chat.id);
    if (chat.isGroup) {
      await leaveGroup(chat.id);
    } else {
      await deleteChat(chat.id);
    }
    setIsDeleting(null);
  };

  return (
    <AppLayout title="Messages">
      <div className="flex h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)] overflow-hidden">
        {/* Chat List Panel */}
        <div className="w-full lg:w-96 xl:w-[400px] border-r border-border flex flex-col bg-background">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  className="w-full pl-9 pr-4 py-2.5 bg-accent/20 border border-border rounded-xl text-sm outline-none focus:ring-2 ring-primary/50" 
                  placeholder="Search chats..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-xl h-10 w-10 shrink-0"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                </Button>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="h-10 w-10 p-0 rounded-xl shadow-lg shadow-primary/20 shrink-0">
                      <Plus size={20} />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md bg-background border-border">
                    <SheetHeader className="pb-4 border-b border-border">
                      <SheetTitle className="text-xl font-bold">New Message</SheetTitle>
                    </SheetHeader>
                    <div className="py-6">
                      <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input 
                          className="w-full pl-9 pr-4 py-3 bg-accent/20 border border-border rounded-xl text-sm outline-none" 
                          placeholder="Search developers..." 
                          value={userSearch}
                          onChange={e => setSearchUser(e.target.value)}
                        />
                      </div>
                      <ScrollArea className="h-[calc(100vh-200px)]">
                        <div className="space-y-2">
                          {filteredUsers.map(u => (
                            <div 
                              key={u.id} 
                              onClick={() => navigate(`/chat/${u.id}`)}
                              className="flex items-center gap-3 p-3 hover:bg-accent/30 rounded-2xl cursor-pointer transition-colors"
                            >
                              <Avatar className="h-12 w-12 border border-border">
                                <AvatarImage src={u.avatar_url} />
                                <AvatarFallback>{(u.display_name || u.name || '?')[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{u.display_name || u.name}</h4>
                                <p className="text-xs text-muted-foreground truncate">{u.title}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-4 pb-10 space-y-1">
              {isLoading ? (
                <ListSkeleton count={8} />
              ) : filteredChats.length > 0 ? (
                filteredChats.map(chat => (
                  <div 
                    key={chat.id} 
                    className="flex items-center gap-4 p-4 hover:bg-accent/30 rounded-2xl cursor-pointer transition-all group relative"
                    onClick={() => navigate(`/chat/${chat.targetId}${chat.isGroup ? '?group=true' : ''}`)}
                  >
                    <div className="relative">
                      <Avatar className="h-14 w-14 border-2 border-border shadow-sm group-hover:border-primary/30 transition-colors">
                        <AvatarImage src={chat.avatar} />
                        <AvatarFallback>{(chat.name || '?')[0]}</AvatarFallback>
                      </Avatar>
                      {chat.isGroup && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-lg border-2 border-background">
                          <Users size={10} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={chat.unread > 0 ? "font-black truncate text-sm" : "font-bold truncate text-sm"}>
                          {chat.name}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-medium">{chat.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs truncate pr-8 ${chat.unread > 0 ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                          {chat.lastMsg}
                        </p>
                        {chat.unread > 0 && (
                          <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-background border-border rounded-3xl max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Conversation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this chat from your list?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(chat);
                              }} 
                              className="rounded-xl bg-destructive text-destructive-foreground"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState 
                  icon={MessageSquare}
                  title="No messages yet"
                  description="Start a conversation with other developers!"
                  actionLabel="Explore Projects"
                  actionPath="/explore"
                />
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Desktop Placeholder Panel */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-accent/5">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-primary">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-2xl font-black">Your Messages</h3>
            <p className="text-muted-foreground">Select a conversation from the list to start chatting with your team.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;