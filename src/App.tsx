"use client";

import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { AppProvider, useApp } from "./context/AppContext";
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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Entry Point */}
      <Route path="/" element={<Splash />} />
      
      {/* Public Routes */}
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected Routes */}
      <Route path="/home" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/chat/:id" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
      <Route path="/project/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/settings/privacy" element={<ProtectedRoute><PrivacySecurity /></ProtectedRoute>} />
      <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
      <Route path="/settings/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
      <Route path="/manage-team/:id" element={<ProtectedRoute><ManageTeam /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-center" />
            <Analytics />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;