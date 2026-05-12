"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';

const SLIDES = [
  {
    title: "Build Together",
    desc: "Find the perfect team for your next big idea.",
    image: "🚀"
  },
  {
    title: "Showcase Skills",
    desc: "Build your portfolio and get recognized by the community.",
    image: "💻"
  },
  {
    title: "Grow Faster",
    desc: "Learn from experts and collaborate on real-world projects.",
    image: "📈"
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

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col px-8 py-12 max-w-md mx-auto">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            className="space-y-6"
          >
            <div className="text-8xl mb-8">{SLIDES[current].image}</div>
            <h2 className="text-3xl font-bold text-white">{SLIDES[current].title}</h2>
            <p className="text-slate-400 text-lg">{SLIDES[current].desc}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-800'}`}
            />
          ))}
        </div>
        <Button onClick={next} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg font-bold rounded-2xl">
          {current === SLIDES.length - 1 ? "Get Started" : "Next"}
        </Button>
        <button onClick={handleFinish} className="w-full text-slate-500 font-medium py-2">
          Skip
        </button>
      </div>
    </div>
  );
};

export default Welcome;