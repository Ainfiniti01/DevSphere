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
  const scrollRef = useRef<HTMLDivElement>(null);
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
          
          if (!profile) {
            throw new Error("User profile not found.");
          }
          
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
          // 1. Check if this exact message ID already exists
          if (prev.some(m => m.id === fullMsg.id)) return prev;

          // 2. Check for an optimistic message to replace
          // We match by content and sender_id if it was sent very recently
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
      // Unhide chat for sender immediately
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
      <div className="flex flex-col h-screen bg-background max-w-md mx-auto border-x border-border items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm text-muted-foreground mt-4">Loading conversation...</p>
      </div>
    );
  }

  if (!chatPartner && !loading) {
    return (
      <div className="flex flex-col h-screen bg-background max-w-md mx-auto border-x border-border items-center justify-center p-8 text-center">
        <X size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Chat not found</h2>
        <p className="text-sm text-muted-foreground mt-2">The user or project you are looking for doesn't exist.</p>
        <Button onClick={() => navigate(-1)} className="mt-6 rounded-xl">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background max-w-md mx-auto border-x border-border overflow-hidden">
      <header className="px-4 py-3 border-b border-border flex items-center gap-3 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="relative cursor-pointer" onClick={() => setPreviewAvatar(isGroup ? chatPartner?.thumbnail_url : chatPartner?.avatar_url)}>
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={isGroup ? chatPartner?.thumbnail_url : chatPartner?.avatar_url} />
            <AvatarFallback>{isGroup ? <Users size={20} /> : <User size={20} />}</AvatarFallback>
          </Avatar>
          {!isGroup && isOnline(chatPartner?.last_seen) && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 
            className="font-bold text-foreground truncate text-sm cursor-pointer hover:text-primary transition-colors"
            onClick={() => isGroup ? navigate(`/project/${id}`) : navigate(`/profile/${chatPartner?.id}`)}
          >
            {isGroup ? chatPartner?.title : resolveName(chatPartner)}
          </h4>
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
            {isGroup ? 'Group Chat' : (isOnline(chatPartner?.last_seen) ? 'Online' : 'Offline')}
          </p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-accent/5">
        {messages.map((m) => {
          const isMe = m.sender_id === currentUser?.id;
          const isSeen = m.is_read || partnerLastRead >= new Date(m.created_at).getTime();
          
          return (
            <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end w-full`}>
              {!isMe && (
                <Avatar className="h-8 w-8 border border-border cursor-pointer shrink-0" onClick={() => navigate(`/profile/${m.sender?.id}`)}>
                  <AvatarImage src={m.sender?.avatar_url} />
                  <AvatarFallback><User size={14} /></AvatarFallback>
                </Avatar>
              )}
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] min-w-0`}>
                {!isMe && isGroup && (
                  <span 
                    className="text-[10px] text-muted-foreground mb-1 ml-1 font-bold cursor-pointer hover:text-primary truncate max-w-full"
                    onClick={() => navigate(`/profile/${m.sender?.id}`)}
                  >
                    {resolveName(m.sender)}
                  </span>
                )}
                <div className={`p-3 pb-6 rounded-2xl text-sm shadow-sm relative min-w-[80px] break-all whitespace-pre-wrap overflow-hidden ${
                  isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card text-foreground border border-border rounded-tl-none'
                }`}>
                  {m.content}
                  <div className="absolute bottom-1.5 right-2.5 flex items-center gap-1 opacity-70">
                    <span className="text-[9px]">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      isSeen ? (
                        <CheckCheck size={12} className="text-blue-400" />
                      ) : (
                        <Check size={12} className="text-white/70" />
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
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <MessageSquare size={48} className="mb-4" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-center gap-2 bg-accent/20 border border-border rounded-2xl px-3 py-2">
          <button className="text-muted-foreground p-1 hover:text-primary transition-colors"><Paperclip size={20} /></button>
          <input 
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground"
            placeholder="Type a message..."
          />
          <button onClick={handleSend} disabled={!msg.trim() || !chatId} className="bg-primary text-primary-foreground p-2 rounded-xl shadow-lg disabled:opacity-50"><Send size={18} /></button>
        </div>
      </div>

      <Dialog open={!!previewAvatar} onOpenChange={() => setPreviewAvatar(null)}>
        <DialogContent className="bg-transparent border-none shadow-none p-0 max-w-full flex items-center justify-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Avatar Preview</DialogTitle>
            <DialogDescription>Full size view of the profile picture</DialogDescription>
          </DialogHeader>
          <div className="relative group">
            <img src={previewAvatar || ''} className="max-w-[90vw] max-h-[80vh] rounded-3xl shadow-2xl border-4 border-white/10 object-contain" />
            <button onClick={() => setPreviewAvatar(null)} className="absolute -top-4 -right-4 bg-white text-black p-2 rounded-full shadow-xl"><X size={20} /></button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatScreen;