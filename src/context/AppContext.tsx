"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_PROJECTS, MOCK_USERS, MOCK_CHATS, MOCK_NOTIFICATIONS } from '@/data/mockData';

interface AppContextType {
  currentUser: any;
  setCurrentUser: (user: any) => void;
  projects: any[];
  setProjects: (projects: any[]) => void;
  requests: any[];
  setRequests: (requests: any[]) => void;
  chats: any[];
  setChats: (chats: any[]) => void;
  notifications: any[];
  setNotifications: (notifs: any[]) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState(MOCK_PROJECTS);
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