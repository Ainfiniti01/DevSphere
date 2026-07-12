"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2, Bot, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from '@/lib/supabase';
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
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(`devsphere_ai_chat_${projectId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(`devsphere_ai_chat_${projectId}`, JSON.stringify(messages));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, projectId]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
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
          chatHistory: messages
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI Manager');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || "I'm sorry, I couldn't process that request.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("AI Manager Error:", error);
      toast.error(error.message || "Failed to connect to AI Project Manager");
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(`devsphere_ai_chat_${projectId}`);
    toast.success("Chat history cleared");
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
            <p className="text-[10px] text-muted-foreground">Virtual PM for your team</p>
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
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Bot size={24} />
              </div>
              <div className="space-y-1">
                <h5 className="font-bold text-sm">Ask your AI Project Manager</h5>
                <p className="text-xs text-muted-foreground max-w-[250px]">
                  Get roadmaps, task breakdowns, feature suggestions, and architecture advice.
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
            disabled={loading}
          />
          <Button 
            onClick={() => handleSend()} 
            disabled={!input.trim() || loading}
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