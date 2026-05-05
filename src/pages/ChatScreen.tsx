"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Send, Paperclip, User, Users, X, Check, CheckCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const ChatScreen = () => {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const { currentUser, markAsRead, resolveName } = useApp();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [chatMeta, setChatMeta] = useState<any>(null);
  const [partnerLastRead, setPartnerLastRead] = useState<number>(0);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOnline = (lastSeen: string) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < 40000;
  };

  useEffect(() => {
    if (chatId && currentUser) {
      markAsRead(chatId);
    }
  }, [chatId, currentUser?.id, messages.length]);

  useEffect(() => {
    if (!chatId || !currentUser || !supabase) return;

    const fetchChatData = async () => {
      try {
        // 1. Get Chat Metadata
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .select('*, project:projects(title, thumbnail_url)')
          .eq('id', chatId)
          .single();

        if (chatError) throw chatError;

        // 2. Get Partner Info if DM
        if (chat.type === 'dm') {
          const { data: partner } = await supabase
            .from('chat_members')
            .select('user:profiles(*)')
            .eq('chat_id', chatId)
            .neq('user_id', currentUser.id)
            .single();
          
          chat.partner = partner?.user;
        }
        setChatMeta(chat);

        // 3. Get Messages (Paginated)
        const { data: msgs, error: msgError } = await supabase
          .from('messages')
          .select('*, sender:profiles(id, name, avatar_url, display_name)')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (msgError) throw msgError;
        setMessages(msgs || []);

        // 4. Get Partner's Last Read
        const { data: reads } = await supabase
          .from('chat_reads')
          .select('last_read_at')
          .eq('chat_id', chatId)
          .neq('user_id', currentUser.id)
          .order('last_read_at', { ascending: false })
          .limit(1);
        
        if (reads && reads.length > 0) {
          setPartnerLastRead(new Date(reads[0].last_read_at).getTime());
        }
      } catch (err: any) {
        console.error("Chat fetch error:", err);
        toast.error("Failed to load chat");
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();

    // Real-time subscription PER CHAT
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, async (payload) => {
        const newMsg = payload.new;
        
        // Fetch sender profile if not me
        let senderInfo = null;
        if (newMsg.sender_id === currentUser.id) {
          senderInfo = { id: currentUser.id, name: currentUser.name, avatar_url: currentUser.avatar_url, display_name: currentUser.display_name };
        } else {
          const { data } = await supabase.from('profiles').select('id, name, avatar_url, display_name').eq('id', newMsg.sender_id).single();
          senderInfo = data;
        }
        
        setMessages(prev => {
          const exists = prev.some(m => m.id === newMsg.id);
          if (exists) return prev;
          return [...prev, { ...newMsg, sender: senderInfo }];
        });
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
  }, [chatId, currentUser?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!msg.trim() || !supabase || !currentUser || !chatId) return;
    
    const messageData = {
      chat_id: chatId,
      sender_id: currentUser.id,
      content: msg.trim(),
      type: 'text'
    };

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      ...messageData,
      created_at: new Date().toISOString(),
      sender: { id: currentUser.id, name: currentUser.name, avatar_url: currentUser.avatar_url, display_name: currentUser.display_name },
      isOptimistic: true
    }]);

    setMsg('');
    
    const { error } = await supabase.from('messages').insert(messageData);
    if (error) {
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background max-w-md mx-auto border-x border-border items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const isGroup = chatMeta?.type === 'group';
  const partner = chatMeta?.partner;
  const title = isGroup ? chatMeta?.project?.title : resolveName(partner);
  const avatar = isGroup ? chatMeta?.project?.thumbnail_url : partner?.avatar_url;

  return (
    <div className="flex flex-col h-screen bg-background max-w-md mx-auto border-x border-border overflow-hidden">
      <header className="px-4 py-3 border-b border-border flex items-center gap-3 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="relative cursor-pointer" onClick={() => setPreviewAvatar(avatar)}>
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={avatar} />
            <AvatarFallback>{isGroup ? <Users size={20} /> : <User size={20} />}</AvatarFallback>
          </Avatar>
          {!isGroup && isOnline(partner?.last_seen) && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground truncate text-sm">
            {title}
          </h4>
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
            {isGroup ? 'Group Chat' : (isOnline(partner?.last_seen) ? 'Online' : 'Offline')}
          </p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-accent/5">
        {messages.map((m) => {
          const isMe = m.sender_id === currentUser?.id;
          const isSeen = partnerLastRead >= new Date(m.created_at).getTime();
          
          return (
            <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end w-full`}>
              {!isMe && (
                <Avatar className="h-8 w-8 border border-border shrink-0">
                  <AvatarImage src={m.sender?.avatar_url} />
                  <AvatarFallback><User size={14} /></AvatarFallback>
                </Avatar>
              )}
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] min-w-0`}>
                {!isMe && isGroup && (
                  <span className="text-[10px] text-muted-foreground mb-1 ml-1 font-bold truncate max-w-full">
                    {resolveName(m.sender)}
                  </span>
                )}
                <div className={`p-3 pb-6 rounded-2xl text-sm shadow-sm relative min-w-[80px] break-words whitespace-pre-wrap overflow-hidden ${
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
          <button onClick={handleSend} disabled={!msg.trim()} className="bg-primary text-primary-foreground p-2 rounded-xl shadow-lg disabled:opacity-50"><Send size={18} /></button>
        </div>
      </div>

      <Dialog open={!!previewAvatar} onOpenChange={() => setPreviewAvatar(null)}>
        <DialogContent className="bg-transparent border-none shadow-none p-0 max-w-full flex items-center justify-center">
          <DialogHeader className="sr-only">
            <DialogTitle>Avatar Preview</DialogTitle>
            <DialogDescription>Full size view</DialogDescription>
          </DialogHeader>
          <img src={previewAvatar || ''} className="max-w-[90vw] max-h-[80vh] rounded-3xl shadow-2xl border-4 border-white/10 object-contain" />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatScreen;