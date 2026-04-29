"use client";

import React, { useState } from 'react';
import { Heart, Share2, MessageCircle, PlayCircle, Send, User } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SkillBadge from './SkillBadge';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const ProjectCard = ({ project }: { project: any }) => {
  const navigate = useNavigate();
  const { toggleLike, addComment } = useApp();
  const [commentText, setCommentText] = useState('');

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(project.id, commentText);
    setCommentText('');
  };

  const hasMedia = project.thumbnail || project.videoUrl;

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm hover:shadow-md transition-shadow mb-4">
      <CardHeader className="p-4 flex-row items-center gap-3 space-y-0">
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={project.creator.avatar} />
          <AvatarFallback>{project.creator.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-foreground truncate">{project.creator.name}</h4>
          <p className="text-[11px] text-muted-foreground truncate">{project.creator.role}</p>
        </div>
      </CardHeader>
      
      <div 
        className={cn(
          "relative aspect-video cursor-pointer group overflow-hidden",
          !hasMedia ? "bg-gradient-to-br from-primary/20 via-violet-500/10 to-background flex flex-col items-center justify-center p-8 text-center" : "bg-muted"
        )}
        onClick={() => navigate(`/project/${project.id}`)}
      >
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
          <>
            <div className="absolute top-3 left-3">
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">
                {project.stage}
              </span>
            </div>
            <h3 className="text-2xl font-black text-foreground leading-tight tracking-tight max-w-[80%]">
              {project.title}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-muted-foreground">
              <User size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">By {project.creator.name}</span>
            </div>
          </>
        )}
      </div>

      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {project.skills.map((skill: string) => <SkillBadge key={skill} skill={skill} />)}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between border-t border-border/50 mt-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => toggleLike(project.id)}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              project.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
            )}
          >
            <Heart size={20} fill={project.isLiked ? "currentColor" : "none"} />
            <span className="text-xs font-bold">{project.likes}</span>
          </button>
          
          <Drawer>
            <DrawerTrigger asChild>
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle size={20} />
                <span className="text-xs font-bold">{project.comments.length}</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="bg-background border-border h-[80vh]">
              <DrawerHeader className="border-b border-border">
                <DrawerTitle>Comments</DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {project.comments.map((c: any) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user}`} />
                      <AvatarFallback>{c.user[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-accent/30 p-3 rounded-2xl">
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="text-xs font-bold">{c.user}</h5>
                        <span className="text-[10px] text-muted-foreground">{c.time}</span>
                      </div>
                      <p className="text-sm">{c.text}</p>
                    </div>
                  </div>
                ))}
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
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Share2 size={20} />
        </button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;