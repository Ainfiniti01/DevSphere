"use client";

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, MessageSquare, User, Bell, ChevronLeft } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useApp } from '@/context/AppContext';

const MobileLayout = ({ 
  children, 
  showNav = true, 
  title, 
  showBack = false 
}: { 
  children: React.ReactNode, 
  showNav?: boolean, 
  title?: string,
  showBack?: boolean
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadNotificationsCount } = useApp();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: PlusSquare, label: 'Create', path: '/create' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground max-w-md mx-auto border-x border-border shadow-2xl relative overflow-hidden">
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 hover:bg-accent rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
          )}
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent truncate max-w-[200px]">
            {title || "DevSphere"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/notifications')} className="relative p-2 hover:bg-accent rounded-full transition-colors">
            <Bell size={22} className="text-muted-foreground" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background border-t border-border px-6 py-3 flex items-center justify-between z-50">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-200 relative",
                  isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export default MobileLayout;