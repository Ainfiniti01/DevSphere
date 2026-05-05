"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  unreadChatsCount: number;
  unreadNotificationsCount: number;
  logout: () => void;
  toggleLike: (projectId: string) => Promise<void>;
  addComment: (projectId: string, text: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshChats: () => Promise<void>;
  markAsRead: (chatId: string, isGroup: boolean) => Promise<void>;
  updatePresence: () => Promise<void>;
  resolveName: (user: any) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  
  const processingLikes = useRef<Set<string>>(new Set());

  const resolveName = (user: any) => {
    if (!user) return "User";
    return user.display_name || user.name || user.full_name || (user.email ? user.email.split('@')[0] : `User_${user.id?.slice(0, 4)}`);
  };

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
    try {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', currentUser.id);
    } catch (e) {
      // Silent fail for presence
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
          comments(*, user:profiles(name, avatar_url, display_name)),
          likes(user_id),
          project_members(user:profiles(*))
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
        members: p.project_members?.map((m: any) => m.user?.id) || [],
        memberProfiles: p.project_members?.map((m: any) => m.user) || []
      }));

      setProjects(transformed);

      // Fixed: Using explicit relationship hint to resolve PGRST200 error
      const { data: reqData, error: reqError } = await supabase
        .from('join_requests')
        .select('*, user:profiles!user_id(*)');
      
      if (!reqError && reqData) {
        setRequests(reqData);
      } else if (reqError) {
        console.error("Refresh join_requests error:", reqError);
      }
    } catch (error: any) {
      console.error("Refresh projects error:", error);
    }
  };

  const refreshNotifications = async () => {
    if (!supabase || !currentUser?.id) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:profiles!notifications_actor_id_fkey(name, avatar_url, display_name)')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadNotificationsCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error: any) {
      console.error("Refresh notifications error:", error.message);
    }
  };

  const refreshChats = async () => {
    if (!supabase || !currentUser?.id) return;
    try {
      const { data: readData, error: readError } = await supabase
        .from('chat_reads')
        .select('*')
        .eq('user_id', currentUser.id);
      
      if (readError) {
        console.error("CRITICAL: Failed to fetch chat_reads.", readError);
        return;
      }

      const readMap = new Map(readData?.map(r => [r.chat_id, new Date(r.last_read_at).getTime()]) || []);

      const { data: memberProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', currentUser.id);
      
      const projectIds = memberProjects?.map(p => p.project_id) || [];
      
      const orFilter = [
        `sender_id.eq.${currentUser.id}`,
        `receiver_id.eq.${currentUser.id}`
      ];
      if (projectIds.length > 0) orFilter.push(`project_id.in.(${projectIds.join(',')})`);

      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(name, avatar_url, display_name), receiver:profiles!messages_receiver_id_fkey(name, avatar_url, display_name), project:projects(title, thumbnail_url)')
        .or(orFilter.join(','))
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversations = new Map();

      data?.forEach(msg => {
        const isGroup = !!msg.project_id;
        const chatId = isGroup ? msg.project_id : (msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id);
        
        if (!chatId) return;

        const lastRead = readMap.get(chatId) || 0;
        const isUnread = msg.sender_id !== currentUser.id && new Date(msg.created_at).getTime() > lastRead;

        if (!conversations.has(chatId)) {
          conversations.set(chatId, {
            id: chatId,
            name: isGroup ? msg.project?.title : resolveName(msg.sender_id === currentUser.id ? msg.receiver : msg.sender),
            avatar: isGroup ? msg.project?.thumbnail_url : (msg.sender_id === currentUser.id ? msg.receiver?.avatar_url : msg.sender?.avatar_url),
            lastMsg: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: isUnread ? 1 : 0,
            isGroup,
            lastTimestamp: new Date(msg.created_at).getTime()
          });
        } else {
          const chat = conversations.get(chatId);
          if (isUnread) {
            chat.unread++;
          }
        }
      });
      
      const sortedChats = Array.from(conversations.values()).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
      const totalUnreadChats = sortedChats.filter(c => c.unread > 0).length;

      setChats(sortedChats);
      setUnreadChatsCount(totalUnreadChats);
    } catch (error: any) {
      console.error("Refresh chats error:", error.message);
    }
  };

  const markAsRead = async (chatId: string, isGroup: boolean) => {
    if (!supabase || !currentUser?.id) return;
    
    setChats(prev => {
      const updated = prev.map(c => c.id === chatId ? { ...c, unread: 0 } : c);
      const newGlobalCount = updated.filter(c => c.unread > 0).length;
      setUnreadChatsCount(newGlobalCount);
      return updated;
    });

    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from('chat_reads').upsert({
        user_id: currentUser.id,
        chat_id: chatId,
        last_read_at: now
      }, { onConflict: 'user_id,chat_id' });

      if (error) throw error;

      if (!isGroup) {
        await supabase
          .from('messages')
          .update({ is_read: true, status: 'seen' })
          .eq('sender_id', chatId)
          .eq('receiver_id', currentUser.id)
          .eq('is_read', false);
      }
    } catch (error) {
      console.error("CRITICAL: markAsRead failed. Reverting UI state.", error);
      refreshChats();
    }
  };

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
          setUnreadChatsCount(0);
          setUnreadNotificationsCount(0);
        }
      });

      return () => subscription.unsubscribe();
    };

    initApp();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      updatePresence();
      const interval = setInterval(updatePresence, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, updatePresence]);

  useEffect(() => {
    if (currentUser?.id) {
      refreshNotifications();
      refreshChats();
      
      const channel = supabase
        .channel('global-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => refreshChats())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => refreshNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_reads' }, () => refreshChats())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'join_requests' }, () => refreshProjects())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser?.id]);

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCurrentUser(null);
    toast.success("Logged out successfully");
  };

  const toggleLike = async (projectId: string) => {
    if (!supabase || !currentUser?.id) {
      toast.error("Please sign in to like projects");
      return;
    }

    if (processingLikes.current.has(projectId)) return;
    processingLikes.current.add(projectId);

    const project = projects.find(p => p.id === projectId);
    const isLiked = project?.isLiked;

    try {
      if (isLiked) {
        await supabase.from('likes').delete().match({ project_id: projectId, user_id: currentUser.id });
      } else {
        const { error } = await supabase.from('likes').insert({ project_id: projectId, user_id: currentUser.id });
        if (error && error.code !== '23505') throw error;
      }
      await refreshProjects();
    } catch (error) {
      console.error("Like error:", error);
      toast.error("Failed to update like");
    } finally {
      processingLikes.current.delete(projectId);
    }
  };

  const addComment = async (projectId: string, text: string) => {
    if (!supabase || !currentUser?.id) {
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
      unreadChatsCount,
      unreadNotificationsCount,
      logout, toggleLike, addComment,
      refreshProjects, refreshNotifications, refreshChats,
      markAsRead,
      updatePresence, resolveName
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