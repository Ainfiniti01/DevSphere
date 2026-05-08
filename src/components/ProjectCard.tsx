"use client";

import React, { useState, useEffect } from 'react';
import { Heart, Share2, MessageCircle, PlayCircle, Send, User, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SkillBadge from './SkillBadge';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const ProjectCard = ({ project }: { project: any }) => {
  const navigate = useNavigate();
  const { toggleLike, addComment, currentUser } = useApp();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchComments = async () => {
    if (!supabase) return;
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, content, created_at, user:profiles(id, name, avatar_url, display_name)')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (isDrawerOpen) {
      fetchComments();
    }
  }, [isDrawerOpen]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await addComment(project.id, commentText);
    setCommentText('');
    fetchComments(); // Refresh local list
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/project/${project.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.title,
          text: project.description,
          url: shareUrl,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  const hasMedia = project.thumbnail && project.thumbnail !== '';

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm hover:shadow-md transition-shadow mb-4">
      <CardHeader className="p-4 flex-row items-center gap-3 space-y-0">
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={project.creator?.avatar_url} />
          <AvatarFallback>{project.creator?.name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-foreground truncate">{project.creator?.name}</h4>
          <p className="text-[11px] text-muted-foreground truncate">{project.creator?.title}</p>
        </div>
      </CardHeader>
      
      <div 
        className={cn(
          "relative aspect-video cursor-pointer group overflow-hidden flex flex-col items-center justify-center",
          !hasMedia ? "bg-gradient-to-br from-primary/10 via-violet-500/5 to-background border-y border-border/50" : "bg-muted"
        )}
        onClick={() => navigate(`/project/${project.id}`)}
      >
        {/* Stage Badge - Always visible */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-2.5 py-1 bg-primary/90 text-white text-[10px] font-extrabold rounded-full uppercase tracking-widest border border-white/20 shadow-lg backdrop-blur-sm">
            {project.stage}
          </span>
        </div>

        {hasMedia ? (
          <>
            <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <PlayCircle className="text-white opacity-80 group-hover:opacity-100 transition-opacity" size={48} />
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="text-white font-bold text-lg drop-shadow-md">{project.title}</h3>
            </div>
          </>
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full w-full">
            <h3 className="text-2xl font-black text-foreground leading-tight tracking-tight max-w-[90%] mb-2">
              {project.title}
            </h3>
            <div className="flex items-center gap-1.5 text-muted-foreground/80">
              <span className="text-[11px] font-bold uppercase tracking-widest">By {project.creator?.name}</span>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {project.skills?.map((skill: string) => <SkillBadge key={skill} skill={skill} />)}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-border/50 mt-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => toggleLike(project.id)}
            className={cn(
              "flex items-center gap-1.5 transition-colors py-2",
              project.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            )}
          >
            <Heart size={20} fill={project.isLiked ? "currentColor" : "none"} />
            <span className="text-xs font-bold">{project.likes}</span>
          </button>
          
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors py-2">
                <MessageCircle size={20} />
                <span className="text-xs font-bold">{project.commentCount || 0}</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="bg-background border-border h-[80vh]">
              <DrawerHeader className="border-b border-border">
                <DrawerTitle>Comments</DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingComments ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                ) : comments.length > 0 ? (
                  comments.map((c: any) => (
                    <div key={c.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={c.user?.avatar_url} />
                        <AvatarFallback>{c.user?.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-accent/30 p-3 rounded-2xl">
                        <div className="flex justify-between items-center mb-1">
                          <h5 className="text-xs font-bold">{c.user?.name}</h5>
                          <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm">{c.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-10">No comments yet. Be the first!</p>
                )}
              </div>
              <div className="p-4 border-t border-border bg-background sticky bottom-0">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a comment..." 
                    className="rounded-xl bg-accent/20" 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <Button size="icon" className="rounded-xl" onClick={handleAddComment}>
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
        <button onClick={handleShare} className="text-muted-foreground hover:text-foreground transition-colors p-2">
          <Share2 size={20} />
        </button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;