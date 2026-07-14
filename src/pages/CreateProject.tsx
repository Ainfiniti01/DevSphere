"use client";

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Rocket, Target, Lightbulb, Image as ImageIcon, Loader2, AlertCircle, Link as LinkIcon, Upload, Lock, FileText, Sparkles } from 'lucide-react';
import { toast } from "sonner";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { cn } from "@/lib/utils";

const CreateProject = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { projects, refreshProjects, currentUser, refreshNotifications } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(!!editId);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    problem: '',
    solution: '',
    description: '',
    skills: '',
    stage: 'Idea',
    thumbnail: '',
    projectUrl: '',
    documentation: '',
    documentation_filename: ''
  });

  // Limits check for new projects
  const userProjects = projects.filter(p => p.creator_id === currentUser?.id);
  const activeProjects = userProjects.filter(p => p.status === 'ACTIVE');
  
  // Premium/Admin Bypass
  const isPremium = currentUser?.is_premium_override || currentUser?.is_admin;
  const isAtTotalLimit = !isPremium && userProjects.length >= 5 && !editId;
  const isAtActiveLimit = !isPremium && activeProjects.length >= 3 && !editId;

  const canEditTitle = !editId || currentUser?.is_admin || currentUser?.name === 'Abdulazeez Adam.A';

  // Draft Persistence Key
  const draftKey = `devsphere_draft_project_${editId || 'new'}`;

  // Load project data or restore draft
  useEffect(() => {
    const loadProjectData = async () => {
      if (!editId || !supabase) {
        // Check for new project draft
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          try {
            setFormData(JSON.parse(savedDraft));
            toast.success("Restored draft from auto-save", {
              action: {
                label: "Discard",
                onClick: () => {
                  localStorage.removeItem(draftKey);
                  setFormData({
                    title: '',
                    problem: '',
                    solution: '',
                    description: '',
                    skills: '',
                    stage: 'Idea',
                    thumbnail: '',
                    projectUrl: '',
                    documentation: '',
                    documentation_filename: ''
                  });
                }
              }
            });
          } catch (e) {}
        }
        return;
      }

      setIsFetching(true);
      try {
        let projectToEdit = projects.find(p => p.id === editId);

        if (!projectToEdit) {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', editId)
            .single();
          
          if (error) throw error;
          projectToEdit = {
            ...data,
            skills: data.skills_required || [],
            thumbnail: data.thumbnail_url
          };
        }

        if (projectToEdit) {
          if (projectToEdit.creator_id !== currentUser?.id) {
            toast.error("You don't have permission to edit this project.");
            navigate('/');
            return;
          }

          // Check for edit draft first
          const savedDraft = localStorage.getItem(draftKey);
          if (savedDraft) {
            try {
              setFormData(JSON.parse(savedDraft));
              toast.success("Restored unsaved changes from auto-save", {
                action: {
                  label: "Discard",
                  onClick: () => {
                    localStorage.removeItem(draftKey);
                    setFormData({
                      title: projectToEdit.title,
                      problem: projectToEdit.problem || '',
                      solution: projectToEdit.solution || '',
                      description: projectToEdit.description || '',
                      skills: projectToEdit.skills?.join(', ') || '',
                      stage: projectToEdit.stage || 'Idea',
                      thumbnail: projectToEdit.thumbnail || '',
                      projectUrl: projectToEdit.project_url || '',
                      documentation: projectToEdit.documentation || '',
                      documentation_filename: projectToEdit.documentation_filename || ''
                    });
                  }
                }
              });
              setIsFetching(false);
              return;
            } catch (e) {}
          }

          setFormData({
            title: projectToEdit.title,
            problem: projectToEdit.problem || '',
            solution: projectToEdit.solution || '',
            description: projectToEdit.description || '',
            skills: projectToEdit.skills?.join(', ') || '',
            stage: projectToEdit.stage || 'Idea',
            thumbnail: projectToEdit.thumbnail || '',
            projectUrl: projectToEdit.project_url || '',
            documentation: projectToEdit.documentation || '',
            documentation_filename: projectToEdit.documentation_filename || ''
          });
        }
      } catch (err: any) {
        console.error("Error loading project:", err);
        toast.error("Failed to load project data.");
        navigate('/');
      } finally {
        setIsFetching(false);
      }
    };

    loadProjectData();
  }, [editId, projects, currentUser?.id, navigate]);

  // Auto-save draft on change
  useEffect(() => {
    if (isFetching) return;
    
    // Only save if there is actual content
    const hasContent = Object.values(formData).some(val => val !== '' && val !== 'Idea');
    if (hasContent) {
      localStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, draftKey, isFetching]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasContent = Object.values(formData).some(val => val !== '' && val !== 'Idea');
      if (hasContent) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData]);

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

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['md', 'txt', 'pdf'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      toast.error("Only Markdown (.md), Text (.txt), or PDF (.pdf) files are allowed");
      return;
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      
      // Enforce freemium limits
      const charLimit = isPremium ? 100000 : 5000;
      if (text.length > charLimit) {
        toast.error(`File is too large. Free tier limit is 5,000 characters. Upgrade to Pro for up to 100,000 characters!`);
        return;
      }

      setFormData(prev => ({
        ...prev,
        documentation: text,
        documentation_filename: file.name
      }));
      toast.success(`Loaded documentation from ${file.name}!`);
    };
    reader.readAsText(file);
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, thumbnail: '' }));
    if (imageInputRef.current) imageInputRef.current.value = '';
    toast.info("Image removed");
  };

  const removeDoc = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, documentation: '', documentation_filename: '' }));
    if (docInputRef.current) docInputRef.current.value = '';
    toast.info("Documentation removed");
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
      problem: formData.problem,
      solution: formData.solution,
      description: formData.description,
      stage: formData.stage,
      skills_required: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ""),
      project_url: formData.projectUrl,
      thumbnail_url: formData.thumbnail,
      documentation: formData.documentation,
      documentation_filename: formData.documentation_filename
    };

    if (canEditTitle) {
      projectData.title = formData.title;
    }

    try {
      let result;
      if (editId) {
        result = await supabase.from('projects').update(projectData).eq('id', editId).select().single();
      } else {
        projectData.title = formData.title;
        projectData.creator_id = currentUser.id;
        projectData.status = isAtActiveLimit ? 'PAUSED' : 'ACTIVE';
        result = await supabase.from('projects').insert(projectData).select().single();
      }

      if (result.error) throw result.error;

      await supabase.from('notifications').insert({
        user_id: currentUser.id,
        actor_id: currentUser.id,
        type: editId ? 'system' : 'resume',
        content: editId ? `Updated project: ${formData.title}` : `Launched new project: ${formData.title}`,
        project_id: result.data.id
      });

      // Clear draft on successful submit
      localStorage.removeItem(draftKey);

      toast.success(editId ? "Project updated!" : "Project published!");
      await refreshProjects();
      await refreshNotifications();
      navigate(`/project/${result.data.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title={editId ? "Edit Project" : "New Project"} showBack>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-24">
        {isAtTotalLimit && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex gap-3 text-destructive text-sm">
            <AlertCircle className="shrink-0" size={20} />
            <p>You've reached your limit of 5 projects. Please delete an old project to create a new one.</p>
          </div>
        )}

        <input 
          type="file" 
          ref={imageInputRef} 
          className="hidden" 
          accept="image/jpeg,image/png,image/webp" 
          onChange={handleImageUpload} 
        />

        <input 
          type="file" 
          ref={docInputRef} 
          className="hidden" 
          accept=".md,.txt" 
          onChange={handleDocUpload} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold flex items-center gap-2">
                  <Rocket size={16} className="text-primary" /> Project Title
                </Label>
                {editId && !canEditTitle && (
                  <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                    <Lock size={10} /> Permanent
                  </span>
                )}
              </div>
              <div className="relative">
                <Input 
                  placeholder="e.g. EcoTrack AI" 
                  className={cn(
                    "h-12 rounded-xl bg-accent/20 border-border",
                    !canEditTitle && "bg-muted/50 text-muted-foreground cursor-not-allowed pr-10"
                  )} 
                  required 
                  value={formData.title}
                  onChange={e => canEditTitle && setFormData({...formData, title: e.target.value})}
                  disabled={isAtTotalLimit || !canEditTitle}
                />
                {editId && !canEditTitle && (
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold flex items-center gap-2">
                <Target size={16} className="text-primary" /> The Problem
              </Label>
              <Textarea 
                placeholder="What challenge are you solving?" 
                className="min-h-[100px] rounded-xl bg-accent/20 border-border" 
                required 
                value={formData.problem}
                onChange={e => setFormData({...formData, problem: e.target.value})}
                disabled={isAtTotalLimit}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold flex items-center gap-2">
                <Lightbulb size={16} className="text-primary" /> Proposed Solution
              </Label>
              <Textarea 
                placeholder="How does your project solve it?" 
                className="min-h-[100px] rounded-xl bg-accent/20 border-border" 
                required 
                value={formData.solution}
                onChange={e => setFormData({...formData, solution: e.target.value})}
                disabled={isAtTotalLimit}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold">Project Description</Label>
              <Textarea 
                placeholder="Detailed overview of your vision..." 
                className="min-h-[150px] rounded-xl bg-accent/20 border-border" 
                required 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                disabled={isAtTotalLimit}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold">Project Stage</Label>
                <Select 
                  value={formData.stage} 
                  onValueChange={val => setFormData({...formData, stage: val})}
                  disabled={isAtTotalLimit}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-accent/20 border-border">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border rounded-xl">
                    <SelectItem value="Idea">Idea</SelectItem>
                    <SelectItem value="Building">Building</SelectItem>
                    <SelectItem value="MVP">MVP</SelectItem>
                    <SelectItem value="Scaling">Scaling</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Required Skills</Label>
                <Input 
                  placeholder="React, Node..." 
                  className="h-12 rounded-xl bg-accent/20 border-border" 
                  required 
                  value={formData.skills}
                  onChange={e => setFormData({...formData, skills: e.target.value})}
                  disabled={isAtTotalLimit}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold flex items-center gap-2">
                <LinkIcon size={16} className="text-primary" /> Project URL (Optional)
              </Label>
              <Input 
                placeholder="https://github.com/..." 
                className="h-12 rounded-xl bg-accent/20 border-border" 
                value={formData.projectUrl}
                onChange={e => setFormData({...formData, projectUrl: e.target.value})}
                disabled={isAtTotalLimit}
              />
            </div>
          </div>
        </div>

        {/* Project Documentation Section */}
        <div className="space-y-4 bg-card border border-border p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-bold flex items-center gap-2">
                <FileText size={16} className="text-primary" /> Project Documentation (Optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                This documentation is used by the AI Project Manager to better understand your project.
              </p>
            </div>
            {formData.documentation && (
              <button 
                type="button" 
                onClick={removeDoc}
                className="text-xs font-bold text-destructive flex items-center gap-1 hover:underline"
              >
                <X size={14} /> Remove Doc
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="rounded-xl h-12 gap-2 border-primary/20 hover:bg-primary/5"
                onClick={() => docInputRef.current?.click()}
              >
                <Upload size={16} /> Upload .md / .txt
              </Button>
              {formData.documentation_filename && (
                <div className="flex items-center gap-2 px-3 bg-primary/10 text-primary text-xs font-bold rounded-xl border border-primary/20">
                  <FileText size={14} /> {formData.documentation_filename}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-muted-foreground">Or paste documentation directly below:</Label>
                <span className={cn(
                  "text-[10px] font-bold",
                  formData.documentation.length > (isPremium ? 100000 : 5000) ? "text-destructive" : "text-muted-foreground"
                )}>
                  {formData.documentation.length} / {isPremium ? "100,000" : "5,000"} chars
                  {!isPremium && " (Free Limit)"}
                </span>
              </div>
              <Textarea 
                placeholder="# Architecture Roadmap&#10;Describe your folder structure, database schema, API endpoints, or sprint plans here..." 
                className="min-h-[200px] rounded-xl bg-accent/20 border-border font-mono text-xs leading-relaxed" 
                value={formData.documentation}
                onChange={e => {
                  const text = e.target.value;
                  const limit = isPremium ? 100000 : 5000;
                  if (text.length <= limit) {
                    setFormData({...formData, documentation: text});
                  } else {
                    toast.error(`Character limit reached. Upgrade to Pro for up to 100,000 characters!`);
                  }
                }}
                disabled={isAtTotalLimit}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-bold flex items-center gap-2">
              <ImageIcon size={16} className="text-primary" /> Media (Optional)
            </Label>
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
                {uploading ? (
                  <Loader2 className="animate-spin text-primary" size={32} />
                ) : (
                  <ImageIcon className="text-muted-foreground" size={32} />
                )}
                <p className="text-xs font-bold text-muted-foreground">Upload Project Image</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={loading || uploading || isAtTotalLimit} 
            className="w-full h-14 bg-primary text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
          >
            {loading ? (
              <><Loader2 className="animate-spin mr-2" /> Processing...</>
            ) : (
              editId ? "Update Project" : "Launch Project"
            )}
          </Button>
          
          {isAtActiveLimit && !editId && (
            <p className="text-[10px] text-center text-amber-500 font-bold mt-3 uppercase tracking-widest">
              Note: This project will be created as PAUSED (Limit: 3 active)
            </p>
          )}
        </div>
      </form>
    </AppLayout>
  );
};

export default CreateProject;