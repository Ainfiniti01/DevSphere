"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Share2, MapPin, Link as LinkIcon, Briefcase, User } from 'lucide-react';
import SkillBadge from '@/components/SkillBadge';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  // Fallback to mock user if not logged in for preview purposes
  const user = currentUser || {
    name: 'Felix Zhang',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    title: 'Senior Fullstack Developer',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    location: 'San Francisco',
    portfolio: 'felix.dev'
  };

  return (
    <MobileLayout title="Profile">
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-primary/80 to-violet-600/80"></div>
        
        <div className="px-6 -mt-12">
          <div className="flex items-end justify-between mb-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
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
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {user.skills?.map((skill: string) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Briefcase size={20} className="text-primary" /> Experience
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-card border border-border rounded-2xl shadow-sm">
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center font-bold text-primary">
                  {user.title?.[0] || 'D'}
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{user.title}</h4>
                  <p className="text-sm text-muted-foreground">Current Role</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Profile;