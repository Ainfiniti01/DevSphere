"use client";

import React, { useState, useEffect, useRef } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Rocket, Target, Lightbulb, Image as ImageIcon, Loader2, AlertCircle, Link as LinkIcon, Upload } from 'lucide-react';
import { toast } from "sonner";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

const CreateProject = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { projects, refreshProjects, currentUser, refreshNotifications } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    problem: '',
    solution: '',
    description: '',
    skills: '',
    stage: 'Idea',
    thumbnail: '',
    projectUrl: ''
  });

  const userProjects = projects.filter(p => p.creator_id === currentUser?.id);
  const activeProjects = userProjects.filter(p => p.status === 'ACTIVE');
  const isAtTotalLimit = userProjects.length >= 5 && !editId;
  const isAtActiveLimit = activeProjects.length >= 3 && !editId;

  useEffect(() => {
    if (editId) {
      const projectToEdit = projects.find(p => p.id === editId);
      if (projectToEdit) {
        setFormData({
          title: projectToEdit.title,
          problem: projectToEdit.problem,
          solution: projectToEdit.solution,
          description: projectToEdit.description,
          skills: projectToEdit.skills.join(', '),
          stage: projectToEdit.stage,
          thumbnail: projectToEdit.thumbnail || '',
          projectUrl: projectToEdit.project_url || ''
        });
      }
    }
  }, [editId, projects]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !currentUser) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only images (.jpg, .png, .webp) are allowed");
      return;
    }

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
    const filePath = `project-media/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('project-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-media')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, thumbnail: publicUrl }));
      toast.success("Project image uploaded!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, thumbnail: '' }));
    if (imageInputRef.current) imageInputRef.current.value = '';
    toast.info("Image removed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !supabase) {
      toast.error("Please sign in to continue");
      return;
    }

    if (isAtTotalLimit) {
      toast.error("You've reached your limit of 5 projects.");
      return;
    }

    setLoading(true);
    
    const projectData: any = {
      stage: formData.stage,
      skills_required: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ""),
      description: formData.description,
      project_url: formData.projectUrl,
      thumbnail_url: formData.thumbnail,
    };

    if (!editId) {
      projectData.title = formData.title;
      projectData.problem = formData.problem;
      projectData.solution = formData.solution;
      projectData.creator_id = currentUser.id;
      projectData.status = isAtActiveLimit ? 'PAUSED' : 'ACTIVE';
    }

    try {
      let result;
      if (editId) {
        result = await supabase.from('projects').update(projectData).eq('id', editId).select().single();
      } else {
        result = await supabase.from('projects').insert(projectData).select().single();
      }

      if (result.error) throw result.error;

      // Create Notification
      await supabase.from('notifications').insert({
        user_id: currentUser.id,
        actor_id: currentUser.id,
        type: editId ? 'system' : 'resume',
        content: editId ? `Updated project: ${formData.title}` : `Launched new project: ${formData.title}`,
        project_id: result.data.id
      });

      toast.success(editId ? "Project updated!" : "Project published!");
      await refreshProjects();
      await refreshNotifications();
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout title={editId ? "Edit Project" : "New Project"} showBack>
      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        {isAtTotalLimit && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex gap-3 text-destructive text-sm">
            <AlertCircle className="shrink-0" size={20} />
            <p>You've reached your limit of 5 projects.</p>
          </div>
        )}

        <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

        <div className="space-y-2">
          <Label className="text-sm font-bold">Project Title</Label>
          <Input 
            placeholder="e.g. EcoTrack AI" 
            className="h-12 rounded-xl bg-accent/20" 
            required 
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            disabled={isAtTotalLimit || !!editId}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold">Project Description</Label>
          <Textarea 
            placeholder="Detailed overview..." 
            className="min-h-[120px] rounded-xl bg-accent/20" 
            required 
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            disabled={isAtTotalLimit}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-bold">Project Image (Optional)</Label>
            {formData.thumbnail && (
              <button 
                type="button" 
                onClick={removeImage}
                className="text-xs font-bold text-destructive flex items-center gap-1 hover:underline"
              >
                <X size={14} /> Remove Image
              </button>
            )}
          </div>
          <div 
            onClick={() => !isAtTotalLimit && imageInputRef.current?.click()}
            className={`relative aspect-video border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-accent/10 hover:bg-accent/20 transition-all cursor-pointer overflow-hidden ${formData.thumbnail ? 'border-primary' : 'border-border'}`}
          >
            {formData.thumbnail ? (
              <>
                <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Upload className="text-white" size={32} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {uploading ? <Loader2 className="animate-spin text-primary" size={32} /> : <ImageIcon className="text-muted-foreground" size={32} />}
                <p className="text-xs font-bold text-muted-foreground">Upload Project Image</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={loading || uploading || isAtTotalLimit} className="w-full h-14 bg-primary text-lg font-bold rounded-2xl shadow-lg">
            {loading ? "Processing..." : (editId ? "Update Project" : "Launch Project")}
          </Button>
        </div>
      </form>
    </MobileLayout>
  );
};

export default CreateProject;