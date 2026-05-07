"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, authLoading } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/auth', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;