"use client";

import React, { createContext, useContext, useState } from 'react';
import { MOCK_PROJECTS, MOCK_USERS, MOCK_CHATS, MOCK_NOTIFICATIONS } from '@/data/mockData';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize projects with a members array if not present
  const initialProjects = MOCK_PROJECTS.map(p => ({
    ...p,
    members: p.members || []
  }));

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState(initialProjects);
  const [requests, setRequests] = useState<any[]>([]);
  const [chats, setChats] = useState(MOCK_CHATS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider value={{ 
      currentUser, setCurrentUser, 
      projects, setProjects, 
      requests, setRequests,
      chats, setChats,
      notifications, setNotifications,
      logout 
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