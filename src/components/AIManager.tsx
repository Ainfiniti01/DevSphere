"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2, Bot, RefreshCw, HelpCircle, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface AIManagerProps {
  projectId: string;
}

const SUGGESTIONS = [
  "Create a 3-month roadmap",
  "Suggest 5 key features",
  "Break down tasks for an MVP",
  "What tech stack do you recommend?"
];

const AIManager = ({ projectId }: AIManagerProps) => {
  const { currentUser, projects, requests } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const project = projects.find(p => p.id === projectId);

  const userRole = React.useMemo(() => {
    if (!project || !currentUser) return 'visitor';
    if (currentUser.is_admin) return 'admin';
    if (project.creator_id === currentUser.id) return 'owner';
    if (project.myMembershipStatus === 'active') return 'member';
    const req = requests.find(r => r.project_id === projectId && r.user_id === currentUser.id);
    if (req?.status === 'pending') return 'applicant';
    return 'visitor';
  }, [project, currentUser, requests, projectId]);

  const isVisitor = userRole === 'visitor' || userRole === 'applicant';
  const membershipStatus = project?.myMembershipStatus || 'none';

  const permissions = React.useMemo(() => {
    const isOwner = userRole === 'owner';
    const isAdmin = userRole === 'admin';
    const isMember = userRole === 'member';
    const isApplicant = userRole === 'applicant';
    
    return {
      canManage: isOwner || isAdmin,
      canJoin: !isOwner && !isAdmin && !isMember && !isApplicant,
      canInvite: isOwner || isAdmin || isMember
    };
  }, [userRole]);

  // Load chat history
  useEffect(() => {
    if (!supabase || !currentUser) return;

    if (isVisitor) {
      // Visitors get a clean temporary session
      setMessages([]);
      setLoadingHistory(false);
      return;
    }

    // Founders and Members load from the shared database table
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('ai_messages')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const formatted = (data || []).map((m: any) => ({
          id: m.id,
          sender: m.sender_role as 'user' | 'ai',
          text: m.text,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        setMessages(formatted);
      } catch (err) {
        console.error("Failed to load AI chat history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();

    // Subscribe to real-time updates for the shared AI workspace
    const channel = supabase
      .channel(`ai_chat_${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_messages',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        const newMsg = payload.new as any;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, {
            id: newMsg.id,
            sender: newMsg.sender_role as 'user' | 'ai',
            text: newMsg.text,
            timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, currentUser, isVisitor]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    const tempId = `temp-${Date.now()}`;
    const userMessage: Message = {
      id: tempId,
      sender: 'user',
      text: messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // 1. If Founder/Member, save user message to database
      if (!isVisitor && supabase && currentUser) {
        await supabase.from('ai_messages').insert({
          project_id: projectId,
          sender_id: currentUser.id,
          sender_role: 'user',
          text: messageText.trim()
        });
      }

      // 2. Call Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://xzmewvnjjljzigkcrezf.supabase.co/functions/v1/project-manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          projectId,
          message: messageText.trim(),
          chatHistory: messages,
          userRole,
          membershipStatus,
          permissions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI Manager');
      }

      const data = await response.json();
      const aiReply = data.reply || "I'm sorry, I couldn't process that request.";

      // 3. If Founder/Member, save AI response to database
      if (!isVisitor && supabase && currentUser) {
        await supabase.from('ai_messages').insert({
          project_id: projectId,
          sender_id: currentUser.id,
          sender_role: 'ai',
          text: aiReply
        });
      } else {
        // Visitors just append to local state
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error: any) {
      console.error("AI Manager Error:", error);
      toast.error(error.message || "Failed to connect to AI Project Manager");
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (isVisitor) {
      setMessages([]);
      toast.success("Temporary session cleared");
      return;
    }

    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('ai_messages')
        .delete()
        .eq('project_id', projectId);

      if (error) throw error;
      setMessages([]);
      toast.success("Shared chat history cleared");
    } catch (err) {
      toast.error("Failed to clear chat history");
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-accent/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-sm">AI Project Manager</h4>
            <p className="text-[10px] text-muted-foreground">
              {isVisitor ? "Temporary Session (Private)" : "Shared Team Workspace"}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <RefreshCw size={14} />
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6">
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground mt-2">Loading workspace...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Bot size={24} />
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm">Ask your AI Project Manager</h5>
                  <p className="text-xs text-muted-foreground max-w-[250px]">
                    {isVisitor 
                      ? "Ask questions about this project. Your temporary session is private and will not be saved."
                      : "Get roadmaps, task breakdowns, feature suggestions, and architecture advice."}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full max-w-xs pt-2">
                  {SUGGESTIONS.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(suggestion)}
                      className="text-left px-4 py-2.5 bg-accent/20 hover:bg-accent/40 border border-border rounded-xl text-xs font-medium transition-colors flex items-center gap-2"
                    >
                      <HelpCircle size={12} className="text-primary shrink-0" />
                      <span className="truncate">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ai' && (
                  <Avatar className="h-8 w-8 border border-border shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary"><Bot size={16} /></AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-accent/30 text-foreground border border-border rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 px-1">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 border border-border shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary"><Bot size={16} /></AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <div className="bg-accent/30 border border-border p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-accent/5">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about roadmap, tasks, features..."
            className="rounded-xl bg-background border-border h-11 text-xs"
            disabled={loading || loadingHistory}
          />
          <Button 
            onClick={() => handleSend()} 
            disabled={!input.trim() || loading || loadingHistory}
            className="h-11 w-11 rounded-xl shrink-0"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIManager;