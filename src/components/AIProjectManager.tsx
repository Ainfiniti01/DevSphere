"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Bot, User, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface AIProjectManagerProps {
  projectId: string;
  projectTitle: string;
}

const AIProjectManager = ({ projectId, projectTitle }: AIProjectManagerProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Hi! I am your dedicated AI Project Manager for **${projectTitle}**. 

I am here to help you and your team successfully deliver this project. You can ask me to:
- Create a **roadmap** or **milestone plan**.
- Break down features into **actionable tasks**.
- Suggest **architecture** or **technology stacks**.
- Explain the project to help **onboard new members**.

How can I assist you today?`,
        timestamp: new Date()
      }
    ]);
  }, [projectTitle]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessageText = input.trim();
    setInput('');
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userMessageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`https://xzmewvnjjzigkcrezf.supabase.co/functions/v1/ai-manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          projectId,
          message: userMessageText,
          chatHistory: messages.map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI Project Manager');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("AI Manager Error:", error);
      toast.error("Failed to connect to AI Project Manager. Please try again.");
      
      // Remove the user message or show error message
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'ai',
          text: "⚠️ Sorry, I encountered an error connecting to the server. Please try sending your message again.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Chat history cleared. I am ready to assist you with **${projectTitle}** again!`,
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[500px] md:h-[600px] bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-accent/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-sm flex items-center gap-1.5">
              AI Project Manager
            </h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Project-Specific Assistant
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={clearHistory}
          title="Clear Chat History"
        >
          <RefreshCw size={14} />
        </Button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-6 bg-accent/5">
        <div className="space-y-6">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div key={msg.id} className={`flex gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'} items-start`}>
                <Avatar className={`h-8 w-8 border ${isAi ? 'border-primary/20 bg-primary/5' : 'border-border'}`}>
                  <AvatarFallback className="text-xs">
                    {isAi ? <Bot size={14} className="text-primary" /> : <User size={14} />}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isAi ? 'items-start' : 'items-end'} max-w-[85%] min-w-0`}>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isAi 
                      ? 'bg-card text-foreground border border-border rounded-tl-none' 
                      : 'bg-primary text-primary-foreground rounded-tr-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-start">
              <Avatar className="h-8 w-8 border border-primary/20 bg-primary/5">
                <AvatarFallback>
                  <Bot size={14} className="text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-card text-foreground border border-border p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-medium">AI is analyzing project context...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about roadmap, tasks, tech stack, or onboarding..."
            className="rounded-xl h-12 bg-accent/10 border-border"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-xl shrink-0"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIProjectManager;