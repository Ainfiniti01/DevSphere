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
import ProtectedRoute from "./components/ProtectedRoute";
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
                <Route path="/auth" element={<Auth />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/create" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/chat/:id" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/settings/privacy" element={<ProtectedRoute><PrivacySecurity /></ProtectedRoute>} />
                <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
                <Route path="/settings/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                <Route path="/manage-team/:id" element={<ProtectedRoute><ManageTeam /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                {/* Publicly Accessible Routes */}
                <Route path="/explore" element={<Explore />} />
                <Route path="/project/:id" element={<ProjectDetail />} />
                <Route path="/profile/:id" element={<Profile />} />
                
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