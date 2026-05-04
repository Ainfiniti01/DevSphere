"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  updatePresence: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchProfile = async (userId: string) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  const updatePresence = useCallback(async () => {
    if (!supabase || !currentUser) return;
    await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', currentUser.id);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!supabase) return;

    const initApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setCurrentUser(profile ? { ...session.user, ...profile } : session.user);
      }

      await refreshProjects();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setCurrentUser(profile ? { ...session.user, ...profile } : session.user);
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

  // Presence Heartbeat
  useEffect(() => {
    if (currentUser) {
      updatePresence();
      const interval = setInterval(updatePresence, 30000); // Every 30s
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, updatePresence]);

  useEffect(() => {
    if (currentUser) {
      refreshNotifications();
      refreshChats();
    }
  }, [currentUser?.id]);

  const refreshProjects = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          creator:profiles!projects_creator_id_fkey(*),
          comments(*, user:profiles(name, avatar_url)),
          likes(user_id),
          project_members(user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformed = data.map(p => ({
        ...p,
        likes: p.likes?.length || 0,
        isLiked: p.likes?.some((l: any) => l.user_id === currentUser?.id),
        skills: p.skills_required || [],
        thumbnail: p.thumbnail_url,
        timestamp: p.created_at,
        members: p.project_members?.map((m: any) => m.user_id) || []
      }));

      setProjects(transformed);
    } catch (error: any) {
      console.error("Refresh projects error:", error);
    }
  };

  const refreshNotifications = async () => {
    if (!supabase || !currentUser) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:profiles(name, avatar_url)')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data);
    } catch (error: any) {
      console.error("Refresh notifications error:", error.message);
    }
  };

  const refreshChats = async () => {
    if (!supabase || !currentUser) return;
    try {
      // Optimized: Fetch only the latest message per conversation
      const { data: memberProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', currentUser.id);
      
      const projectIds = memberProjects?.map(p => p.project_id) || [];
      
      const orFilter = [
        `sender_id.eq.${currentUser.id}`,
        `receiver_id.eq.${currentUser.id}`
      ];
      
      if (projectIds.length > 0) {
        orFilter.push(`project_id.in.(${projectIds.join(',')})`);
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*), receiver:profiles!messages_receiver_id_fkey(*), project:projects(title, thumbnail_url)')
        .or(orFilter.join(','))
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversations = new Map();
      data.forEach(msg => {
        const isGroup = !!msg.project_id;
        const chatId = isGroup ? msg.project_id : (msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id);
        
        if (!chatId || conversations.has(chatId)) return;

        conversations.set(chatId, {
          id: chatId,
          name: isGroup ? msg.project?.title : (msg.sender_id === currentUser.id ? msg.receiver?.name : msg.sender?.name),
          avatar: isGroup ? msg.project?.thumbnail_url : (msg.sender_id === currentUser.id ? msg.receiver?.avatar_url : msg.sender?.avatar_url),
          lastMsg: msg.content,
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: msg.is_read === false && msg.receiver_id === currentUser.id ? 1 : 0,
          isGroup
        });
      });
      
      setChats(Array.from(conversations.values()));
    } catch (error: any) {
      console.error("Refresh chats error:", error.message);
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

    try {
      if (isLiked) {
        await supabase.from('likes').delete().match({ project_id: projectId, user_id: currentUser.id });
      } else {
        await supabase.from('likes').insert({ project_id: projectId, user_id: currentUser.id });
      }
      await refreshProjects();
    } catch (error) {
      toast.error("Failed to update like");
    }
  };

  const addComment = async (projectId: string, text: string) => {
    if (!supabase || !currentUser) {
      toast.error("Please sign in to comment");
      return;
    }

    try {
      const { error } = await supabase.from('comments').insert({
        project_id: projectId,
        user_id: currentUser.id,
        content: text
      });

      if (error) throw error;
      await refreshProjects();
      toast.success("Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
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
      refreshProjects, refreshNotifications, refreshChats,
      updatePresence
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