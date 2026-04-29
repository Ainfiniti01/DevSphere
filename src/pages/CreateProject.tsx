"use client";

import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Video, Plus, X } from 'lucide-react';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

const CreateProject = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Project submitted for review!");
    navigate('/');
  };

  return (
    <MobileLayout title="New Project">
      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        <div className="space-y-2">
          <Label>Project Title</Label>
          <Input placeholder="e.g. EcoTrack AI" className="h-12 rounded-xl" required />
        </div>

        <div className="space-y-2">
          <Label>The Problem</Label>
          <Textarea placeholder="What challenge are you solving?" className="min-h-[100px] rounded-xl" required />
        </div>

        <div className="space-y-2">
          <Label>Video Pitch (Optional)</Label>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
            <Video className="text-slate-400 mb-2" size={32} />
            <p className="text-sm font-medium text-slate-600">Upload 60s pitch</p>
            <p className="text-[10px] text-slate-400 mt-1">MP4, MOV up to 50MB</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Required Skills</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {['React', 'Node.js'].map(skill => (
              <span key={skill} className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">
                {skill} <X size={12} className="cursor-pointer" />
              </span>
            ))}
            <button type="button" className="p-1 bg-slate-100 rounded-full text-slate-500"><Plus size={14} /></button>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg font-bold rounded-2xl shadow-lg shadow-indigo-100">
            Launch Project
          </Button>
        </div>
      </form>
    </MobileLayout>
  );
};

export default CreateProject;