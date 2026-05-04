"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Send, Paperclip, User, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

const ChatScreen = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isGroup = searchParams.get('group') === 'true';
  const navigate = useNavigate();
  const { currentUser } = useApp();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [chatPartner, setChatPartner] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !currentUser || !supabase) return;

    const fetchChatInfo = async () => {
      if (isGroup) {
        const { data } = await supabase.from('projects').select('*').eq('id', id).single();
        setChatPartner(data);
      } else {
        const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
        setChatPartner(data);
      }
    };

    const fetchMessages = async () => {
      let query = supabase
        .from('messages')
        .select('*, sender:profiles(name, avatar_url)')
        .order('created_at', { ascending: true });

      if (isGroup) {
        query = query.eq('project_id', id);
      } else {
        query = query.or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${currentUser.id})`);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Fetch messages error:", error);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchChatInfo();
    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel(`chat:${id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: isGroup ? `project_id=eq.${id}` : undefined
      }, async (payload) => {
        const newMsg = payload.new;
        
        // For private chats, we need to filter manually since complex filters aren't supported in real-time yet
        if (!isGroup) {
          const isRelevant = (newMsg.sender_id === currentUser.id && newMsg.receiver_id === id) || 
                             (newMsg.sender_id === id && newMsg.receiver_id === currentUser.id);
          if (!isRelevant) return;
        }

        // Fetch sender info for the new message
        const { data: sender } = await supabase.from('profiles').select('name, avatar_url').eq('id', newMsg.sender_id).single();
        setMessages(prev => [...prev, { ...newMsg, sender }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, currentUser?.id, isGroup]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!msg.trim() || !supabase || !currentUser) return;

    const messageData: any = {
      sender_id: currentUser.id,
      content: msg.trim(),
      type: 'text'
    };

    if (isGroup) {
      messageData.project_id = id;
    } else {
      messageData.receiver_id = id;
    }

    const { error } = await supabase.from('messages').insert(messageData);
    
    if (error) {
      toast.error("Failed to send message");
    } else {
      setMsg('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background max-w-md mx-auto border-x border-border">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border flex items-center gap-3 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={isGroup ? chatPartner?.thumbnail_url : chatPartner?.avatar_url} />
          <AvatarFallback>{isGroup ? <Users size={20} /> : <User size={20} />}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground truncate text-sm">{isGroup ? chatPartner?.title : chatPartner?.name}</h4>
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
            {isGroup ? 'Group Chat' : 'Online'}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-accent/5">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length > 0 ? (
          messages.map((m) => {
            const isMe = m.sender_id === currentUser?.id;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && isGroup && (
                  <span className="text-[10px] text-muted-foreground mb-1 ml-1 font-bold">{m.sender?.name}</span>
                )}
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                  isMe 
                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                    : 'bg-card text-foreground border border-border rounded-tl-none'
                }`}>
                  {m.content}
                </div>
                <span className="text-[9px] text-muted-foreground mt-1 px-1">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="text-muted-foreground" size={32} />
            </div>
            <h4 className="font-bold">No messages yet</h4>
            <p className="text-xs text-muted-foreground mt-1">Send a message to start the conversation!</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-center gap-2 bg-accent/20 border border-border rounded-2xl px-3 py-2">
          <button className="text-muted-foreground p-1 hover:text-primary transition-colors">
            <Paperclip size={20} />
          </button>
          <input 
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Type a message..."
          />
          <button 
            onClick={handleSend}
            disabled={!msg.trim()}
            className="bg-primary text-primary-foreground p-2 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;