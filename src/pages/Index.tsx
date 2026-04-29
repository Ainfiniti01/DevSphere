"use client";

import React, { useState, useMemo, useEffect } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import ProjectCard from '@/components/ProjectCard';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from '@/context/AppContext';
import { ProjectCardSkeleton } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { Rocket } from 'lucide-react';

const Index = () => {
  const { projects } = useApp();
  const [activeTab, setActiveTab] = useState('newest');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeTab]);

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
          <h2 className="text-xl font-bold text-foreground">
            {activeTab === 'newest' ? 'New Projects' : 'Trending Projects'}
          </h2>
        </div>

        <Tabs defaultValue="newest" className="mb-6" onValueChange={(val) => {
          setActiveTab(val);
          setIsLoading(true);
        }}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-xl p-1">
            <TabsTrigger value="newest" className="rounded-lg font-bold">New Projects</TabsTrigger>
            <TabsTrigger value="trending" className="rounded-lg font-bold">Trending</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <ProjectCardSkeleton key={i} />)
          ) : sortedProjects.length > 0 ? (
            sortedProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))
          ) : (
            <EmptyState 
              icon={Rocket}
              title="No projects yet"
              description="Be the first to launch a project on DevSphere!"
              actionLabel="Create Project"
              actionPath="/create"
            />
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Index;