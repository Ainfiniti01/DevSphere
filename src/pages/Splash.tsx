"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import splashIcon from '../../assets/images/splash-icon.jpeg';

const Splash = () => {
  const navigate = useNavigate();
  const { currentUser, authLoading, hasSeenOnboarding } = useApp();

  useEffect(() => {
    // Minimum branding time of 1.5s to ensure smooth transition
    const timer = setTimeout(() => {
      if (!authLoading) {
        if (currentUser) {
          // Returning user who is already logged in
          navigate('/', { replace: true });
        } else if (!hasSeenOnboarding) {
          // Truly new user who hasn't seen onboarding
          navigate('/welcome', { replace: true });
        } else {
          // Returning user who needs to log in
          navigate('/auth', { replace: true });
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [authLoading, currentUser, hasSeenOnboarding, navigate]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-32 h-32 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/20"
      >
        <img src={splashIcon} alt="DevSphere Logo" className="w-full h-full object-cover" />
      </motion.div>
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-3xl font-bold text-white mt-8 tracking-tight"
      >
        DevSphere
      </motion.h1>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-4"
      >
        <div className="w-8 h-1 bg-indigo-500/30 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-500"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Splash;