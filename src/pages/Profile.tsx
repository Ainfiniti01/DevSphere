"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Share2, MapPin, Link as LinkIcon, Rocket, User, LayoutGrid, Loader2, ChevronDown, ChevronUp, Github, Linkedin, Twitter, BadgeCheck } from 'lucide-react';
import SkillBadge from '@/components/SkillBadge';
import { useApp } from '@/context/AppContext';
import ProjectCard from '@/components/ProjectCard';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, projects } = useApp();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id || id === currentUser?.id) {
        setProfile(currentUser);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        
        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, currentUser]);

  if (loading) {
    return (
      <AppLayout title="Profile">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout title="Profile">
        <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
          <h2 className="text-2xl font-black mb-4">User not found</h2>
          <p className="text-muted-foreground mb-8 max-w-xs mx-auto">This profile might not exist or is private.</p>
          <Button onClick={() => navigate('/')} className="rounded-2xl px-8 h-12 font-bold">Return Home</Button>
        </div>
      </AppLayout>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const userProjects = projects.filter(p => p.creator_id === profile.id);
  const joinedProjects = projects.filter(p => p.members?.includes(profile.id));

  const formatUrl = (url: string) => {
    if (!url) return "";
    return url.startsWith('http') ? url : `https://${url}`;
  };

  return (
    <AppLayout title={isOwnProfile ? "My Profile" : profile.name} showBack={!isOwnProfile}>
      <div className="relative pb-20">
        {/* Banner */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-primary via-violet-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        
        <div className="px-4 sm:px-8 lg:px-12 -mt-20 md:-mt-24 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-2xl">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback><User size={64} /></AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left pb-2">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight">{profile.name || "Developer"}</h2>
                  <BadgeCheck className="text-primary" size={28} />
                </div>
                <p className="text-primary font-bold text-xl md:text-2xl">{profile.title || "Member"}</p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-center md:pb-4">
              {isOwnProfile ? (
                <>
                  <Button variant="outline" size="lg" className="rounded-2xl border-border font-bold gap-2" onClick={() => navigate('/settings')}>
                    <Settings size={20} />
                    <span className="hidden sm:inline">Settings</span>
                  </Button>
                  <Button variant="default" size="lg" className="rounded-2xl font-bold gap-2 shadow-lg shadow-primary/20" onClick={() => navigate('/edit-profile')}>
                    Edit Profile
                  </Button>
                </>
              ) : (
                <Button size="lg" className="rounded-2xl font-black text-lg px-10 shadow-xl shadow-primary/20" onClick={() => navigate(`/chat/${profile.id}`)}>
                  Message
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Bio & Info */}
            <div className="lg:col-span-1 space-y-10">
              <section className="space-y-4">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">About</h3>
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                  <p className="text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">
                    {profile.bio || "No bio provided yet."}
                  </p>
                  
                  <div className="mt-8 space-y-4 pt-6 border-t border-border">
                    {profile.location && (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MapPin size={18} className="text-primary" />
                        <span className="font-medium">{profile.location}</span>
                      </div>
                    )}
                    {profile.portfolio_url && (
                      <a 
                        href={formatUrl(profile.portfolio_url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-primary hover:underline font-bold"
                      >
                        <LinkIcon size={18} />
                        <span className="truncate">{profile.portfolio_url}</span>
                      </a>
                    )}
                  </div>

                  <div className="flex gap-4 mt-8">
                    {profile.github_url && (
                      <a href={formatUrl(profile.github_url)} target="_blank" rel="noopener noreferrer" className="p-3 bg-accent/50 rounded-xl hover:bg-accent transition-all text-foreground/70 hover:text-primary">
                        <Github size={22} />
                      </a>
                    )}
                    {profile.linkedin_url && (
                      <a href={formatUrl(profile.linkedin_url)} target="_blank" rel="noopener noreferrer" className="p-3 bg-accent/50 rounded-xl hover:bg-accent transition-all text-foreground/70 hover:text-primary">
                        <Linkedin size={22} />
                      </a>
                    )}
                    {profile.twitter_url && (
                      <a href={formatUrl(profile.twitter_url)} target="_blank" rel="noopener noreferrer" className="p-3 bg-accent/50 rounded-xl hover:bg-accent transition-all text-foreground/70 hover:text-primary">
                        <Twitter size={22} />
                      </a>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill: string) => (
                    <span key={skill} className="px-4 py-2 bg-primary/5 text-primary text-sm font-bold rounded-xl border border-primary/10">
                      {skill}
                    </span>
                  ))}
                  {(!profile.skills || profile.skills.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">No skills added yet.</p>
                  )}
                </div>
              </section>
            </div>

            {/* Right Column: Projects */}
            <div className="lg:col-span-2 space-y-12">
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <Rocket size={24} className="text-primary" />
                    Launched Projects
                  </h3>
                  <span className="text-sm font-bold text-muted-foreground">{userProjects.length} total</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userProjects.map(p => <ProjectCard key={p.id} project={p} />)}
                  {userProjects.length === 0 && (
                    <div className="col-span-full p-12 bg-accent/10 border border-dashed border-border rounded-[2.5rem] text-center">
                      <p className="text-muted-foreground font-medium">No projects launched yet.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black flex items-center gap-3">
                    <LayoutGrid size={24} className="text-primary" />
                    Collaborations
                  </h3>
                  <span className="text-sm font-bold text-muted-foreground">{joinedProjects.length} total</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {joinedProjects.map(p => <ProjectCard key={p.id} project={p} />)}
                  {joinedProjects.length === 0 && (
                    <div className="col-span-full p-12 bg-accent/10 border border-dashed border-border rounded-[2.5rem] text-center">
                      <p className="text-muted-foreground font-medium">No collaborations yet.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;