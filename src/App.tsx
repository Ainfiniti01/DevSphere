"use client";

import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { AppProvider } from "./context/AppContext";
import LoadingScreen from "./components/LoadingScreen";
import Splash from "./pages/Splash";
import Welcome from "./pages/Welcome";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import Explore from "./pages/Explore";
import CreateProject from "./pages/CreateProject";
import Messages from "./pages/Messages";
import ChatScreen from "./pages/ChatScreen";
import ProjectDetail from "./pages/ProjectDetail";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import PrivacySecurity from "./pages/PrivacySecurity";
import NotificationSettings from "./pages/NotificationSettings";
import Subscription from "./pages/Subscription";
import ManageTeam from "./pages/ManageTeam";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isAppLoading) return <LoadingScreen />;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-center" />
            <Analytics />
            <BrowserRouter>
              <Routes>
                <Route path="/splash" element={<Splash />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/create" element={<CreateProject />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/chat/:id" element={<ChatScreen />} />
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/privacy" element={<PrivacySecurity />} />
                <Route path="/settings/notifications" element={<NotificationSettings />} />
                <Route path="/settings/subscription" element={<Subscription />} />
                <Route path="/manage-team/:id" element={<ManageTeam />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;