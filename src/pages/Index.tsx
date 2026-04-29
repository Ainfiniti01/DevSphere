"use client";

import React, { useState, useMemo } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import ProjectCard from '@/components/ProjectCard';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from '@/context/AppContext';

const Index = () => {
  const { projects } = useApp();
  const [activeTab, setActiveTab] = useState('newest');

  const sortedProjects = useMemo(() => {
    const projectsCopy = [...projects];
    
    if (activeTab === 'newest') {
      return projectsCopy.sort((a, b) => 
        new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
      );
    }
    
    if (activeTab === 'trending') {
      return projectsCopy.sort((a, b) => {
        const engagementA = (a.likes || 0) + (a.comments?.length || 0);
        const engagementB = (b.likes || 0) + (b.comments?.length || 0);
        return engagementB - engagementA;
      });
    }
    
    return projectsCopy;
  }, [projects, activeTab]);

  return (
    <MobileLayout title="DevSphere">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">New Projects</h2>
        </div>

        <Tabs defaultValue="newest" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="newest" className="rounded-lg font-bold">New Projects</TabsTrigger>
            <TabsTrigger value="trending" className="rounded-lg font-bold">Trending</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {sortedProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
          {sortedProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No projects found.</p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Index;