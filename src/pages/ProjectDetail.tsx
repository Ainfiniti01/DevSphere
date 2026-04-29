"use client";

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { useApp } from '@/context/AppContext';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SkillBadge from '@/components/SkillBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft, PlayCircle, Info, MessageSquare, Edit, Users, Share2, Bookmark } from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, currentUser, requests, setRequests } = useApp();
  const project = projects.find(p => p.id === id);
  
  const [joinReason, setJoinReason] = useState('');
  const [joinSkills, setJoinSkills] = useState('');

  if (!project) return <div>Project not found</div>;

  const isOwner = currentUser?.id === project.creator.id;
  const hasRequested = requests.some(r => r.projectId === project.id && r.userId === currentUser?.id);
  const isMember = project.members?.includes(currentUser?.id);

  const handleJoin = () => {
    const newRequest = {
      id: 'r' + Date.now(),
      projectId: project.id,
      userId: currentUser.id,
      reason: joinReason,
      skills: joinSkills,
      status: 'pending'
    };
    setRequests([...requests, newRequest]);
    toast.success("Application sent to founder!");
  };

  return (
    <MobileLayout title="Project Details">
      <div className="relative bg-background text-foreground">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 p-2 bg-black/20 backdrop-blur-md rounded-full text-white">
          <ChevronLeft size={24} />
        </button>
        
        <div className="aspect-video relative">
          <img src={project.thumbnail} className="w-full h-full object-cover" alt={project.title} />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <PlayCircle size={64} className="text-white/80" />
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider mb-2 inline-block">
                {project.stage}
              </span>
              <h2 className="text-2xl font-bold">{project.title}</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="rounded-xl"><Bookmark size={18} /></Button>
              <Button variant="outline" size="icon" className="rounded-xl"><Share2 size={18} /></Button>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-2xl border border-border">
            <Avatar className="h-10 w-10">
              <AvatarImage src={project.creator.avatar} />
              <AvatarFallback>{project.creator.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="text-sm font-bold">{project.creator.name}</h4>
              <p className="text-xs text-muted-foreground">{project.creator.role}</p>
            </div>
            {!isOwner && (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate(`/chat/${project.creator.id}`)}>
                Message
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <section>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Info size={14} /> The Problem
              </h3>
              <p className="text-foreground text-sm leading-relaxed">{project.problem}</p>
            </section>

            <section>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <PlayCircle size={14} /> The Solution
              </h3>
              <p className="text-foreground text-sm leading-relaxed">{project.solution}</p>
            </section>

            <section>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {project.skills.map(skill => <SkillBadge key={skill} skill={skill} />)}
              </div>
            </section>
          </div>

          <div className="pt-4">
            {isOwner ? (
              <div className="grid grid-cols-2 gap-3">
                <Button className="h-12 rounded-xl gap-2"><Edit size={18} /> Edit Project</Button>
                <Button variant="outline" className="h-12 rounded-xl gap-2" onClick={() => navigate('/notifications')}><Users size={18} /> View Requests</Button>
              </div>
            ) : isMember ? (
              <Button className="w-full h-14 bg-primary text-lg font-bold rounded-2xl gap-2" onClick={() => navigate('/messages')}>
                <MessageSquare size={20} /> Open Group Chat
              </Button>
            ) : hasRequested ? (
              <Button disabled className="w-full h-14 text-lg font-bold rounded-2xl">Application Pending</Button>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full h-14 bg-primary text-lg font-bold rounded-2xl">Join Project</Button>
                </DialogTrigger>
                <DialogContent className="bg-background border-border max-w-[90vw] rounded-3xl">
                  <DialogHeader><DialogTitle>Apply to Join</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Why do you want to join?</Label>
                      <Textarea placeholder="Your motivation..." className="rounded-xl" value={joinReason} onChange={e => setJoinReason(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>What skills do you bring?</Label>
                      <Input placeholder="e.g. React, UI Design..." className="h-12 rounded-xl" value={joinSkills} onChange={e => setJoinSkills(e.target.value)} />
                    </div>
                    <Button onClick={handleJoin} className="w-full h-12 rounded-xl font-bold">Submit Application</Button>
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