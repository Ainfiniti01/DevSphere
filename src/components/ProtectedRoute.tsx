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
  const {
    currentUser,
    authLoading,
    profileLoading,
    profileError,
    retryProfile,
    hasSeenOnboarding,
    role,
  } = useApp();
  const navigate = useNavigate();
  const hasRequiredRole = !allowedRoles || (role !== null && allowedRoles.includes(role));

  useEffect(() => {
    if (!authLoading && !profileLoading && !profileError) {
      if (!currentUser) {
        navigate(hasSeenOnboarding ? '/auth' : '/welcome', { replace: true });
      } else if (!hasRequiredRole) {
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, authLoading, profileLoading, profileError, hasSeenOnboarding, hasRequiredRole, navigate]);

  if (authLoading || (currentUser && profileLoading)) {
    return <LoadingScreen />;
  }

  if (profileError && currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-bold">We couldn&apos;t load your profile</h1>
          <p className="text-sm text-muted-foreground">{profileError}</p>
          <button
            type="button"
            onClick={retryProfile}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (currentUser && hasRequiredRole) {
    return <>{children}</>;
  }

  return null;
};

export default ProtectedRoute;

 