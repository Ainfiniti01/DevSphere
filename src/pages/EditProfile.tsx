"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from '@/context/AppContext';
import { toast } from "sonner";
import { Camera, Loader2, MapPin, Link as LinkIcon, User, Github, Linkedin, Twitter } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const EditProfile = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, refreshNotifications } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [formData, setFormData] = useState({
    title: currentUser?.title || '',
    bio: currentUser?.bio || '',
    skills: currentUser?.skills?.join(', ') || '',
    location: currentUser?.location || '',
    portfolio_url: currentUser?.portfolio_url || '',
    avatar_url: currentUser?.avatar_url || '',
    github_url: currentUser?.github_url || '',
    linkedin_url: currentUser?.linkedin_url || '',
    twitter_url: currentUser?.twitter_url || ''
  });

  useEffect(() => {
    if (currentUser?.name) {
      const parts = currentUser.name.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
  }, [currentUser]);

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
    const filePath = `avatars/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Profile picture updated!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase || !currentUser) return;
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    setLoading(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const updates = {
        id: currentUser.id,
        name: fullName,
        title: formData.title,
        bio: formData.bio,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ""),
        location: formData.location,
        portfolio_url: formData.portfolio_url,
        avatar_url: formData.avatar_url,
        github_url: formData.github_url,
        linkedin_url: formData.linkedin_url,
        twitter_url: formData.twitter_url,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: currentUser.id,
        actor_id: currentUser.id,
        type: 'system',
        content: 'Your profile has been updated successfully.'
      });

      setCurrentUser({ ...currentUser, ...updates });
      toast.success("Profile updated successfully!");
      await refreshNotifications();
      navigate('/profile');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Edit Profile" showBack>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-40">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={formData.avatar_url} />
              <AvatarFallback><User size={48} /></AvatarFallback>
            </Avatar>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" size={24} />}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Change Photo</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Identity</h3>
              <div className="space-y-4 bg-card p-4 rounded-2xl border border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>First Name</Label>
                    <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="rounded-xl h-12 bg-accent/10" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last Name</Label>
                    <Input value={lastName} onChange={e => setLastName(e.target.value)} className="rounded-xl h-12 bg-accent/10" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Professional Title</Label>
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="rounded-xl h-12 bg-accent/10" />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Professional</h3>
              <div className="space-y-4 bg-card p-4 rounded-2xl border border-border">
                <div className="space-y-1.5">
                  <Label>Skills (comma separated)</Label>
                  <Input value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} className="rounded-xl h-12 bg-accent/10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Bio</Label>
                  <Textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="rounded-xl min-h-[120px] bg-accent/10" />
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Links & Location</h3>
              <div className="space-y-4 bg-card p-4 rounded-2xl border border-border">
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="rounded-xl h-12 bg-accent/10 pl-10" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Portfolio URL</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input value={formData.portfolio_url} onChange={e => setFormData({...formData, portfolio_url: e.target.value})} className="rounded-xl h-12 bg-accent/10 pl-10" />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Social Profiles</h3>
              <div className="space-y-4 bg-card p-4 rounded-2xl border border-border">
                <div className="space-y-1.5">
                  <Label>GitHub URL</Label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input value={formData.github_url} onChange={e => setFormData({...formData, github_url: e.target.value})} className="rounded-xl h-12 bg-accent/10 pl-10" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>LinkedIn URL</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} className="rounded-xl h-12 bg-accent/10 pl-10" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Twitter URL</Label>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input value={formData.twitter_url} onChange={e => setFormData({...formData, twitter_url: e.target.value})} className="rounded-xl h-12 bg-accent/10 pl-10" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <Button onClick={handleSave} disabled={loading || uploading} className="w-full max-w-md h-14 text-lg font-bold rounded-2xl shadow-lg">
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Save Changes"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default EditProfile;