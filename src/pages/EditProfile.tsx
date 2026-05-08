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
import { Camera, Loader2, AtSign, MapPin, Link as LinkIcon, User, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const EditProfile = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, refreshNotifications } = useApp();
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

      // Create Notification
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
    <MobileLayout title="Edit Profile" showBack>
      <div className="px-6 py-6 space-y-8 pb-24">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
              <AvatarImage src={formData.avatar_url} />
              <AvatarFallback><User size={40} /></AvatarFallback>
            </Avatar>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" size={24} />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Change Photo</p>
        </div>

        <div className="space-y-6">
          {/* Identity Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Identity</h3>
            <div className="space-y-4 bg-card p-4 rounded-2xl border border-border">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="rounded-xl h-12 bg-accent/10" 
                  placeholder="John Doe" 
                />
              </div>
              <div className="space-y-1.5">
                <Label>Display Name (Public)</Label>
                <Input 
                  value={formData.display_name} 
                  onChange={e => setFormData({...formData, display_name: e.target.value})} 
                  className="rounded-xl h-12 bg-accent/10" 
                  placeholder="John D." 
                />
              </div>
              <div className="space-y-1.5">
                <Label>Username</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                    className="rounded-xl h-12 bg-accent/10 pl-10" 
                    placeholder="johndoe" 
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Professional Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Professional</h3>
            <div className="space-y-4 bg-card p-4 rounded-2xl border border-border">
              <div className="space-y-1.5">
                <Label>Professional Title</Label>
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="rounded-xl h-12 bg-accent/10" 
                  placeholder="Senior Fullstack Developer"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Skills (comma separated)</Label>
                <Input 
                  value={formData.skills} 
                  onChange={e => setFormData({...formData, skills: e.target.value})} 
                  className="rounded-xl h-12 bg-accent/10" 
                  placeholder="React, Node.js, TypeScript"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Textarea 
                  value={formData.bio} 
                  onChange={e => setFormData({...formData, bio: e.target.value})} 
                  className="rounded-xl min-h-[100px] bg-accent/10" 
                  placeholder="Tell us about your journey..." 
                />
              </div>
            </div>
          </section>

          {/* Links & Location Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Links & Location</h3>
            <div className="space-y-4 bg-card p-4 rounded-2xl border border-border">
              <div className="space-y-1.5">
                <Label>Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})} 
                    className="rounded-xl h-12 bg-accent/10 pl-10" 
                    placeholder="San Francisco, CA"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Portfolio URL</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    value={formData.portfolio_url} 
                    onChange={e => setFormData({...formData, portfolio_url: e.target.value})} 
                    className="rounded-xl h-12 bg-accent/10 pl-10" 
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-background/80 backdrop-blur-md border-t border-border z-50">
          <Button 
            onClick={handleSave} 
            disabled={loading || uploading} 
            className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Save Changes"}
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default EditProfile;