"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Share2, MapPin, Link as LinkIcon, Rocket, User, LayoutGrid } from 'lucide-react';
import SkillBadge from '@/components/SkillBadge';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import ProjectCard from '@/components/ProjectCard';

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, projects } = useApp();

  const user = currentUser || {
    id: 'u1',
    name: 'Felix Zhang',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    title: 'Senior Fullstack Developer',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    location: 'San Francisco',
    portfolio: 'felix.dev'
  };

  const myProjects = projects.filter(p => p.creator.id === user.id);
  const joinedProjects = projects.filter(p => p.members?.includes(user.id));

  return (
    <MobileLayout title="Profile">
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-primary/80 to-violet-600/80"></div>
        
        <div className="px-6 -mt-12">
          <div className="flex items-end justify-between mb-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl cursor-pointer" onClick={() => navigate('/edit-profile')}>
              <AvatarImage src={user.avatar} />
              <AvatarFallback><User size={40} /></AvatarFallback>
            </Avatar>
            <div className="flex gap-2 pb-2">
              <Button variant="outline" size="icon" className="rounded-xl border-border" onClick={() => navigate('/settings')}>
                <Settings size={18} />
              </Button>
              <Button variant="outline" size="icon" className="rounded-xl border-border">
                <Share2 size={18} />
              </Button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
            <p className="text-primary font-semibold text-lg">{user.title}</p>
            <div className="flex flex-col gap-2 mt-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> {user.location}</span>
              {user.portfolio && (
                <span className="flex items-center gap-2"><LinkIcon size={16} className="text-primary" /> {user.portfolio}</span>
              )}
            </div>
          </div>

          <section className="mb-8">
            <h3 className="text-lg font-bold mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {user.skills?.map((skill: string) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Rocket size={20} className="text-primary" /> My Projects
            </h3>
            <div className="space-y-4">
              {myProjects.map(p => <ProjectCard key={p.id} project={p} />)}
              {myProjects.length === 0 && <p className="text-sm text-muted-foreground italic">No projects created yet.</p>}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <LayoutGrid size={20} className="text-primary" /> Joined Projects
            </h3>
            <div className="space-y-4">
              {joinedProjects.map(p => <ProjectCard key={p.id} project={p} />)}
              {joinedProjects.length === 0 && <p className="text-sm text-muted-foreground italic">No projects joined yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Profile;