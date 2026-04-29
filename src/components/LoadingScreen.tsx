"use client";

import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: [0.8, 1.1, 1],
          opacity: 1 
        }}
        transition={{ 
          duration: 0.8,
          ease: "easeOut"
        }}
        className="relative"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl"
        />
        <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl relative z-10">
          <span className="text-white text-4xl font-bold">D</span>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <h2 className="text-xl font-bold tracking-tight">DevSphere</h2>
        <p className="text-sm text-muted-foreground mt-1 animate-pulse">Connecting Developers...</p>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;