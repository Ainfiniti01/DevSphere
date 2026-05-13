"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { Rocket, Users, Code, Sparkles, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    title: "Welcome to DevSphere",
    desc: "A collaborative ecosystem for developers, creators, founders, and innovators.",
    icon: Rocket,
    color: "from-blue-500 to-indigo-600"
  },
  {
    title: "Build Together",
    desc: "Find teammates, join projects, and turn ideas into real products together.",
    icon: Users,
    color: "from-violet-500 to-purple-600"
  },
  {
    title: "Showcase Your Skills",
    desc: "Create your developer identity with projects, experience, and tech stack.",
    icon: Code,
    color: "from-emerald-500 to-teal-600"
  },
  {
    title: "Collaborate in Real-Time",
    desc: "Use project group chats, team discussions, and collaboration tools built for builders.",
    icon: Sparkles,
    color: "from-orange-500 to-pink-600"
  }
];

const Welcome = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { completeOnboarding, currentUser } = useApp();

  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleFinish = () => {
    completeOnboarding();
    navigate('/auth');
  };

  const next = () => {
    if (current === SLIDES.length - 1) {
      handleFinish();
    } else {
      setCurrent(current + 1);
    }
  };

  const Icon = SLIDES[current].icon;

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side: Visual/Branding (Desktop Only) */}
      <div className={cn(
        "hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br transition-all duration-700",
        SLIDES[current].color
      )}>
        <motion.div
          key={current}
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.5 }}
          className="text-white text-center space-y-8"
        >
          <div className="w-48 h-48 bg-white/10 backdrop-blur-xl rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl border border-white/20">
            <Icon size={96} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl font-black tracking-tighter">DevSphere</h1>
            <p className="text-xl font-medium text-white/80">The future of collaboration.</p>
          </div>
        </motion.div>
      </div>

      {/* Right Side: Content & Controls */}
      <div className="flex-1 flex flex-col px-8 py-12 lg:px-20 lg:py-24 bg-background relative">
        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-8"
            >
              <div className={cn(
                "lg:hidden w-24 h-24 rounded-3xl flex items-center justify-center bg-gradient-to-br shadow-xl",
                SLIDES[current].color
              )}>
                <Icon size={48} className="text-white" />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
                  {SLIDES[current].title}
                </h2>
                <p className="text-muted-foreground text-lg lg:text-xl leading-relaxed">
                  {SLIDES[current].desc}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="max-w-lg mx-auto w-full space-y-8">
          <div className="flex justify-center lg:justify-start gap-3">
            {SLIDES.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-2 rounded-full transition-all duration-500",
                  i === current ? 'w-12 bg-primary' : 'w-3 bg-muted'
                )}
              />
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={next}
              className="flex-1 h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 gap-2"
            >
              {current === SLIDES.length - 1 ? "Enter DevSphere" : "Continue"}
              <ChevronRight size={24} />
            </Button>
            <button 
              onClick={handleFinish} 
              className="px-8 py-4 text-muted-foreground font-bold hover:text-foreground transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;