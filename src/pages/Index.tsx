"use client";

import React, { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
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
    const projectsCopy = projects.filter(p => p.status === 'ACTIVE');
    
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
    <AppLayout title="DevSphere">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
              {activeTab === 'newest' ? 'New Projects' : 'Trending Projects'}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Discover what the community is building.</p>
          </div>

          <Tabs defaultValue="newest" className="w-full md:w-auto" onValueChange={(val) => {
            setActiveTab(val);
            setIsLoading(true);
          }}>
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-xl p-1 md:w-[300px]">
              <TabsTrigger value="newest" className="rounded-lg font-bold">Newest</TabsTrigger>
              <TabsTrigger value="trending" className="rounded-lg font-bold">Trending</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <ProjectCardSkeleton key={i} />)
          ) : sortedProjects.length > 0 ? (
            sortedProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState 
                icon={Rocket}
                title="No projects yet"
                description="Be the first to launch a project on DevSphere!"
                actionLabel="Create Project"
                actionPath="/create"
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;