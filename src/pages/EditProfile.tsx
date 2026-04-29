"use client";

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApp } from '@/context/AppContext';
import { toast } from "sonner";
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const EditProfile = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    title: currentUser?.title || '',
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
        title: formData.title,
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
      toast.error(error.message);
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

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl h-12" />
          </div>
          <div className="space-y-1.5">
            <Label>Professional Title</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="rounded-xl h-12" />
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
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </MobileLayout>
  );
};

export default EditProfile;