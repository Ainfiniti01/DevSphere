"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20"
      >
        <span className="text-white text-5xl font-bold">D</span>
      </motion.div>
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold text-white mt-6 tracking-tight"
      >
        DevSphere
      </motion.h1>
    </div>
  );
};

export default Splash;