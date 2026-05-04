"use client";

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { useApp } from '@/context/AppContext';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SkillBadge from '@/components/SkillBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronLeft, PlayCircle, Info, MessageSquare, Edit, Users, Share2, Bookmark, CheckCircle2, Rocket } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, currentUser, notifications, refreshNotifications } = useApp();
  
  const project = projects.find(p => p.id === id);
  
  const [joinReason, setJoinReason] = useState('');
  const [joinSkills, setJoinSkills] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!project) {
    return (
      <MobileLayout title="Error" showBack>
        <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
          <h2 className="text-xl font-bold mb-2">Project Not Found</h2>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </MobileLayout>
    );
  }

  const isOwner = currentUser?.id === project.creator_id;
  const hasRequested = notifications.some(n => n.project_id === project.id && n.actor_id === currentUser?.id && n.type === 'request');
  const isMember = project.members?.includes(currentUser?.id);

  const handleJoin = async () => {
    if (!currentUser || !supabase) {
      toast.error("Please sign in to join projects");
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('join_requests').insert({
        project_id: project.id,
        user_id: currentUser.id,
        reason: joinReason,
        skills: joinSkills
      });

      if (error) {
        if (error.code === '42P01') {
          throw new Error("The join requests system is currently being set up. Please try again in a moment.");
        }
        throw error;
      }

      toast.success("Application sent to founder!");
      await refreshNotifications();
      setJoinReason('');
      setJoinSkills('');
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("[ProjectDetail] Join error:", error);
      toast.error(error.message || "Failed to send application. Please ensure the database table exists.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Project Details" showBack>
      <div className="relative bg-background text-foreground">
        <div className="aspect-video relative bg-muted">
          {project.thumbnail ? (
            <img src={project.thumbnail} className="w-full h-full object-cover" alt={project.title} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
              <Rocket size={48} className="text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <PlayCircle size={64} className="text-white/80 hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-primary/15 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">
                {project.stage}
              </span>
              <h2 className="text-2xl font-bold leading-tight">{project.title}</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="rounded-xl h-10 w-10"><Bookmark size={18} /></Button>
              <Button variant="outline" size="icon" className="rounded-xl h-10 w-10"><Share2 size={18} /></Button>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-2xl border border-border">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={project.creator?.avatar_url} />
              <AvatarFallback>{project.creator?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold truncate">{project.creator?.name}</h4>
              <p className="text-xs text-muted-foreground truncate">{project.creator?.title}</p>
            </div>
            {!isOwner && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-xl h-8 text-xs font-bold"
                onClick={() => navigate(`/chat/${project.creator_id}`)}
              >
                Message
              </Button>
            )}
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                <Info size={14} className="text-primary" /> The Problem
              </h3>
              <p className="text-sm leading-relaxed text-foreground/90">{project.problem}</p>
            </section>

            <section>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-primary" /> The Solution
              </h3>
              <p className="text-sm leading-relaxed text-foreground/90">{project.solution}</p>
            </section>

            <section>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {project.skills?.map((skill: string) => <SkillBadge key={skill} skill={skill} />)}
              </div>
            </section>

            {project.members && project.members.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Users size={14} className="text-primary" /> Team Members
                </h3>
                <div className="flex -space-x-2">
                  {project.members.map((memberId: string) => (
                    <Avatar key={memberId} className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${memberId}`} />
                      <AvatarFallback>M</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="pt-6 sticky bottom-0 bg-background/80 backdrop-blur-sm pb-4">
            {isOwner ? (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="h-12 rounded-xl gap-2 font-bold"
                  onClick={() => navigate(`/create?edit=${project.id}`)}
                >
                  <Edit size={18} /> Edit Project
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 rounded-xl gap-2 font-bold" 
                  onClick={() => navigate(`/manage-team/${project.id}`)}
                >
                  <Users size={18} /> Manage Team
                </Button>
              </div>
            ) : isMember ? (
              <Button 
                className="w-full h-14 bg-primary text-lg font-bold rounded-2xl gap-2 shadow-lg shadow-primary/20" 
                onClick={() => navigate(`/chat/${project.id}?group=true`)}
              >
                <MessageSquare size={20} /> Open Group Chat
              </Button>
            ) : hasRequested ? (
              <Button disabled className="w-full h-14 text-lg font-bold rounded-2xl bg-muted text-muted-foreground">
                Requested
              </Button>
            ) : (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full h-14 bg-primary text-lg font-bold rounded-2xl shadow-lg shadow-primary/20">
                    Join Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background border-border max-w-[90vw] rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Apply to Join</DialogTitle>
                    <DialogDescription>
                      Tell the project owner why you're a good fit for this team.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 py-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">Why do you want to join?</Label>
                      <Textarea 
                        placeholder="Tell the founder about your motivation..." 
                        className="rounded-xl min-h-[100px] bg-accent/20" 
                        value={joinReason} 
                        onChange={e => setJoinReason(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-bold">What value or skills do you bring?</Label>
                      <Input 
                        placeholder="e.g. React, UI Design, Growth..." 
                        className="h-12 rounded-xl bg-accent/20" 
                        value={joinSkills} 
                        onChange={e => setJoinSkills(e.target.value)} 
                      />
                    </div>
                    <Button 
                      onClick={handleJoin} 
                      className="w-full h-12 rounded-xl font-bold text-lg"
                      disabled={!joinReason || !joinSkills || isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Submit Application"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default ProjectDetail;