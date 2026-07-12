"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { notificationService } from '@/utils/NotificationService';

interface AppContextType {
  currentUser: any;
  setCurrentUser: (user: any) => void;
  authLoading: boolean;
  hasSeenOnboarding: boolean;
  completeOnboarding: () => void;
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
  leaveGroup: (chatId: string) => Promise<void>;
  dismissGroup: (chatId: string) => Promise<void>;
  removeMemberFromGroup: (chatId: string, userId: string) => Promise<void>;
  updatePresence: () => Promise<void>;
  resolveName: (user: any) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('devsphere_onboarding_complete') === 'true';
    }
    return false;
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  
  const processingLikes = useRef<Set<string>>(new Set());
  const isRefreshing = useRef({ projects: false, notifications: false, chats: false });
  const refreshTimeout = useRef<any>(null);
  const lastActivity = useRef<number>(Date.now());
  const processedEventIds = useRef<Set<string>>(new Set());
  const hasShownPauseWarning = useRef(false);

  const completeOnboarding = useCallback(() => {
    setHasSeenOnboarding(true);
    localStorage.setItem('devsphere_onboarding_complete', 'true');
  }, []);

  const resolveName = useCallback((user: any) => {
    if (!user) return "User";
    return user.display_name || user.name || user.full_name || (user.email ? user.email.split('@')[0] : `User_${user.id?.slice(0, 4)}`);
  }, []);

  const handleConnectionFailure = useCallback(() => {
    if (!hasShownPauseWarning.current) {
      hasShownPauseWarning.current = true;
      toast.error(
        "Unable to connect to Supabase. Your database project might be paused or sleeping. Please log into your Supabase Dashboard to wake it up.",
        {
          duration: 10000,
          action: {
            label: "Supabase Console",
            onClick: () => window.open("https://supabase.com/dashboard", "_blank")
          }
        }
      );
    }
  }, []);

  const ensureProfile = useCallback(async (userId: string, authUser: any) => {
    if (!supabase) return null;
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout fetching profile")), 5000)
    );

    try {
      console.log("[AppContext] ensureProfile: Fetching existing profile for", userId);
      const fetchPromise = (async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .limit(1);
        
        if (error) throw error;
        return data && data.length > 0 ? data[0] : null;
      })();

      const existing = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      if (existing) {
        console.log("[AppContext] ensureProfile: Found existing profile");
        localStorage.setItem(`devsphere_profile_${userId}`, JSON.stringify(existing));
        return existing;
      }

      console.log("[AppContext] ensureProfile: Profile not found, creating new profile");
      const newProfile = {
        id: userId,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'New Developer',
        avatar_url: authUser.user_metadata?.avatar_url || null,
        updated_at: new Date().toISOString()
      };
      
      const upsertPromise = (async () => {
        const { data, error: upsertError } = await supabase
          .from('profiles')
          .upsert(newProfile, { onConflict: 'id' })
          .select()
          .limit(1);
        
        if (upsertError) throw upsertError;
        return data && data.length > 0 ? data[0] : null;
      })();

      const created = await Promise.race([upsertPromise, timeoutPromise]) as any;
      if (created) {
        localStorage.setItem(`devsphere_profile_${userId}`, JSON.stringify(created));
      }
      return created;
    } catch (error: any) {
      console.error("[AppContext] Error ensuring profile record exists:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        error
      });
      
      handleConnectionFailure();

      // Try to load from cache first to prevent reversing back to stale auth metadata
      const cached = localStorage.getItem(`devsphere_profile_${userId}`);
      if (cached) {
        try {
          console.log("[AppContext] ensureProfile: Falling back to cached profile");
          return JSON.parse(cached);
        } catch (e) {}
      }

      // Fallback to basic auth user info so we don't block the app
      return {
        id: userId,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'New Developer',
        avatar_url: authUser.user_metadata?.avatar_url || null
      };
    }
  }, [handleConnectionFailure]);

  const updatePresence = useCallback(async () => {
    if (!supabase || !currentUser?.id) return;
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      let newStreak = currentUser.activity_streak || 0;
      const lastStreakDate = currentUser.last_streak_date;

      if (!lastStreakDate || lastStreakDate < today) {
        if (lastStreakDate === new Date(now.getTime() - 86400000).toISOString().split('T')[0]) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          last_seen: now.toISOString(),
          last_active_at: now.toISOString(),
          activity_streak: newStreak,
          last_streak_date: today
        })
        .eq('id', currentUser.id);

      if (error) throw error;
    } catch (e) {
      console.warn("[AppContext] Presence update failed:", e);
      handleConnectionFailure();
    }
  }, [currentUser, handleConnectionFailure]);

  const refreshProjects = useCallback(async (userOverride?: any) => {
    if (!supabase) return;
    const activeUser = userOverride || currentUser;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, title, problem, solution, description, stage, skills_required, thumbnail_url, created_at, status, project_url, creator_id,
          creator:profiles!projects_creator_id_fkey(id, name, avatar_url, title, display_name),
          likes(user_id),
          project_members(user_id, status, user:profiles!project_members_user_id_fkey(id, name, avatar_url, title, display_name))
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
        members: p.project_members?.filter((m: any) => m.status === 'active').map((m: any) => m.user_id) || [],
        memberProfiles: p.project_members?.filter((m: any) => m.status === 'active').map((m: any) => m.user) || [],
        myMembershipStatus: p.project_members?.find((m: any) => m.user_id === activeUser?.id)?.status || 'none'
      }));

      setProjects(transformed);

      if (activeUser?.id) {
        try {
          const { data: reqData, error: reqError } = await supabase
            .from('join_requests')
            .select(`
              id, 
              project_id, 
              user_id, 
              status, 
              reason, 
              skills, 
              created_at, 
              user:profiles(id, name, avatar_url, title, display_name)
            `);
          
          if (reqError) throw reqError;
          if (reqData) setRequests(reqData);
        } catch (e) {
          console.error("[AppContext] Failed to fetch join requests:", e);
        }
      } else {
        setRequests([]);
      }
    } catch (error: any) {
      console.error("Refresh projects error:", error.message);
      handleConnectionFailure();
    }
  }, [currentUser, handleConnectionFailure]);

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
      handleConnectionFailure();
    } finally {
      isRefreshing.current.notifications = false;
    }
  }, [currentUser?.id, handleConnectionFailure]);

  const refreshChats = useCallback(async () => {
    if (!supabase || !currentUser?.id || isRefreshing.current.chats) return;
    isRefreshing.current.chats = true;
    try {
      let hiddenChatIds = new Set<string>();
      try {
        const { data: hiddenData } = await supabase
          .from('hidden_chats')
          .select('chat_id')
          .eq('user_id', currentUser.id);
        
        if (hiddenData) {
          hiddenChatIds = new Set(hiddenData.map(h => h.chat_id));
        }
      } catch (e) {}

      const { data: chatMemberships, error: memberError } = await supabase
        .from('chat_members')
        .select(`
          chat_id,
          chat:chats (
            id,
            type,
            project_id,
            project:projects (title, thumbnail_url, creator_id)
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

      const { data: lastMessages, error: msgError } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(name, avatar_url, display_name)')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      const { data: readData } = await supabase
        .from('chat_reads')
        .select('*')
        .eq('user_id', currentUser.id);
      
      const readMap = new Map(readData?.map(r => [r.chat_id, new Date(r.last_read_at).getTime()]) || []);

      const conversations = new Map();
      
      for (const membership of chatMemberships) {
        const chat = membership.chat as any;
        if (!chat || hiddenChatIds.has(chat.id)) continue;

        const isGroup = chat.type === 'group';
        const isOwner = isGroup && chat.project?.creator_id === currentUser.id;
        let chatName = isGroup ? chat.project?.title : 'Loading...';
        let chatAvatar = isGroup ? chat.project?.thumbnail_url : null;
        let targetId = isGroup ? chat.project_id : null;

        if (!isGroup) {
          const { data: otherMember } = await supabase
            .from('chat_members')
            .select('user:profiles(*)')
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
          isOwner,
          lastTimestamp: 0
        });
      }

      lastMessages?.forEach(msg => {
        const chat = conversations.get(msg.chat_id);
        if (!chat) return;

        const lastRead = readMap.get(msg.chat_id) || 0;
        const isUnread = msg.sender_id !== currentUser.id && new Date(msg.created_at).getTime() > lastRead;

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
      handleConnectionFailure();
    } finally {
      isRefreshing.current.chats = false;
    }
  }, [currentUser?.id, resolveName, handleConnectionFailure]);

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
      const { error } = await supabase.from('hidden_chats').upsert({
        user_id: currentUser.id,
        chat_id: chatId
      }, { onConflict: 'user_id,chat_id' });

      if (error) throw error;
      toast.success("Chat removed from list");
      setTimeout(() => refreshChats(), 100);
    } catch (error: any) {
      toast.error("Failed to remove chat");
    }
  }, [currentUser?.id, refreshChats]);

  const leaveGroup = useCallback(async (chatId: string) => {
    if (!supabase || !currentUser?.id) return;
    const chat = chats.find(c => c.id === chatId);
    if (chat?.isOwner) {
      toast.error("Transfer admin role before leaving the group.");
      return;
    }
    try {
      const { error } = await supabase.rpc('leave_project', {
        p_project_id: chat.targetId,
        p_user_id: currentUser.id
      });

      if (error) throw error;

      await supabase.from('hidden_chats').upsert({
        user_id: currentUser.id,
        chat_id: chatId
      }, { onConflict: 'user_id,chat_id' });

      toast.success("Exited group and removed chat");
      setTimeout(() => {
        refreshChats();
        refreshProjects();
      }, 100);
    } catch (error: any) {
      toast.error("Failed to exit group");
    }
  }, [currentUser?.id, refreshChats, refreshProjects, chats]);

  const dismissGroup = useCallback(async (chatId: string) => {
    if (!supabase || !currentUser?.id) return;
    try {
      const { error } = await supabase.rpc('dismiss_group_chat', {
        p_chat_id: chatId,
        p_admin_id: currentUser.id
      });

      if (error) throw error;
      toast.success("Group dismissed successfully");
      setTimeout(() => refreshChats(), 100);
    } catch (error: any) {
      toast.error(error.message || "Failed to dismiss group");
    }
  }, [currentUser?.id, refreshChats]);

  const removeMemberFromGroup = useCallback(async (chatId: string, userId: string) => {
    if (!supabase || !currentUser?.id) return;
    const chat = chats.find(c => c.id === chatId);
    try {
      const { error } = await supabase.rpc('remove_project_member', {
        p_project_id: chat.targetId,
        p_target_user_id: userId,
        p_admin_id: currentUser.id
      });

      if (error) throw error;
      toast.success("Member removed from group");
      setTimeout(() => {
        refreshChats();
        refreshProjects();
      }, 100);
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    }
  }, [currentUser?.id, refreshChats, refreshProjects, chats]);

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
        const { error } = await supabase.from('likes').delete().match({ project_id: projectId, user_id: currentUser.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('likes').insert({ project_id: projectId, user_id: currentUser.id });
        if (error && error.code !== '23505') throw error;
      }
      await refreshProjects();
    } catch (error) {
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

  // Robust Auth Initialization & State Monitoring (Runs once on mount)
  useEffect(() => {
    if (!supabase) {
      console.log("[AppContext] Supabase client not initialized");
      setAuthLoading(false);
      return;
    }

    let isMounted = true;

    // Trigger self-healing database repair immediately on mount
    fetch('https://xzmewvnjjljzigkcrezf.supabase.co/functions/v1/project-manager', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'repair', message: 'repair' })
    }).then(() => {
      console.log("[AppContext] Self-healing database repair triggered");
    }).catch(err => {
      console.error("[AppContext] Failed to trigger self-healing:", err);
    });

    const handleUserSession = async (session: any) => {
      console.log("[AppContext] handleUserSession called with session:", session);
      if (!session?.user) {
        if (isMounted) {
          console.log("[AppContext] No user session found, setting authLoading to false");
          setCurrentUser(null);
          setAuthLoading(false);
        }
        return;
      }

      try {
        console.log("[AppContext] User session found, ensuring profile for:", session.user.id);
        const profile = await ensureProfile(session.user.id, session.user);
        const user = profile ? { ...session.user, ...profile } : session.user;
        
        if (isMounted) {
          console.log("[AppContext] Profile ensured, setting current user");
          setCurrentUser(user);
          setAuthLoading(false);
        }
      } catch (err) {
        console.error("[AppContext] Error handling user session:", err);
        if (isMounted) setAuthLoading(false);
      }
    };

    console.log("[AppContext] Getting initial session...");
    const sessionTimeout = new Promise<any>((_, reject) => 
      setTimeout(() => reject(new Error("Session timeout")), 5000)
    );

    Promise.race([
      supabase.auth.getSession(),
      sessionTimeout
    ]).then((result) => {
      console.log("[AppContext] getSession resolved. Result:", result);
      const session = result?.data?.session || null;
      handleUserSession(session);
    }).catch((err) => {
      console.error("[AppContext] getSession failed or timed out:", err);
      handleConnectionFailure();
      if (isMounted) {
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AppContext] Auth state change event:", event);
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setCurrentUser(null);
          setAuthLoading(false);
        }
      } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        await handleUserSession(session);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfile, handleConnectionFailure]);

  // Separate Effect to handle data fetching when currentUser changes (Prevents infinite loops)
  useEffect(() => {
    if (currentUser) {
      console.log("[AppContext] currentUser changed, loading user data in background");
      Promise.allSettled([
        refreshProjects(currentUser),
        refreshNotifications(),
        refreshChats()
      ]).then(() => {
        console.log("[AppContext] Background user data loaded successfully");
      });
    } else {
      console.log("[AppContext] currentUser is null, clearing user data");
      refreshProjects(null);
      setNotifications([]);
      setChats([]);
      setUnreadChatsCount(0);
      setUnreadNotificationsCount(0);
    }
  }, [currentUser, refreshProjects, refreshNotifications, refreshChats]);

  useEffect(() => {
    if (currentUser?.id) {
      updatePresence();
      const interval = setInterval(updatePresence, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, updatePresence]);

  // Auto-Logout Logic
  useEffect(() => {
    if (!currentUser?.id) return;
    const handleActivity = () => { lastActivity.current = Date.now(); };
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    const checkInterval = setInterval(() => {
      const preference = currentUser.notification_settings?.auto_logout || 'never';
      if (preference === 'never') return;
      const timeoutMs = parseInt(preference) * 60 * 1000;
      if (Date.now() - lastActivity.current > timeoutMs) {
        toast.info("Logged out due to inactivity");
        logout();
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(checkInterval);
    };
  }, [currentUser?.id, logout]);

  useEffect(() => {
    if (currentUser?.id) {
      const channel = supabase
        .channel('global-updates')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const msg = payload.new as any;
          if (processedEventIds.current.has(msg.id)) return;
          processedEventIds.current.add(msg.id);
          
          const settings = currentUser.notification_settings || {};
          if (msg.sender_id !== currentUser.id) {
            if (settings.messages !== false) notificationService.play('message', settings.sound !== false);
            toast.info(`New message from ${msg.sender_name || 'a developer'}`);
          }
          
          supabase.from('hidden_chats').delete().match({ user_id: currentUser.id, chat_id: msg.chat_id }).then(() => {
            if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
            refreshTimeout.current = setTimeout(() => refreshChats(), 200);
          });
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
          const notif = payload.new as any;
          if (processedEventIds.current.has(notif.id)) return;
          processedEventIds.current.add(notif.id);
          
          const settings = currentUser.notification_settings || {};
          const isProjectActivity = ['request', 'pause', 'resume', 'request_accepted', 'request_rejected'].includes(notif.type);
          
          if (isProjectActivity) {
            if (settings.projects !== false) notificationService.play('project', settings.sound !== false);
          } else {
            if (settings.push !== false) notificationService.play('system', settings.sound !== false);
          }
          
          if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
          refreshTimeout.current = setTimeout(() => refreshNotifications(), 200);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_reads' }, () => {
          if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
          refreshTimeout.current = setTimeout(() => refreshChats(), 200);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'join_requests' }, () => {
          if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
          refreshTimeout.current = setTimeout(() => refreshProjects(), 200);
        })
        .subscribe();

      return () => {
        if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser?.id, refreshNotifications, refreshChats, refreshProjects]);

  return (
    <AppContext.Provider value={{ 
      currentUser, setCurrentUser, authLoading,
      hasSeenOnboarding, completeOnboarding,
      projects, setProjects, 
      requests, setRequests,
      chats, setChats,
      notifications, setNotifications,
      unreadChatsCount,
      unreadNotificationsCount,
      logout, toggleLike, addComment,
      refreshProjects, refreshNotifications, refreshChats,
      markAsRead, deleteChat, leaveGroup, dismissGroup, removeMemberFromGroup,
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