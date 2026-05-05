"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Share2, MapPin, Link as LinkIcon, Rocket, User, LayoutGrid, Loader2 } from 'lucide-react';
import SkillBadge from '@/components/SkillBadge';
import { useApp } from '@/context/AppContext';
import ProjectCard from '@/components/ProjectCard';
import { supabase } from '@/lib/supabase';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, projects } = useApp();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) {
        setProfile(currentUser);
        setLoading(false);
        return;
      }

      if (id === currentUser?.id) {
        setProfile(currentUser);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error) setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [id, currentUser]);

  if (loading) {
    return (
      <MobileLayout title="Profile">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </MobileLayout>
    );
  }

  if (!profile) {
    return (
      <MobileLayout title="Profile">
        <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
          <h2 className="text-xl font-bold mb-4">User not found</h2>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </MobileLayout>
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
    <MobileLayout title={isOwnProfile ? "My Profile" : profile.name} showBack={!isOwnProfile}>
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-primary/80 to-violet-600/80"></div>
        
        <div className="px-6 -mt-12">
          <div className="flex items-end justify-between mb-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback><User size={40} /></AvatarFallback>
            </Avatar>
            <div className="flex gap-2 pb-2">
              {isOwnProfile ? (
                <>
                  <Button variant="outline" size="icon" className="rounded-xl border-border" onClick={() => navigate('/settings')}>
                    <Settings size={18} />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-xl border-border">
                    <Share2 size={18} />
                  </Button>
                </>
              ) : (
                <Button className="rounded-xl font-bold" onClick={() => navigate(`/chat/${profile.id}`)}>
                  Message
                </Button>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">{profile.name || "Developer"}</h2>
            <p className="text-primary font-semibold text-lg">{profile.title || "Member"}</p>
            <div className="flex flex-col gap-2 mt-3 text-muted-foreground text-sm">
              {profile.location && (
                <span className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> {profile.location}</span>
              )}
              {profile.portfolio_url && (
                <a 
                  href={formatUrl(profile.portfolio_url)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  <LinkIcon size={16} /> {profile.portfolio_url}
                </a>
              )}
            </div>
          </div>

          <section className="mb-8">
            <h3 className="text-lg font-bold mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills?.map((skill: string) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
              {(!profile.skills || profile.skills.length === 0) && (
                <p className="text-sm text-muted-foreground italic">No skills added yet.</p>
              )}
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Rocket size={20} className="text-primary" /> Projects
            </h3>
            <div className="space-y-4">
              {userProjects.map(p => <ProjectCard key={p.id} project={p} />)}
              {userProjects.length === 0 && <p className="text-sm text-muted-foreground italic">No projects created yet.</p>}
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