"use client";

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, MessageSquare, User, Bell } from 'lucide-react';
import { cn } from "@/lib/utils";

const MobileLayout = ({ children, showNav = true, title }: { children: React.ReactNode, showNav?: boolean, title?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: PlusSquare, label: 'Create', path: '/create' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] text-slate-200 max-w-md mx-auto border-x border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          {title || "DevSphere"}
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/notifications')} className="relative p-2 hover:bg-slate-800 rounded-full transition-colors">
            <Bell size={22} className="text-slate-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#0f172a]"></span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0f172a] border-t border-slate-800 px-6 py-3 flex items-center justify-between z-50">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-200",
                  isActive ? "text-indigo-400 scale-110" : "text-slate-500 hover:text-slate-300"
                )}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
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