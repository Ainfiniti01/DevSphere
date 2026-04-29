"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import ProjectCard from '@/components/ProjectCard';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from '@/context/AppContext';

const Index = () => {
  const { projects } = useApp();

  return (
    <MobileLayout title="DevSphere">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Trending Projects</h2>
        </div>

        <Tabs defaultValue="trending" className="mb-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="trending" className="rounded-lg">Trending</TabsTrigger>
            <TabsTrigger value="newest" className="rounded-lg">Newest</TabsTrigger>
            <TabsTrigger value="following" className="rounded-lg">Following</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Index;