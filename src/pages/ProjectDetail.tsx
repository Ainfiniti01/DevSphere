"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { ChevronLeft, Info, MessageSquare, Edit, Users, Share2, Bookmark, CheckCircle2, Rocket, Loader2, Heart, Send, CornerDownRight, User, Pause, Play, X, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, currentUser, refreshNotifications, toggleLike, refreshProjects } = useApp();
  
  const project = projects.find(p => p.id === id);
  
  const [joinReason, setJoinReason] = useState('');
  const [joinContribution, setJoinContribution] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');

  useEffect(() => {
    const checkRequestStatus = async () => {
      if (!currentUser || !id || !supabase) return;
      const { data } = await supabase.from('join_requests').select('status').eq('project_id', id).eq('user_id', currentUser.id).maybeSingle();
      if (data) setRequestStatus(data.status as any);
    };
    checkRequestStatus();
  }, [id, currentUser?.id]);

  if (!project) return <MobileLayout title="Error" showBack><div className="p-8 text-center">Project Not Found</div></MobileLayout>;

  const isOwner = currentUser?.id === project.creator_id;
  const isMember = project.members?.includes(currentUser?.id);

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
      console.error("[ProjectDetail] Status change error:", err);
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

      if (error) {
        if (error.code === '23505') {
          toast.error("Request already sent");
          setRequestStatus('pending');
        } else {
          throw error;
        }
      } else {
        toast.success("Application sent to founder!");
        setRequestStatus('pending');
        await refreshNotifications();
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout title="Project Details" showBack>
      <div className="relative bg-background text-foreground pb-24">
        <div className="aspect-video relative bg-muted overflow-hidden">
          {project.thumbnail ? (
            <img src={project.thumbnail} className="w-full h-full object-cover" alt={project.title} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
              <Rocket size={48} className="text-primary/40" />
            </div>
          )}
          {project.status === 'PAUSED' && (
            <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
              Paused
            </div>
          )}
        </div>

        <div className="px-4 py-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-primary/15 text-primary text-[10px] font-bold rounded-full uppercase">{project.stage}</span>
              <h2 className="text-2xl font-bold leading-tight">{project.title}</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="rounded-xl" onClick={handleLike}>
                <Heart size={18} className={project.isLiked ? "fill-red-500 text-red-500" : ""} />
              </Button>
              <Button variant="outline" size="icon" className="rounded-xl" onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied!");
              }}>
                <Share2 size={18} />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-2xl border border-border cursor-pointer" onClick={() => navigate(`/profile/${project.creator_id}`)}>
            <Avatar className="h-10 w-10 border border-border"><AvatarImage src={project.creator?.avatar_url} /><AvatarFallback><User size={20} /></AvatarFallback></Avatar>
            <div className="flex-1 min-w-0"><h4 className="font-bold truncate">{project.creator?.name}</h4><p className="text-xs text-muted-foreground truncate">{project.creator?.title}</p></div>
          </div>

          <div className="space-y-6">
            {project.project_url && (
              <section>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Project Link</h3>
                <a 
                  href={project.project_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary font-bold hover:underline bg-primary/5 p-3 rounded-xl border border-primary/10 w-fit"
                >
                  <ExternalLink size={16} />
                  Visit Project
                </a>
              </section>
            )}
            <section><h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">The Problem</h3><p className="text-sm leading-relaxed">{project.problem}</p></section>
            <section><h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">The Solution</h3><p className="text-sm leading-relaxed">{project.solution}</p></section>
            <section><h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Required Skills</h3><div className="flex flex-wrap gap-2">{project.skills?.map((skill: string) => <SkillBadge key={skill} skill={skill} />)}</div></section>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-background/80 backdrop-blur-md border-t border-border z-50">
          {isOwner ? (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant={project.status === 'ACTIVE' ? "outline" : "default"}
                className="h-12 rounded-xl gap-2 font-bold"
                onClick={() => handleStatusChange(project.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (project.status === 'ACTIVE' ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Resume</>)}
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
          ) : project.status === 'PAUSED' ? (
            <Button disabled className="w-full h-14 text-lg font-bold rounded-2xl bg-muted text-muted-foreground">
              Project Paused
            </Button>
          ) : requestStatus === 'pending' ? (
            <Button disabled className="w-full h-14 text-lg font-bold rounded-2xl bg-muted text-muted-foreground">
              Request Pending
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
                  <DialogDescription>Tell the project owner why you're a good fit.</DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Why do you want to join?</Label>
                    <Textarea placeholder="..." className="rounded-xl min-h-[100px] bg-accent/20" value={joinReason} onChange={e => setJoinReason(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">What can you contribute?</Label>
                    <Input placeholder="..." className="h-12 rounded-xl bg-accent/20" value={joinContribution} onChange={e => setJoinContribution(e.target.value)} />
                  </div>
                  <Button onClick={handleJoin} className="w-full h-12 rounded-xl font-bold text-lg" disabled={!joinReason.trim() || !joinContribution.trim() || isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Submit Application"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          <div className="mt-4 flex gap-2">
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
        </div>
      </div>
    </MobileLayout>
  );
};

export default ProjectDetail;