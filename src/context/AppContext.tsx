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
  refreshProjects: (userOverride?: any) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshChats: () => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  updatePresence: () => Promise<void>;
  resolveName: (user: any) => string;
  getOrCreateDMChat: (partnerId: string) => Promise<string | null>;
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

  const refreshProjects = async (userOverride?: any) => {
    if (!supabase) return;
    const activeUser = userOverride || currentUser;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          creator:profiles!creator_id(*),
          comments(*, user:profiles!user_id(name, avatar_url, display_name)),
          likes(user_id),
          project_members(user:profiles!user_id(*))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformed = data.map(p => ({
        ...p,
        likes: p.likes?.length || 0,
        isLiked: p.likes?.some((l: any) => l.user_id === activeUser?.id),
        skills: p.skills_required || [],
        thumbnail: p.thumbnail_url,
        timestamp: p.created_at,
        members: p.project_members?.map((m: any) => m.user?.id) || [],
        memberProfiles: p.project_members?.map((m: any) => m.user) || []
      }));

      setProjects(transformed);

      if (activeUser?.id) {
        const { data: reqData, error: reqError } = await supabase
          .from('join_requests')
          .select('*, user:profiles!user_id(*)');
        
        if (!reqError) setRequests(reqData || []);
      } else {
        setRequests([]);
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
        .select('*, actor:profiles!actor_id(name, avatar_url, display_name)')
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
      const { data: myMemberships, error: memError } = await supabase
        .from('chat_members')
        .select(`
          chat_id,
          chat:chats (
            id,
            type,
            project_id,
            project:projects (title, thumbnail_url)
          )
        `)
        .eq('user_id', currentUser.id);

      if (memError) throw memError;

      const chatIds = myMemberships?.map(m => m.chat_id) || [];
      if (chatIds.length === 0) {
        setChats([]);
        setUnreadChatsCount(0);
        return;
      }

      const { data: readData } = await supabase
        .from('chat_reads')
        .select('*')
        .eq('user_id', currentUser.id);
      
      const readMap = new Map(readData?.map(r => [r.chat_id, new Date(r.last_read_at).getTime()]) || []);

      const { data: latestMessages, error: msgError } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(name, avatar_url, display_name)')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      const { data: otherMembers } = await supabase
        .from('chat_members')
        .select('chat_id, user:profiles!user_id(*)')
        .in('chat_id', chatIds)
        .neq('user_id', currentUser.id);

      const memberMap = new Map();
      otherMembers?.forEach(m => {
        if (!memberMap.has(m.chat_id)) memberMap.set(m.chat_id, []);
        memberMap.get(m.chat_id).push(m.user);
      });

      const chatList = myMemberships.map(m => {
        const chat = m.chat;
        const messages = latestMessages?.filter(msg => msg.chat_id === chat.id) || [];
        const lastMsg = messages[0];
        const lastRead = readMap.get(chat.id) || 0;
        
        const unreadCount = messages.filter(msg => 
          msg.sender_id !== currentUser.id && 
          new Date(msg.created_at).getTime() > lastRead
        ).length;

        let name = "Chat";
        let avatar = null;

        if (chat.type === 'group') {
          name = chat.project?.title || "Project Group";
          avatar = chat.project?.thumbnail_url;
        } else {
          const partner = memberMap.get(chat.id)?.[0];
          name = resolveName(partner);
          avatar = partner?.avatar_url;
        }

        return {
          id: chat.id,
          name,
          avatar,
          lastMsg: lastMsg?.content || "No messages yet",
          time: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
          unread: unreadCount,
          isGroup: chat.type === 'group',
          lastTimestamp: lastMsg ? new Date(lastMsg.created_at).getTime() : 0
        };
      }).sort((a, b) => b.lastTimestamp - a.lastTimestamp);

      setChats(chatList);
      setUnreadChatsCount(chatList.filter(c => c.unread > 0).length);
    } catch (error: any) {
      console.error("Refresh chats error:", error.message);
    }
  };

  const getOrCreateDMChat = async (partnerId: string) => {
    if (!supabase || !currentUser) return null;

    try {
      const { data: existing } = await supabase.rpc('get_dm_chat', { 
        user1: currentUser.id, 
        user2: partnerId 
      });

      if (existing && existing.length > 0) return existing[0].chat_id;

      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({ type: 'dm' })
        .select()
        .single();

      if (chatError) throw chatError;

      await supabase.from('chat_members').insert([
        { chat_id: newChat.id, user_id: currentUser.id },
        { chat_id: newChat.id, user_id: partnerId }
      ]);

      return newChat.id;
    } catch (error) {
      console.error("Error getting/creating DM:", error);
      return null;
    }
  };

  const markAsRead = async (chatId: string) => {
    if (!supabase || !currentUser?.id) return;
    
    try {
      const now = new Date().toISOString();
      await supabase.from('chat_reads').upsert({
        user_id: currentUser.id,
        chat_id: chatId,
        last_read_at: now
      }, { onConflict: 'user_id,chat_id' });

      setChats(prev => prev.map(c => c.id === chatId ? { ...c, unread: 0 } : c));
      setUnreadChatsCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("markAsRead failed:", error);
    }
  };

  useEffect(() => {
    if (!supabase) return;

    const initApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        const user = profile ? { ...session.user, ...profile } : session.user;
        setCurrentUser(user);
        await refreshProjects(user);
      } else {
        await refreshProjects(null);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          const newUser = profile ? { ...session.user, ...profile } : session.user;
          setCurrentUser(newUser);
          refreshProjects(newUser);
        } else {
          setCurrentUser(null);
          setNotifications([]);
          setChats([]);
          setUnreadChatsCount(0);
          setUnreadNotificationsCount(0);
          refreshProjects(null);
        }
      });

      return () => subscription.unsubscribe();
    };

    initApp();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      updatePresence();
      const interval = setInterval(updatePresence, 20000);
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_members' }, () => refreshChats())
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
      updatePresence, resolveName,
      getOrCreateDMChat
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