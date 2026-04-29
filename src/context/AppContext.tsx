"use client";

import React, { createContext, useContext, useState } from 'react';
import { MOCK_PROJECTS, MOCK_CHATS, MOCK_NOTIFICATIONS, MOCK_JOIN_REQUESTS } from '@/data/mockData';

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
  toggleLike: (projectId: string) => void;
  addComment: (projectId: string, text: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState(MOCK_PROJECTS.map(p => ({
    ...p,
    likes: Math.floor(Math.random() * 50),
    isLiked: false,
    comments: [
      { id: 'c1', user: 'Sarah Miller', text: 'This looks incredible! Would love to help.', time: '2h ago' },
      { id: 'c2', user: 'James Wilson', text: 'What tech stack are you using for the AI part?', time: '1h ago' }
    ]
  })));
  const [requests, setRequests] = useState<any[]>(MOCK_JOIN_REQUESTS);
  const [chats, setChats] = useState(MOCK_CHATS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const logout = () => setCurrentUser(null);

  const toggleLike = (projectId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  const addComment = (projectId: string, text: string) => {
    if (!currentUser) return;
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          comments: [...p.comments, {
            id: 'c' + Date.now(),
            user: currentUser.name,
            text,
            time: 'Just now'
          }]
        };
      }
      return p;
    }));
  };

  return (
    <AppContext.Provider value={{ 
      currentUser, setCurrentUser, 
      projects, setProjects, 
      requests, setRequests,
      chats, setChats,
      notifications, setNotifications,
      logout, toggleLike, addComment
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