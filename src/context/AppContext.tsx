"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AppContextType {
  currentUser: any;
  setCurrentUser: (user: any) => void;
  authLoading: boolean;
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
  markAsRead: (chatId: string, isGroup: boolean) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  updatePresence: () => Promise<void>;
  resolveName: (user: any) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  
  const processingLikes = useRef<Set<string>>(new Set());
  const isRefreshing = useRef({ projects: false, notifications: false, chats: false });

  const resolveName = useCallback((user: any) => {
    if (!user) return "User";
    return user.display_name || user.name || user.full_name || (user.email ? user.email.split('@')[0] : `User_${user.id?.slice(0, 4)}`);
  }, []);

  const ensureProfile = useCallback(async (userId: string, authUser: any) => {
    if (!supabase) return null;
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (existing) return existing;

      const newProfile = {
        id: userId,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'New Developer',
        avatar_url: authUser.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString()
      };
      
      const { data: created, error: upsertError } = await supabase
        .from('profiles')
        .upsert(newProfile, { onConflict: 'id' })
        .select()
        .single();
      
      if (upsertError) throw upsertError;
      return created;
    } catch (error) {
      console.error("Error ensuring profile record exists:", error);
      return null;
    }
  }, []);

  const updatePresence = useCallback(async () => {
    if (!supabase || !currentUser?.id) return;
    try {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', currentUser.id);
    } catch (e) {
      // Silent fail for presence
    }
  }, [currentUser?.id]);

  const refreshProjects = useCallback(async (userOverride?: any) => {
    if (!supabase || isRefreshing.current.projects) return;
    isRefreshing.current.projects = true;
    const activeUser = userOverride || currentUser;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          creator:profiles!projects_creator_id_fkey(id, name, avatar_url, title, display_name),
          comments(id, content, created_at, user:profiles(id, name, avatar_url, display_name)),
          likes(user_id),
          project_members(user:profiles(id, name, avatar_url, title, display_name))
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
          .select('*, user:profiles!join_requests_user_id_fkey(*)');
        
        if (!reqError && reqData) {
          setRequests(reqData);
        }
      } else {
        setRequests([]);
      }
    } catch (error: any) {
      console.error("Refresh projects error:", error);
    } finally {
      isRefreshing.current.projects = false;
    }
  }, [currentUser]);

  const refreshNotifications = useCallback(async () => {
    if (!supabase || !currentUser?.id || isRefreshing.current.notifications) return;
    isRefreshing.current.notifications = true;
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
    } finally {
      isRefreshing.current.notifications = false;
    }
  }, [currentUser?.id]);

  const refreshChats = useCallback(async () => {
    if (!supabase || !currentUser?.id || isRefreshing.current.chats) return;
    isRefreshing.current.chats = true;
    try {
      // 1. Get hidden chats
      const { data: hiddenData } = await supabase
        .from('hidden_chats')
        .select('chat_id')
        .eq('user_id', currentUser.id);
      
      const hiddenChatIds = new Set(hiddenData?.map(h => h.chat_id) || []);

      // 2. Get chat memberships
      const { data: chatMemberships, error: memberError } = await supabase
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

      if (memberError) throw memberError;

      const chatIds = chatMemberships?.map(m => m.chat_id) || [];
      if (chatIds.length === 0) {
        setChats([]);
        setUnreadChatsCount(0);
        return;
      }

      // 3. Get last messages for all chats
      const { data: lastMessages, error: msgError } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(name, avatar_url, display_name)')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      // 4. Get read status
      const { data: readData } = await supabase
        .from('chat_reads')
        .select('*')
        .eq('user_id', currentUser.id);
      
      const readMap = new Map(readData?.map(r => [r.chat_id, new Date(r.last_read_at).getTime()]) || []);

      const conversations = new Map();
      
      for (const membership of chatMemberships) {
        const chat = membership.chat as any;
        if (!chat) continue;

        // Skip hidden chats unless they have a message newer than the hide date
        // For simplicity, we'll just skip them if they are in the hidden set
        // and reappearing logic will be handled by deleting from hidden_chats on new message
        if (hiddenChatIds.has(chat.id)) continue;

        const isGroup = chat.type === 'group';
        let chatName = isGroup ? chat.project?.title : 'Loading...';
        let chatAvatar = isGroup ? chat.project?.thumbnail_url : null;
        let targetId = isGroup ? chat.project_id : null;

        if (!isGroup) {
          const { data: otherMember } = await supabase
            .from('chat_members')
            .select('user:profiles!chat_members_user_id_fkey(*)')
            .eq('chat_id', chat.id)
            .neq('user_id', currentUser.id)
            .maybeSingle();
          
          if (otherMember?.user) {
            chatName = resolveName(otherMember.user);
            chatAvatar = (otherMember.user as any).avatar_url;
            targetId = (otherMember.user as any).id;
          }
        }

        conversations.set(chat.id, {
          id: chat.id,
          targetId,
          name: chatName,
          avatar: chatAvatar,
          lastMsg: 'No messages yet',
          time: '',
          unread: 0,
          isGroup,
          lastTimestamp: 0
        });
      }

      lastMessages?.forEach(msg => {
        const chat = conversations.get(msg.chat_id);
        if (!chat) return;

        const lastRead = readMap.get(msg.chat_id) || 0;
        const isUnread = msg.sender_id !== currentUser.id && new Date(msg.created_at).getTime() > lastRead;

        // Since messages are sorted DESC, the first one we hit for a chat is the latest
        if (chat.lastTimestamp === 0) {
          chat.lastMsg = msg.content;
          chat.time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          chat.lastTimestamp = new Date(msg.created_at).getTime();
        }

        if (isUnread) {
          chat.unread++;
        }
      });

      const sortedChats = Array.from(conversations.values())
        .sort((a, b) => b.lastTimestamp - a.lastTimestamp);

      setChats(sortedChats);
      setUnreadChatsCount(sortedChats.filter(c => c.unread > 0).length);
    } catch (error: any) {
      console.error("Refresh chats error:", error.message);
    } finally {
      isRefreshing.current.chats = false;
    }
  }, [currentUser?.id, resolveName]);

  const markAsRead = useCallback(async (chatId: string, isGroup: boolean) => {
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
  }, [currentUser?.id]);

  const deleteChat = useCallback(async (chatId: string) => {
    if (!supabase || !currentUser?.id) return;
    
    try {
      const chat = chats.find(c => c.id === chatId);
      if (!chat) return;

      if (chat.isGroup) {
        // Check if still a member
        const { data: membership } = await supabase
          .from('chat_members')
          .select('*')
          .eq('chat_id', chatId)
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        if (membership) {
          toast.error("You must leave the group before deleting the chat.");
          return;
        }
      }

      // Add to hidden chats
      const { error } = await supabase.from('hidden_chats').upsert({
        user_id: currentUser.id,
        chat_id: chatId
      }, { onConflict: 'user_id,chat_id' });

      if (error) throw error;

      toast.success("Chat removed from list");
      await refreshChats();
    } catch (error: any) {
      toast.error("Failed to remove chat");
      console.error(error);
    }
  }, [currentUser?.id, chats, refreshChats]);

  const logout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCurrentUser(null);
    toast.success("Logged out successfully");
  }, []);

  const toggleLike = useCallback(async (projectId: string) => {
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
  }, [currentUser?.id, projects, refreshProjects]);

  const addComment = useCallback(async (projectId: string, text: string) => {
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
  }, [currentUser?.id, refreshProjects]);

  useEffect(() => {
    if (!supabase) return;

    const initApp = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          await supabase.auth.signOut();
          setAuthLoading(false);
          return;
        }

        let user = null;
        if (session?.user) {
          const profile = await ensureProfile(session.user.id, session.user);
          user = profile ? { ...session.user, ...profile } : session.user;
          setCurrentUser(user);
          // Consolidate initial data fetch
          await Promise.all([
            refreshProjects(user),
            refreshNotifications(),
            refreshChats()
          ]);
        } else {
          await refreshProjects(null);
        }

        setAuthLoading(false);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            setNotifications([]);
            setChats([]);
            setUnreadChatsCount(0);
            setUnreadNotificationsCount(0);
            refreshProjects(null);
            setAuthLoading(false);
          } else if (session?.user && event === 'SIGNED_IN') {
            const profile = await ensureProfile(session.user.id, session.user);
            const newUser = profile ? { ...session.user, ...profile } : session.user;
            setCurrentUser(newUser);
            await Promise.all([
              refreshProjects(newUser),
              refreshNotifications(),
              refreshChats()
            ]);
            setAuthLoading(false);
          }
        });

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error("App initialization failed:", err);
        setAuthLoading(false);
      }
    };

    initApp();
  }, [ensureProfile, refreshProjects, refreshNotifications, refreshChats]);

  useEffect(() => {
    if (currentUser?.id) {
      updatePresence();
      const interval = setInterval(updatePresence, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, updatePresence]);

  useEffect(() => {
    if (currentUser?.id) {
      const channel = supabase
        .channel('global-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
          // If a new message arrives for a hidden chat, we should unhide it
          if (payload.event === 'INSERT') {
            const msg = payload.new as any;
            supabase.from('hidden_chats').delete().match({ user_id: currentUser.id, chat_id: msg.chat_id }).then(() => {
              refreshChats();
            });
          } else {
            refreshChats();
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => refreshNotifications())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_reads' }, () => refreshChats())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'join_requests' }, () => refreshProjects())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser?.id, refreshNotifications, refreshChats, refreshProjects]);

  return (
    <AppContext.Provider value={{ 
      currentUser, setCurrentUser, authLoading,
      projects, setProjects, 
      requests, setRequests,
      chats, setChats,
      notifications, setNotifications,
      unreadChatsCount,
      unreadNotificationsCount,
      logout, toggleLike, addComment,
      refreshProjects, refreshNotifications, refreshChats,
      markAsRead, deleteChat,
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