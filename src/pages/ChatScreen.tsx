"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Send, Paperclip, User, Users, MessageSquare, X, Check, CheckCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AppLayout from '@/components/layout/AppLayout';

const ChatScreen = () => {
  const { id } = useParams(); 
  const [searchParams] = useSearchParams();
  const isGroup = searchParams.get('group') === 'true';
  const navigate = useNavigate();
  const { currentUser, markAsRead, resolveName, refreshChats } = useApp();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [chatPartner, setChatPartner] = useState<any>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [partnerLastRead, setPartnerLastRead] = useState<number>(0);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  const isOnline = (lastSeen: string) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 60000;
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!id || !currentUser || !supabase || initRef.current) return;
    
    if (!isGroup && id === currentUser.id) {
      toast.error("You cannot message yourself.");
      navigate('/messages');
      return;
    }

    initRef.current = true;

    const initChat = async () => {
      setLoading(true);
      try {
        let resolvedChatId = null;

        if (isGroup) {
          const { data: project } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .maybeSingle();
          
          setChatPartner(project);

          const { data: chat } = await supabase
            .from('chats')
            .select('id')
            .eq('project_id', id)
            .eq('type', 'group')
            .maybeSingle();
          
          resolvedChatId = chat?.id;
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .maybeSingle();
          
          if (!profile) throw new Error("User profile not found.");
          
          setChatPartner(profile);

          const { data: dmChatId, error: dmError } = await supabase.rpc('get_or_create_dm', {
            user1_id: currentUser.id,
            user2_id: id
          });

          if (dmError) throw dmError;
          resolvedChatId = dmChatId;
        }

        if (resolvedChatId) {
          setChatId(resolvedChatId);
          
          const { data: msgs } = await supabase
            .from('messages')
            .select('*, sender:profiles!messages_sender_id_fkey(id, name, avatar_url, display_name)')
            .eq('chat_id', resolvedChatId)
            .order('created_at', { ascending: true });
          
          setMessages(msgs || []);

          const { data: reads } = await supabase
            .from('chat_reads')
            .select('last_read_at')
            .eq('chat_id', resolvedChatId)
            .neq('user_id', currentUser.id)
            .order('last_read_at', { ascending: false })
            .limit(1);
          
          if (reads && reads.length > 0) {
            setPartnerLastRead(new Date(reads[0].last_read_at).getTime());
          }

          markAsRead(resolvedChatId, isGroup);
          setTimeout(() => scrollToBottom('auto'), 100);
        }
      } catch (err: any) {
        console.error("Chat init error:", err);
        toast.error(err?.message || "Failed to load chat");
        initRef.current = false;
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [id, currentUser?.id, isGroup, navigate, markAsRead]);

  useEffect(() => {
    if (!chatId || !supabase || !currentUser) return;

    const channel = supabase
      .channel(`chat_room_${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, async (payload) => {
        const newMsg = payload.new;
        
        let senderInfo = null;
        if (newMsg.sender_id === currentUser.id) {
          senderInfo = { id: currentUser.id, name: currentUser.name, avatar_url: currentUser.avatar_url, display_name: currentUser.display_name };
        } else {
          const { data } = await supabase.from('profiles').select('id, name, avatar_url, display_name').eq('id', newMsg.sender_id).single();
          senderInfo = data;
        }
        
        const fullMsg = { ...newMsg, sender: senderInfo };

        setMessages(prev => {
          if (prev.some(m => m.id === fullMsg.id)) return prev;
          const optimisticIndex = prev.findIndex(m => 
            m.isOptimistic && 
            m.content === fullMsg.content && 
            m.sender_id === fullMsg.sender_id
          );

          if (optimisticIndex !== -1) {
            const newMessages = [...prev];
            newMessages[optimisticIndex] = fullMsg;
            return newMessages;
          }

          return [...prev, fullMsg];
        });

        markAsRead(chatId, isGroup);
        setTimeout(() => scrollToBottom('smooth'), 100);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_reads',
        filter: `chat_id=eq.${chatId}`
      }, (payload) => {
        const data = payload.new as any;
        if (data.user_id !== currentUser.id) {
          setPartnerLastRead(new Date(data.last_read_at).getTime());
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUser?.id, isGroup, markAsRead]);

  const handleSend = async () => {
    if (!msg.trim() || !supabase || !currentUser || !chatId) return;
    
    const messageData: any = {
      chat_id: chatId,
      sender_id: currentUser.id,
      content: msg.trim(),
      type: 'text',
      status: 'sent',
      is_read: false
    };

    if (isGroup) {
      messageData.project_id = id;
    } else {
      messageData.receiver_id = id;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      ...messageData,
      created_at: new Date().toISOString(),
      sender: { id: currentUser.id, name: currentUser.name, avatar_url: currentUser.avatar_url, display_name: currentUser.display_name },
      isOptimistic: true
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setMsg('');
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      await supabase.from('hidden_chats').delete().match({ user_id: currentUser.id, chat_id: chatId });
      refreshChats();

      const { error } = await supabase.from('messages').insert(messageData);
      if (error) throw error;
    } catch (err) {
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  if (loading) {
    return (
      <AppLayout title="Chat">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm text-muted-foreground mt-4">Loading conversation...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title={isGroup ? chatPartner?.title : resolveName(chatPartner)} 
      showBack
    >
      <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] bg-background max-w-5xl mx-auto overflow-hidden lg:border lg:border-border lg:rounded-[2.5rem] lg:shadow-xl lg:mb-8">
        <header className="px-6 py-4 border-b border-border flex items-center gap-4 bg-card/50 backdrop-blur-md sticky top-0 z-10">
          <div className="relative cursor-pointer" onClick={() => setPreviewAvatar(isGroup ? chatPartner?.thumbnail_url : chatPartner?.avatar_url)}>
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={isGroup ? chatPartner?.thumbnail_url : chatPartner?.avatar_url} />
              <AvatarFallback>{isGroup ? <Users size={24} /> : <User size={24} />}</AvatarFallback>
            </Avatar>
            {!isGroup && isOnline(chatPartner?.last_seen) && (
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 
              className="font-black text-foreground truncate text-base cursor-pointer hover:text-primary transition-colors"
              onClick={() => isGroup ? navigate(`/project/${id}`) : navigate(`/profile/${chatPartner?.id}`)}
            >
              {isGroup ? chatPartner?.title : resolveName(chatPartner)}
            </h4>
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">
              {isGroup ? 'Group Collaboration' : (isOnline(chatPartner?.last_seen) ? 'Active Now' : 'Offline')}
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-accent/5">
          {messages.map((m) => {
            if (m.type === 'system') {
              return (
                <div key={m.id} className="flex justify-center my-6">
                  <span className="px-6 py-2 bg-accent/30 text-muted-foreground text-[11px] font-black rounded-full uppercase tracking-widest border border-border/50">
                    {m.content}
                  </span>
                </div>
              );
            }

            const isMe = m.sender_id === currentUser?.id;
            const isSeen = m.is_read || partnerLastRead >= new Date(m.created_at).getTime();
            
            return (
              <div key={m.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end w-full`}>
                {!isMe && (
                  <Avatar className="h-10 w-10 border border-border cursor-pointer shrink-0" onClick={() => navigate(`/profile/${m.sender?.id}`)}>
                    <AvatarImage src={m.sender?.avatar_url} />
                    <AvatarFallback><User size={18} /></AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%] lg:max-w-[70%] min-w-0`}>
                  {!isMe && isGroup && (
                    <span 
                      className="text-[10px] text-muted-foreground mb-1.5 ml-1 font-black cursor-pointer hover:text-primary truncate max-w-full uppercase tracking-wider"
                      onClick={() => navigate(`/profile/${m.sender?.id}`)}
                    >
                      {resolveName(m.sender)}
                    </span>
                  )}
                  <div className={`p-4 pb-8 rounded-3xl text-sm shadow-sm relative min-w-[100px] break-all whitespace-pre-wrap overflow-hidden ${
                    isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card text-foreground border border-border rounded-tl-none'
                  }`}>
                    {m.content}
                    <div className="absolute bottom-2 right-3 flex items-center gap-1.5 opacity-70">
                      <span className="text-[9px] font-bold">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        isSeen ? (
                          <CheckCheck size={14} className="text-blue-400" />
                        ) : (
                          <Check size={14} className="text-white/70" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
              <div className="w-20 h-20 bg-accent/50 rounded-[2rem] flex items-center justify-center mb-6">
                <MessageSquare size={40} />
              </div>
              <p className="text-lg font-bold">No messages yet</p>
              <p className="text-sm">Start the conversation and build something great!</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-card/50 backdrop-blur-md">
          <div className="flex items-center gap-3 bg-accent/20 border border-border rounded-[1.5rem] px-4 py-3 shadow-inner">
            <button className="text-muted-foreground p-1.5 hover:text-primary transition-colors"><Paperclip size={22} /></button>
            <input 
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent border-none outline-none text-base text-foreground placeholder:text-muted-foreground/50"
              placeholder="Type a message..."
            />
            <button 
              onClick={handleSend} 
              disabled={!msg.trim() || !chatId} 
              className="bg-primary text-primary-foreground p-3 rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={!!previewAvatar} onOpenChange={() => setPreviewAvatar(null)}>
        <DialogContent className="bg-transparent border-none shadow-none p-0 max-w-full flex items-center justify-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Avatar Preview</DialogTitle>
            <DialogDescription>Full size view of the profile picture</DialogDescription>
          </DialogHeader>
          <div className="relative group">
            <img src={previewAvatar || ''} className="max-w-[90vw] max-h-[80vh] rounded-[2.5rem] shadow-2xl border-4 border-white/10 object-contain" />
            <button onClick={() => setPreviewAvatar(null)} className="absolute -top-4 -right-4 bg-white text-black p-2.5 rounded-full shadow-xl hover:scale-110 transition-transform"><X size={24} /></button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ChatScreen;