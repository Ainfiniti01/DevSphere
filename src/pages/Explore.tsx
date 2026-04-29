"use client";

import React, { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Input } from "@/components/ui/input";
import { Search, Filter } from 'lucide-react';
import ProjectCard from '@/components/ProjectCard';
import { useApp } from '@/context/AppContext';

const Explore = () => {
  const { projects } = useApp();
  const [search, setSearch] = useState('');

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.skills.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <MobileLayout title="Explore">
      <div className="px-4 py-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            className="pl-10 h-12 bg-accent/20 border-border rounded-xl" 
            placeholder="Search projects or skills..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-accent rounded-lg">
            <Filter size={16} className="text-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
            {search ? `Results for "${search}"` : "Discover Projects"}
          </h3>
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No projects found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Explore;