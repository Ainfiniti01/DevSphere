"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import ProjectCard from '@/components/ProjectCard';
import AnythingAIButton from '@/components/AnythingAIButton';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MOCK_PROJECTS = [
  {
    id: '1',
    title: 'EcoTrack: AI Carbon Footprint',
    creator: { name: 'Alex Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', role: 'Fullstack Dev' },
    thumbnail: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&q=80&w=800',
    skills: ['React', 'Python', 'TensorFlow'],
    description: 'Building a real-time carbon tracking app for small businesses using satellite data and AI.'
  },
  {
    id: '2',
    title: 'Nexus: Decentralized Social',
    creator: { name: 'Sarah Miller', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', role: 'UI Designer' },
    thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800',
    skills: ['Solidity', 'Figma', 'Web3'],
    description: 'A privacy-first social network where users own their data and earn rewards for quality content.'
  }
];

const Index = () => {
  return (
    <MobileLayout title="DevSphere">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Trending Projects</h2>
          <AnythingAIButton />
        </div>

        <Tabs defaultValue="trending" className="mb-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100/50">
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="newest">Newest</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {MOCK_PROJECTS.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Index;