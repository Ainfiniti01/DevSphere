"use client";

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SkillBadge from '@/components/SkillBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronLeft, MessageSquare, Users, Share2, Rocket, Loader2, Heart, Send, User, Pause, Play, ExternalLink, ChevronDown, ChevronUp, BadgeCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, requests, currentUser, toggleLike, refreshProjects } = useApp();
  
  const project = projects.find(p => p.id === id);
  
  const [joinReason, setJoinReason] = useState('');
  const [joinContribution, setJoinContribution] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const latestRequest = useMemo(() => {
    return requests
      .filter(r => r.project_id === id && r.user_id === currentUser?.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }, [requests, id, currentUser?.id]);

  const requestStatus = latestRequest ? latestRequest.status : 'none';

  if (!project) return <AppLayout title="Error" showBack><div className="p-8 text-center">Project Not Found</div></AppLayout>;

  const isOwner = currentUser?.id === project.creator_id;
  const isMember = project.myMembershipStatus === 'active';

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('comments').insert({
        project_id: project.id,
        user_id: currentUser.id,
        content: commentText
      });

      if (error) throw error;

      toast.success("Comment added!");
      setCommentText('');
      await refreshProjects();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    await toggleLike(project.id);
  };

  const handleStatusChange = async (newStatus: 'ACTIVE' | 'PAUSED') => {
    if (!supabase || !currentUser) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', project.id);

      if (error) {
        if (error.message.includes('ACTIVE_LIMIT_REACHED')) {
          toast.error("You already have 3 active projects. Please pause one before activating another.");
        } else {
          throw error;
        }
      } else {
        toast.success(newStatus === 'ACTIVE' ? "Project is now active!" : "Project paused.");
        await refreshProjects();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update project status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!currentUser || !supabase) {
      toast.error("Please sign in to join projects");
      navigate('/auth');
      return;
    }

    if (!joinReason.trim() || !joinContribution.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('join_requests').insert({
        project_id: project.id,
        user_id: currentUser.id,
        reason: joinReason,
        skills: joinContribution,
        status: 'pending'
      });

      if (error) throw error;

      toast.success("Application sent to founder!");
      await refreshProjects();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout title="Project Details" showBack>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Media & Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="aspect-video relative bg-muted rounded-3xl overflow-hidden shadow-2xl">
              {project.thumbnail ? (
                <img src={project.thumbnail} className="w-full h-full object-cover" alt={project.title} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
                  <Rocket size={64} className="text-primary/40" />
                </div>
              )}
              {project.status === 'PAUSED' && (
                <div className="absolute top-6 right-6 bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                  Paused
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-primary/15 text-primary text-xs font-black rounded-full uppercase tracking-wider">{project.stage}</span>
                    {isOwner && <span className="px-3 py-1 bg-emerald-500/15 text-emerald-500 text-xs font-black rounded-full uppercase tracking-wider">Your Project</span>}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight">{project.title}</h2>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" className="rounded-2xl gap-2 font-bold" onClick={handleLike}>
                    <Heart size={20} className={project.isLiked ? "fill-red-500 text-red-500" : ""} />
                    <span>{project.likes}</span>
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-2xl gap-2 font-bold" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied!");
                  }}>
                    <Share2 size={20} />
                    <span>Share</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <section className="space-y-3">
                  <h3 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">The Problem</h3>
                  <p className="text-base leading-relaxed text-foreground/80">{project.problem}</p>
                </section>
                <section className="space-y-3">
                  <h3 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">The Solution</h3>
                  <p className="text-base leading-relaxed text-foreground/80">{project.solution}</p>
                </section>
              </div>

              <section className="space-y-4">
                <h3 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">Description</h3>
                <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground/80">
                  {project.description}
                </p>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {project.skills?.map((skill: string) => (
                    <span key={skill} className="px-4 py-2 bg-accent/50 text-foreground text-sm font-bold rounded-xl border border-border">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Right Column: Sidebar Info & Actions */}
          <div className="space-y-8">
            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl sticky top-24">
              <div className="space-y-8">
                {/* Founder Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Founder</h3>
                  <div className="flex items-center gap-4 p-4 bg-accent/20 rounded-3xl border border-border cursor-pointer hover:bg-accent/30 transition-all" onClick={() => navigate(`/profile/${project.creator_id}`)}>
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarImage src={project.creator?.avatar_url} />
                      <AvatarFallback><User size={24} /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black truncate flex items-center gap-1.5">
                        {project.creator?.name}
                        <BadgeCheck size={16} className="text-primary" />
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">{project.creator?.title}</p>
                    </div>
                  </div>
                </div>

                {/* Project Links */}
                {project.project_url && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Links</h3>
                    <a 
                      href={project.project_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-primary/5 text-primary font-bold rounded-2xl border border-primary/10 hover:bg-primary/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <ExternalLink size={20} />
                        <span>Visit Project</span>
                      </div>
                      <ChevronLeft size={20} className="rotate-180" />
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-4 pt-4">
                  {isOwner ? (
                    <div className="flex flex-col gap-3">
                      <Button 
                        variant={project.status === 'ACTIVE' ? "outline" : "default"}
                        className="h-14 rounded-2xl gap-3 font-black text-lg shadow-lg"
                        onClick={() => handleStatusChange(project.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (project.status === 'ACTIVE' ? <><Pause size={20} /> Pause Project</> : <><Play size={20} /> Resume Project</>)}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-14 rounded-2xl gap-3 font-black text-lg" 
                        onClick={() => navigate(`/manage-team/${project.id}`)}
                      >
                        <Users size={20} /> Manage Team
                      </Button>
                    </div>
                  ) : isMember ? (
                    <Button 
                      className="w-full h-16 bg-primary text-xl font-black rounded-2xl gap-3 shadow-xl shadow-primary/20" 
                      onClick={() => navigate(`/chat/${project.id}?group=true`)}
                    >
                      <MessageSquare size={24} /> Open Group Chat
                    </Button>
                  ) : project.status === 'PAUSED' ? (
                    <div className="p-6 bg-muted rounded-3xl text-center">
                      <Pause size={32} className="mx-auto mb-2 text-muted-foreground" />
                      <p className="font-bold text-muted-foreground">Project is currently paused</p>
                    </div>
                  ) : requestStatus === 'pending' ? (
                    <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl text-center">
                      <Loader2 className="mx-auto mb-2 text-primary animate-spin" size={32} />
                      <p className="font-bold text-primary">Application Pending</p>
                    </div>
                  ) : (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full h-16 bg-primary text-xl font-black rounded-2xl shadow-xl shadow-primary/20">
                          {requestStatus === 'rejected' ? "Re-apply to Join" : "Join Project"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-background border-border max-w-lg rounded-[2.5rem] p-8">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black">Apply to Join</DialogTitle>
                          <DialogDescription className="text-base">Tell the founder why you're the perfect fit for this project.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-6">
                          <div className="space-y-2">
                            <Label className="text-sm font-black uppercase tracking-widest">Why do you want to join?</Label>
                            <Textarea placeholder="Your motivation..." className="rounded-2xl min-h-[120px] bg-accent/20 text-base" value={joinReason} onChange={e => setJoinReason(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-black uppercase tracking-widest">What can you contribute?</Label>
                            <Input placeholder="Your skills & experience..." className="h-14 rounded-2xl bg-accent/20 text-base" value={joinContribution} onChange={e => setJoinContribution(e.target.value)} />
                          </div>
                          <Button onClick={handleJoin} className="w-full h-14 rounded-2xl font-black text-lg shadow-lg" disabled={!joinReason.trim() || !joinContribution.trim() || isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Submit Application"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-xl">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <MessageSquare size={20} className="text-primary" />
                Discussion
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input 
                    placeholder="Add a comment..." 
                    className="rounded-xl bg-accent/20 h-12" 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <Button size="icon" className="rounded-xl h-12 w-12 shrink-0" onClick={handleAddComment} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">Join the conversation and share your thoughts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProjectDetail;