"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { ChevronLeft, PlayCircle, Info, MessageSquare, Edit, Users, Share2, Bookmark, CheckCircle2, Rocket, Loader2, Heart, Send, CornerDownRight } from 'lucide-react';
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
  const [replyTo, setReplyTo] = useState<any>(null);
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

  useEffect(() => {
    const commentId = new URLSearchParams(location.search).get('comment');
    if (commentId) {
      setTimeout(() => {
        const el = document.getElementById(`comment-${commentId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      }, 500);
    }
  }, [location.search, project?.comments]);

  if (!project) return <MobileLayout title="Error" showBack><div className="p-8 text-center">Project Not Found</div></MobileLayout>;

  const isOwner = currentUser?.id === project.creator_id;
  const isMember = project.members?.includes(currentUser?.id);

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser) return;
    setIsSubmitting(true);
    try {
      const { data: newComment, error } = await supabase.from('comments').insert({
        project_id: project.id,
        user_id: currentUser.id,
        content: commentText,
        parent_id: replyTo?.id || null
      }).select().single();

      if (error) throw error;

      // Notifications
      if (replyTo) {
        if (replyTo.user_id !== currentUser.id) {
          await supabase.from('notifications').insert({
            user_id: replyTo.user_id,
            actor_id: currentUser.id,
            type: 'reply',
            project_id: project.id,
            comment_id: newComment.id,
            content: 'replied to your comment'
          });
        }
      } else if (project.creator_id !== currentUser.id) {
        await supabase.from('notifications').insert({
          user_id: project.creator_id,
          actor_id: currentUser.id,
          type: 'comment',
          project_id: project.id,
          comment_id: newComment.id,
          content: 'commented on your project'
        });
      }

      toast.success(replyTo ? "Reply added!" : "Comment added!");
      setCommentText('');
      setReplyTo(null);
      await refreshProjects();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    const wasLiked = project.isLiked;
    await toggleLike(project.id);
    if (!wasLiked && project.creator_id !== currentUser?.id) {
      await supabase.from('notifications').insert({
        user_id: project.creator_id,
        actor_id: currentUser?.id,
        type: 'like',
        project_id: project.id,
        content: 'liked your project'
      });
    }
  };

  const rootComments = project.comments?.filter((c: any) => !c.parent_id) || [];
  const replies = project.comments?.filter((c: any) => c.parent_id) || [];

  return (
    <MobileLayout title="Project Details" showBack>
      <div className="relative bg-background text-foreground pb-24">
        <div className="aspect-video relative bg-muted">
          {project.thumbnail ? <img src={project.thumbnail} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center"><Rocket size={48} className="text-primary/40" /></div>}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><PlayCircle size={64} className="text-white/80" /></div>
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
              <Button variant="outline" size="icon" className="rounded-xl"><Share2 size={18} /></Button>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-2xl border border-border cursor-pointer" onClick={() => navigate(`/profile/${project.creator_id}`)}>
            <Avatar className="h-10 w-10 border border-border"><AvatarImage src={project.creator?.avatar_url} /><AvatarFallback><User size={20} /></AvatarFallback></Avatar>
            <div className="flex-1 min-w-0"><h4 className="font-bold truncate">{project.creator?.name}</h4><p className="text-xs text-muted-foreground truncate">{project.creator?.title}</p></div>
          </div>

          <div className="space-y-6">
            <section><h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">The Problem</h3><p className="text-sm leading-relaxed">{project.problem}</p></section>
            <section><h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">The Solution</h3><p className="text-sm leading-relaxed">{project.solution}</p></section>
            <section><h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Required Skills</h3><div className="flex flex-wrap gap-2">{project.skills?.map((skill: string) => <SkillBadge key={skill} skill={skill} />)}</div></section>
          </div>

          <section className="pt-6 border-t border-border">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><MessageSquare size={20} className="text-primary" /> Discussion</h3>
            <div className="space-y-6">
              {rootComments.map((comment: any) => (
                <div key={comment.id} id={`comment-${comment.id}`} className="space-y-4 transition-all duration-500 rounded-xl p-2">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 cursor-pointer" onClick={() => navigate(`/profile/${comment.user_id}`)}><AvatarImage src={comment.user?.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <div className="bg-accent/30 p-3 rounded-2xl">
                        <div className="flex justify-between items-center mb-1"><h5 className="text-xs font-bold">{comment.user?.name}</h5><span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span></div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <button onClick={() => setReplyTo(comment)} className="text-[10px] font-bold text-primary mt-2 ml-2 uppercase tracking-widest hover:underline">Reply</button>
                    </div>
                  </div>
                  {replies.filter((r: any) => r.parent_id === comment.id).map((reply: any) => (
                    <div key={reply.id} id={`comment-${reply.id}`} className="flex gap-3 ml-8">
                      <CornerDownRight size={16} className="text-muted-foreground mt-2" />
                      <Avatar className="h-7 w-7 cursor-pointer" onClick={() => navigate(`/profile/${reply.user_id}`)}><AvatarImage src={reply.user?.avatar_url} /><AvatarFallback>U</AvatarFallback></Avatar>
                      <div className="flex-1 bg-accent/20 p-3 rounded-2xl">
                        <div className="flex justify-between items-center mb-1"><h5 className="text-xs font-bold">{reply.user?.name}</h5><span className="text-[10px] text-muted-foreground">{new Date(reply.created_at).toLocaleDateString()}</span></div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-background/80 backdrop-blur-md border-t border-border z-50">
          {replyTo && (
            <div className="flex items-center justify-between bg-primary/10 px-3 py-2 rounded-t-xl border-x border-t border-primary/20 mb-[-1px]">
              <span className="text-[10px] font-bold text-primary">Replying to @{replyTo.user?.name}</span>
              <button onClick={() => setReplyTo(null)}><X size={14} className="text-primary" /></button>
            </div>
          )}
          <div className="flex gap-2">
            <Input 
              placeholder={replyTo ? "Write a reply..." : "Add a comment..."} 
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