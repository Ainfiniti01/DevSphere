"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AppContextType {
  currentUser: any;
  setCurrentUser: (user: any) => void;
  projects: any[];
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
  requests: any[];
  setRequests: React.Dispatch<React.SetStateAction<any[]>>;
  chats: any[];
  setChats: React.Dispatch<React.SetStateAction<any[]>>;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  logout: () => void;
  toggleLike: (projectId: string) => Promise<void>;
  addComment: (projectId: string, text: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshChats: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!supabase) return;

    const initApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setCurrentUser({ ...session.user, ...profile });
        }
      }

      await refreshProjects();
      if (session?.user) {
        await refreshNotifications();
        await refreshChats();
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setCurrentUser({ ...session.user, ...profile });
          refreshNotifications();
          refreshChats();
        } else {
          setCurrentUser(null);
          setNotifications([]);
          setChats([]);
        }
      });

      return () => subscription.unsubscribe();
    };

    initApp();
  }, []);

  const refreshProjects = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        creator:profiles(*),
        comments(*, user:profiles(name, avatar_url)),
        likes(user_id)
      `)
      .order('created_at', { ascending: false });

    if (error) return;

    const transformed = data.map(p => ({
      ...p,
      likes: p.likes?.length || 0,
      isLiked: p.likes?.some((l: any) => l.user_id === currentUser?.id),
      skills: p.skills_required || [],
      thumbnail: p.thumbnail_url,
      timestamp: p.created_at
    }));

    setProjects(transformed);
  };

  const refreshNotifications = async () => {
    if (!supabase || !currentUser) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:profiles(name, avatar_url)')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (!error) setNotifications(data);
  };

  const refreshChats = async () => {
    if (!supabase || !currentUser) return;
    // Simplified chat fetching: get unique conversations from messages
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(*), receiver:profiles(*)')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false });

    if (!error) {
      // Group by conversation partner
      const conversations = new Map();
      data.forEach(msg => {
        const partner = msg.sender_id === currentUser.id ? msg.receiver : msg.sender;
        if (!partner) return;
        if (!conversations.has(partner.id)) {
          conversations.set(partner.id, {
            id: partner.id,
            name: partner.name,
            avatar: partner.avatar_url,
            lastMsg: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: 0 // Placeholder
          });
        }
      });
      setChats(Array.from(conversations.values()));
    }
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCurrentUser(null);
    toast.success("Logged out successfully");
  };

  const toggleLike = async (projectId: string) => {
    if (!supabase || !currentUser) {
      toast.error("Please sign in to like projects");
      return;
    }

    const project = projects.find(p => p.id === projectId);
    const isLiked = project?.isLiked;

    if (isLiked) {
      await supabase.from('likes').delete().match({ project_id: projectId, user_id: currentUser.id });
    } else {
      await supabase.from('likes').insert({ project_id: projectId, user_id: currentUser.id });
    }
    await refreshProjects();
  };

  const addComment = async (projectId: string, text: string) => {
    if (!supabase || !currentUser) {
      toast.error("Please sign in to comment");
      return;
    }

    const { error } = await supabase.from('comments').insert({
      project_id: projectId,
      user_id: currentUser.id,
      content: text
    });

    if (!error) {
      await refreshProjects();
      toast.success("Comment added!");
    }
  };

  return (
    <AppContext.Provider value={{ 
      currentUser, setCurrentUser, 
      projects, setProjects, 
      requests, setRequests,
      chats, setChats,
      notifications, setNotifications,
      logout, toggleLike, addComment,
      refreshProjects, refreshNotifications, refreshChats
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};