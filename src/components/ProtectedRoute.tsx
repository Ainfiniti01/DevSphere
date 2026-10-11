"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import type { AppRole } from '@/context/AppContext';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { currentUser, authLoading, hasSeenOnboarding, role } = useApp();
  const navigate = useNavigate();
  const hasRequiredRole = !allowedRoles || allowedRoles.includes(role);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        navigate(hasSeenOnboarding ? '/auth' : '/welcome', { replace: true });
      } else if (!hasRequiredRole) {
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, authLoading, hasSeenOnboarding, hasRequiredRole, navigate]);

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (currentUser && hasRequiredRole) {
    return <>{children}</>;
  }

  return null;
};

export default ProtectedRoute;
