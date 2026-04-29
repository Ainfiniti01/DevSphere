"use client";

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { MOCK_PROJECTS } from '@/data/mockData';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SkillBadge from '@/components/SkillBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft, PlayCircle, Users, MessageSquare, Info } from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = MOCK_PROJECTS.find(p => p.id === id) || MOCK_PROJECTS[0];
  const [joinReason, setJoinReason] = useState('');
  const [joinSkills, setJoinSkills] = useState('');

  const handleJoin = () => {
    toast.success("Join request sent! A chat has been created.");
    navigate('/messages');
  };

  return (
    <MobileLayout title="Project Details">
      <div className="relative">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 p-2 bg-black/20 backdrop-blur-md rounded-full text-white"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="aspect-video relative">
          <img src={project.thumbnail} className="w-full h-full object-cover" alt={project.title} />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <PlayCircle size={64} className="text-white/80" />
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                {project.stage}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">{project.title}</h2>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
            <Avatar className="h-10 w-10">
              <AvatarImage src={project.creator.avatar} />
              <AvatarFallback>{project.creator.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">{project.creator.name}</h4>
              <p className="text-xs text-slate-500">{project.creator.role}</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl border-slate-700 text-slate-300">
              Profile
            </Button>
          </div>

          <div className="space-y-4">
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Info size={14} /> The Problem
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">{project.problem}</p>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <PlayCircle size={14} /> The Solution
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">{project.solution}</p>
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {project.skills.map(skill => <SkillBadge key={skill} skill={skill} />)}
              </div>
            </section>
          </div>

          <div className="pt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg font-bold rounded-2xl shadow-lg shadow-indigo-900/20">
                  Join Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0f172a] border-slate-800 text-white max-w-[90vw] rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Apply to Join</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Why do you want to join?</Label>
                    <Textarea 
                      placeholder="Tell the founder about your interest..." 
                      className="bg-slate-900 border-slate-800 rounded-xl"
                      value={joinReason}
                      onChange={(e) => setJoinReason(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>What skills do you bring?</Label>
                    <Input 
                      placeholder="e.g. React, UI Design..." 
                      className="bg-slate-900 border-slate-800 h-12 rounded-xl"
                      value={joinSkills}
                      onChange={(e) => setJoinSkills(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleJoin} className="w-full h-12 bg-indigo-600 rounded-xl font-bold">
                    Submit Application
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default ProjectDetail;