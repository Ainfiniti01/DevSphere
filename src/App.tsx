"use client";

import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { AppProvider, useApp } from "./context/AppContext";
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
import Referrals from "./pages/Referrals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { authLoading } = useApp();

  // While auth is hydrating, we show the Splash screen as the global loader
  // Now that BrowserRouter wraps AppContent, useNavigate inside Splash will work
  if (authLoading) {
    return <Splash />;
  }

  return (
    <Routes>
      {/* Entry Point Logic */}
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
      <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />

      {/* Publicly Accessible Routes */}
      <Route path="/explore" element={<Explore />} />
      <Route path="/project/:id" element={<ProjectDetail />} />
      <Route path="/profile/:id" element={<Profile />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <AppProvider>
          <BrowserRouter>
            <TooltipProvider>
              <Toaster />
              <Sonner position="top-center" />
              <Analytics />
              <AppContent />
            </TooltipProvider>
          </BrowserRouter>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;