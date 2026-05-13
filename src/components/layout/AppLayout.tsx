"use client";

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, MessageSquare, User, Bell, ChevronLeft, LogOut, Settings as SettingsIcon, Rocket } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useApp } from '@/context/AppContext';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AppLayout = ({ 
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
  const { unreadNotificationsCount, unreadChatsCount, currentUser, logout } = useApp();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: PlusSquare, label: 'Create', path: '/create' },
    { icon: MessageSquare, label: 'Messages', path: '/messages', badge: unreadChatsCount },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      {showNav && (
        <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-border bg-card sticky top-0 h-screen z-50">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Rocket className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-black bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              DevSphere
            </h1>
          </div>

          <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 group",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <div className="relative">
                    <item.icon size={22} />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-destructive text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-card">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border space-y-2">
            <button 
              onClick={() => navigate('/settings')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
            >
              <SettingsIcon size={22} />
              <span>Settings</span>
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut size={22} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile/Tablet Header */}
        <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between lg:hidden">
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

        {/* Desktop Header (Title only) */}
        {title && (
          <header className="hidden lg:flex items-center justify-between px-8 py-6 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center gap-4">
              {showBack && (
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                  <ChevronLeft size={24} />
                </Button>
              )}
              <h2 className="text-2xl font-black tracking-tight">{title}</h2>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="rounded-xl relative" onClick={() => navigate('/notifications')}>
                <Bell size={20} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Button>
              {currentUser && (
                <div className="flex items-center gap-3 pl-4 border-l border-border">
                  <div className="text-right hidden xl:block">
                    <p className="text-sm font-bold">{currentUser.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{currentUser.title || 'Developer'}</p>
                  </div>
                  <Avatar className="h-10 w-10 border-2 border-primary/20 cursor-pointer" onClick={() => navigate('/profile')}>
                    <AvatarImage src={currentUser.avatar_url} />
                    <AvatarFallback>{currentUser.name?.[0]}</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </header>
        )}

        <main className={cn(
          "flex-1 overflow-y-auto pb-20 lg:pb-8",
          !title && "lg:pt-0"
        )}>
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        {showNav && (
          <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border px-6 py-3 flex items-center justify-between z-50 lg:hidden">
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
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-background min-w-[18px]">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
};

export default AppLayout;