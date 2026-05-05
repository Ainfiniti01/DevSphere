"use client";

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from '@/context/AppContext';
import { toast } from "sonner";
import { Camera, Loader2, AtSign } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const EditProfile = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    display_name: currentUser?.display_name || '',
    username: currentUser?.username || '',
    title: currentUser?.title || '',
    bio: currentUser?.bio || '',
    skills: currentUser?.skills?.join(', ') || '',
    location: currentUser?.location || '',
    portfolio_url: currentUser?.portfolio_url || '',
    avatar_url: currentUser?.avatar_url || ''
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !currentUser) return;

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
      toast.success("Avatar uploaded!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase || !currentUser) return;
    setLoading(true);

    try {
      const updates = {
        id: currentUser.id,
        name: formData.name,
        display_name: formData.display_name,
        username: formData.username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        title: formData.title,
        bio: formData.bio,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s !== ""),
        location: formData.location,
        portfolio_url: formData.portfolio_url,
        avatar_url: formData.avatar_url,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      setCurrentUser({ ...currentUser, ...updates });
      toast.success("Profile updated successfully!");
      navigate('/profile');
    } catch (error: any) {
      if (error.message.includes('unique constraint')) {
        toast.error("Username is already taken");
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout title="Edit Profile" showBack>
      <div className="px-6 py-6 space-y-8">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
        
        <div className="flex flex-col items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarImage src={formData.avatar_url} />
              <AvatarFallback>{formData.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" size={24} />}
            </div>
          </div>
          <p className="text-xs font-bold text-primary">Tap to change avatar</p>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label>Username</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value})} 
                className="rounded-xl h-12 pl-10" 
                placeholder="johndoe"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Display Name (Public)</Label>
            <Input value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} className="rounded-xl h-12" placeholder="John D." />
          </div>
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl h-12" />
          </div>
          <div className="space-y-1.5">
            <Label>Professional Title</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="rounded-xl h-12" />
          </div>
          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="rounded-xl min-h-[100px]" placeholder="Tell us about yourself..." />
          </div>
          <div className="space-y-1.5">
            <Label>Skills (comma separated)</Label>
            <Input value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} className="rounded-xl h-12" />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="rounded-xl h-12" />
          </div>
          <div className="space-y-1.5">
            <Label>Portfolio URL</Label>
            <Input value={formData.portfolio_url} onChange={e => setFormData({...formData, portfolio_url: e.target.value})} className="rounded-xl h-12" />
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading || uploading} className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg">
          {loading ? <Loader2 className="animate-spin mr-2" /> : "Save Changes"}
        </Button>
      </div>
    </MobileLayout>
  );
};

export default EditProfile;