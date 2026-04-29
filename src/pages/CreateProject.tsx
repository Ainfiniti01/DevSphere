"use client";

import React, { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Plus, X, Rocket, Target, Lightbulb } from 'lucide-react';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

const CreateProject = () => {
  const navigate = useNavigate();
  const { setProjects, currentUser } = useApp();
  
  const [formData, setFormData] = useState({
    title: '',
    problem: '',
    solution: '',
    description: '',
    skills: '',
    stage: 'Idea'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error("Please sign in to create a project");
      navigate('/auth');
      return;
    }

    const newProject = {
      id: 'p' + Date.now(),
      title: formData.title,
      problem: formData.problem,
      solution: formData.solution,
      description: formData.description,
      stage: formData.stage,
      skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ""),
      creator: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: currentUser.title
      },
      thumbnail: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&q=80&w=800`,
      members: [],
      timestamp: new Date().toISOString()
    };

    setProjects(prev => [newProject, ...prev]);
    toast.success("Project published successfully!");
    navigate('/');
  };

  return (
    <MobileLayout title="New Project">
      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-bold">Project Title</Label>
          <Input 
            placeholder="e.g. EcoTrack AI" 
            className="h-12 rounded-xl bg-accent/20" 
            required 
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold">The Problem</Label>
          <Textarea 
            placeholder="What challenge are you solving?" 
            className="min-h-[80px] rounded-xl bg-accent/20" 
            required 
            value={formData.problem}
            onChange={e => setFormData({...formData, problem: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold">Proposed Solution</Label>
          <Textarea 
            placeholder="How does your project solve it?" 
            className="min-h-[80px] rounded-xl bg-accent/20" 
            required 
            value={formData.solution}
            onChange={e => setFormData({...formData, solution: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold">Project Description</Label>
          <Textarea 
            placeholder="Detailed overview of your vision..." 
            className="min-h-[120px] rounded-xl bg-accent/20" 
            required 
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-bold">Project Stage</Label>
            <Select value={formData.stage} onValueChange={val => setFormData({...formData, stage: val})}>
              <SelectTrigger className="h-12 rounded-xl bg-accent/20">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="Idea">Idea</SelectItem>
                <SelectItem value="MVP">MVP</SelectItem>
                <SelectItem value="Building">Building</SelectItem>
                <SelectItem value="Scaling">Scaling</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-bold">Required Skills</Label>
            <Input 
              placeholder="React, Node, UI..." 
              className="h-12 rounded-xl bg-accent/20" 
              required 
              value={formData.skills}
              onChange={e => setFormData({...formData, skills: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold">Video Pitch (Optional)</Label>
          <div className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center bg-accent/10 hover:bg-accent/20 transition-colors cursor-pointer">
            <Video className="text-muted-foreground mb-2" size={28} />
            <p className="text-xs font-bold text-muted-foreground">Upload 60s pitch</p>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20">
            Launch Project
          </Button>
        </div>
      </form>
    </MobileLayout>
  );
};

export default CreateProject;